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
如此一来，标准库就没有被加入到 hello 中。如果一执行hello，就会发现报错了，说是找不到`@rpath`下某个dylib文件。这里就是c/c++的优势，它们无需在编译的时候，指定搜寻位置，系统默认帮它们搞定，但是对于rust而言，就需要我们告诉动态链接器从哪里寻找库。

具体方法有两种。

第一种，