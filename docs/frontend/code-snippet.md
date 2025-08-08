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

## tag超出范围的时候，末尾追加"..."
对于文字的超出范围，可以采用：
```html
<div class="container">fdsafasfasfadsfadsfadsf</div>

<style>
  .container {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /** 必须是固定宽度，这里模拟一下 */
    width: 100px;
  }
</style>
```

其实，换成这样，也可以实现效果：
```html
<div class="container">
  <span class="child">fdsafdaf</span>
  <span class="child">fdafadfkkkk</span>
  <span class="child">dddffdafadf</span>
</div>

<style>
  .container {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /** 必须是固定宽度，这里模拟一下 */
    width: 100px;
  }

  .child {
    display: inline-block;
    padding: 0 10px;
    background: #f5f6fa;
    border-radius: 2px;
    color: #ccc;
  }
</style>
```

上边说了，.container必须要有固定宽度才行，有一种情形，我们是使用flex布局来打造固定宽度：
```html
<div class="flex-container">
  <div class="one"></div>
  <div class="two"></div>
</div>

<style>
  .flex-container {
    width: 100vw;

    display: flex;
    overflow: hidden;
  }

  .one {
    flex: 1;
    overflow: hidden;
  }

  .two {
    flex: none;
    width: 100px;
  }
</style>
```
虽然我们没有指定 .one 的宽度，但在上述 flex 布局中，.one宽度是固定的，最多不会超过 100vw - 100px, 会随着 .one 内部元素的宽度而被撑开，直到抵达上限宽度100vw - 100px；如果我们没有为 .one 指定 overflow, 那么，其内部元素不会被截断，会把 .two 往后边挤。

如果你像下边一样，直接套用，你会发现“...”没有出现：
```html
<div class="flex-container">
  <div class="one">
    <span class="child">fdafadfkkkk</span>
    <span class="child">dddffdafadf</span>
  </div>
  <div class="two"></div>
</div>

<style>
  .flex-container {
    width: 100vw;

    display: flex;
    overflow: hidden;
  }

  .one {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .two {
    flex: none;
    width: 100px;
  }

  .child {
    display: inline-block;
    padding: 0 10px;
    background: #f5f6fa;
    border-radius: 2px;
    color: #ccc;
  }
</style>
```

你需要在 .one 内部，加入一层容器：
```html
<div class="flex-container">
  <div class="one">
    <div class="container">
      <span class="child">fdafadfkkkk</span>
      <span class="child">dddffdafadf</span>
    </div>
  </div>
  <div class="two"></div>
</div>

<style>
  .flex-container {
    width: 100vw;

    display: flex;
    overflow: hidden;
  }

  .one {
    flex: 1;
    overflow: hidden;
  }

  .container {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .two {
    flex: none;
    width: 100px;
  }

  .child {
    display: inline-block;
    padding: 0 10px;
    background: #f5f6fa;
    border-radius: 2px;
    color: #ccc;
  }
</style>
```

## 如何实现点击外边区域，下拉框消失
下拉框组件有个神奇的地方：当你点击下拉框内的区域，它不会收起来；当你点击它外侧的区域，它会收起来。

如何实现呢？

你可能想到这些实现方式：
1. window注册一个click事件，然后用 event.clientX 和 dom.getBoundingRect() 计算鼠标点击的时候，在下拉框外边；

2. 给下拉框DOM节点，绑定一个data-id属性，window上注册一个click事件，如果 event.target.dataset.id 存在，表明这个点击事件是在下拉框内部点击的

不过，有个更好的方式是：
1. 记录下拉框DOM节点 A；
2. 在window注册一个click事件，如果 A.contains(event.target), 表明点击事件是在下拉框内部触发的

对应代码如下：
```js
// A 表示下拉框DOM节点
const A = document.getElementById("popover");

window.addEventListener("click", (e) => {
  if (!A.contains(e.target)) {
    // 关闭下拉框
    setData({ visible: false })
  }
})
```

## 如何让 input 只能输入数字
```html
<input id="m" type="number" />

<style>
/* 隐藏默认的step控件 */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type=number] {
    -moz-appearance: textfield;
}
</style>
```

默认情况下，input的末尾会提供一个step控件，允许用户点击，调整输入框内的数字，我们可以使用上述的 css 隐藏掉控件。

这样一来，如果用户输入的内容中，存在非数字字符，那么输入框的内容不会发生变化，也不会触发input事件。


## 下载文件
```js
function download(url) {
    const urlObj = new URL(url, location.href)
    
    function simpleDownload(url) {
        const a = document.createElement('a')
        a.href = url 
        // 等效于 <a download>
        a.download = ''
        a.click()
    }

    // Firefox浏览器不支持跨域资源的<a>download属性下载，
    // 因此，你无法通过设置<a>的download属性，主动下载资源；
    //
    // Chrome浏览器支持跨域资源下载，但是在跨域情形中，你
    // 无法设置<a>的download属性，为要下载的资源重新命名;

    // same origin
    if (urlObj.origin === location.origin) {
        simpleDownload(url)
        return
    }
    // google chrome
    if (navigator && navigator.userAgent.toLowerCase().includes("chrome")) {
        simpleDownload(url)
        return
    }

    // 非同源的解决方式
    const req = new XMLHttpRequest()
    req.timeout = 10 * 1000
    req.responseType = 'blob'
    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            /**@type {Blob} */
            const res = req.response
            const $url = URL.createObjectURL(res)
            simpleDownload($url)
            // 执行后，正在下载的文件不会受到影响
            URL.revokeObjectURL($url)
        }
    }
    req.onerror = () => {
        console.log('下载失败，请稍后重试')
    }
    req.ontimeout = () => {
        console.log('下载超时，请稍后重试')
    }
    req.open('GET', url)
    req.send(null)
}
```

`URL.revokeObjectURL` 不会导致下载的文件被删除。

`URL.createObjectURL`创建了一个链接$url，指向 blob, 而要下载的文件是存储在blob的，只有blob对象被垃圾回收后，文件才会被删除。如果没有调用 `URL.revokeObjectURL` ，$url 就会持有 blob 的引用，导致 blob 对象无法被垃圾回收，造成内存泄漏，也导致文件占据内容，无法被释放。


## react custom hooks
```ts 
function useAdvancedEffect(effect, deps) {
  const cache = useRef(deps.map(dep => ({
    prevValue: dep,
    currentValue: dep,
    changed: false
  })))
  cache.current = deps.map((dep ,index) => {
    const cachedValue = cache.current[index]
    return {
      prevValue: cachedValue.currentValue,
      currentValue: dep,
      changed: cachedValue.currentValue !== dep
    }
  })
  const useChanged = useCallback(() => {
    return cache.current.map(c => c.changed)
  }, [])
  const useChangedValue = useCallback(() => {
    return cache.current
  }, [])
  useEffect(() => {
    return effect({ useChanged, useChangedValue})
  }, deps)
}


const component = () => {
  const [userId, setUserId] = useState(1)
  const [score, setScore] = useState(50)

  useAdvancedEffect(({ useChanged }) => {
    const [userIdChanged, scoreChanged] = useChanged()
    if (userIdChanged) {
      console.log("userId Change")
    }

    if (scoreChanged) {
      console.log("score Change")
    }
  }, [ userId, score])
}
```

## track downloading progress with `fetch`
```ts 
// refer: https://zh.javascript.info/fetch-progress
async function downloadWithTrackingProgress(url: string) {
  const response = await fetch(url)
  const total = +response.headers.get("Content-Length")!
  const reader = response.body!.getReader()
  
  let downloaded = 0

  while(true) {
    // value is a chunk of response body, not including response header
    const { done, value } = await reader.read()

    // download 100%
    if (done) {
      break;
    }

    downloaded += value.length
    const percentage = (downloaded / total) * 100
    // this is simple example, you can do any interesting thing here,
    // such as showing progress indicator
    console.log("downloading ", percentage, "%")
  }
}
```

## executable target exists
You can know whether a file path is executable with some npm packages, e.g. `is-executable`. But these packages require you to provide absolute file path instead of file name. For example, `/usr/local/bin/code` is valid, `code` is not valid.

We can use this simple snippet to cover both cases.
```ts 
import { spawnSync } from "node:child_process"

function isExecutable(nameOrPath: string) {
  const child = spawnSync(nameOrPath)

  // not exist
  if (child.error) {
    return false
  }
  
  return true
}

```

## 如何模拟手动清空input，并输入新的值
```ts
/**
 * 使用js代码模拟真人聚焦input，清空内容，输入新内容的过程，并且可以触发react的合成事件，使得
 * 有关state更新。该方案来自cursor。
 * 
 * @param el 
 * @param value 
 * @returns 
 */
function clearInputAndSetNewValue(el: HTMLInputElement, value: string) {
    // 1. 先 focus
    el.focus();

    // 2. 创建原生的 input 事件
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

    if (nativeInputValueSetter !== undefined) {
        // 3. 清空
        nativeInputValueSetter.call(el, "");
        el.dispatchEvent(new Event('input', { bubbles: true }));

        // 4. 设置新内容
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    return false;  
}
```

## 函数命名习惯
```js 
// 表述某种条件必须成立时，才能调用本函数，这类函数可以采取如下的命名
function validateOnlyIfOpenMode() {}
function validateWithOpenMode() {}

// 表述某种条件成立时，函数工作，不成立时，函数什么都不做
function validateIfOpenMode() {}
function validateConditionally() {}
function tryValidate() {}
```

## 如何解决输入法对`<input>`的影响
往`<input>`输入中文的时候，因为输入法的缘故，会先往里边输入拼音字母，按下回车键的时候，才会输入中文，我们想忽略输入拼音字母，可以这样做：
```js 
let isCompositing = false;

inputElement.addEventListener('compositionstart', () => {
  isCompositing = true;
});

inputElement.addEventListener('compositionend', () => {
  isCompositing = false;
});

inputElement.addEventListener('input', () => {
  if (isCompositing) return;

  // 上层收到的是中文，而不是拼音
  onChange(inputElement.value);
});
```
refer:
1. [input输入中文，高频出发onchange和oninput | CSDN](https://blog.csdn.net/weixin_44058725/article/details/134072159)
2. [CompositionEvent | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent)

<Giscus />