---
title: "git详细解析——git的实现"
page: true
aside: true
---

# git 详细解析——git 的实现

很多文章介绍的是 git 基本概念以及它的使用，但针对 git 是如何实现的，每一个指令到底是做了什么事情，没有很好的说明。本人发现了一个项目[gitlet](https://github.com/maryrosecook/gitlet), 作者用 javascript 实现了 git 的主要指令，简单又容易理解。基于他的项目，有了本文。

## `git init`

```js
const structure = {
  index: "",
  objects: {},
  config: "",
  HEAD: "ref: refs/heads/master\n",
  refs: {
    heads: {},
  },
};
```

按照上述结构，在`.git`目录下，生成对应的文件。比如，生成`.git/refs/heads`文件夹，生成`.git/HEAD`文件，其内容是"ref: refs/heads/master\n"。

## `git add`

`add`一个文件，就是把它关联到 `.git/index`文件中。`.git/index`文件有如下格式：

```txt
./a/b/hello.txt 0 wqqerwgdsfgsdgsg
./a/c/main.cc   0 wererertrewtttrt
```

- 第一列表示文件路径
- 第二列表示这个文件在 git 系统里的状态
  - 0， 表示没有冲突
  - 1， 表示有冲突，文件内容是冲突双方共有的那一部分，也就是没有冲突
  - 2, 表示有冲突，文件内容是被合并方的内容，比如 a 合并到 b 里边，这里就是指 a 的内容
  - 3， 表示有冲突，文件内容是合并方的内容，比如 a 合并到 b 里边，这里就是指 b 的内容。
- 第三列表示文件内容的 16 位 hash 值

`add` 一个文件，完成的只有两件事：

- 在 index 文件内，生成一行记录
- 在 `.git/objects`里边，存储这个文件

假设文件的内容经过计算，得到 hash 值为 qweffrthbgdfrres, 它的内容就会存入`.git/objects/qw/effrthbgdfrres`文件中。

## `git remove`

删除文件和添加一个文件相似，就是从`.git/index`文件中删除文件记录，再从磁盘中删除这个文件即可。

## `git commit`

这个操作略显复杂，需要使用具体的例子理解。

假设`.git/index`的内容：

```txt
./a/b/hello.txt 0 wqqerwgdsfgsdgsg
./a/c/main.cc   0 wererertrewtttrt
hello.c         0 hhfdsafahhfdsafh
```

首先会将其转化为一个 treeObject:

```js
const treeObject = {
  a: {
    b: {
      "hello.txt": "wqqerwgdsfgsdgsg",
    },
    c: {
      "main.cc": "wererertrewtttrt",
    },
  },
  "hello.c": "hhfdsafahhfdsafh",
};
```

再将上述结构转为一个字符串：

```txt
tree tree blob wqqerwgdsfgsdgsg hello.txt
b
a

tree tree blob wererertrewtttrt main.cc
c
a

blob hhfdsafahhfdsafh hello.c
```

接下来是计算这个字符串的 hash 值，假设计算结果是 qwsxzasdcfvvcdrh, 就会把这段字符串写入`.git/objects/qw/sxzasdcfvvcdrh`文件中。

接下来是根据“qwsxzasdcfvvcdrh”生成 commit hash 值的过程。

先要查看`.git/HEAD`的内容，假设内容：

```txt
ref: refs/heads/feautreNew
```

然后读取文件`.git/refs/heads/featureNew`的内容，其内容是一个 hash 字符串，比如说是`b2e002a9872fe7a463e44c11c671441c3f4ea8f8`。

然后，我们按照固定的格式拼接出来一个字符串：

```txt
commit qwsxzasdcfvvcdrh
parent b2e002a9872fe7a463e44c11c671441c3f4ea8f8
Date:  Fri Dec 12 10:23:12 2025 +0800

  fix some bugs
```

"fix some bugs"就是 `git commit`的时候提交的内容。

将这段字符串做 hash 处理，得到的就是 commit hash，假设是 eertyhgbfdvcfghu。

接下来在 `.git/objects/ee/rtyhgbfdvcfghu`存储这段字符串，并且将`.git/refs/heads/featureNew`的内容更新为 eertyhgbfdvcfghu。

ok, 大功告成。

## `git branch`

如果用于查询分支，这条命令就是读取`.git/refs/heads`目录下的文件名，在终端打印。`.git/HEAD`记录当前的分支是哪一个，根据这点，就可以在终端输出结果里添加“\*”标记，告知当前分支是哪个。

如果用于创建一个新的分支，比如`git branch hello`, 且此时`.git/HEAD`的内容如下：

```txt
ref: refs/heads/feautreNew
```

做的事情就是，读取`.git/refs/heads/featureNew`文件的内容，假设是 wedsxcvgbfnhjiuo, 然后创建`.git/refs/heads/hello`文件，在这个文件里写入 wedsxcvgbfnhjiuo。

## `git checkout`

切换分支，比如`git checkout hello`, 就是将`.git/HEAD`文件的内容更新为`ref: refs/heads/hello`，接下来要做的事情，就是将磁盘里的文件变成 hello 分支的内容。这部分工作略显麻烦，却不难理解。

假设当前的分支是 working，要切换到的分支还是 hello。文件`.git/refs/heads/working`存储了 commit hash，通过这个 hash 值，我们可以在`.git/objects`文件夹下，找到记录当时 commit 记录的文件，commit 记录中包含了文件名和文件的 hash 值，hash 值就可以用来比较不同。假设我们对 working 分支和 hello 分支执行上述操作，得到下述结果：

```js
const workingCommitResult = {
  "hello.txt": "qwscdvfgbhytrghn",
  "main.cc": "cccccccccccccccc",
  "work.c": "oitrmkguijbvvbnc",
};

const helloCommitResult = {
  "hello.txt": "cccffdrrewsdcxxa",
  "main.cc": "cccccccccccccccc",
};
```

比对这两个结果，你就知道，从 working 分支切换到 hello 分支，`hello.txt`的内容要发生变化，`main.cc`内容不变，`work.c`没有被跟踪。如此一来，我们只需要将`hello.txt`的内容替换为 `.git/objects/cc/cffdrrewsdcxxa`就可以了。

但是，光比较 working 分支和 hello 分支的 commit 结果还不行，如果你修改了`hello.txt`文件，但没有 commit，就导致和`.git/objects/qw/scdvfgbhytrghn`文件内容不一致了，这就必须要做出拦截提示，让用户先 commit 已经修改的，再切换分支。

对于一个文件，在 working 分支、hello 分支、磁盘，会有这样的情况：
| working 分支 | hello 分支 | 磁盘 | 状态 |
|:--:|:--:|:--:|:--:|
| 存在 | 存在 | 存在 | working 分支或者 hello 分支有一方和磁盘存储的相同, Modify |
| 存在 | 存在 | 存在 | working 分支和 hello 分支都和磁盘存储的不相同, Conflict |
| 不存在 | 存在 | 不存在 | Add |
| 存在 | 不存在 | 不存在 | Add |
| 存在 | 不存在 | 存在 | Delete |
| 不存在 | 存在 | 存在 | Delete |

在确保没有 Conflic 状态的文件，根据状态，对于 Add 状态的文件，在本地磁盘中创建，对于 Delete 状态的文件，在本地磁盘中删除，对于 Modify 状态的文件，在本地磁盘中覆盖重写。

> checkout 可以是一个分支名，也可以是一个 commit hash 值，如果是 commit hash 值，会把这个 commit hash 值写入`.git/HEAD`，导致 HEAD 没有指向一个具体的分支，因此就会出现 HEAD detached 的状态。

## `git diff`

比较两个分支的原理已经在上一节中介绍了。

## `git merge`

假设我们位于分支 a, 执行 `git merge b`。

首先就是比较分支 a、分支 b、磁盘，看看是否存在磁盘里的文件更新，没有 commit 的情况，如果没有，再往下继续。验证冲突的思路，在`git checkout`一节已经介绍了。

如果分支 a 本身就领先于分支 b，那么不需要做任何事情，此时分支的情况如下：

```txt
               branch b here                                   branch a here
commit 1 ------> commit 2 -----> commit 3 -----> commit 4 -----> commit 5
```

如果判断这个情况呢？通过`.git/refs/heads/a`的 commit hash，找到 commit 记录，在上边`git commit`一节中，我们介绍了 commit 记录中还包含 parent commit 的 hash 值，利用这一点，我们就能找到 commit 4 的记录，依次往复，commit 3, commit 2, commit 1 的记录我们都能拿到。而 `.git/refs/heads/b`能拿到 commit2 的 hash，自然就可以判断出来了。

如果分支 b 领先 分支 a, 分支情形如下：

```txt
               branch a here                                   branch b here
commit 1 ------> commit 2 -----> commit 3 -----> commit 4 -----> commit 5
```

此时，将`.git/refs/heads/b`的 hash 值替换进`.git/refs/heads/a`, 然后根据 hash 值拿到 commit 记录，再根据 commit 记录解析出文件名、文件 hash 值，然后写入到`.git/index`就可以了。

接下来就是正常情况下，把 b 合并到 a 了。注意，这个情况，b 和 a 之间会有冲突。

第一步，将分支 b 的 hash 值写入 `.git/MERGE_HEAD` 文件;

第二步，向`.git/MERGE_MSG`文件写入如下格式的内容：

```txt
Merge b into a

Conflicts:
a.txt
main.cc

```

这一步会获取分支 a 和分支 b 哪些文件冲突了，如果没有，那么`Conflicts`开始的文字不会出现.

第三步，将分支 b hash 值查询出来的文件、stage、文件 hash 合并到 `.git/index`里边，这里边也有讲究，对于没有冲突的、并属于修改状态的文件：

```txt
c.txt 0 <分支b版本的c.txt的hash值>
```

对于没有冲突的、并属于新增的文件：

```txt
c.txt 0 <分支b版本的c.txt的hash值>或者<分支a版本的c.txt的hash值>，哪个取到值就用哪个
```

这个情况是说，c.txt 属于新增的文件，它可能是分支 b 新增的，也可能是分支 a 新增的，因此就会出现该文件的 hash 值只在分支 a 和分支 b 其中一方出现。

对于有冲突的文件：

```txt
c.txt 1 <磁盘当前c.txt的hash值>
c.txt 2 <分支b版本的c.txt的hash值>
c.txt 3 <分支a版本的c.txt的hash值>
```

最后一步，就是将磁盘中的文件同步, 对于没有冲突的文件，直接用分支 b 版本或者分支 a 版本（这里二选一，还是因为有的文件可能只在其中一个分支里有）的内容替换即可。对于有冲突的文件，需要采取如下格式写入：

```txt
<<<<<<<
这里是分支a版本的内容
=======
这里是分支b版本的内容
>>>>>>>
```

大功告成！

注意，实际的 git 会比这里更复杂，会区分到哪些行不同，这里为了简化说明基本思路，只着眼文件内容整体的不同，不深入到具体哪些行不同的实现。

在完成磁盘中文件的同步后，还有一步`git commit`，这里边做了什么事情，上边的章节已经介绍了，不再赘述，只需要知道，这个时候 commit 所需要的 msg 直接从`.git/MERGE_MSG`读取。也正是因为这个环节的存在，才揭示了为什么执行`git merge`会多出来一条 commit 记录。

## `git push`

`git push`可以看成本地分支到远程分支的`git merge`。

假设我们在分支 b, 然后执行`git push origin b`， 意思就是将分支 a 合并到远程分支 b。

首先要做的事情，就是在`.git/config`文件中查询到`origin`的 url 是什么，利用这个 url, 发送特定请求，获取分支 b 当前记录的 hash 值，这个中间是如何实现的，不是重点。

如果 hash-a 和 hash-b 一样，说明不需要 push 了。

如果 hash-a 是 hash-b 的祖先 hash 值，也不需要 push 了，b 已经是最新的了。

如果 hash-b 不是 hash-a 的祖先 hash 值，说明分支 b 在这之前，被 push 过了，导致版本和分支 a 对不上号，也就是有冲突了。典型的情况就是，当你想推送分支的时候，发现在几分钟前，你的同事推过了一次。这个时候，直接抛出冲突错误。

最后的情况就简单了，只需要将本地的`.git/objects`同步到远程仓库，将远程分支 b 的 hash 值替换为本地分支 a 的 hash 值，然后在本地`.git/refs/remotes/origin/b`也写入这个 hash 值。中间文件传送到远程的细节无需关心，它不影响我们的理解。

大功告成！

## `git fetch`

它可以简单理解为`git push`的反向操作，只是不需要完成合并到本地分支的操作。

假设我们在分支 a, 执行`git fetch origin b`。

还是要从`.git/config`中查询`origin`的 url, 并通过这个 url 发送特定请求，拿到远程分支 b 的 hash 值。

接下来往`.git/FETCH_HEAD`文件写入：

```txt
<b的hash值> branch b of <origin的url>
```

最后，把远程仓库的`.git/objects`同步到本地的`.git/objects`里边就可以了。你需要远程和本地会有冲突，因为如果内容上不同的话，它们的 hash 值就会不同，在`.git/objects`下的路径就会不同，于是，不可能出现路径一样，内容不一样的情况。

## `git pull`

`git pull origin b`, 相当于`git fetch origin b` + `git merge origin/b`。

`git fetch`的工作，我们已经在上一节介绍过了。`git merge origin/b` 和 `git merge`那一节介绍过的没有区别，在此不赘述了。

## `git clone`

假设我们执行`git clone https://fdsfas.com/ffds/cc.git`。

第一步，会创建一个 cc 文件夹。

第二步，在 cc 文件夹内执行`git init`。此时`.git/HEAD`的内容是`refs: refs/heads/master`。

第三步，在`.git/config`添加`origin=https://fdsfas.com/ffds/cc.git`的设置。

第四步，执行`git pull origin master`。

## `git status`

有了以上内容的铺垫，理解这里的逻辑，应该不算困难。

这个指令就是要打印出这些信息：

1. 哪些文件没有被 git 跟踪
2. 哪些文件即将被 commit
3. 哪些文件还没有 staged (该文件在磁盘的内容和`.git/index`内记录的内容不一样)
4. 哪些文件存在冲突

如何找到哪些文件没有被 git 跟踪呢？我们知道`.git/index`里边存储的是被跟踪的文件，那么我们可以读取项目根目录下所有的文件，然后筛除被跟踪的文件，剩下的就是没有被跟踪的文件了。

如何找到哪些文件将被 commit 呢？我们知道`.git/HEAD`记录的 hash 值是上一次 commit hash，利用这个 hash 值，我们从`.git/objects`里边可以找到上一次 commit 的时候，文件的 hash 值，那么我们用这些文件的 hash 值，和`.git/index`里边记录的文件 hash 值做个比较，如果不一样的话，就是相较上一次 commit 之后，这个文件更新了，自然而然也就是即将被 commit 的文件了。

如何找到哪些文件还没有 staged? 一个文件没有被 stage，意味着它首先被 git 跟踪了，出现在`.git/index`中，另外，意味着工作目录中的该文件内容 hash 值与`.git/index`里边不一致。典型的情景是，你修改了一个文件，然后执行`git add`，之后，你又修改了这个文件，此时这个文件的改动没有同步到`.git/index`，就处于没有被 stage 的状态。正如其定义一样，只需要根据这些文件当前内容，计算一下 hash 值，然后与`.git/index`里边记录的 hash 值比较一下，不一样的就是没有被 stage 的文件了。

如何找到哪些文件存在冲突？这个更简单。在`git merge`一节我们介绍过，如果在 merge 的时候，存在文件冲突的状态，这些文件在`.git/index`中的 stage 值是 1、2、3，根据这点，我们就知道哪些文件存在冲突了。

## `git diff`

以`git diff a b`为例。

从`.git/refs/heads/a`读取上一次 commit hash，并根据这个 hash 值从`.git/objects`中找到 commit 记录，从这个记录里就能获取到所有的文件以及文件内容 hash 值。

同样的事情，在`.git/refs/heads/b`做一遍。然后将二者拿出来比较一下，hash 值不同的同名文件，就是存在差异，列举出来。当然，就像之前所说的，真实的 git 会更复杂，给出具体哪些行不同，这不在我们的讨论范围内。
