---
title: "接触cpp"
page: true
aside: true
---

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

<Giscus />