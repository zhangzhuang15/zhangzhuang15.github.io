---
title: "eslint配置再掉坑笔记"
page: true
aside: true
---

# eslint配置再掉坑笔记

## 准备的话
正如标题所言，本文是一篇记录分享，里边不涉及到什么炫技或者啥难懂的硬核知识。

初衷就是给那些被相似问题困扰的朋友提个醒，没准儿看了这篇文章就可以解决手头上的问题了呢。

能看到这篇文章的朋友，大概已经知道eslint是什么东西了，请直接看下一节吧。

对于不太清楚eslint的朋友，建议你直接百度或者问chat-gpt好了，我这里就简短地解释一下：

-   eslint是一个工具程序，帮助写javascript或者typescript的程序员检查代码中的语法错误，给出提示，让程序员们修改；

-   eslint可以单独使用，以命令行的方式被使用；

-   eslint也可以作为基础，供代码编辑器vscode的插件使用，在程序员敲代码的时候，实时给出代码错误提示；

## 咋就又掉坑了呢
之前在公司从零开发一个小项目，在vscode上配置了一遍eslint，结果遇到保存文件的时候，代码没有自动格式化，在编写代码的过程中，当代码格式不太对劲的时候，也没有给出错误提示（没错，就是那些红色曲线），结果配来配去，踩了一次坑。

当时有几个eslint配置相关的package着实让我头疼，特意记录了一下。

-   **eslint-plugin-prettier**
-   **eslint-config-prettier**
-   **@typescript-eslint/eslint-plugin**

它们的作用依次是：

-   将prettier的格式要求纳入eslint的代码检测规则
-   解决prettier的格式要求和eslint已有的代码检测规则之间的冲突
-   提供eslint检测typescript代码格式的能力

最令人迷糊的就是前两个了，落实在eslint配置文件就是这样：
```json
{
  extends: [
  ...,
  "plugin:prettier/recommended"
  ],
  plugins: ["@typescript-eslint"]
}

```

当时我的懵逼点：

-   下载了**eslint-plugin-prettier**，为啥没有出现在plugins中
-   下载了**eslint-config-prettier**, 怎么在配置里没有用上

关于这点，在eslint-plugin-prettier官方仓库有解释[GitHub - prettier/eslint-plugin-prettier: ESLint plugin for Prettier formatting](https://github.com/prettier/eslint-plugin-prettier#options)

看完之后，就感觉是**黑魔法**了，就和以前看到java typescript的装饰器、rust的宏一样[捂脸]

喂喂喂，你一直在说之前踩坑的事情，这次又是怎么一回事儿啊小老弟？

这次是我想搭建自己的monorepo项目，之前公司做的eslint配置太大了，动不动就umi的eslint插件，实属大礼包封装行为，没办法照抄。

这次我就想要一个纯净版的eslint配置，只需要支持typescript即可，连tsx我都不要。

然后我就在上次经验的基础上，再搭建一波。搭建好了的话，以后我个人的项目就直接copy这些配置。本来以为挺快的，结果还是磕磕绊绊。

本次着了**eslint-config-airbnb-base**的道 **，** 它没有生效[恐惧]。

遇到的具体问题是，当我使用import语句导入module时，不加.ts后缀，vscode给出红线提示，说是找不到module，如果我把.ts后缀加上，还是抛红，依旧有错。

这就令我很不爽了啊。

然后我就查怎么回事儿，就追到**eslint-config-airbnb-base**的代码仓库去了，我一看，好家伙，在import方面根本就没支持ts啊：

![截屏2023-05-02 01.07.51.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd894bf8f9194d7ba836982dea025bbc~tplv-k3u1fbpfcp-watermark.image?)

仓库位置就是[javascript/imports.js at master · airbnb/javascript · GitHub](https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/imports.js)

然后我就在自己的配置里覆盖一下settings呗，又是一顿折腾，没卵用。

我就琢磨，难道这玩意儿就不支持typescript么，不科学啊。

随后我就搜到了**eslint-config-airbnb-typescript**.

赶紧按照npm官网上的package介绍配置好，然后这个import问题就解决了。

自我感觉还挺好，写了一天代码，没发现什么毛病。

结果，悲催的事情还没完。

我发现代码格式化又无效了。我故意把代码写错乱，正常情况下应该飘红，结果没有，当我保存文件的时候，也没有自动格式化。

我一阵抓狂！不得不感叹公司之前负责从零开始搭项目的人太不容易了，他当时踩的坑估计也不少吧。

同是天涯代码人，后人何敢笑前人。

冷静下来后，我找到了一个思路。

我使用的是**vscode Prettier Eslint插件**完成format on save的，该插件是有日志保留的，我一看日志就明白了，结果是这个插件找不到 **@typescript-eslint/parser**这个package。我检查了一下，这玩意儿在node_modules里啊。

带着疑惑，我只好去**Prettier Eslint插件**官方仓库[GitHub - idahogurl/vs-code-prettier-eslint: A Visual Studio Code Extension to format JavaScript and TypeScript code using the prettier-eslint package.](https://github.com/idahogurl/vs-code-prettier-eslint)

一看这个仓库，好家伙，一个女媛大佬管理该仓库。

官方还真是温馨，预料到这个情况，给出了解释，还附加了demo。原来对eslint typescript的版本号有一些要求，跟着demo配置好对应的版本的依赖后，我想怎么也该正常了吧。

结果我又挨锤了，nothing works。

一看日志，还是说找不到 **@typescript-eslint/parser**。我就把**Prettier Eslint插件**源码过了一遍，发现一处关键的地方是**esbuild**的调用。然后我又去看**esbuild源码**找线索。

看源码，找线索，又耗去了我3个小时，也就是在五一，要是平时上班，岂不是要被老板怼死[捂脸]

没错，让你们失望了，我没找到问题突破口。

我还在想，莫非是我使用的monorepo方式，这个插件找不到依赖？

我打算给插件维护者，没错，就是那个女媛大佬提ISSUE，信息我都敲好了，就差提交了。

但是，我的脑袋也累了，转身打了会儿游戏，吃了个橙子。

然后我回来准备提交ISSUE，提完上炕睡觉。可我总觉得不大放心，还是想继续试试看，能不能自己把问题找出来。为这种事情提个ISSUE，太踏马丢脸了。

刚好vscode上的界面我切换到eslint配置文件，又凑巧我的余光停留在一处配置上：
```json
extends: [
      "airbnb-base",
      "airbnb-typescript/base",
      "@typescript-eslint/recommended",
      "plugin:prettier/recommended",
]

```

美学告诉我，这里边有问题！

prettier前边有个plugin，为什么 @typescript-eslint前边没有呢？两者结构上如此相像，在plugin上也该一致才对啊。

果不其然，加上plugin之后，everything works!

终于可以上炕了。

## 结语
-   具体问题具体分析
-   事情可能不是因为这个问题，而是因为另外一个问题
-   稍作休息，转移注意力，是一件很有灵感的事情
-   别相信记忆力，手自笔录，能笔录就笔录，能抄笔录就抄笔录

只此祝每一位技术人五一没BUG，不用开电脑。

  
撒花。


<Giscus />