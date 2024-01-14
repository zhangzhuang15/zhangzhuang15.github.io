---
title: "安装"
page: true
aside: true
---

## 官网下载比较慢怎么办？

1. 进入官网，来到下载界面；
2. 打开浏览器控制台（谷歌浏览器用 command+option+I）, 切换到 network 选项卡中；
3. 在下载界面点击下载链接，此时 network 里可以看到下载请求，比如下载 apple silicon 版本的 vscode 就会有如下请求：
   `https://az764295.vo.msecnd.net/stable/2b9aebd5354a3629c3aba0a5f5df49f43d6689f8/VSCode-darwin-arm64.zip`
4. 将这个网址 az\*\*.net 这部分内容替换为 vscode.cdn.azure.cn
5. 在终端执行 `curl 新的网址 -o ./vscode.zip`
6. 两三秒钟，安装包就会下载到 vscode.zip，解压安装即可

<Giscus />
