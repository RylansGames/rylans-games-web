<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>
    <button class="auto-attack-button" @click="toggleAutoAttack">
      {{ autoAttackEnabled ? '🗡️ Auto Attack: ON' : '⚔️ Auto Attack: OFF' }}
    </button>
    <button class="inventory-button" @click="toggleInventory">
      🎒 Inventory
    </button>
    <button class="auto-walk-button" @click="toggleAutoWalk">
      {{ autoMoveEnabled ? '🚶 Auto Walk: ON' : '🛑 Auto Walk: OFF' }}
    </button>

    <!-- Inventory Panel -->
    <div v-if="inventoryOpen" class="inventory-panel">
      <div class="inventory-header">
        <h2>🎒 Inventory</h2>
        <button class="inventory-close" @click="toggleInventory">✕</button>
      </div>
      <div class="inventory-content">
        <div class="inventory-section">
          <h3>📍 Current World</h3>
          <div class="world-info">
            <div class="world-name">Tung Tung Park</div>
            <div class="world-character">
              <canvas ref="characterCanvas" width="80" height="80" class="character-circle"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="gameContainer" class="game-container">
      <div class="hud">
        <div class="hud-title">🧠 BRAINROT EVOLUTION 3D 🧠</div>
        <div class="hud-info">{{ infoText }}</div>
        <div class="hud-coins">Coins Collected: {{ coinsCollected }}</div>
      </div>
      <div class="controls-hint">
        WASD/Arrows: Move | Mouse: Look Around | SPACE: Jump | B: Toggle Camera | Left Click: Hit Apple
      </div>

      <!-- Level/EXP Bar at Bottom -->
      <div class="level-bar">
        <div class="level-bar-bg">
          <div class="level-bar-fill" :style="{ width: (playerExp / maxExp * 100) + '%' }"></div>
          <div class="level-text">Level {{ playerLevel }}</div>
          <div class="exp-text">{{ playerExp }}/{{ maxExp }} EXP</div>
        </div>
      </div>

      <!-- Level Up Shark -->
      <div v-if="showLevelUpShark" class="level-up-shark">
        <canvas ref="sharkCanvas" width="400" height="400" class="shark-canvas"></canvas>
        <div class="shark-name">tralalero tralala</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'

const gameContainer = ref<HTMLDivElement>()
const characterCanvas = ref<HTMLCanvasElement>()
const sharkCanvas = ref<HTMLCanvasElement>()
const router = useRouter()
const infoText = ref('Benvenuto! Welcome to the Italian Brainrot World! Find tung tung tung tung sahur! 🇮🇹🤌')
const coinsCollected = ref(0)
const autoAttackEnabled = ref(false)
const inventoryOpen = ref(false)
const autoMoveEnabled = ref(true)
const playerLevel = ref(1)
const playerExp = ref(0)
const maxExp = ref(10)
const showLevelUpShark = ref(false)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let player: THREE.Mesh
let coins: THREE.Mesh[] = []
let rocks: THREE.Group[] = []
let apples: THREE.Mesh[] = []
let animationId: number
let isSharkForm = false

// Player movement
const moveSpeed = 0.15
const jumpPower = 0.3
const gravity = 0.015
let velocityY = 0
let isJumping = false
const playerHeight = 1.6

// Controls
const keys: Record<string, boolean> = {}
let mouseX = 0
let mouseY = 0
let yaw = 0
let pitch = 0
let isFirstPerson = true // Camera mode
let lastNPCInteraction = 0 // Cooldown timer for NPC interaction
let lastAppleAttack = 0 // Cooldown timer for apple attacks

// Game data
interface GameData {
  playerX: number
  playerZ: number
  coinsCollectedCount: number
  hasMetTungTung: boolean
  level: number
  exp: number
}

const gameData = ref<GameData>({
  playerX: 0,
  playerZ: 0,
  coinsCollectedCount: 0,
  hasMetTungTung: false,
  level: 1,
  exp: 0
})

const goBack = () => {
  router.push('/')
}

const toggleAutoAttack = () => {
  autoAttackEnabled.value = !autoAttackEnabled.value
  if (autoAttackEnabled.value) {
    infoText.value = 'Auto Attack enabled! 🗡️'
  } else {
    infoText.value = 'Auto Attack disabled! ⚔️'
  }
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 2000)
}

const toggleInventory = () => {
  inventoryOpen.value = !inventoryOpen.value

  // Draw character face when inventory opens
  if (inventoryOpen.value) {
    setTimeout(() => {
      drawCharacterFace()
    }, 0)
  }
}

const toggleAutoWalk = () => {
  autoMoveEnabled.value = !autoMoveEnabled.value
  if (autoMoveEnabled.value) {
    infoText.value = 'Auto Walk enabled! 🚶'
  } else {
    infoText.value = 'Auto Walk disabled! 🛑'
  }
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 2000)
}

const drawCharacterFace = () => {
  if (!characterCanvas.value) return

  const canvas = characterCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 80, 80)

  // Draw circular border
  ctx.beginPath()
  ctx.arc(40, 40, 38, 0, Math.PI * 2)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 3
  ctx.stroke()

  // Fill circle with wood color
  ctx.fillStyle = '#8B4513'
  ctx.fill()

  // Add wood texture rings
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.arc(40, 40, 10 + i * 6, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Draw straight face

  // Left eye (black dot)
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(32, 35, 3, 0, Math.PI * 2)
  ctx.fill()

  // Right eye (black dot)
  ctx.beginPath()
  ctx.arc(48, 35, 3, 0, Math.PI * 2)
  ctx.fill()

  // Straight mouth (horizontal line)
  ctx.fillStyle = '#000000'
  ctx.fillRect(32, 45, 16, 1.5)

  // Draw mini bat on the side
  ctx.save()
  ctx.translate(57, 50)
  ctx.rotate(-Math.PI / 6)

  // Bat handle
  ctx.fillStyle = '#D2691E'
  ctx.fillRect(-0.5, 0, 1.5, 8)

  // Bat barrel
  ctx.beginPath()
  ctx.ellipse(0, -3, 2, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

const loadGameData = () => {
  const saved = localStorage.getItem('brainrotEvolution3D')
  if (saved) {
    gameData.value = JSON.parse(saved)
    coinsCollected.value = gameData.value.coinsCollectedCount
    playerLevel.value = gameData.value.level || 1
    playerExp.value = gameData.value.exp || 0
  }
}

const addExp = (amount: number) => {
  playerExp.value += amount
  gameData.value.exp = playerExp.value

  // Check for level up
  if (playerExp.value >= maxExp.value) {
    playerExp.value -= maxExp.value
    playerLevel.value += 1
    gameData.value.level = playerLevel.value
    gameData.value.exp = playerExp.value

    infoText.value = `🎉 LEVEL UP! You are now Level ${playerLevel.value}! 🎉`

    // Show the shark!
    showLevelUpShark.value = true
    setTimeout(() => {
      drawLevelUpShark()
    }, 0)

    // Transform player into shark!
    if (!isSharkForm) {
      setTimeout(() => {
        transformToShark()
        infoText.value = `You have transformed into tralalero tralala! 🦈`
      }, 1500)
    }

    // Hide shark popup after 3 seconds
    setTimeout(() => {
      showLevelUpShark.value = false
      infoText.value = 'Explore the brainrot world as tralalero tralala! 🦈'
    }, 3000)
  }
}

const drawLevelUpShark = () => {
  if (!sharkCanvas.value) return

  const canvas = sharkCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 400, 400)

  // Draw shark body (gray)
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.ellipse(200, 180, 120, 60, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw shark head
  ctx.beginPath()
  ctx.ellipse(280, 180, 60, 50, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw shark mouth (open)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(310, 190, 25, 0, Math.PI)
  ctx.fill()

  // Draw teeth
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(290 + i * 10, 190)
    ctx.lineTo(295 + i * 10, 200)
    ctx.lineTo(300 + i * 10, 190)
    ctx.fill()
  }

  // Draw eyes
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(290, 160, 8, 0, Math.PI * 2)
  ctx.fill()

  // Draw dorsal fin
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.moveTo(180, 130)
  ctx.lineTo(200, 80)
  ctx.lineTo(220, 130)
  ctx.fill()

  // Draw 3 LEGS with NIKES!

  // Leg 1 (front left)
  ctx.fillStyle = '#808080'
  ctx.fillRect(160, 240, 15, 60)
  // Nike shoe 1
  ctx.fillStyle = '#000000'
  ctx.fillRect(155, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(158, 310)
  ctx.lineTo(165, 305)
  ctx.lineTo(175, 315)
  ctx.stroke()

  // Leg 2 (middle)
  ctx.fillStyle = '#808080'
  ctx.fillRect(195, 240, 15, 60)
  // Nike shoe 2
  ctx.fillStyle = '#000000'
  ctx.fillRect(190, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(193, 310)
  ctx.lineTo(200, 305)
  ctx.lineTo(210, 315)
  ctx.stroke()

  // Leg 3 (back right)
  ctx.fillStyle = '#808080'
  ctx.fillRect(230, 240, 15, 60)
  // Nike shoe 3
  ctx.fillStyle = '#000000'
  ctx.fillRect(225, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(228, 310)
  ctx.lineTo(235, 305)
  ctx.lineTo(245, 315)
  ctx.stroke()

  // Draw tail
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.moveTo(80, 180)
  ctx.lineTo(50, 150)
  ctx.lineTo(50, 210)
  ctx.fill()
}

const saveGameData = () => {
  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData.value))
}

const init3DScene = () => {
  // Create scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a0033)
  scene.fog = new THREE.Fog(0x330066, 10, 100)

  // Create camera (first person view)
  camera = new THREE.PerspectiveCamera(
    75,
    800 / 600,
    0.1,
    1000
  )
  camera.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(800, 600)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  if (gameContainer.value) {
    gameContainer.value.appendChild(renderer.domElement)
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x6633ff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.8
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Add grid helper
  const gridHelper = new THREE.GridHelper(200, 40, 0x00cc00, 0x008800)
  scene.add(gridHelper)

  // Create player character as tung tung tung sahur (log with straight face and bat)
  const playerGroup = new THREE.Group()

  // LOG BODY - Brown wooden cylinder
  const playerLogGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32)

  // Create wood texture with rings
  const playerCanvas = document.createElement('canvas')
  playerCanvas.width = 512
  playerCanvas.height = 512
  const playerCtx = playerCanvas.getContext('2d')!

  // Wood color
  playerCtx.fillStyle = '#8B4513' // Brown
  playerCtx.fillRect(0, 0, 512, 512)

  // Add wood rings
  for (let i = 0; i < 10; i++) {
    playerCtx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    playerCtx.lineWidth = 2 + Math.random() * 3
    playerCtx.beginPath()
    playerCtx.arc(256, 256 + i * 20, 100 + i * 15, 0, Math.PI * 2)
    playerCtx.stroke()
  }

  const playerWoodTexture = new THREE.CanvasTexture(playerCanvas)
  const playerLogMaterial = new THREE.MeshStandardMaterial({
    map: playerWoodTexture,
    roughness: 0.8,
    metalness: 0.1
  })
  const playerLog = new THREE.Mesh(playerLogGeometry, playerLogMaterial)
  playerLog.castShadow = true
  playerGroup.add(playerLog)

  // STRAIGHT FACE - Simple dots and line

  // Left eye (black dot)
  const playerLeftEyeGeometry = new THREE.CircleGeometry(0.05, 16)
  const playerEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const playerLeftEye = new THREE.Mesh(playerLeftEyeGeometry, playerEyeMaterial)
  playerLeftEye.position.set(-0.12, 0.2, 0.31)
  playerGroup.add(playerLeftEye)

  // Right eye (black dot)
  const playerRightEye = new THREE.Mesh(playerLeftEyeGeometry, playerEyeMaterial)
  playerRightEye.position.set(0.12, 0.2, 0.31)
  playerGroup.add(playerRightEye)

  // Straight mouth (horizontal line)
  const playerMouthGeometry = new THREE.BoxGeometry(0.18, 0.02, 0.01)
  const playerMouth = new THREE.Mesh(playerMouthGeometry, playerEyeMaterial)
  playerMouth.position.set(0, 0, 0.31)
  playerGroup.add(playerMouth)

  // BASEBALL BAT - Wooden bat held by log
  const playerBatGroup = new THREE.Group()

  // Bat handle
  const playerHandleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 16)
  const playerBatMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2691E,
    roughness: 0.7
  })
  const playerHandle = new THREE.Mesh(playerHandleGeometry, playerBatMaterial)
  playerHandle.position.y = 0.2
  playerBatGroup.add(playerHandle)

  // Bat barrel (thicker part)
  const playerBarrelGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.5, 16)
  const playerBarrel = new THREE.Mesh(playerBarrelGeometry, playerBatMaterial)
  playerBarrel.position.y = 0.65
  playerBatGroup.add(playerBarrel)

  // Position bat to side of log, angled
  playerBatGroup.position.set(0.4, 0, 0)
  playerBatGroup.rotation.z = -Math.PI / 6 // Angle it
  playerBatGroup.castShadow = true
  playerGroup.add(playerBatGroup)

  playerGroup.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)
  player = playerGroup as any
  scene.add(player)

  // Create walls around the world
  createWalls()

  // Create giant statue in center
  createStatue()

  // Create collectible coins
  createCoins()

  // Create rocks and apples
  createRocksAndApples()

  // Create skybox with stars
  createStars()

  // Setup controls
  setupControls()

  // Start animation loop
  animate()

  // Auto-save every 5 seconds
  setInterval(saveGameData, 5000)
}

const transformToShark = () => {
  // Remove old player model
  scene.remove(player)

  // Create shark player
  const sharkGroup = new THREE.Group()

  // Shark body (gray ellipse)
  const bodyGeometry = new THREE.SphereGeometry(1, 16, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.scale.set(1.2, 0.6, 0.6)
  body.castShadow = true
  sharkGroup.add(body)

  // Shark head
  const headGeometry = new THREE.SphereGeometry(0.6, 16, 16)
  const head = new THREE.Mesh(headGeometry, bodyMaterial)
  head.position.set(1, 0, 0)
  head.scale.set(1, 0.8, 0.8)
  head.castShadow = true
  sharkGroup.add(head)

  // Eye
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye.position.set(1.2, 0.2, 0.3)
  sharkGroup.add(eye)

  // Dorsal fin
  const finGeometry = new THREE.ConeGeometry(0.3, 0.8, 4)
  const fin = new THREE.Mesh(finGeometry, bodyMaterial)
  fin.position.set(0, 1, 0)
  fin.rotation.x = Math.PI
  fin.castShadow = true
  sharkGroup.add(fin)

  // Tail
  const tailGeometry = new THREE.ConeGeometry(0.4, 0.8, 3)
  const tail = new THREE.Mesh(tailGeometry, bodyMaterial)
  tail.position.set(-1.5, 0, 0)
  tail.rotation.z = Math.PI / 2
  tail.castShadow = true
  sharkGroup.add(tail)

  // 3 LEGS with NIKES!
  const legPositions = [
    { x: 0.3, z: -0.5 },  // Front
    { x: -0.2, z: -0.5 }, // Middle
    { x: -0.7, z: -0.5 }  // Back
  ]

  legPositions.forEach(pos => {
    // Leg
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8)
    const leg = new THREE.Mesh(legGeometry, bodyMaterial)
    leg.position.set(pos.x, -0.8, pos.z)
    leg.castShadow = true
    sharkGroup.add(leg)

    // Nike shoe
    const shoeGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.35)
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial)
    shoe.position.set(pos.x, -1.3, pos.z)
    shoe.castShadow = true
    sharkGroup.add(shoe)

    // Nike swoosh (white stripe)
    const swooshGeometry = new THREE.PlaneGeometry(0.15, 0.05)
    const swooshMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const swoosh = new THREE.Mesh(swooshGeometry, swooshMaterial)
    swoosh.position.set(pos.x, -1.25, pos.z + 0.18)
    swoosh.rotation.z = -0.3
    sharkGroup.add(swoosh)
  })

  sharkGroup.position.copy(player.position)
  sharkGroup.rotation.copy(player.rotation)
  player = sharkGroup as any
  scene.add(player)
  isSharkForm = true
}

const createWalls = () => {
  const wallHeight = 10
  const wallThickness = 30  // 30 units thick walls!
  const worldSize = 100 // Half of 200

  // Wall material with purple brainrot theme
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f7aea,
    roughness: 0.6,
    metalness: 0.2
  })

  // North wall (positive Z)
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, wallHeight, wallThickness),
    wallMaterial
  )
  northWall.position.set(0, wallHeight / 2, worldSize)
  northWall.castShadow = true
  northWall.receiveShadow = true
  scene.add(northWall)

  // South wall (negative Z)
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, wallHeight, wallThickness),
    wallMaterial
  )
  southWall.position.set(0, wallHeight / 2, -worldSize)
  southWall.castShadow = true
  southWall.receiveShadow = true
  scene.add(southWall)

  // East wall (positive X)
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, worldSize * 2),
    wallMaterial
  )
  eastWall.position.set(worldSize, wallHeight / 2, 0)
  eastWall.castShadow = true
  eastWall.receiveShadow = true
  scene.add(eastWall)

  // West wall (negative X)
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, worldSize * 2),
    wallMaterial
  )
  westWall.position.set(-worldSize, wallHeight / 2, 0)
  westWall.castShadow = true
  westWall.receiveShadow = true
  scene.add(westWall)

  // Add glowing purple line at top of each wall for visibility
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5
  })

  // Top glow lines
  const topLineHeight = 0.3

  const northGlow = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, topLineHeight, wallThickness),
    glowMaterial
  )
  northGlow.position.set(0, wallHeight, worldSize)
  scene.add(northGlow)

  const southGlow = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, topLineHeight, wallThickness),
    glowMaterial
  )
  southGlow.position.set(0, wallHeight, -worldSize)
  scene.add(southGlow)

  const eastGlow = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, topLineHeight, worldSize * 2),
    glowMaterial
  )
  eastGlow.position.set(worldSize, wallHeight, 0)
  scene.add(eastGlow)

  const westGlow = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, topLineHeight, worldSize * 2),
    glowMaterial
  )
  westGlow.position.set(-worldSize, wallHeight, 0)
  scene.add(westGlow)
}

const createStatue = () => {
  // Create a massive statue of tung tung tung tung sahur in the center!
  const statueGroup = new THREE.Group()
  statueGroup.position.set(0, 0, 0) // Dead center of the map

  const statueScale = 5 // 5x larger than the NPC!

  // Pedestal base
  const pedestalGeometry = new THREE.CylinderGeometry(3, 4, 2, 32)
  const pedestalMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.7
  })
  const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
  pedestal.position.y = 1
  pedestal.castShadow = true
  pedestal.receiveShadow = true
  statueGroup.add(pedestal)

  // Plaque on pedestal
  const plaqueGeometry = new THREE.BoxGeometry(3, 0.5, 0.1)
  const plaqueMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.8
  })
  const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial)
  plaque.position.set(0, 1, 4.1)
  statueGroup.add(plaque)

  // Giant LOG statue body with wood texture
  const bodyGeometry = new THREE.CylinderGeometry(statueScale * 0.5, statueScale * 0.5, statueScale * 2, 32)

  // Create wood texture for giant statue
  const statueCanvas = document.createElement('canvas')
  statueCanvas.width = 512
  statueCanvas.height = 512
  const statueCtx = statueCanvas.getContext('2d')!

  // Wood color
  statueCtx.fillStyle = '#8B4513' // Brown
  statueCtx.fillRect(0, 0, 512, 512)

  // Add wood rings
  for (let i = 0; i < 15; i++) {
    statueCtx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    statueCtx.lineWidth = 3 + Math.random() * 5
    statueCtx.beginPath()
    statueCtx.arc(256, 256 + i * 30, 120 + i * 20, 0, Math.PI * 2)
    statueCtx.stroke()
  }

  const statueTexture = new THREE.CanvasTexture(statueCanvas)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: statueTexture,
    roughness: 0.8,
    metalness: 0.1
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 2 + statueScale
  body.castShadow = true
  statueGroup.add(body)

  // Giant STRAIGHT FACE on statue

  // Giant left eye (black dot)
  const giantEyeGeometry = new THREE.CircleGeometry(statueScale * 0.08, 16)
  const giantEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const leftEye = new THREE.Mesh(giantEyeGeometry, giantEyeMaterial)
  leftEye.position.set(-statueScale * 0.2, 2 + statueScale + statueScale * 0.3, statueScale * 0.51)
  statueGroup.add(leftEye)

  // Giant right eye (black dot)
  const rightEye = new THREE.Mesh(giantEyeGeometry, giantEyeMaterial)
  rightEye.position.set(statueScale * 0.2, 2 + statueScale + statueScale * 0.3, statueScale * 0.51)
  statueGroup.add(rightEye)

  // Giant straight mouth (horizontal line)
  const giantMouthGeometry = new THREE.BoxGeometry(statueScale * 0.3, statueScale * 0.03, 0.1)
  const giantMouth = new THREE.Mesh(giantMouthGeometry, giantEyeMaterial)
  giantMouth.position.set(0, 2 + statueScale, statueScale * 0.51)
  statueGroup.add(giantMouth)

  // Giant BASEBALL BAT held by statue
  const statueBatGroup = new THREE.Group()

  // Giant bat handle
  const statueHandleGeometry = new THREE.CylinderGeometry(statueScale * 0.05, statueScale * 0.05, statueScale * 0.6, 16)
  const statueBatMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2691E,
    roughness: 0.7
  })
  const statueHandle = new THREE.Mesh(statueHandleGeometry, statueBatMaterial)
  statueHandle.position.y = statueScale * 0.3
  statueBatGroup.add(statueHandle)

  // Giant bat barrel
  const statueBarrelGeometry = new THREE.CylinderGeometry(statueScale * 0.1, statueScale * 0.06, statueScale * 0.8, 16)
  const statueBarrel = new THREE.Mesh(statueBarrelGeometry, statueBatMaterial)
  statueBarrel.position.y = statueScale
  statueBatGroup.add(statueBarrel)

  // Position giant bat
  statueBatGroup.position.set(statueScale * 0.7, 2 + statueScale, 0)
  statueBatGroup.rotation.z = -Math.PI / 6
  statueBatGroup.castShadow = true
  statueGroup.add(statueBatGroup)

  // Add spotlights pointing at statue
  const spotlight1 = new THREE.SpotLight(0x00ffff, 1, 50, Math.PI / 6)
  spotlight1.position.set(-10, 15, -10)
  spotlight1.target.position.set(0, 7, 0)
  spotlight1.castShadow = true
  scene.add(spotlight1)
  scene.add(spotlight1.target)

  const spotlight2 = new THREE.SpotLight(0xff00ff, 1, 50, Math.PI / 6)
  spotlight2.position.set(10, 15, 10)
  spotlight2.target.position.set(0, 7, 0)
  spotlight2.castShadow = true
  scene.add(spotlight2)
  scene.add(spotlight2.target)

  // Add a glowing aura around the statue
  const auraGeometry = new THREE.SphereGeometry(statueScale * 1.2, 32, 32)
  const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  })
  const aura = new THREE.Mesh(auraGeometry, auraMaterial)
  aura.position.y = 2 + statueScale
  statueGroup.add(aura)

  // Animate the aura (pulsing effect)
  const animateAura = () => {
    const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1
    aura.scale.set(scale, scale, scale)
    aura.rotation.y += 0.01
  }

  // Store animation function
  statueGroup.userData.animate = animateAura

  scene.add(statueGroup)

  // Store reference for animation
  scene.userData.statue = statueGroup
}

const createCoins = () => {
  const coinPositions = [
    { x: 5, y: 1.5, z: 5 },
    { x: -10, y: 1.5, z: 10 },
    { x: 15, y: 1.5, z: -5 },
    { x: -20, y: 1.5, z: -15 },
    { x: 25, y: 1.5, z: 8 },
    { x: 35, y: 1.5, z: 15 },
    { x: -30, y: 1.5, z: 20 },
    { x: 12, y: 1.5, z: 20 },
    { x: 10, y: 1.5, z: -15 },
    { x: -5, y: 1.5, z: -5 },
    { x: 20, y: 1.5, z: 20 },
    { x: -25, y: 1.5, z: -25 },
    { x: 40, y: 1.5, z: -10 },
    { x: -40, y: 1.5, z: 10 },
    { x: 0, y: 1.5, z: 30 }
  ]

  coinPositions.forEach(pos => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    })
    const coin = new THREE.Mesh(geometry, material)
    coin.position.set(pos.x, pos.y, pos.z)
    coin.rotation.x = Math.PI / 2
    coin.castShadow = true
    coin.userData.isCollectible = true
    coins.push(coin)
    scene.add(coin)
  })
}

const createRocksAndApples = () => {
  // 4 rock locations with 3 apples each (1 golden, 2 normal)
  const rockLocations = [
    { x: -50, z: -50 },
    { x: 50, z: -50 },
    { x: -50, z: 50 },
    { x: 50, z: 50 }
  ]

  rockLocations.forEach((loc, rockIndex) => {
    // Create a rock group
    const rockGroup = new THREE.Group()
    rockGroup.position.set(loc.x, 0, loc.z)

    // Create gray rock (irregular sphere shape)
    const rockGeometry = new THREE.SphereGeometry(2, 8, 6) // Low poly for rocky look
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1
    })
    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.position.y = 1.5
    rock.scale.set(1, 0.7, 1) // Flatten it a bit
    rock.castShadow = true
    rock.receiveShadow = true
    rockGroup.add(rock)

    scene.add(rockGroup)
    rocks.push(rockGroup)

    // Create 3 apples next to each rock (1 golden, 2 normal)
    const applePositions = [
      { x: loc.x + 3, z: loc.z, isGolden: false },
      { x: loc.x - 3, z: loc.z, isGolden: false },
      { x: loc.x, z: loc.z + 3, isGolden: true }
    ]

    applePositions.forEach((applePos, appleIndex) => {
      // Apple body (sphere)
      const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16)
      const appleMaterial = new THREE.MeshStandardMaterial({
        color: applePos.isGolden ? 0xffd700 : 0xff0000,
        metalness: applePos.isGolden ? 0.8 : 0.2,
        roughness: applePos.isGolden ? 0.2 : 0.6,
        emissive: applePos.isGolden ? 0xffaa00 : 0x000000,
        emissiveIntensity: applePos.isGolden ? 0.3 : 0
      })
      const apple = new THREE.Mesh(appleGeometry, appleMaterial)
      apple.position.set(applePos.x, 0.5, applePos.z)
      apple.castShadow = true

      // Add stem on top
      const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      const stem = new THREE.Mesh(stemGeometry, stemMaterial)
      stem.position.set(applePos.x, 0.8, applePos.z)
      scene.add(stem)

      // Store apple data
      apple.userData.isApple = true
      apple.userData.isGolden = applePos.isGolden
      apple.userData.hp = applePos.isGolden ? 20 : 5
      apple.userData.maxHp = applePos.isGolden ? 20 : 5
      apple.userData.stem = stem
      apple.userData.rockIndex = rockIndex
      apple.userData.appleIndex = appleIndex

      apples.push(apple)
      scene.add(apple)
    })
  })
}

const createStars = () => {
  const starGeometry = new THREE.BufferGeometry()
  const starPositions = []

  for (let i = 0; i < 500; i++) {
    const x = (Math.random() - 0.5) * 400
    const y = Math.random() * 100 + 20
    const z = (Math.random() - 0.5) * 400
    starPositions.push(x, y, z)
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true
  })

  const stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)
}

const setupControls = () => {
  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    keys[key] = true

    // Toggle camera view with B key
    if (key === 'b') {
      isFirstPerson = !isFirstPerson
      infoText.value = isFirstPerson ? 'Switched to First Person View' : 'Switched to Third Person View'
      setTimeout(() => {
        infoText.value = 'Explore the Italian brainrot world! 🇮🇹'
      }, 2000)
    }
  })

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false
  })

  // Mouse controls
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock()
  })

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      mouseX = e.movementX
      mouseY = e.movementY
    }
  })

  // Mouse click to hit apples
  renderer.domElement.addEventListener('click', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      hitApple()
    }
  })
}

const hitApple = () => {
  // Check cooldown (1 second = 1000ms)
  const currentTime = Date.now()
  const canAttack = currentTime - lastAppleAttack >= 1000

  if (!canAttack) {
    const timeLeft = Math.ceil((1000 - (currentTime - lastAppleAttack)) / 1000)
    infoText.value = `Attack cooldown: ${timeLeft}s ⏱️`
    return
  }

  // Create a raycaster to detect what we're looking at
  const raycaster = new THREE.Raycaster()

  // In third person, raycast from player's looking direction, not camera
  if (isFirstPerson) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera) // Center of screen
  } else {
    // Cast from player position in the direction they're facing
    const direction = new THREE.Vector3()
    direction.x = -Math.sin(yaw) * Math.cos(pitch)
    direction.y = Math.sin(pitch)
    direction.z = -Math.cos(yaw) * Math.cos(pitch)
    direction.normalize()

    raycaster.set(player.position, direction)
  }

  // Check if we're looking at any apples
  const intersects = raycaster.intersectObjects(apples)

  if (intersects.length > 0) {
    const apple = intersects[0].object as THREE.Mesh
    if (apple.userData.isApple && apple.userData.hp > 0) {
      // Hit the apple
      apple.userData.hp -= 1
      lastAppleAttack = currentTime // Update cooldown timer

      const isGolden = apple.userData.isGolden
      const appleType = isGolden ? 'Golden Apple' : 'Apple'

      if (apple.userData.hp <= 0) {
        // Apple destroyed
        scene.remove(apple)
        scene.remove(apple.userData.stem)

        infoText.value = `${appleType} destroyed! 💥`

        // Give rewards
        if (isGolden) {
          gameState.addCoins(50)
          addExp(5) // Golden apples give 5 exp (50%)
          infoText.value = `Golden Apple destroyed! +50 coins, +5 EXP! 💰`
        } else {
          gameState.addCoins(10)
          addExp(2) // Normal apples give 2 exp (20%)
          infoText.value = `Apple destroyed! +10 coins, +2 EXP! 🍎`
        }

        // Respawn apple after 3 seconds
        setTimeout(() => {
          respawnApple(apple)
        }, 3000)

        setTimeout(() => {
          infoText.value = 'Explore the brainrot world! 🧠'
        }, 2000)
      } else {
        // Apple hit but not destroyed
        infoText.value = `${appleType} HP: ${apple.userData.hp}/${apple.userData.maxHp}`

        // Make apple flash red when hit
        const originalEmissive = (apple.material as THREE.MeshStandardMaterial).emissive.clone()
        ;(apple.material as THREE.MeshStandardMaterial).emissive.set(0xff0000)
        setTimeout(() => {
          if (apple.parent) { // Check if still exists
            ;(apple.material as THREE.MeshStandardMaterial).emissive.copy(originalEmissive)
          }
        }, 100)
      }
    }
  } else {
    // Clicked but not looking at an apple
    lastAppleAttack = currentTime // Still trigger cooldown to prevent spam clicking
    // Don't show any message when missing
  }
}

const respawnApple = (apple: THREE.Mesh) => {
  // Reset apple HP
  apple.userData.hp = apple.userData.maxHp

  // Recreate the apple mesh
  const isGolden = apple.userData.isGolden
  const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const appleMaterial = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xffd700 : 0xff0000,
    metalness: isGolden ? 0.8 : 0.2,
    roughness: isGolden ? 0.2 : 0.6,
    emissive: isGolden ? 0xffaa00 : 0x000000,
    emissiveIntensity: isGolden ? 0.3 : 0
  })

  const newApple = new THREE.Mesh(appleGeometry, appleMaterial)
  newApple.position.copy(apple.position)
  newApple.castShadow = true

  // Copy all user data
  newApple.userData = { ...apple.userData }

  // Recreate stem
  const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const newStem = new THREE.Mesh(stemGeometry, stemMaterial)
  newStem.position.set(apple.position.x, apple.position.y + 0.3, apple.position.z)

  // Store new stem reference
  newApple.userData.stem = newStem

  // Add back to scene and apples array
  scene.add(newApple)
  scene.add(newStem)
  apples.push(newApple)
}

const updatePlayer = () => {
  // Mouse look
  const sensitivity = 0.002
  yaw -= mouseX * sensitivity
  pitch -= mouseY * sensitivity
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))
  mouseX = 0
  mouseY = 0

  // Update camera rotation
  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch

  // Movement - calculate direction based on player's yaw, not camera
  const direction = new THREE.Vector3()
  const right = new THREE.Vector3()

  // Calculate forward direction from player's yaw
  direction.x = Math.sin(yaw)
  direction.y = 0
  direction.z = Math.cos(yaw)
  direction.normalize()

  // Calculate right direction (perpendicular to forward)
  right.x = -Math.cos(yaw)
  right.y = 0
  right.z = Math.sin(yaw)
  right.normalize()

  // Auto-move forward if enabled
  if (autoMoveEnabled.value) {
    player.position.add(direction.clone().multiplyScalar(moveSpeed))
  }

  if (keys['w'] || keys['arrowup']) {
    player.position.add(direction.clone().multiplyScalar(moveSpeed))
  }
  if (keys['s'] || keys['arrowdown']) {
    player.position.add(direction.clone().multiplyScalar(-moveSpeed))
  }
  if (keys['a'] || keys['arrowleft']) {
    player.position.add(right.clone().multiplyScalar(-moveSpeed))
  }
  if (keys['d'] || keys['arrowright']) {
    player.position.add(right.clone().multiplyScalar(moveSpeed))
  }

  // Jumping
  if (keys[' '] && !isJumping && player.position.y <= playerHeight + 0.1) {
    velocityY = jumpPower
    isJumping = true
  }

  // Apply gravity
  velocityY -= gravity
  player.position.y += velocityY

  // Ground collision
  if (player.position.y <= playerHeight) {
    player.position.y = playerHeight
    velocityY = 0
    isJumping = false
  }

  // Rotate player to face the direction they're looking
  player.rotation.y = yaw

  // Update camera position based on view mode
  if (isFirstPerson) {
    // First person: camera at player position
    camera.position.copy(player.position)
  } else {
    // Third person: camera behind and above player
    const thirdPersonDistance = 8
    const thirdPersonHeight = 3

    // Calculate camera position behind the player based on yaw
    const offsetX = Math.sin(yaw) * thirdPersonDistance
    const offsetZ = Math.cos(yaw) * thirdPersonDistance

    camera.position.set(
      player.position.x - offsetX,
      player.position.y + thirdPersonHeight,
      player.position.z - offsetZ
    )

    // Make camera look at the player
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z)
  }

  // Keep player within bounds
  const bound = 95
  player.position.x = Math.max(-bound, Math.min(bound, player.position.x))
  player.position.z = Math.max(-bound, Math.min(bound, player.position.z))

  // Update game data
  gameData.value.playerX = player.position.x
  gameData.value.playerZ = player.position.z
}

const checkCollisions = () => {
  // Check coin collection
  coins.forEach((coin, index) => {
    if (!coin.parent) return // Already collected

    const distance = player.position.distanceTo(coin.position)
    if (distance < 1.5) {
      scene.remove(coin)
      coins.splice(index, 1)
      gameData.value.coinsCollectedCount++
      coinsCollected.value++
      gameState.addCoins(10)
      infoText.value = '+10 coins collected! Keep exploring!'
      setTimeout(() => {
        infoText.value = 'Explore the 3D brainrot world!'
      }, 2000)
    }
  })

}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // Update player
  updatePlayer()

  // Check collisions
  checkCollisions()

  // Auto-attack logic
  if (autoAttackEnabled.value) {
    const currentTime = Date.now()
    const canAutoAttack = currentTime - lastAppleAttack >= 1000

    if (canAutoAttack) {
      hitApple()
    }
  }

  // Show/hide player mesh based on camera mode
  if (player) {
    player.visible = !isFirstPerson
  }

  // Animate coins
  coins.forEach(coin => {
    coin.rotation.z += 0.02
    coin.position.y += Math.sin(Date.now() * 0.001 + coin.position.x) * 0.005
  })

  // Animate statue
  if (scene.userData.statue) {
    scene.userData.statue.userData.animate()
  }

  // Render scene
  renderer.render(scene, camera)
}

onMounted(() => {
  loadGameData()
  init3DScene()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
  saveGameData()
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  position: relative;
  width: 800px;
  height: 600px;
  border: 3px solid #ff00ff;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #ff0000;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: #cc0000;
}

.auto-attack-button {
  position: absolute;
  top: 70px;
  left: 20px;
  padding: 10px 20px;
  background: #9f7aea;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.auto-attack-button:hover {
  background: #805ad5;
}

.inventory-button {
  position: absolute;
  top: 120px;
  left: 20px;
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.inventory-button:hover {
  background: #d97706;
}

.auto-walk-button {
  position: absolute;
  top: 170px;
  left: 20px;
  padding: 10px 20px;
  background: #10b981;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.auto-walk-button:hover {
  background: #059669;
}

.inventory-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #f59e0b;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
  z-index: 2000;
  padding: 20px;
  color: white;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f59e0b;
  padding-bottom: 10px;
}

.inventory-header h2 {
  margin: 0;
  font-size: 28px;
  color: #f59e0b;
}

.inventory-close {
  background: #ff0000;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: bold;
}

.inventory-close:hover {
  background: #cc0000;
}

.inventory-content {
  padding: 10px;
}

.inventory-section {
  margin-bottom: 20px;
  background: rgba(245, 158, 11, 0.1);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #f59e0b;
}

.inventory-section h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #fbbf24;
}

.world-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.world-name {
  flex: 1;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  padding: 15px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 5px;
  border: 2px solid #fbbf24;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.world-character {
  flex-shrink: 0;
}

.character-circle {
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  background: #8B4513;
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 100;
  pointer-events: none;
}

.hud-title {
  font-size: 24px;
  color: #ff00ff;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  margin-bottom: 10px;
}

.hud-info {
  font-size: 16px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 5px;
}

.hud-coins {
  font-size: 18px;
  color: #ffd700;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  font-weight: bold;
}

.controls-hint {
  position: absolute;
  bottom: 50px;
  left: 10px;
  right: 10px;
  font-size: 14px;
  color: #00ffff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  z-index: 100;
  pointer-events: none;
}

.level-bar {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 100;
  pointer-events: none;
}

.level-bar-bg {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #ffd700;
  border-radius: 5px;
  overflow: hidden;
}

.level-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.level-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
  z-index: 1;
}

.exp-text {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
  z-index: 1;
}

.level-up-shark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  text-align: center;
  animation: sharkBounce 0.5s ease-in-out infinite;
}

@keyframes sharkBounce {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -55%) scale(1.05);
  }
}

.shark-canvas {
  border: 5px solid #ffd700;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
}

.shark-name {
  margin-top: 10px;
  font-size: 32px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 10px;
  border: 3px solid #ffd700;
}
</style>
