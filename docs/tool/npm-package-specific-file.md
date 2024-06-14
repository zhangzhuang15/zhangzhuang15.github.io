---
title: "specific file"
page: true
aside: true
---

## Description

具体类型文件的处理：

- .env 文件
- Excel 文件
- css 文件
- markdown 文件

## dotenv

读取.env 文件到 process.env 中

## js-xlsx

解析、编写 excel


## remarkable

将 markdown 转化为 html, 你可以根据喜好，按照 API 接口约定，在转化中，加入
你对 markdown 的个性化设置和修改

## remark

unified 生态的一环，将 markdown 内容转化为语法树，用户可以遍历访问、修改语法树，
基于更新后的语法树，生成新的 markdown 内容 或者 转化为 html

unified 库提供了语法树概念上的抽象，搭建了一套接口，其他插件接入其中，实现不同的功能，
类似于 webpack 在打包方面的作用；

unified 库所说的语法树，不仅限于某种语言，解析语法树也是插件，因此可以解析 markdown
javascript html yml 等等内容的语法树

## @codemirror

@codemirror 是 scope package 的 scope，代表了一套 package 合集；

用它可以实现 editor 展示，也可以在 editor 中进行输入交互

## highlight.js
将代码高亮

## prismjs
将代码高亮

## sql-formatter
格式化 SQL 代码

## monaco-editor
vscode内置的代码编辑器

## jsondiffpatch
获取两个json之间的差异

## vue-json-viewer
json文件预览器组件

## vue-json-editor
json文件编辑器

<Giscus />
