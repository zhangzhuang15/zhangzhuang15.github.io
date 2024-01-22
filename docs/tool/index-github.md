---
title: "Github"
page: true
aside: true
---

## Actions 哪里找

[Github Marketplace](https://github.com/marketplace?type=actions&utm_campaign=2024Q2-Learning-Pathways&utm_medium=product&utm_source=github)

## Github Docs

[前往](https://docs.github.com/en)

- 想知道怎么用 API 和 GitHub 交互
- 想查看 workflow 怎么写
- 想找一份官网指导教程

## ssh port 20 总超时，怎么解决

为了更快地拉代码，推代码，通常会用 ssh 的方式 clone 代码，但有时会遇到 port 20 超时的问题，
可以将端口号换成 443 解决。

执行下面的指令，看看 ssh 能不能使用 443 端口：

```shell
ssh -T -p 443 git@ssh.github.com
```

如果顺利执行了，将以下内容加入到 `~/.ssh/config`:

```txt
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
```

然后再次执行 `git pull` 查看是否还超时；

如果依旧超时，添加新的 remote origin2:

```shell
git remote get-url origin
# output: git@github.com:zhangzhuang15/zhangzhuang15.github.io.git

git remote add origin2 ssh://git@ssh.github.com:443/zhangzhuang15/zhangzhuang15.github.io.git
git pull origin2
```

<Giscus />
