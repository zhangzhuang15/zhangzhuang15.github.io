---
title: "Kilo, Text Editor"
page: true
aside: true
---

# Kilo, a Simple Text Editor
Kilo is a simple text editor, written in c language by Antirez, author of Redis.It doesn't use any third-party library, only pure c and systemcall.It's an excellent example for c learner and system programing learner. The best part of it, is pretty simple and self-evident.

[source code](https://github.com/antirez/kilo)

## Terminal Detail
I talk about terminal detail in my another [blog](/blog/terminal-io), which is written in Chinese language. I only introduce some terminal detail learned from Kilo.

Here is code.
```c  
int enableRawMode(int fd) {
    struct termios raw;

    tcgetattr(fd, &raw);

    raw.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
    raw.c_oflag &= ~(OPOST);
    raw.c_cflag |= (CS8);
    raw.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);
    raw.c_cc[VMIN] = 0; 
    raw.c_cc[VTIME] = 1;

    tcsetattr(fd,TCSAFLUSH,&raw);
    return 0;
}
```

This code snippet brings terminal driver into raw mode, don't allow terminal driver to take seom default actions, e.g. modify input value, consider some character as signal. 

In raw mode, you take **absolute control** of every characters, you have to accept every input with `read()` and print characters on screen with `write()`, terminal simulator won't do it as default.

In raw mode, **escape control sequence** still works.

Ok, let's talk about `c_iflag` `c_oflag` `c_cflag` `c_lflag` `c_cc`.

`c_iflag` is terminal driver input configuration.

`BRKINT`:
- enabled: terminal driver accepts break condition (e.g. Ctrl+C, SIGINT signal), it will take action, e.g. exit process.
- disabled: terminal driver ignores break condition.

`ICRNL`:
- enabled: terminal driver converts `\r` to `\n` before sending data to you as return value of `read()` 
- disabled: terminal driver doesn't convert.
> Some old system doesn't support `\r`, `ICRNL` is set as default value for compatibility.
> CR means carriage return, `\r`. NL means next line, `\n`.

`INPCK`:
- enabled: terminal driver adds extra bit in every byte of data, for checking if data is complete and not broken.
- disabled: terminal driver doesn't add this extra bit.

`ISTRIP`:
- enabled: terminal driver removes highest bit of a char. As you know, ascii encoding only needs 7-bit, system discards 8th bit for improving data transmition.But it's not suitable for transmiting utf-8 encoded char.
- disabled: terminal driver doesn't remove highest bit of a char.

`IXON`:
- enabled: terminal driver accepts `Ctrl+S` or `Ctrl+Q`, telling sender stop/resume sending data.
- disabled: terminal driver considers `Ctrl+S` and `Ctrl+Q` as regular char, do no effects.


`c_oflag` is terminal driver output configuration.

`OPOST`:
- enabled: terminal driver converts `\n` to `\r\n` before after you send data with `write()`, in other words, your sending data is modified by terminal driver.
- disabled: terminal driver doesn't convert.


`c_cflag` is terminal driver character configuration.

`CS8`:
- enabled: make sure terminal driver can handle all 8 bit of a byte, supporting UTF-8,ISO-8859-1 and etc.
- disabled: terminal driver only handle 7 bit of a byte.


`c_lflag` is terminal driver configuration for its automatical reaction.

`ECHO`:
- enabled: when you type a char, e.g. 'A', terminal driver writes this char to output buffer automatically, as a result, you can see 'A' on your terminal app screen.
- disabled: terminal drivers doesn't write the char to output buffer automatically.

`ICANON`:
- enabled: terminal driver accepts your input line by line, in other words, after you call `read()` and not press `Enter` in your keyboard, nothing will be returned.
- disabled: terminal driver accepts your input character by character. After you call `read()`, you can get result without waiting for pressing `Enter`.

`IEXTEN`:
- enabled: terminal driver extends input processing, if you type `Ctrl+V`, terminal driver considers it as control sequence, not regular characters.
- disabled: terminal driver doesn't extend input processing, considers input characters as regular characters.

`ISIG`:
- enabled: terminal driver allows signal-generating characters, if you type `Ctrl+C`, terminal driver will generate SIGINT signal.
- disabled: terminal driver ignore signal-generating characters, considers them as regular characters, if you type `Ctrl+C`, no SIGINT signal generated.


`c_cc` is terminal driver control character configuration.

`c_cc[VMIN] = 0`:
terminal driver's input buffer must have 0 bytes at least, if you set 4, when you call `read()` and input buffer is not at least 4 bytes, process will be blocked until input buffer has more than 4 bytes.
> cc means control character.


`c_cc[VTIME] = 1`:
`read()` will wait up to 100ms for input before timing out and returning 0 if no input is available, keep in mind that `c_cc[VMIN]` takes precedence, if `c_cc[VMIN]` is not 0, whatever `c_cc[VTIME]` set, it has no effect.



Concept you should know:
1. Terminal: keyboard, screen, mouse and etc, all of those accept your input or can output something, called terminal. In other words, terminal doesn't refer to a specific device.
2. Terminal Driver: a program, a part of operating system, transmits data from software to output device or transmit data from input device to software, software must use systemcalls in order to communicating with terminal driver.
3. Terminal Simulator: a graphic software (not command line software), accept data from terminal driver input buffer(e.g. you type `A` in your keyboard); accept data from terminal driver output buffer and print data on screen.


## How Kilo Works
### How to Render
Use `write()` sending data to standard output file whose fd is 1. If you want to make it colorful, write extra escape character control sequence.

### How to Manage Editor Content
Editor content is split by line, every line is saved in a Row struct.

Every Row struct has 3 char array, array A aims to save raw characters(printable character and unprintable character), array B aims to save rendered characters(filter and replace unprintable characters), array C aims to save character style(an int type data for every rendered character). When render a line, walk rendered character from array B, and get its style from array C, write escape character control sequence according to its style, then write rendered character.

### How to Move Cursor or Editor Content
There're some variables:
- screenWidth: how many cols window has
- screenHeight: how many rows window has
- offsetX: how many col offset every Row has.Assume that offsetX is 3, the 4th Row is rendered at top of window first.
- offsetY: how many row offset every Row has.Assume that offsetY is 3, the 4th rendered character of Row is rendered first.
- cursorX: x position of cursor
- cursorY: y positiion of cursor

When move cursor, merge cursorX and cursorY into an escape character control sequence, write this sequence.Really easy, right ?

When move editor content, just modify offsetX and offsetY, and write rendered characters following these two variables. So easy, right ?

### How to Listen Keyboard Input
Call `read()` in a loop.

If we read `arrow-right` character, we modify cursorX and offsetX, then clear screen and render every Row again.As a result, editor content seems to be moved to right.