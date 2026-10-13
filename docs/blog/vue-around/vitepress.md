---
title: "vitepress"
page: true
aside: true
---

# vitepress 
vitepress是基于vue和vite技术实现的静态网页生成工具，你可以使用它构建自己的静态博客，并且支持DIY，定制化你自己的内容。

源码下载和分支切换：
```shell 
git clone git@github.com:vuejs/vitepress.git

git checkout -b learning 69b11b9a579714aa83866bb1ad02891ec7f2fd29
```

## vite & rollup 
说到底，vitepress与你平时使用vite构建应用的过程差不多。只不过，我们平时只需要配置好`vite.config.ts`就可以了，vitepress则是使用vite提供的package API, 更加灵活的构建。关于这些内容，我们会在后边细谈。

既然vitepress基于vite，有必要先了解一些关于vite的前置知识，有利于理解后边的内容。

vite是一个封装rollup的项目构建解决方案，但它不是构建工具。尽管后来，vite的底层改用rolldown了，但rolldown是rollup的Rust rewrite，基本与rollup保持一致，我们就不必单单把rolldown拎出来了，一律按照rollup理解。

### module & chunk & asset 
每一个js源码文件，rollup都称之为一个`module`。rollup都是从一个或者若干个入口js文件开始构建的，这些入口js文件被称为`entry module`。rollup会基于`acorn`将js源码转为ast，ast的每个节点都遵循`ESTree规范`。rollup会分析其中的`import` 和 `export`，继续解析其他的module，并理清module之间的依赖关系。

假设我们有如下的文件。
:::code-group
```js [index.js]
import { logMessage } from "./util.js"

export default function createConfig() {
  logMessage("ready for creating config...")
  return {}
}
```

```js [util.js]
export function logMessage(str) {
  console.log("msg: ", str)
}
```
:::

`index.js`是`entry module`，`util.js` 是另一个`module`，在没有特别的拆分设置为前提，rollup会把二者合为一体：
```js [index.qerertzwx.js]
function logMessage(str) {
  console.log("msg: ", str)
}

export default function createConfig() {
  logMessage("ready for creating config...")
  return {}
}
```

这个`index.qerertzwx.js`文件就是`chunk`。`module`形容的是源码，而`chunk`形容的是最终输出的代码。`chunk`不一定是若干`module`的合并，但一般情况说的是合并。自然它也有拆分的情况。当源文件的代码太多时，就会按照一定策略，将代码分割成几部分，每部分都是一个`chunk`。

也有既不拆分，也不合并的情况。比如上边的例子中，`util.js`不会合并到`index.js`里，而是保留原样，输出到`util.qwwercx.js`：
```js [index.qerertzwx.js]
import { logMessage } from "./util.qwwercx.js"

export default function createConfig() {
  logMessage("ready for creating config...")
  return {}
}
```

特别的，rollup提供专门的配置项，让用户决定输出的entry文件和chunk文件各自取什么名字。

rollup只会处理js文件，如果遇到css文件、png文件、mp3文件，它会把这些文件归类到asset里，需要rollup插件予以处理，最终这些文件会被插件加入hash值，输出到配置好的assets目录下，一般的，你会在`dist/assets`目录下看到它们。

### base & relativePath
这里将的内容是vite引入的，不是rollup的概念。

我们构建前端应用，步骤往往很简单：
1. 在项目里执行build指令，所有的产物都生产到dist目录下
2. 把dist目录里的内容上传到前端服务器指定的目录
3. 配置前端服务器(比如nginx), 把http的访问, 定位到这个目录

手动操作过上述流程的人，一定会遇到过这样的问题：访问某个链接，浏览器说某某资源链接找不到。然后一顿排查，发现是某个html里的资源链接少些前缀。

vite就很好的处理这个问题。自入口文件开始（可能是js文件，也可能是html文件），vite会查看项目引入了哪些资源的url。

如果url是完整的http链接，它什么都不处理。
```html [index.html]
<img src="http://aafd.com/pictures/dog.png" />
```

如果是相对路径，它以相对当前文件来理解。
```html [/a/index.html]
<img src="./pictures/dog.png" />
```
它会去处理`/a/pictures/dog.png`，最终生成的html文件会位于`/a/dist/index.html`，而图片位于`/a/dist/assets/dog.png`，它会计算后者相对于前者的路径是`./assets/dog.png`，然后更新：
```html [/a/dist/index.html]
<img src="./assets/dog.png" />
```

如果是以`/`开头的路径，它会以项目根目录为准，寻找文件。项目根目录由配置项`root`决定，默认是`process.cwd()`。这里，我们假设就是当前目录`/a`。
```html [/a/index.html]
<img src="/pictures/dog.png" />
```
它会找这两个地方：
1. `/a/public/pictures/dog.png`
2. `/a/pictures/dog.png`

最终这个图片会生成到`/a/dist/pictures/dog.png`，html文件会生成到`/a/dist/index.html`。这还没完，图片的路径前，要加入base。base是什么呢？这和nginx有关。

假设dist目录里的内容，上传到服务器的`/temp/a`目录下，并且经过nginx配置，`http://aaaa.com/app/hello/`访问的就是`/temp/a/index.html`，那么base就是`/app/hello/`。顺着这个假设，文件路径会被改写：
```html [/a/index.html]
<img src="/app/hello/pictures/dog.png" />
```

base是vite的一个配置项，你可以根据前端服务器的映射情况，调整这个值，默认情况下，它是`/`

## 构建原理
有了上面的铺垫，我们可以解释vitepress是怎么工作的了。

vitepress有一套模板代码，这套代码就是一个完整的spa应用。

这个spa应用的源码提供了丰富的组件。比方说页面顶栏，页面侧边栏，页面右边栏，这些组件在源码的`src/client/theme-default/components`里定义。

而spa应用的入口文件是`src/client/app/index.ts`。

vitepress会把这个spa应用的代码做预编译，并随之发布到npm上。ts文件编译为js文件，vue文件保持原样。当你用npm下载vitepress的时候，这个spa应用预编译后的代码，也会被下载下来。

而你所编写的markdown文件，vitepress会扫描出来，作为vite项目构建的入口文件。markdown文件自然不会被rollup识别，因此vitepress内置了处理markdown文件的vite plugin，将markdown的内容转为html片段，再将这个片段转为vue组件的`<template>`，这样，每个markdown文件就转为vue组件，接下来交给 vite vue plugin 组件处理即可。

最终的结果就是，所有的markdown文件都会对应着有个js文件，位于`dist/assets`下边。

而vitepress自身预编译处理后的`src/client/app/index.js`文件也会作为vite构建的入口文件，在`dist/assets`下也会有个js文件与之对应。这个文件一旦在html里被执行，Vue就会开始渲染页面。

以上的这些工作，vitepress称之为`bundle`。

js文件有了，那么html文件在哪里呢？这个就是vitepress的另一个工序——`render`。

对于每一个mardown文件，vitepress都会自动生成一个html文件，而且路径结构都是对应的。
```txt 
源码：
docs
  ---- blog
         ---- animal.md 
         ---- fruit.md 
         ---- shoes.md


产物:
dist 
  ---- docs 
        ----- blog 
               ----- animal.html 
               ----- fruit.html
               ----- shoes.html
```

每个html的内容都是生成的，且非常简单：
1. 编译后的`src/client/app/index.js`的script标签
2. markdown编译后的chunk js文件的预下载link标签
3. 注入到页面的`window.__VP_SITE_DATA__`

前两个很好理解，因为在`bundle`阶段就拿到了js产物的文件路径，以此生成`<script>`和`<link>`标签并不难。

重点说下`window.__VP_SITE_DATA__`。在开始构建项目的时候，会读取vitepress的config文件，拿到配置项。配置项的`themeConfig`非常重要，里边的`nav`字段，记录了侧边栏信息。vitepress内置的侧边栏组件，需要拿到这部分数据，才能渲染出来。因此，在构建的时候，收集这些信息，然后生成`window.__VP_SITE_DATA__ = data`的代码，这样就可以访问`window.__VP_SITE_DATA__`获取信息，而`data`就是收集到的信息经过JSON序列化后的字符串，之后，这段代码会写入到html里：

```html [/a/dist/blog/animal.html]
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="/assets/app.entry.qwerx.js"></script>
    <link rel="modulepreload" href="/assets/chunk/blog_animal.md.cerewrw.js">
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.__VP_SITE_DATA__ = {
        "themeConfig": {
          "nav": [
            {
              text: "User",
              activeMatch: `^/user/`,
              items: [
                { text: "User Base Info", link: "/user/base-info" },
              ],
            }
          ]
        }
      }
    </script>
  </body>
</html>
```

最后的问题是，有了markdown文件编译后的chunk js资源，它是怎么被加载到页面里的呢？

实际上这是运行时发生的事情。vitepress内置的`<Content />`组件，展示的就是markdown文件的内容。这个组件的作用是，根据当前浏览器href，确定对应的chunk js资源链接，然后使用`import()`加载这个链接，得到pageModule, 而pageModule.default，就是vue组件的定义，可以用`h(pageModule.default)`在`<Content />`组件的`render()`中渲染出来。

这是基本的原理解释，vitepress为此还构建了自己的前端route系统，没有使用vue router那套东西。

## dev原理 
本地起研发服务器的原理更加简单了，vitepress在读取自己的`config.ts`后，将起转化为vite的`createServer` api所需要的入参，启动vite服务器即可。

当然了，vitepress在内置的vite plugin中，对dev server做了一些额外的调整：
1. 当接收到html的请求时，生成html内容返回，其中最重要的是，加入内置spa应用入口js文件的`@fs`路径，这个路径是vite特殊识别的路径，会映射到本地文件
2. 监听`.md`文件内容变动，使用内置的`markdownToVue`将内容转为vue组件代码，交给vite vue plugin插件做后续处理，达到页面更新的效果
3. 监听vitepress配置文件自身的变动，及时重启 vite dev server。

这里顺便简单介绍下vite hmr的基础原理。其实就是`websocket双端通讯`。

vite dev server掌握一端，浏览器的`import.meta.hot`是另外一端。当然了，`import.meta.hot`的定义, 是vite注入到html里边的。

vite dev server负责监听文件变动，将变动发送给浏览器端，浏览器端用`import.meta.hot.on()`负责接收信息。

因此，要实现组件的热更新，服务端要传递文件变动，把文件的最新内容发送给浏览器端，同时浏览器端也要有相应的代码，处理文件的新内容，并负责更新组件。一般的，这两侧的逻辑都会被框架封装成一个vite plugin。