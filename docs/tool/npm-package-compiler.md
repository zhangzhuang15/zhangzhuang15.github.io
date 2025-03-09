---
title: "Library Related to Compiler"
page: true
aside: true
---

# Library Related to Compiler
This type of library might cover features like: 
- generate AST 
- walk AST 
- transform source code


## magic-string

use case：`rollup`

## swc

use case：`rollup`

## esbuild

use case: `vite`

## estree-walker
Walk AST Node, which follows [ESTree Spec](https://github.com/estree/estree).


## source-map-js
A parser and generator for sourcemap.

## merge-source-map
A tool for merging sourcemap.

Let's say we transform code A to code B, we get sourcemap-A;
Then we transform code B to code C, we get sourcemap-B;
You can use merge-source-map to merge sourcemap-A and sourcemap-B, then we get sourcemap-C. If you set breakpoint in code C, you can get the original position of code A by sourcemap-C.

## @jridgewell/sourcemap-codec
Encode and decode sourcemap.

use case：`rollup`


## postcss
Transform css.

## postcss-selector-parser
Transform css selector with help of postcss.

You can postcss-selector-parser to transform css selector as you like, for example:
`.hello {}` => `.hello[data-s="2"] {}`


## postcss-modules
A postcss plugin, which implements css module.



## remark
Transform markdown to AST, people can change AST, and transform it back to 
markdown or to html. It's important part of `unified`.

## unist-util-visit
Walk AST which follows unist standard.


:::tip <TipIcon />
hast transforms html to AST which follows unist standard；

mdast transforms markdown to AST which follows unist standard；

xast transforms xml to AST which follows unist standard；

unified takes unist standard to implement AST.
:::

use case：react website

## reprism
Highlight or tokenize code, based on prism.It supports webpack, rollup these bundler better.

use case：@jscpd/core

<Giscus />