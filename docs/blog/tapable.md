---
title: "偷师tapable三个技术点"
page: true
aside: true
---

# 偷师tapable三个技术点
## 因何而起
记得上次找工作的时候，我再次重温被`webpack`八股文虐过的日子。以至于到后来成功入职，我对 `webpack` 仍心有余悸。实际上我准备了`webpack`方面的内容，结果面试的时候没问😅。

虽侥幸逃过一劫，但入职之后私下里还是复盘了下`webpack`源码。其中`webpack`在`hook`方面没有自己独立实现，而是依赖了一个叫做 `tapable` 的第三方库。我顿时感到惊奇。`webpack`这么牛皮的库竟然也有`dependency`?
> 更新一下哈，这个地方打脸了😭。`tapable`是由`webpack`原作者独立开发，没有任何外部依赖。

于是乎，我拜读了`tapable`源码，发现了三个技术点，今天分享给大家。

## 骚到起飞的`Function`
以前我们要想封装一套逻辑，就会去定义一个函数，比如下面：
```ts
function sayHello(name: string) {
   if (name === "杰克-逊の黑豹") {
         console.log("hello Michael");
   } else {
         console.log("我才不和你hello呢");
   }
}
```
注意，这个函数是静态定义好的，后续的函数体不会发生变化。换句话说，函数体的内容你其实早就知道了, 是固定的。

如果是下面这个情形，该怎么办呢。

```ts
let isMichael = true;

function sayHello(name: string) {
   // 我希望在代码运行期间，如果 isMichael = true,
   // 函数体的内容是这样：
   //
   // if (name === "杰克-逊の黑豹") {
   //      console.log("hello Michael");
   // } else {
   //       console.log("我才不和你hello呢");
   // }
   
   // 如果 isMichael = false, 函数体的内容是这样：
   // console.log("杰克-逊の黑豹 say hello to you, " + name);
}
```

`tapable`就使出了`Function`。
> 说实话，平常开发都和具体的函数打交道，谁会想到`Function` ? 
> 除了原型链八股文中会扯上`Function`，其他场景我还真是孤陋寡闻了。

![截屏2023-06-16 21.07.55.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/78b384ce61d441ec9e1145ccd2589c35~tplv-k3u1fbpfcp-watermark.image?)

上图是`tapable`的一个截图，简单的说，`Function`就是这么用的：
```ts
let sayHello = new Function("name", 
             "if (name === '杰克-逊の黑豹') { \n" +
             "      console.log('hello Michael'); \n" +
             "} else { \n" +
             "      console.log('我才不和你hello呢'); \n" +
             "}");
             
// 相当于定义了上文描述的sayHello函数

// “name” 就是函数参数名， 
// 如果有多个参数，可以这样定义：
//    new Function("name1", "name2", "...nameRest", "console.log(name1)")
//    new Function("name1,name2, ...nameRest", "console.log(name1)");
//
// 如果没有参数，可以这样定义：
//    new Function("console.log('hello Michael')")

// Function的第二个参数就是函数体，一个字符串，注意哈，这直接表示的就是函数体内容，函数体开始
// 和结束的 “{”   "}"  不用写！

// 我们也可以在函数体内使用 arguments 变量
```
再来简单说下tapable中的场景：
tapable将一个回调函数格式定义为一个hook，这个hook表明了回调函数的入参名字叫什么。这个hook上可以定义多个事件，但是这些事件的回调函数格式都是一样，拥有一样的入参。hook上每定义一个，tapable称之为顶一个tap。当hook被触发时，hook上定义的所有事件就会被触发，事件回调函数就会执行。

按照这种逻辑，我们会把tap存储到一个队列中，然后依次取出来，执行回调函数就可以了。

但是tapable的做法是将回调函数取出来，然后用Function调用封装在一起，再去执行这个函数。
> hhhh, 可能`webpack`的慢有一些道理在这里？

可问题来了，回调函数似乎没办法序列化成字符串，然后集成到Function中耶。

该怎么办？该怎么办呢？（坏笑）

这就是`Function`比较骚的地方了。

`Function`函数体部分是在全局范围内捕捉变量的。

请看：
```ts
let sayHello =  new Function("console.log('hello, ', this.name)");
let peter = {
     name: "Peter",
     // this.name 中的 this 说的是 peter 对象
     sayHello,
};

peter.sayHello();

// “hello, Peter”

let tim = {
     name: "Tim",
     sayHello,
};

tim.sayHello();

// "hello, Tim"
```

怎么用呢？

我们虽然不能把回调函数自身变成字符串塞进Function，但是在存储的时候，我们知道回调函数存储在了哪个队列变量中，在队列里的下标是多少，那么这个队列变量就像例子中的`peter.name`一样，可以嵌入到Function中，间接地将回调函数接入到Function中了。

这种操作，我觉得挺神奇的。

## 总有惊喜的`constructor`
tapable有严密的面向对象设计格式，而不是函数式。不过呢，它没有严格去使用 `extends` 去完成继承。而是使用改写 `constructor`的方式。

比如：

![截屏2023-06-16 22.59.56.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4873af63b24c400aa8393945c4a95a0a~tplv-k3u1fbpfcp-watermark.image?)

* hook是由Hook产生的，但是却将constructor重定向到 SyncHook, Hook是父类，SyncHook是子类；
* SyncHook.prototype设置为null，这样可以避免hook顺着原型链访问到不必要的方法；
* 在这种设计下，想给hook暴露什么方法，直接将方法赋值给 hook 即可，不用玩原型链；

这种设计其实挺好的，`取我所需，无需则我分文不取`。

有个地方混淆到我了。

原本我以为`constructor`只存在于函数的prototype属性上，比如`Hook.prototype.constructor`.

而实例化的对象上也有该属性，比如`(new Hook()).constructor`。

## 常见套路——子类覆写方法
看看父类的`Hook` comiple方法:
![截屏2023-06-16 23.16.27.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5ef672e09e7041d3b21991a90b64bdd7~tplv-k3u1fbpfcp-watermark.image?)

看看子类`SyncHook` compile方法：
![截屏2023-06-16 22.59.56.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4873af63b24c400aa8393945c4a95a0a~tplv-k3u1fbpfcp-watermark.image?)

直接在父类的compile方法**故意抛错**，强制子类去覆盖此方法，这是在拿运行时来保证，有点狠啊。

除此之外，在 python 的一些框架中也有这样的设计处理，可能就是一种行业默认的套路吧。

## 结语
这只是能用得上的小技术点而已，对于tapable而言，其整体编码架构才更值得称叹，结构非常有条理，耦合解开得也很棒，扩展性特别棒。就是读起代码，想梳理清楚，不是那么轻松。


<Giscus />