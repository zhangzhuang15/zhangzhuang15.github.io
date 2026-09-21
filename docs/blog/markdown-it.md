---
title: "markdown的渲染工具"
page: true
aside: true
---

# markdown的渲染工具 
本文要介绍的并不是一个前端组件，直接完成markdown的渲染，而是受vitepress的启发，介绍下`markdown-it`这个npm包。

我在使用vitepress编写个人网站的博客时，遇到一个问题：
```md
  \```ts [example.ts]
  const a = 10
  \```
```
写成这样的话，vitepress展示给我们的页面，并不会为代码片段加入`example.ts`的标题。我就好奇，有没有什么方法支持一下呢？

在vitepress官网，很容易了解到一个事实——vitepress在解析markdown的内容时，使用`markdown-it`。

顺带着，我查了下`markdown-it`到底是什么玩意儿。原来，`markdown-it`可以将markdown的内容解析成许多个token，之后，在将每个token转化成html片段，把这些片段拼接起来，就是markdown渲染之后的内容，挂在网页上就能看到效果。

解析为token，类似于babel将js代码变成抽象语法树（ast）；由token转为html片段，类似于babel将ast转为js代码。

按照这个逻辑，如果我想支持`[example.ts]`，那就应该在修改token以及token转为html的逻辑。

与babel一样，`markdown-it`也是插件系统，莫非编写个插件，就可以解决这个问题么，怎么开始编写一个插件呢？

答案自然是从vitepress项目搞起。vitepress内置了`line-number`的功能，就是给代码片段的每一行加入行号展示。我们就可以看看它是怎么编写插件，实现的这个功能就好了。

具体的过程，就不再赘述，我们在这里给出总结：
```ts 
import MarkdownIt from "markdown-it"

const md = new MarkdownIt();

// 自定义token解析逻辑，并确保这个逻辑要在
// 默认的fence解析逻辑之前使用
md.block.ruler.before("fence", "myBlockParser", (
  state, startLine, endLine, silent
) => {
  const lineStartOffset = state.bMarks[startLine] + state.tShift[startLine]
  const lineEndOffset = state.eMarks[startLine]

  // 第 startLine 行的内容
  const startLineInfo = state.src.slice(lineStartOffset, lineEndOffset)

  const endLineStartOffset = state.bMarks[endLine] + state.tShift[endLine]
  const endLineEndOffset = state.eMarks[endLine]
  // 第 endLine 行的内容
  const endLineInfo = state.src.slice(endLineStartOffset, endLineEndOffset)

  // 按照上述方法，从startLine到endLine，就可以读取
  // 任意一行的内容，再根据这个内容做处理

  // 不符合我们自定义规则的特征，返回false,
  // 让下一个rule规则处理
  if (startLineInfo[0] !== ':') {
    return false
  }

  // 生成一个token，推入token流
  const token = state.push('myBlockParser_start', 'div', 0)
  token.block = true

  const parentType = state.parentType
  // 被解析的markdown总共有多少行
  const lineMax = state.lineMax

  // 用rules系统继续处理startLine+1行到endLine行的内容
  state.parentType = "myBlockParser"
  state.md.block.tokenize(state, startLine + 1, endLine)

  // 恢复如初
  state.parentType = parentType 
  state.lineMax = lineMax

  // 如果不再需要其他rule继续处理，更新state.line,
  // 并返回true；
  state.line = endLine + 1
  return true
})

// ```ts
//
// ``` 
// 长这样的结构被称之为fence。
// 这里用来改写fence类型的token转为html片段的逻辑
const originalFenceRender = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  // 当前要处理的token
  const token = tokens[idx]
  // 提取```后边的字符串
  const info: string = token.info.trim()
  // 正则表达式，取出标题
  const title = info.match(/\[(.*?)\]/)?.[1]
  // 获取原始渲染出来的html片段
  const html = originalFenceRender(tokens, idx, options, env, self)

  if (isUndef(title)) return html 

  return `
    <div>
      <header class="code-title">${title}</header>
      ${html}
    </div>
  `
}
```