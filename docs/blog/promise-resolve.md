---
title: "Promise Resolve的秘密"
page: true
aside: true
---

# resolve 延迟现象

在使用 Promise 的时候，我遇到了这样的代码：

```ts
async function run() {
  return {
    then: (r) => r(111),
  };
}

run().then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

它的输出结果是

```txt
1
111
2
```

我就好奇，它为什么不是

```txt
111
1
2
```

还有这个代码

```ts
async function run() {
  return Promise.resolve(111);
}

run().then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

它输出结果是

```txt
1
2
111
```

我就好奇，它为什么不是

```txt
111
1
2
```

## async 的魔法

我第一个直觉是，问题出自 async，它肯定做了什么不可告人的黑魔法。

看 v8 源码里如何实现 async，显然不太现实，满篇 C++代码，咱看不懂。

> 不得不吐槽 C++，它是很强，但它就是不想让人懂

然后我就想了一个主意，用 babel 将代码转为 es5, 这样就可以消除 async。

写一个 test.js:

```js
async function run() {
  return {
    then: (r) => r(111),
  };
}

run().then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

下载 `@babel/cli` `@babel/core` `@babel/preset-env`：

```shell
npm i @babel/cli @babel/core @babel/preset-env
```

设置好 `babel.config.json`:

```json
{
  "presets": ["@babel/preset-env"]
}
```

把 test.js 编译为 dist.js:

```shell
npx babel test.js -o dist.js
```

运行 dist.js:

```shell
node dist.js
```

结果是

```txt
1
111
2
```

顺序没有变化，这就证明和 async 没有关系

那到底和什么有关系呢？

在 dist.js 中打断点单步调试，最终发现，和 Promise 有关系！

## 两个 resolve

这两段代码是等效的：

```js
async function run() {
  return {
    then: (r) => r(111),
  };
}

run().then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

```js
Promise.resolve({ then: (r) => r(111) }).then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

但这两段代码不等效：

```js
async function run() {
  return Promise.resolve(111);
}

run().then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

```js
Promise.resolve(Promise.resolve(111)).then(console.log);

Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

可是改为这样就等效了：

```js
new Promise((resolve) => resolve(Promise.resolve(111))).then(console.log);
Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
```

问题来了：

- resolve 函数到底发生了什么
- Promise.resolve 和 new Promise 里的 resolve 是一个东西么，各自遵从什么规律呢？

## resolve 的秘密

问题的答案：

- [v8 源码 | promise-resolve.tq 定义](https://github.com/v8/v8/blob/main/src/builtins/promise-resolve.tq)
- [ECMA 2024 Language Specification | Promise resolve function](https://tc39.es/ecma262/#sec-promise-resolve-functions)
  > v8 的实现就是按照这个标准写的，facebook 实现的 regenerator 似乎也是根据这个标准来的

如果觉得下边的解释太啰嗦，[看简化版](#ecma标准解读)

先看看 promise-resolve.tq:

```txt
// https://tc39.es/ecma262/#sec-promise.resolve
transitioning builtin
PromiseResolve(implicit context: Context)(
    constructor: JSReceiver, value: JSAny): JSAny {

       // .....一堆代码
    }


transitioning builtin
ResolvePromise(implicit context: Context)(
    promise: JSPromise, resolution: JSAny): JSAny {

       // ..... 另一堆代码
    }
```

`PromiseResolve` ?

`ResolvePromise` ?

卧槽？

说实话，如果源代码注释里没有写出 ECMAScript 标准的 url，还真不知道这两个函数都是干啥使的。

废话少说，直接上结果：

- `Promise.resolve` 就是 `PromiseResolve`
- `new Promise(resolve => {})` 的 `resolve` 对应 `ResolvePromise`

先瞧瞧 `PromiseResolve`:

```txt
transitioning builtin
PromiseResolve(implicit context: Context)(
    constructor: JSReceiver, value: JSAny): JSAny {

  const nativeContext = LoadNativeContext(context);
  const promiseFun = *NativeContextSlot(
      nativeContext, ContextSlot::PROMISE_FUNCTION_INDEX);
  try {
    // Check if {value} is a JSPromise.
    const value = Cast<JSPromise>(value) otherwise NeedToAllocate;

    // We can skip the "constructor" lookup on {value} if it's [[Prototype]]
    // is the (initial) Promise.prototype and the @@species protector is
    // intact, as that guards the lookup path for "constructor" on
    // JSPromise instances which have the (initial) Promise.prototype.
    const promisePrototype =
        *NativeContextSlot(
        nativeContext, ContextSlot::PROMISE_PROTOTYPE_INDEX);
    // Check that Torque load elimination works.
    static_assert(nativeContext == LoadNativeContext(context));
    if (value.map.prototype != promisePrototype) {
      goto SlowConstructor;
    }

    if (IsPromiseSpeciesProtectorCellInvalid()) goto SlowConstructor;

    // If the {constructor} is the Promise function, we just immediately
    // return the {value} here and don't bother wrapping it into a
    // native Promise.
    if (promiseFun != constructor) goto SlowConstructor;
    return value;
  } label SlowConstructor deferred {
    // At this point, value or/and constructor are not native promises, but
    // they could be of the same subclass.
    const valueConstructor = GetProperty(value, kConstructorString);
    if (valueConstructor != constructor) goto NeedToAllocate;
    return value;
  } label NeedToAllocate {
    if (promiseFun == constructor) {
      // This adds a fast path for native promises that don't need to
      // create NewPromiseCapability.
      const result = NewJSPromise();
      ResolvePromise(context, result, value);
      return result;
    } else
      deferred {
        const capability = NewPromiseCapability(constructor, True);
        const resolve = UnsafeCast<Callable>(capability.resolve);
        Call(context, resolve, Undefined, value);
        return capability.promise;
    }
  }
}
```

这代码，废话连篇，简化版就是：

```txt
transitioning builtin
PromiseResolve(implicit context: Context)(
    constructor: JSReceiver, value: JSAny): JSAny {

        // 以 Promise.resolve(123) 为例，
        // constructor 就是 Promise
        // value 就是 123

        // 根据上下文环境，获取 promiseFun
        const nativeContext = LoadNativeContext(context);
        const promiseFun = *NativeContextSlot(
          nativeContext, ContextSlot::PROMISE_FUNCTION_INDEX);

        // value 是一个 Promise 对象不？
        // 不是，赶紧滚蛋，去执行 NeedToAllocate;
        // 是的话，接着往下执行；
        //
        // Promise.resolve({ then: (r) => r(111) }) 就会执行 NeedToAllocate
        //
        const value = Cast<JSPromise>(value) otherwise NeedToAllocate;

        // promiseFun 是不是 Promise 吧？
        // 不是的话，滚蛋，去执行 SlowConstructor;
        // 是的话，直接返回 value;
        //
        // Promise.resolve(promise) 的结果就是 promise
        //
        if (promiseFun != constructor) goto SlowConstructor;

        return value;

        label NeedToAllocate {
          if (promiseFun == constructor) {
            // 创建一个Promise对象 result，然后返回它；
            // 至于 result 什么时候变成 fulfilled 状态，和 value 之间
            // 有什么关系，就交给 ResolvePromise 搞定；
            //
            // 所以，当传入到 Promise.resolve 的参数不是一个 Promise对象时，
            // new Promise(resolve => resolve(111)) 和 Promise.resolve(111)
            // 是等效的；
            const result = NewJSPromise();
            ResolvePromise(context, result, value);
            return result;

          }
        }
    }
```

读到这里，你应该隐约感到了：

`new Promise(resolve => {})` 的 `resolve` 怎么去处理接收到的参数，才是决定之前例子中输出结果顺序的关键！

那就看看呗：

```txt
// https://tc39.es/ecma262/#sec-promise-resolve-functions
transitioning builtin
ResolvePromise(implicit context: Context)(
    promise: JSPromise, resolution: JSAny): JSAny {
  // 7. If SameValue(resolution, promise) is true, then
  // If promise hook is enabled or the debugger is active, let
  // the runtime handle this operation, which greatly reduces
  // the complexity here and also avoids a couple of back and
  // forth between JavaScript and C++ land.
  // We also let the runtime handle it if promise == resolution.
  // We can use pointer comparison here, since the {promise} is guaranteed
  // to be a JSPromise inside this function and thus is reference comparable.
  if (IsIsolatePromiseHookEnabledOrDebugIsActiveOrHasAsyncEventDelegate() ||
      TaggedEqual(promise, resolution))
    deferred {
      return runtime::ResolvePromise(promise, resolution);
    }

  let then: Object = Undefined;
  try {
    // 8. If Type(resolution) is not Object, then
    // 8.a Return FulfillPromise(promise, resolution).
    if (TaggedIsSmi(resolution)) {
      return FulfillPromise(promise, resolution);
    }

    const heapResolution = UnsafeCast<HeapObject>(resolution);
    const resolutionMap = heapResolution.map;
    if (!IsJSReceiverMap(resolutionMap)) {
      return FulfillPromise(promise, resolution);
    }

    // We can skip the "then" lookup on {resolution} if its [[Prototype]]
    // is the (initial) Promise.prototype and the Promise#then protector
    // is intact, as that guards the lookup path for the "then" property
    // on JSPromise instances which have the (initial) %PromisePrototype%.
    if (IsForceSlowPath()) {
      goto Slow;
    }

    if (IsPromiseThenProtectorCellInvalid()) {
      goto Slow;
    }

    const nativeContext = LoadNativeContext(context);
    if (!IsJSPromiseMap(resolutionMap)) {
      // We can skip the lookup of "then" if the {resolution} is a (newly
      // created) IterResultObject, as the Promise#then() protector also
      // ensures that the intrinsic %ObjectPrototype% doesn't contain any
      // "then" property. This helps to avoid negative lookups on iterator
      // results from async generators.
      assert(IsJSReceiverMap(resolutionMap));
      assert(!IsPromiseThenProtectorCellInvalid());
      if (resolutionMap ==
          *NativeContextSlot(
              nativeContext, ContextSlot::ITERATOR_RESULT_MAP_INDEX)) {
        return FulfillPromise(promise, resolution);
      } else {
        goto Slow;
      }
    }

    const promisePrototype =
        *NativeContextSlot(
        nativeContext, ContextSlot::PROMISE_PROTOTYPE_INDEX);
    if (resolutionMap.prototype == promisePrototype) {
      // The {resolution} is a native Promise in this case.
      then = *NativeContextSlot(nativeContext, ContextSlot::PROMISE_THEN_INDEX);
      // Check that Torque load elimination works.
      static_assert(nativeContext == LoadNativeContext(context));
      goto Enqueue;
    }
    goto Slow;
  } label Slow deferred {
    // 9. Let then be Get(resolution, "then").
    // 10. If then is an abrupt completion, then
    try {
      then = GetProperty(resolution, kThenString);
    } catch (e) {
      // a. Return RejectPromise(promise, then.[[Value]]).
      return RejectPromise(promise, e, False);
    }

    // 11. Let thenAction be then.[[Value]].
    // 12. If IsCallable(thenAction) is false, then
    if (!Is<Callable>(then)) {
      // a. Return FulfillPromise(promise, resolution).
      return FulfillPromise(promise, resolution);
    }
    goto Enqueue;
  } label Enqueue {
    // 13. Let job be NewPromiseResolveThenableJob(promise, resolution,
    //                                             thenAction).
    const task = NewPromiseResolveThenableJobTask(
        promise, UnsafeCast<JSReceiver>(resolution),
        UnsafeCast<Callable>(then));

    // 14. Perform HostEnqueuePromiseJob(job.[[Job]], job.[[Realm]]).
    // 15. Return undefined.
    return EnqueueMicrotask(task.context, task);
  }
}
```

废话连篇，怎么能忍，上简化版：

```txt
// https://tc39.es/ecma262/#sec-promise-resolve-functions
transitioning builtin
ResolvePromise(implicit context: Context)(
    promise: JSPromise, resolution: JSAny): JSAny {
        // 以 const t = new Promise(resolve => resolve(123)) 为例，
        // promise 就是 t;
        // resolution 就是 123;

        let then: Object = Undefined;

        // resolution 不是一个 Object, 直接把 promise 设置为
        // fulfilled 状态，值就是 resolution
        if (TaggedIsSmi(resolution)) {
          return FulfillPromise(promise, resolution);
        }

        // 接下来，resolution 肯定是一个对象，但是它可能：
        // 1. 是一个 Promise 对象；
        // 2. 是一个拥有 then 属性的非Promise对象；

        // 得到 Promise.prototype
        const promisePrototype =
          *NativeContextSlot(
            nativeContext, ContextSlot::PROMISE_PROTOTYPE_INDEX);

        // resolution是一个 Promise 对象
        if (resolutionMap.prototype == promisePrototype) {
          // 拿到 Promise.prototype.then
          then = *NativeContextSlot(nativeContext, ContextSlot::PROMISE_THEN_INDEX);
          goto Enqueue;
        }

        goto Slow;

        // resolve 一个 Promise 对象，处理逻辑在 Enqueue；
        // resolve 一个 普通对象（不管它有没有then），处理逻辑在 Slow;

        label Slow deferred {
          try {
            // 获取 resolution.then
            then = GetProperty(resolution, kThenString);
          } catch (e) {
            // GetProperty 出错了，将 promise 设置为 rejected,
            return RejectPromise(promise, e, False);
          }

          // then 可能是 null，可能是 undefined， 可能是 function，也可能是别的Object；
          // 这都没关系，我们只关心它能不能被调用，不能被调用的话，直接将 promise 设置为 fulfilled
          // 状态，值就是 resolution;
          if (!Is<Callable>(then)) {
            return FulfillPromise(promise, resolution);
          }

          // 如果 then 可以被调用，交给逻辑Enqueue处理
          goto Enqueue;

          // 你应该感觉到了，无论resolve一个Promise对象，还是一个含then属性的对象，
          // 最终都要来到 Enqueue, 区别在于，前者的 then 是 Promise.prototype.then,
          // 后者是 resolution.then
        }

        label Enqueue {
          // 13. Let job be NewPromiseResolveThenableJob(promise, resolution,
          //                                             thenAction).
          //
          // 核心逻辑就在 NewPromiseResolveThenableJobTask ！
          // 但不好意思，从代码里去理解的话，隔着 c++ 这块臭石头，不方便我们理解，
          // 我们的目的是理解其中的逻辑，不是理解c++语法！
          // 感谢源代码作者留下来的注释吧，到ECMAScript标准里寻找答案吧：
          // https://tc39.es/ecma262/#sec-promise-resolve-functions
          const task = NewPromiseResolveThenableJobTask(
            promise, UnsafeCast<JSReceiver>(resolution),
            UnsafeCast<Callable>(then));

          // 将 task 加入微队列
          return EnqueueMicrotask(task.context, task);
        }
    }
```

标准里规定：

```txt
NewPromiseResolveThenableJob ( promiseToResolve, thenable, then )

The abstract operation NewPromiseResolveThenableJob takes arguments promiseToResolve (a Promise), thenable (an Object), and then (a JobCallback Record) and returns a Record with fields [[Job]] (a Job Abstract Closure) and [[Realm]] (a Realm Record). It performs the following steps when called:

1. Let job be a new Job Abstract Closure with no parameters that captures promiseToResolve, thenable, and then and performs the following steps when called:
  a. Let resolvingFunctions be CreateResolvingFunctions(promiseToResolve).
  b. Let thenCallResult be Completion(HostCallJobCallback(then, thenable, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »)).
  c. If thenCallResult is an abrupt completion, then
    i. Return ? Call(resolvingFunctions.[[Reject]], undefined, « thenCallResult.[[Value]] »).
  d. Return ? thenCallResult.
2. Let getThenRealmResult be Completion(GetFunctionRealm(then.[[Callback]])).
3. If getThenRealmResult is a normal completion, let thenRealm be getThenRealmResult.[[Value]].
4. Else, let thenRealm be the current Realm Record.
5. NOTE: thenRealm is never null. When then.[[Callback]] is a revoked Proxy and no code runs, thenRealm is used to create error objects.
6. Return the Record { [[Job]]: job, [[Realm]]: thenRealm }.
```

微队列要执行的就是 job, 只看第一点就可以了，其他的对我们的理解没啥影响。

第一点说的就是，当微队列里的 job 被拿出来调用时，会依次执行 a b c d。

步骤 a，会根据 promiseResolve 创建 resolvingFunctions。

步骤 b, 就是执行 HostCallJobCallback，把它的结果封装在 Completion 里；

步骤 c，就是看看 Completion 是不是正常的 Completion, 对应就是说 promiseToResolve 是不是正常的执行 resolve 了，
不是的话，就要将 promiseToResolve 变成 rejected 状态了

步骤 d, 就是一切按照预期正常 resolve 了，就把 Completion 返回就好了；

而核心步骤，是步骤 b。

标准规定：

```txt
HostCallJobCallback ( jobCallback, V, argumentsList )

1. Assert: IsCallable(jobCallback.[[Callback]]) is true.
2. Return ? Call(jobCallback.[[Callback]], V, argumentsList).
```

说人话就是：

将函数 jobCallback 的 this 设置为 V, 然后执行 jobCallback(argumentsList)

结合具体情景，我们具体说说这事儿：

```js
const t = new Promise((resolve, reject) => {
  const a = {
    then: (r) => r(100),
  };

  resolve(a);
});

// 如果是这个情形，
// NewPromiseResolveThenableJob ( promiseToResolve, thenable, then )
//   promiseToResolve 就是 t
//   thenable 就是 a
//   then 就是 a.then
//
// 上述js代码执行后， NewPromiseResolveThenableJob 会产生一个job，加入到
// 微队列中；
//
// 微队列在未来取出job执行，会执行
// HostCallJobCallback(then, thenable, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »)
//
// 换成我们具体的数据就是
// HostCallJobCallback(a.then, a, resolve, reject)
//
// 再把 HostCallJobCallback 翻译一下就是
// a.then.call(a, resolve, reject)
//
// 一旦执行，会发生什么呢？
// 没错，t 会变成 fulfilled 状态，值是 100 ！
//
// 而上述过程，是在一个微任务里完成的，不是上述js代码执行后，立即执行的，因此如果resolve一个定义了then属性
// 的对象，t.then(callbackA)，callbackA会延迟一个微任务执行！明面上看，是在定义t的时候，t就resolve了，
// 实际上是在一个微任务里resolve的！
```

```js
const t = new Promise((resolve, reject) => {
  const p = Promise.resolve(100);
  resolve(p);
});

// 如果是这个情形，
// NewPromiseResolveThenableJob ( promiseToResolve, thenable, then )
//   promiseToResolve 就是 t
//   thenable 就是 p
//   then 就是 Promise.prototype.then
//
// 上述js代码执行后， NewPromiseResolveThenableJob 会产生一个job，加入到
// 微队列中；
//
// 微队列在未来取出job执行，会执行
// HostCallJobCallback(then, thenable, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »)
//
// 换成我们具体的数据就是
// HostCallJobCallback(Promise.prototype.then, p, resolve, reject)
//
// 再把 HostCallJobCallback 翻译一下就是
// Promise.prototype.then.call(p, resolve, reject)
//
// 这个函数执行之后，会发生什么呢？
// 没错，在 p 注册了一个 then 回调；
// 根据then回调和微队列的联系，这也意味着 resolve 函数作为一个微任务，加入到微队列了；
// 等到 resolve 作为微任务被执行的时候，就会将 t 设置为 fulfilled 状态，值为 100；
//
// 这种情况下，t 经历了2个微任务变为fulfilled状态，
// 所以 t.then(callbackA), callbackA会延迟两个微任务才执行！
```

## Torque

V8 内部实现了一门叫做 Torque 的语言，用这个语言定义了很多 js 内置对象，目的是提高速度，
Torque 编译之后会得到机器码，减少了 js 和 cpp 之间互调的开销，提高了 js 执行的速度。

你可能在阅读 [v8 源码 | promise-resolve.tq 定义](https://github.com/v8/v8/blob/main/src/builtins/promise-resolve.tq) 时，看到代码里有 `deferred` 关键字，以为是延迟执行的意思，想当然以为这个和 resolve
延迟现象有关，很抱歉，我当初就是这么想的，但实际上，`deferred`关键字只是告诉编译器，被`deferred`修饰的代码块
被执行的概率很小，可以在编译的时候做优化，和延迟执行没有关系。

## snippets

可能你平时都是这么用的:

```js
const t = Promise.resolve(100);
new Promise((resolve) => {
  t.then((v) => resolve(v));
});
```

实际上，这也是一样的：

```js
const t = Promise.resolve(100);
new Promise((resolve) => {
  t.then(resolve);
});
```

## ECMA标准解读
[ECMAScript 标准](https://tc39.es/ecma262/#sec-hostcalljobcallback)，接下来我们根据该标准，讲一下Promise有关的API都做了什么事情。

### `const t = new Promise((resolve, reject) => {})` 的 resolve 和 reject 
[标准中 resolve 的定义](https://tc39.es/ecma262/#sec-promise-resolve-functions)

`resolve(A)`执行步骤：
1. 获取`(resolve, reject) => {}`闭包函数，记作F;
2. 断言 F 的 `[[Promise]]` 属性值是一个 Promise 类型；
3. 令 promise 为 F 的 `[[Promise]]` 属性值, 也就是我们标题中的 t ;
4. 令 alreadyResolved 为 F 的 `[[AlreadyResolved]]` 属性值;
5. 如果 alreadyResolved 是 true，返回 undefined;
6. 将 F 的 `[[AlreadyResolved]]` 属性设置为 true;
7. 如果 promise === A：
   1. 令 selfResolutionError 为新创建的TypeError对象
   2. 执行 `RejectPromise(promise, selfResolutionError)`
   3. 返回 undefined 
8. 如果 A 不是一个对象：
   1. 执行 `FulfillPromise(promise, A)`
   2. 返回 undefined 
9. 令 then 为 A.then 
10. 如果 then 不是一个函数：
    1.  执行  `FulfillPromise(promise, A)`
    2.  返回 undefined 
11. 执行 `NewPromiseResolveThenableJob(promise, A, then)`得到一个闭包函数，记作 job;
12. **将 job 加入微队列** （引发困惑的地方就在这里， 没有立即执行job!）
13. 返回 undefined

[标准中 FulfillPromise 的定义](https://tc39.es/ecma262/#sec-fulfillpromise)

`FulfillPromise(promise, A)`执行步骤：
1. 断言promise是**pending**状态；
2. 令 reactions是promise的`[[PromiseFulfillReactions]]`属性值。本质上，reactions就是一个列表，列表中的每一项都是一个函数，函数入参就是promise的内部值。
3. 令 value 是 promise 的 `[[PromiseResult]]`属性值，也就是promise的内部值。
4. 将 promise 的 `[[PromiseFulfillReactions]]` 属性设置为 undefined.
5. 将 promise 的 `[[PromiseRejectReactions]]` 属性设置为 undefined.
6. 将promise的状态设置为 **fulfilled**, 将value设置为 A.
7. 执行 `TriggerPromiseReactions(reactions, value)`
8. 返回 UNUSED

[标准中 TriggerPromiseReactions 的定义](https://tc39.es/ecma262/#sec-triggerpromisereactions)

`TriggerPromiseReactions(reactions, value)`执行步骤：
1. 遍历 reactions 的每一项 reaction:
   1. 生成一个闭包函数，函数内执行`reaction(value)`
   2. 将闭包函数加入到微队列
2. 返回UNUSED

[标准中 NewPromiseResolveThenableJob 的定义](https://tc39.es/ecma262/#sec-newpromiseresolvethenablejob)

`NewPromiseResolveThenableJob(promise, A, then)`执行步骤：
1. 创建一个闭包函数job，该函数内部会执行如下步骤：
   1. 创建一个 resolve 和 一个 reject 方法，resolve 等同于 promise 在创建的时候 `new Promise((resolve, reject) => {})`里边的 resolve，reject 同理。
   2. 把then函数的this设置为 A，然后执行 `then(resolve,reject)`, 返回then的执行结果
2. 返回job


[标准中 reject 的定义](https://tc39.es/ecma262/#sec-promise-reject-functions)

`reject(A)`执行步骤：
1. 获取`(resolve, reject) => {}`闭包函数，记作F;
2. 断言 F 的 `[[Promise]]` 属性值是一个 Promise 类型；
3. 令 promise 为 F 的 `[[Promise]]` 属性值, 也就是我们标题中的 t ;
4. 令 alreadyResolved 为 F 的 `[[AlreadyResolved]]` 属性值;
5. 如果 alreadyResolved 是 true，返回 undefined;
6. 将 F 的 `[[AlreadyResolved]]` 属性设置为 true;
7. 执行`RejectPromise(promise, A)`
8. 返回 undefined 


[标准中 RejectPromise的定义](https://tc39.es/ecma262/#sec-rejectpromise)

`RejectPromise(promise, A)`执行步骤：
1. 断言promise是**pending**状态；
2. 令 reactions是promise的`[[PromiseRejectReactions]]`属性值。本质上，reactions就是一个列表，列表中的每一项都是一个函数，函数入参就是promise的内部值。
3. promise 的 `[[PromiseResult]]`属性的值设置为A
4. promise 的 `[[PromiseFulfillReactions]]` 属性的值设置为 undefined.
5. promise 的 `[[PromiseRejectReactions]]` 属性的值设置为 undefined.
6. 将promise的状态设置为 **rejected**
7. 如果 promise 的 `[[PromiseIsHandled]]`属性值是 false, 执行 `HostPromiseRejectionTracker(promise, "reject")`.
8. 执行 `TriggerPromiseReactions(reactions, A)`
9. 返回 UNUSED

`HostPromiseRejectionTracker`在标准中并没有给出具体的步骤，而是交给实现的厂商决定，要做的事情就是告诉开发者promise处于rejected状态了，你没有提供handler，也就是忘记执行 then 或者 catch 了。


### `Promise.prototype.then` 
[标准中 Promise.prototype.then的定义](https://tc39.es/ecma262/#sec-promise.prototype.then)

`promise.then(onFulfill, onReject)`的执行步骤：
1. 相当于采用下面的写法，创建一个 resultCapability 对象：
   ```js 
   const resultCapability = {
    promise: null,
    resolve: null,
    reject: null,
   }
   resultCapability.promise = new Promise((resolve, reject) => {
      resultCapability.resolve = resolve;
      resultCapability.reject = reject;
   })
   ```
2. 执行 `PerformPromiseThen(promise, onFulfill, onReject, resultCapability)`, 并返回执行结果


[标准中PerformPromiseThen的定义](https://tc39.es/ecma262/#sec-performpromisethen)

`PerformPromiseThen(promise, onFulfill, onReject, resultCapability)`执行步骤：
1. 断言 promise 是 Promise对象
2. resultCapability如果不存在，设置一个resultCapability变量，初始值为undefined 
3. onFulfill不是函数，就赋值为空函数
4. onReject不是函数，就赋值为空函数
5. 创建一个函数 fulfillReaction，函数等效于下面的定义：
   ```js
      function callback(value) {
        try {
          const v = onFulfill(value)
          resultCapability.resolve(v)
        } catch(err) {
          resultCapability.reject(err)
        }
      }
    ```
6. 创建一个函数 rejectReaction，函数等效于上面的定义
7. promise如果是 **pending**状态：
   1. 往 promise 的 `[[PromiseFulfillReactions]]` 属性代表的列表末尾，加入fulfillReaction
   2. 往 promise 的 `[[PromiseRejectReactions]]` 属性代表的列表末尾，加入一个rejectReaction
8. promise如果是 **fulfilled**状态:
   1. 令 value 是 promise的内部值，即 promise 的 `[[PromiseResult]]` 属性值 
   2. 生成一个闭包函数，函数内部执行`fulfillReaction(value)`, 将该闭包函数加入到微队列
9. 执行：
   1.  断言 promise 是 **rejected**状态 
   2.  令 reason 为 promise 的 `[[PromiseResult]]`属性值 
   3.  如果 promise 的 `[[PromiseIsHandled]]`属性值是 false, 执行 `HostPromiseRejectionTracker(promise, "handle")`
   4.  生成一个闭包函数，函数内部执行`rejectReaction(reason)`, 将该闭包函数加入到微队列
10. promise 的 `[[PromiseIsHandled]]` 属性值设置为 true.
11. resultCapability如果是 undefined, 返回 undefined 
12. 返回 `resultCapability.promise`


### `Promise.prototype.catch` 
等效于 `Promise.prototype.then(undefined, onReject)`

[标准中Promise.prototype.catch的定义](https://tc39.es/ecma262/#sec-promise.prototype.catch)

## 参考

[ECMAScript 标准](https://tc39.es/ecma262/#sec-hostcalljobcallback)

[V8 | Torque language](https://v8.dev/docs/torque)
