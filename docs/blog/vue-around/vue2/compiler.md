---
title: "vue编译器"
page: true 
aside: true
---

# vue编译器
与运行时代码相比，vue编译器的工作量更大。严格讲，vue编译器是将`.vue`文件内容转为纯javascript代码的工具，它和编程语言领域的编译器不是一回事儿。

`.vue`文件内容由三部分构成：`template`, `script`, `style`。这三个部分都要转化为js代码。`template`要被转化为`render`函数定义，`script`要被转为组件的定义，`style`也要被转为js代码（这个比较特殊，后边细谈）。

想要完成上述的转化过程，需要两个工具：
1. vue compiler。它必须提供compileScript, compileStyle, compileTemplate。
2. vue loader。必须配合打包工具，定义好插件，将vue compiler的能力介入其中。

他们的关系是：打包工具提供代码，vue compiler转化代码。

接下来，我们先讲清楚vue compiler的工作方式，再讲vue loader是怎么做的。

## vue compiler 
### parser 
众所周知，`.vue`文件的内容包含`<template>` `<script>` `<style>`标签。vue第一步要做的就是把这些内容划分出来。

比如我们有`app.vue`:
```vue 
<template>
  <div class="main">hello world {{ count }}</div>
</template>
<script>
  export default {
    data: {
      count: 1
    }
  }
</script>
<style scoped>
.main { color: lightblue, font-size: 18px }
</style>
```

经过parse解析后，得到：
```ts 
const descriptor = {
  template: {
    content: `
      <div class="main">hello world {{ count }}</div>
    `,
    type: 'template'
  },
  script: {
    type: "script",
    content: `
      export default {
        data: {
          count: 1
        }
      }
    `
  },
  styles: [
    {
      type: 'style',
      content: `
        .main { color: lightblue, font-size: 18px }
      `,
      attrs: {
        scoped: true
      }
    }
  ]
}
```

这个转化过程，vue封装了一个叫做`parseHTML`方法，提供html标签的遍历，源码位置：`src/compiler/parser/html-parser.ts#parseHTML`.

而`parseComponent`方法基于`parseHTML`, 收集start tag 和 end tag，创建了上述的`descriptor`, 源码：`packages/compiler-sfc/src/parseComponent.ts#parseComponent`.

剩下的工作，就是各个击破。

### compileTemplate
针对`template`的内容，采用`compileTemplate`方法处理，源码：`packages/compiler-sfc/src/compileTemplate.ts#compileTemplate`。

但方法的核心实现位于`src/compiler/index.ts,line10`

其基本思路：
1. 解析 `template` 的内容，生成抽象语法树ast 
2. 遍历ast，做一些静态节点的标记，为生成代码做优化铺垫
3. 遍历ast生成`render`方法的代码

#### 生成抽象语法树ast 
假设`template`里的内容是：
```html 
<div class="main">
  <component-a />
  <component-b>
    <span class="title" v-slot="default">Today</span>
  </component-b>
  <span v-if="isInit">hello {{ initialMessage }}</span>
  <h2 v-else-if="isMount">Wait</h2>
  <h1 v-else>Bye</h1>
</div>
```

经过处理后，得到的语法树:
```ts 
const h2Element = {
  type: 1,
  tag: 'h2',
  attrs: [
    { name: 'v-else-if', value: 'isMount' }
  ],
  attrsMap: {
    'v-else-if': "isMount"
  },
  elseif: "isMount",
  children: [{ type: 3, text: "Wait" }]
}

const h1Element = {
  type: 1,
  tag: 'h1',
  attrs: [
    { name: 'v-else', value: '' }
  ],
  attrsMap: {
    'v-else': ''
  },
  else: true,
  children: [{ type: 3, text: 'Bye' }]
}

const spanElement1 = {
  // 当前node是一个element
  type: 1,
  tag: 'span',
  attrs: [
    { name: "v-if", value: "isInit" }
  ],
  attrsMap: {
    "v-if": "isInit"
  },
  if: "isInit",
  ifConditions: [
    { exp: "isInit", block: spanElement1 },
    { exp: "isMount", block: h2Element },
    { exp: undefined, block: h1Element }
  ],
  children: [
    { 
      // 当前node是一个表达式
      type: 2, 
      expression: '"hello " + _s(initialMessage)', 
      tokens: ["hello ","initialMessage"]
    }
  ]
}
const spanElement2 = {
  type: 1,
  tag: 'span',
  attrs: [
    { name: "class", value: "title" }
  ],
  attrsMap: {
    "class": "title",
    "v-slot": "default"
  },
  slotTarget: "default",
  children: [
    // 当前node是文本
    { type: 3, text: "Today" }
  ]
}

const componentBElement = {
  type: 1,
  tag: 'component-b',
  attrs: [],
  attrsMap: {},
  scopedSlots: {
    "default": spanElement2
  },
  children: [ spanElement2 ]
}

spanElement2.parent = componentBElement

const componentAElement = {
  type: 1,
  tag: 'component-a',
  attrs: [],
  attrsMap: {},
  children: []
}

const divElement = {
  type: 1,
  tag: 'div',
  attrs: [
    { name: 'class', value: 'main' }
  ],
  attrsMap: {
    "class": "main"
  },
  children: [ 
    componentAElement, 
    componentBElement, 
    spanElement1
  ]
}

componentAElement.parent = divElement
componentBElement.parent = divElement
spanElement1.parent = divElement

const ast = rootNode = divElement
```
具体的创建细节可参考源码：`src/compiler/parser/index.ts#parse`

大概的思路就是，调用`parseHTML`解析`template`的内容，发现是open tag的时候(比如`<div>`)，就为它创建一个element，然后加入堆栈，并把currentParentElement设置为这个element;

当发现是close tag的时候（比如`</div>`），取出栈顶的element，再获取栈顶的element2, 设置`element.parent = element2; element2.children.push(element)`

重复上述操作后，第一个被创建出来的element就是抽象语法树的根节点。

#### 根据ast生成代码
有了上边的ast, 只需要遍历，就可以为每个节点创建代码了。

我们先定义一个函数`genElement(el)`，意思就是对于给定的el，这个函数返回一个字符串，这个字符串就是为el创建vnode的代码。

如果el是一个非常简单的div element, 那么函数的返回值就是`_c("div")`，这样的一个字符串。

为el生成代码，需要根据el的特点分门别类。

element本身如果涉及到`v-if` `v-else-if` `v-else`:
```ts 
const element = {
  type: 1,
  tag: 'div',
  if: true,
  ifCondtions: [
    // 对应 v-if="isInit"
    { exp: 'isInit', block: element2 },
    // 对应 v-else-if="isMount"
    { exp: 'isMount', block: element3 },
    // 对应 v-else
    { exp: undefined, block: element4 }
  ]
}

// 这样创建
function genIfConditions(conditions) {
  // 取出第一个
  const condition = conditions.shift()

  // v-else 的情形
  if (!!condition.exp) {
    return `${genElement(condition.block)}`
  }

  return `(${condition.exp}) ? ${genElement(condition.block)} : (${genIfConditions(conditions)})`
}

const code = genIfConditions(element)
```

element本身如果涉及到`v-for`:
```ts 
// <div v-for="(item, index) in userList">{{ item }}</div>
// 这样的element在parse之后长这个样子：
const element = {
  type: 1,
  tag: 'div',
  for: "userList",
  alias: "item",
  iterator1: "index",
  iterator2: '',
  children: [
    { type: 2, expression: "item" }
  ]
}

function genFor(el) {
  let {
    tag,
    for,
    alias,
    iterator1,
    iterator2
  } = el;

  el.forProcessed = true

  iterator1 = iterator1 ? ',' + iterator1 : ''
  iterator2 = iterator2 ? ',' + iterator2 : ''

  return (
    `_l( (${for}), ` +
    `function(${alias}${iterator1}${iterator2}){` +
    ` return ${genElement(el)}` +
    `})`
  )
}

const code = genFor(element)

// 就这里的例子，结果是这个样子：
// _l( (usrList), function(item, index) {
//   return _c("div", {}, [item])
// })
```

element本身如果是slot:
```ts 
// <slot name="header">{{ userInfo }}</slot>
// 这样的element在parse之后长这个样子
const element = {
  type: 1,
  tag: 'slot',
  slotName: '"header"',
  children: [
    { type: 2, expression: "userInfo" }
  ]
}

function genSlot(el) {
  const { slotName, children } = el
  let childrenCode = genChildren(children)
  childrenCode = childrenCode ? `,function(){ return ${childrenCode}}` : ""
  return `_t(${slotName}${childrenCode})`
}

const code = genSlot(element)
// 就本例子来讲，结果大概是这个样子：
// _t("header", function(){ return [_v(userInfo)] } )
```

element如果是注释类型
```ts 
const element = {
  type: 3,
  isComment: true,
  text: 'this is a note'
}

function genComment(el) {
  return `_e(${JSON.stringify(el.text)})`
}

const code = genComment(element)
// _e("this is a note")
```

element如果是一个文本节点：
```ts 
const element = {
  type: 3,
  text: "hello world"
}

function genText(el) {
  return `_v(${JSON.stringify(el.text)})`
}

const code = genText(element)
// _v("hello world")
```

element存在children, 给element.children生成代码：
```ts 
const element = {
  type: 1,
  tag: 'div',
  children: [
    {
      type: 1,
      tag: 'div',
    },
    {
      type: 3,
      isComment: true,
      text: 'this is a note'
    },
    {
      type: 3,
      text: 'hello world'
    }
  ]
}

function genNode(node): string {
  if (node.type === 1) {
    return genElement(node)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}


function genChildren(children) {
  const code = children.map(child => genNode(child)).join(',')
  return `[${code}]`
}

const code = genChildren(element.children)
// [_c("div", {}, null),_e("this is a note"),_v("hello world")]
```

element如果是一个component:
```ts 
// <component-a :info="userInfo" class="main" />
const element = {
  type: 1,
  tag: 'component-a',
  component: 'component-a',
  key: '0001',
  attrs: [
    { name: 'info', value: "userInfo" }
  ],
  attrsMap: {
    "info": "userInfo"
  },
  props: [
    { name: "class", value: "main"}
  ],
  children: []
}

function genComponent(el) {
  const { component } = el

  // 在本例子中：
  // { 
  //  key: '0001', 
  //  directives: [], 
  //  tag: 'component-a',
  //  attrs: { "info": userInfo },
  //  domProps: { "class": "main" }
  // }
  // 当然data里还有关于event, slot 的一些属性，
  // 这不过我们的例子中不涉及
  const data = genData(el)
  const children = genChildren(el.children)

  return `_c(${component},${data}${
    children ? `,${children}` : ''
  })`
}
```

把上面的情况汇总到一起，就是`genElement(element)`的基本情况，源码：`src/compiler/codegen/index.ts`.

而根据ast根节点生成代码则是：
```ts 
function generate(astRootElement) {
  const code = genElement(astRootElement)
  return {
    render: `with(this){return ${code}}`
  }
}
```

但是最终生成的代码应该是一个render函数定义，而不是函数的内容，于是vue做了这样的处理：
```ts 
const { renderCode } = generate(astRootElement)
const code = `
  var __render__ = function render() {
    ${renderCode}
  }
`

// var __render__ = function render() {
//    with(this) {
//     return _c("div", {}, [userName])
//    } 
// }
```

但这样还不够，vue使用`babel/parser`和`MagicString`的能力，对上面生成的代码做了前缀处理以及变量名的替换，得到：
```ts 
var render = function render() {
  var _vm = this, _c=_vm._self._c
  return _c("div", {}, [_vm.userName])

  // 使用babel/parser 和 MagicString,
  // 去掉了 “with (this)”,
  // userName前边加入“_vm.” 前缀，
  // 插入 _vm 和 _c 的声明语句，
  // __render__ 改写为 render
}
```

生成的这样的代码，才是 compileTemplate 最终给出的代码。

因此上面提到的`_c`  `_e`  `_v` 都是vue运行时给出定义，不是编译器给出的定义，定义的源码位置：`src/core/instance/render-helpers/index.ts`


### compileScript
vue要处理两种script。

普通的script:
```html 
<script>
  export default {
    data: {
      userName: 'jack'
    }
  }
</script>
```

带有setup的script：
```html 
<script setup>
  import { ref } from "vue"

  const userMessage = ref("hello jack")
</script>
```

而这两种script的信息存储在最开始parse的结果里：
```ts 
const descriptor = {
  script: {
    type: 'script',
    content: `
      export default {
        data: {
          userName: 'jack'
        }
      }
    `
  },
  setupScript: {
    type: 'script',
    content: `
      import { ref } from "vue"

      const userMessage = ref("hello jack")
    `
  }
}
```

如果只有`descriptor.script`, 那么 `compileScript` 返回的code结果就是`descriptor.script.content`的值。

否则，需要完成script和setupScript的处理，然后将两个处理结果整合在一起。

#### 处理script 
源码： `packages/compiler-sfc/src/compileScript.ts,line626`

```ts 
export default {
  data() {
    userName: "jack"
  }
}
```

vue会使用`babel/parse`处理上述代码得到ast，然后遍历ast，将组件的`data` `computed` `props` 的各个属性名汇总起来，这样做是为了在接下来处理setupScript的时候，检测是否重复定义了相同属性名的`data` `computed` `props`.最后会将代码转化为：
```ts 
const __default__ = {
  data() {
    userName: 'jack'
  }
}
```

#### 处理setupScript 
源码： `packages/compiler-sfc/src/compileScript.ts,line763`

这部分处理是最复杂的。

```ts 
import { ref, defineProps } from "vue"

const userMessage = ref("hello world")

const props = defineProps<{
  userId?: number
}>()
```

vue允许你定义若干变量、方法，但不会要求你编写导出语句，vue必须为这种方便做很多工作。

同样, vue要使用`babel/parser`分析上述代码得到ast，遍历ast的节点，分类处理代码，用`MagicString`改写代码。

遇到`import`语句时，会有这样的处理：
1. 把`import`语句移动到代码最上方
2. 如果import的是vue库，会将`defineProps` `defineEmits` `withDefaults`给删除掉
   ```ts 
   // 原代码
   import { defineProps, ref, reactive, defineEmits, withDefaults } from "vue"

   // 处理后 
   import { ref } from "vue"
   ```
3. 记录被import的别名 
   ```ts 
   // 原代码有这样的语句
   import { ref as r } from "vue"
   import { useMessage as useM } from "hooks"

   // vue会这样处理，
   // 记录非 vue 库的引入情况
   const userImports = {
    "useM" : {
      source: "hooks",
      imported: "useMessage",
      // 是不是typescript的type类型
      isType: false
    }
   }

   // 专门记录 vue 库的引入情况
   const userImportAlias = {
    "ref": "r"
   }
   ```

遇到`defineProps` `defineEmits` `withDefaults`的时候，会做如下处理。
```ts 
// 只以 defineProps 为例，defineEmits和withDefaults 以此类推

// 会将范型位置的类型参数 { message: String } 按照
// babel/parse 给出的 node 收集起来，然后删除这行代码
defineProps<{ message: String }>()

// 对于这种，会收集类型参数，还有变量名 props,
// 然后删除这行代码
const props = defineProps<{ message: String }>()
```

遇到`defineExpose`:
```ts 
defineExpose({})

// 处理后变成
expose({})
```

遇到下面带初始值的变量声明语句，会把变量名收集起来：
```ts 
const { message } = defineProps<{message: string}>()
const name = ref("")
const userInfo = reactive({ name: 'jack', height: 165 })
const clickButton = () => { userInfo.height += 1 }
function printUserName() {
  console.log('user name: ', name.value)
}
enum Value {
  Zero = 0,
  Done = 60,
  WellDone = 70,
  Excellent = 80,
  Great = 90,
  Perfect = 100,
}
```
> 这里的收集，就是为了后边自动导出这些变量准备的，也是vue允许你不用显式导出的原因

遇到其它的类型定义语句，会把它们移动到代码最开头。

完成了上述预处理、信息收集后，vue会在setupScript的结尾加入这样的代码：
```ts 
// __sfc: true 是特意注入的，
// 其余的键名（userInfo, name）,
// 都是在上述环节里收集出来的，这些
// 键名必须满足在 <template></template>
// 里出现过
//
// 这一步实现的就是vue帮你自动导出
return {
  __sfc: true,
  userInfo,
  name
}
```

有了上述的处理后，整个script里的代码变成了这样的结构：
```ts
/** 若干 import 语句  */
/** 来自 script 和 setupScript */

/** 来自script, 比如下边这个样子 */
var __default__ = {
  data: {
    message: 'hello'
  }
}

/** 来自setupScript */
const myProps = defineProps<{ message?: string }>()
const myEmit = defineEmits(["update"])
const userInfo = reactive({ name: 'jack', height: 164 })
defineExpose({})

/** vue刚刚生成的 */
return {
  __sfc: true,
  userInfo,
  myProps
}
```
显然`return`这里还说不清楚，vue要继续处理，将其包裹在一个函数里，于是会有下面的处理。

如果script或者setupScript使用了typescript:
```ts
// vue注入的函数引入
import { defineComponent as _defineComponent } from "vue"
/** 若干 import 语句  */
/** 来自 script 和 setupScript */

/** 来自script, 比如下边这个样子 */
var __default__ = {
  data: {
    message: 'hello'
  }
}

/** vue加入_defineComponent函数调用 */
export default /*#__PURE__*/ _defineComponent({
 ...__default__, 
 emits: ['update'],
 props: {
  message: { type: String, required: false }
 },
 setup(__props: any, { expose, emit: myEmit }) {
  const myProps = __props;
  const userInfo = reactive({ name: 'jack', height: 164 })
  expose({})

  return {
    __sfc: true,
    userInfo，
    myProps
  }
 }
}) 
```

如果没有使用typescript, 代码结构会是这样：
```ts 
/** 若干 import 语句  */
/** 来自 script 和 setupScript */

/** 来自script, 比如下边这个样子 */
var __default__ = {
  data: {
    message: 'hello'
  }
}

/** vue 使用 Object.assign 包裹 */
export default /*#__PURE__*/Object.assign(
  __default__,
  {
    emits: ['update'],
    props: {
      message: { type: String, required: false }
    },
    setup(__props, { expose, emit: myEmit }) {
      const myProps = __props;
      const userInfo = reactive({ name: 'jack', height: 164 })
      expose({})

      return {
        __sfc: true,
        userInfo，
        myProps
      }
    }
  }
)
```

可是，我们还有一些问题没有回答。

`emits: ['update'],`, `emits:` 后边的内容怎么生成的？

`props: { message: { type: String, required: false } }`, `props:`后边的内容怎么生成的？

`setup(__props, { expose, emit: myEmit })`, `setup()`的函数入参为什么是这样？

我们继续聊。

#### `emits`
在信息收集的时候，已经拿到关于emit的信息，它来自于`defineEmits`，而它无非是下面几个形式：
```ts 
// 1. 没有变量接收，直接传参
defineEmits(["update"])

// 2. 没有变量接收，只给出类型定义
defineEmits<{
  (e: 'update', value: number): void
}>()

// 3. 在情形1的基础上，加入myEmit变量接收
const myEmit = defineEmits(["update"])

// 4. 在情形2的基础上，加入yourEmit变量接收
const yourEmit = defineEmits<{
  (e: 'update', value: number): void
}>()
```

对于情形1，信息收集的时候，函数入参我们是知道的，那么直接复用即可，`emits: ["update"]`

对于情形2，信息收集的时候，函数的范型类型定义，我们也知道，那么透过语法树的分析，可以拿到类型声明`e: 'update'`的`"update"`, 之后就和情形1的处理方式一样了。

对于情形3，要先按照情形1处理，但是它多出来一个`myEmit`, 这个名字我们在信息收集阶段可以知道，因此会有`setup()`函数入参这样写`{ emit: myEmit }`

对于情形4，和情形3的处理方式类似。


#### `props`
props的信息来自 `defineProps`, 无非也是这样几种形式：
```ts 
// 1. 没有变量接收，defineProps直接传参
defineProps({ 
  message: {
    type: String,
    required: false,
    default: "hello world"
  }
})

// 2. 没有变量接收，defineProps给出类型定义
defineProps<{
  message?: string
}>()

// 3. 有变量接收，直接传惨
const myProps = defineProps({
  message: {
    type: String,
    required: false,
    default: "hello world"
  }
})

// 4. 有变量接收，给出类型
const yourProps = defineProps<{
  message?: string
}>()

```

处理方式和emits的情况差不多。

情形1，这种直接传参数的，直接把参数搬运过去就得到了:
```ts 
export default _defineComponent({
  // ...
  props: {
    message: {
      type: String,
      required: false,
      default: "hello world"
    }
  }
  // ...
})
```

情形2，就是拿到类型信息后，分析出`message`是一个可选类型，还是字符串，就可以创建出`{ message: { type: String, required: false }}`的配置信息，然后像情形1直接搬运：
```ts 
export default _defineComponent({
  // ...
  props: {
    message: {
      type: String,
      required: false,
    }
  }
  // ...
})
```

情形3和情形4，都要像情形1和情形2那样处理一下，之后在setupScript代码里加入代码，完成变量别名的设置就可以了`const myProps = __props`

#### `setup`
首先要搞清楚这个函数入参的结构。

第一个参数，指的是组件的`props`；

第二个参数，指的是组件暴露一些字段；

对于第一个参数，叫`__props`可以，叫别的也可以，因为这个名字并不会影响到`setup`函数体，别忘了，还有变量别名的处理呢`const yourProps = __props`;

第二个参数，完整版是`{ emit, slots, expose, attrs }`, 需要哪些字段，要看信息收集的时候，推断出哪个被用到了，比如发现有`defineExpose`，那肯定要暴露`expose`。

`emit`字段的暴露情况有些特殊，如果出现`const myEmits = defineEmits()`的代码，第二个参数要包含`emit`，还有它的别名，于是有`{ emit: myEmits }`。如果`defineEmits<{ message: string}>()`传入了类型定义, 那么第二个参数还要给出类型定义，于是有`{ emit: myEmits }: { emit: ({ message?: string})}`, 冒号左边是值的解构表达式，右边是类型定义了。

#### babel 
以上的分析，没有看到babel/parser给出的ast结果，理解起来很费劲，建议在结合代码，在[babel playground](https://babeljs.io/repl#?config_lz=N4IgZglgNgpgdgQwLYxALhAJxgBygOgBcBnEAGhB22JhPQG16R4A3c0QhTAc1tIwAmMMAgCuUOhSQB7AeJj8RUGgF8AumSbFOvALQAmdiCEBjaZgSFzxAGoxMxCNLjoQ-gAz6AzLoCMv8koIHBgoCDgYAAVMaRxpYgQoVwALBBMAaxB1TRBtBD0vI1NzS2s7BycXDA9vPwCKHGDQ8KiYuISkjFSMrI0QQgBPEOITTGDCED7iaVFMExgAFSHUDBGxnAmVIA&code_lz=FAAgJgpgZglgdhACgJwPYAcDOAeA3iANwEMAbAVwgC4Q4yBbAIwmRAF8A-ACgEog&lineWrap=true&version=8.0.5)输入一些代码，看看ast是什么样的。

#### 结合 
一个完整的vue组件，应该是`compileScript`和`compileTemplate`的输出结果结合起来，因为前者缺少`render()`方法，还不能算是一个完整的组件，这部分工作，我们在介绍vue-loader时再说。


### compileStyle
这部分比较简单，它没有复杂的ast处理，本质上，它就是`postcss`的一个应用，内部调用postcss处理css代码，而css代码来自于parse之后的descriptor.styles:
```ts 
const descriptor = {
  
  styles: [
    {
      type: 'style',
      // postcss要处理的就是这个
      content: `
        .main { color: lightblue, font-size: 18px }
      `,
      attrs: {
        scoped: true
      }
    }
  ]

}
```

那么它是一个一个处理style.content，还是把style.content全部拼接起来后再处理，那是上层调用者的事儿，我们在介绍vue-loader的时候再说。

而`compileStyle`原创的事情，也是比较重要的事情，就是定义了`postcss`的一个插件，往css样式中注入`[scopedId]`, 源码：`packages/compiler-sfc/src/stylePlugins/scoped.ts,line184`. `/deep/` `::v-deep()` `::global`也是在这个插件里处理的。
> 修改css代码使用的是`postcss-selector-parser` npm package

但是，scopedId到底怎么计算出来的，还是上层调用者考虑的范围，我们在vue-loader里再谈。

`compileStyle`的处理结果就是新的css代码：
```txt 
// 原来的
.main { color: blue }

// compileStyle处理后返回的
.main[ewrerw234234] { color: blue }
```

## vue loader 
vue loader是 vue compiler 的调用方，也是直接处理`.vue`文件的一方。接下来，我们就看看，它是如何利用`compileScript` `compileTemplate` `compileStyle`，将`.vue`文件转化为纯正的js代码的。

下载vue loader的源码：
```shell 
git clone git@github.com:vuejs/vue-loader.git
cd vue-loader
git checkout v15.11.0
```

webpack在解析js文件，发现引入的模块带有`.vue`后缀，就会调用vue loader处理。
```ts 
import App from "./app.vue"
```

vue loader会读取`app.vue`的内容，使用最开头讲的parser将内容转为descriptor。

`descriptor.styles`里边只要有一个style存在scoped属性，就认为需要计算scopedId，将`app.vue`文件的路径和内容拼接起来后，进行hash计算，得到的结果就是scopedId, 不妨假设计算结果是“233abcddef”。scopedId计算的源码位置：`lib/index.js, line85`。不妨假设descriptor.styles里有两个style。

之后，vue loader把如下内容作为`./app.vue`的源码，返回给webpack:
```ts 
import { render, staticRenderFns } from "./app.vue?vue&type=template&scoped=true&id=233abcddef" // [!code focus]

import script from "./app.vue?vue&type=script" // [!code focus]
export * from "./app.vue?vue&type=script" // [!code focus]

import style0 from "./app.vue?vue&type=style&index=0&id=233abcddef" // [!code focus]
import style1 from "./app.vue?vue&type=style&index=1&id=233abcddef" // [!code focus]

/* normalize component */
import normalizer from "!./runtime/componentNormalizer"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  false,
  null,
  "233abcddef"
)

export default component.exports
```

`normalizer`是vue loader内部维护的模块，源码：`lib/runtime/componentNormalizer.js`, 大致做的事情就是：
```ts 
var options = script 
options.render = render
options.staticRenderFns = staticRenderFns
options._scopedId = "data-v-233abcddef"
return { exports: options }
```

我们要把重心放在`normalizer`上边的代码。

webpack接过这样的内容后，解析`import`，再次发现`.vue`后缀，于是委托vue loader继续处理。

你会发现import路径中带有`type`参数，vue loader会根据这个特征，分类处理。


对于`type=script`，vue loader会调用`compileScript`处理descriptor.script和descriptor.setupScript，这个我们上边已经介绍过，`compileScript`返回的就是生成好的代码，这个代码会交给webpack。
> 源码：`lib/select.js,line25`

对于`type=template`, vue loader会调用`compilerTemplate`处理descriptor.template.content, 我们在前边也介绍过了，`compilerTemplate`处理后的结果大概是这个样子：
```ts 
var render = function render() {
  var _vm = this, _c=_vm._self._c
  return _c("div", {}, [_vm.userName])
}
```
而vue loader会再增加导出语句：
```ts 
var render = function render() {
  var _vm = this, _c=_vm._self._c
  return _c("div", {}, [_vm.userName])
}

export { render } // [!code highlight]
```
把这样的内容返回给webpack.源码位置：`lib/loaders/templateLoader.js`

对于`type=style`的那两个import, vue loader使用`compileStyle`分别去处理，处理后的结果还是css代码，返回给webpack。之前说的`compileStyle`，怎么计算的scopedId, 分别处理style的内容，还是合在一起处理，应该已经清楚了。源码：`lib/loaders/stylePostLoader.js`
> id是233abcddef，不过vue loader使用"data-v-233abcddef"作为compileStyle的scopedId

但是，你可能会问，处理之后的结果还是css代码，不是js代码，webpack肯定不认啊。没错，所以在构建vue sfc项目的时候，还需要你安装`css-loader` `style-loader`。vue loader只是把vue文件内的style提取出来，做了初步的处理，后续还是要依赖别的loader将css代码转为js代码。

顺便看下`css-loader`和`style-loader`都干了什么吧。

`css-loader`处理之后大概交给webpack这样的代码：
```ts 
// css-loader 输出
module.exports = {
  i: "/*! index.css */\n.box {\n  color: red;\n}",
  modules: {},
  toString() {
    return this.i;
  }
}
```
`css-loader`参与处理之后，webpack打包后的真实产物：
```ts 
exports = module.exports = {
  toString: function () {
    return "/*! index.css */\n.box {\n  color: red;\n}"
  },
  loc: [
    [0, 147]
  ]
};
```

`style-loader`处理后交给webpack的代码大概是：
```ts 
var content = require("!!css-loader!./index.css");

// 创建style标签，把css塞进去
function insertStyle(cssText) {
  const style = document.createElement('style');
  style.innerHTML = cssText;
  document.head.appendChild(style);
}

insertStyle(content.toString());
module.exports = {};
```

`style-loader`参与处理，webpack真实的产物：
```ts 
// 运行时获取css loader的产物
const css = __webpack_require__(1); // [!code highlight]
const styleEl = document.createElement("style");
styleEl.textContent = css.toString();
document.head.appendChild(styleEl);
```

### hot reload
在上边的讨论中，我们没有提到webpack热更新的事情。如果组件支持热更新，vue loader需要在生成的代码里注入热更新代码：
```ts :line-numbers{1}
import { render, staticRenderFns } from "./app.vue?vue&type=template&scoped=true&id=233abcddef"

import script from "./app.vue?vue&type=script" 
export * from "./app.vue?vue&type=script" 
import style0 from "./app.vue?vue&type=style&index=0&id=233abcddef" 
import style1 from "./app.vue?vue&type=style&index=1&id=233abcddef" 

/* normalize component */
import normalizer from "!./runtime/componentNormalizer"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  false,
  null,
  "233abcddef"
)

export default component.exports

if (module.hot) { // [!code focus:19]
  var api = require("vue-hot-reload-api")
  api.install(require('vue'))

  if (api.compatible) {
    module.hot.accept()
    if (!api.isRecorded('233abcddef')) {
      api.createRecord('233abcddef', component.options)
    } else {
      api.reload('233abcddef', component.options)
    }
    module.hot.accept("./app.vue?vue&type=template&scoped=true&id=233abcddef", function(){
      api.rerender('233abcddef', {
        render: render,
        staticRenderFns: staticRenderFns
      })
    })
  }
}
```
先解释一下`module.hot.accept`的用途。

`module.hot.accept()`表示当前模块接受自己发生更新，并且这种更新不会传导到父模块；

`module.hot.accept("xxx", () => {})` 表示当模块xxx发生更新后，执行回调函数。

在研发环境，vue loader在计算id的时候，直接使用的是vue文件的路径，因此，当vue文件的内容发生变化的时候，id是不变的。

如果你修改了组件的`<template>`内容，就会导致`./app.vue?vue&type=template&scoped=true&id=233abcddef`这个模块发生变化，此时就会调用回调，促使组件rerender，使用新的render方法从新渲染。

如果你修改了组件的`<style>`或者`<script>`的内容，子模块的更新就会传导到本模块，`api.reload('233abcddef', component.options)`就会执行，组件就会重新渲染一次。

接下来，我们简单介绍下`vue-hot-reload-api`的思路。[源码](https://github.com/vuejs/vue-hot-reload-api/blob/master/src/index.js#L231)

为了使得组件可以自动更新，要先把组件记录下来：
```ts 
const record = {}
api.createRecord = (id, componentOptions) => {
  record[id] = {
    Ctor: null,
    options: componentOptions,
    instances: []
  }

  // 增加beforeCreate生命周期函数，收集组件实例
  componentOptions.beforeCreate.push(function() {
    if (record[id].Ctor === null) {
      record[id].Ctor = this.constructor
    }
    record[id].instances.push(this)
  })

  // 增加destroyed生命周期函数，删除组件实例
  componentOptions.destroyed.push(function() {
    const idx = record.instances.findIndex(instance => instance === this)
    if (idx > -1) {
      record.instances.splice(idx, 1)
    }
  })
}
```

当组件的代码更新时，强制组件实例更新：
```ts 
api.reload = (id, componentOptions) => {
  const oldRecord = record[id]
  // extend 等效于 Vue.extend
  const newCtor = oldRecord.Ctor.super.extend(componentOptions)
  oldRecord.Ctor.options = newCtor.options 
  oldRecord.Ctor.prototype = newCtor.prototype

  oldRecord.instances.forEach(instance => {
    // 使用 context.$forceUpdate() 更新，说的是instance的父组件更新；
    // instance.$forceUpdate() 更新，是instance自身更新；
    if (instance.$vnode.context) {
      instance.$vnode.context.$forceUpdate()
    }
  })
}
```
这套更新机制存在缺陷，如果你修改了组件的`data` `computed` `watch`，组件更新后，不会看到这种变化，因为只是把组件的options更新，而没有重新构建响应式系统，此时只能整个页面刷新才可以。但是，如果你修改了或者增加了组件的methods, 可以看到效果，因为组件在访问method的时候，通过`this.$options.methods`, options得到更新，method也就得到更新了。到了vue3版本，这个问题得到了解决，重新构建响应式系统，因此你修改了某个响应式变量的初始值后，页面就可以看到这个值。


## camelCase 还是 CamelCase
编写`<template>`部分的代码，为什么允许你这样写？
```html {3,4}
<template>
  <div class="main">
    <user-info /> 
    <UserInfo />  
  </div>
</template>
```

这里不是编译器做了什么兜底工作，而是vue运行时代码做了转换，vue源码：`src/core/util/options.ts#resolveAsset`

子组件的Ctor存储在父组件`vm.$options['cmponents']`, vue在渲染的时候，看到的`vnode.tag="user-info`, 它就可以额外做两个处理，第一个驼峰处理，把`user-info` 转为 `userInfo`， 第二个是首字母大写处理，把`userInfo`转为`UserInfo`，之后，运行时代码看看`user-info` `userInfo` `UserInfo` 哪一个能够命中 `vm.$options['cmponents']` 的键名。

经过这样的处理，你在写代码的时候，既可以用camelCase，也可以用camel-case, 还能用CamelCase。