---
title: "web app framework"
page: true
aside: true
---

## Description

前端框架相关的库

## Next

基于 react 实现的全栈框架，你可以利用这个框架编写前端组件和后端接口，它既是像 webpack 那样的前端
项目构建工具，也是像 express 那样的后端服务开发工具。

它提供了：

- static rendering (传统的 docs website)
- dynamic rendering (按客户端请求渲染，生成 html 和 js 代码)
- server rendering

## redux

基于 reducer state action 模型概念的数据处理库，纯函数；

这个库不绑定任何的前端框架；

## react-redux

redux 的 react 移植版本；

提供一些内置的组件和 hook，令 react 组件内部可以访问 redux 内的数据;

这些组件和 hook 有这些：

- Provider
- useSelector
- useDispatch

react-redux 仍旧依赖 redux 创建的 store，它并没有重新定义 store 替换掉 redux，只需将 redux 创建的 store 传入 Provider 组件，Provider 的后代组件才可以使用`useSelector`等 hook 获取到 store 的数据；

[react-redux official website](https://react-redux.js.org/tutorials/quick-start)

## react-router-dom

react 框架下的前端路由管理器；

将路由的变化，传导至组件变化，令组件更新；

也就是说，当你将路由修改之后，组件就会更新；

其内部实现依赖 `react-router`，web app 开发者一般不需要直接用这个库，用 `react-router-dom`即可；

## connected-react-router

打通 react-redux 和 react-router.

在 react-redux 中建立一份 state，记录路由信息；

当路由发生变化的时候，将路由信息同步到 state 中；

当 state 记录的路由信息发生变化时（利用 redux store.subscribe 实现），将改变化同步到实际路由中；

> 其实完成的就是 vue-router 中的事情，因为 vue 拥有响应式，状态管理和组件内共享一个引用，就能完成路由和
> 状态管理之间的同步，而 react 是非响应式，且 react-redux 是纯函数，无法通过共享引用达到这一点

## redux-saga

支持在 redux 中执行异步操作, 这些异步操作被抽象为 effects, 而 redux 本身的同步操作就是 reducers ；

采取 Generator 实现异步，而不是使用`async/await`；

默认情况下，redux 只能 dispatch 一个 action 执行 reducer 同步操作；

在 redux-saga 中，提供了 `takeEvery` 的 API，用来监听和 effect 有关的 aciton 是否被触发，进而在 dispatch 之后执行 effect。

[takeEvery 的解释链接](https://github.com/redux-saga/redux-saga/blob/main/docs/introduction/BeginnerTutorial.md)

## dva

一种综合工具，包含前端路由管理、数据状态管理，提供的 API 更加友好、丰富，
减轻开发者选择相关工具的负担

## umi

一个微前端实现的框架；

与利用 nginx 路由分发的微前端实现不同，这种实现更加丝滑；前者在切换子应用的时候，相当于整个页面重载，
会有视觉上的闪动；后者只是页面局部重载，整个页面不会重载

## single-spa

一种微前端技术的大框架，它给出一种抽象，暴露了 API 来定义子应用，定义了微前端中应用的生命周期，
给出了生命周期钩子，开发者只需要关注应用如何挂载到页面，从页面卸载，无需关心应用何时切换，怎么
切换的问题。

umi 就是基于它实现的。

## Nuxt

based on Vue

## pinia

最新 vue 状态管理工具

## vue-router

vue app 中的前端路由管理工具

## shadcn
[website](https://ui.shadcn.com/docs)

react生态下的一个组件库，与传统组件库不同，这个组件库不是将组件代码打包后提供给使用者，而是在用户的工作目录下创建一个组件库目录，用户调用它提供的命令行工具添加组件的源码，也就是说，它提供给用户的组件是全部暴露的，全部都能修改。

<Giscus />
