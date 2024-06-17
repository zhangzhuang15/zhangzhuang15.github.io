<script lang="ts" setup>
import { defineProps, computed } from "vue"

const props = defineProps<{
  icon?: { 
    url: string, 
    position?: 'left-top' | 'top' | 'right-top' | 'left-bottom' | 'bottom' | 'right-bottom'
  };
  fontColor?: string;
}>();

const headerPosition = computed(() => {
    if (props.icon === undefined) {
        return {};
    }

    const position = props.icon.position ?? "left-top";
    switch(position) {
        case 'left-top':
            return {
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)'
            }
        case 'top':
            return {
                left: '50%',
                top: 0,
                transform: 'translate(-50%, -50%)'
            }
        case 'right-top':
            return {
                right: 0,
                top: 0,
                transform: 'translate(50%, -50%)'
            }
        case 'left-bottom':
            return {
                left: 0,
                bottom: 0,
                transform: "translate(-50%, 50%)"
            }
        case 'bottom':
            return {
                left: '50%',
                bottom: 0,
                transform: "translate(-50%, 50%)"
            }
        case "right-bottom":
            return {
                right: 0,
                bottom: 0,
                transform: "translate(50%, 50%)"
            }
        default:
            throw Error("props.icon.position is invalid")
    }
});

</script>
<template>
  <section class="colorful-card">
    <header 
      v-if="props.icon !== undefined"
      :style="headerPosition"
    >
       <img :src="props.icon!.url">
    </header>
    <main :style="{ color: props.fontColor ?? 'lightblue' }">
        <slot></slot>
    </main>
  </section>
</template>
<style lang="scss" scoped>
.colorful-card {
    position: relative;
    border-radius: 4px;
    border: 1px solid var(--vp-c-brand-bold);
    transition: all 200ms ease-out;
    
    &:hover {
        box-shadow: 0 0 4px 2px var(--vp-c-brand);
        transform: translateY(4px);
    }

    & > header {
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;

        & > img {
            object-fit: contain;
            width: 100%;
            height: 100%;
        }
    }

    & > main {
        margin: 0;
        padding: 10px 40px 10px;
    }
}
</style>