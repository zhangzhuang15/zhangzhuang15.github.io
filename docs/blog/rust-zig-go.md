---
title: "Never Confused: Rust, Zig and Go"
page: true
aside: true
---

# Never Confused: Rust, Zig and Go
With the flourish of modern program languages, people often get trapped into a question: which program language is better, should I learn it as my second language ?

I'd like to talk about Rust, Zig and Go.

## Give up C or C++ ?
At past time, people usually use C or C++ to do system programming. They had no other better choice. Today, everything is different. We have more safe choice, Rust,Zig and Go. 

It doesn't say we should give up C or C++, and never learn it. There're a number of libraries and tools written in C or C++, and people spend many years using, tesing, fixing them, as a result, they're more safe than we imagine. It's impossible to rewrite them with Rust, Zig and Go. This is history, we have to respect.

We still need to learn C (C++ is optional). Why ? Because popular operating system is written in C and asm. Learning C and using system library, help us understand operating system well. For example, when you create a server in nodejs:
```js 
import { createServer } from "node:http"

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});
```
You never know what is Socket. Nodejs hides some deep details using more human-friendly API. But these deep details are basic operating system theory we should understand. API and wrapper always change, but operating system theory never changes.

If you have basic knowledge of C and operating system, it's ok to do system programming in C, but I don't encourage you to do that. 

Here is my reason. C is simple, super-fast language, but it's unsafe, requires programmer to keep safety of code. Human isn't trustable, people always make mistakes and they seldom realize until accident is coming. Someone disagrees with me and says Linux is exception. Yes, I agree that Linux is exception. But you have to confess that there is historical reason behind Linux and many advanced, brilliant programmers develop, test Linux. Human is not machine and gets tired easily. At the point, human can't concentrate themselves on keeping code safe, yet ?

Finally, we'd better use more modern and safe tool to help us improve safety of code. Here is Rust, Zig and Go.

## Compare to C 
I'm familiar with these 3 languages, and it doesn't say other languages are bull shit. I don't like these language, but I respect them. Ok, here we go.

Let's look at what's different comparing these 3 languages with C.

### Rust 
Unlike C, Rust requires you to mark `unsafe` if you write code like C. Great! The feeling is like we walk on flat road and just look out a few holes. If you write C, the feeling is like we walk on road filled with holes, we have to find a flat route.

It's not to say your code is absolutely safe with Rust. It says, if your code is unsafe, the problem must locate in `unsafe` marked part of your code. In other words, if you promise that `unsafe` marked part is safe, your code is safe. As you can see, Rust doesn't destory unsafe code, but diminish them. You cannot take control of 10000 lines of unsafe code, but I believe that you can take control of 100 lines of unsafe code.

Rust also provides you module management, testing tools, building system out of box, supercharges your development. Rust has nearly performance of C, you can ignore performance gap mostly.

Rust is designed more readable and human-friendly, I'll talk later.

### Zig
Unlike C++, Zig provides the important part which C lacks of——module management.Zig inherits from C, requires programmer to allocate/free memory, and also improves memory management. It provides `defer` `errordefer` keywords, preventing you from forgetting to release memory. It designes explicit allocator so that you can allocate memory in a flexible way.

In a word, it's more safe than C but still unsafe, it gives you ability of controling everything explicitly, no code is implicit. If there is a language take place of C, my choice is Zig.

Zig grammar is weird and friendly, I'll talk later.

### Go
If we consider seriously, Go is not a system program language because of its GC. GC is not fault, it's a method of keeping code safe. Go also provides module management, great!

Go is not in same level with C, it looks like application-side C, not system-side C. 

Many API of Go standard library inherits from style of C. It makes Go similiar with C. Its grammar rules are really simple, I love it. In my opnion, simplicity is beauty.

### Conclusion
Rust =  C + module management + safety check + super great developing experience + neat project structure + advanced friendly abstraction. Rust is more academic and systematic.

Zig = C + module management + improved memory management + great developing experience + neat project structure. Zig looks like perfect C, however you're still careful.

Go = C + module management + GC + great developing experience + neat project structure. Go looks like application C.

## Shining Point of Friendly Programmar
### Rust
Rust grammar is friendly if you're javascript programmer. For c or c++ programmer, it might seems to be ugly.

#### trailing ignored return
```rs 
fn get_data() -> i32 {
    100
}

// h is 100
let h = get_data();
```
#### `if` expression
```rs 
let world = "hello world".to_string();
let result = if world.len() > 4 { "big" } else { "small" };
```

#### block expression
```rs 
let world = {
    let mut count = 0;
    count += 1;
    count
};
```

#### `if let`
```rs 

let val = Some("apple".to_string());
if let Some(fruit) = val {
    println!("{}", fruit);
}
```

#### `match`
```rs 

let hello = Some("hello".to_string());
match hello {
    Some(val) => { println!("{}", val); },
    None => {}
};

let hello = Some("hello".to_string());
let value = match hello {
    Some(val) => { println!("{}", val); val },
    None => "".to_string(),
};


struct Data {
    name: String,
    val: i32,
};
let data = Data { name: "hello".to_string(), val: 30 };
match data {
    Data { name, .. } => { println!("{}", name); },
    _ => {},
}
```

#### destructure
```rs 
struct Data {
    name: String,
    val: i32,
};

let x = Data { name: "hello".to_string(), val: 34 };
let y = Data { val: 100, ..x };

// output 100
println!("{}", y.val);
```


#### `break` expression
```rs 
let world = 'why: {
    break 'why "world".to_string();
};
```

#### mutability
```rs 
struct Data {
    data: i32,
};

let val = Data { data: 200 };
// wrong!
val.data = 100;

let mut val = Data { data: 200 };
// yes
val.data = 100;
```

If you want internal mutability, you should use `Cell` `RefCell`.


### Zig
Ugly grammar of Zig is merely `@`, e.g. `@import`, `@as`. For javascript programmer, it's weird and not friendly at all😭.

#### orelse
```zig 
var val = null;
const result = val orelse 100;
```

#### `if` expression
```zig 
var a = 100;
var b = if (a > 50) 3 else 5;
```

#### `if` match
```zig 
const Data = struct {
    val: u8,
};

var data: ?Data = null;
if (data) |d| {
    d.val += 1;
}
```

#### `break` expression
```zig 
var data = hello: {
    break :hello 100;
};
```

#### `catch` expression
```zig 
var result = res: {
    const val = do_somthing() catch |err| {
        break :res 1000;
    }
    break :res val;
}
```

#### `errdefer`
```zig 
var count = 10;
errdefer {
    count += 1;
};
```

#### `defer`
```zig
defer {
    mydata.deinit(allocator);
};
```

#### `.*` assignment
```zig 
const Data = struct {
    val_1: u8,
    val_2: u8,
    val_3: u8,
};

var data = Data {
    .val_1 = 10,
    .val_2 = 20,
    .val_3 = 30,
};

data.val_1 = 20;
data.val_2 = 30;
data.val_3 = 40;

// with .*
data.* = .{
    .val_1 = 20,
    .val_2 = 30,
    .val_3 = 40,
};
```

#### partial destructure
```zig 
var a = .{ 10, 20, "tuple" };

// b is 10, c is 20, d is "tuple"
const b, c, d = a;
```

#### automatic type match
```zig 
const OS = enum {
    macos,
    win,
    linux,
};

// same as swift
const os: OS = .macos;
```

#### `switch`
```zig 
var a = 100;
switch (os) {
    100 => 1000,
    200 => 2000,
    .linux => 100,
    else => |v| => 1000
}
```

#### mutability
```zig 
const Data = struct {
    val: u8,
};

const data = Data {.val = 10 };
// wrong!
data.val = 20;

var data = Data {.val = 10 };
// yes
data.val = 20;

const data = &Data{.val = 10 };
// wrong !
// data is a pointer refering to stack memory,
// not allow you to change val.
data.val = 100;

const std = @import("std");
fn create_data_from_heap(allocator: *std.mem.Allocator) !*Data{
    const data = try allocator.create(Data);
    data.val = 100;
    return data;
}
const data = create_data_from_heap();
// yes!
// data is a pointer refering to heap memory,
// allow you to change val.
data.val = 1000;

```

### Go 
Go grammar is simple, its keywords are fewer than Zig and Rust, as a result, it's readable and understandable. I'm attracted by its simplicity.

#### `if;`
```go 
func take_value() int, any {
    return 100, nil
}

if val, err := take_value(); err == nil {

}
```

#### `switch`
```go 
val := 200

switch val {
    case 100:
    fmt.Println("well")
    case 12, 200, 10:
    fmt.Println("shot it")
    default:
    fmt.Println("a ha")
}

switch v := val.(type) {
    case int:
    fmt.Println("int")
    default:
    fmt.Println("unknown")
}

switch {
    case val > 300:
    fmt.Println("great")
    case val == 200:
    fmt.Println("well");
    default:
    fmt.Println("ok")
}
```


## Compare Size of Executable File
Many people worry about size of executable file which Rust/Zig/Go generates. Here is my view.

Excutable file which C generates is normal smaller because C uses dynamic linkage to link C standard library as default. But Rust/Zig/Go uses static linkage to link its standard library as default, so its generated executable file is always bigger than fiels C generates. 

If you adopt dynamic linkage, rustc will generate executable file whose size is nearly same as C. Zig/Go cannot do that. Zig thinks about stability, don't allow you to use dynamic linkage to link standard library. Go has its own runtime which brings go routine feature, it's still big even if you use dynamic linkage.

In conclusion, C generates 10KB-level executable file, Rust generates 100KB-level executable file and it can reach 10KB-level, Zig generates 100KB-level executable file, Go generates 1MB-level executable file.

For bare machine, C/Rust/Zig is better.

## CPP is Better ?
In TIOBE, cpp takes up second or third spot, but it doesn't mean that cpp is better. Frankly speaking, cpp is mature, so people tend to adopt cpp rather than new languages, such as Rust. It feels like teachers teach you with cpp and you're more likely using cpp. If you like spending more efforts on maintaining code safety by yourself, cpp is more suitable for you.

Linus said cpp was bullshit, it's not true. It's bullshit if you use cpp in a wrong way, and that says you have to follow code style and rules seriously. Last not but least, you can't hold safety and speed at the same time.

## Hello World Comparing 
There're "hello world" programs written by c, cpp, zig and rust, and here are the size.

| language | size | compile |
|:--|:--:|:--:|
| c | 33KB | gcc main.c -o main |
| cpp | 39KB | g++ main.cc -std=c++20 -o main |
| zig(debug mode) | 861KB | zig build-exe main.zig |
| rust(debug mode)| 439KB | cargo build |
| zig(release-fast mode)| 50KB | zig build-exe -O ReleaseFast main.zig |
| rust(release mode)| 405KB | cargo build --release |
| rust(release mode and prefer dynamic)| 49KB | RUSTFLAGS="-C prefer-dynamic" cargo build --release |

As you can see, if we don't request safety, there is not different among these languages.

:::code-group 
```c [main.c]
#include <stdio.h>
int main() {
    printf("hello world");
    return 0;
}
```

```cpp [main.cc]
#include <iostream>

int main() {
    std::cout << "hello world" << std::endl;
    return 0;
}
```

```zig [main.zig]
pub fn main() !void {
    const std = @import("std");
    const stdout = std.io.getStdOut().writer();
    try stdout.print("Hello, World!\n", .{});
}
```

```rust [main.rs]
mod util {
    pub fn say_hello() {
        println!("hello world");
    }
};

fn main() {
    util::say_hello();
}
```
:::

## Name Mangle
| language | has name mangle | how to ignore name mangle |
|:--:|:--:|:--:|
| Rust | ✅ | `extern "C" fn ` |
| Go | ✅ | cgo with `export` comment |
| Zig | ✅ | `export fn` |
| Cpp | ✅ | `extern "C"`|
| C | ❌ ||