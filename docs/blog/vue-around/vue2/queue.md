---
title: "任务队列调度"
page: true 
aside: true
---

# 任务队列调度 
vue的任务队列调度，说白了就是有个保存watcher的队列，按照一定的逻辑排序，然后按照顺序一个一个取出watcher, 并执行`watcher.run()`。

这里有两个重要的方面：
1. 任务队列调度在什么时候执行的
2. watcher是怎么排序的

## 任务队列调度的驱动依据
在javascript的世界中，存在着宏任务和微任务。javascript提供了api,让用户可以往微任务队列或者宏任务队列加入任务，之后javascript解释器会自行在某个时候执行这些任务。

实际上，只需要将任务队列调度的入口函数作为任务，用上述的方式交给javascript即可。

vue用的是微任务队列还是宏任务队列呢？

答案是优先使用微任务队列，如果js代码执行的平台不支持，才退化到宏任务队列：
```ts 
const callbacks = [];
function flushCallbacks() {
  while(callbacks.length) {
    const callback = callbacks.pop();
    callback();
  }
}

let timerFn

if (supportPromise()) {
  const p = Promise.resolve()
  timerFn = () => {
    p.then(flushCallbacks)
  }
}
else if (supportMutationObserser()) {
  let count = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode('' + count)
  // 监督 textNode 的文本变动，一旦发生变动，observer就会
  // 把 flushCallbacks 加入到微任务队列
  observer.observe(textNode, { characterData: true })
  timerFn = () => {
    count = (count + 1) % 2;
    // 触发textNode变动
    textNode.data = '' + count;
  }
}
// 降级到宏任务队列
else if (supportSetImmediate()) {
  timerFn = () => {
    setImmediate(flushCallbacks)
  }
}
// 降级到另一个宏任务队列方式
else {
  timerFn = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```
源码： `src/core/util/next-tick.ts, line41`

任务队列调度的入口函数是`flushSchedulerQueue`, 它通过`nextTick`加入到上边的`callbacks`的：
```ts 
function nextTick(callback) {
  const { promise, resolve } = createDeferedPromise();
  callbacks.push(() => {
    if (callback) invokeWithErrorHandling(callback)
    else resolve()
  })
  timerFn()

  if (!callback) return promise;
}
```
源码： `src/core/util/next-tick.ts,line94`


```ts 
function queueWatcher(watcher) {
  insertQueueJob(watcher)
  nextTick(flushSchedulerQueue)
}
```
源码：`src/core/observer/scheduler.ts#queueWatcher`

## 任务队列如何给watcher排序
```ts 
const sortCompareFn = (a: Watcher, b: Watcher): number => {
  if (a.post) {
    if (!b.post) return 1
  } else if (b.post) {
    return -1
  }
  return a.id - b.id
}

function flushSchedulerQueue() {
  queue.sort(sortCompareFn)

  for (const watcher of queue) {
    if (watcher.before) watcher.before()
    watcher.run()
  }

  queue.length = 0
}
```
源码： `src/core/observer/scheduler.ts#flushSchedulerQueue`

不难看出，顺序主要由 watcher 的 id 属性决定。而watcher的id是由它构建的时刻决定的，构建的越早，id越小。最终排序的结果是由小到大。

介绍响应式系统时，我们说过同一个组件，`computed` `watch`有关的watcher是在 `created` 生命周期函数执行前创建的，而组件渲染的watcher是在`mountComponent`的时候创建的，显然在`created`生命周期函数执行之后。

当响应式变量更新时，有关的watcher会执行`watcher.update()`，一般来讲都是采用异步的方式，会把watcher加入到queue中。这也就意味着，负责组件渲染的watcher没有优先执行的设定。

好在组件渲染——`vm._update(vm._render())`——是同步执行的，不至于被其它任务中断。但是，这也意味着，在定义`computed`和`watch`时，不要有计算时间太长的同步代码，防止阻塞负责组件渲染的watcher得以执行。