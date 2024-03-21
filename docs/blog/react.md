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
```
