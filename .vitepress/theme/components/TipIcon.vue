<script lang="ts" setup>
import { BookmarkMultiple20Regular } from "@vicons/fluent"
import { NIcon } from "naive-ui"
import { defineProps } from "vue";

const props = defineProps<{ text?: string }>();

</script>
<template>
    <div style="display: flex; align-items: center">
        <n-icon size="36">
          <BookmarkMultiple20Regular />
        </n-icon>
        <span style="font-size: 20px; font-weight: bolder;">{{ props.text || "Tips"}}</span>
    </div>
</template>