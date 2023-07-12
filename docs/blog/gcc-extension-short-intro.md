---
title: "几个clang/gcc常见扩展功能"
page: true
aside: true
---

# 几个clang/gcc常见扩展功能

## 前言
近些年发现前端在性能提升方向上开卷，各路大佬纷纷技出，使用Golang\Rust\Zig这样的高性能编程工具重塑前端一些重要的领域，比如打包器、编译器等等。这不免得令我重新燃起对系统编程语言的好奇之心。
> 系统编程语言的概念众说纷纭。
> - 有的人觉得高性能无GC就是系统编程语言
> - 有的人觉得能写出操作系统的编程语言是系统编程语言
> - 有的人认为能搭建起一套功能系统的编程语言就是系统编程语言，和有没有GC无关
> - 有的人觉得编译为机器码的语言就是系统编程语言
> 
> 我个人而言，倾向于第一种看法。

诚然在学期间，循规蹈矩使用C语言入门编程，但搁置许久，仅仅记得常见的语法。

最近写了一篇关于`ps`的[小文章](https://juejin.cn/post/7231932399102083128), 中间看到.h文件里使用了一些令我感觉很新奇的C语法，经调查发现都是`c编译器（clang或者gcc）的扩展功能`，于是打算做一番记录。

话不多说，开整。

## variadic macros
你理解的C语言宏可能是这样：
```c
#define max_value 20
#define name hello
```
实际上，还可以加入参数：
```c
#define is_bigger(a,b) (a > b)
```
甚至，参数也能是可变参数：
```c
#define biggest(...) ({ int max = 0; int args[] = { __VA_ARGS__ }; \
                  for(int i = 0; i < sizeof(args)/sizeof(int); i++) { \
                      if (args[i] > max) \
                           max = args[i]; \
                  } \
                  max; })
```
> 我们使用 `...` 定义可变参数，使用 `__VA_ARGS__` 获取可变参数


## statement expressions
曾经我看到Rust可以这样赋值时，非常震撼：
```Rust
let num = {
    let mut i = 0;
    for item in 0..=5 {
        i += item;
    }
    if i > 10 {
        i
    } else {
        10
    }
};
```
其实C也是可以玩出来的：
```c
int num = ({
      int i = 0;
      for (int num = 0; num <= 5; num++) {
         i += num;
      }
      i > 10 ? i : 10;
});
```
不过C语言会有很多限制：
- 代码块必须被`({})`包裹；
- 代码块中可以有`if` `else` `for`，但是不能有`return`;
- 代码块里必须都是表达式，可以有函数调用；
- 最后一个`;`前的表达式结果，就是整个代码块最终值；


Rust是可以有`return`的：
```Rust
let num = {
    let mut i = 0;
    for item in 0..=5 {
        i += item;
    }
    return i;
};
```

## function attributes
```c
__attribute__((pure))
void show() {
  printf("hello");
}
```

`__attribute__((pure))`告诉编译器，函数`show`是纯函数，只和全局变量和函数入参有关，不会影响到别的地方，在代码优化的时候，可以凭此尽可能优化；

除了`pure`，还有下面几个选项：
- `noreturn`
- `const`: 不会修改函数栈以外的任何值
- `always_inline`
- `flatten`: 如果可以的话，可以将函数的body部分插入到上层调用的函数中
- `hot`: 表示函数在代码里执行频率非常高；
- `cold`

## type attribute
```c
struct data {
        int age;
        char name;
} __attribute__((packed))；
```
`__attribute__((packed))`要求结构体内的数据紧密靠拢，也就是不采取对齐的方式，此时data的大小就是5字节。

除了`packed`， 还有如下的选项值：
- `unused`: 如果结构体没有使用，不会抛出warning信息
- `aligned(16)`: 要求结构体按照16字节对齐
- `transparent_union`: 修饰union类型


## designed initializers
你可能总是这样定义数组
```c
int m[] = {2, 4, 5};
int k[5];
```
实际上， 你还可以这样：
```c
int t[3] = { [0] = 7, [1] = 3 };
```

## compound literals
你可能这样初始化一个结构体:
```c
struct data {
    int age;
    char* name;
};

int main() {
   struct data mine;
   mine.age = 4;
   mine.name = "hello";
   
   struct data yours = { 4, "hi" };
   return 0;
}
```
实际上，你可以这样：
```c
struct data {
   int age;
   char* name;
};

int main() {
   struct data mine = { .name = "hello", .age = 4 };
   return 0;
}
```
但你**不能**像Rust或者Typescript那样：
```c
struct data {
   int age;
   char* name;
};

int main() {
   struct data mine = { name: "hello", age: 4 };
   return 0;
}
```

## 最后闲聊
我目前遇到的clang特性就这些，以后遇到了别的了再更新，其他特性可以查看[官网文档](https://clang.llvm.org/docs/)。

有的同学可能不太清楚前端学习C的必要性。除了开头说到的趋势外，在前端开发场景中还是会接触到C的。

比如编写`nodejs程序`，可能要编写定制化扩展`.node`, 这时就要使用C/Cpp或者Rust了。

比如编写`webassembly程序`，用js去加载使用，但是编写的时候就要用C/Cpp,即便你使用了别的语言，比如Go或者Rust,但是它们的数据类型都必须向C语言格式看齐，C语言显然已经成为一种ABI，一种标准。

比如写vscode插件的时候，有些项目就不想使用默认的node库去完成http请求，而是使用Rust去实现，然后转换为webassembly供vscode插件调用。

比如项目构建的时候，传统都是用webpack\rollup这样的工具搞定，可看到vite这类具有代表性的项目中已经在使用`esbuild`(written in Go)工具了，你多少就会知道趋势是怎样的。

我比较看好Rust。刚学习的时候，就发现这东西长得和js\ts很像，接触一段时间了，我就觉得rs、ts、js的关系就是大哥、二哥和三弟的关系。但是吧，你在使用Rust的时候，还要接触到rust编译器的不少配置项，这些配置项背后大多牵扯到clang, gcc的东西。所以吧，还是建议重拾c语言，辅以Rust，拥抱未来。


<Giscus />