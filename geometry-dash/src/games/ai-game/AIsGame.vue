<template>
  <div class="ai-game-root" ref="rootEl">
    <canvas ref="canvasEl" class="game-canvas" @contextmenu.prevent></canvas>

    <!-- HUD -->
    <div class="hud" v-if="gameStarted && !gameWon">
      <div class="hud-top-left">
        <div class="hud-bar health-bar">
          <span class="bar-label">HP</span>
          <div class="bar-bg"><div class="bar-fill health-fill" :style="{ width: health + '%' }"></div></div>
          <span class="bar-val">{{ Math.ceil(health) }}</span>
        </div>
        <div class="hud-bar energy-bar">
          <span class="bar-label">FUEL</span>
          <div class="bar-bg"><div class="bar-fill energy-fill" :style="{ width: energy + '%' }"></div></div>
          <span class="bar-val">{{ Math.ceil(energy) }}</span>
        </div>
      </div>
      <div class="hud-top-right">
        <div class="crystal-counter">
          <span class="crystal-icon">&#x1F48E;</span>
          <span class="crystal-num">{{ crystals }} / {{ crystalsNeeded }}</span>
        </div>
        <div class="materials-counter">
          <span class="mat-icon">&#x1F9F1;</span>
          <span class="mat-num">{{ materials }}</span>
        </div>
        <div class="day-display">{{ dayNightLabel }}</div>
      </div>
      <div class="hud-bottom-center" v-if="message">
        <div class="game-message">{{ message }}</div>
      </div>
      <div class="hud-controls-hint" v-if="showControlsHint">
        <div>WASD - Move | SPACE - Jump/Jetpack | Mouse - Look</div>
        <div>E - Build Base Block | F - Interact</div>
      </div>
    </div>

    <!-- Title Screen -->
    <div class="title-screen" v-if="!gameStarted">
      <div class="title-glow">AI's Game</div>
      <div class="title-sub">Crash-landed on an alien world</div>
      <div class="title-desc">Explore floating islands, crystal caves, and mushroom forests. Collect {{ crystalsNeeded }} energy crystals to repair your ship!</div>
      <button class="start-btn" @click="startGame">LAUNCH MISSION</button>
      <div class="controls-info">
        <div>WASD - Move | SPACE - Jump / Jetpack</div>
        <div>Mouse - Look Around | E - Build | F - Interact</div>
      </div>
    </div>

    <!-- Win Screen -->
    <div class="win-screen" v-if="gameWon">
      <div class="win-title">MISSION COMPLETE!</div>
      <div class="win-sub">You repaired the ship and escaped the alien planet!</div>
      <div class="win-stats">Crystals: {{ crystals }} | Base Blocks: {{ baseBlocks }} | Time: {{ playTimeFormatted }}</div>
      <button class="start-btn" @click="resetGame">PLAY AGAIN</button>
    </div>

    <!-- Back Button -->
    <button class="back-btn" @click="goBack">&#x2190; Back</button>

    <!-- Mobile Controls -->
    <div class="mobile-controls" v-if="isMobile && gameStarted && !gameWon">
      <div class="joystick-zone" ref="joystickZone"
        @touchstart.prevent="onJoystickStart"
        @touchmove.prevent="onJoystickMove"
        @touchend.prevent="onJoystickEnd">
        <div class="joystick-base">
          <div class="joystick-knob" :style="joystickStyle"></div>
        </div>
      </div>
      <div class="mobile-buttons">
        <button class="mobile-btn jump-btn" @touchstart.prevent="mobileJump = true" @touchend.prevent="mobileJump = false">JUMP</button>
        <button class="mobile-btn build-btn" @touchstart.prevent="mobileBuild">BUILD</button>
        <button class="mobile-btn interact-btn" @touchstart.prevent="mobileInteract">USE</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()
const rootEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const joystickZone = ref<HTMLDivElement | null>(null)

// Game state
const gameStarted = ref(false)
const gameWon = ref(false)
const health = ref(100)
const energy = ref(100)
const crystals = ref(0)
const crystalsNeeded = 20
const materials = ref(0)
const baseBlocks = ref(0)
const message = ref('')
const showControlsHint = ref(true)
const dayNightLabel = ref('DAY')
const playTime = ref(0)
const isMobile = ref(false)

// Mobile controls
const mobileJump = ref(false)
const joystickX = ref(0)
const joystickY = ref(0)
const joystickActive = ref(false)
let joystickTouchId: number | null = null

const joystickStyle = computed(() => ({
  transform: `translate(${joystickX.value * 30}px, ${joystickY.value * 30}px)`
}))

const playTimeFormatted = computed(() => {
  const m = Math.floor(playTime.value / 60)
  const s = Math.floor(playTime.value % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

// Three.js vars
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let animId: number
let clock: THREE.Clock

// Player
let playerMesh: THREE.Group
let playerPos = new THREE.Vector3(0, 5, 0)
let playerVel = new THREE.Vector3(0, 0, 0)
let playerOnGround = false
let cameraYaw = 0
let cameraPitch = -0.3
const cameraDistance = 12
const cameraHeight = 5

// Input
const keys: Record<string, boolean> = {}
let mouseDown = false
let lastMouseX = 0
let lastMouseY = 0

// World objects
let terrainMesh: THREE.Mesh
let waterMesh: THREE.Mesh
const crystalObjects: THREE.Object3D[] = []
const creatureObjects: { mesh: THREE.Object3D; type: 'friendly' | 'dangerous'; vel: THREE.Vector3; phase: number }[] = []
const floatingIslands: THREE.Object3D[] = []
const plantObjects: THREE.Object3D[] = []
const particleSystems: THREE.Points[] = []
const baseBlockMeshes: THREE.Mesh[] = []
let shipMesh: THREE.Group
let sunLight: THREE.DirectionalLight
let ambientLight: THREE.AmbientLight
let skyMesh: THREE.Mesh
let auroraMesh: THREE.Mesh | null = null

// Terrain generation
const TERRAIN_SIZE = 200
const TERRAIN_SEG = 100
let terrainHeights: Float32Array

// Day night cycle
let dayTime = 0 // 0-1, 0=noon, 0.25=sunset, 0.5=midnight, 0.75=sunrise

function getTerrainHeight(x: number, z: number): number {
  if (!terrainHeights) return 0
  const halfSize = TERRAIN_SIZE / 2
  const gx = ((x + halfSize) / TERRAIN_SIZE) * TERRAIN_SEG
  const gz = ((z + halfSize) / TERRAIN_SIZE) * TERRAIN_SEG
  const ix = Math.floor(Math.max(0, Math.min(TERRAIN_SEG, gx)))
  const iz = Math.floor(Math.max(0, Math.min(TERRAIN_SEG, gz)))
  const idx = iz * (TERRAIN_SEG + 1) + ix
  if (idx < 0 || idx >= terrainHeights.length) return 0
  return terrainHeights[idx]
}

function simplex2D(x: number, y: number): number {
  // Simple noise approximation using sin
  return (
    Math.sin(x * 0.1 + y * 0.13) * 0.5 +
    Math.sin(x * 0.23 - y * 0.17) * 0.3 +
    Math.sin(x * 0.07 + y * 0.31) * 0.2 +
    Math.sin(x * 0.41 + y * 0.07) * 0.15 +
    Math.sin(x * 0.53 - y * 0.47) * 0.1
  )
}

function createTerrain(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  terrainHeights = new Float32Array(pos.count)

  const colors = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    let h = simplex2D(x * 0.8, z * 0.8) * 8
    h += simplex2D(x * 0.3, z * 0.3) * 4
    h += simplex2D(x * 1.5, z * 1.5) * 2
    // Create valleys near center for the crash site
    const distFromCenter = Math.sqrt(x * x + z * z)
    if (distFromCenter < 15) {
      h *= distFromCenter / 15
    }
    // Crystal biome - tall spikes in one area
    if (x > 30 && x < 70 && z > 30 && z < 70) {
      h += Math.abs(simplex2D(x * 3, z * 3)) * 6
    }
    // Mushroom forest area - gentle rolling
    if (x < -20 && z < -20) {
      h = h * 0.5 + 2
    }
    pos.setY(i, h)
    terrainHeights[i] = h

    // Color based on height and biome
    const nH = (h + 10) / 25
    if (x > 30 && x < 70 && z > 30 && z < 70) {
      // Crystal biome - purple/blue
      colors[i * 3] = 0.3 + nH * 0.2
      colors[i * 3 + 1] = 0.15 + nH * 0.15
      colors[i * 3 + 2] = 0.5 + nH * 0.3
    } else if (x < -20 && z < -20) {
      // Mushroom forest - dark green/teal
      colors[i * 3] = 0.1 + nH * 0.1
      colors[i * 3 + 1] = 0.3 + nH * 0.3
      colors[i * 3 + 2] = 0.2 + nH * 0.2
    } else {
      // Normal - alien green/blue grass
      colors[i * 3] = 0.15 + nH * 0.2
      colors[i * 3 + 1] = 0.35 + nH * 0.35
      colors[i * 3 + 2] = 0.2 + nH * 0.15
    }
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}

function createWater(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE * 2, TERRAIN_SIZE * 2)
  geo.rotateX(-Math.PI / 2)
  const mat = new THREE.MeshPhongMaterial({
    color: 0x1a6baa,
    transparent: true,
    opacity: 0.6,
    shininess: 100,
    specular: 0x88ccff
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = -2
  return mesh
}

function createSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(300, 32, 32)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDayTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDayTime;
      varying vec3 vWorldPos;
      void main() {
        float y = normalize(vWorldPos).y;
        // Day colors
        vec3 dayTop = vec3(0.2, 0.4, 0.9);
        vec3 dayBot = vec3(0.5, 0.8, 1.0);
        vec3 dayColor = mix(dayBot, dayTop, max(y, 0.0));
        // Night colors
        vec3 nightTop = vec3(0.02, 0.02, 0.1);
        vec3 nightBot = vec3(0.05, 0.02, 0.15);
        vec3 nightColor = mix(nightBot, nightTop, max(y, 0.0));
        // Sunset colors
        vec3 sunsetColor = vec3(1.0, 0.4, 0.2);
        // Mix based on day time
        float dayFactor = smoothstep(0.4, 0.6, cos(uDayTime * 6.28318));
        vec3 col = mix(nightColor, dayColor, dayFactor);
        // Sunset glow near horizon
        float sunsetFactor = 1.0 - abs(cos(uDayTime * 6.28318));
        sunsetFactor *= smoothstep(-0.1, 0.3, y) * smoothstep(0.6, 0.1, y);
        col = mix(col, sunsetColor, sunsetFactor * 0.7);
        // Stars at night
        float starNoise = fract(sin(dot(vWorldPos.xz * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
        float stars = step(0.997, starNoise) * (1.0 - dayFactor) * step(0.1, y);
        col += vec3(stars);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  })
  return new THREE.Mesh(geo, mat)
}

function createAurora(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(200, 40, 60, 10)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(p.x * 0.05 + uTime * 0.3) * 5.0;
        p.z += cos(p.x * 0.03 + uTime * 0.2) * 3.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec3 c1 = vec3(0.1, 1.0, 0.4);
        vec3 c2 = vec3(0.3, 0.4, 1.0);
        vec3 c3 = vec3(0.8, 0.2, 0.9);
        float t = sin(vUv.x * 6.28 + uTime * 0.5) * 0.5 + 0.5;
        vec3 col = mix(mix(c1, c2, t), c3, sin(vUv.x * 3.0 + uTime * 0.3) * 0.5 + 0.5);
        float alpha = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        alpha *= 0.4 * (sin(vUv.x * 10.0 + uTime) * 0.3 + 0.7);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, 80, -50)
  mesh.rotation.x = -0.3
  return mesh
}

function createPlayer(): THREE.Group {
  const group = new THREE.Group()

  // Body - astronaut suit
  const bodyGeo = new THREE.CapsuleGeometry(0.5, 1, 8, 16)
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 60 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1
  body.castShadow = true
  group.add(body)

  // Helmet - visor
  const helmetGeo = new THREE.SphereGeometry(0.45, 16, 16)
  const helmetMat = new THREE.MeshPhongMaterial({ color: 0x3388ff, shininess: 100, transparent: true, opacity: 0.7 })
  const helmet = new THREE.Mesh(helmetGeo, helmetMat)
  helmet.position.y = 2
  group.add(helmet)

  // Backpack / jetpack
  const packGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3)
  const packMat = new THREE.MeshPhongMaterial({ color: 0x666666 })
  const pack = new THREE.Mesh(packGeo, packMat)
  pack.position.set(0, 1.2, -0.4)
  group.add(pack)

  // Jetpack nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8)
  const nozzleMat = new THREE.MeshPhongMaterial({ color: 0xff4400 })
  const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat)
  nozzleL.position.set(-0.2, 0.7, -0.5)
  group.add(nozzleL)
  const nozzleR = new THREE.Mesh(nozzleGeo, nozzleMat)
  nozzleR.position.set(0.2, 0.7, -0.5)
  group.add(nozzleR)

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.5, 4, 8)
  const legMat = new THREE.MeshPhongMaterial({ color: 0xcccccc })
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.2, 0.2, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.2, 0.2, 0)
  group.add(legR)

  return group
}

function createCrystal(x: number, y: number, z: number, color: number = 0x00ffcc): THREE.Group {
  const group = new THREE.Group()
  const geo = new THREE.OctahedronGeometry(0.5, 0)
  const mat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.85,
    shininess: 120
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.scale.set(1, 1.5, 1)
  group.add(mesh)

  // Glow
  const glowGeo = new THREE.SphereGeometry(1, 8, 8)
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.15
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  group.add(glow)

  // Point light
  const light = new THREE.PointLight(color, 0.8, 8)
  group.add(light)

  group.position.set(x, y, z)
  group.userData.type = 'crystal'
  return group
}

function createGlowingPlant(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group()
  const hue = Math.random() * 0.3 + 0.4 // Blue-green-purple
  const color = new THREE.Color().setHSL(hue, 0.8, 0.5)

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 1 + Math.random(), 6)
  const stemMat = new THREE.MeshPhongMaterial({ color: 0x226644 })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = 0.5
  group.add(stem)

  // Glowing bulb
  const bulbGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 8, 8)
  const bulbMat = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.9
  })
  const bulb = new THREE.Mesh(bulbGeo, bulbMat)
  bulb.position.y = 1.2 + Math.random() * 0.5
  group.add(bulb)

  // Tiny light
  const light = new THREE.PointLight(color, 0.4, 5)
  light.position.y = 1.2
  group.add(light)

  group.position.set(x, y, z)
  group.userData.type = 'plant'
  group.userData.phase = Math.random() * Math.PI * 2
  return group
}

function createMushroom(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group()
  const scale = 0.5 + Math.random() * 2
  const hue = Math.random() * 0.15 + 0.8 // Pinks/reds/purples
  const color = new THREE.Color().setHSL(hue % 1, 0.7, 0.5)

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 1 * scale, 8)
  const stemMat = new THREE.MeshPhongMaterial({ color: 0xddccbb })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = 0.5 * scale
  group.add(stem)

  // Cap
  const capGeo = new THREE.SphereGeometry(0.5 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6)
  const capMat = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.2
  })
  const cap = new THREE.Mesh(capGeo, capMat)
  cap.position.y = 1 * scale
  group.add(cap)

  // Spots
  for (let s = 0; s < 5; s++) {
    const spotGeo = new THREE.CircleGeometry(0.06 * scale, 6)
    const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const spot = new THREE.Mesh(spotGeo, spotMat)
    const angle = Math.random() * Math.PI * 2
    const h = 0.2 + Math.random() * 0.3
    spot.position.set(
      Math.cos(angle) * 0.4 * scale,
      (1 + h * 0.3) * scale,
      Math.sin(angle) * 0.4 * scale
    )
    spot.lookAt(0, 5, 0)
    group.add(spot)
  }

  group.position.set(x, y, z)
  group.userData.type = 'mushroom'
  return group
}

function createFloatingIsland(x: number, y: number, z: number, size: number): THREE.Group {
  const group = new THREE.Group()

  // Main island body
  const topGeo = new THREE.CylinderGeometry(size, size * 0.6, size * 0.8, 12, 4)
  const topMat = new THREE.MeshPhongMaterial({ color: 0x558844 })
  const top = new THREE.Mesh(topGeo, topMat)
  group.add(top)

  // Bottom rocky part
  const botGeo = new THREE.ConeGeometry(size * 0.6, size * 1.2, 8)
  const botMat = new THREE.MeshPhongMaterial({ color: 0x887766 })
  const bot = new THREE.Mesh(botGeo, botMat)
  bot.position.y = -size * 0.8
  bot.rotation.x = Math.PI
  group.add(bot)

  // Grass on top
  const grassGeo = new THREE.CylinderGeometry(size * 0.95, size * 0.95, 0.2, 12)
  const grassMat = new THREE.MeshPhongMaterial({ color: 0x44aa55 })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.position.y = size * 0.4
  group.add(grass)

  // Add some plants on the island
  for (let i = 0; i < 3; i++) {
    const px = (Math.random() - 0.5) * size
    const pz = (Math.random() - 0.5) * size
    const plant = createGlowingPlant(px, size * 0.5, pz)
    group.add(plant)
    plantObjects.push(plant)
  }

  // Crystal on top
  if (Math.random() > 0.3) {
    const crystal = createCrystal(0, size * 0.7, 0, 0x00ffcc)
    group.add(crystal)
    crystalObjects.push(crystal)
  }

  group.position.set(x, y, z)
  group.userData.type = 'floating-island'
  group.userData.baseY = y
  group.userData.phase = Math.random() * Math.PI * 2
  return group
}

function createCreature(x: number, y: number, z: number, type: 'friendly' | 'dangerous'): THREE.Group {
  const group = new THREE.Group()

  if (type === 'friendly') {
    // Cute floating jellyfish-like creature
    const bodyGeo = new THREE.SphereGeometry(0.6, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7)
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x66ddff,
      emissive: 0x2288aa,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1
    group.add(body)

    // Eyes
    for (let side = -1; side <= 1; side += 2) {
      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const eye = new THREE.Mesh(eyeGeo, eyeMat)
      eye.position.set(side * 0.25, 1.1, 0.4)
      group.add(eye)

      const pupilGeo = new THREE.SphereGeometry(0.06, 6, 6)
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
      const pupil = new THREE.Mesh(pupilGeo, pupilMat)
      pupil.position.set(side * 0.25, 1.1, 0.5)
      group.add(pupil)
    }

    // Tentacles
    for (let t = 0; t < 4; t++) {
      const tentGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.8, 4)
      const tentMat = new THREE.MeshPhongMaterial({
        color: 0x88eeff,
        emissive: 0x4488aa,
        emissiveIntensity: 0.2
      })
      const tent = new THREE.Mesh(tentGeo, tentMat)
      const angle = (t / 4) * Math.PI * 2
      tent.position.set(Math.cos(angle) * 0.3, 0.3, Math.sin(angle) * 0.3)
      group.add(tent)
    }

    const light = new THREE.PointLight(0x66ddff, 0.5, 6)
    light.position.y = 1
    group.add(light)
  } else {
    // Dangerous creature - spiky dark crab-like thing
    const bodyGeo = new THREE.DodecahedronGeometry(0.8, 0)
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x881122,
      emissive: 0x440000,
      emissiveIntensity: 0.4
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.8
    group.add(body)

    // Spikes
    for (let s = 0; s < 6; s++) {
      const spikeGeo = new THREE.ConeGeometry(0.1, 0.5, 4)
      const spikeMat = new THREE.MeshPhongMaterial({ color: 0xcc2233 })
      const spike = new THREE.Mesh(spikeGeo, spikeMat)
      const angle = (s / 6) * Math.PI * 2
      spike.position.set(Math.cos(angle) * 0.7, 1, Math.sin(angle) * 0.7)
      spike.lookAt(Math.cos(angle) * 2, 1.5, Math.sin(angle) * 2)
      group.add(spike)
    }

    // Red eyes
    for (let side = -1; side <= 1; side += 2) {
      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      const eye = new THREE.Mesh(eyeGeo, eyeMat)
      eye.position.set(side * 0.3, 1, 0.6)
      group.add(eye)
    }

    const light = new THREE.PointLight(0xff2200, 0.6, 8)
    light.position.y = 0.8
    group.add(light)
  }

  group.position.set(x, y, z)
  group.userData.type = type
  return group
}

function createShip(): THREE.Group {
  const group = new THREE.Group()

  // Main hull
  const hullGeo = new THREE.CapsuleGeometry(1.5, 4, 8, 16)
  const hullMat = new THREE.MeshPhongMaterial({ color: 0xaaaacc, shininess: 80 })
  const hull = new THREE.Mesh(hullGeo, hullMat)
  hull.rotation.z = Math.PI / 2
  hull.position.y = 1.5
  group.add(hull)

  // Cockpit
  const cockpitGeo = new THREE.SphereGeometry(1, 12, 12)
  const cockpitMat = new THREE.MeshPhongMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.6,
    shininess: 120
  })
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat)
  cockpit.position.set(2.5, 2, 0)
  group.add(cockpit)

  // Wings
  for (let side = -1; side <= 1; side += 2) {
    const wingGeo = new THREE.BoxGeometry(2, 0.1, 3)
    const wingMat = new THREE.MeshPhongMaterial({ color: 0x888899 })
    const wing = new THREE.Mesh(wingGeo, wingMat)
    wing.position.set(0, 1.5, side * 2.5)
    wing.rotation.x = side * 0.2
    group.add(wing)
  }

  // Engine
  const engGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8)
  const engMat = new THREE.MeshPhongMaterial({ color: 0x555566 })
  const eng = new THREE.Mesh(engGeo, engMat)
  eng.position.set(-3, 1.5, 0)
  eng.rotation.z = Math.PI / 2
  group.add(eng)

  // Damage effects (scattered parts)
  for (let i = 0; i < 5; i++) {
    const debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const debrisMat = new THREE.MeshPhongMaterial({ color: 0x777788 })
    const debris = new THREE.Mesh(debrisGeo, debrisMat)
    debris.position.set(
      (Math.random() - 0.5) * 8,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 8
    )
    debris.rotation.set(Math.random(), Math.random(), Math.random())
    group.add(debris)
  }

  group.position.set(0, 0, 0)
  group.rotation.z = 0.15 // Slightly tilted from crash
  group.rotation.x = 0.1
  return group
}

function createFireflies(): THREE.Points {
  const count = 200
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * TERRAIN_SIZE
    positions[i * 3 + 1] = 2 + Math.random() * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * TERRAIN_SIZE
    const hue = Math.random() * 0.3 + 0.2 // Yellow-green
    const c = new THREE.Color().setHSL(hue, 1, 0.7)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = 2 + Math.random() * 3
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  return new THREE.Points(geo, mat)
}

function createCrystalSparkles(): THREE.Points {
  const count = 300
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Place in crystal biome area
    positions[i * 3] = 30 + Math.random() * 40
    positions[i * 3 + 1] = Math.random() * 15
    positions[i * 3 + 2] = 30 + Math.random() * 40
    const c = new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 1, 0.8)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  return new THREE.Points(geo, mat)
}

function createRainParticles(): THREE.Points {
  const count = 500
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60
    positions[i * 3 + 1] = Math.random() * 30
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.08,
    color: 0x88aacc,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  })

  const pts = new THREE.Points(geo, mat)
  pts.visible = false // starts hidden, shown during rain
  pts.userData.type = 'rain'
  return pts
}

function buildWorld() {
  // Terrain
  terrainMesh = createTerrain()
  scene.add(terrainMesh)

  // Water
  waterMesh = createWater()
  scene.add(waterMesh)

  // Sky
  skyMesh = createSky()
  scene.add(skyMesh)

  // Aurora
  auroraMesh = createAurora()
  scene.add(auroraMesh)

  // Ship at crash site
  shipMesh = createShip()
  scene.add(shipMesh)

  // Crystals scattered around the world
  const crystalPositions = [
    [10, 1, 15], [25, 2, 10], [-15, 1, 25], [-30, 3, -35],
    [40, 3, 40], [50, 4, 45], [45, 3, 55], [55, 5, 50],
    [-40, 2, 20], [-25, 1, -10], [15, 1, -20], [-10, 2, -30],
    [35, 2, 15], [-50, 3, -45], [60, 4, 35], [-35, 2, 10],
    [20, 1, 40], [-15, 2, 50], [5, 1, -40], [-45, 3, 30]
  ]

  for (const [cx, cy, cz] of crystalPositions) {
    const th = getTerrainHeight(cx, cz)
    const crystal = createCrystal(cx, th + cy + 0.5, cz)
    scene.add(crystal)
    crystalObjects.push(crystal)
  }

  // Glowing plants
  for (let i = 0; i < 80; i++) {
    const px = (Math.random() - 0.5) * TERRAIN_SIZE * 0.8
    const pz = (Math.random() - 0.5) * TERRAIN_SIZE * 0.8
    const py = getTerrainHeight(px, pz)
    if (py > -1) {
      const plant = createGlowingPlant(px, py, pz)
      scene.add(plant)
      plantObjects.push(plant)
    }
  }

  // Mushroom forest (in the negative x, negative z area)
  for (let i = 0; i < 40; i++) {
    const px = -20 - Math.random() * 50
    const pz = -20 - Math.random() * 50
    const py = getTerrainHeight(px, pz)
    const mush = createMushroom(px, py, pz)
    scene.add(mush)
  }

  // Floating islands
  const islandPositions = [
    [30, 25, -30, 5], [-50, 30, 20, 6], [0, 35, -60, 4],
    [60, 28, 60, 5], [-40, 22, -50, 4], [20, 32, 40, 3],
    [-20, 27, 50, 5], [50, 35, -20, 4], [-60, 25, -10, 6],
    [10, 40, 10, 3]
  ]

  for (const [ix, iy, iz, isize] of islandPositions) {
    const island = createFloatingIsland(ix, iy, iz, isize)
    scene.add(island)
    floatingIslands.push(island)
  }

  // Creatures - friendly
  for (let i = 0; i < 8; i++) {
    const cx = (Math.random() - 0.5) * 80
    const cz = (Math.random() - 0.5) * 80
    const cy = getTerrainHeight(cx, cz) + 1.5
    const creature = createCreature(cx, cy, cz, 'friendly')
    scene.add(creature)
    creatureObjects.push({
      mesh: creature,
      type: 'friendly',
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2),
      phase: Math.random() * Math.PI * 2
    })
  }

  // Creatures - dangerous
  for (let i = 0; i < 5; i++) {
    const cx = (Math.random() - 0.5) * 100
    const cz = (Math.random() - 0.5) * 100
    const cy = getTerrainHeight(cx, cz) + 0.5
    const creature = createCreature(cx, cy, cz, 'dangerous')
    scene.add(creature)
    creatureObjects.push({
      mesh: creature,
      type: 'dangerous',
      vel: new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3),
      phase: Math.random() * Math.PI * 2
    })
  }

  // Particles
  const fireflies = createFireflies()
  scene.add(fireflies)
  particleSystems.push(fireflies)

  const sparkles = createCrystalSparkles()
  scene.add(sparkles)
  particleSystems.push(sparkles)

  const rain = createRainParticles()
  scene.add(rain)
  particleSystems.push(rain)

  // Player
  playerMesh = createPlayer()
  scene.add(playerMesh)

  // Lighting
  sunLight = new THREE.DirectionalLight(0xffeedd, 1.2)
  sunLight.position.set(50, 80, 30)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(1024, 1024)
  sunLight.shadow.camera.near = 1
  sunLight.shadow.camera.far = 200
  sunLight.shadow.camera.left = -60
  sunLight.shadow.camera.right = 60
  sunLight.shadow.camera.top = 60
  sunLight.shadow.camera.bottom = -60
  scene.add(sunLight)

  ambientLight = new THREE.AmbientLight(0x334466, 0.5)
  scene.add(ambientLight)

  // Fog
  scene.fog = new THREE.FogExp2(0x334455, 0.006)
}

function showMessage(text: string, duration: number = 3000) {
  message.value = text
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, duration)
}

let weatherTimer = 0
let isRaining = false
let damageTimer = 0

function updateGame(dt: number) {
  if (!gameStarted.value || gameWon.value) return
  playTime.value += dt

  // Hide controls hint after 10 seconds
  if (playTime.value > 10) showControlsHint.value = false

  // Day/night cycle (full cycle = 120 seconds)
  dayTime = (dayTime + dt / 120) % 1
  const dayFactor = Math.cos(dayTime * Math.PI * 2) * 0.5 + 0.5
  dayNightLabel.value = dayFactor > 0.6 ? 'DAY' : dayFactor > 0.3 ? (dayTime < 0.5 ? 'SUNSET' : 'SUNRISE') : 'NIGHT'

  // Update sky shader
  if (skyMesh) {
    const skyMat = skyMesh.material as THREE.ShaderMaterial
    skyMat.uniforms.uTime.value += dt
    skyMat.uniforms.uDayTime.value = dayTime
  }

  // Aurora - only visible at night
  if (auroraMesh) {
    const auroraMat = auroraMesh.material as THREE.ShaderMaterial
    auroraMat.uniforms.uTime.value += dt
    auroraMesh.visible = dayFactor < 0.4
    if (auroraMesh.visible) {
      const auroraOpacity = (0.4 - dayFactor) / 0.4
      auroraMat.uniforms.uTime.value += dt
    }
  }

  // Sun position and light based on day
  if (sunLight) {
    const sunAngle = dayTime * Math.PI * 2
    sunLight.position.set(Math.cos(sunAngle) * 80, Math.sin(sunAngle) * 80, 30)
    sunLight.intensity = Math.max(0, dayFactor * 1.5)
    // Sunset/sunrise color
    const sunsetFactor = 1 - Math.abs(Math.cos(dayTime * Math.PI * 2))
    sunLight.color.setHSL(0.08 - sunsetFactor * 0.06, 0.8, 0.6 + dayFactor * 0.3)
  }

  if (ambientLight) {
    ambientLight.intensity = 0.2 + dayFactor * 0.4
    ambientLight.color.setHSL(0.6, 0.3, 0.3 + dayFactor * 0.3)
  }

  // Fog color based on time of day
  if (scene.fog) {
    const fogColor = new THREE.Color()
    fogColor.setHSL(0.6, 0.2, 0.1 + dayFactor * 0.25)
    ;(scene.fog as THREE.FogExp2).color = fogColor
  }

  // Weather system
  weatherTimer += dt
  if (weatherTimer > 30 + Math.random() * 30) {
    isRaining = !isRaining
    weatherTimer = 0
    if (isRaining) showMessage('Rain begins to fall...', 2000)
  }

  // Player movement
  const moveSpeed = 10
  let moveX = 0
  let moveZ = 0

  if (isMobile.value && joystickActive.value) {
    moveX = joystickX.value
    moveZ = joystickY.value
  } else {
    if (keys['w'] || keys['arrowup']) moveZ = -1
    if (keys['s'] || keys['arrowdown']) moveZ = 1
    if (keys['a'] || keys['arrowleft']) moveX = -1
    if (keys['d'] || keys['arrowright']) moveX = 1
  }

  // Camera-relative movement
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))

  const moveDir = new THREE.Vector3()
  moveDir.addScaledVector(forward, -moveZ)
  moveDir.addScaledVector(right, moveX)
  if (moveDir.length() > 0) moveDir.normalize()

  playerVel.x = moveDir.x * moveSpeed
  playerVel.z = moveDir.z * moveSpeed

  // Jetpack (space while in air, uses energy)
  const spacePressed = keys[' '] || mobileJump.value
  if (spacePressed) {
    if (playerOnGround) {
      playerVel.y = 8
      playerOnGround = false
    } else if (energy.value > 0) {
      playerVel.y += 15 * dt
      if (playerVel.y > 12) playerVel.y = 12
      energy.value = Math.max(0, energy.value - 20 * dt)
    }
  }

  // Gravity
  playerVel.y -= 18 * dt

  // Apply velocity
  playerPos.x += playerVel.x * dt
  playerPos.y += playerVel.y * dt
  playerPos.z += playerVel.z * dt

  // Terrain collision
  const groundY = getTerrainHeight(playerPos.x, playerPos.z)
  if (playerPos.y < groundY + 0.1) {
    playerPos.y = groundY + 0.1
    playerVel.y = 0
    playerOnGround = true
  }

  // Floating island collision (simple platform check)
  for (const island of floatingIslands) {
    const ipos = island.position
    const isize = (island.userData as any).type === 'floating-island' ? 5 : 3
    const dx = playerPos.x - ipos.x
    const dz = playerPos.z - ipos.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < isize && playerPos.y < ipos.y + isize * 0.5 && playerPos.y > ipos.y - 1 && playerVel.y <= 0) {
      playerPos.y = ipos.y + isize * 0.5
      playerVel.y = 0
      playerOnGround = true
    }
  }

  // Water - damage if below water
  if (playerPos.y < -1.5) {
    health.value -= 10 * dt
    if (playerPos.y < -3) {
      playerPos.y = -1
      playerVel.y = 5
    }
  }

  // World bounds
  const halfWorld = TERRAIN_SIZE / 2 - 5
  playerPos.x = Math.max(-halfWorld, Math.min(halfWorld, playerPos.x))
  playerPos.z = Math.max(-halfWorld, Math.min(halfWorld, playerPos.z))

  // Recharge energy on ground
  if (playerOnGround) {
    energy.value = Math.min(100, energy.value + 15 * dt)
  }

  // Update player mesh
  if (playerMesh) {
    playerMesh.position.copy(playerPos)
    // Rotate player to face movement direction
    if (moveDir.length() > 0.1) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z)
      let currentAngle = playerMesh.rotation.y
      let diff = targetAngle - currentAngle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      playerMesh.rotation.y += diff * 8 * dt
    }
  }

  // Camera
  const camTarget = playerPos.clone().add(new THREE.Vector3(0, cameraHeight, 0))
  const camOffset = new THREE.Vector3(
    Math.sin(cameraYaw) * cameraDistance * Math.cos(cameraPitch),
    Math.sin(cameraPitch) * cameraDistance + cameraHeight,
    Math.cos(cameraYaw) * cameraDistance * Math.cos(cameraPitch)
  )
  const camPos = camTarget.clone().add(camOffset)
  camera.position.lerp(camPos, 6 * dt)
  camera.lookAt(camTarget)

  // Crystal collection
  for (let i = crystalObjects.length - 1; i >= 0; i--) {
    const crystal = crystalObjects[i]
    const worldPos = new THREE.Vector3()
    crystal.getWorldPosition(worldPos)
    if (worldPos.distanceTo(playerPos) < 2.5) {
      // Collect
      crystal.removeFromParent()
      crystalObjects.splice(i, 1)
      crystals.value++
      gameState.addCoins(10)
      showMessage('Crystal collected! (' + crystals.value + '/' + crystalsNeeded + ')', 2000)

      if (crystals.value >= crystalsNeeded) {
        showMessage('All crystals collected! Return to your ship!', 5000)
      }
    }
  }

  // Material collection from mushrooms (walk near them)
  // Simple: every 5 seconds near a mushroom area, gain material
  if (playerPos.x < -15 && playerPos.z < -15) {
    if (Math.floor(playTime.value) % 5 === 0 && Math.floor(playTime.value) !== Math.floor(playTime.value - dt)) {
      materials.value++
    }
  }

  // Building (E key)
  if (keys['e'] && materials.value >= 3) {
    keys['e'] = false // debounce
    materials.value -= 3
    baseBlocks.value++
    const blockGeo = new THREE.BoxGeometry(2, 2, 2)
    const blockMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.6, 0.5),
      shininess: 30
    })
    const block = new THREE.Mesh(blockGeo, blockMat)
    const buildDir = new THREE.Vector3(-Math.sin(playerMesh.rotation.y), 0, -Math.cos(playerMesh.rotation.y))
    const buildPos = playerPos.clone().add(buildDir.multiplyScalar(3))
    buildPos.y = getTerrainHeight(buildPos.x, buildPos.z) + 1
    block.position.copy(buildPos)
    block.castShadow = true
    block.receiveShadow = true
    scene.add(block)
    baseBlockMeshes.push(block)
    showMessage('Base block placed!', 1500)
  }

  // Ship interaction - win condition
  if (crystals.value >= crystalsNeeded) {
    const shipDist = playerPos.distanceTo(new THREE.Vector3(0, 1, 0))
    if (shipDist < 5) {
      if (keys['f']) {
        gameWon.value = true
        showMessage('', 0)
      } else {
        showMessage('Press F to repair ship and escape!', 500)
      }
    }
  }

  // Creature AI
  damageTimer = Math.max(0, damageTimer - dt)

  for (const creature of creatureObjects) {
    const cpos = creature.mesh.position
    creature.phase += dt

    if (creature.type === 'friendly') {
      // Follow player if close, bob up and down
      const toPlayer = playerPos.clone().sub(cpos)
      const dist = toPlayer.length()
      if (dist < 20 && dist > 3) {
        toPlayer.normalize()
        cpos.x += toPlayer.x * 3 * dt
        cpos.z += toPlayer.z * 3 * dt
      }
      cpos.y = getTerrainHeight(cpos.x, cpos.z) + 2 + Math.sin(creature.phase * 2) * 0.5
      creature.mesh.rotation.y += dt * 0.5

      // Friendly creatures near player slowly heal
      if (dist < 5) {
        health.value = Math.min(100, health.value + 2 * dt)
      }
    } else {
      // Dangerous - patrol and chase player if close
      const toPlayer = playerPos.clone().sub(cpos)
      const dist = toPlayer.length()
      if (dist < 15) {
        // Chase
        toPlayer.normalize()
        cpos.x += toPlayer.x * 5 * dt
        cpos.z += toPlayer.z * 5 * dt
      } else {
        // Patrol
        cpos.x += creature.vel.x * dt
        cpos.z += creature.vel.z * dt
        // Reverse at bounds
        if (Math.abs(cpos.x) > 80 || Math.abs(cpos.z) > 80) {
          creature.vel.x *= -1
          creature.vel.z *= -1
        }
      }
      cpos.y = getTerrainHeight(cpos.x, cpos.z) + 0.5 + Math.sin(creature.phase * 3) * 0.2

      // Damage player on contact
      if (dist < 2 && damageTimer <= 0) {
        health.value -= 15
        damageTimer = 1
        showMessage('Ouch! Alien creature attack! -15 HP', 1500)
        // Knockback
        const knockDir = playerPos.clone().sub(cpos).normalize()
        playerVel.x += knockDir.x * 10
        playerVel.y += 5
        playerVel.z += knockDir.z * 10
      }
    }
  }

  // Floating islands bob
  for (const island of floatingIslands) {
    const baseY = island.userData.baseY as number
    const phase = island.userData.phase as number
    island.position.y = baseY + Math.sin(playTime.value * 0.5 + phase) * 1.5
    island.rotation.y += dt * 0.05
  }

  // Animate plants (wind sway)
  for (const plant of plantObjects) {
    const p = plant.userData.phase as number
    plant.rotation.x = Math.sin(playTime.value * 1.5 + p) * 0.1
    plant.rotation.z = Math.cos(playTime.value * 1.2 + p) * 0.08
  }

  // Crystals spin
  for (const crystal of crystalObjects) {
    crystal.rotation.y += dt * 2
    const worldPos = new THREE.Vector3()
    crystal.getWorldPosition(worldPos)
    crystal.position.y += Math.sin(playTime.value * 3 + worldPos.x) * 0.003
  }

  // Particle animation
  for (const ps of particleSystems) {
    const posArr = ps.geometry.attributes.position as THREE.BufferAttribute
    if (ps.userData.type === 'rain') {
      ps.visible = isRaining
      if (isRaining) {
        // Rain falls near player
        for (let i = 0; i < posArr.count; i++) {
          let y = posArr.getY(i)
          y -= 20 * dt
          if (y < 0) {
            y = 25 + Math.random() * 5
            posArr.setX(i, playerPos.x + (Math.random() - 0.5) * 60)
            posArr.setZ(i, playerPos.z + (Math.random() - 0.5) * 60)
          }
          posArr.setY(i, y)
        }
        posArr.needsUpdate = true
      }
    } else {
      // Fireflies and sparkles - gentle movement
      for (let i = 0; i < posArr.count; i++) {
        const x = posArr.getX(i)
        const y = posArr.getY(i)
        const z = posArr.getZ(i)
        posArr.setX(i, x + Math.sin(playTime.value + i) * 0.02)
        posArr.setY(i, y + Math.cos(playTime.value * 0.7 + i * 0.5) * 0.01)
        posArr.setZ(i, z + Math.sin(playTime.value * 0.5 + i * 0.3) * 0.02)
      }
      posArr.needsUpdate = true
    }
  }

  // Water animation
  if (waterMesh) {
    waterMesh.position.y = -2 + Math.sin(playTime.value * 0.3) * 0.2
  }

  // Health check
  if (health.value <= 0) {
    health.value = 100
    energy.value = 100
    playerPos.set(0, 5, 0)
    playerVel.set(0, 0, 0)
    showMessage('You blacked out... waking up at the crash site.', 3000)
  }
}

// Input handlers
function onKeyDown(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = true
}
function onKeyUp(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = false
}

function onMouseDown(e: MouseEvent) {
  if (!gameStarted.value || gameWon.value) return
  mouseDown = true
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}

function onMouseUp() {
  mouseDown = false
}

function onMouseMove(e: MouseEvent) {
  if (!gameStarted.value || gameWon.value) return
  if (!canvasEl.value) return

  // Use movementX/movementY for mouse look (no pointer lock)
  const sensitivity = 0.003
  cameraYaw += (e.movementX || 0) * sensitivity
  cameraPitch -= (e.movementY || 0) * sensitivity
  cameraPitch = Math.max(-1.2, Math.min(0.8, cameraPitch))
}

// Touch look (drag on right side of screen)
let touchLookId: number | null = null
let touchLookLastX = 0
let touchLookLastY = 0

function onTouchStart(e: TouchEvent) {
  if (!gameStarted.value || gameWon.value) return
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i]
    // Right half of screen = look
    if (t.clientX > window.innerWidth * 0.4 && touchLookId === null) {
      touchLookId = t.identifier
      touchLookLastX = t.clientX
      touchLookLastY = t.clientY
    }
  }
}

function onTouchMove(e: TouchEvent) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i]
    if (t.identifier === touchLookId) {
      const dx = t.clientX - touchLookLastX
      const dy = t.clientY - touchLookLastY
      cameraYaw += dx * 0.005
      cameraPitch -= dy * 0.005
      cameraPitch = Math.max(-1.2, Math.min(0.8, cameraPitch))
      touchLookLastX = t.clientX
      touchLookLastY = t.clientY
    }
  }
}

function onTouchEnd(e: TouchEvent) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === touchLookId) {
      touchLookId = null
    }
  }
}

// Mobile joystick
function onJoystickStart(e: TouchEvent) {
  const t = e.touches[0]
  joystickTouchId = t.identifier
  joystickActive.value = true
  updateJoystick(t)
}

function onJoystickMove(e: TouchEvent) {
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === joystickTouchId) {
      updateJoystick(e.touches[i])
    }
  }
}

function onJoystickEnd() {
  joystickTouchId = null
  joystickActive.value = false
  joystickX.value = 0
  joystickY.value = 0
}

function updateJoystick(touch: Touch) {
  if (!joystickZone.value) return
  const rect = joystickZone.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  let dx = (touch.clientX - cx) / (rect.width / 2)
  let dy = (touch.clientY - cy) / (rect.height / 2)
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len > 1) { dx /= len; dy /= len }
  joystickX.value = dx
  joystickY.value = dy
}

function mobileBuild() {
  keys['e'] = true
  setTimeout(() => { keys['e'] = false }, 100)
}

function mobileInteract() {
  keys['f'] = true
  setTimeout(() => { keys['f'] = false }, 100)
}

function onResize() {
  if (!renderer || !camera || !rootEl.value) return
  const w = rootEl.value.clientWidth
  const h = rootEl.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function startGame() {
  gameStarted.value = true
  showMessage('You crash-landed on an alien planet! Collect energy crystals to repair your ship.', 5000)

  // Start tracking
  playerTracker.startSession(
    gameState.getPlayerName(),
    gameState.getCoins(),
    0, 0, 0,
    "AI's Game"
  )
  OnlineTracker.goOnline(
    gameState.getPlayerName(),
    gameState.getCoins(),
    0, 0, 0,
    "AI's Game"
  )
}

function resetGame() {
  gameWon.value = false
  gameStarted.value = false
  health.value = 100
  energy.value = 100
  crystals.value = 0
  materials.value = 0
  baseBlocks.value = 0
  playTime.value = 0
  playerPos.set(0, 5, 0)
  playerVel.set(0, 0, 0)
  cameraYaw = 0
  cameraPitch = -0.3
  showControlsHint.value = true

  // Rebuild crystals (clear old ones, create new)
  for (const c of crystalObjects) c.removeFromParent()
  crystalObjects.length = 0
  for (const b of baseBlockMeshes) b.removeFromParent()
  baseBlockMeshes.length = 0

  const crystalPositions = [
    [10, 1, 15], [25, 2, 10], [-15, 1, 25], [-30, 3, -35],
    [40, 3, 40], [50, 4, 45], [45, 3, 55], [55, 5, 50],
    [-40, 2, 20], [-25, 1, -10], [15, 1, -20], [-10, 2, -30],
    [35, 2, 15], [-50, 3, -45], [60, 4, 35], [-35, 2, 10],
    [20, 1, 40], [-15, 2, 50], [5, 1, -40], [-45, 3, 30]
  ]
  for (const [cx, cy, cz] of crystalPositions) {
    const th = getTerrainHeight(cx, cz)
    const crystal = createCrystal(cx, th + cy + 0.5, cz)
    scene.add(crystal)
    crystalObjects.push(crystal)
  }
}

function goBack() {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  router.push('/')
}

function animate() {
  animId = requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)
  updateGame(dt)
  renderer.render(scene, camera)
}

onMounted(() => {
  // Detect mobile
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  if (!canvasEl.value || !rootEl.value) return

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: false
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(rootEl.value.clientWidth, rootEl.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  // Scene
  scene = new THREE.Scene()

  // Camera
  camera = new THREE.PerspectiveCamera(65, rootEl.value.clientWidth / rootEl.value.clientHeight, 0.1, 500)
  camera.position.set(0, 10, 15)

  clock = new THREE.Clock()

  // Build the world
  buildWorld()

  // Events
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvasEl.value.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  canvasEl.value.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)

  // Touch events for look
  canvasEl.value.addEventListener('touchstart', onTouchStart, { passive: false })
  canvasEl.value.addEventListener('touchmove', onTouchMove, { passive: false })
  canvasEl.value.addEventListener('touchend', onTouchEnd, { passive: false })

  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('resize', onResize)

  if (canvasEl.value) {
    canvasEl.value.removeEventListener('mousedown', onMouseDown)
    canvasEl.value.removeEventListener('mousemove', onMouseMove)
    canvasEl.value.removeEventListener('touchstart', onTouchStart)
    canvasEl.value.removeEventListener('touchmove', onTouchMove)
    canvasEl.value.removeEventListener('touchend', onTouchEnd)
  }

  playerTracker.endSession()
  OnlineTracker.goOffline()

  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.ai-game-root {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #0a0a1a;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none;
  -webkit-user-select: none;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

/* HUD */
.hud {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}

.hud-top-left {
  position: absolute;
  top: 60px; left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hud-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-label {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  width: 36px;
  text-shadow: 1px 1px 2px #000;
}

.bar-bg {
  width: 140px;
  height: 16px;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s;
}

.health-fill {
  background: linear-gradient(90deg, #ff3333, #ff6666);
  box-shadow: 0 0 8px #ff3333;
}

.energy-fill {
  background: linear-gradient(90deg, #3388ff, #66bbff);
  box-shadow: 0 0 8px #3388ff;
}

.bar-val {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 1px 1px 2px #000;
  width: 30px;
}

.hud-top-right {
  position: absolute;
  top: 60px; right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.crystal-counter, .materials-counter {
  background: rgba(0,0,0,0.5);
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.15);
}

.crystal-icon {
  font-size: 20px;
}

.crystal-num, .mat-num {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 1px 1px 2px #000;
}

.mat-icon {
  font-size: 20px;
}

.day-display {
  color: #ffcc44;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 200, 0, 0.5);
  background: rgba(0,0,0,0.4);
  padding: 4px 12px;
  border-radius: 12px;
}

.hud-bottom-center {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.game-message {
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 16px;
  text-align: center;
  white-space: nowrap;
  border: 1px solid rgba(100, 200, 255, 0.3);
  text-shadow: 0 0 8px rgba(100, 200, 255, 0.5);
  animation: fadeIn 0.3s ease;
}

.hud-controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
}

/* Title Screen */
.title-screen {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(20,10,60,0.9) 0%, rgba(5,5,20,0.95) 100%);
  z-index: 10;
}

.title-glow {
  font-size: 72px;
  font-weight: 900;
  color: #fff;
  text-shadow:
    0 0 20px #7c3aed,
    0 0 40px #7c3aed,
    0 0 80px #4c1d95;
  animation: titlePulse 2s ease-in-out infinite alternate;
  margin-bottom: 16px;
}

.title-sub {
  font-size: 24px;
  color: #a78bfa;
  margin-bottom: 20px;
}

.title-desc {
  font-size: 16px;
  color: rgba(255,255,255,0.7);
  max-width: 500px;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 40px;
}

.start-btn {
  padding: 16px 48px;
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  color: #fff;
  border: 2px solid #a78bfa;
  border-radius: 16px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s;
  pointer-events: auto;
  text-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.6);
  background: linear-gradient(135deg, #8b5cf6, #5b21b6);
}

.controls-info {
  margin-top: 30px;
  color: rgba(255,255,255,0.4);
  font-size: 13px;
  text-align: center;
  line-height: 1.8;
}

/* Win Screen */
.win-screen {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(10,40,10,0.9) 0%, rgba(5,20,5,0.95) 100%);
  z-index: 10;
}

.win-title {
  font-size: 56px;
  font-weight: 900;
  color: #4ade80;
  text-shadow: 0 0 30px #22c55e, 0 0 60px #15803d;
  animation: titlePulse 2s ease-in-out infinite alternate;
  margin-bottom: 20px;
}

.win-sub {
  font-size: 20px;
  color: #86efac;
  margin-bottom: 16px;
}

.win-stats {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 40px;
}

/* Back Button */
.back-btn {
  position: absolute;
  top: 12px; left: 12px;
  padding: 8px 16px;
  font-size: 16px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  cursor: pointer;
  z-index: 20;
  transition: background 0.2s;
  pointer-events: auto;
}

.back-btn:hover {
  background: rgba(0,0,0,0.8);
}

/* Mobile Controls */
.mobile-controls {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 15;
}

.joystick-zone {
  position: absolute;
  bottom: 30px;
  left: 30px;
  width: 120px;
  height: 120px;
  pointer-events: auto;
}

.joystick-base {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.joystick-knob {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.5);
  transition: transform 0.05s;
}

.mobile-buttons {
  position: absolute;
  bottom: 30px;
  right: 20px;
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.mobile-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  border: 2px solid rgba(255,255,255,0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.jump-btn { background: rgba(59, 130, 246, 0.5); }
.build-btn { background: rgba(34, 197, 94, 0.5); }
.interact-btn { background: rgba(234, 179, 8, 0.5); }

@keyframes titlePulse {
  from { text-shadow: 0 0 20px #7c3aed, 0 0 40px #7c3aed; }
  to { text-shadow: 0 0 30px #8b5cf6, 0 0 60px #7c3aed, 0 0 100px #4c1d95; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .title-glow { font-size: 42px; }
  .title-sub { font-size: 18px; }
  .title-desc { font-size: 14px; padding: 0 20px; }
  .start-btn { font-size: 18px; padding: 14px 36px; }
  .bar-bg { width: 100px; }
  .game-message { font-size: 13px; padding: 8px 16px; }
}
</style>
