---
title: "Start with Zig"
page: true
aside: true
---

# Start with Zig

## Resolve Error
```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch 4;
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch brk: {
        break :brk 4;
    }
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch |err| brk: {
        if (err == error.OutOfMemory) {
            break :brk 4;
        }
        break :brk 10;
    }
}
```

```zig 

pub fn main() !void {
    // program will panic if there is an error
    const v: u32 = caused_error_fn() catch unreachable;
}
```

```zig 

pub fn main() !void {
    const v: u32 = caused_error_fn() catch |err| switch(err) {
        error.FileNotFound => return,
        else => |e| { return e; },
    }
}
```