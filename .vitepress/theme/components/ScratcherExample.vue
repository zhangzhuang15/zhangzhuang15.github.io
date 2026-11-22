<script setup lang="ts">
import { NRadio, NRadioGroup, NSlider } from "naive-ui"
import { Konfeti as firework } from "konfeti"
import { ref, onMounted, nextTick } from "vue"

const choices = ref([
  "source-over",
  "source-in",
  "source-out",
  "source-atop",
  "destination-over",
  "destination-in",
  "destination-out",
  "destination-atop",
  "lighter",
  "copy",
  "xor",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity"
] as const)
const currentChoice = ref<typeof choices.value[number]>("destination-out")
const currentLineWidth = ref(3)
const halfPixelsScratched = ref(false)

let ctx: CanvasRenderingContext2D
let canvasRect: DOMRect
const scaleXY = { x: 0, y: 0 }
let alreadyExplode = false

const onChangeChoice = (val: typeof currentChoice.value) => {
  currentChoice.value = val
  prepareWall(ctx, canvasRect)
  alreadyExplode = false
  halfPixelsScratched.value = false
}

const onChangeLineWidth = (val: number) => {
  ctx.lineWidth = val
  currentLineWidth.value = val
}

function setPencile(_ctx: typeof ctx) {
  _ctx.lineCap = "round"
  _ctx.lineJoin = "round"
  _ctx.lineWidth = currentLineWidth.value
}

function fillCanvas(_ctx: typeof ctx, rect: typeof canvasRect) {
  ctx.fillStyle = 'lightblue'
  ctx.fillRect(0, 0, rect.width, rect.height)
}

function prepareContext() {
  const canvas = document.getElementById("wall") as HTMLCanvasElement
  const canvasWidth = canvas.width, canvasHeight = canvas.height;
  ctx = canvas.getContext('2d')!
  canvasRect = canvas.getBoundingClientRect()

  // canvas坐标尺寸 到 canvas css尺寸 的转换系数，
  // 我们都到的数据都是css尺寸，不同直接用在canvas API
  // 里，必须转换成canvas坐标尺寸。如果不这样做，
  // 画笔的位置和鼠标位置不能重合，简言之，画笔不跟手
  scaleXY.x = canvasWidth / canvasRect.width
  scaleXY.y = canvasHeight / canvasRect.height

  const info = `
   canvas坐标尺寸
   canvas width: ${canvasWidth}
   canvas height: ${canvasHeight}

   canvas css尺寸
   canvas css width: ${canvas.width}px
   canvas css height: ${canvas.height}px

   scaleX: ${scaleXY.x}
   scaleY: ${scaleXY.y}
  `
  console.log(info)

  return {
    canvas, ctx, canvasRect
  }
}

function prepareWall(_ctx: typeof ctx, rect: typeof canvasRect) {
  // 清空canvas
  _ctx.reset()
  setPencile(_ctx)
  fillCanvas(_ctx, rect)
  _ctx.globalCompositeOperation = currentChoice.value
}

function registerScratch(context: {
  canvas: HTMLCanvasElement,
  ctx: typeof ctx,
  rect: typeof canvasRect,
  scaleXY: typeof scaleXY
}) {
  // mousemove事件无法区分移动的时候，鼠标左键是否按下了，
  // 我们单独引入一个变量搞定这个问题
  let isPress = false

  let mouseDownHandler: (e: MouseEvent) => void,
    mouseMoveHandler: (e: MouseEvent) => void,
    mouseUpHandler: (e: MouseEvent) => void

  const { canvas, ctx, rect, scaleXY } = context
  canvas.addEventListener("mousedown", mouseDownHandler = (e) => {
    isPress = true
    const posx = (e.clientX - rect.left) * scaleXY.x
    const posy = (e.clientY - rect.top) * scaleXY.y
    ctx.moveTo(posx, posy)
  })

  canvas.addEventListener("mousemove", mouseMoveHandler = (e) => {
    if (!isPress) return
    const posx = (e.clientX - rect.left) * scaleXY.x
    const posy = (e.clientY - rect.top) * scaleXY.y
    ctx.lineTo(posx, posy)
    // 如果不调用stroke, 无法立即看到绘制结果
    ctx.stroke()
  })

  canvas.addEventListener("mouseup", mouseUpHandler = (e) => {
    const posx = (e.clientX - rect.left) * scaleXY.x
    const posy = (e.clientY - rect.top) * scaleXY.y
    ctx.lineTo(posx, posy)
    ctx.stroke()
    isPress = false
  })

  const intervalID = setInterval(() => {
    if (!isPress) return
    if (currentChoice.value !== 'destination-out') return
    const hotRect = { x: 120, y: 60, width: 44, height: 50 }
    const { data: imageData } = ctx.getImageData(
      hotRect.x, hotRect.y,
      hotRect.width, hotRect.height
    )
    let scratchedPixels = 0
    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] < 80) scratchedPixels++
    }
    // 过半像素被擦除
    if (scratchedPixels < (imageData.length / 4) / 2) return
    halfPixelsScratched.value = true

    if (alreadyExplode) return
    alreadyExplode = true

    nextTick(() => {
      // refer: https://konfeti.mbattaloglu.com/tools/konfeti/docs/
      firework.fire({
        spread: 300,
        origin: document.querySelector("#fireworkHotSpot")!,
        formation: {
          text: "GOT EM",
          font: "900 140px sans-serif",
          mode: 'assemble',
          assemble: 800,
          hold: 1500,
          spacing: 8
        },
        shapes: [
          { type: "paper", weight: 4 },
          { type: "star" },
          { type: 'emoji', emoji: ['🎉', '✌️', '🍦', '🐶'] }
        ]
      })
    })

  }, 1000)

  return () => {
    canvas.removeEventListener("mousedown", mouseDownHandler)
    canvas.removeEventListener("mousemove", mouseMoveHandler)
    canvas.removeEventListener("mouseup", mouseUpHandler)
    clearInterval(intervalID)
  }
}

onMounted(() => {
  const { canvas } = prepareContext()
  prepareWall(ctx, canvasRect)
  // ctx.rect(128, 60, 44, 50)
  // ctx.fill()
  return registerScratch({
    canvas, ctx, rect: canvasRect, scaleXY
  })
})
</script>
<template>
  <div class="grid grid-cols-2">
    <div class="relative w-[300px] h-[200px]">
      <div class="w-full h-full">
        <img class="w-full !h-full object-contain" src="/unionNikeSock.JPG">
      </div>
      <canvas id="wall" class="absolute w-full h-full top-[0] left-[0] cursor-crosshair" />
      <div class="bottom-[0] translate-y-full text-pink-200 font-bold text-[16px]" id="fireworkHotSpot"
        v-show="currentChoice === 'destination-out'">
        {{ halfPixelsScratched ? "刮开了" : "刮刮看吧" }}
      </div>
    </div>
    <div>
      <b>ctx.globalCompositeOperation:</b>
      <n-radio-group v-model:value="currentChoice" :on-update:value="onChangeChoice">
        <n-radio :key="choice" :value="choice" v-for="choice of choices">
          <span class="text-white">{{ choice }}</span>
        </n-radio>
      </n-radio-group>

      <b>画笔粗细：</b>
      <n-slider :min="3" :max="15" :default-value="currentLineWidth" @on-update:value="onChangeLineWidth"></n-slider>
    </div>
  </div>
</template>
