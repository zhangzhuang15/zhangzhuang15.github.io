---
title: "精彩好文"
page: true
aside: true
---

## rcore 操作系统教程
[阅读原文](https://rcore-os.cn/rCore-Tutorial-Book-v3/chapter0/index.html)

## How Browser Rendering Works
[阅读原文](https://blog.logrocket.com/how-browser-rendering-works-behind-scenes/)

## How Browsers Work
[阅读原文](https://web.dev/articles/howbrowserswork)

讲述浏览器分成哪几个功能模块，浏览器整体的工作流

## The Anatomy of a Frame
[阅读原文](https://aerotwist.com/blog/the-anatomy-of-a-frame/)

讲述浏览器在渲染一帧画面的时候，需要经过哪些步骤；

![](/anatomy-of-a-frame.svg)

## Preload Scanner
[阅读原文](https://web.dev/articles/preload-scanner)

讲述浏览器如何 parse html，如何利用 preload scanner 提前下载资源

## Script Evaluation
[阅读原文](https://web.dev/articles/script-evaluation-and-long-tasks)

使用 chrome devtool Performance 观察 main thread 的工作时，会看到标记为黄条的

- `Evaluate Script` 
- `Compile Script` 
- `Compile Code`


它们究竟代表什么意思，它们和script标签有什么联系呢？本文会告诉你答案

简单讲，`Evaluate Script` 包含 `Compile Script` 和 `Compile Code`;

`Compile Script`会将 javascript source code 编译为 bytecode，此时
javascript没有执行呢；

`Compile Code`会将 bytecode 编译为 machine code, 此时javascript就会执行；

:::tip <TipIcon />
编译单元可能是一个函数，一个代码块，甚至一句代码
:::

## Optimize Long Tasks
[阅读原文](https://web.dev/articles/optimize-long-tasks)

介绍如何优化长任务，提高程序交互体验


## 使用C语言实现协程
[阅读原文](https://mthli.xyz/coroutines-in-c/)


[阅读作者更多文章](https://mthli.xyz)


## Rust Runtime 设计与实现
[阅读原文](https://www.ihcblog.com/page/2/)

介绍如何实现一个异步io runtime


## GitHub Repositories Every Software Engineer Should Know
[阅读原文](https://dev.to/jrmarcio_/github-repositories-every-software-engineer-should-know-2e80)

介绍了github上有哪些仓库可以帮助软件工程师学习技术 


## algorithm complexity theory
[阅读原文](https://ycc.idv.tw/algorithm-complexity-theory.html)

介绍：
- P问题
- NP问题
- NP-Complete问题


## Rabin-Karp演算法的详细解析
[阅读原文](https://mark-lin.com/posts/20200625/)

本文介绍了，用于判定子字符串的算法——Rabin-Karp算法，通俗易懂，特别是里边介绍hash和rehash的段落，简单明了，非常精彩，不需要你拥有过多的离散数学基础。它使我搞明白了几件事：

1. 为什么hash算法中，要乘10^n
这种做法可以将字符所在的位置信息包含到最终hash中去，防止字符位置不同，但是hash相同，带来的hash冲突。

2. 为什么要在计算hash的时候取mod 
因为涉及到乘10^n的运算，防止这一步导致整数溢出。

3. 为什么mod一个非常大的质数
因为在正整数中，因式分解结果包含质数的数字相对较少，利用这个特点，采取mod运算，可以降低hash冲突。