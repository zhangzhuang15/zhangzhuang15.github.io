---
title: "前言"
page: true
aside: true
---


# 前言
像介绍vue2框架那样，这里出一些文章，讨论react运行时。相比vue，react更偏向运行时的框架，几乎没有代码编译的环节，但是，它在运行时非常重，代码里的边界情况特别多，我们不可能讲清楚，我们的重点是理清主体脉络，放弃细枝末节。

代码下载和分支创建：
```shell 
git clone git@github.com:zhangzhuang15/react.git

git checkout -b learning d20c3af9d11ea4a35bfc76cb44c15af9d42059c4
```

我们后边讨论，都以此为准。

后边我们会讨论一下的内容：
- react的ReactNode和Fiber是什么
- react是如何基于Fiber Tree完成页面渲染的
- react hooks的本质是什么，为什么一调用后，页面会更新
- react里的effects都是什么时候执行的
- react的调度系统