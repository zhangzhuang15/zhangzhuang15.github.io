---
title: "日志处理"
page: true
aside: true
---

## Description

## debug

输出日志信息的轻量级库，输出信息中自带执行时间

## invariant

错误输出管理器，功能上干的就是 throw 的事情，但输出的内容更加人性化。

`process.env.NODE_ENV === 'development'`时，给出更可读的错误信息；

`process.env.NODE_ENV === 'production'`时，相当于 throw, 给出原始的错误，看不到更可读的信息；

<Giscus />
