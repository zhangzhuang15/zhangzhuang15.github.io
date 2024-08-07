---
title: "code snippet"
page: true
aside: true
---

## Description 
记录一些实用的代码片段

## 判断某个类是浏览器器native的
```js 
function isNative(API) {
    return typeof API === 'function' && /native code/.test(API.toString());
}
```
> From Vue2 source code

## 查看localStorage用了多少字节
```ts
new Blob(Object.value(localStorage)).size
```

## 复制一段文字（保留换行）
```ts 
async function copy(text: string) {
    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return
        } catch(e) {}
    }

    // 必须用 textarea, 如果用 div, 换行符就丢了
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style['width'] = 0
    textArea.style['height'] = 0
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
}
```

## 触发浏览器下载
```ts
function download(file: any) {
    const blob = new Blob([file])
    // url 会绑定 blob 的内存
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    document.body.appendChild(a)
    a.click()
    // 释放 url，这样浏览器就会自动释放url绑定的内存
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
}
```
:::tip <TipIcon />
这种下载方式的缺点是，使用了blob, 会消耗浏览器的堆内存资源，如果 file 太大，会导致卡顿；

如果要下载比较大的文件，可以让后端给出资源的url，然后使用 `<a href="url"></a>`完成下载，不要
在前端用 `URL.createObjectURL` 生成url。
:::


## setup-cleanup
```ts
const listeners = [];
let size = 0;

function loadListener(listener) {
  // setup
  listeners.push(listener);
  size += 1;
  const index = listeners.length - 1;

  // cleanup
  return function removeListener() {
    listeners[index] = null;
    size -= 1;

    if (size === 0) {
        listeners.splice(0, listeners.length)
    }
  };
}
```

## plugin apply

```ts
const baseConfig = {
  name: "config",
  beforeRun: [],
  afterRun: [],
};

const helloPlugin = (config: typeof baseConfig) => {
  config.beforeRun.push(() => {
    console.log("hello world");
  });
};

const byePlugin = (config: typeof baseConfig) => {
  config.afterRun.push(() => {
    console.log("Bye bye");
  });
};

function resolveConfig(baseConfig, ...configPlugin) {
  configPlugin.forEach((plugin) => plugin(baseConfig));
}

// 精髓在于，逻辑上是config使用plugin，config是主动调用的一方，
// 但实现上，这个关系被反转了，plugin是主动调用的一方，config
// 是被动的一方。
//
// 因为config本身的数据结构是更稳定的一方，作为被调用的一方更合适。
```

## one-step one-dispatch

```ts
interface Callable {
  (...args: any[]): any;
}

function schedule(): number;

function dispatcher(calls: Callable[]) {
  let start = 0;

  function dispatch(i: number, value: any) {
    const call = calls[i];

    if (call) {
      const result = call(value);
      // 通过一个调度方式，获取下一个要执行的任务，
      // 这就是 one-step
      const next = schedule();
      // 在上个任务计算结束后，再去执行下一个任务，
      // 这就是 one-dispatch
      return dispatch(next, result);
    }

    return value;
  }

  return function () {
    return dispatch(0, null);
  };
}

// 不使用迭代去执行任务，而是在一个任务执行完成后，
// 利用递归，执行下一个任务，感觉上就像是走完一步，
// 想想下一步怎么走，然后再走出去， one-step, one-dispatch,
//
// 有一点不太爽的地方是，dispatch 的调用者，没办法控制
// one-dispatch触发的时机
```

## one-step one-dispatch in control

```ts
type Middleware = (context: any, next?: Function) => any;

const compositeMiddlewares = (middlewares: Middleware[]): Middleware => {
  return function (context: any, next?: Function) {
    let index = -1;
    return dispatch(0);

    function dispatch(i: number) {
      if (index >= i) return Promise.reject("call next many times");

      index = i;

      let middleware: Middleware | Function | undefined = middlewares[index];

      if (index === middlewares.length) middleware = next;

      if (!middleware) return Promise.resolve();

      try {
        return middleware(context, dispatch.bind(null, i + 1));
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
};

// 代码实现来自 @koa/composite,
// 这个版本，用户在定义middleware的时候，可以在函数内
// 调用 next 来控制下一个 dispatch

const middlewareA = (context, next) => {
  console.log("ok");
  next();
  console.log("finish");
};

const middlewareB = (context, next) => {
  console.log("end");
  next();
};

const middleware = compositeMiddlewares([middlewareA, middlewareB]);

middleware({ data: 10 }, () => {
  console.log("wow");
});
```

## promise chain

```ts
function link(initialValue, works) {
  let promise = Promise.resolve(initialValue);

  for (const work of works) {
    promise = promise.then((v) => work(v));
  }

  return promise;
}
```

## 格式化、高亮化sql语句
```js 
import highlightjs from "highlight.js"

const sourceCode = `
 WITH basic AS (
    SELECT
     sn.dt AS dt,
         sn.poi_type AS poi_type
              FROM
               ()
            )`

import * as formatter from "sql-formatter"

// 格式化
let result = formatter.format(sourceCode, { 
    language: 'sql',
    tabWidth: 2,
    keywordCase: 'upper',
    linesBetweenQueries: 1 });

// 高亮化
const h_result = highlightjs.highlight(result, {language: "sql"});

// 高亮化之后的 html
console.log(h_result.value)
```

高亮代码也可以用 prismjs 实现：
```js 
const {highlight, languages} = require("prismjs");
const loadLanguages = require("prismjs/components/index");
loadLanguages(['javascript']);
const source = `
  import A from "./src/a.js"
  // value
  const val = {
    name: "Jack",
    data: 10
  };

  function hello() {
    console.log("hello world");
  }

  hello();
`;
const code = highlight(source, languages.sql, 'javascript');
// 高亮处理后的html
console.log(code)
```

## input失焦后，点击dropdown列表中的元素，如何阻止dropdown收起
考虑这样的问题：输入框聚焦后，有个下拉列表出现，然后你点击下拉列表中的某一项，结果下拉列表消失，
列表项的点击事件没有触发。

本质上看，当你点击下拉列表项的时候，先触发了 onblur 事件，后触发 onclick 事件，但是由于 onblur 
里的逻辑，导致列表从DOM树中消失，进而使得 onclick 事件没有执行。

解决方法如下，出自[stackoverflow](https://stackoverflow.com/questions/39439115/how-to-execute-click-function-before-the-blur-function/57983847#57983847)
```html
<body>
  <input type="text" onblur="onBlur" />
  <ul>
    <li tabindex='-1' onclick="onClick"></li>
  </ul>
  <script>
    function onBlur(e) {
      if (e.relatedTarget) {
        // jump over, go to onclick
        return;
      }

      // do something
    } 

    function onClick() {
      console.log("I'm clicked")
    }
  </script>
</body>
```
tabindex的作用详见[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)

简单来讲：
- 设置 tabindex 的 element，可以聚焦；
- 设置 tabindex='-1', 表示不能通过按下 tab 键获得聚焦，但可以通过鼠标聚焦；
- 设置 tabindex='2', 表示可以通过 tab 键获得聚焦，正数形式下，数字越小，越先获得聚焦；
## 判断电脑是否联网
```js 
const online = navigator.onLine;
if (online) {
  console.log("联网")
}
```

## 判断电脑是否在充电
```js 

navigator
 .getBattery()
 .then(batteryManager => {
  if (batteryManager.charging) {
    console.log("正在充电")
  }
 })
```

## 判断电脑连接的是4G还是3G
```js 
const webType = navigator.connection.effectiveType

if (webType === '4g') {
  console.log("连接了4g")
}

```

## 获取浏览器宿主机的cpu核心数
```js 
const cores = navigator.hardwareConcurrency
```

## 获取浏览器使用的最大内存（GB）
```js 
const memory = navigator.deviceMemory
```

## 获取当前经纬度
在 https 环境下生效

```js 
navigator
  .geolocation
  .getCurrentPosition(
    position => {
      const a = position.coords.latitude;
      const b = position.coords.longitude;
      // 精确到几米
      const accuracy = position.coords.accuracy;
    }, 
    err => console.log(err))

```
## 判断电脑是否联网
```js 
const online = navigator.onLine;
if (online) {
  console.log("联网")
}
```

## 判断电脑是否在充电
```js 

navigator
 .getBattery()
 .then(batteryManager => {
  if (batteryManager.charging) {
    console.log("正在充电")
  }
 })
```

## 判断电脑连接的是4G还是3G
```js 
const webType = navigator.connection.effectiveType

if (webType === '4g') {
  console.log("连接了4g")
}

```

## 获取浏览器宿主机的cpu核心数
```js 
const cores = navigator.hardwareConcurrency
```

## 获取浏览器使用的最大内存（GB）
```js 
const memory = navigator.deviceMemory
```

## 获取当前经纬度
在 https 环境下生效

```js 
navigator
  .geolocation
  .getCurrentPosition(
    position => {
      const a = position.coords.latitude;
      const b = position.coords.longitude;
      // 精确到几米
      const accuracy = position.coords.accuracy;
    }, 
    err => console.log(err))

```


## 计算element位置，触底判断
先说明几个基本认知：

1. window.innerHeight
表示浏览器网页展示区域的高度，如果有横向滚动条，滚动条的高度也算进去。这个高度可不包含滚动的高度。我们看到的内容是`document.body`，body里的内容很多时，body的
高度就会非常多，超出 window.innerHeight 高度的那部分内容，需要利用垂直滚动条向下移动才可以看到。

2. window.scrollY
表示浏览器网页的垂直滚动条的滚动距离。在 `document.body`内容很多时，你要借助
垂直滚动条的垂直移动才能继续看到 body 里的内容。在滚动条没有移动的时候，你只能
看到 body 里边 0 ~ window.innerHeight 高度间的内容；当 window.scrollY = 10px的时候，你只能看到 body 里面 10px ~ window.innerHeight + 10px 高度
间的内容

3. offsetHeight
element.borderTop + element.paddingTop + element.height + element.paddingBottom + element.borderBottom = element.offsetHeight

4. offsetParent
```html
<body>
  <style>
    .parent-1 {
      position: absolute;
    }
  </style>
  <div class="parent-1">
    <div class="parent-2">
      <p id="son"></p>
    </div>
  </div>
  <div>
    <div id="son2"></div>
  </div>

  <script>
    const son = document.getElementById("son");
    // parent-2
    son.parent;

    // parent-1
    son.offsetParent;

    const son2 = document.getElementById("son2");
    // document.body
    son2.offsetParent;

    // null
    son2.offsetParent.offsetParent;
  </script>
</body>
```

计算element的位置（以垂直方向为例），可能说的是：
- element在屏幕上的位置（即在 viewport 里的位置）
- element在网页里的位置（即在body里的位置）

```js
// element在屏幕上的位置
const { top } = element.getBoundingClientRect()
```

```js
// 如果 element 的 offsetParent 是 body 的话，
// 一步就能得到element在网页里的位置
const top = element.offsetTop;
```

```js 
// 如果 element 的 offsetParent 不是 body 的话，
// 需要做一些向上追溯计算
let parent = element.offsetParent;
let prev = element;
let height = 0;
while (parent !== null) {
  height += prev.offsetTop;
  prev = parent;
  parent = parent.offsetParent;
}

const top = height;
```

计算是否触底，其实就是说，element处于一个滚动区域里，它的底部是否接触到了滚动区域
的底部。如果我们管滚动区域所归属的那个DOM节点叫做 scrollable, 那么element触底时就会有：
```
scrollable.scrollY + scrollable.offsetHeight == element顶部到scrollable的距离 + element.offsetHeight
```

element顶部到scrollable的距离，不能用 `element.offsetTop`计算，因为 scrollable 可能不是 element 的 offsetParent, 但不用担心，我们可以换个角度计算：
```
element顶部到scrollable的距离 == element顶部到viewport顶部的距离 - scrollable顶部到viewport顶部的距离
```
落实到代码里：

```js
const { top: elementTop } = element.getBoundingClientRect()
const { top: scrollableTop } = scrollable.getBoundingClientRect()
// element顶部到scrollable的距离
const elementTopToScrollable = elementTop - scrollableTop;
```

所以element是否触底，就可以如此计算：
```js
const touchBottom = (el, scrollable) => {
  const { top: elementTop } = el.getBoundingClientRect()
  const { top: scrollableTop } = scrollable.getBoundingClientRect()
  const elementTopToScrollable = elementTop - scrollableTop;
  const loss = scrollable.scrollY + scrollable.offsetHeight - el.offsetHeight - elementTopToScrollable;
  if (Math.abs(loss) < 1) {
    return true
  }
  return false
}
```

<Giscus />