---
title: "Go FAQ"
page: true
aside: true
---

## Description

记录学习 Go 或者应用 Go 遇到的问题

## 如何写出多行字符串

```go
func main() {
    message := `
    Hello world
    You Great
    `
    fmt.Print(message)
    fmt.Print("Right")
}

// 输出
//
//    Hello world
//    You Great
//    Right
```

```go
func main() {
    message := `
Hello world
You Great
`
    fmt.Print(message)
    fmt.Print("Right")
}

// 输出
//
// Hello world
// You Great
// Right
```

```go
func main() {
    message := `
Hello world
You Great
`
    message = strings.TrimPrefix(message, "\n")
    fmt.Print(message)
    fmt.Print("Right")
}

// 输出
// Hello world
// You Great
// Right
```

## flag 写好的 cmd 工具，怎么添加用法介绍

```go
func main() {
    flag.Usage = func() {
        writer := flag.CommandLine.Output()

        usage := `
这里就是用法介绍的内容了

不多写了，简单举个例子

`
        fmt.Fprintf(writer, usage)

        // 这里是cmd参数介绍
        flag.PrintDefaults()
    }


    flag.parse()
}
```

## channel 的坑
### 1. 无缓存channel读阻塞
```go 
func main() {
    ch := make(chan int)

    go func(){
        ch <- 10
    }()

    for value := range ch {
        println("value: ", value)
    }
}
```
上述代码会死锁；

`ch <- 10` 会阻塞协程，直到有另外的协程读取 ch;

`for value := range ch`，如果 ch 不 close, 会一直读取 ch,
ch 中没有数据可读时，就会阻塞协程; 当 ch close后，for 循环就会
结束；


### 2. nil channel 读阻塞 
```go 
func main() {
    var ch chan int 

    v := <- ch
}
```
代码会阻塞，最终 deadlock

### 3. nil channel 写阻塞
```go 
func main() {
    var ch chan int 

    ch <- 10
}
```
代码会阻塞，最终 deadlock


### 4. 关闭 nil channel 会panic
```go 
func main() {
    var ch chan int 

    close(ch)
}
```

### 5. 二次关闭channel 会panic 
```go 
func main() {
    ch := make(chan int, 2)

    close(ch)

    close(ch)
}
```

### 6. 关闭后的channel写操作会panic
```go 
func main() {
    ch := make(chan int, 2)

    ch <- 10

    close(ch)

    ch <- 20
}
```

### 7. 关闭后的channel读操作正常
```go 
func main() {
    ch := make(chan int, 2)

    ch <- 10
    ch <- 11

    close(ch)

    for value := range ch {
        println("value: ", value)
    }
}
```

代码正常运行，for循环可以读取 10 和 11


## json反序列化
```go 
import "encoding/json"

type M struct {
    Hobby []string 
    Data struct {
        Name string 
    }
}

func main() {
    var m M
    json.Unmarshal([]byte(`{"hobby":["a","b"],"data":{"name":"test"},"value": 10}`), &m)

    // 1. M 中的字段一定要首字母大写，否则该字段无法序列化、反序列化
    // 2. 虽然序列化的字符串中，有个 value, M 中没有value字段，但是，
    //    Hobby Data 字段不受影响，依旧可以反序列化
}
```

再看一个例子：
```go  
package main

import (
    "encoding/json"
    "fmt"
)

type Cmd struct {
    Name string
    Value interface{}
}

type Data struct {
    Name string
    Val []int
}

func main() {
    cmd := Cmd{
        Name: "hello",
        Value: Data{
            Name: "world",
            Val: []int{20, 30},
        },
    }

    if bytes, err := json.Marshal(cmd); err == nil {
        fmt.Println(string(bytes))

        var value Cmd
        if err = json.Unmarshal(bytes, &value); err == nil {
            // 尽管 Cmd.Value是 interface{}, 但在反序列化的时候，
            // 会转化为 map 类型，而不是Data类型，这种动态处理虽然
            // unsafe，但很棒
            fmt.Println(value.Value.(map[string]any).Val)
        }
    }
}

```

## 继承方式
go采用了一种组合的方式完成继承机制。

```go 
type M struct {
    value int
}
func (m *M) hello(msg string) {
    m.value = len(msg)
}

type N struct {
    M 
    value float32
}

func main() {
    n := N { value: 20.0 }
    // 0
    println(n.M.value)
    n.hello("Peter")
    // 5
    println(n.M.value)
}
```

## 结构体的方法
```go 
type M struct {
    value int
}

func (m *M) hello(msg string) {
    m.value = len(msg)
}

func (m M) change(msg string) {
    m.value = len(msg)
}

func main() {
    m := M{}
    m.change("P")
    // 0
    println(m.value)
    m.hello("P")
    // 1
    println(m.value)

    n := &M{}
    n.change("P")
     // 0
    println(n.value)
    n.hello("P")
    // 1
    println(n.value)
}
```

go 会自动处理结构体，在适当的时候，为变量增加解引用或者引用，调用相应的结构体方法。`(m M)` 这种形式定义的方法，不会修改结构体本身；`(m *M)`这种形式定义的方法，才会修改结构体自身。

什么时候方法的接受者使用指针，什么时候使用值呢？

按照最佳实践讲，应该用指针。使用值的时候，结构体会发生拷贝，被修改的是结构体的拷贝，而不是结构体本身，如果结构体很大，拷贝就成负担了。

## defer的范围
defer是按照函数范围落实的，而不是块级范围。defer采取先进后出的方式调用，最先defer的，会是最后调用的。当使用`os.Exit`退出进程时，defer的函数不会执行！

## 闭包是按值抓取变量么
不是。按照地址抓取。闭包外修改变量，闭包内再访问该变量时，能看到最新值。

## 结构体用值还是指针
生命周期较长，或者尺寸大的结构体，用指针访问；生命周期不超过一个函数范围，或者尺寸很小的结构体，可以用值。

```go 
type H struct {
    data string
}

func app1() {
    // 用值，d仅在 app1 里存活
    d := H{ data: "color" }

}

func app2() *H {
    // 用指针
    return &H{ data: "color" }
}
```

## 与C互通
[可以阅读这篇文章](https://dev.to/metal3d/understand-how-to-use-c-libraries-in-go-with-cgo-3dbn)

### example 1
```go  
// main.go 

// #include <stdio.h>
// void hello() {
//   printf("hello world");
// }
import "C"

func main() {
    C.hello()
}
```
`go run main.go`


### example 2

```go 
// main.go 

// #include "hello.h"
import "C"

func main() {
    C.hello()
}
```
```h 
// hello.h
#ifndef __HELLO__
#define __HELLO__
void hello();
#endif
```
```c  
// hello.c 
#include <stdio.h>
void hello() {
    printf("hello world");
}
```
`go run main.go` 

