<script setup lang="ts">
import { NButton, NIcon, NDivider } from "naive-ui";
import { useData, useRouter } from "vitepress";
import { computed } from "vue";
import MusicIconButton from "./MusicIconButton.vue";
import MemoryBoard from "./MemoryBoard.vue";
import CharacterModel from "./CharacterModel.vue";

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

const themeMusic = "/follow_you.mp3";

const visitMe = () => go("/me/work-experience");

const visitBlog = () => go("/blog/index-page");

</script>
<template>
    <section>
        <h1 class="text-center intro-title roll">Welcome To</h1>
        <h1 class="text-center intro-title roll">JasonZhang's</h1>
        <h1 class="text-center intro-title roll">Personal Website !</h1>
        <h3 class="text-center">
            <cite>If it's interesting, take a try;</cite>
            <cite>Don't hesitate here and there, take a try.</cite>
        </h3>
    </section>

    <section class="gap-space">
        <CharacterModel />
    </section>

    <section class="gap-space flex flex-evenly">
        <NButton 
          type="primary" 
          icon-placement="right" 
          @click="() => visitMe()"
          style="
            --n-color: rgb(65, 105, 185);
            --n-color-hover: rgb(65, 105, 255);
            --n-color-pressed: rgb(65, 105, 245);
            --n-color-focus: rgb(65, 105, 245);
            --n-border: 1px solid rgb(65, 105, 205);
            --n-border-hover: 1px solid rgb(65, 105, 235);
            --n-border-pressed: 1px solid rgb(65, 105, 245);
            --n-border-focus: 1px solid rgb(65, 105, 245);
            outline: none;
            "
        >
            <template #icon>
                <NIcon size="18"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 20 20"><g fill="none"><path d="M9 2c.607 0 1.157.36 1.4.916l2.368 5.41l3.236-.201a1.879 1.879 0 0 1 1.992 1.758L18 10a1.879 1.879 0 0 1-1.879 1.879l-.117-.004l-3.236-.202l-2.367 5.41A1.529 1.529 0 0 1 9 18a.883.883 0 0 1-.883-.883l.002-.055l.703-5.636l-2.458-.154l-1.14 2.28A.809.809 0 0 1 4.5 14a.5.5 0 0 1-.5-.5v-2.376l-1.062-.065A1 1 0 0 1 2 10.06v-.122a1 1 0 0 1 .938-.998L4 8.875V6.5a.5.5 0 0 1 .5-.5c.306 0 .587.173.724.447l1.139 2.28l2.459-.154l-.698-5.58A.883.883 0 0 1 9 2z" fill="currentColor"></path></g></svg></NIcon>
            </template>
            快速认识我</NButton>
        <NButton 
          type="tertiary" 
          @click="() => visitBlog()"
          style="
           --n-text-color-hover: rgb(65, 105, 235);
           --n-text-color-pressed: rgb(65, 105, 245);
           --n-text-color-focus: rgb(65, 105, 245);
           --n-border-hover: 1px solid rgb(65, 105, 235);
           --n-border-pressed: 1px solid rgb(65, 105, 245);
           --n-border-focus: 1px solid rgb(65, 105, 245);
           outline: none;">瞧瞧我的博客</NButton>
    </section>

    <section class="gap-space">
        <NDivider />
    </section>
   

    <section id="card-group" class="gap-space flex gap-12px">
        <div 
            class="evenly-flex-item bordered space-spare-box hover-box" 
            :style="borderColor"
            v-for="message in cardMessages" 
            :key="message.key">
                <h3 style="margin-top: 0px">{{ message.title }}</h3>
                <div style="margin-top: 8px">{{ message.content }}</div>
        </div>
    </section>

    <div class="button-container">
        <div class="memory-board">
          <MemoryBoard />
        </div>

        <div class="music">
          <MusicIconButton :size="'100%'" :source="themeMusic"/>
        </div>
    </div>   
</template>

<style lang="scss" scoped>
.text-left {
    text-align: left;
}
.text-center {
    text-align: center;
}

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
    animation: spinKeyFrame 5s ease-in-out 100ms infinite ;
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
    background: linear-gradient(var(--spin-angle), grey, rgb(33, 61, 187),rgb(152, 217, 125),rgb(233, 112, 20), rgb(139, 18, 139), black); // to right bottom
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