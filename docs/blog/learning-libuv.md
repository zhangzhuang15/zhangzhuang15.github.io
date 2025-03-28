---
title: "libuv学习笔记"
page: true
aside: true
---

# libuv学习笔记 

## Queue
- stream-write-queue 
- stream-read-queue 
- stream-write-completed-queue
- loop-pending_queue
- loop-watcher_queue

什么时机往这些队列加入节点，每个节点的cb函数是否拥有同样的入参数签名？

## Handles 
- loop-closing-handles 
- loop-timer-heap 
- uv_timer-timer_cb

## event loop 
- uv__io_poll(i.g. epoll, kqueue)

## Example
This code is from `docs/code/cgi/main.c` in libuv source codebase.
```c
void on_new_connection(uv_stream_t *server, int status) {
    if (status == -1) {
        // error!
        return;
    }

    uv_tcp_t *client = (uv_tcp_t*) malloc(sizeof(uv_tcp_t));
    uv_tcp_init(loop, client);
    if (uv_accept(server, (uv_stream_t*) client) == 0) {
        invoke_cgi_script(client);
    }
    else {
        uv_close((uv_handle_t*) client, NULL);
    }
}

int main() {
    loop = uv_default_loop();

    uv_tcp_t server;
    uv_tcp_init(loop, &server);

    struct sockaddr_in bind_addr;
    uv_ip4_addr("0.0.0.0", 7000, &bind_addr);
    uv_tcp_bind(&server, (const struct sockaddr *)&bind_addr, 0);
    int r = uv_listen((uv_stream_t*) &server, 128, on_new_connection);
    if (r) {
        fprintf(stderr, "Listen error %s\n", uv_err_name(r));
        return 1;
    }
    return uv_run(loop, UV_RUN_DEFAULT);
}
```
So, what happened ?

First, create `loop` instance, a C struct;

Second, call `uv_tcp_init`, bind `loop` and `server`, `server->loop` can access `loop`;

Third, call `uv_listen`, let's say in detail:
1. `server` has `io_watcher` property, which saves fd, expected event and callback. In other words, if we get expected event, we will invoke callback with fd as its argument.
2. `loop` add `io_watcher` to its `watchers` property, which is a dynamic array.And `server`'s fd is used as the index of `watchers`.
3. invoke `listen` system call, server is running.

Fourth, call `uv_run`, we get into event loop. In event loop, we will call `uv__io_poll`, in other words, we will invoke `epoll`, `kqueue` or something like that.What does `loop` instance do ? It walks its `watchers` property, fetches fd and expected event, and saves them in `poll_fds` property, which is array. Then call `epoll`, `kqueue` or `poll` with `poll_fds`.After these system call return, we know which fd is active, so we can use `loop->watchers` to get corresponding callback, and invoke it. In this example, when server is ready to call `accept` whithout blocking, callback will invoke `accept`, get accepted fd and bind it to server `accepted_fd` property, then call `server->connection_cb(accpted_fd)`, as a result, `on_new_connection` will be invoked.

Finally, if `loop` finds its watchers or timers are empty, or force-exit-flag is true, it will break out event loop, and our process exits.

Conclusion: when we call `uv_` API, we will register a watcher to `loop` instance, watcher can tell `loop` fd, event and callback, every time `loop` traps into `uv__io_poll`, it will grasp what event is happened and which fd is active, then it will take callback from its `watchers`, and invoke callback with the active fd.