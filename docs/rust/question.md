---
title: "Rust疑问解答"
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

```rust
let s = "hello
world
right";
println!("{}", s);

// 输出结果：
// hello
// world
// right



let s = "hello
  world
right";
println!("{}", s);

// 输出结果：
// hello
//   world
// right


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


let s = "\
hello
world
right";
println!("{}", s);

// 输出结果：
// hello
// world
// right



let s = "\
  hello
world
right";
println!("{}", s);

// 输出结果:
//  hello
// world
// right


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

<Giscus />
