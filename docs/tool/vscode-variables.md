---
title: "vscode variables"
page: true
aside: true
---

## vscode 内置变量

[官网介绍](https://code.visualstudio.com/docs/editor/variables-reference)

假设 workspace: <span style="font-size: 18px; font-weight: bolder">`/Users/A/project/app`</span>

当前 vscode 编辑区域显示的文件为: <span style="font-size: 18px; font-weight: bolder">`/Users/A/project/app/src/App.tsx`</span>

| <h5>variable name</h5>                          | <h5>含义</h5>                                                                                    |
| :---------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| <h6>`${workspaceFolder}`</h6>                   | <h6>`/Users/A/project/app`</h6>                                                                  |
| <h6>`${workspaceFolderBasename}`</h6>           | <h6>`app`</h6>                                                                                   |
| <h6>`${file}`</h6>                              | <h6>`/Users/A/project/app/src/App.tsx`</h6>                                                      |
| <h6>`${fileBasename}`</h6>                      | <h6>`App.tsx`</h6>                                                                               |
| <h6>`${fileBasenameNoExtension}`</h6>           | <h6>`App`</h6>                                                                                   |
| <h6>`${fileExtname}`</h6>                       | <h6>`.tsx`</h6>                                                                                  |
| <h6>`${fileDirname}`</h6>                       | <h6>`/Users/A/project/app/src`</h6>                                                              |
| <h6>`${relativeFile}`</h6>                      | <h6>`src/App.tsx`</h6>                                                                           |
| <h6>`${relativeFileDirname}`</h6>               | <h6>`src`</h6>                                                                                   |
| <h6>`${userHome}`</h6>                          | <h6>`/Users/A`</h6>                                                                              |
| <h6>`${execPath}`</h6>                          | <h6>`code命令的file path`</h6>                                                                   |
| <h6>`${pathSeparator}`</h6>                     | <h6>`unix是/, windows是\`</h6>                                                                   |
| <h6>`${defaultBuildTask}`</h6>                  | <h6>`默认的build task的名字`</h6>                                                                |
| <h6>`${cwd}`</h6>                               | <h6>`task runner的当前工作目录`</h6>                                                             |
| <h6>`${lineNumber}`</h6>                        | <h6>`光标所在文件的第几行`</h6>                                                                  |
| <h6>`${selectedText}`</h6>                      | <h6>`光标选中的内容`</h6>                                                                        |
| <h6>`${env:GOPATH}`</h6>                        | <h6>`操作系统环境变量GOPATH的值`</h6>                                                            |
| <h6>`${config:editor.fontSize}`</h6>            | <h6>`vscode配置项 editor.fontSize的值；你可以在settings面板里输入 editor.fontSize 查看一下`</h6> |
| <h6>`${command:extension.pickNodeProcess}`</h6> | <h6>`指代一个命令执行的结果`</h6>                                                                |

vscode 内置命令也好，vscode 插件注册的命令也好，都有唯一标识符，即 Command ID；

在 vscode 命令面板里看到的内容，都只是 command 的名称，不是 Command ID, 你可点击末尾的 ⚙️, 查看 Command ID;

<Giscus />
