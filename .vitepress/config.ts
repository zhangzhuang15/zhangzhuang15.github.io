import { defineConfig } from "vitepress";
import MarkdownItContainer from "markdown-it-container";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "杰克-逊の黑豹",
  description: "JasonZhang's personal website",
  srcDir: "./docs",
  /**
   *  How to resolve favicon of Safari?
   *
   *  these `link` configs follow https://favicon.io/favicon-converter/,
   *  these pictures also generated by that website:
   *   /public/apple-touch-icon.png
   *   /public/favicon-32x32.png
   *   /public/favicon-16x16.png
   *   /public/favicon.ico
   *   /public/site.webmanifest
   *   /public/android-chrome-192x192.png
   *   /public/android-chrome-512x512.png
   *
   *  thanks to this ico generator website!
   *
   *  in chrome browser, you can take a regular PNG file as browser favicon,
   *  but in Safari browser, it has some requirements or limits in the size of favicon,
   *  there is a related question here: https://stackoverflow.com/questions/64236057/how-to-create-a-favicon-for-safari-14
   *
   *  I follow this question and write these codes.
   */
  head: [
    // for chrome and other browsers
    ["link", { rel: "icon", href: "/favicon.png" }],
    // only for Safari browser
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: `/apple-touch-icon.png`,
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
  ],
  // 删除light/dark模式切换按钮
  appearance: false,
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/favicon.png",
    aside: false,

    // 每一页右侧 on this page 列表，按照标题层级展开
    outline: 'deep',

    // refer: https://vitepress.dev/reference/default-theme-search
    // 使用vitepress内置的minisearch文档搜索方案，不采用algolia
    search: {
      provider: "local",
    },
    // 顶部导航栏
    nav: [
      {
        text: "Me",
        activeMatch: `^/me/`,
        items: [
          { text: "work experience", link: "/me/work-experience" },
          { text: "work thoughts", link: "/me/work-thoughts" },
          { text: "my life", link: "/me/my-life" },
          { text: "my travel", link: "/me/my-travel" },
        ],
      },
      {
        text: "Go",
        activeMatch: "^/go/",
        items: [
          { text: "how to learn", link: "/go/how-to-learn" },
          { text: 'FAQ', link: '/go/FAQ' }
        ],
      },
      {
        text: "Rust",
        activeMatch: "^/rust/",
        items: [
          { text: "how to learn", link: "/rust/how-to-learn" },
          { text: "宏-备忘录", link: "/rust/macro" },
          { text: "Cargo Toml", link: "/rust/cargo-toml" },
          { text: 'Rust内存操作', link: '/rust/memory'},
          { text: "FAQ", link: "/rust/question" },
          { text: '编写宏', link: '/rust/write-macro'}
        ],
      },
      {
        text: "Frontend",
        // link: "/frontend/index-page",
        activeMatch: "^/frontend/",
        items: [
         { text: 'code snippet', link: '/frontend/code-snippet'}
        ]
      },
      {
        text: "Swift",
        activeMatch: "^/swift/",
        items: [
          { text: "code snippet", link: "/swift/code-snippet"}
        ]
      },
      {
        text: "开源项目",
        activeMatch: "^/open-source/",
        items: [
          { text: "首页", link: "/open-source/index-page" },
          { text: "开源项目学习清单", link: "/open-source/learning-route" },
        ]
      },
      // index.md 将被特殊处理，其路由是 /blog/ 而不是 /blog/index，
      // 这会影响到sidebar的高亮问题，因此重命名为index-page;
      // important 命名成 page-index 也影响到sidebar的高亮显示，
      // 避免以 index 结尾吧！
      // 
      // activeMatch必须存在，否则，阅读“首页”内容时，nav中的“博客”高亮，
      // 阅读“偷师tapable三个技术点”内容时，nav中的“博客”失去高亮
      { text: "博客", link: "/blog/index-page", activeMatch: "^/blog/" },
      {
        text: "工具",
        // link: '/tool/index-page',
        activeMatch: "^/tool/",
        items: [
          { text: 'Oh-my-zsh', link: '/tool/ohMyZsh' },
          { text: "homebrew tool", link: "/tool/brew-tool" },
          { text: "rust CLI tool", link: "/tool/rust-tool" },
          { text: 'vscode', link: '/tool/vscode-install' },
          { text: 'front dev', link: '/tool/front-dev/config' },
          { text: 'NPM', link: '/tool/index-npm' },
          { text: 'software', link: '/tool/software' },
          { text: 'misc', link: '/tool/misc' }
        ],
      },
      {
        text: "优质链接",
        link: "/links/index-page",
        activeMatch: "^/links/",
      },
    ],
    // 左侧导航栏
    sidebar: {
      "/me": [
        {
          text: "About Me",
          items: [
            { text: "work experience", link: "/me/work-experience" },
            { text: "work thoughts", link: "/me/work-thoughts" },
            { text: "my life", link: "/me/my-life" },
            { text: "my travel", link: "/me/my-travel" },
            { 
              text: "第一次系列", 
              items: [
                { text: '第一次洗牙', link: "/me/first-time/wash-teeth" },
                { text: '第一次学会投篮', link: '/me/first-time/shoot' },
                { text: '第一次立案', link: '/me/first-time/take-law' },
                { text: '第一次听演唱会', link: '/me/first-time/concert'}
              ],
            },
          ],
        },
      ],
      "/go": [
        { text: "how to learn", link: "/go/how-to-learn" },
        { text: "FAQ", link: '/go/FAQ'},
        { text: "Module recommend", link: "/go/recommend-module"},
        { text: "code snippet", link: "/go/code-snippet" }
      ],
      "/rust": [
        { text: "how to learn", link: "/rust/how-to-learn" },
        { text: "宏-备忘录", link: "/rust/macro" },
        { text: "Cargo Toml", link: "/rust/cargo-toml" },
        { text: 'Rust内存操作', link: '/rust/memory'},
        { text: "FAQ", link: "/rust/question" },
        { text: "code-snippet", link: "/rust/code-snippet"},
        { text: '编写宏', link: '/rust/write-macro' },
        { 
          text: '开源代码阅读',
          items: [
            { text: 'mio', link: '/rust/readings/mio'}
          ]
        }
      ],
      "/blog": [
        {
          items: [
            { text: "首页", link: "/blog/index-page" },
            { text: '程序员和英语', link: '/blog/programer-and-english'},
            { text: "偷师tapable三个技术点", link: "/blog/tapable" },
            { text: "向pm2学习进程管理", link: "/blog/learn-pm2" },
            {
              text: "`ps`咋获取进程命令行参数的？",
              link: "/blog/ps-how-to-get-args",
            },
            { text: "eslint配置再掉坑笔记", link: "/blog/eslint" },
            {
              text: "不懂代码有可能是少了一篇论文",
              link: "/blog/doug-lee-concurrent-paper",
            },
            {
              text: "几个clang/gcc常见扩展功能",
              link: "/blog/gcc-extension-short-intro",
            },
            {
              text: "透过Redis看待我们是否应该继续使用c语言",
              link: "/blog/consider-c-by-redis",
            },
            {
              text: "学习Redis有感：开发一个npm package",
              link: "/blog/line-noise",
            },
            {
              text: "esbuild支持多平台的思路",
              link: "/blog/esbuild-multiplatform",
            },
            {
              text: "tsconfig的魔鬼——module和moduleResolution",
              link: "/blog/module-and-moduleResolution",
            },
            {
              text: "进程——问题清单",
              link: "/blog/process_question",
            },
            {
              text: "并发编程的一些零碎概念",
              link: "/blog/concurrent-concept"
            },
            {
              text: "百万并发？并发连接数上限怎么估计？",
              link: "/blog/concurrent-links"
            },
            {
              text: 'Promise Resolve 的秘密',
              link: '/blog/promise-resolve'
            },
            {
              text: 'React梳理',
              link: '/blog/react'
            },
            {
              text: "vue2梳理",
              link: "/blog/vue2"
            },
            {
              text: "浩叔语录",
              link: "/blog/learning-experience-chen-hao"
            },
            {
              text: "十年后再看高考，大彻大悟",
              link: "/blog/exam"
            },
            {
              text: "凌晨4点，思维定势的惨案",
              link: "/blog/you-cant-think",
            },
            { 
              text: "vitepress如何支持markdown使用vue组件", 
              link: "/blog/vitepress"
            },
            {
              text: "react官网如何实现用markdown编写页面",
              link: "/blog/react-dev"
            },
            {
              text: "foamTree, behind webpack-bundle-analyzer",
              link: "/blog/foam-tree",
            },
            {
              text: "Terminal的魔法",
              link: "/blog/terminal-io"
            },
            {
              text: 'Kilo, Text Editor',
              link: '/blog/terminal-kilo',
            },
            {
              text: "对立统一的一点看法",
              link: "/blog/conflict-thought"
            },
            {
              text: "用circle svg绘制圆环",
              link: "/blog/circle-svg"
            },
            {
              text: "flex布局小结",
              link: "/blog/flex-intro",
            },
            {
              text: "jest学习笔记",
              link: "/blog/jest-learn"
            },
            {
              text: '什么是"monad"',
              link: "/blog/monad-intro"
            },
            {
              text: "axios和content-type请求头",
              link: '/blog/axios-content-type'
            },
            {
              text: "下载html遇到的gzip问题",
              link: '/blog/gzip-when-download-html'
            },
            {
              text: "浏览器加载资源小结",
              link: "/blog/browser-download-resource"
            },
            {
              text: "coreutils解读",
              link: '/blog/core-utils'
            },
            {
              text: "fucking webpack concept",
              link: "/blog/fucking-webpack-concept"
            },
            {
              text: "从 ElementUI 源码学到的小知识",
              link: '/blog/learn-from-element-ui'
            },
            {
              text: "Fucking swift package manager",
              link: "/blog/swift-package-manager"
            },
            {
              text: "C++和Rust在值拷贝方面的一些思考",
              link: "/blog/cpp-rust"
            },
            {
              text: '接触cpp',
              link: '/blog/learning-cpp'
            },
            {
              text: 'learn zig',
              link: '/blog/learning-zig'
            },
            {
              text: 'rust编译出来的executable file比cpp大？',
              link: '/blog/rust-binary-is-big'
            },
            {
              text: '与二进制文件打交道',
              link: '/blog/talk-to-executable'
            },
            {
              text: '函数调用ABI',
              link: '/blog/call-abi'
            },
            {
              text: '协程-用C语言实现',
              link: '/blog/coroutine'
            },
            {
              text: 'System Program with C',
              link: '/blog/system-program-with-c'
            },
            {
              text: 'Hardware you should Know',
              link: "/blog/hardware"
            },
            {
              text: 'Talk about pthread',
              link: '/blog/pthread'
            },
            {
              text: 'How to Write Interpreter',
              link: '/blog/interpreter'
            },
            {
              text: "使用vue遇到的一些坑",
              link: '/blog/vue-apply'
            },
            {
              text: 'crossbeam 学习笔记',
              link: '/blog/crossbeam-learning-notes'
            },
            {
              text: 'GPU介绍',
              link: '/blog/gpu'
            },
            {
              text: 'Never Confused: Rust, Zig and Go',
              link: '/blog/rust-zig-go'
            },
            {
              text: 'Start with Zig',
              link: '/blog/zig',
            },
            {
              text: 'Tauri',
              link: '/blog/tauri',
            },
            {
              text: "博客文章阅读系列",
              collapsed: true,
              items: [
                {
                  text: "介绍",
                  link: "/blog/blog-reading/main"
                },
                {
                  text: '浩叔篇',
                  link: "/blog/blog-reading/hao-shu"
                },
                {
                  text: "Rust",
                  link: "/blog/blog-reading/rust-program"
                }
              ]
            }
          ],
        },
      ],
      "/open-source": [
        { text: "首页", link: "/open-source/index-page" },
        { text: "个人学习项目", link: "/open-source/personnal-learn-project" },
        { text: '个人开发的应用项目', link: '/open-source/application' },
        { text: "开源项目学习清单", link: "/open-source/learning-route" },
      ],
      "/frontend": [
        { text: "首页", link: "/frontend/index-page" },
        { text: 'typescript类型系统', link: '/frontend/ts-type'},
        { text: 'jsdoc常用的语法', link: '/frontend/js-doc'},
        { text: 'code snippet', link: '/frontend/code-snippet'},
        { text: 'FAQ', link: '/frontend/FAQ' }
      ],
      "/swift": [
        { text: "code snippet", link: "/swift/code-snippet"}
      ],
      "/tool": [
        { text: "首页", link: "/tool/index-page" },
        { text: 'Oh-my-zsh', link: '/tool/ohMyZsh' },
        { text: "homebrew tool", link: "/tool/brew-tool" },
        { text: 'curl tool', link: '/tool/curl-tool' },
        { text: "rust CLI tool", link: "/tool/rust-tool" },
        { text: 'Github', link: '/tool/index-github'},
        { 
          text: 'vscode',
          items: [
            { text: '安装', link: '/tool/vscode-install' },
            { text: '常用配置', link: '/tool/vscode-config' },
            { text: '插件推荐', link: '/tool/vscode-plugin' },
            { text: 'vscode variables', link: '/tool/vscode-variables' },
            { text: 'tasks.json', link: '/tool/vscode-tasks' }
          ] 
        },
        {
          text: 'front dev',
          items: [
            { text: '常用开发配置', link: '/tool/front-dev/config' },
          ]
        },
        {
          text: 'NPM',
          items: [
            { text: '首页', link: '/tool/index-npm' },
            { 
              text: 'package推荐',
              collapsed: true,
              items: [
                { text: '辅助研发', link: '/tool/npm-package-dev' },
                { text: '开发cmd', link: '/tool/npm-package-cmd' },
                { text: '文件系统', link: '/tool/npm-package-file-system' },
                { text: 'function tool', link: '/tool/npm-package-function-tool' },
                { text: '日志处理', link: '/tool/npm-package-log' },
                { text: '时间处理', link: '/tool/npm-package-time' },
                { text: '测试相关', link: '/tool/npm-package-test' },
                { text: 'module/package相关', link: '/tool/npm-package-module' },
                { text: 'http相关', link: '/tool/npm-package-http' },
                { text: 'UI', link: '/tool/npm-package-ui' },
                { text: 'web app framework', link: '/tool/npm-package-web-app' },
                { text: 'docs website', link: '/tool/npm-package-docs-web' },
                { text: 'database', link: '/tool/npm-package-database' },
                { text: 'specific file', link: '/tool/npm-package-specific-file' },
                { text: 'data structure', link: '/tool/npm-package-data-structure' },
                { text: '动画', link: '/tool/npm-package-animation' },
                { text: '音视频', link: '/tool/npm-package-media' },
                { text: '图像', link: '/tool/npm-package-image' }
              ]
            }
          ]
        },
        {
          text: 'Rollup',
          items: [
            { text: '插件推荐', link: '/tool/rollup/plugin' },
          ]
        },
        {
          text: 'ansi escape control',
          link: '/tool/ansi-escape-control'
        },
        { text: 'software', link: '/tool/software' },
        { text: 'misc', link: "/tool/misc"},
        { text: 'arm指令清单', link: '/tool/arm' },
        { text: 'CMake', link: '/tool/cmake-tool'}
      ],
      "/links": [
        { text: "首页", link: "/links/index-page" },
        { text: "技术热线", link: "/links/hotline" },
        { text: "社区", link: "/links/community" },
        { text: "开发者", link: "/links/personal" },
        { text: '在线技术文档', link: '/links/document' },
        { text: '好文共赏', link: "/links/great-articles"},
        { text: 'other source', link: '/links/other-source' }
      ],
    },

    // 稀土掘金logo的svg出自稀土掘金官网，使用devtools查出来的
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/zhangzhuang15?tab=repositories",
      },
      {
        icon: {
          svg:
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="28" viewBox="0 0 36 28" fill="none">' +
            "<title>稀土掘金</title>" +
            '<path fill-rule="evenodd" clip-rule="evenodd" d="M17.5875 6.77268L21.8232 3.40505L17.5875 0.00748237L17.5837 0L13.3555 3.39757L17.5837 6.76894L17.5875 6.77268ZM17.5863 17.3955H17.59L28.5161 8.77432L25.5526 6.39453L17.59 12.6808H17.5863L17.5825 12.6845L9.61993 6.40201L6.66016 8.78181L17.5825 17.3992L17.5863 17.3955ZM17.5828 23.2891L17.5865 23.2854L32.2133 11.7456L35.1768 14.1254L28.5238 19.3752L17.5865 28L0.284376 14.3574L0 14.1291L2.95977 11.7531L17.5828 23.2891Z" fill="#1E80FF"></path>' +
            "</svg>",
        },
        link: "https://juejin.cn/user/4174182871215693",
        ariaLabel: "稀土掘金",
      },
    ],
  },
  base: "/",
  lastUpdated: true,

  vite: {
    // resolve the problem described in this issue: https://github.com/antfu/vite-ssg/issues/324
    ssr: {
      noExternal: ["naive-ui", "vueuc"],
    },

    server: {
      /**
       * 采用默认的 localhost作为域名，在macOS上运行服务器后，同网络下的手机无法访问；
       * 为此，舍弃127.0.0.1和localhost，通过 ifconfig | grep inet 查询电脑wifi
       * 环境下的ip地址，作为服务器域名
       */
      host: "localhost",
      fs: {
        // 来自 vue3-docs项目
        allow: ["../.."],
      },
    },
  },
  
  vue: {
    template: {
      compilerOptions: {
        // ssr: true,
      }
    }
  },

  markdown: {
    config(md) {
      // 添加自定义的container容器
      md.use(MarkdownItContainer, "card", {
        // for example,
        // :::card [title: 提示] [style: { font-size: 10px }]
        //  hello world
        // :::
        //
        //  params: "card [title: 提示] [style: { font-size: 10px }]"
        validate(params: string) {
          return params.trim().startsWith("card")
        },
        // idx 只会返回open标签和close标签在 tokens 里的索引号，
        // <a></a>, <a> 就是open标签，</a>就是close标签，
        // token结构的关键字段如下：
        //   type: "container_card_open"
        //   tag: "div"        (这个token在编译之后会变成div标签)
        //   nesting: 1        (1表示是open标签，-1表示close标签)
        //   markup: ":::"     (markdown中对应的标记，比如 **， ##)
        //   info："card [title: 提示] [style: { font-size: 10px }]"
        //   content: ""       (如果 token 表示的是 **great one**, 这里就是 "great one")
        //
        // 更具体的有：
        // **what do you want from me**
        // 它会被解析为3个token：
        // [
        //   {
        //     type: "strong_open",
        //     tag: "strong",
        //     nesting: 1,
        //     content: "",
        //     info: "",
        //     markup: "**"
        //   },
        //   {
        //     type: "text",
        //     tag: "",
        //     nesting: 0,
        //     content: "what do you want from me",
        //     info: "",
        //     markup: ""
        //   },
        //   {
        //     type: "strong_close",
        //     tag: "strong",
        //     nesting: -1,
        //     content: "",
        //     info: "",
        //     markup: "**"
        //   }
        // ] 
        render(
          tokens: Array<{nesting: number, info: string}>, 
          idx: number) {
          const token = tokens[idx]
          
          if (token.nesting === 1) {
            let title: string | undefined
            const titleReg = /\[\s*title:(.*?)\]/
            const result = titleReg.exec(token.info)
            if (result !== null) {
              title = result[1]
            }
            const headerPart = title === undefined ? "" : `<div slot="header">${title.trim()}</div>`

            let style: string | undefined
            const styleReg = /\[\s*style:(.*?)\]/
            const styleResult = styleReg.exec(token.info)
            if (styleResult !== null) {
              style = styleResult[1]
              style = style.trim()
              style = style.replace(/^"*/, '')
              style = style.replace(/"*$/, '')
              style = style.replace(/"/, "'")
            }
            const stylePart = style === undefined ? "" : `style="${style}"`

            return `<Card ${stylePart}>${headerPart}`
          } else {
            // end tag
            return "</Card>"
          }
        },
      })
    },
  }
});
