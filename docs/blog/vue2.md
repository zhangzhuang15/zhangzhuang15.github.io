---
title: "vue2梳理"
page: true
aside: true
---

## Description
使用vue2的过程中，总会遇到一些困惑，要查看源码才知道，但是过了一段时间又健忘了，
因此在这篇文章里记录一下。常更常新。

vue2源码使用的是 2.7.14 版本

## 项目总览

<table>
  <thead>
    <tr>
      <th>目录</th>
      <th>细分</th>
      <th>描述</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="5">src/platforms/web</td>
      <td>runtime/index.ts</td>
      <td>对于不同的runtime，暴露出来的接口有所不同，但它们都要暴露出Vue，本文件存储的就是Vue逻辑，
      如果你想知道，使用框架时遇到的Vue变量到底是什么东西，就看这个文件</td>
    </tr>
    <tr>
      <td>entry-runtime-esm.ts</td>
      <td>vue库的rollup入口文件，其产物是esmodule，不能作为cdn直接用于浏览器，但可以用在webpack开发vue app</td>
    </tr>
    <tr>
      <td>entry-runtime-with-compiler-esm.ts</td>
      <td>vue库的rollup入口文件，其产物是esmodule，包括vue的运行时和编译器</td>
    </tr>
    <tr>
      <td>entry-runtime.ts</td>
      <td>vue库的rollup入口文件，产物是esmodule或者commonjs，只包含vue的运行时，没有编译器</td>
    </tr>
    <tr>
      <td>entry-runtime-with-compiler.ts</td>
      <td>vue库的rollup入口文件，产物是esmodule或者commonjs, 包含vue的运行时和编译器</td>
    </tr>
    <tr>
      <td rowspan="5">src/v3</td>
      <td>reactivity</td>
      <td>组合式API的响应式实现</td>
    </tr>
    <tr>
      <td>index.ts</td>
      <td>组合式API的导出文件, 你使用 <code>import { ref } from "vue"</code> 导入的ref就是
      这个文件导出的；这个文件又被上面的 entry-*.ts 文件引用</td>
    </tr>
    <tr>
      <td>apiWatch.ts</td>
      <td>
        实现：
        <ul>
          <li><code>watch</code></li>
          <li><code>watchEffect</code></li>
          <li><code>watchPostEffect</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>apiLifecycle.ts</td>
      <td>
        实现了：
        <ul>
          <li><code>onBeforeMount</code></li>
          <li><code>onMounted</code></li>
          <li><code>onBeforeUpdate</code></li>
          <li><code>onUpdated</code></li>
          <li><code>onBeforeUmount</code></li>
          <li><code>onUnmounted</code></li>
          <li><code>onActivated</code></li>
          <li><code>onDeactivated</code></li>
          <li><code>onServerPrefetch</code></li>
          <li><code>onRenderTracked</code></li>
          <li><code>onRenderTriggered</code></li>
          <li><code>onErrorCaptured</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>h.ts</td>
      <td>定义了vue虚拟节点生成函数，类似于 <code>react.createElement</code></td>
    </tr>
    <tr>
      <td rowspan="5">src/core</td>
      <td>components</td>
      <td>定义了内置组件，比如<code>keep-alive</code></td>
    </tr>
    <tr>
      <td>observer</td>
      <td>vue2基于<code>Object.defineProperty</code>的响应式实现</td>
    </tr>
    <tr>
      <td>instance</td>
      <td>Vue的实现；尽管$mount是绑定在Vue实例上，但是在src/platforms/web/runtime/index.ts定义</td>
    </tr>
    <tr>
      <td>global-api</td>
      <td>
        实现了：
        <ul>
          <li><code>Vue.use</code> </li>
          <li><code>Vue.mixin</code></li>
          <li><code>Vue.use</code></li>
          <li><code>Vue.set</code></li>
          <li><code>Vue.delete</code></li>
          <li><code>Vue.nextTick</code></li>
          <li><code>Vue.observable</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>util</td>
      <td>定义了vue库内部使用的工具函数，并不作为API供给外部使用。其中很重要的是 util/next-tick.ts 文件，
      它直接定义了Vue.nextTick的实现方式
      </td>
    </tr>
    <tr>
      <td>packages/server-render</td>
      <td></td>
      <td>服务器渲染的实现</td>
    </tr>
  </tbody>
</table>


## new Vue() 到底发生了什么？
待补充

## data props 的数据怎么变成响应式，又怎么挂载到Vue实例上的？
待补充

## Observer Watcher DepTarget到底是什么关系？
待补充

## Vue.prototype.$set 为什么会存在，又实现了什么功能？
待补充

## 响应式变量更新后，怎么就自动重新渲染了？
一步一步来，先从`响应式变量`和它的`依赖函数`出发

```js 
// 假设 data 已经是一个响应式变量，
// 当 hello 执行的时候，读取了 data,
// hello 就是 data 的依赖函数，data就
// 会把 hello 收集到自己的依赖列表中，
// 当 data 更新后，就会重新执行 hello 函数
function hello() {
  const m = data;
}
```

把响应式变量和渲染连接在一起的函数是什么呢？

没错，就是 Vue 实例的render方法；

如果把上边的代码片段换成：
```js 
function render() {
  const m = data;
}
```

这样，当Vue实例的响应式变量更新，就会重新执行 render 方法，得到新的虚拟节点，但是这仅仅是
虚拟节点的更新，并没有触及到DOM节点。

幸运的是，Vue实例有个_update方法，它会根据一个新的虚拟节点，更新DOM节点。

那么我们可以继续改造：
```js 
function render() {
  const m = data;
}

_update(render());
```

但是这会有两个问题：
1. _update函数什么时候执行的？
2. 响应式变量把render加入到自身的依赖函数列表中没有用，这只会引发虚拟节点更新，不会让DOM节点更新，响应式变量要
   把 _update 加入到依赖函数列表中，该如何办到呢？

答案就是 Vue 实例的 $mount 方法 
```js 
function $mount() {

  const updateComponent = () => {
    _update(render());
  }

  new Watcher(updateComponent)
}


class Watcher {
  constructor(updateComponent) {
    this.getter = updateComponent;
    this.get();
  }

  get() {
    pushTarget(this);
    this.getter();
    popTarget();
  }

  run() {
    this.get();
  }

  update() {
    this.run();
  }
}

// $mount 一旦执行，就会把 updateComponent 注册到 Watcher 中，
// 而 Watcher 在初始化的时候，执行 get 方法；
//
// get 方法会利用 pushTarget 将 Dep.target 设置为 watcher 自己，
// 后续如果响应式变量被读取，它就会把 watcher 加入到自身的依赖函数列表中
//
// pushTarget执行完了，就执行getter方法，巧了，这个方法刚好就是 updateComponent, 
// updateComponent 会执行 render 方法，巧了，render方法内部刚好就有响应式变量，就
// 会将 watcher 加入到自身的依赖函数列表中；
//
// 等下，不应该把 _update 加入到依赖函数列表中嘛，要不然就是 updateComponent,
// 为什么加入的是 watcher ？
//
// 别急，依赖函数列表是我们简化的一个概念，落实到vue2中，列表记录的不是函数，而是
// DepTarget，这是一个interface, 定义了 update 方法；也就是说，响应式变量更新
// 后，会从依赖列表中依次取出DepTarget, 然后执行DepTarget.update 
//
// 我们刚才加入的 watcher 也定义了 update 方法，update 执行了，就会执行 watcher.run,
// watch.run就会执行watcher.get, 那么 watcher.get会执行什么呢？不就是 watcher.getter 
// 喽，watcher.getter 是什么呢？ updateComponent!
//
// 现在串起来了吧
```
**组件更新的本质**: `vm._watcher.update()`

\$mount方法定义位置：src/platforms/web/runtime/index.ts

额外提一句，别被`.vue`文件迷惑了，vue编译器最重要的工作就是将 `<template>` 编译为
Vue实例的`render`方法。像 `data` `computed` 什么的，不需要编译器做什么，都是你
在书写`.vue`文件定义好的。但是 `render`方法就不是这样了吧，绝大多数情况下，你都不会
自己给出 `render`方法的定义，而是专心写 `<template>`

在这种机制下，响应式变量和`updateComponent`是绑定的，响应式变量一更新，`updateComponent`
函数就会执行（可能是立即执行，也可能是异步执行，这个取决于 Watcher 的 sync 属性）。也正是
因为这点，Vue不需要扫描整个虚拟节点树就能知道到底是哪个组件更新了。

## `updateComponent`的立即执行和异步执行
接着上节所说的，`updateComponent`分为立即执行和异步执行。

这不是因为该函数内部有同步和异步的区分，而是 Watcher 有。

Watcher.update方法内部调用了 `updateComponent`, 而 Watcher.update 内部会根据
Watcher.sync 的值，做同步和异步执行的处理。

同步执行就是直接执行`updateComponent`;

异步执行是说将Watcher加入到队列中，然后使用nextTick，执行函数 flushQueue，到达异步执行 Watcher.run的效果:
```js 
const queue = []
// 是否安排task or microtask 执行 flushQueue
let waiting = false;

function pushQueue(watcher) {
  queue.push(watcher);

  if (waiting === false) {
    waiting = true;
    nextTick(flushQueue);
  }
}

function flushQueue() {
  for (const watcher of queue) {
    watcher.run();
  }
}
```

在$mount方法中的Watcher, 其sync是undefined,因此组件更新时调用`updateComponent`是异步执行的

## _update 是同步的，还是异步的？
_update方法定位位置：src/core/instance/lifecycle.ts

上一节，解释了`updateComponent`同步执行、异步执行的问题。

我们知道，`updateComponent`函数内部，执行了 Vue 实例的 `_update` 方法和 `render` 方法；

`render` 用于创建一个新的虚拟节点， `_update` 用于更新DOM节点。

显然，`render`是一个同步的过程，那么 `_update` 是同步的过程么？

React中的更新是这样的：
```txt 

更新fiber1 -> 更新fiber2 -> ... -> 整个fiber树更新完毕 -> 更新fiber树对应的DOM节点树

```

Vue的更新像是这样的：
```txt 
更新虚拟节点1 -> 更新虚拟节点1对应的DOM节点 -> 更新虚拟节点2 -> 更新虚拟节点2对应的DOM节点 -> ...
```

如果 `_update` 是同步的，更新DOM节点就是分散更新；

如果`_update` 是异步的，更新DOM节点就可以转化为React那种集中式的更新；

实际上，`_update`调用了`__patch__`函数，这个函数是同步的，因此`_update`也是同步的。
而且观察`__patch__`函数发现，它是从某个虚拟节点出发，往子节点的方向延伸，更新经过的节点所对应的DOM节点，
不存在更新虚拟节点的情况，因此Vue的更新应该是这样的：
```txt
更新虚拟节点树    ->   沿着虚拟节点树依次更新DOM节点
render()             __patch__()
```


## onMounted函数和mounted函数怎么做到兼容的？
待补充

## 为什么要有 Vue.nextTick, nextTick又是如何实现的？
### 1. 为什么要有 Vue.nextTick
[updateComponent的立即执行和异步执行](#updatecomponent的立即执行和异步执行)

[_update是同步的, 还是异步的](#_update-是同步的还是异步的)
  
两个小节告诉我们，组件更新DOM节点是利用nextTick去异步执行的。

如果我们想在DOM更新（严格讲，是DOM树更新，不是网页更新，DOM树更新之后还要经过Paint过程，网页才会更新）之后做一些事情，只需要
将我们的操作放在组件更新DOM节点之后去执行，而上边的结论告诉我们，组件更新DOM节点会放在nextTick的队列中，因此，要想达成这种目的，
我们的操作也应能放在nextTick的队列中。所以，我们需要Vue.nextTick，将内部nextTick函数开放给组件开发者。


### 2. nextTick 的实现 
源文件：src/core/util/next-tick.ts

调用 nextTick，就是将一个function塞入到队列中，然后安排一个task或者microtask执行队列中的所有function。

把function塞入到队列中很好实现：
```js 
const callbacks = [];

export function nextTick(cb) {
  callbacks.push(() => {
    try {
      cb();
    } catch(err) {
      handleError(err)
    }
  })

  // 下面是生成一个task或者microtask, 执行队列中所有的函数
  // ...
}
```

实现起来要注意的是：
- 为了安全，要对 cb() 做 try..catch 处理
- 从vue2的设计上看，允许cb是undefined，这个情形要特别处理，但我们只是理解大体思路，为了保持简单，不考虑这个情况

<br />

接下来要考虑的是：
- 使用什么API可以创建task或者microtask
- 如何适度地创建task or microtask 

第一点，有这些API可以使用：
- Promise.resolve().then(cb) `microtask`
- new MutationObserver(cb) `microtask`
- setImmediate(cb) `task`
- setTimeout(cb, 0) `task`
> 对于microtask，可以看[MDN的这篇文章](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

到底怎么选择呢？
1. 看平台支持哪个API
2. 在平台支持的范围下，microtask 优先于 task 
3. Promise 优先于 MutationObserver 
4. setImmediate 优先于 setTimeout

microtask 为什么优先于 task ?
vue暴露了不少issue，是因为采用 task 造成的；

Promise 为什么优先于 MutationObserver ?
1. MutationObserver有更广泛的平台支持，但是在 UIWebView in iOS >= 9.3.3 中，MutationObserver 的回调函数有不会被调用的情况；
2. 创建一个microtask，Promise 更简单，MutationObserver 必须观测到有节点变化，才会创建 microtask；
   ```js
   // Promise 创建一个 microtask 
   Promise.resolve().then(cb);

   // MutationObserver 创建一个 microtask
   const observer = new MutationObserver(cb);
   const textNode = document.createTextNode('');
   let count = 1;
   observer.observe(textNode, { characterData: true });
   // 调用 invokeMicrotask 函数，会改变 textNode，
   // 触发 observer 创建一个microtask执行cb
   const invokeMicrotask = () => {
    count = (count + 1) % 2;
    textNode.data = count.toString();
   }
   ```

setImmediate 为什么优先于 setTimeout ?

详细原因请阅读[MDN的这篇文章](https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate)

概括来讲：
1. 它们都会创建task, 但是task的执行时刻不同，setImmediate更及时，比setTimeout更早；
2. setTimeout拥有4ms的限制，当setTimeout内部嵌入setTimeout,达到5层时，尽管最外层是 setTimeout(cb, 0)，
   但默认至少是 4ms，不是0ms；

但是，setImmediate已经是 `Deprecated` 状态，不建议再使用，但我们依旧有替代方法：
1. `postMessage`
2. `MessageChannel`

React的schedule实现就采用`MessageChannel`✨

无论是 task 还是 microtask，它执行的内容都是一样的，即执行队列中的函数，vue2将其封装为 flushCallbacks 函数

第二点，如何适度地创建task or microtask，总不能执行一次 nextTick，就创建一个task or microtask 吧？

考虑一个情形，我们连续调用两次 nextTick, 我们只需要把function放入队列中，然后创建一个task or microtask 即可，
怎么做到这一点呢？答案就是引入一个变量`pending`。

`pending`的意思是说，如果队列中有待执行的函数，`pending`就是true，否则就是false;

在第一次调用nextTick的时候，我们将`pending`设置为true, 第二次调用 nextTick 的时候发现`pending`是true，
将function加入到队列中即可，不需要唤醒一个task or microtask。

综上：
```js 
const callbacks = [];
let pending = false;

function flushCallbacks() {
  const copy = callbacks.slice(0);
  callbacks.length = 0;
  pending = false;
  for (const cb of copy) {
    cb();
  }
}

export function nextTick(cb) {
  callbacks.push(() => {
    try {
      cb();
    } catch(err) {
      handleError(err)
    }
  })

  if (pending === false) {
    pending = true;
    invokeTaskOrMicrotask(flushCallbacks);
  }
}
```
