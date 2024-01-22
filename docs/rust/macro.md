---
title: "宏-备忘录"
page: true
aside: true
---

## Description
列举Rust中的宏，备忘查看

## `#[]` 和 `#![]`
`#[]`格式的宏，用在函数、表达式、代码块上；

`#![]`格式的宏，用在一个区域，比如一个module, 一个函数作用域内；

## `#![no_std]`
表示不使用 rust 标准库，写裸机代码时，需指定此项

## `#![no_main]`
告诉rust, 不要在编译之后，生成main函数

## `#![no_mangle]`
编译的过程中，不要对命名做修改

## `#[link(name = "std", kind = "dylib")]`
当在 extern 中，使用来自于一个外部库定义的内容时，用该
宏标记 extern

这一部分内容比较长，可以看[官网介绍](https://doc.rust-lang.org/reference/items/external-blocks.html#the-link-attribute)

## `#[link_name = "actual_symbol_name_in_lib"]`
```rust 
extern {
    #[link_name = "actual_symbol_name_in_lib"]
    fn hello() -> void;
}
```
要链接的外部库中，定义的函数名叫做 "actual_symbol_name_in_lib";

但在rust使用时，你想用hello命名，此时就可以用这个宏解决该问题，否则你的rust部分函数名不能叫做hello, 必须叫做 "actual_symbol_name_in_lib"

## `#[repr(C)]`
标记在struct上面，表示struct的内存布局按照C语言的习惯设置

## `#[inline]`
标记在函数上面，表示建议该函数在编译的时候，通过内联的方式引入，注意，这只是建议，如果强制的话，使用`#[inline(always)]`, 如果强制不采用inline的话，使用`#[inline(never)]`

## `#[path = "a.rs"]`
设置 mod 位于哪个文件

## `#[panic_handler]`
标注在一个函数上面，用这个函数来替换 panic!

## `#![windows_subsystem = "windows"]`
除了 "windows", 还可以选择 "console".

当 crate 是一个 windows 平台的 bin crate 时，产物是 exe 文件。

如果你指定了 "windows", exe 文件启动时，不会弹出一个窗口；

如果你指定了 "console", exe 文件启动时，会弹出一个窗口

## `#[cfg(target_os = "macos")]`
用于条件编译的宏，标注在函数、表达式、代码块上边，当满足约束条件的时候，
这些代码才会被编译。

### target_os
- "macos"
- "windows"
- "ios"
- "linux"
- "android"
- "freebsd"
- "dragonfly"
- "openbsd"
- "netbsd"
- "none"

### target_arch
- "x86"
- "x86_64"
- "aarch64"
- "arm"
- "mips"
- "powerpc"
- "powerpc64"

### target_family
- "windows"
- "unix"
- "wasm"

### unix
`#[cfg(unix)]`

### windows
`#[cfg(windows)]`

### target_env
- "msvc"
- "gnu"
- "musl"
- "sgx"
- ""

### target_endian
- "little"
- "big"

### target_pointer_width
- "16"
- "32"
- "64"

### target_vendor
- "apple"
- "pc"
- "fortanix"
- "unknown"

### target_has_atomic
- "8"
- "16"
- "32"
- "64"
- "128"
- "ptr"

### target_feature
- "avx"
- "avx2"
- "crt-static"
- "rdrand"
- "sse"
- "sse2"
- "sse4.1"

### panic
- "unwind"
- "abort"

### test
`#[cfg(test)]`

可以标记一个mod，当使用 cargo test 的时候，这个mod会
被编译，否则不会被编译

### debug_assertions
`#[cfg(debug_assertions)]`

### proc_macro
`#[cfg(proc_macro)]`

### any
`#[cfg(any(target_os = "macos", target_os = "linux"))]`

### all
`#[cfg(all(target_os = "macos", target_arch = "x86_64"))]`

### not
`#[cfg(not(target_os = "macos"))]`

## `#[cfg_attr(target_os = "macos", path = "macos.rs")]`
当 target_os = "macos" 满足时，`#[path = "macos.rs"]` 宏就会加入被修饰的代码上；

除了 path ，还可以写其他合法的attribute，比如 
- test
- no_link
- allow
- derive

等等


## `#[test]`
标记在函数上面，表示该函数为单元测试函数

## `#[ignore]`
如果在test的时候，忽略掉被 `#[test]` 标记的函数，
可以使用它：
```rust 
#[test]
#[ignore = "忽略执行"]
fn test_ignore() {}
```

## `#[macro_use]`
引入一个mod定义的所有宏。

引入指定的宏，可以写为`#[macro_use(lack)]`, 这样就只会引入 lack! 宏

## `#[macro_export]`
导出宏

## `#[no_link]`
标记在crate上面，表示编译的时候，不会将这个crate链接进去

## `#[derive(PartialEq, Clone)]`
标记在 struct 上边，告诉 rust 编译的时候，自动生成
 impl PartialEq 和 impl Clone 的代码

## `#[rustfmt::skip]`
rustfmt提供的工具宏，影响rustfmt的行为，这里的例子是说rustfmt不处理被宏标记的代码

## `#[allow(unused-mut)]`
标记表达式，如果表达式违反了unused-mut规则，不会报lint错误；

如果要报警告，用`warn`；
如果要报错误，用`deny` 或者  `forbid`;

除了 unused-mut ，还有哪些 lint 规则，可以使用 `rustc -W help` 查看