---
title: "Rust基础学习资料"
page: true
aside: true
---

## 学习路线

和其他编程语言一样，要先学习 rust 的语法，比如`模式匹配`、`闭包`、`struct`、`trait`。

然后好好学习`所有权`和`生命周期`。这部分内容比较难搞，需要反复多次实践、复习，才能很好领悟。建议通过写代码的方式，比如开发一些 command line 工具，跟着编译器学习。

之后可以学习 Rust 中强大的智能指针，比如`Mutex` `Arc` `Rc` `Pin` `RefCell` 等等。

> 这部分看 Rust 文档的注释样例就能看懂，如果再看一些具体的开源项目学习，会更好

像`泛型编程` `动态分发`，建议阅读优秀的开源 Rust 项目学习。

如果有 javascript、typescript、swift 经验，学习 rust 会轻松一些。

## 在线读物

[<<Rust 编程语言\>\>](https://doc.rust-lang.org/book/ch19-03-advanced-traits.html#default-generic-type-parameters-and-operator-overloading)

[<<Cargo Book\>\>](https://doc.rust-lang.org/cargo/guide/dependencies.html)

[<<rustc 手册\>\>](https://doc.rust-lang.org/rustc/index.html)

[<<Rust 命令行工具开发指南\>\>](https://rust-cli.github.io/book/index.html)

[<<rustdoc 手册\>\>](https://doc.rust-lang.org/rustdoc/index.html)

[<<rust 高级编程\>\>](https://learnku.com/docs/nomicon/2018)

[<<通过例子学 Rust(中文版)\>\>](https://rustwiki.org/zh-CN/rust-by-example/fn/closures/output_parameters.html)

[<<Rust 中的 Unsafe\>\> ](https://doc.rust-lang.org/nightly/nomicon/)

[<<通过各种 list 学习 Rust\>\>](https://rust-unofficial.github.io/too-many-lists/)

[<<Rust 异步编程\>\>](https://rust-lang.github.io/async-book/)

[<<Rust Language Cheat Sheet\>\> ](https://cheats.rs/)

[Web Development In Rust](https://www.arewewebyet.org/)

[ Rust 学习资源](https://github.com/rcore-os/rCore/wiki/study-resource-of-system-programming-in-RUST)

[ rust 官网](https://www.rust-lang.org/zh-CN/learn)

[ rust 官方 package 仓库](https://crates.io/)

[ rust 标准库](https://doc.rust-lang.org/std/index.html)

[Mini LSM By Rust](https://skyzh.github.io/mini-lsm/00-preface.html)
> 用Rust实现LSM数据结构的指南

## 按需找链接

### 想找 crate?

[crates.io](https://crates.io/)

### 标准库 API 咋使来着？

[rust 标准库](https://doc.rust-lang.org/std/index.html)

### 查`#[cfg] cfg! #[cfg_attr]` ？

[rust reference | Conditional Compilation](https://doc.rust-lang.org/reference/conditional-compilation.html)

### 常用的宏记不住？

[cheats of rust | Tooling Directives](https://cheats.rs/#tooling-directives)

### 宏的语法记不清了
[The little Book of Rust Macros](https://veykril.github.io/tlborm/decl-macros/minutiae/scoping.html)

[The Rust Reference | Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html)

### Cargo.toml 怎么写 ？

[cargo book | Reference](https://doc.rust-lang.org/cargo/reference/index.html)

### cargo 命令忘光光了？

[cargo book | Commands](https://doc.rust-lang.org/cargo/commands/index.html)

### rustc 忘了咋用了？

[the rustc book](https://doc.rust-lang.org/rustc/index.html)

### rust 基础语法记不清了？

[the rust programming language](https://doc.rust-lang.org/book/title-page.html)

[rust reference | Introduction](https://doc.rust-lang.org/reference/introduction.html)

[rust by example | Introduction](https://doc.rust-lang.org/stable/rust-by-example/index.html)

### rust documentation 不会搞？
[The rustdoc book](https://doc.rust-lang.org/rustdoc/what-is-rustdoc.html)

### 看到语法表达记不起来啥意思，有些概念搞不清？

[cheats of rust](https://cheats.rs)

## 推荐的 github 项目

[rustlings](https://github.com/rust-lang/rustlings.git)

> rust 官方给出的一个帮助用户学习 rust 的仓库，该仓库编译运行后，就是一个同步的
> 问答程序，教你 rust 的知识点。而该项目源码本身也是宝藏，可以教你怎么用 rust
> 语言编写一个 command line 工具。

<br>

[RustAlgorithms](https://github.com/TheAlgorithms/Rust.git)

> 用 Rust 实现各种数据结构。从中可以学习所有权，泛型编程等等。

<br>

[Tokio](https://github.com/tokio-rs/tokio.git)

> Rust 异步编程 runtime 的一个版本，可以学到如何创建一个 runtime，还有很多系统编程的知识，
> 还有 Rust 的宏。但是该项目难度比较大，不建议通篇去看，最好抱着解决具体的问题去看。

<br>

[awesome-rust](https://github.com/zhangzhuang15/awesome-rust.git)

> 本人 fork 的一个 github 仓库，原仓库可通过`awesome-rust`自行搜索。该项目介绍
> 了非常多的 rust 学习资源。

<br>

[crossbeam](https://github.com/crossbeam-rs/crossbeam)

> 用Rust实现的并发编程环境下的数据结构和工具库。可以学到无锁编程、unsafe编程，以及用 let 限制
> 完成 mutation 方面的知识

## 推荐的库

### argh

一个命令行参数解析器

[crate 地址](https://crates.io/crates/argh)

### serde

`struct` `enum`的序列化和反序列化工具。

[website](https://serde.rs/field-attrs.html)

[crate 地址](https://crates.io/crates/serde)

### wasm-bindgen

基于 wasm，完成 Rust 和 javascript 之间的桥接
可以实现：

- 在 Rust 中调用 javascript 代码；
- 将 Rust 生成 wasm，供 javascript 调用；

[website](https://rustwasm.github.io/docs/wasm-bindgen/examples/closures.html)

[crate 地址](https://crates.io/crates/wasm-bindgen)

<Giscus />
