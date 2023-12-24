const tsconfigAbsolutePath = require.resolve("./tsconfig.json")

module.exports = {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      "airbnb-base",
      "airbnb-typescript/base",
      "plugin:@typescript-eslint/recommended",
      "plugin:vue/vue3-recommended",
    ],
    // ref: 
    // https://eslint.vuejs.org/user-guide/
    // https://github.com/vuejs/vue-eslint-parser#readme
    parser: "vue-eslint-parser",
    parserOptions: {
      parser: {
        // <script lang="ts" setup> 用这个parser解析
        "ts": "@typescript-eslint/parser",
      },

      // vue-eslint-parser 就很操蛋，在 parser 里
      // 给出了 ts 去配置 @typescript-eslint/parser，
      // 但是没有处理 @typescript-eslint/parser 接收
      // 的 options 参数， vue-eslint-parser 采取了
      // 非常懒的方式，将 parserOptions 里的所有参数
      // 传给了 @typescript-eslint/parser，因此在
      // 这里直接配置 project，@typescript-eslint/parser
      // 就能接收到，关于这一点，vue-eslint-parser
      // 文档没有写，只能爬代码，SHIT！
      // 
      // 弊端就是，如果 @typescript-eslint/parser 在处理
      // parserOptions 的时候，发现某个参数不是自己需要的，
      // 抛出错误了，eslint直接就崩了
      project: tsconfigAbsolutePath
    },
    plugins: ["@typescript-eslint"],
    rules: {
      "import/prefer-default-export": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        { 
          "selector": "variableLike",
          "format": [
            "camelCase",
            "strictCamelCase",
            "PascalCase",
            "StrictPascalCase",
            "snake_case",
            "UPPER_CASE"
          ],
          custom: {
            regex: "([A-Z][a-z0-9]*_?)*",
            match: true
          },
          leadingUnderscore: "allow"
        }
      ]
    },
};
  