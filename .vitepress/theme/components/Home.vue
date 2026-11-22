<script setup lang="ts">
import { NButton, NIcon } from "naive-ui";
import { useData, useRouter } from "vitepress";
import { computed, onMounted, ref } from "vue";
import {
    _React as React, _Vue as VueLogo, Nestjs, Python,
    Go, Javascript, TypescriptIconRound as Typescript, Eslint,
    TailwindIcon as Tailwind, Prettier, Vite, Vitest, Ansible,
    DockerIcon as Docker, Nginx, TerraformIcon as Terraform,
    NextjsIcon as Nextjs, Webpack, Sass, Less, MongodbIcon as Mongodb,
    Redis, Gin, Pinia, Postcss, Pnpm, Yarn, Bun, AntDesign, Electron,
    Java, Babel
} from "@dev.icons/vue";
import { Rust, Axios, MysqlIcon as Mysql, Stylelint, Kafka } from "@dev.icons/vue/mono";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MusicIconButton from "./MusicIconButton.vue";
import MemoryBoard from "./MemoryBoard.vue";
import CharacterModel from "./CharacterModel.vue";

const LOGOSIZE = 40;

const { isDark } = useData();

const { go } = useRouter();

const loadCharacterModel = ref(false);

const borderColor = computed(() => `border-color: ${isDark.value ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.1)"}`);

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

const themeMusic = "/follow_you.mp3";

const visitMe = () => go("/me/work-experience");

const visitBlog = () => go("/blog/index-page");

gsap.registerPlugin(ScrollTrigger);
onMounted(() => {
    const zMaskHeight = document.getElementById("z-mask")?.offsetHeight || 0
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#z-mask",
            // z-mask的中心到达viewport高度56%的位置时，
            // 开启scroll动画
            start: "center 56%",
            // 滚动条往下滚动 zMaskHeight后结束scroll动画
            end: `+=${zMaskHeight}`,
            // 滚动条回拉，动画倒放
            scrub: 0.5,
            // 滚动条滚动时，z-logo在viewport的位置不动
            pin: "#z-logo",
            // 不需要额外增加padding，实现pin效果
            pinSpacing: false,
        },
    });

    // 字母 z 的旋转动画
    tl.fromTo("#z-logo",
        { rotate: 180 },
        { rotate: 0, duration: 2, ease: "power3.inOut" },
    )
    // 字母Z的缩放渐隐动画
    tl.fromTo("#z-logo",
        { scale: 4, opacity: 1 },
        { scale: 150, opacity: 0, duration: 4 },
        0.5
    )
    // 字母Z恢复到原状，否则 gsap 会增加太多的空间，导致纵向滚动条太长
    tl.to("#z-logo", { scale: 1 })

    // intro 标签动画
    tl.fromTo("#intro",
        { scale: 10, opacity: 0, xPercent: 100, rotate: 125, yPercent: -(Math.random() * 20 + 10 + 100) },
        { scale: 0.8, opacity: 1, xPercent: 0, rotate: 0, yPercent: 0, duration: 3, ease: "back.inOut" },
        2.5)
    tl.to("#intro", { scale: 1.1, ease: "power1.inOut" })

    // message box 的渐显动画
    tl.fromTo(".message-box",
        { yPercent: 40, opacity: 0 },
        {
            yPercent: 0, opacity: 1, ease: "sine.out",
            stagger: 0.4, onComplete: () => {
                // message box 渐显动画结束后，执行
                // 技术栈logo的显示动画
                loadCharacterModel.value = true
                gsap.to(".tech-logo",
                    {
                        opacity: 1,
                        duration: 1,
                        ease: "sine.out",
                        scale: 1,
                        stagger: {
                            from: "random",
                            each: 0.15
                        },
                        delay: 0.8
                    }
                )
            }
        },
    )

    // 技术栈logo图标初始状态，缩小，并隐藏
    gsap.set(".tech-logo", { opacity: 0, scale: 0.4 })
});

</script>
<template>
    <section id="z-mask" class="flex items-center justify-center relative h-screen">
        <div class="intro-title roll origin-center absolute" id="z-logo">Z</div>
    </section>
    <section id="intro">
        <h1 class="text-center intro-title roll">Welcome To</h1>
        <h1 class="text-center intro-title roll">JasonZhang's</h1>
        <h1 class="text-center intro-title roll">Personal Website !</h1>
        <h3 class="text-center">
            <cite>If it's interesting, take a try;</cite>
            <cite>Don't hesitate here and there, take a try.</cite>
        </h3>

        <section class="gap-space flex justify-evenly">
            <NButton type="primary" icon-placement="right" @click="() => visitMe()" style="
            --n-color: rgb(65, 105, 185);
            --n-color-hover: rgb(65, 105, 255);
            --n-color-pressed: rgb(65, 105, 245);
            --n-color-focus: rgb(65, 105, 245);
            --n-border: 1px solid rgb(65, 105, 205);
            --n-border-hover: 1px solid rgb(65, 105, 235);
            --n-border-pressed: 1px solid rgb(65, 105, 245);
            --n-border-focus: 1px solid rgb(65, 105, 245);
            outline: none;
            ">
                <template #icon>
                    <NIcon size="18"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 20 20">
                            <g fill="none">
                                <path
                                    d="M9 2c.607 0 1.157.36 1.4.916l2.368 5.41l3.236-.201a1.879 1.879 0 0 1 1.992 1.758L18 10a1.879 1.879 0 0 1-1.879 1.879l-.117-.004l-3.236-.202l-2.367 5.41A1.529 1.529 0 0 1 9 18a.883.883 0 0 1-.883-.883l.002-.055l.703-5.636l-2.458-.154l-1.14 2.28A.809.809 0 0 1 4.5 14a.5.5 0 0 1-.5-.5v-2.376l-1.062-.065A1 1 0 0 1 2 10.06v-.122a1 1 0 0 1 .938-.998L4 8.875V6.5a.5.5 0 0 1 .5-.5c.306 0 .587.173.724.447l1.139 2.28l2.459-.154l-.698-5.58A.883.883 0 0 1 9 2z"
                                    fill="currentColor"></path>
                            </g>
                        </svg></NIcon>
                </template>
                快速认识我
            </NButton>
            <NButton type="tertiary" @click="() => visitBlog()" style="
           --n-text-color-hover: rgb(65, 105, 235);
           --n-text-color-pressed: rgb(65, 105, 245);
           --n-text-color-focus: rgb(65, 105, 245);
           --n-border-hover: 1px solid rgb(65, 105, 235);
           --n-border-pressed: 1px solid rgb(65, 105, 245);
           --n-border-focus: 1px solid rgb(65, 105, 245);
           outline: none;">瞧瞧我的博客</NButton>
        </section>
    </section>

    <section id="card-group" class="gap-space flex gap-12px px-[10%]">
        <div class="evenly-flex-item bordered space-spare-box hover-box message-box" :style="borderColor"
            v-for="message in cardMessages" :key="message.key">
            <h3 style="margin-top: 0px">{{ message.title }}</h3>
            <div style="margin-top: 8px">{{ message.content }}</div>
        </div>
    </section>

    <!-- refer:https://devicons.io/docs/vue/ -->
    <section id="tech-wall" class="flex gap-[36px] flex-wrap px-[10%] my-[32px]">
        <Rust :size="LOGOSIZE" color="#fff" alt="rust" class="tech-logo" />
        <React :size="LOGOSIZE" class="tech-logo" />
        <VueLogo :size="LOGOSIZE" class="tech-logo" />
        <Nestjs :size="LOGOSIZE" class="tech-logo" />
        <Python :size="LOGOSIZE" class="tech-logo" />
        <Go :size="LOGOSIZE" class="tech-logo" />
        <Javascript :size="LOGOSIZE" class="tech-logo" />
        <Typescript :size="LOGOSIZE" class="tech-logo" />
        <Eslint :size="LOGOSIZE" class="tech-logo" />
        <Tailwind :size="LOGOSIZE" class="tech-logo" />
        <Prettier :size="LOGOSIZE" class="tech-logo" />
        <Vite :size="LOGOSIZE" class="tech-logo" />
        <Vitest :size="LOGOSIZE" class="tech-logo" />
        <Ansible :size="LOGOSIZE" class="tech-logo" />
        <Docker :size="LOGOSIZE" class="tech-logo" />
        <Nginx :size="LOGOSIZE" class="tech-logo" />
        <Terraform :size="LOGOSIZE" class="tech-logo" />
        <Nextjs :size="LOGOSIZE" class="tech-logo" />
        <Axios :size="LOGOSIZE" class="tech-logo" />
        <Webpack :size="LOGOSIZE" class="tech-logo" />
        <Sass :size="LOGOSIZE" class="tech-logo" />
        <Less :size="LOGOSIZE" class="tech-logo" />
        <Mongodb :size="LOGOSIZE" class="tech-logo" />
        <Redis :size="LOGOSIZE" class="tech-logo" />
        <Mysql :size="LOGOSIZE" class="tech-logo" />
        <Gin :size="LOGOSIZE" class="tech-logo" />
        <Pinia :size="LOGOSIZE" class="tech-logo" />
        <Stylelint :size="LOGOSIZE" class="tech-logo" />
        <Postcss :size="LOGOSIZE" class="tech-logo" />
        <Pnpm :size="LOGOSIZE" class="tech-logo" />
        <Yarn :size="LOGOSIZE" class="tech-logo" />
        <Bun :size="LOGOSIZE" class="tech-logo" />
        <AntDesign :size="LOGOSIZE" class="tech-logo" />
        <Kafka :size="LOGOSIZE" class="tech-logo" />
        <Electron :size="LOGOSIZE" class="tech-logo" />
        <Java :size="LOGOSIZE" class="tech-logo" />
        <Babel :size="LOGOSIZE" class="tech-logo" />
    </section>

    <section class="absolute">
        <CharacterModel v-if="loadCharacterModel" />
    </section>


    <div class="button-container">
        <div class="memory-board">
            <MemoryBoard />
        </div>

        <div class="music">
            <MusicIconButton :size="'100%'" :source="themeMusic" />
        </div>
    </div>

</template>

<style lang="scss" scoped>
@property --spin-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 135deg;
}

@keyframes spinKeyFrame {
    from {
        --spin-angle: 135deg;
    }

    to {
        --spin-angle: 495deg;
    }
}

.roll {
    animation: spinKeyFrame 5s ease-in-out 100ms infinite;
}

.intro-title {
    color: transparent;
    font-size: 4.6rem;
    line-height: 5rem;
    font-weight: 800;
    white-space: nowrap;
    word-break: break-all;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    background: linear-gradient(var(--spin-angle), grey, rgb(33, 61, 187), rgb(152, 217, 125), rgb(233, 112, 20), rgb(139, 18, 139), black); // to right bottom
}


.button-container {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: var(--home-circle-size-half);
    width: var(--home-circle-size);
    right: 4rem;
    top: 10rem;

    .memory-board {
        position: relative;
        flex: none;
        height: var(--home-circle-size);
        // 必须显示设置好，如果不设置的话，
        // 从 hover 状态切换回去的话，
        // 会导致页面层级不符合预期
        z-index: 1;

        &:hover {
            // hover 的时候，要把音乐按钮完全遮挡
            z-index: 9;
        }
    }

    .music {
        position: relative;
        flex: none;
        height: var(--home-circle-size);
        z-index: 3;
    }
}

/** 适配 iphone8 小屏  */
@media (max-width: 415px) {
    .intro-title {
        font-size: 2rem;
        line-height: 3rem;
    }

    section {
        margin-top: 2rem;
    }

    .button-container {
        top: 8rem;
        right: 1rem;
    }

    #card-group {
        flex-direction: column;
    }
}

/** 适配 iphoneSE 特小屏幕 */
@media (max-width: 320px) {
    .intro-title {
        font-size: 1.8rem;
        line-height: 2rem;
    }

    .button-container {
        top: 10rem;
    }

}

/** 适配914px宽度屏幕下，标语向上错位 */
@media (max-width: 914px) {
    section {
        margin-top: 2rem;
    }
}

.gap-space {
    margin-top: 40px;
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

.hover-box {
    transition: all .4s;
}

.hover-box:hover {
    box-shadow: 1px 1px 8px 4px rgba(0, 0, 0, 0.5);
    transform: translateY(-4px);
}

.gap-12px {
    gap: 12px;
}
</style>