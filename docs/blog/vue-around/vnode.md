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

ok, 接下来我们来看看 VNode diff 算法该怎么实现。

```ts
// 为了示意vnode diff，为 VNode增加 el 和 key 属性

// Virtual Node
interface VNode {
  tag: string; // div input span img, etc
  attrs: {
    style?: string;
    classname?: string;
    [s: string]: any; // value, src, href, type
  };
  children: (VNode | string)[];
  // VNode刻画的HTMLElement
  el?: HTMLElement;
  key?: string;
}

// 这里做了简化，不考虑 old 或者 current 是 null 的情况；
// 如果 old 是 null, current不是，就意味着要创建一个新的
// HTMLElement, 那么函数签名里必须提供一个parentElement，
// 否则我们不知道新的HTMLElement插入到哪里；
//
// 我们主要的目的是理解大致思路，并非知道所有的细节，因此索性
// 不去考虑null的情况喽
function patch(old: VNode, current: VNode) {
  // 如果老vnode和新vnode严格一样，完全不需要做任何事情
  if (old === current) return;

  // 标签都不一样，意味着要删除老vnode刻画的HTMLElement，
  // 替换为新vnode刻画的HTMLElement
  if (old.tag !== current.tag) {
    const parentElement = old.el!.parentNode;
    const anchorNode = old.el!.nextSibling;
    unmount(old);
    mount(current, parentElement, anchorNode);
    return;
  }

  patchAttrs(old, current);
  patchChildren(old, current);
}

function unmount(node: VNode) {
  node.parentNode.removeChild(node);
}

function mount(
  node: VNode,
  parentElement: HTMLElement,
  anchor: HTMLElement | null
) {
  const element = render(VNode);
  parentElement.insertBefore(element, anchor);
}

function patchAttrs(old: VNode, current: VNode) {
  const el = old.el!;

  const oldKeys = Object.keys(old.attrs);
  const newKeys = Object.keys(current.attrs);
  const commonKeys = new Set(oldKeys).intersection(new Set(newKeys));

  for (const key of oldKeys) {
    if (commonKeys.has(key) && old.attrs[key] !== current.attrs[key]) {
      applyAttr(el, key, current.attrs[key]);
    }
    if (commonKeys.has(key) === false) {
      applyAttr(el, key, undefined);
    }
  }

  for (const key of newKeys) {
    if (commonKeys.has(key) === false) {
      applyAttr(el, key, current.attrs[key]);
    }
  }
}

function applyAttr(el: HTMLElement, attrKey: string, attrValue: string) {
  if (attrKey === "style") {
    el[attrKey] = attrValue;
    return;
  }
  if (attrKey === "classname") {
    el.classList.clear();
    el.classList.add(attrValue);
    return;
  }

  el[attrKey] = attrValue;
}

function patchChildren(old: VNode, current: VNode) {
  // VNode含有key属性，有了它，就意味着新vnode和老vnode只是
  // 在顺序做了调整, 我们要做特殊处理。
  const hasKey = old.children.some((child) => child.key !== undefined);
  if (hasKey) {
    patchKeyedChildren(old, current);
    return;
  }

  const commonLength = Math.min(old.children.length, current.children.length);
  for (let i = 0; i < commonLength; i++) {
    patch(old.children[i], current.children[i]);
  }

  // 删除多出来的老节点
  if (old.children.length > commonLength) {
    old.children.slice(commonLength).forEach((node) => unmount(node));

    // 增加新节点
  } else if (current.children.length > commonLength) {
    current.children
      .slice(commonLength)
      .forEach((node) => mount(node, old.el!, null));
  }
}

function patchKeyedChildren(old: VNode, current: VNode) {
  let oldLeft, oldRight, currentLeft, currentRight;
  oldLeft = currentLeft = 0;
  oldRight = old.children.length - 1;
  currentRight = current.children.length - 1;

  const oldChildren = old.children;
  const currentChildren = current.children;

  // 下面例子的字母表示vnode.key, 字母的先后位置表示vnode在 children
  // 中的索引位置

  // 从左往右处理这样的情形：
  // (ab)cde
  // (ab)edc
  while (oldLeft <= oldRight && currentLeft <= currentRight) {
    if (oldChildren[oldLeft].key === currentChildren[currentLeft].key) {
      patch(oldChildren[oldLeft], currentChildren[currentLeft]);
      oldLeft++;
      currentLeft++;
    } else {
      break;
    }
  }

  // 从右往左处理这样的情形：
  // cba(de)
  // abc(de)
  while (oldRight >= oldLeft && currentRight >= currentLeft) {
    if (oldChildren[oldRight].key === currentChildren[currentRight].key) {
      patch(oldChildren[oldRight], currentChildren[currentRight]);
      oldRight--;
      currentRight--;
    } else {
      break;
    }
  }

  if (oldLeft > oldRight && currentLeft > currentRight) {
    return;
  }

  // 多出来的新节点直接插入
  if (oldLeft > oldRight) {
    currentChildren
      .slice(currentLeft)
      .forEach((node) => mount(node, old.el!, null));
    return;
  }

  // 多出来的旧节点直接删除
  if (currentLeft > currentRight) {
    oldChildren.slice(oldLeft).forEach((node) => unmount(node));
    return;
  }

  // 要处理这种情形：
  //      oldLeft         oldRight
  // (abc)   d        ef    g      (hik)
  // (abc)   g      fdem    n      (hik)
  //    currentLeft      currentRight

  // 存储key到index的映射，方便在遍历老节点的时候，迅速找到
  // 和它的key完全一样的新节点
  const keyToNewIndexMap = new Map<string, number>();
  currentChildren
    .slice(currentLeft, currentRight + 1)
    .forEach((node, index) => keyToNewIndexMap(node.key, index));

  // 判断相同key值的节点，在新节点里边是否改变了索引位置
  let maxNewIndex = 0;
  let move = false;

  // 记录哪些新节点找到了相同key值的旧节点，值就是旧节点在oldChildren.slice(oldLeft, oldRight + 1)的索引号 + 1，没有找到就是0
  const newIndexToOldIndexMap = new Array(currentRight - currentLeft + 1);
  newIndexToOldIndexMap.fill(0);

  const oldSlice = oldChildren.slice(oldLeft, oldRight + 1);
  const newSlice = currentChildren.slice(currentLeft, currentRight + 1);

  oldSlice.forEach((oldNode, oldIndex) => {
    const newIndex = keyToNewIndexMap.get(oldNode.key);
    if (newIndex !== undefined) {
      newIndexToOldIndexMap[newIndex] = oldIndex + 1;
      patch(oldNode, newSlice[newIndex]);
      maxNewIndex < newIndex ? (maxNewIndex = newIndex) : (moved = true);
    } else {
      unmount(oldNode);
    }
  });

  // 计算最长递增非连续的子序列的索引
  // 假设 newIndexToOldIndexMap = [0, 2, 4, 1, 5], 意味着 newNode0和oldNode0
  // 有一样的key, newNode1和oldNode2有一样的key；
  // 找出来的子序列就是 [0, 2, 4, 5], 对应newIndexToOldIndexMap的索引号就是 [0, 1, 2, 4]
  // increasingNewIndexSequence的结果就是 [0, 1, 2, 4]；
  //
  // 这意味着索引号是[0, 1, 2, 4]的newNode.el不需要再调整顺序了
  const increasingNewIndexSequence = moved
    ? getSequence(newIndexToOldIndexMap)
    : [];
  let j = increasingNewIndexSequence.length - 1;

  // 从后往前遍历
  for (let i = currentRight; i >= currentLeft; i--) {
    const node = currentChildren[i];
    const anchor = currentChildren[i + 1].el!;
    const indexInSlice = i - currentLeft;

    // 这个新节点没有相同key值的旧节点，直接插入即可
    if (newIndexToOldIndexMap[indexInSlice] === -1) {
      mount(node, old.el!, anchor);
      continue;
    }

    // 这个新节点有相同key值的旧节点, 我们需要考虑是否调整对应HTMLElement的位置
    if (!moved) continue;

    // newNodeIndex 没有命中 increasingNewIndexSequence，
    // 需要调整位置
    if (indexInSlice !== increasingNewIndexSequence[j]) {
      // 移动到 anchor 的前边
      moveBefore(node.el, anchor);

      // 这个情况，increasingNewIndexSequence失效了，一律按照需要调整位置处理
    } else if (j < 0) {
      moveBefore(node.el, anchor);

      // 不需要调整
    } else {
      // 往左推进，找到下一个不需要调整的节点
      j--;
    }
  }
}
```

这就是 vnode diff 的基本思想，在实现的时候，采用了 vue3.5.26 的基本思路，做了很多简化，只保留骨架逻辑。

从 patch 函数的定义可以看出，patch 两个节点 n1 和 n2，就是观察 n1 和 n2 之间的特征变化，依照变化加以分类，转为具体的 HTMLElement 创建、删除、移动、更新属性值等操作。就这一点，vue 和 react 的处理方式很不一样，有机会我们单独写一篇文章介绍。

我们列举的 vnode 都是刻画 HTMLElement， 还没有涉及到刻画 Vue Component。后者会增加一些理解难度，但是，本质上还是我们上述说的这些内容，后者只是增加了更多的边界条件判断，以及将 Vue Component 通过其 render 函数转为 VNode 的环节。

不用担心，在后边介绍 Vue Component 的时候，我们再解释。

关于 VNode 的基本介绍先到这里了，可以抽空休息休息喽。
