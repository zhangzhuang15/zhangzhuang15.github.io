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

将 markdown形式的字符串转化为语法树，用户可以遍历访问、修改语法树，
基于更新后的语法树，生成新的 markdown 内容 或者 转化为 html

remark本质上就是安装插件remark-parse和remark-stringify的unified。


## unified

unified，它定义了AST Node，这个定义很宽松，让Node可以作为树结构的一个节点，但它并没有规定节点内部应该有哪些属性，属性值必须是什么类型，正因为这样，其它文本解析库才能大展拳脚，在符合unified AST Node的基础上，定制化自己的属性和值，这样javascript的AST Node, html的AST Node, markdown的AST Node, yml的AST Node就能统一了。unified另外提供了一套工作流程，接受字符串 -> 转化成AST Node -> 变换 AST Node -> 合成输出。注意哦，它只是给出了工作流，具体的转化、变换、合成，它不负责，全部交给unified的插件去做。

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


## css-tree
将css文件转为 css AST, 借此遍历AST收集节点信息，完成css代码的转化

[css-tree API](https://github.com/csstree/csstree/blob/ba6dfd8bb0e33055c05f13803d04825d98dd2d8d/docs/parsing.md)


## postcss-prefix-selector
postcss一个插件，可以给 className 添加前缀或者后缀。

比如将：
```css
.a {
    color: red
}
```

转为

```css
.a[component-hash-233445] {
    color: blue;
}
```

## postcss-selector-parser
解析css代码，得到它的所有selector节点，形成AST树，支持遍历、修改，达成对css代码中各个selector的修改。

但要注意，只能修改selector，规则中的css属性不受影响

<Giscus />
