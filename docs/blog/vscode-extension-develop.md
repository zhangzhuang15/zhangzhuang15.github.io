---
title: "VSCode Extension Develop"
page: true
aside: true
---

# VSCode Extension Develop

## Command
Call `vscode.commands.executeCommand(xxxx)`, invoking build-in command and other commands. 

To search for these build-in command, take a look at [official reference](https://code.visualstudio.com/api/references/commands). 

You can also press `Command + Shift + P`, choose one command, click the ⚙️ button and get command name, looking like `@command:xxxx.xxx.xxx`. `xxxx.xxx.xxx` is command name so that you can invoke it with `vscode.commands.executeCommand("xxxx.xxx.xxx")`

### Reload Extension System
```ts 
import * as vscode from "vscode"

vscode.commands.executeCommand("workbench.action.restartExtensionHost")
```

### Install Extension with vsix file
```ts 
import * as vscode from "vscode"
import fs from "node:fs"
import path from "node:path"

async function downloadVSixFile(url: string) {
    const dest = path.join(__dirname, "temp.vsix")
    const writer = fs.createWriteStream(dest)
    const response = await fetch(url)
    const buffer = await response.bytes()
    writer.write(buffer)
    writer.end()
    writer.close()
    return dest
}

async function installExtensionFromVSixFile(url: string) {
    const localPath = await downloadVSixFile(url)
    await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        vscode.Uri.file(localPath)
    )
}
```

### Register your own Command
```ts 
import * as vscode from "vscode"

// how to register
vscode.commands.registerCommand("a.b.c", (message) => {
    console.log("a.b.c", message)
})

// how to invoke
vscode.commands.executeCommand("a.b.c", "hello world")
```


## Extension Self Information
```ts 
function activate(context: vscode.ExtensionContext) {
    // where extension is installed
    context.extensionPath

    // application name of editor, 'VSCode' 'Windsurf' `Cursor` and etc.
    vscode.env.appName
}
```

## Message
### Show Modal
```ts 
import * as vscode from "vscode"

async function show() {
    const selection = await vscode.window.showInformationMessage("Do you like dogs ?", "yes", "no")
    if (selection === 'yes') {
        console.log('user likes dogs too')
    } else {
        console.log('user dislike dogs')
    }
}
```

### Show Error Message
```ts 
import * as vscode from "vscode"

async function showError(message: string) {
    vscode.window.showErrorMessage(message)
}
```

### Show Progress Indicator
```ts 
import * as vscode from "vscode"

async function showProgress() {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
	title: "进行中...",
	cancellable: true
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
        // when user closes progress indicator
    })

    progress.report({
        increment: 10,
        message: '当前进度10%'
    })

    progress.report({
        increment: 30,
        message: '当前进度40%'
    })

    progress.report({
        increment: 50,
        message: '当前进度90%'
    })

    // when async function return, there is a resolved promise,
    // and progress indicator will be closed
  })

  // when progress indicator is closed, run this line
  console.log("progess indicator is closed!")
}
```