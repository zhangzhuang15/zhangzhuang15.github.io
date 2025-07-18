---
title: "tunnel技术"
page: true
aside: true
---

# tunnel技术
VPN，网络加速器，翻墙工具，背后都少不了tunnel技术。

## 从IP数据包说起
开发http或者tcp服务器，不是什么困难的事情。

IFF_NO_PI 是一个 flag，意思是不带额外包信息。
默认情况下，TUN/TAP 设备每读写一次数据，操作系统会在每个包前加上 4 字节的“包信息（Packet Information, PI）”：
这 4 字节里，主要包含协议类型（IPv4/IPv6）、一些标志。
如果设置了 IFF_NO_PI，读出来的数据就是纯粹的 IP 数据包，没有这 4 字节头。

```c 
// 创建 TUN 设备代码片段
#include <fcntl.h>
#include <linux/if_tun.h>
#include <sys/ioctl.h>
#include <string.h>

int tun_alloc(char *dev)
{
    struct ifreq ifr;
    int fd = open("/dev/net/tun", O_RDWR);
    memset(&ifr, 0, sizeof(ifr));
    ifr.ifr_flags = IFF_TUN | IFF_NO_PI; // TUN模式，不带包信息
    if (*dev)
        strncpy(ifr.ifr_name, dev, IFNAMSIZ);
    ioctl(fd, TUNSETIFF, &ifr);
    strcpy(dev, ifr.ifr_name);
    return fd;
}
```

给 TUN 设备分配 IP 地址
```shell 
sudo ip addr add 10.0.0.1/24 dev tun0
sudo ip link set tun0 up
```

配置系统路由
```shell 
sudo ip route add default dev tun0

# 或者只某一段流量
sudo ip route add 8.8.8.8/32 dev tun0
```
这样你的所有（或指定）IP包会被发往 tun0，用户态程序可以读取处理。


举例：把所有 HTTP 流量代理到本地 8080 端口
```shell 
networksetup -listallnetworkservices

# 假设你的 Wi-Fi 服务名是 "Wi-Fi"
networksetup -setwebproxy "Wi-Fi" 127.0.0.1 8080

# 设置 HTTPS 代理（如果需要）
networksetup -setsecurewebproxy "Wi-Fi" 127.0.0.1 8080

# 取消代理（恢复正常）
networksetup -setwebproxystate "Wi-Fi" off
networksetup -setsecurewebproxystate "Wi-Fi" off
```

```c 

// 简单的代理服务器框架（仅演示监听端口）
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

int main() {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr;

    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080); // 监听 8080
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    bind(sockfd, (struct sockaddr *)&addr, sizeof(addr));
    listen(sockfd, 5);

    printf("Proxy listening on 127.0.0.1:8080\n");

    while (1) {
        int clientfd = accept(sockfd, NULL, NULL);
        // 此处应处理 HTTP 请求，可以转发给外网服务器
        // 示例：直接关闭
        close(clientfd);
    }
    close(sockfd);
    return 0;
}
```

修改系统的 SOCKS5/HTTP 代理设置（让所有请求走代理端口）。


libpcap 能抓到网卡所有流量的底层原理是什么？用到了哪些系统调用？
libpcap 是一种抓包库，能让你的程序“监听”网卡上流动的所有数据包。
最常见的是利用 Linux 的 packet socket 机制（AF_PACKET），通过 socket() 系统调用创建一个原始套接字。
相关 system call 主要有：
socket(AF_PACKET, SOCK_RAW, ...)：创建一个能捕获所有经过网卡的原始包的套接字。
bind()：绑定到具体的网卡（如 eth0, wlan0）。
recvfrom() 或 read()：不断读取抓到的数据包内容。


翻墙工具（如VPN）如何让本地IP包抵达外网并接收外网返回的数据？
翻墙工具会创建一个tun设备，把你的所有流量“包裹”起来（封装成允许通过防火墙的协议，比如HTTPS）。
所有本地发出的数据包先送到tun设备，被翻墙程序“截获”，加密后通过被允许的端口（如TCP 443）发到国外服务器。
国外服务器解密，还原数据包，然后帮你访问外网，收到返回数据后再加密发回来。
本地翻墙工具解密后，把数据包送回系统，让你的电脑像直接访问外网一样。

网络加速工具用到了tun设备吗？如何做到加速？
很多网络加速工具确实用到了tun设备。

它们会创建一个虚拟网卡（tun），把你电脑的网络流量“拦截”下来，经过自己的加速处理，再发送出去。
加速原理可能包括：数据压缩、智能路由（选择最快线路）、协议优化、丢包重传等。
流程（简化版）：

你的程序把数据发到tun设备（虚拟网卡）。
网络加速工具在用户态“截获”这些数据，优化处理后转发到外网。
收到外网返回的数据后，再交给tun设备让系统正常处理。

防火墙就像网络的“门卫”，负责检查进出电脑或网络的数据包，决定哪些能放行，哪些要拦截。
防火墙的规则可以按协议（比如TCP、UDP、ICMP）、端口号（比如80、443）、源/目的IP地址等条件设定。

通常允许通过的协议：

常见的有 HTTP（TCP 80）、HTTPS（TCP 443）、DNS（UDP 53）、SSH（TCP 22）等。
防火墙会根据公司、家庭或服务器的需求，允许或拦截不同协议/端口的数据包。

所有IP包都允许通过吗？

不会！防火墙只允许符合规则的数据包通过，其他包会被丢弃或拒绝。
比如很多企业防火墙会禁止 P2P、游戏、ICMP（ping）等协议。

tun 设备（tunnel device）是 Linux 下的一种虚拟网络设备，通常用来实现三层（IP 层）的隧道。向 tun 设备写入的数据，必须是完整的 IP 数据包（二层头不用，三层头起步）。也就是说，你写入的数据应该是以 IP 头开始的，后面跟着完整的 IP payload。


[icmptunnel | Github](https://github.com/jamesbarlow/icmptunnel/blob/master/src/tun-device.c#L71)