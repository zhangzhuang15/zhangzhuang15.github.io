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

    const parseIconUrl = (html: string) => {
      const commonIconUrlReg = /<link.*?rel=".*?icon".*?href="(.*?)".*?>/
      const ogIconUrlReg = /<meta.*?property="og:image".*?content="(.*?)".*?>/;
      const twitterIconUrlReg = /<meta.*?name="twitter:image".*?content="(.*?)".*?>/;

      if (ogIconUrlReg.test(html)) {
        const result = ogIconUrlReg.exec(html)
        return result?.[1] || ''
      }

      if (twitterIconUrlReg.test(html)) {
        const result = twitterIconUrlReg.exec(html)
        return result?.[1] || ''
      }

      if (commonIconUrlReg.test(html)) {
        const result = commonIconUrlReg.exec(html)
        return result?.[1] || ''
      }

      return ''
    }

    const parseTitle = (html: string) => {
      const commonTitleReg = /<title>(.*?)<\/title>/;
      const ogTitleReg = /<meta.*?property="og:title".*?content="(.*?)".*?>/;
      const twitterTitleReg = /<meta.*?name="twitter:title".*?content="(.*?)".*?>/;

      if (ogTitleReg.test(html)) {
        const result = ogTitleReg.exec(html)
        return result?.[1] || ''
      }

      if (twitterTitleReg.test(html)) {
        const result = twitterTitleReg.exec(html)
        return result?.[1] || ''
      }

      if (commonTitleReg.test(html)) {
        const result = commonTitleReg.exec(html)
        return result?.[1] || ''
      }

      return ''
    }

    const parseDescription = (html: string) => {
      const commonDescriptionReg = /<meta.*?name="description".*?content="(.*?)".*?>/;
      const ogDescriptionReg = /<meta.*?property="og:description".*?content="(.*?)".*?>/;
      const twitterDescriptionReg = /<meta.*?name="twitter:description".*?content="(.*?)".*?>/;

      if (ogDescriptionReg.test(html)) {
        const result = ogDescriptionReg.exec(html)
        return result?.[1] || ''
      }

      if (twitterDescriptionReg.test(html)) {
        const result = twitterDescriptionReg.exec(html)
        return result?.[1] || ''
      }

      if (commonDescriptionReg.test(html)) {
        const result = commonDescriptionReg.exec(html)
        return result?.[1] || ''
      }

      return ''
    }

    return fetch(url, { 
      method: 'GET', 
      signal, 
      headers: {
        accept: "text/html",
      }, 
      // 设置此项，发送请求不会带上 referrer
      // referrerPolicy: 'no-referrer',
      // 
      // 设置此项，就是想走一个简单请求，拿到数据，
      // 不受到CORS约束，但实际上，浏览器还是会施加
      // CORS约束，其结果就是，在 network 面板上，
      // 你可以看到完整的响应体，但是在 response.text()
      // 无法读到实际数据
      // refer: https://stackoverflow.com/questions/43262121/trying-to-use-fetch-and-pass-in-mode-no-cors
      // mode: 'no-cors', 
    })
      .then((response) => response.text())
      .then((html) => {
        const iconUrl = parseIconUrl(html);
        const title = parseTitle(html);
        const description = parseDescription(html);

        if (iconUrl === '') {
          emit("error", new Error("no icon in website: " + url));
        }

        if (title === '') {
          emit("error", new Error("no title in website: " + url));
        }

        if (description === '') {
          if (import.meta.env.mode === 'development') {
            console.log("no description in website: ", url)
          }
        }
        
        const urlObj = new URL(iconUrl, url);

        if (import.meta.env.mode === "development") {
          console.log(urlObj.href, title);
        }
        
        return { url: urlObj.href, title: title + '\n' + description};
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
    async (newVal) => {
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
    overflow: hidden;

    .icon {
        flex: none;
        display: flex;
        width: 100px;
        padding: 4px;
        border-radius: 10px;

        img {
            object-fit: contain;
            width: 100%;
            transition: transform 0.6s;
            transform: scale(0.6);
        }
    }

    .title {
        flex: 1 1 initial;
        white-space: break-spaces;
        font-weight: 500;
    }

    &:hover {
        box-shadow: 0 0 10px 2px var(--vp-c-brand);
        transform: translateY(4px);
        cursor: pointer;

        .icon img {
            transform: scale(0.8);
        }

    }
}

</style>