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
      "plugin:prettier/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: "./tsconfig.json",
      tsconfigRootDir: __dirname,
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
  