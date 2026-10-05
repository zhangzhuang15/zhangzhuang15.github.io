---
title: "hooks"
page: true
aside: true
---

# hooks 
在介绍`updateQueue`的时候，我们就已经见到`useEffect`，`useLayoutEffect`，`useInsertionEffect`，这三个hook。而在这篇博客里，我们会详细聊到其他常用的hook。

react的hooks全部定义在`packages/react-reconciler/src/ReactFiberHooks.new.js`。

具体介绍各个hook之前，我们先看看hook的基本结构：
```ts 
const hook = {
  memoizedState: null,
  baseState: null,
  baseQueue: null,
  queue: null,

  next: null,
}

fiber.memoizedState = hook
```

hook是单向链表，被存储在`fiber.memoizedState`。

hook函数的本质，就是把一些数据存储或者更新到hook上，那么有必要了解下，hook函数是怎么知道自己应该操作哪个hook。具体看，要分函数组件挂载和更新两种情形。挂载的时候，`fiber.alternate`是null;更新的时候，`fiber.alternate`不是null。fiber指的是渲染中的新fiber, 不是老fiber。

先看挂载的情形。

<image src="/react-hook-1.png" style="width: 700px" />
之后，第一个`useState`内部就会操作hook1；

<image src="/react-hook-2.png" style="width: 700px" />
之后，第二个`useState`内部就会操作hook2;

更新的情形就比较简单了：
<image src="/react-hook-3.png" style="width: 700px" />

后边在介绍hook函数的时候，只会将挂载和更新的时候，对hook做了什么，不再赘述hook是怎么来的，到底是操作哪个hook。

## useState
```ts 
function App() {
  const [val, setVal] = useState("hello")
}
```

挂载的时候：
```ts 
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

// 这里给出的例子是一个字符串，如果useState传入一个函数，
// 这里就是函数执行后的返回值
const state = "hello"

const hook = {
  baseState: state,
  memoizedState: state,
  // baseQueue是一个循环队列，且指向队列末尾节点
  baseQueue: null,
  queue: {
    // pending是一个循环队列，且指向队列末尾节点
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: state,
  }
}

hook.queue.dispatch = dispatchSetState.bind(
  null,
  // <App /> 对应的fiber
  appFiber,
  hook.queue,
)

// val 就是 hook.memoizedState；
// setVal 就是 hook.queue.dispatch
return [hook.memoizedState, hook.queue.dispatch]
```

我们继续看看 dispatchSetState 做了什么：
```ts 
function dispatchSetState(
  fiber,
  queue,
  action,
) {
  const lane = requestUpdateLane(fiber);
  const update = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };

  if (isRenderPhase(fiber)) {
    // queue.pending 是一个循环队列，update插入其中，
    // 作为队尾
    insertAsLastUpdate(queue.pending, update)
    return
  }

  insertAsLastUpdate(queue.pending, update)
  const lastState = queue.lastRenderedState
  const nextState = queue.lastRenderedReducer(lastState, action)
  update.hasEagerState = true 
  update.eagerState = nextState
  if (sameValue(lastState, nextState)) {
    return
  }

  // 触发下一轮调度
  // 这也就是setVal执行后，页面会更新的原因
  scheduleUpdateOnFiber(fiber)
}
```

接着看看更新的时候：
```ts 
// hook和挂载时的一样
let hook

// 把 hook.queue.pending 队列连接到 hook.queue.baseQueue尾部，
mergeCircularQueue(hook.queue.baseQueue, hook.queue.pending)
// 完成拼接后，baseQueue的最后一个节点，就是pending的最后一个节点
hook.queue.baseQueue = hook.queue.pending
// pending队列清空
hook.queue.pending = null

let newState = hook.baseState
let newBaseQueueFirst = null 
let newBaseQueueLast = null 
let newBaseState = newState

// 从首到尾遍历，取出每个update，计算newState
traverse(hook.queue.baseQueue, (update) => {
  // 优先级不够，不参与计算
  // 这个特点，在后边介绍 useTransition 的时候，会用到
  if (!hasEnoughPriority(update.lane)) {
    if (newBaseQueueFirst === null) {
      newBaseQueueFirst = newBaseQueueLast = update
      newBaseState = newState
    } 
    else {
      newBaseQueueLast.next = update 
      newBaseQueueLast = update
    }
    return
  }

  // 从第一个优先级不够的update开始，往后的update都要记录下来
  if (newBaseQueueLast !== null) {
    newBaseQueueLast.next = update 
    newBaseQueueLast = update
  }

  // 预先计算出来了
  if (update.hasEagerState) {
    newState = update.eagerState
  }
  else {
    newState = hook.queue.lastRenderedReducer(
      newState, update.action
    )
  }
})

hook.memoizedState = newState
hook.baseState = newBaseState
hook.queue.lastRenderedState = newState

if (newBaseQueueLast !== null) {
  // 循环队列，尾节点指向首节点
  newBaseQueueLast.next = newBaseQueueFirst
}
hook.baseQueue = newBaseQueueLast

// 上一次setVal触发新一轮更新，再次执行 useState 的时候，
// val就是hook.memoizedState，setVal就是hook.queue.dispatch；
// 这种机制就说明了，setVal执行多次的时候，只会往循环队列里
// 加入update, 等到下一次调度更新的时候，一次计算搞定，
// 这就是批量更新
return [hook.memoizedState, hook.queue.dispatch]
```

## useMemo
```ts 
const App = () => {
  const [cnt] = useState(10)
  const val = useMemo(() => {
    if (cnt > 10) return "great"
    return "not bad"
  }, [cnt])
}
```

挂载的时候：
```ts 
// 函数执行结果
const value = "not bad"

const hook = {
  memoizedState: [value, [10]]
}
return value
```

更新的时候：
```ts 
const oldDeps = hook.memoizedState[1]
const oldValue = hook.memoizedState[0]

if (everyElementIsSameValue(deps, oldDeps)) {
  return oldValue
}

hook.memoizedState = [newValue, deps]
return newValue
```

从中可以看到，`useMemo`是被动改变的值，不会触发新一轮调度更新

## useCallback 
```ts 
const App = () => {
  const cnt = useState(10)
  const update = useCallback(()=> {
    if (cnt > 10) {
      fetchUserDetail()
    }
  }, [cnt])
}
```

`useCallback`本质和`useMemo`一样，前者存储函数，后者存储值

挂载时：
```ts 
const callback = () => {
   if (cnt > 10) {
      fetchUserDetail()
   }
}
const deps = [cnt]

const hook = {
  memoizedState: [callback, deps]
}

return callback
```

更新时：
```ts 
const oldDeps = hook.memoizedState[1]
const oldCallback = hook.memoizedState[0]
if (everyElementIsSameValue(deps, oldDeps)) {
  return oldCallback
}
hook.memoizedState = [callback, deps]
return callback
```

## useReducer 
```ts 
const App = () => {
  const [state, dipatch] = useReducer((val, action) => {
    if (action.type === 'incr') return val + 1
    if (action.type === 'decr') return val - 1
    return val
  }, 10)

  const onClick = () => {
    dispatch({ type: "incr" })
  }
}
```

挂载时：
```ts 
const reducer = (val, action) => {
  if (action.type === 'incr') return val + 1
  if (action.type === 'decr') return val - 1
  return val
}

const intialValue = 10

const hook = {
  baseState: intialValue,
  memoizedState: initialValue,
  queue: null,
}

const queue = {
  pending: null,
  interleaved: null,
  lanes: NoLanes,
  dispatch: null,
  lastRenderedReducer: reducer,
  lastRenderedState: initialValue,
}

hook.queue = queue
hook.queue.dispatch = dispatchReducerAction.bind(
  null,
  appFiber,
  queue,
)

return [hook.memoizedState, hook.queue.dispatch]
```
我们来看下dispatchReducerAction：
```ts 
function dispatchReducerAction(fiber, queue, action) {
  const lane = requestUpdateLane(fiber);

  const update = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };

  if (isRenderPhase(fiber)) {
    // queue.pending 是一个循环队列，update插入其中，
    // 作为队尾
    insertAsLastUpdate(queue.pending, update)
  }
  else {
    insertAsLastUpdate(queue.pending, update)
    // 安排下一次调度；
    // 这里和useState的情形不同，没有预计算的环节，不
    // 必考虑新、旧值是否一样，强制下一轮调度
    scheduleUpdateOnFiber(fiber)
  }
}
```

更新时，和`useState`一样。

综上，如果想让页面一定从新发生调度，就可以使用`useReducer`

## useRef
```tsx
const App = () => {
  const ref = useRef(null)
  return (
    <div className="container" ref={ref}>
      This is Container for canvas or alike
    </div>
  )
}
```

挂载时：
```ts 
const hook = {
  memoizedState: {
    current: null
  }
}
return hook.memoizedState
```

更新时：
```ts 
return hook.memoizedState
```

此时，你一定会想，什么时候`ref.current`会绑定到DOM节点？

这个事情发生在commit阶段。在渲染阶段，会对`<div className="container">`对应的fiber加入`Ref`的flag标记，在commit阶段，如果检测到这个标记，就会执行`ref.current = HostComponentFiber.stateNode`，这样就完成绑定了。
源码位置：`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line1025`
> `useLayoutEffect`的effect执行完毕后，才发生的ref绑定

ref的解绑操作，发生在fiber.deletions中的子fiber，在真正被删除前，先解绑，源码位置：`packages/react-reconciler/src/ReactFiberCommitWork.new.js,line1609`

## useId 
最简单的hook函数了。

挂载时：
```ts 
const identifierPrefix = fiberRoot.identifierPrefix
let globalClientIdCounter = 0

function randomValue() {
   const globalClientId = globalClientIdCounter++
   return ':' + identifierPrefix + 'r' + globalClientId.toString(32) + ':';
}

const hook = {
  memoizedState: randomValue()
}

return hook.memoizedState
```

更新时：
```ts 
return hook.memoizedState
```

## useDeferredValue
```ts 
const App = () => {
  const [val, setVal] = useState(10)
  const deferredVal = useDeferredValue(val)
}
```

挂载时：
```ts 
const hook = {
  memoizedState: 10,
  baseState: false
}
return hook.memoizedState
```

更新时：
```ts 
const oldValue = hook.memoizedState
// shouldDeferValue内部根据全局变量renderLanes
// 的情况，判断是否需要采用延迟策略
if (shouldDeferValue()) {
  if (notEqual(oldValue, value)) {
    hook.baseState = true
  }
  return oldValue
}
if (hook.baseState) {
  hook.baseState = false
}

hook.memoizedState = value
return value
```

## useImperativeHandle
```tsx
const App = (props) => {
  const { ref } = props
  const innerRef = useRef(null)
  const [val] = useState(10)
  useImperativeHandle(
    ref, 
    () => {
      return {
        changeToTem() {
          if (val < 20) {
            innerRef.current.text = "10"
          }
        }
      }
    },
    [val]
  )

  return (
    <div>
      <span ref={innerRef}></span>
    </div>
  )
}
```

`useImperativeHandle`本质就是给`props.ref`设置一个值

挂载时：
```ts 
const ref = props.ref 
const create = () => {
  return {
    changeToTem() {
      if (val < 20) {
        innerRef.current.text = "10"
      }
    }
  }
}

const effect = {
  // 只是表示是一个函数，并非是空函数
  create: imperativeHandleEffect.bind(null, create, ref),
  destroy: null，
  // 只是表示是一个数组，并非是空函数
  deps: [val, ref],
  tag: HookHasEffect | HookLayout,
  next: null
}

const hook = {
  memoizedState: effect
}

appFiber.flags |= UpdateEffect
insertAsLast(appFiber.pending, effect)
```
没想到吧，竟然是加入了一个effect，而且和`useLayoutEffect`的effect一样，使用了`HookLayout`的tag，二者本质是同一种effect！

再看看`imperativeHandleEffect`做了什么：
```ts 
function imperativeHandleEffect(
  create, ref
) {
  if (typeof ref === 'function') {
    const obj = create()
    ref(obj)
    // destroy函数
    return () => {
      ref(null)
    }
  }

  // 这也就是说，为什么useImperativeHandle本质是给
  // props.ref设置了一个值
  ref.current = create()
  return () => {
    ref.current = null
  }
}
```

在commit阶段DOM操作完成后，`imperativeHandleEffect`就会随着effect.create()而执行。

更新时：
```ts 
let oldHook
const oldEffect = oldHook.memoizedState

if (everyElementIsSameValue(deps, oldEffect.deps)) {
  const effect = {
    create: imperativeHandleEffect.bind(null, create, ref),
    destroy: oldEffect.destory，
    deps,
    // 缺少 HookHasEffect 的标记，在commit阶段，不会执行
    tag: HookLayout,
    next: null
  }
  hook.memoizedState = effect
  insertAsLast(fiber.pending, effect)
  return
}

fiber.flags |= UpdateEffect
const effect = {
  create: imperativeHandleEffect.bind(null, create, ref),
  destroy: oldEffect.destory，
  deps,
  tag: HookHasEffect | HookLayout,
  next: null
}
hook.memoizedState = effect 
insertAsLast(fiber.pending, effect)
```


## useContext 
`useContext`不能单独使用，要和`createContext`组合使用。

```tsx 
const ThemeContext = createContext(null)

const Component = () => {
  const {
    dark,
    fontSize
  } = useContext(ThemeContext)

  return (
  <span>
    hello
  </span>
  )
}

const App = () => {
  const baseInfo = {
    dark: false,
    fontSize: 14
  }
  return (
    <ThemeContext.Provider value={baseInfo}>
      <Component />
    </ThemeContext.Provider>
  )
}
```

`createContext`不涉及挂载和更新，我们先讨论这个。源码定义位置：`packages/react/src/ReactContext.js`

定义非常简单：
```ts
function createContext(val) {
  const context = {
    $$typeof: REACT_CONTEXT_TYPE,
    
    _currentValue: val,
    _currentValue2: val,
    
    _threadCount: 0,
   
    Provider: null,
    Consumer: null,

    _defaultValue: null,
    _globalName: null,
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  }

  context.Consumer = context 

  return context
}
```

`useContext`挂载和更新，都是：
```ts 
return context._currentValue
```

问题来了，什么时候`context._currentValue`有值的，另外`ThemeContext.Provider`支持嵌套，不同层级的值如何隔离的？

当render阶段，渲染`ContextProvider` tag类型的fiber时，`fiber.pendingProps.value`就可以拿到`ThemeContext.Provider`的value属性值。

这个时候，只需要`ThemeContext._currentValue`入栈，入栈的这个值就是上一层级`ThemeContext.Provider`提供的值。

然后再设置成这个value属性值，那么接下来创建子fiber的时候，`useContext`拿到的就是这个数据，这就避免了不同层级的`ThemeContext.Provider`带来的冲突。

等到fiber收尾工作阶段，从下往上回溯到`ThemeContext.Provider`, 执行出栈即可。

::: info 
react19开始，做了简化，可以直接写`<ThemeContext value={10}>`，无需`<ThemeContext.Provider value={10}>`
:::


## useTransition
```tsx 
async function fetchUsers(val) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(val) }, 6_000)
  })
}

const App = () => {
  const [val, setVal] = useState(0)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      const count = await fetchUsers(100)
      startTransition(() => {
        setVal(count)
      })
    })
  }

  return (
    <div>
      <span>status: {isPending ? "pending" : "notPending"}</span>
      <span>user count: {val}</span>
      <button onClick={onClick}>click me</button>
    </div>
  )
}
```

点击之后, 出现：
- status: pending 
- user count: 0

等到获取用户数量的请求回来后：
- status: notPending 
- user count: 100

有了这些感性认识后，我们看看`useTransition`做了什么。

挂载时：
```ts 
// mountState就是挂载时的useState
const [isPending, setPending] = mountState(false)
const start = startTransition.bind(null, setPending)
const hook = {
  memoizedState: setPending
}
return [isPending, start]
```

更新时:
```ts 
// updateState就是更新时的useState
const [isPending] = updateState(false);
return [isPending, hook.memoizedState]
```

重点就是`startTransition`:
```ts 
function startTransition(setPending, callback) {
  // 提升优先级，setPending创建的update, 就会使用这个优先级,
  // 同时触发的下一个渲染任务的优先级，也采用这个优先级
  const previousPrority = liftCurrentUpdatePriority()
  setPending(true)

  // 设置ReactCurrentBatchConfig.transition，
  // 之后 setPending 创建的update，就会使用这个优先级，
  // 同时触发的下一个渲染任务的优先级，也采用这个优先级，
  // 这个优先级比上边的优先级要低
  const prevTransition = ReactCurrentBatchConfig.transition
  ReactCurrentBatchConfig.transition = {}

  // 在重新渲染的时候，会取出useState的hook上的update，依此执行，
  // 计算出最后的isPending, 但是，setPending(false)创建的update，
  // 它的优先级更低，不会参与计算，因此算出来的isPending就是true。
  //
  // 而在下一次重新渲染的时候，setPending(false)创建的update才会
  // 参与到计算，算出来的isPending就是false
  try {
    setPending(false)
    callback()
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition
    setCurrentUpdatePriority(previousPrority)
  }
}
```