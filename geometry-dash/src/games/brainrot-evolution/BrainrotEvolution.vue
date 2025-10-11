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
        WASD: Move | Mouse: Look Around | SPACE: Jump | E: Interact
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
const infoText = ref('Welcome to the 3D Brainrot World! Explore and find tung tung tung tung sahur!')
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

  // Create player collision box (invisible)
  const playerGeometry = new THREE.BoxGeometry(0.6, playerHeight * 2, 0.6)
  const playerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0
  })
  player = new THREE.Mesh(playerGeometry, playerMaterial)
  player.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)
  scene.add(player)

  // Create platforms
  createPlatforms()

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

const createPlatforms = () => {
  const platformData = [
    { x: 10, y: 2, z: 0, width: 8, depth: 8 },
    { x: 20, y: 4, z: 5, width: 6, depth: 6 },
    { x: -15, y: 3, z: -10, width: 10, depth: 10 },
    { x: 30, y: 5, z: -5, width: 8, depth: 8 },
    { x: -25, y: 6, z: 15, width: 7, depth: 7 },
    { x: 40, y: 3, z: 10, width: 12, depth: 12 },
    { x: -35, y: 4, z: -20, width: 9, depth: 9 },
    { x: 15, y: 7, z: 25, width: 6, depth: 6 }
  ]

  platformData.forEach(p => {
    const geometry = new THREE.BoxGeometry(p.width, 1, p.depth)
    const material = new THREE.MeshStandardMaterial({
      color: 0x9f7aea,
      roughness: 0.5
    })
    const platform = new THREE.Mesh(geometry, material)
    platform.position.set(p.x, p.y, p.z)
    platform.castShadow = true
    platform.receiveShadow = true
    scene.add(platform)
  })
}

const createTungTungNPC = () => {
  tungTungNPC = new THREE.Group()
  tungTungNPC.position.set(30, 1, 0)

  // Body (sphere)
  const bodyGeometry = new THREE.SphereGeometry(1, 32, 32)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    roughness: 0.5,
    metalness: 0.3
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true
  tungTungNPC.add(body)

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.3, 0.3, 0.8)
  tungTungNPC.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.3, 0.3, 0.8)
  tungTungNPC.add(rightEye)

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16)
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })

  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  leftPupil.position.set(-0.3, 0.3, 0.9)
  tungTungNPC.add(leftPupil)

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  rightPupil.position.set(0.3, 0.3, 0.9)
  tungTungNPC.add(rightPupil)

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
    { x: 15, y: 5, z: -5 },
    { x: -20, y: 4, z: -15 },
    { x: 25, y: 6, z: 8 },
    { x: 35, y: 4, z: 15 },
    { x: -30, y: 5, z: 20 },
    { x: 12, y: 3, z: 20 },
    { x: 10, y: 3, z: -15 },
    { x: -5, y: 1.5, z: -5 }
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
    keys[e.key.toLowerCase()] = true
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

  // Update camera position to follow player
  camera.position.copy(player.position)

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
      infoText.value = 'Press E to talk to tung tung tung tung sahur!'

      if (keys['e'] && !gameData.value.hasMetTungTung) {
        gameData.value.hasMetTungTung = true
        gameState.addCoins(100)
        infoText.value = 'tung tung tung tung sahur: "Welcome to 3D Brainrot World! +100 coins!"'
        setTimeout(() => {
          infoText.value = 'Keep exploring the world!'
        }, 4000)
        keys['e'] = false // Prevent spam
      } else if (keys['e'] && gameData.value.hasMetTungTung) {
        infoText.value = 'tung tung tung tung sahur: "Hello again friend!"'
        setTimeout(() => {
          infoText.value = 'Explore the 3D brainrot world!'
        }, 2000)
        keys['e'] = false
      }
    } else {
      exclamation.visible = false
      if (distance > 10 && infoText.value.includes('tung tung')) {
        infoText.value = 'Explore the 3D brainrot world!'
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
