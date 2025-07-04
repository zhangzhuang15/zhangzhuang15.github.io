---
title: "VSCode Extension Develop"
page: true
aside: true
---

# VSCode Extension Develop
## Overview
You should learn about layout of vscode. [Read More](https://code.visualstudio.com/api/ux-guidelines/overview)

![vscode layout](https://code.visualstudio.com/assets/api/ux-guidelines/examples/architecture-containers.png)

![vscode layout and items](https://code.visualstudio.com/assets/api/ux-guidelines/examples/architecture-sections.png)

Let's dive into detail and talk about what you can do.

### Activity Bar
Add new icon in Activity Bar

### Primary Sidebar
1. Show a webview/treeview in Primary Sidebar after click the icon in Activity Bar.
2. Extend the webview/treeview in Primary Sidebar after click explore/scm/test icon in Activity Bar.
3. Add new items in Sidebar Toolbar.
4. Add new items in View Toolbar.

### Editor
1. Add new webview as a tab page.
2. Add new items in Editor Toolbar.
3. Show hover message tooltip for selected text with API `vscode.languages.registerHoverProvider`.
    > in tooltip, you can show markdown with `vscode.MarkdownString`
4. Show codelens effect (light-color virtual text on the top of real text) with API `vscode.languages.registerCodeLensProvider`, [take a look](https://github.com/microsoft/vscode-extension-samples/blob/main/codelens-sample)
5. Show virtual document for temp usage.
6. Show infered data type of a variable with API `vscode.languages.registerInlayHintsProvider`
7. Show completion suggestions when user inputs letter with API `vscode.languages.registerCompletionItemProvider`, [take a look](https://github.com/microsoft/vscode-extension-samples/blob/main/completions-sample)
8. Select text
9. Highlight text


### Panel
1. Add new items in Panel Toolbar.
2. Add new tab (view container) and its view.

### Status Bar
1. Add new items in Status Bar

### Misc
1. Show message box
2. Invoke build-in commands and other customized commands
3. Provide language server for your programming language, framework and file



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

## View
### Editor WebView
Open a webview in editor. This is a simple but important feature. For example, you can render your specific file, you can introduce new features of your extension too. Further more, you can develop a 2D game and play.

```ts 
import * as vscode from 'vscode'

function openViewInEditor(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        // identifier
        "a.b", 
        // title of the new tab page in editor
        "News", 
        // where is the new tab page, in this example,
        // the new page is next to the active tab page,
        vscode.ViewColumn.One, 
        {}
    );
    // panel is disposable, when extension unmounted,
    // dispose panel automatically
    context.subscriptions.push(panel);

    // your html content
    panel.webview.html = "<html><body>hello world</body></html>"

    panel.webview.options = {
         enableScripts: true,
    }
}
```

When you use `vscode.window.createWebviewPanel`, you have to provide `panel.webview.html` manually. There's another way —— injecting of dependency. You only need to register a provider.

```ts 
import * as vscode from 'vscode'

class MyProvider implements vscode.WebviewViewProvider {
    constructor() {}

    // implement this function
    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        webviewView.webview.html = "<html><body>hello world</body></html>"
    }
}

const myProvider = new MyProvider()
vscode.window.registerWebviewViewProvider(
    'a.b',
    myProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
)

const panel = vscode.window.createWebviewPanel("a.b", "News", vscode.ViewColumn.One, {});

// you don't need to touch panel.webview.html, it's generated by myProvider under vscode runtime's driving.
```