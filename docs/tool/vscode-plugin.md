---
title: "插件推荐"
page: true
aside: true
---

## My vscode plugin list

```json
{
  "recommendations": [
    "Vue.vscode-typescript-vue-plugin",
    "golang.go",
    "alefragnani.bookmarks",
    "formulahendry.code-runner",
    "vadimcn.vscode-lldb",
    "dbaeumer.vscode-eslint",
    "tamasfe.even-better-toml",
    "mhutchie.git-graph",
    "donjayamanne.githistory",
    "huizhou.githd",
    "eamodio.gitlens",
    "fabiospampinato.vscode-diff",
    "quillaja.goasm",
    "jevakallio.vscode-live-frame",
    "glenn2223.live-sass",
    "ritwickdey.liveserver",
    "shd101wyy.markdown-preview-enhanced",
    "bierner.markdown-preview-github-styles",
    "christian-kohler.npm-intellisense",
    "techer.open-in-browser",
    "esbenp.prettier-vscode",
    "ahmadalli.vscode-nginx-conf",
    "mongodb.mongodb-vscode",
    "rust-lang.rust-analyzer",
    "simonsiefke.svg-preview",
    "bradlc.vscode-tailwindcss",
    "rangav.vscode-thunder-client",
    "gruntfuggly.todo-tree",
    "wayou.vscode-icons-mac",
    "flowtype.flow-for-vscode",
    "Gruntfuggly.todo-tree",
    "jock.svg",
    "NarasimaPandiyan.jetbrainsmono",
    "dsznajder.es7-react-js-snippets",
    "pucelle.vscode-css-navigation",
    "t-sauer.vscode-babel-repl",
    "ms-vscode.makefile-tools"
  ]
}
```

在你的 vscode workspace 下，创建 `.vscode/extensions.json`，把上述内容粘贴进去，你就可以快速定位到这些插件，
然后一鼓作气安装，不用一个一个搜索了

## Go

![](/vscode-plugin-go.png)

如果用 vscode 开发 go 程序，安装这个 go 官方开发的插件即可。

插件安装之后，可能会报错：找不到 go 。

解决方式非常简单：

1. 确定你是否安装了 go，没装就 `brew install go`
2. 执行 `go env`， 把 GOPATH 和 GOROOT 记下来；
3. 打开 vscode 的 settings，在 extensions 区域找到 Go;
4. 在 Go 区域中，找到 GOPATH 和 GOROOT 配置项，把刚才记下来的对号入座

插件会驱动 go，下载一些必要的工具，下载过程中可能因为外网的问题，下载失败了，可执行：
`go env -w GOPROXY=https://proxy.golang.com.cn,direct`，然后再次尝试下载。

如果该插件**智能提示**失效，尝试这样解决：

1. 打开 vscode 的 settings
2. 从 extension 中找到 go
3. 寻找 `infer path` 和 `autocomplete unimported packages` 两个配置，勾选上 ✅

## Live Sass Compiler

![](/vscode-plugin-live-sass-compiler.png)

一键将 sass scss 文件编译为 css；
你仍旧需要安装 sass npm package;

## Live Server

![](/vscode-plugin-live-server.png)

启动一个 static file server

## open in browser

![](/vscode-plugin-open-in-browser.png)

可以在指定的浏览器打开文件

## Svg Preview

![](/vscode-plugin-svg-preview.png)

在 vscode 预览 svg 文件

## Todo Tree

![](/vscode-plugin-todo-tree.png)

可以将 `TODO` `FIXME` 等文字高亮，你也可以自定义高亮的字段和颜色，
还告诉你哪些文件里有这些高亮字段

设置高亮，在 workspace 下或者整个 vscode 下的 settings.json，添加：

```json
{
  "todo-tree.highlights.customHighlight": {
    "FIX": {
      "background": "lightblue",
      "foreground": "black"
    }
  },

  // 在上边光设置 FIX 这个tag还不行，还要把FIX加入到
  // 这里，否则插件不知道FIX有特殊含义，需要特别渲染
  "todo-tree.general.tags": ["FIX", "FIXME", "FIXIT"],

  // FIXME FIXIT的渲染方式和 FIX保持一致，
  // 同理 FIXME FIXIT 也要加入到上边的tags里才行
  "todo-tree.general.tagGroups": {
    "FIX": ["FIX", "FIXME", "FIXIT"]
  }
}
```

## Thunder Client

![](/vscode-plugin-thunder-client.png)

作用和 postman 一样，可视化管理你的请求配置

## Tailwindcss CSS Intellisense

![](/vscode-plugin-tailwindcss-intellisense.png)

如果你在 class 属性里使用了 tailwindcss 定义的 classname，鼠标悬浮其上，
可以看到该 classname 的具体 css 属性定义；

如果你在 class 属性里敲入 tailwindcss 定义的 classname，会给你智能提示，
你就不用死记硬背 classname 了；

## rust analyzer

![](/vscode-plugin-rust-analyzer.png)

如果用 vscode 开发 rust，安装 rust 官方的插件就够了。

该插件没有提供 formatter, 可以安装`vscode-rustfmt`插件解决

如果你对实现一个 formatter 感兴趣，这里有个文章[《Creating a Formatter Extension》](https://code.visualstudio.com/blogs/2016/11/15/formatters-best-practices)

## Volar

![](/vscode-plugin-volar.png)

vue2/3 SFC 开发必备。

它给你：

- 组件方法、属性定义处跳转
- 组件方法、属性的类型提示
- template 内组件方法、属性的类型提示

对于 vue2.x 的使用者，想要吃到 Volar 带来的开发体验：

- 安装 vue2.7.x
- typescript >= 3.9

> 个人观点：即便你用 vue2，也不要再使用 Vetur 了

<Giscus />
