---
title: "精彩好文"
page: true
aside: true
---

# 精彩好文

## rcore 操作系统教程
[阅读原文](https://rcore-os.cn/rCore-Tutorial-Book-v3/chapter0/index.html)

## zephyrproject
[阅读原文](https://docs.zephyrproject.org/latest/introduction/index.html)

zephyrproject 是一个用c开发的嵌入式操作系统，里边介绍了很多操作系统的知识。作为一个操作系统，它原生支持用 c/c++/rust 开发系统上面的软件。

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

## c10k problem
[阅读原文](http://www.kegel.com/c10k.html)

## Let’s code a TCP/IP stack
[阅读原文](http://www.saminiir.com/lets-code-tcp-ip-stack-1-ethernet-arp/)

## 跟浩叔一起用GDB
[阅读原文](https://blog.csdn.net/haoel/article/details/2879)

## 跟浩叔一起写makefile
[阅读原文](https://blog.csdn.net/haoel/article/details/2886)

## The Secret To 10 Million Concurrent Connections -The Kernel Is The Problem, Not The Solution
[阅读原文](https://highscalability.com/the-secret-to-10-million-concurrent-connections-the-kernel-i/)

## The Twelve-Factor App
[阅读原文](https://12factor.net/)

## Avoid Over Engineering
[阅读原文](https://medium.com/@rdsubhas/10-modern-software-engineering-mistakes-bc67fbef4fc8)

## Instagram Engineering’s 3 rules to a scalable cloud application architecture
[阅读原文](https://medium.com/@DataStax/instagram-engineerings-3-rules-to-a-scalable-cloud-application-architecture-c44afed31406)

## Clean Architecture
[阅读原文](https://blog.cleancoder.com/uncle-bob/2011/11/22/Clean-Architecture.html)

## Concurrent Programming for Scalable Web Architectures
[阅读原文](https://berb.github.io/diploma-thesis/community/index.html)

## Scalable IO in Java
[阅读原文](http://gee.cs.oswego.edu/dl/cpjslides/nio.pdf)

## Lazy Asynchronous I/O For Event-Driven Servers
[阅读原文](https://www.usenix.org/legacy/event/usenix04/tech/general/full_papers/elmeleegy/elmeleegy_html/html.html)

## I/O Processing
[阅读原文](https://flylib.com/books/en/4.491.1.85/1/)

## Libevent 2.0 book
[阅读原文](http://www.wangafu.net/~nickm/libevent-book/)

## Libevent深入浅出
[阅读原文](https://aceld.gitbooks.io/libevent/content/)

## Libuv Design Overview
[阅读原文](https://docs.libuv.org/en/v1.x/design.html)

## Windows I/O Completion Ports
[阅读原文](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports)

## Understanding Reactor Pattern: Thread-Based and Event-Driven
[阅读原文](https://dzone.com/articles/understanding-reactor-pattern-thread-based-and-eve)

## Reactor Pattern
[阅读原文](https://www.dre.vanderbilt.edu/~schmidt/PDF/Reactor2-93.pdf)

## Andrei Alexandrescu: Lock-Free Data Structures
[阅读原文](https://erdani.org/publications/cuj-2004-10.pdf)

## Is Parallel Programming Hard, And, If So, What Can You Do About It?
[阅读原文](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html)

## 无锁队列的实现
[阅读原文](https://coolshell.cn/articles/8239.html)

## Simple, Fast, and Practical Non-Blocking and Blocking Concurrent Queue Algorithms
[阅读原文](https://www.cs.rochester.edu/~scott/papers/1996_PODC_queues.pdf)

## Secure programming
[阅读原文](https://dwheeler.com/secure-programs/)

## Hints for Computer System Design
[阅读原文](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/acrobat-17.pdf)

## Boosting site speed using brotli compression
[阅读原文](https://www.linkedin.com/blog/engineering/optimization/boosting-site-speed-using-brotli-compression)

## How eBay’s Shopping Cart used compression techniques to solve network I/O bottlenecks
[阅读原文](https://innovation.ebayinc.com/tech/engineering/how-ebays-shopping-cart-used-compression-techniques-to-solve-network-io-bottlenecks/)

## What every programmer should know about memory
[阅读原文](https://lwn.net/Articles/250967/)

讲述了详细的内存知识，每位程序工程师必读

## What every computer science major should know
[阅读原文](http://matt.might.net/articles/what-cs-majors-should-know/)

## C++ optimize
[阅读原文](https://agner.org/optimize/optimizing_cpp.pdf)

## Optimizing web servers for high throughput and low latency
[阅读原文](https://blogs.dropbox.com/tech/2017/09/optimizing-web-servers-for-high-throughput-and-low-latency/)

一篇非常底层的系统调优的文章，来自DropBox

## Linux Insides
[阅读原文](https://github.com/0xAX/linux-insides)

GitHub上的一个开源电子书，其中讲述了Linux内核是怎样启动、初始化以及进行管理的

## Red Hat Enterprise Linux Network Performance Tuning Guide
[阅读原文](https://access.redhat.com/sites/default/files/attachments/20150325_network_performance_tuning.pdf):

红帽出品的网络调优的文章

## Making Linux TCP Fast
[阅读原文](https://netdevconf.org/1.2/papers/bbr-netdev-1.2.new.new.pdf)

一篇非常不错的TCP调优的论文

## Computer Network Tutorials
[阅读原文](https://www.geeksforgeeks.org/computer-network-tutorials/)

计算机网络基础知识入门介绍的文章

## Monitoring and Tuning the Linux Networking Stack: Receiving Data
[阅读原文](https://blog.packagecloud.io/eng/2016/06/22/monitoring-tuning-linux-networking-stack-receiving-data/)

[姊妹篇： Monitoring and Tuning the Linux Networking Stack: Sending Data](https://blog.packagecloud.io/eng/2017/02/06/monitoring-tuning-linux-networking-stack-sending-data/)

## Congestion Avoidance and Control
[阅读原文](http://ee.lbl.gov/papers/congavoid.pdf)

拥塞控制的论文

## http2 explained
[阅读原文](https://http2-explained.haxx.se/en/part1)

介绍http2的免费电子书

## TCP流量控制可视化
[阅读原文](https://www2.tkn.tu-berlin.de/teaching/rn/animations/flow/)

## TCP滑动窗口可视化
[阅读原文](https://www2.tkn.tu-berlin.de/teaching/rn/animations/gbn_sr/)

## iptables详解
[阅读原文](https://www.zsythink.net/archives/1544)

介绍 iptables 命令是干什么用的，应该怎么用。

## Multiprocessor Support
[阅读原文](https://yushuanhsieh.github.io/post/2021-04-23-life/)

我们都知道CPU执行代码，但在现代CPU体系结构下，CPU拥有多个核心，那么问题来了，到底是哪个CPU在执行代码，是谁告诉某个CPU要执行代码的，PC接上电源启动后，所有的CPU核心都会工作么？操作系统是怎么让某些进程在特定的CPU核心上执行的？

这篇文章就给出了比较好的介绍。里边牵扯到很多概念，比如BSP（Bootstrap Processor）, AP(Application Processor), SIPI(Startup IPI), APIC(Advanced Programmable Interrupt Controller)。

另外，这篇文章的作者，是一个来自台湾的女性开发者（如果她的头像是本人的话），其经历很令人吃惊，她开始做的前端开发，一年后，做的后端开发，大概维持了两年，之后就很突然，她就从事硬件工程师的岗位，目前她就职台积电，硬件和软件通吃。

## create your own nodejs
[youtube地址](https://www.youtube.com/watch?v=ynNDmp7hBdo)

介绍了如何使用 v8, libuv 制作一个简易的nodejs。在这个视频中，你会了解到nodejs的最小原理，也是最本质的原理。简单来概括下，nodejs本质是对v8的拓展，是一个cpp程序。nodejs使用v8读取js代码，将其转化为cpp中的数据结构。v8提供了一种接口，将js中的函数、模块转化为cpp的函数、对象，比如js中的setTimeout就可以映射为cpp中的实现，即调用libuv，向eventloop中注册一个timer，由libuv来负责唤醒回调函数，而在setTimeout中传入的回调函数，也会被v8转化为cpp侧的数据结构，这样libuv就可以无缝运行了。由此可见，nodejs是在v8的基础上，使用cpp定义了本地文件系统、事件循环、多线程、多进程、http等模块，扩展了v8。nodejs最麻烦的地方，就是如何用cpp实现这些模块，如何跨端支持这些模块。

[视频中的源码链接](https://github.com/ErickWendel/myownnode)


## Back Propagation（梯度反向传播）实例讲解
[原文](https://zhuanlan.zhihu.com/p/40378224)

介绍神经网络里的前向传播和后向传播，特别是后向传播，解释得非常直观、清楚、非常好理解。

在阅读上述文章后，看看redis之父手写的一个3层神经网络小游戏c语言代码，会理解得更好，[Tic Tac Toe | Github](https://github.com/antirez/ttt-rl)