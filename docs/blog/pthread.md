---
title: "Talk about pthread"
page: true
aside: true
---

# Talk about pthread 
pthread是在Unix操作系统编写多线程代码的库。如果你使用c或者c++编写多线程的代码，肯定遇见过它。它的API实在不怎么优雅，以至于用它编写多线程代码，开发体验很差。

但是，有一些关于pthread的问题非常有趣：
1. pthread是由操作系统开发者提供的么？
2. pthread在创建线程、控制线程的时候，依赖system call么？
3. 普通开发者可不可以写一个自己的pthread库？

## pthread和操作系统
pthread并不是操作系统的一部分，但是操作系统的厂商，为了让开发者编写多线程程序，会按照pthread标准，提供pthread库。因此，可以简单理解为，pthread是由操作系统开发者提供的。

## pthread和system call 
pthread库自身无法独立创建出线程，它必须依赖system call。以macOS的pthread实现为例，pthread库会为线程做好抽象，用 pthread_t 来表示线程，但它仅仅是常规的C结构体，里边记录了一些数据而已，比如线程的一些属性设置，线程入口函数的指针，线程入口函数的入参等等。它不过是提供一层抽象，将线程有关的信息整理好，然后送入到system call中，创建、控制线程。

## 开发pthread库 
普通开发者在掌握线程相关方面的system call后，是可以自己封装一套pthread库的。最大的难度，就是查找system call都有哪些。很遗憾，关于这点，很多操作系统厂商没有公开太详尽的开发者文档，你只能从他们的源代码中寻找线索。举个macOS的例子。pthread库中，有等待互斥锁的实现，如果拿到锁，线程继续执行，否则线程挂起。让线程挂起，一定要依赖system call，这个system call就是 __ulock_wait 函数。这个函数在哪里呢？在libSystem.dylib中。但很可惜，macOS没有提供任何的c头文件，给出 __ulock_wait 的声明。如果不去看darwin的源码，你根本不会知道libSystem.dylib中还会有这样的函数！但是开源拥有无穷的智慧，一位开发者创建了一个Rust crate——[ulock_sys](https://docs.rs/ulock-sys/latest/ulock_sys/fn.__ulock_wait.html), 在其文档中介绍了 __ulock_wait 这种情况。在关于zig源码的[issue讨论](https://github.com/odin-lang/Odin/issues/1959)中，大家也提到了 __ulock_wait 是怎么一回事儿。

我实在钦佩zig作者为代表的开发者，他们对于各平台system call非常熟悉，而且拥有超凡的搜索能力。

如果你对macOS的pthread实现感兴趣，可以阅读[源码](https://github.com/apple-oss-distributions/libpthread/blob/c032e0b076700a0a47db75528a282b8d3a06531a/src/imports_internal.h#L77)。

最后，再举个system call的例子：
```cpp 
#include <iostream>
extern int __pthread_canceled(int);
int main() {
    std::cout << "out: 0x" << std::hex << (uintptr_t)(char*)__pthread_canceled << std::endl;
    return 0;
}
```
```shell 
g++ main.cpp -o main
```
会有一行报错：
```txt 
Undefined symbols for architecture arm64:
  "__pthread_canceled(int)", referenced from:
      _main in main-e1355f.o
   NOTE: found '___pthread_canceled' in libsystem_kernel.tbd, declaration possibly missing 'extern "C"'
ld: symbol(s) not found for architecture arm64
```
意思是说链接器发现`libsystem_kernel.tbd`中定义了`___pthread_canceled`, 但你cpp代码里的声明不对，为了防止cpp编译器将名称重写，应该用`extern "C"` 修饰。改完之后，编译成功，打印出了函数地址！看吧，这些system call函数没有c头文件声明，都隐藏在各种库里边，如果不是操作系统的开发人员，你还真没法儿知道里边的门道儿。