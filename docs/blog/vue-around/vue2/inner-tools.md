---
title: "内置工具"
page: true 
aside: true
---

## keep-alive 
通常vue组件在卸载的时候（v-if=false），会执行`vm.$destroy`，这意味着页面上看不到这个组件了，同时内存中关于这个组件的vm也没了。但是，在一些特别的场景中，比如说一些大盘展示组件，牵扯到的数据很多，每次挂载这个组件，都要发送很多的http请求拉取数据，空白时间较长，那么就可以将组件的vm缓存下来，卸载组件的时候不删除，重新挂载的时候直接复用这个vm，组件就直接展示出上一次的数据了，不需要重新构建。

`<keep-alive>`组件就做了这样的事情。它的实现思路也很简单，每次渲染的时候，从缓存中拉取vm，然后塞入vnode.componentInstance，返回这个vnode就可以了。

简化实现：
```ts
export default {
  abstract: true,
  data: {
    cache: {},
    vnodeToCache: null,
    keyToCache: null,
  },
  // 需要在updated和mounted里执行cache构建，是因为在
  // 这两个生命周期函数执行的时候，子组件已经更新或者挂载
  // 了，此时 vnodeToCache.componentInstance 才会有数据
  updated() {
    this.cacheVnode()
  },
  mounted() {
    this.cacheVnode()
  },
  methods: {
    cacheVnode() {
      this.cache[this.keyToCache] = {
        componentInstance: this.vnodeToCache.componentInstance
      }
      this.vnodeToCache = null 
      this.keyToCache = null
    }
  },
  render() {
    const vm = this
    // slot是一个数组
    const slot = vm.$slots.default 
    const componentVnode = findFirstComponentVnode(slot)
    if (componentVnode) {
      const cacheKey = createCacheKey(componentVnode)
      if (vm.cache[cacheKey]) {
        const cache = vm.cache[cacheKey]
        componentVnode.componentInstance = cache.componentInstance
      }
      else {
        this.vnodeToCache = componentVnode
        this.keyToCache = cacheKey
      }
      
    }

    return componentVnode || slot && slot[0]
  }
}
```
源码： `src/core/components/keep-alive.ts,line69`

## transition 
这个组件要配合`v-show`指令使用，被它包裹的子组件`v-show`属性发生变化时，这个组件可以为子组件的DOM节点动态加入样式，实现显隐之间的过渡效果。

这个组件只能包裹一个组件，多个组件要用`<transition-group>`。

该组件的实现核心依赖内部的transtion hook, 我们就先讲解下这个hook，源码：`src/platforms/web/runtime/modules/transition.ts`

简化代码：
```ts 
export default {
  // vnode创建之后，就会调用这个
  create: _enter,
  // vnode对应的组件从缓存拿出来重新展示时，会调用这个
  activate: _enter,
  // vnode被删除时，会调用这个
  remove(vnode: VNode) {
    if (vnode.data.show !== true) {
      leave(vnode)
    }
  }
}

// 很显然，_enter实现的是节点由隐藏到显示的过渡情况
function _enter(_: any, vnode: VNode) {
  if (vnode.data.show !== true) {
    enter(vnode)
  }
}

function enter(vnode: VNode) {
  const el = vnode.elm

  // 这里表示 vnode 在此之前，是一个执行
  // 显示到隐藏过渡动画的节点，那么应该将
  // 离开回调设置为取消状态，并调用离开回调，
  // 这个回调就会删除节点上关于离开过渡动画
  // 的样式
  if (isDef(el._leaveCb)) {
    el._leaveCb.cancelled = true
    el._leaveCb()
  }

  // 从 vnode 提取过渡需要的数据
  const data = resolveTransition(vnode.data.transition)
  // 没有定义过渡需要的数据，当作不需要过渡动画处理
  if (isNotDef(data)) return 
  // 表示节点已经施加进入的过渡动画了，不需要再次加入过渡效果
  if (isDef(el._enterCb)) return

  // 根据过渡数据，获取进入的过渡动画的回调
  const cb = defineEnterTransitionCallback(data)
  el._enterCb = cb 

  const { 
    css,
    type,
    startClass,
    activeClass,
    toClass,
    explicitEnterDuration,
    enterHook,
    beforeEnterHook
  } = data

  const expectsCSS = css
  // 如果用户自定义了enter方法，说明用户想要控制
  // 进入的过渡动画行为，这个时候不需要调用默认的el._enterCb，
  // transition组件提供props, 允许用户定义enter方法
  const userWantsControl = isDef(enterHook)

  beforeEnterHook && beforeEnterHook(el)
  if (expectsCSS) {
    // 添加样式
    addTransitionClass(el, startClass)
    addTransitionClass(el, activeClass)
    // 这里很重要，明确在下一个动画帧，删除一些样式，
    // 再增加一些样式，经过这种处理，可以在电脑屏幕
    // 可以看到样式的变化
    nextFrame(() => {
      removeTransitionClass(el, startClass)
      if (!cb.cancelled) {
        addTransitionClass(el, toClass)
        if (!userWantsControl) {
          if (isValidDuration(explicitEnterDuration)) {
            setTimeout(cb, explicitEnterDuration)
          } else {
            whenTransitionEnds(el, type, cb)
          }
        }
      }
    })
  }

  // 当然还有其它琐碎的事情要处理，这里的代码就不列举了
  // ....

  if (vnode.data.show) {
    enterHook && enterHook(el, cb)
  }

  // 用户想采用默认行为，就有框架代劳，处理进入的过渡动画行为
  if (!expectsCSS && !userWantsControl) {
    cb()
  }
}

// 处理节点从展示到隐藏的过渡动画
function leave(vnode: VNode) {
  const el = vnode.elm

  // 这里表示 vnode 在此之前，是一个执行
  // 隐藏到显示过渡动画的节点，那么应该将
  // 进入回调设置为取消状态，并调用进入回调，
  // 这个回调就会删除节点上关于进入过渡动画
  // 的样式
  if (isDef(el._enterCb)) {
    el._enterCb.cancelled = true
    el._enterCb()
  }


  // 从 vnode 提取过渡需要的数据
  const data = resolveTransition(vnode.data.transition)
  // 没有定义过渡需要的数据，当作不需要过渡动画处理
  if (isNotDef(data)) return 
  // 表示节点已经施加离开的过渡动画了，不需要再次离开过渡效果
  if (isDef(el._leaveCb)) return

  // 根据过渡数据，获取离开的过渡动画的回调
  const cb = defineLeaveTransitionCallback(data)
  el._leaveCb = cb 

  const {
    css,
    type,
    leaveClass,
    leaveActiveClass,
    leaveToClass,
    leave,
    delayLeave,
    beforeLeave,
    explicitLeaveDuration
  } = data

  const expectsCSS = css
  // 如果用户自定义了leave方法，说明用户想要控制
  // 离开的过渡动画行为，这个时候不需要调用默认的el._leaveCb，
  // transition组件提供props, 允许用户定义leave方法
  const userWantsControl = isDef(leave)

  // 这里和 enter 有明显的不同，存在一个延迟离开的概念，
  // 如果存在延迟离开，不会立即执行离开动画，而是将离开动画
  // performLeave交给delayLeave函数，它内部什么时候调用，
  // 什么时候才会触发离开动画，
  // 这一点我们会在 transition 组件里看到
  if (delayLeave) {
    delayLeave(performLeave)
  } else {
    performLeave()
  }

  function performLeave() {
    beforeLeave && beforeLeave(el)
    // 这里和 enter 的情况一样，只不过加入的样式名不同
    if (expectsCSS) {
      addTransitionClass(el, leaveClass)
      addTransitionClass(el, leaveActiveClass)
      nextFrame(() => {
        removeTransitionClass(el, leaveClass)
        // @ts-expect-error
        if (!cb.cancelled) {
          addTransitionClass(el, leaveToClass)
          if (!userWantsControl) {
            if (isValidDuration(explicitLeaveDuration)) {
              setTimeout(cb, explicitLeaveDuration)
            } else {
              whenTransitionEnds(el, type, cb)
            }
          }
        }
      })
    }
    leave && leave(el, cb)
    if (!expectsCSS && !userWantsControl) {
      cb()
    }
  }
}

function nextFrame(fn) {
  window.requestAnimationFrame(fn)
}
```

你会发现上述hook负责搭建一套执行机制，却不会定义到底执行什么内容。这就是功能分离，transition组件才会定义具体做什么。

简化实现：
```ts 
export default {
  abstract: true,
  render() {
    // default插槽是一个vnode数组，过滤掉文本类型的vnode，
    // 再过滤掉 abstrac: true 的vue组件类型的vnode，最后
    // 从省下的vnode里选择第一个vnode就是child
    const child = extractRealChild(this.$slots.default)
    if (isNotDef(child)) return 

    // 正在执行离开动画
    if (this._leaving) return 

    // transition组件提供了mode，明确过渡模式：
    // in-out, 新节点先进入，然后老节点在离开
    // out-in, 老节点先离开，新节点再加入
    // “”，新节点进入、老节点离开，同时进行
    const mode = this.mode

    // 根据 transition 组件的属性值，创建过渡动画要用的值，
    // 交给child。上边介绍hook的时候，有一步从vnode里提取
    // 过渡动画要用的数据，就是在这里创建的
    child.data.transition = createTransitionData(this)

    // getRealChild要验证下vnode不能是abstract: true 的情况
    const oldChild = getRealChild(this._vnode)

    // vnode如果有 v-show = true，要更新vnode.data.show,
    // 上边提到的hook要用到这个属性
    if (child.data.directives.some(directive => directive.name === 'show')) {
      child.data.show = true
    }

    const oldData = (oldChild.data.transition = extend({}, child.data))

    if (isUndef(oldChild) || isSame(oldChild, child) ) {
      return child
    }
    
    // 新节点先进入，老节点再离开
    if (mode === 'in-out') {
      let delayedLeave
      const performLeave = () => {
        delayedLeave()
      }
      // 新节点进入后，会执行这个hook，此时老节点才会执行离开动画
      mergeVNodeHook(data, 'afterEnter', performLeave)
      mergeVNodeHook(data, 'enterCancelled', performLeave)
      // 注册delayLeave hook, 上边介绍的leave hook 在执行 
      // delayLeave的时候，就会把执行离开动画的函数交给delayedLeave，
      // 而这个时候，老节点的离开动画不会执行
      mergeVNodeHook(oldData, 'delayLeave', leave => {
        delayedLeave = leave
      })
    }
    // 老节点先离开，新节点再进入
    else if (mode === 'out-in') {
      // 标记老节点开始执行离开动画
      this._leaving = true
      mergeVNodeHook(oldData, 'afterLeave', () => {
        this._leaving = false
        this.$forceUpdate()
      })
      // 返回undefined，那么在下一次渲染的时候，this._vnode就是
      // undefined， 会直接返回新vnode, 就开启了新节点的进入，
      // 所以在上边要特意执行一次this.$forceUpdate()
      return
    }

    // 默认的mode，会直接来到这里，返回最新的vnode，由于新老vnode不是同一个类型的vnode，就会执行老vnode的remove, 和新vnode的create，那么上边讲到的 create hook 与 remove hook 就会执行，
    // 于是新节点进入、老节点离开，两个过渡动画就同时进行了
    return child
  }
}
```
源码：`src/platforms/web/runtime/components/transition.ts`

## transition-group
这个组件倒不是基于`<transition>`的封装，而是基于上一节我们讲述的transition hook, 源码：`src/platforms/web/runtime/modules/transition.ts`。

如果一个vnode存在`vnode.data.transition`，那么这个hook就会对这个vnode处理，在适当时候，为其增加或删除样式。

而`<transition-group>`要做的工作是修改被它包裹的vnode的DOM节点的`transform`属性，前提是这个DOM节点把`transform`作为`transition`的目标属性。

因为源码的实现比较繁琐，这里只给出思路概述，感兴趣的可以读源码：`src/platforms/web/runtime/components/transition-group.ts`深入理解。

1. 在组件render()执行期间，给老的vnode（this.prevChildren）记录DOM节点的(x,y)坐标，用`element.getBoundingClientRect`这个api实现
2. 在组件render()执行期间，给新的vnode(this.$slots.default)设置vnode.data.transition 
3. 在组件updated()执行期间，
   1. 给vnode（this.prevChildren）记录DOM节点的(x,y)坐标，
   2. 然后和老坐标计算出x、y的偏移量，作为transform的translate函数入参，设置该transform属性
   3. 然后设置css样式，样式名可以是用户通过组件的moveClass prop告知，或者是`组件名-move`，或者是`v-move`


## v-show 
源码： `src/platforms/web/runtime/directives/show.ts`

它是一个标准的vue指令，与用户自定义的指令没什么差别，只是由vue内部提供。由于它和`transition`组件、`transition-group`组件关联密切，因此不太适合交给框架外的用户定义。

对于`v-show`的关注点没那么复杂，只需要知道：true的时候，DOM节点会被设置为`display: none`,false的时候，DOM节点会恢复到原来的display值。

## v-model 
`v-model`的情形比`v-show`复杂，因为它不单纯是一个vue指令，还是vue编译器处理的重要对象。

作为指令，源码：`src/platforms/web/runtime/directives/model.ts`, 它主要处理的是DOM节点的输入问题，比如绑定“compositionstart”事件处理用户输入中文的一些问题。但是，它并不负责将用户输入的值同步到响应式变量，这个工作由编译器和运行时共同处理。

render()函数会给出这样的vnode：
```ts 
import { ref } from "vue"
const name = ref('')


const vnode = { 
  data: {
    model: {
      value: name,
      callback: (event) => name.value = event.target.value
    },
    on: {
      input: [(event) => name.value = event.target.value]
    }
  }
}
```
这一步骤发生在为vue组件创建vnode的时候：`src/core/vdom/create-component.ts,line151`

之后，在组件挂载完毕或者更新完毕的时候，events有关的hook会根据vnode.data.on，绑定实际的DOM事件函数，events有关的hook：`src/platforms/web/runtime/modules/events.ts`:
```ts 
function updateDOMListeners(oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  
  // 取出DOM节点
  target = vnode.elm || oldVnode.elm
  normalizeEvents(on)
  // 在target上绑定事件函数，target是一个外部变量，
  // updateListeners函数内部会访问这个变量，因此
  // updateListeners的事件绑定都是针对 target 的
  updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context)
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners,
}
```