---
title: "coreutils解读"
page: true
aside: true
---

## Description
经常使用 `ps`, `whoami`工具，非常好奇它们是如何实现的，于是拜读了 coreutils 源码。代码采用
C语言编写，我不想纠结C语言的语法规则，只想了解原理，因此想一篇文章记录下。

## whoami 
print effective userid

1. 用 `geteuid()` 获取当前进程有效用户ID，计作 uid;
2. 用 `getpwuid(uid)` 获取 passwd 结构体；
3. 从 passwd->pw_name 获取用户名

:::tip <TipIcon />
geteuid 函数位于 unistd.h;
getpwuid 函数位于 pwd.h;
:::

## who 

读取 `/var/run/utmpx` 文件内容，依次将用户信息打印出来即可