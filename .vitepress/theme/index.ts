import DefaultTheme from "vitepress/theme";
import type { App } from "vue";
import "./custom.css";
import Giscus from "../../docs/components/Giscus.vue";

export default {
    extends: DefaultTheme,

    // 在任何一个.md文件中，无需引入，直接使用Giscus组件
    // refer: https://vitepress.dev/guide/extending-default-theme#registering-global-components
    enhanceApp({ app }: { app: App }) {
        app.component("Giscus", Giscus);
    }
};