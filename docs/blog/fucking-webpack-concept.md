---
title: "fucking webpack concept"
page: true
aside: true
---

## Description
`Module` ?

`Chunk` ?

`Asset` ?

`Bundle` ?

搞不明白都是啥意思。

看了这则[stackoverflow的帖子](https://stackoverflow.com/questions/42523436/what-are-module-chunk-and-bundle-in-webpack);

看了[webpack glossary](https://webpack.js.org/glossary/);
> webpack术语表

又看到[TheLarklnn回答的issue](https://github.com/webpack/webpack.js.org/issues/970);



我仍然没有搞明白。

网上有很多webpack mini版的代码，它们描述的只是一个大概的思路，没有细化的概念，无法帮助
人真正理解webpack里的概念，甚至帮倒忙。

为此，我打算自己深入到webpack源码，探究这些概念到底是什么意思。

## Module
待补充。。。

## Chunk
待补充

## Asset
待补充

## Bundle 
待补充


## FAQ 
### webpack会把所有的`import from`语句转为`__webpack_require__()`么？
取决于webpack编译生成的代码是否采取esm格式。

如果是esm格式，所有的`import from`都会被保留，所有的`import()`也会被保留。但如果引入npm包，且这个包需要被打包到最后的产物(external配置项)，比如`import lodash from "lodash"`, webpack：
1. 把`lodash`包里的代码打包到chunk文件，比如“lodash.chunk.js”
2. 将源码改为`import lodash from "./lodash.chunk.js` 

如果是commonjs格式，也就是默认的格式，所有的`import b from "./b.js"`会被改写成`const _b_ = __webpack_require__("./b.js")`。如果`b.js`被抽取到独立的chunk文件，webpack：
1. 依旧改写成`const _b_ = __webpack_require__("./b.js")`
2. 将chunk文件插入到entry文件之前：
   ```html 
   <body>
     <script src="./b.chunk.js"></script>
     <script src="./app.entry.js"></script>
   </body>
   ```
这样处理后，`b.chunk.js`先加载执行，b模块此时就注册到`__webpack_modules__`了，等到`app.entry.js`使用`__webpack_require__("./b.js")`时，直接从`__webpack__modules__`里边拿。

而`import("./b.js")`会被改写为`__webpack_require__.e("./b.js").then(() => __webpack_require__("./b.js"))`:
1. `__webpack_require__.e("./b.js")`大致做这样的事情
   ```js 
   const createDeferPromise = () => {
    let resolve,reject 
    const promise = new Promise((rs, rj) => {
      resolve = rs; reject = rj
    })
    return { resolve, reject, promise }
   }

   const loadChunkThroughScript = (chunkId) => {
    const script = document.createElement("script")
    script.src = chunkId 
    documemt.body.appendChild(script)
   }

   __webpack_require__.e = (chunkId) => {
    if (installedChunks[chunkId] === undefined) {
      const { resolve, reject, promise } = createDeferPromise()
      promise.rs = resolve; promise.rj = reject
      installedChunks[chunkId] = promise 
      loadChunkThroughScript()
      return promise
    }

    // 已经加载过了，module就在 __webpack_modules__
    if (installedChunks[chunkId] === 0) {
      return Promise.resolve()
    }

    return installedChunks[chunkId]
   }


   // 当chunk代码执行的时候，大致会做这样的事情：
   function executeChunk(chunkId) {
    try {
      // 一个chunk里可能包含多个module，把这些module
      // 注册到 __webpack__modules__
      registerModulesTo(__webpack_modules__)
      installedChunks[chunkId].rs()
      installedChunks[chunkId] = 0
    } catch(err) {
      installedChunks[chunkId].rj(err)
      installedChunks[chunkId] = undefined
    }
   }
   ```
2. 上述返回的Promise如果fulfilled了，module已经挂载到`__webpack_modules__`了，直接使用`__webpack_require__`拿

### loader和plugin的执行顺序有什么讲究么
plugin没有固定讲究，取决于plugin注册的tapable的hook是哪个，不同的hook有不同的顺序。

loader有讲究：
```js 
export default {
  module: {
    rules: [
      {
        test: /(.*?)\.css$/,
        use: [
          loader3,
          loader2,
          loader1
        ]
      }
    ]
  }
}

/**
 * 
 * css source path -> loader3.pitch -> loader2.pitch -> loader1.pitch 
 * 
 * css content -> loader1 -> result1 -> loader2 -> result2 -> loader3 -> result3 (final result)
 * 
 * 
 * 如果 loader2.pitch 返回了结果，会是下边这样
 * css source path -> loader3.pitch -> loader2.pitch -> returnedValue -> loader2 -> result2 -> loader3 -> result3 (fianl result)
 * 
 * webpack url: loader3!loader2!loader1!hello.css, 表示的就是
 * hello.css会被哪些loader处理，处理的顺序如何
 */
```

