---
title: "协程-用C语言实现"
page: true
aside: true
---

## Description
用C语言实现一个协程，纯属是出自好奇心驱使。所完成的代码只用来理解基本原理，不能用作生产环境。

本文讨论的实现，是在aarch64 macOS完成的，编译器用平台自带的gcc。

如果在阅读本文的过程中，感觉有点吃力，可以先阅读[函数调用ABI](/blog/call-abi), 补充前置知识。

## 代码
```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#define STACK_SIZE 1024

typedef struct {
    /** 栈顶寄存器 */
    u_int64_t sp;
    /** 栈底寄存器 */
    u_int64_t x29;
    /** 返回地址寄存器 */
    u_int64_t x30;

    /** 主协程结束，跳回main函数使用 */
    u_int64_t endAddr;
    u_int64_t endSp;
    u_int64_t endX29;
    u_int64_t endX30;

    uint64_t entry;
    u_int8_t* stack;
    size_t size;
    /** 标记协程是否执行完毕 */
    int dead;
} Routine;

typedef void (*Entry)();

/** 记录当前执行的协程 */
Routine* current;

/** 模拟协程池 */
Routine queue[2];

Routine createRoutine(Entry entry) {
    u_int8_t* stack = (u_int8_t*)malloc(STACK_SIZE);
    if (stack == NULL) {
        perror("Failed to allocate stack memory");
        exit(EXIT_FAILURE);
    }
    Routine r;
    uint64_t aligned_sp = (uint64_t)(stack + STACK_SIZE - 1) & ~0xF; // 16字节对齐
    r.sp = aligned_sp;
    r.x29 = aligned_sp;
    r.entry = (uint64_t)entry;
    r.x30 = (uint64_t)entry;
    r.size = STACK_SIZE - 1;
    r.dead = 0;
    r.stack = stack;
    return r;
}

void switchToRoutine(Routine* routine) {
    __asm__ volatile(
        "add %0, sp, #32\n\t"
        "mov %1, x29\n\t"
        "mov %2, x30\n\t"
        : "=r"(current->sp), "=r"(current->x29), "=r"(current->x30)
        :
        :"memory"
    );
    current = routine;
    __asm__ volatile(
        "ldr x10, [%0]\n\t"
        "mov sp, x10\n\t"
        "ldr x29, [%1]\n\t"
        "ldr x30, [%2]\n\t"
        "ret\n\t"
        :
        :"r"(&current->sp), "r"(&current->x29), "r"(&current->x30)
        :"x10", "x30", "memory"
    );
}

void queueOneDead() {
    queue[1].dead = 1;
}

Routine* queueZero() {
    return &queue[0];
}

Routine* queueOne() {
    return &queue[1];
}

void hello() {
    printf("hello\n");

    switchToRoutine(&queue[0]);

    printf("world\n");

    // 标记协程结束；
    // 之所以放在一个函数中完成，是因为编译器会优化代码，
    // 将 queue[1] 写入栈中，当写入queue[1]时，并不会
    // 更新全局作用域的queue[1], 而是更新栈上的内容；
    // 这会调至 switchToRoutine 跳转到另一个协程时，
    // 出现问题。
    queueOneDead();

    switchToRoutine(queueZero());
}

void mainRoutineEntry() {
    while(1) {
        printf("enter main routine\n");
        // 模拟调度逻辑

        // 模拟结束调度的条件，目前我们是一个协程，
        // 如果多个协程，改用循环语句判断
        if (queue[1].dead == 1) {
            printf("yes\n");
            Routine* a = queueZero();
            __asm__ volatile(
                "mov sp, %0\n\t"
                "mov x29, %1\n\t"
                "mov x30, %2\n\t"
                "ret\n\t"
                :
                :"r"(a->endSp), "r"(a->endX29), "r"(a->endX30)
            );
        } else {
            // 模拟选中下一个协程，切换过去
            switchToRoutine(&queue[1]);
        }
    }
};

void execute() {
    __asm__ volatile(
        "add sp, sp, #16\n\t"
        "mov x10, sp\n\t"
        "str x10, [%0]\n\t"
        "str x29, [%1]\n\t"
        "str x30, [%2]\n\t"

        "ldr x10, [%3]\n\t"
        "mov sp, x10\n\t"
        "ldr x29, [%4]\n\t"
        "ldr x30, [%5]\n\t"
        "ret\n\t"
        :
        :"r"(&queue[0].endSp), "r"(&queue[0].endX29), "r"(&queue[0].endX30),"r"(&queue[0].sp), "r"(&queue[0].x29), "r"(&queue[0].x30)
        :"x10", "x30", "memory"
    );
}

int main() {
    Routine routine = createRoutine(hello);
    Routine Main = createRoutine(mainRoutineEntry);

    queue[0] = Main;
    queue[1] = routine;

    current = &queue[0];
    execute();
    
    printf("ok, that's right\n");

    free((void *)(routine.stack));
    free((void*)(Main.stack));

    printf("wow\n");

    return 0;
}
```

```shell
gcc main.c -o main
./main
```

输出结果：
```txt
enter main routine
hello
enter main routine
world
enter main routine
yes
ok, that's right
wow
```

## 协程的设计
协程必须掌握以下的信息：
- 代码从哪一个指令开始执行
- 执行代码的栈是什么状态

上述代码设计的结构体，都是围绕着这点实现的。

为了解决栈的问题，我们要用 malloc 开辟一段内存空间，把这段内存空间作为栈使用，为了控制这段内存空间，就要用stack记录指向内存空间的指针，free释放内存的时候，stack就派上了用场。

为了知道栈顶和栈底，我们要用 sp 记录 sp寄存器的数据，跟踪栈顶，用 x29 记录 x29寄存器，跟踪栈底。

为了解决代码从哪个指令执行的问题，我们用x30记录x30寄存器的值。因为ret执行的时候，会读取x30寄存器里的指令地址，然后跳转过去，因此我们追踪x30寄存器，就能控制程序跳转到哪个指令继续执行。

当协程每次触发上下文切换的时候，我们需要一个角色来判断，接下来要执行哪个协程。当所有的协程都执行完毕，这个调度协程就要完成结束程序的工作。为了方便它知道哪些协程执行完毕，我们使用了字段dead标记协程是否结束。结束程序的工作是在main函数里完成的，因此，必须要让调度协程可以切回到main函数，继续执行，为此我们使用 endSp, endX29, endX30, 记录main函数被切走时的状态，方便调度协程再切回来。


## 要点
### 自定义的栈要16字节对齐
我们使用malloc拉取一段内存空间，只要将sp寄存器的值写成这段内存中的某个地址，那么程序执行的时候，就会在这段内存空间里计算。但是sp指向的地址有讲究，必须按照16字节对齐，所以malloc直接返回的地址不能直接用。

还有一点是，sp和x29在最开始的时候，指向同一个地址。因为当C函数执行时，编译器往往给出的编译后的第一句指令，就是减小sp。如果将sp设置为malloc返回的地址，那就溢出了。

### 全局变量的修改，放在单独的函数里执行
我们的全局变量，存储在程序的数据段。但是在函数内访问的时候，编译器给出的汇编代码会将全局数据存储到寄存器里，然后再由寄存器存储到对应的函数栈。如果你直接修改全局变量，你修改的只是这个变量的拷贝，不是本体，当另外一个协程从新读取全局变量的时候，数据不一致了，就会影响到这个协程内部的if判断，就会出现问题。

如果放在函数里，编译器不会做出这么好的优化，你所修改的，就是全局变量本体。因此，你会看到上述代码里有`queueOneDead`函数。

### 上下文切换
关于上下文切换，核心要点就是存储sp和x30的准确值。

先看一个问题，发生切换的时候，如何读取当前协程执行的指令的地址？很遗憾，处于安全考虑，aarch64体系中没有提供一则指令，直接读取PC寄存器的值。我们只能间接读取。如何间接读取呢？方法很简单：
```c
void doSomething() {
    // 在这个函数中，使用内联汇编访问x30寄存器，
    // 读取到的就是下边 int a= 10 的指令的地址！
}

void hello() {
    doSomething();
    int a = 10;
}
```
上下文切换包括一步存储，一步切换。

存储要做的事情：
- 记录下要离开的协程的sp寄存器和x29寄存器的值
- 记录下再次回来时，协程要执行的指令地址（用上述方法从x30寄存器读取）

切换要做的事情：
- 将下一个协程的sp, x29字段值写入 sp 寄存器和x29寄存器
- 将下一个协程的x30字段值写入x30寄存器，然后调用`ret`跳转过去


经过这么一分析，上下文切换的函数架子就出来了：
```c
void switchToRoutine(Routine* routine) {
    // 第一步，存储
    //
    // 用内联汇编读取 x30 寄存器的值，这个值就是
    // printf("yes\n") 的指令的地址！
    //
    // 用内联汇编读取 sp 寄存器的值，这个值可不一定是
    // hello 函数执行 switchToRoutine 时的栈顶！
    // 原因是，在编译器编译 switchToRoutine 的时候，
    // 会在你的内联汇编代码的前边，加入修改sp寄存器的
    // 汇编代码！你需要看看switchToRoutine的汇编代码
    // 长什么样子，然后看看里边有没有修改sp的指令，如果
    // 只有一步做出了修改，假设是 sub sp, sp, #32 的指令，
    // 你要存储的可不是sp，而是 sp + 32 的值！
    //
    // x29寄存器直接读取即可，编译后的代码里是不会像sp那样修改它的。
    
    // 第二步，切换
    // 只有调度协程知道，下一个要执行的协程是谁，因此切换的时候，
    // 固定写死，切换到调度协程即可，将该协程的sp x29 x30写入
    // 到寄存器即可。
    // 为什么是写入 x30寄存器后，执行 ret ？
    // 为什么不是调用 br 直接跳过去呢？
    // 采用 br 的话，br 会把它下一句指令的地址写入到x30寄存器，
    // 可我们知道，我们就是想切换到另一个协程，和当前协程彻底说拜拜，
    // 根本不会再执行什么指令。那么br就不合适了

}

void hello() {
    printf("ok\n");

    switchToRoutine(&queue[0]);

    printf("yes\n");
}
```

## 写内联汇编遇到的问题
### 基础语法
```c
void hello() {
    __asm__ volatile(
        "指令1\n\t"
        "指令2\n\t"

        "指令N\n\t"
        : 输出绑定
        : 输入绑定
        : 一些辅助参数
    );
}
```

例子：
```c
void hello(int a, int b, int c, int d) {
    __asm__ volatile(
        "mov x4, %1\n\t"
        "mov x5, %2\n\t"
        "add x5, x4, x5\n\t"
        "str x5, [%3]\n\t"
        "mov %0, x5\n\t"
        :"=r"(d)
        :"r"(a), "r"(b), "r"(&c)
        :"memory", "x4", "x5"
    );
}
```
上述做的事情就是: c = a + b, d = a + b;

"=r"(d)，表示 %0 的寄存器的值，最终要写入到 d 中；

'"r"(a)'， 表示 %1的寄存区的初始值来自于变量a；

‘“memory”, "x4", "x5"’ 告诉编译器，内联汇编修改了内存和x4寄存器、x5寄存器，优化的时候要小心点。


### 寄存器冲突
看过上述例子，你肯定迷惑：变量 a 到底是和哪个寄存器对应呢？

答案是，由编译器决定。尽管有%0和%1的分别，但很有可能二者对应的是同一个寄存器。这种情况就糟糕了，会引发严重的错误，比如把本该写入到x30寄存器的值，也写入到了sp寄存器，结果内存地址非法，程序死掉。

当你要绑定的变量越多时（上个例子有4个，其实也不少了），寄存器冲突的概率就越大。

解决方法就是用具体寄存器完成操作。

比如之前:
```c
void hello(int a, int b, int c, int d) {
    __asm__ volatile(
        "mov x4, %1\n\t"             // [!code highlight]
        "mov x5, %2\n\t"
        "add x5, x4, x5\n\t"
        "str x5, [%3]\n\t"
        "mov %0, x5\n\t"
        :"=r"(d)
        :"r"(a), "r"(b), "r"(&c)
        :"memory", "x4", "x5"
    );
}
```
直接将 %1 送入 x4 寄存器。

现在要改为：
```c
void hello(int a, int b, int c, int d) {
    __asm__ volatile(
        "mov x8, %1\n\t"             // [!code highlight]
        "mov x4, x8\n\t"             // [!code highlight]
        "mov x8, %2\n\t"             // [!code highlight]
        "move x5, x8\n\t"            // [!code highlight]
        "add x5, x4, x5\n\t"
        "str x5, [%3]\n\t"
        "mov %0, x5\n\t"
        :"=r"(d)
        :"r"(a), "r"(b), "r"(&c)
        :"memory", "x4", "x5", "x8"  // [!code highlight]
    );
}
```

用 x8 寄存器转送。

### 平凡又致命的指令
```asm
stp	x29, x30, [sp, #-16]!  
```
在实现协程的时候，我被内存非法访问的问题困扰许久，最终发现是sp寄存器读取之后，没有调整导致的，原因就是我看到上述生成的汇编指令后，没有发现 sp 被修改了！

没错，上述指令非常具有迷惑性，`[sp, #-16]!` 不是单纯的计算了 sp - 16, 还做了 sp = sp - 16 的改动！


## 缺陷
开头给出的代码并不完美，缺陷在于 hello 函数内部直接访问了 queue。实际上，hello函数要做到对queue透明，不知道 queue 的存在。为此，必须给出一个函数，对hello函数进行封装：
```C
typedef void (*Entry)();

void wrapper(Entry entry) {
    entry();

    queueOneDead();
    switchToRoutine(queueZero());
}
```
然后协程的entry字段指向 wrapper。容我以后有时间再捣鼓捣鼓吧。


<Giscus />