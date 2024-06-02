---
title: "Rust FAQ"
page: true
aside: true
---

# 🤔️🤔️🤔️

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

<Giscus />