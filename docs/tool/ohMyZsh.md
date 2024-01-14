---
title: "Oh-my-zsh"
page: true
aside: true
---

# Oh-my-zsh

## 安装

```shell
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

# .zshrc 备份
cp ~/.zshrc ~/.zshrc.orig

cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc

# .zshrc.orig 中的代码加入到.zshrc中
```

## my config

```shell
ZSH_THEME="jispwoso"
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
  vscode
  node
  nvm
  golang
  sudo
  rust
  brew
  extract
)
```

<Giscus />
