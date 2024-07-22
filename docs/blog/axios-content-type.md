---
title: "axios和content-type请求头"
page: true
aside: true
---

## Description
最近遇到了一个问题，使用axios@0.18.1版本发送一个FormData类型的数据给后端时，后端接口报错，说是请求头里的`Content-Type`不对，后端希望是`multipart/form-data`, 但前端传送的是 `application/x-www-form-urlencoded`;

## FormData
`multipart/form-data`和`application/x-www-form-urlencoded`有着明显的不同。

前者传送给后端的请求体会是这个样子：
```
Content-Disposition: form-data; name="text1"

foo
------WebKitFormBoundaryJaZFtrTQhsoBhR1o
Content-Disposition: form-data; name="text2"

bar
------WebKitFormBoundaryJaZFtrTQhsoBhR1o
Content-Disposition: form-data; name="text2"

baz
------WebKitFormBoundaryJaZFtrTQhsoBhR1o
Content-Disposition: form-data; name="intent"

save
------WebKitFormBoundaryJaZFtrTQhsoBhR1o
Content-Disposition: form-data; name="hwllo"

peter
------WebKitFormBoundaryJaZFtrTQhsoBhR1o--
```
:::tip <TipIcon />
google浏览器的payload会自动解析，解析出来的格式更友好：
```
Form Data    view source   view decoded
text1: foo
text2: bar
text2: baz
intent: save
hwllo: peter
```

非常类似于传送query的情景，只不过这些参数位于请求体里，而不是url里。
:::

后者更像query，通过编码和&符号连接起来，只不过这些参数位于请求体里面。当然，google浏览器也会自动解析，解析出来的样子和上边一样；

## axios的糟糕行为
axios@0.18.1版本中，一旦看见要发送的数据是 FormData 类型，就会将 Content-Type header删除掉，然后交给浏览器自动设置；

你没有听错，当axios底层调用 XMLHttpRequest.send 的时候，浏览器会根据要发送的数据类型，自动设置好 Content-Type;

在这个版本，我们无法如此强制设置：
```js
axios("url", {
    method: "POST",
    data: formData,
    headers: {
        "content-type": "multipart/form-data"
    }
})
```

## 让浏览器设置 "multipart/form-data"
我们通过什么手段可以让浏览器自动设置 "multipart/form-data"呢？

答案就在 FormData 里。默认情况下，发送FormData，浏览器会采用`application/x-www-form-urlencoded`。但是 FormData 函数第一个参数，可以让我们指定一个`<form>`元素。

而`<form>`元素有个`ectype`属性，当设置为 "multipart/form-data"，它所触发的submit行为，其请求中的content-type就会设置成 "multipart/form-data"，而默认情况下，该属性值是“application/x-www-form-urlencoded”。

因此我们可以这样做：
1. 创建一个`<form>`元素，将其ectype设置为 "multipart/form-data"；
2. 该元素不必加入到 document.body 中，直接传给 FormData;
3. FormData利用 formData.append() 方法设置好数据后，传给 axios;

