---
title: "slidev"
page: true
aside: true
---

# slidev 
slidev是一个工具，让你在网页构建类似于PPT的演讲稿，因为它完全是基于web技术实现的，因此能呈现出什么内容，取决于你的创意。slidev主要基于vue+vite，与vitepress不同，后者是创建静态应用，比如个人博客，相片画廊，而slidev内置了鼠标点击交互，能够切幻灯片，分步动画等能力，点击一下，画面动一下那种。

这个文章不会介绍slidev的用法，官网已经非常完备。这里要介绍的是，slidev里的某些效果，是怎么实现的，我们会介绍里边的原理，尽量说的简洁明白，不用太费脑子。

## rough notation

### 前绪
slidev基于rough notation技术，可以让你用手写涂鸦的方式，给文字做一些标记，比如文字下划线，用彩色的椭圆圈住文字，用橘黄色涂抹文字（类似于你用记号笔涂抹实体书的文字）。

![rough notation效果](/rough-notation.png)

想直观感受更多效果，可以看看[rough notation官网](https://roughnotation.com)。

在介绍之前，先给出源码链接:

1. [rough notation源码](https://github.com/rough-stuff/rough-notation)
   
2. [roughjs源码](https://github.com/rough-stuff/rough/tree/master)

你所看到的效果，其实都是`svg`，无论是涂鸦、线条、圆圈、叉子、中括号，都是用`svg`以及其内嵌的`<path>`实现的。

比如，你想给`<span>hello world</span>` 添加下划线效果，这个dom节点就是target节点，rough notation会为target节点创建一个`svg`节点，放在target节点前边或者后边，然后把target节点改为`position:relative`，把`svg`改为`position: absolute`。让`svg`的左上角对齐target节点的左上角。

那么下划线的位置怎么获取呢，其实就是读取target节点的clientRect信息，拿到其bottom值，这个值是相对于视口而言的，还需要将它转化为相对于`svg`的值。

做法也很简单，就是读取`svg`的clientRect，得到`svg`的bottom信心，用target的bottom减去`svg`的bottom，就是相对于`svg`的y轴坐标了，那么，在`<path>`中加入移动到这个坐标的指令，以及画线的指令，就能得到最终的下划线效果了。

你可能会问，`svg`需要设置宽和高么？答案是需要设置，但这个并不重要，给出一个初始设置就可以了，比如宽和高都是`100px`。如果下划线的位置太低，从`svg`的区域中跑出去了怎么办呢？方法也简单，给`svg`设置`overflow: visible`就可以了。

### 轮廓线的计算
我们知道, 编写`<path>`里的绘制指令非常麻烦，难道画线条、画圈要我们手搓么？

当然不用，这也就是rougth rotation为什么要依赖roughjs。根据你要绘制的形状，调用roughjs的api，它就会把绘制指令告诉你。

```ts [example.ts]
import { line } from "roughjs/bin/renderer"

const leftBottomPoint = { x: 20, y: 40 }
const rightBottomPoint = { x: 120, y: 40 }

// 告诉line两个点坐标，它就会告诉你，把这两个
// 点连接起来要用怎样的指令；
// line(startPointX, startPointY, endPointX, endPointY)
const operation = line(
  leftBottomPoint.x, 
  leftBottomPoint.y,
  rightBottomPoint.x,
  rightBottomPoint.y
)

// roughjs 通过op告诉你要执行什么指令，
// 通过data告诉你这个指令的参数是什么
const { op, data } = operation
// <path>的属性d设置成path
let path = ''
switch (op) {
  // 画线
  case 'lineTo':
     path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
     break;
  // 移动画笔
  case 'move':
    path = `M${data[0]} ${data[1]} `;
    break;
  // 贝塞尔曲线
  case 'bcurveTo':
    path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
    break;
}
```

接下来要考虑的问题是，roughjs是怎么实现手绘风格的线条呢？

从感性的角度看，什么是手绘风格呢？就是人在画一条线的时候，没有尺子比着，画出来的线不是笔直的，而是轻微的曲线，并且还会有轻微的抖动，导致行笔的轨迹很随机。于是，我们知道给一条直线加入弯曲，再对弯曲程度加入随机性，那么这条直线就会变成手绘风格的线。

考虑到曲线，roughjs就使用贝塞尔曲线达到目的。在贝塞尔曲线的指令中，需要三个参数，前两个是控制点，最后一个是结束点。于是，我们就想，如果这两个控制点比较随机的话，那么曲线就会带有随机。

于是就可以引入随机数，让起始点的x,y坐标值按照这个随机数，做短距离的偏移，得到两个控制点，画出来的曲线就够随机了。为了更接近手写风格，roughjs还会从终点到起点再画一条线，因为随机性，两条线并不会严格重合，而是在两端会有分叉，这就很像人手写的习惯了。

这里要介绍一个数学上的技巧。起点:A$(x_1, y_1)$到终点: B$(x_2, y_2)$绘制线段时，为了让线向线段的垂直方向弯曲一些，需要给贝塞尔曲线的控制点C$(x_3,y_3)$设置两个分量的偏移量。

线段AB的向量:

$\overrightarrow{AB} = (x_2 - x_1, y_2 - y_1) = (dx, dy)$

而其垂直向量:

 $\vec{v} = (y_2 - y_1, x_1 - x_2) = (dy, -dx)$

让点C往垂向量方向偏移，那么就可以做如下的变换：

$$
\begin{cases} 
  x'_3 &= x_3 + dy \times \epsilon_1 \\
  y'_3 &= y_3 - dx \times \epsilon_2
\end{cases}
$$

其中$\epsilon_1$和$\epsilon_2$类似于步长的概念，值越大，越往垂直向量的方向偏。

除了绘制线段外，在绘制椭圆的时候，也用到了椭圆的参数方程：

$$
\begin{cases}
  x &= c_x + r_x \times \cos \theta \\ 
  y &= c_y + r_y \times \sin \theta
\end{cases}, \quad \theta \in (0, 2\pi), \space \theta: 离心角
$$

其中，$(c_x, c_y)$ 是椭圆中心，$r_x$ 是x轴上的半轴长，$r_y$ 是y轴上的半轴长。在计算椭圆上轨迹点的坐标时，这几个变量的值都是知道的，只需要离散采取 $\theta$ 的值，就能得到若干点坐标。这些点坐标用上边提到的画线段的方法，全部连接起来，就形成了手绘风格的椭圆。

### 填充线的坐标计算
轮廓线的问题清楚了，该轮到填充了。rough notation提供的填充是使用密密麻麻的线条填充，而不是用纯背景色。说到底，还是画线的问题。可特别之处在于，线的数量多，线的两头都要和轮廓线形成交点。

roughjs自然提供这样的功能，直接告诉你这些线的两个端点坐标是什么。它使用了[hachure-fill](https://github.com/pshihn/hachure-fill/blob/master/src/hachure.ts), 计算出这些坐标。

计算的思路就是扫描法。

设想有一个闭合的多边形。我们先将多边形逆时针旋转一个角度，然后有一个水平方向的直线，从多边形的最低点开始，按照一定上升距离，往上扫描，那么这条直线就会和多边形左右两侧的边相交，这两个点就是我们想要的坐标。而坐标的计算很简单，我们以右侧边的交点为例。

$$
\begin{cases}
  y &= y_{min} + y_{offset} \\
  x &= x_1 + (y_{min} + y_{offset} - y_1) \times k 
\end{cases}
$$

$(x_1, y_1)$ 是右侧边更低那端的点，$y_{min}$是多边形最低顶点的y坐标，$y_{offset}$是水平直线往上移动的距离，k是右侧边的斜率。因为我们知道右侧边的两个端点坐标，因此斜率k能够计算出来。

当直线往上移动，经过多边形最上边的顶点，所有用于填充的线段的坐标，我们就都得到了。但是，这些线段都是水平的。接下来，我们需要把多边形按照顺时针转回去，同时把这些线段也按照顺时针同样的角度转回去。这样，线段就不会是水平的，而是斜的。

这里又牵扯到坐标旋转变换，我们考虑 A$(x,y)$ 绕着 $(0,0)$ 逆时针转动 $\theta$ 度得到 B$(x', y')$

$$
\left\{
\begin{array}{rl}
  x' = x \times \cos \theta - y \times \sin \theta \\
  y' = x \times \sin \theta + y \times \cos \theta
\end{array}
\right.
$$

以及逆向变换

$$
\left\{
\begin{array}{rl}
  x = x' \times \cos \theta + y' \times \sin \theta \\
  y = y' \times \cos \theta - x' \times \sin \theta
\end{array}
\right.
$$

> 使用极坐标系更容易推导


我们还能借助上边讲过的垂直方向偏移的经验，把线段变成z型。原理就是让线段两端的点A和B，沿着垂直方向偏移一些距离，得到A'和B', 那么ABA'B'就构成了z型：

```txt 
 A       B
 --------
       /
      /
     /
    /
   /
  /
 /-------
 A'     B'
```

填充线也可以是虚线，也可以是dot线。

因为线段的坐标我们知道，完全可以将线段分割成若干部分，而每小段的坐标我们也能就按出来（有斜率可太方便了），那么，如果把奇数段画出来，偶数段省略，那吗画出来的不就是虚线了嘛。

同理，dot线也能画，dot可以用椭圆近似，也是把线段分成小段，奇数段的中心点就是椭圆中心，我们在给出另一个方向的半轴长，就能画出椭圆，因为椭圆非常小，因此整体看上去就是一个dot，偶数段的不用画，这样下来，不就是dot虚线了嘛。

当然了，这些都是大概思路，具体实现要用多很多近似计算，可以看[roughjs源码](https://github.com/rough-stuff/rough/tree/master)

### path的长度竟然能计算出来
使用`<path>`绘制了一条不规则的轨迹，这条轨迹的长度竟然可以拿到。

```ts twoslash
const SVG_NS = "http://www.hello.com/123/url"
const path = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
// 这个就是轨迹的长度
const length = path.getTotalLength()
```

### 换行文字所在的rect
试想`<span>`里有不少文字，产生了换行，然后在页面里渲染成：
```txt 
         hello world
this is a test, not  
really important part
```
我们可以获取到这三行文字所在的rect信息！

```ts twoslash
const span = document.createElement("span")
// rects 里存储的就是每一行文字所在的rect信息，
// 利用这个，就可以使用svg + path，给多行文字
// 刷上不同的背景颜色了
const rects = span.getClientRects()
```