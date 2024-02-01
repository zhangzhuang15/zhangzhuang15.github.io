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

## 改造jispwoso主题
jispwoso主题下，你可以看到红颜色显示的当前git分支名，对我来说，这无法满足我。

因为在开发的时候，分支名提供的信息不够，很快我就会忘记当前分支里面有哪些功能在开发。

我的解决方式就是，给当前分支增加 description, 你可以在[vscode tasks](/tool/vscode-tasks#给当前\ git\ branch\ 分子加入\ description)找到
实现方法。

接下来，就对jispwoso主题改造一下，就可以追加显示分支的description了。

我的电脑上，jispwoso主题配置文件位于`～/.oh-my-zsh/themes/jispwoso.zsh-theme`，只需将里边的内容更新为:
```shell
local ret_status="%(?:%{$fg_bold[green]%}➜ :%{$fg_bold[red]%}➜ %s)"

# Output the description of current branch
function git_current_branch_description() {
  local description
  description=$(git branch --show-current | awk '{print "branch."$1".description"}' | xargs git config --get)

  echo "$description"
}

local description=$(git_current_branch_description)

if [ -z $description ]
then 
  PROMPT=$'%{$fg[green]%}%n@%m: %{$reset_color%}%{$fg[blue]%}%/ %{$reset_color%}%{$fg_bold[blue]%}$(git_prompt_info) %{$fg_bold[blue]%} % %{$reset_color%}
${ret_status} %{$reset_color%} '
else 
  PROMPT=$'%{$fg[green]%}%n@%m: %{$reset_color%}%{$fg[blue]%}%/ %{$reset_color%}%{$fg_bold[blue]%}$(git_prompt_info) %{$fg_bold[blue]%}\ndescription:%{$fg_bold[white]%}$description%{$fg_bold[blue]%} % %{$reset_color%}
${ret_status} %{$reset_color%} '
fi

PROMPT2="%{$fg_blod[black]%}%_> %{$reset_color%}"

ZSH_THEME_GIT_PROMPT_PREFIX="git:(%{$fg[red]%}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%{$reset_color%}"
ZSH_THEME_GIT_PROMPT_DIRTY="%{$fg[blue]%}) %{$fg[yellow]%}✗%{$reset_color%}"
ZSH_THEME_GIT_PROMPT_CLEAN="%{$fg[blue]%})"
```

🎉🎉🎉

不得不吐槽shell语法，太不好理解了，我总是写错😭

<Giscus />
