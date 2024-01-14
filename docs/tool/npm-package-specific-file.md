---
title: "specific file"
page: true
aside: true
---

## Description

具体类型文件的处理：

- sourcemap 文件
- .env 文件
- Excel 文件
- css 文件
- markdown 文件

## dotenv

读取.env 文件到 process.env 中

## js-xlsx

解析、编写 excel

## source-map-js

sourcemap 文件解析器和生成器

## merge-source-map

合并 sourcemap

比如有一段代码 A，经过 AST 转化后，变成代码 B，
那么 A 到 B 之间就会有一个 sourcemap-A；

如果将代码 B 再经过 AST 转化后，变成代码 C，
那么 B 到 C 之间就会有一个 sourcemap-B；

那代码 A 到代码 C 之间的 sourcemap 你就可以利用
merge-source-map 这个库，基于 sourcemap-A
和 sourcemap-B 得到。

## postcss

处理 css 代码的工具

## postcss-selector-parser

postcss 生态中，处理 css selector 的工具；

你可以用这个工具，给 css selector 加入属性修饰：
`.hello {}` => `.hello[data-s="2"] {}`

## postcss-modules

postcss 的一个插件，实现 css module；

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

<Giscus />
