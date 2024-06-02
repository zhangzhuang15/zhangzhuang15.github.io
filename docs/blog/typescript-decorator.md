---
title: "typescript decorator"
page: true
aside: true
---

## 相关参考
[mirone.me | typescript decorator全指导](https://mirone.me/a-complete-guide-to-typescript-decorator/)

[typescript official | decorators](https://www.typescriptlang.org/docs/handbook/decorators.html#parameter-decorators)

## 元编程和反射
待补充

## decorator示例代码
待补充

## reflect-metadata
在 class, property, method, method params，accessor 上定义元信息；

如果自己去给一个 class 定义元信息，需要创建一个全局变量存储该 class 的元信息，并
在 decorator 执行的时候，将信息存入。这样就有一个问题，有多少个 class, 我们就要
自己去创建多少个全局变量管理，非常麻烦。`reflect-metadata`就解决了这个问题，我们
只关心存储和读取，不用去维护存储数据的全局变量或者闭包变量。