---
title: "mio"
page: true
aside: true
---

## What is `mio` 
`mio`是一个rust crate, 它基于`libc`crate, 通过友好的封装，简化开发者使用`epoll` `kqueue` `IOCP`的负担。它也是`tokio`的底层基础，是实现 event loop 的根基所在。

既然说到这里，不得不提及一下异步io的实现方式。有两种实现方式的model。第一种，就是 `readiness model`, 像 linux 的 `epoll`, BSD 的 `kqueue` 就是此类。这些API没有回调函数的概念，而是一次性阻塞式地检查若干个fd（文件描述符），返回那些可以直接使用、不会引起阻塞的fd。第二种，就是`completion model`, 以windows的`IOCP`为代表，引入回调函数，当系统检查fd准备好后（可以读或者可以写了）, 调用回调函数处理。

## 文件访问 
如果要读取文件，一般有这些步骤：
1. 调用`open`，获取文件描述符fd;
2. 调用`read`，读取文件描述符fd指代的文件；
3. 调用`close`，关闭文件描述符；

问题在于第二步，如果文件描述符没有做调整，比如调用`fcntl`将其修改为非阻塞式访问，那么第二步执行的时候，就会阻塞线程。然而，就算我们设置为非阻塞式访问，也有问题，在非阻塞式访问下，如果文件读不了，第二步会立即返回，我们并不知道什么时候文件可以读了，于是我们就要利用循环，反复调用 `read` 试探。反复调用system call，开销可不小。

为了解决这样的问题，才有了`epoll`或者`kqueue`。只需花费一次阻塞，就能确认多个文件是否可读或者可写了，不用反复试探。

这样讲，还是有点抽象，不妨以`epoll`为例，给出c语言示例:
```c   
#include <stdio.h>
#include <sys/epoll.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>

#define PORT 8080
#define EPOLL_SIZE 16  // Maximum events to be watched in one poll cycle.

int main() {
    // 1. 准备epoll
    int epoll_fd = epoll_create(EPOLL_SIZE);
    if (epoll_fd == -1) {
        perror("Creating epoll instance failed");
    }

    // 2. 开启一个server_socket, 监听客户端连接
    int server_socket = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, IPPROTO_TCP);
    if (server_socket < 0) {
        perror("Error creating socket");
    }
    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    int bind_res = bind(server_socket, (struct sockaddr *)&server_addr, 
    sizeof(server_addr));
    if (bind_res == -1) {
        perror("Error binding socket");
    }
    int listen_res = listen(server_socket, SOMAXCONN);
    if (listen_res == -1) {
        perror("Error in listening on server socket");
    }

    int epoll_events_size;

    // 3. 准备好一个容器events，存储系统返回的event
    epoll_event events[EPOLL_SIZE];

    // 4. 为接受客户端socket做一些准备
    char buf[1024];
    int client_socket = NULL;
    struct sockaddr_in client_addr;
    socklen_t addr_len = sizeof(client_addr);

    while (true) {
        // 5. 陷入阻塞，当epoll_wait返回后，原来events中的内容会清空，然后存储event, 告知文件状态
        epoll_events_size = epoll_wait(epoll_fd, events, EPOLL_SIZE, -1);
        if (epoll_events_size < 0 && errno != EINTR) {
            perror("Error in epoll_wait");
            break;
        }
        
        for(int i = 0; i < epoll_events_size; i++) {
            // 6. 检查文件状态是可读的，因为上边我们只启动了一个服务端socket，
            // 这个只读的事件说的就是这个socket，接下来，我们就可以调用 accept
            if(events[i].events & EPOLLIN && events[i].data.fd == NULL) { 
                int client_socket = accept(
                    server_socket, 
                    (struct sockaddr *)&client_addr, 
                    &addr_len);
                
                if (client_socket == -1) {
                    perror("Error in accept() on client socket");
                } else {
                    // 7. client_socket用于和客户端socket通讯，这里我们是想
                    // 读取 client_socket, 在绑定 event的时候，只需要指定
                    // 只读 EPOLLIN. 这里为了方便，复用了 events[i] 的内存空间，
                    // 实际上，你可以单独在栈内存准备一个event，做如下操作

                    // data存储的就是自定义数据，这里存储client_socket，这样就可以
                    // 知道 event 说的是哪个文件
                    events[i].data.fd = client_socket;
                    events[i].events = EPOLLIN | EPOLLET; // Enable event-driven mode
                    // 8. 注册新的 event
                    epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_socket, &events[i]);
                    
                    printf("New connection from %s\n", inet_ntoa(client_addr.sin_addr));
                }
            } else if (events[i].events & EPOLLIN && events[i].data.fd) {
                int client_socket = events[i].data.fd;

                // 9. 读取客户端socket发送的数据
                read(client_socket, buf, sizeof(buf));

            } else if(events[i].events & EPOLLERR) { 
                perror("EPOLLERR on socket");
            }
        }
    }

    close(server_socket);
}
```

## `mio`是怎么封装的 
`mio`的封装，大量依赖`libc` crate。它的核心概念有`Poll`, `Selector`, `Event`, `Events`, `Token`, `Interest`。

`Interest`是对文件状态的封装，比如文件可读，文件可写，在c语言中，表示这些状态要使用很多宏，非常难记，`Interest`对此做了统一处理，比如文件可读，直接用`Interest::READABLE`就好了。

`Events` 就是 `Vec<Event>`, 而 `Event` 是对`libc::epoll_event`，`libc::kevent`的封装。当`epoll`，`kequeue`返回哪些文件准备好了的时候，返回的就是`Event`。 `Event` 里边包含两个概念，一个是文件状态，操作系统会标记这个属性，告诉我们是否存在可读或者可写的文件了，另一个是自定义的数据，这个数据就是`Token`。这里边让人困惑的地方在于，`Event`中只说明了文件状态，却没有文件描述符的信息，那我们就不知道到底是哪个文件可读了，还是可写了。其实是有办法的，那就是`Event`里的自定义数据。当我们想要知道某个文件是否可读的时候，我们就必须为这个文件注册一个`Event`到`epoll`或者`kqueue`上去，那么这个时候，我们就可以给出一个自定义数据，通过这个自定义数据，将`Event`和文件描述符对应起来。等`epoll`或者`kqueue`返回时，它只会修改文件状态，不会修改自定义数据，我们其实就知道到底是哪个文件描述符准备好了。

`Selector`是对`epoll`, `kqueue`等system call的封装，一方面将`Event`注册到底层API中，另一方面调用底层API获取到`Events`，返回给上层。因此，在使用`Poll::poll`的时候，你需要传入一个`&Events`的参数。

`Poll`就是最上层的封装，将 `Selector` 在内的概念串接起来，供使用者直接调用。

接下来，给出一段代码，展示它们的关系：
```rs  
use std::io;
use mio::net::TcpListener;
use mio::{Poll, Token, Interest, Events};
use mio::net::TcpListener;

fn main() -> io::Result<()> {
    let mut poll = Poll::new()?;
    let mut events = Events::with_capacity(128);
    let address = "127.0.0.1:0".parse().unwrap();
    let mut listener = TcpListener::bind(address)?;
    const SERVER: Token = Token(0);
    poll.registry().register(&mut listener, SERVER, Interest::READABLE)?;

    loop {
         poll.poll(&mut events, None)?;
         for event in events.iter() {
            match event.token() {
                SERVER => {
                    if event.is_readable() {
                        // listener 可读，可以调用 accept 了
                    }
                },
                _ => {}

            }
         }
    }

    return Ok(());
}
```
`Poll`并非只有一个，你完全可以创建一个线程，在里边新建一个`Poll`使用。你在`Tokio`多线程的背景下，多少能看到一些影子。

由于底层大量使用`libc`, 会存在不少 unsafe 代码，因此main函数的返回值不再是空的，而是Result，兼顾错误返回的情况。


## 涉及到的sytemcall
- `socket`
- `fcntl`
- `getsockopt`
- `setsockopt`
- `epoll_create`
- `epoll_create1`
- `epoll_wait`
- `epoll_ctl`
- `kqueue`
- `kevent`
  - 不同于epoll,控制、等待都是使用kevent完成；
- `bind`
- `accept`
- `listen`
- `accept4`

## 条件编译的宏 
- `#[cfg(target_os = "android")]`
- `#[cfg(any(target_os = "linux", target_os = "redox"))]`
- `#[cfg(not(target_os = "android"))]`
- `#[cfg(target_pointer_width = "32")]`
- `#[cfg(unix)]`
- `#[cfg_attr(all(feature = "os-poll", feature = "net"), doc = "```")]`
- `#[cfg(all(windows, feature = "os-ext"))]`