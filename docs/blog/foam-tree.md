---
title: "foamTree, behind webpack-bundle-analyzer"
page: true
aside: true
---

## Description
在优化webpack工程的时候，经常使用`webpack-bundle-analyzer`插件帮助分析包体积大小。惊叹于包体积分析报告的可视化展示，我很好奇它是怎么实现的，背后的原理是什么。在翻阅源码后，我发现它在绘制图像的时候，使用了`@carrotsearch/foamtree`, [其官网介绍](https://carrotsearch.com/foamtree/)。

原来背后的原理是 **foamtree**。这是个啥？我在[这篇文章](https://flowingdata.com/2014/07/10/foamtree-visualize-hierarchical-data-with-a-lot-of-groups/)了解到，其本质就是一个 **Voronoi Treemap**。

因此搞明白 Voronoi Treemap，真相就大白了。

利用google，我找到了一个[介绍它的网页](https://graphics.uni-konstanz.de/publikationen/Balzer2005VoronoiTreemaps/index.html), 是一个计算机视觉文献的入口网页。很不错，上面有 Voronoi Treemap 的[论文链接](https://graphics.uni-konstanz.de/publikationen/Balzer2005VoronoiTreemaps/Balzer2005VoronoiTreemaps.pdf)

访问不了论文，可以[戳这里](/Balzer2005VoronoiTreemaps.pdf)

## 原理细节
待补充。。。