---
title: "接触cpp"
page: true
aside: true
---

# 接触cpp

## 模版
:::code-group
```cpp [type_trait.cpp]
// 展示类型提取


#include <iostream>

template <typename T>
class MM {
    // 从一个类型T中提取出里面定义的类型；
    // 这太神奇了；
    typedef typename T::value_type value_type;
    
    private:
      value_type val;
    
    public:
      MM(value_type val): val(val) {}

      void print() {
        std::cout << val << std::endl;
      }
};

struct N {
    typedef int value_type;
};

int main() {
    MM<N> v = 20;
    v.print();
    return 0;
}
```
:::


## const 
```cpp
#include <iostream>

class M {
  private:
    int value;
    int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      std::cout << "value: " << value << std::endl;
    }
};

int main() {
  M m = {};
  m.showValue();
  return 0;
}
```

这段代码没有任何问题，但略作改动，就会有问题：
```cpp
#include <iostream>

class M {
  private:
    int value;
    int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1; // [!code ++]
      std::cout << "value: " << value << std::endl;
    }
};

int main() {
  M m = {};
  m.showValue();
  return 0;
}
```
高亮处会报错。这是因为我们用 const 修饰了函数，表示这个函数内部不会修改成员变量。显然，高亮出违反了这个约束。但是在某种情形下，我们确实要做一些改动，而这些改动我们能保证它是安全的，就可以采用如下的做法， 就不会报错了：
```cpp
#include <iostream>

class M {
  private:
    int value;
    int visit; // [!code --]
    mutable int visit; // [!code ++]

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
};

int main() {
  M m = {};
  m.showValue();
  return 0;
}
```
你要知道，CPP在默认情况下定义的内容，都是可以被修改的，如果你不想修改，就要声明 const；在 Rust 语言中，恰恰相反，默认声明一个变量，要用 let ，不可修改的，如果你想修改，必须追加 mut，即 `let mut`;

再给代码做一些扩展：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { // [!code ++]
      value += 1; // [!code ++]
      std::cout << "incr value" << std::endl; // [!code ++]
    } // [!code ++]
};

int main() {
  M m = {};
  m.showValue();
  m.incrValue(); // [!code ++]
  return 0;
}
```
No Error!

m 是可变的，自然可以使用 const 方法 showValue, 也自然可以访问非const方法incrValue。这给予我们一个原则，以可变的身份访问不可变的方法是可以的，因为它安全。只要不导致成员变量发生变化，那就是安全的一步操作。

如果改成下面，就糟糕了：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {
  M m = {}; // [!code --]
  const M m = {}; // [!code ++]
  m.showValue();
  m.incrValue(); 
  return 0;
}
```
m现在是const的，它只能访问const方法，代码里访问 incrValue 是错误的！

我们继续把代码变得恶心一点：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {
  const M m = {}; // [!code --]
  M mm = {}; // [!code ++]
  M& m = mm; // [!code ++]
  m.showValue();
  m.incrValue(); 
  return 0;
}
```
No Error!

我们创建的引用，默认也是有修改属性的，自然可以访问两个方法。

继续修改：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {
  M mm = {}; // [!code --]
  const M mm = {}; // [!code ++]
  M& m = mm; // [!code ++]
  m.showValue();
  m.incrValue(); 
  return 0;
}
```
这样做就有问题了，因为mm是const的，但m是可修改的。以可修改的方式，操作一个不可修改的数据，显然是不安全的。为了解决这个问题，就必须声明m也是const：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {
  const M mm = {}; 
  M& m = mm; // [!code --]
  const M& m = mm; // [!code ++]
  m.showValue();
  m.incrValue(); 
  return 0;
}
```
还是有问题的，m既然是const的了，就不能访问可变方法 incrValue。

我们接着改：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {
  const M mm = {}; // [!code --]
  M mm = {}; // [!code ++]
  const M& m = mm;
  m.showValue();
  m.incrValue(); 
  return 0;
}
```
m 是const的，但它可以访问 mm, 但毕竟是const的，m依旧不能访问 incrValue.

const对于引用的场景，也适用于指针的场景，指针就不在这里讨论了。另外一点，我们比较好奇，const是否会影响到函数的overload。我们把代码继续改造下：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

void deal(M& m) { // [!code ++]
  m.incrValue(); // [!code ++]
} // [!code ++]

void deal(const M& m) { // [!code ++]
  m.showValue(); // [!code ++]
} // [!code ++]

int main() {
  M mm = {}; 
  const M& m = mm; // [!code --]
  m.showValue(); // [!code --]
  m.incrValue(); // [!code --]
  deal(mm); // [!code ++]
  return 0;
}
```
在vscode编辑上述代码，可能会有飘红提示，但程序依旧可以正常编译。执行一下，发现输出内容包含“incr value”。

接着改：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

void deal(M& m) { 
  m.incrValue(); 
} 

void deal(const M& m) { 
  m.showValue();
}

int main() {
  M mm = {}; // [!code --]
  const M mm = {}; // [!code ++]
  deal(mm); 
  return 0;
}
```
这一次编译执行，结果中包含的是"value:"。果不其然，const会促成函数overload。

等一下，我们还没试试指针呢：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

void deal(M& m) { 
  m.incrValue(); 
} 

void deal(const M& m) { 
  m.showValue();
}

void deal(M* m) { // [!code ++]
  std::cout<< "M*" << std::endl; // [!code ++]
} // [!code ++]

void deal(const M* m) { // [!code ++]
  std::cout<< "const M*" << std::endl; // [!code ++]
} // [!code ++]

int main() {
  const M mm = {}; 
  M yy = {}; // [!code ++]
  deal(mm); // [!code --]
  deal(&mm); // [!code ++]
  deal(&yy); // [!code ++]
  return 0;
}
```
执行一下，你就会知道，把 const 和 指针联系起来，确实也会构成函数overload。

我知道，你还不死心，因为还没试过基本类型， 用一个新的代码看看吧：
```cpp
#include <iostream>
void deal(const int* v) {
  std::cout << "const int*" << std::endl;
}

void deal(int* v) {
  std::cout << "int*" << std::endl;
}

int main() {
  int m = 10;
  const int n = 100;
  deal(&m);
  deal(&n);
  return 0;
}
```

嗯嗯，const 和 基础类型指针组合起来，依然构成函数overload。

这样就结束了么，不！最安全的地方就是最危险的地方，我们似乎还没有直接尝试基础类型：
```cpp
#include <iostream>
void deal(const int v) {
  std::cout << "const int" << std::endl;
}

void deal(int v) {
  std::cout << "int" << std::endl;
}

int main() {
  int m = 10;
  const int n = 100;
  deal(m);
  deal(n);
  return 0;
}
```
Error! 很遗憾，这次没能构成函数overload。

再次看一眼之前的代码：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
}
```
我们禁用了拷贝构造函数，眼尖的话，你会问了：如果给出一个`M(const M& other)`的定义，会有效么？

```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) = delete;
    M(const M& other) {    // [!code ++]
      value = other.value; // [!code ++]
      visit = other.visit; // [!code ++]
    };                     // [!code ++]
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {        // [!code ++]
  const M m = {};   // [!code ++]
  M n = m;          // [!code ++]
                    // [!code ++]
  M x = {};         // [!code ++]
  M y = x;          // [!code ++]
  return 0;         // [!code ++]
}                   // [!code ++]
```
Error! 是在 `y = x` 处报的！是的，const 也构成拷贝构造函数的overload。

我们不妨再复杂些：
```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) {                       // [!code highlight]
      value = 0;                        // [!code highlight]
      visit = 0;                        // [!code highlight]
      std::cout << "M&" << std::endl;   // [!code highlight]
    };
    M(const M& other) = delete; // [!code highlight]
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {       
  const M m = {}; // [!code highlight]
  M n = m; // [!code highlight]
  return 0;
}        
```
编译不通过！

```cpp
#include <iostream>

class M {
  private:
    int value;
    mutable int visit;

  public:
    M(): value(0), visit(0) {}
    M(M& other) {
      value = 0;
      visit = 0;
      std::cout << "M&" << std::endl;
    };
    M(const M& other) = delete; // [!code --]
    void showValue() const {
      visit += 1;
      std::cout << "value: " << value << std::endl;
    }
    void incrValue() { 
      value += 1; 
      std::cout << "incr value" << std::endl; 
    } 
};

int main() {       
  const M m = {};
  M n = m;
  return 0;
}       
```
依旧编译不通过！

这说明，如果有const修饰的话，调用拷贝构造函数会严格判断入参的类型。

还想折腾么？我反正是不想了。


## 初始化的写法
```cpp
class A {
  private:
    int a;

  public:
    A(int a): a(a) {}
};

int main() {
  // 以下的写法都是等效的
  A a = 10;
  A b(10);
  A c = {10};
  A d{10};

  return 0;
}
```

也可以有这种写法，在c++17是没有错误的：
```cpp
class A {
  private:
    int a;
    int b;

  public:
    A(int a, int b): a(a), b(b) {}
}

int main() {
  A a(10, 20);
  A b = {10, 20};
  A c{10, 20};
  return 0;
}
```

也可以用这种定义方式：
```cpp
class A {
  private:
    int a;
    int b;

  public:
    A(std::initializer_list<int> list) {  // [!code highlight]
      auto iter = list.begin();           // [!code highlight]
      a = *iter;                          // [!code highlight]
      iter++;                             // [!code highlight]
      if (iter != list.end()) {           // [!code highlight]
        b = *iter;                        // [!code highlight]
      } else {                            // [!code highlight]
        b = 0;                            // [!code highlight]
      }                                   // [!code highlight]
    }                                     // [!code highlight]
}

int main() {
  // work
  A a = {10, 20}; 
  // work
  A b{10, 20};
  // error!
  A c(10, 20);  // [!code highlight]
  return 0;
}
```
> 这种方式适合定义容器类型的class, 如 list, vector 等

:::tip <TipIcon />
如果你没有写出对应的构造函数，C++编译器会默认提供 构造函数、拷贝构造函数、赋值运算符号，这个行为是把双刃剑，好处是省得你写一写代码，坏处是它背着你做了这些事情。因此，你最好还是明确给出这些构造函数的实现，不要空缺！
:::


## inherit
C++的继承方式提供了public, protected, private三种方式。

:::code-group
```cpp [public.cpp]
class Base {
  private:
    void show();

  public:
    void hello();

  protected:
    void see();
};

class Derive: public Base {
  public:
    void say();
};

// Derive 粗略等效于：
class M {
  private:
    void show();

  public:
    void hello();
    void say();

  protected:
    void see();
};
```
```cpp [protected.cpp]
class Base {
  private:
    void show();

  public:
    void hello();

  protected:
    void see();
};

class Derive: protected Base {
  public:
    void say();
};

// Derive 粗略等效于：
class M {
  private:
    void show();

  public:
    void say();

  protected:
    void hello();
    void see();
};

```

```cpp [private.cpp]
class Base {
  private:
    void show();

  public:
    void hello();

  protected:
    void see();
};

class Derive: private Base {
  public:
    void say();
};

// Derive 粗略等效于：
class M {
  private:
    void show();
    void hello();
    void see();

  public:
    void say();
};
```
:::

`A: public B` 的意思，就是 `A is B` 的意思，A继承了B的接口，代码中把所有的B替换成A的话，代码照常运行，因为二者接口兼容；

`A: private B`的意思，就是 `A is implemented in terms of B`, A没有继承B的接口，但是A继承了B的实现。此时，`A must not be B`。此时的行为，非常类似于A内部有个成员是B对象，即A中组合了B。

`A: protected B`除了它语法中的含义外，找不到上述的一些结构设计上的含义，不要使用这种继承方式。

作为对比，我们可以看看其它编程语言的表现。

Swift中直接抛弃了多继承机制，只有public继承的语义，简洁、清晰，我非常喜欢。

Java中抛弃了多继承机制，但仍保留了public/protected/private的继承方式，虽有改进，但感觉差点儿意思，我对此中立。

Go 和 Rust 采用组合的方式搞“继承”，我的最爱。

## virtual
virtual很令人困惑：
- 所有的virtual函数都必须override么？
- pure virtual 函数在定义的时候有实现么？
- 构造函数可以virtual么？
- 构造函数内调用virtual函数很危险？
- override virtual函数时，入参的默认值要和原来版本保持一致？
- virtual函数会导致class体积增加？

### 所有的virtual函数都必须override么
override表示Base类内的方法可以Derive类重写，Derive类不需要全部重写，没有重写的函数，就会复用Base类的实现。


```cpp
class Base {
  public: {
    virtual void hello() {}
  }
};

class Derive: public Base {
  public: {

  }
};
```

但是，Base 的 pure virtual 函数，Derive类型必须重写。因为 pure virtual 函数本身是没有定义的。既然Base没有定义出来，Derive类还没重写，那调用起来就会出问题。


### 构造函数可以virtual么
构造函数不可以，但是析构函数可以。

```cpp
class Base {
  public: 
     ~Base() {
      std::cout << "wow";
     }
  
};

class Derive: public Base {
  public: 
    ~Derive() {
      std::cout << "hooo";
    }
};

int main() {
  Base* p = new Derive();
  delete p;
  return 0;
}
```
output:
```txt
wow
```
我去，Derive的析构函数没有执行，内存泄漏！

纠正的方法：
```cpp
class Base {
  public: 
     ~Base() {            // [!code --]
     virtual ~Base() {    // [!code ++]
      std::cout << "wow";
     }
  
};

class Derive: public Base {
  public: 
    ~Derive() {
      std::cout << "hooo";
    }
};

int main() {
  Base* p = new Derive();
  delete p;
  return 0;
}
```

如果是三层继承呢
```cpp
class Base {
  public: 
     ~Base() {
      std::cout << "wow";
     }
  
};

class Derive: public Base {
  public: 
    ~Derive() {
      std::cout << "hooo";
    }
};

class C: public Derive {
  public:
  ~C() {
    std::cout << "ohhh";
  }
};

int main() {
  Derive* p = new C();
  delete p;
  return 0;
}
```
output:
```txt
hooowow
```
C的析构函数没有执行。如果给Derive的析构函数加入virtual修饰，确实可以解决这个问题,但在加入之后，如果改为`Base* p = new C()`，那么Derive和C的析构函数依旧不会执行。因此，最佳的方式，是给 Base 的析构函数加入 virtual

### override virtual函数时，入参的默认值要和原来版本保持一致
是的。

Derive在重写Base的方法时，方法的入参列表要和Base保持一致，但是默认值要不要一致，并没有严格规定，但是，你还是要保持一致。不然就会有下面代码的问题。

```cpp
class Base {
  public: 
    virtual void hello(int m = 4) {
      std::cout << "hello";
      std::cout << m;
    }
  
};

class Derive: public Base {
  public: 
    void hello(int m = 2) override {
      std::cout << "world" << std::endl;
      std::cout << m;
    };
  
};

int main() {
  Derive d;
  Base* p = &d;
  p->hello();
  return 0;
}
```
output:
```txt
world
4
```

太可怕了！

调用的是Derive定义的hello, 默认参数传的是Base的


## 与现代编程特性接轨
### std::tuple 

```cpp{6}
#include <tuple>
#include <iostream>

int main() {
  std::tuple<int, float> p = { 10, 8.9f };
  auto [a, b] = p;            
  std::cout << a << std::endl;

  auto m = std::make_tuple(10, 9.90f);
  auto [c, d] = m;
  std::cout << c << std::endl;
  return 0;
}
```
js的解构？

### std::pair 
```cpp 
#include <iostream>
#include <utility>

int main() {
    std::pair<int, float> p = {10, 4.02f};
    auto [a, b] = p;
    std::cout << a << std::endl;
    std::cout << p.second << std::endl;

    auto pp = std::make_pair("hello", 100);
    std::cout << pp.first << std::endl;
    return 0;
}
```

### for iterator
```cpp 
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<std::string, int> map;
    map["hello"] = 10;
    map["world"] = 20;
    
    for(auto item:map) {
      std::cout << item.first << std::endl;
      std::cout << item.second << std::endl;
    }

    for(auto [key, value]:map) {
      std::cout << key << std::endl;
      std::cout << value << std::endl;
    }
    return 0;
}
```

### std::optional
```cpp 
#include <iostream>
#include <optional>
#include <utility>

int main() {
    auto val = std::make_optional(10);
    auto r = val.value_or(10);
    std::cout << r << std::endl;

    if (val.has_value()) {
      std::cout << "have value" << std::endl;
    }

    val.reset();
    if (!val) {
      std::cout << "dont have value" << std::endl;
    }
    
    return 0;
}
```

### std::async
```cpp 
#include <chrono>
#include <future>
#include <iostream>
#include <thread>


int hello() {
  std::cout << "child thread: " << std::this_thread::get_id() << std::endl;
  std::this_thread::sleep_for(std::chrono::seconds(3));
  return 10;
}
int main() {
    std::cout << "main thread: " << std::this_thread::get_id() << std::endl;
    auto p = std::async(hello);
    auto m = std::async(hello);

    // 阻塞并获取结果
    auto result = p.get();
    std::cout << result << std::endl;

    m.wait();
    return 0;
}
```

与 nodejs， rust tokio 不同，cpp的async底层是多线程，而不是多路复用和协程。

### std::promise
```cpp 

#include <future>
#include <thread>
#include <iostream>
void hello(std::promise<std::string>& promise) {
    std::this_thread::sleep_for(std::chrono::seconds(2));
    // 相当于 nodejs 中的 promise.resolve()
    promise.set_value_at_thread_exit("why not");
    return;
}
int main() {
    std::promise<std::string> promise;

    // 1. 用lambda创建线程的
    // std::thread p([&]() {
    //     hello(promise);
    //     return;
    // });

    // 2. 用bind创建线程
    auto binded_fn = std::bind(hello, std::ref(promise));
    std::thread p(binded_fn);

    // 3. 用常规方法创线线程，但要注意，如果线程入口函数的参数是引用的话，
    //    需要使用 std::ref
    // std::thread p(hello, std::ref(promise));
    
    std::cout << "main thread " << std::endl;

    // promise 负责写入数据，future负责读取数据，而在
    // nodejs 中，二者都由 promise 完成；
    auto future = promise.get_future();
    auto result = future.get();
    std::cout << result << std::endl;
   
    // 为了收集子线程的资源，否则会有libc++abi的报错
    p.join();
    return 0;
}
```

### module
C++20支持Module，代码编写单元是Module，不再是 `.h` + `.cpp` 的组合。

`.h`有着缺陷：
1. 拖慢编译速度
2. 符号污染
3. 重复声明

在开始介绍如何使用之前，请确保c++编译器支持C++20标准。我这里以macOS平台的Clang为例，Clang版本号是19.1.5, 安装方法是 `brew install llvm`。虽然Clang官网文档里说，Clang15已经支持C++20 module的很多特性，但是经我实验，发现`global module` `module partition` 支持的有问题。

:::code-group
```cpp [src/util/util.cppm]
export module util;
export import :math;
export import :console;
```

```cpp [src/util/console.cppm]
module;
#include <string>
export module util:console;

export namespace util {
 void error_toast(std::string s);
}
```

```cpp [src/util/console.cpp]
module;
#include <iostream>
#include <string>
module util:console;

namespace util {
void error_toast(std::string s) {
    std::cout << "error: " << s << std::endl;
}
}
```

```cpp [src/util/math.cppm]
export module util:math;

namespace util {
int add(int a, int b);
}
```

```cpp [src/util/math.cpp]
module util:math;

namespace util {
int add(int a, int b) {
    return a + b;
}
}
```

```cpp [src/main.cpp]
import util;

int main() {
    util::error_toast("help me");
    return 0;
}
```

```makefile [src/makefile]
CC = /opt/homebrew/opt/llvm/bin/clang++
Flags = -std=c++20


version:
	$(CC) --version 

clear:
	rm -f *.o
	rm -f *.pcm
	rm -rf util/*.o

build-util:
	$(CC) $(Flags) --precompile util/console.cppm -o util-console.pcm 
	$(CC) $(Flags) -c util/console.cpp -fmodule-file=util:console=util-console.pcm  -o util.console.impl.o
	$(CC) $(Flags) --precompile util/math.cppm -o util-math.pcm 
	$(CC) $(Flags) -c util/math.cpp -fmodule-file=util:math=util-math.pcm -o util.math.impl.o 
	$(CC) $(Flags) --precompile util/util.cppm -fmodule-file=util:console=util-console.pcm \
	-fmodule-file=util:math=util-math.pcm -o util.pcm
	
build: build-util
	$(CC) $(Flags) -c main.cpp -fmodule-file=util=util.pcm  \
	-fmodule-file=util:console=util-console.pcm \
	-fmodule-file=util:math=util-math.pcm \
	-o main.o
	$(CC) $(Flags) main.o util.console.impl.o  util.math.impl.o \
	-o main

run: clear build
	@./main 
	make clear

.PHONY: clear build-util build run version
```
:::

编译：
```shell 
make build
```

运行：
```shell 
./main
```

`.cppm`就是采取模块化的cpp文件扩展名，一般来讲，我们只在这个文件里编写函数、类、结构体等等声明，但是也能给出实现。考虑到扩展，不建议在`.cppm`中给出实现。而`.cppm`里的声明，我们放在`.cpp`里实现。

你可以看到，`src/util/console.cppm`里写的是声明，`src/util/console.cpp`是模块的实现。二者的区别在于，声明的一方，用 `export module` 交代模块名；实现的一方没有`export`。无论是哪一个，如果想要引入`.h`，必须放在`module;`后边， 本模块名的前边（`export module util:console`, `module util:console`）.

`util:console`令你很奇怪吧？这个就是`module partition`, 标识它是 `module util`的一部分，因此你在 `src/util/util.cppm` 里看到 `export import :console;`，意思就是把 `util:console`声明的东西引入进来，并且暴露出去，供上层调用。

module最麻烦的地方就是编译逻辑。你可以这样理解，`.cppm`要编译为`.pcm`，这个`.pcm`的作用是：
1. 在编译`.cpp`的时候，遇到`import <module_name>`了，告诉编译器到哪里找到`<module_name>`的符号信息
2. 在编译另外一个`.cppm`的时候，遇到`import <module_name>`了，告诉编译器到哪里找到`<module_name>`的符号信息

所以，你看到了，在编译`util.cppm`的时候，我们用到了`util-console.pcm`和`util-math.pcm`。在编译`main.cpp`的时候，我们用到了`util.pcm`,`util-console.pcm`和`util-math.pcm`。

但最终，是`.o`文件编译为最终的可执行文件，和`.pcm`无关了。值得注意的是，如果`.cppm`你不仅声明了，还给出定义了，你除了将这个文件编译为`.pcm`，还要编译为`.o`，毕竟你给出了实现。

`util-console.pcm`的名字是有讲究的，对于声明了`export module A`的`.cppm`文件，我们编译的结果应命名为`A.pcm`，对于声明了`export module A:B`的`.cppm`文件，我们编译的结果应命名为`A-B.pcm`。

更详细的指引，请看[Clang 15.0.0 | Standard C++ Modules](https://releases.llvm.org/15.0.0/tools/clang/docs/StandardCPlusPlusModules.html#quick-start)


## lvalue, rvalue and movable semantic
lvalue: 有明确内存地址的数据；

rvalue: 没有明确内存地址的数据，比如临时数据，字面量；

```cpp 
int main() {
  int a = 10;
  std::string s = "hello";

  // a，s 就是左值， 10 和 "hello" 就是右值
}

```

## 与c兼容——c语言的宏
```c  
#define Map(xx) xx(Peter)
#define Peter 100

int main() {
  #define xx(a) hello_#a = #a;
  int Map(xx)
  #undef xx
  return 0;
}
```
等效于：
```c  

int main() {
  int hello_Peter = 100;
  return 0;
}
```


<Giscus />