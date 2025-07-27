---
title: "亮瞎你的眼——HDR图片"
page: true
aside: true
---

# 亮瞎你的眼——HDR图片
## 一张图片，亮瞎你的眼
请在支持HDR能力的显示器观看，比如MacBook Pro的mini led屏幕。

![一张青蛙的表情包，亮瞎你的眼](/frog.webp)

## 为什么会如此的亮
图片的元信息中夹带着HDR信息（一般是.icc的标识，icc是一个色彩配置的文件），支持HDR的显示器会识别这些信息，然后会丧心病狂地提升图片的亮度和对比度。这种HDR信息无法轻易看到，比如在macOS上鼠标右键，选择Get Info，需要使用图片解析程序，才能解析。

图片之所以夹带HDR信息，有两个来源。第一个来源，是相机在拍摄的时候，支持HDR，拍下来的图片就夹带着HDR，拍摄视频也是一个道理。在iphone15，设置->相机->录制视频->HDR(高效)，勾选之后，拍出来的视频就带有HDR信息，将这种视频嵌入到网页，或者直接预览，如果显示器支持HDR，就会亮瞎你的眼！

另外一个来源，是利用程序注入HDR信息。[hdrify](https://www.hdrify.com/)是一个在线工具，可以往普通的png/jpeg图片注入HDR信息，它背后的原理是使用`image-magick` 的wasm。[hdr-emoji](https://sharpletters.net/2025/04/16/hdr-emoji/)是一篇blog，教你如何使用`image-magick`制作一个亮瞎眼的工具。

## 注入HDR信息
在MacBook Pro上，有一种最简单的方式，就是用系统自带的`sips`命令行工具。

请下载<a href="/a.icc" download>icc文件</a>。这个文件是我从[hdrify](https://www.hdrify.com/)的js代码里搞到的。这种文件本身应该怎么制作，我还真不清楚。

随便找一个png文件或者jpg文件，假设文件名是 input.png。执行如下命令：
```shell 
sips --setProperty profile a.icc --out out.png input.png
```
你将得到一张out.png，它可以亮瞎你的眼。

## google浏览器上防止闪瞎
浏览器访问“chrome://flags/#force-color-profile”，将`Force color profile`改为`sRGB`就可以了。
