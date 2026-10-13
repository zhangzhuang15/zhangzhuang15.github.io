---
title: "vue router"
page: true
aside: true
---

# vue router 
基于vue框架实现的前端路由框架。

本文介绍vue router, 来自于vue router源码的commit记录a598a3474fb47f018e435c081a724721d19b0ee0

我fork了vue router源码，因此可以直接下载我的fork版本：
```shell 
git clone git@github.com:zhangzhuang15/vue-router.git
```

## 运转机制
vue router有如下几个主要的部分：
1. 视觉层，提供`<router-view>`组件，负责根据url渲染对应的组件
2. history层，抽象浏览器的`history`对象，提供变更当前路由的能力，监听浏览器事件，让响应式变量感知到路由变更
3. 响应式变量，将路由的更新转化为`<router-view>`的渲染更新

用户在定义路由的时候，会提供一个routes数组，里边记录了在什么样的url，应该渲染什么组件。

vue router定义了不少响应式变量，最核心的响应式变量是currentRoute，即当前的路由。

`<router-view>` 组件被注入(vue组件的provide和inject能力)currentRoute, 并根据currentRoute找到routes里的匹配项，取出对应的组件，作为自身render方法的返回值。此时，页面就会展示这个组件。

vue router基于浏览器的history对象，代理其`pushState`和`replaceState`方法，在方法中修改currentRoute的值, 还能执行`beforeEach` `beforeResolve` `afterEach`注册的守卫回调（guard callback）；

并且，监听`popstate`事件，这样当`history.go()` `history.forward()` `history.back()` 执行之后，可以在这个事件回调函数中，获取到最新的url，更新currentRoute.

对于hash类型的路由，还会监听`hashchange`事件，在事件回调中，根据当前的url更新currentRoute值。

## history 
### guard callback 的执行顺序 
当调用`router.push()` `router.replace()` 的时候，就会触发guard callback的执行。

`beforeEach`说的是在真正调用`history.pushState()`或者`history.replaceState()`之前，要调用的callback。

`beforeResolve`说的是路由对应的组件能确定后，调用的callback。我们知道，在给出routes的时候，组件可能是同步组件，也可能是异步组件——`() => import("../hello.vue")`。对于后者，vue router要调用这个函数，得到promise，在promise被resolved后，拿到组件module，这个时候，就说组件被resolve了。vue框架自身有处理异步组件的能力，不用你主动调用`() => import("../hello.vue")`, 但是vue router还是主动做了。

`afterEach`说的是`history.pushState()`或者`history.replaceState()`之后，要调用的callback。

我们可以用一段模拟代码，简明说下顺序：
```ts 
import { ref } from 'vue'

const currentRoute = ref()

function navigate({ url, replace }: {url: string, replace: boolean }) {
  currentRoute.value = recomputeRoute(url)

  Promise.resolve()
    .then(() => {
      const guards = fetchBeforeEachCallbacks(currentRoute)
      
      runGuards(guards)
    })
    .then(() => {
      const guards = fetchBeforeResolveCallbacks(currentRoute)
      const promise = extractComponent(currentRoute)
      promise.then(() => runGuards(guards))
    })
    .then(() => {
      replace ? doHistoryReplaceState(currentRoute) : doHistoryPushState(currentRoute)
    })
    .then(() => {
      const guards = fetchAfterEachCallbacks(currentRoute)

      runGuards(guards)
    })
}
```

### guard callback 里的 next 怎么实现的 
guard callback 给出的定义中，有个叫做 next 的入参，当它被调用的时候，就会执行下一个guard callback。其实next就是Promise的resolve，

```ts 
function wrappGuard(guard: Function, to: string, from: string) {
  return new Promise((resolve) => {
    guard(to, from, resolve)
    resolve()
  })
}

function runChainedGuards(guards: Function[], to: string, from: string) {
  return guards.reduce((acc, guard) => {
    acc = acc.then(() => wrappGuard(guard,to,from))
  }, Promise.resolve())
}
```

### 为什么要拦截api调用，还要监听浏览器事件
拦截`pushState` `replaceState`，解决的是用户主动调用api变更前端路由的场景，拦截之后，就能变更currentRoute了。

拦截`hashchange` `popstate` 事件，解决的是用户手动更新浏览器url，点击浏览器前进键、后退键的场景，这样就可以在该场景里，更新currentRoute了。

前端路由变化，组件刷新，这个过程的关键就是**currentRoute是否更新**。

## router-view 
### 页面初始化的状态
当前端应用初始化的时候，vue router会根据当前的url，计算出一个rout值，更新currentRoute，这样router-view就能渲染出对应的组件了。这个行为发生在这行：
```ts 
import { createApp } from "vue"
import App from "./app.vue"
import router from "./router.ts"

createApp(App)
  .use(router) // [!code focus]
  .mount("app")
```

### router-view的嵌套如何实现
有如下的配置：
```ts [router.ts]
import { createRouter } from "vue-router"
import Animal from "../animal.vue"
import Dog from "../dog.vue"

export default createRouter([
  {
    path: '/animal',
    component: Animal,
    children: [
      path: '/dog',
      component: Dog
    ]
  }
])
```

```vue [animal.vue] {4}
<template>
  <div>
    <header>动物介绍</header>
    <router-view />
  </div>
</template>
```

```vue [app.vue]
<template>
  <div>
    <router-view />
  </div>
</template>
```

你会发现`animal.vue`里也使用了`router-view`。

当路由是`/animal/dog`的时候，`app.vue`里的`router-view`就会被渲染为`animal.vue`， 而`animal.vue`里的`router-view`就会渲染为`dog.vue`。

但是，`router-view`组件的定义是一样的，它是如何完成嵌套的呢？

秘密在于`router-view`有个`depth`属性，它会把`depth + 1`的值注入给子组件。

`app.vue`里的`router-view`的depth是0，`animal.vue`里的`router-view`是前者的子组件，depth就是1了。根据这个差别，前者会在第一级寻找component，后者会在第二级（也就是children）里寻找component。