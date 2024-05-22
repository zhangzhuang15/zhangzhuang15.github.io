---
title: "FAQ"
page: true
aside: true
---

## Description
记录踩过的坑

## 为什么 lodash 的 tree-shaking 会失败？
```ts
import { zip } from "loadash";
```

这样使用lodash，webpack最终结果还是把loadsh整个内容打包进去了，而不是仅打包zip函数。

原因一：lodash本身采用commonjs方式编写，其`package.json`没有声明`sideEffects: false`

基于此，你应该改写为：
```ts 
import zip from "lodash/zip";
```


原因二：webpack在 production 模式下，默认会开启 tree-shaking，但可能你开启了某些配置项，将它禁止了

原因三：你依赖的其它库也使用了`lodash`，但它按照最开始说的错误方式导入了`lodash`


## 这些“黑话”啥意思
### shebang
```js 
#!/usr/bin/env node

console.log('hello world');
```

`#!/usr/bin/env node` 就是 `shebang`

### bailout
```ts 
function dealWithSomething() {

    // 一些特殊处理，导致函数提前返回，这就是 bailout
    if (true) {
        return 10;
    }

    doOtherThing();
    return 0;
}
```

### noop
```ts 
const noop = () => {};
```

### pending
```js 
function pushQueue(queue, task) {
    // task加入队列，但是没有被执行，这些task就是 pending 状态，
    // 即 pending task
    queue.push(task);
}
```

## 使用 javascript API 遇到的坑
### 数组 empty slot 被跳过
❌
```ts 
const arr = new Array(3).map((_, index) => index + 1)

// expect: [1,2,3]
// actual: [<3 empty items>]
// arr[0] === undefined
```

✅
```ts
const arr = new Array(3).fill(1).map((_, index) => index + 1)
```

### Date设置日期
```ts 
const date = new Date("2024-02-07")

date.setDate(0);

// date: "2024-01-31"
```

```ts 
const date = new Date("2024-02-07")

date.setDate(-1);

// date: "2024-01-30"
```


## localStorage 和 sessionStorage 的存储容量限制
每个 origin，最多允许存储 10MB 的数据（5MB localStorage, 5MB sessionStorage）

[MDN | Storage容量限制](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage)

## web worker 最多开多少个
没有找到具体的官方文档，但是可以参考[stackoverflow | Number of Web Workers Limit](https://stackoverflow.com/questions/13574158/number-of-web-workers-limit)

FireFox浏览器最多允许创建20个；
> FireFox的限制数量可以改变配置；

Chrome浏览器最多允许创建60+个；

Opera浏览器最多允许创建16个；


值得关注的是，web worker占据一个系统线程，因此不要过多创建web worker，web worker的数量和主机的CPU核数保持一致即可，数量多了未必能提升性能。

## `Failed to execute 'postMessage' on 'Window': 2 arguments required, but only 1 present.`
浏览器差异，在 chrome v123没有问题，在 chrome v69 会有问题。

MDN上说：`window.postMessage(data, targetOrigin)` ，第二个参数是optional，这不准确，像 chrome v69 环境下，第二个参数就必须填写。