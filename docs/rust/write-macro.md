---
title: "编写宏"
page: true
aside: true
---

## Description 
总结如何编写宏

## 初步认识
在Rust中，你会见到这样的代码：
```rs 
use async_trait::async_trait;

#[derive(Debug)]
struct M {
    age: u8,
}

#[async_trait]
trait Hello {
    async fn say_hello() -> String;
}

fn main() {
    println!("hello world");
}
```

像 `println!` 这样的，就是声明宏(Declarative Macro)。

像`#[derive(Debug)]` 和 `#[async_trait]` 这样的，就是过程宏(Procedural Macro)。不过，有些长得和`println!`相像的宏，也可能是过程宏。我们只能大致地从宏使用时的外貌来判断它们的种类。

过程宏和声明宏的定义方式是不同的，后文会详细说到。总的来说，过程宏比声明宏更灵活，它操作的是语法树。而声明宏就像c语言里边的宏，是通过格式匹配，替换成新的代码。

## 声明宏 
一般来讲，我们习惯把声明宏定义在`macro.rs`的文件中，就像下面这个样子定义：
```rs  
// macro.rs 
macro_rules! hello {
    ($expr: expr) => {
        println!("hello {}", $expr);
    };
    ($expr: expr, $name: ident) => {
        let $name = 10;
        println!("hello {}", $expr);
    };
    ($expr: expr, $name: ident, $age: ident) => {
        {
            let $name = 10;
            let $age = 8;
            println!("hello {}", $expr);
        }
    }
}
```

然后这样使用：
```rs  
// main.rs

#[macro_use]
mod macro;

fn main() {
    hello!("Peter");
}
```

接下来，我们具体说说声明宏会被替换成什么。

```rs  

fn main() {
    hello!("Peter");
}
```
会被替换为:
```rs  
fn main() {
    println!("hello {}", "Peter");;
}
```
为什么会有两个分号呢？

实际上是这样的， `hello!("Peter")` 会匹配 `hello` 的第一个定义，然后替换成 `{}` 里边的内容；而 `hello`的第一个定义中，`{}` 内的`println!`末尾有一个分号，因此这两个分号里的第一个分号，就是这个分号，而第2个分号，才是`hello!("Peter");`的分号。

明白了这一点，下边的替换结果就不难理解了。
```rs 
fn main() {
    hello!("Peter", name);
}
```
替换成：
```rs  
fn main() {
    let name = 10;
    println!("hello {}", "Peter");;
}
```

<br>

```rs  
fn main() {
    hello!("Peter", name, age);
}
```
替换成：
```rs   
fn main() {
    {
        let name = 10;
        let age = 8;
        println!("hello {}", "Peter");
    };
}
```
<br>

目前为止，说的都是比较简单的定义。还有一种定义长这个样子，运用了repetition:
```rs  
macro_rules! hello {
    ($($expr: expr);*) => {
        println!($($expr),*)
    }
}
```
`$($expr: expr);*`的意思是匹配任意数量用`;`隔开的表达式。我们看看它的替换效果就明白了。
```rs  
fn main() {
    hello!("hello {} {}";"yes";1);
}
```
替换成：
```rs  
fn main() {
    println!("hello {} {}", "yes", 1);
}
```

通配符除了`*`，还有：
- `+`, 表示至少重复一次；
- `?`, 表示没有出现或者只出现一次

请注意，`$($expr: expr);*`不要用正则表达式去理解。如果用正则表达式理解， `"hello";23` 是无法匹配的，因为23后边少了一个分号。另外一点，一旦匹配上，`$expr`表达的是所有匹配项，不代表个体，因此在使用的时候，不能单独使用，必须利用`$($expr)*`这种通配方式。

有些细节也值得看看。

```rs   
fn main() {
    hello!("hello", 1 + 2);
}
```
如果这么定义宏：
```rs  
macro_rules！ hello {
    ($($expr: expr),*) => {
        {
            $(
                $expr;
            )*
        }
    }
}
```
替换之后就是：
```rs  
fn main() {
    {
        "hello";
        1+2;
    };
}
```

如果这么定义：
```rs  
macro_rules！ hello {
    ($($expr: expr),*) => {
        {
            $(
                $expr
            );*
        }
    }
}
```

替换之后就是：
```rs  
fn main() {
    {
        "hello";
        1+2
    };
}
```
`1+2`后边少了一个分号。

如果这么定义：
```rs  
macro_rules！ hello {
    ($($expr: expr),*) => {
        {
            $(
                let m = $expr
            );*
        }
    }
}
```
替换之后就是：
```rs  
fn main() {
    {
        let m = "hello";
        let m = 1+2;
    };
}
```
分号又回来了。

如何查看宏替换后的结果，[看这里](/rust/question.html#如何查看宏展开后的代码)

说了这么半天，你一定想知道`$expr: expr` 冒号后边的 `expr`，是什么意思，除了它之外，还有没有别的选项。

`$expr`理解为变量名，`: expr` 就是定义类型。接下来，我们就说说都有哪些类型。

### expr 
比如这些
- literal expression: `"hello"` `1` `"👍"`;
- path expression: `Some::<i32>`;
- operator expression: `1 + 2`, `true || false`, `1 & 2`, `&ptr`, `*ptr`;
- grouped expression: `(1 + 2)`;
- array expression: `[1,2,3,4]`, `[0;20]`;
- index expression: `array[3]`;
- tuple expression: `(1, true, 2.0, "hello")`;
- struct expression: `Man { name: "Peter" }`, `Point(10, 20)`;
- call expression: `add(1,2)`;
- method call expression: `"3.12".parse()`;
- field expression: `array.length`;
- continue expression: `continue a`;
- break expression: `break a`;
- range expression: `1..10`, `..4`, `1..=9`;
- return expression: `return 10`;
- underscore expression: `let _ = 01`;
- block expression: `{ let m = 10; m }`;
- if expression: `if a == 2`;
- while expression: `while a < 3`;
- type expression: 
    - array type expression: `[i32;3]`
    - tuple type expression: `(u32, String)`
    - slice type expression: `&[i32]`
    - infered type expression: `Vec<_>`

表达式的特征：
1. 表示一种计算，返回一个值或类型；
2. 不以分号结尾；

### block  
就是 block expression, 如 `{ let m = 10; m }`

### ident 
表示的是符号名（变量名，函数名， 类型名）或者关键字（while, if, loop, let, mut等等）

### item 
比如这些
- module item: `mod a;`, `mod a { fn hello() {} }`
- extern item: `extern crate tokio;`;
- use declaration item: `use a::hello;`;
- function item: `fn hello() {}`;
- typealia item: `type Point = (u32, u32);`;
- enum item: `enum Hobby { Basketball, Football }`;
- struct item: `struct M { name: String, age: u8 }`;
- union item: `union N { a: float, b: u32 }`;
- const item: `const a: u8 = 10;`;
- static item: `static m: u8 = 10;`;
- trait item: `trait Say { fn speak(); }`;
- impl item: `impl Say for M { fn speak() {} }`;

item的特征：
1. 给出某种定义，如类型定义，函数定义，变量定义；
2. 末尾有一个分号；
3. 肯能包含表达式；

### stmt
- let stmt: `let a = 10;`;
- expression stmt: `if a > 10 { return 5 }`, ` 1 + 2;`;
- 上一节的item 

stmt是statement, 更大的概念，包含expr和item。


### ty  
说的是 type expression, 比如 `i32` `bool` `String` `[i32;3]` `&String` `const* i32`

### vis 
可见性，比如 `pub` `pub(crate)` `pub(super)`

### path 
说的是 type path expression, 比如 `::A::B::C::D` `FnMut(u32) -> ()`

### meta 
匹配的是宏内的meta属性，比如`#[cfg(target_os = "macos")]` 的 `tcfg(target_os = "macos")`就是 meta 

### pat
模式匹配，比如 
```rs  
fn main() {
    let a = 10;
    let result = match a {
        1..11 => true,
        _ => false,
    };
    let m: (u8, bool) = (10, false);
    let result = match m {
        (first, _) => first,
        _ => 0,
    };
}
```
里边的 `1..11`, `(first, _)` 就是pat;
