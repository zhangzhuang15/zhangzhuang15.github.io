---
title: "进程——问题清单"
page: true
aside: true
---

# 进程——问题清单

## 进程的内存分布结构

<img src="/memory_structure.png" alt="进程内存结构图" />

## 如何判断一个进程是前台进程，还是后台进程

- 调用 `getpgid`，得到当前进程的进程组 ID, 记作 `currentPGID`
- 调用 `tcgetpgrp`, 得到终端文件关联的进程组 ID, 记作 `PGID`
- 如果 `currentPGID == PGID`, 则当前进程是前台进程，否则是后台进程

> getpgid tcgetpgrp 都是系统调用；
> tcgetpgrp 是 `terminal control get process group` 的缩写

一个终端同一个时刻，只能有一个前端进程组，只有前台进程才被允许读取终端（你输入的字符）。shell 在执行一个命令，开启一个前台进程的时候，会 fork 一个子进程，使用`tcsetpgrp`将终端的读取权交给这个子进程，而它自己调用`wait`，等待前台进程执行结束。这个时候，不论你输入什么字符，shell 都接收不到，只有那个子进程可以接收。

后台进程不能读取终端，但是它可以向终端写入内容，如果后台进程读取终端，就会收到`SIGTTIN`信号被挂起。但是，这不意味着后台进程脱离了终端，如果你关闭了终端，内核会发送`SIGHUP`信号给 shell 进程（shell 进程是终端控制进程）以及前台进程组的所有进程，于是前台进程组的所有进程收到这个信号之后，就会退出（默认行为）。接下来，取决于 shell 的实现，shell 进程会将这个信号广播给所有后台进程，这些后台进程就会退出。只有守护进程这种特殊的后台进程（脱离了当前终端）才不会被 kill 掉。

创建一个终端文件（/dev/tty），内核会构造一个结构体去表示它。这个结构体会记录终端控制进程的 PID，以及前台进程组 ID。

```c
struct tty_struct {
  struct pid *pgrp;       // 当前前台进程组 ← tcsetpgrp 修改这个
  struct pid *session;    // 会话（Shell）
}
```

## 什么是进程组， 什么是作业

进程组是进程的集合。

如果执行：

```shell
$ ps -ef | grep "./main" | wc
```

就会产生一个进程组，进程组内包含 `ps` `grep` `wc` 三个进程。

一个进程完成一件事，多个进程配合起来，完成一个任务。

换句话说，一个进程组要去解决一个任务，因此也会将进程组称为**作业**。

进程组中，作为组长的进程，其进程 ID 就是进程组 ID。

## 如何创建进程组

方法一：利用 shell 的管道运算符，创建一个进程组

方法二： 使用系统编程，自己实现
`fork` 一个子进程 A，A 默认继承父进程的进程组 ID，A 自己不会是进程组组长，使用`setpgid`将 A 设置为进程组组长，在 A 里面继续使用 `fork` 创建一个子进程 B，B 默认继承 A 的进程组 ID，这样就创建了一个进程组，组内包含 A 和 B 两个进程，A 是组长。

> 进程只能为它自己，或者它的子进程设置进程组 ID

## 什么是会话

会话是进程组的集合，由会话 ID 作为会话的标识。

> 就像进程 ID 是进程的标识一样

## 如何创建会话

- `fork` 创建子进程
- 父进程 `exit`
- 子进程调用 `setsid`

调用`setsid`的先决条件：调用该 API 的进程不能是进程组组长，否则调用会失败

在成功调用后，调用该 API 的进程会：

- 成为新进程组组长
- 成为会话首进程
- 切断和终端的联系

```c
// linux/kernel/sys.c
SYSCALL_DEFINE0(setsid)
{
    struct task_struct *group_leader = current->group_leader;
    struct pid *sid = task_pid(group_leader);

    // 1. 创建新会话：进程成为会话领导者
    // 2. 同时创建新进程组：进程成为进程组长
    // 3. 关键：清除控制终端！

    group_leader->signal->tty = NULL;  // ← 清空控制终端

    // 设置会话 ID
    set_sid_and_pgrp(group_leader, sid, sid);

    return pid_vnr(sid);
}
```

setsid() 之后：

- ✅ 进程成为新会话的领导者
- ❌ 没有控制终端（tty = NULL）
- ❌ tty->session 没有被设置（此时还没有 tty）

## 如何创建守护进程

- 先创建一个会话
- 会话首进程不去连接终端
- 关闭会话首进程的 0、1、2 文件描述符

```c
// for example, redis1.3.6
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

按照创建的方式看，守护进程也是孤儿进程，父进程是 init 进程。

## 终端的控制进程是什么，如何创建它

满足以下两点的进程，就是终端的控制进程：

- 是会话首进程
- 建立和终端的联系

创建方法：

- 创建一个会话
- 打开一个终端文件
- 调用`tcsetpgrp`，建立和终端的联系
- 将 0、1、2 文件描述符映射到终端文件

上面介绍`如何创建会话`讲过，调用`setsid`创建一个会话后，会话的控制终端 tty 没有设置，在打开终端文件的时候，它就会被设置。

```c
// linux/drivers/tty/tty_io.c

static int tty_open(struct inode *inode, struct file *filp)
{
    // ...

    // 如果满足条件，open 时自动设置控制终端
    if (!(filp->f_flags & O_NOCTTY)  // 没有设置 O_NOCTTY 标志
        && !tty->session              // TTY 还没有被会话使用
        && task_session(current) == task_pid(current)  // 调用者是会话领导者
        && !current->signal->tty)    // 调用者没有控制终端
    {
        tiocsctty(tty, filp, 0);  // ← 自动调用！
    }
}
```

```c
// 进程主动请求设置控制终端
ioctl(tty_fd, TIOCSCTTY, 0);

// linux/drivers/tty/tty_io.c
long tty_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    switch (cmd) {
    // ...
    case TIOCSCTTY:
        return tiocsctty(real_tty, file, (int)arg);  // ← 直接调用
    // ...
    }
}
```

```c
// linux/drivers/tty/tty_jobctrl.c

/**
 * 将 TTY 设置为调用进程的控制终端
 */
static int tiocsctty(struct tty_struct *tty, struct file *file, int arg)
{
    struct task_struct *task = current;
    struct signal_struct *sig = task->signal;
    int ret = 0;

    // 条件1：调用者必须是会话领导者
    if (task_session(task) != task_pid(task))
        return -EPERM;

    // 条件2：调用者不能已经有控制终端
    if (sig->tty) {
        // 已经有控制终端了
        if (sig->tty == tty)
            return 0;  // 就是这个 tty，没问题

        if (!arg)
            return -EPERM;  // 不强制，拒绝

        // arg != 0 强制抢占（需要 CAP_SYS_ADMIN）
        if (!capable(CAP_SYS_ADMIN))
            return -EPERM;
    }

    // 条件3：TTY 不能已经被其他会话使用
    if (tty->session) {
        if (tty->session == task_session(task))
            return 0;  // 已经是这个会话的，没问题

        if (!arg || !capable(CAP_SYS_ADMIN))
            return -EPERM;  // 被其他会话占用

        // 强制解除其他会话的绑定（发 SIGHUP）
        session_clear_tty(tty->session);
    }

    // ── 核心：设置双向绑定 ──

    // 1. TTY → 会话
    tty->session = get_pid(task_session(task));  // ← tty->session 在这里设置！

    // 2. TTY → 前台进程组
    tty->pgrp = get_pid(task_pgrp(task));

    // 3. 进程 → TTY
    tty_get_ref(tty);
    if (sig->tty) {
        tty_kref_put(sig->tty);
    }
    sig->tty = tty;  // ← 进程的控制终端指向这个 tty

    return ret;
}
```

`open`和`ioctl`最终触发`tiocsctty`，给会话首进程设置 tty，并在 tty 上注册会话首进程的 PID 和前台进程组 ID。

```txt
sshd（父进程）
    ↓
fork() 创建子进程
    ↓
子进程调用 setsid()
    ─ 成为新会话领导者（SID = PID）
    ─ 脱离原有控制终端（signal->tty = NULL）
    ─ tty->session 此时还未指向此进程
    ↓
子进程调用 open("/dev/pts/N")   ← 打开伪终端
    ↓
内核 tty_open() 执行
    ─ 检查：是会话领导者？✅
    ─ 检查：没有控制终端？✅
    ─ 检查：TTY 未被占用？✅
    ─ 检查：没有 O_NOCTTY？✅
    ↓
自动调用 tiocsctty()
    ─ tty->session = current_session   ← 设置！
    ─ tty->pgrp = current_pgrp         ← 设置！
    ─ signal->tty = tty                ← 设置！
    ↓
子进程 execvp("bash")
    ↓
bash 运行，拥有控制终端 /dev/pts/N
```

## 终端控制进程和守护进程的区别

双方在创建的时候，都会执行`setsid`，让自身从当前会话脱离出来，即便当前终端关闭，它们也不会被 kill 掉。

守护进程意图是和终端不发生任何关联，所有信息都发送到指定文件，而不是终端中，所以，它要关闭标准输入、标准输出、标准错误，只保留日志文件。

终端控制进程意图是控制一个新的终端文件，接下来它当然要带开一个新的终端文件，建立联系。

## 一个会话中，有几个前台进程组，几个后台进程组

只有一个前台进程组，若干个后台进程组

## 什么是僵尸进程

子进程终止后，父进程没有使用`wait`等 API 处理子进程，子进程就会成为僵尸进程。

尽管子进程终止，但它依旧占用系统资源（文件，进程空间等等）。

## 什么是孤儿进程

子进程没有终止，但是父进程终止了，子进程就成为孤儿进程。

孤儿进程会由进程 ID 为 1 的进程（init 进程 or launchd 进程）接管，不会造成资源占用。

## 终端关闭，孤儿进程为什么还会被 kill

孤儿进程的父进程变成了 init 进程，但是它并没有脱离当前会话，当终端关闭后，会话就关闭了，导致会话内的所有进程被 kill，孤儿进程当然难逃此劫。

## 一般后台进程与守护进程最大的区别

守护进程是特殊的后台进程。一般后台进程保持与终端的联系，但是守护进程断开了这种联系。当终端关闭的时候，终端会发送信号到终端控制进程，终端控制进程会把信号发送到会话的所有进程，导致这些进程被 kill 掉。一般后台进程就是这样的进程，会被 kill 掉，守护进程不会。

## 常见进程控制信号有哪些，谁来负责处理这些信号

`Ctrl + C`, `SIGINT`信号会发送给前台进程组的所有进程；

`Ctrl + /`, `SIGQUIT`信号会发送给前台进程组的所有进程；

`Ctrl + Z`, `SIGTSTP`信号会发送给前台进程组的所有进程；

> SIGTSTP: signal to stop

终端断开时(关闭 Terminal App)，`SIGHUP`信号会发送给终端控制进程（控制进程默认会终止会话内的所有进程）；

> SIGHUP: signal hung up

## kill 掉前台进程组组长就能 kill 掉整个前台进程组？

在终端输入 ctrl+C 后，进程组被 kill 掉了，这是因为 ctrl+C 产生的信号发送到前台进程组的每一个进程，每个进程的默认响应方式就是终止进程。但是，如果你只发送 SIGINT 信号给前台进程组组长，那只有这个进程会被 kill。

## shell 执行一个命令，就创建进程组

当你在 shell 执行一个命令时，shell 会创建一个子进程执行这个命令，而这个子进程就是新的进程组组长，它的父进程是 shell 进程，但是 shell 进程是另外一个进程组的组长。由该子进程 fork 出来的进程，如果它的代码里没有做进程组的调整，默认以子进程作为自己的进程组组长。

## 进程已经停止，在它成为孤儿进程后，它如何恢复执行

内核会先后向孤儿进程发送`SIGHUP` `SIGCONT`信号。

如果孤儿进程没有处理`SIGHUP`信号的代码，孤儿进程就会终止；否则，在后边的`SIGCONT`信号抵达之时，孤儿进程恢复执行。

## 终端文件怎么理解

在 macOS 系统中，打开 Terminal App, 会看到页面开头显示：

```sh
Last login: Mon Sep 25 17:31:40 on ttys010
```

这表示，上一次你打开的终端文件是 /dev/ttys010.

如果想知道当前你打开的终端文件是什么，可以再打开一个标签页，此时新标签页开头显示：

```sh
Last login: Mon Sep 25 19:21:28 on ttys007
```

然后你就知道了，刚才打开的终端文件是 /dev/ttys007.

在新标签页执行：

```sh
$ echo hello > /dev/ttys007
```

你就会发现，刚才的标签页中，打印了 `hello`.

事实上，我们会将数据写入到文件描述符 1，本质上是写入到 /dev/ttys007 中。文件描述符 1 是一个指针，指向了 /dev/ttys007，所以你直接写入 /dev/ttys007，还是写入 1，结果都是一样的。

/dev/ttys007 这种，就是终端文件。

终端文件本质上仍旧是文件，区别在于，写入到该文件的内容，会展示在 Terminal App 的一个页面里。

<Giscus />
