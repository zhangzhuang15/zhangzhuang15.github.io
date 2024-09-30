---
title: "flex布局小结"
page: true
aside: true
---

## 默认表现
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
    }
    .c {
        background: lightgreen;
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
        }
        .c {
            background: lightgreen;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

默认情况下，flex容器内的元素是 `flex: 0 1 auto` 或者 `flex: initial`, 意思是，能收缩就尽可能收缩，但是不能伸长。于是，我们在效果图里看不到绿色的矩形。尽管如此，我们可以强行设置宽度和高度，就是浅蓝色矩形所表现的样子。

## 指定宽度
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
    }
    .c {
        background: lightgreen;
        width: 50px; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
        }
        .c {
            background: lightgreen;
            width: 50px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

这一次，我们给绿色矩形一个固定宽度 50px, 但不指定它的高度，结果发现，宽度和我们设置的一样，但是高度被自动拉伸，与 flex 容器保持一致。

## 增大宽度
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
    }
    .c {
        background: lightgreen;
        width: 50px; /** // [!code --] */ 
        width: 300px; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
        }
        .c {
            background: lightgreen;
            width: 300px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>
 
尽管我们增大了宽度，但是我们发现，蓝色区域也收窄了，绿色区域也收窄了，并非是我们预期的 300px。

## 继续增大，比容器大得特别多
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
    }
    .c {
        background: lightgreen;
        width: 300px; /** // [!code --] */ 
        width: 30000000px; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
        }
        .c {
            background: lightgreen;
            width: 30000000px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

比容器大许多时，蓝色区域就收得特别窄，以至于肉眼上看不到了，而绿色区域也没有被完全禁锢在flex容器范围内。

## flex: none
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none; /** // [!code ++] */
    }
    .c {
        background: lightgreen;
        width: 30000000px; 
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            width: 30000000px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

在给蓝色矩形指定了 `flex: none` 后，蓝色区域没有被收窄，而是维持在了自身基本宽度。

## flex: 1
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        width: 30000000px; 
        flex: 1; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            width: 30000000px;
            flex: 1;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

`flex: 1` 就是 `flex: 1 1 0`, 此时绿色区域被允许：
- 在有富裕的空间时伸长；
- 在没有富裕的空间时伸缩；

因此，我们看到绿色区域被收缩了，禁锢在flex容器内。

## flex: auto
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        width: 30000000px; 
        flex: 1; /** // [!code --] */
        flex: auto; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            width: 30000000px;
            flex: auto;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

`flex: auto` 就是 `flex: 1 1 auto`, 与 `flex: 1` 类似，区别在于基准宽度的考量，`flex:  1`的基准宽度可以按照0计算，就算你指定了width也无济于事。但是`flex: auto`的基准宽度会参考你设置的width，因此我们可以看到，绿色区域没有完全被禁锢在flex容器内。

## 如果绿色区域宽度窄一些，flex: 1会怎样？
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        width: 30000000px; /** // [!code --] */
        width: 30px; /** // [!code ++] */
        flex: auto; /** // [!code --] */
        flex: 1; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            width: 30px;
            flex: 1;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

## 如果绿色区域宽度窄一些，flex: auto会怎样？
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        width: 30px;
        flex: 1; /** // [!code --] */
        flex: auto; /** // [!code ++] */
    }
</style>
<div class="a">
    <div class="b"></div>
    <div class="c"></div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            width: 30px;
            flex: auto;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;></div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

## 维持 flex: auto 不变，往绿色区域加入一个很宽的节点，会怎么样？
绿色区域我们是手动设置宽度的，但开发情形中，我们往往是依赖绿色区域内的节点，将绿色区域给撑开。用节点撑开的宽度，会有什么不同吗？

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        width: 30px; /** // [!code --] */
        flex: auto;
    }
    .d { /** // [!code ++] */
        width: 30px; /** // [!code ++] */
        background: red; /** // [!code ++] */
        height: 10px; /** // [!code ++] */
    } /** // [!code ++] */
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div> <!-- // [!code ++]-->
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: auto;
        }
        .d {
            width: 30px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

绿色的宽度没有和红色宽度保持一致，相当于绿色区域搭建了一个定宽的区域。

如果将红色区域加大，会怎样呢？

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: auto;
    }
    .d {
        width: 30px; /** // [!code --] */
        width: 200px; /** // [!code ++] */
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: auto;
        }
        .d {
            width: 200px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

绿色区域追随红色区域的宽度。

于是我们有一个大胆的想法：能不能让绿色区域维持不动，如果红色区域特别宽的话，在绿色区域内形成横向滚动？

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: auto;
        overflow: auto; /** // [!code ++] */
    }
    .d {
        width: 30px; 
        width: 200px; 
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: auto;
            overflow: auto;
        }
        .d {
            width: 200px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

perfect !

但有一点美中不足，在红色区域比较窄的时候，绿色区域没有追随红色区域，感觉在空间上有些浪费。在 `flex: 1`的情况下，会不会有所改善呢？

## 维持 flex: 1 不变，往绿色区域加入一个很宽的节点，会怎样？
```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: auto; /** // [!code --] */
        flex: 1; /** // [!code ++] */
        overflow: auto;
    }
    .d {
        width: 30px; 
        width: 200px; 
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: 1;
            overflow: auto;
        }
        .d {
            width: 200px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

嗯嗯，在红色区域比较长的时候，和`flex: auto`表现一致。

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: 1;
        overflow: auto; 
    }
    .d {
        width: 30px; /** // [!code ++] */
        width: 200px; /** // [!code --] */
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: 1;
            overflow: auto;
        }
        .d {
            width: 30px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

看样子，也无济于事，和 `flex: auto` 表现一致。

不过，我们可以再改改 flex 属性试试。

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: 1; /** // [!code --] */
        flex: 0 1 auto; /** // [!code ++] */
        overflow: auto; 
    }
    .d {
        width: 30px; 
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: 0 1 auto;
            overflow: auto;
        }
        .d {
            width: 30px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

perfect!

红色区域比较长的话，还能有滚动效果么？

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: 0 1 auto; 
        overflow: auto; 
    }
    .d {
        width: 30px; /** // [!code --] */
        width: 300px; /** // [!code ++] */
        background: red; 
        height: 10px;
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: 0 1 auto;
            overflow: auto;
        }
        .d {
            width: 300px;
            background: red;
            height: 10px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

Perfect 🎉

说了半天，这种布局很有用么？

当然了。在小程序开发中，往往要使用 `scroll-view`, 这个组件要求必须给定一个固定宽度（如果横向滚动）或者固定高度（如果纵向滚动）。但是，这个固定的宽度或者高度，并不是随意指定的。通常情况下，它是用屏幕高度（或者宽度）减去部分固定区域的高度（或宽度）计算得到的。这种计算方式非常麻烦，还要用wx的API访问节点属性。有没有一种方式，可以根据固定区域的高度（或者宽度），自动计算剩余的固定高度（或者宽度），并且，当固定区域的高度（或宽度）自动变化时，剩余的固定高度（或宽度）也自动变化？

方法就是我们刚才提到的。flex容器模拟的是屏幕，蓝色矩形模拟的就是固定区域，而绿色区域不就是我们心心念念的固定宽度吗？我们只需要把`scroll-view`放在绿色区域内，并指定`scroll-view`的width为100%即可！

## height超过容器
如果绿色区域的高度，设置的比flex容器大，会怎样呢？

```html
<style>
    .a {
        display: flex;
        width: 200px;
        height: 100px;
        border: 1px solid black;
    }
    .b {
        width: 100px;
        height: 40px;
        background: lightblue;
        flex: none;
    }
    .c {
        background: lightgreen;
        flex: 0 1 auto; 
        overflow: auto; /** // [!code --] */
    }
    .d {
        width: 300px; 
        background: red; 
        height: 10px; /** // [!code --] */
        height: 200px; /** // [!code ++] */
    } 
</style>
<div class="a">
    <div class="b"></div>
    <div class="c">
        <div class="d"></div>
    </div>
</div>
```
效果图：
<iframe srcdoc="
<html>
   <head>
    <style>
        .a {
            display: flex;
            width: 200px;
            height: 100px;
            border: 1px solid black;
        }
        .b {
            width: 100px;
            height: 40px;
            background: lightblue;
            flex: none;
        }
        .c {
            background: lightgreen;
            flex: 0 1 auto;
        }
        .d {
            width: 300px;
            background: red;
            height: 200px;
        }
    </style>
   </head>
   <body>
    <div class=&quot;a&quot;>
        <div class=&quot;b&quot;></div>
        <div class=&quot;c&quot;>
         <div class=&quot;d&quot;></div>
        </div>
    </div>
   </body>
 </html>
"
width="400"
height="200"
style="border: none" 
/>

缺少了 overflow 的约束，纵向也直接超出 flex 容器的范围了。