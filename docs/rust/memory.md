---
title: "Rust的内存操作"
page: true
aside: true
---

## Description
记录Rust内存操作的一些技巧

使用Rust的时候，因为所有权系统的完备，我们不需要自己管理内存。但是，在使用 unsafe Rust 编写一些基础库的时候，我们
仍需要懂得手动管理内存。

## Box::leak
使用`Box`将数据存储在堆内存，然后使用 `Box::leak`，让`Box`不在管理这块儿内存，并返回堆内存中的数据的借用；

这块儿堆内存需要我们自己管理，不再受Rust所有权系统管理；

如果想释放内存，可以使用`Box::from_raw`，这块内存从新交给
`Box`，然后Rust所有权系统就能管理内存，负责自动释放了。
