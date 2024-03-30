---
title: "Go FAQ"
page: true
aside: true
---

# Description

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
