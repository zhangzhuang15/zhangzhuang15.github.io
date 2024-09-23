---
title: "如何编写loader"
page: true
aside: true
---

## 参考
[webpack官方指导](https://webpack.js.org/api/loaders/)

## Description
在某次开发，遇到了一个css问题：在入口js文件中，import 一个css文件，但是我并不想把css文件的所有
内容都引入，而是把里面的一部分css属性引入。

如果不编写一个loader的话，我就要把这部分css属性单独拷贝到一个新的css文件里，然后引入这个文件。但是我比较懒，能不拷贝就不拷贝，这就是我编写loader的动机。

## 示例
webpack loader就是一个函数，输入是字符串，输出是字符串。

我们假设要处理的内容是css文件，请看这个loader:
```js
const cssTree = require("css-tree")

/**@type {import("webpack").loader.Loader} */
module.exports = function (source) {
    /**@type {import("webpack").loader.LoaderContext} */
    const self = this;

    // source 就是 css 文件的内容

    // webpack配置文件里，loader的options这样获取；
    //
    // {
    //   module: [
    //     { 
    //        test: /\.css/,
    //        loader: [
    //           {
    //              loader: "myLoader",
    //              options: {
    //                 value: 100
    //              }
    //           }
    //        ]
    //     }
    //   ]
    // }
    const options = self.query;

    // css文件的绝对路径这样获取
    const path = self.resourcePath;

    // webpack中配置 resolve.alias 的情况下，要想得到 alias
    // 之后的路径，可以采用这样的异步操作进行
    self.resolve(
        self.context, 
        "@lib/a/b",  // @lib 在webpack中被alias为 /User/A/Project/lib
        (err, result) => {
            if (!err) {
                // path: /User/A/Project/lib/a/b
                console.log("path: ", result)
            }
        }
    );

    // (1)可以在webpack配置文件中，指定loader去处理文件；
    // 
    // (2)也可以在要打包的源代码中，使用 require 来告诉webpack，采用
    // 哪种loader处理文件，比如 require("./loader2!./loader1!./index.css"),
    // 就是告诉webpack，先用 loader1 处理 index.css，处理后结果交给 loader2
    // 继续处理；
    //
    // 而(1)最终也会被webpack转化为(2)的方式；
    //
    // 那么编写 loader的时候，我们怎样可以拿到 require 里的请求呢？
    // 就是这样：
    const request = self.request;

    // 传给 loader 的options可以在 webpack 配置文件里设置，
    // 也可以在源代码里的require里设置，比如：
    // require("./loader2!./loader1?name=jack&value=10!./index.css")
    // 
    // 假设我们写的loader就是 loader1, 那么我们可以用 self.query 拿到 “name=jack&value=10”

    // 如果我们不想获取完整的request, 只想获取"./loader2!./loader1!./index.css?value=10",
    // 的 “./index.css?value=10”，就可以这样获取：
    const resource = self.resource;

    // 如果想获取“./index.css?value=10&name=jack” 的 "value=10&name=jack",
    // 可以这样获取：
    const resourceQuery = self.resourceQuery;

    if (path === "/A/B/boot.css") {
        const ast = cssTree.parse(source)

        // do something with ast
    }
}
```