---
title: "Rust code snippet"
page: true
aside: true
---

## Description 
记录一些实用的代码片段

## 按照8进制、16进制打印整数
:::code-group
```rust [bin/8.rs]
fn main() {
    let data: u32 = 1000434234;

    println!("{:o}", data);

    // 如果只想打印8进制的最低三位
    let data = data & 0o777;
    println!("{:o}", data);
}
```
```rust [bin/16.rs]
fn main() {
    let data: u32 = 1004353545;

    println!("{:x}", data);

    // 如果只想打印16进制的最低4位
    let data = data & 0xffff;
    println!("{:x}", data);
}
```
:::

## 创建文件路径
```rust 
use std::path::PathBuf;
fn main() {
    let mut path = PathBuf::from("/Users/ZZ/project/A");

    path.push("./src/main.rs");
    path.push("../b/main.rs");

    // 打印 "/Users/ZZ/project/A/./src/main.rs/../b/main.rs"
    println!("{:?}", path);

    let path = path.canonicalize().unwrap();
    // 打印 "/Users/ZZ/project/A/src/b/main.rs"
    println!("{:?}", path);
}
```

## 新建文件
```rust 
use std::{env::current_dir, fs::File};

fn main() {
    let mut dir = current_dir().unwrap();
    dir.push("./input.txt");
    println!("create file: {dir:?}");

    let file = File::create(dir);
    match file {
        Ok(_) => {
            println!("create file successfully");
        }
        Err(_) => {}
    }
}
```

## 读取文件所有的内容
```rust 
use std::{env::current_dir, fs};

fn main() {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");

    let file = fs::read_to_string(file);
    match file {
        Ok(content) => {
            println!("file content: {}", content);
        }
        Err(_) => {}
    }
}
```

## 读取文件 
:::code-group
```rust [bin/1.rs]
use std::fs::File;

fn main() -> Result<(), std::io::Error> {
    // 用只读方式打开文件
    let file = File::open("./input.txt")?;
    let mut buffer = [0u8; 10];

    // 从文件读取数据，刚好填充 buffer
    file.read_exact(&mut buffer)?;

    // 从文件开头第5个字节开始读取数据，把数据填充到 buffer，
    // 返回从文件读取的字节数
    let has_read = file.read_at(&mut buffer, 5)?;

    // 把文件内容全部读出来，存储在字符串里
    let mut s = String::new();
    let has_read = file.read_to_string(&mut s)?;

    Ok(())
}
```

```rust [bin/2.rs]
use std::fs;

fn main() -> Result<(), std::io::Error> {
    // 用 rw+ 形式打开文件
    let file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .append(true)
        .open("./input.txt")?;

    Ok(())
}
```

```rust [bin/3.rs]
use std::fs;
use std::io::BufReader;

fn main() -> Result<(), std::io::Error> {
    let file = fs::File::open("./input.txt")?;

    // 带缓冲的reader, 它会从 file 中预先读出一部分数据存储在
    // 它的缓冲区，后续对reader执行读操作，都是从从 reader 的 
    // 缓冲区读，而不是 file，这样可以减少 read 系统调用的次数，
    // 提高性能。如果一次性读取大文件的话，它不能带来性能提升，它
    // 只适合频繁读取小量数据的场景。
    let reader = BufReader::new(file);
    let mut buf = [0u8; 100];

    reader.read(&mut buf)?;

    Ok(())
}
```
:::

## 写入文件
:::code-group
```rust [bin/1.rs]
use std::{env::current_dir, fs};

// 这种写入，会先清空文件，再写入内容

fn main() {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");

    let success = fs::write(file, "all right");
    match success {
        Ok(_) => {
            println!(r#"write "all right" to file"#);
        }
        Err(_) => {}
    }
}
```

```rust [bin/2.rs]
use std::fs;

fn main() -> Result<(), std::io::Error> {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");
    let mut file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .append(true)
        .open(file)?;

    file.write_all(b"all right")?;
    file.write_all("\nyou don't understand".as_bytes())?;
    file.write_fmt(format_args!("\nyou are right"))?;
    
    Ok(())
}
```

```rust [bin/3.rs]
use std::fs;
use std::io::BufWriter;

// 带缓冲的写入

fn main() -> Result<(), std::io::Error> {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");
    let file = fs::OpenOptions::new()
        .read(true)
        .write(true)
        .append(true)
        .open(file)?;

    let mut writer = BufWriter::new(file);

    let has_written = writer.write(b"that's right\n")?;

    writer.write_all(b"you dont mind this\n")?;

    let tom = "Tom";
    writer.write_fmt(format_args!("{tom} is right\n"))?;

    Ok(())
}
```
:::

## 获取文件的读写权限
```rust 
use std::{env::current_dir, fs, os::unix::fs::PermissionsExt};

fn main() {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");

    let success = fs::metadata(file);
    match success {
        Ok(meta_data) => {
            let permissions = meta_data.permissions();
            if permissions.readonly() {
                println!("this file is readonly");
            } else {
                let mode = permissions.mode() & 0o777;
                println!("file mode: {mode:o}");
            }
        }
        Err(_) => {}
    }
}
```

## 获取文件被创建的时间
```rust 
use std::{env::current_dir, fmt::Binary, fs, os::unix::fs::PermissionsExt};

fn main() {
    let dir = current_dir().unwrap();
    let file = dir.join("./input.txt");

    let success = fs::metadata(file);
    match success {
        Ok(meta_data) => {
            let create_time = meta_data.created().unwrap();
            println!("create at: {create_time:?}");

            // 获取文件的创建时间距离现在有多少ms
            let t = create_time.elapsed().unwrap();
            println!("created at: {}ms before now", t.as_millis());

            // 获取文件的创建时间距离UTC开始时间有多少ms
            let t = create_time.duration_since(SystemTime::UNIX_EPOCH).unwrap();
            println!(
                "created at: {}ms after 1970-01-01 00:00:00 UTC",
                t.as_millis()
            );
        }
        Err(_) => {}
    }
}
```

## 判断文件类型 
:::code-group
```rust [bin/1.rs]
use std::path::Path;

fn main() {
    let path = Path::new("./input.txt");

    if path.is_dir() {
        println!("this is a directory");
    }
}
```

```rust [bin/2.rs]
use std::fs;

fn main() {
    let meta = fs::metadata("./input.txt").unwrap();

    if meta.is_file() {
        println!("this is a file");
    }
}
```
```rust [bin/3.rs]
use std::fs::File;

fn main() {
    let file = File::open("./input.txt").unwrap();

    let meta = file.metadata().unwrap();
    if meta.is_file() {
        println!("this is a file");
    }
}
```
:::

## 新建文件夹
```rust 
use std::{env::current_dir, fs};

fn main() {
    let dir = current_dir().unwrap();
    let dir = dir.join("./hello");
    println!("create directory: {dir:?}");

    let success = fs::create_dir(dir);
    match success {
        Ok(_) => {
            println!("create directory successfully");
        }
        Err(_) => {}
    }
}
```

## 重命名文件夹或者文件
```rust 
use std::{env::current_dir, fs};

fn main() {
    let dir = current_dir().unwrap();
    let dir = dir.join("./hello");

    let success = fs::rename(&dir, dir.clone().join("../hello_2"));
    match success {
        Ok(_) => {
            println!("change directory successfully");
        }
        Err(_) => {}
    }
}
```

## 遍历文件夹
```rust 
use std::{env::current_dir, fs};

fn main() {
    let dir = current_dir().unwrap();
    let dir = dir.join("./examples");

    let success = fs::read_dir(dir);
    match success {
        Ok(dir) => {
            dir.filter(|entry| entry.is_ok()).for_each(|entry| {
                let entry = entry.unwrap();
                println!("filename: {:?}", entry.file_name());
                println!("path: {:?}", entry.path());

                let file_type = entry.file_type().unwrap();
                if file_type.is_file() {
                    println!("this is a regular file");
                } else if file_type.is_dir() {
                    println!("this is a directory");
                } else if file_type.is_symlink() {
                    println!("this is a symlink");
                } else {
                    println!("this is a file")
                }

                // 或者用这种方式判断文件类型
                let path = entry.path();
                if path.is_file() {
                    println!("this is a regular file");
                } else if path.is_dir() {
                    println!("this is a directory");
                } else if path.is_symlink() {
                    println!("this is a symlink");
                } else {
                    println!("this is a file");
                }
            });
        }
        Err(_) => {}
    }

}
```

## stdout
```rust
use std::io;
fn main() {
    let stdout = io::stdout();
    let mut writer = stdout.lock();
    
    let name = "Peter";
    write!(writer, "{} hello", name);

    writer.write_all(&[b'M', b'-', b'^', b'?']);

    writer.flush();
}
```

## 开启子进程
```rust 
fn main() {
    let mut command = std::process::Command::new("echo");
    command.args(["hello", "world"]);
    command.stdout(std::process::Stdio::piped());

    let mut child = command.spawn().unwrap();

    child.wait();

    let mut output = child.stdout.take().unwrap();
    let mut buffer = String::new();
    output.read_to_string(&mut buffer);
    println!("{}", buffer);
}
```

## 获取进程号
```rust 
fn main() {
    let pid = std::process::id();
}
```

## 睡眠200ms
```rust 
use std::time::Duration;
fn main() {
    std::thread::sleep(Duration::from_millis(200));
    println!("sleep 200ms");
}
```

## 开启线程
```rust 
use std::sync::{Arc, RwLock};
fn main() {
    let s = Arc::new(RwLock::new(String::new()));

    let arc1 = s.clone();
    let handle_one = std::thread::spawn(move || {
        println!("all right");
        let mut r = arc1.write().unwrap();
        r.push_str("hello");
    });

    let arc2 = s.clone();
    let handle_two = std::thread::spawn(move || {
        println!("what fuck?");
        std::thread::sleep(Duration::from_millis(500));
        let r = arc2.read().unwrap();
        println!("result: {}", r);
    });

    handle_two.join().unwrap();
}
```

:::tip <TipIcon />
多次执行上述代码，可能先打印“all right”，也可能先打印“what fuck?”

同一个资源，想在多个线程访问，必须要使用 `Arc` 指针；

想对同一个资源进行写操作，必须要使用锁去保护资源，这里使用的是读写锁；

为什么是Arc里套一个锁，而不是锁套着一个Arc呢？很简单，锁使用来锁住资源的，而不是Arc。
:::

