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