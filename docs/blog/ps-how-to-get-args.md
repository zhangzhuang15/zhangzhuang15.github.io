---
title: " `ps`咋获取进程命令行参数的？"
page: true
aside: true
---

#  `ps`咋获取进程命令行参数的？
## 小故事篇
沙发上的小豹两眼迷离，逊询问情况。

逊：
> 咋了小豹，中午肉没吃饱？

小豹摇头：
> 没有，遇到了一个`ps`问题，正懵着呢


逊：
> 这有啥好懵的，说说看

小豹：
> 在你的macBook上，打开一个终端

逊：
> 嗯嗯，已经打开了，然后呢

小豹： 
> 运行`ps -a`

逊：
> 运行好了，你看看结果对不？
>
>![截屏2023-05-11 20.56.02.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/77a1ad544b81449f98319b5d452137f7~tplv-k3u1fbpfcp-watermark.image?)

小豹：嗯嗯，问题来了，CMD是什么意思？

逊：
> 就这？CMD就是command缩写，说的是一个进程是怎么启动的。比如说我这里有个c代码
> ```c
> // main.c
>
> #include <stdio.h>
>
>int main(int argc, char* argv[]) {
>    printf("hello world\n");
>    return 0;
>}
>```
> 编译:`gcc main.c -o main`; 
> 
> 终端输入:`./main --help --count baby`; 
> 
> 然后，你就启动了一个进程，这个进程的CMD就是`./main --help --count baby`。明白了不，小豹？

小豹：
> 这我懂，当我没学过C？咱也是C豹啊。那我问你，你有什么方法获取到CMD吗？

逊：
> 以刚才的代码为例，main函数的argv参数就能获取到！如果我执行了`./main --help --count baby`, argv就是 {"./main", "--help", "--count", "baby"}.


小豹：
> ./main是你自己写的，如果我也写一个./main，然后用 `./main --help --count baby`运行一个进程，你怎么获取该进程CMD？

逊：
> 这。。。有点难度。

小豹：
> 你再看看刚才ps的输出，ps就能获取到进程的CMD。

逊：
> 是哦，它是怎么实现的呢？

逊也迷离了。


## 解决篇
> 没有人天生知道答案，
> 
> 人天生就要找寻答案。
> 
> 可能一辈子，
> 
> 可能半辈子，
> 
> 可能一个夏天，
> 
> 可能一个夜晚。
> 
> 在没吃饭的时候，
> 
> 在没地方去的时候，
> 
> 在口袋里缺斤少两的时候，
> 
> 就更够劲了。

小豹的问题本质：如何通过进程ID得到CMD。

之前，我翻阅过`zsh`源码，了解到在终端输入的命令中，有一部分是zsh内部实现的指令(**builtin command**)，有一部分是确切存在的**executable文件**。

前者的代表是`fg` `bg`；后者的代表是`ps` `top`。

zsh本身就负责进程管理。

当我们在终端输入一个command，启动一个进程的时候，zsh是可以感知的，它可以记录下command和进程ID，如果`ps`是zsh的builtin command，那么由进程ID得到command就不难了。

于是，我就调查了下`ps`到底是不是zsh的builtin command。

执行`man ps`，找不到builtin这个词；

执行`whereis ps`，可以找到一个文件路径；

可以肯定了，`ps`不是builtin command。

作为对比，看看`man fg`的结果：

![截屏2023-05-11 21.25.44.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49cc177e8e5142df99885d972c0d402d~tplv-k3u1fbpfcp-watermark.image?)

没办法了，只好看看`ps`的源代码了。

我在一个网站下载了GNU coreutils，里面是一系列非常有用的工具的源码, 比如：
- `nice`
- `pwd`
- `rm`
- `readlink`
- `touch`
- `who`
- `ls`
- ..................

我搜了一圈，没有找到 `ps`。

一步一个坑，一坑卡一阵。线索难道就断了么？

不会的，因为我们还有福尔摩斯——GitHub。

GitHub上边总会有一些好兄弟，把一些源码镜像分享到上边，没准儿就能看到`ps`的影子。

嘻嘻嘿。

一个仓库在我的一顿狂撸搜索下脱颖而出，[mmalecki/procps](https://github.com/mmalecki/procps)。

它通过读取`/proc`目录下的文件获取进程的信息，包括进程的CMD。

比如有一个进程ID为12889，那么读取`/proc/12889/cmdline`就能知道进程的CMD。

嗯？就这？

> 如果一个人认为事情非常难，
> 
> 某一天却发现答案如此简单，
>
> 他要么怀疑自己的智商，
>
> 要么就卧槽起来。
>
>            ----- 杰克逊的黑豹

如果你以为这就结束了，那兄弟你一定草率了。

这个解决方案是针对linux而言的，

小故事里边说的是macOS,

在macOS上要怎么实现呢？

用同一个方法？

这可不行，macOS可没有`/proc`这种目录。

在Github继续跟进，没直接找到什么线索。

想必chat-gpt-like tool是该出手的时候了。

我用的是`cursor`这个App, [下载地址](https://www.cursor.so)。

然后我就问chat机器人，它说要用`proc_pidinfo`函数。

用法demo：

```c
// main.c

#include <libproc.h>
#include <unistd.h>

int main() {
  // 获取进程ID，不是一般性，获取当前进程ID
  pid_t currentPID = getpid();
  
  // 进程信息，我们想要的信息都在 info 中
  struct proc_bsdinfo info;
  
  // 使用 proc_pidinfo查询进程信息，
  // 这个API非常难用，函数签名注释中没有给出各个入参解释，该函数也没有
  // man手册，apple开发者工具官网也没资料，简直离谱
  int success = proc_pidinfo(currentPID, PROC_PIDTBSDINFO, 0, &info, sizeof(info));
  
  // proc_pidinfo 出错了
  if (success <= 0) {
      return -1;
  }
  
  // 从info中可以获取到一些常见信息：
  //
  // info.pbi_name   进程名
  // info.pbi_comm   进程名
  // info.pbi_pid    进程ID
  // info.pbi_ppid   父进程ID
  // info.pbi_pgid   进程组ID
  // info.pbi_uid    进程的user ID
  // info.pbi_ruid   进程的real user ID
  
  // 本以为从 info.pbi_name 中获取到进程的CMD，实际上
  // 只能获取启动进程的可执行文件名；
  //
  // 比如编译本文件为 ./main,
  // 然后运行 ./main help,
  // 预期的CMD是 "./main help",
  // 但 info.pbi_name 只能给出 "./main", 参数部分丢掉了。
  //
  // info.pbi_comm 也是如此。
  
  return 0;
}

```
我就告诉chat机器人，嘿哥们儿，你这招不行啊，小老弟你能不能换个方法啊。

然后就有了另一个方法——`sysctl`函数。

如果你在终端输入`sysctl`，你会发现这家伙是一个现成的可执行程序，难道为了调用它要单独fork一个子进程？

Absolutely Not!

它有库函数的版本哦。
> 如果你想查看sysctl用法，不要使用 `man sysctl`, 要使用 `man 3 sysctl`

look:
```c
// main.c

#include <sys/sysctl.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

int main() {
   pid_t currentPID = getpid();
   
   int mib[3], argmax, success = 0;
   size_t size = sizeof(argmax);
   
   // 查询系统所支持的CMD最大长度，结果存入 argmax 中
   mib[0] = CTL_KERN;
   mib[1] = KERN_ARGMAX;
   success = sysctl(mib, 2, &argmax, NULL, 0);
   if (success < 0) {
       // 查询失败
       return -1;
   }
   
   // 查询currentPID表示的进程信息，其CMD信息最终存入 procArgs 中
   mib[1] = KERN_PROCARGS2;
   mib[2] = currentPID;
   char* procArgs = (char*)malloc(argmax * sizeof(char));
   size = argmax * sizeof(char);
   success = sysctl(mib, 3, procArgs, &size, NULL, 0);
   if (success < 0) {
      // 查询失败了 
      free(procArgs);
      return -1;
   }
   
   // 解释下 procArgs 的存储结构，
   // 我们以执行 `./main help 48`这个CMD 为例，
   // 首先我们从这个 CMD 知道可执行文件名是 `./main`.
   //
   // procArgs 前4个字节存储数值 3， 表示CMD参数个数为3（{"./main", "help", "48"}），
   // 我们用变量 args 存储这个数值；
   //
   // 在4个字节之后，紧跟一个字符串，表示的是可执行文件名，也就是“./main”, 我们并不需要它，
   // 所以在定义 arg后，做了一个运算，跳过了这个字符串。
   //
   // arg现在指向的字符串就是CMD的第一个参数，也就是 "./main";
   // 通过 for循环依次打印出各个参数，依次是"./main"  "help"  "48";
   
   int args = *(*int)procArgs;
   char* arg = procArgs + sizeof(int);
   arg += strlen(arg) + 1;
   
   for (int count = 0; count < args; ) {
      if (*arg == '\0') arg += 1;
      else {
          count++;
          // arg 记录的字符串，就是其中一个CMD参数，
          // 可以用 arg 做一些事情，这里就简单将它
          // 打印出来
          printf("%s\n", arg);
          arg += strlen(arg) + 1;
      }
   }
   
   free(procArgs);
   return 0;
}
```
这段代码来的一点儿都不顺，因为chat机器人给出的代码不是这样。

这货给出的：

![截屏2023-05-11 22.58.13.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/10c0ffd28e54497cbabb0ee81d896457~tplv-k3u1fbpfcp-watermark.image?)
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/sysctl.h>

int main(int argc, char *argv[]) {
    pid_t pid = atoi(argv[1]);
    int mib[3] = { CTL_KERN, KERN_PROCARGS2, pid };
    size_t argmax = 0;
    if (sysctl(mib, 3, NULL, &argmax, NULL, 0) < 0) {
        fprintf(stderr, "Error: Could not retrieve argument size\n");
        return 1;
    }
    char *args = malloc(argmax);
    if (args == NULL) {
        fprintf(stderr, "Error: Could not allocate memory for arguments\n");
        return 1;
    }
    if (sysctl(mib, 3, args, &argmax, NULL, 0) < 0) {
        fprintf(stderr, "Error: Could not retrieve arguments\n");
        free(args);
        return 1;
    }
    printf("Command line arguments:\n");
    
    // 这里它就直接打印了，对于args的结构我们一无所知！
    for (char *arg = args; *arg != '\0'; arg += strlen(arg) + 1) {
        printf("%s\n", arg);
    }
    free(args);
    return 0;
}
```
它代码里的args和我们代码里的procArgs是一样的，而procArgs的结构，我特意到stackoverflow和github上考察了一番才明白的，两个重点的信息源：
- [Get Other Process' argv in OS X using C](https://stackoverflow.com/questions/210397/get-other-process-argv-in-os-x-using-c/4633191#)
- [getargv source code](https://gist.github.com/nonowarn/770696)

到此为止，一切真相大白了。


## 吐槽篇

平台没有提供一个友善的文档入口，帮助使用者了解到API、库的信息。如果要是有这么一个入口，还需要在stackoverflow github chat-gpt等工具中来回折腾？

明白原理固然是看C代码透彻些，真要是使用起来，还是需要用binding的手段，将C代码封装成其他可读性较高的语言使用，比如 Rust, javascript, C# 等等。

从给出的demo来看，编写c代码的时候太容易忘了free内存，所以说还是用一些可以保证内存安全的语言更符合现代编程的需求。


## 未解决篇
上边给出的代码可以在vscode上正常运行，但是vscode却给出宏找不到的提示，可这些宏确实定义了，不知道是怎么回事儿。

![截屏2023-05-12 00.21.08.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a67c1262f264ea48a6bca07949c65c2~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-05-12 00.22.02.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/135172a639074977be094b0806abf776~tplv-k3u1fbpfcp-watermark.image?)

![截屏2023-05-12 00.22.41.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/14849f72258640288c5655e65b737680~tplv-k3u1fbpfcp-watermark.image?)


<Giscus />