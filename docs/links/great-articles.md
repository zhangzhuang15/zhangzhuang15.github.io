---
title: "精彩好文"
page: true
aside: true
---

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