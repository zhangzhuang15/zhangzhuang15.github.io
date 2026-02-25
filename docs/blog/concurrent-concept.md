---
title: "并发编程的一些零碎概念"
page: true
aside: true
---

## SkipList 触发 lock-free 好奇之心

读了一本关于 redis 实现的电子书，里边有介绍 redis 如何实现 SkipList 数据结构，发现其实现方式
和邓俊辉老师数据结构教材里的实现，差别有点大，于是好奇最初设计的 SkipList 到底是什么样的，然后
在维基百科里搜索 SkipList，发现了诸多论文链接，注意到 SkipList 和 lock-free 编程还有关联，
就访问了上面关于 lock-free 的论文链接。阅读论文之后，欣喜若狂，发现了很多之前没有听说过的东西，
于是在这里记录一下。

论文：

[1998_JPDC_nonblocking](https://www.cs.rochester.edu/u/scott/papers/1998_JPDC_nonblocking.pdf)

## load-linked 和 store-conditional

它们都是 CPU 指令原语，伪代码中常用`LL`表示 load-linked, `SC`表示 store-conditional。

```txt
// 从 X 所代表的内存地址读取数据 value
value = LL(X)

// 如果在 LL 读取数据之后，X 位置的内存没有
// 被修改过，就将其设置为 newValue，返回 true,
// 否则不做任何修改，直接返回false
SC(X, newValue)
```

与 CAS 相比，LL 和 SC 可以检测到 ABA 问题。

## wait-free lock-free obstruction-free

它们描述的是某个算法对线程 non-blocking 的不同支持程度。

non-blocking：和 IO 的 non-blocking 不一样，它说的是两个线程之间的阻塞问题，
如果一个线程执行失败或者被挂起，无法导致另一个线程执行失败或者被挂起，就称这个线程
是 non-blocking 的。

wait-free：多线程代码中，每个线程都不会处于饥饿状态，每个线程都在有限的执行步骤中完成计算任务。
这是最高级别 non-blocking，实现起来也是最难的。

lock-free: 多线程代码中，允许一部分线程处于饥饿状态，但处于饥饿状的线程中，至少有一个线程可以
在有限的时间里，解除饥饿状态，继续工作。与 wait-free 级别的区别是，lock-free 级别下，执行同
一个操作，一部分线程会成功执行，另一部分线程会失败，而 wait-free 级别下，要求所有的线程都执行
成功。

obstruction-free: 多线程代码中，如果一个线程在有限的时间内可以执行完毕，而其余的线程被挂起，
那么就说这个线程是 obstruction-free 级别的 non-blocking.

## livelock deadlock

livelock: 两个线程相互等待，发现资源在对方手上后，尝试下一次争取资源，其结果是两个线程仍会被
调度，一旦调度上，就不断争取资源，CPU 陷入死循环，不断执行， CPU 会显得很忙；

deadlock: 两个线程相互等待，发现资源在对方手上后，自身会被挂起，其结果是线程会被挂起，线程无法
被推进，总是不会被调度上，不占据 CPU 算力，CPU 会显得很闲；

## 内存屏障的实现

内存屏障的作用：

- 阻止屏障两侧的指令重排；
- 强制把缓存中的脏数据写回内存，让其他线程从内存读取最新数据；

内存屏障需要使用特殊的汇编指令完成，比如:

- `fence`

- `lock` . 比如 `lock cmpxchg`, lock 先对总线/缓存加锁，执行 cmpxchg 指令，执行完毕后，将缓存中的脏数据写回到内存。

  > "The `LOCK` prefix ensures that the CPU has exclusive ownership of the appropriate cache line for the duration of the operation, and _provides certain additional ordering guarantees_. This may be achieved by asserting a bus lock, but the CPU will avoid this where possible. If the bus is locked then it is only for the duration of the locked instruction" —— [stackoverflow](https://stackoverflow.com/questions/8891067/what-does-the-lock-instruction-mean-in-x86-assembly)

- `mfence`

- `sfence`

- `lfence`

:::tip <TipIcon />
推荐阅读：

[Locks 实现:背后不为人知的故事](https://www.hitzhangjie.pro/blog/2021-04-17-locks%E5%AE%9E%E7%8E%B0%E9%82%A3%E4%BA%9B%E4%B8%8D%E4%B8%BA%E4%BA%BA%E7%9F%A5%E7%9A%84%E6%95%85%E4%BA%8B/)
:::

一些补充。内存屏障分为编译器级别和 CPU 级别。上边说的内存屏障说的是 CPU 级别。另外一种是编译器级别的内存屏障。这种屏障不会令 CPU 做一些特殊的事情，但是会让编译器放弃重排指令，一般这种屏障使用下面的内联汇编实现：

```c
int main() {
    int a = 2;
    asm volatile("":::"memory");
    int b = 3;
    return 0;
}
```

这样处理后，b 的赋值语句不会重排到 a 的赋值语句。因为内联汇编代码表示此处内存被修改了，意味着 a 可能被修改了，这样编译器就不敢把 b 排到 a 之前，换顺序就有内存方面的副作用，可能导致错误。

再说说 cpu 级别的内存屏障。内存屏障到底把屏障前的代码堵住了，还是把后边的代码堵住了呢？如果是写屏障，意味着屏障之前的写操作不能突破屏障重排到后边去，屏障后的写操作不能突破屏障重排到前边去。但是，屏障之前的写操作，可以彼此重排，只要不穿过屏障就可以。屏障之后的写操作，也可以彼此重排，只要不穿过屏障即可。读屏障类似。全屏障就更猛了，它之前的所有操作都不能重排到它后边，它后边的所有操作都不能重排到它前边。

这篇[文章](/rust/question)介绍了`Ordering::Release`和`Ordering::Accquire`的内存顺序，也可以读读看。

## volatile

提到内存屏障，重排序，就不得不提 volatile 关键字。volatile 起始不解决指令重排的问题，它解决的是内存可见性问题。

```c
int main() {
    int c = 2;
    c = 4;
    return 0;
}
```

大家会以为变量`c`指的是内存，实际上编译器会优化，让变量`c`指的是寄存器，`c=4`只是更新了寄存器的值，这会导致如果有另外一个线程读取变量`c`，读出来的数据是 2，不是 4. 改成`volatile int c = 2`, 编译器就知道 `c` 很特别，不能把它映射到寄存器，必须老老实实映射到内存。

## 锁的实现

实现锁需要的工具：

1. CPU 提供的 CAS 原子指令
2. 操作系统提供的系统调用，用于挂起线程

伪代码如下：

```javascript
a = 0

function lock() {
  while (true) {
    if (compareAndSet(&a, 0, 1)) {
        return true;
    }
    suspend_current_thread();
  }
}

function unlock() {
    compareAndSet(&a, 1, 0);
    invoke_other_suspended_threads();
}
```

其中，`suspend_current_thread()` 和 `invoke_other_suspended_threads()` 是操作系统提供的能力。从主流操作系统的角度看，操作系统封装好系统调用，实现了这两种能力，但是它没有向开发者暴露这两种能力，以至于，系统调用已经包含在某个系统库了，但是没有提供 c 的头文件，导致开发者无法使用它们。实现线程挂起的能力，一般都是借助 pthread 的互斥锁或者条件变量间接地实现。
