---
title: "FAQ"
page: true
aside: true
---

# Description
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


