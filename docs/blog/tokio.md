---
title: "Tokio框架简介"
page: true
aside: true
---

# Tokio 框架简介

## 框架全景

```txt
┌─────────────────────────────────────────────────────┐
│                    用户代码 (async fn)                │
├─────────────────────────────────────────────────────┤
│                    Runtime                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Scheduler  │  │   Reactor    │  │  Timer    │  │
│  │ (任务调度器) │  │  (IO事件循环) │  │ (时间轮)  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │         │
│  ┌──────▼────────────────▼────────────────▼──────┐  │
│  │              Thread Pool (工作线程池)           │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│              标准库组件                              │
│  sync  │  io  │  net  │  fs  │  process  │  signal │
└─────────────────────────────────────────────────────┘
```

## Runtime

所有一切的容器，没有 Runtime 就没有 async。

```rs
// 多线程版（默认）
let rt = tokio::runtime::Runtime::new().unwrap();

// 单线程版
let rt = tokio::runtime::Builder::new_current_thread()
    .build().unwrap();

// 宏展开后本质也是创建 Runtime
#[tokio::main]
async fn main() {}
```

Runtime 内部持有三个子系统的引用：Scheduler、Reactor、Timer，负责把它们组装在一起对外提供服务。

## Task

组合 Future 和 Waker 信息。当 Future 经过 `poll()`，处于 `Pending` 状态，会根据存储在 Task 的 Waker 信息，构建出`Waker`对象，存储到`Reactor`，等到未来时机满足，`Waker.wake()`会再次将`Task` 提交给 `Scheduler`.

## Scheduler

决定哪个 task 在哪个线程上运行。具体来讲，它负责创建`全局Task队列`，负责创建工作线程，负责创建工作线程的`local Task队列`，负责挂起(park)或者唤醒(unpark)工作线程。

在主线程`spawn`一个 task 的时候，Scheduler 将它加入到`全局Task队列`;

在工作线程`spawn`一个 task 的时候，Scheduler 将它加入到工作线程的`local Task队列`；

## 工作线程

工作线程是一个 work loop:

```txt
while(thread_is_alive) {
    task = take_task_from_local_queue();
    if (task) {
      task.poll();
      continue;
    }
    task = steal_task_from_other_thread_local_queue();
    if (task) {
      task.poll();
      continue;
    }
    task = take_task_from_global_queue();
    if (task) {
      task.poll();
      continue;
    }
    park_it_self();
}
```

当工作线程发现没有任何 Task 可以执行的时候，就会把自身挂起，不占用 CPU。Scheduler 往工作线程的 local Task 队列，或者全局 Task 队列中加入 Task 后，就会使用`unpark()`将工作线程唤醒，工作线程继续 work loop。当 Scheduler 将工作线程的 thread_is_alive 设置为 false，并唤醒工作线程，工作线程就会结束，线程池就少了一个线程。

## Reactor & Timer

Reactor 和 Timer 是两个概念，但是在实现的时候，会放在一起实现：

```txt
while(reactor_is_alive) {
  const timeout = get_next_timeout();
  const fds = io_poll(timeout);
  if (fds.not_empty()) {
    invoke_wakers_with_fds(fds);
  }
  const timers = get_expired_timers();
  invoke_wakers_with_timers(timers);
}
```

Reactor 基于`mio`，利用`io_poll`这样的统一封装，监听 io 事件，一旦发现 fd 可写或者可读，就会通过自身的一个 HashMap，顺着 fd 找到对应的 Waker 对象，执行`Waker.wake()`，之后，Task 就会被 Scheduler 从新加入到 Task 队列中。

Timer 负责管理定时器有关的场景，内部维护一个当前时间戳，然后看看有哪些 timer 超时了，然后根据 timer 找到 Waker，执行`Waker.wake()`。

这就意味着，tokio 提供的 api（读取文件，设置定时任务），其内部要实现:

- 定义好`Future`的实现，而不是依赖编译器提供的`async`生成`Future`。这就类似递归运算，必须给出最底层的运算结果。
- 当`Future`是`Pending`，创建 Waker，存储到 Reactor
- 给出`Waker.wake()`的实现，将 Task 重新加入到 Scheduler

Reactor 和 Timer 运行在一个独立的工作线程。主线程可以通过改变 reactor_is_alive 为 false，结束该线程。

除了 io 事件，Reactor 还能监听进程信号，当信号被接收到的时候，会被封装为`Future`变成`Ready`。实现思路如下：

```txt
1. 创建一个 pipe
2. Reactor监听 pipe 是否可读
3. 注册信号函数，一旦接收到信号，就往 pipe 里写入
4. Reactor在执行 io_poll 的时候，读取 pipe，就可以知道信号是否发生
```

## Reactor 退出 io_poll 循环

如果是 `current_thread` 模式，Reactor 就是工作在主线程里的，当`runtime.block_on(future)`的 `future` 变成`Ready`状态，主线程结束阻塞，Reactor 就结束工作了；

如果是 `multiple_thread` 模式，当主线程的 runtime drop 的时候，主线程就会发送信号给 Reactor 线程，让它结束工作，之后主线程退出。
