import DefaultTheme from "vitepress/theme";
import type { App } from "vue";
import { h } from "vue";
import "./custom.css";
import Giscus from "./components/Giscus.vue";
import LoadingPreviewCard from "./components/LoadingPreviewCard.vue";
import MemoryBoard from "./components/MemoryBoard.vue";
import Figure from "./components/Figure.vue";
import TipIcon from "./components/TipIcon.vue";
import ColorFulCard from "./components/ColorFulCard.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    // 强制为dark模式
    document.documentElement.classList.add("dark");
    return h(DefaultTheme.Layout, null);
  },

  // 在任何一个.md文件中，无需引入，直接使用Giscus组件
  // refer: https://vitepress.dev/guide/extending-default-theme#registering-global-components
  enhanceApp({ app }: { app: App }) {
    app.component("Giscus", Giscus);
    app.component("LoadingPreviewCard", LoadingPreviewCard);
    app.component("MemoryBoard", MemoryBoard);    
    app.component("Figure", Figure);
    app.component("TipIcon", TipIcon);
    app.component("AvatarCard", ColorFulCard);
  },
};
