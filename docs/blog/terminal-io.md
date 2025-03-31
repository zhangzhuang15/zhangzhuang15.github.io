---
title: "Terminal的魔法"
page: true
aside: true
---

## 相关资料
[GNU | The Termcap Library](https://www.gnu.org/software/termutils/manual/termcap-1.3/html_chapter/termcap_2.html)

[DEC C | Getting Started with Curses](http://odl.sysworks.biz/disk$axpdocdec971/progtool/deccv56/5763profile0036.html#342_gettingstartedwithcurses)

[OpenGroup | System Interfaces: Detailed ToC](https://pubs.opengroup.org/onlinepubs/9699919799/functions/contents.html)

## Description
使用过 Vim 的你，有没有对这些现象感到惊讶：
1. vim启动前和vim退出后，terminal的内容没有变化，仿佛 vim 是启动了一个新的窗口完成一切的操作；
2. 在vim里，你可以通过按钮控制光标；
3. 在vim里，你点击enter键竟然会换行；
4. 按下ESC键后，再次输入冒号，竟然没有往文本中插入一个冒号，光标反而来到底部；

如果你没有感到惊讶，可以想想你平时如何使用 terminal 的，你输入一些内容，只要按下enter键，这些内容就会被当作一条指令被执行，那么vim是怎么阻止这种行为的呢？如果是你，你怎么去阻止这个行为呢？

是不是感觉到有些惊讶，更感觉有些好奇了呢？

## Terminal
平时，我们的关注点放在 stdout。当你使用 
- `console.log`，
- `printf`, 
- `std::cout`, 
- `fmt.Println`,
- `println!`
  
时，背后的逻辑就是将内容写进 stdout，然后你就可以在 terminal 中看到输出结果了。于是，你就会觉得，stdout 就是 terminal 。

但这种想法被Terminal的魔法欺骗了。

我们所谈到的 Terminal 是电脑上运行的 App，确切说，它叫做终端模拟器。你之所以往 stdio 写入内容，可以在 Terminal 上展示出来，都是终端模拟器偷偷地做了很多工作。

简单来讲，可以这样理解终端模拟器的行为。它会打开一个特殊的文件 `/dev/tty`，将stdout stdin 映射到这个文件，之后监听这个文件。当我们按下键盘时，os的驱动程序就会把这些内容写入到这个特殊文件，终端模器接着检测出变化，从这个文件中读出内容，然后用os提供的图形接口，将内容绘制到UI上，于是我们就看到了自己输入的内容。

这也就解释了，如果你写的程序，将stdio重新定向到一个文件，比如"main.txt"，你所写入的内容不会展示在
Terminal 界面上，因为它并没有监听"main.txt"文件的变动。

既然是终端模拟器，它要起到模拟的作用，就必须遵循一套模版，毕竟没有模仿对象的话，何来模拟之言？这种模版就是一种协定。我们按下Enter键，就会执行一条指令的行为，也是这种协定要求的表现行为。

这种协定具体是怎样的呢？这个就要去阅读《Unix高级编程》的终端IO一节了。这里不细说，而是挑一些紧要的介绍。

## 为什么按下enter键就会执行命令？
Terminal App在启动之后，默认会加载shell程序，可能是 zsh，也可能是 bash，或者其他的。这些shell程序会读取你的输入，使用 `read` 系统函数。它并不知道你什么时候输入完毕了，它只知道什么时候 `read`函数返回。那么 `read`函数什么时候返回呢？就在你按下Enter的时候。

简单来讲，当你输入内容的时候，这些内容会写入到一个缓存区，这个缓存区空间很大，足够你写入很多内容，当你按下Enter键的时候，缓冲区里的内容就会返回给 `read`。你会好奇，为什么不是别的按键，非要是 Enter 按键？

这就是一般情况下，终端IO的工作方式——**行模式**。

终端IO在行模式下，输入内容就会被写入到缓存，等按下Enter键的时候，内容就会被写入到 `/dev/tty`里面。

像 vim 这种程序，打破了这种约束，就是因为它通过系统函数改写了终端IO的工作模式，切换到了**非行模式**。

在非行模式下，你所有的输入，都将由你自己去编程处理，所以，在这个模式下，你输入的内容，终端模拟器可能不会展示出来，需要调用`write`函数将内容写入到终端文件(`/dev/tty`, 如果 stdout 映射到它，也可以写入 stdout), 终端模拟器才会给你展示出来。

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

既然是数据库，就意味着它不能直观读取，必须借助 `termcap.h` 提供的函数读取。而 `termcap.h` 的威力不仅仅是这样，它还包含了一个更重量级的头文件——`curses.h`。`curses.h`提供了一层封装，通过它，你可以完成一些更高级的事情，如：
- 设置光标在终端的位置
- 清空屏幕
- 在指定位置展示指定的内容
- 一个终端界面开启多个屏幕
- 删除某个位置的内容

## curses怎么做到的
curses能额外做到这么高级的事情，是因为它利用了终端控制序列。

什么是终端控制序列？它其实就是一种特殊的字符串，你只要把它输入到终端，终端就会把它们解析为指令，然后终端就会做出某种反应，比如清空屏幕，移动光标，删除字符，等等。当然了，这是协定。真正落实起来的话，还要看终端模拟器如何去实现。你将终端控制序列输出到stdout的时候，就是将它们写入到 `/dev/tty`，终端模拟器可以监听这个文件，从中获取你输出的内容，并解析这些内容，区分出终端控制序列和普通内容。在拿到终端控制序列的情况下，解析这个序列，比如解析出的结果是清空屏幕，终端控制器就会使用操作系统提供的GUI接口，清空内容。

为了直观说明终端控制序列，让我们回到开始提到的一个现象：vim启动前和vim退出后，terminal展示的内容没有变化，仿佛 vim 是启动了一个新的窗口完成一切的操作。

可以如此实现：
```c
#include <stdio.h>
#include <unistd.h>

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

    // 停顿10s, 方便看效果
    sleep(10);

    // 切换回主屏幕（Main Screen Buffer），并恢复之前保存的屏幕内容。
    printf("\033[?1049l]");
    // 恢复光标位置和属性。
    printf("\0338");
    return 0;
}
```

终端控制序列还拥有给文字设置背景色、前景色等其他功能。

每个终端都有自己的终端控制序列，你可以利用浏览器查到它们。在macOS中，你可以查看环境变量`TERM`，确定操作系统支持的是哪种终端：
```shell 
env | grep TERM
```
然后你就查询这种终端对应的终端控制序列，按照屏幕清空、移动光标等功能做好封装，以供使用。像 Vim 程序，它就是这么干的，封装了很多终端的终端控制序列，总结出同样的接口定义，以达到跨平台、跨终端的目的。你也可以这样做。

人总是想偷懒的，你也不必自己去查终端控制序列，完全可以使用已经封装好的工具，就比如`<curses.h>`, `<ncurses.h>`, 如果你使用的是 Rust 编程，还可以使用`crossterm`。你使用的是 Python , 也没有关系，python也有对 `curses.h` 的封装。

:::tip <TipIcon />
上一节中提到的 `termios.h`, 利用 `tcsetattr` 只是影响了 `read`, `write` 
读取、写入 `/dev/tty` 的行为，并没有影响终端控制序列。二者不要混为一谈。
:::

## termcap
上文说过，终端控制序列有一大堆，很难记住，有没有什么方法可以简化呢？答案是有的，你可以使用 `termcap.h`。这个头文件提供了若干函数，按照想要的功能，让你查询到终端控制序列。

```c 
// main.c
#include <stdlib.h>
#include <termcap.h>
#include <unistd.h>
#include <stdio.h>

int main(int argc, char** argv) {
    char term_buffer[2048];
    char* term_type = getenv("TERM");
    // 相当于打开记录终端控制序列的数据库
    int success = tgetent(term_buffer, term_type);
    if (success > 0) {
        printf("we open the data base");
    }

    // 读取表示清空屏幕的终端控制序列，存储到
    // result 中；
    char buffer[2048];
    char* result = tgetstr("cl", &buffer);

    // 为了便于观察输出，我们将stdio的缓冲写关闭
    setvbuf(stdout, NULL, _IONBF, BUFSIZE);

    printf("aaaaaaaaaaaa\n");
    printf("aaaaaaaaaaaa\n");
    printf("aaaaaaaaaaaa\n");

    sleep(2);

    // 清空屏幕的终端控制序列存储在 result 中，
    // 打印它的话，就会启动清屏效果
    printf("%s", result);

    return 0;
}
```
编译运行：
```shell
gcc main.c -lcurses -o main && ./main
```

:::tip <TipIcon />
`tgetstr`的第一个参数取哪些值，可以用 `man terminfo` 查看；

尽管 `termcap` 很好用，但是并不推荐。因为用 `tgetstr`查询的时候，你必须在第二个参数位置上，指定一段内存空间的起始地址。`tgetstr`会将查询结果存储到这个空间里，随着存储内容的增多，这段空间面临着内存溢出的风险，就算我们把空间开辟得很大，依旧有风险。为了保险起见，要预估自己要使用多少个终端控制序列，然后开辟适合的内存空间。总之，使用要谨慎。

你可以使用`tgetflag`查询终端是否支持某个终端控制序列；

对于操作光标的终端控制序列，光靠 `tgetstr` 还不够，有的控制序列字符串要用`tgoto`才能获取:
```c
#include <stdlib.h>
#include <termcap.h>
#include <unistd.h>
#include <stdio.h>

int main(int argc, char** argv) {
    char term_buffer[2048];
    char* term_type = getenv("TERM");
    // 相当于打开记录终端控制序列的数据库
    int success = tgetent(term_buffer, term_type);
    if (success > 0) {
        printf("we open the data base");
    }

    char buffer[2048];
    char* result = tgetstr("cm", &buffer);
    result = tgoto(result, 2, 2);
    // 光标移动到终端页面的第2行第2列
    printf("%s", result);
    return 0;
}
```
:::

[refer](https://www.gnu.org/software/termutils/manual/termcap-1.3/html_chapter/termcap_2.html)

## 终端模拟器做的事其实不多
在 `termios.h` 中，可以利用 `tcsetattr` 函数调整终端调制器的波特率，或者做出对终端的其他设置，实质上，它影响的是io驱动程序将数据传送到`/dev/tty`文件的环节，这个环节，终端模拟器并不参与。抛开了这种工作，终端模拟器要做的事情就不怎么多了。

它只需要完成：
1. 监听`/dev/tty`，把这个文件里的内容，画到屏幕上；
2. 监听`/dev/tty`, 从这个文件里读取内容，解析终端控制序列，做出反应；
3. 启动shell程序，将命令传送给它，将它的执行结果输出到屏幕上；

## 终端控制序列
如果你对终端控制序列感兴趣，可以阅读[ansi escape control](/tool/ansi-escape-control)