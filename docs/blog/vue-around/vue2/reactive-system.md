---
title: "响应式系统"
page: true 
aside: true
---

# 响应式系统 
这个算是vue框架的核心精髓所在。什么是响应式系统？就是编程者可以自定义变量发生前、后的行为，然后变量真地改变时，自动执行这种行为。

在javascript语法层面，并没有原生支持，因此vue框架层面要编写一个系统，实现它。而swift语言在语法层面就支持了这个特性。

## vue2实现的依据
vue2在实现的时候，利用了javascript的`Object.defineProperty` api。这个api的特别之处，允许用户为object定义一个属性，并且控制这个属性的读取和写入行为，也就是说，你可以规定在读取属性值的时候，做一些别的事情，写入的时候同理。

变量发生变化的时候，到底要做什么呢？回到框架最核心的内容，就是当变量发生改变的时候，可以自动执行组件渲染——`vm._update(vm._render())`。但从响应式系统设计上，应该更加宽泛一些——也就是当变量发生改变的时候，可以自动执行一个函数。

当变量发生变化的时候，我们必须知道有哪些函数与这个变量有关系，然后依次执行这些函数。普通函数似乎还不足以满足我们的需要，因为每次执行的时候，还要考虑到函数入参是多少的问题。

不过vue2做了很好的抽象。它使用`Dep`去管理变量要执行哪些函数。使用`DepTarget`定义扩展的函数，函数的入参就是`DepTarget`的属性值，你可以用一个object实现闭包函数。这样逻辑就清晰了——变量发生变化的时候，找到它的`Dep`, `Dep`取出`DepTarget`，`DepTarget`执行。

```ts 
interface DepTarget {
  id: number
  addDep(dep: Dep): void
  update(): void
}

class Dep {
   static target?: DepTarget | null
   subs: Array<DepTarget | null>

   // 加入DepTarget
   addSub(sub: DepTarget);
   removeSub(sub: DepTarget);
   // 加入DepTarget，该方法由 DepTarget 调用
   depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
   }
   // 取出DepTarget并执行
   notify() {
    sort(this.subs)
    this.subs.forEach(sub => sub.update())
   }
}
```

## defineReactive
将一个object转化为响应式object的实现。

源码： `src/core/observer/index.ts#defineReactive`

简化代码：
```ts 
function defineReactive(obj, key, val, shallow: boolean) {
  // 这样就意味着，obj 上的每个key，会对应一个独立的 dep，而不是所有属性共享一个dep
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  
  // obj中属性key原本的set方法和get方法，如果obj没有属性key，
  // 这俩就是undefined。
  const setter = property?.set;
  const getter = property?.get;

  // val也可能是一个object，也要考虑把它也响应式处理，
  // shallow = true，表示只对 obj 的 key属性响应式化，
  // 不对 key 属性对应的值响应式化，这种情形下，obj[key] = { age: 10} 可以触发响应式变化，但 obj[key]["age"] = 10不行。
  // shallow = false，就要对 val 也做响应式处理了，observe后边会
  // 解释。
  let childObj = !shallow && observe(val, shallow)

  // 核心
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      if (Dep.target) {
        // Dep.target 会存储 dep，dep也会存储 Dep.target
        dep.depend();
      }
      const value = getter ? getter.call(obj) : val;

      // 上面只是在 obj访问key属性的时候，把 Dep.target 给收集了，
      // 如果 obj[key] 自身也是一个响应式对象，也应该收集一次
      if (childObj) {
        childOb.dep.depend()
        // value 如果是数组，数组内的每个元素也该收集
        if (isArray(value)) {
          dependArray(value)
        }
      }

      // isRef是为了兼容 ref 的 api，这个api我们后边再介绍
      return isRef(value) && !shallow ? value.value : value
    },
    set: function(newVal) {
      const value = getter ? getter.call(obj) : val 

      // 很聪明做了一次变更检测，没有变动就不需要再执行，
      // 后边要执行的逻辑是从dep中取出DepTarget执行，
      // 开销很大的
      if (notChange(value, newVal)) {
        return
      }

      if (setter) {
        setter.call(obj, newVal)
      }
      // setter没有定义，但是getter定义了，说明变量
      // 是只读变量，也不需要往下执行
      else if (getter) {
        return
      }
      // 兼容 ref 的情形
      else if (!shallow && isRef(value) && !isRef(newVal)) {
        value.value = newVal 
        return
      }
      // 写入，注意这个值没有保存在obj上，而是保存在闭包变量 val
      else {
        val = newVal
      }

      // obj[key]的值原本也是响应式，那么 obj[key] = { age: 10 }
      // 重新赋值的话，理应重新创建一次响应式
      childObj = !shallow && observe(newVal, shallow)

      // dep取出DepTarget执行
      // childObj 不需要这样做，因为它是刚刚创建的，它的dep也是
      // 新的，没有存储任何DepTarget
      dep.notify()
    }
  })

  return dep
}
```

`defineReactive`是响应式化obj上的一个属性，而`observe`响应式化的是整个obj，实际上完全可以递归调用`defineReactive`实现，不过为了更好地复用代码，给抽离出来了。

## observe 
源码： `src/core/observer/index.ts#observe`
```ts 
class Observer {}

function observe(obj, shallow: boolean) {
  // obj.__ob__ 存在，说明 obj 已经被响应式处理过了
  if (obj && hasOwn(obj, "__ob__") && obj.__ob__ instanceof Observer) {
    return obj.__ob__
  }

  return new Observer(obj, shallow)
}
```
源码：`src/core/observer/index.ts,line48`

```ts 
class Observer {
  constructor(obj, shallow: boolean) {
    // 与 defineReactive一样，先准备一个 Dep
    this.dep = new Dep();

    // 定义 __ob__, 防止 obj 重复响应式化
    def(obj, "__ob__", this);

    if (isArray(obj)) {
      // obj 是数组的话，重新定义 shift unshift splice
      // push pop 方法，使得可以触发响应式更新obj.__ob__.dep.notify()
      rewriteArrayMethods(obj)

      // shallow = false，表示要对数组的每一个元素做响应式处理
      if (!shallow) {
        this.observeArray(obj)
      }
    }
    // 如果是普通的object，要对object的每一个属性做响应式处理
    else {
      for (const key in obj) {
        defineReactive(obj, key, {}, shallow)
      }
    }
  }

  observeArray(arrayObj) {
    const shallow = false
    for (const item of arrayObj) {
      observe(item, shallow)
    }
  }
}
```

## 组件的 prop, data 如何被响应式处理
prop值会被 `defineReactive` 处理，使得每个属性都是响应式的，然后通过 `Object.defineProperty`的代理方式，让vm可以直接访问这些属性；

data值会被`observe`处理，使得每个属性都是响应式的，然后通过一样的代理方式，让vm可以直接访问

## watcher 
因为 `computed` 和 `watch` 的实现都依赖 `Watcher`，我们要先解释一下它。

`Watcher`就是`DepTarget`的一种实现。

```ts 
class Watcher implements DepTarget {
  deps: Array<Dep>
  lazy: boolean
  dirty: boolean
  sync: boolean
  deep: boolean
  vm?: Component | null 
  value: any  
  getter: Function
  cb: Function
  before: Function

  contructor(vm: Component | null, fn: Function, cb: Function, options) {
    this.vm = vm;
    if (vm) vm._watcher = this;

    this.getter = fn;
    this.cb = cb;

    this.deep = this.dirty = this.lazy = this.sync = false;

    if (options) {
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.deep = !!options.deep;
      this.before = options.before;
    }

    this.dirty = this.lazy;
    this.value = this.lazy ? undefined : this.get();
  }

  get() {
    // Dep.target 设置为 this
    pushTarget(this)
    const vm = this.vm
    value = this.getter.call(vm, vm)

    // 如果是deep模式，需要遍历value的每个属性，
    // 如果这些属性都是响应式的话，在读取这些属性
    // 的时候，Dep.target就会记录到它们的dep中；
    //
    // 这个 deep 一般用在 watch 的实现上，而不是
    // computed 的实现
    if (this.deep) {
      traverse(value)
    }

    popTarget()

    // 经过上述操作，this已经被记录到各个Dep中了，
    // 自身的deps就无需再保留了
    this.clearDeps()

    return value
  }

  update() {
    // 如果 lazy = true, 说明watcher需要被上层显示调用
    // evaluate求值, 把 dirty设置为 true,告知上层可以
    // 调用 evaluate 了；
    // lazy watcher用于computed的实现
    if (this.lazy) {
      this.dirty = true
    }
    // 如果watcher不是lazy的，那就是watch实现，那么在执行
    // 的时候分为同步执行和异步执行, 一般都是异步的，性能更好，
    // 不会阻塞组件渲染
    else if (this.sync) {
      this.run()
    }
    // 异步执行，把watcher加入到队列，队列未来调度到watcher
    // 的时候，会执行 watcher.run()
    else {
      queueWatcher(this)
    }
  }

  addDep(dep: Dep) {
    this.deps.push(dep);
  }

  evaluate() {
    this.value = this.get();
    // 恢复到 false，这样上层就不会重复执行evaluate了
    this.dirty = false;
  }

  run() {
    const value = this.get();
    if (notSame(value, this.value) || this.deep) {
      const oldValue = this.value;
      this.value = value;
      // 这里就是vm.$watch时传入的函数的执行，从中你就知道
      // 为什么在定义这个函数的时候，第一个参数是最新值，第
      // 二个是旧值
      this.cb.call(this.vm, value, oldValue)
    }
  }

  // watcher是DepTarget，如果另外一个watcher也使用到它，
  // 那么这个watcher也应该被开始的watcher的deps记录
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  // 从所有 Dep 里边剔除 watcher
  teardown() {
    this.deps.forEach(dep => dep.removeSub(this))
  }
}
```
虽然`Watcher`存在`depend`，但它不能算作`Dep`, 它更像是其它DepTarget到Dep的中转手。

## computed的实现 
```vue 
<script>
export default {
  data: {
    points: 100,
  },
  computed: {
    level() {
      if (this.points > 60) return 'A'
      return 'B'
    }
  }
}
</script>
```

首先要创建watcher:
```ts 
const noop = () => {};

vm._computedWatchers['level'] = new Watcher(
  vm,
  () => {
    if (this.points > 60) return 'A'
    return 'B'
  },
  // computed是不需要cb的
  noop,
  { lazy: true }
)
```

之后，结合watcher定义computed:
```ts 
Object.defineProperty(vm, 'level', {
  get() {
    const watcher = vm._computedWatchers['level']
    // 第一次访问 computed属性的时候，dirty是false，
    // 因此不会执行注册好的求值函数
    if (watcher?.dirty) {
      watcher.evaluate();
    }
    // level内部使用了 points，points的dep记录了watcher,
    // 如果另外有个computed属性levelName, 它访问了level,
    // 也就意味着level的dep应该记录levelName的watcher，
    // 因此这里使用 watcher.depend()
    if (Dep.target) {
      watcher.depend()
    }

    return watcher.value;
  },
  // 本例子中，我们并没有给出computed属性set的定义，因此这里
  // 什么也不做，如果提供了set的定义，就用该定义作为这里的定义
  set(val) {
    return
  }
})
```
源码： `src/core/instance/state.ts#initComputed`

## watch的实现 
watch的实现就是`vm.$watch`.

源码：`src/core/instance/state.ts,line365`

```vue 
<script>
export default {
  data: {
    info: {
      name: "jack"
    }
  },
  watch: {
    "info.name"(value, oldValue) {
      if (value === 'jack') console.log('target is locked')
    }
  }
}
</script>
```

```ts 
Vue.prototype.$watch = function(fn, cb, options) {
  const vm = this;
  // 按照本例理解，
  // fn就是 () => vm.info.name 
  // cb 就是 (value, oldValue) => {
  //  if (value === 'jack') console.log('target is locked')
  // }
  const watcher = new Watcher(vm, fn, cb)
  // 在编写组件watch的时候，常会有一个immediate的参数
  // 这里就会立即执行一次，在初始化组件的时候，$watch在
  // created生命周期函数之前执行
  if (watcher.immediate) {
    // 这一步禁止依赖收集，Dep.target = undefined
    pushTarget()
    cb.call(vm, watcher.value,)
    popTarget()
  }
  return () => {
    watcher.teardown()
  }
}
```

## watcher该如何管理
负责组件渲染的watcher被保留在`vm._watcher`, 而computed属性的watcher保留在`vm._computedWatchers`，那么普通的watch所对应的watcher该怎么管理呢？

事实上，在上边介绍Watcher的时候，初始化阶段我们省略一个步骤：
```ts 
class Watcher {
  constructor(vm, ...) {
    recordEffectScope(vm, this)
  }
}
```

vue2有一个`Scope`的概念，它的`effects`属性存储着这些watcher，做统一的管理，而`vm._scope`就可以访问到`Scope`，这也就意味着`recordEffectScope(vm, this)`会把watcher存储到`vm._scope.effects`里；

当组件destory的时候：
```ts 
Vue.prototype.$destroy = function() {
  ....
  
  const vm = this;
  // 这里就会把effects里所有的watcher执行teardown,
  // 这就不用担心资源泄露了
  vm._scope.stop();
}
```

## watcher执行谁先谁后？
负责组件渲染有对应的watcher, computed也有对应的watcher，watch也有对应的watcher，这些watcher谁先执行谁后执行呢？

这个问题不归属watcher范畴，而是任务队列调度的责任，我们在任务队列调度的时候再讲。

以响应式系统的角度，我们可以再梳理一下：
```txt 
响应式变量关心的是Dep和DepTarget, watcher只是DepTarget的一种实现，watcher负责响应式变量改变后，具体做什么；

创建vm实例 -> 初始化响应式变量 -> 初始化watcher
                                   |
     响应式变量更新 <--------  watcher和响应式变量建立联系 
         |
     任务队列调度  --------->  watcher得到执行
         |       yes                 |
          <----------------   部分响应式变量更新
                                     | no  
                                    DONE

```