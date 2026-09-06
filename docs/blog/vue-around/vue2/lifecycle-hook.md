---
title: "生命周期函数"
page: true 
aside: true
---

## 生命周期函数有哪些
- `beforeCreate`
- `created`
- `beforeMount`
- `mounted`
- `beforeUpdate`
- `updated`
- `beforeDestroy`
- `destroyed`

## `beforeCreate` 和 `created`
这两个生命周期函数在vm创建的时候被执行，vm在初始化的时候做如下的事情：
```ts 
function init() {
  const vm = this

  // 初始化一些和生命周期有关的变量，比如 vm.__isDestroyed = false
  initLifecycle(vm)

  // 把父组件的事件监听一下
  initEvents(vm)

  // 初始化渲染阶段需要的函数，比如 vm.$createElement,
  // vm._c, vm.$attrs, vm.$listeners, vm.$slots,
  // vm.$scopedSlots
  initRender(vm)

  callHook(vm, 'beforeCreate')

  // 接受父组件provide的数据，并转为组件的响应式变量，
  // 当这些变量发生变化的时候，不会引发父组件的更新
  initInjections(vm)

  // 初始化响应式有关的变量，props, data, methods, 
  // computed, watch, 这样就可以用vm直接访问到这些变量；
  //
  // props会转化成响应式变量，保存在vm._props, 可读可写;
  // data会转化成响应式变量，保存在vm._data， 可读可写;
  // computed会转为watcher，保存在vm._computedWatchers， 只读;
  // watch会通过vm.$watch转为watcher，但不会保存在vm上；
  initState(vm)

  // 初始化provide给子组件的数据，保存在 vm._provided, 并
  // 通过原型链和 vm.$parent._provided 连在一起。vm._provided 本身是一个object，不是响应式的，但是它的属性值可以是一个响应式变量：
  // vm._provided['a'] = 10. -> 不会触发响应式变化
  // vm._provided['b'].age = 10 -> 如果 vm._provided['b']本身是响应式处理后的object，会触发响应式变化
  initProvide(vm)

  callHook(vm, 'created')

  if (vm.$options.el) vm.$mount(vm.$options.el)
}
```

源码：`src/core/instance/init.ts,line17`

## `beforeMount` 和 `mounted`
这两个函数在 `vm.$mount` 里执行：
```ts 
function mountComponent(vm, el) {
  vm.$el = el 
  callHook(vm, 'beforeMount')

  createWatcherForVm(vm)

  // 最顶层的vm实例，就是项目入口文件 new Vue 创建的实例，
  // 它的 $vnode 是 null，它需要手动触发 mounted 
  if (vm.$vnode == null) {
    vm._isMounted = true 
    callHook(vm, 'mounted')
  }
}
```
源码： `src/core/instance/lifecycle.ts#mountComponent,line146`

`createWatcherForVm`在源码里不存在，这里只是用来概括：为vm创建watcher，并立即执行`vm._update(vm._render())`, `vm._update`内执行patch。

按照上边说的，最顶部的vue实例需要手动触发 mounted 函数，而其它组件在patch阶段执行：
```ts 
function patch(oldVnod, vnode) {
  // 检测到 vnode 是 vue组件类型的vnode，createElm会
  // 为 vnode 创建vm, 执行 vm.$mount(), 先唤醒beforeMound,再执行vm._update(vm._render())。
  // 随后就是vm的子组件陷入到patch阶段完成自身创建，而随着子组件的渲染完毕，vm.$el也指向了新生成的DOM节点——这里边有个嵌套调用的过程
  createElm(vnode)

  // vnode执行insert hook函数，这个函数是vue内部维护的，
  // 在这个hook里会执行 mounted 函数
  invokeInsertHook(vnode);
  return vnode.elm
}
```
源码： `src/core/vdom/patch.ts,line801`

```ts 
function insertHook(vnode) {
  const { componentInstance } = vnode
  if (!componentInstance._isMounted) {
    componentInstance._isMounted = true
    callHook(componentInstance, 'mounted')
  }
}
```
源码： `src/core/vdom/create-component.ts,line67`

回头看patch函数，正因为有个嵌套的过程，于是会有：
```txt 
vm创建 
  ｜
vm执行beforeMount
  |
 vm执行$mount   ------> child vm创建 
                           |
                        child vm执行 beforeMount 
                           |
                        child vm 执行$mount ----> ....
                                                      |
                        child vm执行 mounted <--- ....
                           |
vm执行mounted   <-----------
```

这也解释了父子组件beforeMount和mounted的执行顺序

## `beforeUpdate` 和 `updated`
这两个在组件更新的时候会调用，而组件的更新时机由watcher决定。一个vm可能和多个watcher有关系，但是vm只能有一个watcher负责渲染更新，执行`vm._update(vm._render())`，这个watcher会被保存在`vm._watcher`。

还记得为vue组件类型的vnode创建vm的时候，当vm.$mount执行时，会创建一个watcher么？这个watcher就是负责渲染更新的那个watcher，会被保留在 `vm._watcher`。

当组件挂载的时候，`watcher`会立即执行一次`watcher.get()`，在这个时候，响应式系统会记住`watcher`，当响应式变量更新的时候，会自动调用`watcher.update()`。

这个步骤不会马上执行组件的重新渲染——`vm._update(vm._render())`，而是把重新渲染作为一个函数，加入到队列中，然后通知队列调度系统，下一次调度的时候，执行这个函数。

当调度器开始调度的时候，会有如下的运作：
```ts 
function flushQueue(queue) {
  for (const watcher of queue) {
    if (watcher.before) watcher.before();
    watcher.run();
  }

  for (const watcher of queue) {
    callHook(watcher.vm, "updated")
  }
}
```
源码：`src/core/observer/scheduler.ts#flushSchedulerQueue`

`updated`什么时候调用，你已经看到了；`beforeUpdate`在`watcher.before()`里调用。

在创建好vm后，为vm绑定`watcher`的时候，有这样的设置：
```ts 

const updateComponent = () => {
  vm._update(vm._render())
}

const watcherOptions: WatcherOptions = {
  // 这里给出了 watcher.before() 的定义，
  // 并在里边执行了 beforeUpdate
  before() {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate')
    }
  }
}

new Watcher(
  vm,
  updateComponent,
  noop,
  watcherOptions,
  true /* isRenderWatcher */
)
```
源码：`src/core/instance/lifecycle.ts,line203`

## `beforeDestroy` 和 `destroyed`
这两个在`vm.$destroy`里被调用：
```ts 
Vue.prototype.$destroy = function() {
  const vm = this 

  callHook(vm, 'beforeDestroy')
  vm._isBeingDestroyed = true

  vm._isDestroyed = true
  vm.__patch__(vm._vnode, null)
  callHook(vm, 'destroyed')
}
```
源码：`src/core/instance/lifecycle.ts, line107`

而此时的patch逻辑：
```ts 
function patch(oldVnode, vnode) {
  invokeDestroyHook(oldVnode)
}

function invokeDestroyHook(vnode) {
  const destroy = vnode.data?.hook?.destroy;
  destroy?.(vnode);

  for (const child of vnode.children) {
    invokdeDestroyHook(child);
  }
}
```
源码：`src/core/vdom/patch.ts,line801`

实际上`vnode.data.hook.destroy`是vue内部定义好的:
```ts 
function destory(vnode) {
  vnode.componentInstance?.$destroy()
}
```
源码：`src/core/vdom/create-component.ts,line87`

以上逻辑串起来就是：
```txt 
vm.$destroy()
    |
    --- vm执行beforeDestroy
               |
        vm._vnode执行__patch__ ---> child vm执行$destroy()
                                         |
                                         ---- child vm执行beforeDestroy
                                                    |
                                             child vm._vnode执行
                                                 __patch__      ---->  ....
                                                                        |
                                            child vm执行destroyed <-------
                                                   ｜
      vm执行destroyed  <----------------------------                                      

```
这也解释了父组件和子组件的执行顺序

## setup 
这是vue后来加入的新特性，你可以自定义`setup()`或者使用`<script setup></script>`编写代码，后者会被编译器转为`setup()`方法，最终存储在`vm.$options.setup`。

在`setup()`方法中，你可以使用vue3风格的函数式响应式变量api。`setup`方法如果返回一个函数，这个函数会被作为vnode渲染方法`render()`，如果返回是一个对象，那么对象的各个属性会被代理到vm上，你可以使用vm直接访问它们。

`setup()`是在`initState`里执行的，大致做这样的事情：
```ts 
function initSetup(vm) {
  const setupFn = vm.$options.setup;
  const result = setupFn(vm);
  vm._setupState = result；
  
  if (isFunction(result)) {
    vm.$options.render = result;
  }
  else if (isObject(result)) {
    // setup方法是用户自己手写的
    if (!!result.__sfc === false) {
      for (const key in result) {
        proxyWithRefUnwrap(vm, result, key)
      }
    }
    // setup方法是vue compiler处理<script setup>生成的
    else {
      const proxy = (vm._setupProxy = {})
      for (const key in result) {
        proxyWithRefUnwrap(proxy, result, key)
      }
    }
    
  }
}
```
源码：`src/v3/apiSetup.ts#initSetup`

```ts 
function initState(vm) {
  // 校验prop值是否合法
  initProps(vm)

  initSetup(vm)

  // 会校验method名不能和prop名重复
  initMethods(vm)
  // 会校验data名不能和method名、prop名重复
  initData(vm)
  // 会校验computed名不能和method名、prop名、data名重复
  initComputed(vm)
  initWatch(vm)
}
```
源码： `src/core/instance/state.ts#initState`