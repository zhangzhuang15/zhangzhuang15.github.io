---
title: "虚拟节点"
page: true
aside: true
---

# 虚拟节点

如果让你更新页面，我想，你一定能想到这样的方式：

1. 获取最新的数据
2. 遍历所有要更新的 HTMLElement
3. 用最新的数据更新 HTMLElement

这种方式最令人不爽的地方有两点：

1. 你要用`document.getElementById`这种 API 把所有需要更新的 HTMLElement 查出来
2. 你必须要知道数据更新的时候，到底是哪些 HTMLElement 要更新，哪些不用更新

这就是`jquery`框架时代的风格。如果你看过这种风格的代码，一定会想吐，因为想知道更新了哪些 HTMLElement，你要用全局搜索大法，搜索 id 或者 classname，更恶心的是，有一堆 HTMLElement 还是动态生成插入进去的，对于这些 HTMLElement，你还要去爬 javascript 代码。总之就是，贼麻烦，贼乱，贼废眼睛，贼头疼。

有没有更通用的方式，不需要这么麻烦呢？有的，就是 MVC。M 就是 Model, 表示数据。V 是 view，表示页面。C 是 Controller，表示把数据落实到页面上。更简单来说，就是用一套变量定义页面的状态，然后定义一种函数，将这套变量同步到页面。更新一个页面的过程就会变成：

1. 获取最新的数据
2. 更新描述页面状态的变量
3. 调用函数，根据这套变量的最新值，把页面重新构造一遍
4. 替换原来的旧页面

描述页面状态的变量，其实就是虚拟节点。一个虚拟节点，对应一个 HTMLElement，也可以对应一个 Vue 组件，不过，为了更容易理解虚拟节点，我们暂时不涉及 Vue 组件，直接简化为一个虚拟节点对应一个 HTMLElement。

我们要考虑的是，一个虚拟节点应该定义哪些属性。 虚拟节点既然描述的 HTMLElement, 就该参考它。于是，我们有：

```ts
// Virtual Node
interface VNode {
  tag: string; // div input span img, etc
  attrs: {
    style?: string;
    classname?: string;
    [s: string]: any; // value, src, href, type
  };
  children: (VNode | string)[];
}
```

如果我们有一个具体的 virtual node，该如何把它落实到页面：

```ts
const originVNode = {
  tag: "div",
  attrs: {
    style: "display: flex; align-items: center;",
    classname: "container",
  },
  children: [
    { tag: "span", attrs: {}, children: ["Hello world"] },
    { tag: "p", attrs: { style: "color: blue" }, children: ["Content"] },
    { tag: "img", attrs: { src: "http://xxxxx/a.png" }, children: [] },
    { teg: "input", attrs: { value: "", type: "text" }, children: [] },
  ],
};
```

实际描述的就是：

```html
<div style="display: flex; align-items: center;" class="container">
  <span>Hello world</span>
  <p style="color: blue">Content</p>
  <img src="http://xxxxx/a.png" />
  <input value="" type="text" />
</div>
```

virtual node 到真实的页面需要一个函数转化：

```ts
function render(vnode: VNode | string | null) {
    if (typeof vnode === 'string') return vnode;
    if (vnode === null) return '';

    const rootHostNode = document.createElement(vnode.tag);
    Object.keys(vnode.attrs).forEach(attrName => {
        if (attrName === 'classname') {
            rootHostNode.classList.add(vnode.attrs.[attrName]);
            return;
        }
        rootHostNode.[attrName] = vnode.attrs.[attrName];
    });

    for (const childVNode of vnode.children) {
        rootHostNode.appendChild(render(childVNode));
    }
    return rootHostNode;
}
```

那么，更新页面的逻辑就出来了：

```ts
let currentNode = null;
let rootHostNode: null | HTMLElement = null;

async function updatePage() {
  const parent = rootHostNode.parent;
  parent.removeChild(rootHostNode);
  rootHostNode = render(currentNode);
  parent.appendChild(rootHostNode);
}
```

有了以上的工作，你的关注点就变成了：

1. 更新 currentNode
2. 调用 updatePage

可惜仍然不方便：

1. currentNode 是一个树形结构，好多 VNode 都嵌套在了一起，我要更新哪个 VNode，仍然需要我事先知道，或者遍历一下才知道。
2. 我需要手动调用 updatePage，容易遗漏。

这里我们就需要**一套机制**：在更新数据的时候，自动定位到要更新的 VNode，在更新之后，自动调用 udpatePage。这套机制，就是 Vue 的精髓所在。

不过，VNode 的事情还没有说完，我们在下一篇文章再说这套机制。

上边我们提到的 VNode 更新页面的思路是有问题的。每次更新页面的时候，我们都要照着 VNode 从新生成一遍 rootHostNode, 然后替换原来的，中间存在更新效率问题。假设总共有 10 个 VNode,只有一个 VNode 更新了，我们应该只更新它刻画的 HTMLElement 就可以了，不需要从新搞一遍。

嗯嗯，解决这个问题，就要使用 **VNode diff** 算法了。大白话讲就是，给你一个新 VNode Tree, 再给你一个老 VNode Tree，你告诉我，老 VNode Tree 要转化成新 VNode Tree，要修改哪些老 VNode。

新 VNode 和老 VNode 不一样，具体会有哪些不同呢？

1. tag 不一样
2. attrs 不一样
3. 新 VNode 和老 VNode 其中一个不存在了
4. children 不一样

对于 children 不一样的情况，可以遍历双方的 children，套用上述的 1、2、3，但有一点比较特殊，新 VNode.children 和 老 VNode.children, 只是里边的 VNode 顺序不一样。

VNode diff 的精髓之一是找到哪些 VNode 不同，另外就是最小化修改，尽量不去删除或者创建 VNode。刚才说的 children 的特殊情形，就不用创建 VNode，只需要调换顺序就可以了。
