---
title: "GPU介绍"
page: true
aside: true
---

# GPU介绍
以英伟达cuda下的GPU为准

## GPU结构
![GPU结构简图](/gpu-structure.png)

值得注意：
1. GPU拥有多个SM
2. 每个SM拥有多个CUDA核心
3. 每个SM的CUDA核心可以访问L1缓存和共享内存
4. 每个CUDA核心负责执行一个线程
5. CUDA核心只负责数据计算和逻辑计算，不负责控制，SM负责控制
6. 所有的SM共享L2 cache
7. GPU显存全局共享
8. 访存速度：寄存器 > 共享内存 >= L1缓存 > L2 缓存 > GPU显存

## GPU计算流程
1. CPU申请一部分主机内存，存入要计算的数据
2. CPU向GPU发送指令，让GPU从GPU显存中开辟一块内存空间
3. CPU向GPU发送指令，GPU将要计算的数据从主机内存复制到GPU显存刚才开辟的空间
4. CPU向GPU发送计算指令，GPU驱动SM开始并行计算
5. GPU将计算结果从GPU显存拷贝到主机内存，通知CPU拿结果

## CUDA编程
使用CUDA编程，驱动GPU工作。CUDA可以简单理解为一个定制化的C语言，其语法结构主体上和C/C++很像，不能用普通的C/C++编译，要使用专门的编译器编译。CUDA编写的程序是并行运行的，跑在每一个CUDA核心上。假设有一个矩阵乘法运算，A矩阵（M行K列）和B矩阵（K行N列），如果放在CPU计算，CPU要计算出M*N中每一个数据，GPU却不同，每个CUDA核心只需要计算M*N中的一个数据即可。由于GPU的CUDA核心众多，可以完成M*N个CUDA核心并行计算，而CPU的核心数量少，无法支持那么多的并行量，比如 M3 Pro 入门版芯片的CPU核心是6+6的，意味着最多也就16个线程的并行计算。


<Giscus />