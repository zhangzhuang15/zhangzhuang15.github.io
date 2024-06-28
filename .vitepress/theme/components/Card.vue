<script lang="ts" setup>
import { CSSProperties, defineProps } from "vue";
import { NIcon } from "naive-ui"
import { BookmarkMultiple20Regular } from "@vicons/fluent";

const props = defineProps<{
    style?: CSSProperties,
}>();

</script>
<template>
    <div class="card" :style="props.style || ''">
        <section class="left-part">
            <n-icon :size="28">
             <BookmarkMultiple20Regular />
            </n-icon>
        </section>
        <main class="right-part">
            <slot name="header"></slot>
            <slot>waaaahah</slot>
        </main>
    </div>
</template>
<style lang="scss" scoped>
.card {
    position: relative;
    background: #c1d7f8;
    color: black;
    padding: 8px 2px;
    border-radius: 6px;
    overflow: hidden;

    .left-part {
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 0;
        width: 40px;
        text-align: center;
    }
    .right-part {
        margin-left: 40px;
    }
}
</style>