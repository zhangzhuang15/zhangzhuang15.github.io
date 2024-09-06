---
title: "什么是 'monad'"
page: true
aside: true
---

## Monad
`Monad`是一个函数式编程领域的一个概念。具体来讲，Promise 就是一个 Monad:
```js
new Promise((resolve) => {
    resolve(100)
}).then(v => {
    console.log(v)
})
```

`Monad`具备以下特征：
1. 单子类型：表示一个包含值的容器，比如 Promise对象
2. 单子单位：将一个值放入单子中，比如 resolve 函数
3. 绑定操作：将单子中的值传递给另一个函数，返回一个新的单子，比如 then

## Monad，有点儿用处？
考虑下面的代码：
```js 
const hours = [0, 1, 2, 3];

// hours 是用户选择的时间，时间要在 0 ～ 23里取数；
// hours 需要传递给服务端作为请求参数，但是有一条规则：
//   如果用户选择了几个值，要把它们用“，”连接起来，结果就是“0,1,2,3”;
//   如果用户没有做出选择，要传 “”
//   如果用户把所有的值都选中了，也要传“”

// 我们可以编写一个函数，来实现这点要求
const genParam = () => {
    if (hours.length == 24) {
        return ""
    }
    return hours.join(",")
}
```

如果 `hours` 是一个 Monad, 你就可以这样做：
```js
// result是一个 Monad，包含的值为 "0,1,2,3"
const result = hours.lengthEq(24).then(() => "", (v) => v.join(","));

// params是“0,1,2,3”
const params = result.into();
```

不怎么像好处的好处：
- 不用再被 `if` `else` 摧残
- 链式结构，一条龙搞定逻辑
- 语义化更好一些

## monio
monio 作为 npm package，给出了一种 Monad 模型实现 `Just` `Maybe` `Nothing` `State` `LeftOrRight`，但是它仍有缺陷，照顾到的数据类型范围不大，而且没有typescript类型支持。

更好的 Monad 实现者，应该是 Rust。

## future
仿照 Rust 的 Monad 模型实现，迁移到 js/ts 生态？

...


<Giscus />