---
title: "ReactElement 和 Fiber"
page: true
aside: true
---

# ReactElement 和 Fiber
这两个概念是react的基石，需要有一些基本的了解。

在讲述vue的时候，有一个叫做vnode的概念，而react与之对应的，是 Fiber。

先看看代码：
```tsx 
import { createRoot } from "react-dom"
const App = () => {
  return (
    <div className="container"> 
      <span className="highlight">hello world</span>
    </div>
  )
}

createRoot(document.getElementById("app")).render(<App src="hello world" />)
```

这是非常典型的react入口代码，而`<App />` 就是一个 `ReactElement`。经过babel的编译，`<App />` 会变成这样：
```tsx 
var _reactJsxRuntime = require("react/jsx-runtime");

// app 就是 <App />
const app = _reactJsxRuntime.jsx(App, {
  src: "hello world",
  children: null
})
```
`<App />`是`jsx`函数的返回结果，具体讲，它是一个这样的对象：
```js 
const app = {
  $$typeof: REACT_ELEMENT_TYPE,
  key: null,
  ref: null,
  type: App,
  props: {
    src: "hello world",
    children: null
  }
}
```

jsx源码：`fixtures/legacy-jsx-runtimes/react-16/cjs/react-jsx-runtime.development.js, line908`

可以看到，你编写出来的代码，都只会接触到`ReactElement`层面，但是，`createRoot().render()`执行后，react运行时就会根据`ReactElement`创建`Fiber`。

`Fiber`和`ReactElement`本质上都是js对象，有一部分信息，它是从`ReactElement`里边抄过来的，可更重要的一大部分信息，是它扩展出来的，我们不妨先看一下全貌：
```ts 
const appFiber = {
  // 枚举值，通过它可以判断fiber描述的是下面哪个情形：
  // 函数组件/类组件/HostComponent/Text/ReactFragment/
  // SimpleComponent/MemoComponent/SuspenseComponent/
  // ForwardRef/ContextConsumer/ContextProvider
  tag: FunctionComponent,
  // Fiber唯一标识，判断两个Fiber是不是同一个
  key: null,
  elementType: App,
  // 函数组件或者类组件，其组件定义就被保留这里
  type: App,
  // 如果Fiber描述的是一个HTMLElement，这里会存储
  // 该DOM节点；除此之外，它用于运行时内部的使用，
  // 比如性能监控，计算某些操作的执行时间
  stateNode: null,

  // 父Fiber
  return: null,
  // 第一个子Fiber
  child: null,
  // 兄弟Fiber
  sibling: null,
  // 如果Fiber是父Fiber的其中一个子节点，这里会存储
  // 它的索引，表述它是第几个子节点，索引号从0开始，
  // 0表示的就是第一个子节点
  index: 0,
  
  // 保存 useRef 创建的 { current: null }，
  // 在页面更新的时候，更新 current 的值
  ref: null,
  // 从 ReactNode 里直接抄过来的属性，
  // 表示这些属性尚未落实到页面
  pendingProps: {
    src: "hello world",
    children: null
  },
  // 表示已经落实到页面的属性，换句话说，旧属性
  memoizedProps: null,
  // effect循环队列；
  // 有 useEffect/useLayoutEffect 创建的 effect；
  // 也有 FiberRoot 初次渲染页面的时候，特殊结构的effect;
  updateQueue: null,
  // 与这个fiber有关的一些数据，在react运行期间，需要
  // 被记录下来，就会存储在这里，后续我们说的react hooks 
  // 都会存储在这里
  memoizedState: null,
  // 与 useContext, createContext 有关
  dependencies: null,

  // 枚举值，定义了一些渲染模式，react内部会根据
  // 这个值做一些特别的处理
  mode: ConcurrentMode,

  // 枚举值，标记节点存在副作用，比如
  // Ref: 表示这个节点的ref需要更新
  // Passive: 表示这个节点存在 mountEffect/unmountEffect 需要执行 
  // Update： 表示这个节点对应的DOM节点需要更新属性
  // Placement：表示这个节点对应的DOM节点需要被添加或者调整顺序
  // Deletion：表示这个节点对应的DOM节点需要给删除
  // ChildDeletion： 表示这个节点对应的DOM节点，有子节点需要被删除
  flags: NoFlags,
  // 与 flags 表示的意思一样，只不过针对的是子树
  subtreeFlags: NoFlags,
  // 存储要被删除的子Fiber
  deletions: null,

  // 枚举值，定义优先级，影响哪些fiber优先处理
  lanes: NoLanes,
  // 同 lanes，但形容的是子树
  childLanes: NoLanes,

  // 镜像 fiber。 老fiber的alternate就是新fiber，
  // 新 fiber 的alternate就是老fiber
  alternate: null
}
```

tag枚举值源码位置：`packages/react-reconciler/src/ReactWorkTags.js, line38`

mode枚举值源码位置：`packages/react-reconciler/src/ReactTypeOfMode.js`

flags枚举值源码位置：`packages/react-reconciler/src/ReactFiberFlags.js`

lanes枚举值源码位置：`packages/react-reconciler/src/ReactFiberLane.new.js`

创建fiber的源码实现：`packages/react-reconciler/src/ReactFiber.new.js`