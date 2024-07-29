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

## markdown-it
将markdown渲染为html的工具

## markdown-it-container
markdown-it的一个插件，可以让你将：

```txt
::: a
hello
:::
```

转化为:

```txt
<div class="a">
hello
</div>
```

你当然也可以渲染成别的html要素，这个插件开放了这种能力，你可以根据喜好，自己决定到底要渲染成什么

## shiki
编程语言语法高亮工具，兼容vscode theme生态

vitepress对markdown中代码的高亮渲染，就是使用这个工具


## hast-util-to-html
将 hast 转化为 html 的工具

html是一种DSL，它没有提供AST的工具，因此只能通过DOM数遍历各个节点，
而hast给出了html的AST定义，也就是说，给出一个html的字符串，hast就可以
将它转化为AST，不再依赖浏览器，这样你就可以基于AST，来随心所欲的修改
html的内容

shiki内部就依赖 hast-util-to-html

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


## gray-matter
解析 front matter 的工具；

在markdown文件开头，你会看到这样的内容：
```markdown
---
theme: black
name: Julie
---

# Description
hello world
```
开头两个`---`之间的内容，就是 front matter，根据内容采取的格式，又分为 `yaml front matter`,
`json front matter`, `javascript front matter` 等等。使用 `gray-matter` 处理上述内容
后，就可以得到一个js对象，theme 和 name 的值就存在该对象的 data 属性上。


> react官网使用了该库，去处理 mdx

<Giscus />
