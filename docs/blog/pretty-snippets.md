---
title: "可参考借用的代码片段"
page: true
aside: true
---

# 可参考借用的代码片段

## setup-cleanup

```ts
const listeners = [];

function loadListener(listener) {
  // setup
  listeners.push(listener);
  const index = listeners.length - 1;

  // cleanup
  return function removeListener() {
    listeners.splice(index, 0, 1);
  };
}
```

## plugin apply

```ts
const baseConfig = {
  name: "config",
  beforeRun: [],
  afterRun: [],
};

const helloPlugin = (config: typeof baseConfig) => {
  config.beforeRun.push(() => {
    console.log("hello world");
  });
};

const byePlugin = (config: typeof baseConfig) => {
  config.afterRun.push(() => {
    console.log("Bye bye");
  });
};

function resolveConfig(baseConfig, ...configPlugin) {
  configPlugin.forEach((plugin) => plugin(baseConfig));
}

// 精髓在于，逻辑上是config使用plugin，config是主动调用的一方，
// 但实现上，这个关系被反转了，plugin是主动调用的一方，config
// 是被动的一方。
//
// 因为config本身的数据结构是更稳定的一方，作为被调用的一方更合适。
```

## one-step one-dispatch

```ts
interface Callable {
  (...args: any[]): any;
}

function schedule(): number;

function dispatcher(calls: Callable[]) {
  let start = 0;

  function dispatch(i: number, value: any) {
    const call = calls[i];

    if (call) {
      const result = call(value);
      // 通过一个调度方式，获取下一个要执行的任务，
      // 这就是 one-step
      const next = schedule();
      // 在上个任务计算结束后，再去执行下一个任务，
      // 这就是 one-dispatch
      return dispatch(next, result);
    }

    return value;
  }

  return function () {
    return dispatch(0, null);
  };
}

// 不使用迭代去执行任务，而是在一个任务执行完成后，
// 利用递归，执行下一个任务，感觉上就像是走完一步，
// 想想下一步怎么走，然后再走出去， one-step, one-dispatch,
//
// 有一点不太爽的地方是，dispatch 的调用者，没办法控制
// one-dispatch触发的时机
```

## one-step one-dispatch in control

```ts
type Middleware = (context: any, next?: Function) => any;

const compositeMiddlewares = (middlewares: Middleware[]): Middleware => {
  return function (context: any, next?: Function) {
    let index = -1;
    return dispatch(0);

    function dispatch(i: number) {
      if (index >= i) return Promise.reject("call next many times");

      index = i;

      let middleware: Middleware | Function | undefined = middlewares[index];

      if (index === middlewares.length) middleware = next;

      if (!middleware) return Promise.resolve();

      try {
        return middleware(context, dispatch.bind(null, i + 1));
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
};

// 代码实现来自 @koa/composite,
// 这个版本，用户在定义middleware的时候，可以在函数内
// 调用 next 来控制下一个 dispatch

const middlewareA = (context, next) => {
  console.log("ok");
  next();
  console.log("finish");
};

const middlewareB = (context, next) => {
  console.log("end");
  next();
};

const middleware = compositeMiddlewares([middlewareA, middlewareB]);

middleware({ data: 10 }, () => {
  console.log("wow");
});
```

## promise link

```ts
function link(initialValue, works) {
  let promise = Promise.resolve(initialValue);

  for (const work of works) {
    promise = promise.then((v) => work(v));
  }

  return promise;
}
```

未完待续...

<Giscus />
