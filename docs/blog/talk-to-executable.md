---
title: "和二进制文件打交道"
page: true
aside: true
---

## Description
待补充

gcc -install_name @rpath/libutil.dylib -fPIC -shared -o src/dyn-util/libutil.dylib src/dyn-util/util.c

在 macOS 系统上，动态链接库的搜索路径有一定的优先级排序。搜索逻辑和优先级如下：
**@executable_path**：首先搜索可执行文件所在的目录。
**@loader_path**：其次搜索加载该动态库的库所在的目录。
**@rpath**：然后搜索运行路径（rpath），可以在编译时或运行时指定。
**DYLD_LIBRARY_PATH**：接着搜索由 DYLD_LIBRARY_PATH 环境变量指定的目录。
**DYLD_FALLBACK_LIBRARY_PATH**：如果前面的路径都没有找到，则搜索 DYLD_FALLBACK_LIBRARY_PATH 环境变量指定的目录。默认值为 /usr/local/lib 和 /usr/lib。
系统默认路径：最后搜索系统默认的库路径，如 /usr/lib

生成动态链接库时，默认的注册名时./libutil.dylib, 但不知道为什么，macOS平台中，dyld使用可执行程序的当前工作目录或者DYLD_LIBRARY_PATH环境变量指定的目录，作为这个相对路径的参考目录，使用gcc -Wl.-rpath设置的动态链接库搜索目录将无效。为了解决这个问题，你要设置 -install_name, 告诉dyld，动链接库是rpath目录下的libutil.dylib文件

-install_name是macOS特有的配置项，在 Linux 上，类似的功能可以通过 -soname 选项来实现：
```shell
gcc -shared -o libexample.so.1.0 source.c -Wl,-soname,libexample.so.1
```