---
title: "react官网如何实现用markdown编写页面"
page: true
aside: true
---

## Description 
之前写了一篇文章，说了下 `vitepress` 是如何在markdown里支持 vue 组件的。那么，react阵营里就会涉及到
一个问题：markdown里如何支持 jsx/tsx。

有什么项目是在 markdown 里使用 jsx/tsx ? 我的脑海里出现了 `react 官网`。

除此之外，我还比较感兴趣一点：react官网里的代码编辑器和预览是怎么实现的呢？

![react官网代码编辑器和预览](/react-official-code-editor.png)

[react官网链接](https://react.dev/learn)

## markdown 中使用 jsx/tsx
如果 markdown 中可以使用 jsx/tsx，那么这个markdown就是mdx;

:::tip <TipIcon />
关于 mdx，你可以阅读[这里](https://mdxjs.com/docs/)
:::

markdown 和 mdx 的关系，正如 js 和 jsx 的关系一样；

react官网的页面，都是用mdx的格式写出来的，尽管在文件命名上，它依旧采用`.md`的后缀；

`vitepress`的思路，是将 markdown 转为 vue sfc；而 react 官网的思路，则是将 markdown 转为 js;

使用 `@mdx-js/mdx` 将 mdx 转为 jsx;

使用 `@babel/core` 将 jsx 转为 js;

转为 js 还不够。页面真正渲染是依靠 nextjs。每个页面都是一个组件，而且是一个react组件，nextjs会将组件渲染为页面，但nextjs无法将组件定义的代码渲染为页面。这也就是说，转到 js 这一步，我们其实只是得到了组件的定义代码。要想得到组件，就必须执行js代码，这段代码的默认导出（export default）就是组件（没错，就是你写react组件时，那个表示组件的函数）。

:::tip <TipIcon />
执行js代码，拿到组件的实现简述如下：
```js 
const fakeExports = {}

// jsCode 就是  `@babel/core` 转化出来的js代码
const evalCode = new Function("require", "exports", jsCode)

evalCode(require, fakeExports)

// 这就拿到了表示组件的函数
fakExports.default
```
:::

react官网团队在实现的时候，没有将导出的组件直接交给nextjs，而是对组件进行json序列化（源码里的`stringifyNodeOnServer`函数），把序列化后的字符串交给了nextjs, nextjs 在 `Layout` 函数里，调用react官网团队给出的组件反序列化函数（源码里的`reviveNodeOnClient`函数），得到了react组件。

:::tip <TipIcon />
`Layout`函数是nextjs框架中的一个核心概念，它本质上就是一个react函数式组件，只不过函数名被严格要求为 `Layout`, nextjs的使用者可以给出这个函数的定义，nextjs会根据该函数的返回结果去渲染页面。

想了解更多，请前往nextjs官网
:::

最后，nextjs会像渲染一个react应用一样，产出最终的html文件

## react官网里的代码编辑器和预览
![react官网代码编辑器和预览](/react-official-code-editor)

react官网是如何实现上图的组件呢？

这就要提到一个非常重要的package了——`@codesandbox/sandpack-react`;

你所看到的代码编辑器区域、预览区域，都是使用这个package里提供的组件完成的，react官网只是基于这些组件，加入所需的逻辑，拉了一层封装实现的。

你也可以使用这个package实现自己的代码编辑和预览，具体做法可以访问[sandpack官网](https://sandpack.codesandbox.io/docs/quickstart)

:::tip <TipIcon />
`@codesandbox/sandpack-react`封装`@codemirror`, 实现代码编辑组件;

它实现预览，并不是将组件直接渲染在react官网网页上，而是组件在codesandbox平台里渲染出来，然后平台给出一个访问网址，react官网用 iframe 将这个网址加载出来而矣。至于如何于codesandbox通讯，通知codesandbox重新渲染，都在`@codesandbox/sandpack-react`里封装好了，只需要调用它提供的hooks，就可以了。

react官网有一部分组件是自己写的，有一部分是基于[headlessui](https://headlessui.com/react/menu)
:::

## 总结一下核心的package 

- `nextjs`

- `@mdx-js/mdx`

- `@codesandbox/sandpack-react`

- `headlessui`