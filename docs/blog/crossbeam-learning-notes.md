---
title: "crossbeam 学习笔记"
page: true
aside: true
---

# crossbeam 学习笔记

## 什么是crossbeam
crossbeam是一个Rust开源项目，提供并发编程工具，这些并发工具在实现的时候，一部分基于Rust标准库提供的基础功能，另一部分基于无锁编程技术。在其他由Rust开发的项目中，有很多都使用了crossbeam。

## CachedPadded
这个数据结构是对值的封装，目的是让被包装的值占满一个缓存行。为什么要这样做呢？因为当体积偏小时，多个值会被放入到同一个缓存行，当其中一个值更新后，整个缓存行就会被更新，对于没有更新的值来说，它们又会被加载一次，是一种浪费。最佳做法是，谁更新了，就重新加载谁，没有变化的无需重新加载。为了实现这点，就要让一个值占据整个缓存行。

具体实现，是根据体系平台条件编译，按照不同的大小进行内存对齐:
```rust 
#[cfg_attr(
    any(
        target_arch = "x86_64",
        target_arch = "aarch64",
        target_arch = "powerpc64",
    ),
    repr(align(128))
)]
struct CachedPadded<T> {
    value: T;
}
```

一个C语言内存对齐的例子：
```c 
struct M {
    int64_t a;
    int32_t b;
}
```
a必须8字节对齐，b必须4字节对齐，而默认情况下，M就必须按照成员中，内存对齐要求最大的那个对齐，也就是8字节对齐。这就意味着，b不足8字节，需要在b的后边补充4字节，这4个字节就是padding。实际上，我们还可以让M按照8的整数倍对齐，比如按照16字节对齐，32字节对齐。但是，我们不能按照4字节对齐。这是因为按照4字节对齐，b占用的起始内存地址一定是4的整数倍，但是对于a来说，它的起始内存地址不一定是8的整数倍。在x86_64平台来说，可能没什么，但是在arm平台中，如果没有对齐，访问a的时候就会出现硬件错误。

## BackOff
用于控制线程自旋。在自旋的基础上，如果超过指定次数的尝试后，调用操作系统API使得线程交出CPU，等待下一次操作系统调度后，重新执行。BackOff的执行效果就是，让线程自旋一会儿，或者自旋一会儿后交出CPU。

交出CPU使用权，用的是这个API：
```rust 
std::thread::yield_now()
```

自旋调用的是这个API：
```rust 
core::hint::spin_loop()
```

## ArrayQueue
基于数组的有限无锁队列。队列头head和队列尾tail都是usize类型的数据，也就是64bit。最低的m bit，用来标记存储数据的数组的索引号，最高的n bit 用来保证队列的索引不用回头。而m和n到底是多少，取决于队列的容量。

假设容量是6，那么大于6的最小2的幂就是8，8就是2的3次方，那么 m = 3, n = 64 - 3 = 61.

在传统意义上，环形队列是需要回头儿的，比如末尾的索引是4，tail指向4，如果继续存入数据，tail就要变成0.而这里的实现不需要回头儿。还是假设容量是6，如果都填满了，再继续存入数据的话，高 61 bit会增1，低3 bit清零，整个64bit的数据是一直增加的，没有回头儿。不过，最低的3 bit还是有回头儿的。

如何防止队列已经满了，继续存入数据的情况呢？答案是slot。队列中每个数据都是一个slot, 真正要存入的数据位于slot内。slot还有一个叫做 stamp 的属性，当第一个slot存入数据后，这个slot的stamp就会变成1，指向索引号为1的slot，当第二个slot存入数据后，它的stamp就会变成2，指向索引号为2的slot。对于没有存入数据的slot，它的slot的stamp就是自身的索引号，比如第3个slot没有存入数据，它的stamp就是2.假设存满了之后，继续存入的话，肯定要存入第一个slot, 这时候检查一下slot的stamp是不是1，如果是1，说明slot已经存入数据了，我们本次就不再执行存入了。

既然是无锁数据结构，读、写的关键依赖技术就是原子操作和内存屏障。关于二者，可以看后边的一节。

## SegQueue
基于链表的无限无锁队列。无限指的是它用链表实现，不像基于数组实现的那样，受到容量的限制。可实际上，它并非无限，一方面是受到实际物理内存的限制（存入数据多了，占用内存多了，内存耗尽就crash了），另一方面是受到其实现思路的限制。

想象一个普通的链表，链表的每一个节点被叫做block，block由两部分组成，一部分是指向下一个block的指针，另一部分是能存入32个元素的数组。每个元素叫做slot，slot也有两个部分，一个是我们要存储的真实数据，另一个是状态量，表示这个slot刚被写入，要被读出，或者是空白。没错，这就是SegQueue的样貌。

既然是队列，队列头和队列尾必不可少。以队列尾为例，它有两个部分，一个是指针，指向block。一个是usize类型的数据，最高的63bit用来确定tail指向block的那个slot，最低1bit用作状态标记。当然了，63bit需要按32取余，才得到slot的索引号。如果我们把所有的block的slot拿出来，放入一个数组中，这个数组最大多少容量呢？没错，就是 63 bit最多能表示的个数，也就是 2^63 - 1，再继续存的话，63bit就会变成0，指向第一个slot。所以你看，SegQueue不是真正的无限。我们就当一个slot占据一字节，SegQueue能占据 2^33 GB, 现实中哪里会有这么大的内存呢？从这个角度上看，SegQueue确实“无限大”，只是我们的内存容量跟不上。

存入数据的时候，会根据tail计算出slot索引号，如果满了，就会创建一个新的block, tail指向这个block, 把数据存入到这个block的第一个slot中，然后tail的uszie类型数据增一即可。读取数据类似，是根据head计算出slot索引号，如果全读完了，head就会指向下一个block, 释放上一个block，然后把第一个slot的数据读出来，head的usize类型的数据也是增一即可。

## channel


## 原子操作和内存屏障 
原子操作，就是CPU执行这个操作的时候，不会被打断，CPU要么做了，要么没做，由特殊的CPU指令来提供这种能力。

```txt 
a = 0

thread 1:
a = a + 2

thread 2: 
a = a + 2
```
如果没有原子操作，上述的操作在两个线程执行之后，a的结果可能是2，而不是4。如果采用了原子操作，那么结果就是4.

但是，这仅仅是执行一条原子操作的指令的结果，当原子操作增加后，依旧会有多线程的问题。这是因为，原子操作虽然安全，但是受汇编器和CPU的影响，原子操作的顺序可能被重排。内存屏障就是解决重排的问题。有的CPU提供了专门的指令实现内存屏障，这会使得CPU不会乱序执行。另外，编译器也会提供一些特殊的标记，使用这些标记，可以让编译器生成代码的时候，不用调整代码的顺序，但是这种情况下，无法保证CPU在执行的时候，不会乱序执行。

在无锁编程领域，就是原子操作+内存屏障。接下来，以Rust为例，具体说说。

`Ordering::Relaxed`表示执行原子操作的时候，不做内存屏障。这就意味着第5行代码可能排列到第4行之前。
```rust:line-numbers
fn do_something() {
    let m = AtomicUsize::new(0);
    let mut arr = vec![10,11];
    arr.push(22);
    let n = m.load(Ordering::Relaxed);
    m.store(n + 1, Ordering::Relaxed);
}
```

`Ordering::Release` 和 `Ordering::Acquire`对原子操作融入了内存屏障的限制。为了说明它们的作用，先看一下示例代码：
```rust 
struct M {
    value: AtomicUsize,
    data: i32,
    org: String,
}

impl M {
    fn do_something(&mut self) {
        self.data = 10;
        self.value.store(100, Ordering::Release);
        self.org = "hello".to_string(); 
    }

    fn rev_something(&self) {
        let v = self.value.load(Ordering::Acquire);
        if (v == 100) {
            println!("{}", self.data);
        }
    }
}
```
如果使用`Ordering::Acquire`读取的数据刚好对应`Ordering::Release`写入的数据，那么在 `Ordering::Release`写入之前发生的写操作，在 `Ordering::Acquire`之后的读取是可见的。例子中，打印出来的`self.data`就是10，但是`self.org`不一定是"hello"。

上述代码可以用伪代码形容一下：
```txt 
fn do_something() {
    data = 10
    memory_write_fence();
    atomic_write(value, 10);
    org = "hello" 
}

fn rev_something() {
    v = atomic_read(value);
    memory_read_fence();
    if (v == 100) {
        print(data)
    }
}
```

写屏障`memory_write_fence()`之前的读/写操作，不能重排到它后边，但是，它后边的读/写操作可以重排到它之前。

读屏障`memory_read_fence()`之后的读/写操作，不能重排到它前边，但是它前边的读/写操作可以重排到它之后。

`Ordering::SeqCst`是更加严格版本的内存顺序约束，如果把上述代码示例都换成这个，意味着读、写屏障之前和之后的代码都不能跨越它，进行重排。但是，要想实现这点，底层生成的汇编代码，会加入专门的内存屏障指令，带来的开销要比 Release/Acquire要大。

`Ordering::AcqRel`是 `Ordering::Release`和`Ordering::Acquire`的结合体，如果用在读操作上，等效于`Ordering::Acquire`, 如果用在写操作上，等效于`Ordering::Release`，如果用在RMW（read-mode-write）操作，比如CAS（compare and store），读取的部分采用`Ordering::Acquire`，写入的部分采用`Ordering::Release`.

:::tip <TipIcon />
Release/Acquire的内存顺序，在落实到汇编代码层面的时候，根据CPU体系不同，亦有不同。像x86体系，它本身就是强内存顺序类型，不会产生额外的汇编代码保证Release/Acquire内存顺序，读取和写入操作都是mov指令，只是编译器做了顺序限制，不会重排。

但是，aarch64体系就不同了，它是弱内存顺序的类型，会有单独的汇编指令实现Release/Acquire的内存顺序要求，比如读取数据的时候会用ldar（load-accquire）指令，写入数据用stlr(store-release)指令。
:::


## sync tool 
### WaitGroup
WaitGroup提供一个wait方法，当所有的线程都执行到wait的时候，就会唤醒所有线程继续往下执行。

WaitGroup内部用`Arc`包含了一个Inner，Inner由 `Mutex<usize>`和`CondVar`构成。在 wait 方法被调用时，会修改 `Mutex<usize>`, 令其内部的数据减1，如果不等于0，意味着还有其他的线程没有执行wait方法呢，于是当前线程会利用`CondVar.wait`进入阻塞状态；如果等于0，意味着所有的线程都执行过wait方法了，于是当前线程使用`CondVar.notify_all`唤醒所有线程。WaitGroup在多线程之间传送时，必须在当前线程内，调用WaitGroup.clone创造一个副本，将副本发送给另一个线程，也就是在创建副本的时候，`Mutex<usize>`内部的数据增1.

### Parker 
Parker是阻塞线程和恢复线程的工具，当调用`parker.park`的时候，就会把当前线程挂起，当调用`parker.unpark`的时候，就会使得某个线程从挂起中恢复。

做到这些也不难。Parker内部有一个原子数据，一个Mutex, 一个CondVar。阻塞和恢复线程，就是通过Mutex和CondVar完成的。原子数据用来标记当前现场的情况，是刚从挂起中恢复，还是空闲。


## channel
Channel的实现原理并不难。按照Channel的使用形式来看，它应该有一个东西，让用户写入数据，这就是Sender；它还要有一个东西，让用户读取数据，这就是Receiver。而作为数据的存储地，Channel应该有一个数据容器，比如数组或者列表。数组的容量是有限的，这样的Channel就是 bounded Channel。列表的容量是无没有限制的，这取决于操作系统的内存，这样的Channel就是 unbounded Channel。后边，我们把这种数据容器称为channel。这样，Channel就等同于 Sender + Receiver + channel。

Sender和Receiver共享channel的引用，这样就可以做到一个发送数据，一个接受数据。如果发送方和接收方不是操作同一个channel，那么它们之间无法达成数据交流。

你定会好奇，channel什么时候被drop呢？别担心，在 Sender 和 Recevier 内部，拥有计数器。当Sender或者Receiver被drop的时候，计数器会减1，当计数器为0的时候，它们就会触发 channel 的 drop。

还有一个问题是，如果channel满了，如何阻塞Sender? 如果channel空了，如何阻塞Receiver呢？秘密在channel身上，它除了封装读、写数据的操作外，还拥有Senders属性和Receivers属性，分别记录被阻塞的Sender和Receiver。要阻塞Sender的时候，只需要将Sender写入到channel.Senders，然后调用上一节中提到的Parker.park，就能实现阻塞，当然也可以使用Rust标准库的thread::park，也可以使用上一节提到的Mutex+CondVar的方法。Receiver的情况同理，写入到Receviers。

crossbeam在实现的时候做了优化，比如用无锁技术去实现写入和读取，在正式阻塞线程之前，会用自旋锁的方法反复尝试争取资源，阻塞和恢复线程的封装在Context里实现，而Context放在了thread_local里，Senders和Receivers会持有Context的引用。