---
title: "Super Mario: Entry of Cpp World"
page: true
aside: true
---

# Super Mario: Entry of Cpp World
没有超级马力的童年，略有缺憾。长大后，回想暑假打游戏的场景，令人温馨。我的注意力不再是从超级马力的游戏里，获取快乐，而是想知道这样一款简单、易懂、好玩的游戏，是如何实现的。

在大学暑期活动中，我见过参加c语言游戏编程课的同学，编写代码，在计算机屏幕中把玩自己的游戏，我很兴奋，他们是怎么做到的？从他们那里得知，原来是学校提供了一个写游戏的脚手架，或者说是小型的游戏引擎，告诉他们使用方法，然后就可以编程，搞起自己的游戏了。

但这个引擎给我留下了非常糟糕的印象。安装引擎就遇到了很多问题，好不容易安装上了，启动引擎、编写代码，又遇到了很多问题。总之就是非常麻烦，界面不直观，代码提示一个没有，开发体验相当差劲。最后，我放弃了，折腾它太痛苦了。

现在，我就在想，难道以前也需要游戏引擎开发超级马力么？有没有更加直接、暴力的方法？在我眼里，越是直接、暴力，越能让人明白整个事情的第一性原理是什么。

谢天谢地，逛了一大圈，尝试了几个开源仓库，问了ollama若干问题之后，我大致明白了一些逻辑。

## SDL2
我找到的[开源项目](https://github.com/jakowskidev/uMario_Jakowski)采用cpp编写，并且用到了一个库——SDL2。这个开源项目可以如此下载：
```shell 
git clone https://github.com/jakowskidev/uMario_Jakowski.git 

# or 
git clone git@github.com:jakowskidev/uMario_Jakowski.git
```

问题来了，什么是SDL2？

SDL2，即 `Simple DirectMedia Layer 2`，本质上就是基于 OpenGL 和 Direct3D 封装了薄薄的一层API，可以直接控制计算机的图形显卡，你不用关心要为图形显卡准备什么数据，以及如何将数据从内存搬运到显卡，你只需要准备好API的数据结构，调用API，就可以在屏幕上开启一个窗口，绘制图形。图形展示只是 SDL2 提供的一个能力，它还封装了键盘、声音、鼠标等输入输出设备的控制，让你可以播放音频，掌握用户按了哪个键盘，点击鼠标的哪个键，双击还是单击，等等。steam上有不少游戏就是使用SDL开发的，有2D游戏也有3D游戏。SDL没有封装太深，距离硬件很近，因此性能优越。更多内容，可以去[SDL官网](https://www.libsdl.org)查看。

这个开源项目在编译之前，要求你安装如下依赖：
```shell 
brew install sdl2 sdl2_ttf sdl2_image sdl2_mixer
```

sdl2已经说过了。sdl2_ttf，你可以使用这个库在sdl2绘制的窗口里打印某种字体的文字。sdl2_image，你可以使用这个库在窗口里显示图片。sdl2_mixer，可以让你播放某个音频。sdl2可以播放音频，但是你要将音频转换为某种数据结构，然后送入sdl2的API里，很麻烦，sdl2_mixer只需要你告诉它音频文件的路径即可，剩下的脏活儿它都帮你搞了。sdl2_ttf和sdl2_image也是同样的道理。