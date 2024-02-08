---
title: "Promise resolve的延迟"
page: true
aside: true
---

# Description
在使用Promise的时候，我遇到了这样的代码：
```ts
async function run() {
    return {
        then: (r) => r(111)
    }
}

run().then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```

它的输出结果是
```txt
1
111
2
```

我就好奇，它为什么不是这个样子
```txt
111
1
2
```

还有这个代码
```ts
async function run() {
    return Promise.resolve(111)
}

run().then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```

它输出结果是
```txt
1
2
111
```
我就好奇，它为什么不是这个样子
```txt
111
1
2
```

## async的魔法
我第一个直觉是，问题出自 async，它肯定做了什么不可告人的黑魔法。

看v8源码里如何实现async，显然不太现实，满篇C++代码，咱看不懂。
> 不得不吐槽C++，它是很强，但它就是不想让人懂

然后我就想了一个主意，用babel将代码转为es5, 这样就可以消除async。

写一个test.js:
```js
async function run() {
    return {
        then: (r) => r(111)
    }
}

run().then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```

下载 `@babel/cli` `@babel/core` `@babel/preset-env`;
设置好 `babel.config.json`:
```json
{
    "presets": [
        "@babel/preset-env"
    ]
}
```
把 test.js 编译为 dist.js:
```shell
npx babel test.js -o dist.js
```
运行 dist.js:
```shell
node dist.js
```
结果是
```txt
1
111
2
```

这就证明和async没有关系，那到底和什么有关系呢？

在 dist.js 中打断点单步调试，最终发现，和 Promise 有关系！

## 两个resolve
这两段代码是等效的：
```js
async function run() {
    return {
        then: (r) => r(111)
    }
}

run().then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```
```js
Promise.resolve({ then: (r) => r(111) }).then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```

但这两段代码不等效：
```js
async function run() {
    return Promise.resolve(111)
}

run().then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```
```js
Promise.resolve(Promise.resolve(111)).then(console.log);

Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```
可是改为这样就等效了：
```js
new Promise(resolve => resolve(Promise.resolve(111)))
Promise.resolve().then(() => console.log(1)).then(() => console.log(2))
```

问题来了：
- resolve函数到底发生了什么
- Promise.resolve 和 new Promise里的resolve 是一个东西么，各自遵从什么规律呢？

## resolve的秘密
问题的答案：
- [v8源码 | promise-resolve.tq 定义](https://github.com/v8/v8/blob/main/src/builtins/promise-resolve.tq)
- [ECMA 2024 Language Specification | Promise resolve function](https://tc39.es/ecma262/#sec-promise-resolve-functions)
> v8的实现就是按照这个标准写的，facebook实现的regenerator似乎也是根据这个标准来的 

标准并没有规定 then 是否要慢一拍或者两拍入队列，这个是由js引擎实现方给出的；
慢拍子的问题仅仅和v8引擎，jscore引擎相关，和nodejs运行时、事件循环无关；

```js
new Promise(resolve => {
    resovle({ then: (r) => r(111) })
})

// resolve一个thenable, then回调 慢一拍 执行的原因是执行 (r) => r(111) 不是立即的，
// 而是被作为一个微任务执行了


const t = new Promise(resolve => {
    resovle(Promise.resolve(111))
})

// resolve 一个 promsie，then回调 慢两拍 执行的原因是：
// 创建 t 的过程被延迟到一个微任务，
// t.then 的执行被延迟到下一个微任务
```

TODO: 
- .tq文件里的 deferred 关键词是啥意思？
- jscore也遵从同样的慢拍子调度
