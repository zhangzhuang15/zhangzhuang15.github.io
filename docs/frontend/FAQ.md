---
title: "FAQ"
page: true
aside: true
---

## Description

记录踩过的坑

## 为什么 lodash 的 tree-shaking 会失败？

```ts
import { zip } from "loadash";
```

这样使用 lodash，webpack 最终结果还是把 loadsh 整个内容打包进去了，而不是仅打包 zip 函数。

原因一：lodash 本身采用 commonjs 方式编写，其`package.json`没有声明`sideEffects: false`

基于此，你应该改写为：

```ts
import zip from "lodash/zip";
```

原因二：webpack 在 production 模式下，默认会开启 tree-shaking，但可能你开启了某些配置项，将它禁止了

原因三：你依赖的其它库也使用了`lodash`，但它按照最开始说的错误方式导入了`lodash`

## 这些“黑话”啥意思

### shebang

```js
#!/usr/bin/env node

console.log("hello world");
```

`#!/usr/bin/env node` 就是 `shebang`

### bailout

```ts
function dealWithSomething() {
  // 一些特殊处理，导致函数提前返回，这就是 bailout
  if (true) {
    return 10;
  }

  doOtherThing();
  return 0;
}
```

### noop

```ts
const noop = () => {};
```

### pending

```js
function pushQueue(queue, task) {
  // task加入队列，但是没有被执行，这些task就是 pending 状态，
  // 即 pending task
  queue.push(task);
}
```

### footgun

footgun 通常指的是那些容易导致程序员犯错的语言特性、API 设计或配置选项。例如，一个功能强大但使用不当会导致严重后果的 API.

### boilerplate

样板代码，模板

### shims

意思和 polyfill 相似，都是垫片儿的意思。垫片儿的作用是让旧版本的东西可以使用新版本的特性。

### helpers

在设计一个库时，想通过一套 API 隐藏底层实现，让用户更轻松、更简单地使用库，这套 API 函数就是 helper.

### bump version

常见于 git commit 的 comment 中，表示版本号升级 1 个

### kick to login

将用户强制重定向到登录页

### aka

also known as, abbreviation

### nailed it

常见于 github 评论中，表示 well done, 做的好

## 使用 javascript API 遇到的坑

### 数组 empty slot 被跳过

❌

```ts
const arr = new Array(3).map((_, index) => index + 1);

// expect: [1,2,3]
// actual: [<3 empty items>]
// arr[0] === undefined
```

✅

```ts
const arr = new Array(3).fill(1).map((_, index) => index + 1);
```

### Date 设置日期

```ts
const date = new Date("2024-02-07");

date.setDate(0);

// date: "2024-01-31"
```

```ts
const date = new Date("2024-02-07");

date.setDate(-1);

// date: "2024-01-30"
```

### `Reflect.contruct` VS `Object.create`

```js
let thisA = null;

class A {
    constructor() {
        thisA = new.target;
    }
}

class B {}

// 相当于 new A()
const m = Reflect.construct(A, []);
thisA === A; // true

// 相当于 new A(), 但是把 prototype 重置为 B.prototype
const n = Reflect.construct(A, [], B);
thisA === B; // true

// 创建一个对象，prototype 指向 A.prototype
const p = Object.create(A.prototype);
A.call(p);
// 这个是最大的区别！上行代码并没有调用 new,
// new.target 就是 undefined
thisA === undefined; // true


m instanceOf A; // true
n instanceOf B; // true
p instanceOf A; // true
```

### `path.resolve` VS `path.join`

```js
const path = require("path");

path.resolve("/a/b", "c"); // /a/b/c
path.join("/a/b", "c"); // /a/b/c

path.resolve("/a/b", "./c"); // /a/b/c
path.join("/a/b", "./c"); // /a/b/c

path.resolve("/a/b", "../c"); // /a/c
path.join("/a/b", "../c"); // /a/c

path.resolve("/a/b.txt", "c"); // /a/b.txt/c
path.join("/a/b.txt", "c"); // /a/b.txt/c

path.resolve("/a/b.txt", "./c"); // /a/b.txt/c
path.join("/a/b.txt", "./c"); // /a/b.txt/c

path.resolve("/a/b.txt", "../c"); // /a/c
path.join("/a/b.txt", "../c"); // /a/c

path.resolve("/a/b.txt", "/c"); // /c
path.join("/a/b.txt", "/c"); // /a/b.txt/c

path.resolve("./a/b.txt", "./c"); // /Users/xxxx/a/b.txt/c   /Users/xxxx stands for cwd
path.join("./a/b.txt", "./c"); // a/b.txt/c

path.normalize("/a/b.txt/c.tt"); // /a/b.txt/c.tt
path.normalize("/a/b.txt/./c.tt"); // /a/b.txt/c.tt
path.normalize("/a/b.txt/../c.tt"); // /a/c.tt
path.normalize("a/b.txt/../c.tt"); // a/c.tt
```

## typescript 的 class 编译结果

```ts
class M {
  static n = "";
  static {
    console.log(M.n);
  }

  name = "jack";
  hello = () => {
    console.log(this.name);
  };

  static tryIt() {}

  ok() {
    console.log(this.name);
  }

  constructor() {
    this.name = "black";
  }
}
```

after compiled:

```js
class M {
  constructor() {
    this.name = "jack";
    this.hello = () => {
      console.log(this.name);
    };
    this.name = "black";
  }
  static tryIt() {}

  ok() {
    console.log(this.name);
  }
}

M.n = ""(function () {
  console.log(M.n);
})();
```

## localStorage 和 sessionStorage 的存储容量限制

每个 origin，最多允许存储 10MB 的数据（5MB localStorage, 5MB sessionStorage）

[MDN | Storage 容量限制](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage)

## web worker 最多开多少个

没有找到具体的官方文档，但是可以参考[stackoverflow | Number of Web Workers Limit](https://stackoverflow.com/questions/13574158/number-of-web-workers-limit)

FireFox 浏览器最多允许创建 20 个；

> FireFox 的限制数量可以改变配置；

Chrome 浏览器最多允许创建 60+个；

Opera 浏览器最多允许创建 16 个；

值得关注的是，web worker 占据一个系统线程，因此不要过多创建 web worker，web worker 的数量和主机的 CPU 核数保持一致即可，数量多了未必能提升性能。

## 前端工程中，如何处理 web worker

使用 webpack 打包的前端应用中，可以使用 `worker-loader` 处理

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.web-worker\.js/,
        use: [{ loader: "worker-loader" }],
      },
    ],
  },
};
```

```js
import Worker from "./demo.web-worker.js";
const worker = new Worker();
worker.postMessage("");
worker.addEventListener("message", (event) => {});
```

- 支持 `Worker` 和 `SharedWorker`
- 支持设置 worker 文件打包后的名称和路径

## `Failed to execute 'postMessage' on 'Window': 2 arguments required, but only 1 present.`

浏览器差异，在 chrome v123 没有问题，在 chrome v69 会有问题。

MDN 上说：`window.postMessage(data, targetOrigin)` ，第二个参数是 optional，这不准确，像 chrome v69 环境下，第二个参数就必须填写。

## Performance 中的术语

- `Schedule Style Recalculation`
- `Finish Loading`
- `Receive Response`
- `Layout`
- `Pre-Paint`
- `Paint`
- `Layerize`
- `Commit`
- `Timer Fired`
- `Task`
- `Run Microtasks`
- `Evaluate Script`
- `Compile Script`
- `Compile Code`
- `Parse HTML`

待完善

## 为什么修改了/etc/hosts 文件，还是没有效果

- /etc/hosts 内容的格式不对，通常发生在直接往里面粘贴一些内容的时候
- 浏览器的 DNS 缓存没有清除
- 操作系统的 DNS 缓存没有清除

## 小程序如何实现 h5 跳转

h5 一般指的是适配移动端屏幕的网页；

第一步，正常开发 h5 页面，部署到 nginx 上，假设链接地址为 “http://mock.cc/helloworld.html”

第二步，在小程序页面组件的 wxml 中，使用 `<web-view>` 组件，该组件有如下 props：

- url, 用于渲染指定的网页
- bindmessage, 用于处理内嵌网页发送给 web-view 的数据
- bindload, 内嵌网页在 web-view 中加载时触发的事件
  > webview 域名没有在后台配置的话，打开网页，会触发此事件，并跳转到网页：https://mp.weixin.qq.com/mp/waerrpage
- binderror, 内嵌网页加载失败时触发的事件

url 可以从小程序页面组件的 onLoad 入参中获取到；

第三步，在其它页面，使用 `wx.navigateTo` 跳转到包含`<web-view>`的组件内，内嵌网页的 url 作为 query 参数
传递过去，`wx.navigateTo({ url: "/pages/webview/main?url='http://mock.cc.helloworld.html'"})`

> 注意 url 的限制长度，内嵌网页的 url 不要太长

## 如何实现客户端灰度控制

第一步，建立一个配置文件，在上面配置灰度进度（比如 60，表示 60%）和白名单（userID）;

第二步，开发一个服务接口，供客户端获取这个配置文件；

第三步，客户端发送请求，拉取配置文件，检测用户是否命中灰度

- userID 没有在白名单中，灰度为 60，如果 userID 末尾两位是'00'到'59'，那么用户命中灰度了；
- userID 在白名单中，命中灰度了；

第四步，将用户命中灰度的情况，写入到客户端缓存（可以是内存，也可以是磁盘，看你怎么设计），下次
用户再登录的时候，就可以直接命中灰度了

## 如何实现 js bridge

[jsbridge | Cross Platform Guidebook](https://tsejx.github.io/cross-platform-guidebook/hybird/jsbridge)

### js 调用 native

方法一：native 端使用原生 webview 组件提供的接口函数，将 native 端定义的函数注册到 webview 里面，挂载到内嵌网页的 window 对象上。内嵌网页执行 window 上的方法时，就会触发 native 中的方法。

方法二：内嵌网页通过某种方式，发送请求，native 端可以借助 webview 组件提供的能力，注册一个函数，
拦截下所有内嵌网页的请求，对请求进行分析，拿到数据，然后调用 native 函数做处理。

### native 调用 js

native 端使用原生 webview 组件提供的接口函数，可以直接执行一段 js 代码，比如`nativeCall("doPost({code: '0', value: 10, id: 1324324 })")`, 执行的环境就是内嵌网页的 window。

## 小程序大致原理

小程序自身的 DSL（wxml and wxss）会在编译阶段转为原生组件（UIView in ios）；

小程序的渲染引擎会将数据的改变，落实到原生组件的更新上；

小程序中的 js 代码会在一个独立的环境执行，比如 ios 上，有相应的 API 创建一个 javascript core 执行环境，
小程序中的 js 代码就会执行在这里边，native 可以使用 API 拿到执行结果；

```swift
import JavascriptCore

let context = JSContext()
// 主动调用js侧数据
context.evaluateScript("var a = 3; var b = 4; var d = a + b; d;") { result in
    print("\(result)")
}

func hello() {
    print("hello world")
}

// 将 hello 挂载到 globalThis.sayHelloWorld，供js侧使用
context.setObject(hello, forKeyedSubscript: "sayHelloWorld" as NSString)
```

native 侧可以使用 Core Graphics 自定义原生的组件：

```swift
import UIKit

class MyCustomView: UIView {
    override func draw(_ rect: CGRect) {
        super.draw(rect)

        guard let context = UIGraphicsGetCurrentContext() else { return }

        // 设置矩形的填充颜色
        context.setFillColor(UIColor.blue.cgColor)

        // 绘制矩形
        context.fill(CGRect(x: 20, y: 20, width: 100, height: 100))
    }
}
```

小程序在 js 侧会有虚拟 DOM，每个虚拟 DOM 都会有一个唯一标识符，通过这个唯一标识符，native 端可以知道
该虚拟 DOM 对应的是哪一个原生组件；

整体的运行流程就是：

1. 和原生 UI 发生交互，交互绑定的处理代码，主动调用 javascript core 中的代码，进入 js 侧；
2. 在 js 侧，完成计算，更新虚拟 DOM 节点，触发虚拟 DOM 的 patch;
3. 虚拟 DOM patch 完成，拿到要更新的组件的唯一标识符以及对应的状态数据；
4. js 侧将数据返回，回到 native 侧；
5. native 侧将数据交给渲染引擎；
6. 渲染引擎将数据更新到原生组件上；

整套逻辑最难的地方就在于：

- 编译的过程
- 渲染引擎如何渲染

渲染引擎可以参考 `React Native`、 `Weex`、 `Flutter`、 `uni-app`的实现；

## webpack 提供了哪些访问模块的辅助能力

### require.context

```js
// 访问文件夹 assets 下所有的 png 文件资源
const requireModule = require.context("./assets/", false, /\.png/);

requireModule.keys().forEach((path) => {
  // 打印资源路径，注意，这不是资源最终输出的路径，而是源码中的路径
  console.log(path);

  // 引入资源，如果资源是一个js文件，返回值就是js的导出模块；
  // 如果资源是非js文件，返回值取决于处理这个文件的loader，
  // 例如资源是图片，图片的loader就会将图片最终输出的路径作为结果返回；
  const url = requireModule(path);
});
```

### require.ensure

```js
require.ensure(["a", "b"], () => {
  // 当 ‘a’ 和 'b' 都被确认存在，执行此函数

  const a = require("a");
  const b = require("b");
});
```

### require.resolve

```js
// 返回 module-A 的引入路径，但不会真的引入该依赖
const modulePath = require.resolve("module-A");
```

## 10 位时间戳

工作期间，遇到后端要求传递 10 位时间戳的问题。为什么要传递 10 位，不传递 11 位、9 位呢？

在前端，完整的时间戳是这样生成的：

```js
const stamp = new Date().getTime().toString();
```

打印出来，你会发现是 13 位；

后三位有什么秘密呢？

```js
console.log(new Date(1717492218502).toISOString());
// '2024-06-04T09:10:18.502Z'

console.log(new Date(1717492218000).toISOString());
// '2024-06-04T09:10:18.000Z'

console.log(new Date(1717492218120).toISOString());
// '2024-06-04T09:10:18.120Z'
```

你应该知道答案了。事实上，最后三位并不会带来巨大的时间偏差，可以省略。但是后端在
接收到时间戳之后，需要在末尾添加 3 个 0 才能使用。

## http2 协议

[阅读 http2 协议标准文档](https://datatracker.ietf.org/doc/html/rfc7540)

## vue-loader v14.2.0 不能识别处理`<script lang='jsx'>` ？

你在 webpack 配置文件里边，已经使用 `babel-loader` 处理 js 和 jsx, 使用 `vue-loader` 处理 vue 文件，你在一个 vue 文件中，使用了 `<script lang='jsx'>` 的标签，可你已运行项目，就得到了这样的错误：`cannot resolve 'jsx-loader'`。

嗯？

我明明有 `babel-loader`，为什么不好使呢？

你一定是这样想的：`vue-loader`在解析到 script 标签的时候，发现 lang 是`jsx`，然后就会把代码提取出来，等着后边的 `babel-loader`处理。

事实并非如此，`vue-loader`发现 lang 是`jsx`的时候，会看看 vue-loader 有没有内置的处理 jsx 的 loader, 如果没有，它就会简单粗暴地按照`{lang}-loader`的形式，寻找 loader 去处理，其核心代码逻辑如下：

```js
// lib/helpers.js

// sass => sass-loader
// sass-loader => sass-loader
// sass?indentedSyntax!css => sass-loader?indentedSyntax!css-loader
function ensureLoader(lang) {
  return lang
    .split("!")
    .map((loader) =>
      loader.replace(
        /^([\w-]+)(\?.*)?/,
        (_, name, query) =>
          (/-loader$/.test(name) ? name : name + "-loader") + (query || "")
      )
    )
    .join("!");
}
```

解决方式，就是显式指定 babel-loader 去处理 jsx:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /vue$/,
        loader: "vue-loader",
        options: {
          loaders: {
            jsx: "babel-loader",
          },
        },
      },
      {
        test: /js(x)?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
};
```

## `Its return type 'ReactElement<any, any> | null' is not a valid JSX element`

这个问题发生在用 react 编写的`.tsx`文件中，明明用 `React.FC` 定义的函数组件，在 tsx 结构里使用时，vscode 飘红报错，说是语法有问题。

原因是，本地项目依赖中，有多个版本的 react .d.ts 声明文件，解决方法是重新安装依赖 😭

这里有个[stackoverflow 上的解答](https://stackoverflow.com/questions/53822891/jsx-element-type-reactelementany-null-is-not-a-constructor-function-for-js)

## node-gyp 执行时，遇到 python 问题： ModuleNotFoundError: No module named 'distutils'

在 electron 项目中，项目运行的时候，可能会使用 node-gyp, 进而遇到和 python 相关的问题。

这个问题是因为 python 版本号不正确。在 macOS 上，删除系统预装的 python 非常困难，因此我们可以变通地解决
这个问题，在启动项目之前，设置一个全局变量：

```shell
export PYTHON=/opt/homebrew/bin/python3.11
```

之后再启动项目，这个时候 node-gyp 就会使用 python3.11 执行 python 脚本了。

[Github 问题案例](https://github.com/cypress-io/cypress/issues/28695)

## webpack 允许 import undefined variable?

如果你的代码 import undefined variable，然后你用 webpack 构建项目的时候，webpack 竟然没有报错。可这个问题非常严重，因为在代码运行的时候，一旦使用这个变量，会导致 crash。

如果想让 webpack 及时报错，设置`webpackConfig.module.strictExportPresence` 为 true 即可。

开启这个配置之后，你仍需要注意：
:::code-group

```js [src/mod.js]
export function hello() {
  console.log("hello world");
}
```

```js [src/main.js]
import { hello, jack } from "./mod";
import * as M from "./mod";

// hello is defined, webpack works
hello();

// jack is not defined, webpack fails
jack();

// webpack fails
if (M.jack) {
  M.jack();
}

// webpack fails
if (M["jack"]) {
  M["jack"]();
}

// webpack works!
// so if you want to access variable mounted on
// M dymatically, write code in this style
if (M["jack" + ""]) {
  M["jack" + ""]();
}
```

:::

## 事件派发的默认顺序

默认**bubble**顺序，即注册回调函数的最内层 dom 节点先执行，然后事件向外层传播，外层中注册回调函数的 dom 节点依次执行；

如果要指定**capture**顺序，请这样做：

```js
dom.addEventListener("click", () => {}, { capture: true });
```

## mousedown,mouseup,click 事件的顺序

mousedown -> mouseup -> click

## vue2 和 vue3 中的 array refs

[stackoverflow 上的解释](https://stackoverflow.com/questions/52086128/vue-js-ref-inside-the-v-for-loop)

vue2:

```vue
<template>
  <div>
    <card
      v-for="(cardItem, index) in cards"
      :key="index"
      :ref="`item_${index}`"
    />
    <card ref="uniq" />
  </div>
</template>
<script>
export default {
  data() {
    return {
      cards: ["a", "b"],
    };
  },
  mounted() {
    // 得到一个数组，不是一个 vue instance;
    // 你无需将 index绑定到 ref上，直接设置
    // ref="item"， 用 this.$refs["item"][0] 访问即可
    this.$refs["item_0"];

    //  得到一个 vue instance, 不是数组
    this.$refs["uniq"];
  },
};
</script>
```

vue3 中，不会在解析 v-for 语法糖的时候，自动生成数组，挂载到 $refs 上面，你可以改写成这样：

```vue
<template>
  <div v-for="item in list" :ref="setItemRef"></div>
</template>

// optional API
<script>
export default {
  data() {
    return {
      itemRefs: [],
    };
  },
  methods: {
    setItemRef(el) {
      if (el) {
        this.itemRefs.push(el);
      }
    },
  },
  beforeUpdate() {
    this.itemRefs = [];
  },
  updated() {
    console.log(this.itemRefs);
  },
};
</script>

// composition API
<script>
import { onBeforeUpdate, onUpdated } from "vue";

export default {
  setup() {
    let itemRefs = [];
    const setItemRef = (el) => {
      if (el) {
        itemRefs.push(el);
      }
    };
    onBeforeUpdate(() => {
      itemRefs = [];
    });
    onUpdated(() => {
      console.log(itemRefs);
    });
    return {
      setItemRef,
    };
  },
};
</script>
```

## 低版本 typescript 处理 optional chain 的问题

```ts
const state = localStorage.getItem("value");
const stateIsRight = state?.some((i) => i.k > 10);
```

使用 typescript@2.9.2及以下版本处理上述代码的时候，optional chain 不会被正确编译，且会在 state 和 “?” 中间加入空格。请使用 3.0.0 及以上版本的 typescript。

ts-loader 处理代码的时候，使用项目安装的 typescript 去处理，所以在项目中使用 ts-loader 的时候，也要看一眼 typescript 的版本号是否过低。

## 为什么 babel-loader 没有处理 node_modules 下的 js 文件

如果你在 webpack 中如此配置：

```js
module.exports = {
  ...,
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /node_modules\/*\.js/,
        loader: "babel-loader"
      }
    ]
  }
}
```

如果你的 babel 配置文件是 babelrc, 那么上述配置很可能会失效。

自 babel7.0 开始，babel 在处理 node_modules 下的文件时，不会按照 babelrc 给出的配置执行；

解决方式有两种：

1. 把 babelrc 换成 babel.config.js;
2. 在 webpack 中，明确指出“babel-loader”的 options 项；

## webpack 的 module.rules 里，test 正则表达式匹配的是什么？

有如下 webpack 配置：

```js
module.exports = {
  ...,
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /node_modules\/*\.js/,
        loader: "babel-loader"
      }
    ]
  }
}
```

`test: /\.js$/` 匹配的是谁呢？

你可以理解为 request 或者 resource;

当 webpack 遇到`import {} from 'A'` 代码的时候，就会解析 A，得到 A 的 resource，基于 resource 形成一个 request。

resource 就是资源的绝对路径，比如'A'的 resource, 就是 package A 的入口文件绝对路径；

request 是一个字符串，它基于 resource，加入 loader 的扩展信息，比如`/node_modules/babel-loader/index.js!/node_modules/A/index.js`;

如果你想调试看看，可以编写这样的 Plugin，打断点调试：

```js
class ModuleResolverSuspendPlugin {
  constructor() {}

  static PluginName = "ModuleResolverSuspendPlugin";

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(
      ModuleResolverSuspendPlugin.PluginName,
      (compilation) => {
        compilation.hooks.buildModule.tap(
          ModuleResolverSuspendPlugin.PluginName,
          ($module) => {
            const resource = $module.resource;
            const request = $module.request;
            debugger;
          }
        );
      }
    );
  }
}

module.exports.ModuleResolverSuspendPlugin = ModuleResolverSuspendPlugin;
```

webpack 配置：

```js
const { ModuleResolverSuspendPlugin } = require("./ModuleResolverSuspendPlugin.js")
module.exports = {
  ...,
  plugins: [
    new ModuleResolverSuspendPlugin()
  ]
}
```

## vscode 调试项目的时候，cannot resolve "node"

先确认一下，是否安装了 node，并且在环境变量 Path 中，配置了 node 路径；

如果满足上一个条件，那就是和你打开项目的方式有关系。你需要在 macOS 的 terminal（其他系统，则选择默认的终端工具）中，切换到项目的根目录下，然后执行 `code .`，这样就可以了。

如果命令行中，没有 `code`，请阅读[这里](/tool/vscode-config#在-path-中安装-code)

## onChange 事件函数用 debounce 包裹后，为什么无法拿到正确的 Event 对象？

```jsx
import debounce from "lodash/debounce";
const Component = () => {
  const onChange = debounce(
    (e) => {
      // 报错！e.target是null，拿不到输入框的值
      e.target.value;
    },
    200,
    { trailing: true }
  );
  return <Input onChange={onChange} />;
};
```

如上，展示了在第三方组件 Input 中，使用 debounce 时，可能遇到的错误；

原因是 debounce 采用了 `trailing: true` 的做法。当事件被触发的时候，由于我们指定了这个配置，导致不会立即执行 onChange 函数，在 200ms 后，才会执行，那这个时候就有问题了，执行时得到的 e，是输入框改变的事件对象么？肯定不是。于是，就会有 e.target.value 获取不到输入框内容的错误。正确做法是，改用`leading: true`.

## webview 是 ios 特有的东西么

最近，公司内部有人反馈，在安卓端 App 的长列表页面，迅速下滑的时候，列表页会出现短暂的空白，他不知道怎么回事儿。

群里有大佬表示，这是 webview 异步光栅化造成的。哦？ webview, 异步光栅化，WTF？

先说光栅化。光栅化是指将矢量图转化为位图的操作。异步光栅化就是在手机后台线程中完成这个事情，不在主线程去搞。好处就是，主线程不会被阻塞，页面表现流畅。坏处就是，光栅化耗时较大时，得不到位图数据，页面来不及显示内容，这种就叫做页面延迟，就是上边那个人反馈的情况。

既然说到这里了，不得不提一嘴`矢量图`和`位图`。矢量图就是所有的像素点经过数学公式计算出来的图。当矢量图缩放时，新的尺寸会代入到公式，重新计算一遍新的像素点，这些像素点都是准确的，因此绘制出来的图像也是清晰的。位图的像素点是固定的，当放大位图时，多出来的像素点是通过插值算法计算得到的，因此这些新的像素点不太精准，导致最终绘制出来的结果模糊、不平滑。可无论怎样，它们都逃不过最终转化为像素点的事实。

好了，既然异步光栅化发生在 webview，那 webview 是什么东西呢？从最具体的角度讲，webview 是平台封装好的组件，用来展示 html，就如同在浏览器里查看网页一样。往深层次看，webview 是技术的组合，一个是引擎技术（webkit, servo, chromium），一个是 GUI 技术（gtk）。平台提供的 webview 组件，就是组合了这两种技术。

引擎技术用于解析 html 文件，得到 DOM Tree, CSS Tree, Layout, Render Tree。这些不是虚空的概念，是确切的数据结构。比如 webkit 引擎使用 c++开发，上述概念就对应着 webkit 中的 c++数据结构，可能是 class，也可能是 struct。

只有引擎技术还不够，因为引擎只是负责解析，合成相应的数据结构，它不负责绘制到电脑界面上。这一部分需要依赖 GUI 技术，比如跨平台的 gtk。gtk 生态中，提供了相应的函数库，将 webkit 合成的数据结构转化为 gtk 识别的数据结构，然后 gtk 用这个数据结构，就可以绘制出画面。

webkit 是开源的，提供了 c++ API。因此，你可以下载其源码，使用 c++访问其 API 接口，手动编程处理 html 文件。

给出一个例子，使用 webkit 处理 html，然后用 gtk 渲染出画面。这个代码片段来自于 GPT，可能无法正常执行，但足够反映出基本原理。

```cpp
#include <gtk/gtk.h>
#include <webkit2/webkit2.h>

int main(int argc, char* argv[]) {
    // 初始化GTK
    gtk_init(&argc, &argv);

    // 创建GTK窗口
    GtkWidget *window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_default_size(GTK_WINDOW(window), 800, 600);

    // 创建WebView
    WebKitWebView *webView = WEBKIT_WEB_VIEW(webkit_web_view_new());
    gtk_container_add(GTK_CONTAINER(window), GTK_WIDGET(webView));

    // 加载URL
    webkit_web_view_load_uri(webView, "https://www.example.com");

    // 显示窗口
    gtk_widget_show_all(window);

    // 连接信号处理函数
    g_signal_connect(window, "destroy", G_CALLBACK(gtk_main_quit), NULL);

    // 运行GTK事件循环
    gtk_main();

    return 0;
}
```

这个例子展示如何使用 webkit c++ API,也是 GPT 给出的，可能无法执行，但反映了基本概况：

```cpp
#include <WebKit/WebKit.h>

int main(int argc, char* argv[]) {
    // 初始化WebKit
    WebKitInitialize();

    // 创建WebView配置
    WKContextRef context = WKContextCreate();
    WKPageConfigurationRef configuration = WKPageConfigurationCreate();
    WKPageConfigurationSetContext(configuration, context);

    // 创建WebView
    WKViewRef webView = WKViewCreate(configuration);

    // 加载URL
    WKURLRef url = WKURLCreateWithUTF8CString("https://www.example.com");
    WKPageLoadURL(WKViewGetPage(webView), url);

    // 运行事件循环
    RunEventLoop();

    // 释放资源
    WKRelease(url);
    WKRelease(webView);
    WKRelease(configuration);
    WKRelease(context);

    return 0;
}
```

## SAP MAP SSR SSG ...

SAP, 就是单页应用，页面的切换全部由 js 搞定，不会从服务器发送请求获取页面；

MAP，多页应用，每一个页面都是从服务器发送请求获取到的；

SSR，服务端渲染，服务器动态生成 html 的内容，将 html 返回给前端，通常 html 里夹杂着前端框架的 hydrate 代码；

SSG，由服务器提前生成 html 文件，放在一个地方，前端请求直接拿，不需要服务器做额外的处理；

渐进式应用，利用 web API 打造的应用，支持离线使用、通知推送，本质就是使用了浏览器高级 API 打造的接近主机原生应用的网页；

## 更改 font-weight 后，容器的宽度变了，怎么解决？

使用`font-variation-settings`设置字重：

```css
.option {
  font-variation-settings: "wght" 500;
}
```

## 明明使用 sticky position, 为什么没有固定住？

[stackoverflow 同样的问题](https://stackoverflow.com/questions/50954630/position-sticky-scroll-still-moving-element/50954998#50954998)

问题描述：元素 A 定宽，内部可以滚动，元素 B 是元素 A 的子元素。元素 B 内部拥有元素 C、元素 D、元素 E...元素 C 和元素 D 使用 sticky position 固定在元素 A 的最左侧。滚动条往右继续滚动，快要滚动到头的时候，元素 D 没有定住，往左滚动了一点。

原因：当 sticky position 元素接触到父元素的右边框或者下边框，会失去 sticky 特性。

解决方法：采取适当的方法增大 sticky position 元素的父元素宽度或者高度，让滚动到尽头的时候，元素都碰不到父元素的右边框或者下边框。

## Date 是按照当地时间还是 UTC 时间构建的

```js
// 这里是按照当地时间2024年2月2日9点创建的date,
// 如果当地是北京，你把date打印为UTC时间，
// 字符串显示的是 2024年2月2日1点
const date = new Date(2024, 1, 2, 9);

// 获取当地时间里的年份
date.getFullYear();

// 获取UTC时间里的年份
date.getUTCFullYear();
```

## 为什么服务器执行 webdriver 得到的截图，中文字符变成方块

在服务器，我们可以安装 webdriver，编写程序，运行 headless 浏览器，实现截图。你没听错，是服务器截图。不要认为完成截图操作，就必须要有显示器，必须要有浏览器界面。想想看，浏览器是如何绘制画面的？它只是准备好像素数据，然后送入到显示器的缓存中即可。那么，完全可以基于像素数据直接合成图片。解决了这个问题，我们再去看为什么中文字符变成方块的问题。这是因为服务器的操作系统没有安装默认的字体，导致 headless 浏览器运行的时候，找不到中文字符的字体文件，只好给出一个默认展示了，这就是方块的由来。解决方法当然就是使用操作系统的软件管理器，安装字体文件就可以了，这一点自行 google 查看具体做法，这里不做解释。

## 字体文件 ttf 和 otf 的区别

ttf 比 otf 出来得早，使用二次贝塞尔曲线（otf 用的是三次贝塞尔曲线），文件体积更小，兼容性更广，但是功能没有 otf 全，不能提供连字等更酷炫的功能。解释一下连字。渲染文字一般是一个字一个字渲染，连字的意思是将相邻的两个字当成一个字渲染，因此从视觉上看，这两个字没有间距，不像一个字一个字渲染那样，而且更加美观。

## macOS 的 system tray 如何动态更新

system tray 指的是 macOS 桌面最上面那一行状态栏右侧的部分，这个部分一般会展示 wifi 状态、当前时间、电量，而 macOS 的应用程序也可以在上边注册自己的图标。

像系统资源监测这种 app，会在 system tray 里注册图标，用来告知用户当前的 cpu 用量，内存用量，而且这部分不是静态的，是会不断更新的。针对电量的实现原理，就是准备多个电量图片，依次对应电量 0 到 100%，然后根据操作系统接口查询出数据，根据数据，计算出应该展示哪个图片，再调用接口更新图片即可。

像信息通讯类的 app，也会在 system tray 里注册图标，在图标右侧给出一个数字，告知用户当前有多少条信息未读，数字是不断更新的。

要想实现这种效果，如果使用 Objective-C 或者 Swift 语言，需要使用`NSStatusBar`, [详见](https://developer.apple.com/documentation/appkit/nsstatusbar/)。

如果使用`electron`，只需要使用里边的`Tray` class，调用 `Tray.setImage`更新图标，调用`Tray.setTitle`更新图标右侧的文字。

## 如何让发送到 vite dev server 的请求，定位到任意的文件

假设你在`/a/b`目录下，启动了 vite，那么`http://localhost/hello/tom.html`会被 vite 定位到`/a/b/hello/tom.html`。但是，如果我想让 vite 定位到`/a/c/hello.html`，应该发送什么样的请求给 vite 呢？

关于 dev server，vite 使用了`connect`package 管理服务器的行为，其中它使用了一个`middleware`，定义了一个`@fs`的路径规则，当 vite 接受到请求`http://localhost/@fs/a/c/hello.html`的时候，会把`/a/c/hello.html`当作主机文件系统的绝对路径，将这个文件解析（比如 ts 通过 esbuild 转为 js）、返回。

但`@fs`默认受到限制。如果用`@fs`的方式，访问任意一个文件或者目录，可以在 vite config 中设置：

```js
const config = {
  server: {
    fs: { strict: false },
  },
};
```

这样做的话，权限放的太大，有风险，一般按需设置：

```js
import { searchForWorkspaceRoot } from "vite";
const config = {
  server: {
    fs: {
      strict: true,
      allow: [
        // refer: https://vite.dev/config/server-options.html#server-fs-allow
        searchForWorkspaceRoot(process.cwd()),
        // 开放一个文件
        "/a/c/hello.ts",
        // 开放一个目录
        "/a/d",
      ],
    },
  },
};
```

有了上述设置，如果存在下面的文件，vite 就会把`/a/c/hello.ts`返回：

```html
<html>
  <body>
    <script type="module" src="/@fs/a/c/hello.ts"></script>
  </body>
</html>
```

如果你在 vite config 中设置了 base 为`/cc/dd/`, 那么应该这样调整上述文件：

```html
<html>
  <body>
    <script type="module" src="/cc/dd/@fs/a/c/hello.ts"></script>
  </body>
</html>
```

## 为什么 antd 提供的 Menu 组件，onClick 函数失效

Menu 组件的 items 存储菜单项，叶子菜单项的 children 属性一定要保证是 undefined，如果是空数组，这个菜单项就会被认为是 subMenu，subMenu 在 antd 实现的时候，故意不会触发 onClick 函数。

## 同一个页面多框架运行时是否有问题

假设有一个页面，菜单栏是一个独立的 SPA，主体内容区是一个独立的 SPA。现在就会有一些问题值得考虑。

第一， 两个 SPA，一个使用了 React，一个也使用了 React，并且在各自打包的时候，把 React 代码打包进去了，它们依赖的 React 版本号不一样。这种情形下，除了会有 React 代码的冗余打包外，不会有其他问题。因为打包后的产物，会经过`<script type="module">`的形式引入到页面。`type="module"`的`script`在执行的时候，发生在自身的模块作用域，因此两个产物在执行的时候，不会有变量冲突。而 React 在更新的时候，采用宏任务队列异步执行，两个产物使用通过一个宏队列，但是宏任务队列里边的更新任务不会冲突。

第二，两个 SPA，一个使用了 React, 一个使用了 Vue, 并且各自在打包的时候，把 React 和 Vue 打包进去了。这种情形也不会有问题。除了 ES modules 的模块作用域本身就隔离的原因之外，Vue 在更新的时候，使用微任务队列更新，React 使用宏任务队列更新，二者不冲突。

第三，两个 SPA，一个使用了 React, 一个使用了 Svelte,并且各自在打包的时候，把 React 和 Svelte 打包进去了。这种情形也不会有问题。除了 ES modules 的模块作用域本身就隔离的原因之外，Svelte 在更新的时候，属于同步更新，不依赖微任务队列和宏任务队列。

但也是因为 ES modules 的模块作用域隔离，导致 React 框架代码会重复打包，无法复用。要解决这个问题，有几种考量，但都不太合适：

1. 其中一方将 React 挂载到 window 上，另一个打包产物从 window 上访问。太危险，React 完全裸露，如果有人改变了 React 的属性，会导致页面崩溃，或者出现意想不到的结果。
2. 使用模块联邦。依赖 webpack 新特性，或者其余打包工具的插件能力。最致命的是，对于打包产物的 url 管理是一件很头大的事情。其中一方想要使用另一方打包好的 React 代码，就必须要知道另一方的打包产物的 url，当另一方打包产物更新，文件的 hash 值变化了，那么如何动态同步 url，又是一个问题。
3. 用 cdn 嵌入 React。这种方式依然会把 React 暴露在 window 身上，很危险。

## XSS & CSRF

XSS: cross site scripting, 跨网页脚本攻击，意思是攻击者通过某种方式，将一段脚本注入到受害者访问的网页，脚本执行后，受害者在该网站的信息或者权益被侵占。防止攻击的方法：

1. 网页设置 X-Content-Type-Options：nosniff。这样浏览器不会把所有内容都按照 html 解析处理，可以降低 xss 触发的概率。
2. 网页设置 Content-Security-Policy，这可以让浏览器只去加载和执行特定服务源的内容。

CSRF： cross site request forgery, 跨网页请求攻击，这里给出一个例子。用户在网站 A 登录后，浏览器记录下网站 A 的 cookie，攻击者诱导受害者访问网站 B，并向网站 A 发送请求，虽然网站 B 和网站 A 域名不一样，网站 B 无法用 js 访问到网站 A 的 cookie，但是浏览器拥有一个默认行为，它发现要发送请求到 A，而且拥有 A 的 cookie，它就会自动把这个 cookie 带上。防止的办法就是在种下 cookie 的时候，给 cookie 设置 SameSite 限制，这样就可以禁止刚才提到的默认行为。
