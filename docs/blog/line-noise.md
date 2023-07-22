---
title: "学习Redis有感：开发一个npm package"
page: true
aside: true
---

# 学习Redis有感：开发一个npm package

## 小摘要
本文会聊到：
- linenoise——一个 c library
- 用Rust开发nodejs的addon扩展模块
- Rust混合编译 c library
- 手动给npm package 编写 .d.ts 声明  
- 让package同时支持 esModule 和 commonJs 的 node 
- 发布npm package的经过和坑点
- 录制终端操作的动态图
- npm package 官网 `README.md` 的图片失效问题

## 学习Redis怎么启发我的
最近，“前端已死”被嚷来嚷去。咱也不是啥前端行业领军人物，心里不慌是骗人的，可又慌不到哪里去。

学啥不是学啊，要不然咱也瞧瞧后端的东西，哈哈哈哈。

后端那么多东西，从什么学起呢？嗯嗯，打开BOSS直聘，瞄一眼后端岗位都要求啥技能。

嗯嗯，有要求Redis的，妥了，就开始学Redis吧。

`要说学习哪家强，就去B站小课堂`。

在B站上找了一个课程视频，边看边操作，花了1天的时间，把基本的概念和命令过了一遍。

在操作的过程中，我发现一个特别有意思的地方。

在 redis 交互终端输入命令的时候，会带有命令提示，还有命令自动补全，还能检索历史命令。

比如说你输入 `SET` 的时候，后边就会出现一串字符，告诉你后边的参数都有什么，都是什么意思:
![command hint from redis](/redis-cli-hint.png)

比如说你输入 `set`，然后按下Tab键，就会依次显示 `SET` `SETBIT` `SETEX` `SETNX` `SETRANGE` 等等。

比如说你按下⬆️，就可以查看上次你输入的命令。

列举的三个例子，除了命令提示外，zsh里都有，只是表现形式不太相同。

我就纳闷儿了，这种效果是Redis原生实现的，还是调用zsh的一些功能实现的？

看了下redis源码，发现它使用了一个c库 `linenoise`实现的。

这个`linenoise`由redis作者操刀实现，并且在 `MongoDB` `Android` 也有用到，是对 `readline`的一种替代。

一个前端er，为了吃上这个c库提供的功能，铁定不能去编写c代码（我还挺喜欢c的😂），所以我就想有没有现成的npm库做了封装。

在npm registry上搜索一番，没有找到。

然后一个非常令我兴奋的念头在脑中闪现：要不，咱给它封一个？


## 思路 
我起初有两个方向，一个是开发`wasm`，另一个是开发`node扩展模块`。

但是我否定了wasm的做法，因为之前我给一个vscode插件提供了PR，在里面接触了wasm，玩儿过不新鲜，就不搞wasm了。
> 要不是这个插件的issue迟迟不解决，阻碍我使用，我才不会贡献代码😤

对于node扩展模块，我没开发过，只听说过。上班坐地铁看手机，看过相关的技术文章，知道有这么一个事儿。

通过搜索大法，我得知开发一个node扩展模块，可以使用`cpp`，也可以使用`Rust`的`neon crate`。

我搞不定`cpp`，只好选择使用`Rust`开发。
> 其实我也可以使用 `cpp`，就是开发体验不爽，就不恶心自己了

然后整体的规划就出来了：**将 c library 编译成动态库，在 Rust 中定义好 c 函数接口，然后在 Rust 自己的函数中搭建起桥梁，打通 c 和 nodejs。**

不明白啥意思？看个例子吧。

```rust 
use neon::prelude::*;
use libc::{c_char, c_int, c_void, size_t};

#[link(name = "linenoise", kind = "static")]
extern "C" {
    fn linenoise(prompt: *const c_char) -> *mut c_char;
}

fn prompt(mut cx: FunctionContext) -> JsResult<JsString> {
    let mut prompt = String::from("");

    if cx.len() > 0 {
        let arg: Handle<JsString> = cx.argument(0).unwrap();
        prompt = arg.value();
    }

    let mut rust_string: String = String::from("");

    unsafe {
        let c_prompt = CString::new(prompt).unwrap();
        let user_input = linenoise(c_prompt.as_ptr());

        rust_string = CStr::from_ptr(user_input).to_string_lossy().into_owned();

        #[cfg(debug_assertions)]
        println!("[Rust side debug message]rust_string: {rust_string}");
    };

    Ok(cx.string(rust_string))
}
```

`extern “C”`里边定义的函数，就是 `linenoise` library中的c函数，借助`libc crate`，保证编译出来的结果，和library自身的c函数ABI一致。在 Rust 的函数中，如果调用 `linenoise` 函数，就可以将上层数据传递给 c 函数层。

在 `prompt`函数中，利用 `neon crate` 提供的 `cx` 可以获取到js代码层传入的函数参数，经过封装的逻辑处理（主要是将Rust数据结构转化为c数据结构），调用了 `linenoise`函数，将数据传给c函数层。一波操作下来，就实现了js层到c层的数据传递。

这下你就应该更明白了一些吧。

接下来，我们说点更具体的东西😏。

## Rust neon crate 开发node扩展模块 

安装neon脚手架： `npm install -g neon-cli` 
创建项目： `neon new @jasonzhang15/line-noise` 

之后，项目结构大致如下：
```txt 
.
├── README.md
├── lib
│    └── index.js
│   
├── native
│   ├── Cargo.toml
│   ├── build.rs
│   └── src
│        └── lib.rs
└── package.json    
```

`lib/index.js`是module的入口；

`native`是使用Rust开发node扩展的地方，典型的`Cargo crate`结构：
  - `build.rs` , 制定 `cargo build`之前的一些操作。
    > 编译 linenoise c library 的工作，就放在这里
  - Cargo.toml , 相当于 package.json的作用
  - src/lib.rs , 编写node扩展模块的地方。

开发好`native/src/lib.rs`之后，在项目根目录下，执行`neon build --release`，生成node扩展模块。
> 在 native 目录下，就多出来一个 index.node 的文件，这个就是我们需要的扩展模块。

怎么将这个 index.node 导出，我们在后边单独的一节去说，接下来简单说一下 `native/src/lib.rs` 怎么去写.

### `lib.rs` 简单介绍
假设我们要在node扩展模块中实现这样的函数：
```ts
function add(a: number, b: number): number {
     return a + b; 
}
```

在 `lib.rs`就该这样写：
```rust 
use neon::prelude::*;

fn add_rust(mut cx: FunctionContext) -> JsResult<JsNumber> {
    // 获取第一个参数
    let a = cx.argument::<JsNumber>(0).unwrap();

    // 获取第二个参数
    let b = cx.argument::<JsNumber>(1).unwrap();

    let c = a + b;

    Ok(cx.number(c))
}

register_module!(mut cx, {
    // "add" 就是导出后，js端的函数名
    cx.export_function("add", add_rust)
});
```

在js文件中这样使用node扩展模块（假设编译成功后，产生了index.node文件）

```js 
const addon = require("index.node");

const c = addon.add(1,2);
```

超简单，对不对？


## 如何导出 index.node 
导出需要在两个地方做工作。

一个是 `lib/index.js`, 一个是 `package.json`。

node支持 commonJs 和 esModule, 而且后者越来越重要，在导出的时候，就必须考虑到两种形式的导出， 就不能只有一个`lib/index.js`了，要拆分`index.cjs`和`index.mjs`.

先对`package.json`做出如下的设置：
```json  
{
    "main": "lib/index.cjs",
    "exports": {
        ".": {
            "require": {
                "node": "./lib/index.cjs"
            },
            "import": {
                "node": "./lib/index.mjs"
            }
        }
    }
}
```
<br>
<br>

接下来编写`index.cjs` 和 `index.mjs`.

`index.cjs`非常简单：
```js
const lineNoise = require("../native/index.node");

module.exports = lineNoise;
```
<br>

`index.mjs`稍微麻烦一点，根据 **nodejs官网ESModule章节** 的介绍，`import` 关键字不支持直接导入 `index.node`, `require`直接支持，但是有兼容的写法：
```js  
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const lineNoise = require("../native/index.node");

export default lineNoise;
```

## 如何编写.d.ts声明文件
通常开发一个库，会使用 `typescript`编代码，然后使用`rollup`打包代码，使用`tsc`直接生成库的 .d.ts 声明文件。

这个package却很反常，我们定义的函数在 Rust 端实现，而不是js端，编译好的函数直接在 index.node 里，我们不得不手动编写声明文件。

要编写声明文件，必须要建立一个.d.ts文件，并在package.json中制定声明文件入口：
```json  
{
    "types": "./types/index.d.ts"
}
```
> 不要把 `type` 和 `types`混淆，`type`说的是你这个package是 `commonJs风格` 还是`esModule风格`.

index.d.ts里边怎么写呢？

写 `declare module` ?

写 `namespace` ?

其实我也不知道怎么写，但是我会看 `tsc` 生成的声明文件是怎样的，咱模仿它去写，八九不离十。

核心就是搞懂 `const addon = require("@jasonzhang15/line-noise")`中的 `addon` 对应于 index.d.ts 文件中哪个类型。
> "@jasonzhang15/line-noise"指的就是当前开发的package

答案出奇的简单，`addon`对应于 index.d.ts 的 `export default`.

于是index.d.ts写法大致如下：
```ts
/**
 * show prompt on terminal, wait for your input,
 * after you press Enter key, this function return
 * your input.
 * @param tip prompt
 * 
 * @example
 * ```ts
 * let myInput = prompt("Jack> ");
 * 
 * // when prompt is invoked, your terminal looks like:
 * // Jack>
 * //
 * // then, you input something, such as "echo", your
 * // terminal looks like:
 * // Jack> echo
 * //
 * // finally, you press Enter key, then prompt will return,
 * // and variable myInput is "echo"
 * ```
 */
export function prompt(tip: string): string;
```
> API注释请用 `/** */`，不要用`//`， 使用后者的话，不会有代码提示。

就是这么简单，连个`export default`都没有，一顿 export 就完事儿了。因为默认情况下，你不写`export default`，所有你 export的类型都会包含进 `export default`中，上面其实等效于：
```ts  
export default {
    prompt: function(tip: string): string;
}
```

有了这样的声明文件后，再使用这个package的时候就很舒服了：
```js  
const lineNoise = require("@jasonzhang15/line-noise");

lineNoise.prompt("hello> ");
```
在Vscode中，鼠标放在 `prompt`上，就会有声明文件中编写的函数注释。


## Rust混合编译c library  
在`build.rs`中，我们加入了编译 linenoise library的工作，那么编译好的library放在哪里呢，rust又怎么知道要将它一块儿编译？

先看看`build.rs`代码怎么写的：
```rust  
extern crate cc;
extern crate neon_build;

fn main() {
    // 无关代码直接省略了哈

    #[cfg(target_os = "macos")]
    {
        // shared_flag doesn't work, a bug from cc crate.
        // actually, lineoise will be a static library.
        
        cc::Build::new()
            .file("./linenoise/linenoise.c")
            .shared_flag(true)
            .compile("linenoise");
    }
}
```

实际上，要将linenoise库源码加入到项目中，项目结构变为：
```txt  
.
├── README.md
├── lib
│   ├── index.cjs
│   └── index.mjs
├── native
│   ├── Cargo.toml
│   ├── build.rs
│   ├── linenoise
│   │   ├── Makefile
│   │   ├── README.markdown
│   │   ├── example.c
│   │   ├── linenoise.c
│   │   └── linenoise.h
│   ├── src
│       └── lib.rs
├── package.json
└── types
    └── index.d.ts
```
看到`build.rs` 和 `linenoise.c`的位置关系，我想你就能理解`cc::Build::new().file("./linenoise/linenoise.c")`了。

那么`build.rs`执行后，编译好的library就放在 `linenoise`文件夹下了吗？

并不是的，在执行`cargo build`的时候，会生成一个 `OUT_DIR`的环境变量，表示一个文件夹路径，编译好的library就放在其中。

好了，生成library的事情清楚了，那 rust 怎么知道编译的时候，需要链接这个library呢？

答案就在 `lib.rs` 代码中：
```rust 
#[link(name = "linenoise", kind = "static")]
extern "C" {
    fn linenoise(prompt: *const c_char) -> *mut c_char;
}
```

`#[link(name = "linenoise", kind = "static")]`宏告诉rust，需要链接哪个library, rust会从系统库路径，或 环境变量`OUT_DIR`表示的路径去找。
> 对于Unix系的操作系统，系统库路径位于 /usr/lib 和 /usr/local/lib，这一点是从 `man ld` 得知的

思路那一节中，说到将linenoise编译为动态链接库，可这里是`static 静态链接库`，为什么呢？

原因是`cc crate`存在BUG，暂不支持将c代码编译为动态链接库。

另一方面，在开发这个package的时候，发现还是将linenoise library静态链接比较好，内容全都在index.node里边，使用者非常省心，不用担心删除了什么东西，造成找不到linenoise library的问题。

## 发布 NPM 
之前看过不少文章，讲如何发布package到npm上去，这一次自己真真正正过了一遍，发现并不是一帆风顺。

1. **账户**
在发布之前，你必须确保在npm官网上**注册好账户**。

<br>

2. **registry地址**
用`npm config get registry`检查一下输出的地址是否为**npm官方registry地址**。
不是的话，请立即修正。

<br>

3. **检查本地是否有你的npm账户信息**
如果你注册好npm账户信息，但你是第一次发布，那么你执行`npm publish`的时候多半会被阻止，该指令的输出结果会告诉你问题所在，并且建议你执行`npm adduser`。
你一旦执行这个指令，npm就会根据上一步骤配置的registry地址，将你导航到其身份验证网页，你完成验证后，就可以执行发布操作了。
我起初的registry地址是淘宝镜像，结果导航到淘宝镜像的一个登录页面上去了😭。

<br>

4. **正确的package名**
要注意package name起的是否正确，如果你要发布的是一个public权限，带个人scope的package，**scope必须是你的账户名**。
比如文章说的这个package名是`@jasonzhang15/line-noise`, "jasonzhang15"就是我在npm的账户名。
起初我给出的命名是`@jasonzhang/line-noise`，结果发布的时候，npm报错，称找不到合法的账户“jasonzhang”。

<br>

5. **发布**
进入到项目根目录，执行`npm publish --access public`, 就会看到下边类似输出：
![npm publish log](/npm-publish-log.png)
图中结尾的信息很有趣。npm有个双验证，会发送给你一个url，你访问之后会得到一个OTP码，将其拷贝到终端对话中，完成验证。


## 录制终端操作动态图
linenoise的效果在这里重新总结一下:
- 提供一个交互式环境
- 针对你的输入内容，给出补充提示
- 根据你的输入内容，当你按下Tab键的时候，将输入自动补全
- 在交互式环境中，提供历史输入内容的遍历

直观效果就是这样的：
![line-noise package demo](/line-noise-demo.gif)


这张动图是怎么制作的呢？

使用**asciinema**完成的。

具体操作请看[这里](/tool/brew-tool#asciinema)

## `README.md` 的图片失效问题
上一节生成的gif文件，我打算放入到README.md中，这样发布到NPM后，来到该package的主页介绍，就可以通过这个动态图，一下子Get到这个package的作用了。

但很遗憾，我发布了好几次，发现页面加载不出动态图。

在README.md中，你不能使用相对路径引入图片：
```txt 
![](./line-noise.gif)
```
尽管 `line-noise.gif` 和 `README.md` 处于同一层级，而且在publish的时候，你也将这个gif传上去了，但是NPM不会自动帮你处理图片路径问题的。

这个方式，你在vscode本地的markdown预览是可行的，在NPM是不灵的。

你只能将.gif图片托管到一个站点，然后在README.md中使用图片的url引入。

我采用的方法是将图片部署到githubPage。