---
title: "渲染"
page: true 
aside: true
---

# 渲染 
vue的渲染过程，就是在代码运行的时候，创建新vnode，然后比对新、老vnode，根据比对结果，更新DOM节点。

介绍的过程中，我会使用简化的代码，与真实的源码并不严格一致，同时，源码里的细节处理也会被忽略，以防干扰我们理解主要流程。

## 示例代码
`index.html`:
```html 
<html>
  <head></head>
  <body>
    <div id="app-a"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

`index.ts`:
```ts 
import App from "./app.vue"
import Vue from "vue"

new Vue({
  el: "#app-a",
  components: {
    App
  },
  render: (h) => h(App),
})
```

`app.vue`: 
```vue 
<template>
 <div class="app-root" id="app">
  {{ helloWorld }}
 </div>
</template>
<script>
export default {
  data: {
    helloWorld: 'hello world'
  }
}
</script>
<style scoped>
.app-root {
  color: lightblue;
  font: 16px;
  font-weight: medium;
}
</style>
```

## 编译器魔法 
`.vue`文件会被编译工具（比如vue-loader）处理，因此我们的`app.vue`会被处理成这样：
```ts 
import Vue from "vue"

class App extends Vue {
  render() {
    const th = this
    const vnode = {
      tag: 'div',
      attrs: {
        className: 'app-root'，
        id: 'app'
      },
      children: [
        {
          text: th.helloWorld
        }
      ]
    };
    return vnode;
  }
}
```
`render`方法会返回vnode。

入口文件的`render`方法也会返回vnode:
```ts 
import App from "./app.vue"
import Vue from "vue"

new Vue({
  el: "#app-a",
  components: {
    App
  },
  render: (h) => h(App),
})

// render 方法执行之后的结果是一个vnode, 大致是这个样子：
const vnode = {
  tag: 'app',
  Ctor: App,
  CtorOptions: {
    data: {
      helloWorld: 'hello world'
    },
    props: {},
  },
};
```

这里我们很清楚地看到，如果vnode指代的是`Vue组件`，那么它会包含`Ctor`属性。

## `new Vue`后发生了什么

执行`new Vue`得到 `vm1`:
<image src="/vue2-render-1.png" style="width: 200px;"/>

<br />

<image src="/vue2-render-2.png" style="width: 600px" />

```ts 
const vnode1 = {
  tag: 'app',
  Ctor: App,
  CtorOptions: {
    data: {
      helloWorld: 'hello world'
    },
    props: {},
  },
}
```

<br />

<image src="/vue2-render-3.png" style="width: 600px" />

```ts 
const element = document.getElementById("app-a");
const vnode2 = {
  elm: element,
  tag: ''
}
```

<br />

<image src="/vue2-render-4.png" style="width: 660px" />
> 图中anode笔误，应该是vnode

<br />

<image src="/vue2-render-5.png" style="width: 660px" />
```ts 
const vnode3 = {
  tag: 'div',
  attrs: {
    className: 'app-root'，
    id: 'app'
  },
  children: [
    {
      text: vm2.helloWorld
    }
  ],
  parent: vnode1,
}
```

<br />

<image src="/vue2-render-6.png" style="width: 780px" />
> 图中有一些错误，vnode4.parent是undefined

```ts 
const div = document.createElement("div")
div.id = "app";
const textNode = document.createTextNode("hello world")
div.appendChild(textNode)

vnode3.elm = div;

const vnode4 = {
  text: 'hello world',
  elm: textNode,
  parent: vnode3,
}

vnode3.children[0] = vnode4

vm2.$el = vnode3.elm
```

<br />

<image src="/vue2-render-7.png" style="width: 780px" />
> > 图中有一些错误，vnode4.parent是undefined

```ts 
const oldElement = vm1.$el
const parentElement = oldElement.parentElement
const newElement = vm1.$el = vm2.$el
parentElement.replaceChild(newElement, oldElement)
```

使用vue脚手架工具生成代码，你会发现html文件内div的id是“app”, 入口文件写的也是`el: "#app"`, 顶层vue组件App的`template`最外层div的id也是"app"，这是因为在vue2的逻辑中，组件App的最外层div会替换html文件内的div，而不是插入到html文件的div，因此二者的id要保持一致，避免html中对"#app"的css样式约束不生效。

当然了，我们讲述的时候，故意将html里的div的id设置为"app-a", App组件内的div的id设置为"app", 让你能够理解这个细节。

以上过程，说的是客户端初始化的时候，应用挂载的状况。接下来，我们看看客户端在应用更新的时候发生了什么。

## 响应式变量更新后发生了什么
假设`vm2.helloWorld`从`hello world`变成了`Tom`.我们提过，当响应式变量更新的时候，`Watcher`对象会自动触发`vm2._update(vm._render())`, 于是就会有如下的更新过程。

<image src="/vue2-render-8.png" style="width: 700px" />
> 图中有一些错误，vnode4.parent是undefined,

<br />

<image src="/vue2-render-9.png" style="width: 700px" />
> 图中有一些错误，vnode6.parent是undefined

<br />

老vnode节点被js垃圾回收后，整体状态如下：
<image src="/vue2-render-10.png" style="width: 500px" />
> 图中有一些错误，vnode6.parent是undefined
> 
值得留意的是，我们的示例代码非常简单，以至于`vnode5.children`只有一个子vnode，处理起来也非常简单，可实际的处理过程要比这个复杂，我们在下一节讨论。

看到这里，你已经知道了vnode是怎么创建的，新vnode是怎么保存到vm上的，老vnode是怎么被丢弃的。

## vnode patch
我们展开讨论新、老vnode是如何比较并更新DOM节点的。比较并更新，这就是patch。

<image src="/vue2-render-11.png" style="width: 700px" />

如何确定两个vnode是否为同一个类型，我们在后边细说。

<image src="/vue2-render-12.png" style="width: 700px" />

<br />

<image src="/vue2-render-13.png" style="width: 700px" />

<br />

<image src="/vue2-render-14.png" style="width: 700px" />

<br />

<image src="/vue2-render-15.png" style="width: 700px" />

<br />

<image src="/vue2-render-16.png" style="width: 700px" />

<br />

<image src="/vue2-render-17.png" style="width: 700px" />

<br />

<image src="/vue2-render-18.png" style="width: 700px" />

<br />

<image src="/vue2-render-19.png" style="width: 700px" />

接下来，我们看一下，当两个vnode完成patch后，接下来应该选择哪两个vnode执行patch。

<image src="/vue2-render-20.png" style="width: 700px" />

<br />

<image src="/vue2-render-21.png" style="width: 700px" />

<br />

<image src="/vue2-render-22.png" style="width: 700px" />

<br />

<image src="/vue2-render-23.png" style="width: 700px" />

<br />

<image src="/vue2-render-24.png" style="width: 700px" />

按照上述介绍的逻辑处理到最后，会留下两种情形。

<image src="/vue2-render-25.png" style="width: 700px" />

<br />

<image src="/vue2-render-26.png" style="width: 700px" />

最后我们还漏了一个细节:如果patch的vnode是vue组件类型的vnode，怎么处理呢？

<image src="/vue2-render-27.png" style="width: 700px" />

<br />

<image src="/vue2-render-28.png" style="width: 700px" />

vnode之间的patch，其主体流程已经介绍完了，接下来我们介绍几个细节点：
1. vnode具体什么样
2. 如何判断两个vnode是同一个类型的vnode
3. 如何从新的vnode中找出一个vnode，与老vnode比较

## vnode定义
取自vue源码定义，并补充注释：
```ts 
class VNode {
  // 可以是DOM的tag: “div” "span"
  // 也可以是vue组件的名字：“app"
  tag?: string
  // 与vue组件有关的属性，都会存储在这个字段中，
  // 比如 keep-alive, v-show, transition, slot,
  // props, attrs, className, style, hook等等
  // 
  // hook就是函数。有vue内部的hook, 比如根据vnode创建vm的hook,
  // oldVnode更新为vnode的hook，vnode被删除时的hook，还有
  // vue directive定义的bind、unbind方法也会以hook的形式被调用
  data: VNodeData | undefined
  children?: Array<VNode> | null
  // 对于TextNode类型，会有text值
  text?: string
  // vnode对应的DOM节点
  elm: Node | undefined
  ns?: string
  // vm  
  // 比如组件A的vue instance是 vm，组件A的template定义如下：
  // <div>
  //   <other-component />
  // </div>
  //
  // <ohter-component />在vm._render()的过程中，对应会生成一个
  // vnode, 这个vnode的context就是vm
  context?: Component 
  key: string | number | undefined
  // componentOptions.Ctor 存储组件定义
  // componentOptions.options 存储组件的入参，没错，就是你在
  // export default {} 里边写的那些内容
  componentOptions?: VNodeComponentOptions
  // vue instance, 如果node是vue组件类型，我门会创建一个vm，
  // 然后放置在这个字段上
  componentInstance?: Component // component instance
  // 如果vnode是vue组件类型的，它对应的vm在执行vm._render()后
  // 会得到一个vnode, 不妨叫它 vnode2，那么vnode2的parent就是
  // vnode。如果一个vnode存在parent属性，那么vnode.parent对应的
  // vnode一定是vue组件类型的vnode
  parent: VNode | undefined | null // component placeholder node

  // strictly internal
  raw: boolean // contains raw HTML? (server only)
  isStatic: boolean // hoisted static node
  isRootInsert: boolean // necessary for enter transition check
  isComment: boolean // empty comment placeholder?
  isCloned: boolean // is a cloned node?
  isOnce: boolean // is a v-once node?
  asyncFactory?: Function // async component factory function
  asyncMeta: Object | void
  isAsyncPlaceholder: boolean
  ssrContext?: Object | void
  fnContext: Component | void // real context vm for functional nodes
  fnOptions?: ComponentOptions | null // for SSR caching
  devtoolsMeta?: Object | null // used to store functional render context for devtools
  fnScopeId?: string | null // functional scope id support
  isComponentRootElement?: boolean | null // for SSR directives
}
```

源码位置：`src/core/vdom/vnode.ts#VNode,line8`

## vnode同类型判断方法
判断方法的源码比较简单，理解起来更直观：
```ts 
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    a.asyncFactory === b.asyncFactory &&
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) && isUndef(b.asyncFactory.error)))
  )
}

function sameInputType(a, b) {
  if (a.tag !== 'input') return true
  let i
  const typeA = isDef((i = a.data)) && isDef((i = i.attrs)) && i.type
  const typeB = isDef((i = b.data)) && isDef((i = i.attrs)) && i.type
  return typeA === typeB || (isTextInputType(typeA) && isTextInputType(typeB))
}
```

源码位置：`src/core/vdom/patch.ts#sameVnode,line36`

## 找到新vnode，与老vnode比较 
在上边介绍子vnode patch的时候，我们提到一个情节：
<image src="/vue2-render-19.png" style="width: 700px" />

当时一笔带过“根据某个算法”，这里我们展开说说。

`old_vnode2` `old_vnode3` `old_vnode4` 有 `key` 属性，也有它们在`old_vnode1.children`的索引号，我们可以创建一个map存储这个关系：
```ts 
const oldVnodeKeyToIdex = {
  [old_vnode2.key]: 0,
  [old_vnode3.key]: 1,
  [old_vnode4.key]: 2
}
```

而 `vnode2` `vnode3` `vnode4` 同样会有 `key` 属性，我们就可以用`vnode2.key` 查询 `oldVnodeKeyToIdex`，找到哪个老vnode可以和它完成patch。当然了，也可以反过来，根据`vnode2` `vnode3` `vnode4`的`key`属性和索引号建立map，然后用`old_vnode2.key`去查寻哪个新vnode可以和它完成patch，就不赘述了。

当然，这个方法不是完美的，可能`old_vnode3`恰巧没有`key`属性，新vnode找不到`old_vnode3`，这个时候就要改用遍历的方法，从`old_vnode3`遍历到`old_vnode4`, 看看哪个老vnode与新vnode是 `sameVnode`, 这样就可以确定哪两个vnode要patch。

不过，这个方法还可能失败，但这个情况就更简单了，新vnode找不到匹配的老vnode，就意味着新vnode要创建出DOM节点，然后根据新vnode的索引顺序插入到DOM里。

上述算法对应的源码位置：`src/core/vdom/patch.ts#updateChildren,line495`.

## hydrate
以上我们讲述的是客户端渲染的过程，这里讲一讲“水合”（hydrate）。

hydrate和客户端渲染本质上一样。客户端渲染的时候，我们只知道一个起始挂载点“#app-a”的DOM节点，其余DOM节点都是后来生成的, 并且"#app-a"节点最后会被替换为"#app"节点。而hydrate的时候，服务端已经把"#app"在内的所有DOM节点生成好，hydrate的过程只需要生成vnode和vm，将已有的DOM节点绑定到`vnode.elm`和`vm.$el`。

<image src="/vue2-hydrate-1.png" style="width: 600px" />

<br />

<image src="/vue2-hydrate-2.png" style="width: 700px" />

<br />

<image src="/vue2-hydrate-3.png" style="width: 700px" />

至此水合结束。

## slot 
客户端渲染和水合的整体流程已经清楚了，而vue组件渲染缺少了一个细节——插槽（slot）。针对下面的代码, `span`被`div`包裹，是`div`的子节点：
```vue 
<template>
  <div class="main">
    <span>hello</span>
  </div>
</template>
```

如果把`div`变成一个vue组件，`span`就是vue组件的插槽内容：
```vue 
<template>
  <app-root>
    <span>hello</span>
  </app-root>
</template>
```

`span`会出现在`app-root`组件内的什么位置，由`app-root`定义：
```vue 
<template>
  <div class="container">
    <div class="header">
      <slot name="header" />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>
```
这个例子中，`<span>`会插入到`<slot />`的位置。如果想插入到`<slot name="header" />`的位置，应该这样写：
```vue 
<template>
  <app-root>
    <span v-slot:header>hello</span>
  </app-root>
</template>
```

实际上，上述结构被编译之后，render方法会返回这样的vnode:
```ts 
const vnode = {
  tag: "app-root",
  componentOptions: {
    Ctor: AppRoot,
  },
  children: [
    {
      tag: 'span',
      data: {
        slot: "header"
      },
      children: [
        { text: "hello"}
      ]
    }
  ]
}
```

当渲染这个vnode的时候，会为之创建vm, vm会收集这些slot:
```ts
vm.$slots = {
  header: [
    {
      tag: 'span',
      data: {
        slot: 'header'
      },
      children: [
        { text: 'hello' }
      ]
    }
  ]
}
```

接下来，vm执行vm._render得到vnode2:
```ts 
const vnode2 = {
  tag: "div",
  data: {
    attrs: {
      class: "container",
    }
  },
  children: [
    {
      tag: 'div',
      data: {
        attrs: {
          class: "header"
        }
      },
      children: normalizeChildren([vm.renderSlot("header")])
    },
    {
      tag: 'div',
      data: {
        attrs: {
          class: "content"
        }
      },
      children: normalizeChildren([vm.renderSlot("default")])
    }
  ]
}

vm.renderSlot = (name: string) => {
  const slots = vm.$slots;
  return slots[name]
}
```

`renderSlot`源码：`src/core/instance/render-helpers/render-slot.ts#renderSlot`

`normalizeChildren`会将`[[vnode1], vnode2]` 拉平为`[vnode1, vnode2]`, 最终结果就是：
```ts 
const vnode2 = {
  tag: "div",
  data: {
    attrs: {
      class: "container",
    }
  },
  children: [
    {
      tag: 'div',
      data: {
        attrs: {
          class: "header"
        }
      },
      children: [
        {
          tag: 'span',
          data: {
            slot: 'header'
          },
          children: [
            { text: 'hello' }
          ]
        }
      ]
    },
    {
      tag: 'div',
      data: {
        attrs: {
          class: "content"
        }
      },
      children: null
    }
  ]
}
```

此时就消除了`slot`的概念，转化为常规的vnode，照常渲染即可。

## scoped slot 
scoped slot 比 slot 更高级。

```vue 
<template>
  <div class="container">
    <slot v-bind:info="userInfo"></slot>
  </div>
</template>
<script>
export default {
  name: "app-root",
  data: {
    userInfo: { age: 10, name: "Jack" }
  }
}
</script>
```

```vue 
<template>
  <div>
    <app-root>
      <template v-slot:default="appRootBindProps">
        {{ appRootBindProps.info.name }}
      </template>
    </app-root>
  </div>
</template>
```
`slot`的标记`v-bind:info="userInfo"`, `info` 是 key, `userInfo` 是值，我们只用`v-bind`建立了一个键值对，只能得到`{info: userInfo }`的对象，而`appRootBindProps`就是这个对象的引用。我门使用`appRootBindProps.info.name` 得到的就是 `Jack` 了。

实际上外层组件中`<app-root>`的vnode:
```ts 
const vnode = {
    tag: "app-root",
    componentOptions: {
      Ctor: AppRoot,
    },
    data: {
      scopedSlots: {
        "default": {
          key: "default",
          // 如果<template v-slot:default="{ info }"> 这么写，
          // appRootBindProps 也就同步换成 { info } 了，这个
          // 是 vue compiler 在 code generate 的结果，简单讲
          // 生成的代码就是一堆字符串，直接做了字符替换，将“appRootBindProps”字符串替换为“{ info }”
          //
          // 可想而知，vue里边的一些看似黑魔法的表达方式，都要遵循
          // js语法，就是因为这些表达方式被vue compiler处理后，
          // 会被塞入到生成好的js代码上下文里
          fn: (appRootBindProps) => {
            const node = {
              tag: 'template',
              data: {
                slot: "default"
              },
              children: [appRootBindProps.info.name]
            }
            return node;
          },
        }
      }
    }
}
```

`app-root`是vue组件类型的vnode，为它创建vm, 然后`vm.$scopedSlots = vnode.data.scopedSlots`, 执行 vm._render, 生成vnode2:
```ts 
const vnode2 = {
  tag: "div",
  children: normalizeChildren(vm.renderSlot("default", { info: vm.userInfo })),
}

vm.renderSlot = (slotName, slotProps) => {
  const scopeSlot = vm.$scopedSlots[slotName]
  const scopeSlotFn = scopeSlot.fn
  return scopeFn(slotProps)
}

// normalizeChildren会处理[[vnodeA], vnodeB]的情况，
// 铺平为 [vnodeA, vnodeB], 也会将 vnodeA 处理为 [vnodeA]
```

最终vnode2的结果：
```ts 

const vnode2 = {
  tag: 'div',
  children: [
    {
      text: ["Jack"]
    }
  ]
}

// 这里去掉了 tag: "template"，是因为vue有特殊处理，
// 这种情况返回 tag: "template" 的子vnode, 也就是
// { text: ["Jack"] } 
```
`renderSlot`源码：`src/core/instance/render-helpers/render-slot.ts#renderSlot`
> renderSlot的调用，以及函数入参，是 vue compiler 在解析
> 完 template 代码块之后，自动生成的。

## async component 
上边已经解释了常规的组件如何渲染，现在我们聊聊异步组件async component怎么渲染。

如果你经常使用`vue-router`，你会非常熟悉。前端路由拆分出来的组件，并不会直接被引用，而是通过`import`引入：
```ts 
import UserInfo from "../pages/UserInfo.vue"
const routes = [
  {
    path: "/user",
    // 同步引入，component就是一个组件class定义
    component: UserInfo
  },
  {
    path: "/shop",
    // 异步引入，component是一个函数
    component: () => import("../pages/Shop.vue"),
  }
]
```

这样处理后，`UserInfo`的代码被打包到输出的入口文件entry.js；而`Shop`的代码会单独打包到一个chunk.js的文件, 在代码运行的时候，透过`import`函数发送http请求拉取这个文件，可以减少entry.js的体积。

`vue-router`之所以能够这样做，在vue框架里一定是有依据的。

```vue 
<template>
  <div class="main">
    <app-root />
  </div>
</template>
<script>
  export default {
    components: {
      AppRoot: () => import("./components/AppRoot.vue")
    }
  }
</script>
```
这种注册vue组件的写法并不常见，这个时候`<app-root />`对应的vnode是这个样子：
```ts 
const vnode = {
  tag: "app-root",
  componentOptions: {
    Ctor
  }
}
```
与普通vue组件的区别，在于 `Ctor` 不是固定值，每次渲染的时候，都要动态计算出来，接下来就看看`Ctor`的计算流程：
```ts 
const rawCtor = () => import("./components/AppRoot.vue");

function resolveCtor() {
  let Ctor = rawCtor;

  // vue允许用户提供一个错误的时候应该展示的组件，这个组件
  // 会被绑定到 Ctor.errorComp 上。这个我们后边会提到
  if (isTrue(Ctor.error) && isDefine(Ctor.errorComp)) {
    return Ctor.errorComp;
  }

  if (isDefine(Ctor.resolved)) {
    return Ctor.resolved;
  }

  if (isTrue(Ctor.loading)) {
    return Ctor.loadingComp;
  }

  // 未来加载出来的vue组件class，就用这个方法捕获
  const resolve = (componentOrModule) => {
    if (isESModule(componentOrModule)) {
      Ctor.resolved = componentOrModule.default;
      return;
    }
    Ctor.resolved = componentOrModule;
    // 异步加载好了，令用到 Ctor 的父组件，强制重新渲染一次
    // 那么在下一次渲染的时候，resolveCtor会
    // 被重新执行一次，直接返回 Ctor.resolved
    forceRender();
  }

  const reject = (reason) => {
    if (isDefine(Ctor.errorComp)) {
      Ctor.error = true;
      // 令用到 Ctor 的父组件，强制重新渲染一次，
      // 那么在下一次渲染的时候，resolveCtor会
      // 被重新执行一次，就可以检测到 Ctor.error 
      // 是 true，直接返回 Ctor.errorComp
      forceRender();
    }
  }

  // 执行结果有两种风格，第一种是返回Promise,
  // 也就是我们开头举的例子，还有一种是让用户
  // 可以自定义发生错误或者加载中，应该展示哪个
  // 组件class定义：
  // Ctor = () => ({
  //   component: import("./components/AppRoot.vue"),
  //   error: ErrorComponent,
  //   loading: LoadingComponent,
  // })
  const res = Ctor(resolve, reject);

  if (isObject(res)) {
    
    if (isPromise(res)) {
      // 这里说明，上一步执行 Ctor 的时候，resolve没有执行
      if (isUndefine(Ctor.resolved)) {
        res.then(resolve, reject)
      }
    }

    else if (isPromise(res.component)) {
      res.component.then(resolve, reject)
      
      // 如果用户提供了自定义发生错误时，应该展示哪个组件
      if (isDefine(res.error)) {
        Ctor.errorComp = res.error
      }

      // 如果用户提供了自定义加载中，应该展示哪个组件
      if (isDeine(res.loading)) {
        Ctor.loadingComp = res.loading 
        Ctor.loading = true
      }
    }
  }

  return Ctor.loading ? Ctor.loadingComp : Ctor.resolved
}
```

我想你已经清楚了异步组件是怎么一回事儿了吧

源码：`src/core/vdom/helpers/resolve-async-component.ts#resolveAsyncComponent`

## component "is" attr 
异步组件的精髓在于动态计算`Ctor`，里边还夹杂着http请求。而下边代码的本质，也在于动态计算`Ctor`：
```vue 
<template>
  <div class="main">
    <component :is="animal" />
  </div>
</template>
<script>
  import Dog from "./components/Dog.vue"
  import Cat from "./components/Cat.vue"

  export default {
    components: {
      Dog,
      Cat
    },
    data: {
      animal: "dog"
    }
  }
</script>
```

`<component />` 对应的vnode是这个样子：
```ts 
const vnode = {
  tag: 'dog',
  data: {
    is: "dog"
  },
  componentOptions: {
    Ctor
  }
}

// tag不会是 component，因为 data.is 已经表明
// 这个 vnode 绑定了 :is 属性，data.is 的值
// 就是 tag 
```

同样需要动态计算`Ctor`，还好，这个计算非常简单：
```ts 
function resolveCtor() {
  // 这里的vm指的是 <component /> 父组件对应的vue实例
  return vm.$options.components[vnode.data.is];
}
```

源码： `src/core/vdom/create-element.ts#_createElement,line64`


## 源码位置梳理
上面虽然讲清楚了渲染过程，但并没有说明对应的是源码哪些代码，因此这里针对一些关键点，给出源码位置，方便读者自行深入理解。

`Vue`定义：`src/core/instance/index.ts`

`vm._render`定义：`src/core/instance/render.ts,line103`

`vm._update`定义：`src/core/instance/lifecycle.ts,line62`

`vm.$mount`定义：
- `src/platforms/web/runtime/index.ts,line36`
- `src/core/instance/lifecycle.ts#mountComponent,line146`

`vm.__patch__`定义：
- `src/platforms/web/runtime/index.ts,line33`
- `src/platforms/web/runtime/patch.ts,line10`
- `src/core/vdom/patch.ts,line801`

为vnode创建vm: 
- `src/core/vdom/patch.ts#createComponent,line187`
- `src/core/vdom/create-component.ts,line37`
- `src/core/vdom/create-component.ts#createComponentInstanceForVnode,line212`

根据vnode生成DOM节点：`src/core/vdom/patch.ts#createElm,line121`

直接patch两个vnode：`src/core/vdom/patch.ts#patchVnode,line584`

两个vnode的chilren之间的patch: `src/core/vdom/patch.ts#updateChildren,line413`

`render: (h) => h(App)` 的`h`函数：`src/core/vdom/create-element.ts#createElement, line27`

创建vue组件类型的vnode：`src/core/vdom/create-component.ts#createComponent,line101`
