---
title: "常用前端开发配置"
page: true
aside: true
---

# Description

每次想本地写一些东西的时候，都要配置 ts webpack，很繁琐，索性将
这些配置记下来，回头儿写东西的时候，直接复制。

## 用 ts 开发 node 程序

```shell
mkdir demo
cd demo
pnpm init
pnpm install -D webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-typescript

pnpm install -D typescript
pnpm install -D @types/node
pnpm install -D terser-webpack-plugin
```

`webpack.config.js`:

```js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

/** @type {import('webpack').Configuration} */
const config = {
  mode: "production",
  entry: path.join(__dirname, "main.ts"),
  output: {
    filename: "main.js",
    path: __dirname,
  },
  target: "node",
  optimization: {
    minimizer: [
      // 禁止生成 License.txt 文件
      new TerserPlugin({ extractComments: false }),
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)s$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = config;
```

`babel.config.json`:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-typescript"]
}
```

`tsconfig.config.json`:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext"
  }
}
```

`package.json`:

```json
{
  "scripts": {
    "build": "webpack",
    "start": "webpack && node main.js",
    "check": "tsc --noEmit"
  }
}
```

## 用 ts 开发 tsx 应用

```shell
mkdir demo
cd demo
pnpm init
pnpm install -D webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-typescript @babel/preset-react

pnpm install -D typescript
pnpm install -D terser-webpack-plugin
```

> `@babel/preset-typescript`会将 tsx 转化为 js，但是不会转化里面的 jsx 语法糖，这个需要`@babel/preset-react`
> 实现

`webpack.config.js`:

```js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

/** @type {import('webpack').Configuration} */
const config = {
  mode: "production",
  entry: path.join(__dirname, "main.tsx"),
  output: {
    filename: "main.js",
    path: __dirname,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        // 禁止生成 License.txt 文件
        extractComments: false,
        terserOptions: {
          format: {
            // 删除代码里的注释
            comments: false,
          },
        },
      }),
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = config;
```

`babel.config.json`:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-typescript",
    "@babel/preset-react"
  ]
}
```

`tsconfig.config.json`:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext"
  },
  "include": ["./*.ts", "./*.tsx"]
}
```

`package.json`:

```json
{
  "scripts": {
    "build": "webpack",
    "start": "webpack && node main.js",
    "check": "tsc --noEmit"
  }
}
```
