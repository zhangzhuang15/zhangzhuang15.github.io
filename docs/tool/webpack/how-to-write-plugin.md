---
title: "如何编写plugin"
page: true
aside: true
---

## 参考
[webpack v4 comiplation hooks](https://v4.webpack.js.org/api/compilation-hooks/)

## Description
项目使用的webpack是v4.12.0, 我想做一波儿优化，将压缩js代码的插件，由 uglifyjs-webpack-plugin 改为 esbuild-loader, 但是在编译的时候，出现了一个错误，说是找不到`compilation.getAssets`，我查看了 webpack 官网，发现这东西是在 v4.40.0开始支持的。本地的webpack版本因为涉及到老项目，不能升级。我就想，esbuild-loader早期版本是不是做了兼容，我就去翻看它早期的代码，v2版本的，结果它没有做兼容。在这种背景之下，只好自己写一个plugin插件，当然了，插件是copy人家的，只不过咱修修补补了一下。但是呢，整个过程中体验到了编写plugin的逻辑。着实感叹webpack插件系统的精妙。

## 示例
```js 
const pluginName = "MyEsbuildPlugin"
const esbuild = require("esbuild")
const { SourceMapSource, RawSource } = require("webpack-sources")
const isJsFile = /\.js$/i

class MyEsbuildPlugin {
    constructor(options) {
        this.options = options
        // 默认打开压缩，后边会传给 esbuild
        this.options.minify = true
    }

    /**
     * @param {import('webpack').Compiler} compiler
    */
    apply(compiler) {
        const { options } = this;

        // 每次执行一个编译过程的时候，都会创建compilation对象来指代这个编译过程，
        // compilation 刚刚建立，但还没有开启编译时，执行 hooks.compilation
        // 这个 hook
        compiler.hooks.compilation.tap(pluginName, (compilation) => {


          // webpack 配置文件里的 devtool 选项
          const { devtool } = compiler.options

          // 是否使用 sourcemap
          const sourcemap =
              options.sourcemap !== undefined
              ? options.sourcemap
              : devtool && devtool.includes('source-map')

          // chunkAssets的内容就是最终输出，这个 hook
          // 让我们在它输出之前，做一波儿优化，比如代码压缩
          compilation.hooks.optimizeChunkAssets.tapPromise(
             pluginName,
             async (chunks) => {
                // chunk 的内容可能来自多个源代码文件，而chunk本身可能输出到
                // 多个文件（打包文件拆分，就是这个道理），令人安心的是，最终
                // 输出文件的内容存储在 compilation.assets[file]里，我们
                // 只用理会它即可，不需要陷入到chunk和打包文件之间繁杂的对应关系中
                const transforms = chunks.flatMap((chunk) => {
                    return chunk.files
                        .filter((file) => isJsFile.test(file))
                        .map(async (file) => {
                            const assetSource = compilation.assets[file]
                            // 获取输出文件的内容和sourcemap
                            const { source, map } = assetSource.sourceAndMap()

                            // 用esbuild压缩代码
                            const result = await esbuild.transform(source, {
                                ...options,
                                sourcemap,
                                sourcefile: file
                            })

                            // 更新输出文件的内容，
                            // esbuild-loader源码使用 compilation.updateAsset 方法
                            // 更新 asset，但很可惜，这个API从webpack v4.40.0开始，才
                            // 被支持
                            compilation.assets[file] = sourcemap ?
                                new SourceMapSource(
                                    result.js || '',
                                    file,
                                    result.jsSourceMap,
                                    source,
                                    map,
                                    true
                                )
                                : new RawSource(result.js || '')
                        })
                    }
                )

                if (transforms.length) {
                    await Promise.all(transforms)
                }
          })
        })
    }
}
```

:::tip <TipIcon />
难点就是对 hook 的理解，以及对 hook 中提供的参数（chunks, assets, compilation etc.）的把握，
webpack官网虽然介绍了API和数据类型，但是并不完善，有时候查起来还是比较费劲的，因此还要多看看别人
写的插件，多到 stackoverflow 逛逛；
:::