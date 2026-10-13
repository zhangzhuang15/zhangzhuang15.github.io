---
title: "vue3风格的函数式api"
page: true 
aside: true
---

## 回顾
在vue2往vue3过渡的时候，vue2.7提供了函数式api，供使用者定义响应式变量，生命周期函数。

```vue 
<script setup>
import { 
  ref, reactive, computed, 
  watch, watchEffect,
  onMounted 
} from "vue"

const name = ref("")

const info = reactive({ points: 80, phone: "113243242" })

const level = computed(() => info.points > 70 ? "A" : B)

watch(name, (value, oldValue) => { console.log("name is change, old name is : ", oldValue)})

watchEffect(() => {
  if (name.value === 'jack') console.log('target is locked')
})

onMounted(() => {
  console.log("component is mounted")
})
</script>
```

## 生命周期函数 
vue框架提供了如下api供用户注册生命周期函数：
1. `onBeforeMount`
2. `onMounted`
3. `onBeforeUnmount`: 对应原来的`beforeDestroy`
4. `onUnmounted`: 对应原来的 `destroyed`
   
取消了`beforeCreate`和`created`，取而代之的是`setup()` 方法。

而上述的函数，其内部实现非常简单，以`onMounted`为例：
```ts 
function onMounted(fn, currentVm) {
  currentVm.$options["mounted"] = currentVm.$options["mounted"].concat([fn])
}
```
源码：`src/v3/apiLifecycle.ts#onMounted`

当vue框架开始执行`setup()` 方法时，会将`currentVm`设置为当前要渲染的组件vm；vue2原来的逻辑，也是将用户定义好的生命周期函数注册到`vm.$options`，因此改为函数式api后，老逻辑没有变。其余的生命周期函数同理。

## ref 和 shallowRef
```ts
import { ref } from "vue"

const name = ref('jack')
const info = ref({ data: 100 })

// 以下都会引发响应式变化
name.value = 'peter';
info.value.data = 1000;
info.value = { data: 0 };


import { shallowRef } from "vue"
const age = shallowRef(8)
const hobby = shallowRef({ football: true })

// 以下会带来响应式变化
age.value = 18;
hobby.value = { basketball: true };

// 不会带来响应式变化
hobby.value.basketball = false;
```

```ts 
function ref(val) {
  const r = {} 
  const shallow = false
  def(r, "__v_isRef", true)
  def(r, "__v_isShallow", shallow)
  def(r, "dep", defineReactive(r, "value", val, shallow))
  return r
}
```
源码： `src/v3/reactivity/ref.ts,line49`

非常简洁，对不对？`defineReactive`我们在介绍响应式系统的时候讲过了，不再赘述。

```ts 
function shallowRef(val) {
  const r = {}
  const shallow = true 
  def(r, "__v_isRef", true)
  def(r, "__v_isShallow", shallow)
  def(r, "dep", defineReactive(r, "value", val, shallow))
  return r
}
```
源码：`src/v3/reactivity/ref.ts,line62`

还有一个api也需要关注 ——`toRef`：
```ts 
// 返回一个ref，用户通过这个ref可以读/写obj的key属性，
// 但这个ref并不会引发响应式变化，除非obj已经被响应式处理
function toRef(obj, key, defaultValue) {
  if (isRef(obj[key])) return obj[key]

  const ref = {
    get() {
      return obj[key] ?? defaultValue
    },
    set(val) {
      obj[key] = val
    }
  }

  def(ref, "__v_isRef", true)
  return ref
}
```
源码: `src/v3/reactivity/ref.ts,line217`

## reactive 和 shallowReactive
`reactive` 和 `shallowReactive`就是将一个对象转化为响应式对象

```ts 
import { reactive, shallowReactive } from "vue"

const info = reactive({ name: 'jack', points: [1, 2] })
const hobby = shallowReactive({ 
  colors: ['blue', 'white', 'pink'],
  sports: 'football'
})

// 以下都能触发响应式变化
info.name = 'peter'
info.points[0] = 4
info.points = [1,2,3,4]
hobby.sports = "tennis"
hobby.colors = ["black", "cream"]

// 不能触发响应式变化
hobby.colors[0] = "purple"
```

```ts 
function reactive(obj) {
  const shallow = false
  observe(obj, shallow)
  return obj
}

function shallowReactive(obj) {
  const shallow = true 
  observe(obj, shallow)
  def(obj, "__v_isShallow", shallow)
  return obj
}
```
源码：`src/v3/reactivity/reactive.ts,line32,line48`

`observe`在介绍响应式系统时讲过，不再赘述。

## computed 
```ts 
import { computed, ref } from "vue"

const point = ref(100)
const level = computed({ 
  get() { return point.value > 80 ? 'A' : 'B' },
  set(val) { if (val === 'A') point.value = 80 }
})
level.value = "B"
```

```ts 
function computed(getterOrOptions) {
  const { getter, setter, onlyDefineGetter } = resolveGetterOrOptions(getterOrOptions)

  const cb = () => {}
  // computed在执行的时候，vue框架就会把当前的vm赋值
  // 给 currentVm
  const watcher = new Watcher(
    currentVm, getter, cb, { lazy: true }
  )

  const ref = {
    effect: watcher,
    get() {
      if (watcher) {
        if (watcher.dirty) watcher.evaluate()
        if (Dep.target) {
          watcher.depend()
        }
      }
      return watcher?.value || getter();
    },
    set(val) {
      setter(val)
    }
  }

  def(ref, "__v_isRef", true)
  def(ref, "__v_isReadonly", onlyDefineGetter)
  return ref
}
```
源码：`src/v3/reactivity/computed.ts,line37`

`Watcher`已经在响应式系统里讲过，不再赘述。vue原来的逻辑，将computed的watcher保留在`vm._computedWatchers`，现在是保留在ref里。

## watch 以及变体
关于watch，新api做了拓展，共有如下的api:
1. `watch`
2. `watchEffect`
3. `watchPostEffect`
4. `watchSyncEffect`

### watch
watch和原来的逻辑一样，监听响应式变量是否更新，在更新的时候，执行回调。

```ts 
import { ref, watch } from "vue"

const name = ref('jack')
const age = ref(10)

// 形式1
watch(name, (value, oldValue) => {
  console.log("name is changed")
})

// 形式2
watch([name, age], (value, oldValue) => {
  const [oldName, oldAge] = oldValue
  console.log("name or age is changed")
})

// 形式3
watch(() => { return [name.value, age.value] }, (value, oldValue) => {
  const [oldName, oldAge] = oldValue
  console.log("name or age is changed")
})
```

无论哪种形式，内部最终转为形式三；

```ts 
function watch(sourceOrSourceArrayOrFn, cb, options) {
  // getter中，会对响应式变量进行读取，触发以来回收：
  // ref类型： 访问 ref.value，如果options.deep开启，递归访问ref.value的每个属性
  // reactive类型： 访问每个属性，并递归访问每个属性值的属性
  const getter = normalizeToFn(sourceOrSourceArrayOrFn)
  const watcher = new Watcher(currentVm, getter, cb, { lazy: true })

  let oldValue = isArray(sourceOrSourceArrayOrFn) ? [] : {}
  watcher.run = () => {
    const newValue = watcher.get();
    if (options.deep || isChanged(newValue, oldValue)) {
      cb.call(null, newValue, oldValue)
      oldValue = newValue
    }
  }

  // 同步模式，在update的时候就执行run，
  // 默认情况下，update会把 watcher 加入到异步任务队列
  if (options.flush === 'sync') {
    watcher.update = watcher.run;
  }
  // 设置标识属性watcher.post, 方便在异步队列里排序靠后
  else if (options.flush === 'post') {
    watcher.post = true
    watcher.update = () => queueWatcher(watcher)
  }
  // 默认方式，直接加入到异步队列
  else {
    watcher.update = () => {
      queueWatcher(watcher)
    }
  }

  // 如果用户指定立即执行，那么就运行一下run方法，
  // 这个方法内会执行一遍 watch.get(), 并且执行
  // 一遍 cb
  if (options.immediate) {
    watcher.run()
  } 
  // 默认情况，执行一次 get，不需要执行cb,
  // 这样就可以完成依赖收集，响应式变量就捕捉了 watcher
  else {
    oldValue = watcher.get()
  }

  return () => {
    watcher.teardown()
  }
}
```
源码： `src/v3/apiWatch.ts#watch,line139`

### watchEffect 
```ts 
type OnCleanup = (fn: () => void) => void
function watchEffect(effect: OnCleanup, options) {
  let cleanup: () => void
  let onCleanup: OnCleanup

  const getter = () => {
    // 类似 react 的 useEffect 思路，先执行一次清理，
    // 再执行一次 effect
    if (cleanup) cleanup()
    effect.call(null, onCleanup)
  }

  const watcher = new Watcher(currentVm, getter, null, { lazy: true })

  onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = watcher.onStop = () => {
      fn.call(null)
    }
  }

  watcher.run = () => {
    watcher.get();
  }

  // 同步模式，在update的时候就执行run，
  // 默认情况下，update会把 watcher 加入到异步任务队列
  if (options.flush === 'sync') {
    watcher.update = watcher.run;
  }
  // 设置标识属性watcher.post, 方便在异步队列里排序靠后
  else if (options.flush === 'post') {
    watcher.post = true
    watcher.update = () => queueWatcher(watcher)
  }
  // 默认方式，直接加入到异步队列
  else {
    watcher.update = () => {
      queueWatcher(watcher)
    }
  }

  // 如果是 post 模式，在组件挂载完成后，再执行get
  if (options.flush === 'post' && currentVm) {
    currentVm.$once('hook:mounted', () => watcher.get())
  } 
  // 默认模式直接执行一次，完成依赖收集；
  else {
    watcher.get()
  }

  return () => {
    watcher.teardown()
  }
}
```

当响应式变量更新时，就会触发`watcher.get` 执行，如果在这次执行中，又有响应式变量更新，就会陷入死循话，所以要小心在effect中响应式变量总更新。

### watchPostEffect 和 watchSyncEffect 
`watchPostEffect(effect)`等效于`watchEffect(effect, { flush: "post"})`

`watchSyncEffect(effect)`等效于`watchEffect(effect, { flush: 'sync'})`


## provide 和 inject
`provide`的实现类似于生命周期函数，把键值对赋值到vm._provided属性上：
```ts 
function provide(key, value) {
  currentVm._provided[key] = value
}
```

inject也类似：
```ts 
function inject(key, defaultValue) {
  const provides = currentVm.$parent._provided
  return provides[key] ?? defaultValue
}
```