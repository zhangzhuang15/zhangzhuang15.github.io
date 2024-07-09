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


<Giscus />