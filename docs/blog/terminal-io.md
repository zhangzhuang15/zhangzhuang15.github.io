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
> 这个环境变量的结果可能是 `xterm`, `cons25`, `dump`, 表示终端类型。不同的终端类型，它们支持的终端控制序列也不同。终端模拟器会根据这个环境变量的值，模拟对应类型的终端。

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

## 对终端更细致的理解
最好的方法就是查看手册`man termios`。不过，man手册讲的不是那么好理解，我结合AI对话，给出以下的解释，建议你结合man手册原文去看。

### 读取终端
读取终端的意思，就是调用`read`函数读取标准输入。具体的过程就是，终端有一个输入队列，当你按下键盘输入数据的时候，操作系统会将这些数据放入到这个队列，然后应用程序调用`read`再从这个队列里读取数据。当然，这个队列不是无限长的，操作系统会给出一个限制，当队列已经满了，你再往里边输入数据的时候，会发生什么，取决于`termios.c_iflag`是否设置`IMAXBEL`。如果设置了，终端就会收到 ASCII BEL 字符，发出响铃声，而输入的数据会忽略不计。如果没有设置，队列就会被清空，新来的数据进入队列。

接下来有一个问题，调用`read`之后，我输入多少个字符，`read`函数才会返回呢？ 

这要看你是否为终端设置了`O_NONBLOCK`。假设你要读取10字节数据。如果没有设置，`read`会阻塞，直到有10字节数据准备好了，才会返回。如果设置了，`read`不会阻塞，如果有20字节数据准备好，就返回10字节数据，如果有5字节数据准备好，就返回5字节，如果没有数据准备好，就返回-1.

问题来了，怎么才算**数据准备好**？

要分两种情况理解。

第一种，采取**正常模式**处理终端输入值，这是终端默认的行为。这个模式下，按行处理输入值。假设你输入abcd，不好意思，虽然终端输入队列有四个字符，但无法断定这4个字符构成了完整的一行数据，不能算作数据准备好。当你按下回车的时候，就是输入了一个`\n`字符，神奇的事情发生了，abcd就会被认为是完整的一行，数据就算准备好了，`read`就能顺利返回abcd。除了`\n`字符有这样的功效，end-of-file (EOF)字符，end-of-line (EOL) 字符也有。当输入 ERASE 字符的时候，会删除输入队列的末尾字符。输入 KILL字符的时候，会删除输入队列的末尾一行数据。 关于ERASE字符，KILL字符，这些特殊字符，会在后边介绍。一行有多少个字符呢？无限个字符么？显然不行。操作系统会给出一个上限，当一行数据的长度超过这个上限，就会按照上面输入队列满了的情况，对这行数据做同样的处理，响铃声或者清空。

第二种，采取**非正常模式**处理终端输入值。这个模式下，就不是按照行的概念处理输入值了，ERASE字符、KILL字符也会失效。那该怎么处理呢？取决于`termios.c_cc[VMIN]`和`termios.c_cc[VTIME]`怎么设置。
| termios.c_cc[VMIN] | termios.c_cc[VTIME] | 调用read的效果 |
|:--:|:--:|:--|
| 10 | 2 | 输入队列如果有数据，read立即从中读取需要的数据，如果没有，read陷入阻塞，当你输入一个字符的时候，开启 2*0.1秒的计时，在接下来的0.2秒到期之前，如果你又输入了9个字符，那么read就会读取这10个字符，如果在到期的时候，你输入了5个字符，总共6个字符，不足10个字符，那么read就会读取这6个字符|
|10 | 0 | 没有上一种情况的计时效果，只要你输入了10个字符，read就会返回，否则就是数据没准备好，read要么阻塞，要么返回-1
| 0 | 2 | 立即开启每2*0.1秒的计时器，在这0.2秒内，如果你输入了一个字符，read立即返回，如果没有输入任何字符，read立即返回0 |
|0| 0| 有输入的字符，read立即返回字符，没有输入的字符，read返回0 |

### 特殊字符 
|字符名称|ascii码值|如何构造|作用|
|:--:|:--:|:--|:--|
| INTR | 3 | 按下键盘的Ctrl+C|termios.c_lflag如果设置ISIG，终端直接忽略该字符，同时向前台进程组发送SIGINT信号, 如果没有设置，按照普通字符处理 |
| QUIT | 28 | 按下键盘的Ctrl+\ | termios.c_lflag如果设置ISIG，终端直接忽略该字符，同时向前台进程组发送SIGQUIT信号，如果没有设置，按照普通字符处理 |
| ERASE | 127 或者 8 | 按下键盘的Ctrl+H， 或者 DELETE键 | termios.c_lflag如果设置ICANON，终端直接忽略该字符，同时删除队列中的末尾字符，如果没有设置，按照普通字符处理 |
| KILL | 21 | 按下键盘Ctrl+U | termios.c_lflag如果设置ICANON，终端直接忽略该字符，同时删除队列中的末尾一行，如果没有设置，按照普通字符处理|
|  EOF | 4 | 按下键盘Ctrl+D | termios.c_lflag如果设置ICANON，终端直接忽略该字符，将输入对列里的数据返回给进程 |
| EOL | 255 || 同EOF |
|  SUSP | 26 | 按下键盘Ctrl+Z | termios.c_lflag如果设置ISIG，终端直接忽略该字符，同时向前台进程组发送SIGTSTP信号，如果没有设置，按照普通字符处理|
|STOP | 19 | 按下键盘Ctrl+S | termios.c_iflag如果设置IXOFF, 或者 termios.c_oflag设置 IXON， 终端直接忽略该字符，并挂起输出 |
|START| 17 | 按下键盘Ctrl+Q | termios.c_iflag如果设置IXOFF, 或者 termios.c_oflag设置 IXON， 终端直接忽略该字符，恢复输出 |

> 以上特殊字符对应的 ascii 码，可以在 `<sys/ttydefaults.h>` 头文件找到


Ctrl+C为什么意味着中断一个进程呢？首先Ctrl+C按下之后，就会向终端发送3（`037 & 67`），终端在默认情况下，INTR 就是 3，因此终端认为你输入了一个INTR特殊字符给它，恰巧，在默认的处理方式下，终端会发送SIGINT信号给前台进程，最终导致进程被中断。

除了NL和CR，其余特殊字符对应的ascii值可以通过`termios.c_cc`修改。比如`termios.c_cc[VINTR] = 2`, Ctrl+C 按下后，就不会被当作输入一个INTR特殊字符，就不会产生SIGINT信号，你必须按下 Ctrl+B 才行。

接下来，我们认识认识不可见字符的英文名和中文名：

| 十进制 | 八进制 | 十六进制 | ASCII 字符 | 英文缩写 | 中文含义 |
|--------|--------|----------|------------|----------|----------|
| 0      | 000    | 0x00     | NUL        | NUL      | 空字符，表示空 |
| 1      | 001    | 0x01     | SOH        | SOH      | 起始符，Start of Heading |
| 2      | 002    | 0x02     | STX        | STX      | 起始符，Start of Text |
| 3      | 003    | 0x03     | ETX        | ETX      | 文本结束符，End of Text |
| 4      | 004    | 0x04     | EOT        | EOT      | 文本结束符，End of Transmission |
| 5      | 005    | 0x05     | ENQ        | ENQ      | 询问符，Enquiry |
| 6      | 006    | 0x06     | ACK        | ACK      | 确认符，Acknowledge |
| 7      | 007    | 0x07     | BEL        | BEL      | 铃声，Bell |
| 8      | 010    | 0x08     | BS         | BS       | 退格符，Backspace |
| 9      | 011    | 0x09     | HT         | HT       | 水平制表符，Horizontal Tab |
| 10     | 012    | 0x0A     | NL         | NL       | 换行符，New Line |
| 11     | 013    | 0x0B     | VT         | VT       | 垂直制表符，Vertical Tab |
| 12     | 014    | 0x0C     | NP         | NP       | 换页符，Next Page |
| 13     | 015    | 0x0D     | CR         | CR       | 回车符，Carriage Return |
| 14     | 016    | 0x0E     | SO         | SO       | 移动到下一个设备，Shift Out |
| 15     | 017    | 0x0F     | SI         | SI       | 移动到前一个设备，Shift In |
| 16     | 020    | 0x10     | DLE        | DLE      | 数据链路转义符，Data Link Escape |
| 17     | 021    | 0x11     | DC1        | DC1      | 设备控制符 1，Device Control 1 |
| 18     | 022    | 0x12     | DC2        | DC2      | 设备控制符 2，Device Control 2 |
| 19     | 023    | 0x13     | DC3        | DC3      | 设备控制符 3，Device Control 3 |
| 20     | 024    | 0x14     | DC4        | DC4      | 设备控制符 4，Device Control 4 |
| 21     | 025    | 0x15     | NAK        | NAK      | 否认符，Negative Acknowledge |
| 22     | 026    | 0x16     | SYN        | SYN      | 同步符，Synchronous Idle |
| 23     | 027    | 0x17     | ETB        | ETB      | 结束传输块符，End of Transmission Block |
| 24     | 030    | 0x18     | CAN        | CAN      | 取消符，Cancel |
| 25     | 031    | 0x19     | EM         | EM       | 媒体结束符，End of Medium |
| 26     | 032    | 0x1A     | SUB        | SUB      | 替换符，Substitute |
| 27     | 033    | 0x1B     | ESC        | ESC      | 转义符，Escape |
| 28     | 034    | 0x1C     | FS         | FS       | 文件分隔符，File Separator |
| 29     | 035    | 0x1D     | GS         | GS       | 组分隔符，Group Separator |
| 30     | 036    | 0x1E     | RS         | RS       | 记录分隔符，Record Separator |
| 31     | 037    | 0x1F     | US         | US       | 单元分隔符，Unit Separator |

趁此机会，介绍下键盘和ascii码的联系。我们想输入字符，必须通过键盘。**并不是所有的键盘按下之后，就会输入字符**。比如，我们按下键盘A, 输入的就是字符'a'；我们按下 Shift + A，输入的就是字符'A'。但是，我们只按下Ctrl或者Shift的时候，就不会输入字符。在ascii码中，32到126的码值，表示的是可见字符，都可以通过按下一个键盘输入，但0到31的码值，是控制字符，不可见的，尽管你可以强制打印它们，但它们在终端可能就变成了这个样子"^A", "^B" —— "^"组合一个可见字符的形式。以码值1为例，打印出来就是^A。为什么是这个样子呢？因为^表示Ctrl键， ^A就是Ctrl键+A键，而A的ascii码是65， Ctrl+A的背后是计算 `037 & 65`, 这个结果刚好是1。

延伸一点看，如果用`read`读取出来的字符值，正好是0到31, 这就意味着用户按下了Ctrl键。

### `termios.c_iflag` 


### `termios.c_oflag` 


### `termios.c_lflag`

### `termios.c_cflag`