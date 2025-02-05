---
title: "常用配置"
page: true
aside: true
---

## 在 PATH 中安装 code

1. 调出 vscode 的命令面板(Shift+Command+P);
2. 输入 `Shell Command`;
3. 找到 `Shell Command: Install 'code' command in PATH`, 点击；
4. 在终端输入 `code -v`，如果有输出，就安装成功了

## 设置快捷键，打开文件夹

仅针对 macOS

实现的效果：按下快捷键，启动 vscode，加载文件夹或者文件

先确保 PATH 中安装好 code

1. 打开 macOS 的`自动操作`软件；
2. 默认会跳出一个弹窗，选择 `快速操作`;
3. 在`资源库`一列，选择`实用工具`；
4. 从`资源库`右边的列中，选择`运行shell脚本`, 将它拖到右边;
5. 按照下图配置，保存即可；保存的时候会让你起个名字，比如就叫`用vscode打开`
   ![](/shell-vscode-open.png)
   > code 路径可能有所不同，以指令`which code`的输出结果为准
6. 打开访达，选择一个文件或者文件夹，右键，鼠标悬浮在`快速操作`, 你就可以看右侧会弹出一个小浮窗，里边就有刚刚命名的`用vscode打开`，选中它，文件夹就会用 vscode 打开；

接下来是设置快捷键

1. 打开 macOS 的`系统设置`软件
2. 选择 `键盘`
3. 在`键盘`面板里，选择`键盘快捷键`, 会跳出一个窗口
4. 在窗口里，选择`服务`
5. 展开 `文件和文件夹`
6. 然后找到你刚才创建的`用vscode打开`
7. 勾选它，双击末尾的`无`, 它就变成一个输入框，比如我想设置的快捷键是`Shift+Command+M`, 然后我就可以按下这几个键；
8. 设置好后，点击`完成`
9. 在访达里找到一个文件夹，选中它，然后按下快捷键，vscode 就会打开这个文件夹

## 新 tab 下加载文件

默认情况下，你点击一个文件，vscode 不会打开一个新的 tab 加载它，你必须双击这个文件才行。这就很麻烦，如何设置为单击呢？

1. 打开 vscode 的 settings（快捷键 `Command + ,`）;
2. 输入`workbench.editor.enablePreview`;
3. 把勾选状态取消掉；

## 开启编辑器的粘性滚动

阅读函数的时候，函数里的内容很多时，不得不一直往下滚动去看，但滚动之后，函数名就滚到上边去了，
粘性滚动就会在页面滚动的时候，让函数名所在的那一行定住。

启动方法：

1. 打开 vscode 的 settings（快捷键 `Command + ,`）;
2. 输入 `editor.stickyScroll.enabled`;
3. 勾选；

## 关闭缩略图

在编辑窗口写代码的时候，你会发现窗口最右边会有一列缩略展示，屏幕小的时候，它很占据宽度，还没什么用，
关闭它的方法就是：

1. 打开 vscode 的 settings（快捷键 `Command + ,`）;
2. 输入`editor.minimap.enabled`；
3. 把勾选状态取消掉；

## 保存时自动格式化代码

格式化代码的东西，叫做 formatter。开发时常希望在保存文件的时候，让 formatter
帮助我们格式化代码。

开启的方法很简单：

1. 打开 vscode 的 settings
2. 输入 `editor.formatOnSave`；
3. 勾选

## 如何指定 formatter

我们希望不同的文件，用不同的 formatter 去格式化，怎么做呢？

在 workspace 下建立 `.vscode/settings.json`

```json
{
  "[vue]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

注意，formatter 一般是 plugin 注册上去的，要格式化某种类型的文件，先去找提供该文件 formatter 的插件，安装之后，你在 settings.json 里输入的时候，vscode 会给你智能提示，
告诉你都有哪些 formatter 可以用。

## 如何用 vscode 作为 git commit 提交信息的编辑器

在 vscode terminal 运行 `git commit` 之后，你的提交信息要在 terminal 区域编写，那是 vim 环境，
有些人会用起来不舒服，怎么在 vscode 里编辑呢？

解决方法：
`git config --global code.editor "code --wait"`

> 确保 code 已经安装在 PATH!

## 查看vscode内置node版本号
插件的代码是在vscode内置的node里执行的。如果你使用`nvm`将本地切换到node14, 这并不会影响到插件的工作。

我在使用 `@stylistics` package配置`eslint.config.js`的时候，发现当保存.js文件之后，eslint插件可以按照`eslint.config.js`的配置将.js文件修复。但是，当我使用`npx eslint --fix` 手动修复时，终端报错，说是找不到`Object.hasOwn`，这个API在node16才开始支持。这个现象促使我思索道，vscode应该有个内置的node。

查看vscode内置的node版本号的方法：
1. 在vscode中， `command+shift+P` 呼唤出命令面板
2. 在面板中输入`Developer: Toggle Developer Tools`, 打开控制台（就是浏览器里的那个玩意儿）
3. 切换到`console` tab，输入`globalThis.vscode.process.versions.node`

## 切换vscode内置typescript版本号
1. 打开一个ts文件
2. 打开命令面板
3. 输入`Typescript`
4. 选中`Typescript: select typescript version`


<Giscus />
