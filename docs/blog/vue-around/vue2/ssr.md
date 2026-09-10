---
title: "服务端渲染"
page: true 
aside: true
---

## 服务端渲染
在前边的篇章里，我们已经具体介绍了客户端渲染的情况，同时我们也讲到了水合，不过我们仍然留有一个问题，要知道水合的本质是创建vnode，然后把这些vnode和已经有的DOM节点关联起来，而这些DOM节点是服务端生成的，问题呼之即出，服务端是怎么生成的html片段？

## 基本原理
1. 最开始的部分，和客户端渲染是一样的, 只是不需要立即mount
   ```ts 
   // 这里的代码需要在编译之后，由服务端nodejs环境执行，
   // 后边提到的 app._render() resolve(vnode)都是 
   // 在服务端nodejs环境执行
   import Vue from "vue"
   import RootComponent from "./rootComponent.vue"

   const app = new Vue({ render: (h) => h(RootComponent) })
   ```
2. 执行`app._render()` 得到 vnode
3. 根据vnode的情况做处理, 得到渲染出来的html片段
   ```ts 
   function resolve(vnode) {
    let html = ''

    // 如果 vnode 是一个很普通的vnode，对应的就是
    // DOM节点，就根据 vnode.tag 创建 DOM 标签
    // 字符串，并递归遍历它的子节点，创建出DOM标签
    // 字符串，最后拼接在一起返回
    if (isElementVnode(vnode)) {
      html += createHtmlForVnodeAndChildrenRecursively(vnode)
    }
    else if (isComponentVnode(vnode)) {
      const vm = createComponentInstanceForVnode(vnode)
      const node = vm._render();
      node.parent = vnode;
      html += resolve(node);
    }
    else if (isCommentVnode(vnode)) {
      // 异步组件
      if (isDef(vnode.asyncFactory)) {
        vnode.asyncFactory().then(comp => {
          const asyncComponentVnode = createComponent(comp)
          html += resolve(asyncComponentVnode)
        })
      }
      else {
        html += `<!--${node.text}-->`
      }
    }
    else {
       const val = node.raw ? node.text : escape(String(node.text));
       html += val 
    }

    return html
   }
   ```
4. 步骤3渲染出来的html片段，不包含`<html>`标签，因此在服务端渲染的时候，会要求用户提供一个template.html文件，比如这个样子：
   ```html 
   <html>
    <head>
      <title>{{ title }}</title>
    </head>
    <body>
      <div class="header"></div>
      <!--vue-ssr-outlet-->
    </body>
   </html>
   ```
5. 基于模板文件的内容，做替换处理，刚刚生成的html内容会被加入到`<!--vue-ssr-outlet-->`的后边，而`{{ title }}` 会根据用户在服务端渲染之前提供的上下文变量，替换成对应的值。接下来还要将css/js/png等资源链接插入到`<head>`内，之后就得到了完整的服务端渲染结果（字符串），这个结果就被服务端返回给客户端，接下来就是客户端的水合。
6. 那么，css/js/png等资源链接是怎么来的呢？就是正常编译如下代码，会得到一个`clientManifest`的json文件，这个文件会获取到这些资源链接，服务端代码直接解析出来，然后生成`<link rel="" href="" >`的字符串，塞入到template.html的`<head>`里即可。
   ```ts 
   import Vue from "vue"
   import RootComponent from "./rootComponent.vue"

   new Vue({
    render: (h) => h(RootComponent),
    el: "#app",
    hydrate: true
   })
   ```
> clientManifest可以由`webpack.optimize.CommonsChunkPlugin`生成

源码：`packages/server-renderer/src/create-renderer.ts#createRenderer`

以上介绍的过程，是`renderToString`的思路，意思是服务端把html全部生成好之后，拼成一个完整的html字符串，返回给客户端。

另一种方式是`renderToStream`, 意思是服务端生成一部分html的内容，然后返回这个部分。技术上也没什么特别难的地方，就是建立两个stream对象，一个负责处理template.html, 一个负责处理vnode生成DOM字符串，前者先把css/js/png资源链接的字符串生成好后，往外吐一批数据，然后监听后者生成DOM字符串，生成一部分，就接收一部分，然后往外吐一批数据，直到所有的DOM字符串全部吐完。

伪代码：
```ts 
function createStream() {
  const templateStream = createTemplateStream("template.html")
  const vnodeDOMStream = createVnodeDOMStream(app)

  // vnodeDOMStream合成好的DOM字符串吐给templateStream
  vnodeDOMStream.pipe(templateStream)

  Promise.resolve().then(() => {
    // 往 templateStream 写入静态资源链接，
    // 让它先吐出一部分数据
    writeResourceLinks(templateStream)

    // 等templateStream吐出一批数据后，
    // vnodeDOMStream开始工作，生成数据，
    // 吐给templateStream，templateStream
    // 收到数据会立即吐出这个数据
    vnodeDOMStream.start()
  })
  
  return templateStream
}

// 上层使用者
function streamUser(res) {
  const stream = createStream()

  // 通过 res 返回给客户端
  stream.on("start", () => {
    res.writeStatus(200)
    res.writeHead("content-type", "text/html")
  })
  
  stream.on('data', (data) => {
    res.write(data)
  })

  stream.on("end", (data) => {
    res.end(data)
  })
}
```

## 从构建的角度梳理下全过程
准备客户端代码`client-entry.ts`:
```ts 
import Vue from "vue"
import Root from "./root.vue"

new Vue({
  render: (h) => h(Root),
  el: '#app',
  hydrate: true
})
```
使用webpack构建，得到:
- `client-entry.js`
- `clientManifest.json`

准备服务端渲染组件的代码`server-render.ts`:
```ts
import Vue from "vue"
import Root from "./root.vue"

const app = new Vue({
  render: (h) => h(Root),
})

export default app;
```

准备template.html:
```html 
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    <div class="header"></div>
    <!--vue-ssr-outlet-->
  </body>
</html>
```

准备服务端代码`server-entry.ts`:
```ts 
import app from "./server-render.ts"
import { createRenderer } from "vue-server-render"

function ssrRender(res) {
  const render = createRenderer({
    template: readFile("./template.html"),
    clientManifest: readJson("./clientManifest.json")
  })

  render.renderToString(app, { title: "testing ssr render"})
    .then(html => {
      res.writeStatus(200)
      res.writeHead("content-type", "text/html")
      res.write(html)
      res.end()
    })
    .catch(() => {
      res.writeStatus(505)
      res.end()
    })
}

createHttpServer((req, res) => {
  if (req.url === '/ssr-page') {
    ssrRender(res)
  }
  else {
    res.writeStatus(200)
    res.end()
  }
})
```

编译`server-entry.ts`, 得到`server-entry.js`, 最后启动服务即可`nohup node server-entry.js`