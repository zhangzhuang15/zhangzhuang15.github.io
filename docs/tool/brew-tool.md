---
title: "homebrew工具"
page: true
aside: true
---

# homebrew工具 

## asciinema
这款工具可以录制你的终端，将其转化为本地的动态图或者视频，也可以上传到其官网平台，拿到资源链接，
将其插入到网页或者markdown中。

自身安装： 
```sh  
brew install asciinema
```

### 转化为本地的动态图  
还需要安装一些额外的工具：
```sh 
npm install -g asciicast2gif
brew install gifsicle 
brew install imagemagick 
```

> `asciicast2gif` 依赖 `gifsicle` 和 `imagemagick `


<br>

录制过程：
1. 在终端上，执行`asciinema rec demo.cast`
2. 开始你的终端操作，比如输入`git branch -vv`， 操作完毕后，按下 `Ctrl + D`， 结束录制
3. 生成gif图像 `asciicast2gif demo.cast demo.gif`
    > 如果缺少依赖，可能会有这样的错误`error: ImageMagick not installed? Executable 'convert' not found`
    > 你就要检查是否安装 `gifsicle` 和 `imagemagick` 了







<Giscus />