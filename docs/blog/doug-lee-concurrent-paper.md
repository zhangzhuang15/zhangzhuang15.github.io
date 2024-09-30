---
title: "不懂代码有可能是少了一篇论文"
page: true
aside: true
---

# 不懂代码有可能是少了一篇论文

## 小故事篇
小豹吃过寿喜烧后，浑身舒畅，打算找阿逊串个门。

透过窗户，小豹就看到显示器高亮。

小豹心想：这老弟太卷了吧，闲着也在敲代码，偷练技术。

小豹：阿逊，你这家伙，又在敲代码。

阿逊扭过头：哦，是豹豹啊，过来瞧瞧这个，超有意思的。

显示器一行代码也没有，反而是一篇论文。

想到论文，小豹瞬间豹无可恋。

他啥都不怕，就怕论文。

不读他心痒痒，读了又看不懂，最后只能双手抱拳，来一句：白瞎工夫了。

小豹：不就是一篇论文吗，有什么看头儿，还不如去撸串。

阿逊：别小看这篇论文，你瞧瞧这篇文章是谁写的。

小豹：咱起码小学课文还是读过的，找作者姓名简直小菜一碟。别急，让咱瞧瞧哈。

小豹很快就找到了作者：`Doug Lea` ? 怎么有点熟，感觉在哪里看到过。哎呀，我想起来了，在jdk源码的注释里见过。

阿逊：可以啊小老弟，还有心思瞧瞧源码。

小豹：这不是卷嘛。

阿逊手指一动，显示器上出现了一个大（lao）佬（tou）。

![截屏2023-05-14 16.11.29.png](/doglea.png)

阿逊：当当当！这就是Doug Lea本尊了。

小豹：就这？平平无奇嘛。

小豹忽然get到了什么：不对啊，阿逊。Doug Lea人家是java系的，你这家伙不是typescript系的嘛，你读java代码，不是狗拿耗子，多管闲事儿吗。是不是这周工作量不饱和啊，你老板微信号多少，我跟他唠唠？　

阿逊：你可拉倒吧哈。其实我早些年对java很感兴趣，特别是对`java.util.concurrent`中的**同步器（synchronizer）**，更感兴趣，看过一些源码。那段时间，我就来回琢磨这些代码，可就是不懂。后来发现java卷中卷，用起来非常不顺手，就放弃了。

小豹坏笑：卷中卷才是根本原因吧。

阿逊：说什么大实话。

小豹：可你现在又看他写的论文，是几个意思？

阿逊：你不知道。代码读不懂，我就非常不爽，心里放不下。这感觉就和你去年被女友甩了差不多。

小豹：哒咩，这招对我不好使了，我早就忘了她哈。

阿逊：你这家伙。算了，我接着说。我读代码的时候，有个问题就总是出现在我脑袋里。我就非常纳闷儿了，他为什么按照这个思路实现，这个思路是他原创的嘛，这么牛批的思路真的就是大佬天生就会？

小豹：那当然了，大佬 is 大佬。有的人啊，天生就是吃这顿饭的，无师自通，自成一派，行业冥祖。

阿逊：在我没有找到突破口的时候，我也是这么觉得的。后来我了解到Doug Lea有自己的[个人网站](https://gee.cs.oswego.edu), 就从中下载了这篇[论文](http://gee.cs.oswego.edu/dl/concurrency-interest/index.html)，读完之后，豁然开朗。

小豹：代码你就全懂了？

阿逊：不是这个意思。这个豁然开朗是整体上的豁然开朗。具体解释就是，你在阅读代码的时候，跟着代码的思路走，你知道作者在做什么，但是你不知道他为什么这么做，你知道他实现了很多类，类和类之间有这样或者那样的继承、组合关系，但是你不知道为什么他要这么干、这么设计。这些东西就是代码总体的设计。代码就是设计的产物，你通过产物反向去推理设计，非常难搞。如果有了给出这种设计的论文，你就迎刃而解了呀。

小豹：有些道理。

阿逊：代码的背后，是需要原因的。可能是作者的个性原因，习惯原因，但更可能是一些算法、数据结构的原理。当然，这些原理不可能全部写在注释里。你想想看啊，如果你是作者，你头一次用到某些原理，你也是现学现写的，怕自己后续遗忘，你会把这些原理写在注释里。但是，你已经掌握这些原理了，你肯定懒得再写一遍原理到注释中啊。

小豹：是这么一回事儿。

阿逊：所以说，有时候你不懂吧，就是理论上不懂，直接从代码强行理解理论是不切实际的，**头莽不能解决问题**，必须有个理论做个铺垫，之后去看代码，才会理解。我这不就赶紧拜读一下Doug Lea的论文嘛。

小豹：那你有什么收获嘛？

阿逊：当然了，

## 收获篇

同步器的核心结构是`AbstractQueuedSynchronizer`，同步器种类虽有不同（比如 Semphore, Barrier, Lock等等），其核心功能大都是调用这个结构的API实现的。那为什么要抽离出一个这样的结构呢？那是因为一个同步器可以由另一个同步器实现。比如Semphore就可以使用重入锁（reentrant lock）实现。那岂不是要乱套了，搞不好就要出现鸡生蛋、蛋生鸡的问题了。为了统一设计，就要找个地基，其他的组件、建筑都在它上面搞，这样就不乱套了。
> 论文相关描述
> 
> As is well-known (see e.g., [2]) nearly any synchronizer can be used to
> implement nearly any other. For example, it is possible to build semaphores from
> reentrant locks, and vice versa.However, doing so often entails enough
> complexity, overhead, and inflexibility to be at best a second-rate engineering
> option. Further, it is conceptually unattractive.

`AbstractQueuedSynchronizer`的核心功能就是维护**同步状态（synchronizer state）**, 控制线程阻塞和唤醒。如果学习过React，就对state有着很深刻的概念。同步状态是一个**32bit的int类型数据**（论文中的说法）。根据场景不同，同步状态这个数据表达的内容也不同。比如：
  - ReentrantLock中，表示的是重入锁计数
  - ReentrantReadWriteLock中，用16bit表示写入锁的计数，另外1bit表示读取锁的计数
  - Semphore中，表示当前的计数，计数非正数的话，会引发线程阻塞

#### 一. 维护同步状态
怎么维护呢？

就是要保证同步状态数据的任何操作是线程安全的。

怎么做呢？

就是使用**原子操作**。

> 论文相关描述
> 
> Class *AbstractQueuedSynchronizer* maintains synchronization 
> state using only a single (32bit) int, and exports `getState`, `setState`,
> and `compareAndSetState` operations to **access and update this state**. These
> methods in turn rely on `java.util.concurrent.atomic` support providing JSR133
> (Java Memory Model) compliant volatile semantics on reads and writes, and access
> to **native compare-and-swap or load-linked/store-conditional instructions** to
> implement compare-AndSetState, that atomically sets state to a given new value 
> only if it holds a given expected value.

从描述中不难看出，原子操作使用java runtime所在宿主机的原语实现（native）。

就是说，像compare and swap这样的指令，是`CPU`通过`汇编指令`提供的(也有称为**hardware支持**)，只需要利用编译器即可实现。

比如在C程序中，就可以利用C编译器的`内嵌汇编`功能，将相关的compare and swap CPU汇编指令用到程序中。

Java要做的就是封装上述C语言，让使用者像一般的java api去调用。

这方面工作，在`java.util.concurrent.atomic`已经做好了。

注意，不能用锁来维护同步状态数据。

一方面是上锁会带来很大的时间消耗（在CPU看来），另一方面我们就是要用同步器实现锁，怎么还能用锁来维护同步器的同步状态数据呢，典型的`鸡生蛋、蛋生鸡`问题。

#### 二. 控制线程阻塞和唤醒
这一部分是`AbstractQueuedSynchronizer`的**最最最核心功能**。
> 论文相关描述
> 
> The heart of the framework is `maintenance of queues of blocked threads`, which
> are restricted here to FIFO queues. Thus, the
> framework does not support priority-based synchronization.

同步器会唤醒线程，所以同步器必须要知道它已经阻塞了哪些线程；所以，同步器在阻塞线程的时候，除了阻塞，还要把线程记录下来。

记录这些阻塞的线程，就是使用FIFO的队列。

到现在，我们关心的事情就只有：
- 怎么阻塞和唤醒线程
- 怎么记录被阻塞的线程

##### 1. 阻塞和唤醒线程
使用`LockSupport.park`阻塞线程；
使用`LockSupport.unpark`唤醒线程；

论文中还给出了一段历史信息：
> Until JSR166, there was no Java API available to block and unblock threads for
> purposes of creating synchronizers that are not based on `built-in monitors`.
> The only candidates were `Thread.suspend` and `Thread.resume`, which
> are unusable because they encounter an unsolvable race problem: If an unblocking
> thread invokes resume before the blocking
> thread has executed suspend, the resume operation will have no effect.

如果不基于java内置的monitor(我猜应该说的是sychronized关键字吧)，想实现同步器，在JSR166出现之前，只能使用 Thread.suspend 和 Thread.resume 实现，但这个实现有很大缺陷。

在JSR166之后，就可以使用 LockSupport 实现了。

从设计上不难看出，LockSupport采用了`单一职责原则`。要么阻塞线程，要么唤醒，其他的不干。逻辑非常清楚。顺便提一句，`AbstractQueuedSynchronizer`采用了模版方法模式，论文中明确说了：
> Class *AbstractQueuedSynchronizer* ties together the above functionality and
> serves as a **"template method pattern"** [6] base class for synchronizers.

那么，LockSupport是如何实现的呢？论文里也间接给出了答案:
> This simple mechanism is similar to those used, at some level, in the Solaris-9
> thread library [11], in WIN32 "consumable events", and in the Linux NPTL thread
> library, and so maps efficiently to each of these on the most common platforms
> Java runs on. (However, the current Sun Hotspot JVM reference implementation on
> Solaris and Linux actually uses a **pthread** condvar in order to fit into the
> existing runtime design.) The park method also supports optional relative and
> absolute timeouts, and is integrated with
> JVM Thread.interrupt support — interrupting a thread unparks it.

按我的理解，说的就是封装OS的线程控制API，完成阻塞和唤醒。如果写过C程序，一定对pthread很了解。pthread是一个C语言库，由操作系统开发者提供给上层使用者调用，完成线程控制。这个库在Unix-like操作系统非常有名。当然了，pthread也是一种协议，规定了函数签名和函数功能是什么，具体实现要看操作系统。虽然实现有差异，但是在API上是统一的。

##### 2.记录被阻塞的线程
因为要实现同步器，所以记录线程的FIFO队列不能使用锁保证线程安全，也就是说要用一种无锁技术实现该队列。Doug Lea并没有原创地设计出一款数据结构，而是基于当时的一款数据结构实现的。该数据结构就是**CLH锁变体版（variants of Craig, Landin, and Hagersten (CLH) locks）**。

Doug Lea在论文中也给出选择这种结构的原因：
> Historically, CLH locks have been used only in spinlocks. However, they appeared
> more amenable than MCS for use in the synchronizer framework because they are
> more easily adapted to handle cancellation and timeouts, so were chosen as a
> basis. The resulting design is far enough removed from the original CLH
> structure to require explanation.

这种CLH奇怪的地方是入队列操作就是上锁。

论文中给出了这样的解释：

![截屏1](/doglea-paper-capture-1.png)

每个节点都记录着被阻塞的线程的信息。

入队列时，只是用原子操作将 tail 设置为新入的节点 node，但是 node 和 pred之间的连接并没有建立，成功设置好tail后，就可以设置连接了，毕竟如果当前连接没有建立好的话，其余线程就会一直处于自旋中；还要检查pred是否为 RELEASED状态，如果是，那就意味着节点pred记录的线程释放了锁，当前线程不会陷入到自旋中，完成连接操作，否则就会陷入到自旋中，等时间片一到，就会调度到另一个线程。

就这一步，不仅仅将线程信息存储到node，进而存入到队列中，而且完成了线程阻塞。
> 严格地说，自旋不是阻塞，这里把自旋看作一种特别轻的类阻塞行为

如果你看到 `head == tail`, 你就知道没有任何一个线程被同步器阻塞。

出队列更是简单，直接把head设置为node即可。这里会有疑问，为什么不使用原子操作呢？因为执行出队列的线程一定是那个没有被阻塞的线程，那些被阻塞的线程，他们都排列在node节点后边。而新入队的节点，只会修改 tail， 不会影响到 head。所以根本不需要原子操作帮忙。

当然，这只是一个基础模型，Doug Lea也提到要基于此，做许多调整，不能直接用。所以在论文后边，Doug Lea给出了入队和出队的一般形式：

![截屏2](/doglea-paper-capture-2.png)

从代码里可以看到很多有趣的地方。

代表被阻塞线程的节点进入队列后，不会立即使用park阻塞该线程，而是检测排在它前边的节点，设置signal位的话，当前线程就会park阻塞，否则会设置signal，在下一次可能的循环中阻塞自己。

出队列的时候，head本就等于出队列的节点node，但还要将node的signal位清除，这是为什么呢？

首先，tryRelease并没有修改head（论文中没有说，我从ReentrantLock考证的,tryAcquire其实也没有改动队列的tail）。

假设node节点后续节点叫successor.

如果不去清除node的signal位，唤醒successor对应的线程时, 线程就会从 `park()`继续执行。

如果 `pred is not head node` 中的 `head node`使用的local变量，那么队列的head变成了node，此处的 `head node`就不会更新，那么 `pred is not head node`再次成立，而 successor 的 pred 就是node，signal位没有清除，就会再次引发 park !

所以这种结构就非常巧妙。具体化到jdk中，只是大体本着这种思路，还会有额外具体的调整。

#### 三. 不是一己之力
那到底是不是Doug Lea一人之力打造出的这个framework呢？

显然不是，在论文的最后，Doug Lea也说明了这一点。

整个框架开发有提供点子的大佬：
> Thanks to Dave Dice for countless ideas and advice during the development of
> this framework

给出 CLH queue 的大佬：
> to Mark Moir and Michael Scottfor urging consideration of CLH queues

帮忙设计的大佬（可能是架构，或者API？）：
> to the other members of the JSR166 Expert Group (Joe Bowbeer, Josh Bloch, Brian
> Goetz, DavidHolmes, and Tim Peierls) as well as Bill Pugh, for helping
> with design and specifications and commenting on drafts of this paper


## 总结篇
你可以就CLH不是Doug Lea的原创点子喷他，但是Doug Lea对框架的需求分解、最简模型设计、上下游库考虑、功能单一化、代码复用、核心功能和辅助功能区分，你不得不跪。即便论文中也给出了性能测试的统计数据，Doug Lea依旧轻描淡写的来一句，我写的框架性能可能还是不咋地，还没啥人用呢（就论文发布的时候而言），就交给别人的实践去验证吧。
> As of this writing, the java.util.concurrent synchronizer framework is too new
> to evaluate in practice. It is unlikely to see widespread usage until well after
> final release of J2SE1.5, and there will surely be unexpected consequences of
> its design, API, implementation, and performance

## 未解决篇
从Doug Lea给出的实验数据看，ReentrantLock要比sychronized性能更好。

![截屏3](/doglea-paper-capture-3.png)

4U的4代表4-core cpu， U代表cpu厂商（具体是谁不重要），2A 2P同理。

Builtin代表 synchronized;

Reentrant代表 ReentrantLock;

表格里的数据代表程序开支（纳秒），数字越大，性能越差。

Table2是无数据竞争下的结果，Table3是大量数据竞争下的结果。

好了，问题来了：**为什么Doug Lea在实现ConcurrentHashMap的时候，用的是synchronized而不是ReentrantLock呢？**

欢迎留言。

对了，据说Doug Lea在写jdk中的代码时，用了一些编码上的奇技淫巧，也欢迎留言聊聊。


## 彩蛋
下午，两个姑娘准备吃饭。

一个姑娘：除了我之外，你还和谁吃过饭？

另一个姑娘：前男友吧。

另一个姑娘：斯密马赛，寿喜烧，谢谢。

<Giscus />