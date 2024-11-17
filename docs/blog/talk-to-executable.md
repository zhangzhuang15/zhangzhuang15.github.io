---
title: "和二进制文件打交道"
page: true
aside: true
---

## c工具链 
### GNU工具链组成
* binutils: 二进制工具包，包含 `assembler` `linker` `readelf`
* gcc: 编译器 
* C库：基于POSIX的标准化API
  
工具链是在具体一个平台上使用的，所以按照不同平台，工具链有不同实现。CPU架构 + 供应商 + 操作系统内核 确定了一个平台。
在使用 binutils 的时候，必须下载正确平台的binutils实现。

### C库种类
glibc: 标准的GNU C库，非常大，最完整的POSIX API实现；

musl libc： 轻小的C库实现；

uClibc-ng: 微控器的C库；

eglibc： glibc的分支，用于嵌入式应用。

### C库的组成
libc：最常用的POSIX函数，如printf，open，close，read，write等

libm：数学函数，如cos，exp，log

libpthread: POSIX线程函数；

librt: POSIX的real-time扩展，包括shared memory和asynchronous I/O

### C库的使用
当用gcc编译的时候，可以不用指明libc，这个应该是gcc会自动去引入的，其他的需要用-l指明，比如引入 libm, 就要指定 -lm.

### gcc
光有上边的函数库还不行，还要有编译器。
编译器里边也包括连接器。
有 gnu 版本 和 musl 版本。
> gnu版本对c的支持非常全，musl版本更加轻量，而且采用静态编译。

编译器的实现和CPU架构、操作系统相关。在交叉编译的时候，要用到指定CPU架构操作系统下的连接器。

### binutils
二进制文件的工具包。

因为我们用gcc将代码编译成二进制文件后，仍需要一些工具帮助我们阅读、分析二进制文件的信息。这个工具包内就提供了这些工具。

通常这是一系列二进制工具小程序的集合。

包括 `readelf` `nm` `hexdump` `strip` 等工具。

## gcc的基本使用
```shell 
# 生成汇编代码
gcc -S main.c -o main.s

# 生成目标文件
gcc -c main.c -o main.o 

# 只做c语言的预处理
gcc -E main.c -o main.i
```

### 默认到哪里寻找被include的头文件
```shell 
gcc -x c -v -E /dev/null 
```
> `-x c` 的意思是，把 `/dev/null` 当作c文件处理
>
> `-v` 的意思是，让gcc输出它接下来的每个执行步骤

output:
```txt 
Apple clang version 16.0.0 (clang-1600.0.26.3)
Target: arm64-apple-darwin24.0.0
Thread model: posix
InstalledDir: /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin
 "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang" -cc1 -triple arm64-apple-macosx15.0.0 -Wundef-prefix=TARGET_OS_ -Wdeprecated-objc-isa-usage -Werror=deprecated-objc-isa-usage -Werror=implicit-function-declaration -E -disable-free -clear-ast-before-backend -disable-llvm-verifier -discard-value-names -main-file-name null -mrelocation-model pic -pic-level 2 -mframe-pointer=non-leaf -fno-strict-return -ffp-contract=on -fno-rounding-math -funwind-tables=1 -fobjc-msgsend-selector-stubs -target-sdk-version=15.0 -fvisibility-inlines-hidden-static-local-var -fno-modulemap-allow-subdirectory-search -target-cpu apple-m1 -target-feature +v8.5a -target-feature +aes -target-feature +crc -target-feature +dotprod -target-feature +fp-armv8 -target-feature +fp16fml -target-feature +lse -target-feature +ras -target-feature +rcpc -target-feature +rdm -target-feature +sha2 -target-feature +sha3 -target-feature +neon -target-feature +zcm -target-feature +zcz -target-feature +fullfp16 -target-abi darwinpcs -debugger-tuning=lldb -target-linker-version 1115.7.3 -v -fcoverage-compilation-dir=/Users/zhangzhuang/Project -resource-dir /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/16 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk -I/usr/local/include -internal-isystem /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include -internal-isystem /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/16/include -internal-externc-isystem /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include -internal-externc-isystem /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include -Wno-reorder-init-list -Wno-implicit-int-float-conversion -Wno-c99-designator -Wno-final-dtor-non-final-class -Wno-extra-semi-stmt -Wno-misleading-indentation -Wno-quoted-include-in-framework-header -Wno-implicit-fallthrough -Wno-enum-enum-conversion -Wno-enum-float-conversion -Wno-elaborated-enum-base -Wno-reserved-identifier -Wno-gnu-folding-constant -fdebug-compilation-dir=/Users/zhangzhuang/Project -ferror-limit 19 -stack-protector 1 -fstack-check -mdarwin-stkchk-strong-link -fblocks -fencode-extended-block-signature -fregister-global-dtors-with-atexit -fgnuc-version=4.2.1 -fmax-type-align=16 -fcommon -fcolor-diagnostics -clang-vendor-feature=+disableNonDependentMemberExprInCurrentInstantiation -fno-odr-hash-protocols -clang-vendor-feature=+enableAggressiveVLAFolding -clang-vendor-feature=+revert09abecef7bbf -clang-vendor-feature=+thisNoAlignAttr -clang-vendor-feature=+thisNoNullAttr -clang-vendor-feature=+disableAtImportPrivateFrameworkInImplementationError -D__GCC_HAVE_DWARF2_CFI_ASM=1 -o - -x c /dev/null
clang -cc1 version 16.0.0 (clang-1600.0.26.3) default target arm64-apple-darwin24.0.0
ignoring nonexistent directory "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include"
ignoring nonexistent directory "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/Library/Frameworks"
#include "..." search starts here:
#include <...> search starts here:
 /usr/local/include
 /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/16/include
 /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include
 /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include
 /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks (framework directory)
End of search list.
# 1 "/dev/null"
# 1 "<built-in>" 1
# 1 "<built-in>" 3
# 424 "<built-in>" 3
# 1 "<command line>" 1
# 1 "<built-in>" 2
# 1 "/dev/null" 2
```
`#include <...> search starts here:` 后边就是我们想要的内容。

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
> 
> -L 指定 寻找静态库的时候，到哪个文件夹去找
> 
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
> -Wl, -rpath, $PWD/src/dyn-util 指定动态连接器的搜索路径，可以阅读[rust编译出来的executable file比cpp大](/blog/rust-binary-is-big)了解更多

如果你将上边生成的main文件移动到别的目录下，并在该目录下执行，就会报错，错误大致的意思是找不到动态链接库：
```shell 
cp main src/main 
cd src 
./main
```
解决方法是，改用下边的指令生成之前的动态链接库：
```shell 
gcc -install_name @rpath/libutil.dylib -fPIC -shared -o src/dyn-util/libutil.dylib src/dyn-util/util.c
```

生成动态链接库时，默认的注册名是`./libutil.dylib`, 但不知道为什么，macOS平台中，dyld使用可执行程序的当前工作目录或者`DYLD_LIBRARY_PATH`环境变量指定的目录，作为这个相对路径的参考目录，使用`gcc -Wl.-rpath`设置的动态链接库搜索目录将无效。为了解决这个问题，你要设置 `-install_name`, 告诉dyld，动链接库是rpath目录下的libutil.dylib文件.
> dyld是动态链接器。编译程序的最后一步是链接，这个工作由静态链接器 ld 完成。而 dyld 是在操作系统加载可执行程序时，调用的一个程序，它由操作系统给出，不是编译器工具的一部分。

`-install_name`是macOS特有的配置项，在 Linux 上，类似的功能可以通过 `-soname` 选项来实现：
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

### 静态链接器ld默认去哪里搜索库
执行`man ld`，文档里面有写。

默认会到这里找库：
1. /usr/lib 
2. /usr/local/lib

没有找到的话，如果你在编译的时候，通过gcc的`-L`指定其他目录，就会依次尝试在这些目录里继续寻找。

默认会到这里找框架(framework):
1. /Library/Frameworks 
2. /System/Library/Frameworks

没有找到的话，如果你在编译的时候，通过gcc的`-F`指定其他目录，就会依次尝试在这些目录里继续寻找。

## 查看可执行程序
可执行程序也是一种文件，但它比较特殊，无法像一般的文本文件查看，需要用专门的工具查看。

- **nm**: 查看可执行程序的符号表
- **objdump**: 查看目标文件或者可执行文件的工具，常用于linux, macOS上也有
- **readelf**: 查看类型为elf格式的可执行文件，常用于linux
- **otool**: 查看macOS可执行文件和目标文件

接下来给出一些示例, 在直观上有些感知。

### 准备
源码：
```c  
#include <stdio.h>

void hello() {};

void world();

const int M = 10;

int main() {
    const char* p = "Peter";
    printf("hello world %s", p);
    return 0;
}
```

编译：
```shell
gcc main.c -o main 
```

### 查看可执行文件的格式
```shell 
file main
```
output:
```txt 
main: Mach-O 64-bit executable arm64
```

### nm查看符号
```shell 
nm main
```
output:
```txt 
0000000100003f84 S _M
0000000100000000 T __mh_execute_header
0000000100003f28 T _hello
0000000100003f2c T _main
                 U _printf
```

### 查看可执行文件的文件头
```shell 
otool -h main
```
output:
```txt 
main:
Mach header
      magic  cputype cpusubtype  caps    filetype ncmds sizeofcmds      flags
 0xfeedfacf 16777228          0  0x00           2    17       1136 0x00200085
```

### 查看动态链接器的加载配置信息
```shell 
otool -l main
```
output:
```txt 
main:
Load command 0
      cmd LC_SEGMENT_64
  cmdsize 72
  segname __PAGEZERO
   vmaddr 0x0000000000000000
   vmsize 0x0000000100000000
  fileoff 0
 filesize 0
  maxprot 0x00000000
 initprot 0x00000000
   nsects 0
    flags 0x0
Load command 1
      cmd LC_SEGMENT_64
  cmdsize 472
  segname __TEXT
   vmaddr 0x0000000100000000
   vmsize 0x0000000000004000
  fileoff 0
 filesize 16384
  maxprot 0x00000005
 initprot 0x00000005
   nsects 5
    flags 0x0
Section
  sectname __text
   segname __TEXT
      addr 0x0000000100003f28
      size 0x0000000000000050
    offset 16168
     align 2^2 (4)
    reloff 0
    nreloc 0
     flags 0x80000400
 reserved1 0
 reserved2 0
Section
  sectname __stubs
   segname __TEXT
      addr 0x0000000100003f78
      size 0x000000000000000c
    offset 16248
     align 2^2 (4)
    reloff 0
    nreloc 0
     flags 0x80000408
 reserved1 0 (index into indirect symbol table)
 reserved2 12 (size of stubs)
Section
  sectname __const
   segname __TEXT
      addr 0x0000000100003f84
      size 0x0000000000000004
    offset 16260
     align 2^2 (4)
    reloff 0
    nreloc 0
     flags 0x00000000
 reserved1 0
 reserved2 0
Section
  sectname __cstring
   segname __TEXT
      addr 0x0000000100003f88
      size 0x0000000000000015
    offset 16264
     align 2^0 (1)
    reloff 0
    nreloc 0
     flags 0x00000002
 reserved1 0
 reserved2 0
Section
  sectname __unwind_info
   segname __TEXT
      addr 0x0000000100003fa0
      size 0x0000000000000060
    offset 16288
     align 2^2 (4)
    reloff 0
    nreloc 0
     flags 0x00000000
 reserved1 0
 reserved2 0
Load command 2
      cmd LC_SEGMENT_64
  cmdsize 152
  segname __DATA_CONST
   vmaddr 0x0000000100004000
   vmsize 0x0000000000004000
  fileoff 16384
 filesize 16384
  maxprot 0x00000003
 initprot 0x00000003
   nsects 1
    flags 0x10
Section
  sectname __got
   segname __DATA_CONST
      addr 0x0000000100004000
      size 0x0000000000000008
    offset 16384
     align 2^3 (8)
    reloff 0
    nreloc 0
     flags 0x00000006
 reserved1 1 (index into indirect symbol table)
 reserved2 0
Load command 3
      cmd LC_SEGMENT_64
  cmdsize 72
  segname __LINKEDIT
   vmaddr 0x0000000100008000
   vmsize 0x0000000000004000
  fileoff 32768
 filesize 728
  maxprot 0x00000001
 initprot 0x00000001
   nsects 0
    flags 0x0
Load command 4
      cmd LC_DYLD_CHAINED_FIXUPS
  cmdsize 16
  dataoff 32768
 datasize 104
Load command 5
      cmd LC_DYLD_EXPORTS_TRIE
  cmdsize 16
  dataoff 32872
 datasize 72
Load command 6
     cmd LC_SYMTAB
 cmdsize 24
  symoff 32952
   nsyms 5
  stroff 33040
 strsize 48
Load command 7
            cmd LC_DYSYMTAB
        cmdsize 80
      ilocalsym 0
      nlocalsym 0
     iextdefsym 0
     nextdefsym 4
      iundefsym 4
      nundefsym 1
         tocoff 0
           ntoc 0
      modtaboff 0
        nmodtab 0
   extrefsymoff 0
    nextrefsyms 0
 indirectsymoff 33032
  nindirectsyms 2
      extreloff 0
        nextrel 0
      locreloff 0
        nlocrel 0
Load command 8
          cmd LC_LOAD_DYLINKER
      cmdsize 32
         name /usr/lib/dyld (offset 12)
Load command 9
     cmd LC_UUID
 cmdsize 24
    uuid AD46DB91-B1EF-3455-9A3C-ED739277703C
Load command 10
      cmd LC_BUILD_VERSION
  cmdsize 32
 platform 1
    minos 15.0
      sdk 15.0
   ntools 1
     tool 3
  version 1115.7.3
Load command 11
      cmd LC_SOURCE_VERSION
  cmdsize 16
  version 0.0
Load command 12
       cmd LC_MAIN
   cmdsize 24
  entryoff 16172
 stacksize 0
Load command 13
          cmd LC_LOAD_DYLIB
      cmdsize 56
         name /usr/lib/libSystem.B.dylib (offset 24)
   time stamp 2 Thu Jan  1 08:00:02 1970
      current version 1351.0.0
compatibility version 1.0.0
Load command 14
      cmd LC_FUNCTION_STARTS
  cmdsize 16
  dataoff 32944
 datasize 8
Load command 15
      cmd LC_DATA_IN_CODE
  cmdsize 16
  dataoff 32952
 datasize 0
Load command 16
      cmd LC_CODE_SIGNATURE
  cmdsize 16
  dataoff 33088
 datasize 408
```
:::tip <TipIcon />
这些加载命令（load commands）是由操作系统的动态链接器（dyld）在加载和运行可执行文件时解析和处理的。具体来说，操作系统的加载器会读取这些加载命令，并将它们传递给 dyld，dyld 再根据这些命令来完成具体的加载和链接工作。

<b style="font-size: 18px;">过程概述</b>

1. 操作系统加载器：
   - 操作系统启动时，加载器会读取可执行文件的头部信息。
   - 加载器会找到并解析加载命令（load commands）。

2. 动态链接器（dyld）：
   - 加载器将控制权交给 dyld。
   - dyld 会根据加载命令中的信息进行以下操作：
        - 加载段（segments）：根据 LC_SEGMENT 命令，将可执行文件的各个段加载到内存中。
        - 加载动态库：根据 LC_LOAD_DYLIB 命令，加载所需的动态库。
        - 设置入口点：根据 LC_MAIN 命令，设置程序的入口点（即 _main 函数的地址）。
        - 处理其他命令：处理其他加载命令，如 LC_RPATH、LC_LOAD_DYLINKER 等。

<b style="font-size: 18px;">具体步骤</b>
1. 读取文件头：
- 操作系统加载器首先读取 Mach-O 文件的头部信息，确定文件类型和加载命令的数量。

2. 解析加载命令：
- 加载器解析每个加载命令，了解可执行文件的结构和依赖关系。

3. 加载段：
- 根据 LC_SEGMENT 命令，将可执行文件的各个段加载到内存中。这些段包括代码段（__TEXT）、数据段（__DATA）等。

4. 加载动态库：
- 根据 LC_LOAD_DYLIB 命令，加载所需的动态库。dyld 会查找并加载这些库，确保所有依赖项都已满足。

5. 设置入口点：
根据 LC_MAIN 命令，设置程序的入口点。这是 _main 函数的地址，dyld 会将控制权传递给 _main 函数。

6. 初始化和运行：
- dyld 完成所有必要的初始化工作后，将控制权传递给 _main 函数，程序开始执行。

<b style="font-size: 18px;">加载命令的作用</b>

加载命令主要包括以下几类：
- LC_SEGMENT：定义了内存段（segment）及其属性，如虚拟地址、文件偏移、大小等。
- LC_LOAD_DYLIB：指定需要加载的动态库。
- LC_RPATH：指定动态库的搜索路径。
- LC_MAIN：指定程序的入口点（即 _main 函数的地址）。
- LC_LOAD_DYLINKER：指定动态链接器的路径。
- LC_ID_DYLIB：标识动态库的唯一ID。
:::


### 查看动态链接信息
```shell 
otool -L main
```
output:
```txt 
main:
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1351.0.0)
```

### 查看可执行文件的text section
```shell 
otool -tv main
```
output:
```txt 
main:
(__TEXT,__text) section
_hello:
0000000100003f28        ret
_main:
0000000100003f2c        sub     sp, sp, #0x30
0000000100003f30        stp     x29, x30, [sp, #0x20]
0000000100003f34        add     x29, sp, #0x20
0000000100003f38        mov     w8, #0x0
0000000100003f3c        str     w8, [sp, #0xc]
0000000100003f40        stur    wzr, [x29, #-0x4]
0000000100003f44        adrp    x8, 0 ; 0x100003000
0000000100003f48        add     x8, x8, #0xf88 ; literal pool for: "Peter"
0000000100003f4c        str     x8, [sp, #0x10]
0000000100003f50        ldr     x8, [sp, #0x10]
0000000100003f54        mov     x9, sp
0000000100003f58        str     x8, [x9]
0000000100003f5c        adrp    x0, 0 ; 0x100003000
0000000100003f60        add     x0, x0, #0xf8e ; literal pool for: "hello world %s"
0000000100003f64        bl      0x100003f78 ; symbol stub for: _printf
0000000100003f68        ldr     w0, [sp, #0xc]
0000000100003f6c        ldp     x29, x30, [sp, #0x20]
0000000100003f70        add     sp, sp, #0x30
0000000100003f74        ret
```

### 查看可执行文件的可打印字符串
```shell 
strings main 
```
output:
```txt 
Peter
hello world %s
```
> 一般就是硬编码的字符串

### objdump 查看目标文件的反汇编代码
```shell 
objdump -d main
```

output:
```txt 

main:   file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000100003f28 <_hello>:
100003f28: d65f03c0     ret

0000000100003f2c <_main>:
100003f2c: d100c3ff     sub     sp, sp, #0x30
100003f30: a9027bfd     stp     x29, x30, [sp, #0x20]
100003f34: 910083fd     add     x29, sp, #0x20
100003f38: 52800008     mov     w8, #0x0                ; =0
100003f3c: b9000fe8     str     w8, [sp, #0xc]
100003f40: b81fc3bf     stur    wzr, [x29, #-0x4]
100003f44: 90000008     adrp    x8, 0x100003000 <_printf+0x100003000>
100003f48: 913e2108     add     x8, x8, #0xf88
100003f4c: f9000be8     str     x8, [sp, #0x10]
100003f50: f9400be8     ldr     x8, [sp, #0x10]
100003f54: 910003e9     mov     x9, sp
100003f58: f9000128     str     x8, [x9]
100003f5c: 90000000     adrp    x0, 0x100003000 <_printf+0x100003000>
100003f60: 913e3800     add     x0, x0, #0xf8e
100003f64: 94000005     bl      0x100003f78 <_printf+0x100003f78>
100003f68: b9400fe0     ldr     w0, [sp, #0xc]
100003f6c: a9427bfd     ldp     x29, x30, [sp, #0x20]
100003f70: 9100c3ff     add     sp, sp, #0x30
100003f74: d65f03c0     ret

Disassembly of section __TEXT,__stubs:

0000000100003f78 <__stubs>:
100003f78: b0000010     adrp    x16, 0x100004000 <_printf+0x100004000>
100003f7c: f9400210     ldr     x16, [x16]
100003f80: d61f0200     br      x16
```

### objdump查看目标文件的符号表 
```shell 
objdump -t main
```
output:
```txt 
main:   file format mach-o arm64

SYMBOL TABLE:
0000000100003f84 g     O __TEXT,__const _M
0000000100000000 g     F __TEXT,__text __mh_execute_header
0000000100003f28 g     F __TEXT,__text _hello
0000000100003f2c g     F __TEXT,__text _main
0000000000000000         *UND* _printf
```

### objdump查看节信息
```shell 
objdump -h main
```

output:
```txt 
main:   file format mach-o arm64

SYMBOL TABLE:
0000000100003f84 g     O __TEXT,__const _M
0000000100000000 g     F __TEXT,__text __mh_execute_header
0000000100003f28 g     F __TEXT,__text _hello
0000000100003f2c g     F __TEXT,__text _main
0000000000000000         *UND* _printf
```

## 调试可执行程序
必须先生成带有调试信息的可执行文件：
```shell 
gcc -g main.c -o main
```

接下来，根据平台，采用`gdb`或者`lldb`调试。在macOS平台，使用`lldb`。

```shell 
lldb main 
```
这样就开启调试了，此时会来到lldb的对话窗界面，在该界面中，输入lldb支持的调试指令，即可慢慢调试。当然，这种调试一般都集成到vscode这种开发工具里了，不需要我们在终端去调试，因为前者在汇编代码和源码之间的映射处理上，更加直观、友好。尽管如此，有些时候，vscode提供的图形工具并不能完全满足需要，我们仍然要手动执行lldb内置的一些调试命令。

关于lldb的调试命令的介绍，可以阅读[我的另一篇博客](/blog/coroutine.html#lldb-指令)