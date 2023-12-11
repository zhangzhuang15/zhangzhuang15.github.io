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

## 终端的控制进程是什么，如何创建它

满足一下两点的进程，就是终端的控制进程：

- 是会话首进程
- 建立和终端的联系

创建方法：

- 创建一个会话
- 打开一个终端文件
- 调用`tcsetpgrp`，建立和终端的联系
- 将 0、1、2 文件描述符映射到终端文件

## 一个会话中，有几个前台进程组，几个后台进程组

只有一个前台进程组，若干个后台进程组

## 什么是僵尸进程

子进程终止后，父进程没有使用`wait`等 API 处理子进程，子进程就会成为僵尸进程。

尽管子进程终止，但它依旧占用系统资源（文件，进程空间等等）。

## 什么是孤儿进程

子进程没有终止，但是父进程终止了，子进程就成为孤儿进程。

孤儿进程会由进程 ID 为 1 的进程（init 进程 or launchd 进程）接管，不会造成资源占用。

## 常见进程控制信号有哪些，谁来负责处理这些信号

`Ctrl + C`, `SIGINT`信号会发送给前台进程组的所有进程；

`Ctrl + /`, `SIGQUIT`信号会发送给前台进程组的所有进程；

`Ctrl + Z`, `SIGTSTP`信号会发送给前台进程组的所有进程；

> SIGTSTP: signal to stop

终端断开时(关闭 Terminal App)，`SIGHUP`信号会发送给终端控制进程（控制进程默认会终止会话内的所有进程）；

> SIGHUP: signal hung up

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
