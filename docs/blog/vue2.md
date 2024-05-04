---
title: "vue2梳理"
page: true
aside: true
---

## Description
使用vue2的过程中，总会遇到一些困惑，要查看源码才知道，但是过了一段时间又健忘了，
因此在这篇文章里记录一下。常更常新。

vue2源码使用的是 2.7.14 版本

## 项目总览

<table>
  <thead>
    <tr>
      <th>目录</th>
      <th>细分</th>
      <th>描述</th>
    </tr>
  </thead>
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
      <td>vue库的rollup入口文件，其产物是esmodule，包括vue的运行时和编译器</td>
    </tr>
    <tr>
      <td>entry-runtime.ts</td>
      <td>vue库的rollup入口文件，产物是esmodule或者commonjs，只包含vue的运行时，没有编译器</td>
    </tr>
    <tr>
      <td>entry-runtime-with-compiler.ts</td>
      <td>vue库的rollup入口文件，产物是esmodule或者commonjs, 包含vue的运行时和编译器</td>
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
          <li><code>onUnmounted</code></li>
          <li><code>onActivated</code></li>
          <li><code>onDeactivated</code></li>
          <li><code>onServerPrefetch</code></li>
          <li><code>onRenderTracked</code></li>
          <li><code>onRenderTriggered</code></li>
          <li><code>onErrorCaptured</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>h.ts</td>
      <td>定义了vue虚拟节点生成函数，类似于 <code>react.createElement</code></td>
    </tr>
    <tr>
      <td rowspan="5">src/core</td>
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
    <tr>
      <td>global-api</td>
      <td>
        实现了：
        <ul>
          <li><code>Vue.use</code> </li>
          <li><code>Vue.mixin</code></li>
          <li><code>Vue.use</code></li>
          <li><code>Vue.set</code></li>
          <li><code>Vue.delete</code></li>
          <li><code>Vue.nextTick</code></li>
          <li><code>Vue.observable</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>util</td>
      <td>定义了vue库内部使用的工具函数，并不作为API供给外部使用。其中很重要的是 util/next-tick.ts 文件，
      它直接定义了Vue.nextTick的实现方式
      </td>
    </tr>
    <tr>
      <td>packages/server-render</td>
      <td></td>
      <td>服务器渲染的实现</td>
    </tr>
  </tbody>
</table>


## new Vue() 到底发生了什么？
`Vue`定义的位置：`src/core/instance/index.ts` 

这个方法调用了`this._init(options)`

而`_init`方法定义在 `src/core/instance/init.ts`

最主要的逻辑是：
```js 
Vue.prototype._init = function (options) {
  const vm = this;

  // 初始化一堆实例属性值，
  // 比如:
  // vm.$parent
  // vm.$children
  // vm.$refs
  // vm._provided
  // vm._watcher 
  // vm._inactive
  // vm._isMounted
  // vm._isDestroyed
  // vm._isBeingDestroyed
  initLifecycle(vm);

  // 调用 vm.$on 注册事件，
  // 注册的事件和回调函数都会被挂载到 vm._events
  // vm._events[eventName] = [listener1, listener2, ..., listenerN]
  initEvents(vm);

  // 初始化一些和vnode相关的变量；
  // 比如：
  // vm.$slots
  // vm.$scopedSlots
  // vm._c 
  // vm.$createElement
  // vm.$attrs [响应式的]
  // vm.$listeners [响应式的]
  initRender(vm);

  // 执行 beforeCreate hook 
  // 在此hook中，你是访问不到响应式变量的哦
  callHook(vm, 'beforeCreate', undefined, false);

  // 将 vm.$options.inject 定义的众多变量注入为 vm 的直接属性，
  // 这些属性都是响应式的
  //
  // 一个 injectName 会对应 provideName，尽管 vm[injectName]是响应式的,
  // 但是当 vm._provided[provideName]变化时，vm[injectName]不一定会变化，
  // vm[injectName]更新后，vm._provided[provideName]不会变化
  initInjections(vm);

  // 细分为几部分：
  // 1. initProps
  // 1-1. initSetup
  // 2. initMethods
  // 3. initData
  // 4. initComputed
  // 5. initWatch
  //
  // 1. initProps
  //  vm.$options.propsData 响应式化，挂载到 vm._props,
  //  为了可以用vm直接访问prop，利用 Object.defineProperty,
  //  将 vm[propName] 的读写代理为 vm._props[propName]的读写;
  //
  // 1-1. initSetup 
  //  支持 composition API 后加入的此方法；
  //  根据 vm.$options.setup 计算值，如果结果是函数，就会作为 vm.$options.render;
  //  如果是一个对象，就会赋值到 vm._setupState 上，为了让vm直接访问到这些属性，使用
  //  Object.defineProperty 将 vm[setupStateName] 代理为 vm._setupState[setupStateName]
  // 
  // 2. initMethods
  //  将 vm.$options.methods 定义的方法，直接挂载到 vm 上 
  //  vm[methodName] = methods[methodName].bind(vm)
  //  在这个过程中，在研发环境中，会检查 mehodName 是否和 propName 重复了，
  //  重复的话，会打印一些提示信息，但 methodName 会覆盖掉 propName 
  //
  // 3. initData
  //  将 vm.$options.data 定义的数据响应式化，然后挂载到 vm._data 上，
  //  为了 vm 可以直接访问 dataName，利用 Object.defineProperty 将 
  //  vm[dataName] 代理为 vm._data[dataName]
  //
  // 4. initComputed
  //  为 vm.$options.computed 的每一个属性定义一个 watcher，这些watcher存储到
  //  vm._computedWatchers，注意哈，watcher.lazy = true, 这意味着 new Watcher 
  //  的时候不会调用 vm.$options.computed[computeName]()；
  //
  //  为了让 vm 可以直接访问 computeName, 利用 Object.defineProperty, 将 vm[computeName] 
  //  代理为 vm._computedWatchers[computeName].value;
  //
  //  如果 computeName 和 propName、dataName、methodName 重复了，computedName不会覆盖它们，
  //  反之，不会做 vm[computeName]的代理工作
  //
  // 4. initWatch
  //  vm.$watch定义的位置： src/core/instance/state.ts
  // 
  //  为 vm.$options.watch 定义的每一个属性，使用 vm.$watch 处理它，这会给它绑定上一个 watcher， 
  //  注意， watcher.lazy = false, 这意味着在 new Watcher 的时候，会执行 watcher.get()，立即
  //  访问 vm[watchName]，将 watcher 收集为 vm[watchName]的依赖（要是watchName只是methodName就
  //  糟糕了，因为 methodName 不具备响应式）；
  //
  //  如果 vm.$options.watch[watchName].immediate = true, 那么会立即执行
  //  vm.$options.watch[watchName].handler(watcher.value);
  //
  //  还有一点要注意的是， watchName 必须在 vm 上已经存在，因此，watchName可以是 propName 或者 dataName 或者 
  //  computeName
  initState(vm);

  // 根据 vm.$options.provide 计算出要提供给后代Vue实例的属性、值，然后
  // 将这些属性、值注册到 vm._provided 上；
  //
  // 注意，vm._provided 最开始是和 parentVm._provided 一样的，当 vm 要
  // 提供自己的一些属性、值时，vm._provided 才会变成一个新的Object，但是
  // vm._provided.__proto__ === parentVm._provided，这种做法类似于
  // copy on write 的做法；
  //
  // vm.$options.provide 计算出要提供给后代Vue实例的属性、值，并没有对这些
  // 属性、值做响应式处理，就会遇到这样的问题：
  // 
  // data: function() {
  //  return { count: 1 };
  // }
  // provide: function() {
  //  return {
  //     parentCount: this.count;
  //  }
  // }
  //
  // count 发生变化后，parentCount 不会发生变化！后代组件 inject “parentCount” 后，
  // vm.parentCount 不会感知到组件的 count 属性变化！
  // 
  // 你应该这样：
  // provide: function() {
  //  const vm = this;
  //  return {
  //     parentCount: {
  //         get() {
  //            return vm.count;
  //         }
  //     }
  //  }
  // }
  initProvide(vm);

  // 执行 created hook 
  callHook(vm, 'created');

  if (vm.$options.el) {
    // beforeMount hook 
    // mounted hook
    // 都在 $mount 里执行
    vm.$mount(vm.$options.el);
  }
}
```

`vm.$mount`发生的事情，比较复杂，需要单独一个章节去介绍，大体上它做的事情是：
- 建立一个 Watcher，检测 vm 的响应式变量发生变化，然后触发组件更新
- 生成组件的vnode( vm._render() )
- 根据新、旧vnode，更新DOM节点( vm.\__patch__() )

## 响应式系统中的概念
### Dep 和 DepTarget
定义的位置：`src/core/observer/dep.ts`

**Dep** 表示的是<u>**依赖收集器**</u>，而不是依赖;

**DepTarget** 才表示<u>依赖</u>；


```js 
let count = 1;

function hello() {
  console.log('hello');
}

function world() {
  console.log('world');
}
```

`count`表示响应式变量，我们希望`count`发生变化的时候，可以自动执行`hello`和`world`;

`hello`和`world`就是依赖, DepTarget；

`count`需要有个东西，帮它管理这些依赖，这个东西就是 Dep;

作为 DepTarget, `hello` 和 `world` 太过简单了，我们不如想想，DepTarget 需要
具备什么样的特点？

第一，像`hello`和`world`那样，DepTarget 必须是可以执行的；

第二，DepTarget 要能够被 Dep 管理；

针对第一点，DepTarget 拥有`update`方法：
```ts 
interface DepTarget {
  update(): void;
}
```
`count`一旦更新，就执行`DepTarget.update()`；


针对第二点，DepTarget 拥有`addDep`方法：
```ts 
interface DepTarget {
  addDep(dep: Dep): void
}
```

你一定奇怪，Dep 定义一个方法收集 DepTarget 就可以了，为什么 DepTarget 还要定义`addDep` ？

原因一：DepTarget并不只属于一个Dep，DepTarget 要知道哪些 Dep 管理它。Dep可以通过遍历，
删除某个DepTarget，如果 DepTarget 被好多Dep管理，你想删除 DepTarget 的话，对于所有的
Dep，你都要遍历一次。如果 DepTarget 知道哪些 Dep 在管理它，就不需要把所有的Dep遍历一遍。

原因二：依赖倒转。
```ts 
class A {
  collections = [];

  collect(b: B) {
    this.collections.push(b);
  }

  constructor() {};
}

class B {
  value = 10;

  constructor() {};
}


const a = new A();
const b = new B();
a.collect(b);
```
a 收集 b, 非常简单是吧。

如果 a 只想收集 value > 100 的 b,  怎么办呢 ？

```ts 
class A {
  collections = [];

  collect(b: B) {
    if (b.value > 100)
      this.collections.push(b);
  }

  constructor() {};
}

class B {
  value = 10;
  constructor() {};
}

const a = new A();
const b = new B();
a.collect(b);
```
这种写法可以满足条件，但是缺点非常明显：

1. 访问了 b.value, 破坏了 B 的数据封装；
2. 随着对B收集的苛刻程度加深，A的collect方法越来越臃肿；

A如果不仅仅想收集B，还想收集C，收集D，你肯定会想到将 C 和 D 的共性
抽象为一个interface，这样A的collect方法不再依赖具体的类，而是抽象 
的interface，这种依赖反转的方式很容易想到，但是这种处理依旧无法解决
上面的两个问题！

我们应该问，为什么会出现上面的问题呢？

因为A的collect方法，关心收集B的条件了！

解决的方法就是collect不关心要不要收集B，它只需要关心一件事，把 B 放进
collections。

那么谁来关心收集的条件呢？自然是B、C、D 喽！

但是呢，B、C、D光能判断出条件还不行，它们必须知道怎么把自己放进A的collections，
因此 A 的 collect 方法必须是 public 方法；

同时呢，B、C、D也要提供一个共同的方法，完成上边的事情，所以就会有下面的版本：
```ts 
class A {
  collections = [];

  push(item: Item) {
    this.collections.push(item);
  }
  
  collect(item: Item) {
    item.addToA(this);
  }
}

interface Item {
  addToA(a: A): void;
}

class B implements Item {
  value = 10;

  addToA(a: A) {
    if (this.value > 100) {
      a.push(this);
    }
  }
}

class C implements Item {
  value = 100;

  addToA(a: A) {
    if (this.value < 50) {
      a.push(this);
    }
  }
}
```

回过头来，我们想想一切的导火索是什么？

没错，破坏了A的单一职责，破坏了A的稳定性。

这种设计技巧的出发点非常简单，区分出哪个数据是最稳定的，将修改都甩给不稳定的数据去实现。

我们不用将依赖倒转当作奇技淫巧，因为只要遵从上述逻辑实现代码，自然而然就会出现倒转的现象。

到此为止，可以理清响应式变量、Dep、DepTarget 的关系了：
- 每个响应式变量都拥有一个 Dep;
- 每个Dep都管理若干个DepTarget;
- 响应式变量一经改变，就依次取出Dep里的DepTarget, 执行 DepTarget.update()


### Watcher 
#### 1. 基本情况
定义的位置：`src/core/observer/watcher.ts`

Watcher 就是 `DepTarget` 的一种具体实现。

在 vue 的响应式体系中，它非常重要，组件的 `computed` 和 `watch` 都是基于 Watcher 实现。

上一节中，忘记说 Dep 是如何收集 DepTarget 的了，现在就用 Watcher 做个介绍。

```ts 
class Watcher implements DepTarget {
  constructor() {
    this.value = this.lazy ? undefined : this.get();
  }

  get() {
    pushTarget(this);
    value = this.getter();
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
    return value;
  }

  addDep(dep: Dep) {
    dep.addSub(this);
  }

  update() {
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  run() {
    if (this.active) {
      const value = this.get();
      const oldValue = this.value;
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }
}
```

收集依赖这个行为，是 Dep 定义的，即 Dep.depend 方法；

激活依赖的update，也是 Dep 定义的，即 Dep.notify 方法；

而上述两种行为的触发，是响应式变量做的。

在访问响应式变量的值时，触发 Dep.depend 方法；

在修改响应式变量的值时，触发 Dep.notify 方法；

如果 Dep 想把 Watcher 收集起来，在读取响应式变量的时候，必须知道 Watcher：
```ts 
const dep = createDep();
Object.defineProperty(obj, 'count', {
  get: function() {
    dep.depend(watcher);
  }
});
```
很遗憾，响应式变量在定义的时候，根本不知道什么Watcher，它就没办法让 dep.depend 去收集，
更何况，Watcher是变化的：
```ts 
export default {
  data: {
    name: '',
    age: 10,
    count: 0,
  },
  watch: {
    name() {
      this.count;
    },
    age() {
      this.count;
    }
  }
}

// 响应式变量 count 在定义的时候，没办法提前知道 name 和 age 这两个 watcher，
// 因为有两个watcher, 在 count 的视角看，watcher 是个变量，是动态变化的
```

怎么解决这个事儿呢？

既然 watcher 是变化的，那就用一个变量存储 watcher 呗。

所有的响应式变量在定义的时候，都有收集watcher的需求，那么这个存储 watcher 的变量不能是局部变量。

vue选择了 Dep.target 这个 static variable 来存储 watcher。

```ts 
const dep = createDep();
Object.defineProperty(obj, 'count', {
  get: function() {
    // 因为用 Dep.target 存储了，就不需要通过参数告知
    // dep.depend 了，dep.depend 内部直接从 Dep.target 
    // 拿就可以了
    if (Dep.target)
      dep.depend();
  }
});
```

接下来，你一定会问，在什么时候赋值 Dep.target 呢？

答案就在 Watcher 里：
```ts 
class Watcher implements DepTarget {
  get() {
    pushTarget(this);
    value = this.getter();
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
    return value;
  }
}
```

在执行 `pushTarget(this)` 的时候，Dep.target 就被设置为 Watcher 了；

而在  `this.getter()` 中，访问了响应式变量，那么这些响应式变量自然就可以把Watcher收集起来；

没错，这里有一个固定的规矩：**响应式变量的读取操作，必须在 DepTarget 中完成**！

为什么会有 `this.cleanupDeps()` ？

```ts 
export default {
  data: {
    age: 11,
    value: 9,
    count: 0,
  },
  watch: {
    age(value) {
      if (value > 10) {
        this.value;
      } else {
        this.count;
      }
    }
  }
}
```

`this.value`的读取操作，是依赖动态变化的 `this.age`，这也意味着，在某一次，watcher被加入到 `this.value`的 Dep 中，
在另外一次执行的时候，watcher被加入到 `this.count`的Dep中。因此，watcher每次执行`this.getter()`更新后，它所归属的
Dep都要更新一下。`this.cleanupDeps`就是删除旧的Dep，改为新的Dep.

#### 2. 谁来删除watcher 
在 vue 中，创建好的 Watcher，大多数情况下，都不会绑定到 Vue 实例上；

唯一的例外是 `vm.$mount`，在该方法里，创建的 Watcher 实例会被绑定到 `vm._watcher` 上，
因为这个 watcher 非常特别，是 `render watcher`, 它的`this.getter`方法用于vnode渲染和DOM节点更新；

你一定会问了，这些 watcher 会不会造成内存泄露呢？

答案是不会的。这些 watcher 虽然没有挂载到vm上，但是它们挂载到 Dep 上。当响应式变量不再需要，
被垃圾回收，那么Dep也会被释放掉，进而Dep中的watcher的引用计数就会减少，达到0的时候，watcher 
也就被释放掉了。

#### 3. $watch 

#### 4. 渲染

#### 5. watchEffect 

### Observer 
定义位置：`src/core/observer/index.ts`

有了响应式变量，Dep，DepTarget，感觉响应式系统已经完备了，为什么还有个 Observer ?

```ts 
const reactiveObj = {
  count: 10,
  score: {
    math: 50,
    physics: 60,
  }
}

// 对于响应式变量 reactiveObj 来说，
//  reactiveObj.count ->  Dep 
//  reactiveObj.score.math -> Dep 
//  reactiveObj.score.physics -> Dep 

const effect1 = () => {
  // 引发 Dep.notify
  reactiveObj.count += 1;
}

const effect2 = () => {
  // 引发 Dep.notify
  reactiveObj.score.math += 10;
}

const effect3 = () => {
  // 尴尬了，没办法引发 Dep.notify,
  // 因为 score 没有绑定 Dep
  reactiveObj.score = {
    math: 17
  };
};
```

为了解决 `effect3`的问题，就出现了 `Observer`；

```ts 
const plainObj = {
  count: 1,
  score: {
    math: 100
  }
}

const observer = new Observer(plainObj);

// plainObj.__ob__ === observer 
// observer.value === plainObj
//
// plainObj.score.__ob__ === observer2
// observer2.value === plainObj.score
//
// 当 plainObj.score = {} 发生时，
// plainObj.score.__ob__.dep 里的 DepTarget 就会执行
```

### EffectScope
定义位置：`src/v3/reactivity/effectScope.ts`

`EffectScope` 是一个作用域概念，它管理着组件内所有的 `Watcher`；

Watcher 位于 Dep 中，而 Dep 是在定义响应式变量的时候，利用闭包技术创建的，
只有`observe`将一个对象obj整体做响应式处理后，才能利用`obj.__ob__.dep`找到
一个Dep，但是对于obj内部的属性，它们的 Dep 没办法找到，它们是闭包变量。

而当组件unmount的时候，所有响应式变量对应的Watcher都应该失效，所以必须想一个方法，
统一管理这些Watcher。于是 `EffectScope` 就出现了。

所有的Watcher除了加入到Dep中，还要加入到vm._scope中。

vm._scope.stop() 一执行，每个Watcher就会从Dep中删除；

> `EffectScope` 在 vue2 中是个过渡概念，在 vue3 中，它管理的是 `Effect`，
> 而 vue2 的 `DepTarget`，`Watcher` 概念都被替换为 `Effect` 概念。

## 如何将一个对象响应式化
### observe 
定义位置：`src/core/observer/index.ts`

vue2中最主要的方式。

`observe(obj)` 将一个对象上的所有属性响应式化；

vue2中开发的composition API——`reactive`也是基于 `observe`实现的；

### defineReactive
定义位置：`src/core/observer/index.ts`

将`obj`的一个指定属性响应式化，`observe`是将所有属性响应式化；

`observe`基于`defineReactive`实现；

vue2中开发的composition API——`ref`也是基于`defineReactive`实现的；

注意一点，`defineReactive`返回的是 Dep 

```ts 

const plainObj = {
  count: 10,
}

const dep = defineReactive(plainObj, 'count');

// plainObj.count -> dep
```

### set
定义位置：`src/core/observer/index.ts`

见[Vue.prototype.$set 为什么会存在，又实现了什么功能？](#vueprototypeset-为什么会存在又实现了什么功能)

## Vue.prototype.$set 为什么会存在，又实现了什么功能？
定义的位置：`src/core/observer/index.ts`

```ts 
const obj = {
  name: 'jack',
  count: 10
};

const reactiveObj = reactive(obj);
```

响应式变量`reactiveObj`定义的时候，只是利用`Object.defineProperty`给出了`name` 和 `count`的响应式处理，
但是，`Object`找不到一个API，可以监测到`reactiveObj.age`访问新属性`age`的行为，所以访问一个新属性，不能自动
定义这个属性，并将其响应式处理。

为了解决这个问题，就出现了 `Vue.prototype.$set` 方法。

## unref的原理 
定义位置：`src/v3/reactivity/ref.ts`

```ts 
function unref(ref) {
  return isRef(ref) ? (ref.value as any) : ref
}
```

将 `ref.value` 直接返回，就是 unref 了 ？ What ！

解释这个问题，要看一下ref是怎么定义的：
```ts 
function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  const ref: any = {}
  def(ref, RefFlag, true)
  def(ref, ReactiveFlags.IS_SHALLOW, shallow)
  def(
    ref,
    'dep',
    defineReactive(ref, 'value', rawValue, null, shallow, isServerRendering())
  )
  return ref
}

// 从  defineReactive(ref, 'value', rawValue, null, shallow, isServerRendering())
// 可以知道，ref.value 是一个响应式变量，它的初始值是 rawValue;
```

下面会发生什么呢？

```ts 
const value = ref.value;
```

很简单，执行 ref.value 的 getter 方法，执行结果交给 value.

value 会不会失去响应式，要看 getter 方法返回的结果是否经过响应式化。

如果是`ref()`，采用的是深层次响应式化，那么上边的 value 就没有失去响应式化，你可以用`value.[propertyName]`
触发响应式变化；

如果是`shallowRef()`，采用的是浅层次响应式化，那就失去响应式了；

## composition API 
待补充

## 响应式变量更新后，怎么就自动重新渲染了？
一步一步来，先从`响应式变量`和它的`依赖函数`出发

```js 
// 假设 data 已经是一个响应式变量，
// 当 hello 执行的时候，读取了 data,
// hello 就是 data 的依赖函数，data就
// 会把 hello 收集到自己的依赖列表中，
// 当 data 更新后，就会重新执行 hello 函数
function hello() {
  const m = data;
}
```

把响应式变量和渲染连接在一起的函数是什么呢？

没错，就是 Vue 实例的render方法；

如果把上边的代码片段换成：
```js 
function render() {
  const m = data;
}
```

这样，当Vue实例的响应式变量更新，就会重新执行 render 方法，得到新的虚拟节点，但是这仅仅是
虚拟节点的更新，并没有触及到DOM节点。

幸运的是，Vue实例有个_update方法，它会根据一个新的虚拟节点，更新DOM节点。

那么我们可以继续改造：
```js 
function render() {
  const m = data;
}

_update(render());
```

但是这会有两个问题：
1. _update函数什么时候执行的？
2. 响应式变量把render加入到自身的依赖函数列表中没有用，这只会引发虚拟节点更新，不会让DOM节点更新，响应式变量要
   把 _update 加入到依赖函数列表中，该如何办到呢？

答案就是 Vue 实例的 $mount 方法 
```js 
function $mount() {

  const updateComponent = () => {
    _update(render());
  }

  new Watcher(updateComponent)
}


class Watcher {
  constructor(updateComponent) {
    this.getter = updateComponent;
    this.get();
  }

  get() {
    pushTarget(this);
    this.getter();
    popTarget();
  }

  run() {
    this.get();
  }

  update() {
    this.run();
  }
}

// $mount 一旦执行，就会把 updateComponent 注册到 Watcher 中，
// 而 Watcher 在初始化的时候，执行 get 方法；
//
// get 方法会利用 pushTarget 将 Dep.target 设置为 watcher 自己，
// 后续如果响应式变量被读取，它就会把 watcher 加入到自身的依赖函数列表中
//
// pushTarget执行完了，就执行getter方法，巧了，这个方法刚好就是 updateComponent, 
// updateComponent 会执行 render 方法，巧了，render方法内部刚好就有响应式变量，就
// 会将 watcher 加入到自身的依赖函数列表中；
//
// 等下，不应该把 _update 加入到依赖函数列表中嘛，要不然就是 updateComponent,
// 为什么加入的是 watcher ？
//
// 别急，依赖函数列表是我们简化的一个概念，落实到vue2中，列表记录的不是函数，而是
// DepTarget，这是一个interface, 定义了 update 方法；也就是说，响应式变量更新
// 后，会从依赖列表中依次取出DepTarget, 然后执行DepTarget.update 
//
// 我们刚才加入的 watcher 也定义了 update 方法，update 执行了，就会执行 watcher.run,
// watch.run就会执行watcher.get, 那么 watcher.get会执行什么呢？不就是 watcher.getter 
// 喽，watcher.getter 是什么呢？ updateComponent!
//
// 现在串起来了吧
```
**组件更新的本质**: `vm._watcher.update()`

\$mount方法定义位置：src/platforms/web/runtime/index.ts

额外提一句，别被`.vue`文件迷惑了，vue编译器最重要的工作就是将 `<template>` 编译为
Vue实例的`render`方法。像 `data` `computed` 什么的，不需要编译器做什么，都是你
在书写`.vue`文件定义好的。但是 `render`方法就不是这样了吧，绝大多数情况下，你都不会
自己给出 `render`方法的定义，而是专心写 `<template>`

在这种机制下，响应式变量和`updateComponent`是绑定的，响应式变量一更新，`updateComponent`
函数就会执行（可能是立即执行，也可能是异步执行，这个取决于 Watcher 的 sync 属性）。也正是
因为这点，Vue不需要扫描整个虚拟节点树就能知道到底是哪个组件更新了。

## `updateComponent`的立即执行和异步执行
接着上节所说的，`updateComponent`分为立即执行和异步执行。

这不是因为该函数内部有同步和异步的区分，而是 Watcher 有。

Watcher.update方法内部调用了 `updateComponent`, 而 Watcher.update 内部会根据
Watcher.sync 的值，做同步和异步执行的处理。

同步执行就是直接执行`updateComponent`;

异步执行是说将Watcher加入到队列中，然后使用nextTick，执行函数 flushQueue，到达异步执行 Watcher.run的效果:
```js 
const queue = []
// 是否安排task or microtask 执行 flushQueue
let waiting = false;

function pushQueue(watcher) {
  queue.push(watcher);

  if (waiting === false) {
    waiting = true;
    nextTick(flushQueue);
  }
}

function flushQueue() {
  for (const watcher of queue) {
    watcher.run();
  }
}
```

在$mount方法中的Watcher, 其sync是undefined,因此组件更新时调用`updateComponent`是异步执行的

## _update 是同步的，还是异步的？
_update方法定位位置：src/core/instance/lifecycle.ts

上一节，解释了`updateComponent`同步执行、异步执行的问题。

我们知道，`updateComponent`函数内部，执行了 Vue 实例的 `_update` 方法和 `render` 方法；

`render` 用于创建一个新的虚拟节点， `_update` 用于更新DOM节点。

显然，`render`是一个同步的过程，那么 `_update` 是同步的过程么？

React中的更新是这样的：
```txt 

更新fiber1 -> 更新fiber2 -> ... -> 整个fiber树更新完毕 -> 更新fiber树对应的DOM节点树

```

Vue的更新像是这样的：
```txt 
更新虚拟节点1 -> 更新虚拟节点1对应的DOM节点 -> 更新虚拟节点2 -> 更新虚拟节点2对应的DOM节点 -> ...
```

如果 `_update` 是同步的，更新DOM节点就是分散更新；

如果`_update` 是异步的，更新DOM节点就可以转化为React那种集中式的更新；

实际上，`_update`调用了`__patch__`函数，这个函数是同步的，因此`_update`也是同步的。
而且观察`__patch__`函数发现，它是从某个虚拟节点出发，往子节点的方向延伸，更新经过的节点所对应的DOM节点，
不存在更新虚拟节点的情况，因此Vue的更新应该是这样的：
```txt
更新虚拟节点树    ->   沿着虚拟节点树依次更新DOM节点
render()             __patch__()
```

## vue的虚拟节点如何映射到DOM节点
待补充

## onMounted函数和mounted函数怎么做到兼容的？
待补充

## 为什么要有 Vue.nextTick, nextTick又是如何实现的？
### 1. 为什么要有 Vue.nextTick
[updateComponent的立即执行和异步执行](#updatecomponent的立即执行和异步执行)

[_update是同步的, 还是异步的](#_update-是同步的还是异步的)
  
两个小节告诉我们，组件更新DOM节点是利用nextTick去异步执行的。

如果我们想在DOM更新（严格讲，是DOM树更新，不是网页更新，DOM树更新之后还要经过Paint过程，网页才会更新）之后做一些事情，只需要
将我们的操作放在组件更新DOM节点之后去执行，而上边的结论告诉我们，组件更新DOM节点会放在nextTick的队列中，因此，要想达成这种目的，
我们的操作也应能放在nextTick的队列中。所以，我们需要Vue.nextTick，将内部nextTick函数开放给组件开发者。


### 2. nextTick 的实现 
源文件：src/core/util/next-tick.ts

调用 nextTick，就是将一个function塞入到队列中，然后安排一个task或者microtask执行队列中的所有function。

把function塞入到队列中很好实现：
```js 
const callbacks = [];

export function nextTick(cb) {
  callbacks.push(() => {
    try {
      cb();
    } catch(err) {
      handleError(err)
    }
  })

  // 下面是生成一个task或者microtask, 执行队列中所有的函数
  // ...
}
```

实现起来要注意的是：
- 为了安全，要对 cb() 做 try..catch 处理
- 从vue2的设计上看，允许cb是undefined，这个情形要特别处理，但我们只是理解大体思路，为了保持简单，不考虑这个情况

<br />

接下来要考虑的是：
- 使用什么API可以创建task或者microtask
- 如何适度地创建task or microtask 

第一点，有这些API可以使用：
- Promise.resolve().then(cb) `microtask`
- new MutationObserver(cb) `microtask`
- setImmediate(cb) `task`
- setTimeout(cb, 0) `task`
> 对于microtask，可以看[MDN的这篇文章](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)

到底怎么选择呢？
1. 看平台支持哪个API
2. 在平台支持的范围下，microtask 优先于 task 
3. Promise 优先于 MutationObserver 
4. setImmediate 优先于 setTimeout

microtask 为什么优先于 task ?
vue暴露了不少issue，是因为采用 task 造成的；

Promise 为什么优先于 MutationObserver ?
1. MutationObserver有更广泛的平台支持，但是在 UIWebView in iOS >= 9.3.3 中，MutationObserver 的回调函数有不会被调用的情况；
2. 创建一个microtask，Promise 更简单，MutationObserver 必须观测到有节点变化，才会创建 microtask；
   ```js
   // Promise 创建一个 microtask 
   Promise.resolve().then(cb);

   // MutationObserver 创建一个 microtask
   const observer = new MutationObserver(cb);
   const textNode = document.createTextNode('');
   let count = 1;
   observer.observe(textNode, { characterData: true });
   // 调用 invokeMicrotask 函数，会改变 textNode，
   // 触发 observer 创建一个microtask执行cb
   const invokeMicrotask = () => {
    count = (count + 1) % 2;
    textNode.data = count.toString();
   }
   ```

setImmediate 为什么优先于 setTimeout ?

详细原因请阅读[MDN的这篇文章](https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate)

概括来讲：
1. 它们都会创建task, 但是task的执行时刻不同，setImmediate更及时，比setTimeout更早；
2. setTimeout拥有4ms的限制，当setTimeout内部嵌入setTimeout,达到5层时，尽管最外层是 setTimeout(cb, 0)，
   但默认至少是 4ms，不是0ms；

但是，setImmediate已经是 `Deprecated` 状态，不建议再使用，但我们依旧有替代方法：
1. `postMessage`
2. `MessageChannel`

React的schedule实现就采用`MessageChannel`✨

无论是 task 还是 microtask，它执行的内容都是一样的，即执行队列中的函数，vue2将其封装为 flushCallbacks 函数

第二点，如何适度地创建task or microtask，总不能执行一次 nextTick，就创建一个task or microtask 吧？

考虑一个情形，我们连续调用两次 nextTick, 我们只需要把function放入队列中，然后创建一个task or microtask 即可，
怎么做到这一点呢？答案就是引入一个变量`pending`。

`pending`的意思是说，如果队列中有待执行的函数，`pending`就是true，否则就是false;

在第一次调用nextTick的时候，我们将`pending`设置为true, 第二次调用 nextTick 的时候发现`pending`是true，
将function加入到队列中即可，不需要唤醒一个task or microtask。

综上：
```js 
const callbacks = [];
let pending = false;

function flushCallbacks() {
  const copy = callbacks.slice(0);
  callbacks.length = 0;
  pending = false;
  for (const cb of copy) {
    cb();
  }
}

export function nextTick(cb) {
  callbacks.push(() => {
    try {
      cb();
    } catch(err) {
      handleError(err)
    }
  })

  if (pending === false) {
    pending = true;
    invokeTaskOrMicrotask(flushCallbacks);
  }
}
```
