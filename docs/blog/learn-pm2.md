---
title: "向pm2学习进程管理"
page: true
aside: true
---

# 向pm2学习进程管理
## 进程管理

`pm2`是一个进程管理工具，专门管理node进程（当然也可以管理非node进程）。

当你尝试用`nest.js`或者`express.js`编写后端服务之后，会使用工具（比如nest.js自带的build工具）将你的后端服务打成一个包，你只需要将这个包上传到服务器，在服务器中使用node运行它。通常，同一个包，你需要开启多个进程运行它，还要解决某个进程挂掉的问题。

这就是pm2大显身手的时候了。

pm2帮助你启动多个进程，并管理它们，还会汇总它们的信息，帮助你实时得知各个进程的健康状况。

在docker流行的时代，我们甚至在pm2的基础上，再加上一层docker。于是就出现了运行4个docker容器，每个docker容器中运行一个pm2进程，每个pm2进程管理多个服务进程的情况。

那么，pm2是如何管理进程的呢？

## 抛开pm2，你会怎么考虑去实现一个进程管理程序

这个环节不是什么面试题，我只从自己的角度去说一下，说的都是我个人的想法，可能对，也可能不对。我希望读者可以自行考虑一下，即便觉得自己想的不怎么对，也去尝试想一下，试着给个方案。*xjb想总比愣着好*。

首先，我阅读过 *《Unix环境高级编程》*，了解一些进程的概念和知识。

在我看来，管理进程大致应该包括**启动进程**、**停止进程**、**继续运行进程**、**重新启动进程**、**终止进程**、**进程信息查询**。要完成这些，我就必须知道每个进程的ID，并且还要存储这些ID。

启动进程，可以使用node自带的`child_process`模块完成，这一步我得到了进程ID，存储备用；

停止进程、继续运行进程、终止进程，可以向该进程发送控制信号完成，这一步我要知道进程ID；

进程信息的查询，我也必须要知道进程ID是多少，用这个ID配合系统调用查询进程信息，或者在启动进程那一步，将所需的进程信息与进程ID一并存储；

> 考虑到使用node来运行一个进程，进程ID可以是操作系统里的那个进程ID，在node中可以用
> subprocess.pid得到，也可以是我们自定义的一个随机数字，将这个数字和进程对象关联起来即可

作为一个进程控制程序，在关闭终端之后，由它控制的进程不能死掉，同时它自己也不能死掉。

所以，它所控制的进程的信息（包括进程ID），必须存储到磁盘上；

另一方面，它自己应该是一个`守护进程`，如果它是`前台进程`或者`后台进程`的话，终端关闭之后，它会被kill掉。

既然这个进程控制程序是守护进程，就必须要找个进程通讯方式，告诉这个程序去做什么，比如告诉它kill掉自己。

而在《Unix环境高级编程》第15章中，介绍了一些进程间通讯方式，比如：

*   无名管道
*   有名管道
*   ipc消息队列
*   共享内存
*   sock通讯

最合适、最灵活、最简单的方式就是使用sock通讯了。

可以仿照web请求，让这个进程控制程序作为一个http server运行，也可以作为一个rpc server运行，甚至可以不走网络，作为一个unix域sock server运行。

到此，整个思路就可以串起来了。

以守护进程的方式，启动一个unix域sock server，为这个server注册不同的功能点（启动进程、终止进程、停止进程等等），将必要的信息和日志写入到一个指定的文件中（比如叫my.txt）。在终端中，执行一个unix域sock client程序，向已经启动的sock server发送请求，完成指定的进程管理操作，比如重启某个进程。

接下来，我们先不去说pm2的实现，而是盘一下关于进程概念的事情。刚才在阐述我的方案时，我也用到了一些进程的术语，以防一些读者不太明白，我们集中突击一下子。

## 这些问题，你迷糊了吗

1.  什么是前台进程？
2.  什么是后台进程？
3.  什么是僵尸进程？
4.  什么是孤儿进程？
5.  什么是孤儿进程组？
6.  什么是守护进程？
7.  守护进程和后台进程有什么关系吗？
8.  什么是控制终端？
9.  什么是会话？
10. 什么是控制进程？
11. 什么是会话首进程？
12. 什么是作业控制？

### 前台进程、后台进程

前台进程和后台进程是shell作业控制的概念。在操作系统的角度看，操作系统最清楚的就是进程这个概念。但是为了支持shell作业控制，操作系统不得不开放一些API支持前台进程和后台进程，所以也可以认为操作系统是能够感知什么是前台进程和后台进程的。

作为一个开发者，我们怎么知道某个进程是前台进程还是后台进程呢？注意，这里不能使用`ps`哦，我们不要现成的答案，我们要的是获取答案的原始工具。答案就是两个API：`tcsetpgrp` 和 `tcgetpgrp`.

`int tcsetpgrp(int fildes, pid_t pgid_id)`

`pid_t tcgetpgrp(int fildes)`

`pid_t getpgid(pid_t pid)`

对于一个进程，我们使用 `getpgid`获取其进程组ID，然后使用`tcgetpgrp`获取前台进程组ID，如果二者相同，那么该进程就是`前台进程`，反之就是`后台进程`。

在实操角度看，打开一个terminal，启动一个前台进程，如果前台进程没有结束，那么终端界面就会停留在该进程，你无法继续输入新的shell指令，就好像这个进程将terminal阻塞住了一样，等该前台进程结束之后，你就可以继续输入新的shell指令了。而启动后台进程的时候，往往要在结尾加入`&`符号，进程跑起来后，你无需等待，可以继续输入下一条命令。

为什么前台进程会阻塞终端呢？

很简单，因为shell执行一个命令去启动前台进程时，shell进程会先fork一个进程，在新进程中执行这个命令，同时shell进程会调用`wait`命令，等待新进程结束，在此期间，不会处理新的命令，于是产生了等待现象。

### 会话、作业控制

多个进程，形成进程组这个概念。

多个进程组，形成会话这个概念。

为什么会有进程组这种概念呢？

因为在实际工作中，一个进程可能只完成一种功能点，而要完成一个事情需要多个功能点，于是完成一件事需要多个进程一起工作，比如你输入`ps -ef | grep "./main" | wc`。这便是进程组。有时候，也将一个进程组称之为一个作业。shell作业控制，说的就是这个作业。

想要理解为什么要有会话这个概念，就要从和shell交互说起。

当你打开一个terminal，terminal默认就会加载shell进程，之后，你就可以输入指令和shell交互，让shell做事情。从开始到结束，你都是在和同一个shell进行交互，你可以把shell想象成一个人，你一直在和他说话。直到你关闭terminal，你们之间的对话就结束了。看到了吧，会话就是这么个意思。

考虑一种情况，在你交互的时候，你可能输入了一些命令，产生了若干个进程组，而这些进程组都是后台进程组，并不会阻塞终端，前台进程组只有一个，你只需要等着它结束就行了，但是后台进程组很多，你怎么去管理呢？你就必须在进程组上面再创建一层概念，达成这个目的，这就是会话。

### 控制进程、会话首进程

进程组ID就是组内leader进程的进程ID。

类比进程组概念，会话也该有个会话ID的概念，它应该等于什么呢？

答案就是会话首进程。

**会话首进程是什么东东呢？它和控制进程有什么关系？控制进程又是什么鬼？控制进程中的“控制”指的是什么？**

别急，这就要从打开一个terminal讲起。

在macOS中，系统自带一个terminal App，当你打开它，会自动加载zsh程序，这一步看似平平无奇，但是里面发生了很多事情，我还没有精通zsh源码的地步，只是几次笼统地阅读过，只能大概说下发生了什么事情。

首先呢，会启动一个进程，执行zsh。

在zsh运行中，会调用`setsid`，创建一个会话。

zsh进程就是这个会话中的第一个进程，也就是会话首进程，而它的进程ID就会作为会话ID。

在这之后，zsh进程会打开一个终端文件，也就是`/dev/tty`，将该文件映射到文件描述符0\1\2中，也就是标准输入、标准输出、标准错误，并且使用`tcsetpgrp`将进程ID和终端文件绑定，这样zsh进程成为前台进程组leader进程。

因为zsh进程打开了终端文件，建立了和终端文件的联系，终端文件也就被该进程控制，而zsh进程就成为了控制进程，这个控制说的就是控制终端文件。

现在我们就只有一个进程组，而且是前台进程组，进程组的leader进程就是zsh。

接下来，如果你输入一个命令给zsh，让它执行一个前台进程，zsh就会fork一个进程，使用`setpgid`将该进程设置为一个新的进程组leader, 并且还会使用`tcsetpgrp`将新进程ID和终端文件绑定，其结果就是新进程变成前台进程，新进程所在的组变成前台进程组，zsh进程则成为了后台进程。

之后zsh进程等待新进程执行完毕，一旦执行完毕，zsh就会使用`tcgetpgrp`将zsh进程ID和终端文件绑定，恢复到之前的状态，zsh进程再次成为前台进程。

现在，你应该搞明白那个问题了吧。

### 守护进程，后台进程

上个问题，我们提到zsh进程执行`setsid`建立一个会话后，会打开一个终端文件。打开终端文件，不是必须的步骤。如果我们不打开终端文件，那么这个进程就变成了`守护进程`。

因为我们连终端文件都没有打开，更不会执行`tcsetpgrp`，于是守护进程既不能算作前台进程，也不能算作后台进程。

> 你可能会认为守护进程是后台进程，但前台进程和后台进程中必须要有终端文件的参与，终端文件存在，
> 并且能被它感知到的进程，就是前台进程，不能被它感知到的就是后台进程。它如何感知的呢？就是依靠
> `tcsetpgrp`做到的。可守护进程中，连终端文件都不存在，又怎么能谈到后台进程一说呢？

让我们来看看redis中如何创建守护进程的：

```c
static void daemonize(void) {
    int fd;
    FILE *fp;

    if (fork() != 0) exit(0); /* parent exits */
    setsid(); /* create a new session */
  
    /* Every output goes to /dev/null. If Redis is daemonized but
    * the 'logfile' is set to 'stdout' in the configuration file
    * it will not log at all. */

    if ((fd = open("/dev/null", O_RDWR, 0)) != -1) {
        dup2(fd, STDIN_FILENO);
        dup2(fd, STDOUT_FILENO);
        dup2(fd, STDERR_FILENO);

        if (fd > STDERR_FILENO) close(fd);
    }

    /* Try to write the pid file */
    fp = fopen(server.pidfile,"w");

    if (fp) {
        fprintf(fp,"%d\n",getpid());
        fclose(fp);
    }
}
```

> 出自redis1.3.6源码

执行`setsid`的进程，是fork之后的进程，其继承了父进程的文件描述符，守护进程不需要读取标准输入，也不需要写入标准输出，就会将这些文件描述符关闭，或者将这些描述符重新映射到`/dev/null`中，让终端中的信息不影响守护进程，也让守护进程的信息不泄漏到终端界面。

守护进程和后台进程还有一个明显的区别出现在关闭terminal的时候。

以macOS为例，打开terminal App, 我们启动一个长久工作的后台进程，当我们关闭terminal App的时候，会给出这样的提示：
![截屏2023-05-31 23.05.34.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/db9a06a49e474e9c9420bb3045e1a26f~tplv-k3u1fbpfcp-watermark.image?)

点击终止后，后台进程就会被关闭，terminal App也会退出；点击取消的话，后台进程继续运行，terminal App不会退出。

如果是守护进程的话，就不会出现这种提示。

在《Unix环境高级编程》中提到过，当调制解调器断开的时候（这里即关闭terminal App的时候），调制解调器会发送`SIGHUP信号`到控制进程（这里即zsh进程），之后发生了什么没说。此时zsh进程有事情的决定权，它可能发送信号到前台进程组，关闭所有前台进程，也可能发送信号的所有后台进程组，让所有后台进程结束。按照当前的例子来看，zsh进程会发送信号到会话中的所有进程，关闭它们。

### 僵尸进程，孤儿进程，孤儿进程组

父进程如果先于子进程结束，子进程就会变成`孤儿进程`，其父进程就会变更为进程ID为1的进程，可能是init进程，可能是launchd进程，总之是会有一个进程接管它。

子进程如果先于父进程结束，同时父进程并没有采用`wait`这类调用，捕获子进程的结束，子进程即便已经结束，仍然会占用相关的资源（比如已经打开的文件、进程空间占用的内存），造成系统资源泄漏（或者叫浪费），这种子进程就像僵尸一样没有死透，不断吮吸着系统的鲜血，`僵尸进程`的称号就由此产生了。毫无疑问，这种进程会给系统带来隐患，必须认真处理，在编码中尽量避免。

在作业控制中，进程除了终止状态，还会有停止状态，比如你启动了一个进程，然后按下`Ctrl+Z`, 就会发送`SIGTSTP信号`给这个进程，这个进程就会停止。问题来了，如果进程停止，但是其父进程终止了，这个进程将来怎么继续执行呢？这就是引入孤儿进程组概念要解决的事情。

一般来讲，父进程会作为一个进程组的leader进程，上述情况发生后，父进程终止，子进程成为孤儿，子进程所在的组就成为了`孤儿进程组`。

按照《Unix环境高级编程》的描述，孤儿进程组内的每一个进程，其父进程位于`另一个会话`中。

当父进程终止后，子进程的父进程将变更为进程ID为1的进程，同时，如果该子进程位于孤儿进程组，而且子进程处于停止状态，将会先后收到来自内核发送的`SIGHUP信号`和`SIGCONT信号`，`SIGHUP信号`默认处理方式是`终止进程`，这意味着如果在子进程中没有捕捉该信号，那么停止的子进程立即终止。如果加入了`SIGHUP信号`的处理，停止的子进程在收到之后到来的`SIGCONT信号`，会告别停止状态，`继续运行`下去。

### 暂告一段落

补充的信息到此为止，如果还不太明白，建议读者阅读相关系统编程的书籍或者资料，推荐的书籍有`Stephen A.Rago的《Unix环境高级编程》`、`Michael Kerrisk的《Linux/UNIX系统编程手册》`。

上述相关API都是c语言的API，可以使用man来查阅详情介绍，比如`man 3 tcgetpgrp`（数字3的含义请执行`man man`查看文档获悉）。

如果读者对这些偏系统的知识感兴趣，欢迎留言，未来可以考虑单独出一些专题文章。

如果推荐的书籍搞不到，欢迎留言，未来也可以考虑出一套原文带读系列的文章。

好了，接下来，进入pm2的世界吧。

## pm2 的实现

这里参考pm2 0.4.10版本源码。项目结构如下：

![截屏2023-06-01 23.26.18.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9e4dab324e64c0f984a199a18d436e3~tplv-k3u1fbpfcp-watermark.image?)

接下来，锁定pm2的入口文件，开始分析。

回忆一下，通常我们使用pm2都是直接以命令行的方式使用，查询package.json，就可以知道命令行的入口文件是`/bin/pm2.js`。

文件内容非常简单，就是使用`commander`库构建命令行App。

![截屏2023-06-01 23.29.29.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/23acba83482c4c2b8e8df59a8e300374~tplv-k3u1fbpfcp-watermark.image?)

看到`commander.command`的调用（图中只是冰山一角），不难得知pm2支持的子命令有：

*   start
*   stopAll
*   stop
*   dev
*   web
*   dump
*   resurrect
*   restart
*   restartAll
*   startup
*   generate
*   list
*   jlist
*   monit
*   update
*   flush
*   logs
*   kill

进一步观察每个command，发现背后都是调用`CLI`实现各个功能的，因此pm2的具体实现，落实在`CLI`的定义中。

截取了`CLI`几个方法的定义：

![截屏2023-06-01 23.35.25.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7442deeb1714469bab2f51d1bc2b4a11~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-06-01 23.35.55.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4a5e87d991a54e7da253ee18dd2fa525~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-06-01 23.36.18.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f8991ac9b2e1474abdb300b9246efab7~tplv-k3u1fbpfcp-watermark.image?)

发现`CLI`的实现中，底层还是依赖`Satan`，原来真谛在`Satan`。

了解上述信息，我们就有一条清楚的思路：当用户给出pm2的命令行指令（比如 `pm2 start`），会跳转到对应的command逻辑，在这个逻辑中调用CLI，跳入到CLI的具体方法里，在该方法中调用`Satan`定义的方法，给出最终一击。

接下来不用多说了，只要看看`Satan`里写了啥，就知道pm2究竟怎么实现的了。

但有一个地方值得留意：

![截屏2023-06-01 23.42.35.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a1b44fc7876940e587b22948d25b014e~tplv-k3u1fbpfcp-watermark.image?)

你输入pm2命令行后，`commander`不会立即解析命令行参数，而是等待事件`satan:client:ready`发生，才会触发解析，按照上边说的逻辑执行。

一看`satan`，我们就知道，里边肯定和`Satan`有关系了。可问题是，啥时候`satan:client:ready`事件会产生呢？

纵观这个文件，只有在开头中require Satan这一步，才能动手脚。

![截屏2023-06-01 23.47.03.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4c3e31a16df742b4b4ce67f3b2e9847f~tplv-k3u1fbpfcp-watermark.image?)

`require`指令不仅代表着加载一个模块对象，而且意味着在加载过程中，会运行一些代码。

> 在Go语言中，就会使用 import \_ \<package\_path>, 只去运行模块中的代码，但不使用模块中的方法
> 和 数据。

让我们看看Satan中发生了什么：

![截屏2023-06-03 17.06.10.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a2f3265e44044b3bb88cbae9d70d07f~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-06-03 17.06.32.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2bef40bb300c43ccae4422e399c48f1d~tplv-k3u1fbpfcp-watermark.image?)

全文除了定义Satan，还执行了`Satan.onReady`。结合前面说的，只要我们执行了pm2命令行，pm2就要等到`satan:client:ready`事件发生，才会解析命令行参数，执行特定的子命令。同时呢，pm2在一开始执行的时候，先require了Satan, 所以也会执行Satan中的代码，也就是`Satan.onReady`。

OK，事不宜迟，看看`Satan.onReady`发生了什么吧。

![截屏2023-06-03 17.12.13.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e10fb01f9f264880904c80623749e50d~tplv-k3u1fbpfcp-watermark.image?)

方法中定义了一个即时函数init，一旦onReady要执行，init函数就会立即执行。

根据环境变量是否定义了`DAEMON`，分为了两部分逻辑。

第一部分似乎看不出来干什么，但else部分出现了`Daemon`, 意味着这部分逻辑和守护进程有关系，似乎在进行ping通讯。在此处，不免要问一个问题，**守护进程在哪里启动的呢？**

继续看`pingDaemon`的回调函数，我们就知道了答案。回调函数表明，当没有守护进程正在运行（`ab == false` 的逻辑）,Satan会启动一个守护进程。如果守护进程存在了，Satan要触发RPC通讯。

接下来要做的，无外乎：

*   `Satan.pingDaemon`是根据什么完成ping通讯的；
*   `Satan.launchDaemon`是如何做到创建一个守护进程的；
*   `Satan.remoteWrapper`做了什么；
*   `Satan.launchRPC`的RPC逻辑到底是什么；

### Satan.pingDaemon

我们假设第一次执行pm2命令，在此之前，我们没有执行任何pm2指令，那么onReady方法也会是第一次执行。

此时环境变量中肯定没有DAEMON, 所以会跳入到 else 逻辑里执行 pingDaemon:

![截屏2023-06-03 17.51.11.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f04ce06b657d4c87bc12f53a24504363~tplv-k3u1fbpfcp-watermark.image?)

尽管我们不知道`axon`库是干什么的，但我们能大致猜出，使用的是sock通讯，而且还是Unix域的sock通讯，因为里面没有看到什么关乎网络IP的信息。

`req.connect`将触发sock连接行为，一旦连接成功，也就是ping成功了，就会执行`connect`事件回调，给pingDaemon的回调函数cb输入true，告诉上层逻辑，ping成功了。

逻辑就这么简单。

别忘了，我们ping的是什么呢？是Daemon，是守护进程！而代码里实际ping的行为是sock客户端向sock服务端的一次连接请求。这就可以推算出，守护进程运行的是sock服务程序。

### Satan.launchDaemon

经过上一节的分析，pingDaemon的cb参数要么是true，要么是false。

当参数是false的时候，就要开启一个守护进程。

前文我们也说了，我们假设是第一次执行pm2，因此肯定不会有守护进程，顺理成章地就要执行launchDaemon。

![截屏2023-06-03 17.21.24.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4666d6d06e2342bdb4baba38bdfe14a4~tplv-k3u1fbpfcp-watermark.image?)

启动一个守护进程和启动一个进程大致相同，使用了`child_process`库的`fork`方法，关键点在于`detached`, 根据[nodejs官网API文档介绍](https://nodejs.org/dist/latest-v18.x/docs/api/child_process.html#optionsdetached)，在非windows平台下，设置了该参数为true，会使得新进程成为新进程组的leader进程，同时开启一个新的会话。

![截屏2023-06-03 17.25.10.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8df8328f467b49f09af742a104514425~tplv-k3u1fbpfcp-watermark.image?)

这是经过nodejs封装之后启动守护进程的方式，原始的c语言启动一个守护进程要比这个复杂一点。

代码中还设置了`silent` `stdio` 参数。

`silent`为true，会将子进程的标准输入、标准输出、标准错误通过管道的方式和父进程连接；
`silent`为false，子进程直接继承父进程的标准输入、标准输出、标准错误。

`stdio`的设置，会覆盖掉`silent`的效果，这里设置为`ignore`，意味着将子进程的标准输入、标准输出、标准错误直接映射到`/dev/null`。

按照操作系统的角度看，有了上述的设置，开启一个守护进程没什么问题，但是在nodejs的运行时角度看，这还不够，所以代码中加入了`child.unref()`，根据官网的说法，该方法作用如下：

![截屏2023-06-03 17.35.09.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/204e50b90fd34428b8400943de6d3a5d~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-06-03 17.36.27.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a849f2cc8ddb4c39831628c4378e6c89~tplv-k3u1fbpfcp-watermark.image?)

也就是说，如果你没有使用这个方法，尽管设置detached为true，但实际上父进程依旧会等待子进程结束，守护进程是不能有这一步的。

之后，监听子进程的`message`事件，子进程一发送数据给当前进程，该事件就会发生，从而触发当前进程的`satan:daemon:ready`事件。

> 请注意哦，process指当前进程，child指的才是沦为守护进程的子进程。
> `satan:daemon:ready`事件不会使pm2解析命令行、开始执行子命令代码，
> 因为它等的是`satan:client:ready`事件。

还有一个信息点就是`env: { "DAEMON": true }`, 在上边提到`Satan.onReady`拆分逻辑的依据就是环境变量`DAEMON`。

这个环境变量只有在守护进程中才存在，当前进程是不存在的。而且守护进程使用fork方法启动，fork中明确给出了`Satan.js`，这意味着守护进程会再次执行一遍`Satan.js`, 于是`Satan.onReady`又一次执行，不过这一次会进入到if逻辑中，而不是else逻辑。

上一节我们推算过，守护进程必须要给出一个sock服务端程序，自launchDaemon执行以来，我们没有看到这一点，所以我们推测，在if逻辑中的`Satan.remoteWrapper`会完成这件事。

### Satan.remoteWrapper

![截屏2023-06-03 18.14.21.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/944f84c56ffb4860897aa235f5712eae~tplv-k3u1fbpfcp-watermark.image?)

第一点要明确，这个逻辑是在守护进程中完成的，当前进程在做的事情是等待守护进程发来数据，然后触发`satan:daemon:ready`事件。

一看到代码里有server，无疑印证了我们开始的想法，守护进程确实启动了sock服务端。而且我们看到守护进程也通过`process.send`发送数据给当前进程了，那么当前进程就会触发`satan:daemon:ready`事件，然后调用launchDaemon的回调函数Satan.launchRPC.

守护进程只需要监听请求，响应请求而已，这部分请求-响应逻辑就定义在`server.expose`中，后边会说到。

接下来的逻辑，就是当前进程执行launchRPC了。

### Satan.launchRPC

![截屏2023-06-03 18.26.02.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a6aba40af5c14e92873c793d77580b49~tplv-k3u1fbpfcp-watermark.image?)

逻辑出乎意料简单。

和上一节的server一样，`rpc`来自于`axon-rpc`库。在这里作为一个客户端，发送一个连接请求，一旦成功，当前进程就会触发`satan:client:ready`事件，也就是这个时候pm2的命令行才会被解析、执行，然后跳转到具体的pm2子命令里做事。

如果说守护进程已经存在，那么Satan.onReady的 else 逻辑中，会直接执行 Satan.launchRPC,建立rpc的连接。

### 监听`satan:client:ready`的时候会不会有些迟？

Satan.onReady是在Satan这个库被加载的时候实行的，而这个加载是在下图监听动作之前发生的：

![截屏2023-06-01 23.42.35.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a1b44fc7876940e587b22948d25b014e~tplv-k3u1fbpfcp-watermark.image?)

那么会不会出现一种状况：Satan已经发送了`satan:client:ready`事件，但是该事件监听动作还没来得及执行呢？

当然不会。可要解释清楚这个事情，就必须涉及到nodejs事件循环的内容。大致的理由是这样的：触发事件是在sock的事件回调函数中发生的（见**Satan.launchRPC**那节），这个事件回调可能是在微任务执行，也可能是在事件循环的`poll`阶段执行的（[nodejs事件循环官网介绍](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)），不论哪种执行方式，都必须等到当前宏任务执行完毕才可以，而事件监听这一步发生在当前宏任务中。

### 小结

现在，我们可以大致说出pm2的整体结构了。

采取request-response的结构，每一次pm2命令行都是在发送一次request请求，子命令的逻辑全部放在服务端实现，而这个服务端以守护进程的形式存在，即便终端被销毁，该进程依旧正常运行。

## pm2子命令的实现

![截屏2023-06-03 21.02.09.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64ab483a14bf49e7953c5e343094354e~tplv-k3u1fbpfcp-watermark.image?)

子命令的实现发生在Satan.remoteWrapper, 还记得这个方法是做什么的吗？

没错，就是启动一个sock服务端。

子命令暴露在`server.expose`方法中，感觉就像后端开发中的路由和controller的关系。

从这些子命令(`prepare` `list` `startId`等等)中，不难发现具体逻辑是在God中完成的。经过上文的描述，你应该可以感受到自上向下层层封装的结构，起初阅读代码可能会有些乱，不过在维护者的角度来看，层层封装、功能分明、模块化设计感很强，有利于代码维护。

OK，接下来就看一下God中发生了什么。

![截屏2023-06-03 21.29.14.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d1fdfce1c51442fb87ccdc4f0c6a9594~tplv-k3u1fbpfcp-watermark.image?)

* 定义了God的很多方法
* 执行了即时函数 `initEngine`
* 执行了`cluster.setupMaster`(最近版本的node已经将API改为`setupPrimary`)

在Satan.remoteWrapper中， God只被require一次，因此`initEngine`和`setupMaster`只会被执行一次。

使用`cluster`库的目的就是管理多进程，多个进程组成一个集群（cluster）。

`initEngine`就是定义监听了两个事件，目的就是更新集群内进程的信息；

`setupMaster`的目的就是让后边`cluster.fork`生成的进程去执行`ProcessContainer.js`，该文件相当于一个模板或者容器或者运行时，反正都是一个意思，进程会引导真正要运行的脚本，这个稍后会说。

接下来我们以创建一个进程为例，看看都要经过什么。


![截屏2023-06-03 21.38.25.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7d5264b24464a9bb8bc388d818297b5~tplv-k3u1fbpfcp-watermark.image?)

可以看到，创建一个进程的工作是`execute`完成的。

![截屏2023-06-03 21.39.19.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7abb98041375483983a4bd05b25f6cc7~tplv-k3u1fbpfcp-watermark.image?)

逻辑简要概括无非几步：
* 准备好要传给子进程的环境变量`env`
* 调用`cluster.fork`创建新进程
* 将nodejs提供的进程对象存入`God.clusters_db`；
* 监听新进程的状态，并在`God.clusters_db`更新；

剩下的，就是搞清楚`ProcessContainer.js`都搞了啥。

![截屏2023-06-03 21.44.31.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c4a47fc821cc4badb417a3b7fe7b863c~tplv-k3u1fbpfcp-watermark.image?)

做的事也很直白：
* 创建进程日志相关的`.pid文件`
* 执行脚本`script`（注意这个变量是从环境变量里传入的）

瞧瞧最终的核心`exec`。

![截屏2023-06-03 21.48.05.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/17bce84df43a4927aee506c1d514c0fa~tplv-k3u1fbpfcp-watermark.image?)

* 重定向标准输出和标准错误
* `require`加载真正要执行的脚本（这里就是上文说的进程引导）

到现在你就明白了，要执行的就是`exec`中的`require`这一步，其余部分都是做的铺垫，就像c语言中，你只需要把代码写入到`main`函数，至于寄存器、堆栈的初始化分配，都由编译器生成的代码搞定，而这些代码就是铺垫，就是运行时，就是模板，就是容器。

其余功能点，比如暂停进程、继续进程、重启进程等，并不是本文的重点，就不一一说明了，未来可考虑再出一篇文章作为补充。

## 知识点总结
* 守护进程的创建
* `cluster`多进程管理
* 基于Unix域的sock客户端、服务端程序的创建
* `require`模块加载时代码的顺道执行
* 基于事件的异步编程
* 分层封装和模块化管理

## 感悟
pm2是采用`nodejs`编写的，nodejs是前端开发的主要工具，但写出来的程序却是后端方向。作为程序开发者，在岗位上有前后端划分，但就知识而言，它们都属于计算机和程序设计的范畴，是统一的。把视野打开吧，前端人员多了解系统编程的东西也未尝不是一种有趣的事情呢。

pm2我感觉很神奇的事情是，pm2命令行既是一个rpc的请求方，也是rpc服务端守护进程启动的驱动器。

<Giscus />