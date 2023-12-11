<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
    size: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    }
});

const paused = ref(true);

const player = ref<HTMLAudioElement | null>(null);

const onClick = () => {
    paused.value = !paused.value;

    const audioPlayer = player.value as HTMLAudioElement;
    paused.value ? audioPlayer.pause() : audioPlayer.play() ;
};

onMounted(() => {
    player.value = document.getElementById("player") as HTMLAudioElement;
   
    // read this article: https://arrangeactassert.com/posts/how-to-fix-the-request-is-not-allowed-by-the-user-agent-or-the-platform-in-the-current-context-possibly-because-the-user-denied-permission/#:~:text=For%20example%2C%20clicking%20on%20the%20%27play%27%20button%20after,Clicking%20play%20resolves%20a%20promise%20before%20playing%20audio
    // we know that browser stop us playing a music without an active UX action, such as click action.
    // so, it doesn't work when we invoke player.value.play() here, music won't be played.

    // duration获取到的长度，比歌曲本身的长度大一些
    // player.value.addEventListener("loadedmetadata", (e) =>{
    //     console.log("duration: ", player.value?.duration)
    // } )
});

onBeforeUnmount(() => {
    player.value && (player.value.loop = false, player.value.muted = true);
    player.value?.pause();
    player.value = null;

    paused.value = true;
});

</script>
<template>
    <div :class="['music-icon-button-container', paused ? 'paused' : '']">
        <div :class="['music-icon-button', paused ? 'paused' : '']" :style="{ width: props.size, height: props.size }" @click="() => onClick()">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none"><path d="M11.513 2.048a.75.75 0 0 0-1.013.702v12.127a4 4 0 1 0 1.476 3.56a.749.749 0 0 0 .024-.187V8.832l6.987 2.62A.75.75 0 0 0 20 10.75V7.483a3.25 3.25 0 0 0-2.109-3.044l-6.378-2.391z" fill="currentColor"></path></g></svg>
          <audio id="player" :src="props.source"  loop preload="auto" ></audio>
       </div>
       <div class="progressbar-container">
        <!-- viewBox 是虚拟坐标系，随便设置，按照使用习惯，常常设置为 0 0 100 100
             svg 在没有指定 width 和 height 时，会和父容器保持一致
             svg天然带有 overflow: hidden 属性，svg的图形压到边界时，会截断，出于这个原因，
             下边画圆环时，r=48 不是 50, stroke-width 设置为 2
        -->
          <svg viewBox="0 0 100 100">
            <circle 
              :class="['progressbar', paused ? 'paused' : '']"
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              stroke-linecap="round"
            />
          </svg>
       </div>
    </div>
   
</template>
<style>
@keyframes roll {
    0% {
        transform: rotate(0deg);
    }

    50% {
        transform: rotate(180deg);
    }

    100% {
        transform: rotate(360deg);
        
    }
    
}

@keyframes rotating {
    from {
      stroke-dasharray: 0 320;
    }
  
    to {
      stroke-dasharray: 320 0;
    }
}
</style>
<style lang="scss" scoped>
.music-icon-button-container {
    position: relative;
    border-radius: 50%;
    // border: 2px solid rgba(108, 107, 107, 0.4);
    box-shadow: rgba(108, 107, 107, 0.4) 0 0 0 2px;
}


.music-icon-button {
    position: relative;
    z-index: 3;
    border-radius: 50%;
    border: 2px solid transparent;
    background-color: transparent;
    animation: roll 4s linear 200ms infinite;
    animation-play-state: running;
    overflow: hidden;
}


.music-icon-button.paused, .music-icon-button-container.paused {
    animation-play-state: paused;
}

.progressbar-container {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    .progressbar {
        animation: rotating 213s linear infinite;
        transform: rotateZ(-90deg);
        transform-origin: center;
        stroke: var(--vp-c-brand-light);
        stroke-width: 2;
    }

    .progressbar.paused {
        animation-play-state: paused;
    }
}
</style>