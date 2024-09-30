---
title: "浏览器加载资源小结"
page: true
aside: true
---

## 总览
![加载流程整体面貌](/resource-download.png)

> 图片源自 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)

## Load事件和DOMContentLoaded事件
iframe有load事件，window对象也有load事件，而load事件与document的某种状态有关。

document.readystate（[MDN链接](https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState)）描述的就是这种状态。

<table>
    <thead>
        <tr>
            <th>readystate</th>
            <th>含义</th>
            <th>备注</th>
        </tr>
    </thead>
    <tbody>
      <tr>
        <td>loading</td>
        <td>The <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document">document</a> is still loading</td>
        <td>文档正下载，比如一个html文件正在下载，还没有下载完</td>
      </tr>
      <tr>
        <td>interactive</td>
        <td>The document has finished loading and the document has been parsed but sub-resources such as scripts, images, stylesheets and frames are still loading. The state indicates that the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event">DOMContentLoaded</a> event is about to fire.</td>
        <td>html文件已经下载完了，浏览器正在解析html、构造DOM树，解析过程中，遇到的脚本、图片、样式和frame正在下载。即将要触发 DOMContentLoaded事件</td>
      </tr>
      <tr>
        <td>complete</td>
        <td>The document and all sub-resources have finished loading. The state indicates that the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event">load</a> event is about to fire.</td>
        <td>DOM树有没有解析完毕，不太确定，但是相关的文件肯定是都下载好了。即将要触发 load 事件。</td>
      </tr>
    </tbody>
</table>

根据这种描述，不难得知，在load事件触发之前，浏览器会把页面相关的资源全部下载完。

可我们还关心的是，load事件触发之前，DOM Tree全部解析完了没，脚本全都执行完了没？

要回答这个问题，就要看看 DOMContentLoaded 事件和 load事件 的区别：

<table>
    <colgroup>
      <col width="200"/>
      <col width="400" />
      <col width="400" />
    </colgroup>
    <thead>
        <tr>
            <th>事件</th>
            <th>含义</th>
            <th>备注</th>
        </tr>
    </thead>
    <tbody>
      <tr>
        <td>DOMContentLoaded（<a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event">MDN链接</a>）</td>
        <td>The DOMContentLoaded event fires when the HTML document has been completely parsed, and all deferred scripts (<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer">&lt;script defer src="…"&gt;</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#module">&lt;script type="module"&gt;</a>) have downloaded and executed. It doesn't wait for other things like images, subframes, and async scripts to finish loading.DOMContentLoaded does not wait for stylesheets to load, however deferred scripts do wait for stylesheets, and the DOMContentLoaded event is queued after deferred scripts. Also, scripts which aren't deferred or async (e.g. &lt;script&gt;) will wait for already-parsed stylesheets to load.</td>
        <td>这个事件触发之前：HTML完全被解析，也就是DOM树已经生成了;带defer属性或者module类型的脚本必须全部执行完毕
图片、frame、async属性的脚本，可能还没有下载完</td>
      </tr>
      <tr>
        <td>load(<a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event">MDN链接</a>)</td>
        <td>The load event is fired when the whole page has loaded, including all dependent resources such as stylesheets, scripts, iframes, and images. This is in contrast to <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event">DOMContentLoaded</a>, which is fired as soon as the page DOM has been loaded, without waiting for resources to finish loading.</td>
        <td>这个事件触发之前：HTML涉及的所有资源都已经下载完成（说的是下载，没说执行！）DOM树构造完毕
        </td>
      </tr>
    </tbody>
</table>

经过以上分析，可以知道在load事件触发的时候，DOM树已经构建完成了；

但是脚本执行的情况些许复杂，根据脚本类型，我们归纳下：
<table>
    <colgroup>
      <col width="200"/>
      <col width="400" />
      <col width="400" />
    </colgroup>
    <thead>
        <tr>
            <th>script类型</th>
            <th>load事件触发之前执行完了没</th>
            <th>备注</th>
        </tr>
    </thead>
    <tbody>
      <tr>
        <td>&lt;script async&gt;</td>
        <td></td>
        <td>肯定是下载完了，有没有执行完，不太确定</td>
      </tr>
      <tr>
        <td>&lt;script defer&gt;</td>
        <td>✅</td>
        <td></td>
      </tr>
      <tr>
        <td>&lt;script type="module"&gt;</td>
        <td>✅</td>
        <td></td>
      </tr>
      <tr>
        <td>&lt;script&gt;</td>
        <td>✅</td>
        <td>这种脚本在执行过程中，会阻塞DOM树构建过程，它不执行完毕，DOM树就无法完成构建，反过来说，既然DOM树已经构建完成了，就意味着这种脚本肯定执行完毕了</td>
      </tr>
    </tbody>
</table>

但是这些只是从官方文档里得到的信息，还是略显模糊，接下来，我们通过一个demo更好地理解一下。

### 代码实验
[demo](https://github.com/zhangzhuang15/html-parse-demo)

关键代码如下：

:::code-group
```html [index.html]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script type="text/javascript">
        // 1: 验证此处的script会阻塞html parse
        (function(){
            const main = document.getElementById('main')
            if (main === null) {
                console.log('1')
            }

        })()
    </script>
    <script async type="text/javascript">
        // 2: 验证 async script 是否阻塞 html pars
        (function(){
            const main = document.getElementById('main')
            if (main === null) {
                console.log('21')
            } else {
                console.log('22')
            }
        })()
    </script>
    <script defer type="text/javascript">
        // 3: 验证 defer script 是否阻塞 html parse
        (function(){
            const main = document.getElementById('main')
            if (main === null) {
                console.log('31')
            } else {
                console.log('32')
            }
        })()
    </script>
</head>
<body>
    <script type="text/javascript">
        window.addEventListener("load", () => {
            console.log('index.html: load')
        })

        window.addEventListener("DOMContentLoaded", () => {
            console.log('index.html: DOMContentLoaded')
        })
    </script>
    <script type="text/javascript">
        // 4: 验证此处 script 阻塞 html parse
        (function(){
            const main = document.getElementById('main')
            if (main === null) {
                console.log('41')
            } else {
                console.log('42')
            }
        })()
    </script>

    <script type="text/javascript">
        // 5: 验证此处 script 阻塞 html parse
        (function(){
            const iframe = document.getElementById('iframe')
            if (iframe === null) {
                console.log('51')
            } else {
                console.log('52')
            }
        }
        )()
    </script>
    <!-- 服务端接到请求，2s之后返回js -->
    <script defer src="http://localhost:8077/js/sleep-2s.js"></script>

    <!-- 服务端接到请求，3s之后返回js -->
    <script async src="http://localhost:8077/js/sleep-3s.js"></script>

    <div id="main"></div>

    <iframe id="iframe" src="http://localhost:8077/iframe.html"></iframe>

    <script type="text/javascript">
        (function(){
            console.log('6');
            const iframe = document.getElementById('iframe')
            iframe.addEventListener("load", () => {
                console.log('index.html: iframe load')
            })
        })()
    </script>
</body>
</html>
```

```html [iframe.html]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <script type="text/javascript"> 
      // 找质数算法，模拟 CPU 密集计算，阻塞 DOM树 的解析
       (function(){
            console.log('iframe.html: coming')
            const isPrimeNumber = (value) => {
                if (value < 2 || value % 2 === 0) {
                    return false
                }

                const m = Math.sqrt(value) + 1;
                for (let i = 3; i < m; i += 2) {
                    if (value % i === 0) {
                        return false
                    }
                }

                return true
            }

            let result = 0;
            for (let i = 25000000; i > 100; i -= 1) {
                if (isPrimeNumber(i)) {
                            result += 1
                }
            }

            console.log('prime number: ', 10)
            
        })()
    </script>
    <script>
        window.addEventListener("DOMContentLoaded", () => {
            console.log('iframe.html: DOMContentLoaded')
        })

        window.addEventListener("load", () => {
            console.log("iframe.html: load")
        })
    </script>

    <script defer type="text/javascript" src="http://localhost:8077/js/iframe-sleep-2s.js"></script>
    <script async type="text/javascript" src="http://localhost:8077/js/iframe-sleep-3s.js"></script>
</body>
</html>
```
:::

在chrome浏览器访问index.html后，console面板输出结果：
```txt
1
21
31
41
51
6
iframe.html: coming
prime number: 10
index.html: sleep 2s, iframe can be accessed
index.html: DOMContentLoaded
iframe.html: sleep 2s
iframe.html: DOMContentLoaded
index.html: sleep 3s, iframe can be accessed
iframe.html: sleep 3s
iframe.html: load
index.html: iframe load
index.html: load
iframe.html: timeout 3s
```

得到的结论有：
- load事件一定在DOMContentLoaded事件之后触发
- DOM Tree 解析完毕发生在 DOMContentLoaded事件触发之前
- 必须等普通script下载且执行完毕后，DOM Tree 才能继续解析
- 普通script推迟 DOMContentLoaded 和 load 事件触发
- async script, defer script, module script 都不会阻塞DOM Tree解析
- defer script 和 module script 的执行，会推迟 DOMContentLoad事件
- 在最后一个derfer script或者module script执行完毕后，DOMContentLoaded才会被触发
- html中如果嵌套iframe, iframe里的DOM Tree解析得越慢，html的DOMContentLoaded事件被触发的越晚
- html中如果嵌套iframe, html中的DOMContentLoaded事件和iframe的DOMContentLoaded事件没有固定的先后触发顺序
- html中如果嵌套iframe，只有在iframe的load事件触发后，html的load事件才会触发
- load事件触发的时候，async script已经被执行了

阻塞浏览器解析DOM Tree的资源：
- 普通script
- 被阻塞的iframe

:::tip <TipIcon />
图片，css文件，音视频，字体文件不会阻塞DOM Tree的解析.

有人会说css文件下载会阻塞DOM Tree解析，也有一定道理，[GitHub | 关于css下载是否阻塞DOM Tree解析](https://github.com/sisterAn/blog/issues/115).

本质上是，css tree解析和DOM Tree解析是并行的，位于css link后边的普通script可能要访问css tree，需要等待css下载并解析为css Tree中的节点，然后script才会执行，之前也说过了，普通script的执行会阻塞DOM Tree解析，于是就有css下载阻塞script执行，script执行阻塞DOM Tree解析，最终形成了css下载阻塞DOM Tree解析的事情😭
:::

## 参考
[dev.to | 浏览器是如何解析html的](https://dev.to/arikaturika/how-web-browsers-work-parsing-the-html-part-3-with-illustrations-45fi)

[MDN ｜ 浏览器如何工作](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work#navigation)

[stackoverflow | load事件和DomContentLoaded事件的差异](https://stackoverflow.com/questions/2414750/difference-between-domcontentloaded-and-load-events)

[GithubGist | 浏览器加载网页的时候做了什么](https://gist.github.com/nishantmendiratta/db09531f80803465da36f0d43c3e58ac)

[现代javascript指导 ｜ async defer script](https://zh.javascript.info/script-async-defer)
