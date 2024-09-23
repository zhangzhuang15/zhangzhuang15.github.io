---
title: "辅助研发"
page: true
aside: true
---

## Description

这些 package 仅在研发的时候用到，不会打包到最终成品里，常常会在 package.json 的`scripts` 看到它们

## rimraf

A deep deletion module for node (like `rm -rf`)

## npm-run-all

提供 **并行执行** 和 **顺序执行** npm script 的功能；

它提供了 `run-p` `run-s` `npm-run-all` 等可执行程序，在流行的开源项目中广泛被使用，比如 `vite`

## only-allow

限制项目使用哪个包管理器

## cross-env

兼容 windows 和 unix，设置环境变量

## pm2

node 进程管理工具

## simple-git-hooks

git-hooks 的工具库，vite 项目中应用了这个库。比 husky 更简单，更友好。

## husky

git-hooks 的工具库，注册 git hook；

## lerna

mono-repo 管理工具

## js-correct-lockfile

检测 lockfile 匹配包管理器。

比如维护者用 yarn 开发，项目有 yarn.lock；

当贡献者使用 npm 开发时，会检测出 package.lock，然后警告贡献者使用 yarn


## jscpd
检测代码中是否存在copy的代码；

这个工具存在一些缺陷，比如一段代码，出现在3个以及以上的文件中，它无法报告所有的这些文件；

jscpd的基本原理是：
1. 用 reprism 将文件的内容解析为 tokens
2. 将 tokens 分成若干批次的小token组；
3. 计算每个token组的hash值；
4. 利用计算好的hash值，代入Karp Rabin算法，检测出token组之间是否重复；
5. 每个token组及其hash值会存储在一个全局的store对象中，如果跨文件存在相同的token组，它们的hash值就会是一样的，就可以在store里找到相同的token组

<Giscus />
