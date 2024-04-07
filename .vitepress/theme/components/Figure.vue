<script setup lang="ts">
import { defineProps } from "vue";

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    }
});


</script>
<style scoped>
figure {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    margin-bottom: 10px;
}

img {
    width: 100%;
    height: auto;
}

figcaption {
    text-align: center;
    font-weight: 500;
}
</style>
<template>
    <figure>
        <img :src="props.src" :alt="props.description" />
        <figcaption>{{ props.description }}</figcaption>
    </figure>
</template>