<script lang="ts" setup>
import { defineProps, ref } from "vue";
import PreviewCard from "./PreviewCard.vue";

const props = defineProps<{ url: string }>();
const renderPreviewCard = ref(true);
const doError = (err: any) => {
    console.log("error in LoadingPreviewCard: ", err);
    renderPreviewCard.value = false;
};
</script>

<template>
    <Suspense v-if="renderPreviewCard">
        <PreviewCard :url="props.url" @error="(err) => doError(err)" />
        <template #fallback>
            parsing url...
        </template>
    </Suspense>
    <div v-else>😭sorry, visit the url directly please.</div>
</template>