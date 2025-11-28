---
title: "Rust的命令行工具"
page: true
aside: true
---

# Rust 的命令行工具

集中介绍`rustc` `cargo` `rustup`如何用。

## `rustc`

### 查看`rustc`的根目录

```shell
rustc --print sysroot
```

### 查看`rustc`都支持编译出哪些类型的 target

```shell
rustc --print target-list
```

### 查看`rustc` 的 `-C` 可以设置哪些参数

```shell
rustc -C help
```

## `cargo`

### build 的时候，如何指定`rustc`参数

执行`cargo build`的时候，最终环节都是执行`rustc`，如果你想告诉 cargo 传哪些参数给`rustc`，可以这样做。

1. 环境变量指定

```shell
RUSTFLAGS="-C prefer-dynamic" cargo build
```

2. 在`cargo.toml`指定

```toml
[profile.release]
rustFlags=["-C","prefer-dynamic"]
```

### 如何改写`cargo build --release`的行为

执行`cargo build`，cargo 会按照默认的`dev profile`规则编译项目；

执行`cargo build --release`，cargo 会按照默认的`release profile`规则编译项目。

因此，要想改写 build 的行为，就是在`cargo.toml`修改 profile：

```toml
[profile.dev]
opt-level=3

[profile.release]
opt-level=3
```

## `rustup`

### 查看安装了哪些工具链，当前用的是什么工具链，这些工具链存储在哪个位置

```shell
rustup show
```

output for example:

```txt
Default host: aarch64-apple-darwin
rustup home:  /Users/zhangzhuang/.rustup

installed toolchains
--------------------
stable-aarch64-apple-darwin
nightly-aarch64-apple-darwin (active, default)
nightly-2023-10-05-aarch64-apple-darwin

active toolchain
----------------
name: nightly-aarch64-apple-darwin
active because: it's the default toolchain
installed targets:
  aarch64-apple-darwin
  aarch64-apple-ios
  aarch64-apple-ios-sim
  x86_64-apple-ios
```
