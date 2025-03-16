<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js'
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import "ammo.js"

const containerRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  function loadMMD(scene: THREE.Scene, camera: THREE.Camera) {
    const loader = new MMDLoader()

    loader.load(
      "/models/hutao.pmx",
      async (mesh) => {
        mesh.position.y = -10
        const materials = mesh.material as THREE.Material[]
        materials.forEach(material => {
          material.lightMap = material.map
          material.lightMapIntensity = 5
          material.shininess = 10
        })

        scene.add(mesh)

        function animate() {
          requestAnimationFrame(animate)
          effect.render(scene, camera)
        }

        animate()
      },
      async (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loadedstore');
      },
      function (error) { 
        console.log('An error happened');
      }
    )
  }

  const camera = new THREE.PerspectiveCamera(
    45,
    containerRef.value!.offsetWidth / containerRef.value!.offsetHeight,
    1,
    2000
  )
  camera.position.z = 30

  const scene = new THREE.Scene();

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1)
  directionalLight.position.set(1, 1, 1).normalize()

  scene.add(directionalLight)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(containerRef.value!.offsetWidth, containerRef.value!.offsetHeight)

  containerRef.value!.appendChild(renderer.domElement)

  const effect = new OutlineEffect(renderer)

  const stats = new Stats()
  containerRef.value!.appendChild(stats.dom)

  loadMMD(scene, camera)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.minDistance = 10
  controls.maxDistance = 100  
})
</script>

<template>
  <div ref="containerRef" class="model-container"></div>
</template>

<style scoped>
.model-container {
  width: 400px;
  height: 400px;
  margin: 0 auto;
  border: 1px solid #ccc;
}
</style> 