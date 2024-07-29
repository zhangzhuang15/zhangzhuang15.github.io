---
title: "code snippet"
page: true
aside: true
---

## 创建文件
```swift
import Foundation

func main() {
    let hello = "hello world"
    let n = hello.data(using: .utf8)
    FileManager.default.createFile(
        atPath: "./test.txt", 
        contents: n
    )
}

main()
```

## 发送http请求
```swift 
import Foundation 

// use swift to do a http request
func do_request() {
    var session = URLSession.shared
    let url = URL(string: "https://www.baidu.com/")!
    
    session.dataTask(with: url) {(data, response, error) in
        if let error = error {
            print("error")
            return
        }
        
        guard let data = data else {
            print("data is bad")
            return
        }
        
        let result = String(data: data, encoding: .utf8) ?? ""
        print("data: \(result)")
    }.resume()
}

do_request()
```

## 解析文件路径字符串的信息
```swift 
import Foundation

func main() {
    var s = "/a/b/hello.txt"
    var path = s as NSString 
    // hello.txt
    print(path.lastPathComponent)
    // txt
    print(path.pathExtension)
    // ['/', 'a', 'b', 'hello.txt']
    print(path.pathComponents)

    var m = path.appendingPathComponent("../world.swift")
    // /a/b/hello.txt/../world.swift
    print(m)
    // /a/b/world.swift
    print((m as NSString).standardizingPath)
}

```