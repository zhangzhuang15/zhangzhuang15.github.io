---
title: "vitepress如何支持markdown使用vue组件"
page: true
aside: true
---

## Description
在使用`vitepress`开发个人网站一段时间后，我非常好奇它如何支持在markdown中使用vue组件，
为了消除按耐不住的好奇心和求知欲，有了这篇文章。

## 整体思路
vitepress使用 `markdown-it` 解析markdown文件。

解析的过程中，如果遇到vue sfc的 `<script>`, `<script setup>`, `<style>`，vitepress
会使用 `@mdit-vue/plugin-sfc`将它们提取出来，挂载到 markdown-it render方法的env参数上，
具体的说是 `env.sfcBlocks` 上，方便以后从这里拿，而 `<script>` , `<script setup>`, `<style>`
直接从mardown里面删除。

:::tip <TipIcon />
markdown里面的`<template>`不会被提取，不会被删除，就原封不动地放着
:::

解析过程中，如果遇到vue组件标签，vitepress会用`@mdit-vue/plugin-component`处理，这个插件会
让 markdown-it 不去理会vue组件标签，标签原封不动的放在原地。如果不用这个插件干预，比如vue组件
标签是 `<Card />`，markdown-it 会把它解析为 `tag: "inline"` 的 token, 渲染出来的结果是
`&lt;Card /&gt;`; 用这个插件处理后，markdown-it 会把它解析为 `tag: "html_inline"` 的 token,
渲染出来的结果是 `<Card />`。

解析后的markdown文件依旧有vue组件标签，这些标签该怎么渲染出来呢？很简单，渲染后的markdown内容，vitepress
会在它最外边包上一层`<template></template>`, 这不就得到 vue sfc 的 template 了嘛，然后上边提到了，
vitepress收集了 script 和 style, 如果把它们也注入进去，一个markdown文件不就变成了一个 vue sfc 了嘛。

接下来，一个 markdown 文件就转化为一个 vue 文件，然后用 vue 提供的编译器处理 vue 文件得到vue实例，最后
将 vue 实例通过 `new Vue()` 或者 `createApp().mount()` 挂载到预先准备好的 html 模板不就行了嘛？

以上，就是 vitepress 的整体思路，有点绕，但不麻烦。

## 关键之处
上述过程中，真正发挥作用的就是markdown-it的插件，`@mdit-vue/plugin-sfc` 和 `@mdit-vue/plugin-component`，当然，vitepress也使用了别的插件：

- `@mdit-vue/plugin-title`

- `@mdit-vue/plugin-toc`

- `markdown-it-anchor`

- `markdown-it-attrs`

- `markdown-it-emoji`

- `markdown-it-mathjax3`

- `mardown-it-container`

也有一些它自己写的插件，比如负责代码高亮功能的插件

最核心的地方还是对 markdown-it hooks 的运用。

比如 `@mdit-vue/plugin-sfc` 想要收集 vue sfc 的script, 它就覆盖了 markdown-it 的 render；

比如 `@mdit-vue/plugin-component` 想要保持 vue 组件不被转译，它就覆盖了 markdown-it 的 md.block.ruler 和 md.inline.ruler;



