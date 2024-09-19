---
title: "jest学习笔记"
page: true
aside: true
---

## 整体脉络
jest是一个比较大的项目，为了方便维护、代码之间解耦，jest项目拆分出来若干个package，这样做的好处不用多提，坏处就是不利于其他人快速打通代码逻辑。费了半天劲，终于大概其搞懂jest整体逻辑是怎么回事儿，赶紧记录一下，免得以后忘了。

jest提供了API和command line两个角度的功能，入口点就是 `jest` 这个package。一般情况下，我们都是使用command line，因此在下载好jest后，你会在本地项目package.json的scripts中，看到`{"test": "jest"}`。当然，就和最一般的package一样，比如`lodash`, 我们可以在js文件中引入jest使用，这就是jest提供的API功能。

jest中引入了`@jest/core`和`jest-cli`，前者完成了API侧的封装，后者完成了command line侧的封装。

`jest-cli`和一般的command line程序一样，主要是负责命令行参数的解析、校验，而测试文件的读取、执行，则是调用`@jest/core`实现。因此，我们要捋清楚整个逻辑，只需要从`@jest/core`入手即可。

`@jest/core`的入口点是 `runCLI` 函数, 主要工作流程：
1. 读取jest配置项
2. 根据配置，搜索到所有测试文件的路径
3. 创建测试用例调度器对象
4. 调度器对象执行所有测试文件，并收集执行结果
5. 整理执行结果，按照jest配置项，采取合适的方式输出结果，如输出到json文件，或者直接输出到终端界面

上述流程中最复杂，也是最难的环节就是 4。为此，我们要从概念上区分，什么是测试用例的调度器和执行器。

测试用例的调度器，它不负责执行测试文件，但是它要负责让执行器去执行测试文件，让执行器去停止执行，回收执行器的运行结果；

测试用例的执行器，它只负责去执行测试文件，得到执行结果，返回执行结果，并且它要接受调度器的管理。这也就意味着，执行器必须通过一种方式，和调度器无缝通讯。因此，我们看到jest将执行器设计为 Event Emiter，调度器在执行器注册事件回调函数，获取到执行器各阶段产生的数据。

之所以做出这样的划分，一方面是遵从单一原则的代码设计，另外就是考虑到测试文件比较多的情况。

我们重点关心的还是jest如何执行测试文件，毕竟，里面拥有mock这种的黑魔法，我们想搞明白jest是如何做到的，因此，我们只需要关心测试用例的执行器。

在jest中，测试用例的调度器被抽象为 `class TestScheduler`, 测试用例的执行器被抽象为`JestTestRunner`，它是一个类型定义，不是`class`，你不妨可以将它理解为一个`interface`。这样做的目的是方便拓展。意思就是，类型是固定的，但是针对这种类型的实现是不同的。你可以设计多个`class`, 只要它们和`interface`的定义一致，它们就可以被当作这种`interface`来使用。

`TestScheduler`定义在`@jest/core`中，但是`JestTestRunner`定义在`jest-runner`中。

`jest-runner`给出了`class TestRunner`。这个类是模板类，它没有给出执行测试文件的具体实现，而是将这一部分抽象为 `TestFramework`, 但给出了 Environment 和 Runtime 的实现，这两个概念放在后边一节解释。做出这样的设计之后，执行测试文件就变得松动了，被解耦出去了。用户可以在jest配置项中给出自己实现的`TestFramework`，如果不给出来，jest会选择使用内部的实现。

`TestFramework`内部的实现主要分布在`jest-circus/runner`和`jest-jasmine2`两个package中。如果你在配置项里指定testRunner是`"jasmine2"`，就会使用`jest-jasmine2`的实现；如果你什么都没有设置testRunner，就是使用`jest-circus/runner`的实现。
> 详见`jest-config`的normalize.ts文件

而执行测试文件的逻辑，是在 `TestFramework` 里实现的，它会调用 Environment 和 Runtime 的API完成。这个细节牵扯到了Environment和Runtime，我们放到下一节讨论。


## Runtime, Environment
### Environment
测试内容可以是DOM，也可以是Nodejs.

测试DOM的情形：执行一段操作，然后判断DOM节点是否添加了某个属性，类名是否合乎预期，节点的innerText是否为预期的文字。

测试Nodejs的情形：执行一段nodejs环境里的代码，比如调用了process模块，然后查看进程号是否符合预期。

在这两个情形中，全局变量是不一样的，意思就是说，在DOM情形里的`global`和Nodejs情形里的`global`变量，是不同的。

Environment就是对此的抽象，根据运行的情形不同，准备好相应的`global`变量，供测试文件的代码访问。你也可以将Environment看作`global`变量的override，像下面的代码:
```js
describe("hello", () => {
    it("1+1=2", () => {
        assertEq(1+1, 2)
    })
})
```
`describe` `it` `assertEq`在默认的nodejs中，并不存在于`global`变量，那为什么jest可以成功执行呢？就是因为Jest利用Environment这种抽象，给`global`拓展了这些属性。

实现这种拓展的基本原理很简单，以nodejs为例：
```js
import { Script, createContext } from "vm";

const context = {a: 100, console };
createContext(context);

const script = new Script(`
  a = 10;
  console.log("hello");
  `
);

script.runInContext(context)

context.a; // 10
```

为了和nodejs原本的`global`兼容，要分两步走：
1. 将 `global` 身上的属性全都拷贝过来
2. 加入新的属性

第一步，jest是这样实现的：
```js 
import { createContext, runInContext } from "vm";
const context = createContext();
const global = runInContext("this", context);
```
像`console`这样默认的全局变量，我们就可以使用`global`访问;

如果对`global`写入一些属性，或者使用 `Object.defineProperty`定义一些属性，还可以使用`context`访问，尽管二者不是严格相等的，但要注意的是，想`console`这种属性只有在`global`才能访问到；

```js
global.a = 10;
console.log(context.a); // 10

global.b = { value: 1000 };
context.b === global.b; // true

Object.defineProperty(global, 'value', {
    get() { return 1; }
});
context.value; // 1
```

这还没有结束，`global`只是拷贝了context中的`globalThis`,但是，`global`变量所在的nodejs执行环境的`globalThis`，它上边可能有一些属性是`global`不具备的，因此jest做了如下等效处理：
```js
if (key in globalThis && !(key in global)) {
    Object.defineProperty(global, key, {
        get() { return globalThis[key] }
    })
}
```

第二步，就非常简单了，只需要将 `context` 和 `global` 变量传递给后续的函数，让这些函数直接往上边写入属性即可；这里讲远一点，后续单元测试的执行结果是挂载到 `global` 上面的，`describe` `it`这样的函数，也是挂载到它上面的。

Environment是干什么用的？准备全局变量，支持动态挂载全局变量。

jest在实现的时候，依旧考虑到解耦的问题。它在`jest-environment`里定义了Environment这种interface, 而把实现放在了`jest-environment-node`和`jest-environment-jsdom`。

那么，jest在执行的时候，怎么知道该用哪个实现呢？答案是在解析jest配置的时候，`jest-config`会利用`jest-resolve`计算出当前是何种环境，然后根据计算结果选择nodejs版本还是jsdom版本。

### Runtime
Environment仅仅解决了全局变量问题，解释了为什么单元测试文件里直接使用了`describe`这种未被定义的变量，依旧可以正确执行的现象。

但我们还有一个问题，也是更重要的问题是，jest是如何完成对module的Mock，以及单元测试文件是如何被执行的。

看一下这样的示意代码：
```js
import A from "B";

describe("1", () => {
    jest.mock("B", { default: function() { console.log("hello") }})

    A();// hello
})
```
这段代码很不简单：
1. A是import过来的，import是静态引入；
2. 在jest.mock之后，A所指向的内容就被修改了；

试想一下，该如何实现这种feature呢？

这就涉及到了Module拦截技术，你需要自己定义Module加载器才能实现这个。而jest就是抽象出 Runtime，来实现它的。

因此，Runtime是什么意思，非常清楚了：实现Module加载器的工具，负责加载测试文件，以及测试文件内由import或者require触发的Module加载。实际上，Module加载，就是加载Module所在的那个文件而已。



## Module拦截
### 如何拦截require 


### 如何拦截import

### 如何拦截import()