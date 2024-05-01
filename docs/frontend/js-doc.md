---
title: "jsdoc常用语法"
page: true
aside: true
---

## Description
例举一些常用的jsdoc语法，以供查找，防遗忘

## 定义一个类型
```js
/**
 * 
 * @typedef {Object} Param 参数
 * @property { string } userId 用户ID
 * @property { string } [name] 用户姓名
 * 
 */
```
以上定义等价于：
```ts
/** 参数 */
interface Param {
    /** 用户ID */
    userId: string;
    /** 用户姓名 */
    name?: string;
}
```

## 声明变量的类型
```js 
/**
 * @type {Param}
 */
const param = {};
```

## 导入类型
```js
/** @typedef {import("../types/index").Cat } Cat */

/**
 * @type {import("../types/index").Cat}
 */ 
const myCat = {};
```

## 类型链接以及重命名
```js
/**
 * 
 * visit the definition {@link Cat.name}
 * 
 * visit the definition {@link Cat.name | catName}
 * 
 */
```