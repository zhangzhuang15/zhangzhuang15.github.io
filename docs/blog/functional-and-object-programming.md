---
title: "结合实际经验，聊聊函数式编程和面向对象编程"
page: true
aside: true
---

# 结合实际经验，聊聊函数式编程和面向对象编程
在2024年年底，我接到一个开发需求，只增加三个新接口，老接口沿用，但是页面整体的设计风格变了，需要重构前端代码。正好借着这个机会，我尝试了一次面向对象的编程风格，得到了一些经验，在这篇文章介绍下。

## 一个非常头疼的问题
前端页面在构造请求参数，发送请求，解析请求结果，存在非常头疼的问题。

在构造请求参数的时候，这些参数来自于用户从页面中做出的选择，得到的这些参数往往只是原始参数，不能用来发送请求。在发送请求之前，需要整理参数。比如以下几点：
- 校验参数的合法性。比如用户选择的开始时间是否早于结束时间，开始时间是否比某个要求的业务时间点早，开始时间和结束时间之间是否相差指定的天数上限。
- 参数转换。用户在页面上选择了一个时间，在传给后端的时候，必须转化指定的形式，比如“20240812”；用户选择了多个选项，得到的是一个数组，但是后端要求是一个英文逗号连接的字符串；前端组件返回的是一个数字字符串，比如“123”，后端要的是整数123.
- 特定逻辑处理。用户选择【近7日】，接口要传 `dateType: "recent7Days"`, 还要传 `startDate` 和 `endDate`，并且`endDate`要设置为昨日的时间，`startDate`和`endDate`要一模一样。但是，当用户直接选择开始时间和结束时间时，`dateType: "custom"`， `startDate` 和 `endDate` 就要传用户选择的开始时间和结束时间；当用户在一个特定页面，选择【近7日】的时候， `startDate` 和 `endDate` 要传7天前的时间，和昨天的时间。。。总之，很多接口存在历史问题，后端改不动，前端要做妥协、适配。
- 缺省值。页面上用户不做选择，对应绑定的前端变量就采用默认值，比如输入框为空，默认值就是“”, 城市选择器默认选择全部城市，对应的城市ID就设置为-1，但是，后端的接口要求，如果是全部城市，前端应该不传城市ID这个字段，我们就不能直接传-1，而是把请求参数里的城市ID字段删除。

在发送请求中，也会遇到很多重复的事情：
- 请求开始的时候，页面要触发loading效果
- 请求结束的时候，页面要取消loading效果
- 请求返回的时候，要根据返回值的code码做出效果，如果是0，给出一个toast提示成功，否则提示失败，根据code发送埋点请求，方便后端查看业务数据加载成功率

解析请求结果也会有问题：
- 接口降级，返回值异常要处理
- 接口返回的字段值是 null 或者 没有返回这个字段，解析的时候要兼容。特别是字段是数组类型，后端特别爱返回null，而不是空数组。 Fuck you Java!
- 返回值缺少的字段，有的逻辑是要前端补充一个默认值，比如0，空字符串，有的时候就不用处理，页面直接展示“--”，表示数据不存在，而不是数据为默认值。


上述这些事情，页面每一次发送请求都会涉及，如果为每次发送请求，定义一个函数，再把这些逻辑写一遍，那就是非常非常头痛的问题。如果某个环节需要追加一些操作，比如加入新的埋点请求，那就要在零散的代码里，找到位置，再加入代码。

就像swift在解决异步编程提倡结构化的异步编程，我也该想一些方法，将上述的事情结构化。

## 插件化
插件系统在前端是一个非常深入人心的概念，webpack/rollup/vite/postcss/vscode/remark 都是基于插件系统的思想打造的。想想发送请求的整个流程，也是一个插件系统。有用来校验入参的插件，有用来修改入参的插件，有填充入参的插件，有发送http请求的插件，有加载loading动效的插件，有发送埋点请求的插件，有转化返回值格式的插件。我们只需要打造一个插件驱动程序，让这些插件运行起来，整个请求流程就走通了。不是么？

## 函数式编程 vs 面向对象式编程
要实现上面的插件，以及驱动插件运行的程序，我们用哪个编程思想更好，函数式，还是面向对象式 ？

我们必须要思考，这两种模式的边界。

函数式编程。好处有几个：
- 每个函数，入参，出参，都是不可变的，没有副作用，搞出来的程序非常安全。
- 非常灵活，强调组合。如果要复用某个功能，不是继承这个函数，而是将这个函数组合到另外一个函数。
- 逻辑简单、明确。一个函数通常就做一件事，高内聚。
- 对于经常要变化的逻辑，处理速度快，只需要定义一个新函数，替换旧函数即可。

坏处其实也有：
- 代码虽然可以复用，但是颇费笔墨，必须显式把函数组合到另外一个函数
- 逻辑拆分太简单，就会太过零散，让函数看起来像一个个抽象的数学运算，不方便理解
- 函数多了，不太好管理，往往面临一个问题，就是从一抽屉里的函数中捞出几个函数，组合成我们想要的功能函数
- 性能有牺牲。为了保证函数的单纯，存在不少值拷贝的操作。

再看看面向对象式编程。好处也有：
- 代码复用度高。你只需要继承一个类，就能复用这个类的函数，而不用显式再定义一遍。如果有不同，只需要把个别函数override一下即可。
- 因为按照对象的逻辑组织数据和功能，代码更符合人类的直观，更容易理解
- 数据作用范围隔离。

坏处也有：
- 代码虽然复用度高，但是如果复用的功能里，有很多要采用新的实现，需要override被继承的函数，可复用的越多，override越少，反之，override会很多，代码量和重新定义一个类没有区别；
- 无法拥抱变化。如果在继承体系中，最上层的类所涉及到的功能发生变化，比如要删除某个功能、修改某个功能的实现，就必须要考量这些变动对下层类的影响，通常情况下，不会直接在原来的类做修改，而是重新定义一个顶层的类，然后把原来的类都迁移过来，然后代码里也要替换成新的类，改动量非常多。
- 副作用大。使用继承实现代码复用，而非显式引入，会导致在子类中，看不到函数声明，但在运行的时候会执行到这些函数。排查问题的时候，程序开发者就要沿着继承链路排查问题，查看那些看不到的函数到底在哪里实现，在哪里执行。查看某个功能的实现，要翻看好几个类，非常痛苦。
- 耦合度大，在一套继承体系里的类都被耦合在一起。
- 单继承体系的语言，在复用代码的时候，会很蹩脚。比如C想使用A的代码，也想使用B的代码，A和B有部分代码是一样的，那么C只能继承A和B中的一个，然后用组合的方式引入另外一个，而另外一个类的方法都必须在C里重新定义一遍，有点冗余。
- 继承体系太深，代码需要变化的时候，就是一种负担。

根据我的经验来看，对于不会变化的内容，可以使用面向对象实现，对于总是变化的内容，采用函数式实现。就我们这个插件系统的例子看，驱动插件执行的程序的逻辑，是不变的，可以用面向对象执行。插件执行的时机也是不会变的，无非就是请求发送前执行，请求结果回来后执行。但是，在执行时机里，插件要做的事情，是容易变化的，这个地方就可以用函数式编程搞定。

于是，有了这样的代码：
```ts [runnerPlugin.ts]
export interface RunnerPlugin {
    name: string,
    before: (...args: any[]) => Promise<any>,
    after: (...args: any[]) => Promise<any>,
    overrideParams?: boolean,
    overrideResult?: boolean,
    debug?: boolean,
    exitAtOnce?: boolean,
    exit?: boolean,
    [s: string]: any
}

export class DebugPlugin implements RunnerPlugin {  
    public name = 'debug'
    constructor(public debug?: boolean) {}
    async _before(...args: any[]): Promise<any> {
        return Promise.resolve()
    }
    async _after(...args: any[]): Promise<any> {
        return Promise.resolve()
    }
    async before(...args: any[]) {
        if (this.debug) {
            console.log(this.name, ' before execute: ', args)
        }
        return await this._before(...args)
    }
    async after(...args: any[]) {
        if (this.debug) {
            console.log(this.name, ' after execute: ', args)
        }
        return await this._after(...args)
    }
}

export class LoadingPlugin extends DebugPlugin {
    public name = 'loading'
    constructor(public debug?: boolean) {
        super(debug)
    }

    async _before() {
        ui.showLoading({ message: '加载中' })
    }
    async _after() {
        ui.hideLoading()
    }
}

export class CodePlugin<T extends { code: number, msg?: string }> extends DebugPlugin {
    public name = 'code'
    public exit = false
    public overrideResult = false
    constructor(private value: any,public debug?: boolean) {
        super(debug)
    }
    async _after(res: T) {
        if (res.code !== 0) {
            res.msg && ui.showToast({ message: res.msg, type: 'fail' })
            this.exit = true
            this.overrideResult = true
            return this.value
        }
    }
}

export class PagePlugin<K, T extends { code: number, msg?: string, data: { data: K[]}}> extends DebugPlugin {
    public name = 'page'
    constructor(private pageSize: number, private currentPage: number, private updater: (incr: number) => void, public debug?: boolean) {
        super(debug)
    }
    async _after(res: T) {
        const { data: list } = res.data 
        if (list.length === this.pageSize) {
            this.updater(1)
        } else {
            this.updater(0)
            if (this.currentPage !== 1) {
                setTimeout(() => ui.showToast({ message: '没有更多数据了', type: 'text' }), 1000)
            }
            
        }
    }
}

export class ListPlugin<J, K, T extends { code: number, msg?: string, data: { data: K[]} }> extends DebugPlugin {
    public name = 'list'
    public overrideResult = true
    constructor(private prev: J[], private mapper: (v: K) => J, public debug?: boolean) {
        super(debug)
    }
    async _after(res: T) {
        const { data: list } = res.data
        return [...this.prev, ...(list?.map(this.mapper) || [])]
    }
}

export class ParamTransformPlugin extends DebugPlugin {
    public name = "paramTransform"
    public overrideParams = true 
    constructor(private fieldName: string, public transformer: (v: any) => any, public debug?: boolean) {
        super(debug)
    }
    async _before(params: Record<string, any>): Promise<any> {
        if (params[this.fieldName] !== undefined) {
            params[this.fieldName] = this.transformer(params)
        }
        return [params]
    }
}
```

```ts [runner.ts]
import type { RunnerPlugin } from "./runnerPlugin.ts";

export class Runner<T extends (...args: any) => any> {
    private _queue: RunnerPlugin[] = [] 
    private _params: Parameters<T> | [] = []
    private _bailoutValue: any = null

    constructor(private _fn: T) {}

    use(plugin: RunnerPlugin | RunnerPlugin[]) {
        this._queue = [...this._queue, ...(Array.isArray(plugin) ? plugin : [plugin])]
        return this
    }

    params(...args: Parameters<T>) {
        this._params = args 
        return this
    }

    share<P extends (...args: any) => any>(runner: Runner<P>) {
        this._queue.forEach(plugin => {
            runner.use(plugin)
        })
        return runner
    }

    bailout(value: any) {
        this._bailoutValue = value 
        return this
    }

    async run(...args: Parameters<T> | []) {
        if ((args as any[]).length > 0) {
            this._params = args
        }

        let params = this._params as any[]
        for (const plugin of this._queue) {
            const res = await plugin.before(...params)
            if (plugin.exitAtOnce) {
                return this._bailoutValue
            }

            if (plugin.overrideParams) {
                params = res
            }

            if (plugin.exit) {
                return this._bailoutValue
            }
        }
        let res = await this._fn(...params)
        for (const plugin of this._queue) {
            const _res = await plugin.after(res) 
            if (plugin.exitAtOnce) {
                break
            }
            if (plugin.overrideResult) {
                res = _res
            }
            if (plugin.exit) {
                break
            }
        }
        return res
    }
}
```

```ts [example.ts]
import { LoadingPlugin, CodePlugin, PagePlugin } from "./runnerPlugin.ts"

function loading() {
  return new LoadingPlugin();
}

function code<T>(val: T) {
  return new CodePlugin(val);
}

function page(pageSize: number, curerntPage: number, updater: Function) {
  return new PagePlugin(pageSize, currentPage, updater);

}

function runner(fn: Function) {
  return new Runner(fn)
}


function getList(params: {
  currentPage: number,
  pageSize: number,
}) {
  return httpRequest({
    url: '/api/list',
    method: 'post',
    params
  });
}

var vueInstance;
async function updateList() {
  const list = await runner(getList)
    .use([
      loading(),
      code([]),
      page(
        vueInstance.pageSize, 
        vueInstance.currentPage, 
        (increasePage: number) => {
          vueInstance.currentPage += increasePage;
        }
      ),
    ])
    .params({
      currentPage: vueInstance.currentPage,
      pageSize: vueInstance.pageSize
    })
    .run();

  vueIntance.list = list;
}
```

如果你去看`rxjs`，它内部的基础都是用面向对象编写的，但是暴露给应用者使用的算子函数，都是函数式。当然，Runner的逻辑也可以用函数式实现，但是应用者在使用的时候，就无法做到链式调用了，而是嵌套式函数形式：
```ts 
runner()([loading(), code([])])({ currentPage, pageSize })();
```

我想，你不会喜欢这种嵌套式地狱。

## 面向对象不是万能药
不要什么都一条路走到黑，只用面向对象。只有你面临的内容不会变化的时候，你可以用面向对象，正因为它不会变化，你才能够复用代码。如果它经常变化，今天写的类，隔几天就变了，复用这种的类，不要用继承式复用，要用组合式复用。

继承和组合，谁更好呢？ 继承的思考方式是事物的相同性，它乐观的认为事物是一样的，今天一样，明天也一样，如果不一样，就另起炉灶，重新搭建一套继承体系，替换旧的继承体系。组合的思考方式是事物的差异性，它认为事物是不同的，尽管今天A需要的能力和B已经实现的能力一样，但是A和B总归是两种东西，不能把A当作B处理，A和B的能力相同，并非来自A对B的继承，而是A对B能力的借用。从迎接变化的角度看，组合更优。

从修改角度上看，组合式修改起来，相对少一些。继承式要是修改，就是从新搭建一套继承体系。而组合式不存在这种问题，如A组合B，只需要新建一个类C，然后A在外部类注入的环节，将B替换成C即可。

从代码逻辑流来看，组合式要用到哪个类的能力，就必须显式创建这个类的对象，显式调用这个对象的方法，逻辑流没有暗门，更清楚。

但是从代码复用来看，比如功能非常稳定的那种需求（像Java语言的标准库），继承式更胜一筹。

不过，按照现代编程语言的设计趋势，以及事物的本质来看，什么都是变化的，应该拥抱更利于处理变化的方式——组合式。组合优于继承，接口优于子类。