---
title: "How to Create .dmg File"
page: true
aside: true
---

# How to Create .dmg File
Recently, I study `Electron`. I'm curious how electron transfers `.app` file to `.dmg` file. I read its source code and write down this article.

`Electron` depends on `appdmg` package, so truth lies in this package.

Shortly speak:
1.  use `hdiutil create`, a native command line program on macOS, creating a temp virtual disk(temp .dmg file)
2. mount temp .dmg file on a path of filesystem(you can consider path is a directory generated randomly by os)
3. copy `.app` files and other necessary files into the path
4. use `hdiutil convert`, transfer temp .dmg file to the target .dmg file.

Let's break it down into several parts.

We have to count size of disk before create it. `appdmg` uses `du`, a command line program, getting the total size of files in format of MB. These files include .app file and other necessary files (app icon, background image, symbol link).

Then, use `hdiutil create temp.dmg -ov -size 120m -fs HFS+ -volname hello`, we can create temp.dmg which stands for 120MB size of virtual disk. If you double-click this file, `Finder` will mount it on filesystem, which says that  `Finder` will create a path like `/Volume/a`, gives you a way to manipulate virtual disk. For example, `mv hello.txt /Volume/a/hello.txt`, you can copy a file into virtual disk.

Right now, we can copy necessary files into temp.dmg file. For example, copy icons into `.VolumeIcon.icns`, copy symbol links of `/Application`, copy background image into `.background` directory. 
> normaly, we should think about retina screen, so `appdmg` uses `tiffutil`, a native command line program on macOS, to merge `1x` and `2x` pictures into `.tiff` file, and copy this file into `.background` directory.

But it's not enough because we need a GUI window for install tourist. On macOS, it's managed by `.DS_Store` file. `appdmg` uses `ds-store` package to do it. Here is code snippet:
```js 
const DSStore = require("ds-store")

const ds = new DSStore()

ds.vSrn(1)
ds.setIconSize(global.opts['icon-size'] || 80)

// set background color of GUI window
if (global.opts['background-color']) {
    const rgb = parseColor(global.opts['background-color']).rgb
    ds.setBackgroundColor(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
}

// set background image of GUI window
if (global.opts.background) {
    ds.setBackgroundPath(path.join(global.temporaryMountPath, global.bkgname))
}

// set size of GUI window
if (global.opts.window && global.opts.window.size) {
    ds.setWindowSize(global.opts.window.size.width, global.opts.window.size.height)
} else if (global.bkgsize) {
    ds.setWindowSize(global.bkgsize[0], global.bkgsize[1])
} else {
    ds.setWindowSize(640, 480)
}

// set shown position of GUI window
if (global.opts.window && global.opts.window.position) {
    ds.setWindowPos(global.opts.window.position.x, global.opts.window.position.y)
}

// set position of icons inside GUI window
for (const e of global.opts.contents) {
    ds.setIconPos(e.name || path.basename(e.path), e.x, e.y)
}

// create .DS_Store
ds.write(path.join(global.temporaryMountPath, '.DS_Store'), (err) => next(err))
```
When you double click .dmg file, os will open a GUI window following `.DS_Store` inside .dmg file.

And now, our dmg file is nearly ready. Finally, use `codesign`, a native command line program on macOS, to give dmg file a sign. Perfect! dmg file is well done!

If you want to get more details, take a look at [source code](https://github.com/LinusU/node-appdmg/tree/master) of `appdmg`.