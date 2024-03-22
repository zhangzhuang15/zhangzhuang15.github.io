---
title: "react概念梳理"
page: true
aside: true
---

## Description

### FiberRoot

```js
const fiberRoot = {
  // 标识是并发模式，还是以前的模式
  tag,
  // HTMLElement, ReactDOM.render(<App />, document.querySelector('#root'))
  // 里边的 document.querySelector("#root") 就是这玩意儿
  containerInfo,
  pendingChildren,

  // fiber节点，类似于一个哨兵节点，ReactDOM.render(<App />, document.querySelector('#root'))
  // 中的 <App /> 的 fiber节点并不是 current;
  // 每次 commit 完成之后， root.current = root.finishedWork
  current,
  // 每次 render 完成之后， root.finishedWork = root.current.alternate
  finishedWork,
  callbackNode,
};

fiberRoot.current.stateNode === fiberRoot; // it's true

// 在执行 ReactDOM.render(<App />, document.querySelector('#root')) 后，
// 会生成一个 Update 类型变量 update,
// update.payload = { element },
// element === <App />,
// update.tag === UpdateState
//
// 之后将
//   fiberRoot.current.updateQueue.shared.interleaved = update
// 或者
//   fiberRoot.current.updateQueue.shared.pending = update
//
// 最后开启任务调度，在执行 update 的时候，生成DOM树
```

### Fiber

```js

const fiber = {
    // 标记 fiber 节点对应的具体是什么，
    // FunctionComponent, 表示fiber对应的是一个函数组件，
    // ClassComponent, 表示fiber对应的是一个类组件
    // HostRoot, 表示fiber对应的是一个 DOM Tree 根节点
    // HostText, 表示 fiber 对应的是一个 DOM Text 节点
    // SuspenseComponent, 表示 fiber 对应的是一个 Suspense 组件
    tag,
    key,
    elementType,
    type,
    // 指向 DOM 节点或者 FiberRoot 节点
    stateNode,
    // 父 fiber 节点
    return,
    // 子 fiber 节点
    child,
    // 兄弟 fiber 节点
    sibling,
    index,
    ref,
    // 待更新为的属性
    pendingProps,
    // 目前的属性
    memorizedProps,
    // 更新队列
    // UpdateQueue类型
    // {
    //
    //   // 当前状态值， 每次更新的时候，都会用当前baseState值代入 Update 链表中计算得到新值，然后写入 baseState
    //   baseState,
    //   // Update 单向链表
    //   //  {
    //   //     eventTime,
    //   //     lane,
    //   //     tag,
    //   //     payload,
    //   //     callback,
    //   //     next,
    //   //  }
    //   firstBaseUpdate,
    //
    //   // Update 单向链表
    //   lastBaseUpdate,
    //   //
    //   // {
    //   //   // Update 单向环形链表，pending 指向最后一个节点，pending.next 指向的就是第一个节点
    //   //   // 采用尾插法加入新节点
    //   //   pending,
    //   //   // Update 单向环形链表，同 pending
    //   //   interleaved,
    //   //   lanes, // 优先级
    //   // }
    //   shared,
    //   // Update 数组
    //   effects,
    //   // fiber上所有useEffect、useLayoutEffect 创建的 effect
    //   // 会连接成一个单向循环链表，lastEffect 指向这个链表的末尾节点
    //   lastEffect,
    // }
    updateQueue,
    // 运行时中需要保存的值，
    memorizedState,
    dependencies,
    mode,
    // 标记要对fiber节点做怎样的mutation操作,
    // 比如 Placement, 就要做一些 dom insert 的操作，
    // 比如 Update, 就要做一些 dom content 更新的操作
    flags,
    // 标记子树要做怎样的mutation操作
    subtreeFlags,
    deletions,
    // 优先级
    lanes,
    // 子节点的优先级
    childLanes,
    // 本fiber节点的镜像fiber节点，用于 diff
    alternate,
}
```

### 几个全局变量

```js
let workInProgressRoot;
let workInProgress;
let workInProgressHook;
let currentlyRenderingFiber;
let currentHook;
let rootWithPendingPassiveEffects;
```

### hook
```js 

let hook = {
  memoizedState,
  baseState,
  // Update 环形单向链表
  baseQueue,
  queue,
  // 下一个 Hook
  next,
}

// fiber 和 hook 的关系
fiber.memoizedState = hook;
```

```js
const component = () => {
  const [a, setA] = useState(1);
  const b = useRef(2);
  
  useEffect(() => {}, [a, b.current]);

  // 执行到这里，表示 comopnent 的 fiber 节点会变为：
  //
  //
  // fiber
  // ----------------   useState hook    useRef hook   useEffect hook
  // |              |     _______          _______        _______
  // | memoizedState++++++|_____|++++++++++|_____|++++++++|_____|
  // ----------------    
}

```


### Effect
```js
let effect = {
  tag,
  // 函数 () => (() => void) | void，
  // useEffect(fn, [a, b]) 里的 fn 就是这玩意儿
  create,
  // 函数 (() => void) | void，
  // useEffect(fn, [a, b]) 里的 fn() 返回值就是这玩意儿
  destroy,
  // 依赖数组 Array<mixed> | null
  // useEffect(fn, [a, b]) 里的 [a, b] 就是这玩意儿
  deps,
  // 下一个Effect
  next,
}
```

```js
const fn = () => {console.log('A')}
const component = () => {
  useEffect(fn, []);

  // 执行到这里，表示 comopnent 的 fiber 节点会变为：
  //
  //
  // fiber
  // ----------------     useEffect hook   
  // |              |     ________________      effect <++++++++++++++++++++
  // | memoizedState++++++|              |     _____________________       +
  // |              |     | memoizedState++++++| create: fn         |      +
  // |  updateQueue |     |______________|     | destroy: undefined |      +
  // |______+______ |                          | deps: []           |      +
  //        +                                  | next               ++++++++
  //        +                                  |____________________|
  // ----------------                                  +
  // | lastEffect   ++++++++++++++++++++++++++++++++++++
  // |______________|
}
```

### 运行时本质
react的本质，就是一个不断调度执行 `performConcurrentWorkOnRoot` 函数或者`performSyncWorkOnRoot`函数
的过程。`ReactDom.render()`开启调度，`performConcurrentWorkOnRoot` 函数或者`performSyncWorkOnRoot`函数在执行完毕后，会调用`ensureRootIsScheduled`函数重新调度自己。而在这两个函数内部，执行两个主要的函数：
- render阶段：renderRootConcurrent (或 renderRootSync)
- commit阶段：finishConcurrentRender

同步模式下，render阶段会占据主线程，直到执行完 renderRootSync 函数;

并发模式下，render阶段会被中断（调度器库会判断中断，给出中断），用全局变量 `workInProgress`记录下一次要
render的fiber节点，然后将 performConcurrentWorkOnRoot 重新调度，准备下一次再进入到render阶段继续执
行未完成的工作；

render阶段的本质就是执行 `workLoopConcurrent` 函数或者`workLoopSync`函数。这两个函数内部是循环执行
`performUnitOfWork`函数的过程。对于同步模式，要在 `workInProgress === null` 时跳出循环；对于并发
模式，除了刚才的条件，还会在`shouldYield() === true` 时跳出循环，调度器库会判断下个任务是否还有时间执行，
如果没有，它就会设置一个变量，表示要中断执行下一个任务，并透过 shouldYield() 的执行结果告知上层应用；

#### useEffect(fn, deps)
##### 发生了什么
在mount阶段：

```js
// 创建一个 hook 
let hook = {};

// 创建一个 effect
let effect = {
  tag: HookHasEffect | HookPassive,
  create: fn,
  deps,
  destroy: null,
}

// effect 加入到 currentlyRenderingFiber.updateQueue.lastEffect 单向环形链表结尾


// 将 hook 加入到 currentlyRenderingFiber.memoizedState 单向链表结尾

// 给 currentlyRenderingFiber 打上 flag 标签
currentlyRenderingFiber.flags |=  PassiveEffect | PassiveStaticEffect;
```

update阶段：
```js
// currentlyRenderingFiber.memoizedState 链表上获取当前的 hook，
// 如果没有的话，基于currentlyRenderingFiber的镜像fiber节点的对应的hook，
// 拷贝出一个新的 hook
let hook = {};

// 判断以前的deps和当前的deps是否一样，
// 判断方法：
//   Object.is(oldDeps[i], deps[i]) 为 false, 则不一样


// 如果以前的deps和当前的deps不一样
// 给 currentlyRenderingFiber 打上 flag 标签
currentlyRenderingFiber.flags |=  PassiveEffect;
// 更新 hook.memoizedState
hook.memoizedState = {
  tag: HookHasEffect | HookPassive,
  create: fn,
  deps,
  destroy: hook.memoizedState.destroy,
};


// 如果以前的deps和当前的deps一样
// 更新 hook.memoizedState
hook.memoizedState = {
  tag: HookPassive,
  create: fn,
  deps,
  destroy: hook.memoizedState.destroy,
}
```

##### fn 什么时候执行
由上一节可知，无论是mount阶段，还是update阶段，fn 都不会立即执行；

fn执行的时机，发生在 flushPassiveEffect 函数；

flushPassiveEffect 函数会在以下时间点得到执行：
- 每次开始一批render任务之前；
- 结束render阶段（不管是并发render还是同步render），开始 commit 阶段前；
- 申请requestPaint之后；

##### fn 在父、子组件执行的先后顺序
flushPassiveEffect 执行的时候，是同步执行，会从 FiberRoot 出发，采取深度优先遍历fiber节点，
跳过 `fiber.flags & Passive === NoFlags` 的节点，按照 fiber.updateQueue.lastEffect 单向
循环链表，执行 effect 的 destroy 函数；

然后再从 FiberRoot 出发，深度优先遍历fiber节点，跳过 `fiber.flags & Passive === NoFlags` 的节点，
按照 fiber.updateQueue.lastEffect 单向循环链表，执行 effect 的 create 函数。

因此，子组件的 fn 会先执行，父组件后执行。

##### deps不变时，怎么就不会执行 fn 了
flushPassiveEffect 执行的时候，不是所有的 effect 都会执行，只有
`effect.tag & (HookPassive | HookHasEffect) === (HookPassive | HookHasEffect)`
的 effect 才会执行 destroy 和 create 函数。

deps不变时，useEffect会将effect的tag更新为 HookPassive, 显然
`HookPassive & (HookPassive | HookHasEffect) !== (HookPassive | HookHasEffect)`

所以 fn 不会执行

##### dev模式下，fn会执行两次？
要想执行两次，必须在 render 的时候使用 StrictMode 组件：

```js 
import { StrictMode } from "react";
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(<StrictMode><App /></StrictMode>, document.querySelector('#root'))
```

执行两次发生在 `flushPassiveEffectsImpl` 函数，

在没有开启StrictMode情况下，该函数会执行：
- commitPassiveUnmountEffects: 执行 effect.destroy
- commitPassiveMountEffects: 执行 effect.create
> effect必须满足 `effect.tag & (HookPassive | HookHasEffect) === (HookPassive | HookHasEffect)`


在开启StrictMode之后，在上述函数执行之后，会执行：`commitDoubleInvokeEffectsInDEV`;

这个函数会从FiberRoot出发，发生4次深度优先遍历：
1. 遍历flags中包含`MountLayoutDev`的fiber节点，执行useLayoutEffect引入的effect的destroy函数
2. 遍历flags中包含`MountPassiveDev`的fiber节点，执行useEffect引入的effect的destroy函数
3. 遍历flags中包含`MountLayoutDev`的fiber节点，执行useLayoutEffect引入的effect的create函数
4. 遍历flags中包含`MountPassiveDev`的fiber节点，执行useEffect引入的effect的create函数

`MountPassiveDev` 是 `MountPassiveDevEffect` 别名，是在开启StrictMode下，useEffect调用中给fiber设置的；

`MountLayoutDev`是`MountLayoutDevEffect` 别名，是在开启StrictMode下，useLayoutEffect调用中给fiber设置的；


useEffect和useLayoutEffect在给fiber打上`MountPassiveDevEffect`、`MountLayoutDevEffect`标签
也是有条件的：
- 在DEV环境
- 全局变量 enableStrictEffects 为 true
- fiber.mode 包含 StrictEffectsMode

DEV环境下，react的enableStrictEffects变量在编译的时候就是true，StrictMode组件对应的
fiber节点会设置StrictEffectsMode，在由父fiber开始向下创建子fiber的时候，这个Mode会传递
给子fiber，于是所有的fiber都将满足这三个条件。那么在这些fiber对应的函数组件里调用useEffect、
useLayoutEffect的时候，自然会打上相应的flag标签；

