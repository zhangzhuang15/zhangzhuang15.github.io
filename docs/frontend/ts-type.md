---
title: "typescript类型系统"
page: true
aside: true
---

## Description
在尝试[类型体操](https://github.com/type-challenges/type-challenges)之后，觉得 typescript 类型非常有趣，而且还有点上头的意思，遇到了很多新奇的技巧，为防止遗忘，在此记录，以供备忘。

## 常量数组
常量数组的类型，其实可以理解为就是元组类型，元素个数是有限的，每个
元素的类型都是明确的、独立的，类型表示为[false, boolean, '1', number] 这个样子，不会退化为 any[]

### 转化为联合类型
```ts
// 要想变成常量数组，as const 很关键！
const arr = ["hello", 1, 3.3, false] as const;

// T = 'hello' | 1 | 3.3 | false
type T = (typeof arr)[number]
```

### 获取长度
```ts
const arr = ["hello", 1, 3.3] as const;

// T = 1 | 3
type T = 1 | (typeof arr)['length']
```

### 展开运算
```ts 
const arr = ['1', 3, 'hello'] as const;

// T = [false, '1', 3, 'hello']
type T = [false, ...(typeof arr)]
```

### 联合类型里的展开运算
```ts
type M = ['a', 'b'] | ['c', 'd', 'e']

// N = [boolean, 'a', 'b'] | [boolean, 'c', 'd', 'e']
type N = [boolean, ...M]
```

## 字符串
### 获取长度
字符串和常量数组都算是字面量，但是字符串无法利用'length'属性得到长度，需要将字符串转化为字符数组（常量数组），
用字符数组的length属性解决
```ts
type ToArray<T extends string> = T extends `${infer M}${infer N}` ? [M, ...ToArray<N>] : []
type StringLength<T extends string> = ToArray<T>['length']

// C = 4
type C = StringLength<"helo">
```

### 其他字面量转为字符串字面量参与推断
'hello' 是字符串的字面量，-10 10 是 number 的字面量，其他类型数据的字面量可以转为字符串字面量，然后参与infer 
```ts 
// 用 `${T}` 将 number字面量、string字面量统一为 string字面量
type Absolute<T extends number | string> = `${T}` extends `-${infer M}` ? M : T

// C = 10
type C = Absolute<-10>
```

## 联合类型
### 联合类型过滤
```ts 
type M = 'a' | 1 | false

// A = 'a'
// 相当于:
// ('a' & string) | (1 & string) | (false & string)
// 'a' | never | never
// 'a'
type A = M & string

// B = 1
type B = M & number

// C = false
type C = M & boolean

```
### inferface属性名转为联合类型
```ts
interface A {
    name: string;
    age: number
}

// B = 'name' | 'age'
type B = keyof A

const arr = ['1', '2'] as const;

// C = 0 | 1
type C = (keyof (typeof arr)) & number;

// D = 0 | 1 | 'join' | 'indexOf' | 'length' | 'slice' | 'concat' | ...
type D = keyof (typeof arr)
```
### 联合类型map映射
```ts
// 借助 extends 映射
type T<M> = M extends string ? [M] : never

// K = ['a'] | ['b']
// 相当于：
// ('a' extends string ? ['a'] : never) | 
// ('b' extends string ? ['b'] : never)
type K = T<'a' | 'b'>
```

### 联合类型和联合类型的交集、差集
```ts
// 交集
type A<T, U> = T extends U ? T : never

// 差集
type B<T, U> = T extends U ? never : T

// C = 'a' | 'c'
// 相当于：
// ('a' extends 'c' | 'd' | 'a' ? 'a' : never) |
// ('b' extends 'c' | 'd' | 'a' ? 'b' : never) |
// ('c' extends 'c | 'd' | 'a' ? 'c' : never)
//
// 'a' | 'b' | never | 'd' 的结果是 'a' | 'b' | 'd',
// never会被省略
type C = A<'a' | 'b' | 'c', 'c' | 'd' | 'a' >

// D = 'b'
type D = B<'a' | 'b' | 'c', 'c' | 'd' | 'a' >
```

## 改变interface的属性类型，但不改变其可读性
```ts
interface A {
    readonly a: string;
    b: number;
}

type B<T> = {[k in keyof T]: T[k]}

// C = {
//   a: string;
//   b: number;
// }
type C = B<A>


type D<T> = {[k in keyof T as k extends string ? k : never]: T[k] }

// D = {
//  readonly a: string;
//  b: number;
// }
type E = D<A>
```

## 一些extends
```ts
// A = 1
type A = 1 extends number ? 1 : 0

// B = 1
type B = 'hello' extends string ? 1 : 0

// C = 1
type C = (() => void) extends Function ? 1 : 0

// D = 1
type D = [11,2, false, true] extends any[] ? 1 : 0

// E = 1
type E = false extends boolean ? 1 : 0

// 都是 1
type F = 1 extends any ? 1 : 0
type G = string extends any ? 1 : 0
type H = unknown extends any ? 1 : 0
type I = never extends any ? 1 : 0
type J = void extends any ? 1 : 0

type N<T> = T extends never ? 1 : 0
type M<T> = [T] extends [never] ? 1 : 0

// P = never
type P = N<never>

// Q = 1
type Q = M<never>
```

## infer推断
### 推断元组（常量数组）
```ts
type A = [false, '1', 100];

type B<T> = T extends [...infer M, infer N] ? N : never
type C<T> = T extends [...infer M, infer N] ? M : never
type D<T> = T extends [...infer M, infer N, ...infer K] ? M : never
type E<T> = T extends [...infer M, infer N, ...infer K] ? N : never
type F<T> = T extends [...infer M, infer N, ...infer K] ? K : never
type H<T> = T extends [infer M, ...infer N] ? M : never
type I<T> = T extends [infer M, ...infer N] ? N : never

// R1 = 100
type R1 = B<A>

// R2 = [false, '1]
type R2 = C<A>

// R3 = unknown[]
type R3 = D<A>

// R4 = unknown
type R4 = E<A>

// R5 = unknown[]
type R5 = F<A>

// R6 = false
type R6 = H<A>

// R7 = ['1', 100]
type R7 = I<A>
```
### 推断字符串
```ts
type S = 'a' | 'b'
type A<T extends string> = T extends `${infer M}${infer N}` ? M : never
type B<T extends string> = T extends `${infer M}${infer N}` ? N : never
type C<T extends string> = T extends `${infer M}a${infer N}` ? M : never
type D<T extends string> = T extends `${infer M}a${infer N}` ? N : never
type E<T extends string> = T extends `${infer M}${S}${infer N}` ? M : never
type F<T extends string> = T extends `${infer M}d${infer N}` ? N : never
type G<T extends string> = T extends `${infer M}h${infer N}` ? M : never
type H<T extends string> = T extends `${infer M}${S}${infer N}` ? `${M}_jack` : never
type I<T extends string> = T extends `${infer M}${S}${infer N}` ? `${M}_j${S}` : never

// R1 = 'h'
type R1 = A<'helloaworld'>

// R2 = 'elloaworld'
type R2 = B<'helloaworld'>

// R3 = 'hello'
type R3 = C<'helloaworld'>

// R4 = 'world'
type R4 = D<'helloaworld'>

// R5 = 'hello'
type R5 = E<'hellobworld'>

// R6 = ''
type R6 = F<'helloaworld'>

// R7 = ''
type R7 = G<'helloaworld'>

// R8 = 'hello_jack'
type R8 = H<'helloaworld'>

// R9 = 'hello_a' | 'hello_b'
type R9 = I<'helloaworld'>
```

### 推断函数参数
```ts
type Params<T extends Function> = T extends (...args: infer M) => any ? M : never

// C = [arg1: number, arg2: string, arg3: 1 | 2]
type C = Params<(arg1: number, arg2: string, arg3: 1 | 2) => any>
```
延伸一下，增加函数参数：
```ts
type Params<T extends Function> = T extends (...args: infer M) => any ? (
    (...args: [...M, boolean]) => any
) : never

// A = (arg1: number, arg2: string, arg3: boolean) => any
type A = Params<(arg1: number, arg2: string) => any>
```

### 推断函数返回值
```ts
type ReturnValue<T extends Function> = T extends (...args: any[]) => infer M ? M : never

// C = string
type C = ReturnValue<() => string>
```

## 索引器
```ts
type A = {
    [key: string]: any
    hello(): void
}

```

key 在 A 中的类型是 `string | number | symbol`， 利用这一点，可以将其过滤：
```ts
type A = {
    [key: string]: any
    hello(): void
}

type Filer<T, P = PropertyKey> = {
    [k in keyof T as P extends k ? never: (k extends P ? k:never)]: T[k]
}

// 写成这样，可不行哦
// type Filer<T> = {
//  [k in keyof T as (string|number|symbol) extends k ? never: (k extends string|number|symbol ? k:never)]: T[k]
// }

// c = { hello(): void }
type c = Filter<A>
```