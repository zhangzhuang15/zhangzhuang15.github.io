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