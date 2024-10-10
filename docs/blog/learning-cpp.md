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

