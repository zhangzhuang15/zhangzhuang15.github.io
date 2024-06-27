---
title: "Rust code snippet"
page: true
aside: true
---

## Description 
记录一些实用的代码片段


## 操作文件
### stdout
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

### read file
```rust
use std::fs::File;
fn main() {
    // 8 KB buffer
    let mut buf = [0; 1024 * 8];
    let file = File::open("/etc/hosts");

    if let Ok(n_bytes) == file.read(&mut buf) {
        // 读取了 n_bytes
    };
}
```

### file Path
```rust
use std::path::Path;

fn main() {
    let filename = "README.md";
    let file = Path::new(filename);

    if file.exists() {
        println!("file {} exists", filename);
    }

    if file.is_symlink() {
        println!("file is symlink");
    }
}
```

### file meta
```rust
use std::fs;
use std::path::Path;

fn main() {
    let file = Path::new("README.md");
    if let Ok(metadata) == fs::metadata(file) {
        // 读取文件的mode信息
        let mode = metadata.mode();

        // 读取文件的gid
        let gid = metadata.gid();
    }

    // 设置文件权限
    fs::set_permissions(file, fs::Permissions::from_mode(0660));
}
```