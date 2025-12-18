---
title: "个人开发的应用项目"
page: true
aside: true
---

# 个人开发的应用项目

## [vscode-plugin-dictionary](https://github.com/zhangzhuang15/JasonPackages/tree/dev/packages/vscode-plugin-dictionary)

一款 vscode 插件，功能是获取英文单词的翻译。

特点：

- 不需要在 vscode 单独开一个 webview 页面
- 翻译的过程不需要跳转到 vscode 以外的应用
- 使用简单，无配置，只需要选中被翻译的单词，鼠标停留在单词上，就可以在悬浮提示框中看到翻译结果

[下载体验 v0.0.2](https://github.com/zhangzhuang15/JasonPackages/releases/tag/vscode-plugin-dictionary-v0.0.2)

### macOS 接入 Dictionary.app

macOS 有自带的 Dictionary.app，查询单词翻译的时候，有没有一种可能，我们直接调用这个 app, 不必访问网络？经过网上一顿搜索，并且咨询了 chatGPT，这个事情是可能的，但是并不完美。

macOS 的 CoreServices 提供了 DictionaryService 的 API，你可以用它的 public API 查询翻译结果：

```c
#include <CoreServices/CoreServices.h>
#include <stdio.h>

int main() {
  char[] source = "apple";
  CFStringRef word = CFSTR(source);
  CFStringRef meaning = DCSCopyTextDefinition(NULL, word, CFRangeMake(0, sizeof(source)));
  if (!meaning) {
     printf("meaning is NULL\n");
     return 1;
  }

  char buffer[1024 * 3];
  uint8_t result = CFStringGetCString(meaning, buffer, sizeof(buffer),
                                     kCFStringEncodingUTF8);

  // 查询失败，或者 buffer 不够大、没有装下所有解释内容，会执行该分支
  if (result == 0) {
     printf("result is 0\n");
     printf("result: %s\n", buffer);
     CFRelease(meaning);
     return 1;
  }

  printf("result: %s\n", buffer);
  return 0;
}
```

macOS 提供的是 objective-c 和 swift 的 api 版本，我不擅长这两个语言，另外，我想将这种功能移植给 nodejs，只好用 c 版本。

上述程序查询“apple”完全没有问题。尴尬的是，如果你尝试查询“word”，上述代码查不到结果，Dictionary.app 里边倒能查到。于是，我怀疑 Apple 开放的 API 很鸡肋。又是一通网络搜索，找到了这个[文章](https://discussions.apple.com/thread/6616776?sortBy=rank)，里边介绍了私有 API。

私有 API 改写的程序：

```c
#include <CoreServices/CoreServices.h>
#include <stdint.h>
#include <stdio.h>

extern CFArrayRef DCSCopyRecordsForSearchString(DCSDictionaryRef dictionary,
                                                CFStringRef string,
                                                unsigned long long,
                                                long long searchType);

extern CFStringRef DCSRecordCopyData(CFTypeRef record, long);

extern CFArrayRef DCSGetActiveDictionaries(void);

int main(int argc, char **argv) {
  CFStringRef word = CFSTR("word");

  char buffer[1024 * 3];

  CFArrayRef dictionaryRef = DCSGetActiveDictionaries();
  CFIndex count = CFArrayGetCount(dictionaryRef);
  printf("acitve dictionary: %ld\n", count);

  for (CFIndex i = 0; i < count; i++) {
    DCSDictionaryRef dictionary =
        (DCSDictionaryRef)CFArrayGetValueAtIndex(dictionaryRef, i);
    CFArrayRef records = DCSCopyRecordsForSearchString(dictionary, word, 2, 2);
    CFIndex _count = CFArrayGetCount(records);
    printf("active records: %ld\n", _count);

    for (CFIndex j = 0; j < _count; j++) {
      CFTypeRef record = (CFTypeRef)CFArrayGetValueAtIndex(records, i);
      CFStringRef data = DCSRecordCopyData(record, 3);

      uint8_t result = CFStringGetCString(data, buffer, sizeof(buffer),
                                          kCFStringEncodingUTF8);
      if (result == 0) {
        printf("result is 0\n");
        printf("result: %d\n", buffer[0]);
        memset(buffer, 0, sizeof(buffer));
        continue;
      }

      printf("result: %s\n", buffer);

      break;
    }
    break;
  }

  return 0;
}
```

遗憾的是，这个程序也无法查出“word”翻译。

## [line-noise](https://github.com/zhangzhuang15/JasonPackages/tree/dev/packages/line-noise)

一个 nodejs 的 package，底层封装 redis-cli 的 line-noise c 库，编译为 node addon 文件，供命令行交互使用；

提供的功能有：

- 支持键入 tab 键实现内容补全；
- 支持自定义命令的后缀提示；
- 拥有和 readline 一样的交互效果；

<Giscus />
