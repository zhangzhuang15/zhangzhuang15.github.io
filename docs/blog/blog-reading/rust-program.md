---
title: "Rust"
page: true
aside: true
---

## Future async await


## FnOnce FnMut Fn


## How to use Trait


## Trait Object
```rust 
trait Drawable {
    fn draw(&self);
}

struct Circle;
impl Drawable for Circle {
    fn draw(&self) {
        println!("Drawing a circle");
    }
}

struct Square;
impl Drawable for Square {
    fn draw(&self) {
        println!("Drawing a square");
    }
}

fn main() {
    let shapes: Vec<Box<dyn Drawable>> = vec![
        Box::new(Circle),
        Box::new(Square),
    ];

    for shape in &shapes {
        shape.draw();
    }
}
```

`dyn Drawable` 表示的就是 Trait Object，`Box::new(Circle)`就会在运行时转化为如下的数据结构：
```txt
Box<dyn Drawable> {
    vtable: &VTable<Drawable>,
    data: Circle { /* 数据 */ }
}

VTable<Drawable> {
     draw: &Circle::draw,
    // 其他方法（如果有的话）
}
```

当调用 shape.draw() 时，Rust 会执行以下步骤：
1. 获取虚拟表：从 `Box<dyn Drawable>` 中获取虚拟表指针。
2. 查找方法：在虚拟表中查找对应的方法指针。
3. 调用方法：通过方法指针调用实际的方法实现。

使用 Trait Object 要千万留意泛型：
:::code-group
```rust [example1.rs]
trait Drawable<T> {
    fn draw(&self);
    fn say(&self, v: T);
}

struct Circle;
impl Drawable<String> for Circle {
    fn draw(&self) {
        println!("Drawing a circle");
    }
    fn say(&self, v: String) {
        println!("{}", v);
    }
}

fn main() {
    // works
    let t: Box<dyn Drawable<String>> = Box::new(Circle);
    t.draw();
    t.say("hello".to_string());
}
```
```rust [example2.rs]
use std::fmt::Display;
trait Drawable {
    fn draw(&self);
    fn say<T: Display>(&self, v: T);
}

struct Circle;
impl Drawable for Circle {
    fn draw(&self) {
        println!("Drawing a circle");
    }
    fn say<T: Display>(&self, v: T) {
        println!("{}", v);
    }
}

fn main() {
    // doesn't work!
    let t: Box<dyn Drawable> = Box::new(Circle);
    // doesn't work!
    t.draw();
    // doesn't work!
    t.say("hello".to_string());
}
```
:::


## Lifetime