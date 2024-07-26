---
title: "Terminal的魔法"
page: true
aside: true
---

## Description
使用过 Vim 的你，有没有对这些现象感到惊讶：
1. vim启动前和vim退出后，terminal的样子没有变化，仿佛 vim 是启动了一个新的窗口完成一切的操作；
2. 在vim里，你可以通过按钮控制光标；
3. 在vim里，你点击enter键竟然会换行；
4. 按下ESC按键后，再次输入冒号，竟然没有往文本中插入一个冒号，光标反而来到底部；

如果你没有感到惊讶，可以想想你平时如何使用 terminal 的，你输入一些内容，只要按下enter键，这些内容就会
被当作一条指令被执行，那么vim是怎么阻止这种行为的呢？如果是你，你怎么去阻止这个行为呢？

是不是感觉到有些惊讶，更感觉有些好奇了呢？

## Terminal
平时，我们的关注点放在 stdio。当你使用 
- `console.log`，
- `printf`, 
- `std::cout`, 
- `fmt.Println`,
- `println!`
时，背后的逻辑就是将内容写进 stdio，然后你就可以在 terminal 中看到输出结果了。于是，你就会觉得，
stdio 就是 terminal 。

但这种想法被Terminal的魔法欺骗了。

我们所谈到的 Terminal 是电脑上运行的 App，确切说，它叫做终端模拟器。你之所以往 stdio 写入内容，
可以在 Terminal 上展示出来，都是终端模拟器偷偷地做了很多工作。

简单来讲，可以这样理解终端模拟器的行为。它会打开一个特殊的文件 `/dev/tty`，将stdio stdin 映射到
这个文件，之后监听这个文件。当我们按下键盘时，os的驱动程序就会把这些内容写入到这个特殊文件，终端模拟
器接着检测出变化，从这个文件中读出内容，然后用os提供的图形接口，将内容绘制到UI上，于是我们就看到了自
己输入的内容。

这也就解释了，如果你写的程序，将stdio重新定向到一个文件，比如"main.txt"，你所写入的内容不会展示在
Terminal 界面上，因为它并没有监听"main.txt"文件的变动。

既然时终端模拟器，它要起到模拟的作用，就必须遵循一套模版，毕竟没有模仿对象的话，何来模拟之言？这种
模版就是一种协定。我们按下Enter键，就会执行一条指令的行为，也是这种协定要求的表现行为。

这种协定具体是怎样的呢？这个就要去阅读《Unix高级编程》的终端IO一节了。这里不细说，而是挑一些紧要的介绍下。

## 为什么按下enter键就会执行命令？
Terminal App在启动之后，默认会加载shell程序，可能是 zsh，也可能是 bash，或者其他的。这些shell程序
会读取你的输入，使用 `read` 系统函数。它并不知道你什么时候输入完毕了，它只知道什么时候 `read`函数
返回。那么 `read`函数什么时候返回呢？就在你按下Enter的时候。

简单来讲，当你输入内容的时候，这些内容会写入到一个缓存区，这个缓存区空间很大，足够你写入很多内容，当你
按下Enter键的时候，缓冲区里的内容就会返回给 `read`。你会好奇，为什么不是别的按键，非要是 Enter 按键？

这就是一般情况下，终端IO的工作方式——**行模式**。

终端IO在行模式下，输入内容就会被写入到缓存，等按下Enter键的时候，内容就会被写入到 `/dev/tty`里面。

像 vim 这种程序，打破了这种约束，就是因为它通过系统函数改写了终端IO的工作模式，切换到了**非行模式**。

在非行模式下，你所有的输入，都将由你自己去编程处理，所以，在这个模式下，你输入的内容，终端模拟器可能
不会展示出来，需要调用`write`函数将内容写入到终端文件(`/dev/tty`, 如果 stdout 映射到它，也可以
写入 stdout), 终端模拟器才会给你展示出来。

如何完成这种模式的切换呢？

```c
#include <termios.h>

int main(int argc, char** argv) {
    struct termios termo;
    if (tcgetattr(STDIN_FILENO, &termo) < 0) {
        printf("failed to read termios from terminal""\n");
        return 1;
    }

    struct termios backup_termo = termo;

    // 不设置 ICANON bit, 终端就会切换到非行模式
    // 不设置 ECHO bit, 你输入的内容，终端模拟器就不会自动展示出来
    termo.c_lflag &= ~(ECHO | ICANON);
    termo.c_lflag |= (ISIG);
    termo.c_cc[VMIN] = 1;
    termo.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSANOW, &termo);
    return 0;
}
```

有两个设置终端的头文件：
- `termios.h`
- `termcap.h`

操作系统会把终端支持哪些设置，存储到一个数据库里，这就是 `terminfo`，macOS上，数据库位于 `/usr/share/terminfo/*/*`;

既然是输入库，就意味着它不能直观读取，必须借助 `termcap.h` 提供的函数读取。而 `termcap.h` 的威力不仅仅是这样，它还
包含了一个更重量级的头文件——`curses.h`。`curses.h`提供了一层封装，通过它，你可以完成一些更高级的事情，如：
- 设置光标在终端的位置
- 清空屏幕
- 在指定位置展示指定的内容
- 一个终端界面开启多个屏幕
- 删除某个位置的内容

## curses怎么做到的
curses能额外做到这么高级的事情，是因为它利用了终端控制序列。

什么是终端控制序列？它其实就是一种特殊的字符串，你只要把它输入到终端，终端就会把它们解析为指令，然后终端就会做出某种反应，
比如清空屏幕，移动光标，删除字符，等等。

为了直观说明终端控制序列，让我们回到开始提到的一个现象：vim启动前和vim退出后，terminal的样子没有变化，仿佛 vim 是启动了一个新的窗口完成一切的操作。

可以如此实现：
```c
#include <stdio.h>

int main(int argc, char** argv) {
    // \033[?1049h] 就是终端控制序列
    // 切换到备用屏幕（Alternate Screen Buffer），并保存当前屏幕内容。
    printf("\033[?1049h]");
    // 保存光标位置和属性
    printf("\0337");

    printf("aaaaaaa\n");
    printf("aaaaaaa\n");
    printf("aaaaaaa\n");
    printf("aaaaaaa\n");
    printf("aaaaaaa\n");
    printf("aaaaaaa\n");

    // 切换回主屏幕（Main Screen Buffer），并恢复之前保存的屏幕内容。
    printf("\033[?1049l]");
    // 恢复光标位置和属性。
    printf("\0338");
    return 0;
}
```