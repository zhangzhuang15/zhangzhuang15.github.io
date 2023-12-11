<script lang="ts" setup>
/**
 * 一个组件，检测当天是哪个有影响力的人的生日，缅怀他
 */

import { defineProps, ref, onMounted, onUnmounted, computed, unref } from "vue";

const props = defineProps<{
    data: { 
        name: string; 
        iconUrl: string; 
        words: string; 
        footer: string;
        birthday: string; 
        deathday: string; 
        tags: string[] 
    }[]
}>();

const getCurrentDateString = () => {
    // 表示 2023年12月10日
    // new Date().toLocaleDateString() -> '12/10/2023'
    // 必须要设置 'en-US', 否则返回的年、月、日顺序是根据当地时区习惯来的，
    // 比如说，在中国，就会返回 '2023/12/10'；
    // 时间依旧是按照当地时间计算的，只是表示的形式参考当地时区，如果
    // 时间是北京时间 2023年12月10日 10点， 设置'en-US'后，时间
    // 依旧是 2023年12月10日，不会因为时差变成 2023年12月9日！
    const [month, day, year] = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit"}).split('/')
    return [year, month, day].join('.')
}

const getPeopleShouldBeMemorized = (source: Readonly<typeof props.data>) => {
    // 2023.04.21
    const dateString = getCurrentDateString()
    // 擦出之后，得到 04.21
    const eraseYearPart = /[0-9]*?\./
    const mothAndDay = dateString.replace(eraseYearPart, '')
    return source.filter(item => 
      [
          item.birthday.replace(eraseYearPart, ''), 
          item.deathday.replace(eraseYearPart, '')
      ].includes(mothAndDay)
    )
}

const millisecondsBeforeNextDay = () => {
    const now = new Date()
    const today = new Date(now)

    // 设置的是当地时间
    now.setHours(23, 59, 59, 999)

    return now.getTime() - today.getTime()
}

const sourceData: typeof props.data = [
    {
        name: "张雨生",
        iconUrl: "https://www.shinatian.com/static/people/46/26926.jpg",
        words: "我期待，有一天我会回来, 回到我最初的爱, 回到童真的神采",
        footer: "《我期待》",
        birthday: "1966.06.07",
        deathday: "1997.11.12",
        tags: ["宝哥", "歌手", "音乐制作人"],
    },
    {
        name: "黄家驹",
        iconUrl: "https://img.mp.itc.cn/upload/20170630/fd122f385da94f01ad4a8d7c9989e0ef.jpg",
        words: "心中一股冲劲勇闯，抛开那现实没有顾虑，仿佛身边拥有一切，看似与别人筑起隔膜",
        footer: "《再见理想》",
        birthday: "1962.06.10",
        deathday: "1993.06.30",
        tags: ["音乐人", "吉他手", "beyond", "创作型", "摇滚"]
    },
    {
        name: "Freddie Mercury（佛莱迪·摩克瑞）",
        iconUrl: "https://spider.ws.126.net/fa9d8bc16c57b6f947e5da2f209a75fc.jpeg",
        words: "Nothing really matters, nothing really matters to me, any way the wind blows... ",
        footer: "《Bohemian Rhapsody》（波西米亚狂想曲）",
        birthday: "1946.09.05",
        deathday: "1991.11.24",
        tags: ["音乐家", "queen", "牙叔", "摇滚"]
    },
    {
        name: "Robert De Niro（罗伯特·德尼罗）",
        iconUrl: "https://i.loli.net/2017/10/24/59ef61ef2ee2b.gif",
        words: "Life is stranger than shit, that's all.It's a pisser.No big story.",
        footer: "《Once Upon a Time in America》（美国往事）",
        birthday: "1943.08.17",
        deathday: "Now",
        tags: ["演员", "导演", "教父", "演技之神", "美国往事", "noodles"]
    },
    {
        name: "Michael Jackson（迈克尔·杰克逊）",
        iconUrl: "https://5b0988e595225.cdn.sohucs.com/images/20170830/4bf59498b6c14781ac6e30bc2fa00f54.gif",
        words: "We are the world, we are the children, We are the ones who make a brighter day, So let's start giving",
        footer: "《We Are The World》（四海一家）",
        birthday: "1958.08.29",
        deathday: "2009.06.25",
        tags: ["歌唱家", "舞蹈家", "音乐制作人", "迈神", "King of Pop"],
    },
    {
        name: "坂井泉水",
        iconUrl: "https://p4.itc.cn/q_70/images03/20201120/4c3339b3130f4b77a36dd570a4a075a0.gif",
        words: "あの微笑みを忘れないで, Forget your worries and give me your smile, 心の冬にさよならして, 走り出そう　新しい明日へ",
        footer: "《あの微笑みを忘れないで》",
        birthday: "1967.02.06",
        deathday: "2007.05.27",
        tags: ["姐姐", "词曲创作者", "ZARD", "柯南歌姬"]
    }
    
];

const messages = ref<typeof props.data>([]);
const activeMessageIndex = ref(0);
const activeMessage = computed(() => messages.value[activeMessageIndex.value]);
const updateMessage = () => {
    messages.value = getPeopleShouldBeMemorized(sourceData);
    activeMessageIndex.value = 0;
}


let timeout: number | null = null;
// 来到新的一天，更新要缅怀的人
const schedule = () => {
    if (timeout !== null) {
        clearTimeout(timeout)
    }
    const milliseconds = millisecondsBeforeNextDay();
    timeout = setTimeout(() => {
        updateMessage()
        schedule()
    }, milliseconds)
}

let interval: number | null = null;
const scrollShow = () => {
    if (interval) {
        clearInterval(interval);
    }

    interval = setInterval(() => {
        const i = (unref(activeMessageIndex) + 1) % (unref(messages).length)
        activeMessageIndex.value = i
    }, 8_000)
}

updateMessage();

onMounted(() => {
    schedule()
    scrollShow()
})

onUnmounted(() => {
   if (timeout !== null) {
    clearTimeout(timeout)
   }
   if (interval) {
    clearInterval(interval)
   }
});

</script>

<template>
    <div class="container"  v-if="messages.length > 0">
        <div class="avatar" >
            <img 
              v-for="(message, index) in messages" 
              :src="message.iconUrl" 
              :class="{'active': activeMessageIndex === index }"
            />
        </div>
        <section class="board">
          <header class="header">
            <h3>{{ activeMessage.name }}</h3>
            <div class="tag-flexable-container">
                <span class="tag" v-for="item in activeMessage.tags">{{ item }}</span>
            </div>
            <div>
               <time>{{ activeMessage.birthday }}</time> - <time>{{ activeMessage.deathday }}</time>
            </div>
          </header>
          <footer>
            <blockquote>
                <p>{{ activeMessage.words }}</p>
                <footer class="footer">—— {{ activeMessage.footer }}</footer>
            </blockquote>
          </footer>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.container {
    position: relative;
}
.avatar {
        position: absolute;
        top: 0;
        right: 0;
        border: 1px solid transparent;
        border-radius: 50%;
        overflow: hidden;
        width: var(--home-circle-size);
        height: var(--home-circle-size);
        transition: transform .8s;
        z-index: 9;

        img {
            position: absolute;
            top: 0;
            object-fit: cover;
            width: 100%;
            height: 100%;
            transition: all .6s, visibility .8s, transform .3s ease-out;
            transform: translateY(100%) scale(0);
        }

        .active {
            transform: scale(1) translateY(0);
        }

        &:hover {
           transform: translate(4px, -4px) scale(1.8) ;

           img.active {
            transform: scale(1.3) translateY(0);

           }
        }

        &:hover + .board {
            visibility: visible;
            transform: scaleY(1) scale(1);
        }


}

.board {
    // 必须是 absolute，否则会影响到音乐按钮的点击
    position: absolute;
    min-width: 420px;
    border-radius: 4px;
    border: 1px solid transparent;
    box-shadow: 0 0 4px 0 var(--vp-c-brand-light);
    padding: 8px 14px;
    visibility: hidden;
    translate: calc(-100% + var(--home-circle-size)) 0;
    transform: scaleY(0) scaleX(0);
    transform-origin: calc(100% - var(--home-circle-size-half)) var(--home-circle-size-half);
    transition: visibility .8s, transform .6s;
    background: var(--vp-c-bg);

    &:hover {
        visibility: visible;
        transform: scaleY(1) scale(1);
    }
}


.header {
    position: relative;

    h3 {
        margin: 0;
        padding-right: var(--home-circle-size-half);
    }
    
    .tag-flexable-container {
        display: flex;
        gap: 4px;
        margin: 2px 0;
        flex-wrap: wrap;
    }

    .tag {
        border: 1px solid var(--vp-c-brand-light);
        border-radius: 8px;
        padding: 1px 4px;
        font-size: 12px;
        line-height: 1.2;
    }
}

.footer {
}

@media (max-width: 415px), (max-width: 320px) {
    .board {
        max-width: 300px;
        min-width: 200px;
        max-height: 200px;
        overflow: scroll;

        ::v-deep(blockquote) {
            p, .footer {
                font-size: 14px;
            }
        }
    }

    .header {
        font-size: 14px;
        h3 {
            font-size: 18px;
        }
    }

}
</style>