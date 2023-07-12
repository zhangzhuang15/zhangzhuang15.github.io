---
title: "我的旅行"
page: true
aside: true
---
<script setup>
    // Use Vue in Markdown,
    // refer: https://vitepress.dev/guide/using-vue#script-and-style

    import { NCarousel } from "naive-ui"
</script>
<style module>
.item {
    width: auto;
    height: 30rem !important;
    object-fit: cover;
}
</style>

# My Travel

## 广西北海(2023.07.07~2023.07.09)
北海在广西的南部，如果乘车11个小时的话，就可以来到海南海口。

这里的阳光非常强烈，如果没有做好防晒措施的话，很容易受伤，脖子、小腿、小臂都是红通通的一片，到了晚上就会火辣辣地疼。所以你可以看到这里的人们，大多骑着小电动车，带着帽子和墨镜，裹着围巾，穿着防晒衣。

生活节奏非常慢，比成都还要慢。到了晚上7点左右，街边的大排档就立马热闹起来。大排档的风格和广东一样，喝啤酒、划拳、侃大山，非常有生活气息。骑着电动车，不出40分钟，就能来到海边。

尽管三面环海，但海鲜并不便宜，特别是在禁渔期，海鲜很贵，过了8月，就可以捕鱼了，这个时候来北海，海鲜的价格可能就会很实惠了。

这里唯一的风景就是大海。海滩非常棒，至少比东戴河、滨海要好许多。

说实话，玩了两天，还没有吃尽兴，这里好吃的非常多，我只尝试了这些：
- 叉烧螺狮粉
- 蟹仔粉
- 炒蟹
- 烧仙草味的糖水
- 炒冰
- 白灼虾
- 沙虫汤
- 海鲜炒面
- 牛腩煲

旅游期间，温度比北京要低个4、5度，就是晒，不算特别热。

如果说哪里最让我留恋忘返，就三个地方：
- 金滩沿街（美女多，小吃摊多，夕阳入海打卡圣地）
- 侨港风情街（小吃摊多）
- 银滩（海滩开阔，视野非常好）

饮食习惯上，我还学习到了一个新东西——“烫餐具”。

在北方，进入餐馆，餐具包装膜打开后，餐具就可以直接用了；

在这里，桌子上会有一个小塑料盆，盆里有茶壶，打开餐具包装膜后，要用茶壶往杯子里倒满水，用茶水去烫一烫餐具，比如碗、勺子、碟子什么的，然后将茶水和餐具包装膜放入塑料盆里即可，茶壶里剩下的水可以继续饮用。这种做法，感觉就像泡茶的工序，很雅。

<n-carousel show-arrow draggable centered-slides mousewheel autoplay interval="4000" dot-type="line">
<img :class="$style.item" src="/sea_hug.jpg" alt="北海银滩，拥抱大海" title="北海银滩，拥抱大海" />
<img :class="$style.item" src="/sea_hug2.jpg" alt="北海银滩，拥抱大海" title="北海银滩，拥抱大海" />
<img :class="$style.item" src="/with_frog_girl.jpg" alt="与青蛙小姐姐" title="与青蛙小姐姐" />
</n-carousel>



<Giscus />
