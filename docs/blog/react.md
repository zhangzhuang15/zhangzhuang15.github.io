---
title: "react原理探索之旅"
page: true
aside: true
---

# Description
从一个简单的react代码开始。

```tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return <div>hello world {count}</div>
}

createRoot(document.getElementId("app")!)
  .render(<App />);
```

先大致说一下react渲染页面的思路。react采取fiber架构渲染页面，所谓的fiber架构，就是一个树结构。react需要创建一个根结点，它称之为**FiberRoot**，实际上，它就是一个javascript对象。这个对象有两个重要的属性，一个属性指向一个DOM节点，另外一个属性指向一个fiber节点，react称这个fiber节点为**RootFiber**。

fiber节点就是一个javascript对象，而且是一种树形节点。因为它有 `return` 属性，指向它的父节点；它有`sibling`属性，指向它的兄弟节点；它有`child`属性，指向它的子节点。那fiber节点有什么用呢？使用react开发过应用程序，你就会知道，你的应用本质上就是一个组件树，组件可能是 `class component` 实现的，也可能是 `function component` 实现的，还可能是react的内置组件，比如 `Suspense`, 无论怎样，每个组件都是组件树的一个节点，fiber 节点的作用就是记录下单个组件的状态，那么 fiber 树就是对整个组件树状态的记录，就像拍了张相片一样。渲染页面的过程，其实就是拿着fiber树的组件状态信息，将组件转化为DOM节点。这还不够，react需要检测到fiber树，一旦fiber树变化了，就应该再去拿着fiber树的信息，将组件转化为崭新的DOM节点。

你一定会想到一种更新策略：每次都重新生成一个fiber树，按照这个fiber树重新生成一遍DOM节点，然后把老的DOM节点全部删除，换上新的DOM节点。

这种方式可行，但效率不高，早期的react是这么干的，页面的组件一旦多了，这种方式就会非常慢，因为它没有跳过不需要更新的节点。

那么如何知道fiber节点是否更新了呢？直观的想法就是做比较，新fiber和老fiber之间做比较。所以，我们就必须要保存下新fiber和老fiber。react于是给fiber节点添加了`alternate`属性。老fiber的`alternate`属性指向新fiber，新fiber的`alternate`属性指向老fiber。这样就方便比较了。

既然fiber有新老之分，那么fiber树也有新老之分。**RootFiber**是fiber树的根节点，自然就会有新的**RootFiber**和老的**RootFiber**。

问题来了，如何区分哪一个是老的**RootFiber**？很简单，**FiberRoot**只有一个，它的`current`属性指向谁，谁就是老的**RootFiber**。

知道了这些，整个更新的思路就如下图所示，变得清晰了。每次更新的时候，生成一个新的fiber树，在生成每个新的fiber节点的时候，和老的fiber节点做对比，找出哪些fiber节点发生了变化，以及具体变化了什么，然后按照新fiber树收集到的信息，更新对应的DOM节点，更新完毕之后，**FiberRoot**的`current`属性指向新的**RootFiber**。

接下来，我们就结合开头给出的示例代码，了解更具体的过程。

## createRoot
```tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return <div>hello world {count}</div>
}

createRoot(document.getElementId("app")!)
  .render(<App />);
```

`createRoot`的作用，就是创建**FiberRoot**，并在它上面绑定一个新建的**RootFiber**。它的实现，位于react仓库的`packages/react-dom/src/client/ReactDOM.js`。

**FiberRoot**有如下的属性：
|属性名|解释|
|:--|:--|
| tag | 枚举值，区分生成fiber树的过程，使用并发模式，还是同步模式|
| containerInfo | DOM节点，指的就是示例代码的 `document.getElementId("app")`|
| current | 指向 RootFiber，也就是老fiber树的树根节点 |
| finishedWork | 当新的fiber树生成好了之后，就会把这个属性设置为新fiber树的树根节点 |
| callbackNode | 生成新的fiber树是一个任务函数，react用自定义的调度系统，调度这个任务函数，为了支持取消，就会把实现取消功能的函数赋值给 callbackNode属性 |

`createRoot`执行之后，我们就只有一个`FiberRoot`，还有一个`RootFiber`，fiber树光有一个树根节点，其余中间节点和叶子节点都没有生成。而这些节点的生成，是在`render`函数里完成的。

## render 
```tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return <div>hello world {count}</div>
}

createRoot(document.getElementId("app")!)
  .render(<App />);
```

先说几个注意事项：
1. RootFiber, FiberRoot 和 `<App />` 没有关系；
2. 会有一个fiber节点对应`<App />`, 但这个fiber节点不是RootFiber，而是RootFiber的子节点；
3. `<App />`经过jsx编译器处理后，得到的是ReactNode对象，并不是Fiber节点，当 `render` 函数执行后，要根据ReactNode对象生成与之对应的Fiber节点

为了方便理解接下来要说的事情，有必要先了解一下`<App />`的编译结果：
```tsx
import { useState, useEffect } from "react";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return /*#__PURE__*/_jsxs("div", {
    children: ["hello world ", count]
  });
};

/*#__PURE__*/_jsx(App, {});
```
> 上述代码，根据[babel playground](https://babeljs.io/repl)生成

可以看到， `<App />` 编译后的结果，就是`_jsx`返回的值，它是一个js对象，react称为 `ReactNode`。

我们不妨执行一下上述编译好的代码，看看这个`ReactNode`到底长什么样子：
```ts
const appReactNode = {
  _self: null,
  _source: null,
  ref: null,
  props: {},
  key: null,
  $$typeof: Symbol("react.element"),
  type: App,
}
```

`ReactNode`的实现，位于 `packages/react/src/jsx/ReactJSXElement.js`.

这里额外说一下，函数组件和类组件的定义都是挂载到 `type` 属性上的。

## react-reconciler的全局变量
|名称|解释|
|:--|:--|
|workInProgressRoot| |
|workInProgress| |
|executionContext||
|rootWithPendingPassiveEffects||
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
  // 每次 commit 完成之后， fiberRoot.current = fiberRoot.finishedWork
  current,
  // 每次 render 完成之后， fiberRoot.finishedWork = fiberRoot.current.alternate,
  // finishedWork 就是刚刚生成好的新fiber树根节点，commit阶段就会根据这个fiber树修改
  // DOM树，最终 finishedWork会成为 fiberRoot.current
  finishedWork,
  // 记录 fiberRoot 待执行的调度任务, 用于取消任务
  // 调度任务就是 performConcurrentWorkOnRoot or performSyncWorkOnRoot
  callbackNode,
};

fiberRoot.current.tag === HostRoot; // it's true
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
    // {
    //   // 优先级
    //   lanes,
    //   // contextItem 单向链表，记录当前fiber节点依赖的Context
    //   // {
    //   //   // React.createContext 返回的就是这个玩意儿
    //   //   context,
    //   //   // context._currentValue or context._currentValue2
    //   //   memoizedValue,
    //   //   // 下一个 contextItem
    //   //   next,
    //   // }
    //   firstContext,
    // }
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
// 当发起一起 re-render 的时候，都是从 fiberRoot 开始向下遍历完成的，
// 而 fiberRoot 不一定只有一个，比如：
// ReactDOM.render(<App />, document.querySelector('#root1'))
// ReactDOM.render(<App />, document.querySelector('#root2'))
//
// 就有两个 fiberRoot, 为了区分到底是哪个fiberRoot正在完成re-render的
// 工作，需要一个变量去标记，这个就是 workInProgressRoot
let workInProgressRoot;

// 当前正在被render的fiber节点；还有一个用途是记录上次render被中断时，
// 即将要被render的fiber节点；currentlyRenderingFiber 也是记录正
// 在被render的fiber节点，但是它专门用于useState这种hook内部的实现
let workInProgress;

// 每次对于一个fiber做render处理的时候，就会标记这个fiber
// 是 currentlyRenderingFiber；当useState这种hook被调用
// 的时候，其内部实现要访问当前被渲染的fiber节点，因此需要
// 一个变量记录这个fiber节点，就是该变量
let currentlyRenderingFiber;

//  hook1, hook2, hook3, hook4的数字没有顺序意义，只是为了方便区分命名
//
//                                      workInProgressHook
//                                             |
//  currentlyRenderingFiber.memoizedState -> hook1 ->  hook2
//
//  currentlyRenderingFiber.alternate.memoizedState -> hook3 -> hook4
//                                                       ｜
//                                                   currentHook
//
let currentHook;
let workInProgressHook;

let rootWithPendingPassiveEffects;
```

### hook

```js
let hook = {
  // 记录中间状态值，
  // [value, setValue] = useState(1) 的 value 就是这玩意儿，
  // useEffect(fn, deps)中，根据 fn 创建的 effect 也是这玩意儿
  memoizedState,
  // 初始值，比如 useState(10), 10就是这个玩意儿
  baseState,
  // Update 环形单向链表,
  // 正要执行的 Update,
  // 比如，在更新阶段，useState 会遍历这些节点，计算出新的state
  baseQueue,
  // {
  //   // Update 单向环形链表
  //   pending,
  //   // Update 单向环形链表，
  //   // 在render阶段开始的时候，会从头节点摘除所有Update，依次加入到 pending 链表末尾
  //   interleaved,
  //   // 优先级
  //   lanes,
  //   // 状态更新触发器，
  //   // [value, setValue] = useState(0) 里的 setValue 就是这玩意儿
  //   dispatch,
  //   lastRenderedReducer: ((S, A) => S) | null,
  //   lastRenderedState: S | null,
  // }
  queue,
  // 下一个 Hook
  next,
};

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
};
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
};
```

```js
const fn = () => {
  console.log("A");
};
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
};
```

### 运行时本质

react 的本质，就是一个不断调度执行 `performConcurrentWorkOnRoot` 函数或者`performSyncWorkOnRoot`函数
的过程。`ReactDom.render()`开启调度，`performConcurrentWorkOnRoot` 函数或者`performSyncWorkOnRoot`函数在执行完毕后，会调用`ensureRootIsScheduled`函数重新调度自己。而在这两个函数内部，执行两个主要的函数：

- render 阶段：renderRootConcurrent (或 renderRootSync)
- commit 阶段：finishConcurrentRender

同步模式下，render 阶段会占据主线程，直到执行完 renderRootSync 函数;

并发模式下，render 阶段会被中断（调度器库会判断中断，给出中断），用全局变量 `workInProgress`记录下一次要
render 的 fiber 节点，然后将 performConcurrentWorkOnRoot 重新调度，准备下一次再进入到 render 阶段继续执
行未完成的工作；

render 阶段的本质就是执行 `workLoopConcurrent` 函数或者`workLoopSync`函数。这两个函数内部是循环执行
`performUnitOfWork`函数的过程。对于同步模式，要在 `workInProgress === null` 时跳出循环；对于并发
模式，除了刚才的条件，还会在`shouldYield() === true` 时跳出循环，调度器库会判断下个任务是否还有时间执行，
如果没有，它就会设置一个变量，表示要中断执行下一个任务，并透过 shouldYield() 的执行结果告知上层应用；

### ReactNode 树如何转化成 fiber 树

```js
import ReactDOM from "react-dom";

const App = () => <div></div>;

ReactDOM.render(<App />, document.getElementById("root"));
```

`<App />` 就是一个 ReactNode，当 `render` 方法执行后，`<App />` 会作为一个
新的 update 对象的 payload.element 属性，这个新的 update 会被添加到 fiberRoot.current.updateQueue.shared.pending，之后会调度执行 `performConcurrentWorkOnRoot` 或者
`performSyncWorkOnRoot`；

对一个 fiber 节点执行渲染工作，就是执行`beginWork`函数；

整个渲染是从 `fiberRoot.current` 开始的，这个 fiber 节点非常特殊，
是 HostRootFiber，渲染最开始的时候，会调用`createWorkInProgree`函数
创建出它的镜像节点，并用全局变量`workInProgress`指向它。镜像 fiber 的属性
和原 fiber 保持一致，优先级相关的属性会设置为 NoLanes ：

```js

/**
 *        fiberRoot
 *           |
 *           |
 *    fiberRoot.current  -------------->   workInProgress
 *           |                                    |
 *           | child                              |  child
 *           v                                    |
 *    fiberRoot.current.child  <-------------------
 *
 *
 *   workInProgress.child === fiberRoot.current.child
 *
 *   current === fiberRoot.current
 * /
```

显然，此时 `current.child === null`;

怎么生成子 fiber 呢？

很简单。将 `current.updateQueue.shared.pending` 上的 update 合并到
`current.updateQueue.firstBaseUpdate` 代表的单向链表中，然后顺着
这个链表，代入 `current.updateQueue.baseState`, 计算得到最终的 state。

还记得嘛，上边已经提到，`<App />` 这个 ReactNode 已经加入到 `current.updateQueue.shared.pending`中了，计算得到的 state 中，state.element 就是最终的 ReactNode，
workInProgress 会根据它生成子 fiber！

一开始，`current.updateQueue.baseState.element === null`, 而新的 state.element 不是 null，于是就会执行 `reconcileChildren` 函数，得到下面的结果：

```js
/**
 *
 *       fiberRoot
 *           |
 *           |
 *    fiberRoot.current  -------------->   workInProgress
 *           |                                    |
 *           | child                              |  child
 *           v                                    v
 *          null                                 App   <-- workInProgress
 *
 * /
```

下一次执行 `beginWork`的时候，`current` 会被设置为 `workInProgress.alternate`,
显然这将使`current = null`;

`App` 是 `FunctionComponent` 类型的 fiber，会执行组件函数，得到新的 ReactNode,
`App` 的子 fiber 就会基于这个 ReactNode 生成；

怎么将 ReactElement 转化为 fiber 呢？React 有完成这件工作的函数，比如 `createFiberFromElement` 函数；

最终就会得到：

```js
/**
 *
 *       fiberRoot
 *           |
 *           |
 *    fiberRoot.current  -------------->   workInProgress
 *           |                                    |
 *           | child                              |  child
 *           v                                    v
 *          null                                 App
 *                                                |
 *                                                |
 *                                                v
 *                                               Div
 *                                                |
 *                                                |
 *                                                v
 *                                               null  <-- workInProgress
 * /
```

等到下一次渲染时：

```js
/**
*
*                                           fiberRoot
*                                                |
*                                                |
*    workInProgress   -------------->   fiberRoot.current
*           |                                    |
*           | child                              |  child
*           |                                    v
*           ----------------------------------> App
*                                                |
*                                                |
*                                                v
*                                               Div
*                                                |
*                                                |
*                                                v
*                                               null
* /
```

注意，每次渲染的时候， `workInProgress.child = fiberRoot.current.child`,
也就是说，新一次的渲染，会重新构建一遍 fiber 树，之前已经生成的会被丢弃。

当然，以上介绍的只是一个大致的简化版经过。

### useEffect(fn, deps)

#### 发生了什么

在 mount 阶段：

```js
// 创建一个 hook
let hook = {};

// 创建一个 effect
let effect = {
  tag: HookHasEffect | HookPassive,
  create: fn,
  deps,
  destroy: null,
};

// effect 加入到 currentlyRenderingFiber.updateQueue.lastEffect 单向环形链表结尾

// 将 hook 加入到 currentlyRenderingFiber.memoizedState 单向链表结尾

// 给 currentlyRenderingFiber 打上 flag 标签
currentlyRenderingFiber.flags |= PassiveEffect | PassiveStaticEffect;
```

update 阶段：

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
currentlyRenderingFiber.flags |= PassiveEffect;
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
};
```

#### fn 什么时候执行

由上一节可知，无论是 mount 阶段，还是 update 阶段，fn 都不会立即执行；

fn 执行的时机，发生在 `flushPassiveEffects` 函数；

在同步模式下，一次调度任务对应执行一次`performSyncWorkOnRoot`；

在并发模式下，一次调度任务对应执行一次`performConcurrentWorkOnRoot`;

`flushPassiveEffects` 函数会在以下时间点得到执行：

1. `performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot` 的开始部分，进入 render 工作之前；
2. commit 阶段中的最开始部分；
3. commit 阶段中， `requestPaint` 之后；

值得留意的是，在 `flushPassiveEffect` 函数内部有一个执行条件，仅仅当
`rootWithPendingPassiveEffects !== null` 时，才会执行各个 useEffect 的 fn;

`rootWithPendingPassiveEffects`在开始进入 render 的时候，是 null，会在 commit 阶段的
`requestPaint`之后，才会被设置为 fiberRoot;

由此可以得到这样的结论：

如果 react 应用是第一次完成 render 和 commit，在 commit 结束环节，`rootWithPendingPassiveEffects`
会被设置为 fiberRoot，那么第一次挂上的 effect，会在下一次调度任务中执行，也就是上边说的第一个执行时间点；

`flushPassiveEffects` 执行之后，`rootWithPendingPassiveEffects`肯定会被设置为 null，下次再执行，
就要等到 commit 阶段即将结束时，重新将`rootWithPendingPassiveEffects`设置为 fiberRoot. 在一些情况
下，会在 commit 阶段即将结束时，同步执行`flushPassiveEffects`, 这种情况一般就是在 commit 阶段的工作
中发生了些错误；

综上所述，effect 会在下一次调度任务时执行，换言之，就是在 react 页面 DOM 更新之后，才会被执行；而
layoutEffect 是在当前调度任务的 commit 阶段被执行，useEffect 产生的 effect 是在下一次调度任务被执行，
所以说，useEffect 产生的 effect 要晚于 layoutEffect 才被执行。

#### fn 在父、子组件执行的先后顺序

flushPassiveEffect 执行的时候，是同步执行，会从 FiberRoot 出发，采取深度优先遍历 fiber 节点，
跳过 `fiber.flags & Passive === NoFlags` 的节点，按照 fiber.updateQueue.lastEffect 单向
循环链表，执行 effect 的 destroy 函数；

然后再从 FiberRoot 出发，深度优先遍历 fiber 节点，跳过 `fiber.flags & Passive === NoFlags` 的节点，
按照 fiber.updateQueue.lastEffect 单向循环链表，执行 effect 的 create 函数。

因此，子组件的 fn 会先执行，父组件后执行。

#### deps 不变时，怎么就不会执行 fn 了

flushPassiveEffect 执行的时候，不是所有的 effect 都会执行，只有
`effect.tag & (HookPassive | HookHasEffect) === (HookPassive | HookHasEffect)`
的 effect 才会执行 destroy 和 create 函数。

deps 不变时，useEffect 会将 effect 的 tag 更新为 HookPassive, 显然
`HookPassive & (HookPassive | HookHasEffect) !== (HookPassive | HookHasEffect)`

所以 fn 不会执行

#### dev 模式下，fn 会执行两次？

并不是 dev 模式，是在严格模式下才会执行两次。

要想执行两次，必须在 render 的时候使用 StrictMode 组件：

```js
import { StrictMode } from "react";
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.querySelector("#root")
);
```

执行两次发生在 `flushPassiveEffectsImpl` 函数，

在没有开启 StrictMode 情况下，该函数会执行：

- commitPassiveUnmountEffects: 执行 effect.destroy
- commitPassiveMountEffects: 执行 effect.create
  > effect 必须满足 `effect.tag & (HookPassive | HookHasEffect) === (HookPassive | HookHasEffect)`

在开启 StrictMode 之后，在上述函数执行之后，会执行：`commitDoubleInvokeEffectsInDEV`;

这个函数会从 FiberRoot 出发，发生 4 次深度优先遍历：

1. 遍历 flags 中包含`MountLayoutDev`的 fiber 节点，执行 useLayoutEffect 引入的 effect 的 destroy 函数
2. 遍历 flags 中包含`MountPassiveDev`的 fiber 节点，执行 useEffect 引入的 effect 的 destroy 函数
3. 遍历 flags 中包含`MountLayoutDev`的 fiber 节点，执行 useLayoutEffect 引入的 effect 的 create 函数
4. 遍历 flags 中包含`MountPassiveDev`的 fiber 节点，执行 useEffect 引入的 effect 的 create 函数

`MountPassiveDev` 是 `MountPassiveDevEffect` 别名，是在开启 StrictMode 下，useEffect 调用中给 fiber 设置的；

`MountLayoutDev`是`MountLayoutDevEffect` 别名，是在开启 StrictMode 下，useLayoutEffect 调用中给 fiber 设置的；

useEffect 和 useLayoutEffect 在给 fiber 打上`MountPassiveDevEffect`、`MountLayoutDevEffect`标签
也是有条件的：

- 在 DEV 环境
- 全局变量 enableStrictEffects 为 true
- fiber.mode 包含 StrictEffectsMode

DEV 环境下，react 的 enableStrictEffects 变量在编译的时候就是 true，StrictMode 组件对应的
fiber 节点会设置 StrictEffectsMode，在由父 fiber 开始向下创建子 fiber 的时候，这个 Mode 会传递
给子 fiber，于是所有的 fiber 都将满足这三个条件。那么在这些 fiber 对应的函数组件里调用 useEffect、
useLayoutEffect 的时候，自然会打上相应的 flag 标签；

### `const [value, setValue] = useState(10)`

#### 发生了什么

mount 阶段：

```js
function baseicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

// 创建一个hook
let hook = {};

// 绑定初始值
// 这里使用的值10，如果是函数，则用函数的返回值
hook.memoizedState = hook.baseState = 10;

// 创建一个 UpdateQueue
const queue = {
  pending: null,
  interleaved: null,
  lanes: NoLanes,
  dispatch: null,
  lastRenderedReducer: basicStateReducer,
  lastRenderedState: 10,
};
hook.queue = queue;

// 设置queue的 dispatch
queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);

return [10, queue.dispatch];
```

update 阶段：

```js
function baseicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

// 这部分逻辑调用 updateReducer 实现，在更新阶段，
// useReducer 和 useState 表现其实一样

// currentlyRenderingFiber.memoizedState 链表上获取当前的 hook，
// 如果没有的话，基于currentlyRenderingFiber的镜像fiber节点的对应的hook，
// 拷贝出一个新的 hook, 我们使用 currentHook 表示currentlyRenderingFiber的
// 镜像fiber节点的对应的hook
let hook = {
  // 以下属性，要么是原来就有的，要么是从currentlyRenderingFiber的镜
  // 像fiber节点的对应的hook拷贝的
  memoizedState,
  baseState,
  baseQueue,
  queue,
  next,
};

hook.queue.lastRenderedReducer = basicStateReducer;

// 将 hook.queue.pengding 合并到 currentHook.baseQueue 末尾

// 将 currentHook.baseState 代入 currentHook.baseQueue 里的每一个 Update，
// 计算出 newState， 一个 Update 可以理解为一个 (oldState) => state 的函数

hook.memoizedState = newState;
hook.baseState = newState;
hook.baseQueue = null;
hook.queue.lastRenderedState = newState;

// hook.queue.dispatch 是 mount 阶段生成的
return [hook.memoizedState, hook.queue.dispatch];
```

:::tip <TipIcon />
在更新阶段， 执行`useState(10)`的时候，10根本没有用到，因此，在如下代码中，父组件更新component组件的props时，component组件的state不会更新：
```js 
const component = (props) => {
  const [state, _] = useState(props.state);
}

const parent = () => {
  const [num, setNum] = useState(10);
  useEffect(() => {
    setNum(100);
  }, [])

  return <>
    <component state={num} />
  </>
}
```

如果想让 props.state 更新后，state也更新：
```js 
const component = (props) => {
  const [state, setState] = useState(props.state);

  useEffect(() => {
    setState(props.state)
  }, [
    props.state
  ]);
}

```
:::

#### setValue 被调用的时候发生了什么？

由上述分析可知，setValue 就是 `dispatchSetState`, 这个函数做的事情：

```js
// 假设触发 setValue(v => v + 3), 看看 dispatchSetState 做了什么

// 我们用 hook 表示 setValue 对应的 useState 这个hook

// 创建一个 Update
const update = {
  lane,
  // action 就是 v => v + 3
  action,
  hasEagerState: false,
  eagerState: null,
  next: null,
};

// 如果是发生在 render 阶段, 将 update 加入到 hook.queue.pending 末尾

// 如果不是render阶段调用的 dispatchSetState, 将 update 加入到
// hook.queue.pending 末尾或者 hook.queue.interleaved 末尾

// 接着可能发生一步预计算, 用
//  hook.queue.lastRenderedReducer(hook.queue.lastRenderedState, update.action)
// 计算出一个newState, 如果使用Object.is判断出newState和hook.queue.lastRenderedState
// 一样，dispatchSetState就此提前结束

// 如果上一步没有发生，或者发生了不符合预期，会调用ensureRootIsScheduled触发一次render调度
```

#### 批量更新如何做到的？

批量更新的意思：

```js
const component = () => {
  const [value, setValue] = useState(10);

  const onClick = () => {
    // 调用三次 setValue，只会触发一次 re-render,
    // 这就是批量更新
    setValue((v) => v + 2);
    setValue((v) => v + 1);
    setValue((v) => v * 2);
  };
};
```

秘诀在于 `dispatchSetState`:

1. 每次调用时，只是将 action 加入到 hook.queue.pending 或者 hook.queue.interleaved 链表，
   多次调用就加入多个节点，而执行的时候，是一次执行完链表上的所有节点，这就是批量了
2. 每次调用的时候，如果安排调度，会使用`ensureRootIsScheduled`去调度，这个函数内部实现了调度
   排重，如果发现已经调度了，要么就不调度了，要么就取消已经调度的任务，生成一个新的调度任务。不论
   怎么处理吧，结果就是不会重复调度

### `const v = useMemo(fn, deps)`

#### 发生了什么

### `React.createContext` and `useContext`

#### `const context = React.createContext(defaultValue)`

```js
// 创建一个类型为REACT_CONTEXT_TYPE的ReactNode
const context = {
  $$typeof: REACT_CONTEXT_TYPE,
  _currentValue: defaultValue,
  _currentValue2: defaultValue,
  _threadCount: 0,
  Provider: null,
  Consumer: null,
  _defaultValue: null,
  _globalName: null,
};

// 给context绑定一个Provider,Provider也是一个ReactNode,
// 类型为 REACT_PROVIDER_TYPE
context.Provider = {
  $$typeof: REACT_PROVIDER_TYPE,
  _context: context,
};

context.Consumer = context;

return context;
```

#### `const value = useContext(context)`

```js
// 读取value
const value = context._currentValue or context._currentValue2;

// 添加 context 依赖
// 如果 context 不是第一个依赖，contextItem 会加入到 firstContext.next 的链表上
const contextItem = {
     context: context,
     memoizedValue: value,
     next: null,
}
currentlyRenderingFiber.dependencies = {
  lanes: NoLanes,
  firstContext:  contextItem,
}

return value
```

### 函数组件什么时候会执行？

```js
const component = () => {};

// 你定义了一个组件，那么什么时候 component 函数会被调用？
```

执行 `component` 函数发生在 render 阶段；

render 阶段，对于单个 fiber 节点的操作在 `beginWork` 函数完成；

以函数组件为例，在 `beginWork` 函数中，调用 `updateFunctionComponent`就会触发 `component` 函数；

查看 `beginWork` 函数的实现，如果不执行 `component` 函数，要满足：

1. 组件的 props 没有发生变化： `current.memoizedProps === workInProgress.pendingProps`
2. type 没有发生变化：`current.type === workInProgress.type`
3. 当前组件没有调度更新
