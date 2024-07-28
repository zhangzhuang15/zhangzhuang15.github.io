---
title: "homebrew工具"
page: true
aside: true
---

# homebrew 工具

## 安装 homebrew

### 官网方式

`/bin/bash -c "$(curl -fsSL https://cdn.jsdelivr.net/gh/ineo6/homebrew-install/install.sh)"`

### 清华镜像方式

外网的问题，造成官网方式不可顺利下载，可以考虑清华镜像的方式

```shell
export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"


git clone --depth=1 https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/install.git brew-install
/bin/bash brew-install/install.sh
rm -rf brew-install
```

安装完毕后，将 brew 指令注册到 shell 里:

```shell
test -r ~/.bash_profile && echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.bash_profile
test -r ~/.zprofile && echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

最后，将 homebrew 的源替换为清华的：

```shell
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
brew tap --custom-remote --force-auto-update homebrew/core https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git
brew tap --custom-remote --force-auto-update homebrew/cask https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask.git
brew tap --custom-remote --force-auto-update homebrew/cask-fonts https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-fonts.git
brew tap --custom-remote --force-auto-update homebrew/cask-drivers https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-drivers.git
brew tap --custom-remote --force-auto-update homebrew/cask-versions https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask-versions.git
brew tap --custom-remote --force-auto-update homebrew/command-not-found https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-command-not-found.git
brew update
```

## asciinema

这款工具可以录制你的终端，将其转化为本地的动态图或者视频，也可以上传到其官网平台，拿到资源链接，
将其插入到网页或者 markdown 中。

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
3. 生成 gif 图像 `asciicast2gif demo.cast demo.gif`
   > 如果缺少依赖，可能会有这样的错误`error: ImageMagick not installed? Executable 'convert' not found`
   > 你就要检查是否安装 `gifsicle` 和 `imagemagick` 了


## ffmpeg
无比强大的音视频处理工具，众多音视频软件的基石；

自身安装：

```shell
brew install ffmpeg
```

### 将 mpeg 格式转换为 mp4 格式
mp4文件拥有很多的编码格式，有一些格式无法被iMovie，macOS自带播放器等识别，比如mpeg-4格式，需要对它们做格式转化处理。

这个时候，就可以如此处理：

```shell
ffmpeg -i source.mp4 -c:v copy -c:a copy -vcodec h264 output.mp4
```

`source.mp4`就是有编码格式问题的文件；

`h264`指定新的编码格式为h264;

`output.mp4`是输出的文件路径，相对路径和绝对路径都可以；

### 多个mp3合并
```shell 
ffmpeg -i "concat:1.mp3|2.mp3|3.mp3" -c copy ./out.mp3
```

### mp4转mp3
```shell 
ffmpeg -i output.mp4 -vn -ar 44100 -ac 2 -b:a 192k output.mp3
```
:::tip <TipIcon />
192k指的是音频比特率，值越大，单位时间采取的数据越多，音乐质量越高，
  常见取值： 32k 48k 64k 96k 128k 192k 256k;
  建议使用 大于 32k 的值，32k的时候，声音会断断续续，发虚，这里有一个实验：
     原来的音频是2.1M，经过不同比特率处理后，得到的新文件的大小
           32k         1.2M
           48k         1.5M
           64k         2M
          72k         2M
           80k         2.5M
           96k         3.1M
:::

### mp4去字幕
```shell 
ffmpeg -i video.mp4 -vcodec copy -acodec copy -sn video-no-subs.mp4
```

### 多个mp4合并
```shell
ffmpeg -i "concat:1.mp4|2.mp4|3.mp4" -c copy ./out.mp4
```

### mp3合并到mp4
```shell 
ffmpeg -i 1.mp3 -i 1.mp4 -c copy merged.mp4
```

## python2
采用`brew install python@2` 无法安装 python2, 可以使用如下方法：

```shell
brew install pyenv
pyenv install 2.7.18
echo 'PATH=$(pyenv root)/shims:$PATH' >> ~/.zshrc
pyenv init
pyenv shell 2.7.18
pyenv global 2.7.18
```

[参考](https://dev.to/jordicuevas/how-to-install-python2-in-a-macbook-m1-with-brew-bhi)


[直接从python官网安装](https://www.python.org/downloads/release/python-2718/)

<Giscus />
