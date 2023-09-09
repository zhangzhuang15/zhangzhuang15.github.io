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
});

onBeforeUnmount(() => {
    player.value && (player.value.loop = false, player.value.muted = true);
    player.value?.pause();
    player.value = null;

    paused.value = true;
});

</script>
<template>
    <div :class="['music-icon-button', 'roll', paused ? 'paused' : '']" :style="{ width: props.size, height: props.size }" @click="() => onClick()">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none"><path d="M11.513 2.048a.75.75 0 0 0-1.013.702v12.127a4 4 0 1 0 1.476 3.56a.749.749 0 0 0 .024-.187V8.832l6.987 2.62A.75.75 0 0 0 20 10.75V7.483a3.25 3.25 0 0 0-2.109-3.044l-6.378-2.391z" fill="currentColor"></path></g></svg>
        <audio id="player" :src="props.source"  loop preload="auto"></audio>
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
</style>
<style scoped>
.music-icon-button {
    border-radius: 50%;
    border: 1px solid rgba(108, 107, 107, 0.4);
    padding: 5px;
}

.music-icon-button.roll {
    animation: roll 4s linear 200ms infinite;
    animation-play-state: running;
}

.music-icon-button.roll.paused {
    animation-play-state: paused;
}
</style>