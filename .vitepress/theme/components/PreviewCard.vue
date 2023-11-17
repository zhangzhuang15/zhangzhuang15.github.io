<script lang="ts" setup>
import { ref, defineProps, computed, watch, defineEmits } from "vue";

const props = defineProps<{ url: string }>();
const emit = defineEmits<{
    (event: "error", error: any): void
}>();

const parseWebsite = (url: string): Promise<{ url: string, title: string }> => {
    const controller = new AbortController();
    const { signal } = controller;
    setTimeout(() => controller.abort(), 5_000);

    return fetch(url, { method: 'GET', signal })
      .then((response) => response.text())
      .then((html) => {
        const titleReg = /<title.*?>(.*)<\/title>/;
        const iconUrlReg = /<link rel="icon" .*? href="(.*?)".*?\/>/;
        const descriptionReg = /<meta.*?name="description".*?content="(.*?)".*?>/;

        const url = iconUrlReg.exec(html)?.[1] || '';
        const title = titleReg.exec(html)?.[1] || '';
        const description = descriptionReg.exec(html)?.[1] || '';

        console.log(url, title);
        
        return { url, title: title + '\n' + description};
      })
      .catch((err) => {
        console.log("error in PreviewCard: ", err.toString());
        // 通知上层，退到错误情况的提示
        emit("error", err);
        return { title: '', url: '' };
      });
};


const previewInfo = ref({ url: '', title: ''});
const previewImageUrl = computed(() => previewInfo.value.url);
const websiteTitle = computed(() => previewInfo.value.title);

const click = (url: string) => {
    window.open(url, "_blanket");
};


// 采用 await，支持上层 <Suspense> 包裹
const info = await parseWebsite(props.url);
previewInfo.value = info;


// 上面已经拿到数据了，无需设置 { immediate: true }
// 立即执行 effect，更新 previewInfo
watch(
    () => props.url,
    async (newVal, oldVal) => {
        const info = await parseWebsite(newVal);
        previewInfo.value = { ...info };
    },
);
</script>

<template>
        <div class="card" @click="() => click(props.url)">
          <div class="icon">
            <img :src="previewImageUrl" />
          </div>
          <p class="title">
            {{ websiteTitle }}
          </p>
        </div>
</template>

<style lang="scss" scoped>
.card {
    display: flex;
    min-height: 50px;
    max-width: 80%;
    border: 1px solid transparent;
    box-shadow: 0 0 2px 1px var(--vp-c-brand);
    transition: all 0.6s;
    border-radius: 10px;
    overflow-x: hidden;

    .icon {
        flex: none;
        display: flex;
        width: 100px;
        padding: 4px;
        border-radius: 10px;

        img {
            object-fit: contain;
            width: 100%;
            border-radius: 5px;
            transition: transform 0.6s;
            transform: scale(0.7);
        }
    }

    .title {
        flex: 1 1 initial;
        white-space: break-spaces;
    }

    &:hover {
        box-shadow: 0 0 10px 2px var(--vp-c-brand);
        transform: translateY(4px);
        cursor: pointer;

        .icon img {
            transform: scale(1);
        }
    }
}

</style>