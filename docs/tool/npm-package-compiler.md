---
title: "代码编译相关的库"
page: true
aside: true
---

# Description
前端编译相关的库，比如：
- 生成AST
- 遍历AST
- 变换源代码

## magic-string

使用者：`rollup`

## swc

使用者：`rollup`

## esbuild

使用者: `vite`

## estree-walker

遍历符合 [ESTree Spec](https://github.com/estree/estree) 的 AST


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

## @jridgewell/sourcemap-codec
sourcemap 编码和解码库

使用者：`rollup`


## postcss

处理 css 代码的工具

## postcss-selector-parser

postcss 生态中，处理 css selector 的工具；

你可以用这个工具，给 css selector 加入属性修饰：
`.hello {}` => `.hello[data-s="2"] {}`


## postcss-modules

postcss 的一个插件，实现 css module；


## remark

unified 生态的一环，将 markdown 内容转化为语法树，用户可以遍历访问、修改语法树，
基于更新后的语法树，生成新的 markdown 内容 或者 转化为 html

unified 库提供了语法树概念上的抽象，搭建了一套接口，其他插件接入其中，实现不同的功能，
类似于 webpack 在打包方面的作用；

unified 库所说的语法树，不仅限于某种语言，解析语法树也是插件，因此可以解析 markdown
javascript html yml 等等内容的语法树

remark 是基于 unified 和 unified生态里的插件实现的；

## unist-util-visit
只要是符合 unist 标准的抽象语法树，都可以用这个库遍历节点；

:::tip <TipIcon />
hast 实现了 html 转为 unist 标准的抽象语法树；

mdast 实现了 markdown 转为 unist 标准的抽象语法树；

xast 实现了 xml 转为 unist 标准的抽象语法树；

unist 和 unified 联系在于，unified 采用了 unist 标准实现了抽象语法树
:::

使用者：react官网

## reprism
对于prism的封装，更好地支持 webpack, rollup等bundler工具；

你可以：
- 高亮代码
- 将代码tokenize

使用者：@jscpd/core

<Giscus />