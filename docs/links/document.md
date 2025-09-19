---
title: "在线文档"
page: true
aside: true
---

# 在线文档
Online Book, official document, reference and manual handbook.

## 查阅aarch64汇编指令集
[A64 Base Instructions | ARM](https://developer.arm.com/documentation/ddi0602/2022-09/Base-Instructions?lang=en)

## 计算机方面的论文查询
[arxiv.org](https://arxiv.org)

你阅读源码的时候，会在注释中发现，作者是依据某个论文实现的算法，你很想知道算法的更多细节，于是你就想下载那篇论文看看。你就可以在这个网站上寻找论文，它会提供大多数论文的PDF。

同类型网站还有：
- [dl.acm.org](https://dl.acm.org): 论文很全，但能免费下载的没有arxiv.org多
- [researchgate](https://www.researchgate.net/directory/publications): 专门用来搜索论文的
- [semantic scholar](https://www.semanticscholar.org): 也是用来搜索论文的，AI搜索驱动
- [dblp.org](https://dblp.org/search?q=database): 搜索论文用的
- [papers with code](https://paperswithcode.com/sota): 搜索论文用的，这个网站搜索出来的论文都是带有源码的，也提供一些论文的下载，论文下载的地址指向 arxiv.org。


## datatracker.ietf.org
[datatracker.ietf.org](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol)

在这个网站，你可以查阅到各种协议的**RFC**文档，比如 http protocol, web push protocol 等等

## RFC文档查询
[rfc editor](https://www.rfc-editor.org)

## www.w3.org
[www.w3.org](https://www.w3.org/)

浏览器API的标准文档、草案文档；

从中你可以知道调用某个API的时候，浏览器具体做了什么；

比如你不太懂 `Service Worker` 到底是怎么定义的，它的API实现中，浏览器具体要做哪些事情，就可以在这里搜索、查阅。

## GNU C Library 手册PDF
[gnu libc pdf](https://sourceware.org/glibc/manual/latest/pdf/libc.pdf)

手册全面介绍了gnu libc中各个函数的用法，供我们查看。

[GNU Operating system](https://www.gnu.org/savannah-checkouts/gnu/libc/index.html)

## GDB手册
[gdb manual](https://sourceware.org/gdb/current/onlinedocs/gdb.html/)

如果你在用gdb调试程序，但对gdb不属性，可以查看这个手册，了解gdb的用法和细节。

[GDB：The GNU Project Debugger](https://sourceware.org/gdb/documentation/)

## GCC手册
[gcc online documentation](https://gcc.gnu.org/onlinedocs/)

## C 系统编程接口手册
[前往](https://pubs.opengroup.org/onlinepubs/9699919799/functions/contents.html)

当你使用C语言进行系统编程时，想知道哪些操作系统接口可以使用，或者想实现某个功能但不知道该用哪个系统接口，就可以查阅这个手册。

## musl libc 
[前往](https://musl.libc.org)

## clang documentation
[clang documentation](https://clang.llvm.org/docs/)

## GNU make 手册
[gnu make](https://www.gnu.org/software/make/manual/html_node/index.html)

## binutils documentation
[前往](https://sourceware.org/binutils/docs/)

## whatwg.org
[whatwg.org](https://whatwg.org/)

MDN可以查询到各个 Web API 的定义，但是这些定义有时候并不准确，这时候就可以访问该文档，它是标准！只不过，它的可读性
不太强，不容易像MDN那么好理解。

## ECMAScript 标准
[ECMAScript 标准](https://tc39.es/ecma262/#sec-hostcalljobcallback)

javascript 语言的标准定义，当你不知道javascript某个语法或者API到底干了什么时，就可以阅读这个标准文档。

## Firefox Doc
[firefox | doc](https://firefox-source-docs.mozilla.org/devtools-user/debugger/how_to/use_a_source_map/index.html)

火狐浏览器的文档官网，里面记录了很多website方面的技术细节，比如介绍了火狐浏览器的spiderMonkey引擎、website调试。值得一看。

## chromium
[chromium | developers](https://www.chromium.org/developers/design-documents/multi-process-architecture/)

如果你想知道 chromium 内核是如何设计的，学习google工程师是如何构建 chromium 的，可以阅读其官方文档。当然，如果
对其它模块，比如渲染层面的实现，你比较好奇，也可以从这个网站中找到相关介绍的文档。这些文档读起来很干，但绝对是智慧所在。

## jwt
[jwt | introduction](https://jwt.io/introduction)

介绍 json web token 的细节。主要讲解了什么是JWT，JWT由哪些部分组成，JWT是如何工作的，我们为什么要用JWT。

## 北大编译实践在线文档
[前往](https://pku-minic.github.io/online-doc/#/preface/lab)

## 计算机教育中缺失的一课（中文版）
[前往](https://missing-semester-cn.github.io)

讲解计算机系学生应该掌握哪些计算机实用工具

## 清华大学rCore指导书
[rcore tutorial book v3](https://rcore-os.cn/rCore-Tutorial-Book-v3/)

讲解操作系统原理，并紧密结合rust代码，在讲解期间，串插讲解了一些非理论但很实用的知识，比如编译器工具。

## 南京大学操作系统课
[南京大学操作系统课](https://jyywiki.cn/OS/2022/index.html)

南京大学蒋炎岩老师的课程，强烈推荐。蒋老师的课程真正做到了实践和理论紧密结合，配合B站上的视频一起看，效果更佳。你不单单能学习到操作系统的理论知识，更能学到开发操作系统或者系统编程的工具。

## Write OS in Rust
[前往](https://os.phil-opp.com/paging-implementation/)

介绍了如何使用Rust开发OS的技术细节。

## OS Dev
[前往](https://wiki.osdev.org/Expanded_Main_Page)

一个wiki专题网页，专门介绍了如何开发OS，需要用哪些工具，遵从哪些流程，并附带了一些资料，比如UEFI、PIC、PCI、BootLoader等等。

## Typescript Deep Dive

[Typescript Deep Dive | README](https://basarat.gitbook.io/typescript/)

[Typescript Deep Dive(中文) | Why](https://jkchao.github.io/typescript-book-chinese/#why)

[github address](https://github.com/basarat/typescript-book/)

## The Modern JavaScript Tutorial

[The Modern JavaScript Tutorial | JavaScript.info](https://javascript.info/)

feature:

- 国外技术人搞的一套教程
- Javascript 语言体系中，各个知识点讲解
- 浏览器 DOM 相关内容讲解
- 通俗易懂，好理解

## Webpack Guidebook

[Webpack Guidebook](https://tsejx.github.io/webpack-guidebook/)

## Tech Interview Handbook

适用于准备外国公司的面试

[Tech Interview Handbook](https://www.techinterviewhandbook.org/software-engineering-interview-guide/)


## GNU Assembler
介绍C语言内联汇编指令，as命令行工具，obj文件格式；

[GNU Assembler](https://sourceware.org/binutils/docs/as/index.html#SEC_Contents)


## System Interfaces
查询 Unix系统调用；

[OpenGroup | System Interfaces: Detailed ToC](https://pubs.opengroup.org/onlinepubs/9699919799/functions/contents.html)


## GTK+
跨平台GUI的C代码库，主要用于linux桌面系统中，在macOS也可以使用。

[GTK+官网](https://docs.gtk.org/gtk3/)

## GLib
C代码库，GLib 提供了许多有用的功能，包括但不限于：

数据结构：如链表（GList）、哈希表（GHashTable）、动态数组（GArray）等。

字符串处理：如 GString、字符串实用函数等。

文件和 I/O：如 GFile、GIOChannel 等。

事件循环：如 GMainLoop、GSource 等。

线程和并发：如 GThread、GMutex、GCond 等。

[GLib官网](https://docs.gtk.org/glib/)

## OpenSSL
C代码库，用于加密、解密运算，https中就是使用了它。

[OpenSSL官网](https://docs.openssl.org/master/)

## spidermonkey
介绍浏览器引擎——spidermonkey，帮助你理解什么是浏览器引擎，开发一个浏览器引擎需要知道哪些知识。

[spidermonkey文档官网](https://spidermonkey.dev/docs/)

:::tip <TipIcon />
[mozilla浏览器js引擎的源代码](https://searchfox.org/mozilla-central/source/js)
:::

## Introduction to Computer Graphics
[Online book](https://math.hws.edu/graphicsbook/index.html)

This is an online book helping you learn computer graphics.

## oi wiki
[前往](https://oi-wiki.org/ds/bplus-tree/)

介绍众多数据结构的博客网站，比如笛卡尔树、替罪羊树、左偏红黑树、B++树、B树、线段树、划分树等等。

## Linux from Scratch
[前往](https://www.linuxfromscratch.org/lfs/view/stable/chapter02/hostreqs.html)

从0开始教你如何编译linux项目，在编译的过程中，顺便教你linux的内容