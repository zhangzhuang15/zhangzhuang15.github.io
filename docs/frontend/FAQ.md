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