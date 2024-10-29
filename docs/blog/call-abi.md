---
title: "函数调用ABI"
page: true
aside: true
---

## Statement
本文的讨论仅限于 aarch64 macOS. gcc用的是macOS自带的clang.

## Hello World 
一个简单的C代码：

```c
#include <stdio.h>

void hello(int a) {
    printf("Hello World %d\n", a);
}

int main() {
    int b = 3;
    hello(b);

    return 0;
}
```

非常简单对吧？

如果让你用汇编代码实现一个C语言里的函数，是不是难了一点，也有趣了一点？

你可能会问，你这不是咸的么，纯属炫技，让编译器去做它该做的事情，不好么？

绝大多数请款下，用汇编实现C函数，就是蛋疼之举，可也有例外。比如你要实现协程，就必须知道怎么用汇编完成一个函数。C语言的话，使用结构体定义协程。结构体需要包含这些东西：
- 一个指针，指向一块堆内存区域（比如用malloc开辟的），这块内存区域，作为协程的栈
- 一个指针，指向协程的栈顶
- 一个指针，指向协程的栈底
- 一个指针，指向协程的入口函数地址（这个函数用C定义，函数名就是函数的地址）

执行协程，就是将CPU的指令寄存器设置为协程的入口地址，CPU堆栈寄存器设置为协程的栈顶，CPU栈帧寄存器设置为协程的栈底。你要知道，这一套操作要用汇编指令完成，而且，如果协程的入口函数有参数列表，传参数的环节，也要用汇编完成。所以，了解汇编实现C函数，确实有点用处。

## ABI
汇编实现C函数，其实就是ABI的落地。ABI规定了执行一个函数的时候，哪些寄存器可以用，函数第n个参数该用哪个寄存器存储，函数的返回值应该存在哪个寄存器，函数的调用方应该保存哪些寄存器，函数内部应该保存哪些寄存器。编译器就是遵从ABI的规定，将C代码编译为对应的汇编代码的。

简单介绍下aarch64的ABI约定。

### 1. 寄存器使用
通用寄存器：
- x0 至 x7：用于传递前 8 个整型参数。
- x8 至 x17：用于临时存储，调用者保存。
- x18：平台保留寄存器，用于特定平台的用途。
- x19 至 x28：用于临时存储，被调用者保存。
- x29：帧指针（Frame Pointer），用于指向当前栈帧的基地址。
- x30：链接寄存器（Link Register），用于存储函数调用的返回地址。
- sp：栈指针（Stack Pointer），用于指向当前栈的顶部。

浮点寄存器：
- v0 至 v7：用于传递前 8 个浮点参数。
- v8 至 v15：用于临时存储，调用者保存。
- v16 至 v31：用于临时存储，被调用者保存。
   
解释一下“调用者保存”和“被调用者保存”。

如果函数A调用了函数B，对于函数B来说，函数A就是调用者，函数B自己就是被调用者。

x8 至 x17：用于临时存储，调用者保存。之所以需要调用者保存，是因为被调用者可以随意使用这些寄存器，调用者不保存的话，被调用者就会改写这些寄存器，等执行完毕回到调用者，这些寄存器就没法儿用了，调用者以前存入到这些寄存器里的数据，就丢失了。如果调用者使用了x8至x17寄存器，需要把它们存入到栈里，然后再执行被调用者，从被调用者返回后，将栈上的数据回写到寄存器里。

v16 至 v31：用于临时存储，被调用者保存。之所以需要被调用者保存，是因为调用者可以随意使用这些寄存器。被调用者不保存的话，调用者存在寄存器上的数据，就会被重写，导致丢失。因此，被调用者应该在使用这些寄存器之前，先存入到栈，然后使用这些寄存器，在返回到调用者之前，从栈读取数据，恢复这些寄存器最开始的模样。

### 2. 参数传递
整型参数：
- 前 8 个整型参数通过 x0 至 x7 传递。
- 超过 8 个的参数通过栈传递。
  
浮点参数：
- 前 8 个浮点参数通过 v0 至 v7 传递。
- 超过 8 个的参数通过栈传递。

复合类型参数：结构体和联合体根据其大小和对齐要求，可能通过多个寄存器或栈传递。

### 3. 返回值
整型返回值：通过 x0 返回。

浮点返回值：通过 v0 返回。

复合类型返回值：如果返回值大于 16 字节，通常通过隐式指针传递，该指针作为第一个参数传递给函数。

### 4.栈帧布局
栈增长方向：栈向下增长，即 sp 减小表示栈增长。

栈对齐：栈必须保持 16 字节对齐。

栈帧结构：
- 函数调用时，通常会创建一个新的栈帧。
- 栈帧的基地址由 x29（帧指针）指向。
- 栈帧中通常包含局部变量、保存的寄存器值、函数调用参数等。

### 5.函数调用约定
调用者保存：
- 调用者负责保存 x8 至 x17 和 v8 至 v15 的值。
- 如果调用者需要在函数调用后继续使用这些寄存器，应在调用前保存它们。


被调用者保存：
- 被调用者负责保存 x19 至 x28 和 v16 至 v31 的值。
- 被调用者可以在函数内部自由使用这些寄存器，但必须在返回前恢复它们的值。

### 6.系统调用
系统调用号：通过 x8 传递系统调用号。

系统调用参数：通过 x0 至 x7 传递系统调用参数。

系统调用指令：使用 svc #0 指令触发系统调用。

## 重要的寄存器
x29寄存器，64位，记录栈底地址。

sp寄存器，64位，记录栈顶地址。

x30寄存器，64位，记录函数返回地址，它的别名是lr，可以用在汇编代码里。

x开头的寄存器，都是64位，它的低32位也可以看作是32位寄存器。w0寄存器指的就是x0的低32位。上边提到，x0寄存器会存储函数返回值，但有的返回值可能是32位整数，编译器给出的汇编代码可能就把返回值存入w0了，但你要知道，存入w0和存入x0是一回事儿。

## 如何理解栈
典型的一个问题：分不清栈顶和栈底。

假设你执行了C代码`void* b = malloc(8)`, 你申请了8字节，就会有：

<div style="position: relative">
<table>
    <tbody>
        <tr>
            <td style="position: relative;background: grey; height: 30px">
            <div style="position: absolute; top: 0;right: -100px">high address</div>
            </td>
        </tr>
        <tr><td style="background: grey; height: 30px"></td></tr>
        <tr><td style="background: grey; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr><td style="background: lightblue; height: 30px"></td></tr>
        <tr>
            <td style="position: relative; background: lightblue; height: 30px">
            <div style="position: absolute; top: 0;right: -70px">b is here</div>
            </td>
        </tr>
        <tr><td style="background: grey; height: 30px"></td></tr>
        <tr><td style="background: grey; height: 30px"></td></tr>
        <tr><td style="background: grey; height: 30px"></td></tr>
        <tr>
            <td style="position: relative; background: grey; height: 30px">
                <div style="position: absolute; top: 0;right: -90px">low address</div>
            </td>
        </tr>
    </tbody>
</table>
<section style="position: absolute; right: 0; top: 0; width: 70%;">
  <p>这些格子用来表示内存单元，上边的格子内存地址大，下边的格子内存地址小。</p>
  <p>蓝色的格子就是malloc开辟出的8个字节。</p>
  <p>我们想把蓝色格子全部作为栈使用，哪个格子是栈底，哪个格子是栈顶呢？</p>
  <p>在aarch64体系中，栈是从高地址向低地址增长的，因此，最下边的蓝色格子是栈顶。</p>
  <p>你肯定会说，最上边的蓝色格子就是栈底。差了一点，栈底不是这个格子，而是这个格子上边紧邻的灰色格子。记住，栈顶可以存数据，栈底不存数据。</p>
  <p>sp寄存器的值应该设置为b, x29寄存器的值应该设置为 (b + 8)。</p>
</section>
</div>

## 汇编例子
有了上面的铺垫，我们可以看看代码了。将文章开头的c代码编译为汇编代码：
```asm 

	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 15, 0	sdk_version 15, 0
	.globl	_hello                          ; -- Begin function hello
	.p2align	2
_hello:                                 ; @hello
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #32
	stp	x29, x30, [sp, #16]             ; 16-byte Folded Spill
	add	x29, sp, #16
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	stur	w0, [x29, #-4]
	ldur	w9, [x29, #-4]
                                        ; implicit-def: $x8
	mov	x8, x9
	mov	x9, sp
	str	x8, [x9]
	adrp	x0, l_.str@PAGE
	add	x0, x0, l_.str@PAGEOFF
	bl	_printf
	ldp	x29, x30, [sp, #16]             ; 16-byte Folded Reload
	add	sp, sp, #32
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #32
	stp	x29, x30, [sp, #16]             ; 16-byte Folded Spill
	add	x29, sp, #16
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #4]                    ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	mov	w8, #3                          ; =0x3
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #16]             ; 16-byte Folded Reload
	add	sp, sp, #32
	ret
	.cfi_endproc
                                        ; -- End function
	.section	__TEXT,__cstring,cstring_literals
l_.str:                                 ; @.str
	.asciz	"Hello, world!\n%d"

.subsections_via_symbols
```
删除一些无用的代码，我们从main函数一点点看：
```asm{2}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```

`sub a,b,c`:  a = b - c. sp寄存器减少了32，也就是开辟了32字节的栈。


```asm{3}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`stp a, b, address`: a的数据写入 address到address+7的内存区域，b的数据存入到address+8到address+15的内存区域。x29是栈帧寄存器，存储着main函数调用者的栈底地址。x30寄存器，存储着main函数返回后要执行的指令的地址。将x29入栈，因为后边要改写这个寄存器。将x30入栈，因为main函数内部可能有函数调用指令，它会改写x30寄存器，因此要先存到栈。sp开辟了32个字节空间，至此，最高的16个字节被写入。


```asm{4}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`add a, b, c`: a = b + c. x29 = sp + 16.设置好了main函数的栈底地址。


```asm{5}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`mov a, b`: a = b. w8寄存器存入数据0.

```asm{6}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`str a, address`: 将a的数据存入到address开始的内存区域，如果a是4个字节，就存入到 address 至 address + 3 的内存区域。相当于把 sp + 4 到 sp + 7 的区域设置为0.


```asm{7}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`stur a, address`: 和 str功能一样，将a的数据存入到address开始的内存区域。wzr是32位寄存器，它总是存储数据0，x29目前等于 sp + 16, 因此意思就是把 sp+12到sp+15的区域设置为0.


```asm{8,9}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
w8寄存器存入数据3.然后w8寄存器的值存入到 sp+8 到 sp+11 的区域。结合c语言源码，当时定义的变量b，对应的就是 sp+8到sp+11的区域。

```asm{10,11}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
`ldr a, address`: 将address开始的内存区域数据存入到寄存器a中，如果a是32位寄存器，那么它存入的就是 address 到 address+3的内存区域数据。现在w0寄存器的数据就是3了。注意到了吗，w0寄存器。是的，根据ABI约定，要调用 hello 函数了，它的第一个参数要存入到 x0寄存器。

`bl _hello`就会跳转到hello函数，同时x30寄存器的值被更新为`ldr w0, [sp, #4]`指令所在的内存地址。

你应该学到了，如果用汇编调用一个C函数，首先要根据ABI约定，将参数放入指定的寄存器，然后执行bl指令即可。



```asm{12}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
将sp+4到sp+7的数据存入到w0, 翻看之前的文字，你就知道sp+4到sp+7的数据是0，现在w0是0了。注意看，又是w0！根据ABI约定，函数返回值是放在x0里边的。没错，w0对应的就是c源码main函数结尾的 `return 0`。


```asm{13}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
ldp是stp的逆向操作，将内存里的值写入到x29和x30寄存器。还记得最开始的时候么，main函数将x29和x30寄存器的值写入到栈，这一步就是将他们还原。为啥呢？因为将要执行`ret`，返回到main函数的调用者了。

```asm{14,15}
_main:                                
	sub	sp, sp, #32                     
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #4]                    
	stur	wzr, [x29, #-4]
	mov	w8, #3                          
	str	w8, [sp, #8]
	ldr	w0, [sp, #8]
	bl	_hello
	ldr	w0, [sp, #4]                    
	ldp	x29, x30, [sp, #16]          
	add	sp, sp, #32
	ret
```
sp = sp + 32.没错，就是你想的那样，释放栈内存。

`ret`会将 x30寄存器的值写入到pc寄存器，返回到main函数的调用者。


稍微看下hello函数，其实结构和main函数一样：
```asm 
_hello:                               
	sub	sp, sp, #32
	stp	x29, x30, [sp, #16]            
	add	x29, sp, #16
	stur	w0, [x29, #-4]
	ldur	w9, [x29, #-4]
                                        
	mov	x8, x9
	mov	x9, sp
	str	x8, [x9]
	adrp	x0, l_.str@PAGE
	add	x0, x0, l_.str@PAGEOFF
	bl	_printf
	ldp	x29, x30, [sp, #16]             
	add	sp, sp, #32
	ret
```

如果让你用汇编写一个C函数，你也该会了：
1. 先减小sp寄存器，开启栈空间。
2. 把x29和x30存入栈。
3. 更新x29寄存器的值 
4. 一些栈上计算工作
5. 计算结果如果是整数，存入到x0寄存器 
6. 恢复x29和x30
7. 恢复sp
8. ret   

## 入参很复杂
### 入参超过8个
```c
#include <stdio.h>

void hello(int a1, int a2, int a3, int a4, int a5, int a6, int a7, int a8, int a9, int a10) {
    printf("Hello, world!\n%d", a9);
}


int main() {
    hello(1,2,3,4,5,6,7,8, 9, 10);

    return 0;
}
```

汇编代码：
```asm 
	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 15, 0	sdk_version 15, 0
	.globl	_hello                          ; -- Begin function hello
	.p2align	2
_hello:                                 ; @hello
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #64
	stp	x29, x30, [sp, #48]             ; 16-byte Folded Spill
	add	x29, sp, #48
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	ldr	w9, [x29, #16]
	ldr	w8, [x29, #20]
	stur	w0, [x29, #-4]
	stur	w1, [x29, #-8]
	stur	w2, [x29, #-12]
	stur	w3, [x29, #-16]
	stur	w4, [x29, #-20]
	str	w5, [sp, #24]
	str	w6, [sp, #20]
	str	w7, [sp, #16]
	str	w9, [sp, #12]
	str	w8, [sp, #8]
	ldr	w9, [sp, #12]
                                        ; implicit-def: $x8
	mov	x8, x9
	mov	x9, sp
	str	x8, [x9]
	adrp	x0, l_.str@PAGE
	add	x0, x0, l_.str@PAGEOFF
	bl	_printf
	ldp	x29, x30, [sp, #48]             ; 16-byte Folded Reload
	add	sp, sp, #64
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #32
	stp	x29, x30, [sp, #16]             ; 16-byte Folded Spill
	add	x29, sp, #16
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #8]                    ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	mov	x9, sp
	mov	w8, #9                          ; =0x9
	str	w8, [x9]
	mov	w8, #10                         ; =0xa
	str	w8, [x9, #4]
	mov	w0, #1                          ; =0x1
	mov	w1, #2                          ; =0x2
	mov	w2, #3                          ; =0x3
	mov	w3, #4                          ; =0x4
	mov	w4, #5                          ; =0x5
	mov	w5, #6                          ; =0x6
	mov	w6, #7                          ; =0x7
	mov	w7, #8                          ; =0x8
	bl	_hello
	ldr	w0, [sp, #8]                    ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #16]             ; 16-byte Folded Reload
	add	sp, sp, #32
	ret
	.cfi_endproc
                                        ; -- End function
	.section	__TEXT,__cstring,cstring_literals
l_.str:                                 ; @.str
	.asciz	"Hello, world!\n%d"

.subsections_via_symbols
```

main函数中，9和10怎么传给hello的：
```asm:line-numbers {8,9,10,11,12}
_main:                                 
	sub	sp, sp, #32
	stp	x29, x30, [sp, #16]             
	add	x29, sp, #16
	mov	w8, #0                          
	str	w8, [sp, #8]                    
	stur	wzr, [x29, #-4]
	mov	x9, sp
	mov	w8, #9                          
	str	w8, [x9]
	mov	w8, #10                         
	str	w8, [x9, #4]
	mov	w0, #1                          ; =0x1
	mov	w1, #2                          ; =0x2
	mov	w2, #3                          ; =0x3
	mov	w3, #4                          ; =0x4
	mov	w4, #5                          ; =0x5
	mov	w5, #6                          ; =0x6
	mov	w6, #7                          ; =0x7
	mov	w7, #8                          ; =0x8
	bl	_hello
	ldr	w0, [sp, #8]                    
	ldp	x29, x30, [sp, #16]             
	add	sp, sp, #32
	ret
```
第8到第10行，入参数据9被存入到 sp 至 sp+3的内存区域；

第11行到第12行，入参数据10被存入到 sp+4到sp+7的内存区域；


看看hello是怎么读取的：
```asm:line-numbers {5,6}
_hello:                             
	sub	sp, sp, #64
	stp	x29, x30, [sp, #48]            
	add	x29, sp, #48
	ldr	w9, [x29, #16]
	ldr	w8, [x29, #20]
	stur	w0, [x29, #-4]
	stur	w1, [x29, #-8]
	stur	w2, [x29, #-12]
	stur	w3, [x29, #-16]
	stur	w4, [x29, #-20]
	str	w5, [sp, #24]
	str	w6, [sp, #20]
	str	w7, [sp, #16]
	str	w9, [sp, #12]
	str	w8, [sp, #8]
	ldr	w9, [sp, #12]
                                        
	mov	x8, x9
	mov	x9, sp
	str	x8, [x9]
	adrp	x0, l_.str@PAGE
	add	x0, x0, l_.str@PAGEOFF
	bl	_printf
	ldp	x29, x30, [sp, #48]             ; 16-byte Folded Reload
	add	sp, sp, #64
	ret
```
第5行读取的入参数据9，第6行读取的入参数据10.

### 入参有一个结构体，结构体大于16字节
```c
#include <stdio.h>

struct A {
    int a;
    int b;
    int c;
    int d;
    int e;
};
void hello(int a1, struct A a) {
    int m = a.a;
}


int main() {
    struct A a = {1, 2, 3, 4, 5};
    hello(1, a);

    return 0;
}
```

汇编：
```asm 
	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 15, 0	sdk_version 15, 0
	.globl	_hello                          ; -- Begin function hello
	.p2align	2
_hello:                                 ; @hello
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #32
	.cfi_def_cfa_offset 32
	str	w0, [sp, #28]
	mov	x8, x1
	str	x8, [sp, #16]
	ldr	w8, [x1]
	str	w8, [sp, #12]
	add	sp, sp, #32
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #96
	stp	x29, x30, [sp, #80]             ; 16-byte Folded Spill
	add	x29, sp, #80
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #12]                   ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	adrp	x8, l___const.main.a@PAGE
	add	x8, x8, l___const.main.a@PAGEOFF
	ldr	q0, [x8]
	stur	q0, [x29, #-32]
	ldr	w8, [x8, #16]
	stur	w8, [x29, #-16]
	ldur	q0, [x29, #-32]
	add	x1, sp, #16
	str	q0, [sp, #16]
	ldur	w8, [x29, #-16]
	str	w8, [sp, #32]
	mov	w0, #1                          ; =0x1
	bl	_hello
	ldr	w0, [sp, #12]                   ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #80]             ; 16-byte Folded Reload
	add	sp, sp, #96
	ret
	.cfi_endproc
                                        ; -- End function
	.section	__TEXT,__const
	.p2align	2, 0x0                          ; @__const.main.a
l___const.main.a:
	.long	1                               ; 0x1
	.long	2                               ; 0x2
	.long	3                               ; 0x3
	.long	4                               ; 0x4
	.long	5                               ; 0x5

.subsections_via_symbols
```

main函数怎么传的结构体：
```asm:line-numbers {15-18}
_main:                                  ; @main
	sub	sp, sp, #96
	stp	x29, x30, [sp, #80]             ; 16-byte Folded Spill
	add	x29, sp, #80
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #12]                   ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	adrp	x8, l___const.main.a@PAGE
	add	x8, x8, l___const.main.a@PAGEOFF
	ldr	q0, [x8]
	stur	q0, [x29, #-32]
	ldr	w8, [x8, #16]
	stur	w8, [x29, #-16]
	ldur	q0, [x29, #-32]
	add	x1, sp, #16
	str	q0, [sp, #16]
	ldur	w8, [x29, #-16]
	str	w8, [sp, #32]
	mov	w0, #1                          ; =0x1
	bl	_hello
	ldr	w0, [sp, #12]                   ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #80]             ; 16-byte Folded Reload
	add	sp, sp, #96
	ret
```
第15行，将 x1 设置为 sp + 16.

第16到第18行，结构体的数据存储在 sp+16到sp+35的内存区域。

hello函数可以利用x1寄存器读取结构体:
```asm:line-numbers {6}
_hello:                                 ; @hello
	sub	sp, sp, #32
	str	w0, [sp, #28]
	mov	x8, x1
	str	x8, [sp, #16]
	ldr	w8, [x1]
	str	w8, [sp, #12]
	add	sp, sp, #32
	ret
```
读取数据到w8。 `[x1]`存储的数据其实就是结构体的字段a的值。


## 返回值是一个结构体，结构体大于16字节
```c  
#include <stdio.h>

struct A {
    int a;
    int b;
    int c;
    int d;
    int e;
};

struct A get(int a) {
    struct A s = {10, 20, 30, 40, 50};
    return s;
}


int main() {
    get(1);
    return 0;
}
```

汇编：
```asm 
	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 15, 0	sdk_version 15, 0                                 
	.globl	_get                            ; -- Begin function get
	.p2align	2
_get:                                   ; @get
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #16
	.cfi_def_cfa_offset 16
	mov	x9, x8
	str	w0, [sp, #12]
	adrp	x8, l___const.get.s@PAGE
	add	x8, x8, l___const.get.s@PAGEOFF
	ldr	q0, [x8]
	str	q0, [x9]
	ldr	w8, [x8, #16]
	str	w8, [x9, #16]
	add	sp, sp, #16
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #48
	stp	x29, x30, [sp, #32]             ; 16-byte Folded Spill
	add	x29, sp, #32
	.cfi_def_cfa w29, 16
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #4]                    ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	add	x8, sp, #8
	mov	w0, #1                          ; =0x1
	bl	_get
	ldr	w0, [sp, #4]                    ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #32]             ; 16-byte Folded Reload
	add	sp, sp, #48
	ret
	.cfi_endproc
                                        ; -- End function
	.section	__TEXT,__const
	.p2align	2, 0x0                          ; @__const.get.s
l___const.get.s:
	.long	10                              ; 0xa
	.long	20                              ; 0x14
	.long	30                              ; 0x1e
	.long	40                              ; 0x28
	.long	50                              ; 0x32

.subsections_via_symbols
```

get函数如何返回的：
```asm:line-numbers {4,9,11}
_get:                                   ; @get
	sub	sp, sp, #16
	.cfi_def_cfa_offset 16
	mov	x9, x8
	str	w0, [sp, #12]
	adrp	x8, l___const.get.s@PAGE
	add	x8, x8, l___const.get.s@PAGEOFF
	ldr	q0, [x8]
	str	q0, [x9]
	ldr	w8, [x8, #16]
	str	w8, [x9, #16]
	add	sp, sp, #16
	ret
```
返回的结构体直接写入到 x9 寄存器指定的位置，而这个位置，是main函数通过设置x8寄存器，告诉x9寄存器的：
```asm:line-numbers {8}
_main:                                  ; @main
	sub	sp, sp, #48
	stp	x29, x30, [sp, #32]             ; 16-byte Folded Spill
	add	x29, sp, #32
	mov	w8, #0                          ; =0x0
	str	w8, [sp, #4]                    ; 4-byte Folded Spill
	stur	wzr, [x29, #-4]
	add	x8, sp, #8
	mov	w0, #1                          ; =0x1
	bl	_get
	ldr	w0, [sp, #4]                    ; 4-byte Folded Reload
	ldp	x29, x30, [sp, #32]             ; 16-byte Folded Reload
	add	sp, sp, #48
	ret
```
main函数通过sp准备好空间，存储结构体数据，没错，就是 sp+8 到 sp+27的内存区域，然后将x8设置为 sp+8, 告诉了get函数。


## 通常场景
上述这么具体的代码，都是编译器搞出来的，我们其实写不到那种地步。最常用的就是知道如何用汇编代码调用一个定义好的C函数。


<Giscus />