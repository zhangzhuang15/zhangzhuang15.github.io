---
title: "react原理探索之旅"
page: true
aside: true
---

# Description

从一个简单的 react 代码开始。

```tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return <div>hello world {count}</div>;
};

createRoot(document.getElementId("app")!).render(<App />);
```

先大致说一下 react 渲染页面的思路。react 采取 fiber 架构渲染页面，所谓的 fiber 架构，就是一个树结构。react 需要创建一个根结点，它称之为**FiberRoot**，实际上，它就是一个 javascript 对象。这个对象有两个重要的属性，一个属性指向一个 DOM 节点，另外一个属性指向一个 fiber 节点，react 称这个 fiber 节点为**RootFiber**。

fiber 节点就是一个 javascript 对象，而且是一种树形节点。因为它有 `return` 属性，指向它的父节点；它有`sibling`属性，指向它的兄弟节点；它有`child`属性，指向它的子节点。那 fiber 节点有什么用呢？使用 react 开发过应用程序，你就会知道，你的应用本质上就是一个组件树，组件可能是 `class component` 实现的，也可能是 `function component` 实现的，还可能是 react 的内置组件，比如 `Suspense`, 无论怎样，每个组件都是组件树的一个节点，fiber 节点的作用就是记录下单个组件的状态，那么 fiber 树就是对整个组件树状态的记录，就像拍了张相片一样。渲染页面的过程，其实就是拿着 fiber 树的组件状态信息，将组件转化为 DOM 节点。这还不够，react 需要检测到 fiber 树，一旦 fiber 树变化了，就应该再去拿着 fiber 树的信息，将组件转化为崭新的 DOM 节点。

你一定会想到一种更新策略：每次都重新生成一个 fiber 树，按照这个 fiber 树重新生成一遍 DOM 节点，然后把老的 DOM 节点全部删除，换上新的 DOM 节点。

这种方式可行，但效率不高，早期的 react 是这么干的，页面的组件一旦多了，这种方式就会非常慢，因为它没有跳过不需要更新的节点。

那么如何知道 fiber 节点是否更新了呢？直观的想法就是做比较，新 fiber 和老 fiber 之间做比较。所以，我们就必须要保存下新 fiber 和老 fiber。react 于是给 fiber 节点添加了`alternate`属性。老 fiber 的`alternate`属性指向新 fiber，新 fiber 的`alternate`属性指向老 fiber。这样就方便比较了。

既然 fiber 有新老之分，那么 fiber 树也有新老之分。**RootFiber**是 fiber 树的根节点，自然就会有新的**RootFiber**和老的**RootFiber**。

问题来了，如何区分哪一个是老的**RootFiber**？很简单，**FiberRoot**只有一个，它的`current`属性指向谁，谁就是老的**RootFiber**。

知道了这些，整个更新的思路就如下图所示，变得清晰了。每次更新的时候，生成一个新的 fiber 树，在生成每个新的 fiber 节点的时候，和老的 fiber 节点做对比，找出哪些 fiber 节点发生了变化，以及具体变化了什么，然后按照新 fiber 树收集到的信息，更新对应的 DOM 节点，更新完毕之后，**FiberRoot**的`current`属性指向新的**RootFiber**。

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
  return <div>hello world {count}</div>;
};

createRoot(document.getElementId("app")!).render(<App />);
```

`createRoot`的作用，就是创建**FiberRoot**，并在它上面绑定一个新建的**RootFiber**。它的实现，位于 react 仓库的`packages/react-dom/src/client/ReactDOM.js`。

**FiberRoot**有如下的属性：
|属性名|解释|
|:--|:--|
| tag | 枚举值，区分生成 fiber 树的过程，使用并发模式，还是同步模式|
| containerInfo | DOM 节点，指的就是示例代码的 `document.getElementId("app")`|
| current | 指向 RootFiber，也就是老 fiber 树的树根节点 |
| finishedWork | 当新的 fiber 树生成好了之后，就会把这个属性设置为新 fiber 树的树根节点 |
| callbackNode | 生成新的 fiber 树是一个任务函数，react 用自定义的调度系统，调度这个任务函数，为了支持取消，就会把实现取消功能的函数赋值给 callbackNode 属性 |

`createRoot`执行之后，我们就只有一个`FiberRoot`，还有一个`RootFiber`，fiber 树光有一个树根节点，其余中间节点和叶子节点都没有生成。而这些节点的生成，是在`render`函数里完成的。

## render

```tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return <div>hello world {count}</div>;
};

createRoot(document.getElementId("app")!).render(<App />);
```

先说几个注意事项：

1. RootFiber, FiberRoot 和 `<App />` 没有关系；
2. 会有一个 fiber 节点对应`<App />`, 但这个 fiber 节点不是 RootFiber，而是 RootFiber 的子节点；
3. `<App />`经过 jsx 编译器处理后，得到的是 ReactNode 对象，并不是 Fiber 节点，当 `render` 函数执行后，要根据 ReactNode 对象生成与之对应的 Fiber 节点

为了方便理解接下来要说的事情，有必要先了解一下`<App />`的编译结果：

```tsx
import { useState, useEffect } from "react";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";

const App = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(5);
  }, []);
  return /*#__PURE__*/ _jsxs("div", {
    children: ["hello world ", count],
  });
};

/*#__PURE__*/ _jsx(App, {});
```

> 上述代码，根据[babel playground](https://babeljs.io/repl)生成

可以看到， `<App />` 编译后的结果，就是`_jsx`返回的值，它是一个 js 对象，react 称为 `ReactNode`。

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
};
```

`ReactNode`的实现，位于 `packages/react/src/jsx/ReactJSXElement.js`.

类组件就不举例子了，函数组件和类组件的定义都是挂载到 `type` 属性上的。

下面就可以聊聊`render`了，其定义于`packages/react-dom/src/client/ReactDOMRoot.js`:

```js
ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
  const fiberRoot = this._internalRoot;
  updateContainer(children, root, null, null);
};
```

`children`说的就是上边提到的 ReactNode——`<App />`.

自`updateContainer`开始，发生的事情都位于`packages/react-reconciler`, 也就是这个包才是 react 的核心所在，其它的包都是围绕着它转。

`updateContainer`做三件事：

1. 找到旧 fiber 树的根节点 oldRootFiber。获取方式就是 fiberRoot.current。
2. 搞出来一个 js 对象，将 `<App />`挂到这个对象上，并将该对象加入 oldRootFiber 的 updateQueue 属性。React 称这个 js 对象是 Update。
3. 最关键的一步，将 fiberRoot 加入到调度系统，异步执行 fiber 树的更新。

Update 的想法很简单，就是不立即执行任务，而是生成一个任务，用 update.payload 记录任务函数所需的入参，用 update.tag 作为枚举标识，确认要执行哪个任务函数。如果 update 多了话，就将它们按照单链表的形式连接起来，挂到 updateQueue 上。等到 fiber 节点被调度到的时候，就会取出这些 update 任务，一一执行。

react 的调度系统是一个比较麻烦的事情，要单独开一节解释，这里先不做介绍了。调度系统的本质，就是将一个 js 函数安排到一个宏任务或者微任务。这里，只需要将调度系统理解为一个 API，调用这个 API，传入一个函数，这个函数不久就会在一个宏任务里执行。

接下来，我们关心的是，fiberRoot 在加入到调度系统之前，发生了什么事情，当 fiberRoot 被调度到的时候，发生什么事情。

第一个问题的答案位于`packages/react-reconciler/src/ReactFiberWorkLoop.js`的`scheduleUpdateOnFiber`函数。这个函数内部有一步是执行`prepareFreshStack`。这个函数做的事情是：

1. 判断 oldRootFiber.alternate 是否存在
2. 不存在，就照着 oldRootFiber 复制出一个 newRootFiber，oldRootFiber.alternate = newRootFiber, newRootFiber.alternate = oldRootFiber
3. 如果存在，将 oldRootFiber 的状态同步到 oldRootFiber.alternate
   > 这样处理之后，oldRootFiber.alternate.child === oldRootFiber.child, 即新老 RootFiber 的子节点保持一致。

第二个问题的答案，其实也在`scheduleUpdateOnFiber`函数中，它存在这样的函数调用栈：

1. `scheduleUpdateOnFiber`
2. `ensureRootIsScheduled`
3. `processRootScheduleInMicrotask`
4. `scheduleTaskForRootDuringMicrotask`
5. `scheduleCallback`
6. `performConcurrentWorkOnRoot`

`scheduleCallback`会把`performConcurrentWorkOnRoot`安排到调度系统中，`performConcurrentWorkOnRoot`在之后得以异步执行。因此第二个问题的答案就出来了，fiberRoot 被调度到的时候，发生了什么事情？`performConcurrentWorkOnRoot`里边执行了什么，它就发生了什么事情。

OK，在说`performConcurrentWorkOnRoot`发生了什么之前，不妨看下 fiber 树的状态：

```txt
          FiberRoot
           /
  current /
         /
        /           alternate
  oldRootFiber <--------------> newRootFiber
```

`performConcurrentWorkOnRoot`位于`packages/react-reconciler/src/ReactFiberWorkLoop.js`, 它主要做了这样的事情：

1. `flushPassiveEffects`, 将待执行的 effect 全部执行一遍，这里的 effect 明确地讲，就是 useEffect 注册那些 effect，我们在后边会单独聊聊 hook 的本质。
   > 这里提前透露一下执行顺序，具体的会在后边聊 hook 的时候提到。以当前 fiber 为基准，深度优先遍历执行各个后代 fiber 的 umount，最后执行当前 fiber 的 unmount，然后再次深度优先遍历执行各个后代 fiber 的 mount，最后执行当前 fiber 的 mount。useEffect 的入参函数就是 mount，这个函数的返回值就是 unmount。
2. `renderRootConcurrent`, 这个函数就是执行 react 的 fiber 树渲染逻辑了，也就是生成新的 fiber 树，我们上边说过，目前只有一个 newRootFiber 和 oldRootFiber，它们下边没有其余 fiber，这个函数就会生成这些 fiber。这个函数会返回一个状态枚举，根据枚举值来决定第三步做什么事情。关于`renderRootConcurrent`究竟做了什么事情，稍后会展开讲。
3. 如果第二步返回的枚举值表示 fiber 树没有生成完，调用`ensureRootIsScheduled`, 把`performConcurrentWorkOnRoot`再次加入调度系统，等未来执行
4. 如果返回的枚举值表示 fiber 树正常生成完，则会发生如下调用栈：
5. `finishConcurrentRender`
6. `commitRootWhenReady`
7. `commitRoot`, 这里发生的事情就是把 fiber 树的状态同步到 DOM 树。这个函数也是重点，稍后会展开讲。
8. 调用`ensureRootIsScheduled`, 把`performConcurrentWorkOnRoot`再次加入调度系统，等未来执行。因为在第 3 步，会执行 useLayoutEffect，这可能导致新 fiber 树状态发生变化，需要安排一次调度兜底。

好的，我们接着先说说`renderRootConcurrent`, 因为我们定义好的 React 函数组件，以及组件内部执行的 React Hook 都是在这个函数内，得到执行的。它的逻辑很简单：

1. 执行`workLoopConcurrent`
2. 判断 fiber 树是否渲染完成，把这个结果以枚举值的形式返回，要么是渲染完，要么是渲染中；

显而易见，`workLoopConcurrent`才是焦点！它本身就是一个循环，循环的条件必须满足这两点：

1. workInProgress !== null. 这个条件的意思是仍然有新 fiber 节点需要生成，workInProgress 最开始的值就是 newRootFiber。
   > workInProgress 设置初始值，在`prepareFreshStack`函数内完成，这个函数也位于`packages/react-reconciler/src/ReactFiberWorkLoop.js`
2. shouldYield() === false. 调度系统暴露 requestPaint 函数，这个函数内部会改写变量值，导致 shouldYield 函数返回 true, 从而强制结束循环，令`workLoopConcurrent`返回。

而循环体只需要做一件事，那就是执行`performUnitOfWork`.

## react-reconciler 的全局变量

| 名称                          | 解释 |
| :---------------------------- | :--- |
| workInProgressRoot            |      |
| workInProgress                |      |
| executionContext              |      |
| rootWithPendingPassiveEffects |      |

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

  // 执行到这里，表示 component 的 fiber 节点会变为：
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

## 运行时本质

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

## ReactNode 树如何转化成 fiber 树

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

## useEffect(fn, deps)

### 发生了什么

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

### fn 在父、子组件执行的先后顺序

flushPassiveEffect 执行的时候，是同步执行，会从 FiberRoot 出发，采取深度优先遍历 fiber 节点，
跳过 `fiber.flags & Passive === NoFlags` 的节点，按照 fiber.updateQueue.lastEffect 单向
循环链表，执行 effect 的 destroy 函数；

然后再从 FiberRoot 出发，深度优先遍历 fiber 节点，跳过 `fiber.flags & Passive === NoFlags` 的节点，
按照 fiber.updateQueue.lastEffect 单向循环链表，执行 effect 的 create 函数。

因此，子组件的 fn 会先执行，父组件后执行。

### deps 不变时，怎么就不会执行 fn 了

flushPassiveEffect 执行的时候，不是所有的 effect 都会执行，只有
`effect.tag & (HookPassive | HookHasEffect) === (HookPassive | HookHasEffect)`
的 effect 才会执行 destroy 和 create 函数。

deps 不变时，useEffect 会将 effect 的 tag 更新为 HookPassive, 显然
`HookPassive & (HookPassive | HookHasEffect) !== (HookPassive | HookHasEffect)`

所以 fn 不会执行

### dev 模式下，fn 会执行两次？

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

## `const [value, setValue] = useState(10)`

### 发生了什么

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
在更新阶段， 执行`useState(10)`的时候，10 根本没有用到，因此，在如下代码中，父组件更新 component 组件的 props 时，component 组件的 state 不会更新：

```js
const component = (props) => {
  const [state, _] = useState(props.state);
};

const parent = () => {
  const [num, setNum] = useState(10);
  useEffect(() => {
    setNum(100);
  }, []);

  return (
    <>
      <component state={num} />
    </>
  );
};
```

如果想让 props.state 更新后，state 也更新：

```js
const component = (props) => {
  const [state, setState] = useState(props.state);

  useEffect(() => {
    setState(props.state);
  }, [props.state]);
};
```

:::

### setValue 被调用的时候发生了什么？

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

### 批量更新如何做到的？

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

## `const v = useMemo(fn, deps)`

### 发生了什么

## `React.createContext` and `useContext`

### `const context = React.createContext(defaultValue)`

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

### `const value = useContext(context)`

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

## 函数组件什么时候会执行？

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

## 其他碎碎念

### DOM Diff 算法

1. 为什么需要虚拟 DOM？

直接操作真实 DOM 很慢，因为每次修改都可能触发浏览器的 reflow/repaint。虚拟 DOM 是一棵纯 JS 对象树，diff 在内存中完成，最后只把最小变更集同步到真实 DOM。

```js
// 虚拟节点的基本结构
{
  type: 'div',           // 标签名或组件
  props: { class: 'app', onClick: fn },
  children: [
    { type: 'span', props: {}, children: ['hello'] },
    { type: 'p',    props: {}, children: ['world'] }
  ],
  key: null              // 列表优化的关键字段
}
```

2. 朴素 Diff 的理论复杂度
   对两棵任意树做最小编辑距离（Tree Edit Distance）是一个经典算法问题。
   **Zhang-Shasha 算法（1989）**是最经典的精确解法：
   O(n^2 ⋅ m^2)（n、m 为两棵树的节点数）

对于大型 UI 树（成百上千节点）这个复杂度完全不可接受，必须靠启发式假设来降维。

3. 前端框架的三个核心假设（启发式）
   React 2013 年提出了这套假设，后来成为业界标准：
   假设一：不同类型的节点产生不同的树

```txt
旧: <div> → 新: <span>
直接删除整棵 div 子树，创建新的 span 子树
不做跨类型的子树对比
```

假设二：同层节点才做对比，不跨层移动

```txt
旧树:           新树:
  A               A
  └─ B            └─ C
     └─ C            └─ B

不会识别出 B、C 只是移动了层级
而是：删除 B 和 C，重建 C 和 B
```

这两个假设把复杂度从 O(n^2 ⋅ m^2) 降到 O(n)

假设三：key 属性标识节点身份
这是列表 diff 的关键，后面单独讲。

4. 同层 Diff 的核心流程

```txt
旧 children: [A, B, C, D, E]
新 children: [A, C, B, E, F]
```

无 key 的情况：直接按位置对比

```txt
位置 0: A → A  patch（相同，跳过）
位置 1: B → C  patch（类型相同则更新属性，不同则替换）
位置 2: C → B  patch
位置 3: D → E  patch
位置 4: E → F  patch
```

这种方式简单但错误：B 和 C 明明只是交换了位置，却被当成两次完整更新处理。

有 key 的情况：身份追踪

```txt
旧: [A(k=1), B(k=2), C(k=3), D(k=4), E(k=5)]
新: [A(k=1), C(k=3), B(k=2), E(k=5), F(k=6)]

1. 建立旧节点的 key→index 映射表
   { 1:0, 2:1, 3:2, 4:3, 5:4 }

2. 遍历新列表：
   A(k=1) → 找到旧位置0，相同，patch
   C(k=3) → 找到旧位置2，移动到当前位置
   B(k=2) → 找到旧位置1，移动到当前位置
   E(k=5) → 找到旧位置4，移动到当前位置
   F(k=6) → 旧表中不存在，创建新节点

3. 旧表中 k=4(D) 未被访问 → 删除
```

5. Vue 2 的双端对比算法
   Vue 2 用了一个比 React 更聪明的双端指针策略，对「逆序」「尾部新增」这类常见场景有更好的性能：

```txt
旧: [A, B, C, D]   四个指针：oldStart, oldEnd, newStart, newEnd
新: [D, A, B, C]

Round 1:
  oldStart=A, oldEnd=D, newStart=D, newEnd=C
  oldEnd(D) == newStart(D) → 把 D 移到头部，指针收缩

Round 2:
  oldStart=A, oldEnd=C, newStart=A, newEnd=C
  oldStart(A) == newStart(A) → patch，指针收缩

Round 3、4: 同理处理 B、C

结果：只做了 1 次 DOM 移动，React 的策略需要移动 3 次
```

四种快速命中路径：

```txt
1. oldStart == newStart  → patch，两端指针同时右移
2. oldEnd   == newEnd    → patch，两端指针同时左移
3. oldStart == newEnd    → patch + 把 oldStart 移到末尾
4. oldEnd   == newStart  → patch + 把 oldEnd 移到头部
5. 都不命中              → 走 key 映射表查找
```

Vue 的虚拟 DOM 实现直接 fork 自 Snabbdom（一个独立的虚拟 DOM 库），Evan You 在 Vue 2.0 重写时选择了它而不是从头造轮子。Snabbdom 的作者 Simon Friis Vindum 也没有引用学术论文，它是纯粹的工程产物。

6. Vue 3 / React Fiber 的最长递增子序列优化
   Vue 3 在有 key 的列表 diff 中引入了**最长递增子序列（LIS）**算法，进一步减少 DOM 移动次数：

```txt
旧: [1, 2, 3, 4, 5, 6]
新: [1, 3, 2, 4, 6, 5]

新节点在旧列表中的位置序列: [0, 2, 1, 3, 5, 4]

LIS（最长递增子序列）: [0, 2, 3, 5] → 对应节点 [1, 3, 4, 6]

结论：1、3、4、6 不需要移动（它们已经是相对有序的）
     只需要移动 2 和 5
```

LIS 用动态规划求解，复杂度 O(n \* logn)

### DOM Diff 之后，DOM 操作是立即执行还是入队？

vue 走的路线是在 diff 发现差别的时候，直接 patch，立即操作 DOM 节点，但是会把很多 patch 操作加入到队列里批量执行。

react 走的路线是在 diff 发现差别的时候，在新的 fiber 节点打上标记，然后不会立即操作 DOM 节点，在 commit 阶段的时候，再去根据标记，对每个 fiber 节点执行 patch。

所谓的 patch, 就是拿着新的 vnode/fiber 节点，更新 DOM 节点的过程（更新 DOM 节点属性值，增加 DOM 节点，删除 DOM 节点）。

看看 vue 的路线。

```js
// Vue 2 源码 patch 函数的核心逻辑（简化）
function patch(oldVnode, newVnode) {
  if (sameVnode(oldVnode, newVnode)) {
    patchVnode(oldVnode, newVnode); // 递归对比，边对比边改 DOM
  } else {
    const parent = oldVnode.elm.parentNode;
    createElm(newVnode); // 立即创建新 DOM 节点
    parent.insertBefore(newVnode.elm, oldVnode.elm); // 立即插入
    parent.removeChild(oldVnode.elm); // 立即删除旧节点
  }
}

function patchVnode(oldVnode, newVnode) {
  const elm = (newVnode.elm = oldVnode.elm); // 复用真实 DOM 节点

  // 更新属性：立即操作
  updateAttrs(oldVnode, newVnode);
  updateClass(oldVnode, newVnode);
  updateStyle(oldVnode, newVnode);

  // 递归处理子节点
  updateChildren(elm, oldVnode.children, newVnode.children);
}
```

patch 阶段没有队列，发现差异就立即操作真实 DOM。

```js
// 你写的代码
this.count = 1; // 第 1 次赋值
this.name = "foo"; // 第 2 次赋值
this.count = 2; // 第 3 次赋值

// 如果每次赋值都立即 patch，会触发 3 次完整的 diff+patch
// Vue 实际上只触发 1 次
```

Vue 的响应式系统在数据变化时做的事：

```txt
setter 触发
    │
    ▼
dep.notify()  通知所有订阅者（Watcher）
    │
    ▼
watcher.update()
    │
    ├─ 不是立即执行 patch
    │
    ▼
queueWatcher(this)  把 watcher 推入全局队列
    │
    ▼
nextTick(flushSchedulerQueue)  在微任务中异步执行
```

```js
// 全局调度队列
const queue = [];
let waiting = false;

function queueWatcher(watcher) {
  if (!queue.includes(watcher)) {
    // 去重，同一个 watcher 只入队一次
    queue.push(watcher);
  }

  if (!waiting) {
    waiting = true;
    nextTick(flushSchedulerQueue); // 注册一个微任务
  }
}

function flushSchedulerQueue() {
  queue.sort((a, b) => a.id - b.id); // 父组件先于子组件更新

  for (let i = 0; i < queue.length; i++) {
    queue[i].run(); // 这里才真正执行 patch，操作真实 DOM
  }

  queue.length = 0;
  waiting = false;
}
```

nextTick 的实现优先级：

```js
Promise.then     （微任务，最优先）
    ↓ 不支持时降级
MutationObserver （微任务）
    ↓ 不支持时降级
setImmediate     （宏任务，IE 专用）
    ↓ 不支持时降级
setTimeout(fn, 0) （宏任务，兜底）
```

```txt
你的代码同步执行
  this.a = 1  ──→  watcher 入队（去重）
  this.b = 2  ──→  watcher 入队（去重）
  this.a = 3  ──→  watcher 已在队列，跳过
  // 同步代码执行完毕
       │
       ▼
  微任务队列（Promise.then）
       │
       ▼
  flushSchedulerQueue()
       │
       ├─ watcher.run() → 重新执行 render() 生成新 vnode
       │                         ↓
       │                   patch(oldVnode, newVnode)
       │                         ↓
       │                   递归 diff，立即操作真实 DOM ←── 这里才碰 DOM
       │
       └─ 全部 watcher 处理完毕
```

### react 的调度实现依赖哪个 API

MessageChannel。

原因：

- requestIdleCallback 的回调频率只有约 20fps，不够用
- setTimeout(fn, 0) 有最小 4ms 延迟限制
- MessageChannel 产生的是零延迟宏任务，且每次宏任务开始前浏览器有机会处理渲染

每次宏任务开始时，React 设定一个截止时间（通常 5ms）：

```js
function performWorkUntilDeadline() {
  const currentTime = getCurrentTime();
  deadline = currentTime + yieldInterval; // yieldInterval = 5ms

  let hasMoreWork = true;
  try {
    hasMoreWork = scheduledHostCallback(); // 执行工作，内部会检查 deadline
  } finally {
    if (hasMoreWork) {
      schedulePerformWorkUntilDeadline(); // 还有工作，注册下一个宏任务
    }
  }
}
```

### reconcile 可中断， commit 不可中断

第一阶段：Reconcile（可中断）
beginWork 是这个阶段的核心，负责对比新旧 Fiber，给节点打标记：

```js
function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case HostComponent: // div、span 等原生节点
      return updateHostComponent(current, workInProgress);
  }
}

function updateFunctionComponent(current, workInProgress) {
  // 执行函数组件，内部会触发 hooks
  const nextChildren = renderWithHooks(current, workInProgress);

  // 对比子节点，给子 Fiber 打 flags
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}
```

reconcileChildren 在这里打的 flags：

```js
// 新增节点
fiber.flags |= Placement;

// 更新节点
fiber.flags |= Update;

// 删除节点（挂在父节点的 deletions 数组里）
parent.deletions.push(fiber);
parent.flags |= ChildDeletion;
```

副作用从叶节点向上冒泡收集（subtreeFlags）：

```js
function completeWork(fiber) {
  // 把子树的 flags 合并到当前节点
  fiber.subtreeFlags |= child.subtreeFlags | child.flags;
}
```

这个设计让 Commit 阶段可以剪枝：如果一个节点的 subtreeFlags === 0，整棵子树都不用遍历。

第二阶段：Commit（不可中断）
Commit 阶段拿到 workInProgress 树，同步执行所有副作用，分三次遍历：

```txt
第一次遍历：BeforeMutation
  - 调用 getSnapshotBeforeUpdate（类组件）
  - 调度 useEffect 的清理函数（异步）

第二次遍历：Mutation（真正操作 DOM）
  - Placement：insertBefore / appendChild
  - Update：updateDOMProperties（改属性、文本）
  - Deletion：removeChild
  - 执行 useLayoutEffect 的清理函数

↑ 在 Mutation 和 Layout 之间切换 current 树指针
  root.current = finishedWork

第三次遍历：Layout
  - 调用 componentDidMount / componentDidUpdate
  - 执行 useLayoutEffect 的回调
```

为什么不可中断？因为 DOM 操作必须原子完成。如果插入了一半节点就暂停，用户会看到残缺的 UI。
useEffect 的回调在 Commit 结束后异步调度，不阻塞渲染：

```txt
Commit 完成
    │
    ▼
浏览器绘制（用户看到新 UI）
    │
    ▼
空闲时：执行 useEffect 回调
```

总结：

```txt
setState() 触发
     │
     ▼
Scheduler 根据优先级调度
     │
     ▼
┌─── Reconcile 阶段（可中断）─────────────────────────────┐
│                                                          │
│  workLoop：每 5ms 检查一次，超时让出线程                   │
│                                                          │
│  beginWork：执行组件函数，对比新旧 props/state            │
│      ↓ 打 flags（Placement / Update / Deletion）         │
│  completeWork：向上冒泡 subtreeFlags                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
     │ 全树遍历完毕
     ▼
┌─── Commit 阶段（不可中断，同步到底）────────────────────────┐
│                                                          │
│  BeforeMutation → Mutation（操作 DOM）→ Layout            │
│                       ↑                                  │
│              root.current 在这里切换                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
     │
     ▼
浏览器绘制
     │
     ▼
useEffect 异步执行
```

可中断的本质是：用链表保存工作进度，用宏任务调度恢复时机，用双缓冲保证中断不影响用户视图。Commit 阶段不可中断，是因为 DOM 操作不能是半完成状态，这是浏览器渲染模型的根本约束。

### react 的副作用 effect 是什么意思, 收集副作用是什么意思

在 React Fiber 语境里，"副作用"特指需要对外部世界（DOM、宿主环境）做的操作，与函数式编程里"纯函数之外的操作"是同一个概念。
具体包括两类：
DOM 副作用（flags 标记）

```js
// packages/react-reconciler/src/ReactFiberFlags.js
const Placement = 0b000010; // 插入节点
const Update = 0b000100; // 更新属性/文本
const ChildDeletion = 0b010000; // 删除子节点
const Ref = 0b1000000; // ref 需要更新
```

被动副作用（useEffect / 生命周期）

```js
const Passive = 0b100000000; // 有 useEffect 需要执行
const Layout = 0b010000000; // 有 useLayoutEffect 需要执行
```

收集副作用"的意思是：Reconcile 阶段只在 Fiber 节点上打这些二进制标记，不做任何真实操作，等 Commit 阶段统一处理。

### 真实 DOM 节点是什么时候创建的

真实 DOM 节点在 completeWork 阶段就被创建好了，只是还没挂到文档树里：

```js
function completeWork(current, workInProgress) {
  if (workInProgress.tag === HostComponent) {
    if (current === null) {
      // 新建节点：创建真实 DOM，但不插入
      const instance = createDOMElement(workInProgress.type, newProps);
      // 把真实 DOM 挂在 stateNode 上
      workInProgress.stateNode = instance;
      // 把子节点也追加进去（但整棵子树还没接入文档）
      appendAllChildren(instance, workInProgress);
    }
  }
}
```

### Vue 内存中只有一棵虚拟节点树吗

是的。React 有双缓冲机制，Vue 没有。

```txt
Vue 2:
  component._vnode  ← 上次渲染的 vnode 树（旧树）

  render() 执行后生成新的 vnode 树（新树，一个临时对象）

  patch(oldVnode, newVnode)  ← 边 diff 边操作 DOM

  patch 完成后：component._vnode = newVnode  ← 新树变成旧树
  旧树的引用被丢弃，等待 GC
```

### 为什么子节点的 mount effect 先于父节点执行

这源于 completeWork 的遍历顺序——后序遍历（叶节点先完成）。
Effect 链表是在 completeWork 时构建的：

```js
function completeWork(fiber) {
  // 把子节点的 effect 链表接在前面
  // 把自己的 effect 接在后面
  fiber.updateQueue = [
    ...child.updateQueue, // 子节点的 effect 在前
    ...myEffects, // 自己的 effect 在后
  ];
}
```

构建过程：

```txt
树结构：
    Parent
    ├── Child1
    └── Child2

completeWork 顺序：Child1 → Child2 → Parent

Effect 链表最终结果：
[Child1_effect, Child2_effect, Parent_effect]

执行时从链表头开始：
Child1 先 mount → Child2 先 mount → Parent 最后 mount
```

这个设计的逻辑依据：
父组件的 useEffect 里经常需要访问子组件渲染出的 DOM（比如测量子元素尺寸），如果父先执行，子节点的 DOM 可能还没挂载完成。保证子先父后，就保证了父组件 effect 执行时，整棵子树的 DOM 都已经就绪

卸载顺序与挂载相同，也是子先父后，但原因略有不同。

```txt
同一个 effect 的清理和重新执行：
  [统一先执行所有 destroy]  子 → 父
         ↓
  [再统一执行所有 create]   子 → 父
```

注意是先把所有组件的 destroy 都跑完，再跑 create，而不是每个组件 destroy → create 交替执行。

```js
// React 源码中 flushPassiveEffects 的逻辑
function commitPassiveUnmountEffects(root) {
  // 先把整棵树所有需要清理的 effect 都清理掉
  commitPassiveUnmountOnFiber(root);
}

function commitPassiveMountEffects(root) {
  // 再把整棵树所有需要执行的 effect 都执行
  commitPassiveMountOnFiber(root);
}
```

这个设计防止了一种 bug：如果 A 组件的 destroy 和 B 组件的 create 交替执行，A 的清理可能依赖 B 已经被清理的某个外部资源（比如全局事件监听器），先清理完所有的再重建所有的能保证状态一致性。

### 最开始的 fiber 树是只有一棵么

初次挂载（Mount）

```txt
ReactDOM.render(<App />, container)
         │
         ▼
创建 FiberRootNode（整个应用的根，全局唯一）
         │
         ▼
创建 HostRootFiber（根 Fiber 节点）
         │
         ▼
此时只有这一个孤零零的根节点
current = HostRootFiber
workInProgress = null
```

然后开始 Reconcile，边工作边创建 workInProgress 树：

```txt
beginWork(HostRootFiber)
    │  发现需要渲染 <App />
    │  为 App 创建第一个 workInProgress Fiber 节点
    ▼
beginWork(App_wip)
    │  执行 App 函数组件（这里会触发 hooks）
    │  返回 JSX，为子节点创建 workInProgress Fiber
    ▼
... 递归向下 ...
    │
    ▼
completeWork 向上回溯，创建真实 DOM

Commit 阶段：
    root.current = workInProgress根节点  ← 第一棵树诞生
```

初次挂载时，current 树一开始几乎是空的（只有根节点），workInProgress 树是完整构建出来的新树，Commit 后它成为唯一的 current 树。

假设 useState 触发更新，看看第二棵树如何产生

```txt
setCount(1)
    │
    ▼
在对应 Fiber 节点的 updateQueue 上挂一个 update 对象
{ action: 1, next: null }
    │
    ▼
调度一次更新（scheduleUpdateOnFiber）
    │
    ▼
从 FiberRootNode 开始，再次进入 workLoop
    │
    ▼
createWorkInProgress(current.child)
```

关键函数 createWorkInProgress：

```js
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 第一次更新时，alternate 不存在，新建一个
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 已经存在 alternate（上次更新留下来的），复用它
    // 重置脏数据，但保留节点结构
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  // 从 current 复制稳定字段
  workInProgress.type = current.type;
  workInProgress.stateNode = current.stateNode; // 复用真实 DOM 节点！
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.updateQueue = current.updateQueue;

  return workInProgress;
}
```

所以 workInProgress 节点不是完整的深拷贝，而是浅复制 + 重置副作用标记。最重要的是 stateNode（真实 DOM）被复用，不需要重新创建。

两棵树通过 alternate 指针互相指向对方：

```txt
current 树                    workInProgress 树
（屏幕上显示的）                （正在构建的）

FiberRoot
    │
    ▼
HostRoot ◄────alternate────► HostRoot_wip
    │                              │
    ▼                              ▼
  App  ◄────alternate────►      App_wip
    │                              │
    ▼                              ▼
  Div  ◄────alternate────►      Div_wip
```

Commit 后：

```js
root.current = workInProgress根; // 指针翻转，wip 树变成 current 树
// 原来的 current 树变成下次更新时可复用的 alternate
```

下次再更新时，alternate 已经存在，直接复用那些节点，两棵树就这样交替复用，永远只有两棵树存在于内存中，不会无限增长。

### Fiber 节点的创建和执行函数组件的关系

这是理解 Fiber 的核心，两件事是分开的，但顺序相关。
beginWork 里发生了什么

```js
function beginWork(current, workInProgress) {
  if (workInProgress.tag === FunctionComponent) {
    return updateFunctionComponent(current, workInProgress);
  }
}

function updateFunctionComponent(current, workInProgress) {
  // ← 在这里执行函数组件体
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    props
  );
  //                   ↑
  //    这一行做了两件事：
  //    1. 设置当前正在处理的 Fiber（让 hooks 知道挂在哪里）
  //    2. 调用 Component(props)，即你写的函数

  // 函数返回了 JSX（ReactElement 对象）
  // 现在根据 JSX 为子节点创建/复用 Fiber
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child; // 返回第一个子 Fiber，继续向下
}
```

renderWithHooks 的细节

```js
function renderWithHooks(current, workInProgress, Component, props) {
  // 关键：把当前工作的 Fiber 存到全局变量
  currentlyRenderingFiber = workInProgress;

  // 根据是 mount 还是update，设置不同的 hooks 实现
  if (current === null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
    // mount 时 useState 的实现：创建新的 hook 对象挂在链表上
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
    // update 时 useState 的实现：读取已有的 hook 对象
  }

  // 执行你写的函数组件！
  const children = Component(props);
  //               ↑
  //   你写的代码在这里运行：
  //   - useState → 读/写 workInProgress.memoizedState 链表
  //   - useEffect → 在 workInProgress.updateQueue 上追加 effect 对象
  //   - return <div>... → 返回 ReactElement

  currentlyRenderingFiber = null;
  return children;
}
```

每个 Fiber 节点维护一条 hooks 链表（memoizedState）：

```txt
FiberNode.memoizedState →  Hook1  →  Hook2  →  Hook3
                          (useState) (useEffect) (useRef)
```

函数组件每次执行，hooks 按照调用顺序依次对应链表上的节点，这就是为什么 hooks 不能放在条件语句里——顺序一旦变化，链表对应关系就乱了。

```js
// mount 时，useState 创建新 Hook 节点
function mountState(initialState) {
  const hook = {
    memoizedState: initialState,
    queue: { pending: null }, // 存放 setCount 产生的 update
    next: null, // 指向下一个 hook
  };
  // 追加到链表末尾
  workInProgress.memoizedState = hook;
  return [
    hook.memoizedState,
    dispatchSetState.bind(null, workInProgress, hook.queue),
  ];
}

// update 时，useState 读取已有 Hook 节点
function updateState() {
  const hook = currentHook; // 按顺序取链表上的下一个节点
  // 处理 queue 里挂着的 update，计算新 state
  const newState = processUpdateQueue(hook);
  hook.memoizedState = newState;
  return [newState, hook.queue.dispatch];
}
```

纵览：

```txt
setCount(1) 触发更新
         │
         ▼
scheduleUpdateOnFiber(fiber)
         │
         ▼
为 App Fiber 创建 workInProgress 节点（复用 alternate）
         │
         ▼
beginWork(App_wip)
         │
         ├── renderWithHooks 执行 App() 函数体
         │        │
         │        ├── useState → 读 hook 链表，计算新 state → 返回 [1, setCount]
         │        ├── useEffect → 在 updateQueue 上挂 effect 对象
         │        └── return <div>count: 1</div>  ← ReactElement
         │
         ├── reconcileChildren：
         │        对比旧的子 Fiber 和新的 ReactElement
         │        相同类型 → createWorkInProgress(旧子Fiber)  复用节点
         │        新增     → createFiber()                    新建节点
         │        删除     → 打 ChildDeletion flag
         │
         └── return child_wip  继续向下递归

completeWork 向上回溯
    - 原生节点（div/span）：复用 stateNode，更新属性
    - 冒泡 subtreeFlags

Commit：
    Mutation → 只处理有 flags 的节点，更新真实 DOM
    root.current = workInProgress树根

异步：
    执行 useEffect 回调
```

### childLanes 干什么用的

childLanes 是剪枝的关键
React 在调度更新时，会沿着 Fiber 树向上把更新的优先级标记到所有祖先节点的 childLanes 上：

```js
// setCount 触发时
function markUpdateLaneFromFiberToRoot(fiber) {
  let node = fiber;
  let parent = fiber.return;

  while (parent !== null) {
    parent.childLanes |= lane; // 告诉父节点：我的子树有更新
    parent = parent.return;
  }
}
```

beginWork 时通过检查 childLanes 就能知道是否需要向下走，不需要遍历整棵树。

### ReactElement 和 Fiber 节点是什么关系

ReactElement 是什么
JSX 编译后的产物，一个纯数据对象，描述"想要什么"：

```js
// 你写的 JSX
<Button color="red" onClick={fn}>Click</Button>

// Babel 编译后
React.createElement(Button, { color: 'red', onClick: fn }, 'Click')

// 返回的 ReactElement 对象
{
  $$typeof: Symbol(react.element),  // 标识这是个 ReactElement
  type: Button,                      // 组件函数或字符串标签
  key: null,
  ref: null,
  props: {
    color: 'red',
    onClick: fn,
    children: 'Click'
  }
}
```

ReactElement 每次 render 都会重新创建，它是短命的临时对象，用完就可以 GC。

Fiber 节点是什么
Fiber 节点是跨 render 持久存在的工作单元，描述"当前实际是什么"：

```js
{
  // 身份（从 ReactElement 读取，创建后不变）
  type: Button,
  key: null,

  // 当前状态（跨 render 保留）
  memoizedProps: { color: 'red', onClick: fn },
  memoizedState: hooksList,   // hooks 链表
  stateNode: domNode,         // 真实 DOM 节点

  // 本次更新的输入（来自新的 ReactElement）
  pendingProps: { color: 'blue', onClick: fn2 },  // 新 props

  // 树结构（稳定，复用）
  return: parentFiber,
  child: firstChildFiber,
  sibling: nextSibFiber,
  alternate: currentFiber,

  // 本次更新的产出（每次 render 后重置）
  flags: Update,
  updateQueue: effects,
}
```

ReactElement 驱动 Fiber 的创建和更新

```txt
每次 render，函数组件返回新的 ReactElement 树
         │
         ▼
reconcileChildren 用 ReactElement 和现有 Fiber 对比
         │
         ├── 有对应 Fiber（type 和 key 匹配）
         │       → createWorkInProgress(existingFiber)
         │         把 ReactElement.props 写入 pendingProps
         │         复用 Fiber 节点，不新建
         │
         ├── 没有对应 Fiber（新增节点）
         │       → createFiberFromElement(ReactElement)
         │         新建 Fiber 节点
         │
         └── Fiber 有但 ReactElement 没有（删除节点）
                 → 打 ChildDeletion flag
```

一次完整的 render:

```txt
useState 触发更新
         │
         ▼
调度器选择合适时机，开始 workLoop
         │
         ▼
createWorkInProgress(root)   ← 从根节点开始
         │
         ▼
beginWork(root_wip)
    └── bailout（根节点 props 没变，但 childLanes 有更新）
        cloneChildFibers → 为 App 创建 wip 节点
         │
         ▼
beginWork(App_wip)
    └── bailout（App props 没变，但 childLanes 有更新）
        cloneChildFibers → 为 Counter 创建 wip 节点
         │
         ▼
beginWork(Counter_wip)
    └── 需要重渲染！
        renderWithHooks → 执行 Counter() 函数体
            │  useState → 计算新 state = 1
            │  return <span>{count}</span>
            └── 返回新的 ReactElement
        reconcileChildren：
            旧 Fiber: span(children="0")
            新 ReactElement: span(children="1")
            type 匹配 → createWorkInProgress(span_fiber)
                        pendingProps.children = "1"
                        打 Update flag
         │
         ▼
beginWork(span_wip)
    └── HostComponent（原生节点）
        对比 props，发现 children 变了
        打 Update flag
         │
         ▼
completeWork(span_wip)  ← 叶节点，开始回溯
    └── 原生节点：准备好 DOM 属性更新的 payload

completeWork(Counter_wip) → 冒泡 subtreeFlags
completeWork(App_wip)     → 冒泡 subtreeFlags
completeWork(root_wip)    → 完成

         │
         ▼
Commit: 只处理有 flags 的 span，更新文本内容
```

### 只会在 workInProgress fiber 身上打标记么

正常情况：flags 打在 workInProgress 上

```js
// 需要更新属性
workInProgress.flags |= Update;

// 需要插入
workInProgress.flags |= Placement;

// 需要更新 ref
workInProgress.flags |= Ref;
```

Commit 阶段处理的是 workInProgress 树（此时已成为 finishedWork），读的也是这些节点上的 flags。

例外：删除的 flag 打在父节点的 workInProgress 上

```js
// reconcileChildFibers 发现某个旧 Fiber 在新的 ReactElement 里消失了
function deleteChild(returnFiber, childToDelete) {
  // 删除标记不打在被删节点上
  // 而是把被删节点加入父节点的 deletions 数组
  const deletions = returnFiber.deletions;
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion; // 标记打在父节点（wip）上
  } else {
    deletions.push(childToDelete);
  }
}
```

hildToDelete 这个被删除的节点是 current 树上的节点（因为它在新 ReactElement 里不存在，根本没有对应的 wip 节点被创建出来）。
所以删除场景的完整描述是：

```txt
父节点的 wip.flags |= ChildDeletion   ← 标记打在父 wip 节点
父节点的 wip.deletions = [current子节点]  ← 直接引用 current 树的节点

Commit 阶段：
    读父 wip 的 ChildDeletion flag
    遍历 deletions 数组
    对每个 current 节点执行 removeChild
    递归执行其 useEffect 清理函数
```

### 子 fiber 节点的 alternate 是怎么建立的

子节点的 wip 是在 reconcileChildren 里创建的，来源有两条路：
路径一：节点需要重渲染（reconcileChildren）

```js
function reconcileChildFibers(returnFiber, currentFirstChild, newChildren) {
  // currentFirstChild 是 current 树上的第一个子节点
  // 遍历 newChildren（新的 ReactElement 列表）

  let oldFiber = currentFirstChild; // current 树的子节点

  for (let newIdx = 0; newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx]; // 新的 ReactElement

    if (oldFiber && sameType(oldFiber, newChild)) {
      // 类型匹配，复用
      const newFiber = useFiber(oldFiber, newChild.props);
      //                ↑
      //   useFiber 内部调用 createWorkInProgress(oldFiber, newProps)
      //   oldFiber 就是 current 子节点，直接作为参数传入

      newFiber.return = returnFiber; // 新 wip 节点的父指针指向父 wip

      oldFiber = oldFiber.sibling; // current 树向右移动
    } else {
      // 新增节点，创建全新的 Fiber
      const newFiber = createFiberFromElement(newChild);
      newFiber.alternate = null; // 没有对应的 current 节点
    }
  }
}
```

这里的 currentFirstChild 从哪来？从 beginWork 的调用处：

```js
function updateFunctionComponent(current, workInProgress) {
  const nextChildren = renderWithHooks(...)  // 执行函数体，得到新 JSX

  reconcileChildren(
    current,              // ← current 节点
    workInProgress,
    nextChildren
  )
}

function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // mount
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    // update：把 current.child 作为"旧子节点"传入对比
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,   // ← 这里！current.child 作为参照
      nextChildren
    )
  }
}
```

current.child 在这里被读取了一次，但这不是"遍历 current 树"，而是局部读取当前层的直接子节点，是 O(1) 的指针访问。

路径二：节点 bailout（cloneChildFibers）

```js
function cloneChildFibers(current, workInProgress) {
  if (workInProgress.child === null) return;

  // 以 current.child 为模板，克隆出 wip.child
  let currentChild = workInProgress.child.alternate;
  //                                      ↑
  //  注意：workInProgress.child 在 bailout 时已经指向了 current.child
  //  (因为 wip 是从 current 克隆来的，child 指针初始相同)

  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;
  newChild.return = workInProgress;

  // 处理兄弟节点
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps
    );
    newChild.return = workInProgress;
  }
}
```

一个实例说明

```txt
初始 current 树：
Root ──child──► App ──child──► Counter ──child──► span
  ↕alt            ↕alt              ↕alt              ↕alt
 null            null              null              null

第一次更新，Root 的 wip 被创建：
Root_wip.alternate = Root（current）
Root.alternate = Root_wip

beginWork(Root, Root_wip)：
    Root_wip bailout，调用 cloneChildFibers
    读 Root.child = App（current 节点）
    createWorkInProgress(App) → App_wip
    App_wip.alternate = App
    App.alternate = App_wip
    Root_wip.child = App_wip

beginWork(App, App_wip)：（通过 App_wip.alternate 找到 App）
    App_wip bailout，调用 cloneChildFibers
    读 App.child = Counter（current 节点）
    createWorkInProgress(Counter) → Counter_wip
    ...

每一层的 current 节点都是通过
    "父 wip.alternate.child" 或 "当前 wip.alternate"
来获取的，形成自洽的局部查找
```

### useEffect 和 useLayoutEffect

|                         | DOM 删除时机  |      清理执行时机      | 执行方式 | ref 是否可用 |
| :---------------------: | :-----------: | :--------------------: | :------: | :----------: |
| useLayoutEffect cleanup | Mutation 阶段 | DOM 删除之前（同阶段） |   同步   |   ✅ 可用    |
|    useEffect cleanup    | Mutation 阶段 |     浏览器绘制之后     |   异步   | ❌ 已是 null |

### 节点删除时 layoutEffect 的执行顺序

```txt
Parent（被删除）
├── Child_A
│   └── GrandChild
└── Child_B
```

Mutation 阶段处理 ChildDeletion 时：

```js
function commitDeletionEffectsOnFiber(deletedFiber) {
  switch (deletedFiber.tag) {
    case FunctionComponent: {
      // 1. 先递归处理子节点
      recursivelyTraverseDeletionEffects(deletedFiber);

      // 2. 再处理当前节点的 useLayoutEffect 清理
      commitHookEffectListUnmount(HookLayout, deletedFiber);
      // 注意：useEffect 的清理不在这里，只是被登记到队列
      safelyDetachRef(deletedFiber);
      break;
    }
    case HostComponent: {
      // div、span 等原生节点
      recursivelyTraverseDeletionEffects(deletedFiber);
      safelyDetachRef(deletedFiber);
      // 原生节点没有 hook，不需要执行 hook 清理
      break;
    }
  }
}

function recursivelyTraverseDeletionEffects(parent) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(child); // 递归处理子节点
    child = child.sibling;
  }
}
```

对上面那棵树，执行顺序是：

```txt
commitDeletionEffectsOnFiber(Parent)
    │
    ├── recursivelyTraverse(Parent)
    │       ├── commitDeletionEffectsOnFiber(Child_A)
    │       │       ├── recursivelyTraverse(Child_A)
    │       │       │       └── commitDeletionEffectsOnFiber(GrandChild)
    │       │       │               ├── recursivelyTraverse(GrandChild) → 无子节点
    │       │       │               └── GrandChild 的 useLayoutEffect 清理 ✓
    │       │       │               └── GrandChild 的 ref 清除 ✓
    │       │       └── Child_A 的 useLayoutEffect 清理 ✓
    │       │       └── Child_A 的 ref 清除 ✓
    │       │
    │       └── commitDeletionEffectsOnFiber(Child_B)
    │               ├── recursivelyTraverse(Child_B) → 无子节点
    │               └── Child_B 的 useLayoutEffect 清理 ✓
    │               └── Child_B 的 ref 清除 ✓
    │
    └── Parent 的 useLayoutEffect 清理 ✓
    └── Parent 的 ref 清除 ✓

// 以上全部完成后，才执行：
parent.removeChild(Parent.stateNode)  ← 一次 DOM 操作搞定整棵子树
```

清理的顺序是后序遍历（子先父后），removeChild 只在最外层祖先上调用一次。

## react 相关仓库

[The Future of React](https://github.com/reactjs/react-future/blob/master/README.md): react 项目早期，对 react 项目演进的设想

[React RFCs](https://github.com/reactjs/rfcs/blob/main/README.md): react 草案，诸多现有的特性都源自这些草案，从中可以 get 一些 react 的设计思想

[React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture): react 核心成员 Andrew Clark 大神编写的 react fiber 架构 blog。
