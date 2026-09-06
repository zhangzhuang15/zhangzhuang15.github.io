---
title: "前言"
page: true 
aside: true
---

# Vue2 
使用vue2.7.14版本的源码介绍vue2, 对应的commit id: 49b6bd4264c25ea41408f066a1835f38bf6fe9f1

```shell
git clone git@github.com:vuejs/vue.git
```

vue2相对vue3来说封装得更简单，更好结合代码理解思路。

接下来，我们会具体探讨如下话题：
1. vue2整体的工作流程。虚拟节点怎么创建，虚拟节点如何patch，真实的DOM节点如何创建，又如何更新
2. 组件的生命周期函数什么时候执行的
3. 响应式系统怎么实现的
4. 响应式系统触发的任务队列是怎么处理的
5. vue3风格的响应式api是如何实现的

vue2源码的结构很乱很槽糕，我们会单独在一个章节里帮你梳理一遍。