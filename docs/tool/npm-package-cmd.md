---
title: "开发cmd"
page: true
aside: true
---

## Description

开发 cmd 这种类型的 app，常用到的 package;

比如要开发 http 服务器的 cmd，http 相关的库不会列举在此处，此处只聚焦原汁原味的 cmd 开发场景；

## commander

命令行参数解析库

使用者： vue-cli

## yargs

命令行参数解析库；

使用者： mocha

## cac

实现命令行 app 的工具库

使用者: vuepress vitest create-nuxt-app bumpp

## minimist

解析命令行参数

## chalk

终端彩色文字输出库

## picocolors

终端彩色文字输出库

使用者：vitepress

## ansi-color

终端彩色文字输出库

使用者： mocha

## progress

实现终端进度条

## ora

实现终端 spinner 提示

## figures

终端 Unicode 图标

## inquirer

终端用户输入交互

## prompts
终端的提示词交互

使用者：vitepress

## cli-highlight

将字符串高亮处理。

比如一段字符串的内容是 c 语言代码，直接输出到终端或者文件中时，字符串就是白色的，使用这个库处理后，这段字符串就会按照 c 语言进行高亮处理，变成彩色的。处理之后的字符串可以送入终端输出，也可存入文件。

> 这个库既可以在 node.js 代码中使用，也可以直接在终端作为 cli 程序使用。

## execa

更加人性化的进程 exec 工具

## cross-port-killer

跨平台的进程信号推送器，实现向某个进程发送信号

## concurrently

Run commands concurrently

## tree-kill

给一个进程以及它的后代进程发送信号

## portfinder

获取空闲 port 号

<Giscus />
