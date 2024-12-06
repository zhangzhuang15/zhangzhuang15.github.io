---
title: "Rust的内存操作"
page: true
aside: true
---

## Description
记录Rust内存操作的一些技巧

使用Rust的时候，因为所有权系统的完备，我们不需要自己管理内存。但是，在使用 unsafe Rust 编写一些基础库的时候，我们
仍需要懂得手动管理内存。

## Box::leak
`Box`用于开辟堆内存，并管理这块内存；

你可以使用leak，让`Box`放弃对内存的管理，改由你自己管理：
```rust 
fn main() {
    struct M {
        value: u8,
    }
    impl Drop for M {
        fn drop(&mut self) {
            println!("dropping");
        }
    }

    {
        let m = Box::new(M{value: 10});
        // 离开这块作用域，会打印 dropping
    }

    {
        let m = Box::new(M{value: 10});

        // 自此，你要自己管理好 M{value: 10}所在的内存
        let n = Box::leak(m);
        // 离开这块作用域，不会打印 dropping
    }
}
```

你也可以把leak的资源, 再交给`Box`管理：
```rust 
fn main() {
    struct M {
        value: u8,
    }
    impl Drop for M {
        fn drop(&mut self) {
            println!("dropping");
        }
    }

    {
        let m = Box::new(M{value: 10});

        // 自此，你要自己管理好 M{value: 10}所在的内存
        let n = Box::leak(m);
        // 离开这块作用域，不会打印 dropping
    }

    {
        let m = Box::new(M{value: 10});

        // 自此，你要自己管理好 M{value: 10}所在的内存
        let n = Box::leak(m);
        // 不用再自己管理内存了，新的 Box 会帮你管理
        let m = Box::from_raw(n as *mut M);
        // 离开这块作用域，会打印 dropping
    }

    {
        let m = Box::new(M{value: 10});

        // 自此，你要自己管理好 M{value: 10}所在的内存,
        // 与 leak 不同的是，into_raw 返回的是 *mut M
        let n = Box::into_raw(m);
        // 不用再自己管理内存了，新的 Box 会帮你管理
        let m = Box::from_raw(n);
        // 离开这块作用域，会打印 dropping
    }
}
```

## ManuallyDrop

ManuallyDrop 可以禁止 compiler 自动调用数据的 drop:
```rust 
fn main() {
    struct Data;
    impl Drop for Data {
        fn drop(&mut self) {
            println!("dropping");
        }
    }

    {
        let m = Data;
        // 会输出 “dropping”
    }

    {
        let n = ManuallyDrop::new(Data);
        // 不会输出 “dropping”
    }
}
```

你也可以恢复compiler自动调用数据drop的能力:
```rust 
fn main() {
    struct Data;
    impl Drop for Data {
        fn drop(&mut self) {
            println!("dropping");
        }
    }

    {
        let m = Data;
        // 会输出 “dropping”
    }

    {
        let n = ManuallyDrop::new(Data);
        // 不会输出 “dropping”
    }

    { // [!code ++]
        let m = ManuallyDrop::new(Data); // [!code ++]
        println!("1"); // [!code ++]
        let n = ManuallyDrop::into_inner(m); // [!code ++]
        println!("2"); // [!code ++]

        // 会打印出：
        // 1
        // 2
        // dropping

    } // [!code ++]
}

```

## ptr
ptr 提供了很多方法，让你通过 raw pointer 手动管理内存。

### ptr::read
```rust 
fn main() {
    unsafe {
        let m = String::from("right");

        // n 也是 String 类型，而且 n 底层的内存
        // 地址和m一样；
        // 换句话讲，m 和 n 共享一块儿内存，m 和 n 
        // 对这块儿内存都有所有权；
        // 离开作用域后，n 会对内存做一次 drop，m 
        // 又会对内存做一次drop
        let mut n = ptr::read(&m);

        // 重新赋值n，也会触发 drop
        n = String::from("wrong");
    }
}
```
### ptr::write 
```rust 
fn main() {
    let mut m = String::from("right");

    unsafe {
        // 相当于将 "left" 移动到了 m 中，不会触发
        // m 执行 drop
        ptr::write(&mut m, String::from("left"));
    }
}
```

## mem 
### mem:replace
在不变更所有权的情况下，将内存中的数据进行替换

```rust 
fn main() {
    struct Data {
        value: u16,
    }

    let m = Data { value: 15 };

    let n = &m as *const Data as *mut Data;

    // &mut *n 会发生错误
    let oldValue = mem::replace(unsafe {&mut *n}, 20);
}
```

```rust 
fn main() {
    struct Data {
        value: u16,
    }

    let m = Data { value: 15 };

    let n = &m.value as *const u16 as *mut u16 as usize;

    // 这样就可以了
    let oldValue = mem::replace(unsafe {&mut *(n as *mut u16)}, 20);

    println!("old: {}, new: {}", oldValue, m.value);

    // output:
    // old: 15, new: 20
}
```

利用 `mem::replace`，你可以实现没有 `mut` 修饰下的值改写操作

### mem::swap 
将两个相同数据类型的内存区域交换

```rust 
fn main() {
    struct Data {
        value: u16,
    }

    let m = Data { value: 15 };
    let k = &m.value as *const u16 as *mut u16 as usize;
    let mut n: u16 = 100;

    mem::swap(unsafe {&mut *(k as *mut u16)}, &mut n);

    println!("m: {}, n: {}", m.value, n);

    // output:
    // m: 100, n: 15
}
```

### mem::forget
当你不想让Rust所有权帮你管理内存时，你就可以使用`mem::forget`

before forget:
```rust 
fn main() {
    struct Data;

    impl Drop for Data {
        fn drop(&mut self) {
            println!("dropping Data");
        }
    }

    struct Value {
        value: Data,
    }

    impl Drop for Value {
        fn drop(&mut self) {
            println!("dropping Value");
        }
    }

    let m = Value { value: Data };
}

// output:
// dropping Value
// dropping Data
```

forget:
```rust
fn main() {
    struct Data;

    impl Drop for Data {
        fn drop(&mut self) {
            println!("dropping Data");
        }
    }

    struct Value {
        value: Data,
    }

    impl Drop for Value {
        fn drop(&mut self) {
            println!("dropping Value");
        }
    }

    let m = Value { value: Data };
    mem::forget(m);
}

// 没有任何输出
```

`mem::forget(m)` 剥夺 m 的所有权，因此在Rust所有权系统里，无法通过追踪
m 来自动执行drop，你必须自己去负责执行drop，可能你需要主动调用 `mem::drop()`
或者使用 raw pointer 去释放内存。


### mem::transmute
涉及到一些底层的数据类型转化时，无法使用`as`这种方式搞定，就需要使用这个函数，你可以把这个函数类比为 cpp 的`reinterpret_cast`。在使用这个方法的时候，使用不当，就会带来 UB(undefined behaviour), 要格外小心。下面，给出几个使用场景。

```rust 
struct Foo {
    a: u8,
    b: u8,
}

struct Bar {
    x: u16,
}

fn main() {
    let foo = Foo { a: 1, b: 2 };
    let bar: Bar = unsafe { std::mem::transmute(foo) };
    println!("{}", bar.x);
}
```

```rust 
union MyUnion {
    f1: u8,
    f2: i8,
}

fn main() {
    let u = MyUnion { f2: -1 };
    let f: u8 = unsafe { std::mem::transmute(u.f2) };
    println!("{}", f);
}

// 你也可以这么写
// fn main() {
//     let u = MyUnion { f2: -1 };
//     println!("{}", unsafe{u.f1});
// }
```

指针到usize的转化，不要使用 `mem::transmute`, 要这样写:
```rust 
fn main() {
    let a: i32 = 12;
    let ptr = &i32 as *const i32 as usize;
}
```

使用 `mem::transmute`将其中一个类型解释为另外一个类型，一定要保证两种类型的内存布局兼容，内存大小相等。


## cell 
### Cell 
在rust中：
```rust 
fn main() {
    struct Data {
        value: i32,
    }

    let m = Data { value: 10 };

    // 不可以
    m.value = 11;

    // 不可以
    m = Data { value: 9 };

    let mut m = Data { value: 10 };
 
    // 可以
    m.value = 11;

    // 可以
    m = Data { value: 9 };
}
```

利用`Cell`，可以在不声明`mut`的情况下，修改 value ：
```rust 
fn main() {
    struct Data {
        value: Cell<i32>,
    }

    let m = Data { value: Cell::new(10) };

    // 内部使用 mem::replace 实现改值
    m.value.set(11);
}
```

### RefCell
利用`RefCell`，也可以实现在不声明`mut`的情况下，修改 value:
```rust 
fn main() {
    struct Data {
        value: u16,
    }

    let m = Data { value: 10 };
    let m = RefCell::new(m);

    // 接下来要修改 value 了
    
    let mut r = m.borrow_mut();
    (*r).value = 15;

    // 虽然修改的时候，没有对 m 施加 mut 修饰，
    // 但是 r 必须施加 mut
}

```

### OnceCell
如果你想实现对某个内存只做一次写入，那么 `OnceCell` 就可以派上用场了；

```rust 
fn main() {
    let once = OnceCell::<u16>::new();
    
    // 写入成功
    once.set(10);

    match once.set(100) {
        Ok(()) => println!("写入成功"),
        Err(value) => {
            // 一定会执行这里
            if value === 100 {
                println!("写入失败，因为已经写入过了");
            }
        },
    };

}
```

## Unique


## NonNull
直接使用 raw pointer 可能会出错，使用 `NonNull` 帮助你管理 raw pointer, 防止使用过程中，raw pointer变成一个悬空指针；它还可以实现 raw pointer 到 `&T` `&mut T` 的转化；NonNull不会拥有资源的所有权；

```rust 
fn main() {
    let m = String::from("right");

    let ptr = NonNull::from(&m);

    // *mut String
    let t = m.as_ptr();
}
```

## MaybeUninit
在C语言中，会有定义变量，但没有对变量赋值的写法，`int a;`

在 Rust 中可以使用 `MaybeUninit`实现：
```rust 
fn main() {
    struct Man {
        value: u16,
    }

    // 类比C语言的 Man m;
    let mut m = MaybeUninit::<Man>::uninit();

    // 类比C语言的 m = Man { 10 };
    m.write(Man { value: 10 });

    let p = unsafe { m.assume_init() };
    println!("{}", p.value);

    // output:
    // 10
}
```

## `*const` 和 `*mut` 
不像`&T` 和 `&mut T`，`*const T` 和 `*mut T` 可以利用 `as`强制相互转化；

```rust 
fn main() {
    let m = String::from("right");

    let n = &m as *const String as *mut String;
  
    // 可以的
    let p = &*n;

    // 不可以
    let k = &mut *n;
}
```

```rust 
fn main() {
    struct K<T> {
        value: *const T,
    }

    impl<T> K<T> {
        fn as_ptr(&self) -> *mut T {
            self.value as *mut T
        }
    }

    let m = String::from("right");
    let n = &m as *const String as *mut String;
    let k = K { value: n };

    // 可以的
    let p = unsafe { &mut *k.as_ptr() };

    // 不可以的！
    let p = unsafe { &mut *n };
}

```