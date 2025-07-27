---
title: "Start with Zig"
page: true
aside: true
---

# Start with Zig

## Resolve Error
```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch 4;
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch brk: {
        break :brk 4;
    }
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch |err| brk: {
        if (err == error.OutOfMemory) {
            break :brk 4;
        }
        break :brk 10;
    }
}
```

```zig 

pub fn main() !void {
    // program will panic if there is an error
    const v: u32 = caused_error_fn() catch unreachable;
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch |err| switch(err) {
        error.FileNotFound => return,
        else => |e| { return e; },
    }
}
```

```zig 
pub fn main() !void {
    // throw the error to upwards
    const v: u32 = try caused_error_fn();
}
```

## Resolve Optional
```zig 
pub fn main() !void {
    var n = retured_optional_value() orelse 10;

    while(true) {
        var p = retured_optional_value() orelse break;
    }

    var t = retured_optional_value();
    if (t) |not_optional_value_t| {

    }
}
```

## Slice
zig的slice和go的slice有着非常大的区别。

go的slice是一个胖指针，包含指向存储区的指针，存储区的容量大小，存储区内的数据个数。一个函数如果对slice做修改后，按照习惯，会返回一个新的slice，上层调用方放弃传入的slice，继续使用返回的新slice即可。

zig的slice却不然，它也是胖指针，包含指向存储区的指针，存储区的容量大小。缺少了存储区的数据个数。假设有个slice A长度是10，送入一个函数，函数往里边加入4个元素，并且返回刚好纳下4个元素的新slice B，调用方接收slice B之后，就会遇到麻烦。如果他想继续往slice A加入数据，它不能把slice B 传入，因为会把之前的数据覆盖，他也不能传入slice A, 因为在第一步加入4个元素的操作之后，slice A 缺少 go slice中的【存储区内的数据个数】，函数就不知道应该从slice A的第几个元素后追加新数据，最终导致slice A开头的数据被覆盖。

因此，在使用slice的时候，应该有一个约定。调用方准备好slice, 传入到函数后，函数内部完成操作后，必须返回一个新的slice，调用方拿到返回的slice后，读取它的len属性，就能判断原来slice的开头len个空间，已经被写入了数据。调用方如果想继续追加，就可以将`slice[len..]`传入到函数，这样就避免开头的数据被覆盖了。

```zig 
fn append(slice: []u8, val: u8) []u8 {
    slice[0] = val;
    return slice[0..1];
}

pub fn main() !void {
    var source: [12]u8 = undefined;
    var slice: []u8 = source[0..];

    const s = append(slice, 10);
    const ss = append(slice[s.len..], 100);
    const sss = append(slice[s.len+ss.len..], 1000);

    const data = [_]u8{1,2,3,4};
    @memcpy(slice, data[0..]);
}
```

## Build.zig 
通常会使用如下的命令。

```shell 
zig run src/main.zig
```
这个命令用于直接运行代码。


```shell 
zig test src/main.zig
```
这个命令用于直接运行指定文件内的单元测试。


```shell 
zig build-exe src/main.zig
```
这个命令直接将main.zig编译为可执行文件。

上述用法，都是面向文件的用法，不是项目构建的用法。而项目构建的用法只有一个：
```shell 
zig build
```
这个命令是什么效果，取决于`build.zig`文件是怎么写的。

默认情况下，`zig build`就是在执行`zig build install`，意思是构建项目，将产物放置于默认的文件夹内。到底哪些东西要被install呢？

install library的例子：
```zig 
const std = @import("std");

pub fn build(b: *std.Build) void {
    // 这两个是构建时，使用的默认配置，一般情形不需要做更具体的设置
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Module, 这是zig构建的第一个概念。
    // 若干个zig文件构成一个module，而其中一个zig文件就是module
    // 的入口点，zig在构建的时候，是按照module进行的。
    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    // Compile，这是zig构建的第二个概念，编译任务。
    // 由 addLibrary 创建的是编译一个library的任务，为此
    // 你必须要给出library的名字还有它的入口module。
    const lib = b.addLibrary(.{
        .linkage = .static,
        .name = "zig-version",
        .root_module = lib_mod,
    });
    // 将编译任务lib加入到 `zig build install`中。有了
    // 这一步骤，执行`zig build`的时候，才会编译一个library。
    b.installArtifact(lib);
}
```

install executable的例子：
```zig 
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const exe_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    // addExecutable创建一个executable的编译任务，为此，
    // 你要给出executable的名字和入口module.
    const exe = b.addExecutable(.{
        .name = "loader",
        .root_module = exe_mod,
    });
    // 将编译任务加入到`zig build install`中，当执行
    // `zig build`的时候，就会编译出executable。
    b.installArtifact(exe);
}
```

zig默认提供给我们的，只有`zig build install` 和 `zig build uninstall`。然而，它也提供给我们自定义step的能力。`install` 和 `uninstall` 就是 step。

定义`zig build run -- -a=10 hello`的例子：
```zig 
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const exe_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    const exe = b.addExecutable(.{
        .name = "loader",
        .root_module = exe_mod,
    });

    // 创建一个Run任务，Run任务运行的是Compile任务的结果，
    // 因此，你要告诉addRunArtifact, 到底是哪个Compile任务；
    // 注意，我们不需要调用 installArtifact, 因为我们只想
    // 运行代码，而不是输出一个可执行文件
    const run_cmd = b.addRunArtifact(exe);
    // 用来接受`zig build run -- arg1 arg2` 的参数arg1，arg2
    if (b.args) |args| {
        run_cmd.addArgs(args);
    }

    // 这里就是自定义的精髓了，我们自定义了一个step叫做run,
    // 当你`zig build --help`的时候，就可以看到run了，否则
    // 只能看到`install`和`uninstall`。
    const run_step = b.step("run", "Run the app");
    // 这一步在说，run step 依赖 run_cmd，当run step运行的
    // 时候，首先要运行 run_cmd，不绕弯子地讲，run step执行的
    // 时候就是在执行run_cmd
    run_step.dependOn(&run_cmd.step);
}
```

我们也可以定义单元测试的step，`zig build test`:
```zig 
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const exe_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    // 和addLibrary， addExecutable一样，使用addTest
    // 创建一个编译任务，它要编译的是单元测试的代码
    const exe_unit_tests = b.addTest(.{
        .root_module = exe_mod,
    });

    // 创建一个Run任务
    const run_exe_unit_tests = b.addRunArtifact(exe_unit_tests);
    // 精髓来了，创建一个叫做test的step，这和上一个例子中的run step一样
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_exe_unit_tests.step);
}
```