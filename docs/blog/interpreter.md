---
title: "How to Write Interpreter"
page: true
aside: true
---

# How to Write Interpreter
I will talk about how to write an interpreter based on 2 open source code. One is [kylin-go](https://github.com/zmh-program/kylin-go), the other is [picol](https://github.com/antirez/picol). Kylin-go is written by Go. Picol is written by C.

I recommend you to read **kylin-go** first, it's more simple, self-evident and understandable, especially for beginner.

## Overview
It's not easy to write an interpreter. A mature interpreter consistes of techs, such as GC(garbage collection), JIT. For beginner, these techs are not important and necessary. We should look at simple theory first.

First, you should have grammar rules.

Second, transform source code to tokens, following grammar rules. This is what lexer does.

Third, transform tokens to execution sequences. This is what parser does.

Finally, prepare scopes, run execution sequences. This is what runtime does.

Ok, let's dive into these parts.

## Lexer
Lexer transforms source code to tokens, for example:
```js 
let age = 0;
function hello() {
    console.log("hi")
}
hello();
```

After lexer processes, we get tokens like:
```js 
tokens = [
    { type: 'keyword', value: 'let' },
    { type: 'identifier', value: 'age' },
    { type: 'operator', value: '=' },
    { type: 'number', value: '0' },
    { type: 'semicolon', value: ';'},
    { type: 'keyword', value: 'function' },
    { type: 'identifier', value: 'hello' },
    { type: 'left-bracket', value: '('},
    { type: 'right-bracket', value: ')' },
    { type: 'left-brace', value: '{' },
    { type: 'identifier', value: 'console' },
    { type: 'dot', value: '.' },
    { type: 'identifier', value: 'log' },
    { type: 'left-bracket', value: '(' },
    { type: 'right-bracket', value: ')' },
    { type: 'left-double-quotation', value: '"' },
    { type: 'identifier', value: 'hl' },
    { type: 'right-double-quotation', value: '"' },
    { type: 'right-brace', value: '}' }
    { type: 'identifier', value: 'hello' },
    { type: 'left-bracket', value: '(' },
    { type: 'right-bracket', value: ')' },
]
```

Lexer cares about word, it doesn't care about relationship of words, as a result, it produces tokens word by word.

## Parser
Parser transforms tokens to execution sequences.

Parser finds keyword `let` and operator `=`, then it creates assignment execution sequence like:
```js 
executionSequence = {
    type: 'assignment',
    variableName: 'age',
    value: 0
}
```

Parser finds next token is semicolon, just skip it.

Parser finds next token is keyword `function`, so it creates function definition execution sequence:
```js 
executionSequence = {
    type: 'function-definition',
    functionName: 'hello',
    args: [],
    body: [
        { 
            type: 'method-call',
            obj: 'console',
            methodPath: ['log'],
            args: [
                { type: 'literal', value: 'hi'}
            ]
        }
    ]
}
```

As a result, we get these sequences:
```js 
sequences = [
    {
        type: 'assignment',
        variableName: 'age',
        value: 0
    },
    {
        type: 'function-definition',
        functionName: 'hello',
        args: [],
        body: [
            { 
                type: 'method-call',
                objName: 'console',
                methodPath: ['log'],
                args: [
                    { type: 'literal', value: 'hi'}
                ]
            }
        ]
    },
    {
        type: 'function-call',
        functionName: 'hello',
        args: [],
    }
]
```

## Runtime
Runtime prepared scope, and executes sequences. 

We have got sequences:
```js 
sequences = [
    {
        type: 'assignment',
        variableName: 'age',
        value: 0
    },
    {
        type: 'function-definition',
        functionName: 'hello',
        args: [],
        body: [
            { 
                type: 'method-call',
                objName: 'console',
                methodPath: ['log'],
                args: [
                    { type: 'literal', value: 'hi'}
                ]
            }
        ]
    }
]
```
But there're some questions we should answer:
1. where is `age`
2. where is `console`

yes, this is what runtime does, it will prepare scope:
```js 
globalScope = { parent: null }
```

Runtime executes first sequence:
```js 
globalScope = { parent: null, age: 0 }
```

Runtime executes second sequnce:
```js 
globalScope = {
    parent: null,
    age: 0,
    hello: {
        args: [],
        body: [
            { 
                type: 'method-call',
                objName: 'console',
                methodPath: ['log'],
                args: [
                    { type: 'literal', value: 'hi'}
                ]
            }
        ]
    }
}
```

Runtime executes last sequence:
```js 
scope = { parent: globalScope }

if (sequence.type === 'method-call') {
    // find obj following parent link of scope
    const obj = scope[sequence.objName] || scope.parent[sequence.objName]
    const method = sequence.methodPath.reduce((prev, state) => prev[state], obj)
    const args = sequence.args.map(arg => {
        if (arg === 'literal') return arg.value;
        if (arg === 'method-call') {
            const temp_scope = { parent: scope }
            // create another scope, execute recursively
        }
    })
    scope.result = method(...args)
}

scope.parent = null;
```

Now, you have learned that how runtime works. Runtime scope is basically data of native language which is used to write interpreter, e.g. c struct, c++ class, go struct, rust struct, swift class, zig struct and etc.

## Difficulty
I introduce how to write simple interpreter, interpreter is actually more sophisticated.

For example, how to deal with lifetime of `scope`, yes, this is topic of GC.


## How to Speed up
We use native language to write an interpreter, e.g. c/c++/go/rust. We can transform source code to tokens, transform tokens to execution sequences, and save execution sequences in disk. In short words, we call preprocessing **compile**. Then, we just make runtime execute compiled file. Execution of source code gets faster than uncompiled way.

There's another way to speed up. When compiled file is executed, functions defined in source code are transformed to native language function in the end. We can cache these functions. Next time we execute same function, no transform is taken, just take out function from cache, and execute directly. In this way, it gets faster too.

