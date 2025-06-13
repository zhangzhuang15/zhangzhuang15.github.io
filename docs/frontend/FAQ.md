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

这样使用lodash，webpack最终结果还是把loadsh整个内容打包进去了，而不是仅打包zip函数。

原因一：lodash本身采用commonjs方式编写，其`package.json`没有声明`sideEffects: false`

基于此，你应该改写为：
```ts 
import zip from "lodash/zip";
```


原因二：webpack在 production 模式下，默认会开启 tree-shaking，但可能你开启了某些配置项，将它禁止了

原因三：你依赖的其它库也使用了`lodash`，但它按照最开始说的错误方式导入了`lodash`


## 这些“黑话”啥意思
### shebang
```js 
#!/usr/bin/env node

console.log('hello world');
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
footgun通常指的是那些容易导致程序员犯错的语言特性、API设计或配置选项。例如，一个功能强大但使用不当会导致严重后果的API.


### boilerplate
样板代码，模板

### shims
意思和 polyfill 相似，都是垫片儿的意思。垫片儿的作用是让旧版本的东西可以使用新版本的特性。

### helpers 
在设计一个库时，想通过一套API隐藏底层实现，让用户更轻松、更简单地使用库，这套API函数就是 helper.

### bump version
常见于git commit的comment中，表示版本号升级1个

### kick to login
将用户强制重定向到登录页

### aka
also known as, abbreviation

### nailed it
常见于github评论中，表示 well done, 做的好

## 使用 javascript API 遇到的坑
### 数组 empty slot 被跳过
❌
```ts 
const arr = new Array(3).map((_, index) => index + 1)

// expect: [1,2,3]
// actual: [<3 empty items>]
// arr[0] === undefined
```

✅
```ts
const arr = new Array(3).fill(1).map((_, index) => index + 1)
```

### Date设置日期
```ts 
const date = new Date("2024-02-07")

date.setDate(0);

// date: "2024-01-31"
```

```ts 
const date = new Date("2024-02-07")

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
const path = require("path")

path.resolve("/a/b", "c") // /a/b/c
path.join("/a/b", "c")    // /a/b/c

path.resolve("/a/b", "./c")  // /a/b/c
path.join("/a/b", "./c")  // /a/b/c


path.resolve("/a/b", "../c")  // /a/c
path.join("/a/b", "../c")     // /a/c

path.resolve("/a/b.txt", "c")  // /a/b.txt/c
path.join("/a/b.txt", "c")     // /a/b.txt/c

path.resolve("/a/b.txt", "./c")  // /a/b.txt/c
path.join("/a/b.txt", "./c")     // /a/b.txt/c

path.resolve("/a/b.txt", "../c") // /a/c
path.join("/a/b.txt", "../c")    // /a/c

path.resolve("/a/b.txt", "/c")   // /c
path.join("/a/b.txt", "/c")      // /a/b.txt/c

path.resolve("./a/b.txt", "./c") // /Users/xxxx/a/b.txt/c   /Users/xxxx stands for cwd
path.join("./a/b.txt", "./c")    // a/b.txt/c


path.normalize("/a/b.txt/c.tt")    // /a/b.txt/c.tt
path.normalize("/a/b.txt/./c.tt")  // /a/b.txt/c.tt
path.normalize("/a/b.txt/../c.tt") // /a/c.tt
path.normalize("a/b.txt/../c.tt")  // a/c.tt
```



## typescript 的 class 编译结果
```ts
class M {
    static n = ""
    static {
        console.log(M.n)
    }

    name = "jack"
    hello = () => {
        console.log(this.name)
    }

    static tryIt() {}

    ok() {
        console.log(this.name)
    }

    constructor() {
        this.name = "black"
    }
}
```
after compiled:

```js
class M {
    constructor() {
        this.name = "jack"
        this.hello = () => {
            console.log(this.name)
        }
        this.name = "black"
    }
    static tryIt() {}

    ok() {
        console.log(this.name)
    }
}

M.n = ""
(function(){
    console.log(M.n)
})()
```

## localStorage 和 sessionStorage 的存储容量限制
每个 origin，最多允许存储 10MB 的数据（5MB localStorage, 5MB sessionStorage）

[MDN | Storage容量限制](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage)

## web worker 最多开多少个
没有找到具体的官方文档，但是可以参考[stackoverflow | Number of Web Workers Limit](https://stackoverflow.com/questions/13574158/number-of-web-workers-limit)

FireFox浏览器最多允许创建20个；
> FireFox的限制数量可以改变配置；

Chrome浏览器最多允许创建60+个；

Opera浏览器最多允许创建16个；


值得关注的是，web worker占据一个系统线程，因此不要过多创建web worker，web worker的数量和主机的CPU核数保持一致即可，数量多了未必能提升性能。


## 前端工程中，如何处理 web worker
使用 webpack 打包的前端应用中，可以使用 `worker-loader` 处理

```js 
module.exports = {
    module: {
        rules: [
            {
                test: /\.web-worker\.js/,
                use: [{ loader: 'worker-loader' }],
            }
        ]
    }
}
```
```js 
import Worker from "./demo.web-worker.js"
const worker = new Worker();
worker.postMessage('');
worker.addEventListener("message", (event) => {})
```

- 支持 `Worker` 和 `SharedWorker`
- 支持设置worker文件打包后的名称和路径


## `Failed to execute 'postMessage' on 'Window': 2 arguments required, but only 1 present.`
浏览器差异，在 chrome v123没有问题，在 chrome v69 会有问题。

MDN上说：`window.postMessage(data, targetOrigin)` ，第二个参数是optional，这不准确，像 chrome v69 环境下，第二个参数就必须填写。

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

## 为什么修改了/etc/hosts文件，还是没有效果
- /etc/hosts内容的格式不对，通常发生在直接往里面粘贴一些内容的时候
- 浏览器的DNS缓存没有清除
- 操作系统的DNS缓存没有清除

## 小程序如何实现h5跳转
h5一般指的是适配移动端屏幕的网页；

第一步，正常开发h5页面，部署到nginx上，假设链接地址为 “http://mock.cc/helloworld.html”

第二步，在小程序页面组件的wxml中，使用 `<web-view>` 组件，该组件有如下props：
- url, 用于渲染指定的网页
- bindmessage, 用于处理内嵌网页发送给web-view的数据
- bindload, 内嵌网页在 web-view 中加载时触发的事件
> webview域名没有在后台配置的话，打开网页，会触发此事件，并跳转到网页：https://mp.weixin.qq.com/mp/waerrpage
- binderror, 内嵌网页加载失败时触发的事件

url可以从小程序页面组件的 onLoad 入参中获取到；

第三步，在其它页面，使用 `wx.navigateTo` 跳转到包含`<web-view>`的组件内，内嵌网页的url作为query参数
传递过去，`wx.navigateTo({ url: "/pages/webview/main?url='http://mock.cc.helloworld.html'"})`
> 注意 url 的限制长度，内嵌网页的url不要太长

## 如何实现客户端灰度控制
第一步，建立一个配置文件，在上面配置灰度进度（比如60，表示60%）和白名单（userID）;

第二步，开发一个服务接口，供客户端获取这个配置文件；

第三步，客户端发送请求，拉取配置文件，检测用户是否命中灰度
- userID没有在白名单中，灰度为60，如果userID末尾两位是'00'到'59'，那么用户命中灰度了；
- userID在白名单中，命中灰度了；

第四步，将用户命中灰度的情况，写入到客户端缓存（可以是内存，也可以是磁盘，看你怎么设计），下次
用户再登录的时候，就可以直接命中灰度了


## 如何实现 js bridge

### js 调用 native

方法一：native端使用原生 webview 组件提供的接口函数，将native端定义的函数注册到 webview 里面，
挂载到内嵌网页的 window 对象上。内嵌网页执行 window 上的方法时，就会触发 native 中的方法。

方法二：内嵌网页通过某种方式，发送请求，native 端可以借助 webview 组件提供的能力，注册一个函数，
拦截下所有内嵌网页的请求，对请求进行分析，拿到数据，然后调用 native 函数做处理。

### native 调用 js
native端使用原生 webview 组件提供的接口函数，可以直接执行一段js代码，比如`nativeCall("doPost({code: '0', value: 10, id: 1324324 })")`, 执行的环境就是内嵌网页的window。


## 小程序大致原理
小程序自身的DSL（wxml and wxss）会在编译阶段转为原生组件（UIView in ios）；

小程序的渲染引擎会将数据的改变，落实到原生组件的更新上；

小程序中的js代码会在一个独立的环境执行，比如ios上，有相应的API创建一个javascript core执行环境，
小程序中的js代码就会执行在这里边，native可以使用API拿到执行结果；
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

native侧可以使用Core Graphics自定义原生的组件：
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

小程序在js侧会有虚拟DOM，每个虚拟DOM都会有一个唯一标识符，通过这个唯一标识符，native端可以知道
该虚拟DOM对应的是哪一个原生组件；

整体的运行流程就是：

1. 和原生UI发生交互，交互绑定的处理代码，主动调用javascript core中的代码，进入js侧；
2. 在js侧，完成计算，更新虚拟DOM节点，触发虚拟DOM的patch;
3. 虚拟DOM patch完成，拿到要更新的组件的唯一标识符以及对应的状态数据；
4. js侧将数据返回，回到native侧；
5. native侧将数据交给渲染引擎；
6. 渲染引擎将数据更新到原生组件上；

整套逻辑最难的地方就在于：
- 编译的过程
- 渲染引擎如何渲染

渲染引擎可以参考 `React Native`、 `Weex`、 `Flutter`、 `uni-app`的实现；

## webpack提供了哪些访问模块的辅助能力
### require.context
```js 
// 访问文件夹 assets 下所有的 png 文件资源
const requireModule = require.context("./assets/", false, /\.png/);

requireModule.keys().forEach(path => {
    // 打印资源路径，注意，这不是资源最终输出的路径，而是源码中的路径
    console.log(path)

    // 引入资源，如果资源是一个js文件，返回值就是js的导出模块；
    // 如果资源是非js文件，返回值取决于处理这个文件的loader，
    // 例如资源是图片，图片的loader就会将图片最终输出的路径作为结果返回；
    const url = requireModule(path)
})
```

### require.ensure
```js
require.ensure(['a', 'b'], () => {
    // 当 ‘a’ 和 'b' 都被确认存在，执行此函数

    const a = require('a');
    const b = require('b');
})
```

### require.resolve
```js
// 返回 module-A 的引入路径，但不会真的引入该依赖
const modulePath = require.resolve('module-A');

```

## 10位时间戳
工作期间，遇到后端要求传递10位时间戳的问题。为什么要传递10位，不传递11位、9位呢？

在前端，完整的时间戳是这样生成的：

```js
const stamp = new Date().getTime().toString();
```

打印出来，你会发现是 13 位；

后三位有什么秘密呢？

```js 
console.log(new Date(1717492218502).toISOString())
// '2024-06-04T09:10:18.502Z'

console.log(new Date(1717492218000).toISOString())
// '2024-06-04T09:10:18.000Z'

console.log(new Date(1717492218120).toISOString())
// '2024-06-04T09:10:18.120Z'
```

你应该知道答案了。事实上，最后三位并不会带来巨大的时间偏差，可以省略。但是后端在
接收到时间戳之后，需要在末尾添加3个0才能使用。


## http2协议
[阅读http2协议标准文档](https://datatracker.ietf.org/doc/html/rfc7540)

## vue-loader v14.2.0不能识别处理`<script lang='jsx'>` ？
你在webpack配置文件里边，已经使用 `babel-loader` 处理 js 和 jsx, 使用 `vue-loader` 处理vue 文件，你在一个vue文件中，使用了 `<script lang='jsx'>` 的标签，可你已运行项目，就得到了这样的错误：`cannot resolve 'jsx-loader'`。

嗯？

我明明有 `babel-loader`，为什么不好使呢？

你一定是这样想的：`vue-loader`在解析到script标签的时候，发现lang是`jsx`，然后就会把代码提取出来，等着后边的 `babel-loader`处理。

事实并非如此，`vue-loader`发现lang是`jsx`的时候，会看看vue-loader有没有内置的处理jsx的loader, 如果没有，它就会简单粗暴地按照`{lang}-loader`的形式，寻找loader去处理，其核心代码逻辑如下：
```js
// lib/helpers.js

// sass => sass-loader
// sass-loader => sass-loader
// sass?indentedSyntax!css => sass-loader?indentedSyntax!css-loader
function ensureLoader (lang) {
  return lang
    .split('!')
    .map(loader =>
      loader.replace(
        /^([\w-]+)(\?.*)?/,
        (_, name, query) =>
          (/-loader$/.test(name) ? name : name + '-loader') + (query || '')
      )
    )
    .join('!')
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
                        jsx: "babel-loader"
                    }
                }
            },
            {
                test: /js(x)?$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    }
}

```

## `Its return type 'ReactElement<any, any> | null' is not a valid JSX element`
这个问题发生在用react编写的`.tsx`文件中，明明用 `React.FC` 定义的函数组件，在 tsx 结构里使用时，vscode 飘红报错，说是语法有问题。

原因是，本地项目依赖中，有多个版本的 react .d.ts 声明文件，解决方法是重新安装依赖😭

这里有个[stackoverflow上的解答](https://stackoverflow.com/questions/53822891/jsx-element-type-reactelementany-null-is-not-a-constructor-function-for-js)


## node-gyp 执行时，遇到python问题： ModuleNotFoundError: No module named 'distutils'
在electron项目中，项目运行的时候，可能会使用 node-gyp, 进而遇到和 python 相关的问题。

这个问题是因为python版本号不正确。在macOS上，删除系统预装的python非常困难，因此我们可以变通地解决
这个问题，在启动项目之前，设置一个全局变量：
```shell  
export PYTHON=/opt/homebrew/bin/python3.11
```

之后再启动项目，这个时候 node-gyp 就会使用 python3.11 执行python脚本了。

[Github问题案例](https://github.com/cypress-io/cypress/issues/28695)


## webpack允许 import undefined variable?
如果你的代码import undefined variable，然后你用webpack构建项目的时候，webpack竟然没有报错。可这个问题非常严重，因为在代码运行的时候，一旦使用这个变量，会导致crash。

如果想让webpack及时报错，设置`webpackConfig.module.strictExportPresence` 为 true 即可。

开启这个配置之后，你仍需要注意：
:::code-group
```js [src/mod.js]
export function hello() {
    console.log("hello world")
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
    M.jack()
}

// webpack fails
if (M['jack']) {
    M['jack']()
}

// webpack works!
// so if you want to access variable mounted on
// M dymatically, write code in this style
if (M['jack' + '']) {
    M['jack' + '']()
}
```
:::


## 事件派发的默认顺序
默认**bubble**顺序，即注册回调函数的最内层dom节点先执行，然后事件向外层传播，外层中注册回调函数的dom节点依次执行；

如果要指定**capture**顺序，请这样做：
```js 
dom.addEventListener("click", () => {}, { capture: true })
```

## mousedown,mouseup,click事件的顺序
mousedown -> mouseup -> click


## vue2和vue3中的 array refs
[stackoverflow上的解释](https://stackoverflow.com/questions/52086128/vue-js-ref-inside-the-v-for-loop)

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
            cards: ["a", "b"]
        }
    },
    mounted() {
        // 得到一个数组，不是一个 vue instance;
        // 你无需将 index绑定到 ref上，直接设置
        // ref="item"， 用 this.$refs["item"][0] 访问即可
        this.$refs["item_0"];

        //  得到一个 vue instance, 不是数组
        this.$refs["uniq"];
    }
}
</script>
```

vue3中，不会在解析 v-for 语法糖的时候，自动生成数组，挂载到 $refs 上面，你可以改写成这样：
```vue
<template>
  <div 
    v-for="item in list" 
    :ref="setItemRef">
  </div>
</template>

// optional API
<script>
export default {
  data() {
    return {
      itemRefs: []
    }
  },
  methods: {
    setItemRef(el) {
      if (el) {
        this.itemRefs.push(el)
      }
    }
  },
  beforeUpdate() {
    this.itemRefs = []
  },
  updated() {
    console.log(this.itemRefs)
  }
}
</script>


// composition API
<script>
import { onBeforeUpdate, onUpdated } from 'vue'

export default {
  setup() {
    let itemRefs = []
    const setItemRef = el => {
      if (el) {
        itemRefs.push(el)
      }
    }
    onBeforeUpdate(() => {
      itemRefs = []
    })
    onUpdated(() => {
      console.log(itemRefs)
    })
    return {
      setItemRef
    }
  }
}
</script>
```

## 低版本typescript处理optional chain的问题
```ts
const state = localStorage.getItem("value")
const stateIsRight = state?.some(i => i.k > 10);
```
使用 typescript@2.9.2及以下版本处理上述代码的时候，optional chain 不会被正确编译，且会在 state 和 “?” 中间加入空格。请使用3.0.0及以上版本的typescript。

ts-loader处理代码的时候，使用项目安装的typescript去处理，所以在项目中使用 ts-loader的时候，也要看一眼typescript的版本号是否过低。

## 为什么babel-loader没有处理node_modules下的js文件
如果你在webpack中如此配置：
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

如果你的babel配置文件是 babelrc, 那么上述配置很可能会失效。

自babel7.0开始，babel在处理node_modules下的文件时，不会按照babelrc给出的配置执行；

解决方式有两种：
1. 把babelrc换成babel.config.js;
2. 在webpack中，明确指出“babel-loader”的options项；

## webpack 的 module.rules 里，test正则表达式匹配的是什么？
有如下webpack配置：
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

当webpack遇到`import {} from 'A'` 代码的时候，就会解析A，得到A的resource，基于resource形成一个request。

resource就是资源的绝对路径，比如'A'的resource, 就是package A的入口文件绝对路径；

request是一个字符串，它基于resource，加入loader的扩展信息，比如`/node_modules/babel-loader/index.js!/node_modules/A/index.js`;

如果你想调试看看，可以编写这样的Plugin，打断点调试：
```js
class ModuleResolverSuspendPlugin { 
    constructor() {}

    static PluginName = "ModuleResolverSuspendPlugin"

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
                )
            }
        )

    }
}

module.exports.ModuleResolverSuspendPlugin = ModuleResolverSuspendPlugin;
```
webpack配置：
```js
const { ModuleResolverSuspendPlugin } = require("./ModuleResolverSuspendPlugin.js")
module.exports = {
  ...,
  plugins: [
    new ModuleResolverSuspendPlugin()
  ]
}
```

## vscode调试项目的时候，cannot resolve "node"
先确认一下，是否安装了node，并且在环境变量Path中，配置了node路径；

如果满足上一个条件，那就是和你打开项目的方式有关系。你需要在macOS的terminal（其他系统，则选择默认的终端工具）中，切换到项目的根目录下，然后执行 `code .`，这样就可以了。

如果命令行中，没有 `code`，请阅读[这里](/tool/vscode-config#在-path-中安装-code)

## onChange事件函数用debounce包裹后，为什么无法拿到正确的Event对象？
```jsx
import debounce from "lodash/debounce"
const Component = () => {

  const onChange = debounce((e) => {
    // 报错！e.target是null，拿不到输入框的值
    e.target.value;
  }, 200, { trailing: true });
  return (
    <Input 
      onChange={onChange}
    />
  );
}
```
如上，展示了在第三方组件 Input 中，使用 debounce 时，可能遇到的错误；

原因是 debounce 采用了 `trailing: true` 的做法。当事件被触发的时候，由于我们指定了这个配置，导致不会立即执行onChange函数，在200ms后，才会执行，那这个时候就有问题了，执行时得到的e，是输入框改变的事件对象么？肯定不是。于是，就会有e.target.value获取不到输入框内容的错误。正确做法是，改用`leading: true`.


## webview是ios特有的东西么
最近，公司内部有人反馈，在安卓端App的长列表页面，迅速下滑的时候，列表页会出现短暂的空白，他不知道怎么回事儿。

群里有大佬表示，这是webview异步光栅化造成的。哦？ webview, 异步光栅化，WTF？

先说光栅化。光栅化是指将矢量图转化为位图的操作。异步光栅化就是在手机后台线程中完成这个事情，不在主线程去搞。好处就是，主线程不会被阻塞，页面表现流畅。坏处就是，光栅化耗时较大时，得不到位图数据，页面来不及显示内容，这种就叫做页面延迟，就是上边那个人反馈的情况。

既然说到这里了，不得不提一嘴`矢量图`和`位图`。矢量图就是所有的像素点经过数学公式计算出来的图。当矢量图缩放时，新的尺寸会代入到公式，重新计算一遍新的像素点，这些像素点都是准确的，因此绘制出来的图像也是清晰的。位图的像素点是固定的，当放大位图时，多出来的像素点是通过插值算法计算得到的，因此这些新的像素点不太精准，导致最终绘制出来的结果模糊、不平滑。可无论怎样，它们都逃不过最终转化为像素点的事实。

好了，既然异步光栅化发生在webview，那webview是什么东西呢？从最具体的角度讲，webview是平台封装好的组件，用来展示html，就如同在浏览器里查看网页一样。往深层次看，webview是技术的组合，一个是引擎技术（webkit, servo, chromium），一个是GUI技术（gtk）。平台提供的webview组件，就是组合了这两种技术。

引擎技术用于解析html文件，得到 DOM Tree, CSS Tree, Layout, Render Tree。这些不是虚空的概念，是确切的数据结构。比如webkit引擎使用c++开发，上述概念就对应着webkit中的c++数据结构，可能是class，也可能是struct。

只有引擎技术还不够，因为引擎只是负责解析，合成相应的数据结构，它不负责绘制到电脑界面上。这一部分需要依赖GUI技术，比如跨平台的gtk。gtk生态中，提供了相应的函数库，将webkit合成的数据结构转化为gtk识别的数据结构，然后gtk用这个数据结构，就可以绘制出画面。

webkit是开源的，提供了c++ API。因此，你可以下载其源码，使用c++访问其API接口，手动编程处理html文件。

给出一个例子，使用webkit处理html，然后用gtk渲染出画面。这个代码片段来自于GPT，可能无法正常执行，但足够反映出基本原理。
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

这个例子展示如何使用webkit c++ API,也是GPT给出的，可能无法执行，但反映了基本概况：
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
SAP, 就是单页应用，页面的切换全部由js搞定，不会从服务器发送请求获取页面；

MAP，多页应用，每一个页面都是从服务器发送请求获取到的；

SSR，服务端渲染，服务器动态生成html的内容，将html返回给前端，通常html里夹杂着前端框架的hydrate代码；

SSG，由服务器提前生成html文件，放在一个地方，前端请求直接拿，不需要服务器做额外的处理；

渐进式应用，利用web API打造的应用，支持离线使用、通知推送，本质就是使用了浏览器高级API打造的接近主机原生应用的网页；


## 更改font-weight后，容器的宽度变了，怎么解决？
使用`font-variation-settings`设置字重：
```css
.option {
  font-variation-settings: 'wght' 500;
}
```

## 明明使用sticky position, 为什么没有固定住？
[stackoverflow同样的问题](https://stackoverflow.com/questions/50954630/position-sticky-scroll-still-moving-element/50954998#50954998)

问题描述：元素A定宽，内部可以滚动，元素B是元素A的子元素。元素B内部拥有元素C、元素D、元素E...元素C和元素D使用sticky position固定在元素A的最左侧。滚动条往右继续滚动，快要滚动到头的时候，元素D没有定住，往左滚动了一点。

原因：当sticky position元素接触到父元素的右边框或者下边框，会失去 sticky 特性。

解决方法：采取适当的方法增大sticky position元素的父元素宽度或者高度，让滚动到尽头的时候，元素都碰不到父元素的右边框或者下边框。

## Date 是按照当地时间还是UTC时间构建的
```js 
// 这里是按照当地时间2024年2月2日9点创建的date,
// 如果当地是北京，你把date打印为UTC时间，
// 字符串显示的是 2024年2月2日1点
const date = new Date(2024, 1, 2, 9)

// 获取当地时间里的年份
date.getFullYear()

// 获取UTC时间里的年份
date.getUTCFullYear()
```

## 为什么服务器执行webdriver得到的截图，中文字符变成方块
在服务器，我们可以安装webdriver，编写程序，运行 headless 浏览器，实现截图。你没听错，是服务器截图。不要认为完成截图操作，就必须要有显示器，必须要有浏览器界面。想想看，浏览器是如何绘制画面的？它只是准备好像素数据，然后送入到显示器的缓存中即可。那么，完全可以基于像素数据直接合成图片。解决了这个问题，我们再去看为什么中文字符变成方块的问题。这是因为服务器的操作系统没有安装默认的字体，导致 headless 浏览器运行的时候，找不到中文字符的字体文件，只好给出一个默认展示了，这就是方块的由来。解决方法当然就是使用操作系统的软件管理器，安装字体文件就可以了，这一点自行google查看具体做法，这里不做解释。

## 字体文件ttf和otf的区别
ttf比otf出来得早，使用二次贝塞尔曲线（otf用的是三次贝塞尔曲线），文件体积更小，兼容性更广，但是功能没有otf全，不能提供连字等更酷炫的功能。解释一下连字。渲染文字一般是一个字一个字渲染，连字的意思是将相邻的两个字当成一个字渲染，因此从视觉上看，这两个字没有间距，不像一个字一个字渲染那样，而且更加美观。

## macOS的system tray如何动态更新
system tray 指的是macOS桌面最上面那一行状态栏右侧的部分，这个部分一般会展示wifi状态、当前时间、电量，而macOS的应用程序也可以在上边注册自己的图标。

像系统资源监测这种app，会在system tray里注册图标，用来告知用户当前的cpu用量，内存用量，而且这部分不是静态的，是会不断更新的。针对电量的实现原理，就是准备多个电量图片，依次对应电量0到100%，然后根据操作系统接口查询出数据，根据数据，计算出应该展示哪个图片，再调用接口更新图片即可。

像信息通讯类的app，也会在system tray里注册图标，在图标右侧给出一个数字，告知用户当前有多少条信息未读，数字是不断更新的。

要想实现这种效果，如果使用Objective-C或者Swift语言，需要使用`NSStatusBar`, [详见](https://developer.apple.com/documentation/appkit/nsstatusbar/)。

如果使用`electron`，只需要使用里边的`Tray` class，调用 `Tray.setImage`更新图标，调用`Tray.setTitle`更新图标右侧的文字。

## 如何让发送到vite dev server的请求，定位到任意的文件
假设你在`/a/b`目录下，启动了vite，那么`http://localhost/hello/tom.html`会被vite定位到`/a/b/hello/tom.html`。但是，如果我想让vite定位到`/a/c/hello.html`，应该发送什么样的请求给vite呢？

关于dev server，vite使用了`connect`package 管理服务器的行为，其中它使用了一个`middleware`，定义了一个`@fs`的路径规则，当vite接受到请求`http://localhost/@fs/a/c/hello.html`的时候，会把`/a/c/hello.html`当作主机文件系统的绝对路径，将这个文件解析（比如ts通过esbuild转为js）、返回。

但`@fs`默认受到限制。如果用`@fs`的方式，访问任意一个文件或者目录，可以在vite config中设置：
```js 

const config = {
  server: {
    fs: { strict: false }
  }
}
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
        '/a/c/hello.ts',
        // 开放一个目录
        '/a/d'
      ]
    }
  }
}
```

有了上述设置，如果存在下面的文件，vite就会把`/a/c/hello.ts`返回：
```html 
<html>
  <body>
    <script type="module" src="/@fs/a/c/hello.ts"></script>
  </body>
</html>
```

如果你在vite config中设置了base为`/cc/dd/`, 那么应该这样调整上述文件：
```html 
<html>
  <body>
    <script type="module" src="/cc/dd/@fs/a/c/hello.ts"></script>
  </body>
</html>
```