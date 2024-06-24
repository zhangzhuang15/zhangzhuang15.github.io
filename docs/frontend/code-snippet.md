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

## 查看localStorage用了多少字节
```ts
new Blob(Object.value(localStorage)).size
```

## 复制一段文字（保留换行）
```ts 
async function copy(text: string) {
    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return
        } catch(e) {}
    }

    // 必须用 textarea, 如果用 div, 换行符就丢了
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style['width'] = 0
    textArea.style['height'] = 0
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
}
```