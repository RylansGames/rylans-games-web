<template>
  <div class="forest-app">
    <!-- Menu -->
    <div v-if="phase === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🌲</div>
        <h1 class="menu-title">99 Nights in the Forest</h1>
        <p class="menu-sub">Survive the darkness...</p>
        <input v-model="playerName" type="text" placeholder="Your name" maxlength="12" class="menu-input" />
        <button class="play-btn" @click="enterLobbyArea" :disabled="!playerName.trim()">🌲 Enter</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Lobby Area (3D with 3 yellow boxes) -->
    <div v-if="phase === 'lobby-area'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- HUD -->
      <div class="lobby-hud">
        <div class="hud-name">{{ playerName }}</div>
      </div>

      <!-- Box prompt when near a box -->
      <div v-if="nearBox !== null && !inBox" class="box-prompt">
        <div class="bp-text">Enter Lobby {{ nearBox + 1 }}</div>
        <button class="bp-btn" @click="enterBox">Enter (E)</button>
      </div>

      <!-- Inside box UI -->
      <div v-if="inBox" class="box-ui">
        <div class="box-header">
          <h2>🌲 Lobby {{ (nearBox ?? 0) + 1 }}</h2>
          <button class="box-exit" @click="exitBox">✕ Exit</button>
        </div>

        <!-- Player count selection -->
        <div v-if="!playerCountSelected" class="count-select">
          <p class="cs-label">How many players?</p>
          <div class="cs-buttons">
            <button v-for="n in 5" :key="n" class="cs-btn" :class="{ selected: selectedCount === n }" @click="selectedCount = n">
              {{ n }}
            </button>
          </div>
          <button v-if="selectedCount > 0" class="cs-ok" @click="confirmCount">OK ✅</button>
        </div>

        <!-- Waiting / Timer -->
        <div v-if="playerCountSelected" class="box-waiting">
          <div class="bw-count">{{ selectedCount === 1 ? 'Single Player' : selectedCount + ' Players' }}</div>
          <div class="bw-players">
            <div v-for="(p, i) in lobbyPlayers" :key="i" class="bw-player">
              <div class="bwp-avatar" :style="{ background: p.color }">{{ p.name.charAt(0).toUpperCase() }}</div>
              <span>{{ p.name }}</span>
            </div>
            <div v-for="i in (selectedCount - lobbyPlayers.length)" :key="'empty-'+i" class="bw-player empty">
              <div class="bwp-avatar empty-avatar">?</div>
              <span>Waiting...</span>
            </div>
          </div>
          <div class="bw-timer">
            <div class="timer-bar"><div class="timer-fill" :style="{ width: ((boxTimer / 10) * 100) + '%' }"></div></div>
            <span class="timer-text">Starting in {{ boxTimer }}s</span>
          </div>
          <button class="box-exit-btn" @click="exitBox">❌ Leave Lobby</button>
        </div>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls">
        <div class="joy-area" @touchstart.prevent="joyStart" @touchmove.prevent="joyMove" @touchend.prevent="joyEnd">
          <div class="joy-knob" :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"></div>
        </div>
      </div>
    </div>

    <!-- Game Starting -->
    <div v-if="phase === 'starting'" class="starting-screen">
      <div class="starting-text">
        <h1>🌲 Night 1 🌲</h1>
        <p>Entering the forest...</p>
      </div>
    </div>

    <!-- In Forest -->
    <div v-if="phase === 'forest'" class="forest-screen">
      <div ref="forestContainer" class="three-container"></div>

      <!-- Forest HUD -->
      <div class="forest-hud">
        <div class="fh-night" :class="{ night: isNight }">{{ isNight ? '🌙' : '☀️' }} {{ isNight ? 'Night' : 'Day' }} {{ currentNight }}</div>
        <div class="fh-timer">{{ dayTimeLeft }}s</div>
        <div class="fh-fire">🔥 Fire Lv.{{ fireLevel }} ({{ fireHealth }})</div>
      </div>

      <!-- Inventory Hotbar -->
      <div class="hotbar">
        <div v-for="(slot, i) in hotbar" :key="i" class="hotbar-slot" :class="{ selected: selectedSlot === i, empty: !slot }" @click="selectedSlot = i">
          <span class="slot-icon" v-if="slot">{{ slot.icon }}</span>
          <span class="slot-name" v-if="slot">{{ slot.name }}</span>
          <span class="slot-count" v-if="slot && slot.count > 1">{{ slot.count }}</span>
          <span class="slot-key">{{ i + 1 }}</span>
        </div>
      </div>

      <!-- Sack capacity -->
      <div class="sack-display" v-if="hasSack" :class="{ full: sackItems >= sackMax }">
        🎒 {{ sackItems }}/{{ sackMax }}
      </div>

      <!-- Interact prompt -->
      <div v-if="forestInteract" class="forest-interact">
        <button class="fi-btn" @click="doForestInteract">{{ forestInteract }}</button>
      </div>

      <!-- Crafting bench UI -->
      <div v-if="showCrafting" class="crafting-ui">
        <div class="craft-header">
          <h2>🔨 Crafting Bench</h2>
          <button class="craft-close" @click="showCrafting = false">✕</button>
        </div>
        <div class="craft-grid">
          <div v-for="recipe in craftRecipes" :key="recipe.id" class="craft-card">
            <div class="cc-icon">{{ recipe.icon }}</div>
            <div class="cc-name">{{ recipe.name }}</div>
            <div class="cc-cost">{{ recipe.costText }}</div>
            <button class="cc-btn" :disabled="!canCraft(recipe)" @click="craftItem(recipe)">
              {{ canCraft(recipe) ? 'Craft' : 'Need materials' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Map UI -->
      <div v-if="showMap" class="map-ui">
        <div class="map-header">
          <h2>🗺️ Map</h2>
          <button class="map-close" @click="showMap = false">✕</button>
        </div>
        <div class="map-view">
          <canvas ref="mapCanvas" width="300" height="300" class="map-canvas"></canvas>
        </div>
      </div>

      <!-- Placement message -->
      <div v-if="placementMsg" class="placement-msg">{{ placementMsg }}</div>

      <!-- Map button (top right) -->
      <button v-if="hasMap" class="map-btn" @click="showMap = !showMap">🗺️ Map</button>

      <!-- Death screen -->
      <div v-if="forestDead" class="forest-death">
        <h1>💀 You were attacked!</h1>
        <p>The deer got you! Stay near the fire at night!</p>
        <button class="play-btn" @click="respawnForest">Respawn</button>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls forest-mobile">
        <div class="joy-area" @touchstart.prevent="joyStartF" @touchmove.prevent="joyMoveF" @touchend.prevent="joyEndF">
          <div class="joy-knob" :style="{ transform: `translate(${fjoyX}px, ${fjoyY}px)` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '../../firebase'
import { ref as dbRef, set, onValue, remove, get, onDisconnect } from 'firebase/database'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

type Phase = 'menu' | 'lobby-area' | 'starting' | 'forest'

const phase = ref<Phase>('menu')
const playerName = ref('')
const nearBox = ref<number | null>(null)
const inBox = ref(false)
const selectedCount = ref(0)
const playerCountSelected = ref(false)
const boxTimer = ref(10)

interface LobbyPlayer { name: string; color: string; id: string }
const lobbyPlayers = ref<LobbyPlayer[]>([])

const PLAYER_COLORS = ['#e53e3e', '#3b82f6', '#22c55e', '#fbbf24', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4']
const myId = 'fn-' + Math.random().toString(36).slice(2, 10)
let myColor = ''

// 3D
const threeContainer = ref<HTMLElement | null>(null)
const forestContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number

let playerX = 0
let playerZ = 5
let playerYaw = 0
let playerMesh: THREE.Group
const SPEED = 0.08
const keys: Record<string, boolean> = {}

// Mouse look
let lastMouseX = -1

// Joystick
const joyX = ref(0)
const joyY = ref(0)
let joyTouchId: number | null = null
let joyCenter = { x: 0, y: 0 }

// Boxes
interface LobbyBox { x: number; z: number; mesh?: THREE.Mesh }
const boxes: LobbyBox[] = [
  { x: -4, z: -3 },
  { x: 0, z: -5 },
  { x: 4, z: -3 },
]

let boxTimerInterval: number | null = null
let currentBoxIndex = -1
let firebaseUnsubs: (() => void)[] = []

function enterLobbyArea() {
  if (!playerName.value.trim()) return
  localStorage.setItem('forestName', playerName.value)
  myColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
  phase.value = 'lobby-area'
  nextTick(() => init3D())
}

// ===== 3D =====
function init3D() {
  if (!threeContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a1a0a')
  scene.fog = new THREE.Fog('#0a1a0a', 15, 40)

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  threeContainer.value.appendChild(renderer.domElement)

  // Mouse look
  renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
    if (lastMouseX >= 0) playerYaw += (e.clientX - lastMouseX) * 0.005
    lastMouseX = e.clientX
  })
  renderer.domElement.addEventListener('mouseleave', () => { lastMouseX = -1 })
  renderer.domElement.addEventListener('mouseenter', (e: MouseEvent) => { lastMouseX = e.clientX })

  // Lights
  scene.add(new THREE.AmbientLight('#334433', 0.4))
  const moon = new THREE.DirectionalLight('#aabbcc', 0.6)
  moon.position.set(5, 15, 5)
  moon.castShadow = true
  scene.add(moon)

  // Moonlight glow
  const moonGlow = new THREE.PointLight('#6688aa', 0.5, 20)
  moonGlow.position.set(0, 10, 0)
  scene.add(moonGlow)

  buildLobbyArea()
  createPlayer()

  playerX = 0; playerZ = 5; playerYaw = 0

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)

  gameLoop()
}

function buildLobbyArea() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(50, 50)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#1a3a1a', roughness: 0.95 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Grass patches
  for (let i = 0; i < 100; i++) {
    const grassGeo = new THREE.ConeGeometry(0.05, 0.2, 4)
    const grassMat = new THREE.MeshStandardMaterial({ color: '#2d5a2d' })
    const grass = new THREE.Mesh(grassGeo, grassMat)
    grass.position.set((Math.random() - 0.5) * 30, 0.1, (Math.random() - 0.5) * 30)
    scene.add(grass)
  }

  // Trees around the edges
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2
    const dist = 10 + Math.random() * 8
    createTree(Math.cos(angle) * dist, Math.sin(angle) * dist)
  }
  // Some closer trees
  for (let i = 0; i < 10; i++) {
    const x = (Math.random() - 0.5) * 16
    const z = (Math.random() - 0.5) * 16
    // Don't put trees on boxes or spawn
    if (Math.abs(x) < 2 && Math.abs(z - 5) < 2) continue
    let tooClose = false
    for (const box of boxes) {
      if (Math.sqrt((x - box.x) ** 2 + (z - box.z) ** 2) < 2.5) tooClose = true
    }
    if (!tooClose) createTree(x, z)
  }

  // 3 Yellow lobby boxes
  for (let i = 0; i < 3; i++) {
    const box = boxes[i]
    const boxGeo = new THREE.BoxGeometry(2, 1.5, 2)
    const boxMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24', emissive: '#fbbf24', emissiveIntensity: 0.15, roughness: 0.5,
      transparent: true, opacity: 0.85,
    })
    const boxMesh = new THREE.Mesh(boxGeo, boxMat)
    boxMesh.position.set(box.x, 0.75, box.z)
    boxMesh.castShadow = true
    scene.add(boxMesh)
    box.mesh = boxMesh

    // Glow light
    const glow = new THREE.PointLight('#fbbf24', 0.6, 5)
    glow.position.set(box.x, 2, box.z)
    scene.add(glow)

    // Label above box
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 64
    const c = canvas.getContext('2d')!
    c.fillStyle = 'rgba(0,0,0,0.6)'
    c.fillRect(0, 0, 256, 64)
    c.fillStyle = '#fbbf24'
    c.font = 'bold 28px Arial'
    c.textAlign = 'center'
    c.fillText('Lobby ' + (i + 1), 128, 42)
    const tex = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
    sprite.position.set(box.x, 2.2, box.z)
    sprite.scale.set(2, 0.5, 1)
    scene.add(sprite)

    // Floor pad inside box
    const padGeo = new THREE.PlaneGeometry(1.8, 1.8)
    const padMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.1 })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.rotation.x = -Math.PI / 2
    pad.position.set(box.x, 0.01, box.z)
    scene.add(pad)
  }

  // Spawn area marker
  const spawnGeo = new THREE.RingGeometry(0.8, 1, 32)
  const spawnMat = new THREE.MeshBasicMaterial({ color: '#22c55e', side: THREE.DoubleSide })
  const spawn = new THREE.Mesh(spawnGeo, spawnMat)
  spawn.rotation.x = -Math.PI / 2
  spawn.position.set(0, 0.02, 5)
  scene.add(spawn)
}

function createTree(x: number, z: number) {
  const group = new THREE.Group()
  const height = 3 + Math.random() * 3

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#3a2510', roughness: 0.9 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = height / 2
  trunk.castShadow = true
  group.add(trunk)

  // Foliage
  for (let i = 0; i < 3; i++) {
    const fGeo = new THREE.ConeGeometry(1.2 - i * 0.3, 1.5, 8)
    const fMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a4a1a').lerp(new THREE.Color('#2d6a2d'), Math.random()),
      roughness: 0.8,
    })
    const foliage = new THREE.Mesh(fGeo, fMat)
    foliage.position.y = height - 0.5 + i * 1
    foliage.castShadow = true
    group.add(foliage)
  }

  group.position.set(x, 0, z)
  scene.add(group)
}

function createPlayer() {
  playerMesh = new THREE.Group()

  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.5, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: myColor, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.65
  body.castShadow = true
  playerMesh.add(body)

  const headGeo = new THREE.SphereGeometry(0.18, 12, 12)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ddb892', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.15
  head.castShadow = true
  playerMesh.add(head)

  scene.add(playerMesh)
}

// ===== GAME LOOP =====
function gameLoop() {
  if (phase.value !== 'lobby-area') return
  animFrame = requestAnimationFrame(gameLoop)

  if (!inBox.value) {
    updatePlayer()
    checkNearBox()
  }
  updateCamera()

  // Animate box glow
  const time = Date.now() * 0.003
  for (const box of boxes) {
    if (box.mesh) {
      (box.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1 + Math.sin(time) * 0.08
    }
  }

  renderer.render(scene, camera)
}

function updatePlayer() {
  let dx = 0, dz = 0

  if (keys['KeyW'] || keys['ArrowUp']) dz -= SPEED
  if (keys['KeyS'] || keys['ArrowDown']) dz += SPEED
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= SPEED
  if (keys['KeyD'] || keys['ArrowRight']) dx += SPEED

  if (joyX.value !== 0 || joyY.value !== 0) {
    dx += (joyX.value / 40) * SPEED
    dz += (joyY.value / 40) * SPEED
  }

  if (dx !== 0 || dz !== 0) {
    playerX += dx
    playerZ += dz
    playerX = Math.max(-12, Math.min(12, playerX))
    playerZ = Math.max(-12, Math.min(12, playerZ))
  }

  playerMesh.position.set(playerX, 0, playerZ)
}

function checkNearBox() {
  nearBox.value = null
  for (let i = 0; i < boxes.length; i++) {
    const dist = Math.sqrt((playerX - boxes[i].x) ** 2 + (playerZ - boxes[i].z) ** 2)
    if (dist < 1.8) {
      nearBox.value = i
      return
    }
  }
}

function updateCamera() {
  const camDist = 4
  const camHeight = 2.5
  const cx = playerX + Math.sin(playerYaw) * camDist
  const cz = playerZ + Math.cos(playerYaw) * camDist
  camera.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.1)
  camera.lookAt(playerX, 0.8, playerZ)
}

// ===== BOX / LOBBY =====
function enterBox() {
  if (nearBox.value === null) return
  inBox.value = true
  currentBoxIndex = nearBox.value
  selectedCount.value = 0
  playerCountSelected.value = false
  boxTimer.value = 10
}

function exitBox() {
  inBox.value = false
  playerCountSelected.value = false
  selectedCount.value = 0
  if (boxTimerInterval) clearInterval(boxTimerInterval)

  // Remove from Firebase lobby
  remove(dbRef(db, `forest/lobbies/${currentBoxIndex}/players/${myId}`))
  firebaseUnsubs.forEach(u => u())
  firebaseUnsubs = []
  lobbyPlayers.value = []
}

function confirmCount() {
  if (selectedCount.value < 1) return
  playerCountSelected.value = true

  // Set lobby in Firebase
  set(dbRef(db, `forest/lobbies/${currentBoxIndex}/settings`), {
    maxPlayers: selectedCount.value,
    createdBy: myId,
    createdAt: Date.now(),
  })

  // Add self to lobby
  set(dbRef(db, `forest/lobbies/${currentBoxIndex}/players/${myId}`), {
    name: playerName.value,
    color: myColor,
    id: myId,
  })
  onDisconnect(dbRef(db, `forest/lobbies/${currentBoxIndex}/players/${myId}`)).remove()

  // Listen for players
  const unsub = onValue(dbRef(db, `forest/lobbies/${currentBoxIndex}/players`), (snap) => {
    const data = snap.val()
    if (!data) { lobbyPlayers.value = []; return }
    lobbyPlayers.value = Object.values(data) as LobbyPlayer[]
  })
  firebaseUnsubs.push(unsub)

  // Start timer
  boxTimer.value = 10
  boxTimerInterval = setInterval(() => {
    boxTimer.value--
    if (boxTimer.value <= 0) {
      clearInterval(boxTimerInterval!)
      startForestGame()
    }
  }, 1000) as unknown as number
}

function startForestGame() {
  // Clean up lobby
  remove(dbRef(db, `forest/lobbies/${currentBoxIndex}`))
  firebaseUnsubs.forEach(u => u())
  firebaseUnsubs = []

  // Cleanup 3D
  if (animFrame) cancelAnimationFrame(animFrame)
  if (renderer && threeContainer.value && threeContainer.value.contains(renderer.domElement)) {
    threeContainer.value.removeChild(renderer.domElement)
  }

  phase.value = 'starting'
  setTimeout(() => {
    phase.value = 'forest'
    nextTick(() => initForest())
  }, 3000)
}

// ========== FOREST GAMEPLAY ==========
const mapCanvas = ref<HTMLCanvasElement | null>(null)
let fScene: THREE.Scene
let fCamera: THREE.PerspectiveCamera
let fRenderer: THREE.WebGLRenderer
let fAnimFrame: number
let fPlayerX = 0
let fPlayerZ = 0
let fPlayerYaw = 0
let fPlayerMesh: THREE.Group
let fLastMouseX = -1
const fKeys: Record<string, boolean> = {}
const fjoyX = ref(0)
const fjoyY = ref(0)
let fjoyTouchId: number | null = null
let fjoyCenter = { x: 0, y: 0 }

// Game state
const currentNight = ref(1)
const isNight = ref(false)
const dayTimeLeft = ref(60)
const fireLevel = ref(1)
const fireHealth = ref(100)
const selectedSlot = ref(0)
const forestInteract = ref('')
const showCrafting = ref(false)
const showMap = ref(false)
const hasMap = ref(false)
const hasSack = ref(false)
const sackItems = ref(0)
const sackMax = ref(5)
const placementMsg = ref('')
const forestDead = ref(false)

interface InvItem { id: string; name: string; icon: string; count: number }
const hotbar = ref<(InvItem | null)[]>([
  { id: 'old-axe', name: 'Old Axe', icon: '🪓', count: 1 },
  null, null, null, null, null,
])

// Resources
let woodCount = ref(0)
let scrapCount = ref(0)

// Crafting
interface CraftRecipe { id: string; name: string; icon: string; costText: string; costs: Record<string, number> }
const craftRecipes: CraftRecipe[] = [
  { id: 'map', name: 'Map', icon: '🗺️', costText: '3 Wood', costs: { wood: 3 } },
  { id: 'shelf', name: 'Shelf', icon: '📦', costText: '2 Scrap', costs: { scrap: 2 } },
  { id: 'bunny-trap', name: 'Bunny Trap', icon: '🐇', costText: '3 Wood', costs: { wood: 3 } },
  { id: 'old-sack', name: 'Old Sack', icon: '🎒', costText: '2 Wood', costs: { wood: 2 } },
]

function canCraft(recipe: CraftRecipe): boolean {
  for (const [mat, amt] of Object.entries(recipe.costs)) {
    if (mat === 'wood' && woodCount.value < amt) return false
    if (mat === 'scrap' && scrapCount.value < amt) return false
  }
  return true
}

function craftItem(recipe: CraftRecipe) {
  if (!canCraft(recipe)) return
  for (const [mat, amt] of Object.entries(recipe.costs)) {
    if (mat === 'wood') woodCount.value -= amt
    if (mat === 'scrap') scrapCount.value -= amt
  }
  if (recipe.id === 'map') {
    hasMap.value = true
    addToHotbar({ id: 'map', name: 'Map', icon: '🗺️', count: 1 })
    showPlacement(playerName.value + ' crafted a Map!')
  } else if (recipe.id === 'old-sack') {
    hasSack.value = true
    sackItems.value = 0
    showPlacement(playerName.value + ' crafted an Old Sack!')
  } else if (recipe.id === 'bunny-trap') {
    addToHotbar({ id: 'bunny-trap', name: 'Bunny Trap', icon: '🐇', count: 1 })
    showPlacement(playerName.value + ' crafted a Bunny Trap!')
  } else if (recipe.id === 'shelf') {
    addToHotbar({ id: 'shelf', name: 'Shelf', icon: '📦', count: 1 })
    showPlacement(playerName.value + ' crafted a Shelf!')
  }
}

function addToHotbar(item: InvItem) {
  // Find existing stack or empty slot
  for (let i = 0; i < hotbar.value.length; i++) {
    if (hotbar.value[i]?.id === item.id) { hotbar.value[i]!.count += item.count; return }
  }
  for (let i = 0; i < hotbar.value.length; i++) {
    if (!hotbar.value[i]) { hotbar.value[i] = { ...item }; return }
  }
}

function showPlacement(msg: string) {
  placementMsg.value = msg
  setTimeout(() => { placementMsg.value = '' }, 2500)
}

// Trees
interface ForestTree { x: number; z: number; health: number; mesh?: THREE.Group; fallen: boolean }
let forestTrees: ForestTree[] = []

// Deer (enemy at night)
let deerMesh: THREE.Group | null = null
let deerX = 0
let deerZ = 0
let deerActive = false

// Map tracking
let mapExplored: boolean[][] = []
const MAP_SIZE = 30
const MAP_CELLS = 30

// Day/night timer
let dayTimer: number | null = null

// Near objects
let nearTree: ForestTree | null = null
let nearCraftBench = false
let nearFire = false

function initForest() {
  if (!forestContainer.value) return

  fScene = new THREE.Scene()
  fScene.background = new THREE.Color('#1a2810')
  fScene.fog = new THREE.FogExp2('#1a2810', 0.04)

  fCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 80)
  fRenderer = new THREE.WebGLRenderer({ antialias: true })
  fRenderer.setSize(window.innerWidth, window.innerHeight)
  fRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  fRenderer.shadowMap.enabled = true
  forestContainer.value.appendChild(fRenderer.domElement)

  // Mouse look
  fRenderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
    if (fLastMouseX >= 0) fPlayerYaw += (e.clientX - fLastMouseX) * 0.005
    fLastMouseX = e.clientX
  })
  fRenderer.domElement.addEventListener('mouseleave', () => { fLastMouseX = -1 })
  fRenderer.domElement.addEventListener('mouseenter', (e: MouseEvent) => { fLastMouseX = e.clientX })

  // Lights
  fScene.add(new THREE.AmbientLight('#445533', 0.5))
  const sunLight = new THREE.DirectionalLight('#ffeedd', 0.8)
  sunLight.position.set(10, 15, 5)
  sunLight.castShadow = true
  fScene.add(sunLight)

  buildForestWorld()
  createForestPlayer()
  initMapGrid()

  fPlayerX = 0; fPlayerZ = 0; fPlayerYaw = 0
  currentNight.value = 1
  isNight.value = false
  dayTimeLeft.value = 60
  fireLevel.value = 1
  fireHealth.value = 100
  forestDead.value = false
  woodCount.value = 0
  scrapCount.value = 0
  hasMap.value = false
  hasSack.value = false
  sackItems.value = 0
  hotbar.value = [
    { id: 'old-axe', name: 'Old Axe', icon: '🪓', count: 1 },
    null, null, null, null, null,
  ]

  startDayNightCycle()

  window.addEventListener('keydown', onForestKeyDown)
  window.addEventListener('keyup', onForestKeyUp)
  window.addEventListener('resize', onForestResize)

  forestGameLoop()
}

function buildForestWorld() {
  forestTrees = []

  // Ground
  const groundGeo = new THREE.PlaneGeometry(60, 60)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#2a3a1a', roughness: 0.95 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  fScene.add(ground)

  // Campfire
  const fireGroup = new THREE.Group()
  // Rocks around fire
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const rockGeo = new THREE.SphereGeometry(0.15, 6, 6)
    const rockMat = new THREE.MeshStandardMaterial({ color: '#555', roughness: 0.9 })
    const rock = new THREE.Mesh(rockGeo, rockMat)
    rock.position.set(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5)
    rock.scale.y = 0.6
    fireGroup.add(rock)
  }
  // Logs in fire
  const logMat = new THREE.MeshStandardMaterial({ color: '#3a2010' })
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), logMat)
    log.position.set(0, 0.15, 0)
    log.rotation.z = Math.PI / 2
    log.rotation.y = (i / 3) * Math.PI
    fireGroup.add(log)
  }
  // Fire glow
  const fireLight = new THREE.PointLight('#ff6600', 1.5, 8)
  fireLight.position.set(0, 0.5, 0)
  fireLight.castShadow = true
  fireGroup.add(fireLight)
  // Fire particles (simple cones)
  const flameMat = new THREE.MeshStandardMaterial({ color: '#ff4400', emissive: '#ff4400', emissiveIntensity: 1, transparent: true, opacity: 0.8 })
  for (let i = 0; i < 5; i++) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), flameMat)
    flame.position.set((Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3)
    flame.name = 'flame'
    fireGroup.add(flame)
  }
  fireGroup.position.set(0, 0, 0)
  fScene.add(fireGroup)

  // Crafting bench (2 feet left of fire)
  const benchGroup = new THREE.Group()
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.8 }))
  benchTop.position.y = 0.7
  benchTop.castShadow = true
  benchGroup.add(benchTop)
  for (const [lx, lz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), new THREE.MeshStandardMaterial({ color: '#5a3a1e' }))
    leg.position.set(lx, 0.35, lz)
    benchGroup.add(leg)
  }
  // Tools on bench
  const toolMat = new THREE.MeshStandardMaterial({ color: '#888' })
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.25), toolMat)
  hammer.position.set(-0.2, 0.78, 0)
  benchGroup.add(hammer)
  benchGroup.position.set(-2, 0, 0)
  fScene.add(benchGroup)

  // Trees around the area
  const treePositions: [number, number][] = []
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 5 + Math.random() * 20
    const tx = Math.cos(angle) * dist
    const tz = Math.sin(angle) * dist
    // Don't place on campfire or bench
    if (Math.sqrt(tx * tx + tz * tz) < 3) continue
    treePositions.push([tx, tz])
  }

  for (const [tx, tz] of treePositions) {
    const tree: ForestTree = { x: tx, z: tz, health: 10, fallen: false }
    const treeGroup = new THREE.Group()
    const height = 3 + Math.random() * 3
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, height, 8)
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#3a2510', roughness: 0.9 })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = height / 2
    trunk.castShadow = true
    treeGroup.add(trunk)
    for (let j = 0; j < 3; j++) {
      const fGeo = new THREE.ConeGeometry(1.3 - j * 0.3, 1.8, 8)
      const fMat = new THREE.MeshStandardMaterial({ color: '#1a4a1a', roughness: 0.8 })
      const foliage = new THREE.Mesh(fGeo, fMat)
      foliage.position.y = height - 0.5 + j * 1.2
      foliage.castShadow = true
      treeGroup.add(foliage)
    }
    treeGroup.position.set(tx, 0, tz)
    fScene.add(treeGroup)
    tree.mesh = treeGroup
    forestTrees.push(tree)
  }

  // Scrap piles scattered around
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 4 + Math.random() * 15
    const sx = Math.cos(angle) * dist
    const sz = Math.sin(angle) * dist
    const scrapGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3)
    const scrapMat = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.6 })
    const scrap = new THREE.Mesh(scrapGeo, scrapMat)
    scrap.position.set(sx, 0.08, sz)
    scrap.rotation.y = Math.random() * Math.PI
    fScene.add(scrap)
  }
}

function createForestPlayer() {
  fPlayerMesh = new THREE.Group()
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.5, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: myColor, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.65
  body.castShadow = true
  fPlayerMesh.add(body)
  const headGeo = new THREE.SphereGeometry(0.18, 12, 12)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ddb892', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.15
  head.castShadow = true
  fPlayerMesh.add(head)
  fScene.add(fPlayerMesh)
}

function initMapGrid() {
  mapExplored = []
  for (let i = 0; i < MAP_CELLS; i++) {
    mapExplored.push([])
    for (let j = 0; j < MAP_CELLS; j++) {
      mapExplored[i].push(false)
    }
  }
}

// Day/Night cycle
function startDayNightCycle() {
  isNight.value = false
  dayTimeLeft.value = 60

  dayTimer = setInterval(() => {
    dayTimeLeft.value--
    if (dayTimeLeft.value <= 0) {
      if (!isNight.value) {
        // Switch to night
        isNight.value = true
        dayTimeLeft.value = 45
        fScene.background = new THREE.Color('#0a0a10')
        fScene.fog = new THREE.FogExp2('#0a0a10', 0.06)
        showPlacement('🌙 Night ' + currentNight.value + ' has begun... Stay near the fire!')
        spawnDeer()
      } else {
        // Switch to day
        isNight.value = false
        dayTimeLeft.value = 60
        currentNight.value++
        fScene.background = new THREE.Color('#1a2810')
        fScene.fog = new THREE.FogExp2('#1a2810', 0.04)
        showPlacement('☀️ Day ' + currentNight.value + ' - You survived the night!')
        despawnDeer()
      }
    }
  }, 1000) as unknown as number
}

function spawnDeer() {
  deerActive = true
  const angle = Math.random() * Math.PI * 2
  deerX = Math.cos(angle) * 15
  deerZ = Math.sin(angle) * 15

  if (!deerMesh) {
    deerMesh = new THREE.Group()
    const deerBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.8 }))
    deerBody.position.y = 0.7
    deerBody.castShadow = true
    deerMesh.add(deerBody)
    const deerHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: '#6b4a30' }))
    deerHead.position.set(0, 0.9, -0.7)
    deerMesh.add(deerHead)
    // Antlers
    for (const ax of [-0.12, 0.12]) {
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), new THREE.MeshStandardMaterial({ color: '#8B6914' }))
      antler.position.set(ax, 1.15, -0.7)
      antler.rotation.z = ax > 0 ? -0.3 : 0.3
      deerMesh.add(antler)
    }
    // Red eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 1 })
    for (const ex of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMat)
      eye.position.set(ex, 0.95, -0.9)
      deerMesh.add(eye)
    }
    // Legs
    for (const [lx, lz] of [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), new THREE.MeshStandardMaterial({ color: '#4a2a15' }))
      leg.position.set(lx, 0.25, lz)
      deerMesh.add(leg)
    }
    fScene.add(deerMesh)
  }
  deerMesh.position.set(deerX, 0, deerZ)
  deerMesh.visible = true
}

function despawnDeer() {
  deerActive = false
  if (deerMesh) deerMesh.visible = false
}

// Forest game loop
function forestGameLoop() {
  if (phase.value !== 'forest') return
  fAnimFrame = requestAnimationFrame(forestGameLoop)

  if (forestDead.value) { fRenderer.render(fScene, fCamera); return }

  updateForestPlayer()
  checkForestInteractions()
  updateDeer()
  updateMapExplored()
  updateForestCamera()

  // Animate fire
  const time = Date.now() * 0.005
  fScene.traverse(obj => {
    if (obj.name === 'flame') {
      obj.position.y = 0.3 + Math.sin(time + obj.position.x * 10) * 0.1
      obj.scale.y = 0.8 + Math.sin(time * 2 + obj.position.z * 5) * 0.3
    }
  })

  fRenderer.render(fScene, fCamera)
}

function updateForestPlayer() {
  let dx = 0, dz = 0
  if (fKeys['KeyW'] || fKeys['ArrowUp']) dz -= 0.07
  if (fKeys['KeyS'] || fKeys['ArrowDown']) dz += 0.07
  if (fKeys['KeyA'] || fKeys['ArrowLeft']) dx -= 0.07
  if (fKeys['KeyD'] || fKeys['ArrowRight']) dx += 0.07
  if (fjoyX.value !== 0 || fjoyY.value !== 0) {
    dx += (fjoyX.value / 40) * 0.07
    dz += (fjoyY.value / 40) * 0.07
  }
  if (dx !== 0 || dz !== 0) {
    fPlayerX += dx
    fPlayerZ += dz
    fPlayerX = Math.max(-25, Math.min(25, fPlayerX))
    fPlayerZ = Math.max(-25, Math.min(25, fPlayerZ))
  }
  fPlayerMesh.position.set(fPlayerX, 0, fPlayerZ)
}

function checkForestInteractions() {
  forestInteract.value = ''
  nearTree = null
  nearCraftBench = false
  nearFire = false

  // Check near campfire
  const fireDist = Math.sqrt(fPlayerX * fPlayerX + fPlayerZ * fPlayerZ)
  if (fireDist < 1.5) { nearFire = true }

  // Check near crafting bench
  const benchDist = Math.sqrt((fPlayerX + 2) ** 2 + fPlayerZ ** 2)
  if (benchDist < 1.5) {
    forestInteract.value = '🔨 Crafting Bench (E)'
    nearCraftBench = true
  }

  // Check near trees
  for (const tree of forestTrees) {
    if (tree.fallen) continue
    const dist = Math.sqrt((fPlayerX - tree.x) ** 2 + (fPlayerZ - tree.z) ** 2)
    if (dist < 2) {
      forestInteract.value = '🪓 Chop Tree (' + tree.health + ' hits left) (E)'
      nearTree = tree
      break
    }
  }

  // Check near scrap (simplified - just give scrap when walking near center area)
  if (Math.abs(fPlayerX) > 3 && Math.abs(fPlayerZ) > 3 && Math.random() < 0.002) {
    scrapCount.value++
    showPlacement('Found scrap! (Total: ' + scrapCount.value + ')')
  }
}

function doForestInteract() {
  if (nearCraftBench) {
    showCrafting.value = true
  } else if (nearTree) {
    chopTree()
  }
}

function chopTree() {
  if (!nearTree) return
  const axe = hotbar.value.find(s => s?.id === 'old-axe')
  if (!axe) { showPlacement('You need an axe!'); return }

  nearTree.health--
  if (nearTree.health <= 0) {
    nearTree.fallen = true
    if (nearTree.mesh) {
      nearTree.mesh.visible = false
    }
    woodCount.value += 3
    showPlacement('🪵 Tree chopped! +3 Wood (Total: ' + woodCount.value + ')')
    if (hasSack.value && sackItems.value < sackMax.value) {
      sackItems.value = Math.min(sackMax.value, sackItems.value + 3)
    }
  } else {
    showPlacement('🪓 Chop! (' + nearTree.health + ' hits left)')
  }
}

function updateDeer() {
  if (!deerActive || !deerMesh) return
  // Deer moves toward player
  const dx = fPlayerX - deerX
  const dz = fPlayerZ - deerZ
  const dist = Math.sqrt(dx * dx + dz * dz)

  // If player near fire, deer stays away
  const playerNearFire = Math.sqrt(fPlayerX * fPlayerX + fPlayerZ * fPlayerZ) < 3
  if (playerNearFire) {
    // Deer circles at distance
    const time = Date.now() * 0.001
    deerX = Math.cos(time * 0.5) * 8
    deerZ = Math.sin(time * 0.5) * 8
  } else {
    // Chase player
    if (dist > 0.5) {
      const speed = 0.03
      deerX += (dx / dist) * speed
      deerZ += (dz / dist) * speed
    }
    // Attack!
    if (dist < 1.5) {
      forestDead.value = true
    }
  }

  deerMesh.position.set(deerX, 0, deerZ)
  deerMesh.lookAt(fPlayerX, 0.5, fPlayerZ)
}

function updateMapExplored() {
  const cellX = Math.floor((fPlayerX + MAP_SIZE / 2) / MAP_SIZE * MAP_CELLS)
  const cellZ = Math.floor((fPlayerZ + MAP_SIZE / 2) / MAP_SIZE * MAP_CELLS)
  // Mark nearby cells as explored
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const cx = cellX + dx
      const cz = cellZ + dz
      if (cx >= 0 && cx < MAP_CELLS && cz >= 0 && cz < MAP_CELLS) {
        mapExplored[cx][cz] = true
      }
    }
  }
}

function updateForestCamera() {
  const camDist = 4
  const camHeight = 2.5
  const cx = fPlayerX + Math.sin(fPlayerYaw) * camDist
  const cz = fPlayerZ + Math.cos(fPlayerYaw) * camDist
  fCamera.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.1)
  fCamera.lookAt(fPlayerX, 0.8, fPlayerZ)
}

function respawnForest() {
  forestDead.value = false
  fPlayerX = 0; fPlayerZ = 0
  despawnDeer()
}

// Forest input
function onForestKeyDown(e: KeyboardEvent) {
  fKeys[e.code] = true
  if (e.code === 'KeyE') doForestInteract()
  if (e.code === 'KeyM' && hasMap.value) showMap.value = !showMap.value
  if (e.code >= 'Digit1' && e.code <= 'Digit6') selectedSlot.value = parseInt(e.code.replace('Digit', '')) - 1
}
function onForestKeyUp(e: KeyboardEvent) { fKeys[e.code] = false }

function joyStartF(e: TouchEvent) {
  const t = e.touches[0]; fjoyTouchId = t.identifier
  fjoyCenter = { x: t.clientX, y: t.clientY }
}
function joyMoveF(e: TouchEvent) {
  for (const t of Array.from(e.touches)) {
    if (t.identifier === fjoyTouchId) {
      fjoyX.value = Math.max(-40, Math.min(40, t.clientX - fjoyCenter.x))
      fjoyY.value = Math.max(-40, Math.min(40, t.clientY - fjoyCenter.y))
    }
  }
}
function joyEndF() { fjoyTouchId = null; fjoyX.value = 0; fjoyY.value = 0 }

function onForestResize() {
  if (!fRenderer || !fCamera) return
  fCamera.aspect = window.innerWidth / window.innerHeight
  fCamera.updateProjectionMatrix()
  fRenderer.setSize(window.innerWidth, window.innerHeight)
}

// ===== INPUT =====
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyE') {
    if (nearBox.value !== null && !inBox.value) enterBox()
  }
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

function joyStart(e: TouchEvent) {
  const t = e.touches[0]; joyTouchId = t.identifier
  joyCenter = { x: t.clientX, y: t.clientY }
}
function joyMove(e: TouchEvent) {
  for (const t of Array.from(e.touches)) {
    if (t.identifier === joyTouchId) {
      joyX.value = Math.max(-40, Math.min(40, t.clientX - joyCenter.x))
      joyY.value = Math.max(-40, Math.min(40, t.clientY - joyCenter.y))
    }
  }
}
function joyEnd() { joyTouchId = null; joyX.value = 0; joyY.value = 0 }

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  const saved = localStorage.getItem('forestName')
  if (saved) playerName.value = saved
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, '99 Nights')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, '99 Nights')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (renderer) renderer.dispose()
  if (boxTimerInterval) clearInterval(boxTimerInterval)
  firebaseUnsubs.forEach(u => u())
  if (currentBoxIndex >= 0) {
    remove(dbRef(db, `forest/lobbies/${currentBoxIndex}/players/${myId}`))
  }
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.forest-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a0a1a);
}
.menu-card {
  background: rgba(5,15,5,0.95); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 2px solid #22c55e; max-width: 400px; width: 90%;
}
.menu-icon { font-size: 72px; }
.menu-title { color: #22c55e; font-size: 28px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #4ade80; font-size: 16px; margin: 0 0 20px; font-style: italic; }
.menu-input {
  width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #1a3a1a;
  background: #0a1a0a; color: #fff; font-size: 16px; outline: none; margin-bottom: 14px; box-sizing: border-box;
}
.menu-input:focus { border-color: #22c55e; }
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff;
  font-size: 20px; font-weight: 900; cursor: pointer;
}
.play-btn:hover { transform: scale(1.05); }
.play-btn:disabled { opacity: 0.4; }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Game screen */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.three-container { position: fixed; inset: 0; z-index: 1; }

/* Lobby HUD */
.lobby-hud {
  position: fixed; top: 12px; left: 12px; z-index: 10;
}
.hud-name {
  background: rgba(0,0,0,0.6); color: #22c55e; padding: 6px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 700;
}

/* Box prompt */
.box-prompt {
  position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); border: 2px solid #fbbf24; border-radius: 14px;
  padding: 14px 24px; text-align: center; z-index: 10;
}
.bp-text { color: #fbbf24; font-size: 18px; font-weight: 800; margin-bottom: 8px; }
.bp-btn {
  padding: 8px 24px; background: #fbbf24; color: #000; border: none;
  border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer;
}

/* Inside box UI */
.box-ui {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(10,10,20,0.95); border: 2px solid #fbbf24; border-radius: 20px;
  padding: 24px; max-width: 400px; width: 90%; z-index: 20;
  backdrop-filter: blur(8px);
}
.box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.box-header h2 { color: #fbbf24; font-size: 22px; margin: 0; }
.box-exit {
  background: #333; color: #fff; border: none; padding: 6px 14px;
  border-radius: 8px; font-size: 13px; cursor: pointer;
}
.box-exit:hover { background: #ef4444; }

/* Count select */
.count-select { text-align: center; }
.cs-label { color: #94a3b8; font-size: 16px; margin: 0 0 12px; }
.cs-buttons { display: flex; gap: 8px; justify-content: center; margin-bottom: 14px; }
.cs-btn {
  width: 50px; height: 50px; border-radius: 12px; border: 2px solid #333;
  background: #1a1a2e; color: #fff; font-size: 22px; font-weight: 900;
  cursor: pointer; transition: all 0.15s;
}
.cs-btn:hover { border-color: #fbbf24; }
.cs-btn.selected { border-color: #fbbf24; background: #fbbf24; color: #000; }
.cs-ok {
  padding: 10px 32px; background: #22c55e; color: #fff; border: none;
  border-radius: 10px; font-size: 16px; font-weight: 800; cursor: pointer;
}

/* Waiting */
.box-waiting { text-align: center; }
.bw-count { color: #fbbf24; font-size: 18px; font-weight: 800; margin-bottom: 12px; }
.bw-players { display: flex; gap: 10px; justify-content: center; margin-bottom: 14px; flex-wrap: wrap; }
.bw-player { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bwp-avatar {
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; color: #fff; font-weight: 800; font-size: 18px;
}
.empty-avatar { background: #333; color: #666; border: 2px dashed #555; }
.bw-player span { color: #94a3b8; font-size: 11px; }
.bw-player.empty span { color: #555; }

.bw-timer { margin-bottom: 12px; }
.timer-bar { height: 10px; background: #333; border-radius: 5px; overflow: hidden; margin-bottom: 4px; }
.timer-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #fbbf24); border-radius: 5px; transition: width 0.5s; }
.timer-text { color: #94a3b8; font-size: 13px; }

.box-exit-btn {
  padding: 8px 20px; background: none; border: 1px solid #ef4444; color: #ef4444;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.box-exit-btn:hover { background: #ef4444; color: #fff; }

/* Starting */
.starting-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #000; text-align: center;
}
.starting-text h1 { color: #22c55e; font-size: 36px; animation: fade-in 1s; }
.starting-text p { color: #4ade80; font-size: 18px; }
@keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Forest */
.forest-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.forest-hud {
  position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 10px; z-index: 10;
}
.fh-night, .fh-timer, .fh-fire {
  background: rgba(0,0,0,0.7); padding: 5px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 700; color: #fff; backdrop-filter: blur(4px);
}
.fh-night { color: #fbbf24; }
.fh-night.night { color: #ef4444; }
.fh-timer { color: #94a3b8; }
.fh-fire { color: #f97316; }

/* Hotbar */
.hotbar {
  position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px; z-index: 10;
}
.hotbar-slot {
  width: 52px; height: 52px; background: rgba(0,0,0,0.7); border: 2px solid #333;
  border-radius: 8px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; cursor: pointer; position: relative;
}
.hotbar-slot.selected { border-color: #fbbf24; background: rgba(251,191,36,0.15); }
.hotbar-slot.empty { opacity: 0.4; }
.slot-icon { font-size: 20px; }
.slot-name { font-size: 7px; color: #94a3b8; }
.slot-count { position: absolute; bottom: 2px; right: 4px; color: #fbbf24; font-size: 10px; font-weight: 800; }
.slot-key { position: absolute; top: 2px; left: 4px; color: #555; font-size: 9px; }

.sack-display {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 6px;
  color: #94a3b8; font-size: 12px; font-weight: 600; z-index: 10;
}
.sack-display.full { color: #ef4444; }

/* Interact */
.forest-interact {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.fi-btn {
  padding: 10px 22px; background: rgba(251,191,36,0.9); color: #000; border: none;
  border-radius: 10px; font-size: 15px; font-weight: 800; cursor: pointer;
}

/* Crafting */
.crafting-ui {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  background: rgba(10,10,20,0.95); border: 2px solid #6b4226; border-radius: 16px;
  padding: 20px; max-width: 400px; width: 90%; z-index: 25;
}
.craft-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.craft-header h2 { color: #c4956a; margin: 0; font-size: 20px; }
.craft-close { background: #333; color: #fff; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
.craft-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.craft-card {
  background: #1a1a2e; border: 1px solid #333; border-radius: 10px; padding: 10px; text-align: center;
}
.cc-icon { font-size: 28px; }
.cc-name { color: #fff; font-size: 13px; font-weight: 700; }
.cc-cost { color: #94a3b8; font-size: 11px; margin: 4px 0; }
.cc-btn {
  padding: 4px 14px; border-radius: 6px; border: none; background: #22c55e;
  color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
}
.cc-btn:disabled { background: #333; color: #666; }

/* Map */
.map-ui {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  background: rgba(10,10,20,0.95); border: 2px solid #3b82f6; border-radius: 16px;
  padding: 16px; z-index: 25;
}
.map-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.map-header h2 { color: #3b82f6; margin: 0; font-size: 18px; }
.map-close { background: #333; color: #fff; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
.map-canvas { background: #111; border-radius: 8px; border: 1px solid #333; }
.map-btn {
  position: fixed; top: 12px; right: 12px; z-index: 10;
  background: rgba(0,0,0,0.7); color: #3b82f6; border: 1px solid #3b82f6;
  padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
}

/* Placement msg */
.placement-msg {
  position: fixed; top: 40%; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); color: #fbbf24; padding: 10px 24px; border-radius: 10px;
  font-size: 16px; font-weight: 700; z-index: 15; pointer-events: none;
  animation: msg-fade 2.5s ease-out forwards;
}
@keyframes msg-fade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }

/* Death */
.forest-death {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 30; text-align: center;
}
.forest-death h1 { color: #ef4444; font-size: 32px; }
.forest-death p { color: #94a3b8; font-size: 16px; margin-bottom: 16px; }

.forest-mobile { bottom: 80px; }

/* Mobile */
.mobile-controls {
  display: none; position: fixed; bottom: 20px; left: 20px; z-index: 10;
}
.joy-area {
  width: 100px; height: 100px; background: rgba(255,255,255,0.1);
  border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.joy-knob { width: 40px; height: 40px; background: rgba(255,255,255,0.3); border-radius: 50%; }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: block; }
}
</style>
