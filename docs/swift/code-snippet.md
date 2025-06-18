---
title: "code snippet"
page: true
aside: true
---

## main function
和其它编程语言不通，swift没有默认的入口函数。如果你想指定入口函数，你需要采取如下写法，尽管它非常想Java的风格，很令人讨厌：
```swift 
import Foundation

@main
public class Main {
    static func main() async {
        print("hello world")
    }
}
```
> `@main` 只能修饰 class, enum, struct。你需要提供一个main方法。

执行`swift build` 之后，再执行生成的程序，终端就会打印`hello world`。


## 语法突击
:::code-group
```swift [switch-example.swift]
// 展示：类型模式匹配

struct MM {
    let value: Int
}

func main() {
    var score = 10
    switch score {
    // 90 <= score <= 100
    case 90...100:
        print("A")
    // 80 <= score < 90
    case 80..<90:
        print("B")
    case let val where val >= 50 && val < 80:
        print("C")
    default:
        print("D")
    }


    let enty = (100, "hello")
    switch enty {
    case let (_score, msg) where _score > 10:
        print("msg: \(msg)")
    default:
        print("")
    }

    enum Direction {
        case Left(String)
        case Right(String)
    }

    let direction: Direction = .Left("left")
    switch direction {
    case let .Left(direction):
        print("msg: \(direction)")
    case let .Right(direction):
        print("msg: \(direction)")
    }


    enum M {
        case Left(MM)
        case Right(String)
    }

    let m: M = .Left(MM(value: 10))
    switch m {
    case let .Left(m):
       print("value: \(m.value)")
    case let .Right(s):
       print("s: \(s)")
    }

    // 你不能如此匹配:
    // switch m {
    // case .Left(let M(value)):
    //   print("value: \(value)")
    // case let .Right(s):
    //   print("s: \(s)")
    // }
    //
    // swift的模式匹配没有Rust强大，无法玩出上述的表达

}
```
```swift [optional-example.swift]
// 展示：optional类型处理

func callbackThrowingError() throws -> String {
    throw NSError(domain: "com.example", code: 0, userInfo: nil)
}

func main() {
    var source: String? = nil

    // nil给过滤掉了，不会执行
    if let m = source {
        let val = m.take()
        print("\(val)")
    }

    // source是nil的话，采取默认值 “hello”
    source = source ?? "hello"

    // 通过 guard 校验，不会执行 else 语句，
    // 如果进入到 else 语句，必须保证程序提前结束，
    // 这是 guard 的固定要求
    guard let val = source else {
        print("bail out")
        return
    }

    // 在确保不是nil的时候，可以使用!强制unwrap optional value,
    // 此时  value 就是 String 类型
    let value = val!
    print("\(value)")

    // 可使用 ？防御，一旦val是nil，直接返回nil，不用执行hasPrefix
    if let _ = val?.hasPrefix("hel") {
        print("hello has prefix 'hel'")
    }

    // 如果 callbackThrowingError 抛出一个 Error, try?
    // 会将其转化为 nil
    if let _ = try? callbackThrowingError() {
        print("ok")
    } else {
        print("some error")
    }

}
```
```swift [mutating-example.swift]
// 展示：mutating 修饰符
enum Color {
    case red(Int)
    case blue(Int)

    mutating func increaseBrightness(by amount: Int) {
        switch self {
        case .red(let r):
            self = .red(r + amount)
        case .blue(let b):
            self = .blue(b + amount)
        }
    }
}

struct Point {
    var x: Int
    var y: Int

    mutating func move(by dx: Int, dy: Int) {
        x += dx
        y += dy
    }
}
```
```swift [enum-example.swift]
// 展示： enum 
enum OperationResult {
    case success(message: String)
    case failure(error: Error)

    // static method is supported
    static func createSuccess(message: String) -> OperationResult {
        return .success(message: message)
    }

    static func createFailure(error: Error) -> OperationResult {
        return .failure(error: error)
    }

    // computed property is supported
    var message: String {
        switch self {
        case .success(let message):
            return message
        case .failure(let error):
            return "Error: \(error.localizedDescription)"
        }
    }

    // method is supported
    func displayMessage() {
        switch self {
        case .success(let message):
            print("Success: \(message)")
        case .failure(let error):
            print("Failure: \(error)")
        }
    }
}

let successResult = OperationResult.createSuccess(message: "Operation successful")
let failureResult = OperationResult.createFailure(error: NSError(domain: "com.example", code: 404, userInfo: nil))

print(successResult)  // Outputs "OperationResult.success(message: "Operation successful")"
print(failureResult)  // Outputs "OperationResult.failure(error: Error Domain=com.example Code=404)"


protocol Displayable {
    func display()
}

// extension and protocol are supported
extension OperationResult: Displayable {
    func display() {
        switch self {
        case .success(let message):
            print("Success: \(message)")
        case .failure(let error):
            print("Failure: \(error)")
        }
    }
}


// keep in mind that one enum cannot inherit from another enum like class
```
```swift [operator-override.swift]
// 展示运算符重载
struct M {
    var value: Int

    static func +(lhs: M, rhs: M) -> Int {
        return lhs.value + rhs.value
    }
}

func main() {
    var m = M()
    m.value = 10

    var n = M()
    n.value = 20

    let t = m + n
    print("\(t)")
}

main()
```
:::

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

## async 和 await
```swift
import Foundation

// 定义一个异步函数来发送HTTP请求
func fetchData(from urlString: String) async throws -> (Int, String) {
    guard let url = URL(string: urlString) else {
        throw URLError(.badURL)
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse else {
        throw URLError(.badServerResponse)
    }
    
    let statusCode = httpResponse.statusCode
    let responseData = String(data: data, encoding: .utf8) ?? ""
    
    return (statusCode, responseData)
}

// 使用Task来并行执行多个请求
// 默认在后台线程执行
Task {
    let urls = [
        "https://api.example.com/data1",
        "https://api.example.com/data2",
        "https://api.example.com/data3"
    ]
    
    do {
        // 并行发送请求
        async let response1 = fetchData(from: urls[0])
        async let response2 = fetchData(from: urls[1])
        async let response3 = fetchData(from: urls[2])

        // 按照下边的写法，会在 response1 对应的接口数据返回后，
        // 再去发送请求，获取 response2:
        // let response1 = fetchData(from: urls[0])
        // async let response2 = fetchData(from: urls[1])
        
        // 等待所有请求完成
        let results = try await [response1, response2, response3]
        
        // 处理结果
        for (index, result) in results.enumerated() {
            print("Response from \(urls[index]):")
            print("Status code: \(result.0)")
            print("Data: \(result.1)")
        }
        
        print("All requests are completed.")
    } catch {
        print("Error: \(error)")
    }
}
```

## dispatchQueue控制多任务
:::code-group
```swift [serial.swift]
import Foundation

let serialQueue = DispatchQueue(label: "com.example.serialQueue")

serialQueue.async {
    print("Task 1 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 1 completed")
}

serialQueue.async {
    print("Task 2 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 2 completed")
}

serialQueue.async {
    print("Task 3 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 3 completed")
}

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 5)
```

```swift [concurrent.swift]
import Foundation

let concurrentQueue = DispatchQueue(label: "com.example.concurrentQueue", attributes: .concurrent)
let dispatchGroup = DispatchGroup()

dispatchGroup.enter()
concurrentQueue.async {
    print("Task 1 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 1 completed")
    dispatchGroup.leave()
}

dispatchGroup.enter()
concurrentQueue.async {
    print("Task 2 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 2 completed")
    dispatchGroup.leave()
}

dispatchGroup.enter()
concurrentQueue.async {
    print("Task 3 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("Task 3 completed")
    dispatchGroup.leave()
}

// 在所有任务完成后执行
dispatchGroup.notify(queue: DispatchQueue.main) {
    print("All tasks completed")
}

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 5)
```

```swift [concurrent-serial.swift]
import Foundation

let queue = DispatchQueue(label: "com.example.queue", attributes: .concurrent)

let workItem1 = DispatchWorkItem {
    print("WorkItem 1 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("WorkItem 1 completed")
}

let workItem2 = DispatchWorkItem {
    print("WorkItem 2 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("WorkItem 2 completed")
}

let workItem3 = DispatchWorkItem {
    print("WorkItem 3 started")
    Thread.sleep(forTimeInterval: 1) // 模拟耗时操作
    print("WorkItem 3 completed")
}

// 设置依赖关系
workItem2.notify(queue: queue, execute: workItem3)

// 提交工作项
queue.async(execute: workItem1)
queue.async(execute: workItem2)

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 5)
```
```swift [thread.swift]
import Foundation

func main() {
    group.enter()
    let th1 = Thread() { () in
        Thread.sleep(forTimeInterval: 4 )
        print("hello world")
        group.leave()
    }
    
    group.enter()
    let th2 = Thread() { () in
       print("ok ok I know it")
        Thread.sleep(forTimeInterval: 6)
        print("why not")
        group.leave()
    }
    
    th1.start()
    th2.start()
    
    group.wait()
    print("all done")

}

main()
```
:::

## 创建进程
```swift
import Foundation

// 创建一个Process对象
let process = Process()

// 设置要执行的命令
process.executableURL = URL(fileURLWithPath: "/bin/echo")

// 设置命令行参数
process.arguments = ["Hello, World!"]

do {
    // 启动进程
    try process.run()
    // 等待进程完成
    process.waitUntilExit()
    print("Process completed with exit code: \(process.terminationStatus)")
} catch {
    print("Failed to run process: \(error)")
}
```

## 使用锁
```swift
import Foundation

let lock = NSLock()
var sharedResource = 0

// 创建一个全局队列
let globalQueue = DispatchQueue.global()

// 在全局队列上异步执行任务
globalQueue.async {
    lock.lock()
    for _ in 0..<5 {
        sharedResource += 1
        print("Task 1 - \(sharedResource)")
    }
    lock.unlock()
}

// 在全局队列上异步执行另一个任务
globalQueue.async {
    lock.lock()
    for _ in 0..<5 {
        sharedResource += 1
        print("Task 2 - \(sharedResource)")
    }
    lock.unlock()
}

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 1)
```

## 使用信号量
```swift
import Foundation

let semaphore = DispatchSemaphore(value: 1)
var sharedResource = 0

// 创建一个全局队列
let globalQueue = DispatchQueue.global()

// 在全局队列上异步执行任务
globalQueue.async {
    semaphore.wait()
    for _ in 0..<5 {
        sharedResource += 1
        print("Task 1 - \(sharedResource)")
    }
    semaphore.signal()
}

// 在全局队列上异步执行另一个任务
globalQueue.async {
    semaphore.wait()
    for _ in 0..<5 {
        sharedResource += 1
        print("Task 2 - \(sharedResource)")
    }
    semaphore.signal()
}

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 1)
```

## 使用原子操作
```swift
import Foundation
import stdatomic

// 定义一个原子变量
var atomicInt: atomic_int = 0

// 在全局并发队列上异步执行任务
DispatchQueue.global().async {
    for _ in 0..<5 {
        atomic_fetch_add(&atomicInt, 1)
        print("Task 1 - \(atomic_load(&atomicInt))")
    }
}

// 在全局并发队列上异步执行另一个任务
DispatchQueue.global().async {
    for _ in 0..<5 {
        atomic_fetch_add(&atomicInt, 1)
        print("Task 2 - \(atomic_load(&atomicInt))")
    }
}

// 保持主线程运行一段时间，以便观察输出
Thread.sleep(forTimeInterval: 1)

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