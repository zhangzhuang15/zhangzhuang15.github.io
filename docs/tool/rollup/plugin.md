---
title: "插件推荐"
page: true
aside: true
---

## Description

介绍一些常用的 rollup 插件

[awesome rollup plugin list](https://github.com/rollup/awesome)

## rollup-plugin-node-resolve

Bundle third-party dependencies in node_modules

This plugin is deprecated, use `@rollup/plugin-node-resolve` instead.

If you set `external` in rollup options, this plugin won't extract modules which match `external`.

If you set `resolveOnly` option of this plugin, there's a pitfall. Let's say you set `resolveOnly` `["third-party"]`,
this plugin will extract `third-party` module, but if `third-party` module depends on `third-party-2` module, `third-party-2`
won't be extracted, and it might bring some problems, such as `cannot resolve some exported properties from "third-party-2"`.

## rollup-plugin-commonjs

Convert CommonJS modules to ES2015

This plugin is deprecated, use `@rollup/plugin-commonjs` instead.

## rollup-plugin-terser

Rollup plugin to minify generated es bundle

## rollup-plugin-babel

Seamless integration between Rollup and Babel.

## rollup-plugin-analyzer

Mad metrics for your rollup bundles, know all the things

## @rollup/plugin-inject

A Rollup plugin which scans modules for global variables and injects import statements where necessary.

> 在 rxjs 源码里发现

## @rollup/plugin-alias

对 module 进行 alias 处理

比如将文件夹 src 下的引用，定义为 `@src/*` 这样的引用方式，和 webpack 里的 resolve.alias 功能一样

> 在 rxjs 源码里发现

## rollup-plugin-define

打包的时候，对变量进行直接替换

典型的应用场景就是环境变量，我们常会用 `process.env.mode` 这样的变量区分研发环境和生产环境，
这种区分是在运行时完成的，但我们可以变成编译时完成这件事，经过编译之后，`process.env.mode` 就
不会出现在编译后的代码里，而是被替换为 `development` 这种具体的环境值，而且还会带来编译优化，
比如：

```js
if (process.env.useDev) {
  console.log("aaaaaa");
  // ... other codes
}
```

如果 `process.env.useDev` 被替换为 `false`, 在编译的时候，`if` 代码块其实根本不会执行，代码
优化的时候，minifier 就会把这些代码直接删除掉。

<Giscus />
