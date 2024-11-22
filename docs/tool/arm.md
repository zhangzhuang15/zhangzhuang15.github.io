---
title: "arm指令清单"
page: true
aside: true
---

## Description
只记录一些常用的arm指令备忘，不易列举所有的指令。

指令集为aarch64体系的指令。

## SIMD
专用寄存器`v0~v31`, 寄存器为 128 bit。

`v0`寄存器的低64bit，就是 `d0`寄存器。其它d开头的寄存器，以此类推。

`v0`寄存器的低32bit，就是 `s0`寄存器。其它s开头的寄存器，以此类推。

`v0`寄存器的低16bit，就是`h0`寄存器。其它h开头的寄存器，以此类推。

`v0`寄存器的低8bit，就是`b0`寄存器。其它b开头的寄存器，以此类推。

这些寄存器是专用的，部分运算要用专门的汇编指令处理。比如将内存的数据加载到通用寄存器时，用`ldr`指令即可，但是加载到上述专用寄存器，要用`ld1`指令。

看几个例子。

```asm
ld1 {v0.4s}, [x0]
```
`{v0.4s}`表示v0寄存器的4个32bit。这句指令的含义，就是从`[x0]`的内存读取4个32bit的数据，存储入到v0寄存器中。

## @PAGE和@PAGEOFF
它们是伪操作符，用来读取符号的地址，比如全局变量、函数。

```c
int hello = 0;

void world();
```
如果用汇编代码读取 `hello`的内存地址：
```asm
adrp x0, hello@PAGE
add x0, x0, hello@PAGEOFF
```
`x0`存储的就是`hello`的地址了。

如果用汇编代码读取`world`函数内存地址：
```asm
adrp x0, _world@PAGE
add x0, x0, _world@PAGEOFF
```
`adrp`的作用，是将目标值加载到寄存器的高52bit。而`_world@PAGE`是_world地址按照4k页面对齐后的地址，其低12位（4k就是2的12次方）是0，只有高52bit是有效值，用`adrp`加载后，没有数据丢失。`_world@PAGEOF`是_world地址在4k页面内的偏移地址，其低12位是有效的，高52bit是0。将二者求和之后，正好就是_world符号代表的内存地址了。

另外，我们还有一个等效方式：
```asm
adrp x0, _world
add x0, x0, :lo12:_world
```

区别在于：@PAGE @PAGEOFF是 GNU汇编器（as）特有的语法，`:lo12:`在大多数aarch64汇编器中都可以使用。忘了说了，`:lo12:_world`就是获取_world内存地址的低12位。