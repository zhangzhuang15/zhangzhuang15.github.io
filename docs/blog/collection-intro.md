---
title: "速览：几种编程语言的容器类型"
page: true
aside: true
---

# 速览：几种编程语言的容器类型
日常开发中，我们通常使用vscode这样的编码工具，这些工具可以提供类型提示以及API提示，因此无需死记硬背。但是，像leetcode这种答题平台，并没有提供这些智能提示，javascript可能会有，但是cpp/c/java/go/rust/python/swift大多数没有。在答题的时候，我们并不需要背太多的API。在掌握编程语言基本语法的前提下，记下编程语言内置库的容器类型（vector, string, set, map）的API，就足够解决算法题。因此，这个文章就是总结一下这些容器类型的API，帮助需要的人查阅、记忆。

## cpp 
### vector
```cpp 
#include <vector>
#include <iostream>

int main() {
    // []
    std::vector<int> v;
    
    // [empty, empty, empty, empty]
    v.reserve(4);

    // 4
    auto capcity = v.capacity();

    // [10, empty, empty, empty]
    v.push_back(10);

    // [10, 20, empty, empty]
    v.emplace_back(20);

    // [10, 20, 30, empty]
    v.insert(v.end(), 30);

    // [10, 20, 40, 30]
    v.emplace(v.end() - 1, 40);

    // 10
    auto first = v.front();

    // 30
    auto last = v.back();

    // [10, 20, 40, empty]
    v.pop_back();

    // 3
    auto size = v.size();

    for (auto it : v) {
        std::cout << it << " " << std::endl;
    }

    for (int i = 0; i < v.size(); i++) {
        std::cout << v[i] << " " << std::endl;
    }

    // [10, 20, 40, 50]
    v.push_back(50);

    // [10, 40, 50, empty]
    v.erase(v.begin() + 1);

    // [10, empty, empty, empty]
    v.erase(v.begin() + 1, v.end());

    // [empty, empty, empty, empty]
    v.clear(); 

    return 0;
}
```

```cpp 
#include <vector>
#include <string>

int main() {
    std::vector<int> v = { 10, 20, 30 };

    // ["hello", "hello", "hello", "hello"]
    std::vector<std::string> vec(4, "hello");

    // [10, 20]
    std::vector<int> vp(v.begin(), v.end() - 1);

    return 0;
}

```

### map 
```cpp 
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m;
    
    // {"hello": 10}
    m["hello"] = 10;
    
    // success: false
    // {"peter": 10}
    const auto [_, success] = m.insert({"hello", 100});

    //  {"hello": 100 }
    m.insert_or_assign("hello", 100);

    // true
    m.contains("hello");

    // {}
    auto result = m.extract("hello");
    result.key() = "peter";
    result.mapped() = 20;

    // { "peter": 20 }
    m.insert(std::move(result));

    // {}
    m.erase("peter");

    auto it = m.find("peter");
    // true
    auto not_find_it = it == m.end();

    // { "peter": 10, "world": 100, "hello": 1000 }
    m.insert({"peter", 10});
    m.insert({"world", 100});
    m.emplace("hello", 1000);

    for (auto [key, value] : m) {
        std::cout << key << value << std::endl;
    }

    // {}
    m.clear();

    return 0;
}
```

```cpp 
#include <map>
#include <string>

int main() {
    std::map<std::string, int> m = {
        { "hello", 10 },
        { "world", 100 }
    };

    using pair = std::pair<std::string, int>;
    auto list = {pair{"one", 11}, {"two", 27 } };
    std::map<std::string, int> p = list;

    return 0;
}
```

### set 
```cpp 
#include <set>
#include <iostream>

int main() {
    std::set<int> set;
    
    // [10, 20]
    set.insert(10);
    set.emplace(20);

    if (set.contains(10)) {
      std::cout << "include 10" << std::endl;
    }

    for (auto it : set) {
      std::cout << it << std::endl;
    }
    
    // [20]
    set.erase(10);
    // []
    set.clear();

    return 0;
}
```

```cpp 
#include <set>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> vec = {10, 20, 20, 20, 40 };
    // [10, 20, 40]
    std::set<int> set(vec.begin(), vec.end());
}

```


### string 
```cpp 
#include <string>
#include <iostream>

int main() {
    std::string h = "hello";
    
    // "hello "
    h.push_back(' ');

    // "hello world!"
    h.append("world!");
 
    // "hello world"
    h.pop_back();

    // 'h'
    auto first = h.front();

    // 'd'
    auto last = h.back();

    // 'l'
    auto c = h[3];

    // "hllo world"
    h.erase(h.begin() + 1);

    // "ho world"
    h.erase(h.begin() + 1, h.begin() + 3);

    // 8
    auto size = h.size();

    // true
    auto found = h.starts_with("ho");

    // false
    found = h.ends_with("od");

    // 3
    auto pos = h.find("wo");
    if (pos == std::string::npos) {
        std::cout << "not found" << std::endl;
    }

    // "hello world"
    h.replace(0, 2, "hello");

    // "wllo world"
    h.replace(0, 2, "w");

    // "hello world"
    h.replace(0, 4, "hello world", 0, 5);

    // "world"
    h.replace(h.begin(), h.begin() + 6, "");

    // "orl"
    auto str = h.substr(1, 3);

    // r > 0
    auto r = h.compare(str);

    // "work world"
    h.insert(3, "k wor");

    // used for c style or c function
    auto ptr = h.data();

    h.clear();

    return 0;
}
```

```cpp 
#include <string>

int main() {
    // "===="
    std::string h(4, '=');

    char[] ptr = "hello world";
    std::string x(ptr);

    // "hel"
    std::string y(ptr, 3);

    // "hello worldhel"
    std::string c = x + y;

    return 0;
}
```

## go 
### vector 
```go 
package main 

func main() {
    vec := []int{10, 20, 30}

    size := len(vec)

    capacity := cap(vec)

    // {10, 20, 30}
    vec = append(vec, 40)

    // {20, 30}
    vec = vec[1:len(vec)]

    first := vec[0]
    last := vec[len(vec)-1] 
    
    for index, value := range vec {
        println(index, value)
    }

    for index := range vec {
        println(index)
    }

    for _, value := range vec {
        println(value)
    }
}
```

```go 
package main 

func main() {
    vec := make([]int, 0, 10)

    // 0
    size := len(vec)

    // 10
    capacity := cap(vec)
}
```

### map 
```go 
package main 

func main() {
    m := map[string]int{
        "hello": 2,
        "world": 3
    }

    m["peter"] = 10

    delete(m, "world")

    if val, ok := m["world"]; ok {
        println(val)
    }

    for key, value := range m {
        println(key, value)
    }

    for key := range m {
        println(key)
    }

    for _, value := range m {
        println(value)
    }
}
```

```go 
package main 

func main() {
    m := make(map[string]int)
}
```

### string
```go 
package main

func main() {
    s := "hello"
    s += " world"

    length := len(s)
    
    // hell
    s = s[0:4]
}
```

## javascript
### vector 
```js 
const vec = [];

// [10]
vec.push(10);
// [10,20]
vec.push(20);
// [30, 10, 20]
vec.unshift(30);

// [30, 10]
vec.pop();

// [10]
vec.shift();

vec.forEach(it => console.log(it));
vec.map(it => it + 10);

if (vec.length) {
    console.log("vec is not empty");
}

vec.length = 0;
```

### map 
```js 
const m = new Map();

m.set("hello", 10);

const val = m.get("hello");

if (m.has("hello")) {
    console.log("yes")
}

m.delete("hello");

m.set("hello", 100);
m.set("world", 20);

for(const key of m.keys()) console.log(key)

for(const value of m.values()) console.log(value)

for(const [key, value] of m.entries()) console.log(key, value)
for(const [key, value] of m) console.log(key, value)

if (m.size > 0) {
    console.log("map is not empty")
}

m.clear();
```

### set 
```js 
const set = new Set()

set.add(10)
set.delete(10)

if (set.size) {
    console.log("set is not empty")
}

set.add(20)

if (set.has(20)) {

}

for(const value of m) console.log(value)

m.clear();
```

### string
```js 
let s = "hello world"

s.startsWith("hell")
s.endsWith("rld")
s.length 
s.forEach(c => console.log(c))
s.trim()
s.trimStart()
s.trimEnd()
s = `${s}, hello Peter`
s.includes("Peter")
s.split(",")
s.match(/helo/)
s.replace("h", "t")
s.replaceAll("h", "t")
s.slice(1, 4)
```

## rust 
### vector 
```rust 
fn main() {
    let mut list: Vec<i32> = Vec::new();

    list.push(1);

    list.insert(1, 2);

    list.first().map(|v| { println!("{}", v) });

    list.pop().map(|v| { println!("{}", v) });

    list.iter().for_each(|v| println!("value: {v}"));

    list.iter().enumerate().for_each(|(index, v)| println!("value: {v}"));

    list.clear();

    let list = vec![1,2,3,4];
    let list = Vec::from([1,2,3,4]);
}
```

### map 
```rust 
use std::collections::HashMap;

fn main() {
    let mut map: HashMap<&str, i32> = HashMap::new();

    map.insert("hello", 12);

    if map.contains_key("hello") {
        println!("yes");
    }

    map.get("hello").map(|v| println!("value: {v}"));

    map.get_key_value("hello").map(|(key, value)| println!("key:{key}, value:{value}"));

    map.get_mut("hello").map(|v_ref| *v_ref = 120);

    map.keys().for_each(|k| println!("key: {k}"));

    map.values().for_each(|v| println!("value: {v}"));

    map.remove("hello");

    map.clear();

    let map = HashMap::from([
        ("hello", 1),
        ("world", 2)
    ]);
}
```

### set 
```rust 
use std::collections::HashSet;

fn main() {
    let mut set = HashSet::from([1,2,3]);

    if set.contains(&1) {
        println!("yes");
    }

    set.insert(2);

    set.remove(&2);

    set.iter().for_each(|v| println!("{v}"));
    
    set.clear();
}
```

### string
```rust 

fn main() {
    let mut s = String::from("hello world");

    s.push('1');

    s.push_str("yes");

    if s.contains("hello") {
        println!("yes");
    }

    if s.starts_with("hello") {
        println!("yes");
    }

    if s.ends_with("ld") {
        println!("yes");
    }

    s.pop().map(|c| println!("{c}"));

    s.find(char::is_whitespace).map(|byte_offset| println!("{byte_offset}"));

    s.clear();
}
```

## swift
### vector 
```swift 
var vector = [10, 20]
vector.append(30)

vector.insert(40, at: 0)

vector.popLast()

vector.removeFirst()
vector.removeLast()

vector.remove(at: 0)

vector.count
vector.isEmpty
vector.capacity
vector.startIndex
vector.endIndex
vector.first 
vector.last

vector.firstIndex(of: 20)
vector.lastIndex(of: 10)

vector.forEach() { val in
    print(val)
}

let v = vector.map() { val in
    return val + 1
}.filter() { val in
    return val > 20
}.reduce(0) { partialResult, val in partialResult + val }
print(v)

vector.enumerated().forEach() { val in
    print(val.offset)
    print(val.element)
}

for val in vector {
    print(val)
}

for val in vector.enumerated() {
    print(val.element)
}

for val in vector[0...vector.count - 2] {
    print(val)
}

vector.removeAll()
```
### map 


### set 

### string

## java
### vector 
```java 
import java.util.ArrayList;
import java.util.List;

ArrayList<Integer> vec = new ArrayList<>();

vec.add(10);
vec.add(20);
vec.add(30);
vec.addFirst(40);
vec.addLast(50);

vec.remove(0);
vec.removeFirst();
vec.removeLast();

vec.getFirst();
vec.getLast();
vec.get(0);

vec.isEmpty();
vec.size();
vec.contains(40);
vec.subList(0, 3);
vec.indexOf(10);
vec.lastIndexOf(20);

vec.stream().forEach((val) -> System.out.println(val));
List<Integer> mapped = vec.stream()
    .map((val) -> val + 10)
    .filter((val) -> val < 40)
    .toList();

vec.clear();
```

### map 
```java 
import java.util.HashMap;

HashMap<String, Integer> map = new HashMap<>();

map.put("hello", 1);
map.put("world", 2);
        
var v = map.getOrDefault("name", 3);
v = map.get("hello");

if (map.containsKey("hello")) {
    System.out.println("yes");
}

map.size();
map.isEmpty();

map.putIfAbsent("peter", 10);

map.forEach((key, val) -> {
    System.out.printf("%s %d\n", key, val);
});

map.values().stream().forEach(System.out::println);

map.remove("hello");
        
map.replace("world", 5);

map.clear();
```

### set 
```java 
import java.util.HashSet;

HashSet<Integer> set = new HashSet<>();

set.add(10);
set.add(20);

set.remove(10);

set.contains(20);

set.size();

set.isEmpty();

set.stream().forEach(System.out::println);

set.clear();
```

### string
```java 
String v = "hello world";

v.length();

v.chars().forEach(System.out::println);

v.startsWith("hel");

v.endsWith("ld");

v.contains("o w");

var bytes = v.getBytes();
System.out.println(bytes[0]);

v.toLowerCase();
        
v.replace("hello", "happy");

v.indexOf("world");

v.lastIndexOf("world");

v.isBlank();
v.isEmpty();

v.lines().forEach(System.out::println);

var list = v.split(" ");
```