import { defineConfig } from "vitepress";

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
        items: [{ text: "how to learn", link: "/go/how-to-learn" }],
      },
      {
        text: "Rust",
        activeMatch: "^/rust/",
        items: [
          { text: "how to learn", link: "/rust/how-to-learn" },
          { text: "宏-备忘录", link: "/rust/macro" },
          { text: "question in Rust", link: "/rust/question" },
        ],
      },
      {
        text: "Frontend",
        link: "/frontend/index-page",
        activeMatch: "^/frontend/",
      },
      {
        text: "开源项目",
        link: "/open-source/index-page",
        activeMatch: "^/open-source/",
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
          { text: 'NPM', link: '/tool/index-npm' }

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
          ],
        },
      ],
      "/go": [{ text: "how to learn", link: "/go/how-to-learn" }],
      "/rust": [
        { text: "how to learn", link: "/rust/how-to-learn" },
        { text: "宏-备忘录", link: "/rust/macro" },
        { text: "question in rust", link: "/rust/question" },
      ],
      "/blog": [
        {
          items: [
            { text: "首页", link: "/blog/index-page" },
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
              text: "可参考借用的代码片段",
              link: "/blog/pretty-snippets",
            },
            {
              text: "进程——问题清单",
              link: "/blog/process_question",
            },
          ],
        },
      ],
      "/open-source": [
        { text: "首页", link: "/open-source/index-page" },
        { text: "个人学习项目", link: "/open-source/personnal-learn-project" },
        { text: '个人开发的应用项目', link: '/open-source/application' }
      ],
      "/frontend": [
        { text: "首页", link: "/frontend/index-page" },
        { text: 'typescript类型系统', link: '/frontend/ts-type'}
      ],
      "/tool": [
        { text: "首页", link: "/tool/index-page" },
        { text: 'Oh-my-zsh', link: '/tool/ohMyZsh' },
        { text: "homebrew tool", link: "/tool/brew-tool" },
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
        }
        // {
        //   text: "Docker",
        //   items: [
        //     { text: "docker常用指令", link: "/tool/docker-cmd" },
        //     { text: "Dockerfile", link: "/tool/dockerfile" },
        //     { text: "Docker Composite", link: "/tool/docker-composite" },
        //   ],
        // },
      ],
      "/links": [
        { text: "首页", link: "/links/index-page" },
        { text: "技术热线", link: "/links/hotline" },
        { text: "社区", link: "/links/community" },
        { text: "开发者", link: "/links/personal" },
        { text: '在线技术文档', link: '/links/document' },
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
});
