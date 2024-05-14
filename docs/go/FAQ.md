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