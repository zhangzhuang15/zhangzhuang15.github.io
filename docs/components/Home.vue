<script setup lang="ts">
import { NButton, NIcon, NDivider } from "naive-ui";
import { useData, useRouter } from "vitepress";
import { computed } from "vue";

const { isDark } = useData();

const { go } = useRouter();

const borderColor = computed(() => `border-color: ${isDark.value ? "rgba(255, 255, 255, 0.07)": "rgba(0, 0, 0, 0.1)"}`);

const cardMessages: { title: string; content: string; key: number }[] = [
    {
        key: 0,
        title: "🐬 成长跟随",
        content: "记录自己的工作经历、工作感悟、工作趣事、生活趣事",
    },
    {
        key: 1,
        title: "🍪 技术分享",
        content: `记录前端、Go、Rust、C方面的技术文章、奇怪的技术坑、新技术的尝鲜、操作系统或网络协议基础实例，
        不想成为什么技术大牛，只是为了有趣`,
    },
    {
        key: 2,
        title: "👨🏻‍💻 开源尝试",
        content: `记录自己接触过、研究过的开源项目，以及一些自己的开源尝试经历`
    }
];

const visitMe = () => go("/me/work-experience");

const visitBlog = () => go("/blog/");

</script>
<template>
    <section>
        <h1 class="text-center intro-title">Welcome To</h1>
        <h1 class="text-center intro-title">JasonZhang's</h1>
        <h1 class="text-center intro-title">Personal Website !</h1>
        <h3 class="text-center">
            <cite>If it's interesting, take a try;</cite>
            <cite>Don't hesitate here and there, take a try.</cite>
        </h3>
    </section>

    <section class="gap-space flex flex-evenly">
        <NButton type="primary" icon-placement="right" @click="() => visitMe()">
            <template #icon>
                <NIcon><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20"><g fill="none"><path d="M9 2c.607 0 1.157.36 1.4.916l2.368 5.41l3.236-.201a1.879 1.879 0 0 1 1.992 1.758L18 10a1.879 1.879 0 0 1-1.879 1.879l-.117-.004l-3.236-.202l-2.367 5.41A1.529 1.529 0 0 1 9 18a.883.883 0 0 1-.883-.883l.002-.055l.703-5.636l-2.458-.154l-1.14 2.28A.809.809 0 0 1 4.5 14a.5.5 0 0 1-.5-.5v-2.376l-1.062-.065A1 1 0 0 1 2 10.06v-.122a1 1 0 0 1 .938-.998L4 8.875V6.5a.5.5 0 0 1 .5-.5c.306 0 .587.173.724.447l1.139 2.28l2.459-.154l-.698-5.58A.883.883 0 0 1 9 2z" fill="currentColor"></path></g></svg></NIcon>
            </template>
            快速认识我</NButton>
        <NButton type="tertiary" @click="() => visitBlog()">瞧瞧我的博客</NButton>
    </section>

    <section class="gap-space">
        <NDivider />
    </section>
   

    <section class="gap-space flex gap-12px">
        <div 
            class="evenly-flex-item bordered space-spare-box hover-box" 
            :style="borderColor"
            v-for="message in cardMessages" 
            :key="message.key">
                <h3 style="margin-top: 0px">{{ message.title }}</h3>
                <div style="margin-top: 8px">{{ message.content }}</div>
        </div>
    </section>
</template>

<style scoped>
.text-left {
    text-align: left;
}
.text-center {
    text-align: center;
}
.intro-title {
    color: transparent;
    font-size: 80px;
    line-height: 108px;
    font-weight: 800;
    white-space: nowrap;
    word-break: break-all;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    background: linear-gradient(to right bottom, grey, rgb(33, 61, 187),rgb(152, 217, 125),rgb(233, 112, 20), rgb(139, 18, 139), black);
}

.gap-space {
    margin-top: 40px;
}

.flex {
    display: flex;
}

.flex-evenly {
    justify-content: space-evenly;
}

.evenly-flex-item {
    flex: 1 1;
    -webkit-flex: 1 1;
}

.space-spare-box {
    padding: 12px;
}

.bordered {
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 4px;
}

.hover-box:hover {
    box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.5);
    transform: translateY(-1px);
}

.gap-12px {
    gap: 12px;
}
</style>