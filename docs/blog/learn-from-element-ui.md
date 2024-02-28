---
title: "从 ElementUI 源码学到的小知识"
page: true
aside: true
---

# 我从 ElementUI 源码学到的小知识

- 不涉及源码解析
- 以思路为主
- 部分会说下具体实现

## scss


## popover
像 popover tooltip dropdown 这些组件，它们的共性就是将一段展示内容定位到
目标节点的附近；

可以使用`@popoverjs/core`完成定位。

```js
function getWindow(node) { 
  return node.ownerDocument.defaultV || window }
```

## tabs 内容惰性加载

tabs 使用形式大致就是这样：

```jsx
<tabs active="A">
  <tab-pane name="A" />
  <tab-pane name="B" />
  <tab-pane name="C" />
</tabs>
```

有的组件在实现的时候，会将`A` `B` `C` 全部渲染，并且在 DOM 里挂载，然后
通过 css 属性，将 `B` 和 `C` 设置为不可见，这会带来一些问题：

- 如果组件内部在挂载的时候，会发送 http 请求，在只展示 A 的时候，却也拉取了
  B 和 C 的数据，显然没有必要
- 有一些情景下，要求在组件第一次展示给用户时，处理一段逻辑，通常要利用 mount
  组件生命周期函数实现，在展示 A 的时候，B 和 C 也完成了挂载， mount 生命周期
  函数被调用了，导致逻辑提前被处理，没有等到用户看到 B 和 C 时才处理

惰性加载就派上用场了：只有当用户访问 B 时，我们才去挂载 B，等用户二次访问 B 时候，无需重新挂载 B，将第一次挂载好的组件展示给用户即可。

在 vue 里的实现逻辑很简单，在 tab-pane 里用 v-show 和 v-if 就可以搞定了：

```vue
// tab-pane 组件
<template>
  <section v-if="inited" v-show="visible">
    <slot></slot>
  </section>
</template>
<script>
export default {
  props: {
    name: String,
  },
  data() {
    return {
      inited: false,
    };
  },
  computed: {
    visible() {
      // this.$parent 指的就是 tabs 组件
      const show = this.$parent.active === this.name;

      if (show) {
        // 组件位于 <slot>，利用 inited 可以控制
        // 组件是否挂载到 DOM 上
        if (this.inited === false) {
          this.inited = true;
        }
      }

      return show;
    },
  },
};
</script>
```

## 提示器定位

## 表格滚动和固定

核心原理就是 `position: sticky`

```html
<style>
  .container {
    border: 1px solid red;
    width: 200px;
    height: 50px;
    overflow: auto;
  }

  .tb {
    border-collapse: collapse;
  }

  .tb td,
  .tb th {
    background: white;
    border: 1px solid black;
  }
</style>
<div class="container">
  <table class="tb">
    <thead>
      <tr class="table-head">
        <th>姓名</th>
        <th>昵称</th>
        <th>UUID</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>张三</td>
        <td>张三不怎么喜欢吃西瓜</td>
        <td>2555555550000998764accdfdre</td>
      </tr>
      <tr>
        <td>李七</td>
        <td>李七的右脚比别人臭</td>
        <td>343454676575gssgkghgd45654w</td>
      </tr>
    </tbody>
  </table>
</div>
```

要想让表格的表头固定，不跟随滚动，只需：

```html
<style>
  .table-head {
    position: sticky;
    top: 0;
  }
</style>
```

要想让表格的第一列固定，不跟随水平滚动，只需：

```html
<style>
  .tb .tr > .th:first-child,
  .tb .tr > .td:first-child {
    position: sticky;
    left: 0;
  }
</style>
```

如果让表格的最后一列固定，不跟随水平滚动，只需：

```html
<style>
  .tb .tr > .th:last-child,
  .tb .tr > .td:last-child {
    position: sticky;
    right: 0;
  }
</style>
```

如果想让表格前两列固定，不跟随水平滚动，需要用 js 获得第一列的宽度，
比如说是 100px, 然后设置：

```html
<style>
  .tb .tr > .th:nth-child(2),
  .tb .tr > .td:nth-child(2) {
    position: sticky;
    left: 100px;
  }
</style>
```

基本的思路就是如此。

另外：

- thead 和 tbody 分别放在两个 `<table>` 里，滚动说的是 `container`在滚动，
  不是 table 自身滚动，所以放在两个 table 里，都是 container 在滚动，table 之间不受影响。拆分成两个 table，可能是表头和内容不耦合，被更好地处理；
- 每一个列的宽度最终会通过 `<colgroup>` 中的 `<col>`来设置
- 列里边加入 checkbox 或者 自定义的组件，本质就是把组件渲染在 `<td>` 里
- 某一行支持展开内容，本质就是在这行后边插入一个`<tr>`，将内容渲染在`<tr>`里，
  收起就是把这个`<tr>`删除
- 多级表头本质就是求解树中每个节点的深度和分支数量问题，深度用来确定`<th>` 的`rowspan`, 分支数量用来确定`<th>`的 `colspan`

## programable messagebox
如何用js调用的方式，在页面上展示消息框？

- 创建dom节点`const container = document.createElement("div")`
- 创建组件对应的虚拟节点 `const vnode = createVnode()`
- 挂载虚拟节点 `render(vnode, container)`
  > 触发组件的 mount
- 将承载组件的dom节点挂载到页面，比如 body 里， `document.body.appendChild(container.firstElementChild)`
- 如果你想获取组件实例，`const vm = vnode.component.proxy`
  > 为了便于管理资源，会将 vm 缓存起来

当卸载消息框的时候
- 卸载虚拟节点 `render(null, container)`
  > render顺带手会从 document.body 删除 container.firstElementChild
- 删除实例对象引用，释放资源

## Transition组件触发 after-leave hook
```vue
<Transition @after-leave="a()">
  <div v-show="visible" />
</Transition>

// visible 从 true 变成 false，会触发 a() 么 ？
```
```vue 
<Transition @after-leave="a()">
  <div v-if="visible" />
</Transition>

// visible 从 true 变成 false，会触发 a() 么 ？
```

## 虚拟滚动

```html
<style>
    #container {
        width: 200px;
        height: 400px;
        overflow: hidden;
    }

    .content {
        width: 100px;
        height: 1000px;
    }
</style>
<div id="container">
    <section class="content"></div>
</div>
```

对 `#container` 实施虚拟滚动，粗略需要以下步骤：

1. 禁止`#container`的原生滚动
   方法就是给`#container`设置`overflow: hidden`

2. 给`#container`设置`wheel`事件监听器

   ```js
   const container = document.getElementById("container");

   // 设置 overflow: hidden 后，#container 无法
   // 响应 "scroll" 事件，但依旧可以响应 "wheel" 事件；
   //
   // 在 macOS 上，使用“双指下滑”，触发的就是"wheel"事件；
   //
   // 以人机交互方式，触发原生滚动无非两种：
   // 1. 滚轮滚动，会触发 “scroll”事件 “wheel”事件
   // 2. 拽动滚动条，会触发 "scroll"事件，不会触发"wheel"事件
   container.addEventListener("wheel", (e) => {
     handler(event);
   });
   ```

3. 完善处理函数 handler
   从 `event.deltaY` 中，可以得到滚动距离信息，用这个信息，经过一番逻辑
   处理之后，转化为页面需要滚动距离 offset

   > macOS 中，双指上滑，event.deltaY ≥ 0

4. 落实滚动

   ```js
   // 设置 overflow: hidden 之后，依然可以利用 programmatic
   // 的方式，使之里面的内容发生滚动
   container.scrollTop = offset;
   ```

5. 由于禁用了原生滚动，滚动条不会展示，你需要自己实现一个滚动条

## 官网的组件示例卡片怎么搞出来的
组件示例卡片：
- 代码高亮（使用 prismjs实现）
  > [source code](https://github.com/element-plus/element-plus/blob/dev/docs/.vitepress/utils/highlight.ts) 
- 使用自定义组件Demo, 通过vitepress的theme.ts做的全局注册
  > [source code](https://github.com/element-plus/element-plus/blob/dev/docs/.vitepress/vitepress/components/vp-demo.vue)
- markdown转化为Demo组件, 基于 markdown-it 和 markdown-it-container
  > [source code](https://github.com/element-plus/element-plus/blob/dev/docs/.vitepress/config/plugins.ts)
- 编译时，向markdown注入demos变量
  > [source code](https://github.com/element-plus/element-plus/blob/dev/docs/.vitepress/plugins/markdown-transform.ts)


