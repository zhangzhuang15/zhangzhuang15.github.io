---
title: "首页"
page: true
aside: true
---

## 安装

npm 是随着 node 被安装的，安装 node，就会自动安装对应版本的 npm

```shell
brew install nvm

nvm install --lts
```

[homebrew 安装方法](/tool/brew-tool#安装homebrew)


如果你是apple M系列芯片的机子，在使用 nvm 安装 v14 版本
的时候，会遭遇这样的问题：

```shell
../deps/v8/src/base/bit-field.h:43:29: error: integer value 31 is outside the valid range of values [0, 15] for this enumeration type [-Wenum-constexpr-conversion]
```

可以这样解决：
```shell
/usr/sbin/softwareupdate --install-rosetta --agree-to-license

arch -x86_64 zsh
nvm install 14
```

详情见[github | nodejs issues #52306](https://github.com/nodejs/node/issues/52306)

## 指定使用默认版本的 node

假设你用 nvm 安装了 node16.15.0, 并且希望每次打开 terminal 后，用到的
node 版本号就是 16.15.0，可以这样做：

```shell
# 以后就可以用 nvm use v16 切换到 v16.15.0了
nvm alias v16 v16.15.0

# 默认就使用 v16.15.0
nvm alias default v16.15.0
```

## 卸载 node

用 nvm 安装的，使用 `nvm uninstall` 卸载即可；

用 .dmg 安装的，需要：

```shell
sudo rm -rf /usr/local/{bin/{node,npm},lib/node_modules/npm,lib/node,share/man/*/node.*}
```

## npm国内镜像源

| name |                       url                       |
| :--: | :---------------------------------------------: |
| 腾讯 |      http://mirrors.cloud.tencent.com/npm/      |
| 淘宝 |         https://registry.npmmirror.com          |
| 华为 | https://mirrors.huaweicloud.com/repository/npm/ |


## nrm 
帮助你管理npm镜像源的工具

安装方式：
```shell
npm install -g nrm
```

<Giscus />
