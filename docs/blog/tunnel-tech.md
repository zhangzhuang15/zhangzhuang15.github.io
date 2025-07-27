---
title: "tunnel技术"
page: true
aside: true
---

# tunnel技术
VPN，网络加速器，翻墙工具，背后都少不了tunnel技术。

## 从IP数据包说起
开发http或者tcp服务器，不是什么困难的事情，有一套固定的c代码模板，麻烦的地方无非是如何使用线程池、连接池、多路复用技术，增强程序的健壮。但你要知道，你发送的数据、接收的数据，都是tcp层面的数据。发送的时候，你不用关心tcp的报头是什么，只管发送你想要的数据；接收的时候，你也不用考虑解析tcp的报头，因为操作系统已经帮你解析好了，你接收到的数据，就是你想要的数据。

但是，你有没有考虑过一件事：如何直接发送ip数据报。回顾一下，http的报文是tcp报文的payload，tcp报文是ip报文的payload。当我们考虑发送ip报文的时候，我们就需要按照ip报文的格式，自己拼数据，并解析数据了。实现ip报文的发送和接收，还是使用`socket`，比如：
```c 
#include <sys/socket.h>

int main() {
    int fd = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);
    return 0;
}
```
这牵扯到了对`socket`更详细的使用说明，我们会在文章结尾介绍。

好了，现在我们能直接发送ip报文，可这有什么用呢？因为你可以随便玩弄ip数据报的payload部分。

试想一下，我们发送的tcp报文，无非就是遵从tcp报文的格式，然后塞进ip数据报的payload，然后发送出去，由另外一方提取、解析。如果，我们自己定义了一套格式，不再是tcp报文这种格式，并且对数据加密，加密方式只有我们知道，这种报文一旦发送出去了，另一侧只有安装好我们预先写出来的程序才能解析。这种感觉像什么呢？没错，专用通道！VPN、隧道技术、加速软件，就是靠这种思路。

## tun设备
使用`socket`虽然可以直接发送ip报文，但是这还不够。如果你开启了VPN，你访问网页的时候，就会触发ip数据报的发送，而这些ip数据报会先被VPN程序拦截，稍作处理之后，再发送出去。关键点在于，我们如何拦截这些ip数据报。`socket`只提供给我们发送、接收ip数据报的能力，但是没有给我们拦截电脑上其他程序发送和接收数据报的能力。

为了实现这一点，我们就要介绍`tun设备`了。`tun设备`不是一个物理设备，不会出现在你的主板上边，它是Linux 下的一种虚拟网络设备，。通常用来实现三层（IP 层）的隧道。向 tun 设备写入的数据，必须是完整的 IP 数据包（二层头不用，三层头起步）。也就是说，你写入的数据应该是以 IP 头开始的，后面跟着完整的 IP payload。

当创建一个`tun设备`后，你就可以像读写文件一样，读写`tun设备`。当你的应用程序往`tun设备`写入一些数据，在操作系统眼里，就相当于从外界接收到了ip数据报。当你的应用程序读取`tun设备`的时候，读取的就是一个ip数据报。


```c 
// 在linux创建 TUN 设备
#include <fcntl.h>
#include <linux/if_tun.h>
#include <sys/ioctl.h>
#include <string.h>

int tun_alloc(char *dev)
{
    struct ifreq ifr;
    // 创建tun设备
    int fd = open("/dev/net/tun", O_RDWR);
    memset(&ifr, 0, sizeof(ifr));
    ifr.ifr_flags = IFF_TUN | IFF_NO_PI; // TUN模式，不带包信息
    if (*dev)
        strncpy(ifr.ifr_name, dev, IFNAMSIZ);
    // 操作系统会自动为tun设备起一个名字，通过
    // ifr.ifr_name 告诉你
    ioctl(fd, TUNSETIFF, &ifr);
    strcpy(dev, ifr.ifr_name);
    return fd;
}
```
> IFF_NO_PI 是一个 flag，意思是不带额外包信息。
> 默认情况下，TUN/TAP 设备每读写一次数据，操作系统会在每个包前加上 4 字节的“包信息（Packet Information, PI）”：
> 这 4 字节里，主要包含协议类型（IPv4/IPv6）、一些标志。
> 如果设置了 IFF_NO_PI，tun设备读出来的数据就是纯粹的 IP 数据包，没有这 4 字节头；tap设备读出来的数据就是纯粹的数据链路层数据报。

tun设备有了，说好的ip数据报拦截呢？

神奇之处在于，我们可以为tun设备分配IP地址：
```shell 
sudo ip addr add 10.0.0.1/24 dev tun0
sudo ip link set tun0 up
```
> 假设上面的c代码创建的tun设备名字叫做tun0

更神奇的地方是，我们可以为这个ip地址配置路由转发：
```shell 
# 所有发送到主机的ip数据报都会发送给tun0
sudo ip route add default dev tun0

# 源IP地址是 8.8.8.8/32 的ip数据报才会发送给tun0
sudo ip route add 8.8.8.8/32 dev tun0
```

这不就连上了嘛？你需要做的就是写个程序，不断读取tun0，不就截下这些ip数据报了嘛，然后你在程序里使用socket发送一下，不就把ip数据报放行了嘛。

这里有一个开源项目，基于icmp实现的tunnel,[icmptunnel | Github](https://github.com/jamesbarlow/icmptunnel/blob/master/src/tun-device.c#L71)

## http 流量代理
我们用tun设备的方式，实现了ip数据报的拦截和再发送，如果我们只想拦下http报文，有没有什么方便的方式呢？

在macOS，我们可以使用`networksetup`设置系统级别的http代理设置。举例：把所有 HTTP 流量代理到本地 8080 端口。
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

这种是有应用场景的，比如网络加速器。网络加速器程序在启动之后，可以设置好系统的http代理，然后启动一个监听服务器，将所有http报文转发给加速服务器。这些加速服务器在网络加速服务器上的表现，就是各个优质站点的配置、选择，比如香港的站点服务器、东京的站点服务器。



## wireshark般的抓包
无论是tun设备，还是http流量代理，我们都要写个监听程序，还要给出一些设置，才能截获电脑上的ip数据报。那有没有一种方式，不需要配置，直接就能截获电脑上的ip数据报呢？

wireshark就是典范，它做到了。它背后的原理，是使用了 `libcap` 库。

libpcap 是一种抓包库，能让你的程序“监听”网卡上流动的所有数据包。最常见的是利用 Linux 的 packet socket 机制（AF_PACKET），通过 socket() 系统调用创建一个原始套接字。相关 system call 主要有：
- `socket(AF_PACKET, SOCK_RAW, ...)`, 创建一个能捕获所有经过网卡的原始包的套接字。
- `bind()`, 绑定到具体的网卡（如 eth0, wlan0）。
- `recvfrom()` 或 `read()`, 不断读取抓到的数据包内容。

## 翻墙工具
翻墙工具会创建一个tun设备，把你的所有流量“包裹”起来（封装成允许通过防火墙的协议，比如HTTPS）。
所有本地发出的数据包先送到tun设备，被翻墙程序“截获”，加密后通过被允许的端口（如TCP 443）发到国外服务器。

国外服务器解密，还原数据包，然后帮你访问外网，收到返回数据后再加密发回来。

本地翻墙工具解密后，把数据包送回系统，让你的电脑像直接访问外网一样。

## 防火墙
防火墙就像网络的“门卫”，负责检查进出电脑或网络的数据包，决定哪些能放行，哪些要拦截。

防火墙的规则可以按协议（比如TCP、UDP、ICMP）、端口号（比如80、443）、源/目的IP地址等条件设定。

通常允许通过的协议：

常见的有 HTTP（TCP 80）、HTTPS（TCP 443）、DNS（UDP 53）、SSH（TCP 22）等。
防火墙会根据公司、家庭或服务器的需求，允许或拦截不同协议/端口的数据包。

所有IP包都允许通过吗？

不会！防火墙只允许符合规则的数据包通过，其他包会被丢弃或拒绝。比如很多企业防火墙会禁止 P2P、游戏、ICMP（ping）等协议。


## 更罕见的socket用法
### socket的三个入参搭配
先介绍一下`socket`函数的三个入参。

1. 第一个参数：domain（协议族）
常见的有：
- AF_INET：IPv4
- AF_INET6：IPv6
- AF_UNIX / AF_LOCAL：本地进程间通信（Unix域套接字）
- AF_PACKET：底层物理层（常用于抓包等）

2. 第二个参数：type（套接字类型）
常见的有：
- SOCK_STREAM：流式套接字（TCP）
- SOCK_DGRAM：数据报套接字（UDP）
- SOCK_RAW：原始套接字（可自定义协议头）

3. 第三个参数：protocol（协议）
第三个参数决定具体用什么协议。通常直接填 0，表示根据前两个参数自动选择合适的协议。有时你需要显式指定，如：
- IPPROTO_TCP（TCP协议，值为6）
- IPPROTO_UDP（UDP协议，值为17）
- IPPROTO_ICMP（ICMP协议，值为1）
- IPPROTO_RAW（原始IP，值为255）
还有很多其他如 IPPROTO_IP, IPPROTO_SCTP 等
> 注意：不是所有 type 都能配所有 protocol。例如 SOCK_STREAM 配 IPPROTO_UDP 是不合法的。

第三个参数的选择建议：
- 一般用途（TCP/UDP）：直接填0即可（自动选择）。
- 需要指定协议（如原始套接字/抓包/特殊协议）：查阅对应协议编号，显式填写。
- 协议编号常见定义（头文件 `<netinet/in.h>`、`<netinet/ip.h>`等有定义）：

三个参数的常见搭配：
|domain|type|protocol|意义|
|:--:|:--:|:--:|:--:|
|AF_INET|SOCK_STREAM|0 或 IPPROTO_TCP|IPv4 TCP套接字|
｜AF_INET	｜SOCK_DGRAM	｜0 或 IPPROTO_UDP	｜IPv4 UDP套接字｜
｜AF_INET	｜SOCK_RAW	｜IPPROTO_ICMP	｜IPv4 原始ICMP套接字｜
｜AF_INET	｜SOCK_RAW	｜IPPROTO_RAW	｜IPv4 原始套接字（自定义IP头）｜
｜AF_PACKET	｜SOCK_RAW	｜htons(ETH_P_ALL)	｜Linux下抓包｜
｜AF_UNIX	｜SOCK_STREAM	｜0	｜本地流套接字｜
｜AF_INET6	｜SOCK_DGRAM	｜0 或 IPPROTO_UDP	｜IPv6 UDP套接字｜

### 用socket抓包
AF_PACKET 允许你直接收发以太网帧（包括所有协议类型的数据包），三个参数的典型搭配如下：
- domain（第一个参数）：AF_PACKET
- type（第二个参数）：SOCK_RAW（抓所有包）或 SOCK_DGRAM（只抓协议数据部分，去掉帧头）
- protocol（第三个参数）：
    - htons(ETH_P_ALL)：抓所有以太网协议的数据包
    - htons(ETH_P_IP)（只抓IP包）
    - htons(ETH_P_ARP)（只抓ARP包）


抓包过程：

第一步，创建套接字
```c 
#include <sys/types.h>
#include <sys/socket.h>
#include <netpacket/packet.h>
#include <net/ethernet.h> // ETH_P_ALL
#include <unistd.h>
#include <stdio.h>

int sockfd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
```

第二步，绑定指定网卡（可选）
```c 
#include <net/if.h>
#include <string.h>
#include <sys/ioctl.h>
#include <netinet/if_ether.h>
#include <net/if_arp.h>
#include <net/if_packet.h>

struct sockaddr_ll sll;
memset(&sll, 0, sizeof(sll));
sll.sll_family = AF_PACKET;
sll.sll_protocol = htons(ETH_P_ALL);

// 获取网卡索引
int ifindex = if_nametoindex("eth0"); // 换成你的网卡名
sll.sll_ifindex = ifindex;

bind(sockfd, (struct sockaddr*)&sll, sizeof(sll));
```

第三步，读数据
```c
unsigned char buffer[2048];
while (1) {
    ssize_t numbytes = recvfrom(sockfd, buffer, sizeof(buffer), 0, NULL, NULL);
    if (numbytes > 0) {
        // buffer 里就是整个以太网帧
        // 你可以解析 buffer 前14字节为以太网头
    }
}
```


linux完整代码：
```c 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/if_ether.h>
#include <net/if.h>
#include <netpacket/packet.h>
#include <unistd.h>

int main() {
    int sockfd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
    if (sockfd < 0) {
        perror("socket");
        exit(1);
    }

    unsigned char buffer[2048];
    while (1) {
        ssize_t len = recvfrom(sockfd, buffer, sizeof(buffer), 0, NULL, NULL);
        if (len > 0) {
            printf("Received packet of length %zd\n", len);
            // 这里可以解析以太网帧
        }
    }
    close(sockfd);
    return 0;
}
```

macOS完整代码：
```c 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <net/if.h>
#include <netinet/if_ether.h>
#include <sys/time.h>
#include <net/bpf.h>
#include <errno.h>

#define BUF_SIZE 4096

int open_bpf() {
    char dev[32];
    int fd = -1;
    // macOS: /dev/bpf0 ~ /dev/bpf255
    for (int i = 0; i < 256; ++i) {
        snprintf(dev, sizeof(dev), "/dev/bpf%d", i);
        fd = open(dev, O_RDWR);
        if (fd != -1) {
            return fd;
        } else if (errno != ENOENT && errno != EBUSY) {
            perror(dev);
        }
    }
    return -1;
}

int main() {
    int bpf = open_bpf();
    if (bpf == -1) {
        fprintf(stderr,
            "Error: Could not open any /dev/bpf* device.\n"
            "Check if you have root privileges (use sudo), and that /dev/bpf* exists.\n"
            "Try running 'sudo tcpdump' once to trigger bpf device creation.\n"
            "Or reboot your computer if no bpf devices exist.\n");
        exit(1);
    }

    struct ifreq ifr;
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, "en0", sizeof(ifr.ifr_name) - 1); // 确认网卡名，用 ifconfig 查看

    if (ioctl(bpf, BIOCSETIF, &ifr) < 0) {
        perror("BIOCSETIF (check interface name and permissions)");
        close(bpf);
        exit(1);
    }

    unsigned int buf_len = BUF_SIZE;
    if (ioctl(bpf, BIOCGBLEN, &buf_len) < 0) {
        buf_len = BUF_SIZE;
    }

    // 立即模式
    unsigned int im = 1;
    ioctl(bpf, BIOCIMMEDIATE, &im);

    // 混杂模式
    unsigned int promisc = 1;
    ioctl(bpf, BIOCPROMISC, &promisc);

    char *buf = malloc(buf_len);
    if (!buf) {
        perror("malloc");
        close(bpf);
        exit(1);
    }

    printf("Start capturing packets on interface %s...\n", ifr.ifr_name);
    while (1) {
        ssize_t n = read(bpf, buf, buf_len);
        if (n <= 0) continue;
        char *ptr = buf;
        while (ptr < buf + n) {
            struct bpf_hdr *bh = (struct bpf_hdr *)ptr;
            unsigned char *packet = ptr + bh->bh_hdrlen;
            int plen = bh->bh_caplen;
            printf("Got a packet of length %d\n", plen);
            if (plen >= sizeof(struct ether_header)) {
                struct ether_header *eth = (struct ether_header *)packet;
                printf("EtherType: 0x%04x\n", ntohs(eth->ether_type));
            }
            ptr += BPF_WORDALIGN(bh->bh_hdrlen + bh->bh_caplen);
        }
    }
    free(buf);
    close(bpf);
    return 0;
}
```