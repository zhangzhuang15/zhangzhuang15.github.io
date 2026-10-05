---
title: "updateQueue & effect"
page: true
aside: true
---

# updateQueue & effect
在react里边，effect是非常重要的概念。你使用`useEffect`、`useLayoutEffect`、`useInsertionEffect`，都是在创建effect。而这些effect，又会被记录在`fiber.updateQueue`。

## effect 
通常，effect是这种结构：
```ts 
const effect = {
  // 只是表示是一个函数，并非是空函数
  create: () => {},
  // 只是表示是一个函数，并非是空函数
  destroy: () => {},
  // 可以区分 useEffect useLayoutEffect useInsertionEffect
  tag: NoFlags,
  // 利用 next, 可以创建出循环队列
  next: null
}
```

react在执行effect的时候，采用如下的模式：
```ts 
function invokeUmountEffectList() {
  for (const effect of effects) {
    effect.destroy()
    effect.destroy = undefined
  }
}

function invokeMountEffectList() {
  for (const effect of effects) {
    effect.destroy = effect.create()
  }
}

function invokeEffect() {
  invokeUmountEffectList()
  invokeMountEffectList()
}
```

### useEffect 
本质是这样的effect:
```ts 
const effect = {
  // 只是表示是一个函数，并非是空函数
  create: () => {},
  // 只是表示是一个函数，并非是空函数
  destroy: () => {}，
  // 只是表示是一个数组，并非是空函数
  deps: [],
  tag: HookHasEffect | PassiveEffect,
  next: null
}
```

问题是，这个effect被保存在哪里？

如果fiber是被挂载，也就是`fiber.alternate`是null，在执行`useEffect`的时候，会是这样：

<image src="/react-effect-1.png" style="width: 700px" />

<br />

<image src="/react-effect-2.png" style="width: 700px" />

在此之后，fiber会被打上`HookHasEffect` `PassiveEffect` 标记。

这部分逻辑的源码位置：`packages/react-reconciler/src/ReactFiberHooks.new.js,line1662`

另一个情况是fiber更新，也就是`fiber.alternate`不是null，过程和上边的类似，但是会判断旧的`deps`和新的`deps`是否相同，如果相同，fiber不用打上标记，否则就要打上标记。

这部分逻辑的源码位置：`packages/react-reconciler/src/ReactFiberHooks.new.js,line1674`

打上标记，是为了在render阶段和commit阶段的适当时候，执行这些effect。

#### effect 的消费情况
上述讲解的是effect的生产过程，什么时候effect会被消费呢，消费之后，effect会不会从`fiber.updateQueue`里删除呢？

effect的消费发生在源码`flushPassiveEffects`函数，这个函数做了什么，告诉了我们effect如何消费的，而这个函数什么时候调用，告诉我们effect何时被消费。

先看看这个函数做了什么。

<image src="/react-11.png" style="width: 700px" />

按照上图的后续遍历顺序（fiber的序号就是遍历顺序），遍历每个flags被标记为`Passive`的fiber。

取出`fiber.updateQueue.lastEffect.next`, 这个就是`firstEffect`, 因为循环队列中，最后一个effect的下一个就是第一个effect。

由此开始遍历effect，找到`effect.tag`设置了`PasssiveEffect`的effect，这种effect就是`useEffect`创建的effect。执行 `effect.destroy()`。

之后，还是按照上图的后续遍历顺序，遍历同样的fiber，取出effect，执行`effect.destroy()`

执行之后，这些effect并不会从`fiber.updateQueue`里摘除。原因就是，每次render阶段都会生成新的fiber，而`fiber.updateQueue`会重头创建。

再看看`flushPassiveEffects`函数什么时候会执行:
1. render阶段的工作开始执行之前，源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line898`

2. commit阶段的工作开始执行之前，源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line2055`

但是，这个函数要执行，还依赖全局变量`rootWithPendingPassiveEffects`, 如果它是null, 这个函数什么都不做，提前返回。因此，有必要看看，什么时候`rootWithPendingPassiveEffects`会被设置非null的值。

答案是，`flushPassiveEffects`函数在时机2执行完毕后，会检查RootFiber的flags或者subtreeFlags是否设置了`PassiveMask`, 发现设置了，会在commit阶段结束之前，把`rootWithPendingPassiveEffects`设置为FiberRoot。

这样在下一次调度的时候，就会在时机1或者时机2得到执行。


### useLayoutEffect 
与`useEffect`的情况一样，effect保存到的位置也一样，只是effect和fiber的标记处理有所不同，create和destroy的执行有所不同。

```ts 
const effect = {
  // 只是表示是一个函数，并非是空函数
  create: () => {},
  // 只是表示是一个函数，并非是空函数
  destroy: () => {}，
  // 只是表示是一个数组，并非是空函数
  deps: [],
  tag: HookHasEffect | HookLayout,
  next: null
}
```

fiber会打上`UpdateEffect`的flags标记。

`useEffect`的effect在执行的时候，先整体执行一遍destroy，再执行一遍create，两趟紧挨着。

但是`useLayoutEffect`不一样，它的destroy是在`useInsertionEffect`的effect.create执行之后执行。源码位置：`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line2052`

而它的create是在`useInsertionEffect`的effect全部执行完后，再执行。源码位置：`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line725`

`useEffect`和`useLayoutEffect`的effect谁先执行，不是固定的。如果本次commit阶段，检测到`rootWithPendingPassiveEffects`非null，那么`useEffect`的effect会先执行，否则，`useLayoutEffect`会先执行，`useEffect`会在下一次渲染调度执行。

### useInsertionEffect 
与`useEffect`的情况一样，effect保存到的位置也一样，只是effect和fiber的标记处理有所不同。

```ts 
const effect = {
  // 只是表示是一个函数，并非是空函数
  create: () => {},
  // 只是表示是一个函数，并非是空函数
  destroy: () => {}，
  // 只是表示是一个数组，并非是空函数
  deps: [],
  tag: HookHasEffect | HookInsertion,
  next: null
}
```

fiber会打上`UpdateEffect`的flags标记。

行的内容与`useEffect`一样，就是标记的判定不同。执行的时机发生在commit阶段的`commitMutationEffects`函数中，这个函数执行完毕后，就会执行`useLayoutEffect`的effect。而这个函数内部会先对DOM做操作，之后执行`useInsertionEffect`的effect。

按照react官网的说法，这个effect是给CSS-in-JS的库作者使用的，目的就是在`useLayoutEffect`的effect执行前，可以往DOM里插入element。


## updateQueue 
有了上述的铺垫，我们可以看看`updateQueue`有几种格式。

`RootFiber`的：
```ts 
const element = document.getElementById("app")
const update = {
  tag: UpdateState,
  payload: { element }，
  next: null
}
update.next = update

rootFiber.updateQueue = {
  baseState: {},
  firstBaseUpdate: null,
  lastBaseUpdate: null,
  shared: {
    pending: update
    interleaved: null,
    lanes: NoLanes,
  },
  effects: null,
}
```
这个在介绍render和commit的时候讲过，对应的源码位置：`packages/react-reconciler/src/ReactUpdateQueue.new.js,line165`

`FunctionComponent`的fiber：
```ts 
const effect = {
  tag: HookHasEffect,
  create:() => {},
  destroy: () => {},
  deps: [],
  next: null
}
effect.next = fiber.updateQueue.lastEffect.next
fiber.updateQueue.lastEffect.next = effect
fiber.updateQueue.lastEffect = effect
```
这个就是上边介绍effect的情形。

`HostComponent`的fiber：
```ts 
fiber.updateQueue = [
  {
    oldProps: {},
    newProps: {}
  }
]
```
这个就是讲render和commit时，介绍`HostComponent`的fiber如何更新，提及到的。

