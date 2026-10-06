---
title: "render & commit"
page: true
aside: true
---

# render & commit 
上一个博客，我们介绍了`ReactElement` 和 `Fiber`。现在，我们可以了解react是如何工作，把东西渲染到页面。

react的工作分成两个阶段：render 和 commit。

render阶段要做的事情，就是创建新的Fiber树；commit阶段要做的事情，就是根据新Fiber树创建、更新、删除DOM节点。

render阶段被设计为可以中断的，意思是render的工作可以分散到多个宏任务；commit阶段不能中断，意思是只能在一个宏任务里，完成DOM节点的操作。

类似于我们介绍vue2的工作方式，也给出一段简单代码，并用图示的方法解释。

```tsx
import { createRoot } from "react-dom"

const App = (props) => {
  const { userName } = props 
  const msg = "hello " + userName
  return (<div>
     <span>{msg}</span>
  </div>)
}

createRoot(document.getElementById("app")).render(<App userName={"Peter"} />)
```

`createRoot()`执行后的结果：
<image src="/react-1.png" style="width: 700px" />

`render()`执行后的结果：
<image src="/react-2.png" style="width: 700px" />

接下来，react会在一个宏任务里，开启render工作。至于react是怎么搞出来一个宏任务的，会在另外的博客里介绍。

为FiberRoot创建镜像Fiber节点，将这个节点作为`workInProgress`，并由此继续构建Fiber树：
<image src="/react-3.png" style="width: 700px" />

接下来，会根据AppReactElement，创建出子Fiber：
<image src="/react-4.png" style="width: 700px" />

为了便于说明主流程，我们会隐去Fiber的一些细节。

接下来，会更新 `workInProgress`：
<image src="/react-5.png" style="width: 700px" />

判断`workInProgress`是`FunctionComponent`, 执行`App`，得到新的ReactElement, 并根据这个ReactElement，创建Fiber3, 作为Fiber2的child, 并将`workInProgress`设置为Fiber3：
```ts 
const reactElement = {
  type: "div",
  props: {
    children: [
      {
        type: "span",
        props: {
          children: ["hello Peter"]
        }
      }
    ]
  }
}
```
<image src="/react-6.png" style="width: 700px" />

判断`workInProgress`是`HostComponent`，根据`pendingProps.children`，创建Fiber4:
<image src="/react-7.png" style="width: 700px" />

判断`workInProgress`依旧是`HostComponent`, 继续创建Fiber5:
<image src="/react-8.png" style="width: 700px" />

从`workInProgress`的信息看，没有后续要创建的Fiber了。但实际情况，要更加复杂，假设Fiber树是这个样子：
<image src="/react-9.png" style="width: 700px" />

如果删除Fiber2, Fiber4, Fiber5, Fiber6, 那么正好是我们例子中的情况。可是，就这个情况而言，还有一些其他工作要完成：
1. `workInProgress`会对Fiber3做一些收尾工作后，指向Fiber4。
2. 发现Fiber4没有子Fiber要创建，对Fiber4做一些收尾工作后，`workInProgress`指向Fiber1。
3. 对Fiber1做些收尾工作后，`workInProgress`指向Fiber2。
4. 根据Fiber2的信息，创建出Fiber5和Fiber6, `workInProgress`指向Fiber5。
5. 发现Fiber5没有子Fiber创建，对Fiber5做一些收尾工作，然后`workInProgress`指向Fiber6
6. 发现Fiber6没有子Fiber创建，对Fiber6做一些收尾工作，然后`workInProgress`指向Fiber2
7. 对Fiber2做一些收尾工作，`workInProgress`指向Fiber2的父Fiber
8. `workInProgress`变成null，结束

收尾工作，是要做什么呢？这要看Fiber的tag是什么。这里我们只给出tag是`HostComponent`的情形。如果Fiber1, Fiber3 和 Fiber4 都是`HostComponent`。

Fiber3的收尾工作：创建Fiber3对应的DOM节点，存储在 `fiber3.stateNode`;

Fiber4的收尾工作：创建Fiber4对应的DOM节点，存储在 `fiber4.stateNode`;

Fiber1的收尾工作：创建Fiber1对应的DOM节点，存储在`fiber1.stateNode`，并往里边插入`fiber3.stateNode` 和 `fiber4.stateNode`;

react使用`completeWork`函数定义了fiber的收尾工作，源码位置：`packages/react-reconciler/src/ReactFiberCompleteWork.new.js,line762`

你会发现，`workInProgress`会沿着父Fiber的方向，往上回溯，如果抵达RootFiber的位置，就可以拿到`#app`的DOM节点（`RootFiber.stateNode.containerInfo`或者`RootFiber.alternate.stateNode.containerInfo`）, 是不是意味着所有收尾工作创建好的DOM节点都会插入到`#app`的DOM节点下呢？答案是不会，这属于特殊情形，移动到commit阶段再做。

经过上边的讨论，无论是创建新的Fiber，还是对Fiber做一次收尾工作，都有一个共性——`workInProgress`发生一次移动。`workInProgress`发生一次移动的过程，就是是一个渲染单元，react称之为`unitOfWork`，代码里也给出了`performUnitOfWork`函数，源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line1888`。而我们所说的**可中断**，就是一个渲染单元执行完毕后，下一个渲染单元可以在另外一个宏任务里执行，不必紧跟着执行。

接下来说说commit阶段，也会到我们讨论的Fiber情形中：
<image src="/react-8.png" style="width: 700px" />

来到commit阶段，`workInProgress`就变成null, 取而代之的是，会有`finishedWork`指向fiber1:
<image src="/react-10.png" style="width: 700px" />

但此时，不会立即对fiber1执行DOM节点操作，而是递归式的，对fiber2执行操作。但fiber2也有子节点，再次往下递归。

最终会先处理fiber5, 因为fiber5的flags在render阶段没有打上任何标记，因此什么都不用做；

接着处理fiber4, 它在render阶段，flags被打上了`Placement`，这一点在介绍render阶段的时候，为了简化说明主体内容，我们给忽略了。此时就会设置fiber4对应的DOM节点，不过，这个工作在render阶段的收尾工作已经做了，于是这里是二次执行，重新检查一下，以防万一；

接着处理fiber3, 思路和fiber4一样；

接着处理fiber2, 它是`FunctionComponent`，比较特殊，会先执行完所有标记`HookInsertion | HookHasEffect`tag的`unmountEffect`，再执行完相同标记的`mountEffect`。我们的例子中，并没有使用`useInsertionEffect`，因此这里什么都没有做，在介绍`useInsertionEffect`的时候，我们会更具体地解释。

最后处理fiber1, 此时就会把已经创建好的DOM节点插入到`#app`的DOM节点里。

至此，commit阶段结束。接下来，浏览器会根据修改后的DOM树结构，更新页面的内容。

会到更复杂的fiber树情形，commit阶段，fiber执行的顺序正如其名字里的序号一样：
<image src="/react-11.png" style="width: 700px" />
> 图片中`..return`属于笔误，应该是`.return`

类似于二叉树的后序遍历。

最后，还需要变更`fiberRoot.current`, 这样，我们新创建的fiber树，就变成了老fiber树了：
<image src="/react-12.png" style="width: 700px" />

如果后续要创建新的fiber树，就从`RootFiber`开始，把之前fiber2到fiber5的事情再发生一次，依此创建出fiber6到fiber9。

到了commit阶段，就会另有不同。之前fiber3到fiber5各自没有镜像fiber。但这次，fiber6到fiber9的镜像节点就是fiber2到fiber5。

之前的DOM插入工作，就会变成DOM的更新或者删除。至于具体是何种操作，要看两方面：
1. `fiber.deletions`, 非空，就要执行删除
2. `fiber.flags`设置了`Placement`、`Update`, 就要分别插入DOM，更新DOM

DOM创建会在render的fiber收尾工作里完成，但是DOM更新和删除，一定是在commit阶段完成。

这便是主体流程的大致内容。

## diff fiber 
fiber的diff，不是新fiber和老fiber之间的比较，而是老fiber和新reactElement的比较，比较的结果就是创建出新的fiber。

情形一：新reactElement是空的
<image src="/react-fiber-diff-1.png" style="width: 700px" />
此时，只需要将fiber1到fiber4加入到`fiber1.return.deletions`，在commit阶段等着删除即可。

情形二：老fiber是空的
<image src="/react-fiber-diff-2.png" style="width: 700px" />
此时，只需要根据reactElement1和reactElement2，创建新的fiber，并标记`Placement`的flag，在render阶段每个fiber的收尾工作期间，创建对应的DOM节点。

情形三：老fiber多，new reactElement少
<image src="/react-fiber-diff-3.png" style="width: 700px" />
为了尽可能复用老fiber, 从fiber1开始，寻找`fiber1.index <= reactElement.index`的 `reactElement`，如图所示，找到`reactElement1`，但是发现二者的`type`不相等，意味着fiber1无法直接复用。

于是，改为遍历`reactElement`，从老fiber中寻找key值相等的fiber，如果能找到，那么直接复用fiber作为新fiber，把reactElement的信息同步到fiber上，并给fiber打上`Placement`和`Update`的flags, 这样，在commit阶段，就可以调整原有DOM节点的顺序，并更新属性值。

如果找不到，那么就根据reactElement创建新的fiber即可。

在上述方式处理完毕后，old fiber肯定有没有能够复用上的，把这些fiber加入到`fiber1.return.deletions`, 等commit阶段删除即可。

按照我们的例子，reactElement1复用fiber4,reactElement2复用fiber1, fiber2和fiber3删除。

情形四：老fiber少，new reactElement多
<image src="/react-fiber-diff-4.png" style="width: 700px" />
与情形三的处理方式一样。old fiber中可能会有没能复用上的，这些fiber会被记录，等着commit阶段删除。而reactElement里肯定有没被处理的，直接根据剩余的reactElement创建出新的fiber，等着commit阶段插入即可。

上述过程来自于`reconcileChildrenArray`, 源码位置：`packages/react-reconciler/src/ReactChildFiber.new.js,line736`

## 简单代码概括commit阶段
```ts 
function commitRoot() {
  // 执行 useEffect 创建的 effect
  mayFlushPassiveEffect()

  // 执行 useInsertionEffect 创建的 effect；
  // 执行 DOM 更新、删除、插入
  commitMutationEffects()

  // 新 fiber 树变成旧fiber树，
  // fiberRoot.current永远指向老fiber树
  fiberRoot.current = finishedWork

  // 执行 useLayoutEffect 创建的 effect
  commitLayoutEffects()

  // 通知调度器，在当前frame结束后中断，留给
  // 浏览器空隙可以重新绘制页面
  requestPaint()

  // 安排下一次调度, 执行渲染任务
  ensureRootIsScheduled()

  // 执行 useEffect 创建的 effect
  mayFlushPassiveEffect()

  // 执行同步任务，在同步渲染模式下会用到，
  // 但是在并发渲染模式下，不会用到
  mayFlushSyncQueue()
}
```

## 简单代码概括render阶段
```ts 
function performConcurrentRender() {
  const status = renderRootConcurrent()
  if (status === RootCompleted) {
    commitRoot()
  }
  else {
    // 处理其他情况，比如发生错误了，渲染没有完成
    dealWithOtherCase()
  }

  // 安排下一次调度执行performConcurrentRender，
  // 防止本次没有渲染完。这就是我们前边说的，渲染工作
  // 可以分散到多个宏任务里执行
  ensureRootIsScheduled()
  return null
}

function renderRootConcurrent() {
  // 准备workInProgress，已经存在就不用准备了
  mayPrepareFreshStack()
  do {
    workLoopConcurrent()
    break 
  } while(true)
}

function workLoopConcurrent() {
  // 检测到时间片不够时，调度系统会设置有关变量，
  // 使得shouldYield()返回true,结束本次渲染任务
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWorkFiber) {
  // 生成下一个新fiber节点, 这个节点作为
  // unitOfWorkFiber.child
  let next = beginWork(unitOfWorkFiber)

  // 说明fiber树已经达到叶子节点了，此时会
  // 往fiber.sibling和fiber.return的方向
  // 回溯，发生在completeUnitOfWork
  if (next === null) {
    // 回溯，以及render阶段的收尾工作
    completeUnitOfWork(unitOfWorkFiber)
  } 
  else {
    workInProgress = next
  }
}
```

## 与vue的对比
react在渲染页面是两段式。要把fiber树整体创建出来后，再整体处理一遍DOM。

vue一边生成vnode的时候，就会立即对该vnode对应的DOM做处理。

## `HostComponent`的fiber怎么更新的
tag值是`HostComponent`的fiber，对应的是DOM节点，因此它是如何更新的，是绝大多数页面更新的场景，有必要说说。

这类fiber在收尾工作阶段，会创建一个特殊的对象`updatePayload`, 这个对象会存储要更新的信息，随后，该对象就会绑定到`fiber.updateQueue`，并给fiber打上`Update`的flag。可见，`updateQueue`的数据结构很灵活，不只有循环队列一种，之后我们讨论`updateQueue`的时候，会详细讨论。

在commit阶段，处理这个fiber的时候，发现有`Update`的flag标记，就会取出`fiber.updateQueue`，得到要更新的信息，将这些信息同步到`fiber.stateNode`，DOM就更新了。

创建`updatePayload`发生在`updateHostComponent`, 源码位置：`packages/react-reconciler/src/ReactFiberCompleteWork.new.js,line252`

commit阶段同步更新的信息，发生在`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line2100`

## 源码关键位置
每次调度的入口函数：`performConcurrentWorkOnRoot`, 源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js, line881`

渲染的入口函数：`renderRootConcurrent`, 源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js, line1800`

渲染执行单元的入口函数： `performUnitOfWork`, 源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line1888`

commit阶段的实现：`commitRootImpl`, 源码位置：`packages/react-reconciler/src/ReactFiberWorkLoop.new.js,line2042`

commit阶段DOM节点变更的入口函数：`commitMutationEffects`, 源码位置：`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line1949`

多个新、旧fiber节点的diff:`reconcileChildrenArray`, 源码位置：`packages/react-reconciler/src/ReactChildFiber.new.js,line736`