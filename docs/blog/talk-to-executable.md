---
title: "和二进制文件打交道"
page: true
aside: true
---

## Description
待补充

## 动态链接和静态链接
### 静态库
:::code-group 
```c [src/static-util/util.c]
#include "./util.h"
#include "stdio.h"

void hello() {
    printf("hello friends\n");
}

int find(const char* source, char dest) {
    for ( int i = 0; source[i] != '\0'; i++) {
        if (source[i] == dest) return i;
    }
    return -1;
}

```

```c [src/static-util/util.h]
#ifndef __My_Util
#define __My_Util
void hello();
int find(const char* source, char dest);
#endif
```

```c [src/main.c]
#include <util.h>
#include <stdio.h>


int main() {
    hello();
    int index = find("Jack", 'c');
    if (index != -1) {
        printf("index: %d\n", index);
    }
}
```
:::

生成静态库：
```shell 
gcc -c src/static-util/util.c -o src/static-util/util.o
ar r libutil.a src/static-util/util.o
```
> 在 unix 上静态文件 .a 后缀，在Windows是.lib后缀
> 文件名是 lib{静态库名}

使用静态库：
```shell 
gcc -o main -I "src/static-util" -L "src/static-util" -lutil src/main.c && ./main

# 或者
gcc -o main -I "src/static-util" src/main.c src/static-util/libutil.a && ./main
```
> -I 指定`include <a.h>`的时候，到哪个文件夹去找`a.h`文件
> -L 指定 寻找静态库的时候，到哪个文件夹去找
> -l 指定静态库文件名，此时lib和.a后缀可省略

### 动态库
:::code-group 
```c [src/dyn-util/util.c]

#include "./util.h"
#include "stdio.h"

void hello() {
    printf("hello friends\n");
}

int find(const char* source, char dest) {
    for ( int i = 0; source[i] != '\0'; i++) {
        if (source[i] == dest) return i;
    }
    return -1;
}

```

```c [src/dyn-util/util.h]
#ifndef __My_Util
#define __My_Util
void hello();
int find(const char* source, char dest);
#endif
```

```c [src/main.c]
#include <util.h>
#include <stdio.h>


int main() {
    hello();
    int index = find("Jack", 'c');
    if (index != -1) {
        printf("index: %d\n", index);
    }
}
```
:::

生成动态库：
```shell 
gcc -fPIC -shared -o src/dyn-util/libutil.dylib src/dyn-util/util.c
```
> 动态链接库名格式为 lib{库名}.{后缀};
> linux的后缀是 so;
> Mac的后缀是 dylib;
> Windows的后缀是 dll;
> -fPIC 中 PIC的含义是`Position Independent Code`;

使用动态库:
```shell 
gcc -I "src/dyn-util" -L "src/dyn-util" -lutil -Wl,-rpath,$PWD/src/dyn-util -o main src/main.c && ./main
```
> -Wl, -rpath, $PWD/src/dyn-util 指定动态连接器的搜索路径，可以阅读[rust编译出来的executable file比cpp大](/blog/rust-binary-is-big)

如果你将上边生成的main文件移动到别的目录下，并在该目录下执行，就会报错，错误大致的意思是找不到动态链接库：
```shell 
cp main src/main 
cd src 
./main
```
解决方法是，改用下边的指令生成动态链接库：
```shell 
gcc -install_name @rpath/libutil.dylib -fPIC -shared -o src/dyn-util/libutil.dylib src/dyn-util/util.c
```

生成动态链接库时，默认的注册名时./libutil.dylib, 但不知道为什么，macOS平台中，dyld使用可执行程序的当前工作目录或者DYLD_LIBRARY_PATH环境变量指定的目录，作为这个相对路径的参考目录，使用gcc -Wl.-rpath设置的动态链接库搜索目录将无效。为了解决这个问题，你要设置 -install_name, 告诉dyld，动链接库是rpath目录下的libutil.dylib文件.

-install_name是macOS特有的配置项，在 Linux 上，类似的功能可以通过 -soname 选项来实现：
```shell
gcc -shared -o libexample.so.1.0 source.c -Wl,-soname,libexample.so.1
```

:::tip <TipIcon />
在 macOS 系统上，动态链接库的搜索路径有一定的优先级排序。搜索逻辑和优先级如下：
1. **@executable_path**：首先搜索可执行文件所在的目录。
2. **@loader_path**：其次搜索加载该动态库的库所在的目录。
3. **@rpath**：然后搜索运行路径（rpath），可以在编译时或运行时指定。
4. **DYLD_LIBRARY_PATH**：接着搜索由 DYLD_LIBRARY_PATH 环境变量指定的目录。
5. **DYLD_FALLBACK_LIBRARY_PATH**：如果前面的路径都没有找到，则搜索 DYLD_FALLBACK_LIBRARY_PATH 环境变量指定的目录。默认值为 /usr/local/lib 和 /usr/lib。
6. 系统默认路径：最后搜索系统默认的库路径，如 /usr/lib
:::

## 查看可执行程序

## 调试可执行程序