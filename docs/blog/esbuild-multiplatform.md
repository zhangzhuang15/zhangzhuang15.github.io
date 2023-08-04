---
title: "esbuild支持多平台的思路"
page: true
aside: true
---

# esbuild支持多平台的思路

## esbuild简介
esbuild是一个用go语言开发的打包工具，速度非常快，它可以做到下面的事情：
- 支持编译 ts tsx jsx
- 支持编译js为指定ECMAScript版本下的代码
- 支持直接引用.json文件（就和require一个json文件一样）
- 支持直接打包css文件（在js文件中import css是可选的）
- 支持将引用的图片转化为url
- 支持将引用的二进制文件转化为Uint8Array

正因为有速度上的优势，在打包处理上，esbuild 得到了青睐。

一些开发工具在实现热更新时，需要重新打包文件，就会采用 esbuild 去处理。

一些框架也会使用 esbuild 替换掉相同功能的旧代码，提升速度。


## 多平台，esbuild怎么搞？
esbuild使用go语言开发的，它怎么做到支持多平台的呢？

这不废话么，go语言本身就是支持多平台的，可以完成不同平台下的交叉编译啊，只需要在编译go代码的时候，指定`GOOS` `GOARCH`环境变量即可。比如我有一个`main.go`文件，将其编译为M1 apple下的可执行程序，只需：
```sh 
GOOS="darwin" GOARCH="arm64" go build main.go
```

好吧，确实如此。

顺着这个思路，我们继续想，作为一个package的开发者，为了支持多平台，难不成我要这样做：
- 为每个平台单独建立一个package；
- 编译好该平台下的esbuild可执行程序，然后塞进package；
- 把所有的这些package都发布到npm上；

我去，这么做的话，有点麻烦，有点累啊！

esbuild是不是这样搞的呢？

[看看esbuild的搜索页面](https://www.npmjs.com/search?q=%40esbuild)，我去！好像它还真是这么干的：
![@esbuild的搜索界面](/@esbuild.png)

看看这些显眼的命名：`@esbuild/{平台名}`
哈哈哈哈，原来你是这样的esbuild🙄

<br>

等一下，在下载esbuild的时候，用的都是
```sh 
npm install esbuild
```

而不是
```sh 
npm install @esbuild/{平台名}
```
难道esbuild在被下载的时候，可以感知到平台环境？

esbuild你小子指定里边有事儿啊！

好吧，老规矩，看看esbuild的 package.json写了啥：
```json 
{
    "scripts": {
        "postinstall": "node install.js"
    },
    "main": "lib/main.js",
    "bin": {
        "esbuild": "bin/esbuild"
    },
    "optionalDependencies": {
        "@esbuild/android-arm": "0.17.8",
        "@esbuild/android-arm64": "0.17.8",
        "@esbuild/android-x64": "0.17.8",
        "@esbuild/darwin-arm64": "0.17.8",
        "@esbuild/darwin-x64": "0.17.8",
        "@esbuild/freebsd-arm64": "0.17.8",
        "@esbuild/freebsd-x64": "0.17.8",
        "@esbuild/linux-arm": "0.17.8",
        "@esbuild/linux-arm64": "0.17.8",
        "@esbuild/linux-ia32": "0.17.8",
        "@esbuild/linux-loong64": "0.17.8",
        "@esbuild/linux-mips64el": "0.17.8",
        "@esbuild/linux-ppc64": "0.17.8",
        "@esbuild/linux-riscv64": "0.17.8",
        "@esbuild/linux-s390x": "0.17.8",
        "@esbuild/linux-x64": "0.17.8",
        "@esbuild/netbsd-x64": "0.17.8",
        "@esbuild/openbsd-x64": "0.17.8",
        "@esbuild/sunos-x64": "0.17.8",
        "@esbuild/win32-arm64": "0.17.8",
        "@esbuild/win32-ia32": "0.17.8",
        "@esbuild/win32-x64": "0.17.8"
  },
}
```
嗯嗯，`node install.js` 肯定有鬼！

大胆去猜测，这个环节肯定捕捉了当前平台的信息，之后据此获取到对应版本的esbuild可执行程序。

接下来如果直接去看`install.js` 代码，固然能解决问题，但我们不妨刨根问底，直接瞧瞧esbuild仓库源码。

## esbuild项目关键处
不必要的文件全部省略
```
.
├── Makefile
├── lib
│   └── npm
│        ├── node-install.ts
│        ├── node.ts 
│        ├── node-shim.ts
│        └── node-platform.ts
├── npm
│   ├── @esbuild
│   └── esbuild
│          └── package.json
└── scripts
     └── esbuild.js
```
`npm install esbuild`的`esbuild`对应的就是`npm/esbuild`.

还记得上一节说的吗，就是`node install.js`。

没错这个指令就记录在`npm/esbuild/package.json`中，但此时`npm/esbuild`目录下没有`install.js`，也没有`bin/esbuild`。

想要解决这个问题，就必须考虑esbuild项目是怎么build，又是怎么publish的。

既然项目根目录下没有`package.json`, 就只好看看`Makefile`了，该文件提供的信息量很大，我就以 Arm macOS环境为例子，将关键信息截取出来了：
```makefile  
platform-all:
	@$(MAKE) --no-print-directory -j4 \
		platform-android-arm \
		platform-android-arm64 \
		platform-android-x64 \
		platform-darwin-arm64 \
		platform-darwin-x64 \
		platform-deno \
		platform-freebsd-arm64 \
		platform-freebsd-x64 \
		platform-linux-arm \
		platform-linux-arm64 \
		platform-linux-ia32 \
		platform-linux-loong64 \
		platform-linux-mips64el \
		platform-linux-ppc64 \
		platform-linux-riscv64 \
		platform-linux-s390x \
		platform-linux-x64 \
		platform-netbsd-x64 \
		platform-neutral \
		platform-openbsd-x64 \
		platform-sunos-x64 \
		platform-wasm \
		platform-win32-arm64 \
		platform-win32-ia32 \
		platform-win32-x64

platform-unixlike: version-go
	@test -n "$(GOOS)" || (echo "The environment variable GOOS must be provided" && false)
	@test -n "$(GOARCH)" || (echo "The environment variable GOARCH must be provided" && false)
	@test -n "$(NPMDIR)" || (echo "The environment variable NPMDIR must be provided" && false)
	node scripts/esbuild.js "$(NPMDIR)/package.json" --version
	CGO_ENABLED=0 GOOS="$(GOOS)" GOARCH="$(GOARCH)" go build $(GO_FLAGS) -o "$(NPMDIR)/bin/esbuild" ./cmd/esbuild


platform-darwin-arm64:
	@$(MAKE) --no-print-directory GOOS=darwin GOARCH=arm64 NPMDIR=npm/@esbuild/darwin-arm64 platform-unixlike

esbuild: version-go cmd/esbuild/*.go pkg/*/*.go internal/*/*.go go.mod
	CGO_ENABLED=0 go build $(GO_FLAGS) ./cmd/esbuild

platform-neutral: esbuild
	node scripts/esbuild.js npm/esbuild/package.json --version
	node scripts/esbuild.js ./esbuild --neutral
```

`platform-all`是针对所有平台采取的项目Build，很扎眼的一项是`platform-neutral`，因为 `neutral`这种表达似乎和具体平台无关。

`platform-neutral`的工作很简单，执行两次 `scripts/esbuild.js`，
一个和`--version`有关，一个和`--neutral`有关。`esbuild.js`是重点，稍后单独一节去聊。

`platform-darwin-arm64`工作也显而易见，主要是生成esbuild二进制程序，然后存储到 `npm/@esbuild/darwin-arm64/bin`。同理，其他平台下也会这么操作，所以`npm/@esbuild`下边存储的就是各个平台下的package。


接下来，我们就看看`scripts/esbuild.js`发生了什么，看看它能不能告诉我们`node install.js`的`install.js`去了哪里。


## 精华所在——esbuild.js 
只列出关键的代码
```js  
// The main Makefile invokes this script before publishing
if (require.main === module) {
  if (process.argv.indexOf('--wasm') >= 0) exports.buildWasmLib(process.argv[2])
  else if (process.argv.indexOf('--deno') >= 0) buildDenoLib(process.argv[2])
  else if (process.argv.indexOf('--version') >= 0) updateVersionPackageJSON(process.argv[2])
  else if (process.argv.indexOf('--neutral') >= 0) buildNeutralLib(process.argv[2])
  else if (process.argv.indexOf('--update-version-go') >= 0) updateVersionGo()
  else throw new Error('Expected a flag')
}
```
上节说到，`platform-neutral`做了两件事，一个和`--version`有关，一个和`--neutral`有关。

### --version

和`--version`有关的，就是`updateVersionPackageJSON`:
```js 
const updateVersionPackageJSON = pathToPackageJSON => {
  const version = fs.readFileSync(path.join(path.dirname(__dirname), 'version.txt'), 'utf8').trim()
  const json = JSON.parse(fs.readFileSync(pathToPackageJSON, 'utf8'))

  if (json.version !== version) {
    json.version = version
    fs.writeFileSync(pathToPackageJSON, JSON.stringify(json, null, 2) + '\n')
  }
}
```
根据上文`Makefile`的介绍，此处`pathToPackageJSON`指`npm/esbuild/package.json`.函数就做了一件事情，将package.json里的version更新为`version.txt`中的内容。

好吧，感觉这没啥看头。


### --neutral 
和`--neutral`有关的，是`buildNeutralLib`:
```js  
const buildNeutralLib = (esbuildPath) => {
  const libDir = path.join(npmDir, 'lib')
  const binDir = path.join(npmDir, 'bin')
  fs.mkdirSync(libDir, { recursive: true })
  fs.mkdirSync(binDir, { recursive: true })

  // Generate "npm/esbuild/install.js"
  childProcess.execFileSync(esbuildPath, [
    path.join(repoDir, 'lib', 'npm', 'node-install.ts'),
    '--outfile=' + path.join(npmDir, 'install.js'),
    '--bundle',
    '--target=' + nodeTarget,
    '--define:ESBUILD_VERSION=' + JSON.stringify(version),
    '--external:esbuild',
    '--platform=node',
    '--log-level=warning',
  ], { cwd: repoDir })

  // Generate "npm/esbuild/lib/main.js"
  childProcess.execFileSync(esbuildPath, [
    path.join(repoDir, 'lib', 'npm', 'node.ts'),
    '--outfile=' + path.join(libDir, 'main.js'),
    '--bundle',
    '--target=' + nodeTarget,
    '--define:WASM=false',
    '--define:ESBUILD_VERSION=' + JSON.stringify(version),
    '--external:esbuild',
    '--platform=node',
    '--log-level=warning',
  ], { cwd: repoDir })

  // Generate "npm/esbuild/bin/esbuild"
  childProcess.execFileSync(esbuildPath, [
    path.join(repoDir, 'lib', 'npm', 'node-shim.ts'),
    '--outfile=' + path.join(binDir, 'esbuild'),
    '--bundle',
    '--target=' + nodeTarget,
    '--define:ESBUILD_VERSION=' + JSON.stringify(version),
    '--external:esbuild',
    '--platform=node',
    '--log-level=warning',
  ], { cwd: repoDir })

  // Generate "npm/esbuild/lib/main.d.ts"
  const types_ts = fs.readFileSync(path.join(repoDir, 'lib', 'shared', 'types.ts'), 'utf8')
  fs.writeFileSync(path.join(libDir, 'main.d.ts'), types_ts)

  // Get supported platforms
  const platforms = { exports: {} }
  new Function('module', 'exports', 'require', childProcess.execFileSync(esbuildPath, [
    path.join(repoDir, 'lib', 'npm', 'node-platform.ts'),
    '--bundle',
    '--target=' + nodeTarget,
    '--external:esbuild',
    '--platform=node',
    '--log-level=warning',
  ], { cwd: repoDir }))(platforms, platforms.exports, require)
  const optionalDependencies = Object.fromEntries(Object.values({
    ...platforms.exports.knownWindowsPackages,
    ...platforms.exports.knownUnixlikePackages,
    ...platforms.exports.knownWebAssemblyFallbackPackages,
  }).sort().map(x => [x, version]))

  // Update "npm/esbuild/package.json"
  const pjPath = path.join(npmDir, 'package.json')
  const package_json = JSON.parse(fs.readFileSync(pjPath, 'utf8'))
  package_json.optionalDependencies = optionalDependencies
  fs.writeFileSync(pjPath, JSON.stringify(package_json, null, 2) + '\n')
}
```
看看代码作者给出的注释，以及代码里的调用，不难看出这个函数做了这些关键的事情：
- 将`lib/npm/node-install.ts`编译为`npm/esbuild/install.js`
- 将`lib/npm/node.ts`编译为`npm/esbuild/lib/main.js` 
- 将`lib/npm/node-shim.ts`编译为`npm/esbuild/bin/esbuild`
  
破案了呀，好家伙，原来esbuild的package.json中提到的 `install.js` 
`main.js` `bin/esbuild`，都是发包前、构建项目的时候生成的。

妥了，`install.js`在哪里的问题解决了。

剩下看看`node-install.ts` 和 `node-shim.ts`，就知道怎么支持多平台的了。

### node-install.ts 
当`npm install esbuild`后，发生的第一件事，就是执行该文件的逻辑。

无关代码直接省略

```ts  
checkAndPreparePackage().then(() => {
  if (isToPathJS) {
    // We need "node" before this command since it's a JavaScript file
    validateBinaryVersion(process.execPath, toPath)
  } else {
    // This is no longer a JavaScript file so don't run it using "node"
    validateBinaryVersion(toPath)
  }
})
```
函数名说的很清楚，检查并准备好package。

```ts  
async function checkAndPreparePackage(): Promise<void> {

  // 省略无关代码

  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform()

  let binPath: string
  try {
    // First check for the binary package from our "optionalDependencies". This
    // package should have been installed alongside this package at install time.
    binPath = require.resolve(`${pkg}/${subpath}`)
  } catch (e) {
    console.error(`[esbuild] Failed to find package "${pkg}" on the file system

This can happen if you use the "--no-optional" flag. The "optionalDependencies"
package.json feature is used by esbuild to install the correct binary executable
for your current platform. This install script will now attempt to work around
this. If that fails, you need to remove the "--no-optional" flag to use esbuild.
`)

    // If that didn't work, then someone probably installed esbuild with the
    // "--no-optional" flag. Attempt to compensate for this by downloading the
    // package using a nested call to "npm" instead.
    //
    // THIS MAY NOT WORK. Package installation uses "optionalDependencies" for
    // a reason: manually downloading the package has a lot of obscure edge
    // cases that fail because people have customized their environment in
    // some strange way that breaks downloading. This code path is just here
    // to be helpful but it's not the supported way of installing esbuild.
    binPath = downloadedBinPath(pkg, subpath)
    try {
      console.error(`[esbuild] Trying to install package "${pkg}" using npm`)
      installUsingNPM(pkg, subpath, binPath)
    } catch (e2: any) {
      console.error(`[esbuild] Failed to install package "${pkg}" using npm: ${e2 && e2.message || e2}`)

      // If that didn't also work, then something is likely wrong with the "npm"
      // command. Attempt to compensate for this by manually downloading the
      // package from the npm registry over HTTP as a last resort.
      try {
        await downloadDirectlyFromNPM(pkg, subpath, binPath)
      } catch (e3: any) {
        throw new Error(`Failed to install package "${pkg}"`)
      }
    }
  }

  maybeOptimizePackage(binPath)
}
```
别被函数里面的代码和注释吓唬到了，其实函数就干了一件事：**找到esbuild可执行程序**

#### 问题一
上文提到`lib/npm/node-shim.ts`编译为`npm/esbuild/bin/esbuild`，不是已经有esbuild可执行程序了吗，为什么还要找？

我们平时说的可执行程序包括两方面：
- 二进制的可执行程序
- 解释器文件

下面这个js文件就是解释器文件：
```js 
#!/usr/bin/env node

console.log("hello world");
```

`npm/esbuild/bin/esbuild`就是这种情况。

它本身不提供esbuild的能力，需要加载二进制版本的esbuild。

所以我们需要找到二进制版本的esbuild.

#### 问题二
怎么找呢？

先看看`pkgAndSubpathForCurrentPlatform`函数：
```ts 
export const knownUnixlikePackages: Record<string, string> = {
  'android arm64 LE': '@esbuild/android-arm64',
  'darwin arm64 LE': '@esbuild/darwin-arm64',
  'darwin x64 LE': '@esbuild/darwin-x64',
  'freebsd arm64 LE': '@esbuild/freebsd-arm64',
  'freebsd x64 LE': '@esbuild/freebsd-x64',
  'linux arm LE': '@esbuild/linux-arm',
  'linux arm64 LE': '@esbuild/linux-arm64',
  'linux ia32 LE': '@esbuild/linux-ia32',
  'linux mips64el LE': '@esbuild/linux-mips64el',
  'linux ppc64 LE': '@esbuild/linux-ppc64',
  'linux riscv64 LE': '@esbuild/linux-riscv64',
  'linux s390x BE': '@esbuild/linux-s390x',
  'linux x64 LE': '@esbuild/linux-x64',
  'linux loong64 LE': '@esbuild/linux-loong64',
  'netbsd x64 LE': '@esbuild/netbsd-x64',
  'openbsd x64 LE': '@esbuild/openbsd-x64',
  'sunos x64 LE': '@esbuild/sunos-x64',
}

export function pkgAndSubpathForCurrentPlatform(): { pkg: string, subpath: string, isWASM: boolean } {
  let pkg: string
  let subpath: string
  let isWASM = false
  let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`

  if (platformKey in knownWindowsPackages) {
    pkg = knownWindowsPackages[platformKey]
    subpath = 'esbuild.exe'
  }

 // 我们以 Arm MacOS为例，只需要看这个 if 语句就行了
  else if (platformKey in knownUnixlikePackages) {
    pkg = knownUnixlikePackages[platformKey]
    subpath = 'bin/esbuild'
  }

  else if (platformKey in knownWebAssemblyFallbackPackages) {
    pkg = knownWebAssemblyFallbackPackages[platformKey]
    subpath = 'bin/esbuild'
    isWASM = true
  }

  else {
    throw new Error(`Unsupported platform: ${platformKey}`)
  }

  return { pkg, subpath, isWASM }
}
```
以 ARM MacOS为例子:
`pkg`的值为`@esbuild/darwin-arm64`
`subpath`的值为`bin/esbuild`

还记得前文，我们介绍`Makefile`中的`platform-darwin-arm64`么？

没错，在`platform-darwin-arm64`的时候，就会编译生成该平台下的二进制程序esbuild，放在`bin`目录下。

那么，经过publish `@esbuild/darwin-arm64`之后，`@esbuild/darwin-arm64/bin/esbuild`就是ARM MacOS下的二进制程序esbuild的路径了呢。

OK，你应该理解了`pkg`和`subpath`了吧。

接下来分析：
```ts 
 binPath = require.resolve(`${pkg}/${subpath}`)
```
实际执行起来，这条语句等同于：
`require.resolve("@esbuild/darwin-arm64/bin/esbuild")`

什么意思呢？

你在自己的项目中，执行了`npm install esbuild`，`node_modules`文件夹下就会有`esbuild`文件夹.

`npm install esbuild` 后边会执行`node install.js`, 然后就会来到 `require.resolve("@esbuild/darwin-arm64/bin/esbuild")`

这条代码的意思就是在你的`node_modules`中寻找`@esbuild/darwin-arm64/bin/esbuild`, 返回该文件的绝对路径。

不对劲啊，我们什么时候下载过`@esbuild/darwin-arm64`了？

真是个好问题。

答案就是在你`npm install esbuild`的时候。

不信？

看看esbuild package里的package.json吧：
```json
{
    "optionalDependencies": {
        "@esbuild/android-arm": "0.17.8",
        "@esbuild/android-arm64": "0.17.8",
        "@esbuild/android-x64": "0.17.8",
        "@esbuild/darwin-arm64": "0.17.8",
        "@esbuild/darwin-x64": "0.17.8",
        "@esbuild/freebsd-arm64": "0.17.8",
        "@esbuild/freebsd-x64": "0.17.8",
        "@esbuild/linux-arm": "0.17.8",
        "@esbuild/linux-arm64": "0.17.8",
        "@esbuild/linux-ia32": "0.17.8",
        "@esbuild/linux-loong64": "0.17.8",
        "@esbuild/linux-mips64el": "0.17.8",
        "@esbuild/linux-ppc64": "0.17.8",
        "@esbuild/linux-riscv64": "0.17.8",
        "@esbuild/linux-s390x": "0.17.8",
        "@esbuild/linux-x64": "0.17.8",
        "@esbuild/netbsd-x64": "0.17.8",
        "@esbuild/openbsd-x64": "0.17.8",
        "@esbuild/sunos-x64": "0.17.8",
        "@esbuild/win32-arm64": "0.17.8",
        "@esbuild/win32-ia32": "0.17.8",
        "@esbuild/win32-x64": "0.17.8"
  },
}
```
这里边不是有 `@esbuild/darwin-arm64` 么？

那为什么只下载了它，没有下载别的呢，比如`@esbuild/win32-x64`?

又是一个好问题！

首先，要明确的是，记述在`optionalDependencies`中的package，并不是都会下载的，只会下载合适的。

怎么才算合适呢？

看一眼`@esbuild/darwin-arm64`的package.json吧：
```json 
{
  "name": "@esbuild/darwin-arm64",
  "version": "0.17.8",
  "description": "The macOS ARM 64-bit binary for esbuild, a JavaScript bundler.",
  "repository": "https://github.com/evanw/esbuild",
  "license": "MIT",
  "preferUnplugged": true,
  "engines": {
    "node": ">=12"
  },
  "os": [
    "darwin"
  ],
  "cpu": [
    "arm64"
  ]
}
```
瞧见`os` 和 `cpu`的值了么？

这就叫合适，不用多说了吧。


如果下载`@esbuild/darwin-64`失败了呢？

使用`npm`尝试下载一次：
```ts 
 binPath = downloadedBinPath(pkg, subpath)
    try {
      console.error(`[esbuild] Trying to install package "${pkg}" using npm`)
      installUsingNPM(pkg, subpath, binPath)
    } 
```
`installUsingNPM`干的就是这个事情。

如果这一招也失败了呢？
就会直接从npm下载压缩包，然后解压，将二进制文件复制到预定的位置。
```ts 
    installUsingNPM(pkg, subpath, binPath)
    } catch (e2: any) {
      console.error(`[esbuild] Failed to install package "${pkg}" using npm: ${e2 && e2.message || e2}`)

      // If that didn't also work, then something is likely wrong with the "npm"
      // command. Attempt to compensate for this by manually downloading the
      // package from the npm registry over HTTP as a last resort.
      try {
        await downloadDirectlyFromNPM(pkg, subpath, binPath)
      } catch (e3: any) {
        throw new Error(`Failed to install package "${pkg}"`)
      }
    }
```
`downloadDirectlyFromNPM`干的就是这个事情。

预定的位置是怎么规定的呢？

在这里，我们下载好esbuild，放到一个位置。而在`esbuild/bin/esbuild`中会搜索这个位置。其实具体位置在哪里都可以，只要两者逻辑前后统一即可。如果这边的逻辑放在了一个地方，另一边的逻辑里找不到，那就扑街了。

好了，总结一下怎么找esbuild二进制程序的思路：
- 随`@esbuild/darwin-arm64`下载成功，确定下`@esbuild/darwin-arm64/bin/esbuild`路径存在即可
- 上一步失败，再用npm尝试下载`@esbuild/darwin-arm64`
- 上一步失败了，通过http直接从npm下载`@esbuild/darwin-arm64`的压缩包

### node-shim.ts 
上一节，解决了指定平台下的esbuild二进制程序的下载问题。

而在使用esbuild的时候，会调用`esbuild/bin/esbuild`, 这个解释器文件内部，会调用二进制版本的esbuild程序。

`esbuild/bin/esbuild`的逻辑就记录在node-shim.ts中：
```ts 
#!/usr/bin/env node

import { generateBinPath } from "./node-platform"
const { binPath, isWASM } = generateBinPath()
if (isWASM) {
  require('child_process').execFileSync('node', [binPath].concat(process.argv.slice(2)), { stdio: 'inherit' })
} else {
  require('child_process').execFileSync(binPath, process.argv.slice(2), { stdio: 'inherit' })
}
```
做的事情很简单：
- 确定二进制esbuild的路径
- 开一个子进程执行它

寻找的逻辑就在 `generateBinPath`:
```ts 
export function generateBinPath(): { binPath: string, isWASM: boolean } {
  // 无关代码直接省略

  const { pkg, subpath, isWASM } = pkgAndSubpathForCurrentPlatform()
  let binPath: string

  try {
    // First check for the binary package from our "optionalDependencies". This
    // package should have been installed alongside this package at install time.
    binPath = require.resolve(`${pkg}/${subpath}`)
  } catch (e) {
    // If that didn't work, then someone probably installed esbuild with the
    // "--no-optional" flag. Our install script attempts to compensate for this
    // by manually downloading the package instead. Check for that next.
    binPath = downloadedBinPath(pkg, subpath)
    if (!fs.existsSync(binPath)) {
      // If that didn't work too, check to see whether the package is even there
      // at all. It may not be (for a few different reasons).
      try {
        require.resolve(pkg)
      } catch {
        // 无关代码，直接省略
      }
    }
  }
  // 无关代码，直接省略
  
  return { binPath, isWASM }
}
```
看吧，`pkgAndSubpathForCurrentPlatform`和 `downloadedBinPath`又出现了。在下载的时候，就是调用二者，去锁定路径；现在搜索，依旧按照这个逻辑，去找到路径。这个就是前文所说的，下载、搜索二者逻辑要统一。

## 总结 
esbuild的功能很出色，在涉及到二进制程序跨平台的npm包管理方面也非常巧妙。包文件并不一定都是编写出来的，也可以是脚本生成的。你看到的.js文件，可能也只是产物，其中的逻辑是在.ts文件里实现的。

另一方面，node_modules下的诸多文件，也是可以通过程序动态调整的，并不是一个完全的黑盒。

从整体的项目管理方面，既有序，又巧妙，值得借鉴。



<Giscus />