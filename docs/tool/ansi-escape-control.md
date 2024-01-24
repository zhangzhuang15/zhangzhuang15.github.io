---
title: "ansi escape 控制码"
page: true
aside: true
---

## Description
在实现终端窗口的进度条时，会用到终端 ansi escape 控制码，实现光标移动、文字
前景色、文字背景色等等功能。这方面内容，肯定不是死记硬背的，有专门的标准文档
阐述 ansi escape 控制码。

这里推荐的是[ECMA-48 标准文档 ｜ 官方链接](https://ecma-international.org/wp-content/uploads/ECMA-48_4th_edition_december_1986.pdf)

你也可以访问我已经下载好的[ECMA-48 标准文档 ｜本网下载版](/ECMA-48_4th.pdf)

## 如何使用 ECMA-48 标准文档
以 8.3.18 小节介绍的 CUB 为例，你会看到文档是这么写的：
```txt
8.3.18 CUB —— CURSOR LEFT
 Notation               :  (Pn)
 Representation         : CSI Pn 04/04
 Parameter default value: Pn = 1

 CUB causes the active....
```
`CUB causes the active....` 就是介绍 `CUB`是干什么的；

`Representation` 介绍是如何调用 CUB：
CSI是另外一个指令，你可以在 8.3.16 小节找到它，文档里对它的 Representation 的描述是 `09/11 (7-bit code: ESC 05/11)`, 我们使用 7-bit code 的形式，
如果文档没有写7-bit code的形式，我们就要使用`09/11`了。但我们不知道 ESC，别怕，你可以在 8.3.48 小节找到它，它的 Representation 是
`01/11`, 把这些东西合起来，就是CUB的完整形式：`01/11 05/11 Pn 04/04`;

如果你想让光标左移2个位置，就把Pn赋值为2，这一点在`CUB causes the active....`会告诉你；

最后就是 `01/11` 是什么意思了，它表示的就是unicode码，像 `01/11` 就是 `\u001b`的意思，在16进制里，`b`就是11的意思；

`04/04`是什么意思呢？我想你已经知道了，就是`\u0044`；

ok，现在我们可以得到光标向左移动两个位置的指令了：
`\u001b\u005b2\u0044`

最后，你只要把它输出到终端，就可以实现效果了：
- 比如在shell里，`echo "\u001b\u005b2\u0044"`
- 比如在node里，`console.log("\u001b\u005b2\u0044")`
- 等等

提示：
- 使用16进制表达，要用`\uxxxx`的形式；
- 使用8进制表达，要用`\0xx`的形式；