---
title: "下载html遇到的gzip问题"
page: true
aside: true
---

## 问题描述
近期，我想研究如何下载B站的视频。在之前，我采用过一种方式下载，但是太麻烦了。我必须打开网页，
调出浏览器的Network面板，找到视频或者音频的链接。现在，我想把网页下载到本地，看看从网页中
能不能发现一些线索，找到音频或者视频的链接。

我用curl下载网页，并写入到指定的html文件：
```shell
curl "{http url}" -o ./out.html
```
结果发现，out.html 是乱码。

## 原因
我不知道是怎么回事儿，于是我打算用 postman 下载看看，结果postman下载的html没有出现乱码。
到底是什么回事儿呢？

一般出现乱码，就是编码和解码不匹配导致的。想到这点，我忽然觉得，应该看看http返回头都有什么。不出所料，
返回头中指明了文件的编码方式为 gzip. 这就说明，我用 curl 下载的 html 文件内容其实是 gzip 格式，
如果当作 html 格式强行打开，肯定是乱码啊。为了证明这点，我将下载的网页命名为 out.gz, 然后执行
```shell 
gunzip ./out.gz
```
果然生成了一个文件，打开一看，就是正常的html。

至于 postman 为什么正常下载，我想是它自动帮忙解码了。如果你不尝试用最原始的方式下载，怎么能发现这里边
的小细节呢。工具太完美，虽然非常方便，但是会导致人类太弱智。

另外补充一点，我尝试使用 go 语言编写一个命令行工具，帮我下载网页，并使用标准库的 gzip 解码，结果发现
解码报错了。原来，go标准库的http在下载网页的时候，也自动帮我解码了。