---
title: "软件推荐"
page: true
aside: true
---

## Description
分享自己觉得不错的一些软件

## Shottr
截图工具，比如滚动截图

## Usage 
磁盘、内存等信息的可视化监控

## Omi录屏专家
录屏

## V2rayU
翻墙工具

## KeyCastr
显示输入的按键

## OBS Studio
专业录制软件，有录课需求，可以一用

## Screen Studio 
制作操作视频

## UTM 
macOS免费的虚拟机软件，[官网](https://getutm.app)

### 下载UTM
[官网下载方法指引](https://docs.getutm.app/installation/ios/)

### 如何与本地前端服务器联动
在宿主机(macOS系统)启动前端服务之后，我们可以使用浏览器直接查看效果，但是出于操作系统的兼容考虑，我们也想看看，在windows电脑的浏览器中，页面的效果如何，如果要把页面部署到远程服务器，再查看的话，非常繁琐，于是我们就想，在本地打开一个windows虚拟机，然后在虚拟机的浏览器中直接访问宿主机本地启动的前端服务。假设前端服务监听的域名为`aaa.com`, 操作步骤如下：
1. 宿主机的/etc/hosts文件中，将域名`aaa.com`映射到`0.0.0.0`。不要映射到`127.0.0.1`。
2. 在UTM中创建一个windows虚拟机，并为虚拟机设置 `shared network` 的网络配置，然后启动虚拟机。
3. 查看宿主机的IP(`ifconfig`， 然后寻找`en0`的`inet`)，假设IP为`192.168.0.4`。
4. 打开windows虚拟机的hosts文件，将`aaa.com` 映射到 `192.168.0.4`。
5. 在windows虚拟机打开浏览器，直接访问前端服务的url即可。
   
> `shared network`模式下，虚拟机也可以像宿主机那样访问公网