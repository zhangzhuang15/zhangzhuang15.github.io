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

但我们还有一个更重要的问题，jest如何完成对module的Mock，以及单元测试文件是如何被执行的。

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

这就涉及到了Module拦截技术，你需要自己定义Module加载器才能实现这个。而jest就是抽象出 Runtime，来实现它的。Module拦截技术的基本原理我们放在下一节讨论。

因此，Runtime是什么意思，非常清楚了：实现Module加载器的工具，负责加载测试文件，以及测试文件内由import或者require触发的Module加载。实际上，Module加载，就是加载Module所在的那个文件而已。

那么测试文件如何被执行的呢？就是使用 Runtime 加载一下这个文件就好了。

首先，jest初始化Runtime的时候，会把Environment挂载上去；

其次，在执行测试文件前，会将`describe` `it` `afterAll` `afterEach`这些函数挂载到 Environment 上，作为测试文件执行时的全局变量；

最后，jest如果判定被测试文件是esm格式，会使用 `runtime.unstable_importModule`加载；否则，会使用 `runtime.requireModule`加载。
> 见 `jest-circus`的 `legacy-code-todo-rewrite/jestAdapter.ts`

加载的过程，就是js代码被执行的时候，`describe`这些函数就会执行。注意的是，`describe`这些函数执行的时候，只是对测试用例进行收集，并不执行，在测试文件被加载完成以后，jest就得到了一个`describeBlock`树型结构，在计算树形结构的每一个节点时，就类似于 redux 的状态管理方式，状态的最终形态就是这个树型结构。最后，jest会遍历树型结构，此时测试用例才会执行，执行结果也会被收集起来，最终再经过整理，得到整个测试文件的执行结果。

大致可以用如下的代码近似描述：
```js
const root = {
    type: "root_describe_block",
    children: [],
    hooks:[]
}

let currentBlock = root;

const describe = (label, fn) => {
    const prev = currentBlock;
    const node = {
        type: "describe_block",
        children: [],
        hooks:[]
    }
    currentBlock = node;
    fn();
    currentBlock = prev;
}

const it = (label, unitTestFn) => {
    const node = {
        type: "it_block",
        hooks: [unitTestFn]
    }
    currentBlock.children.push(node)
}

// 表示在context的全局变量环境下，加载测试文件
require("./1.test.js", {
    context: { it, describe }
})

// 遍历执行
traverse(root);
```

到这里，jest执行测试文件的过程已经解决了。我们只剩下了这些问题：
1. jest是怎么知道测试文件是esm还是commonjs?
2. module拦截是怎么做到的？
3. jest相关的API (比如`jest.mock`， 不算`describe`这种断言用的API)是如何注入到测试文件的


## Module拦截
### 区分esm还是commonjs
要做拦截，就必须区分是esm还是commonjs，因为两种形态下，拦截的方法是不兼容的。

jest区分的方式有：
1. 文件名后缀。`.mjs`就是esm,`.cjs`就是commonjs.
2. package.json的type字段。如果type是`"module"`，则js文件一律当作esm处理。
> 见 `jest-resolve`的 `shouldLoadAsEsm.ts`

### 如何拦截require 
有如下代码：
```js
const A = require("util");

A.hello();
```

拦截的方法如下：
```js
const requireImpl = (specifier) => {
    if (specifier === "util") 
        return {
          hello: () => console.log("hello")
        }
    return require(specifier)
}

(function(require){
    const A = require("util")

    A.hello()
})(requireImpl)
```
是不是超简单？

有的人会说了，如果是用ts编写的代码，引用模块的时候，都是使用 `import`，这个怎么拦截呢？

原理超级简单，jest会判断ts的target是否为 `commonjs`，如果是的话，jest内部会使用babel将其转化为 require 的引入方式，然后采用上边的原理去拦截；否则，就会按照拦截import的方式处理，这个后边会说到。
> jest使用babel被封装在几个package中。`babel-plugin-jest-hoist`和`babel-preset-jest` 提供babel插件和预设置， `babel-jest`封装babel和这两个配置，提供转化代码的能力，`jest-transform`负责调用这个能力。而`jest-transform`被集成在`jest-runtime`里。 

因此，你在jest官网`Getting Started`章节会看到，除了下载jest外，还要准备好babel以及babel的preset，比如`babel-preset-env`。

在jest中，commonjs形式被加载的测试文件会被包装为这样的代码：
```js
const { Script } = require("vm");
const script = new Script(`
({
    "Object.<anonymous>": function(
        module, 
        exports, 
        require,
        __dirname,
        __filename,
        jest) {
            // 测试文件被babel转化后的代码
        }
})`)

const result = script.runInContext(context);
const fn = result["Object.<anonymous>"];
const module = { exports: {} };
// 这里模拟jest自定义的module加载逻辑
const requireImpl = () => {};
// 模拟jest对象的实现
const jestObject = { mock: function(){} };
fn(
    module, 
    module.exports, 
    requireImpl, 
    __dirname, 
    __filename, 
    jestObject
)

// 此时module就是真正加载出来的模块了，jest会把它放入
// 自己的模块registry对象中，模拟nodejs原生加载器的行为
```
> 见`jest-runtime`的 `index.ts` createScriptFromCode function

这个例子也展示出了jest相关的API是怎么注入到测试文件的。但是，在esm的格式下，无法通过上述的方式完成module拦截，也自然无法以这种方式完成jest注入。所以, 在jest官网的[ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules)页面，它要求你必须要在测试文件中显式引入`jest`:
```js
import { jest } from "@jest/globals";
import A from "a";

jest.mock("a", () => {});
```

接下来，我们模拟一下module mock:
```js
const registry = new Map();
const mockMark = new Map();
const requireImpl = (spec) => {
    if (spec === 'util') {
        if (!registry.has(spec)) {
            const hello = () => console.log("hello");
            const helloImpl = () => {
                if (mockMark.has(spec)) {
                    return mockMark.get(spec).hello
                }
                return hello;
            }
            const obj = {
                default: {
                    hello: () => {
                        helloImpl()()
                    }
                },
                hello: () => {
                    helloImpl()()
                }
            };
            registry.set(spec, obj)
        }
        if (mockMark.has(spec)) {
            return mockMark.get(spec)
        }
        return registry.get(spec)
    }
    return require(spec);
}

const jestObj = {
    mock: (spec, v) => mockMark.set(spec, v)
}

const a = function(require, jest){
    const M = require("util")
    const { hello } = require("util");
    M.hello();
    hello();

    jest.mock("util", {
        default: {
            hello: () => console.log("not")
        },
        hello: () => console.log("not")
    })
    M.hello();
    hello();
}
a(requireImpl,jestObj)

// hello
// hello
// not
// hello
```
我们基本实现了mock，不足之处在于，M.hello更新了，但是hello没有更新。jest也预料到了这种问题，它引入了变量提升，在`babel-plugin-jest-hoist`里实现的，插件会检测到`jest.mock`的调用语句，将它提升到当前块级作用域最上层，比如下面的代码：
```js
import A from "a";
import B from "b";

jest.mock("a", () => {});

describe("hello", () => {
    var a = 10;
    jest.mock("b", () => {})
});
```

会被处理成：
```js
function _getJestObj() {
  const {
    jest
  } = require("@jest/globals");
  _getJestObj = () => jest;
  return jest;
}
_getJestObj().mock("a", () => {});
import A from "a";
import B from "b";

describe("hello", () => {
    _getJestObj().mock("b", () => {});
    var a = 10;
})
```

于是，如果我们mock module之后，访问A的时候，得到的就是mock之后的内容，而不是原始的内容。但是，这种处理方式的缺点在于，你必须算准了`jest.mock`的位置，像`jest.mock("b", () => {})`的位置就不好，无法成功mock module "b".

你一定还有问题，`import`语句在被nodejs执行的时候，会被提升到顶层执行呀。是的，你说的没错，但上述只是说jest做了变量提升，没有说babel的工作到此为止了，后续babel会将`import`转化为`require`语句，要知道`require`语句是不存在提升的。


### 如何拦截import
拦截import，意味着不需要将`import`转化为`require`, 因此在处理esm的测试文件时，jest只会用babel做一些常规的转化，不会改写`import`。

而拦截的基本原理完全依赖nodejs提供的vm模块。

```js
import { SourceTextModule } from "vm";

const context = createContext({ 
    name: "Peter",
    console
});
const module = new SourceTextModule(`
import A from "a";
function hello() {
    A.hello(name);
}
hello();

export default hello;
`, { context });

module
    .link((spec) => {
        if (spec === "a") {
            return new SourceTextModule(`
            export default function(name) {
                console.log("hello ", name)
            }`)
        }
    })
    .then(moduled => {
        // 执行，输出hello Peter
        moduled.evaluate();
    })
```

jest只需要这样做：
```js
import { SourceTextModule } from "vm";

new SourceTextModule(`
// 测试文件的代码
`, { context }).link(spec => {
    // jest自定义的Module加载器
    return resolveModule(spec)
});
```

从上述原理看，jest相关的API没办法像上一节提到的方式注入，只能作为一个package被显式地在测试文件里引入，或者挂载到 context 上（jest没这么做， 可能是想和commonjs处理的风格保持一致， commonjs处理的时候，也没有将jest相关的API挂载到全局变量global上）。

jest官网还介绍了一种方式：用`import.meta.jest`访问jest相关的API。这个实现起来也很简单：
```js
import { SourceTextModule } from "vm";

new SourceTextModule(`
// 测试文件的代码
`, { 
    context,
    initializeImportMeta: (meta) => {
        // createJestObj模拟jest相关API的创建
        meta.jest = createJestObj();
    }
})
```

### 如何拦截import()
无论是commonjs还是esm, 都支持 `import()` 动态引用模块，拦截原理依旧是使用vm模块。

在commonjs，是这么做的：
```js
const { Script } = require("vm");
const script = new Script(`
({
    "Object.<anonymous>": function(
        module, 
        exports, 
        require,
        __dirname,
        __filename,
        jest) {
            // 测试文件被babel转化后的代码
        }
})`, {
    importModuleDynamically: async (spec) => {
        // 模拟jest自定义Module加载器
        return resolveModule(spec);
    }
})
```

在esm, 是这么做的：
```js
import { SourceTextModule } from "vm";

new SourceTextModule(`
// 测试文件的代码
`, { 
    context,
    importModuleDynamically: async (spec) => {
        // 模拟jest自定义Module加载器
        return resolveModule(spec);
    }
})
```

### 如何处理.node文件的引入
直接用nodejs的require处理， `require("example.node")`

### 如何处理.wasm文件的引入
```js
import { SyntheticModule } from "vm";
// 1. 读取文件，转为二进制数据
const buffer = read("example.wasm")

// 2. 调用nodejs全局变量 WebAssembly 完成编译
const wasmModule = WebAssembly.compile(buffer);

// 3. 拿到导入和导出原始对象
const exports = WebAssembly.Module.exports(wasmModule);
const imports = WebAssembly.Module.imports(wasmModule);

// 4. 解析得到导入的modules
const importModules = parse(imports);

// 5. 合成模块；到这一个步骤，一个wasm文件成功转为nodejs的标准Module
new SyntheticModule(
    // 导出名列表
    exports.map(({name}) => name),
    function() {
        const importsObject = {};
        for (const {module, name} of imports) {
          if (!importsObject[module]) {
            importsObject[module] = {};
          }
          importsObject[module][name] = importModules[module].namespace[name];
        }
        const wasmInstance = new WebAssembly.Instance(
            wasmModule,
            importsObject
        )

        for (const { name } of exports) {
            // 设置各个导出属性的实现
            this.setExport(name, wasmInstance.exports[name])
        }
    }
)
```

### 如何处理.json文件的引入
如果是commonjs, 直接用require处理，`require("example.json")`

如果是esm，这样做：
```js
import { SyntheticModule } from "vm";

// 1. 读取json内容
const jsonString = read("example.json")

// 2. 合成模块返回
new SyntheticModule(
    ['default'],
    function () {
        const obj = JSON.parse(jsonString);
        this.setExport("default", obj);
    }
)
```

## code snippet
:::code-group
```js [example.js]
describe("a simple test", () => {
    it("1+1=2", () => {
        assertEq(1+1, 2)
    });

    it("1+2 == 3", () => {
        assertEq(1 + 2, 3)
    })

    it("1+3 = 2", () => {
        assertEq(1+3, 2)
    })
});
```

```js [jest.js]
// 展示实现一个简易的jest

import { Script, createContext } from "vm";
import { readFileSync } from "fs";

const root = {
    type: "describe_block",
    desc: "",
    children: []
}

let currentBlock = root;
let currentState = {
    success: true,
    descStack: [],
}
let result = [];

const describe = (label, fn) => {
    if (currentState.success === false) {
        return;
    }
    const prev = currentBlock;
    const node = {
        type: "describe_block",
        desc: label,
        children: []
    }
    currentBlock = node;
    fn();
    prev.children.push(currentBlock);
    currentBlock = prev;
}

const it = (label, fn) => {
    if (currentState.success === false) {
        return;
    }
    const node = {
        type: "it",
        desc: label,
        children: [{
            type: 'unit',
            hooks: [fn]
        }]
    }
    currentBlock.children.push(node)
}

const assertEq = (v1, v2) => {
    if (currentState.success === false) {
        return;
    }
    if (v1 === v2) {
        result.push({
            descStack: [
                ...currentState.descStack,
                `success: assertEq(${v1}, ${v2})`
            ],
            success: true,
        })
    } else {
        const error = new Error("")
        result.push({
            descStack: [
                ...currentState.descStack,
                `failed: assertEq(${v1}, ${v2})`,
                error.stack.split("\n").slice(2)
            ],
            success: false,
        })
        currentState.success = false;
        currentState.stack = error.stack;
    }
}


const code = readFileSync("./example.js", { encoding: "utf-8"} ).toString();
const script = new Script(code);
script.runInContext(createContext({ assertEq, describe, it }));

const traverse = (nodes) => {
    for (const node of nodes) {
        
        if (node.type === "unit") {
            node.hooks[0]()
        } else {
            currentState.descStack.push(node.desc);
            traverse(node.children)
            currentState.descStack.pop();
        }
    }
}
traverse(root.children)

for ( const item of result) {
    const out = item.descStack.reduce((current, next, index) => {
        const tabs = " ".repeat(index);
        current += next instanceof Array ? next.map(item => tabs+ item).join("\n"): tabs + next;
        current += "\n";
        return current
    } , "")
    console.log(out)
    console.log('');
}
```
```js [mock.cjs]
// 展示 mock 模拟， commonjs 的 module拦截
const registry = new Map();
const mockMark = new Map();
const requireImpl = (spec) => {
    if (spec === 'util') {
        if (!registry.has(spec)) {
            const obj = {};
            Object.defineProperty(obj, "default", {
                get() {
                    if (mockMark.has(spec)) {
                        return mockMark.get(spec).default;
                    }
                    return {
                        hello: () => console.log("hello")
                    }
                }
            });
            Object.defineProperty(obj, "hello", {
                get() {
                    if (mockMark.has(spec)) {
                        return mockMark.get(spec).hello;
                    }
                    return function() { console.log("hello")}

                }
            })
            registry.set(spec, obj)
        }
        return registry.get(spec)
    }
}

const jestObj = {
    mock: (spec, v) => mockMark.set(spec, v)
}

const a = function(require, jest){
    const M = require("util")
    const { hello } = require("util");
    M.hello();
    hello();

    jest.mock("util", {
        default: {
            hello: () => console.log("not")
        },
        hello: () => console.log("not")
    })
    M.hello();
    hello();
}
a(requireImpl,jestObj)
```

```js [module-intercept.js]
// 展示 esm 的 module 拦截
import { createContext, SourceTextModule } from "vm";

const moduled = new SourceTextModule(`
import hello from "a";

hello();
function add(a, b) { return a + b };

const a = 10;
const b = 100;
const c = add(a,b);

if (c > 0) {
  console.log(">");
} else {
  console.log("<");
}
c;`.trim(), {
    columnOffset: 1,
    lineOffset: 0,
    filename: "/src/fork-main.js",
    context: createContext({ console })
});

moduled.link((spec) => {
  if (spec === 'a') {
    return new SourceTextModule(`
      export default function() {
      console.log("hahahh")}
      `)
  }
}).then(() => {
  moduled.evaluate().then(v => {
    console.log("v: ", v)
  })
})
```

```js [environment.js]
// 展示 context 和 global 的协调性

import { createContext, runInContext } from "vm";

const context = createContext();
const g = runInContext('this', context);

console.log("1")
console.log("context: ", context)
console.log("g: ", g)
console.log()

g.a= 100
g.b= { hello: 10 }

console.log("2")
console.log("context: ", context)
console.log("g: ", g)
console.log()

Object.defineProperty(g, "value", {
 get() {
  return 100;
 } 
})

console.log(3)
console.log("g.value: ", g.value)
console.log("contextt.value: ", context.value)
```

```js [babel.js]
// 展示 jest 内部使用babel是如何处理代码的

import { transformSync } from "@babel/core";
import { createRequire } from "module";
import { fileURLToPath } from "node:url";

const result = transformSync(`
import A from "B";

describe("hello", () => {
    var a = 10;
    jest.mock("B", () => {})
    var b = a;
    {
    jest.unmock("B");
}
    var c = 111
})

A.hello("how are you")
`, {
    caller: {
        name: "jz-test",
        supportsDynamicImport: true,
        supportsStaticESM: false
    },
    compact: false,
    presets: [
        createRequire(
            fileURLToPath(import.meta.url)
        ).resolve("babel-preset-jest")
    ]
})

console.log(result.code)
```

```json [package.json]
{
  "name": "node-vm",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@babel/core": "^7.25.2",
    "babel-jest": "^29.7.0",
    "babel-preset-jest": "^29.6.3"
  }
}
```
:::

<Giscus />