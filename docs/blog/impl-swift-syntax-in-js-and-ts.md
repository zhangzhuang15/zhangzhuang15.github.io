---
title: "在js和ts中实现swift的拖尾调用语法"
page: true
aside: true
---

## Description
swift的某些语法比较实用，能提高代码可读性，但是这些语法在javascript和typescript里不存在。其中的一个代表，就是拖尾调用语法。本文即尝试实现拖尾调用语法。

拖尾语法示例：
```swift
func hello(callback: () -> Void) {
    callback();
}

let message: () -> Void = { () in 
  print("hello world")
}

// 常规语法表达
hello(message)

// 拖尾调用语法表达
hello() { () in 
  print("hello world")
}
```

typescript实现起来更难，因为它要考虑以下的问题：
- typescript编译器定制化
- 消除编辑器内syntax错误提示

而javascript的实现，可以先不考虑syntax错误，直接使用babel转译代码即可。

最终，我们希望实现如下效果：
```js
function hello(callback) {
    callback()
}

hello() { in 
    console.log("hello world")
}

// 上述代码实际会被编译为：
// hello(() => { console.log("hello world")})
// or
// hello(function(){ console.log("hello world")})
```

## 在JavaScript中支持
参考：
- [babel-plugin-syntax-no-paren源码](https://github.com/AFatNiBBa/babel-plugin-syntax-no-paren/blob/master/src/main.js)： 一个babel插件，支持书写if语句时，省略小括号

由于我们引入的语法并不是esmodule标准语法，babel在得到AST之前就会报错，说某某语法是非法的。借鉴`babel-plugin-syntax-no-paren`的做法，我们使用 `register-babel-syntax`覆盖babel解析器的行为，跳过报错环节，之后就是按照标准的AST解析、遍历，将代码还原成正常的调用.


## 在Typescript中支持
几个参考：
- [typescript transformer handbook](https://github.com/itsdouges/typescript-transformer-handbook): 介绍如何使用typescript的API修改AST

- [how to use compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API):微软官方tutorial, 教授如何使用typescript compiler

- [how to write language service plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin): 微软官方tutorial, 教授如何编写一个插件，就是tsconfig.plugins对应的插件
> tsconfig.plugins虽然准许你使用插件，但是插件的功能受到约束，只能做某些事情，像拓展一个新的语法，就没办法使用插件做到

- [typescript ast viewer](https://ts-ast-viewer.com/#code/GYVwdgxgLglg9mABACwKYBt10QCgJSIDeAUImYhAgM5zqoB0WA5jgOQDucATugCat4A3MQC+xYqEiwEiKpQAOqAPJhU+IqUQA3AIZdECVIgC8iVgElEOgLaIYSKGlkKjELqh1RUvRACMAnogABnJwiipqeEGswpqS0PBIoYoAKpzqJOQGqiZmljYU7p72TFaIquzBhkF+IFCIdDpaJYjuwKjukEb2wcnKqvg1Oliq9DGaYmIS4AkydTDoOBDD6L46EADWBJnky5hrm-ii4vOL2yJAA): 在线展示typescript代码对应的AST
