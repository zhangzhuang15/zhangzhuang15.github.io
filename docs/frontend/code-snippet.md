---
title: "code snippet"
page: true
aside: true
---

## Description

记录一些实用的代码片段

## 判断某个类是浏览器器 native 的

```js
function isNative(API) {
  return typeof API === "function" && /native code/.test(API.toString());
}
```

> From Vue2 source code

## 查看 localStorage 用了多少字节

```ts
new Blob(Object.value(localStorage)).size;
```

## 复制一段文字（保留换行）

```ts
async function copy(text: string) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (e) {}
  }

  // 必须用 textarea, 如果用 div, 换行符就丢了
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style["width"] = 0;
  textArea.style["height"] = 0;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}
```

## 触发浏览器下载

```ts
function download(file: any) {
  const blob = new Blob([file]);
  // url 会绑定 blob 的内存
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  document.body.appendChild(a);
  a.click();
  // 释放 url，这样浏览器就会自动释放url绑定的内存
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

:::tip <TipIcon />
这种下载方式的缺点是，使用了 blob, 会消耗浏览器的堆内存资源，如果 file 太大，会导致卡顿；

如果要下载比较大的文件，可以让后端给出资源的 url，然后使用 `<a href="url"></a>`完成下载，不要
在前端用 `URL.createObjectURL` 生成 url。
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
      listeners.splice(0, listeners.length);
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

## 格式化、高亮化 sql 语句

```js
import highlightjs from "highlight.js";

const sourceCode = `
 WITH basic AS (
    SELECT
     sn.dt AS dt,
         sn.poi_type AS poi_type
              FROM
               ()
            )`;

import * as formatter from "sql-formatter";

// 格式化
let result = formatter.format(sourceCode, {
  language: "sql",
  tabWidth: 2,
  keywordCase: "upper",
  linesBetweenQueries: 1,
});

// 高亮化
const h_result = highlightjs.highlight(result, { language: "sql" });

// 高亮化之后的 html
console.log(h_result.value);
```

高亮代码也可以用 prismjs 实现：

```js
const { highlight, languages } = require("prismjs");
const loadLanguages = require("prismjs/components/index");
loadLanguages(["javascript"]);
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
const code = highlight(source, languages.sql, "javascript");
// 高亮处理后的html
console.log(code);
```

## input 失焦后，点击 dropdown 列表中的元素，如何阻止 dropdown 收起

考虑这样的问题：输入框聚焦后，有个下拉列表出现，然后你点击下拉列表中的某一项，结果下拉列表消失，
列表项的点击事件没有触发。

本质上看，当你点击下拉列表项的时候，先触发了 onblur 事件，后触发 onclick 事件，但是由于 onblur
里的逻辑，导致列表从 DOM 树中消失，进而使得 onclick 事件没有执行。

解决方法如下，出自[stackoverflow](https://stackoverflow.com/questions/39439115/how-to-execute-click-function-before-the-blur-function/57983847#57983847)

```html
<body>
  <input type="text" onblur="onBlur" />
  <ul>
    <li tabindex="-1" onclick="onClick"></li>
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
      console.log("I'm clicked");
    }
  </script>
</body>
```

tabindex 的作用详见[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)

简单来讲：

- 设置 tabindex 的 element，可以聚焦；
- 设置 tabindex='-1', 表示不能通过按下 tab 键获得聚焦，但可以通过鼠标聚焦；
- 设置 tabindex='2', 表示可以通过 tab 键获得聚焦，正数形式下，数字越小，越先获得聚焦；

## 判断电脑是否联网

```js
const online = navigator.onLine;
if (online) {
  console.log("联网");
}
```

## 判断电脑是否在充电

```js
navigator.getBattery().then((batteryManager) => {
  if (batteryManager.charging) {
    console.log("正在充电");
  }
});
```

## 判断电脑连接的是 4G 还是 3G

```js
const webType = navigator.connection.effectiveType;

if (webType === "4g") {
  console.log("连接了4g");
}
```

## 获取浏览器宿主机的 cpu 核心数

```js
const cores = navigator.hardwareConcurrency;
```

## 获取浏览器使用的最大内存（GB）

```js
const memory = navigator.deviceMemory;
```

## 获取当前经纬度

在 https 环境下生效

```js
navigator.geolocation.getCurrentPosition(
  (position) => {
    const a = position.coords.latitude;
    const b = position.coords.longitude;
    // 精确到几米
    const accuracy = position.coords.accuracy;
  },
  (err) => console.log(err)
);
```

## 判断电脑是否联网

```js
const online = navigator.onLine;
if (online) {
  console.log("联网");
}
```

## 判断电脑是否在充电

```js
navigator.getBattery().then((batteryManager) => {
  if (batteryManager.charging) {
    console.log("正在充电");
  }
});
```

## 判断电脑连接的是 4G 还是 3G

```js
const webType = navigator.connection.effectiveType;

if (webType === "4g") {
  console.log("连接了4g");
}
```

## 获取浏览器宿主机的 cpu 核心数

```js
const cores = navigator.hardwareConcurrency;
```

## 获取浏览器使用的最大内存（GB）

```js
const memory = navigator.deviceMemory;
```

## 获取当前经纬度

在 https 环境下生效

```js
navigator.geolocation.getCurrentPosition(
  (position) => {
    const a = position.coords.latitude;
    const b = position.coords.longitude;
    // 精确到几米
    const accuracy = position.coords.accuracy;
  },
  (err) => console.log(err)
);
```

## 计算 element 位置，触底判断

先说明几个基本认知：

1. window.innerHeight
   表示浏览器网页展示区域的高度，如果有横向滚动条，滚动条的高度也算进去。这个高度可不包含滚动的高度。我们看到的内容是`document.body`，body 里的内容很多时，body 的
   高度就会非常多，超出 window.innerHeight 高度的那部分内容，需要利用垂直滚动条向下移动才可以看到。

2. window.scrollY
   表示浏览器网页的垂直滚动条的滚动距离。在 `document.body`内容很多时，你要借助
   垂直滚动条的垂直移动才能继续看到 body 里的内容。在滚动条没有移动的时候，你只能
   看到 body 里边 0 ~ window.innerHeight 高度间的内容；当 window.scrollY = 10px 的时候，你只能看到 body 里面 10px ~ window.innerHeight + 10px 高度
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

计算 element 的位置（以垂直方向为例），可能说的是：

- element 在屏幕上的位置（即在 viewport 里的位置）
- element 在网页里的位置（即在 body 里的位置）

```js
// element在屏幕上的位置
const { top } = element.getBoundingClientRect();
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

计算是否触底，其实就是说，element 处于一个滚动区域里，它的底部是否接触到了滚动区域
的底部。如果我们管滚动区域所归属的那个 DOM 节点叫做 scrollable, 那么 element 触底时就会有：

```
scrollable.scrollY + scrollable.offsetHeight == element顶部到scrollable的距离 + element.offsetHeight
```

element 顶部到 scrollable 的距离，不能用 `element.offsetTop`计算，因为 scrollable 可能不是 element 的 offsetParent, 但不用担心，我们可以换个角度计算：

```
element顶部到scrollable的距离 == element顶部到viewport顶部的距离 - scrollable顶部到viewport顶部的距离
```

落实到代码里：

```js
const { top: elementTop } = element.getBoundingClientRect();
const { top: scrollableTop } = scrollable.getBoundingClientRect();
// element顶部到scrollable的距离
const elementTopToScrollable = elementTop - scrollableTop;
```

所以 element 是否触底，就可以如此计算：

```js
const touchBottom = (el, scrollable) => {
  const { top: elementTop } = el.getBoundingClientRect();
  const { top: scrollableTop } = scrollable.getBoundingClientRect();
  const elementTopToScrollable = elementTop - scrollableTop;
  const loss =
    scrollable.scrollY +
    scrollable.offsetHeight -
    el.offsetHeight -
    elementTopToScrollable;
  if (Math.abs(loss) < 1) {
    return true;
  }
  return false;
};
```

## tag 超出范围的时候，末尾追加"..."

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

上边说了，.container 必须要有固定宽度才行，有一种情形，我们是使用 flex 布局来打造固定宽度：

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

虽然我们没有指定 .one 的宽度，但在上述 flex 布局中，.one 宽度是固定的，最多不会超过 100vw - 100px, 会随着 .one 内部元素的宽度而被撑开，直到抵达上限宽度 100vw - 100px；如果我们没有为 .one 指定 overflow, 那么，其内部元素不会被截断，会把 .two 往后边挤。

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

1. window 注册一个 click 事件，然后用 event.clientX 和 dom.getBoundingRect() 计算鼠标点击的时候，在下拉框外边；

2. 给下拉框 DOM 节点，绑定一个 data-id 属性，window 上注册一个 click 事件，如果 event.target.dataset.id 存在，表明这个点击事件是在下拉框内部点击的

不过，有个更好的方式是：

1. 记录下拉框 DOM 节点 A；
2. 在 window 注册一个 click 事件，如果 A.contains(event.target), 表明点击事件是在下拉框内部触发的

对应代码如下：

```js
// A 表示下拉框DOM节点
const A = document.getElementById("popover");

window.addEventListener("click", (e) => {
  if (!A.contains(e.target)) {
    // 关闭下拉框
    setData({ visible: false });
  }
});
```

## 如何让 input 只能输入数字

```html
<input id="m" type="number" />

<style>
  /* 隐藏默认的step控件 */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
</style>
```

默认情况下，input 的末尾会提供一个 step 控件，允许用户点击，调整输入框内的数字，我们可以使用上述的 css 隐藏掉控件。

这样一来，如果用户输入的内容中，存在非数字字符，那么输入框的内容不会发生变化，也不会触发 input 事件。

## 下载文件

```js
function download(url) {
  const urlObj = new URL(url, location.href);

  function simpleDownload(url) {
    const a = document.createElement("a");
    a.href = url;
    // 等效于 <a download>
    a.download = "";
    a.click();
  }

  // Firefox浏览器不支持跨域资源的<a>download属性下载，
  // 因此，你无法通过设置<a>的download属性，主动下载资源；
  //
  // Chrome浏览器支持跨域资源下载，但是在跨域情形中，你
  // 无法设置<a>的download属性，为要下载的资源重新命名;

  // same origin
  if (urlObj.origin === location.origin) {
    simpleDownload(url);
    return;
  }
  // google chrome
  if (navigator && navigator.userAgent.toLowerCase().includes("chrome")) {
    simpleDownload(url);
    return;
  }

  // 非同源的解决方式
  const req = new XMLHttpRequest();
  req.timeout = 10 * 1000;
  req.responseType = "blob";
  req.onreadystatechange = () => {
    if (req.readyState === 4) {
      /**@type {Blob} */
      const res = req.response;
      const $url = URL.createObjectURL(res);
      simpleDownload($url);
      // 执行后，正在下载的文件不会受到影响
      URL.revokeObjectURL($url);
    }
  };
  req.onerror = () => {
    console.log("下载失败，请稍后重试");
  };
  req.ontimeout = () => {
    console.log("下载超时，请稍后重试");
  };
  req.open("GET", url);
  req.send(null);
}
```

`URL.revokeObjectURL` 不会导致下载的文件被删除。

`URL.createObjectURL`创建了一个链接$url，指向 blob, 而要下载的文件存储在 blob，blob 占用浏览器一块儿特殊的内存空间，只有 blob 对象被垃圾回收后，文件才会被删除。所以使用 Blob 要注意两点：

1. 不要占用太大内存空间。比如构造一个特别大的文件，存储在 Blob 里边。
2. 及时调用 `URL.revokeObjectURL` ，释放$url 对 blob 的引用，让 blob 对象被垃圾回收。

## 上传文件

### 简单文件上传

不要被文件上传吓到，本质上它就是一次 http 请求，请求体的内容就是要上传的文件内容。对于非常小的文件，直接用一次 http 请求完全可以办到。一般来讲，我们习惯以`multipart/form-data`的 mime 格式设置请求体。

从服务端的角度看，无非是解析请求体，拿到文件名和文件内容，然后写入磁盘，不算麻烦。

从浏览器的角度看，也不麻烦。要上传的文件，通常要借助`<input type="file">`的点击事件，这个事件的`e.target.files`存储的就是用户选择的文件，它们是`File`对象。这种类型是特殊的`Blob`对象。`Blob`提供了管理二进制数据的能力，你可以这样理解，`Blob`将文件的内容写入到很长的字节数组，并提供一些方法，供你访问这个字节数组。`File`继承了这种能力，还增加了一些能力，比如提供文件名、文件大小、文件被修改的时间等元信息。上传文件大致就是：

```ts
function upload(files: File[], url: string) {
  const formData = new FormData();
  files.forEach((file) => formData.append(file.name, file));

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.send(formData);

  // 或者用 fetch
  fetch(url, { method: "POST", body: formData });
}
```

麻烦的其实不是发送，而是检测上传的进度，告知用户上传了多少。很遗憾，`fetch`返回的`Response`对象没有提供这样的能力，只能使用`XMLHttpRequest` 实现。

```ts
let progress = 0;

xhr.upload.addEventListener("loadstart", (e) => {
  progress = 0;
  console.log("start uploading....");
});

xhr.upload.addEventListener("progress", (e) => {
  progress = (e.loaded / e.total) * 100;
  console.log(`uploading ${progress}%`);
});

xhr.upload.addEventListener("load", (e) => {
  console.log("successful 100%");
});
```

如果`loadstart progress load`事件直接添加在`xhr`上，检测到的是下载响应的进度。

## react custom hooks

```ts
function useAdvancedEffect(effect, deps) {
  const cache = useRef(
    deps.map((dep) => ({
      prevValue: dep,
      currentValue: dep,
      changed: false,
    }))
  );
  cache.current = deps.map((dep, index) => {
    const cachedValue = cache.current[index];
    return {
      prevValue: cachedValue.currentValue,
      currentValue: dep,
      changed: cachedValue.currentValue !== dep,
    };
  });
  const useChanged = useCallback(() => {
    return cache.current.map((c) => c.changed);
  }, []);
  const useChangedValue = useCallback(() => {
    return cache.current;
  }, []);
  useEffect(() => {
    return effect({ useChanged, useChangedValue });
  }, deps);
}

const component = () => {
  const [userId, setUserId] = useState(1);
  const [score, setScore] = useState(50);

  useAdvancedEffect(
    ({ useChanged }) => {
      const [userIdChanged, scoreChanged] = useChanged();
      if (userIdChanged) {
        console.log("userId Change");
      }

      if (scoreChanged) {
        console.log("score Change");
      }
    },
    [userId, score]
  );
};
```

## track downloading progress with `fetch`

```ts
// refer: https://zh.javascript.info/fetch-progress
async function downloadWithTrackingProgress(url: string) {
  const response = await fetch(url);
  const total = +response.headers.get("Content-Length")!;
  const reader = response.body!.getReader();

  let downloaded = 0;

  while (true) {
    // value is a chunk of response body, not including response header
    const { done, value } = await reader.read();

    // download 100%
    if (done) {
      break;
    }

    downloaded += value.length;
    const percentage = (downloaded / total) * 100;
    // this is simple example, you can do any interesting thing here,
    // such as showing progress indicator
    console.log("downloading ", percentage, "%");
  }
}
```

## executable target exists

You can know whether a file path is executable with some npm packages, e.g. `is-executable`. But these packages require you to provide absolute file path instead of file name. For example, `/usr/local/bin/code` is valid, `code` is not valid.

We can use this simple snippet to cover both cases.

```ts
import { spawnSync } from "node:child_process";

function isExecutable(nameOrPath: string) {
  const child = spawnSync(nameOrPath);

  // not exist
  if (child.error) {
    return false;
  }

  return true;
}
```

## 如何模拟手动清空 input，并输入新的值

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
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter !== undefined) {
    // 3. 清空
    nativeInputValueSetter.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));

    // 4. 设置新内容
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
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

function applyCallbackWithErrorHandling(callback) {
  try {
    callback();
  } catch (err) {}
}

function applyCallbackSafely(callback) {
  try {
    callback();
  } catch (err) {}
}

function tryWrap(fn) {
  try {
    fn();
  } catch (err) {}
}
```

## 如何解决输入法对`<input>`的影响

往`<input>`输入中文的时候，因为输入法的缘故，会先往里边输入拼音字母，按下回车键的时候，才会输入中文，我们想忽略输入拼音字母，可以这样做：

```js
let isCompositing = false;

inputElement.addEventListener("compositionstart", () => {
  isCompositing = true;
});

inputElement.addEventListener("compositionend", () => {
  isCompositing = false;
});

inputElement.addEventListener("input", () => {
  if (isCompositing) return;

  // 上层收到的是中文，而不是拼音
  onChange(inputElement.value);
});
```

refer:

1. [input 输入中文，高频出发 onchange 和 oninput | CSDN](https://blog.csdn.net/weixin_44058725/article/details/134072159)
2. [CompositionEvent | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent)

## 如果实现拖拽

npm 社区已经有很多库实现了拖拽功能，开箱直接用，比如 sortablejs。但这些库有局限性，比如只支持列表的拖拽，或者只能由一个地方拖拽到另外一个地方，如果要完成任意一个地方的东西，拖拽到另外一个地方，实现起来反而不轻松。这个时候，就要使用 html5 原生的 Drop and Drag API 了。方法如下：

对于可以被 Drag 的元素，要设置 draggable 属性和 dragstart 事件：

```html
<div draggable="true" ondragstart="dragStartHandler"></div>
```

对于元素可以 Drop 的区域，要绑定 drop 事件和 dragover 事件：

```html
<div class="drop-area" ondrop="dropHandler" ondragover="dragoverHandler"></div>
```

在`dragStartHandler`中，记录被拖拽对象有关的信息；在`dropHandler`中，读取记录的信息，更新 Drop 区域，比如生成一个和拖拽对象一模一样的元素。

```js
function dragStartHandler(e) {
  e.dataTransfer.setData("text", e.target.id);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "copy";
  }
}

function dragoverHandler(e) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
}

function dropHandler(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData("text");
  const node = document.getElementById(id);
  e.target.appendChild(node);
}
```

> `effectAllowed` 和 `dropEffect` 会影响拖拽行为，二者如果设置的值
> 不一致，则拖拽行为会被阻止。另外，设置 "copy" 或者 "move"的时候，释放鼠标时，鼠标长得样子也不同，这个是浏览器自动控制的。
> [dropEffect | MDN](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/dropEffect)

[HTML Drag and Drop API | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

## 原生滚动控制 scrollIntoView

点击某个图片，内容区立即滚动到描述该图片的段落，是一个常见的交互方式，想要达成这样的效果，就要使用`scrollIntoView` API。值得注意的是，这个方法并不是在滚动区域的容器节点调用的。

```html
<div class="scrollable">
  <p>段落一，假设这里有很多文字</p>
  <p>段落二，假设这里有很多文字</p>
  <p>段落三，假设这里有很多文字</p>
  <p>段落四，假设这里有很多文字</p>
  <p>段落五，假设这里有很多文字</p>
  <p id="section-6">段落六，假设这里有很多文字</p>
  <p>段落七，假设这里有很多文字</p>
</div>
```

如果你想让段落 6 滚动到顶部，可以这样做：

```ts
const target = document.getElementById("section-6");
target.scrollIntoView({
  behavior: "smooth",
  block: "start",
});
```

这样还有问题，实际滚动之后，你会发现段落 6 紧贴着顶部，很不舒服，我们需要和顶部保持 10px 的距离，也就是说滚动到距离顶部还有 10px 的位置停下，你可以使用`scroll-margin-top`属性做到：

```css
#section-6 {
  scroll-margin-top: 10px;
}
```

## vue + webpack loader: 注入源码位置信息

```js
// injectSourceInfoVueLoader.js
const MagicString = require("magic-string");
const VueCompiler = require("@vue/compiler-dom");

// 代码来自https://github.com/webfansplz/vite-plugin-vue-inspector/blob/main/packages/core/src/compiler/template.ts

/**
 *
 * @param {string} sfcContent
 * @returns
 */
module.exports = function (sfcContent) {
  const { mode } = this;
  if (mode === "production") return sfcContent;

  const parse = VueCompiler.parse;
  const ast = parse(sfcContent, { comments: true });

  const EXCLUDE_TAG = ["template", "script", "style"];
  const KEY_DATA = "data-v-inspector";
  const { resourcePath: filePath } = this;
  const s = new MagicString(sfcContent);
  const transform = VueCompiler.transform;
  transform(ast, {
    nodeTransforms: [
      (node) => {
        if (!node) return;
        if (node.type === 1) {
          if (
            (node.tagType === 0 || node.tagType === 1) &&
            !EXCLUDE_TAG.includes(node.tag)
          ) {
            if (node.loc.source.includes(KEY_DATA)) return;

            const insertPosition = node.props.length
              ? Math.max(...node.props.map((i) => i.loc.end.offset))
              : node.loc.start.offset + node.tag.length + 1;
            const { line, column } = node.loc.start;

            const content = ` ${KEY_DATA}="${filePath}:${line}:${column}"`;

            s.prependLeft(insertPosition, content);
          }
        }
      },
    ],
  });
  return s.toString();
};
```

```js
// webpack.config.js

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /.vue/,
        loader: [
          "vue-loader",
          // 我们的loader处理的是vue loader吐出来的结果，因此放在后边
          { loader: require.resolve("./injectSourceInfoVueLoader.js") },
        ],
      },
    ],
  },
};
```

## 只开一个 webpack 进程，动态增加入口文件

```js
// ./scripts/dev-server.js

/**
 * 智能开发服务器
 *
 * 功能：
 * 1. 单进程驱动 webpack watch 模式（动态 entry）
 * 2. HTTP 服务提供导引页、静态资源（编译产物 + shtml 模板）
 * 3. SSE 推送编译状态（compiling / done / error）
 * 4. HMR：编译完成后通过 SSE 推送 hmr 事件，浏览器自动刷新
 * 5. POST /activate：按需激活页面 entry 进入 LRU 编译窗口
 */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const ROOT = resolve(__dirname, "../..");

// ─── 依赖 ──────────────────────────────────────────────────────────────────

const webpack = require(resolve(ROOT, "node_modules/webpack"));
const launchEditor = require(resolve(ROOT, "node_modules/launch-editor"));

import {
  setWatchingRef,
  activateEntry,
  resolveEntryFromDir,
  collectPageInfos,
  getActiveEntries,
} from "./entryManager.mjs";

// ─── 配置 ──────────────────────────────────────────────────────────────────

const DIST_DIR = resolve(ROOT, "dist/page");
const PAGE_DIR = resolve(ROOT, "page");
const GUIDE_PAGE_HTML = resolve(__dirname, "page.html");

/** 开发服务器端口 */
const DEV_SERVER_PORT = parseInt(process.env.DEV_PORT || "8080", 10);

/** 扫描的 page 目录（用于导引页） */
function getDirectories() {
  if (process.env.dir) {
    const trimmed = process.env.dir.trim();
    if (!trimmed) throw new Error("请指定目录");
    return trimmed.split(",").filter(Boolean);
  }
  return ["app"];
}

// ─── 编译状态管理 ──────────────────────────────────────────────────────────

/**
 * @typedef {'idle' | 'compiling' | 'done' | 'error'} CompileStatus
 */

/** @type {CompileStatus} */
let compileStatus = "idle";
let lastError = null;
/** @type {number} 0~100 */
let compileProgress = 0;
/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();

/**
 * 向所有 SSE 客户端广播事件
 * @param {string} event
 * @param {object} data
 */
function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// ─── 全局回调：供 webpack.dev.config.js 中的 ProgressPlugin 调用 ──────────

global.__onWebpackProgress = function (percentage, message) {
  compileProgress = Math.round(percentage * 100);
  broadcastSSE("progress", { percentage: compileProgress, message });
};

// ─── 全局函数：供 webpack.dev.config.js 中的 getDynamicEntry 调用 ──────────

global.__getActiveEntries = getActiveEntries;

// ─── 启动 webpack watch ────────────────────────────────────────────────────

const webpackConfig = require(resolve(ROOT, "webpack.dev.config.js"));

// 注入 HMR 客户端到每个 entry（通过 entry 函数内部处理）
// webpack 的函数式 entry 在编译时调用，此处设置编译回调

const compiler = webpack(webpackConfig);

const watching = compiler.watch(
  {
    // 轮询文件变化间隔（ms），-1 表示使用 fs.watch 原生事件
    poll: false,
    aggregateTimeout: 300,
  },
  function onWatchComplete(err, stats) {
    if (err) {
      compileStatus = "error";
      lastError = err.message;
      broadcastSSE("compile-error", { message: err.message });
      console.error("[webpack] Fatal error:", err);
      return;
    }

    const info = stats.toJson({
      errors: true,
      warnings: false,
      assets: false,
      modules: false,
    });

    if (stats.hasErrors()) {
      compileStatus = "error";
      lastError = info.errors[0];
      broadcastSSE("compile-error", { message: info.errors[0] });
      console.error("[webpack] Compilation errors:", info.errors);
      return;
    }

    compileStatus = "done";
    lastError = null;
    compileProgress = 100;

    const builtEntries = Object.keys(getActiveEntries());
    console.log(
      `[webpack] ✅ 编译完成，活跃入口: ${builtEntries.join(", ") || "(空)"}`
    );

    // 推送 HMR 事件，浏览器收到后刷新页面
    broadcastSSE("hmr", { builtEntries });
  }
);

// 监听编译开始
compiler.hooks.watchRun.tap("DevServer", function () {
  compileStatus = "compiling";
  compileProgress = 0;
  broadcastSSE("compiling", { message: "开始编译..." });
  console.log("[webpack] 🔄 开始编译...");
});

// 注入 watching 引用给 entryManager
setWatchingRef(watching);

// ─── HTTP 服务 ─────────────────────────────────────────────────────────────

/** MIME 类型映射 */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".shtml": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json",
};

/**
 * 读取请求体（JSON）
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<object>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}"));
      } catch (_) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

/**
 * 读取并发送本地静态文件
 * @param {import('node:http').ServerResponse} res
 * @param {string} filePath 文件绝对路径
 */
function serveStaticFile(res, filePath) {
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  let fileContent;
  try {
    fileContent = readFileSync(filePath);
  } catch (_) {
    res.writeHead(500);
    res.end("Read Error");
    return;
  }
  res.setHeader("Content-Type", mime);
  res.writeHead(200);
  res.end(fileContent);
}

/**
 * 写入 JSON 响应
 * @param {import('node:http').ServerResponse} res
 * @param {number} code
 * @param {object} data
 */
function writeJSON(res, code, data) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.writeHead(code);
  res.end(JSON.stringify(data));
}

/** 导引页 HTML 缓存 */
let guidPageCache = null;

/**
 * 生成并返回导引页 HTML
 * @returns {string}
 */
function buildGuidePage() {
  if (guidPageCache) return guidPageCache;
  const directories = getDirectories();
  const pageInfos = collectPageInfos(directories);
  const template = readFileSync(GUIDE_PAGE_HTML, "utf-8");
  guidPageCache = template.replace("%data", JSON.stringify(pageInfos));
  return guidPageCache;
}

// ─── 路由处理函数 ──────────────────────────────────────────────────────────

/**
 * Vue DevTools 源码跳转本地编辑器
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {URL} url
 */
function handleOpenInEditor(req, res, url) {
  const file = url.searchParams.get("file");
  if (!file) {
    res.writeHead(500);
    res.end('launch-editor: required query param "file" is missing.');
    return;
  }
  const resolved = file.startsWith("file://") ? file : resolve(ROOT, file);
  launchEditor(resolved);
  res.writeHead(200);
  res.end();
}

/**
 * 导引页
 * @param {import('node:http').ServerResponse} res
 */
function handleGuidePage(res) {
  const html = buildGuidePage();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(html);
}

/**
 * 当前编译状态
 * @param {import('node:http').ServerResponse} res
 */
function handleStatus(res) {
  writeJSON(res, 200, {
    status: compileStatus,
    progress: compileProgress,
    error: lastError,
    activeEntries: Object.keys(getActiveEntries()),
  });
}

/**
 * SSE 长连接，推送编译事件
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function handleEvents(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.writeHead(200);

  // 立即推送当前状态
  res.write(
    `event: status\ndata: ${JSON.stringify({
      status: compileStatus,
      progress: compileProgress,
    })}\n\n`
  );

  sseClients.add(res);

  // 客户端断开时清理
  req.on("close", () => {
    sseClients.delete(res);
  });
}

/**
 * 激活页面 entry 进入编译窗口
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleActivate(req, res) {
  const body = await readBody(req);
  const { dir } = body;

  if (!dir) {
    writeJSON(res, 400, { error: "缺少 dir 参数" });
    return;
  }

  const entryInfo = resolveEntryFromDir(dir);
  if (!entryInfo) {
    writeJSON(res, 404, { error: `找不到 entry 文件: ${dir}` });
    return;
  }

  const isNew = activateEntry(entryInfo.key, entryInfo.filePath);
  writeJSON(res, 200, {
    key: entryInfo.key,
    isNew,
    status: isNew ? "compiling" : compileStatus,
    message: isNew ? "已加入编译队列，请等待编译完成" : "该页面已在编译窗口中",
  });
}

// ─── HTTP 路由分发 ─────────────────────────────────────────────────────────

const server = createServer(async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${DEV_SERVER_PORT}`);
  const pathname = url.pathname;

  // CORS 预检
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/__open-in-editor" && req.method === "GET")
    return handleOpenInEditor(req, res, url);
  if (pathname === "/" && req.method === "GET") return handleGuidePage(res);
  if (pathname === "/status" && req.method === "GET") return handleStatus(res);
  if (pathname === "/events" && req.method === "GET")
    return handleEvents(req, res);
  if (pathname === "/activate" && req.method === "POST")
    return handleActivate(req, res);
  if (pathname.startsWith("/dist/page/"))
    return serveStaticFile(
      res,
      resolve(DIST_DIR, pathname.replace("/dist/page/", ""))
    );
  if (pathname.startsWith("/static/"))
    return serveStaticFile(res, resolve(ROOT, pathname.slice(1)));

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(DEV_SERVER_PORT, function () {
  const Blue = "\x1b[34m";
  const Green = "\x1b[32m";
  const Reset = "\x1b[0m";
  console.log(`${Green}[DevServer] 启动成功${Reset}`);
  console.log(`${Blue}  导引页: http://localhost:${DEV_SERVER_PORT}/${Reset}`);
  console.log(
    `${Blue}  编译状态: http://localhost:${DEV_SERVER_PORT}/status${Reset}`
  );
  console.log("");
  console.log("  用法：在导引页点击 GO 按钮激活页面，等待编译后自动跳转");
  console.log("  LRU 窗口：最多同时编译 5 个入口，超出后淘汰最早激活的入口");
});
```

```js
// ./scripts/entryManager.js

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, relative, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const ROOT = resolve(__dirname, "../..");
const STATIC_PAGE_BASE = resolve(ROOT, "static/page");
const PAGE_BASE = resolve(ROOT, "page");

/** LRU 窗口大小：最多同时保留多少个活跃 entry */
const MAX_ACTIVE_ENTRIES = 5;

/**
 * 活跃 entry 集合，使用 Map 保证插入顺序（用于 LRU 淘汰）
 * key: webpack entry key，例如 "paotuiFence/paotuiFence-entry"
 * value: 文件绝对路径
 */
const activeEntries = new Map();

/**
 * webpack watching 实例引用，由 devServer 注入后用于触发 invalidate
 * @type {{ invalidate?: () => void } | null}
 */
let watchingRef = null;

/**
 * 注入 webpack watching 实例引用
 * @param {{ invalidate: () => void }} watching
 */
export function setWatchingRef(watching) {
  watchingRef = watching;
}

/**
 * 根据 dir 参数（格式与 startCmd 的 dir=xxx 相同）
 * 解析出 webpack entry key 和文件绝对路径
 * @param {string} dirValue - 例如 "paotuiFence/paotuiFence-entry.js"
 * @returns {{ key: string, filePath: string } | null}
 */
export function resolveEntryFromDir(dirValue) {
  if (!dirValue) return null;
  const trimmed = dirValue.trim();

  if (trimmed.match(/entry\.(js|ts)$/)) {
    return resolveFromEntryFile(trimmed);
  }

  return resolveFromDirectory(trimmed);
}

/**
 * 直接从 entry 文件路径解析
 * @param {string} entryRelPath
 * @returns {{ key: string, filePath: string } | null}
 */
function resolveFromEntryFile(entryRelPath) {
  const absPath = resolve(STATIC_PAGE_BASE, entryRelPath);
  const tsPath = absPath.replace(/\.js$/, ".ts");

  const filePath = existsSync(absPath)
    ? absPath
    : existsSync(tsPath)
    ? tsPath
    : null;
  if (!filePath) return null;

  return buildEntryInfo(filePath);
}

/**
 * 从目录路径中查找 entry 文件
 * @param {string} dirRelPath
 * @returns {{ key: string, filePath: string } | null}
 */
function resolveFromDirectory(dirRelPath) {
  const dirPath = resolve(STATIC_PAGE_BASE, dirRelPath);
  if (!existsSync(dirPath)) return null;

  const entryFile = findEntryFileInDir(dirPath);
  if (!entryFile) return null;

  return buildEntryInfo(entryFile);
}

/**
 * 根据 entry 文件绝对路径构建 entry 信息
 * @param {string} filePath
 * @returns {{ key: string, filePath: string }}
 */
function buildEntryInfo(filePath) {
  const entryFileDir = dirname(filePath);
  const fileName = basename(filePath, extname(filePath));
  const key = relative(STATIC_PAGE_BASE, entryFileDir) + "/" + fileName;
  return { key, filePath };
}

/**
 * 在目录下递归查找第一个 entry.(js|ts) 文件
 * @param {string} dirPath
 * @returns {string | null}
 */
function findEntryFileInDir(dirPath) {
  const pending = [dirPath];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const dirent of entries) {
      const fullPath = resolve(current, dirent.name);
      if (dirent.isDirectory()) {
        pending.push(fullPath);
        continue;
      }
      if (dirent.isFile() && dirent.name.match(/^entry\.(js|ts)$/)) {
        return fullPath;
      }
    }
  }
  return null;
}

/**
 * 激活一个 entry 进入 LRU 编译窗口
 * - 若已存在：刷新 LRU 顺序，返回 false（无需重编译）
 * - 若新加入：LRU 淘汰最旧的，触发 webpack invalidate，返回 true
 * @param {string} key
 * @param {string} filePath
 * @returns {boolean} 是否需要等待新一轮编译
 */
export function activateEntry(key, filePath) {
  if (activeEntries.has(key)) {
    // 刷新 LRU 顺序
    activeEntries.delete(key);
    activeEntries.set(key, filePath);
    return false;
  }

  if (activeEntries.size >= MAX_ACTIVE_ENTRIES) {
    const oldestKey = activeEntries.keys().next().value;
    activeEntries.delete(oldestKey);
  }

  activeEntries.set(key, filePath);

  if (watchingRef && typeof watchingRef.invalidate === "function") {
    watchingRef.invalidate();
  }

  return true;
}

/**
 * 返回当前活跃 entry 对象，供 webpack entry 函数调用
 * @returns {Record<string, string>}
 */
export function getActiveEntries() {
  return Object.fromEntries(activeEntries);
}

/**
 * 检查某个 key 是否在活跃编译窗口中
 * @param {string} key
 * @returns {boolean}
 */
export function isEntryActive(key) {
  return activeEntries.has(key);
}

/**
 * 遍历目录，返回所有文件的绝对路径
 * @param {string} rootDirPath
 * @returns {string[]}
 */
function traverseFiles(rootDirPath) {
  const result = [];
  const pending = [rootDirPath];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const dirent of entries) {
      const fullPath = resolve(current, dirent.name);
      if (dirent.isDirectory()) {
        pending.push(fullPath);
      } else if (dirent.isFile()) {
        result.push(fullPath);
      }
    }
  }
  return result;
}

/**
 * 收集指定 page 目录下的所有页面信息（用于导引页渲染）
 * @param {string[]} directories - 相对于 /page/ 的目录名列表
 * @returns {Array<{ path: string, dir: string, htmlUrl: string }>}
 */
export function collectPageInfos(directories) {
  const infos = [];

  for (const dir of directories) {
    const dirPath = resolve(PAGE_BASE, dir);
    if (!existsSync(dirPath)) continue;

    const files = traverseFiles(dirPath);
    for (const filepath of files) {
      if (!filepath.endsWith(".html")) continue;

      let content;
      try {
        content = readFileSync(filepath, "utf-8");
      } catch (_) {
        continue;
      }

      const entryJsMark =
        /<script.*?src=('|")(.*?entry\.pack\.js)('|")><\/script>/;
      const matched = entryJsMark.exec(content);
      if (!matched || !matched[2]) continue;

      const entryJsPath = matched[2];
      let dirValue = entryJsPath.replace("/dist/page/", "");
      dirValue = dirValue.replace(".pack", "");
      const htmlPath = dirValue.replace("-entry.js", "");

      infos.push({
        path: entryJsPath,
        dir: dirValue,
        htmlUrl: `http://local.haha.com/${htmlPath}`,
      });
    }
  }

  return infos;
}
```

```js
// ./scripts/page.html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>开发导引页面</title>
    <style>
        body {
            background-color: black;
            color: white;
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
        }

        .page-item {
            padding: 12px 8px;
            color: #4510e6;
            background: rgb(141 158 163);
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            margin: 8px 0;
            letter-spacing: 1px;
            cursor: pointer;
            transition: transform 0.2s ease-in;

            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }

        .page-item:hover {
            transform: scale(1.1);
        }

        .title {
            color: #89c3d6;
        }

        .btn {
            padding: 4px 10px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            white-space: nowrap;
            transition: opacity 0.2s;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-copy {
            background: #555;
            color: #fff;
        }

        .btn-go {
            background: #2a9d2a;
            color: #fff;
        }

        .btn-go.compiling {
            background: #b8860b;
        }

        .btn-go.error {
            background: #c0392b;
        }

        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1a2e;
            color: #aaa;
            font-size: 13px;
            padding: 6px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-top: 1px solid #333;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #555;
            flex-shrink: 0;
        }

        .status-dot.idle    { background: #555; }
        .status-dot.compiling { background: #f0a500; animation: pulse 1s infinite; }
        .status-dot.done    { background: #2a9d2a; }
        .status-dot.error   { background: #c0392b; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
        }

        .progress-bar-wrap {
            flex: 1;
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: #f0a500;
            transition: width 0.2s;
            width: 0%;
        }
    </style>
</head>
<body>
    <script type="text/javascript">
        window.data = %data;
        /* 注入服务端口，由 devServer.mjs 替换（若在 smart 模式下使用） */
        window.DEV_SERVER_PORT = window.DEV_SERVER_PORT || 8080;
    </script>

    <h1 class="title">烽火台老仓库导引页面</h1>
    <p>
        Search: <input id="userInput"> <button id="searchButton">搜索</button>
    </p>
    <div id="pageList"></div>

    <!-- 底部编译状态栏（仅 smart 模式显示） -->
    <div class="status-bar" id="statusBar" style="display:none">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">空闲</span>
        <div class="progress-bar-wrap">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        <span id="progressText">0%</span>
    </div>

    <script type="text/javascript">
        var pageList     = document.getElementById('pageList');
        var userInput    = document.getElementById('userInput');
        var searchButton = document.getElementById('searchButton');
        var statusBar    = document.getElementById('statusBar');
        var statusDot    = document.getElementById('statusDot');
        var statusText   = document.getElementById('statusText');
        var progressBar  = document.getElementById('progressBar');
        var progressText = document.getElementById('progressText');

        /* ── Smart 模式检测 ─────────────────────────────────────────── */

        var DEV_SERVER = 'http://localhost:' + window.DEV_SERVER_PORT;
        var isSmartMode = false;

        /**
         * 尝试请求 /status 来判断是否运行在 smart 模式下
         */
        function detectSmartMode() {
            fetch(DEV_SERVER + '/status')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    isSmartMode = true;
                    statusBar.style.display = 'flex';
                    updateStatusUI(data.status, data.progress, '');
                    connectSSE();
                })
                .catch(function() {
                    isSmartMode = false;
                });
        }

        /* ── SSE 连接 ────────────────────────────────────────────────── */

        function connectSSE() {
            var es = new EventSource(DEV_SERVER + '/events');

            es.addEventListener('compiling', function(e) {
                var d = JSON.parse(e.data);
                updateStatusUI('compiling', 0, d.message || '编译中...');
            });

            es.addEventListener('progress', function(e) {
                var d = JSON.parse(e.data);
                updateStatusUI('compiling', d.percentage, d.message || '编译中...');
            });

            es.addEventListener('hmr', function() {
                updateStatusUI('done', 100, '编译完成');
                /* 通知所有处于等待状态的 GO 按钮 */
                notifyPendingGoButtons();
            });

            es.addEventListener('compile-error', function(e) {
                var d = JSON.parse(e.data);
                updateStatusUI('error', 0, '编译错误: ' + (d.message || ''));
            });

            es.onerror = function() {
                updateStatusUI('idle', 0, '连接断开，等待重连...');
            };
        }

        /* ── 编译状态 UI ──────────────────────────────────────────────── */

        function updateStatusUI(status, progress, message) {
            statusDot.className = 'status-dot ' + status;
            statusText.innerText = message || status;
            var pct = Math.min(100, Math.max(0, progress || 0));
            progressBar.style.width = pct + '%';
            progressText.innerText = pct + '%';
        }

        /* ── 等待编译完成的 GO 按钮集合 ───────────────────────────────── */

        var pendingGoCallbacks = [];

        function addPendingGoCallback(cb) {
            pendingGoCallbacks.push(cb);
        }

        function notifyPendingGoButtons() {
            var cbs = pendingGoCallbacks.slice();
            pendingGoCallbacks = [];
            cbs.forEach(function(cb) { cb(); });
        }

        /* ── 激活页面（smart 模式）──────────────────────────────────────*/

        /**
         * 发送 POST /activate 激活页面 entry，等待编译完成后跳转
         * @param {string} dir
         * @param {string} htmlUrl
         * @param {HTMLButtonElement} btn
         */
        function activatePage(dir, htmlUrl, btn) {
            btn.disabled = true;
            btn.classList.add('compiling');
            btn.innerText = '激活中...';

            fetch(DEV_SERVER + '/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dir: dir })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.error) {
                    btn.disabled = false;
                    btn.classList.remove('compiling');
                    btn.classList.add('error');
                    btn.innerText = '失败';
                    alert('激活失败: ' + data.error);
                    return;
                }

                if (!data.isNew) {
                    /* 已在编译窗口中，直接跳转 */
                    btn.disabled = false;
                    btn.classList.remove('compiling');
                    btn.innerText = 'GO';
                    window.open(htmlUrl, '_blank');
                    return;
                }

                /* 新加入编译队列，等待 HMR 事件后再跳转 */
                btn.innerText = '编译中...';
                addPendingGoCallback(function() {
                    btn.disabled = false;
                    btn.classList.remove('compiling');
                    btn.innerText = 'GO';
                    window.open(htmlUrl, '_blank');
                });
            })
            .catch(function(err) {
                btn.disabled = false;
                btn.classList.remove('compiling');
                btn.innerText = 'GO';
                alert('请求失败: ' + err.message);
            });
        }

        /* ── 列表渲染 ────────────────────────────────────────────────── */

        function renderList(filterText) {
            filterText = filterText || '';
            pageList.innerHTML = '';
            var filteredData = window.data.filter(function(item) {
                return item.path.includes(filterText);
            });

            filteredData.forEach(function(item) {
                var li = document.createElement('div');
                li.classList.add('page-item');

                /* 路径文字（点击复制启动指令，兼容旧行为） */
                var div = document.createElement('div');
                div.innerText = item.path;
                div.style.flex = '1';
                div.addEventListener('click', function() {
                    var cmd = item.startCmd || ('dir=' + item.dir + ' npm run dev');
                    navigator.clipboard.writeText(cmd);
                    window.alert('启动指令已复制: ' + cmd);
                });
                li.appendChild(div);

                /* 复制 CMD 按钮 */
                var cmdBtn = document.createElement('button');
                cmdBtn.classList.add('btn', 'btn-copy');
                cmdBtn.innerText = '拷贝CMD';
                cmdBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var cmd = item.startCmd || ('dir=' + item.dir + ' npm run dev');
                    navigator.clipboard.writeText(cmd);
                    window.alert('启动指令已复制: ' + cmd);
                });
                li.appendChild(cmdBtn);

                /* GO 按钮 */
                var goBtn = document.createElement('button');
                goBtn.classList.add('btn', 'btn-go');
                goBtn.innerText = 'GO';
                goBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (isSmartMode && item.dir) {
                        activatePage(item.dir, item.htmlUrl, goBtn);
                    } else {
                        window.open(item.htmlUrl, '_blank');
                    }
                });
                li.appendChild(goBtn);

                pageList.appendChild(li);
            });
        }

        searchButton.addEventListener('click', function() {
            renderList(userInput.value.trim());
        });

        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') renderList(userInput.value.trim());
        });

        /* 初始化 */
        detectSmartMode();
        renderList();
    </script>
</body>
</html>
```

```js
// webpack.dev.config.js
/**
 * 动态入口版 webpack 开发配置
 *
 * 与 webpack.config.js 的区别：
 * 1. entry 为函数形式（动态 entry），每次重编译时从 entryManager 获取最新活跃入口
 * 2. 配置单个 webpack 实例（非数组），支持多入口
 * 3. 不使用 webpack-dev-server，由 devServer.mjs 提供 HMR 功能
 * 4. 生产构建请继续使用 webpack.config.js
 */
var fs = require("fs");
var path = require("path");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var webpack = require("webpack");
var VueLoaderPlugin = require("vue-loader/lib/plugin");
require("dotenv").config();

var outputFont = "fonts/[name]-[hash:12].[ext]";
var outputImage = "images/[name]-[hash:12].[ext]";

/**
 * 从 entryManager 动态获取当前活跃的 entry
 * webpack 每次 invalidate 重编译时都会重新调用此函数
 */
function getDynamicEntry() {
  try {
    // 使用 require 获取已缓存的 entryManager 导出
    // devServer.mjs 会将 getActiveEntries 挂载到全局
    if (global.__getActiveEntries) {
      return global.__getActiveEntries();
    }
  } catch (_) {
    //
  }
  // 启动时无活跃 entry，返回空对象（webpack 允许空 entry）
  return {};
}

var vueModuleRule = {
  test: /\.vue$/,
  loader: [
    {
      loader: "vue-loader",
      options: {
        loaders: {
          ts: {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              onlyCompileBundledFiles: true,
            },
          },
          js: {
            loader: "babel-loader",
            options: {
              plugins: [
                "jsx-v-model",
                ["transform-runtime", { polyfill: false }],
              ],
              presets: ["es2015", "stage-0"],
            },
          },
        },
      },
    },
  ],
};

// 开发模式下支持 vuetool（Vue DevTools 源码位置注入）
if (process.env.vuetool === "true") {
  vueModuleRule.loader.push({
    loader: require.resolve("./injectFilePathVueLoader/index.js"),
  });
}

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "development",

  // 函数式 entry：每次重编译时动态获取最新活跃入口
  entry: getDynamicEntry,

  devtool: "#inline-source-map",

  resolve: {
    extensions: [".js", ".jsx", ".vue", ".ts"],
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
  },

  // 本地开发模式不设置 externals，让 webpack 直接将 Vue 打包进去
  // 生产环境通过 webpack.config.js 使用 externals: { vue: 'Vue' }，由服务端提供全局 Vue
  externals: { vue: "Vue" },

  output: {
    path: path.join(__dirname, "/dist/page/"),
    publicPath: "/dist/page/",
    filename: "[name].pack.js",
    chunkFilename: "[name]-chunk.[chunkhash:12].js",
  },

  optimization: {
    minimizer: [],
  },

  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    // 进度插件：将编译进度通过全局回调暴露给 devServer.mjs
    new webpack.ProgressPlugin(function (percentage, message) {
      if (global.__onWebpackProgress) {
        global.__onWebpackProgress(percentage, message);
      }
    }),
  ],

  module: {
    rules: [
      {
        test: /\.scss$/,
        loader: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader",
          {
            loader: "sass-resources-loader",
            options: { resources: variablesPath },
          },
        ],
      },
      {
        test: /\.css$/,
        loader: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        loader: "url-loader",
        options: { limit: 1, name: outputImage },
      },
      {
        test: /\.(svg|eot|ttf|woff2?)$/,
        loader: "url-loader",
        options: { limit: 1, name: outputFont },
      },
      {
        test: /\.(js|jsx|es6)$/,
        include: [path.resolve(__dirname, "src")],
        loader: "babel-loader?cacheDirectory",
        query: {
          presets: ["es2015", "stage-0"],
        },
      },
      {
        test: /\.ts/,
        loader: "ts-loader?cacheDirectory",
        options: {
          transpileOnly: true,
          onlyCompileBundledFiles: true,
        },
      },
      vueModuleRule,
    ],
  },
};
```

`package.json`:

```json
{
  "scripts": {
    "dev": "node ./scripts/dev-server.js"
  }
}
```

<Giscus />
