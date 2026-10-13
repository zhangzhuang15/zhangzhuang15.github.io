---
title: "任务调度"
page: true
aside: true
---

# 任务调度 
我们前边讲到`const [val, setVal] = useState(0)`，当调用`setVal`之后，就会安排下一次调度任务，在未来的某个时间，开始重新渲染。

现在，我们就揭开调度系统的帷幕，从而知道任务怎么调度，什么时候被调度。

调度系统的源码位置：`packages/scheduler/src/forks/Scheduler.js`

我们的代码是简化后的代码，主体思路和源码保持等效，但是具体的写法不一样。细节党可以搭配源码阅读。

## 调度系统整体面貌

<image src="/react-schedule-1.png" style="width: 700px" />

当我们调用`setVal`后，就会触发一个特定的`scheduleFunction`，它会创建一个渲染任务，加入到task queue中。而另一边，`dispatcher`会创建javascript的宏任务，在宏任务里陷入到`work loop`函数，该函数会消费task queue的任务，当时间片不够了，退出`work loop`，随后`dispatcher`就会创建下一个宏任务。

## dispatcher 
dispatcher的作用就是创建javascript的宏任务。

```ts 
function workLoop() {}

let dispatcher

if (apiExist(setImmediate)) {
  dispatcher = () => {
    setImmediate(workLoop)
  }
}
else if (apiExist(MessageChannel)) {
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = workLoop;
  dispatcher = () => {
    port.postMessage(null);
  };
}
else {
  dispatcher = () => {
    setTimeout(workLoop, 0)
  }
}
```
react偏向于使用宏任务，vue偏向于使用微任务。如果阅读之前的文章，我想你应该可以理解。因为react的render和commit太重了！有非常多的边界检查，特别是检查优先级lane。还有后序遍历执行的各种effect，还有hook。函数组件自身执行起来，也有不少开销。还要在fiber上捣鼓hook, updateQueue。这些放在微任务里执行，严重阻塞浏览器渲染页面。

## scheduleFunction 
```ts 
function schedule(priorityLevel, callback, options) {
  const currentTime = getCurrentTime()
  const delayTime = extractDelayTime(options) || 0
  const startTime = currentTime + delayTime
  // 级别越高，timeout越小，排队越靠前，越快被执行
  const timeout = getTimeoutByPriorityLevel(priorityLevel)
  const expireTime = startTime + timeout

  const task = {
    startTime,
    expireTime,
    callback,
    sortIndex: -1
  }

  task.sortIndex = startTime > currentTime ? startTime : expireTime
  
  // 插入队列，插入时候，按照sortIndex排序
  if (task.sortIndex === startTime) {
    // timeQueue 中的task，按照任务开始时间排序
    insertTimeQueue(task)
  }
  else {
    // taskQueue 中的task, 按照过期时间排序
    insertTaskQueue(task)
  }

  // 还没有到开始时刻，过一会儿说
  if (startTime > currentTime) {
    if (
      firstTaskQueue() === null && 
      task === firstTimeQuwuw()
    ) {
      setTimeout(dispatcher, startTime - currentTime)
    }
  }
  // 立即安排宏任务，准备执行work loop
  else {
    dispatcher()
  }
}
```

## work loop 
```ts 
function workLoop() {
  let currentTime = getCurrentTime()
  // 根据当前时间戳调整 timeQueue
  adjustTimeQueue(currentTime)

  let task = firstTaskQueue()

  while (task !== null) {
    if (task.expireTime > currentTime && shouldYield()) {
      break
    }
    const callback = task.callback 
    // 如果callback没有执行完，会返回一个函数，
    // 这个函数内部会执行剩下的
    const nextCallback = callback()
    currentTime = getCurrentTime()
    if (typeof nextCallback === 'function') {
      task.callback = nextCallback
    }
    // callback执行完毕了，把task从队列里剔除
    else {
      firstTaskQueue() === task ? pop() : null
    }
    
    adjustTimeQueue(currentTime)

    task = firstTaskQueue()
  }

  // 还有任务要执行了，立即安排下一个宏任务
  if (task !== null) {
    dispatcher()
    return true
  }

  // 有即将开始的任务，过一段时间后，再安排宏任务
  task = firstTimeQueue()
  if (task) {
    setTimeout(dispatcher, task.startTime - currentTime)
  } 

  return false
}
```

介绍render和commit的时候，我们在梳理commit简化代码框架的时候，提到一步`requestPaint`，这里就可以做出回答：
```ts 
let needsPaint = false 

function requestPaint() {
  if (
    enableIsInputPending && 
    navigator !== undefined &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
  ) {
    needsPaint = true
  }
}

let startTime = -1
const frameYieldMs = 5
const enableIsInputPending = true

function shouldYield() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameYieldMs) {
    return false;
  }
  if (enableIsInputPending) {
    if (needsPaint) return true
  }

  return false
}
```
因为在之前的react版本中，没有引入`timeElapsed`和`frameYieldMs`，无法得知是否还有时间片，这个时期，`enableIsInputPending = true`，我们在commit阶段执行`requestPaint`后，会结束`workLoop`里的循环，安排新的宏任务，这可以带来更多的宏任务间隔时间，浏览器能有时间渲染。

后来，引入了`timeElapsed`和`frameYieldMs`，一切都以每帧对应的时间，作为时间片考量，`enableIsInputPending` 就改为false了。而`requestPaint`的调用，其实没什么用了。

## taskQueue 
react在管理任务的时候，会按照任务的开始时间和过期时间，两种维度安排任务顺序。每个队列其实就是基于数组实现的大顶堆（或小顶堆）。优先级最高的任务位于第一个。

如果任务的开始时间大于当前时间，就会被加入到timeQueue，这个队列里的任务并不着急现在执行。反之，任务就会加入到taskQueue。因此，在`workLoop`里边，以消费taskQueue里的任务为主。

而timeQueue里的任务会在调整阶段，加入到taskQueue:
```ts 
function adjustTimeQueue(currentTime) {
  let task = firstTimeQueue()
  while (task !== null) {
    if (task.callback === null) {
      popTimeQueue()
    }
    // 开始时间已经到了，就把它加入到taskQueue里，
    // 在workLoop里被消费
    else if (task.startTime <= currentTime) {
      popTimeQueue()
      task.sortIndex = task.expireTime
      pushTaskQueue(task)
    }
    else {
      return
    }

    task = firstTimeQueue()
  }
}
```