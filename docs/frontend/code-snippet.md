---
title: "code snippet"
page: true
aside: true
---

## Description 
记录一些实用的代码片段

## 判断某个类是浏览器器native的
```js 
function isNative(API) {
    return typeof API === 'function' && /native code/.test(API.toString());
}
```
> From Vue2 source code