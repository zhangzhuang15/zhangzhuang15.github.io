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

## 用 ts 开发库

```shell
mkdir demo
cd demo
pnpm init
pnpm install -D typescript rollup @rollup/plugin-commonjs @rollup/plugin-node-resolve @rollup/plugin-typescript @types/node
```

`rollup.config.ts`:

```ts
/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { log } from "console";

function developmentRollupConfig() {
  return [
    defineConfig({
      input: "browser.ts",
      plugins: [
        // [node-resolve插件仓库](https://github.com/rollup/plugins/tree/master/packages/node-resolve)
        // 默认情况下，rollup不会将node_modules中用到的依赖打包到bundle，使用本插件就可以弥补这点；
        //
        // 对于一个依赖，它的package.json中会表明整个依赖的代码入口文件是什么(比如 exports main browser)，
        // browser: true 就是告诉rollup从依赖的package.json的browser字段读取代码入口点；
        //
        // 从中就能理解 package.json 的 exports main browser的含义了， 这些字段就是一种约定，
        // 并不是说package.json中写了，就能产生效果了，还需要有像rollup这样的module解析器读取
        // 字段，完成解析工作才可以，默认情况下，package.json 的解析器是 node；
        //
        // nodeResolve插件的 order 是 "post"，会在resolveId阶段执行，且是最后一个执行，
        // typescript插件会在 nodeResolve插件之前执行，但不会造成什么影响；
        nodeResolve({
          mainFields: ["browser", "exports", "main"],
        }),
        // [typescript插件仓库](https://github.com/rollup/plugins/tree/master/packages/typescript)
        typescript({
          tsconfig: "./tsconfig.json",
          // tsconfig.json没有将 rollup.config.ts  exclude, 是为了保证rollup.config.ts被
          // rollup读取成功，而进入到项目ts代码编译的环节时，rollup.config.ts不是项目逻辑的一部分，
          // 所以要exclude掉
          exclude: "./rollup.config.ts",
          // ES2020 中可以使用 `import()`特性
          module: "ES2020",
          sourceMap: true,
          // declaration 和 declarationDir不能写入 tsconfig.json，
          //
          // 根据不同的env和target，我们采用的代码生成行为不同，比如生成
          // 浏览器使用的bundle时，声明文件放置在./target/esm/types下，
          // 生成node使用的bundle时，声明文件放置在 ./target/node/types下，
          // 这表明declarationDir是一个变量，不能固定写入tsconfig.json里；
          //
          // 另外一旦在 tsconfig.json中设置 declaration: true，那么
          // vscode就会给出提示，要求你必须给出 declarationDir，正如
          // 上面分析所言，declarationDir 是不固定的， 因此 declaration
          // 也是不固定的，不能写入 tsconfig.json
          declaration: true,
          declarationDir: "./target/esm/types",
        }),
        // [commonjs插件仓库](https://github.com/rollup/plugins/blob/master/packages/commonjs/README.md);
        // 我们自己编写的ts代码，在typescript编译之后，会变成esm风格的代码，但是引入的依赖可能最初使用commonjs风格
        // 写的（这里说的是用该风格写的纯js代码，不包含nodejs的API），需要用该插件转化为esm。
        commonjs(),
      ],
      treeshake: {
        moduleSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        dir: "./target",
        format: "esm",
        entryFileNames: "esm/[name].js",
        chunkFileNames: "esm/chunks/[name]-[hash:8].js",
        sourcemap: true,
      },
    }),
  ];
}

export default (commandLineArgs: any) => {
  const { env } = commandLineArgs;

  let configs: ReturnType<typeof developmentRollupConfig> = [];

  switch (env) {
    case "production":
      break;
    case "development":
      configs = developmentRollupConfig();
      log("running in development mode");
      break;

    default:
      log("command testing: ", commandLineArgs);
  }

  return configs;
};
```

`tsconfig.json`:

```json
{
  "exclude": ["test/*", "node_modules/*"],
  "compilerOptions": {
    "lib": ["DOM", "ES2016"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

`package.json`:

```json
{
  "type": "module",
  "scripts": {
    "build": "rm -rf target types && tsc",
    "bundle-script": "rollup --config rollup.config.ts --configPlugin typescript",
    "bundle-dev": "pnpm run bundle-script --env development",
    "bundle-production": "pnpm run bundle-script --env production",
    "bundle-purchase": "pnpm run bundle-script --env hello",
    "clear": "rm -rf target"
  }
}
```

## 一个完整monorepo的配置
:::code-group
```json [package.json]
{
  "name": "",
  "version": "",
  "author": {},
  "description": "",
  "keywords": [],
  "homepage": "",
  "repository": {
    "type": "git",
    "url": ""
  },
  "type": "module",
  "packageManager": "pnpm@7.33.7",
  "engines": {
    "node": ">=14.0.0"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "postinstall": "simple-git-hooks",
    "typecheck": "",
    "lint": "eslint --cache .",
    "format": "eslint --cache --fix .",
    "format:json": "prettier --cache --write *.json"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm exec lint-staged --concurrent false"
  },
  "lint-staged": {
    "packages/*/{src,types}/**/*.ts": [
      "eslint --cache --fix"
    ],
    "packages/**/*.d.ts": [
      "eslint --cache --fix"
    ],
    "packages/*/src/**/*.tsx": [
      "eslint --cache --fix"
    ],
    "packages/*/src/**/*.jsx": [
      "eslint --cache --fix"
    ],
    "packages/*/src/**/*.js": [
      "eslint --cache --fix"
    ],
    "packages/*/src/**/*.vue": [
      "eslint --cache --fix"
    ],
    "packages/*/src/**/*.json": [
      "prettier --cache --write"
    ],
    "playground/**/__tests__/**/*.ts": [
      "eslint --cache --fix"
    ]
  },
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "@stylistic/eslint-plugin": "^2.12.1",
    "@typescript-eslint/parser": "^5.1.0",
    "eslint": "^8.57.1",
    "eslint-plugin-json": "^4.0.1",
    "eslint-plugin-vue": "^9.32.0",
    "globals": "^15.13.0",
    "lint-staged": "^15.2.10",
    "simple-git-hooks": "^2.11.1",
    "typescript": "^4.8.4"
  },
  "dependencies": {
    "prettier": "^3.4.2"
  }
}
```
```yaml [pnpm-workspace.yaml]
packages:
  - "packages/*"
```

```txt [.npmrc]

```

```js [eslint.config.js]
import globals from "globals"
import typescriptParser from "@typescript-eslint/parser"
import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import vue from "eslint-plugin-vue"
import json from "eslint-plugin-json"

// migration from eslintrc.json to eslint.config.js:
// https://eslint.org/docs/latest/use/configure/migration-guide#processors

// rules reference:
// https://eslint.org/docs/v8.x/rules/

// stylistics reference:
// https://eslint.style/rules/default/semi-style

const rulesForJsOrTsSnippet = {
  "no-use-before-define": "error",
  "no-unused-vars": "off",
  "no-constant-condition": "off",
  "arrow-body-style": ["error", "as-needed"],
  "block-scoped-var": "error",
  "default-case-last": "error",
  "default-param-last": "error",
  "eqeqeq": "error",
  "prefer-const": "warn",
  "prefer-destructuring": "warn",
  "prefer-object-spread": "warn",
  "prefer-spread": "warn",
  "prefer-rest-params": "warn",
  "prefer-template": "warn",
  "sort-imports": ["error", {
    "ignoreCase": false,
    "ignoreDeclarationSort": true,
    "ignoreMemberSort": false,
    "memberSyntaxSortOrder": ["none", "all", "single", "multiple"],
    "allowSeparatedGroups": false
  }],
  "require-await": "warn",
  "@stylistic/semi": ["error", "never"],
  "@stylistic/semi-spacing": "error",
  "@stylistic/member-delimiter-style": "error",
  "@stylistic/indent": ["error", 2],
  "@stylistic/indent-binary-ops": ["error", 2],
  "@stylistic/block-spacing": "error",
  "@stylistic/function-call-spacing": "error",
  "@stylistic/arrow-spacing": "error",
  "@stylistic/brace-style": ["error", "1tbs"],
  "@stylistic/comma-spacing": "error",
  "@stylistic/computed-property-spacing": "error",
  "@stylistic/dot-location": ["error", "object"],
  "@stylistic/key-spacing": ["error", { 
    afterColon: true, 
    beforeColon: false,
  }],
  "@stylistic/keyword-spacing": "error",
  "@stylistic/lines-between-class-members": "error",
  "@stylistic/max-len": ["error", { 
    code: 90,
    ignoreUrls: true,
    ignoreRegExpLiterals: true
  }],
  "@stylistic/new-parens": "error",
  "@stylistic/newline-per-chained-call": ["error", { "ignoreChainWithDepth": 1 }],
  "@stylistic/no-confusing-arrow": "error",
  "@stylistic/no-floating-decimal": "error",
  "@stylistic/no-mixed-operators": "error",
  "@stylistic/no-multi-spaces": "error",
  "@stylistic/no-whitespace-before-property": "error",
  "@stylistic/operator-linebreak": ["error", "before"],
  "@stylistic/rest-spread-spacing": "error",
  "@stylistic/space-in-parens": "error",
  "@stylistic/space-infix-ops": "error",
  "@stylistic/space-unary-ops": "error",
  "@stylistic/space-before-blocks": "error",
  "@stylistic/switch-colon-spacing": "error",
  "@stylistic/template-tag-spacing": "error",
  "@stylistic/type-annotation-spacing": "error",
  "@stylistic/type-generic-spacing": "error",
  "@stylistic/type-named-tuple-spacing": "error",
  "@stylistic/wrap-iife": ["error", "inside"],
  "@stylistic/yield-star-spacing": "error",

  "@stylistic/jsx-closing-bracket-location": "error",
  "@stylistic/jsx-closing-tag-location": "error",
  "@stylistic/jsx-equals-spacing": "error",
  "@stylistic/jsx-indent": ["error", 2],
  "@stylistic/jsx-indent-props": ["error", 2],
  "@stylistic/jsx-tag-spacing": ["error", { "beforeSelfClosing": "always" }],
  "@stylistic/jsx-wrap-multilines": ["error", {
    declaration: "parens-new-line",
    assignment: "parens-new-line",
    return: "parens-new-line",
    arrow: "parens-new-line",
    logical: "parens-new-line",
    prop: "parens-new-line"
  }],
  
}

export default [
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      ...rulesForJsOrTsSnippet,
      "vue/no-unused-vars": "off",
    }
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    files: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          tsx: 'true'
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    rules: rulesForJsOrTsSnippet
  },
]
```

```txt [.eslintignore]
node_modules
**/node_modules
```
```txt [.prettierignore]
node_modules
**/node_modules
```
```txt [.gitignore]
node_modules
**/node_modules
```

```js [vite.config.js]

```
```json [.vscode/settings.json]
{
    "[json]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
}
```

```json [.vscode/extensions.json]
{
    "recommendations": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "vue.volar",
        "pucelle.vscode-css-navigation",
        "dsznajder.es7-react-js-snippets"
    ]
}
```
:::
