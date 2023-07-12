---
title: "个人学习项目"
page: true
aside: true
---

# 个人学习项目

## [c++入门教程](https://github.com/zhangzhuang15/Step-Cplusplus.git)
如果你想入门`C++`，本项目提供了`C++`常用的基本概念和语法，每个知识点都会用一个特别小的demo代码说明，demo代码非常简单，而且真的不长，代码注释中都有学习引导，跟着注释走就可以一点点学起`C++`。

如果你发现哪个小节demo代码难于理解，请提issue，我会去改。我最讨厌复杂的东西，越简约，才越美。


## [shell用法教程](https://github.com/zhangzhuang15/short-shell.git) 
本项目是我在使用shell的时候，做的一些语法、用法总结，可供新手学习，也可以作为参考书，在想不起来的时候查阅。

如果你遇到了哪些新鲜的shell知识，可以提供 PR，注意哦，一定是有用的shell，各种炫技、花里胡哨的PR不接受。

## [git用法总结](https://github.com/zhangzhuang15/git-command.git)  
本项目是我对常用情境下git指令的总结，可以在写代码时查阅使用，建立此项目的原因很直白，我懒得记忆那么多的git指令。

如果你工作中常用的git指令没有出现在此项目中，欢迎提PR补充👏。

## [前端技术总结](https://github.com/zhangzhuang15/JSLook.git)
本项目目前包含了这些内容：
- 前端面试常见题目
  
- Bing给出的一些前端问题的回答
  
- nodejs常用API介绍，带有简短的demo
  
- vscode前端插件推荐
  
- `node js` `node ts` `React` `Vue` 调试方法
  
- express用法demo
  
- javascript常用的API介绍，带有简短的demo
  
- node如何调用wasm（Go版本生成的wasm）
  
- node扩展模块开发demo（Rust版本和Cpp版本）
  
- 如何开发npm可执行程序（vue-cli, pm2就是这类程序）
  
- 各种配置文件解析（`rollup` `package.json` `eslint` `tsconfig`）
  
- 技术专题探究
  - LRU模拟
  - Promise的实现
  - Function.prototype.call的模拟
  - websocket的实现
  - 连接池的实现
  - service worker的使用
  - web worker的使用
  - 用function模拟class关键字
  - event source获取服务端推送
  - jsonp的实现
  - 常用的工具函数，比如判断当前平台、设置cookie、获取路由信息、本地存储管理、获取视口尺寸等等
  - 浏览器是否跟随系统进入暗黑模式

如果你有新鲜的技术专题探究，欢迎提PR补充。

## [What Unix API](https://github.com/zhangzhuang15/what-unix-api)
参考《Unix环境高级编程》, 给出Unix System API的demo，目前已经有的内容包括但不限于：
- 进程相关的API， `fork` `wait` `waitpid` `exit` `exec` `system` `setsid`
- 文件IO相关的API， `dup` `dup2` `fcntl` `fsync` `lseek` `open` `read` `write`
- 文件相关的API，`access` `chdir` `chmod` `chown` `link` `mkdir` `stat` `umask`
- 高级IO相关，`readv` `writev` `select` `异步IO` `非阻塞IO`
- 线程同步相关，`信号量` `互斥锁` `条件变量` `读写锁` `自旋锁` `内存屏障`
- 信号处理， `kill` `sigaction` `signal` `sigset` `sigqueue` `sigsuspend` `sigprocmask`
- c语言如何按照平台条件编译
- c语言内联汇编
- 动态链接库和静态链接库
- 容易混淆的c工具概念介绍

虽然是一个前端工程师，但是对系统编程非常感兴趣，一边学习《Unix环境高级编程》，一边想写一些demo落实学习成果，
于是有了本项目。更进一步讲，Rust已经走近前端，其拥有ts js的语法，但却是和Cpp一样的系统编程语言，很好地促进
前端开发者学习系统编程。我想，未来每一个前端er都可以利用Rust完成系统编程。但光掌握语言语法不行，还要学习其背
后的理论，这就是Unix，也就是本项目所追寻的。