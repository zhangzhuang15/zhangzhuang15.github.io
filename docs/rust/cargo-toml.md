---
title: "Rust配置文件"
page: true
aside: true
---

# Description
记录一些关于`Cargo.toml`有用的信息，方便以后回顾

## 工作区依赖
项目采用monorepo, 管理多个cargo项目。这些子项目中，有一些依赖包是相同的，
你不想单独安装它们，就可以把它们上升到 workspace 级别的依赖，方便子项目
共享。

总项目下的 Cargo.toml:
```toml
[workspace.dependencies]
## 加入依赖包
## 作为示例
A = { version = "1.0.0" }
```

子项目的 Cargo.toml:
```toml
[dependencies]
A = { workspace = true }
```

## 依赖包alias
依赖包本身的名字可能不太友好，你想在引用它们的时候给起个别名，方便记忆。

假设依赖包的 Cargo.toml：
```toml
[package]
name = "_uuid_mypro"
```

Cargo.toml 位于 `/A/B/C`目录下；

你就在自己的 Cargo.toml 中这样引用：
```toml
[dependencies]
hello = { package = "_uuid_mypro", path = "/A/B/C" }
```

这样你就可以这样引入：
```rs
use hello::*;
```

## 自定义入口文件
默认情况下，入口文件是 `src/main.rs`. 但是，很有可能项目有多个入口文件。

你就可以这样定义：
```toml
## 入口文件 src/bin/hello.rs
[[bin]]
name = "hello"

## 入口文件 src/bin/why.rs
[[bin]]
name = "why"

## 自定义入口文件位置
[[bin]]
name = "practice"
path = "src/practice/main.rs"
```

这些入口文件都是独立的crate，如果你的package name 是 `jack`，这些
入口文件可以这样访问package的public API:
```rs
// src/bin/hello.rs
use jack::a::hello;
```

```rs 
// src/lib.rs
pub mod a {
    pub fn hello() {}
    fn why() {}
}
```

这些入口文件也可以访问package的dependencies.


## 怎么选择库类型
如果你的库用于另一个Rust程序：
```toml 
[lib]
crate-type = ["lib"]
```

如果你的库是操作系统动态库，给别的编程语言调用：
```toml
[lib]
crate-type = ["cdylib"]
```


如果你的库是操作系统静态库，给别的编程语言调用：
```toml
[lib]
crate-type = ["staticlib"]
```

如果你的库是用于Rust应用的动态库：
```toml
[lib]
crate-type = ["dylib"]
```

如果你的库是用于Rust应用的静态库：
```toml
[lib]
crate-type = ["rlib"]
```
