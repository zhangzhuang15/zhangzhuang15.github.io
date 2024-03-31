---
title: "tsconfig的魔鬼——module和moduleResolution"
page: true
aside: true
---

# tsconfig 的魔鬼——module 和 moduleResolution

## 起因

自己写着玩儿也好，还是工作中建新项目也好，基本都是使用**脚手架**(_scaffolding_)创建，里面的 tsconfig.json，我们多数情况下只需要调整/添加部分配置选项。

我尝试过 `vite` `create-react-app` `@nest/cli`，看了一些 vscode 插件源码，回顾它们，我发现它们在配置 `module` 和 `moduleResolution`不太相同。

这勾起了我的极大兴趣，到底这两个配置项有什么门道儿，官网解释的那点意思够不够用？

正好，我想尝试下用 ts 开发 nodejs 程序，而且是 esModule 和 commonJS 两种风格的 nodejs 程序，顺手就可以研究研究这两个配置项。

## 只说结论

### module

表示编译后得到的 js 代码，采取怎样的模块管理方式。

常见的值 `CommonJS` `ESNext` `ES2020` `NodeNext`。

`CommonJS`不用多说，生成的代码，用的就是 `require` `module.exports`的模块管理方式；

`ESNext` `ES2020`这种，生成的代码，用的就是`import` `export`的模块管理方式；

`NodeNext`比较特殊，要看 `package.json`的`type`字段，这个字段如果是`module`的话，生成的代码，用的就是 `import` `export`；

值得注意的是，`module`负责的是模块管理方式，不负责 js 语法版本，因为这是由`target`字段管理的；

#### 选择哪个值

如果你开发的是 commonJS 风格的旧版本 nodejs 代码，就选择 `CommonJS`;

如果你开发的是 esModule 风格的新版本 nodejs 代码，就选择 `ESNext` or `NodeNext`;

如果你开发的是 esModule 风格的浏览器端运行的代码，就选择 `ESNext`；

#### ESNext 和 ES2020 有什么区别

ESNext 总是表示最新版本的 esModule;

ES2020 这种，表示的是特定版本的 esModule；

一般来讲，向最新版本看齐即可，当然有明确的版本要求下，也可设置为特定版本的值。

### moduleResolution

`module`字段理解起来很简单，但`moduleResolution`理解起来就比较麻烦了，因为它表达的具体是什么意思，除了看它的字段值，还要结合`module`字段值。

这个字段表示，ts 按照什么样的规则找到模块，将模块类型信息提供给你，让你在编写代码的时候，可以看到类型提示。

> 你一定要注意，它所寻找的是模块类型信息。tsc 遇到`import`语句时，它不会导入 js 或者 ts 代码，这个是 bundle 工具要做的事情，它只负责将 ts 文
> 件编译为 js 文件，而`import`语句会转化为`require`语句， tsc 不会改变导入的路径，以前是 import "./a", 现在就是 require("./a").
> 针对编译后的 js 文件，bundle 工具会识别 require，根据自己的搜索方式，加载被导入的 module。

```ts
import { Jack } from "./util/name";
```

应该怎么去找到 `./util/name`表示的模块呢？怎么拿到 Jack 的类型信息呢？

这里只选出最常用的可选值解释。

#### classic

```ts
// /demo/A.ts
import { B } from "./B";
```

会依次寻找:

- `/demo/B.ts`
- `/demo/B.d.ts`

```ts
// /demo/Hello/A.ts
import { B } from "B";
```

会依次寻找：

- `/demo/Hello/B.ts`
- `/demo/Hello/B.d.ts`
- `/demo/B.ts`
- `/demo/B.d.ts`
- `/B.ts`
- `/B.d.ts`

当然，`classic`只是 `tsc`自身默认的模块寻找方式，但这个方式已经不常用了。

#### Node

`tsc`会仿照早期 nodejs 的方式寻找模块。

`module`字段必须要设置为`CommonJS`, 否则你编写代码的时候不会有什么问题，编译的时候也不会有什么问题，但是用 node 执行代码的时候，会报错。那是因为早期 nodejs 是不支持 esModule 风格的代码，而且 tsc 在编译的时候，不会对引入的路径自动做调整。

```ts
// /demo/Hello/A.ts
import { B } from "./B";
```

依次寻找:

- `/demo/Hello/B.ts`
- `/demo/Hello/B.tsx`
- `/demo/Hello/B.d.ts`
- `/demo/Hello/B/package.json`(访问 "types" 字段)
- `/demo/Hello/B/index.ts`
- `/demo/Hello/B/index.tsx`
- `/demo/Hello/B/index.d.ts`

```ts
// /demo/A.ts
import { B } from "B";
```

依次寻找:

- `/demo/node_modules/B.ts`
- `/demo/node_modules/B.tsx`
- `/demo/node_modules/B.d.ts`
- `/demo/node_modules/B/package.json`(访问"types"字段)
- `/demo/node_modules/@types/B.d.ts`
- `/demo/node_modules/@types/B/package.json`(访问"types"字段)
- `/demo/node_modules/@types/B/index.d.ts`
- `/demo/node_modules/B/index.ts`
- `/demo/node_modules/B/index.tsx`
- `/demo/node_modules/B/index.d.ts`
- `/node_modules/B.ts`
- `/node_modules/B.tsx`
- `/node_modules/B.d.ts`
- `/node_modules/B/package.json`(访问"types"字段)
- `/node_modules/@types/B.d.ts`
- `/node_modules/@types/B/package.json`(访问“types”字段)
- `/node_modules/@types/B/index.d.ts`
- `/node_modules/B/index.ts`
- `/node_modules/B/index.tsx`
- `/node_modules/B/index.d.ts`

如果引入方式变为：

```ts
// /demo/A.ts
import { C } from "B/C";
```

只需将上述路径中的 B 修改为 B/C， 即：

- `/demo/node_modules/B/C.ts`
- `/demo/node_modules/B/C.tsx`
- `/demo/node_modules/B/C.d.ts`
- `/demo/node_modules/B/C/package.json`(访问"types"字段)
- `/demo/node_modules/@types/B/C.d.ts`
- `/demo/node_modules/@types/B/C/package.json`(访问"types"字段)
- `/demo/node_modules/@types/B/C/index.d.ts`
- `/demo/node_modules/B/C/index.ts`
- `/demo/node_modules/B/C/index.tsx`
- `/demo/node_modules/B/C/index.d.ts`
- `/node_modules/B/C.ts`
- `/node_modules/B/C.tsx`
- `/node_modules/B/C.d.ts`
- `/node_modules/B/C/package.json`(访问"types"字段)
- `/node_modules/@types/B/C.d.ts`
- `/node_modules/@types/B/C/package.json`(访问“types”字段)
- `/node_modules/@types/B/C/index.d.ts`
- `/node_modules/B/C/index.ts`
- `/node_modules/B/C/index.tsx`
- `/node_modules/B/C/index.d.ts`

#### Node16 or NodeNext

`tsc`按照新版本 node 的方式寻找模块。

新 node 下，esModule 和 commonJS 都是支持的，在解释的时候，也会包括这两种类型。

##### module: CommonJS

```ts
// /demo/Hello/A.ts
import { B } from "./B";
```

和上面的 Node 一样， 依次寻找:

- `/demo/Hello/B.ts`
- `/demo/Hello/B.tsx`
- `/demo/Hello/B.d.ts`
- `/demo/Hello/B/package.json`(访问 "types" 字段)
- `/demo/Hello/B/index.ts`
- `/demo/Hello/B/index.tsx`
- `/demo/Hello/B/index.d.ts`

```ts
// /demo/A.ts
import { B } from "B";
```

此时略有不同，会依次寻找：

- `/demo/node_modules/B.ts`
- `/demo/node_modules/B.tsx`
- `/demo/node_modules/B.d.ts`
- `/demo/node_modules/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/demo/node_modules/@types/B.d.ts`
- `/demo/node_modules/@types/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/demo/node_modules/@types/B/index.d.ts`
- `/demo/node_modules/B/index.ts`
- `/demo/node_modules/B/index.tsx`
- `/demo/node_modules/B/index.d.ts`
- `/node_modules/B.ts`
- `/node_modules/B.tsx`
- `/node_modules/B.d.ts`
- `/node_modules/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/node_modules/@types/B.d.ts`
- `/node_modules/@types/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/node_modules/@types/B/index.d.ts`
- `/node_modules/B/index.ts`
- `/node_modules/B/index.tsx`
- `/node_modules/B/index.d.ts`

Node16 or NodeNext 下，tsc 会识别 package.json 中的 `exports` 字段。

但仍要注意，如果这个包不在 node_modules 里，那么 `exports`字段不会被识别的。

如果访问：

```ts
// /demo/A.ts
import { C } from "B/C";
```

只要将上边每个遍历中的 B 替换为 B/C， 就得到本次的遍历搜寻路径；

##### module: ESNext

```ts
// /demo/Hello/A.ts
import { B } from "./B";
```

在 vscode 里，这样写会报错，错误信息会告诉你，要给“./B”补全文件后缀`.js`

```ts
// /demo/Hello/A.ts
import { B } from "./B.js";
```

这样写就没问题了，编译和运行时都能通过。

你肯定会问，文件明明是 `/demo/Hello/B.ts`, 哪里来的 `B.js` ?

OK, 放心好了，B.js 指的就是 B.ts。

写成 B.js 的话，依旧是访问 B.ts 中的信息，里面的函数、类型等提示，在 A.ts 仍然可以获取到。

你要知道，tsc 在编译的时候，会将 B.ts 文件输出为 B.js，而在编译过程中，import 引用的路径不会做任何修改。

A.ts 中写的是 "./B.js", 输出的 A.js 中写的还是 "./B.js"。

在编译之后，B.js 不就有了吗，不就能找到了吗？

```ts
// /demo/A.ts
import { B } from "B";
```

和 module: CommonJS 一样，会依次寻找：

- `/demo/node_modules/B.ts`
- `/demo/node_modules/B.tsx`
- `/demo/node_modules/B.d.ts`
- `/demo/node_modules/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/demo/node_modules/@types/B.d.ts`
- `/demo/node_modules/@types/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/demo/node_modules/@types/B/index.d.ts`
- `/demo/node_modules/B/index.ts`
- `/demo/node_modules/B/index.tsx`
- `/demo/node_modules/B/index.d.ts`
- `/node_modules/B.ts`
- `/node_modules/B.tsx`
- `/node_modules/B.d.ts`
- `/node_modules/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/node_modules/@types/B.d.ts`
- `/node_modules/@types/B/package.json`(优先访问"exports"字段，后访问"types"字段)
- `/node_modules/@types/B/index.d.ts`
- `/node_modules/B/index.ts`
- `/node_modules/B/index.tsx`
- `/node_modules/B/index.d.ts`

如果访问：

```ts
// /demo/A.ts
import { C } from "B/C";
```

和上边 CommonJs 的情况一样，只要将上边每个遍历中的 B 替换为 B/C， 就得到本次的遍历搜寻路径；

#### Bundler

在 vscode 编写代码的时候，不会遇到什么错误，用 tsc 也可以编译代码，但是无法使用 node 运行。

如果在 tsc 编译的时候出现错误，可能是 tsc 版本较低，请更新到最新版本。

在搜索模块上，基本和 Node16 or NodeNext 一样。

唯一的区别在于 module: ESNext 情形下的相对引入：

```ts
// /demo/Hello/A.ts
import { B } from "./B";
```

不会要求你添加 .js 后缀，会依次寻找：

- `/demo/Hello/B.ts`
- `/demo/Hello/B.tsx`
- `/demo/Hello/B.d.ts`
- `/demo/Hello/B/package.json`(访问 "types" 字段)
- `/demo/Hello/B/index.ts`
- `/demo/Hello/B/index.tsx`
- `/demo/Hello/B/index.d.ts`

那该怎么去编译代码呢？

Bundler 不都告诉你了嘛 ，你需要使用 bundler 处理，比如 `rollup` `webpack` 等工具。

### 怎么搭配 module 和 moduleResolution

直接用脚手架搞定的，可以直接跳过。

如果打算编写 commonJS 风格的 nodejs 程序，不支持解析`exports`字段：

```json
{
  "module": "CommonJS",
  "moduleResolution": "Node"
}
```

<br>

如果打算编写 commonJS 风格的 nodejs 程序，支持`exports`字段：

```json
{
  "module": "CommonJS",
  "moduleResolution": "NodeNext"
}
```

或者

```json
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
}
```

<br>

如果打算编写 esModule 风格的 nodejs 程序：

```json
{
  "module": "ESNext",
  "moduleResolution": "NodeNext"
}
```

或者

```json
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
}
```

> 别忘了设置 package.json 的 type: "module"

<br>

如果打算编写浏览器端的代码：

```json
{
  "module": "ESNext",
  "moduleResolution": "Bundler"
}
```

<br>

如果你打算编写一个库，这个库要在 Node 和浏览器都运行，针对浏览器的场景，
module 要设置为 `ESNext` 或者预期的 ES 版本号（比如`ES2015`），如果
你依旧采用`NodeNext`，你的库在打包的时候，tree shake 会出现问题，
可能把依赖库整体都打包进去了，而不是按需打包！

### paths 陷阱

引入路径可能很长，我们会习惯使用 tsconfig.json 的 paths 配置项，简化路径。

但请注意，在编写代码的时候，vscode 会解析 paths，找到对应的模块，把模块的信息提供给你，然后你就能得到类型信息等智能提示了。但是在编译的时候，这些路径不会被转化成真实的路径！你需要用 bundler 工具去落实真正路径的转化。

如果你使用过 vite 的话，tsconfig.json 中的 paths 只是方便你写代码的时候获取模块信息，真正运行的时候，你还需要在 vite.config.json 做出 path 配置，才能编译通。

## 验证

非常简单，自己在本地搭建个项目，按照上述总结那般，做个探索即可。

这里给出一个简易参考。

```
project
  |------- tsconfig.json
  |------- index.ts
  |------- util
  |          |------ index.ts
  |
  |------- node_modules
             |------ A
                     |------ package.json
                     |------ index.d.ts
                     |------ exports.d.ts
```

```json
// project/tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "moduleResolution": "Node"
  },
  "include": ["*.ts", "./util/*.ts"]
}
```

```ts
// project/index.ts

import { hello } from "./util";
import { say } from "A";

hello();
```

```ts
// project/util/index.ts
export function hello() {
  console.log("hello world");
}
```

```json
// project/node_modules/A/package.json
{
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "types": "./exports.d.ts"
    }
  }
}
```

```ts
// project/node_modules/A/index.d.ts
export function say(): void;
```

```ts
// project/node_modules/A/exports.d.ts
export function joke(): void;
```

### 验证 exports 字段

将 tsconfig.json 的 `moduleResolution` 改为 `Bundler`,
index.ts 会报错，找不到函数 say；

### 验证相对路径引入时，不识别 exports 字段

将 tsconfig.json 的 `moduleResolution` 改为 `Bundler`,
将 A 从 node_modules 中复制到 project 下，在 index.ts 中加入

```ts
import { joke } "./A"
```

会发现 joke 找不到；

### 验证 .js 补全

将 tsconfig.json 的 `moduleResolution` 改为 `NodeNext`,
`module` 改为 `ESNext`

index.ts 就会报错，改成 `./util/index.js` 后错误消失，采用`tsc`编译，并用 node 执行编译结果入口文件，一切 OK

<Giscus />
