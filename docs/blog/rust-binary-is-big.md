---
title: "rust编译出来的executable file比cpp大？"
page: true
aside: true
---

## Description
在 macOS 上，我有如下的文件：
:::code-group
```rust [hello.rs]
fn main() {
    println!("hello world");
}
```

```cpp [main.cpp]
#include <iostream>

int main() {
    std::cout << "hello world" << std::endl;
    return 0;
}
```
:::

编译：
```sh
rustc hello.rs -o hello
g++ -std=c++17 main.cpp -o main
```

发现 hello 要比 main 大不少，main 就20～30KB，但是 hello 却有几百KB。

因此，不少人认为，rust编译出来的东西比cpp大，cpp更出色。

## 原因
rust编译出来的东西比cpp大，全在于：
- rust采取静态链接，标准库直接编译进了executable file 
- g++采取动态链接，标准库没有编译进executable file

g++敢这样做的原因是，c/c++已经是每个操作系统都必须要支持的语言，它们的标准库被操作系统原生支持，操作系统会把这些库放在系统动态链接库的默认存储文件夹下，不需要在编译的时候给设置链接器参数，告诉链接器该到哪里搜索库。

## rust-动态链接版本
```sh
rustc -C prefer-dynamic hello.rs -o hello
```
如此一来，标准库就没有被加入到 hello 中。

如果一执行hello，就会发现报错了，说是找不到`@rpath`下某个dylib文件:
```txt
dyld[2290]: Library not loaded: @rpath/libstd-7f95fd207255b41e.dylib
  Referenced from: <729A58BA-DC5E-36B5-BFC1-82B21EB176AE> /Users/xxxx/Project/rust_project/rust-playground/main
  Reason: tried: '/Users/xxxx/.gvm/pkgsets/go1.20.3/global/overlay/lib/libstd-7f95fd207255b41e.dylib' (no such file), '/libstd-7f95fd207255b41e.dylib' (no such file)
[1]    2290 abort      ./main
```

这里就是c/c++的优势，它们无需在编译的时候，指定搜寻位置，系统默认帮它们搞定，但是对于rust而言，就需要我们告诉动态链接器从哪里寻找库。

具体方法有两种。

第一种，设置环境变量：
```shell
export DYLD_LIBRARY_PATH=$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/lib/rustlib/aarch64-apple-darwin/lib:$DYLD_LIBRARY_PATH

./hello
```

第二种，在编译的时候，指定连接器参数：
```shell 
rustc hello.rs -C prefer-dynamic  -C link-arg=-Wl,-rpath,$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/lib/rustlib/aarch64-apple-darwin/lib -o hello

./hello
```

这时候，你再看hello的大小，也是20～30KB，和C++编译的结果持平。

Rust和Cpp一样出色，并没有在编译结果的体积上吃亏，是Cpp最有力的替代品。我不鼓噪cpp的老用户放弃cpp，但我非常鼓励新人选择rust。

## 连接器和动态连接器
在macOS中，连接器就是`ld`，你可以在终端中尝试执行一下它：
```sh 
ld --help
```

连接器的作用，就是将编译器生成的object file，链接到最终的executable file。连接器在处理executable file 的符号表方面，也是一把好手。上面说到，指定`-C link-arg=-Wl,-rpath,$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/lib/rustlib/aarch64-apple-darwin/lib`, 就是让`ld`把我们指定的路径写入到符号表里的`@rpath`中。

当executable file执行的时候，操作系统会调用动态连接器（可以理解为操作系统实现的一个程序，或者说是一个系统调用，由操作系统执行，不会像 ld 那样公开给我们使用），读取executable file里的rpath, 得知动态链接库到哪里查找，然后把动态链接库加载进来，之后就是来到程序入口点，开始执行。

我想，你应该知道连接器和动态连接器的区别了。

:::tip <TipIcon />
动态连接器是操作系统的一部分，负责在程序启动时加载和链接所需的动态库（共享库）。

主要职责
- 加载动态库：在程序启动时，根据可执行文件中的信息加载所需的动态库。
- 符号解析：解析可执行文件和动态库中的符号引用，确保每个符号都能正确绑定到其定义的位置。
- 路径搜索：根据多种机制（如 rpath、runpath、环境变量 LD_LIBRARY_PATH 或 DYLD_LIBRARY_PATH）查找动态库。
- 延迟加载：支持延迟加载（Lazy Loading），即在首次使用某个库中的符号时才加载该库，而不是在程序启动时立即加载所有依赖库。


连接器是编译工具链的一部分，负责将编译后的目标文件（.o 或 .obj 文件）链接成最终的可执行文件或库文件。

主要职责
- 符号解析：解析目标文件中的符号引用，确保每个符号都能正确绑定到其定义的位置。
- 重定位：调整目标文件中的地址，使其在最终的可执行文件或库文件中正确对齐。
- 合并段：将多个目标文件中的相同段（如 .text、.data、.bss）合并到一个段中。
- 生成输出文件：生成最终的可执行文件或库文件，包含所有必要的代码和数据。


操作系统执行executable file的步骤
1. 程序启动：操作系统创建一个新的进程，并加载可执行文件 my_program。
2. 动态链接器加载：操作系统调用动态链接器（如 ld-linux.so 或 dyld）。
3. 解析 rpath 和依赖关系：动态链接器解析 my_program 中的 rpath 和依赖关系，查找并加载 libexample.so。
4. 内存映射：操作系统将 libexample.so 映射到进程的地址空间中。
5. 符号解析：动态链接器解析 my_program 中对 libexample.so 的符号引用，确保每个符号都能正确绑定到其定义的位置。
6. 程序执行：操作系统将控制权交给 my_program，程序开始执行。
:::

## rpath 和 strip
strip 工具的主要目的是从可执行文件或库文件中删除调试信息和符号表，以减小文件大小。然而，strip 不会删除 rpath 符号。

rpath 信息存储在可执行文件或动态库的动态段（Dynamic Segment）中，而不是在符号表中。

strip 会保留动态段中的必要信息，包括 rpath，以确保程序在运行时能够正确加载所需的动态库。

如果你尝试对上文得到的、采取动态链接方式的hello, 加以 strip 处理，处理之后，hello照样可以正常运行。

## rpath是macOS特有？
是的。

@rpath：是 macOS 特有的机制，用于指定动态链接器在运行时查找动态库的路径。

其他平台：
- Linux 使用 LD_LIBRARY_PATH、RPATH 和 RUNPATH
  - LD_LIBRARY_PATH, 类似于 macOS 的 DYLD_LIBRARY_PATH，是一个环境变量，用于指定动态链接器在加载动态库时应该搜索的路径列表。
  ```shell
  export LD_LIBRARY_PATH=/path/to/your/libraries:$LD_LIBRARY_PATH ./your_executable
  ```
  - RPATH 和 RUNPATH 是嵌入在可执行文件或动态库中的路径信息，类似于 macOS 的 @rpath
  ```shell 
  gcc -Wl,-rpath,/path/to/your/libraries -o your_executable your_source.c
  ```
  - ldconfig 是一个用于管理动态链接库缓存的工具，可以将库路径添加到系统的动态链接库配置中
  ```shell
  sudo ldconfig /path/to/your/libraries
  ```
- Windows 使用 PATH 环境变量和应用程序目录来管理动态库的路径：PATH 环境变量包含了一系列路径，Windows 会在这些路径中查找动态链接库（DLL）。
  ```shell 
  set PATH=C:\path\to\your\libraries;%PATH% 
  your_executable.exe
  ```