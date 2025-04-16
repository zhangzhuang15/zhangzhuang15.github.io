---
title: "System Program with C"
page: true
aside: true
---

# System Program with C
I talk about learning to write system program with c language.

## Overview
System programming with C is different from normal programming with other languages.Today, popular operating system is created by C, e.g. Windows, MacOS and Linux.As default, operating system provides wrappers of systemcalls in C language out of box. In other words, using C is considered as communicating with operating system directly, bringing your program high performance and minimist runtime.

Other languages, provide wrappers of systemcalls on their own. They might wrap systemcalls with asm, e.g. Go language. They might wrap systemcalls based on C library. They give you more human-friendly way to write program, but it's not direct, simple and performant. You cannot communicate with operating system directy, and have to burden unignored runtime.

Of course, you can write system program in C++ or Rust languages. It seems to be more friendly, readable than C. But it's still important to know how to write system program in C.

## Header File
You should know some c header files, some of them belong to C standard and some of them belong to operating system, so that you can write portable c program.

Every operating system that supports using c developing software, has to implement C standard, promise that people can include c standard header files out of box.


### C Standard Library Header File
#### Input/Output
- `<stdio.h>`

#### Input/Output Extensions
- `<errno.h>`
    - Example: errno, EIO, ENOMEM
- `<fcntl.h>`,  File control options (POSIX)
    - Example: open, O_RDONLY, O_WRONLY

#### Input/Output Format
- `<inttypes.h>`, Integer types and formatting macros (C99)
    - Example: PRId32, PRIu64
- `<stdint.h>`, Fixed-width integer types (C99)
    - Example: int8_t, uint32_t, INT_MAX

#### String and Memory Manipulation
- `<string.h>`
    - Example: strlen, strcpy, strcat, memcmp, memcpy
- `<wchar.h>`, Wide character handling
    - Example: wcslen, wcscpy, wcscat
- `<wctype.h>`, Wide character classification and conversion
    - Example: iswalpha, towlower

#### Math
- `<math.h>`
    - Example: sin, cos, sqrt, pow, ceil, floor
- `<complex.h>`, Complex number arithmetic (C99)
    - Example: cabs, creal, cimag
- `<tgmath.h>`, Type-generic macros for math functions (C99)
    - Example: tgmath functions automatically select the correct type (e.g., float, double).

#### General Utilities
- `<stdlib.h>`
    - Example: malloc, free, exit, atoi, rand, qsort.
- `<stddef.h>`, Standard type definitions
    - Example: size_t, ptrdiff_t, NULL
- `<stdarg.h>`, Variable argument handling
    - Example: va_start, va_arg, va_end
- `<ctype.h>`, Character classification and conversion
    - Example: isalpha, isdigit, toupper, tolower

#### Time and Date
- `<time.h>`
    - Example: time, clock, difftime, strftime

#### Signal
- `<signal.h>`
    - Example: signal, raise, kill, SIGINT, SIGTERM

#### Localization
- `<locale.h>`, Localization utilities
    - Example: setlocale, localeconv.

#### Error Handle
- `<assert.h>`, Diagnostics and assertions
    - Example: assert

#### Atomic
- `<stdatomic.h>`, Atomic operations (C11)
    - Example: atomic_store, atomic_load

#### Misc
- `<limits.h>`, Defines implementation-specific limits.
    - Example: CHAR_MAX, INT_MAX.
- `<float.h>`, Defines floating-point limits.
    - Example: FLT_MAX, DBL_MIN.
- `<stdbool.h>`, Boolean type and values (true, false) (C99).
    - Example: bool.
- `<iso646.h>`, Alternative spellings for operators (e.g., and, or, not).
- `<stdnoreturn.h>`, Defines the _Noreturn keyword (C11).
    - Example: _Noreturn.


### System Library Header File
These header files are implemented by operating system, there might be different among operating systems. These header files provide functionalities that c standard cannot cover. Most of these functionalities wrap systemcalls or depend on systemcalls, of course, they might not use any systemcalls.

- `<sys/types.h>`
- `<sys/ioctl.h>`
- `<sys/time.h>`
- `<termios.h>`

## How to Use C Standard Library and System Library
Now you haved learned that what these header files look like. I don't tend to put a list of c functions from these header files, and introduce how to use them one by one.

I just introduce these functions based on practical background.

### Get Random Number 
```c  
#include <stdlib.h>
#include <time.h>

int main() {
    srand(time(NULL));
    int random_number_one = rand();
    int random_number_two = rand();
    return 0;
}
```
`srand` and `rand` from: `<stdlib.h>`;
`time` from: `<time.h>`

### Get Current Time


### Get User Input

### Clear Your Array 
```c  
#include <string.h>

int main() {
    int arr[100];
    memset(arr, 0, sizeof(arr));
    return 0;
}
```

### Copy Your Array 
```c  
#include <string.h>
int main() {
    int arr[5] = { 1, 2, 3, 4, 5 };
    int yrr[5];
    memcpy(yrr, arr, sizeof(arr));
    return 0;
}
```

### Extract Value from Formatted String 
```c   
#include <stdio.h>
int main() {
    char* s = "hello,20 and peter";
    int age;
    char name[10];

    int nums_parsed = sscanf(s, "hello,%d and %s", &age, name);

    if (nums_parsed != 2) {
        printf("cannot parse age and name");
        return 1;
    }

    printf("age is %d, and name is %s", age, name);
    return 0;
}
```

### Exit Process Hook
```c  
#include <stdlib.h>

void exit_handler() {

};
int main() {
    int registered_ok = atexit(exit_handler);
    if (registered_ok != 0) {
        return -1;
    }
    return 0;
}
```

### Variable Function Pramaters
```c   
#include <stdarg.h>
#include <stdlib.h>
#include <stdio.h>

int putting(const char* s, int** result, ...) {
    va_list args;
    va_start(args, s);

    int value = va_arg(args, int);
    char c = va_arg(args, char);
    va_end(args);

    int* arr = malloc(2*sizeof(int));
    arr[0] = value;
    arr[1] = (int)c;
    *result = arr;
    return 2;
}

int main() {
    int* result;
    int nums = putting("hello", &result, 10, 'c');
    for (int i = 0; i < nums; i++) {
        printf("%d", result[i]);
    }
    return 0;
}
```

`va_start`, `va_end`, `va_arg` from: `<stdarg.h>`;
`malloc` from: `<stdlib.h>`;
`printf` from: `<stdio.h>`;

### Copy String 
```c  
#include <string.h>

int main() {
    char *hello = "hello, world";
    char *copy = strdup(hello);

    // dont forget to release
    free(copy);

    return 0;
}
```

### Write Formatted String to Buffer
```c   
#include <stdio.h>

int main() {
    char buffer[1024];
    int year = 2025;
    snprintf(buffer, 1024, "hello world, %d", year);
    return 0;
}
```

### See if Two String are Same 
```c   
#include <string.h>

int main() {
    char *s = "hell";
    char *b = "helt";
    if (strcmp(s, b) == 0) {
        // s == b
    }
    return 0;
}
```

### Convert String to Number
```c  
#include <stdlib.h>

int main() {
    int val = atoi("-1234");
    float val_f = atof("-34.56");
    long val_l = atol("123");
    long long val_ll = atoll("23134");
    return 0;
}
```

```c 
#include <stdlib.h>

int main() {
    long val = strtol("023", NULL, 8);
    val = strtol("0x13", NULL, 16);
    return 0;
}
```

Get more details, `man atoi`.

### Get Error Message
```c   
#include <stdio.h>

int main() {
    // if there's an error and errno is set,
    // perror will println error message corresponding to errno
    perror();
    return 0;
}
```

```c  
#include <stdio.h>
#include <errno.h>

int main() {
    // message is error message corresponding to errno.
    char* message = strerror(errno);
    printf("error message: %s", message);
    return 0;
}
```

Get more details, `man perror`.

### Create File
```c 
#include <fcntl.h>
#include <errno.h>

int main() {
    // S_IRWXU | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
    // is equal to 0766.
    int err_or_fd = open("hello.world", O_CREATE | O_RDWR,  S_IRWXU | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH);
    if (err_or_fd == -1) {
        // error
    } else {
        // valid fd, which is >= 0
        int fd = err_or_fd;
        int error_value_no = errno;
    }
    return 0;
}
```

O_ prefix is flag, S_ prefiex is mode. Flag is how you access file, read or write ? Mode decides who can access file.

Get more details:
- `open`: `man 2 open`.
- mode: `man 2 chmod`.

```c   
#include <stdio.h>

int main() {
    // if hello.txt existed, fopen will be failed,
    // avoid this behaviour, remove x from "w+x"
    FILE* file = fopen("hello.txt", "w+x");
    if (file == NULL) {
        // failed
    }
    return 0;
}
```
`fopen` creates file which has default mode `0666`.

Get more details, `man fopen`.

### Read and Write File
Write:
```c  
#include <fcntl.h>
#include <unistd.h>

int main() {
    int fd = open("hello.txt", O_WRONLY | O_CREAT, 0766);
    char message[] = "hello";
    // don't write '\0' to hello.txt
    write(fd, message, sizeof(message) - 1);
    close(fd);
    return 0;
}
```

Read:
```c  
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>

int main() {
    int fd = open("hello.txt", O_RDONLY);

    char buff[10];

    int bytes = read(fd, buff, sizeof(buff));

    if (bytes == -1) {
        // failed
    } else {
        for (int i = 0; i < bytes; i++) {
            printf("%c", buff[i]);
        }
    }

    close(fd);
    return 0;
}
```

`read` and `write` are from `unistd.h`. `open` is from `fcntl.h`.

Get more details:
- `read`: `man 2 read`.
- `write`: `man 2 write`.


Read:
```c  
#include <stdio.h>

int main() {
    FILE* file = fopen("hello.txt", "r+");

    char buff[10];

    int bytes = fread(buff, 1, 4, file);

    for (int i = 0; i < bytes; i++) {
        printf("%c", buff[i]);
    }

    fclose(file);
    return 0;
}
```

Write:
```c  
#include <stdio.h>

int main() {
    FILE* file = fopen("hello.txt", "a+");

    char buff[5] = {'w','o','r','l','d'};

    int bytes = fwrite(buff, 1, 5, file);

    fclose(file);
    return 0;
}
```

Get more details, `man fread`.

### Modify File Flags and Mode

### Set File Nonblocking

### See it is File or Directory
```c  
#include <sys/stat.h>
#include <stdio.h>

int main() {
    struct stat s;
    int r = stat("hello.txt", &s);
    if (r == -1) {
        // failed
    } else {
        if ((s.st_mode & S_IFMT) == S_IFDIR) { // or S_ISDIR(s.st_mode) 
            printf("is directory");
        } else if ((s.st_mode & S_IFMT) == S_IFREG) {
            printf("is file");
        } else if ((s.st_mode & S_IFMT) == S_IFSOCK ) {
            printf("is socket");
        } else if ((s.st_mode & S_IFMT) == S_IFLNK) {
            printf("is symbolic link");
        }
    }
    return 0;
}
```

Get more details, `man 2 stat`.

### Get File Meta
```c  
#include <sys/stat.h>

int main() {
    struct stat s;
    int r = stat("hello.txt", &s);
    if (r == -1) {
        // failed
    } else { 
        // s is file meta data.
    }
    return 0;
}
```

if you have `fd`, you can use `fstat`.

### Remove File
```c  
#include <stdio.h>

int main() {
    int r = remove("hello.txt");
    if (r == -1) {
        // failed
    }
    return 0;
}
```

### Create Directory
```c  
#include <sys/stat.h>

int main() {
    int r = mkdir("hello", 0766);
    if (r == -1) {
        // failed
    }
    return 0;
}
```

### Create Temp Directory

### See what Directory Includes
```c  
#include <dirent.h>
#include <string.h>
#include <stdio.h>

int main() {
    DIR* d = opendir("hello");
    struct dirent* p;
    
    char buff[512];
    do {
        p = readdir(d);
        if (p == NULL) break;
        memcpy(buff, p->d_name, p->d_namlen);
        buff[p->d_namlen] = '\0';
        // print file or subdirectory name,
        // there must be '.' and '..'
        printf("name: %s\n", buff);
    } while(1);

    closedir(d);

    return 0;
}
```

### Remove Directory

### Use `poll` 

### Use `epoll`

### Use `select`

### Use `pselect`

### Use `kqueue`

### TCP client and Server

### Terminal IO and Raw mode

### Create Child Process

### Create Daemon Process

### Suspend Process

### Kill Process

### Sync Processes with Pipe

### Signal Interception and Resolving

### Create Thread

### Suspend Thread

### Kill Thread

### Sync Thread with Lock

### Sync Thread with Semphore

### Sync Thread with Condition Var

### Use ThreadLocal Var






