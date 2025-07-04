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
```c  
#include <sys/time.h>
#include <stdio.h>

int main() {
    struct timeval tp;
    struct timezone tz;
    int r = gettimeofday(&tp, &tz);
    if (r == 0) {
        // tv_sec is seconds relative to 1970.1.1 00:00:00;
        printf("%ld seconds %d microseconds\n", tp.tv_sec, tp.tv_usec);
        // tz_minutewest is minutes offset which Greenwich zone is relative to local zone.
        // if it's -480, local zone is earlier than Greenwich 8 hours.
        printf("%d %d", tz.tz_minuteswest, tz.tz_dsttime);
    }
    return 0;
}
```

### Get User Input
```c  
#include <stdio.h>

int main() {
    char answer = 'a';
    printf("remove this file?(y/n)");
    scanf("%c", &answer);
    if (answer == 'y') {
        printf("remove\n");
    }

    return 0;
}
```

Get more details, `man scanf`

### Extract Value from String 
```c  
#include <stdio.h>

int main() {
    char s[50];
    int age;
    sscanf("hello peter, 20", "hello %s %d", s, &age);
    printf("name: %s, age: %d\n", s, age);
    return 0;
}
```

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

`read` and `write` are from `unistd.h`. `open` is from `fcntl.h`. `read` and `write` are unbuffered.

Get more details:
- `read`: `man 2 read`.
- `write`: `man 2 write`.


if you want to read or write with buffer, take a look at `fread` or `fwrite` below.

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

    // fwrite, write to terminal fd in line-buffered way,
    // write to regular file in full-buffered way.
    // you can change default behaviour with `setvbuf` function.
    int bytes = fwrite(buff, 1, 5, file);
    fflush(file);

    fclose(file);
    return 0;
}
```

Get more details, `man fread`.

### Modify File Flags
```c  
#include <fcntl.h>
#include <unistd.h>

int main() {
   int fd = open("hello.txt", O_APPEND);

   // use F_GETFL getting old flags
   int old_flags = fcntl(fd, F_GETFL);

   int new_flags = O_RDONLY;
   // use F_SETFL setting new flags
   fcntl(fd, F_SETFL, new_flags);
   
   close(fd);
   return 0;
}
```

### Set File Nonblocking
```c  
#include <fcntl.h>
#include <unistd.h>

int main() {
   int fd = open("hello.txt", O_APPEND);
   int old_flags = fcntl(fd, F_GETFL);
   if (old_flags != -1) {
    int r = fcntl(fd, F_SETFL, old_flags | O_NONBLOCK);
    if (r != -1) {
        // success, fd is nonblocking
    }
   }
   
   close(fd);
   return 0;
}
```

### Set File Mode
```c 
#include <sys/stat.h>

int main() {
    int r = chmod("hello.txt", 0776);
    if (r == 0) { 
        // success
    }
    return 0;
}
```

Get more details, `man 2 chmod`

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

Get more details, `man 2 mkdir`

### Create Temp Directory
```c 
#include <unistd.h>

int main() {
    // create a temp directory and return its name;
    // X is replaced with random number or letter.
    char* directory_name = mkdtemp("XXhelloXX");
    if (directory_name != NULL) {
        // success
    }
    return 0;
}
```

Get more details, `man mkdtemp`


### Create Temp File
```c 
#include <unistd.h>

int main() {
    // create a temp file and return its name;
    // X is replaced with random number or letter.
    char* file_name = mkstemp("helloXX.mp4");
    if (file_name != NULL) {
        // success
    }
    return 0;
}
```

Get more details, `man mkstemp`

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
```c 
#include <unistd.h>

int main() {
    // hello must be an empty directory.
    rmdir("hello");
    return 0;
}
```

if you want to delete non-empty directory, you should walk directory, remove its every child file using `remove` and remove its every subdirectory recursively, finally remove this directory using `rmdir`.

### Clear unused fd 
```c  
#include <unistd.h>

int main () {
    for (int fd = 3; fd < sysconf(_SC_OPEN_MAX); fd++) {
        close(fd);
    }
    return 0;
}
```

When you make some http requests, you make some fds respectively. If you fork a child process and don't close these fds, you might get an error "too many open files", you can use this code snippet to solve that problem.

### TCP client and Server
When we write tcp client and server, we usually print messages to stdout so that we know client/server works well.There's a pitfall you should know: our terminal is line-buffer mode as default. In other words, if you take `printf("hello")` in server, nothing is puted into terminal. To see `"hello"` in terminal, you should use `printf("hello\n")`.

TCP Client:
```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h> 
#include <unistd.h>
#include <stdio.h>
#include <string.h>

// you should promise that port 6000 is not taken up by other active process!
#define SERVER_PORT 6000
#define SERVER_ADDR "127.0.0.1"

int main() {
    // create socket fd 
    int fd = socket(AF_INET, SOCK_STREAM, 0); 

    // create server address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr(SERVER_ADDR);
    sa.sin_port = htons(SERVER_PORT);

    // connect to server
    int r = connect(fd, &sa, sizeof(sa));
    if (r == -1) {
       perror("cannot connect to server");
       close(fd);
       return;
    }

    // we don't use `select` `poll` `epoll` here,
    // so we don't need to set fd non-block.

    // take 128byte buffer for receiving message from
    // server and vice versa.
    char buffer[128];
    memset(buffer, 0, sizeof(buffer));

    // message sent to server
    char message[] = "hello world";

    // send message. we don't want to send '\0'
    // to server, so we assign sizeof(message) - 1 to len
    for (int i = 0, len = sizeof(messge) - 1; i < len;) {
        if (i + 128 - 1 > len) {
            memcpy(buffer, message, len - i + 1);
            write(fd, buffer, len - i + 1);
            break;
        }
        memcpy(buffer, message, 128);
        i += 128;
        write(fd, buffer, 128);
    }

    // clear buffer, get ready for receiving from server
    memset(buffer, 0, sizeof(buffer));

    // receive from server
    char receiving = 'n';
    while(1) {
      int bytes = read(fd, buffer, sizeof(buffer));

      // Error caused by `read`
      if (bytes == -1) {
        perror("cannot read from server");
        break;
      }

      // corresponding server-side fd might be closed
      if (bytes == 0) {
        printf("read 0 bytes from server\n");
        break;
      }

      // start to receive
      if (receiving == 'n') {
        receiving = 'y';
        printf("receive from server:\n");
      }

      // if server sends message which ends with "bye",
      // we think this message is completely received.
      // in effect, it's decided by application protocol
      // over tcp protocol. here, we make it easy.
      int end = -1;
      for (int i = 0; i < bytes; i++) {
        if (buffer[i] == 'b' && i + 2 == bytes - 1) {
            if (strncmp(buffer + i, "bye", 3) == 0) {
                end = i;
                break;
            }
        }
      }

      // we receive a part of server message
      if (end == -1) {
        char buff[129];
        memcpy(buff, buffer, bytes);
        buff[bytes] = '\0';
        printf("%s\n", buff);
      } else {
        // we receive all of server message
        char buff[129];
        memcpy(buff, buffer, end);
        buff[end] = '\0';
        printf("%s\n", buff);
        break;
      }
    };

    // release
    close(fd);
}
```

- `socket`, `connect`, `htons`: `<sys/socket.h>`
- `sockaddr_in`: `<netinet/in.h>`
- `inet_addr`:`<arpa/inet.h> `
- `read`, `write`, `close`: `<unistd.h>`

if process exits before you close fd, don't worry, os will help you release.

TCP Server:
```c  
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

// you should promise that port 6000 is not taken up by other active process!
#define SERVER_PORT 6000
#define SERVER_ADDR "127.0.0.1"

int main() {
    // create server socket fd 
    int fd = socket(AF_INET, SOCK_STREAM, 0);

    // create server address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr(SERVER_ADDR);
    sa.sin_port = htons(PORT);

    // bind address to server socket fd
    bind(fd, (struct sockaddr*)&sa, sizeof(sa));

    // make server socket fd reuse address and port
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    // server is running in LISTEN status.
    // allow 10 pending connections.
    // note that process won't be blocked at this point.
    listen(fd, 10);
    printf("server is running...\n");

    while(1) {
        // get ready for receiving client's address info
        struct sockaddr_in client_sa;
        socklen_t slen = sizeof(client_sa);

        // waiting for client connecting, if no client connects,
        // process will be blocked here. if client connects,
        // client_sa will save client address info.
        int client_fd = accept(fd, (struct sockaddr*)&client_sa, &slen);

        // Error caused by `accept`
        if (client_fd == -1) {
            perror("accep failed");
            printf("do you want to keep server active?(y/n)");
            char b[2];
            scanf("%s", b);
            if (b[0] == 'n') {
                break;
            }
            continue;
        }

        // before we receive/send message with client_fd,
        // we set receiving timeout so that process won't be 
        // blocked until client sends message to us. in this
        // way, process can serve another client connecting
        // in time.
        struct timeval t;
        t.tv_sec = 4;
        t.tv_usec = 0;
        setsockopt(client_fd, SOL_SOCKET, SO_RCVTIMEO, &t, sizeof(t));
    
        printf("new client!\n");

        // 128byt buffer, receiving client message
        char buffer[128];
        memset(buffer, 0, sizeof(buffer));

        // receive client message
        char reciving = 'n';
        char close_server = 'n';
        while (1) {
            int bytes = read(client_fd, buffer, sizeof(buffer));

            // Error caused by read
            if (bytes == -1) {
                close(client_fd);
                perror("cannot read from client");
                break;
            }

            // client is closed
            if (bytes == 0) {
                break;
            }

            // start to receive
            if (reciving == 'n') {
                // we assume that client sends "bye", informing
                // server to close itself.
                if (bytes >= 3 && strncmp(buffer, "bye", 3) == 0) {
                    printf("client wants server to be closed\n");
                    close_server = 'y';
                    break;
                }

                reciving = 'y';
                printf("receiving data from client: \n");
            }

            // we assume that "nnn" is mark of getting all
            // client message
            int end = -1;
            for (int i = 0; i < bytes; i++) {
                if (buffer[i] == 'n' && i < bytes - 2) {
                    if (strncmp(buffer + i, "nnn", 3) == 0) {
                        end = i;
                        break;
                    }
                }
            }

            // get partial client message,
            // print it, continue to read extra
            // client message in next loop
            if (end == -1) {
                char buf[129];
                memcpy(buf, buffer, bytes);
                buf[bytes] = '\0';
                printf("%s\n", buf);

                // receive all client message
            } else if (end > 0) {
                char buf[129];
                memcpy(buf, buffer, end);
                buf[end] = '\0';
                printf("%s\n", buf);
                break;
            }
        }
        
        if (reciving == 'n') {
            if (close_server == 'y') break;
            continue;
        }

        // answer client and close communicating.
        char buf[] = "thank you, I recevie. bye";
        write(client_fd, buf, sizeof(buf) - 1);
        close(client_fd);
    }

    // close server
    close(fd);
    printf("server is died\n");
}
```

- `struct timeval`: `<unistd.h>`
- `setsockopt`, `accept`, `listen`: `<sys/socket.h>`

as you can see, tcp communcating is complicated, c reveals it, but other high-level language hides it. this is why c is valuable but not human friendly.

if you want to learn more about network programming with c, I recommend you to take a look at [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), or:
1.   [PDF version](https://beej.us/guide/bgnet/pdf/bgnet_usl_c_1.pdf) 
2.   [html version](https://beej.us/guide/bgnet/html/split/)

### Use `poll` 
```c  
#include <sys/socket.h>
#include <poll.h>
#include <netinet/in.h>
#include <arpa/inet.h> 
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

#define PORT 6000

typedef struct Vec {
    int* data;
    int cap;
    int current;
    int active;
} Vec;

Vec init_vect(int cap) {
    int* data = malloc((sizeof(int)) * cap);
    Vec v;
    v.cap = cap;
    v.data = data;
    v.current = 0;
    v.active = 1;
    return v;
}

void deinit_vect(Vec* vec) {
    if (vec->active == 1) {
        vec->active = 0;
        free(vec->data);
    }
}

int push_vec(Vec* vec, int v) {
    if (vec->current < vec->cap) {
        vec->data[vec->current] = v;
        vec->current++;
        return 0;
    }
    return -1;
}

int pop_vec(Vec* vec) {
    if (vec->current > 0) {
        int val = vec->data[vec->current - 1];
        vec->current--;
        return val;
    }
    return -1;
}

int size_vec(Vec* vec) {
    return vec->current;
}

void clear_vec(Vec* vec) {
    vec->current = 0;
}

int has_vec(Vec* vec, int val) {
    for(int i = 0; i < vec->current; i++) {
        if (vec->data[i] == val) return 1;
    }
    return 0;
}

int main() {
    // create server socket
    int fd = socket(AF_INET, SOCK_STREAM, 0);

    // server socket address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr("127.0.0.1");
    sa.sin_port = htons(PORT);

    // bind address to server socket
    bind(fd, (struct sockaddr*)&sa, sizeof(sa));

    // allow server socket to reuse address
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    // server socket is non-block, because we use `poll`
    int old_flags = fcntl(fd, F_GETFL);
    fcntl(fd, F_SETFL, old_flags | O_NONBLOCK);

    // server is running
    listen(fd, 2);
    printf("server is running...\n");

    Vec read_fds = init_vect(10);
    Vec write_fds = init_vect(10);

    while(1) {
        // create pllfd array
        int cap = size_vec(&read_fds) + size_vec(&write_fds) + 1;
        struct pollfd* fds = malloc(sizeof(struct pollfd) * cap);

        // record fd, and we want to read it
        int i = 0;
        fds[i].fd = fd;
        fds[i].events = POLL_IN;
        fds[i].revents = 0;

        i++;

        // record other fds we want to read
        for (int j = 0; j < read_fds.current; j++) {
            fds[i+j].events = POLL_IN;
            fds[i+j].revents = 0;
            fds[i+j].fd = read_fds.data[j];
        }

        i = i + read_fds.current;

        // record other fds we want to write
        for (int j = 0; j < write_fds.current; j++) {
            fds[i+j].events = POLL_OUT;
            fds[i+j].revents = 0;
            fds[i+j].fd = write_fds.data[j];
        }

        i = i + write_fds.current;

        // 2000 means that poll will block 2000ms
        int r = poll(fds, cap, 2000);

        // Error caused by poll
        if (r == -1) {
            perror("poll failed");
            break;
        }

        // poll timeout
        if (r == 0) {
            printf("timeout\n");
            continue;
        }

        clear_vec(&write_fds);
        clear_vec(&read_fds);

        // walk fds
        for (int j = 0; j < cap; j++) {
            struct pollfd f = fds[j];

            // server socket fd is available to read
            if (f.fd == fd && f.revents & POLL_IN) {
                int client_fd = -1;
                while(1) {
                    struct sockaddr_in client_sa;
                    socklen_t slen = sizeof(client_sa);
                    client_fd = accept(fd, (struct sockaddr*)&client_sa, &slen);
                    if (client_fd == -1) {
                        perror("accep failed");
                        printf("do you want to keep server active?(y/n)");
                        char b[2];
                        scanf("%s", b);
                        if (b[0] == 'n') {
                            free(pollfd);
                            goto close_server;
                        }
                    }
                    break;
                }
                printf("new client!\n");

                int old_flags = fcntl(client_fd, F_GETFL);
                fcntl(client_fd, F_SETFL, old_flags | O_NONBLOCK);

                int val = push_vec(&read_fds, client_fd);
                if (val == -1) {
                    close(client_fd);
                } else {
                
                }

                continue;
            } 

            // not server socket fd, but it's available to read
            if (f.events & POLL_IN) {
                int client_fd = f.fd;
                 // yes, it's sure to read
                if (f.revents & POLL_IN) {
                    char buffer[128];
                    memset(buffer, 0, sizeof(buffer));
                    int bytes = read(client_fd, buffer, sizeof(buffer));
                    if (bytes == -1) {
                        close(client_fd);
                        perror("cannot read from client");
                        continue;
                    }
                    if (bytes == 0) {
                        close(client_fd);
                        continue;
                    }
                    buffer[bytes] = '\0';
                    printf("receive data from client: %s\n", buffer);
                    printf("bytes: %d\n", bytes);
                    if (bytes >= 3 && strncmp(buffer + bytes - 1 - 3, "bye", 3) == 0) {
                        free(pollfd);
                        goto close_server;
                    }   

                    int r = push_vec(&write_fds, client_fd);
                    if (r == -1) {
                        close(client_fd);
                    } else {
                        
                    }
                } else {
                    push_vec(&read_fds, client_fd);
                }
            }

            // available to write
            if (f.events & POLL_OUT) {
                int client_fd = f.fd;
                // yes, it's sure to write
                if (f.revents & POLL_OUT) {
                    char buffer[] = "thank you, bye";
                    int bytes = write(client_fd, buffer, sizeof(buffer) - 1);
                    if (bytes == -1) {
                        perror("cannot write from client");
                    }
                    if (bytes == 0) {
                    }
                    close(client_fd);
                } else {
                    push_vec(&write_fds, client_fd);
                }
            }
        }
        free(pollfd);
        
    }

close_server:
    // release fd and memory
    close(fd);
    printf("server is died\n");

    while(1) {
        int client_write_fd = pop_vec(&write_fds);

        if (client_write_fd == -1) break;

        if (has_vec(&read_fds, client_write_fd) == 0) {
            close(client_write_fd);
        }
    }
    deinit_vect(&write_fds);

    while(1) {
        int client_read_fd = pop_vec(&read_fds);

        if (client_read_fd == -1) break;

        close(client_read_fd);
    }
    deinit_vect(&read_fds);
}
```

`poll`: `<poll.h>`

`poll` is more human friendly to `select` and `pselect`, make your code more readable and organized well.

### Use `epoll`
`epoll` is only available in Linux, not supported by NetBSD, MacOS.

### Use `select`
```c  
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <arpa/inet.h> 
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

#define PORT 6000

typedef struct Vec {
    int* data;
    int cap;
    int current;
    int active;
} Vec;

Vec init_vect(int cap) {
    int* data = malloc((sizeof(int)) * cap);
    Vec v;
    v.cap = cap;
    v.data = data;
    v.current = 0;
    v.active = 1;
    return v;
}

void deinit_vect(Vec* vec) {
    if (vec->active == 1) {
        vec->active = 0;
        free(vec->data);
    }
}

int push_vec(Vec* vec, int v) {
    if (vec->current < vec->cap) {
        vec->data[vec->current] = v;
        vec->current++;
        return 0;
    }
    return -1;
}

int pop_vec(Vec* vec) {
    if (vec->current > 0) {
        int val = vec->data[vec->current - 1];
        vec->current--;
        return val;
    }
    return -1;
}

int size_vec(Vec* vec) {
    return vec->current;
}

int has_vec(Vec* vec, int val) {
    for(int i = 0; i < vec->current; i++) {
        if (vec->data[i] == val) return 1;
    }
    return 0;
}

int main() {
    // create server socket
    int fd = socket(AF_INET, SOCK_STREAM, 0);

    // server socket address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr("127.0.0.1");
    sa.sin_port = htons(PORT);

    // bind address to server socket
    bind(fd, (struct sockaddr*)&sa, sizeof(sa));

    // server socket can reuse address
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    // server socket fd is non-block, because we use select
    int old_flags = fcntl(fd, F_GETFL);
    fcntl(fd, F_SETFL, old_flags | O_NONBLOCK);

    // server is running
    listen(fd, 2);
    printf("server is running...\n");

    

    Vec read_fds = init_vect(10);
    Vec write_fds = init_vect(10);

    while(1) {
        // select timeout option
        struct timeval timeout;
        timeout.tv_sec = 2;
        timeout.tv_usec = 0;

        int max_fd = 0;

        // record fd we want to read
        fd_set read_set;
        FD_ZERO(&read_set);

        // record fd we want to write
        fd_set write_set;
        FD_ZERO(&write_set);

        // we want to read fd, so that we can call `accept`
        FD_SET(fd, &read_set);
        if (fd > max_fd) {
            max_fd = fd;
        }

        for (int i = 0; i < read_fds.current; i++) {
            FD_SET(read_fds.data[i], &read_set);
            if (read_fds.data[i] > max_fd) {
                max_fd = read_fds.data[i];
            }
        }

        for (int i = 0; i < write_fds.current; i++) {
            FD_SET(write_fds.data[i], &write_set);
            if (write_fds.data[i] > max_fd) {
                max_fd = write_fds.data[i];
            }
        }

        // take a look at first argument, it's a pitfall.
        // if you want to read fd 4 and 7, and want to write fd 8, 11 and 12,
        // first argument is neither 2 nor 3, it's 13, in others words,
        // max_fd + 1.
        int r = select(max_fd +1, &read_set, &write_set, NULL, &timeout);

        // Error caused by select
        if (r == -1) {
            perror("select failed");
            break;
        }

        // select timeout
        if (r == 0) {
            printf("timeout\n");
            continue;
        }

        // write to available fds
        Vec write_copy = init_vect(10);
        while (1) {
            int client_fd = pop_vec(&write_fds);

            // empty
            if (client_fd == -1) {
                break;
            }

            if (FD_ISSET(client_fd, &write_set) != 0) {
                char buffer[] = "thank you, bye";
                int bytes = write(client_fd, buffer, sizeof(buffer) - 1);
                if (bytes == -1) {
                    perror("cannot write from client");
                }
                if (bytes == 0) {
                }
                close(client_fd);
            } else {
                push_vec(&write_copy, client_fd);
            }
        }
        deinit_vect(&write_fds);
        write_fds = write_copy;

        // read available fds
        while(1) {
            int client_fd = pop_vec(&read_fds);

            if (client_fd == -1) {
                break;
            }

            if (FD_ISSET(client_fd, &read_set) != 0) {
                char buffer[128];
                memset(buffer, 0, sizeof(buffer));
                int bytes = read(client_fd, buffer, sizeof(buffer));
                if (bytes == -1) {
                    close(client_fd);
                    perror("cannot read from client");
                    continue;
                }
                if (bytes == 0) {
                    close(client_fd);
                    continue;
                }
                buffer[bytes] = '\0';
                printf("receive data from client: %s\n", buffer);
                printf("bytes: %d\n", bytes);
                if (bytes >= 3 && strncmp(buffer + bytes - 1 - 3, "bye", 3) == 0) {
                    goto close_server;
                }

                int r = push_vec(&write_fds, client_fd);
                if (r == -1) {
                    close(client_fd);
                } else {
                    
                }
            }
        }

        // read server socket fd
        if (FD_ISSET(fd, &read_set) != 0) {
            int client_fd = -1;
            while(1) {
                struct sockaddr_in client_sa;
                socklen_t slen = sizeof(client_sa);
                client_fd = accept(fd, (struct sockaddr*)&client_sa, &slen);
                if (client_fd == -1) {
                    perror("accep failed");
                    printf("do you want to keep server active?(y/n)");
                    char b[2];
                    scanf("%s", b);
                    if (b[0] == 'n') {
                        goto close_server;
                    }
                }
                break;
            }

            printf("new client!\n");

            int old_flags = fcntl(client_fd, F_GETFL);
            fcntl(client_fd, F_SETFL, old_flags | O_NONBLOCK);

            int val = push_vec(&read_fds, client_fd);
            if (val == -1) {
                close(client_fd);
            } else {
                
            }
        }
    }

close_server:
    close(fd);
    printf("server is died\n");

    // release and close fds
    while(1) {
        int client_write_fd = pop_vec(&write_fds);

        if (client_write_fd == -1) break;

        if (has_vec(&read_fds, client_write_fd) == 0) {
            close(client_write_fd);
        }
    }
    deinit_vect(&write_fds);

    // release and close fds
    while(1) {
        int client_read_fd = pop_vec(&read_fds);

        if (client_read_fd == -1) break;

        close(client_read_fd);
    }
    deinit_vect(&read_fds);
}
```
if process exits with executing code that releases memory and fds, it's called exit gracefully.

`select`: `<sys/select>`

### Use `pselect`
in most parts of `pselect`, it's identical to `select`.

```c  
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <arpa/inet.h> 
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

#define PORT 6000

typedef struct Vec {
    int* data;
    int cap;
    int current;
    int active;
} Vec;

Vec init_vect(int cap) {
    int* data = malloc((sizeof(int)) * cap);
    Vec v;
    v.cap = cap;
    v.data = data;
    v.current = 0;
    v.active = 1;
    return v;
}

void deinit_vect(Vec* vec) {
    if (vec->active == 1) {
        vec->active = 0;
        free(vec->data);
    }
}

int push_vec(Vec* vec, int v) {
    if (vec->current < vec->cap) {
        vec->data[vec->current] = v;
        vec->current++;
        return 0;
    }
    return -1;
}

int pop_vec(Vec* vec) {
    if (vec->current > 0) {
        int val = vec->data[vec->current - 1];
        vec->current--;
        return val;
    }
    return -1;
}

int size_vec(Vec* vec) {
    return vec->current;
}

int has_vec(Vec* vec, int val) {
    for(int i = 0; i < vec->current; i++) {
        if (vec->data[i] == val) return 1;
    }
    return 0;
}

int main() {
    // create server socket
    int fd = socket(AF_INET, SOCK_STREAM, 0);

    // server socket address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr("127.0.0.1");
    sa.sin_port = htons(PORT);

    // bind address to server socket
    bind(fd, (struct sockaddr*)&sa, sizeof(sa));

    // server socket can reuse address
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    // server socket fd is non-block, because we use select
    int old_flags = fcntl(fd, F_GETFL);
    fcntl(fd, F_SETFL, old_flags | O_NONBLOCK);

    // server is running
    listen(fd, 2);
    printf("server is running...\n");

    Vec read_fds = init_vect(10);
    Vec write_fds = init_vect(10);

    while(1) {
        // pselect timeout option.
        // it's more controllable than select,
        // select uses us but pselect uses ns.
        struct timespec timeout;
        timeout.tv_sec = 5;
        timeout.tv_nsec = 0;

        int max_fd = 0;

        // record fd we want to read
        fd_set read_set;
        FD_ZERO(&read_set);

        // record fd we want to write
        fd_set write_set;
        FD_ZERO(&write_set);

        // we want to read fd, so that we can call `accept`
        FD_SET(fd, &read_set);
        if (fd > max_fd) {
            max_fd = fd;
        }

        for (int i = 0; i < read_fds.current; i++) {
            FD_SET(read_fds.data[i], &read_set);
            if (read_fds.data[i] > max_fd) {
                max_fd = read_fds.data[i];
            }
        }

        for (int i = 0; i < write_fds.current; i++) {
            FD_SET(write_fds.data[i], &write_set);
            if (write_fds.data[i] > max_fd) {
                max_fd = write_fds.data[i];
            }
        }

        // in this way, when pselect is blocking, you send interrupt signal to
        // process, process won't exit at once until pselect is returned.
        sigset_t sig = SIGINT | SIGHUP;

        // take a look at first argument, it's a pitfall.
        // if you want to read fd 4 and 7, and want to write fd 8, 11 and 12,
        // first argument is neither 2 nor 3, it's 13, in others words,
        // max_fd + 1.
        int r = pselect(max_fd +1, &read_set, &write_set, NULL, &timeout, &sig);

        // Error caused by pselect
        if (r == -1) {
            perror("pselect failed");
            break;
        }

        // pselect timeout
        if (r == 0) {
            printf("timeout\n");
            continue;
        }

        // write to available fds
        Vec write_copy = init_vect(10);
        while (1) {
            int client_fd = pop_vec(&write_fds);

            // empty
            if (client_fd == -1) {
                break;
            }

            if (FD_ISSET(client_fd, &write_set) != 0) {
                char buffer[] = "thank you, bye";
                int bytes = write(client_fd, buffer, sizeof(buffer) - 1);
                if (bytes == -1) {
                    perror("cannot write from client");
                }
                if (bytes == 0) {
                }
                close(client_fd);
            } else {
                push_vec(&write_copy, client_fd);
            }
        }
        deinit_vect(&write_fds);
        write_fds = write_copy;

        // read available fds
        while(1) {
            int client_fd = pop_vec(&read_fds);

            if (client_fd == -1) {
                break;
            }

            if (FD_ISSET(client_fd, &read_set) != 0) {
                char buffer[128];
                memset(buffer, 0, sizeof(buffer));
                int bytes = read(client_fd, buffer, sizeof(buffer));
                if (bytes == -1) {
                    close(client_fd);
                    perror("cannot read from client");
                    continue;
                }
                if (bytes == 0) {
                    close(client_fd);
                    continue;
                }
                buffer[bytes] = '\0';
                printf("receive data from client: %s\n", buffer);
                printf("bytes: %d\n", bytes);
                if (bytes >= 3 && strncmp(buffer + bytes - 1 - 3, "bye", 3) == 0) {
                    goto close_server;
                }

                int r = push_vec(&write_fds, client_fd);
                if (r == -1) {
                    close(client_fd);
                } else {
                    
                }
            }
        }

        // read server socket fd
        if (FD_ISSET(fd, &read_set) != 0) {
            int client_fd = -1;
            while(1) {
                struct sockaddr_in client_sa;
                socklen_t slen = sizeof(client_sa);
                client_fd = accept(fd, (struct sockaddr*)&client_sa, &slen);
                if (client_fd == -1) {
                    perror("accep failed");
                    printf("do you want to keep server active?(y/n)");
                    char b[2];
                    scanf("%s", b);
                    if (b[0] == 'n') {
                        goto close_server;
                    }
                }
                break;
            }

            printf("new client!\n");

            int old_flags = fcntl(client_fd, F_GETFL);
            fcntl(client_fd, F_SETFL, old_flags | O_NONBLOCK);

            int val = push_vec(&read_fds, client_fd);
            if (val == -1) {
                close(client_fd);
            } else {
                
            }
        }
    }

close_server:
    close(fd);
    printf("server is died\n");

    // release and close fds
    while(1) {
        int client_write_fd = pop_vec(&write_fds);

        if (client_write_fd == -1) break;

        if (has_vec(&read_fds, client_write_fd) == 0) {
            close(client_write_fd);
        }
    }
    deinit_vect(&write_fds);

    // release and close fds
    while(1) {
        int client_read_fd = pop_vec(&read_fds);

        if (client_read_fd == -1) break;

        close(client_read_fd);
    }
    deinit_vect(&read_fds);
}
```

### Use `kqueue`
```c  
#include <sys/socket.h>
#include <sys/event.h>
#include <netinet/in.h>
#include <arpa/inet.h> 
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

#define PORT 6000

typedef struct Vec {
    int* data;
    int cap;
    int current;
    int active;
} Vec;

Vec init_vect(int cap) {
    int* data = malloc((sizeof(int)) * cap);
    Vec v;
    v.cap = cap;
    v.data = data;
    v.current = 0;
    v.active = 1;
    return v;
}

void deinit_vect(Vec* vec) {
    if (vec->active == 1) {
        vec->active = 0;
        free(vec->data);
    }
}

int push_vec(Vec* vec, int v) {
    if (vec->current < vec->cap) {
        vec->data[vec->current] = v;
        vec->current++;
        return 0;
    }
    return -1;
}

int pop_vec(Vec* vec) {
    if (vec->current > 0) {
        int val = vec->data[vec->current - 1];
        vec->current--;
        return val;
    }
    return -1;
}

int size_vec(Vec* vec) {
    return vec->current;
}

void clear_vec(Vec* vec) {
    vec->current = 0;
}

int has_vec(Vec* vec, int val) {
    for(int i = 0; i < vec->current; i++) {
        if (vec->data[i] == val) return 1;
    }
    return 0;
}

int main() {
    // create server socket fd
    int fd = socket(AF_INET, SOCK_STREAM, 0);

    // server socket address option
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_addr.s_addr = inet_addr("127.0.0.1");
    sa.sin_port = htons(PORT);

    // bind address to server socket
    bind(fd, (struct sockaddr*)&sa, sizeof(sa));

    // allow server socket to reuse address
    int yes = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    // server socket is non-block
    int old_flags = fcntl(fd, F_GETFL);
    fcntl(fd, F_SETFL, old_flags | O_NONBLOCK);

    // server socket is running
    listen(fd, 2);
    printf("server is running...\n");

    Vec read_fds = init_vect(10);
    Vec write_fds = init_vect(10);

    // create kernal queue, kd is file descriptor
    int kd = kqueue();

    while(1) {
        // create event list
        int cap = size_vec(&read_fds) + size_vec(&write_fds) + 1;
        // event we expect
        struct kevent* fd_events = malloc(sizeof(struct kevent) * cap);
        // real tiggered event
        struct kevent* fd_events_out = malloc(sizeof(struct kevent) * cap);

        int i = 0;
        // a pitfall. you only can set one filter.
        fd_events[i].filter = EVFILT_READ;
        // if you don't set EV_ONESHOT, you don't need to 
        // set fd_event in next loop; here, we sync with `poll` code,
        // and set fd_event in every loop.
        fd_events[i].flags = EV_ADD | EV_ENABLE | EV_ONESHOT;
        fd_events[i].ident = fd;

        i++;

        // other fds we want to read
        for (int j = 0; j < read_fds.current; j++) {
            fd_events[i+j].filter = EVFILT_READ;
            fd_events[i+j].flags = EV_ADD | EV_ENABLE | EV_ONESHOT;
            fd_events[i+j].ident = read_fds.data[j];
        }

        i = i + read_fds.current;

        // other fds we want to write
        for (int j = 0; j < write_fds.current; j++) {
            fd_events[i+j].filter = EVFILT_WRITE;
            fd_events[i+j].flags = EV_ADD | EV_ENABLE | EV_ONESHOT;
            fd_events[i+j].ident = write_fds.data[j];
        }

        i = i + write_fds.current;

        struct timespec timeout;
        timeout.tv_sec = 3;
        timeout.tv_nsec = 0;

        int r = kevent(kd, fd_events, cap, fd_events_out, cap, &timeout);
        if (r == -1) {
            perror("kevent failed");
            break;
        }

        // timeout
        if (r == 0) {
            printf("timeout\n");
            continue;
        }

        clear_vec(&write_fds);
        clear_vec(&read_fds);

        // walk fd_events_out and get triggered event
        for (int j = 0; j < r; j++) {
            struct kevent f = fd_events_out[j];
            // event is related with server socket, and it is available to read.
            // a pitfall: we use `==` , not `|`
            if (f.ident == fd && f.filter == EVFILT_READ) {
                int client_fd = -1;
                while(1) {
                    struct sockaddr_in client_sa;
                    socklen_t slen = sizeof(client_sa);
                    client_fd = accept(fd, (struct sockaddr*)&client_sa, &slen);
                    if (client_fd == -1) {
                        perror("accep failed");
                        printf("do you want to keep server active?(y/n)");
                        char b[2];
                        scanf("%s", b);
                        if (b[0] == 'n') {
                            free(fd_events);
                            free(fd_events_out);
                            goto close_server;
                        }
                    }
                    break;
                }
                printf("new client!\n");

                int old_flags = fcntl(client_fd, F_GETFL);
                fcntl(client_fd, F_SETFL, old_flags | O_NONBLOCK);

                int val = push_vec(&read_fds, client_fd);
                if (val == -1) {
                    close(client_fd);
                } else {
                
                }

            } 

            // not server socket, but it's available to read
            if (f.ident != fd && f.filter == EVFILT_READ) {
                int client_fd = f.ident;
                char buffer[128];
                memset(buffer, 0, sizeof(buffer));
                int bytes = read(client_fd, buffer, sizeof(buffer));
                if (bytes == -1) {
                    close(client_fd);
                    perror("cannot read from client");
                    continue;
                }
                if (bytes == 0) {
                    close(client_fd);
                    continue;
                }
                buffer[bytes] = '\0';
                printf("receive data from client: %s\n", buffer);
                printf("bytes: %d\n", bytes);
                if (bytes >= 3 && strncmp(buffer + bytes - 1 - 3, "bye", 3) == 0) {
                    free(fd_events);
                    free(fd_events_out);
                    goto close_server;
                }   

                int r = push_vec(&write_fds, client_fd);
                if (r == -1) {
                    close(client_fd);
                } else {
                    
                }
            }

            // it's available to write
            if (f.filter == EVFILT_WRITE) {
                int client_fd = f.ident;
                char buffer[] = "thank you, bye";
                int bytes = write(client_fd, buffer, sizeof(buffer) - 1);
                if (bytes == -1) {
                    perror("cannot write to client");
                }
                if (bytes == 0) {
                }
                close(client_fd);
            }
        }

        // remember to free before next loop
        free(fd_events);
        free(fd_events_out);
    }

close_server:
    // release kernel queue and server socket
    close(fd);
    close(kd);
    printf("server is died\n");

    // release memory and other fds
    while(1) {
        int client_write_fd = pop_vec(&write_fds);

        if (client_write_fd == -1) break;

        if (has_vec(&read_fds, client_write_fd) == 0) {
            close(client_write_fd);
        }
    }
    deinit_vect(&write_fds);

    while(1) {
        int client_read_fd = pop_vec(&read_fds);

        if (client_read_fd == -1) break;

        close(client_read_fd);
    }
    deinit_vect(&read_fds);
}
```

`kqueue`,`kevent`: `<sys/event.h>`

`kqueue` is powerful but complicated. you have to know what you do clearly. in my opinion, I prefer `poll`.

### Send ICMP Network Packet
We talk about how to create TCP client/server before. TCP is popular, do you know how to work with ICMP ?

Firstly, ICMP is like TCP/UDP, it's usually used to make sure whether local machine can communicate with remote machine, like server or router. ICMP is based on IP, unlike TCP/UDP, when you program with socket, you have to parse IP packet and extract ICMP packet by hand.

Do you learn about `ping` ? Yes, `ping` is based on ICMP. When you ping a domain, ICMP packets will be sent to the domain, `ping` receives the ICMP packets from the domain, parses them and print the message in your terminal.

Here is a [blog](https://fasionchan.com/network/icmp/ping-c/), telling you how to send ICMP Packet.

```c  
#include <sys/socket.h>

int main() {
    // to send ICMP packet, you need to create socket fd
    // in this way.
    int fd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
}
```

### Terminal IO and Raw mode
Enable raw mode.
```c  
int enableRawMode(int fd) {
    struct termios raw;

    tcgetattr(fd, &raw);

    raw.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
    raw.c_oflag &= ~(OPOST);
    raw.c_cflag |= (CS8);
    raw.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);
    raw.c_cc[VMIN] = 0; 
    raw.c_cc[VTIME] = 1;

    tcsetattr(fd,TCSAFLUSH,&raw);
    return 0;
}
```
Read [Kilo, a Simple Text Editor](/blog/terminal-kilo), get more details.

Terminal IO refers that you read message from terminal emulator and write message to terminal emulator. You can set a structure, called `termios`, change action of terminal emulator. Read [Terminal IO](/blog/terminal-io), get more details.


### Create Child Process
Before we talk about how to create process, let's dive into Orphan Process and Zombie Process, because they will teach us to take responsibility for creating and managing process.

Let's say we have Process A, and it creates Process B. Process A doesn't wait for Process B exiting and exits before Process B. Then Process B becomes Orphan Process. In this case, OS Init Process whose PID is 1, will take control of Process B. If Process B still works for a long time, memory taken up by Process B cannot be released.

Let's talk about Zombie Process. If Process B exits before Process A, but Process A doesn't wait for Process B, Process B becomes Zombie Process. Process B has released its resource, such as memory, file 
descriptors, registers, but it still takes up space of os process table. As a result, os cannot create new process with reusing Process B's PID. Only Process A waits for Process B exiting and reaps exiting information, OS is enable to release the space from os process table. Here is a related artical [Zombie Processes in Operating Systems](https://www.baeldung.com/cs/process-lifecycle-zombie-state)

```c  
#include <unistd.h>
#include <sys/wait.h>
#include <stdio.h>

int main() {
    pid_t pid = fork();
    if (pid == -1) {
        perror("fork");
        return 1;
    }

    // child process
    if (pid == 0) {
        char* args[] = {
            "sh",
            "hello.sh",
            NULL
        };
        int r = execvp(args[0], args);
        if (r == -1) {
            perror("execvp");
            exit(1);
        }
        exit(0);
    }

    // main process , wait child process ending up
    waitpid(pid, NULL, 0);
    return 0;
}
```

We use `execvp` here, because its first arg is path or filename, it will search like shell does.
If you use `execv`, you should make sure its first arg is a path, i.g. `execv("/bin/sh", args)`, 
`execvp("sh", args)`.


### Create Daemon Process
Daemon Process is:
1. background process 
2. orphan process
3. not binding to terminal device, but can read or write files 
   
```c  
static void daemonize(void) {
    int fd;
    FILE *fp;

    if (fork() != 0) exit(0); /* parent exits */
    setsid(); /* create a new session */

    // redirect stdout, stdin, stderror to /dev/null,
    // and release fd.
    if ((fd = open("/dev/null", O_RDWR, 0)) != -1) {
        dup2(fd, STDIN_FILENO);
        dup2(fd, STDOUT_FILENO);
        dup2(fd, STDERR_FILENO);

        if (fd > STDERR_FILENO) close(fd);
    }

    // do other long-time job

    // right now, this process is not related with
    // terminal device, and it's absolutely a 
    // background process. its parent process exits
    // earlier than it, it becomes an orphan process,
    // finally it's controlled by init process.
}
```

### Suspend Process

### Kill Process
```c  
#include <signal.h>
#include <stdio.h>

int main() {
    pid_t process = 10;
    int r = kill(process, SIGKILL);
    if (r == 0) {
        printf("kill successfully\n");
        return 0;
    }
    return -1;
}
```

there're important differences if process is zero or negative, `man 2 kill`, get more details.

### Sync Processes with Pipe

### Signal Interception and Resolving
There're so many signals in Unix. You can get a list of signals with `man signal`.



### Create Thread
Normally, we use `posix thread library` to create and manage threads in Unix-like system. This library is based on system call, in other words, it creates kernel-level thread, not user-level thread. Go's goroutine is user-level thread. But there're some differences between os system. For example, Linux supports `pthread_yield` but macOS not; some unix support `sched_yield` but macOS not.

If you want to get details, read [article](https://users.cs.cf.ac.uk/Dave.Marshall/C/node29.html#SECTION002922000000000000000).

You can also take a look at Zig's Thread yield source code [here](https://ziglang.org/documentation/master/std/#std.Thread.yield).

```c  
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

// thread routine.
// pitfall: return value must declare void* type,
// arg must declare void* type. For arg, you can
// transform it to specific pointer type because
// you know which type it is when you call pthread_create.
//
// For return value, you must return pointer type!
// avoid stack-free problem, you have to alloc memory
// on heap, save your value on it, and return pointer.
//
// void* means generic type pointer, yes, it's pointer!
void* entry(void* n) {
    printf("from child thread: sleeping\n");
    sleep(3);
    int num = *((int*)n);
    char* m = malloc(sizeof(char));
    if (num > 0) {
        printf("hello world\n");
        *m = 'y';
    } else {
        printf("sorry\n");
        *m = 'n';
    }
    return m;
}

int main() {
    printf("main thread: create a child thread\n");

    pthread_t child;
    int num = 20;
    // create thread
    int r = pthread_create(&child, NULL, entry, &num);
    // create failed
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    // wait for thread exiting and fetch its return 
    // value with re.
    char* re;
    r = pthread_join(child, (void**)&re);
    if (r != 0) {
        perror("pthread_join failed");
        return r;
    }

    printf("main thread:\tchild return value: %c\n", *re);
    free(re);
    return 0;
}
```

- `pthread_create`, `pthread_join`: `<pthread.h>`
- `sleep`: `<unistd.h>`

### Yield Thread


### Kill Thread
```c  
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

void* entry(void* n) {
    printf("from child thread: sleeping\n");
    sleep(13);
    int num = *((int*)n);
    if (num > 0) {
        printf("hello world\n");
    } else {
        printf("sorry\n");
    }
}
int main() {
    printf("main thread: create a child thread\n");

    pthread_t child;
    int num = 20;
    int r = pthread_create(&child, NULL, entry, &num);
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    // more possible to switch to child thread
    sleep(3);

    printf("main thread: cancel child thread\n");
    r = pthread_cancel(child);
    if (r != 0) {
        perror("pthread_cancel failed");
        return r;
    }

    // make sure child thread is canceled, not exited
    // because of main thread exiting.
    sleep(18);

    return 0;
}
```

`pthread_cancel`: `<pthread.h>`

### Sync Thread with Lock
```c  
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <sys/syscall.h>

int a = 10;


void* entry3(void* n) {
    // error ! caused by mutex is copy of original mutex,
    // and lock only works with address of original mutex,
    // not address of mutex here!
    pthread_mutex_t mutex = *((pthread_mutex_t*)n);
    pthread_mutex_lock(&mutex);
    a += 100;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

void* entry(void* n) {
    pthread_mutex_t* mutex = (pthread_mutex_t*)n;
    pthread_mutex_lock(mutex);
    a += 100;
    pthread_mutex_unlock(mutex);
    return NULL;
}


void* entry2(void* n) {
    pthread_mutex_t* mutex = ((pthread_mutex_t*)n);
    pthread_mutex_lock(mutex);
    a += 1;
    pthread_mutex_unlock(mutex);
    return NULL;
}

int main() {
    pthread_mutex_t mutex;
    pthread_mutex_init(&mutex, NULL);

    pthread_t child1;
    pthread_t child2;

    int r = pthread_create(&child1, NULL, entry, &mutex);
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    r = pthread_create(&child2, NULL, entry2, &mutex);
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    pthread_join(child1, NULL);
    pthread_join(child2, NULL);

    printf("a: %d\n", a);

    return 0;
}
```

### Sync Thread with Semphore

### Sync Thread with Condition Var
```c  
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <sys/syscall.h>

int a = 10;

pthread_cond_t cond;
pthread_mutex_t mutex;

void* entry(void* n) {
    pthread_mutex_lock(&mutex);
    if (a < 20) {
        pthread_cond_wait(&cond, &mutex);
    }
    a += 100;
    pthread_mutex_unlock(&mutex);
    return NULL;
}


void* entry2(void* n) {
    pthread_mutex_lock(&mutex);
    a += 20;
    pthread_cond_signal(&cond);
    pthread_mutex_unlock(&mutex);
    return NULL;
}

int main() {
    pthread_mutex_init(&mutex, NULL);
    pthread_cond_init(&cond, NULL);

    pthread_t child1;
    pthread_t child2;

    int r = pthread_create(&child1, NULL, entry, NULL);
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    r = pthread_create(&child2, NULL, entry2, NULL);
    if (r != 0) {
        perror("pthread_create failed");
        return r;
    }

    pthread_join(child1, NULL);
    pthread_join(child2, NULL);

    printf("a: %d\n", a);

    return 0;
}
```


### Use ThreadLocal Var



### Direct Syscall
Normally, os provides libc for wrapping systemcall. If you want to make systemcall, you should invoke functions defined in libc. But if you want to make systemcall directly, not through libc, you can use assembly code. To make it simple, os provides c function like `syscall` , `__syscall` for wrapping assembly code. Unfortunately, not every os exposes this c function. In new version of macOS, `syscall` is deprecated and dropped([Github | related issue](https://github.com/google/glog/issues/185)), so you cannot search by `man syscall` getting more details. In linux, it's ok. Libc is not equal to c standard library, it contains c standard library and other parts.


## Systemcall, Libc and Program Language Standard Library 
Systemcall is part of operating system. Saving values in specific registers and invoking specific machine instructions (assembly code), cpu will trap into kernel side, and take actions —— this is essence of systemcall.

Normally, if you want to request systemcall, you don't write assembly code. Developers write operating system with c language, then wrapping assembly code with c. But it's still hard to use, because memorizing systemcall number is pretty boring. Developers wrap systemcall in a human-friendly way, such as `fork()`, `write()`, `read()`. They won't provide c source code to you, instead, they compile c source code and provide c library to you. Yes, this is `libc`. `libc` also includes c standard functions. By the way, if you want to see all systemcall numbers, you can read `sys/syscall.h` header file.

There is always standard library going with modern program language. What should it do if invoke systemcall ? One way: wraps systemcall(assembly code) on own (Go standard library), the other way: links `libc`(Rust/Zig library). Modern program language also has its own runtime, and runtime is also part of its library.