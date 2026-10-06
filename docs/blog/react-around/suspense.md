---
title: "suspense组件和lazy组件"
page: true
aside: true
---

# suspense组件和lazy组件 
异步组件作为前端技术重要的一环，必须单独讨论一下。

通常情况，suspense组件和lazy组件是配套使用的。到底是怎样的机制，令lazy组件没有加载完毕的时候，suspense组件展示fallback，当lazy组件加载完毕后，又是如何通知suspense组件展示正常的子组件呢？

lazy组件对应的fiber，拥有`LazyComponent`的tag。在渲染这样fiber时，会有如下的过程：
```ts 
const elementType = lazyComponentFiber.elementType 
const { payload, init } = elementType
const Component = init(payload)
```

重点就在`init(payload)`。

```ts 
const lazyComponent = lazy(() => import("../hello.tsx"))
```

`payload`就是：
```ts 
const payload = {
  status: Uninitialized,
  result: () => import("../hello.tsx")
}
```

init就会这样做：
```ts 
function init(payload) {
  if (payload.status === Uninitialized) {
    const thenable = payload.result()
    thenable.then(
      moduleValue => {
        payload.status = Resolved
        paylod.result = moduleValue
      },
      err => {
        payload.status = Rejected 
        payload.result = err
      }
    )

    if (payload.status === Uninitialized) {
      payload.status = Pending 
      payload.result = thenable
    }
  }

  if (payload.status === Resolved) {
    return payload.result.default
  }
  throw payload.result
}
```
源码位置：`packages/react/src/ReactLazy.js`

你会发现，`init`要么返回组件的定义，要么抛出异常。如果返回的是组件定义，就会走正常的渲染，创建组件的Fiber节点。

当发生异常的时候，workInProgress指代的就是LazyComponent的fiber。react会有一个统一的异常处理。

```ts 
function handleError(throwValue) {
  const errorFiber = workInProgress 

  // 寻找errorFiber最近的祖先Suspense组件fiber，打上标记，
  // 如果该fiber再次渲染，就会识别这个标记，采用fallback
  markNearestSuspenseComponent(errorFiber)

  // 往sibling或者父fiber的方向，寻找下一个要被渲染的fiber，
  // 将workInProgress设置为该fiber。如果这个fiber刚好是打上
  // 标记的suspense组件fiber，那么，就会继续渲染这个fiber,
  // 因为标记的原因，fiber会渲染fallback，不会渲染真正的子
  // 组件fiber，于是不会二次触发lazy组件的fiber的渲染。
  completeUnitOfWork(errorFiber)
 
  // 一旦组件异步拿到了，开启新的渲染调度，
  // suspense组件为什么感知到异步组件加载好了
  throwValue.then(() => reschedule())
}
```
源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line1550`

suspense组件fiber的渲染非常简单：
1. 如果有suspense有关的标记，正常去渲染pendingProps.fallback
2. 如果没有，正常去渲染pendingProps.children