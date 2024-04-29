---
title: "vue2梳理"
page: true
aside: true
---

## Description
使用vue2的过程中，总会遇到一些困惑，要查看源码才知道，但是过了一段时间又健忘了，
因此在这篇文章里记录一下。常更常新。

vue2源码使用的是 2.7.14 版本

### 项目总览

<table>
  <tr>
    <th>目录</th>
    <th>细分</th>
    <th>描述</th>
  </tr>
  <tbody>
    <tr>
      <td rowspan="5">src/platforms/web</td>
      <td>runtime/index.ts</td>
      <td>对于不同的runtime，暴露出来的接口有所不同，但它们都要暴露出Vue，本文件存储的就是Vue逻辑，
      如果你想知道，使用框架时遇到的Vue变量到底是什么东西，就看这个文件</td>
    </tr>
    <tr>
      <td>entry-runtime-esm.ts</td>
      <td>vue库的rollup入口文件，其产物是esmodule，不能作为cdn直接用于浏览器，但可以用在webpack开发vue app</td>
    </tr>
    <tr>
      <td>entry-runtime-with-compiler-esm.ts</td>
      <td></td>
    </tr>
    <tr>
      <td>entry-runtime.ts</td>
      <td></td>
    </tr>
    <tr>
      <td>entry-runtime-with-compiler.ts</td>
      <td></td>
    </tr>
    <tr>
      <td rowspan="5">src/v3</td>
      <td>reactivity</td>
      <td>组合式API的响应式实现</td>
    </tr>
    <tr>
      <td>index.ts</td>
      <td>组合式API的导出文件, 你使用 <code>import { ref } from "vue"</code> 导入的ref就是
      这个文件导出的；这个文件又被上面的 entry-*.ts 文件引用</td>
    </tr>
    <tr>
      <td>apiWatch.ts</td>
      <td>
        实现：
        <ul>
          <li><code>watch</code></li>
          <li><code>watchEffect</code></li>
          <li><code>watchPostEffect</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>apiLifecycle.ts</td>
      <td>
        实现了：
        <ul>
          <li><code>onBeforeMount</code></li>
          <li><code>onMounted</code></li>
          <li><code>onBeforeUpdate</code></li>
          <li><code>onUpdated</code></li>
          <li><code>onBeforeUmount</code></li>
          <li><code></code></li>
          <li><code></code></li>
          <li><code></code></li>
          <li><code></code></li>
          <li><code></code></li>
          <li><code></code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>h.ts</td>
      <td>定义了vue虚拟节点生成函数，类似于 <code>react.createElement</code></td>
    </tr>
    <tr>
      <td rowspan="4">src/core</td>
      <td>components</td>
      <td>定义了内置组件，比如<code>keep-alive</code></td>
    </tr>
    <tr>
      <td>observer</td>
      <td>vue2基于<code>Object.defineProperty</code>的响应式实现</td>
    </tr>
    <tr>
      <td>instance</td>
      <td>Vue的实现；尽管$mount是绑定在Vue实例上，但是在src/platforms/web/runtime/index.ts定义</td>
    </tr>
  </tbody>
</table>

### new Vue() 到底发生了什么？


### data props 的数据怎么变成响应式，又怎么挂载到Vue实例上的？


### Observer Watcher DepTarget到底是什么关系？


### Vue.prototype.$set 为什么会存在，又实现了什么功能？


### 响应式变量更新后，为什么会激活重新渲染？


### onMounted函数和mounted函数怎么做到兼容的？


### 为什么要有 Vue.nextTick, nextTick又是如何实现的？