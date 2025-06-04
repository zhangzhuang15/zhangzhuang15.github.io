---
title: "Tauri"
page: true
aside: true
---

# Tauri
Tauri is toolkit helping you develop cross-platform desktop GUI app. We'll talk about how Tauri does cross-platform work.

## Window
There're two questions Tauri has to answer:
1. how to build window
2. how to build page inside window

In this chapter, we talk about first question, in next chapter, we talk about the latter.

Keep in mind that if we want to build a window, we have to depend on capbilities of operating system. On macOS, when you develop an app, you normally use `swiftUI` or other frameworks like that. These frameworks are developed by `Objective-C` or `Swift`. But there're ways to leverage frameworks with other languages, like `Rust` which Tauri uses. To reach it, we should take 2 steps:
1. use `Rust bingdings` for `Objective-C` or `Swift`, when we build a window
2. link `Objective-C` or `Swift` frameworks when we compile `Rust` code

`winit`, a Rust crate, has already done these work for us. Tauri has its own crate `Tao` which is a fork of `winit` and brings more features like menu and system tray.Note that menu and system tray are not part of window, so `winit` doesn't implement them; In early time, `Tao` implements them, but now move them into other crates, `muda` for menu, `tray-icon` for system tray.

Here're code snippet from `Tao`, exploring how to build window.

On macOS:
```rs 
use objc2::{
  msg_send,
  rc::Retained,
  runtime::{AnyClass as Class, AnyObject as Object, ClassBuilder as ClassDecl, Sel},
};

let ns_window = msg_send![WINDOW_CLASS.0, alloc];
let ns_window: Option<Retained<NSWindow>> = msg_send![
    ns_window,
    initWithContentRect: frame,
    styleMask: masks,
    backing: NSBackingStoreType::Buffered,
    defer: NO,
];
```
As you can see, these code is based on `Rust bindings` for `Objective-C` and its runtime. `msg_send`, `WINDOW_CLASS.0`, are concepts from `Objective-C`.

On ios:
```rs 
let frame = match window_attributes.inner_size {
    Some(dim) => {
        let scale_factor = msg_send![screen, scale];
        let size = dim.to_logical::<f64>(scale_factor);
        CGRect {
        origin: screen_bounds.origin,
        size: CGSize {
            width: size.width as _,
            height: size.height as _,
        },
        }
    }
    None => screen_bounds,
};

let view = view::create_view(&window_attributes, &platform_attributes, frame);

let gl_or_metal_backed = {
    let view_class: *const AnyClass = msg_send![view, class];
    let layer_class: *const AnyClass = msg_send![view_class, layerClass];
    let is_metal: bool = msg_send![layer_class, isSubclassOfClass: class!(CAMetalLayer)];
    let is_gl: bool = msg_send![layer_class, isSubclassOfClass: class!(CAEAGLLayer)];
    is_metal || is_gl
};

let view_controller =
    view::create_view_controller(&window_attributes, &platform_attributes, view);
let window = view::create_window(
    &window_attributes,
    &platform_attributes,
    frame,
    view_controller,
);

// requires main thread
// view::create_window 
pub unsafe fn create_window(
  window_attributes: &WindowAttributes,
  _platform_attributes: &PlatformSpecificWindowBuilderAttributes,
  frame: CGRect,
  view_controller: id,
) -> id {
  let class = get_window_class();

  let window: id = msg_send![class, alloc];
  assert!(!window.is_null(), "Failed to create `UIWindow` instance");
  let window: id = msg_send![window, initWithFrame: frame];
  assert!(
    !window.is_null(),
    "Failed to initialize `UIWindow` instance"
  );
  let () = msg_send![window, setRootViewController: view_controller];
  match window_attributes.fullscreen {
    Some(Fullscreen::Exclusive(ref video_mode)) => {
      let uiscreen = video_mode.monitor().ui_screen() as id;
      let () = msg_send![uiscreen, setCurrentMode: video_mode.video_mode.screen_mode.0];
      msg_send![window, setScreen:video_mode.monitor().ui_screen()]
    }
    Some(Fullscreen::Borderless(ref monitor)) => {
      let uiscreen: id = match &monitor {
        Some(monitor) => monitor.ui_screen() as id,
        None => {
          let uiscreen: id = msg_send![window, screen];
          uiscreen
        }
      };

      msg_send![window, setScreen: uiscreen]
    }
    None => (),
  }

  window
}
```
As you can see, ios also depends on `Rust bindings` for `Objective-C`. Here's a question, we only have bindings code, but we also need to link `Objective-C` library at compile time, how to do ? The answer is `objc2` crate helps us. Take a look at `objc2` source code:
```rs 
// Link to libobjc
#[cfg_attr(not(feature = "unstable-objfw"), link(name = "objc", kind = "dylib"))]
// Link to libobjfw-rt
#[cfg_attr(feature = "unstable-objfw", link(name = "objfw-rt", kind = "dylib"))]
extern "C" {}
```
When we compile project which depends on `objc2`, Cargo will link `objc` dylib.


On Windows:
```rs 
use windows::{
  core::PCWSTR,
}
let handle = CreateWindowExW(
    ex_style,
    PCWSTR::from_raw(class_name.as_ptr()),
    PCWSTR::from_raw(title.as_ptr()),
    style,
    position.0,
    position.1,
    adjusted_size.0,
    adjusted_size.1,
    parent,
    pl_attribs.menu,
    GetModuleHandleW(PCWSTR::null()).map(Into::into).ok(),
    Some(Box::into_raw(Box::new(window_flags)) as _),
)?;
```
As you can see, building window on Windows depends on `windows`. `windows` is a crate provides `Rust bindings` for windows API, you're familiar if you use [`c++/winrt`](https://github.com/microsoft/cppwinrt) project, which provides you c++ function to allow you enjoy Windows API.



On Linux:
```rs
use gtk::{
  gdk::WindowState,
  glib::{self, translate::ToGlibPtr},
  prelude::*,
  CssProvider, Settings,
};

let mut window_builder = gtk::ApplicationWindow::builder()
      .application(app)
      .accept_focus(attributes.focused);

if let Parent::ChildOf(parent) = pl_attribs.parent {
    window_builder = window_builder.transient_for(&parent);
}

let window = window_builder.build();
```
As you can see, building window on Linux depends on `GTK`. `gtk` is a crate provides `Rust bindings` for `GTK `, like `objc2`. Unlike macOS and Windows, `GTK` might be not installed out of box on Linux, you have to install `GTK`, `GLib` and `Cairo` development files first.

## Webview
Since we have known how to build a window, but how do we build page inside window ? To make better use of traditional web development tech, Tauri decides to render page with `webview` . 

`webview` is a GUI component loading html,css,javascript like browser. You can focus on frontend development.

Tauri creates a crate `wry`, providing cross-platform `webview`. Like `Tao`, `wry` uses `Rust bindings` for platform standard programming language. 

On macOS, `wry` uses [`wkwebview`](https://developer.apple.com/documentation/webkit/wkwebview?language=objc).
```rs 
#[cfg(target_os = "macos")]
let webview = {
    let window = ns_view.window().unwrap();

    let scale_factor = window.backingScaleFactor();
    let (x, y) = attributes
        .bounds
        .map(|b| b.position.to_logical::<f64>(scale_factor))
        .map(Into::into)
        .unwrap_or((0, 0));
    let (w, h) = if is_child {
        attributes
        .bounds
        .map(|b| b.size.to_logical::<u32>(scale_factor))
        .map(Into::into)
    } else {
        None
    }
    .unwrap_or_else(|| {
        if is_child {
            let frame = NSView::frame(ns_view);
            (frame.size.width as u32, frame.size.height as u32)
        } else {
            (0, 0)
        }
    });

    let frame = CGRect {
        origin: if is_child {
        window_position(ns_view, x, y, h as f64)
        } else {
        CGPoint::new(x as f64, (0 - y - h as i32) as f64)
        },
        size: CGSize::new(w as f64, h as f64),
    };
    let webview: Retained<WryWebView> =
        objc2::msg_send![super(webview), initWithFrame: frame, configuration: &**config];
    webview
};

#[cfg(target_os = "ios")]
let webview = {
    let frame = ns_view.frame();
    let webview: Retained<WryWebView> =
        objc2::msg_send![super(webview), initWithFrame: frame, configuration: &**config];
    if let Some((red, green, blue, alpha)) = attributes.background_color {
        // This is required first since the webview color is applied too late.
        webview.setOpaque(false);

        let color = objc2_ui_kit::UIColor::colorWithRed_green_blue_alpha(
            red as f64 / 255.0,
            green as f64 / 255.0,
            blue as f64 / 255.0,
            alpha as f64 / 255.0,
        );

        if !is_child {
            ns_view.setBackgroundColor(Some(&color));
        }
        // This has to be monitored as it may clash with isOpaque = true.
        // The webview background color may also applied too late so actually not that useful.
        webview.setBackgroundColor(Some(&color));
    }
    webview
};
```

On windows, `wry` uses `webview2` which is wrapped by crate `webview2-com`.

On linux, `wry` uses `webkitgtk` which is wrapped by crate `webkit2gtk`. Read more about GTK `webkitview` from [this](https://webkitgtk.org/reference/webkitgtk/stable/ctor.WebView.new.html).


