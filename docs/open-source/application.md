---
title: "个人开发的应用项目"
page: true
aside: true
---

# 个人开发的应用项目

## [vscode-plugin-dictionary](https://github.com/zhangzhuang15/JasonPackages/tree/dev/packages/vscode-plugin-dictionary)

一款 vscode 插件，功能是获取英文单词的翻译。

特点：

- 不需要在 vscode 单独开一个 webview 页面
- 翻译的过程不需要跳转到 vscode 以外的应用
- 使用简单，无配置，只需要选中被翻译的单词，鼠标停留在单词上，就可以在悬浮提示框中看到翻译结果

[下载体验 v0.0.2](https://github.com/zhangzhuang15/JasonPackages/releases/tag/vscode-plugin-dictionary-v0.0.2)

## [line-noise](https://github.com/zhangzhuang15/JasonPackages/tree/dev/packages/line-noise)

一个 nodejs 的 package，底层封装 redis-cli 的 line-noise c 库，编译为 node addon 文件，供命令行交互使用；

提供的功能有：

- 支持键入 tab 键实现内容补全；
- 支持自定义命令的后缀提示；
- 拥有和 readline 一样的交互效果；

<Giscus />
