<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js'
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js'

const containerRef = ref<HTMLDivElement | null>(null)

const deferRun = (runner: () => any, milliseconds: number) => {
  setTimeout(() => {
    runner()
  }, milliseconds)
}

onMounted(() => {
  async function loadMMD(options: {
    scene: THREE.Scene, 
    camera: THREE.Camera,
    effect: OutlineEffect,
    renderer: THREE.WebGLRenderer,
  }) {
    const { scene, camera, effect, renderer } = options
    const clock = new THREE.Clock()
    const actionPanel: Map<string, THREE.AnimationAction> = new Map()
    const actionHutaoDance = "hutao_qiuqiu_ren"
    let mixer: THREE.AnimationMixer | undefined

    function animate() {
      requestAnimationFrame(animate)
      const delta = clock.getDelta()
      mixer?.update(delta)
      effect.render(scene, camera)
      
    }

    const loader = new MMDLoader()
    const skinnedMesh = await loader.loadAsync("/models/hutao.pmx")
    const materials = skinnedMesh.material as THREE.Material[]
    materials.forEach(material => {
      const m = material as any
      m.lightMap = m.map
      m.lightMapIntensity = 3
      m.shininess = 1
    })
    skinnedMesh.position.y = -10
    scene.add(skinnedMesh)

    loader.loadAnimation(
      "/models/hutao1.vmd", 
      skinnedMesh,
      async (animationClip) => {
        const clip = animationClip as THREE.AnimationClip
        
        mixer = new THREE.AnimationMixer(skinnedMesh)
        const action = mixer.clipAction(clip);
        actionPanel.set(actionHutaoDance, action)

        // 1. 监听者，挂载到相机
        // const listener = new THREE.AudioListener();
        // camera.add(listener);

        // 2. 创建音频源
        // const sound = new THREE.Audio(listener);
        // const audioLoader = new THREE.AudioLoader();

        // const buffer = await audioLoader.loadAsync('/models/hutao-audio.mp3');
        // sound.setBuffer(buffer);
        // sound.setVolume(0.8);
        
        const playOnce = () => {
          action.reset()
          action.time = 0.5
          action.paused = false 
          action.loop = THREE.LoopOnce
          action.clampWhenFinished = true
          action.play()
          // sound.play()
        }

        playOnce()
        
        window.addEventListener("keydown", (e) => {
          if (e.key === 'p' && action.paused) {
            deferRun(playOnce, 100)
          }
        })

        renderer.domElement.addEventListener("mousemove", () => {
          if (action.paused) {
            deferRun(playOnce, 100)
          }
        })
      }
    )

    

    animate()
  }

  function createCamera() {
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.value!.offsetWidth / containerRef.value!.offsetHeight,
      1,
      2000
    )
    camera.position.z = 30
    return camera
  }

  function addLightToScene(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.add(ambientLight)
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight.position.set(10, 15, 10)
    scene.add(directionalLight)
  }

  function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(
      containerRef.value!.offsetWidth, 
      containerRef.value!.offsetHeight
    )
    return renderer
  }

  const scene = new THREE.Scene()
  addLightToScene(scene)

  const renderer = createRenderer()
  const effect = new OutlineEffect(renderer)

  containerRef.value!.appendChild(renderer.domElement)
  const stats = new Stats()
  containerRef.value!.appendChild(stats.dom)

  const camera = createCamera()
  

 
  loadMMD({ scene, camera, effect, renderer })
})
</script>

<template>
  <div ref="containerRef" class="model-container"></div>
</template>

<style scoped>
.model-container {
  width: 400px;
  height: 600px;
  margin: 0 auto;
  border: none;
  position: fixed;
  left: 0;
  top: 40px;
  background: transparent;
}
</style> 