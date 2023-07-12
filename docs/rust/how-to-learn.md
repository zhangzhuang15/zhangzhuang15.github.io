---
title: "Rust基础学习资料"
page: true
aside: true
---

## 学习路线
和其他编程语言一样，要先学习rust的语法，比如`模式匹配`、`闭包`、`struct`、`trait`。

然后好好学习`所有权`和`生命周期`。这部分内容比较难搞，需要反复多次实践、复习，才能很好领悟。建议通过写代码的方式，比如开发一些command line工具，跟着编译器学习。

之后可以学习Rust中强大的智能指针，比如`Mutex` `Arc` `Rc` `Pin` `RefCell` 等等。
> 这部分看Rust文档的注释样例就能看懂，如果再看一些具体的开源项目学习，会更好

像`泛型编程` `动态分发`，建议阅读优秀的开源Rust项目学习。

如果有javascript、typescript、swift经验，学习rust会轻松一些。

## 在线读物

[《Rust编程语言》](https://doc.rust-lang.org/book/ch19-03-advanced-traits.html#default-generic-type-parameters-and-operator-overloading)

[《Cargo Book》](https://doc.rust-lang.org/cargo/guide/dependencies.html)

[《rustc手册》](https://doc.rust-lang.org/rustc/index.html)

[《Rust命令行工具开发指南》](https://rust-cli.github.io/book/index.html)

[《rustdoc手册》](https://doc.rust-lang.org/rustdoc/index.html)

[《rust高级编程》](https://learnku.com/docs/nomicon/2018)

[《通过例子学Rust(中文版)》](https://rustwiki.org/zh-CN/rust-by-example/fn/closures/output_parameters.html)

[《Rust中的Unsafe》](https://doc.rust-lang.org/nightly/nomicon/)

[《通过各种list学习Rust》](https://rust-unofficial.github.io/too-many-lists/)

[《Rust异步编程》](https://rust-lang.github.io/async-book/)

[《Rust Language Cheat Sheet》](https://cheats.rs/)

[Web Development In Rust](https://www.arewewebyet.org/)

[Rust学习资源](https://github.com/rcore-os/rCore/wiki/study-resource-of-system-programming-in-RUST)

[rust官网](https://www.rust-lang.org/zh-CN/learn)

[rust官方package仓库](https://crates.io/)

[rust标准库](https://doc.rust-lang.org/std/index.html)


## 推荐的github项目
[rustlings](https://github.com/rust-lang/rustlings.git)
> rust官方给出的一个帮助用户学习rust的仓库，该仓库编译运行后，就是一个同步的
> 问答程序，教你rust的知识点。而该项目源码本身也是宝藏，可以教你怎么用rust
> 语言编写一个command line工具。

<br>

[RustAlgorithms](https://github.com/TheAlgorithms/Rust.git)
> 用Rust实现各种数据结构。从中可以学习所有权，泛型编程等等。

<br>

[Tokio](https://github.com/tokio-rs/tokio.git)
> Rust异步编程runtime的一个版本，可以学到如何创建一个runtime，还有很多系统编程的知识，
> 还有Rust的宏。但是该项目难度比较大，不建议通篇去看，最好抱着解决具体的问题去看。

<br>

[awesome-rust](https://github.com/zhangzhuang15/awesome-rust.git)
> 本人fork的一个github仓库，原仓库可通过`awesome-rust`自行搜索。该项目介绍
> 了非常多的rust学习资源。


## 推荐的库
### argh
一个命令行参数解析器

[crate](https://crates.io/crates/argh)

### serde
`struct` `enum`的序列化和反序列化工具。

[website](https://serde.rs/field-attrs.html)

[crate](https://crates.io/crates/serde)

### wasm-bindgen
基于wasm，完成Rust和javascript之间的桥接
可以实现：
- 在Rust中调用javascript代码；
- 将Rust生成wasm，供javascript调用；

[website](https://rustwasm.github.io/docs/wasm-bindgen/examples/closures.html)

[crate](https://crates.io/crates/wasm-bindgen)


<Giscus />
