---
title: "个人学习项目"
page: true
aside: true
---

# 个人学习项目

## [c++入门教程](https://github.com/zhangzhuang15/Step-Cplusplus.git)

如果你想入门`C++`，本项目提供了`C++`常用的基本概念和语法，每个知识点都会用一个特别小的 demo 代码说明，demo 代码非常简单，而且真的不长，代码注释中都有学习引导，跟着注释走就可以一点点学起`C++`。

如果你发现哪个小节 demo 代码难于理解，请提 issue，我会去改。我最讨厌复杂的东西，越简约，才越美。

## [shell 用法教程](https://github.com/zhangzhuang15/short-shell.git)

本项目是我在使用 shell 的时候，做的一些语法、用法总结，可供新手学习，也可以作为参考书，在想不起来的时候查阅。

如果你遇到了哪些新鲜的 shell 知识，可以提供 PR，注意哦，一定是有用的 shell，各种炫技、花里胡哨的 PR 不接受。

## [git 用法总结](https://github.com/zhangzhuang15/git-command.git)

本项目是我对常用情境下 git 指令的总结，可以在写代码时查阅使用，建立此项目的原因很直白，我懒得记忆那么多的 git 指令。

如果你工作中常用的 git 指令没有出现在此项目中，欢迎提 PR 补充 👏。

## [前端技术总结(JSLook)](https://github.com/zhangzhuang15/JSLook.git)

本项目目前包含了这些内容：

- 个人前端面试遇到的题目
- Bing 给出的一些前端问题的回答
- nodejs 常用 API 介绍，带有简短的 demo
- vscode 前端插件推荐
- `node js` `node ts` 等调试方法
- express 用法 demo
- javascript 常用的 API 介绍，带有简短的 demo
- node 如何调用 wasm（Go 版本生成的 wasm）
- node 扩展模块开发 demo（Rust 版本和 Cpp 版本）
- 如何开发 npm 可执行程序（vue-cli, pm2 就是这类程序）
- 各种配置文件解析（`rollup` `package.json` `eslint` `tsconfig`）
- 技术专题探究
  - LRU 模拟
  - Promise 的实现
  - Function.prototype.call 的模拟
  - websocket 的实现
  - 连接池的实现
  - service worker 的使用
  - web worker 的使用
  - 用 function 模拟 class 关键字
  - event source 获取服务端推送
  - jsonp 的实现
  - 常用的工具函数，比如判断当前平台、设置 cookie、获取路由信息、本地存储管理、获取视口尺寸等等
  - 浏览器是否跟随系统进入暗黑模式

如果你有新鲜的技术专题探究，欢迎提 PR 补充。

## [What Unix API](https://github.com/zhangzhuang15/what-unix-api)

参考《Unix 环境高级编程》, 给出 Unix System API 的 demo，目前已经有的内容包括但不限于：

- 进程相关的 API， `fork` `wait` `waitpid` `exit` `exec` `system` `setsid`
- 文件 IO 相关的 API， `dup` `dup2` `fcntl` `fsync` `lseek` `open` `read` `write`
- 文件相关的 API，`access` `chdir` `chmod` `chown` `link` `mkdir` `stat` `umask`
- 高级 IO 相关，`readv` `writev` `select` `异步IO` `非阻塞IO`
- 线程同步相关，`信号量` `互斥锁` `条件变量` `读写锁` `自旋锁` `内存屏障`
- 信号处理， `kill` `sigaction` `signal` `sigset` `sigqueue` `sigsuspend` `sigprocmask`
- c 语言如何按照平台条件编译
- c 语言内联汇编
- 动态链接库和静态链接库
- 容易混淆的 c 工具概念介绍

虽然是一个前端工程师，但是对系统编程非常感兴趣，一边学习《Unix 环境高级编程》，一边想写一些 demo 落实学习成果，
于是有了本项目。更进一步讲，Rust 已经走近前端，其拥有 ts js 的语法，但却是和 Cpp 一样的系统编程语言，很好地促进
前端开发者学习系统编程。我想，未来每一个前端 er 都可以利用 Rust 完成系统编程。但光掌握语言语法不行，还要学习其背
后的理论，这就是 Unix，也就是本项目所追寻的。
