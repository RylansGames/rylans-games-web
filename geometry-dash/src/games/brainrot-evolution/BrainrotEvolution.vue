<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>
    <div ref="gameContainer" class="game-container">
      <div class="hud">
        <div class="hud-title">🧠 BRAINROT EVOLUTION 3D 🧠</div>
        <div class="hud-info">{{ infoText }}</div>
        <div class="hud-coins">Coins Collected: {{ coinsCollected }}</div>
      </div>
      <div class="controls-hint">
        WASD: Move | Mouse: Look Around | SPACE: Jump | E: Interact | B: Toggle Camera
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
const router = useRouter()
const infoText = ref('Benvenuto! Welcome to the Italian Brainrot World! Find tung tung tung tung sahur! 🇮🇹🤌')
const coinsCollected = ref(0)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let player: THREE.Mesh
let tungTungNPC: THREE.Group
let coins: THREE.Mesh[] = []
let animationId: number

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

// Game data
interface GameData {
  playerX: number
  playerZ: number
  coinsCollectedCount: number
  hasMetTungTung: boolean
}

const gameData = ref<GameData>({
  playerX: 0,
  playerZ: 0,
  coinsCollectedCount: 0,
  hasMetTungTung: false
})

const goBack = () => {
  router.push('/')
}

const loadGameData = () => {
  const saved = localStorage.getItem('brainrotEvolution3D')
  if (saved) {
    gameData.value = JSON.parse(saved)
    coinsCollected.value = gameData.value.coinsCollectedCount
  }
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

  // Create player collision box (visible in third person)
  const playerGeometry = new THREE.BoxGeometry(0.6, playerHeight * 2, 0.6)
  const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.8,
    emissive: 0xff00ff,
    emissiveIntensity: 0.3
  })
  player = new THREE.Mesh(playerGeometry, playerMaterial)
  player.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)
  player.castShadow = true
  scene.add(player)

  // Create walls around the world
  createWalls()

  // Create giant statue in center
  createStatue()

  // Create tung tung tung tung sahur NPC
  createTungTungNPC()

  // Create collectible coins
  createCoins()

  // Create skybox with stars
  createStars()

  // Setup controls
  setupControls()

  // Start animation loop
  animate()

  // Auto-save every 5 seconds
  setInterval(saveGameData, 5000)
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

const createTungTungNPC = () => {
  tungTungNPC = new THREE.Group()
  tungTungNPC.position.set(30, 1.5, 0)

  // LOG BODY - Brown wooden cylinder
  const logGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32)

  // Create wood texture with rings
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Wood color
  ctx.fillStyle = '#8B4513' // Brown
  ctx.fillRect(0, 0, 512, 512)

  // Add wood rings
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 2 + Math.random() * 3
    ctx.beginPath()
    ctx.arc(256, 256 + i * 20, 100 + i * 15, 0, Math.PI * 2)
    ctx.stroke()
  }

  const woodTexture = new THREE.CanvasTexture(canvas)
  const logMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.8,
    metalness: 0.1
  })
  const log = new THREE.Mesh(logGeometry, logMaterial)
  log.castShadow = true
  tungTungNPC.add(log)

  // STRAIGHT FACE - Simple dots and line

  // Left eye (black dot)
  const leftEyeGeometry = new THREE.CircleGeometry(0.08, 16)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial)
  leftEye.position.set(-0.2, 0.3, 0.51)
  tungTungNPC.add(leftEye)

  // Right eye (black dot)
  const rightEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial)
  rightEye.position.set(0.2, 0.3, 0.51)
  tungTungNPC.add(rightEye)

  // Straight mouth (horizontal line)
  const mouthGeometry = new THREE.BoxGeometry(0.3, 0.03, 0.01)
  const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial)
  mouth.position.set(0, 0, 0.51)
  tungTungNPC.add(mouth)

  // BASEBALL BAT - Wooden bat held by log
  const batGroup = new THREE.Group()

  // Bat handle
  const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16)
  const batMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2691E,
    roughness: 0.7
  })
  const handle = new THREE.Mesh(handleGeometry, batMaterial)
  handle.position.y = 0.3
  batGroup.add(handle)

  // Bat barrel (thicker part)
  const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.06, 0.8, 16)
  const barrel = new THREE.Mesh(barrelGeometry, batMaterial)
  barrel.position.y = 1
  batGroup.add(barrel)

  // Position bat to side of log, angled
  batGroup.position.set(0.7, 0, 0)
  batGroup.rotation.z = -Math.PI / 6 // Angle it
  batGroup.castShadow = true
  tungTungNPC.add(batGroup)

  // Exclamation mark above head
  const exclamationGeometry = new THREE.ConeGeometry(0.1, 0.5, 8)
  const exclamationMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 })
  const exclamation = new THREE.Mesh(exclamationGeometry, exclamationMaterial)
  exclamation.position.set(0, 2, 0)
  exclamation.visible = false
  tungTungNPC.add(exclamation)
  tungTungNPC.userData.exclamation = exclamation

  scene.add(tungTungNPC)
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

  // Movement
  const direction = new THREE.Vector3()
  const right = new THREE.Vector3()

  camera.getWorldDirection(direction)
  direction.y = 0
  direction.normalize()

  right.crossVectors(camera.up, direction).normalize()

  if (keys['w']) {
    player.position.add(direction.clone().multiplyScalar(moveSpeed))
  }
  if (keys['s']) {
    player.position.add(direction.clone().multiplyScalar(-moveSpeed))
  }
  if (keys['a']) {
    player.position.add(right.clone().multiplyScalar(moveSpeed))
  }
  if (keys['d']) {
    player.position.add(right.clone().multiplyScalar(-moveSpeed))
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

  // Update camera position based on view mode
  if (isFirstPerson) {
    // First person: camera at player position
    camera.position.copy(player.position)
  } else {
    // Third person: camera behind and above player
    const thirdPersonDistance = 5
    const thirdPersonHeight = 2

    // Calculate camera position behind the player based on yaw
    const offsetX = Math.sin(yaw) * thirdPersonDistance
    const offsetZ = Math.cos(yaw) * thirdPersonDistance

    camera.position.set(
      player.position.x - offsetX,
      player.position.y + thirdPersonHeight,
      player.position.z - offsetZ
    )
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

  // Check NPC proximity
  if (tungTungNPC) {
    const distance = player.position.distanceTo(tungTungNPC.position)
    const exclamation = tungTungNPC.userData.exclamation

    if (distance < 5) {
      exclamation.visible = true
      infoText.value = 'Press E to talk to Italian tung tung tung tung sahur! 🇮🇹'

      if (keys['e'] && !gameData.value.hasMetTungTung) {
        gameData.value.hasMetTungTung = true
        gameState.addCoins(100)
        infoText.value = '🇮🇹 tung tung tung tung sahur: "Buongiorno! Welcome to-a Brainrot World! Mamma mia, +100 coins for you! 🍝"'
        setTimeout(() => {
          infoText.value = 'Keep-a exploring! Magnifico!'
        }, 4000)
        keys['e'] = false // Prevent spam
      } else if (keys['e'] && gameData.value.hasMetTungTung) {
        infoText.value = '🇮🇹 tung tung tung tung sahur: "Ciao bella! Arrivederci amico! 🤌"'
        setTimeout(() => {
          infoText.value = 'Explore the Italian brainrot world! 🇮🇹'
        }, 2000)
        keys['e'] = false
      }
    } else {
      exclamation.visible = false
      if (distance > 10 && infoText.value.includes('tung tung')) {
        infoText.value = 'Explore the Italian brainrot world! 🇮🇹'
      }
    }
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // Update player
  updatePlayer()

  // Check collisions
  checkCollisions()

  // Show/hide player mesh based on camera mode
  if (player) {
    player.visible = !isFirstPerson
  }

  // Animate coins
  coins.forEach(coin => {
    coin.rotation.z += 0.02
    coin.position.y += Math.sin(Date.now() * 0.001 + coin.position.x) * 0.005
  })

  // Animate NPC
  if (tungTungNPC) {
    tungTungNPC.rotation.y += 0.01
    tungTungNPC.position.y = 1 + Math.sin(Date.now() * 0.001) * 0.3
  }

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
  bottom: 10px;
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
</style>
