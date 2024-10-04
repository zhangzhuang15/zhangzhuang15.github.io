---
title: "C++和Rust在值拷贝方面的一些思考"
page: true
aside: true
---


对于原始值，Rust直接采取拷贝，这一点，C++也一样。但是，在自定义的值方面，二者还不太一样。这里，C++中自定义的值，我们说的就是class；Rust里说的就是struct。 

C++的struct和C一样，一旦赋值，就是按位直接拷贝的。
```cpp
struct M {
    int a;
    char* b;
}

int main() {
    char[] hello = {'h', 'e', 'l', 'l', 'o'};
    struct M m = {10, hello };
    // n 开辟了一个新的内存区域，从 m 中把所有的元素(a, b)直接拷贝过去了
    struct M n = m;
}
```

Rust里的struct牵扯到所有权的问题，并不是单纯的拷贝。默认情况下，Rust是所有权转移，而没有拷贝。
```rs
struct M {
    a: u8,
    b: u32,
}

fn main() {
    let m = M { a: 10, b: 32 };
    // m 的所有权转移给了 n, m不能再访问了
    let n = m;
}
```
不过，这里**依旧发生了拷贝**。n的地址和m的地址是不一样的，这与C++的struct表现一致，区别在于，Rust在编译期做所有权检查，禁止你访问m，如果你使用unsafe代码，依旧可以发现，即便所有权转移了，m的值依旧存在。

如果你想让n拷贝m, m依旧可以访问，你就需要在Rust里实现M的`Clone` trait。这一点，和C++的`拷贝构造函数`没有什么两样。但是，Rust高明的地方在于，默认禁止掉拷贝构造函数，程序员如果需要的话，就主动实现，这样所有的行为都在程序员的掌握之下，而不是编译器背着程序员做些“不可告人”的东东。而C++编译器默认会给出拷贝构造函数的，也就是说，你明明没有给出拷贝构造函数的代码，可你的代码里依旧活跃着拷贝构造函数。这很气人，简直就是沉默的地雷。

所有权发生转移，依旧会出现拷贝的行为，感觉还是有点不爽，因为你会担心如果拷贝的数据比较大，是不是就拖累了性能呢？是的，不过担心有点多余。对于比较大的数据，我们会存储在堆上，然后结构体持有这个堆的指针。结构体发生拷贝的时候，只是堆的指针发生拷贝，而堆本身没有发生拷贝。因此，Rust这样去处理所有权转移，虽有瑕疵，但是没什么太大的毛病。

这种所有权转移，依旧出现拷贝的行为，其实和C++里的`移动构造函数`没什么两样。区别在于，Rust可以保证失去所有权（在C++的角度看，就是被移动的class）的一方不会被访问，避免了空指针的问题，而C++并没有做出这样的保证，要依赖程序员的自觉。


那么，有没有一种方式，在所有权发生转移的时候，不会出现拷贝的行为呢? 在Rust里，没有这样的方式；在C++里，可以通过`引用`实现：
```cpp
class M {
    int a;

    public:
      M(int a): a(a) {}
      M(M& other) = delete;
}

M& createIns() {
    M m = { 10 };
    return m;
} 

int main() {
    M& m = createIns();
}
```

说到这里，顺便提一个移动构造函数的问题：
```cpp
#include <initializer_list>
class M {
    int a;

    public:
      M(int a): a(a) {}
      M(std::initializer_list<int> list) {
        auto it = list.begin();
        this->a = *it;
      }
      M(M& other) = delete;
      M(M&& other) {
        this->a = other.a;
      }

      show() {
        std::cout << this->a << std::endl;
      }
}

M& createInsL() {
    M m = { 10 };
    return m;
}

M&& createInsR() {
    M m = { 10 };
    return std::move(m);
}


M createIns() {
    M m = { 10 };
    return m;
}

int main() {
    // 移动构造函数没有调用
    M& a = createInsL();
    a.show();

    // 表现和 a 一样；
    // 移动构造函数没有调用
    M&& b = createInsR();
    b.show();

    // 调用了移动构造函数，但是移动构造函数里
    // 的参数 other 比较危险，因为 other.a != 10，
    // 不符合预期，取决于编译器的行为
    M c = createInsR();
    c.show();

    // 调用了移动构造函数
    M d = createIns();
    d.show();

    return 0;
}
```

不用我多说了，你自然感觉到C++是天使与恶魔的结合体。

Good：灵活度高，各种玩法尽在你手，一切由你掌握。

Bad: 玩砸了那就是你自找的，你必须把自己锻炼成一个人肉编译器，处处小心，精心设计。

所以， Rust makes programmer stupid, but it's better!

> C++这门语言是一门Magic的语言，对于程序员来说，我们似乎永远摸不清楚这门语言背着我们在干了什么。需要熟悉这门语言，我们就必需要了解C++里面的那些东西，需要去了解C++中那些危险的东西。不然，这是一种搬起石头砸自己脚的编程语言。
> -- 左耳听风



