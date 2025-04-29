---
title: "Learn Zig"
page: true
aside: true
---

# Learn Zig 
Zig 是一个系统级编程语言，是C语言的有力替代品。与C语言相比，它提供了包管理机制、构建工具；与Go语言相比，它没有GC，手动管理内存；与C++和Rust相比，它语法相对简单（会有一点儿别扭），没有复杂的宏，没有编译器偷偷做一些事，代码的执行和控制流非常直观、透明。

目前看，比较出色的Zig项目只有Bunjs。

## Debug Zig with Vscode
确保安装 codeLLDB 的vscode 插件。

```shell 
mkdir zig_playground
cd zig_playground
zig init
zig build
```
此时会生成二进制可执行文件`zig-out/bin/zig_playground`。默认情况下，可执行文件中包含调试信息的symbols，可以直接用于debug。如果执行`zig build --release`，调试信息会被擦除，没法儿调试了。

创建`.vscode/launch.json`:
```json 
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug zig source code",
            "program": "${workspaceFolder}/zig-out/bin/zig_playground",
            "args": [],
            "cwd": "${workspaceFolder}"
        }
    ]
}
```

在zig源代码里，打上断点，然后在vscode的Debug面板里执行`Debug zig source code`的调试任务就能启动调试了。

## zig.guide
Zig官网标准库不友好，看了之后，还是不知道该怎么用，没有丰富的code snippet说明，你可以访问[zig.guide](https://zig.guide/standard-library/threads/)。解释得清楚，code snippet 很丰富，一看就会。