---
title: "Rust FAQ"
page: true
aside: true
---

# 🤔️🤔️🤔️

## Rust std 和 Rust core 的区别
Rust std 是让Rust语言开发的软件具备可移植性，提供了核心类型（Rust core），如 Vec， 还提供了标准宏、IO、多线程
原语操作（如原子指令）。但 Rust std 要提供这些功能，必须要依赖操作系统。因此在裸机开发中，不能用 Rust std。

Rust core 是Rust语言核心库，提供了很多基础功能，比如指针操作，它不依赖任何操作系统，可以在裸机使用。

[refer](https://rcore-os.cn/rCore-Tutorial-Book-v3/chapter1/1app-ee-platform.html#)

## 如何理解rustc的版本
执行 `rustc --version --verbose`, 会有这样的结果：
```
rustc 1.79.0 (129f3b996 2024-06-10)
binary: rustc
commit-hash: 129f3b9964af4d4a709d1383930ade12dfe7c081
commit-date: 2024-06-10
host: aarch64-apple-darwin
release: 1.79.0
LLVM version: 18.1.7
```
其中最重要的是`host`行，它表示：
- aarch64, CPU类型
- apple, CPU产商
- darwin, 操作系统

如果`host`是 *riscv64gc-unknown-none-elf*， 它表示：
- riscv64gc, CPU 类型，它支持 riscv64 的 G系列 和 C系列 指令集
- unknown, 没有确定的CPU厂商
- none, 无操作系统
- elf, 没有运行时库，但是会编译为 ELF 文件

:::tip <TipIcon />
RV32/64I：每款处理器都必须实现的基本整数指令集。在 RV32I 中，每个通用寄存器的位宽为 32 位；在 RV64I 中则为 64 位。它可以用来模拟绝大多数标准指令集拓展中的指令，除了比较特殊的 A 拓展，因为它需要特别的硬件支持。

M 拓展：提供整数乘除法相关指令。

A 拓展：提供原子指令和一些相关的内存同步机制，这个后面会展开。

F/D 拓展：提供单/双精度浮点数运算支持。

C 拓展：提供压缩指令拓展。

[refer](https://rcore-os.cn/rCore-Tutorial-Book-v3/chapter1/1app-ee-platform.html)
:::

应用程序想要运行，就必须考虑以下几点：
- CPU类型
- 操作系统
- 运行时库

这也就是说：
- 经编译后，适用于CPU A类型的程序，无法在CPU B类型的硬件上跑起来
- 经编译后，适用于windows系统的程序，无法在macOS上运行，尽管它们的CPU类型都是一样的
- 经编译后，尽管操作系统、CPU类型相同，采用运行时库A可以执行，采用运行时库B可能无法执行，因为有些符号可能在运行时库B中找不到

## 默认情况下，闭包会获取所有权么？

不会.

```Rust

fn main() {
    let s = String::from("hello");

    // in closure m, s is &String type,m
    // doesn't take ownership of s!
    let m = || {
        println!("{}", s);
    };

    // you can call closure many times
    m();
    m();
}
```

```rust
fn main() {
    let mut s = String::from("hello");

    // in closure m, s is &mut String type,
    // it still doesn't take ownership of s!
    //
    // because we change s in m, the m must
    // be limited by `mut`.
    //
    // rust will automatically consider m attrs
    // FnMut type.
    let mut m = || {
        s.push_str("world");
        println!("{}", s);
    };

    m();
    m();
}

```

```rust
fn main() {
    let s = String::from("hello");

    // we add move here, m takes ownership of s,
    // s could be only used in m!
    //
    // we don't consume s in m, so rust will
    // consider m as Fn type, as a result,
    // we could invoke m many times.
    let m = move || {
        println!("{}", s);
    };

    m();
    m();
}
```

```rust
fn show(s: String) {
    println!("{}", s);
}

fn main() {
    let s = String::from("hello");

    // m takes ownership of s,
    // and m consumes s by show function,
    // then rust will consider m as FnOnce
    // type, as a result, we could only
    // invoke m once.
    let m = move || {
        show(s);
    };

    m();
}
```

## 使用`match`完成模式匹配时，所有权会变更么？

Rust 中的模式匹配是一种通过 `match` 关键字来根据类型的结构进行条件分支的语法。它类似于 C 语言中的 `switch` 语句，但是更强大和灵活。模式匹配可以用来解构数组、枚举、结构体或元组，并把它们的值绑定到变量中。

Rust 中的所有权是一种管理内存和资源的机制，它保证了每个值都有一个唯一的所有者，当所有者离开作用域时，值就会被销毁。Rust 中的引用是一种借用值而不获取其所有权的方式，它有两种形式：共享引用（&T）和可变引用（&mut T）。共享引用允许多个读取访问，但不允许写入；可变引用允许唯一的写入访问，但不允许其他访问。

那么，模式匹配会不会造成所有权变更呢？答案是：取决于模式匹配的对象和结果。模式匹配可以分为两种情况：**移动语义（move semantics）**和**借用语义（borrow semantics）**。

移动语义是指模式匹配会把对象的所有权转移给绑定的变量，从而使原来的对象失效。这种情况发生在模式匹配的对象是一个值类型，或者是一个包含值类型的复合类型。例如：

```rust
enum Message {
    Quit,
    Write(String),
}

fn main() {
    let msg = Message::Write(String::from("Hello")); // msg 拥有一个 String 值
    match msg {
        Message::Quit => println!("Quit"),
        Message::Write(s) => println!("Write: {}", s), // s 获得了 String 值的所有权，msg 失效
    }
    // println!("{:?}", msg); // 错误：msg 已经被移动了
}
```

上面的代码中，msg 是一个枚举类型，它有两个变体：Quit 和 Write(String)。当我们对 msg 进行模式匹配时，如果匹配到 Write(s)，那么 s 就会获得 String 值的所有权，而 msg 就会失效。这就是移动语义。

借用语义是指模式匹配会把对象的引用绑定给变量，从而不影响原来的对象。这种情况发生在模式匹配的对象是一个引用类型，或者是一个包含引用类型的复合类型。例如：

```rust
enum Message {
    Quit,
    Write(&'static str),
}

fn main() {
    let msg = Message::Write("Hello"); // msg 拥有一个 &str 引用
    match msg {
        Message::Quit => println!("Quit"),
        Message::Write(s) => println!("Write: {}", s), // s 获得了 &str 引用，msg 仍然有效
    }
    println!("{:?}", msg); // 可以正常打印
}
```

上面的代码中，msg 是一个枚举类型，它有两个变体：Quit 和 Write(&'static str)。当我们对 msg 进行模式匹配时，如果匹配到 Write(s)，那么 s 就会获得 &str 引用，而 msg 仍然有效。这就是借用语义。

总之，模式匹配会不会造成所有权变更取决于模式匹配的对象和结果。如果对象和结果都是值类型，那么就会发生移动语义；如果对象和结果都是引用类型，那么就会发生借用语义；如果对象和结果的类型不一致，那么就会根据具体情况进行隐式转换或报错。

## mod 的可见性规则？

```rust
// src/a.rs
mod b;

// 访问不了
b::c::ok();

// 访问不了
b::c::no();

// 可以访问
b::d::hello();

// 访问不了
b::d::world();
```

```rust
// src/a/b.rs
mod c;
pub mod d;

// 可以访问
c::ok();

// 访问不了
c::no();

// 可以访问
d::hello();

// 访问不了
d::world();
```

```rust
// src/a/b/c.rs
pub fn ok() {}
fn no() {}
```

```rust
// src/a/b/d.rs
pub fn hello() {}
fn world() {}
```

再来看看 struct 的可见性：

```rust
// src/a.rs
mod b;

// 出错
// XiaoMing 不可见，无法访问
b::XiaoMing {
    name: "xiao_ming".to_string(),
}

// 出错
// name 不可见，无法访问
b::XiaoHong {
    name: "xiao_hong".to_string(),
}

// 没有错误，正常运行
b::XiaoHai {
    name: "xiao_hai".to_string(),
}

// 出错
// XiaoTong.0 不可见，无法访问
b::XiaoTong(1);

// 出错
// init 不可见，无法访问
b::XiaoHong::init();

// 没有错误，正常运行
b::XiaoHong::new();
```

```rust
// src/a/b.rs
struct XiaoMing {
    name: String,
}

pub struct XiaoHong {
    name: String,
}

pub struct XiaoHai {
    pub name: String,
}

pub struct XiaoTong(i32);

// 仅仅在当前crate范围可见，别的crate引用不了
pub(crate) struct XiaoNao {}

impl XiaoHong {
    fn init() -> Self {
        XiaoHong {
            name: "xiao_hong".to_string(),
        }
    }

    pub fn new() -> Self {
        XiaoHong {
            name: "xiao_hong".to_string(),
        }
    }
}
```

再看看 struct 在定义处的可见性：

```rust
// src/a.rs

struct XiaoMing(i32);
pub struct XiaoHong(i32);

fn hello() {
    // 正常运行
    let m = XiaoMing(1);

    // 出错
    // world可见，ok不可见
    world::ok();
}

mod world {
    use super::XiaoMing;
    fn ok() {
        // 正常运行
        let m = XiaoMing(1);
    }

}
```

## 怎么写文档注释
文档注释可以在vscode的hint中显示出来。

对于crate级的文档注释，写在 main.rs 或者 lib.rs 开头，
注释每行用 `//!` 开头；

对于函数，struct，变量的文档注释，写在定义处的上一行，注释每行用 `///` 开头；

文档注释之中，支持 markdown 语法；

## 多行字符串

:::code-group

```rust [demo1.rs]
let s = "hello
world
right";
println!("{}", s);

// 输出结果：
// hello
// world
// right
```

```rust [demo2.rs]
let s = "hello
  world
right";
println!("{}", s);

// 输出结果：
// hello
//   world
// right
```

```rust [demo3.rs]
let s = "
hello
world
right";
println!("{}", s);

// 输出结果：
//
// hello
// world
// right
```

```rust [demo4.rs]
let s = "
hello
world
right
";
println!("{}", s);

// 输出结果：
//
// hello
// world
// right
//
```

```rust [demo5.rs]
let s = "\
hello
world
right";
println!("{}", s);

// 输出结果：
// hello
// world
// right
```

```rust [demo6.rs]
let s = "\
  hello
world
right";
println!("{}", s);

// 输出结果:
//  hello
// world
// right
```

```rust [demo7.rs]
let s = r"
hello \n
world
right";
println!("{}", s);

// 输出结果：
//
// hello \n
// world
// right
```
```rust [demo8.rs]
let s = r#"
hello \n
world
right"#;
println!("{}", s);

// 输出结果：
//
// hello \n
// world
// right
```

```rust [demo9.rs]
let s = "
hello \n
world
right";
println!("{}", s);

// 输出结果：
//
// hello
//
// world
// right
```
:::


## 千奇百怪的字符格式
```rust
fn main() {
    // &[u8; 5]
    let t = b"hello";

    // u8
    let t = b'a';

    // 打印出来：
    // h    h
    let t = "h\th";

    // 打印出来：
    // h\th
    let t = r"h\th";

    // 打印出来：
    // h"   h
    let t = "h\"\th";

    // 错误！
    // let t = r"h\"\th";

    // 打印出来：
    // h\"\th
    let t = r#"h\"\th"#;
}

```

## block 表达式使用 return 会怎么样
```rust 
fn main() {

    let m = {
        let t = 4;
        t + 2
    };

    // output: 6
    println!("{}", m);

    let m = {
        let t = 4;
        // end up with main function!😱
        return t+2;
    };

    // cannot execute this line,
    println!("{}", m);
}

```

## crate 在 main.rs，lib.rs 以及其余 rs 文件中的语义

在 main.rs 中，crate 就是指 main.rs 本身；

```rust
// main.rs

mod a;
// mod b;

// 这个是可以的
use crate::a::*;

// 这个不行
// use crate::b::*;
```

在 lib.rs 中， crate 就是指 lib.rs 本身；
在 src 目录下的其余 rs 文件中，crate 就是指 lib.rs;

:::code-group
```rust [src/lib.rs]

mod a;
```

```rust [src/b/b.rs]
use crate::a::*;
```
:::

## tests 文件夹里的 mod 规则

tests 文件夹下放置的是集成测试文件，而单元测试的代码是写在 src 下的源代码里的。

tests 文件夹下的每一个 rs 文件都相当于 main.rs 的角色, 因此你可以这样引入 mod:

```rust
// tests/c/mod.rs
pub fn hello() {
    "hello world"
}
```

```rust
// tests/a.rs
mod c:
use c::hello;

fn m() {
    let r = hello();
    println!("{}", r);
}
```

```rust
// tests/b.rs
mod c;
use c::hello;

fn n() {
    let r = hello();
    println!("{}", r);
}
```

如果有若干个 rs 文件组成一次集成测试，你需要将这些文件放在一个文件夹里：

```rust
// tests/internal/a.rs
mod b;
use b::hello;

fn s() {
    hello();
}
```

```rust
// tests/internal/b.rs

// b.rs 作为一个独立的mod，不作为一个集成测试文件
pub fn hello() {
    println!("hello world");
}
```

尽管 tests/internal/b.rs 可以被 a.rs 引入，但更推荐采用 tests/internal/b/mod.rs 这种形式

如果存在：

- tests/a.rs
- tests/b/main.rs
- tests/internal/mod.rs

执行集成测试文件 a.rs：`cargo test --test a`

执行集成测试文件 b/main.rs: `cargo test --test b`

执行所有的集成测试文件： `cargo test --tests`

执行 a.rs 里的测试函数 hello_is_ok: `cargo test --test a hello_is_ok`

## 如何理解 tests examples benches 文件夹
1. 功能不同
tests： 集成测试

examples: 运行示例代码

benches: 压力测试

2. 都是二进制程序
无论你使用 cargo 运行哪一个，都是生成一个二进制程序，然后运行。

```txt
examples
  ---  a.rs
  ---  b.rs
  ---  c
        --- d.rs
        --- e.rs
        --- main.rs

src
  --- main.rs
```

`examples/a.rs` 和  `examples/b.rs` 都相当于  `src/main.rs` 的角色，因此它们之间不能作为对方的模块；

而 `examples/c/main.rs` 相当于 `src/main.rs` 的角色，因此它可以引入 `examples/c/d.rs` 和 `examples/c/e.rs`;

`tests` 文件夹和 `benches`文件夹也是同样的文件结构和道理。

`tests` `examples` `benches` 和 `src` 文件夹是平级关系，也就是说，在这些文件夹下的 rs 文件可以访问当前package，以及当前package所依赖的package.


## --test --example --bin --bench 

`cargo test m`: 执行 src, tests, examples, benches 下所有rs文件中的单元测试函数，这些测试函数的名字要包含 m

`cargo test --test a`: 执行 tests/a.rs 或者 tests/a/*.rs 中的单元测试函数

`cargo test --example a`: 执行 examples/a.rs 或者 examples/a/*.rs 中的单元测试函数

`cargo test --bin a`: 执行 src/bin/a.rs 或者 src/bin/a/*.rs 中的单元测试函数

`cargo test --bench a`: 执行 benches/a.rs 或者 benches/a/*.rs 中的单元测试函数

单元测试函数都会被`#[test]`修饰；

上述的参数，在 `cargo bench` 也支持，只不过执行的是压力测试函数，这些函数被`#[bench]`修饰；


## 如何理解 `*x` 和 `Deref` 
```rust 
use std::ops::Deref;

struct DerefExample<T> {
    value: T,
}

impl<T> Deref for DerefExample<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

let m = DerefExample { value: 'a' };

let n = &m;

// *m 相当于 *(m.deref())
// 最终结果就是 *(&m.value) -> m.value -> 'a'
let s = *m;

// n 的类型是 &DerefExample<char>
// *n 就是 DerefExample<char>,
// 这里没有执行 n.deref()
let t = *n;
```


## 写操作一定要有 `mut` 么 
不一定哦。

一般来说：

```rust 
// 想改变m的值，要声明为 let mut m
let m = 2;

struct Data {
    value: i32,
}

impl Data {
    fn change(&mut self, new_value: i32) {
        self.value = new_value;
    }
}

let n = Data { value: 2 };

// 想改变value，必须声明 let mut n
n.value = 3;

// 没办法执行，n 没有声明为 let mut n 
n.change(10);
```

但是，使用 unsafe Rust，可以在没有声明`mut`的时候，修改值；

典型的一个例子就是标准库里的 `AtomicUsize`, 它的 `compare_exchange_weak`方法
并不要求 `self` 是 `&mut`，因为它内部使用unsafe Rust直接修改内存里的值，跳过了
safe Rust 系统的那套约束；

## `*x` 会改变所有权么
```rust 
fn main() {
    let m = String::from("world");
    let n = &m;

    // 不会改变所有权，所有权还在 m 手里
    let t = &*n;

    // 会改变所有权！
    let k = *n;
}
```

```rust 
fn main() {
    let m = String::from("world");
    let n = &m as *const String;

    // 不会改变所有权，所有权还在 m 手里
    let t = unsafe { &*n };

    // 改变所有权了！
    let k = unsafe { *n };
}
```

```rust 
fn main() {
    struct M {
        value: i16,
    }

    let mut n = M { value: 1 };
    let mut t = &mut n;

    // 不会move
    *t.value = 10;

    // 会move
    let t = *t;
}
```

## `ref` 是干什么用的
`ref`关键字用于模式匹配

```rust 
fn main() {
    let m = Some(String::from("hello"));

    match m {
        Some(s) -> println!("{}", s),
        None -> _,
    }
}
```
这个例子中，String会移动到 s;

```rust 
fn main() {
    let m = Some(String::from("hello"));

    match m {
        // s 是 &String 类型
        Some(ref s) -> println!("{}", s),
        None -> _
    }
}
```
这个例子中，依旧可以匹配成功，只不过在 `ref` 的修饰下，
s 不再是直接获取String，而是获取String的reference;

## `Pin`解决什么问题
具体可以看这篇文章：[知乎| 005 Rust 异步编程，Pin 介绍](https://zhuanlan.zhihu.com/p/157348723)

简言之就是，Rust拥有移动语义，当 `let m = n`，n 的内存和内容会复制一份新的给m，然后 n 无法
访问旧有内存，就是我们说的n移动到了m.如果内存中存在自引用，内存地址改变了，但自引用地址是按bit
拷贝的，依旧是旧内存地址，一旦使用这个自引用访问内存，就会发生内存错误。

为了解决这个问题，才出现了 `Pin`。`Pin`会把引用或者数据包装起来，只开放无法触发移动语义的API。

最典型的场景就是`Future`异步编程。

## raw pointer 身上有借用检查么？
raw pointer: `*const` `*mut`
没有借用检查，如果它指向了堆内存，你自己要保证没有内存泄漏发生！

## 结构体怎么直接就能访问属性的属性？
因为实现了`Deref` trait

```rust
fn main() {
    struct M {
        value: i32,
    }

    struct N {
        m: M,
    }

    impl Deref for N {
        type Target = M;
        fn deref(&self) -> &Self::Target {
            &self.m
        }
    }

    let n = N { m: M { value: 10 } };

    // 编译器会检查 n 是否有 value，
    // 如果没有的话，检查 *n 是否有value，
    // 发现确实有，于是将代码优化为 *n.value
    println!("{}", n.value);
}
```

## 如何在vscode调试Rust代码？
安装Rust工具链

安装以下插件：
- `CodeLLDB`
- `rust-analyzer`

为调试创建一个`launch.json`文件，该文件会给出一个`Add Configuration`的按钮，
点击这个按钮，选择 `CodeLLDB: Debug a Cargo Target`, 自动生成调试配置参数，
指定好命令即可，比如：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Cargo launch",
            "cargo": {
                "args": [
                    "build",
                    "--bin",
                    "rust-practice"
                ]
            },
            "args": []
        }, 
    ]
}
```
> 默认的cargo build 也会把src/bin下的代码编译为可执行程序，会令 CodeLLDB 理解错乱，
> 不知道你要调试的是 main.rs 编译好的可执行程序，还是 src/bin 下的，
> 所以要给出 `--bin rust-practice`，明确告诉 CodeLLDB 究竟要调试哪个可执行程序


## 如何查看宏展开后的代码
```shell
cargo install cargo-expand
cargo expand
```

## 定义rust过程宏的流程
1. 使用 `syn` 包提供的能力，将 `proc_macro::TokenStream` 转化为 `syn::DeriveInput`
2. 基于 `syn::DeriveInput` 进行一些操作
3. 使用 `quote` 包提供的能力，将 `syn::DeriveInput`转为 `proc_macro::TokenStream` 

:::tip <TipIcon />
`syn` 和 `quote` 都使用 `proc_macro2`，在宏定义的开始，应该将 `proc_macro::TokenStream` 转为
`proc_macro2::TokenStream`，在宏定义的结束位置，将 `proc_macro2::TokenStream` 转为
`proc_macro::TokenStream`

如果在 `quote` 提供的宏中，你使用了`proc_macro::TokenStream`，会报错，请使用`proc_macro2::TokenStream`
:::


## 如何使用宏给struct内添加成员属性
:::code-group
```toml [Cargo.toml]
[package]
name = "macro-demo"

[lib]
proc-macro = true
path = "./src/lib.rs"

[[bin]]
name = "demo"
path = "./src/bin/demo.rs"

[dependencies]
quote = "1.0.36"
syn = "2.0.66"
```
```rust [src/lib.rs]
use proc_macro::{TokenStream};
use quote::{quote};
use syn::{parse::Parser, parse_macro_input, Data, DataStruct, DeriveInput, Field, Fields, FieldsNamed};

#[proc_macro_attribute]
pub fn add_field(args: TokenStream, input: TokenStream) -> TokenStream {
    let mut ast = parse_macro_input!(input as DeriveInput);

    match &mut ast.data {
        Data::Struct(DataStruct {
            fields: Fields::Named(n),
            ..
        }) => {
            // 找到属性名是 hello 的属性索引号
            let mut index = 0;
            for item in n.named.iter() {
                let ident = item.ident.as_ref().unwrap();
                if ident.to_string() == "hello".to_string() {
                    break;
                }
                index += 1;
            }

            // 在hello属性前边插入一个 real 属性
            n.named.insert(index, Field::parse_named.parse2(
                quote! { pub real: String }
            ).unwrap());
            
            quote! {
                #ast
            }.into()
        },
        _ => { quote!(#ast).into() }
    }
}
```

```rust [src/bin/demo.rs]
use macro_demo::add_field;

#[add_field]
struct M {
    name: String,
    hello: String,
    value: u32,
}

fn main() {
    let m = M {
        name: "jack".into(),
        real: "".into(),
        hello: "hello".into(),
        value: 10,
    };
}
```
:::


## 如何使用宏给struct增加impl定义
:::code-group
```toml [Cargo.toml]
[package]
name = "macro-demo"

[lib]
proc-macro = true
path = "./src/lib.rs"

[[bin]]
name = "demo"
path = "./src/bin/demo.rs"

[dependencies]
quote = "1.0.36"
syn = "2.0.66"
```
```rust [src/lib.rs]
use proc_macro::{TokenStream};
use quote::{quote};
use syn::{parse::Parser, parse_macro_input, Data, DataStruct, DeriveInput, Field, Fields, FieldsNamed};

#[proc_macro_derive(HelloWorld)]
pub fn hello_world(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let ident = &ast.indent;
    quote! {
        impl HelloWorld for #ident {}
    }
}
```

```rust [src/bin/demo.rs]
use macro_demo::HelloWorld;

#[derive(HelloWorld)]
struct H {}

//
// 宏展开后变成：
// 
// #[derive(HelloWorld)]
// struct H {}
//
// impl HelloWorld for H {}
// 

fn main() {}
```
:::

:::tip <TipIcon />
derive宏只会在 struct 后边追加代码，如果要修改 struct ，请使用`proc_macro_attribute`
:::


## 过程宏定义中出现的 `..`表示什么意思？

```rust 
macro_rules! unrecoverable {
    (pos=$pos:expr, $stream:ident, $($str:expr),*) => {
        return Err(crate::basic_parser::Status::Fatal($pos .. CharStream::get_pos($stream), format![$($str),*]))
    };
}
```
`$pos .. CharStream::get_pos($stream)` 中的 `..` 是什么意思呢？

它表示 range 计算，和 `for item in 3..7` 一样，
`$pos .. CharStream::get_pos($stream)`的结果是得到了一个 `std:ops:Range`类型数据；



## 如何给str增加新的方法

Rust标准库已经给 `str` 定义了一些方法，我们如何给它增加新的方法呢？

方法就是使用 trait，比如:

:::code-group
```rust [src/m.rs]
trait M {
    fn hello(&self, val: i32) -> i32
}

impl M for str {
    fn hello(&self, val: i32) {
        println!("{}", val);
    }
}
```

```rust [src/main.rs]
mod m;
use m::M;

fn main() {
    let m = "jack";

    m.hello(10);

    // or

    M::hello(m, 10);
}
```
:::


## Path 和 PathBuf 的区别
`std::path::Path` 不会拥有路径字符串的所有权，相当于持有 `&str`, 对路径采取只读操作；

`std::path::PathBuf` 拥有路径字符串的所有权，相当于持有 `String`, 对路径可以进行写操作；


## PhantomData 干什么用的
PhantomData是一种标记类型，在编译之后，它不占用任何内存空间，仅仅作为一种推理符号，
在编译阶段发挥作用。

```rust 
struct M;

struct N {
    ptr: *mut M,
    data: PhantomData<M>
}
```
`ptr`是指向 M 的裸指针，但不意味着 N 拥有 M 的所有权。如果说，你想用裸指针的方式自行管理M的资源，可以加入 `PhantomData<M>`，告诉编译器，N 拥有 M 的所有权。但实际上，M的资源释放并不是依赖所有权系统完成的，而是你自行完成的。


```rust
struct N<'a, T: 'a> {
    ptr: *const T,
    data: PhantomData<&'a T>
}
```
`ptr` 是指向 T 的裸指针，裸指针没有生命周期的概念。如果说，你想给裸指针加入生命周期的限定，就可以加入 `PhantomData<&'a T>`, 告诉编译器 N 的生命周期和 'a 有关。


## `*mut ()` 是什么类型
c语言使用 `void*` 表示一种特殊的指针，这个指针不指向具体的数据类型，在使用这种指针的时候，利用`(char*)ptr`的强制转化方式，变为具体数据类型的指针使用。这样做的目的就是不想暴露指针到底指的是什么具体类型的数据，当然它也可以作为一种泛型的手段使用。

在 Rust 语言，就使用 `*mut ()` 表示这样的指针。


## `Ordering::Release` 和 `Ordering::Acquire`
解释清楚这两个东西，必须要结合具体的例子。先看下面的伪代码：
```
data = None 
has_data = false

// thread 1
write(&data, "hello")
atomic_store(&has_data, true)


// thread2
if atomic_load(&has_data):
    d = read(&data)
    assert(d == "hello")
```

由于编译器重排、CPU重排，thread 1 的执行顺序可能是：
```
atomic_store(&has_data, true)
write(&data, "hello")
```

当 `atomic_store` 执行完毕后，`has_data`就是 true, 这个时候，可能发生线程切换，执行 thread 2, thread 2 原子读取 has_data, 结果是 true， 然后执行 if 分支，读取 `data`，结果数据不是 `hello`，导致 assert 发生错误；

解决方式，就是使用 `Ordering::Release` 和 `Ordering::Acquire`.

```
data = None 
has_data = false

// thread 1
write(&data, "hello")
atomic_store(&has_data, true, Ordering::Release)


// thread2
if atomic_load(&has_data, Ordering::Acquire):
    d = read(&data)
    assert(d == "hello")
```

想要理解上面的意思，就要先了解下内存屏障，我们将写屏障记作`Release`, 将读屏障记作`Acquire`.

```
data = 10

Release

data = 11
```
**Release 上侧的写操作，不能重排到下侧，反之亦然**；


```
a = b 

Acquire

a = c
```
**Acquire 下侧的读操作，不能重排到 Acquire 上侧，反之亦然**；

那么，上边的伪代码可以表示为：
```
data = None 
has_data = false

// thread 1
write(&data, "hello")
Release
atomic_store(&has_data, true)


// thread2
Acquire
if atomic_load(&has_data):
    d = read(&data)
    assert(d == "hello")

```

这样 thread 1 在执行的时候， write 就不会重排了；

在 Rust 中：
- `Ordering::Release`要和写操作（store, write）搭配使用，不能和读操作搭配使用；
- `Ordering::Acquire`要和读操作（load, read）搭配使用，不能和写操作搭配使用；

> [伪代码出处](https://dev.to/kprotty/understanding-atomics-and-memory-ordering-2mom)

## Option类型数据后边加上一个？是什么意思
? 运算符是 Rust 中的一个错误传播运算符，它可以用于简化处理 Option 类型或 Result 类型的代码。? 运算符可以把 Some(T) 中的值 T 解包出来，或者在遇到 None 时提前从函数中返回 None。

? 运算符只能用于返回 Option 类型或 Result 类型的函数中，因为它需要提前返回 None 或 Err。? 运算符可以减少一些冗余的模式匹配或错误处理代码，让代码更简洁和清晰。

```rust
fn execute() -> Option<u8> {
    let data = Some(10u8);

    let result = data?;
    println!("{result}");
    Some(1)
}

fn main() {
    let res = execute();
    match res {
        Some(res) => println!("{res}"),
        None => println!("None"),
    };
}
```

## 如何切换rustc到 nightly 版本？
查看你已经安装
```sh 
rustup show
```
找到带有 `nightly` 的 toolchain 名，比如`nightly-2022-09-23-aarch64-apple-darwin`

```sh 
rustup default nightly-2022-09-23-aarch64-apple-darwin
```

如果没有找到，说明你之前没有安装`nightly`的 toolchain：
```sh 
rustup install nightly
```

## toolchain component target 联系？
component说的是rust标准库和编译器插件，不包含编译器；

target说的是交叉编译的目标环境，rust会把编译自身的代码为一种中间代码，然后需要另一个工具编译为具体平台下的代码，这就是target要做的事情；

toolchain是一套开发工具，包括component target rust编译器，提供给使用者构建项目、编译代码、运行测试的功能，cargo rustc 都包含在内；


## `async` `await` `Future` `impl Future` `poll` `异步运行时`有什么联系？
`async` 修饰的函数或者代码块，会被Rust编译器转化为实现`Future`的对象，并且给出 `poll`
方法。

`await`只能用于`async`函数或代码块中，会被Rust编译器转化为`poll` 方法的调用。

编程者可以自行为一个struct实现 `Future` trait, 为其编写 `poll` 方法，而这个实现 `Future`的对象，和Rust编译器生成的`Future`对象没有本质区别。

Rust编译器在`async`函数或者代码块中，通过`await`，可以给出何时调用`Future`的 `poll` 方法，但是对于编程者自行实现的`Future`对象，由于没有 `await` 的存在，
Rust编译器无法帮助完成`poll`的调用，这就需要 `异步运行时`去调用`poll`。

每次调用`poll`，`Future`对象作为状态机，其状态就会被处理一次，状态可能改变，也可能不变。

对于`async` `await` 实现的`Future`, 本质上就是`Future`对象里面包含`Future`对象，内部`Future`对象由Rust编译器实现调度，而外层的`Future`对象则不会，除非它位于另一个`Future`对象中，因此这种类型的`Future`对象就需要一个`异步运行时`来调度。

## 生命周期标记如何理解
在最开始学习阶段，我是阅读 rust 官方教程扫除疑惑的，但是后来在公司内网拜读了陈天老师的博客，豁然开朗，发现之前对Rust生命周期的理解有一部分是对的，有一部分是欠妥的。在这里，我们具体阐述一下。

生命周期标记出现在函数和结构体的定义中，具体看，就是这么个形式：
```rust 
// 结构体
struct M<'a, 'b> {
    value: &'a i32,
    name: &'b str,
}

// 函数
fn compare<'a,'b:'a>(
    value1: &'a i32, 
    value2: &'b i32
) -> &'a i32 {
    return value1;
}
```

只有借用才会有生命周期标记，像具体的值（i32, bool, String）, 原始指针（*const, *mut），不会存在生命周期标记。

在展开理解生命周期标记之前，必须要搞明白为什么需要生命周期标记。我之前没有理解全，就是因为没搞懂为什么需要生命周期标记，好在读了陈天老师的文章，把这块儿给补上了。

需要生命周期标记的原因很简单：Rust编译器在编译函数或者结构体的定义代码时，缺少上下文代码，无法确定函数参数或者结构体属性中，各个借用之间的生命周期时长关系，它不知道哪个生命周期长，哪个生命周期短，结果就是，编译器不知道函数返回值的生命周期、结构体的生命周期是怎样的。

函数生命周期：
```rust 
fn compare<'a, 'b>(value1: &'a i32, value2: &'b i32) {

}
```
每一个函数参数（借用类型的哦），都有独立的生命周期标记，就像上面展示的 `'a` 和 `'b`.

函数返回值（借用类型的哦）的生命周期，必须来自于函数参数。如果上述函数定义有一个借用类型的返回值，那么这个返回值的生命周期标记要么是 `'a`, 要么是 `'b`.

生命周期长的，可以被当作生命周期短的。假设 `'b` 的生命周期比 `'a` 的生命周期长，上面的函数完全可以写成:
```rust 
fn compare<'a>(value1: &'a i32, value2: &'a i32) {}
```
再强调一下，并不是说 value2 的生命周期真的和 value1 一样长，而是说，value2的生命周期可以当作value1的生命周期一样长，能够实现这一点的话，value2的生命周期要大于等于value1的生命周期。

结合一个具体的例子，再深刻理解下：
```rust 

fn compare<'a>(value1: &'a String, value2: &'a i32) -> &'a String {
    return value1;
}

fn main() {
    let source1 = String::from("hello");
    let m = &source1;
    {
        let n = &source1;
        {
            let t = 32;
            let t = &t;
            m = compare(n, t);
        }
    }
}
```
这个程序是 ok 的，其中，m,n和t一起结束的生命周期。

改写成这个样子，也是 ok 的：
```rust 

fn compare<'a>(value1: &'a String, value2: &'a i32) -> &'a String {
    return value1;
}

fn main() {
    let source1 = String::from("hello");
    let m = &source1;
    {
        let n = &source1;
        {
            let t = 32;
            let t = &t;
            m = compare(n, t);
        }
        println("{}", n);
    }
}
```
这个版本中，n 活得比t 久，根据生命周期标记，可以知道 t 的生命周期就是 'a，这也坐实了一点，生命周期久的 n，可以被当作生命周期'a处理。

继续改写，这个版本就报错了：
```rust 

fn compare<'a>(value1: &'a String, value2: &'a i32) -> &'a String {
    return value1;
}

fn main() {
    let source1 = String::from("hello");
    let m = &source1;
    {
        let n = &source1;
        {
            let t = 32;
            let t = &t;
            m = compare(n, t);
        }
        println!("{}", t);
        println("{}", m);
    }
}
```
错误是说，&t 的生命周期太短了。因为代码在后边打印了m，使得 m 存活的比 t 长，那么想要让打印 m 的代码成立，只能让 t 活得更久一些了。这个例子表示，返回值的生命周期标记是多少，其生命周期就应该是多少，不能多，也不能少。这一点，和函数入参的生命周期标记非常不同。


再看看结构体, 与函数情况差不多。

结构体每一个成员（借用类型哦），都有一个独立的生命周期标记。

生命周期长的成员，可以被当作是短的生命周期处理，使用短生命周期标记。

和函数不同的一点是，**结构体的生命周期不能大于其成员的生命周期**。这点非常重要。

下边的例子是 ok 的：
```rust 
struct M<'a> {
    value: &'a String,
    score: &'a i32,
}

fn main() {
    let source_1 = String::from("hello");
    let source_2 = 10;
    let mut c = M {
        value: &source_1,
        score: &source_2,
    };
    {
        let n = &source_1;
        {
            let t = 32;
            let t = &t;
            c = M { value: n, score: t };
        }
        println!("{}", n);
    }
}
```

如果改写成这个样子，就会报错：
```rust 
struct M<'a> {
    value: &'a String,
    score: &'a i32,
}

fn main() {
    let source_1 = String::from("hello");
    let source_2 = 10;
    let mut c = M {
        value: &source_1,
        score: &source_2,
    };
    {
        let n = &source_1;
        {
            let t = 32;
            let t = &t;
            c = M { value: n, score: t };
        }
        println!("{}", n);
        print!("{}", c.score);
    }
}
```
报错的信息是，&t 存活的时间不够长。这也很好理解，我们加入了打印代码，导致 c 存活的时间比 t 更长。要知道，结构体不能比它内部成员的生命周期长。要想让打印的代码成立，只能增大 t 的生命周期。为什么不是增大 n 的生命周期呢？因为代码中，n 和 c存活的一样久，不需要增大 n 的生命周期。从另一个角度看，t 是结构体里生命周期最短的成员，它决定了结构体是否比内部成员的生命周期长，理应提高t的生命周期。

最后，我们回顾一个问题，生命周期有多长，该怎么看呢？我想你一定会这样计算，从变量定义处开始，到变量再也不用的时候截止。这种理解是对的。但是，在理解函数、结构体的生命周期标记时，你可以灵活的理解。不去看变量存活的绝对时长，只需要看变量死的早晚，一个变量比另外一个变量死的早，就理解为它的生命周期更短。什么是变量死掉了呢？就是变量再也不被使用了。同时，不要把 drop函数调用，和变量死掉混为一谈。当变量死掉的时候，drop 函数不会调用，只有当离开作用域的时候，才会被调用：
```rust 
struct M {
    value: i32,
}

impl Drop for M {
    fn drop(&mut self) {
        println!("dead");
    }
}

fn main() {
    let mut m = M { value: 10 };

    {
        m = M { value: 11 };
        println!("ok");
    }

    println!("ok2");
}

// 打印结果是
// dead
// ok 
// ok2
// dead
```
第一个 dead，发生在重新给m赋值的时候；

在 ok 输出的时候，m其实就没再使用了，也就是死了，但是drop函数却是在 ok2 后边调用的！

<Giscus />