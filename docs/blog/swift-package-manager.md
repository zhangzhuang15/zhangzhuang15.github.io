---
title: "swift package manager"
page: true
aside: true
---

## Description 
我是一个很痴迷Rust的人，因为它里边有个叫做类型模式匹配的东西，表达能力极强。我发现Swift里边也有，又看了下这门语言的语法，感觉Swift也很不错，想深入了解一下。我是写前端的，要想写一个前端项目，npm/pnpm/yarn这样的工具必不可少，webpack/rollup/vite这样的工具也不能丢。在Rust, 这些功能由统一的工具cargo实现，非常方便。那么，我要了解swift，自然而然就想到了它有没有包管理工具，它是如何拆分模块的。

## Fucking Module
在夸swift之前，我必须要喷它，它的module管理太垃圾了。在前端，你如果想使用一个模块，你需要：
```js
import { hello } from "../hello.js"
```
Good：
- 能看到我要使用的函数是什么
- 能看到这个函数定义在哪个地方
- 自定义的模块，只需按照文件路径引入即可

但是，swift就不一样：
```swift
import Foundation
```

Bad:
- Foundation 在哪里我不知道
- 什么函数可以用，我不知道
- 如果是自定义的模块，该怎么引入也不知道

问了GPT，也没告诉我什么有效信息。我决定自己趟一次浑水。

## swift package manager 
swift据说有多个包管理工具，我只尝试了官方的工具。

创建个项目看看吧。
```shell
mkdir module-demo
cd module-demo 
swift package init --type executable
code module-demo
```

```txt 
├── Package.swift
└── Sources  
    └── main.swift
```

往 `main.swift` 写一些东西：
```swift 
func main() {
    print("hello world")
}

main()
```

执行一下：
```shell 
swift run
```

接下来，我们创建一个模块Util:
```txt
├── Package.swift
└── Sources
    ├── Util
    │   └── func-tool.swift
    └── main.swift
```

:::code-group 
```swift [Sources/Util/func-tool.swift]
func hello() {
    print("hello world, good morning")
}
```

```swift [Sources/main.swift]
func main() {
    hello()
}

main()
```
:::

运行一下：
```shell 
swift run
```
WTF! 竟然TM执行成功了！使用 `hello` 不用 `import` 我也是醉了。。。

## 模块拆分
```txt 
.
├── Package.swift
└── Sources
    ├── Main
    │   └── main.swift
    └── Util
        └── func-tool.swift
```
:::code-group 
```swift [Sources/Util/func-tool.swift]
// 将 fns 组合成一个函数fn,达到这样的效果：
// fn(input) -> result 
// fns[0](input) -> result1 -> fns[1](result1) -> ... -> result
public func compose(fns: [(Any) -> Any]) -> (Any) -> Any {
    let fn = { (input: Any) in
        return fns.reduce(input) { partialResult, element in
            return element(partialResult)
        }
    }
    return fn
}
```

```swift [Sources/Main/main.swift]

let callbacks: [(Any) -> Any] = [
    { (v: Any) in
        if let strValue = v as? String {
            if strValue.hasPrefix("hello") {
                return 1000
            }
            return 100
        }
        return 10
    },
    { (v: Any) in
        if let intValue = v as? Int {
            return intValue > 100 ? "greater" : "less"
        } else {
            return ""
        }
    },
]

let t = compose(fns: callbacks)
let r = t("hello world")
print("\(r)")
```
```swift [Package.swift]
// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "hello",
            path: "Sources/Main"
        ),
    ]
)
```
:::

运行：
```shell
swift run
```

Shit! 运行不起来。

如果运行：
```shell
swift run hello
```

Shit! 还是运行不起来。

问题在于，我们的`main.swift`使用了`compose`函数，但是这个函数是放在`Util`模块中的。

然后，我们引入一下吧：
:::code-group 
```swift [Package.swift]
// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "hello",
            dependencies: ["util"], // [!code ++]
            path: "Sources/Main"
        ),
        .target(name: "util", path: "Sources/Util") // [!code ++]
    ]
)
```

```swift [Sources/Main/main.swift]
import util // [!code ++]
let callbacks: [(Any) -> Any] = [
    { (v: Any) in
        if let strValue = v as? String {
            if strValue.hasPrefix("hello") {
                return 1000
            }
            return 100
        }
        return 10
    },
    { (v: Any) in
        if let intValue = v as? Int {
            return intValue > 100 ? "greater" : "less"
        } else {
            return ""
        }
    },
]

let t = compose(fns: callbacks)
let r = t("hello world")
print("\(r)")
```
:::

这个时候，如果你用的是vscode,你会发现会有红色下划线提示，警告找不到 `util` module。这个就是特别坑爹的地方了。我就是卡在这个地方，google + GPT 都没有找到答案。

解决的方法相当SB。你只需要运行一下，或者编译一下即可。

运行方法：
```shell 
swift run hello
```

编译方法：
```shell
swift build --target hello
```

然后错误提示就TM消失了，你再运行一下，丝毫没有问题。Fucking Module!

## target 
如果你拥有C语言开发的经验，理解这个概念就容易了。在C语言中，假设你有两个文件：
- main.c 
- util.c

main.c 文件中需要使用 util.c 中的函数。在编译的时候，就是把 util.c 编译成静态库或者动态库，然后编译main.c，得到main.o，最后链接到静态库或者动态库，得到可执行文件。

编译出来的动态库或者静态库，编译得到的可执行文件，在Swift中都算作target。当然了，我们刚才举的例子比较简单，一个target刚好对应一个c文件。更多的情况是，若干个c文件为完成一个功能，最后编译在一起。对应Swift里的情况是，一个target对应若干个swift文件。所以，你在`Package.swift`看到，给target设置path的时候，给出的都是一个文件夹，不是一个swift文件。

## 再加入一个target
你一定会好奇，开始只有一个`main.swift`的时候，我们用`swift run` 运行，后来把 `main.swift`放入一个文件夹的时候，我们用`swift run hello`运行。这个是因为，我们可能有多个二进制程序要编译，反映在`Package.swift`中，我们会有多个`executableTarget`。

不妨加入一个看看：
```txt 
├── Package.swift
└── Sources
    ├── Main
    │   └── main.swift
    ├── Second
    │   └── main.swift
    └── Util
        └── func-tool.swift
```
:::code-group
```swift [Package.swift]
// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "hello",
            dependencies: ["util"], 
            path: "Sources/Main"
        ),
        .executableTarget(name: "world", path: "Sources/Second"), // [!code ++]
        .target(name: "util", path: "Sources/Util") 
    ]
)
```
```swift [Sources/Second/main.swift]
print("hello world")
```
:::

试试吧，看看哪个指令可以运行起来？
```shell 
swift run
```
```shell 
swift run world
```

实际上，我们还可以将path参数省略：
```swift 
import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "hello", // [!code --]
            name: "Main", // [!code ++]
            dependencies: ["util"],
            path: "Sources/Main" // [!code --]
        ),
        .executableTarget(name: "world", path: "Sources/Second"), 
        .target(name: "util", path: "Sources/Util") 
    ]
)
```

## 单元测试文件
一个项目，怎么能少了单元测试文件呢，我们要给加上！

```txt 
.
├── Package.swift
├── Sources
│   ├── Main
│   │   └── main.swift
│   └── Util
│       └── func-tool.swift
├── Tests
│   └── UtilTests
│       └── func-tool-test.swift
```

:::code-group 
```swift [Package.swift]
import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "Main", 
            dependencies: ["util"],
        ),
        .executableTarget(name: "world", path: "Sources/Second"), 
        .target(name: "util", path: "Sources/Util"),
        .testTarget(                  // [!code ++]
            name: "UtilTests",        // [!code ++]
            dependencies: ["util"],   // [!code ++]
            path: "Tests/UtilTests"   // [!code ++]
        )
    ]
)
```
```swift [Tests/UtilTests/func-tool-test.swift]
import Testing

@testable import util

@Test func example() async throws {
    // Write your test here and use APIs like `#expect(...)` to check expected conditions.
    let callbacks: [(Any) -> Any] = [
        { (v: Any) in
            return 10
        }
    ]
    let fn = compose(fns: callbacks)
    if let v = fn("") as? Int {
        #expect(v == 20, "fn() == 20")
    }
}
```
:::

执行Tests下的所有单元测试文件：
```shell 
swift test
```

只想执行某些单元测试文件：
```shell 
swift test --filter UtilTests
```

只想跳过某些单元测试文件：
```shell 
swift test --skip UtilTests
```

同理，我们可以省略path:
```swift 
import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "Main", 
            dependencies: ["util"],
        ),
        .executableTarget(name: "world", path: "Sources/Second"), 
        .target(name: "util", path: "Sources/Util"),
        .testTarget(                  
            name: "UtilTests",        
            dependencies: ["util"]
            path: "Tests/UtilTests"   // [!code --]
        )
    ]
)
```

## 入口文件
在上边的例子中，`Sources/Main`里边，只有一个`main.swift`，如果我增加一个swift文件行不行，如果把`main.swift`换成另一个文件名，行不行呢？

::code-group
```swift [Package.swift]
// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "module-demo",
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .executableTarget(
            name: "hello",
            path: "Sources/Main"
        ) 
    ]
)
```
```swift [Sources/Main/b.swift]
func hello() {
    print("hello peter")
}
```
```swift [Sources/Main/a.swift]
func main() {
    hello()
}
hello()
```
:::

执行:
```shell 
swift run hello
```
很遗憾，无法执行。因为swift无法知道a.swift和b.swift到底谁才是入口文件。

给出swift入口文件的方法有两种，第一种就是给出`main.swift`，也就是说将`a.swift`改为`main.swift`。另外一种是将`a.swift`的内容调整为：
```swift 
@main 
struct App {
    static func main() throws {
        hello()
    }
}
```



## 感受
只能说功能都覆盖到了，但是和他宣传的样子相比，实在算不上简单，教程也少，Fuck! 和 Go，Rust相比，特别是Rust相比，就是个弟弟。

特别是在引入module的`import`语句中，没有显示指明函数名，就非常不爽，等项目大了，都不知道哪些函数在哪里做的定义，完全要依赖XCode或者VSCode swift插件才能查到。

<Giscus />