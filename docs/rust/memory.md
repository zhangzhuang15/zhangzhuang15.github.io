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
使用`Box`将数据存储在堆内存，然后使用 `Box::leak`，让`Box`不在管理这块儿内存，并返回堆内存中的数据的借用；

这块儿堆内存需要我们自己管理，不再受Rust所有权系统管理；

如果想释放内存，可以使用`Box::from_raw`，这块内存从新交给
`Box`，然后Rust所有权系统就能管理内存，负责自动释放了。


## ManuallyDrop

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

## ptr
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
### mem::swap
### mem::forget



## cell 
### Cell 


### RefCell

### OnceCell

## Unique


## NonNull

## MaybeUninit

## `*const` 和 `*mut` 
不像`&T` 和 `&mut T`，`*const T` 和 `*mut T` 可以利用 `as`强制相互转化；