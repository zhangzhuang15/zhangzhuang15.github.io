---
title: "tasks.json"
page: true
aside: true
---

## Description

`vscode tasks` 帮助我们完成一些自动化工作。

用法是唤醒 vscode 的命令面板(`Shift+Command+P`), 输入`Tasks`, 选中 `Run Task`, 然后就可以选择
我们定义好的 task 执行。比如我们将重启 nginx 的命令写入 task，只需要运行 task 即可，不用再输入 nginx command,
一定程度上简化工作。

tasks 生效范围：

- 当前 workspace：你只能在当前 vscode 窗口里使用，这些 task 定义在 `.vscode/tasks.json`
- 整个 vscode: 任意 vscode 窗口都可以使用，这些 task 定义的位置，可以这样找到: 选中左下角的 ⚙️，选中 `User tasks`

## 模板

```json
{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": [
    {
      "label": "echo",
      "type": "shell",
      "group": "none",
      "command": "echo Hello",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": true,
        "clear": false
      },
      "problemMatcher": []
    },
    {
      "label": "nginx: reload",
      "type": "process",
      "group": "none",
      "command": "/usr/bin/nginx",
      "args": ["-s"]
    },
    {
      "label": "git branch: show current name",
      "type": "shell",
      "command": ["git branch --current", "|", "echo"]
    },
    {
      "label": "git branch: log current name in a file",
      "type": "shell",
      "command": ["git branch --current", "|", "echo > ${input:outputFile}"]
    }
  ],
  "inputs": [
    {
      "type": "promptString",
      "description": "which file do you want to save",
      "id": "outputFile"
    }
  ]
}
```

### `task.label`

给你的 task 起个名字，方便你在 vscode 命令面板运行 task 时找到它

### `task.type`

你的 task 是运行在 shell 里，还是运行在一个操作系统进程里

### `task.command`

你的 task 要执行什么命令

- 如果是运行在操作系统进程里，这里要写 executable filed 的路径，命令的参数要写在 args 里！
- 如果运行在 shell 里，写的内容就和你在终端里的一样，可以是一个完整的字符串，如果命令太长，也可以写成数组形式

在 command 里，你可以使用 vscode variable，variable 可以是 vscode 内置的，也可以是你定义的。

如果是你定义的 variable，要在 `inputs`中定义出来，command 中以`${input:id}`方式使用。

如果是 vscode 内置变量:

- [访问官网位置了解](https://code.visualstudio.com/docs/editor/variables-reference)
- [vscode variables](/tool/vscode-variables)

### `task.args`

命令的参数，此时命令要运行在操作系统进程里，不是 shell 里

### `task.group`

task 所在分组，一般设置 'none' 即可

### `task.presentation`:

每次 task 执行的时候，会开启一个 vscode terminal 执行;

- 如果你想让多个 task 公用一个 terminal 执行，设置 `panel: 'shared'`
- task 执行的时候，terminal 可能保留上一个 task 的输出结果，你可以设置 `clear: true` 清空它
- task 执行完毕后，vscode 都会给出一个 reuse 信息，你可以设置 `showReuseMessage: false` 清除它
- 你执行 task 的时候，你的光标可能聚焦在编辑区的代码里，如果在 task 执行之后，光标聚焦位置不变，设置 `focus: false`
- 设置 `reveal: always`, 在 task 执行完毕后，terminal 区域会自动切换到 task 所在的 terminal

<Giscus />
