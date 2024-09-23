---
title: "用circle svg绘制圆环"
page: true
aside: true
---

## Description
业务开发过程中，总会遇到展示 loading 效果的需要，通常，它展示为一段固定颜色的圆弧，加以旋转。

还有一种情形，我们需要展示当前的进度，比如充电进度，通常，它展示为一个圆环，用一段固定颜色的圆弧，表示当前充电进度。

以上两种情形，本质就是绘制圆圈和圆弧的问题。

## 绘制方法
或许你会想尝试这些绘制方法：
1. 用 css border
2. 用多个dom合成
3. box-shadow
4. background 配合颜色合成函数 `radial-gradient`

上述的这些方法，都有缺陷：
1. 可以画完整的圆环，但不能画圆弧
2. 可以画圆环，也可以画圆弧，但圆弧两端不能实现圆角
3. 可以画圆环，但无法画圆弧
4. 可以画圆环，也可以画圆弧，但圆弧两端不能实现圆角

## svg 绘制
svg 和 canvas 绘制，是一种比较好的方法。用 canvas 绘制固然可行，但给人一种杀鸡用牛刀的感觉，因此，用svg绘制比较合适。

绘制圆环，非常简单，用 `circle` 就搞定了：
```html
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <circle 
      cx="40" 
      cy="40" 
      r="20" 
      fill="white"
      stroke="blue"
      stroke-width="2" 
      stroke-linecap="round"
    />
</svg>
```

如此一来，我们绘制了一个圆心在 (40px, 40px)，半径为 20px 的圆环，圆环的颜色为蓝色，宽度为 2px, 而且圆环的端点是圆角，因为是一个完整闭合的圆环，你无法看到圆角。

比较麻烦的地方，就是画圆弧。

圆弧，要用`stroke-dasharray` 和 `stroke-dashoffset` 控制。

```html
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle 
      cx="40" 
      cy="40" 
      r="20" 
      fill="white"
      stroke="blue"
      stroke-width="2" 
      stroke-linecap="round"
      stroke-dasharray="62.8 62.8"
    />
</svg>
```
绘制结果：
<section style="width: 200px; height: 200px; background: white">
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle 
      cx="40" 
      cy="40" 
      r="20" 
      fill="white"
      stroke="blue"
      stroke-width="2" 
      stroke-linecap="round"
      stroke-dasharray="62.8 62.8"
    />
</svg>
</section>

`stroke-dasharray`的两个数，是什么意思？ `62.8` 又是什么意思？

`stroke-dasharray: a b`表示，圆环上的线条是一段长度取a,然后空出长度为b的距离，接着画出下一条长度为a的线段....循环往复，直到画到圆环的终点。

62.8很好理解，我们的圆环半径是20, 那么周长是多少呢？2 * 3.14 * 20 = 125.6。圆环周长的一半就是62.8了。所以，你会看到，我们画出来的结果，是半个圆环。

改变`stroke-dasharray`的两个值，你可以控制圆弧的长度。

但另外一个问题，令我们非常困惑，为什么圆弧不是从圆心正上方的点开始画起呢？如果让它从最上边的点画起？

解决这个问题，要依靠 `stroke-dashoffset`。

先要知道一个基本要点：圆弧从圆心右侧的端点开始画起，沿着顺时针的方向画。

如果想让圆弧从正上方开始绘制，有一个偷懒的方法，使用 `transform`逆时针旋转90度即可。

另外一个方式，是设置 `stroke-dashoffset: 31.4`。

31.4, 就是四分之一的圆环长度。 意思就是，圆弧照旧从圆心右侧的端点画起，但是要画的线段，要沿着顺时针方向，偏离31.4，也就是说，原先开头的31.4长度的圆弧，直接掐掉，不画了。结果就是，原本在圆心正下方的端点，被画在了圆心右侧的端点位置上；原本在圆心左侧端点结束的圆弧，会在圆心下方的端点结束；结束之后，就该空出62.8的长度了，刚好就到了圆心正上方的端点；但是，我们的圆弧没有画完，于是继续绘制蓝色的线条，直到在圆心右侧端点闭合。于是，我们看到，画出来一个半圆环，一个端点在圆心上方，一个端点在圆环下方。

绘制结果：
<section style="width: 200px; height: 200px; background: white">
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <circle 
      cx="40" 
      cy="40" 
      r="20" 
      fill="white"
      stroke="blue"
      stroke-width="2" 
      stroke-linecap="round"
      stroke-dasharray="62.8 62.8"
      stroke-dashoffset="31.4"
    />
</svg>
</section>

:::tip <TipIcon />
细心的话，你会发现构成圆环的线条宽度是2，其中心线到圆心的距离刚好是20。如果你想让线条宽度是 a， 以 (r + a/2) 为半径的点，都必须落在 svg 内部。否则的话，线条的一部分宽度会被裁减，看上去比预计的要窄。
:::