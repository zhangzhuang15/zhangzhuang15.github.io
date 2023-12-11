---
title: "rust CLI tool"
page: true
aside: true
---

# Rust CLI 工具

## wdcrypt

加密文件夹。

安装：

```shell
rust install wdcrypt
```

用法：

```shell
mkdir demo
cd ./demo
echo "hello world" > hello.txt

# demo 文件夹里的所有文件都会被加密；
# demo文件夹会生成一个 .secret.key 的文件，这个是密钥，
# 你可以单独保存它，如果没有它，无法解密；
wdcrypt encrypt

# 刚才加密的文件都会被解密
wdcrypt decrypt
```

<Giscus />
