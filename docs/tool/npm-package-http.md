---
title: "http相关"
page: true
aside: true
---

# http相关

## Description

http 应用开发相关的库，包含框架，也包含处理 http 协议下有关部件的库，比如处理 mimetype

## ws

快速、小巧的 websocket 客户端、服务端的工具

## mime-types

查询文件所对应的 mime 格式全名

## etag

生成 http 的 ETag 内容

## selfsigned

Generate a self signed x509 certificate from node.js.

## jsonwebtoken

生成和管理 JWT 的工具。

## qs

处理 url query 参数

## tcp-port-used

检测某个 port 是否被 tcp 的 socket 占用

> 在其提供的接口里，有个接口比较有意思，就是在判断某个端口被占用的情况下，等待这个端口被释放，并返回一个 Promise。在实现的思路上，就是 Promise + setTimeout + socket event 组合出来的。
> 如果不立即使用一个 Promise，而是将 Promise 的 resolve 和 reject 捕捉出来，在之后的逻辑中使用，就称这个 Promise 为 deferred Promise.

## js-cookie

处理 cookies

## history

在原生的 History API 上提供兼容和功能扩展，用起来更舒服。

## express

web server framework

## cors
express middleware, resolving CORS problem

## helmet
express middleware, set related http headers, keep your app more safe

## winston
express middleware, provide versatile logging

## koa

so light web server framework

## connect

high performance server framework

used by `vite`

## nest

server framework inspired by spring boot maybe.

supports many transport protocol including http;

## axios

http 请求库

## umi-request

阿里巴巴开源的一款 http 客户端，支持浏览器和 node 环境，与 axios 功能相同。

## fly.js

http 请求库， nodejs、移动端、浏览器、React Native 均可

<Giscus />
