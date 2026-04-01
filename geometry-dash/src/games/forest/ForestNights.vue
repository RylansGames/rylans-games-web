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

    <!-- In Forest (placeholder for now) -->
    <div v-if="phase === 'forest'" class="forest-screen">
      <div ref="forestContainer" class="three-container"></div>
      <div class="forest-hud">
        <div class="fh-night">🌙 Night 1 / 99</div>
        <div class="fh-name">{{ playerName }}</div>
      </div>
      <div class="forest-msg">
        <p>You made it into the forest...</p>
        <p class="sub">To be continued...</p>
        <button class="play-btn" @click="phase = 'menu'">Back to Menu</button>
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
  }, 3000)
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
.forest-screen { position: relative; min-height: 100vh; background: #0a0a0a; }
.forest-hud {
  position: fixed; top: 12px; left: 0; right: 0; display: flex; justify-content: center;
  gap: 16px; z-index: 10;
}
.fh-night, .fh-name {
  background: rgba(0,0,0,0.7); padding: 6px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 700; color: #fff;
}
.fh-night { color: #fbbf24; }
.forest-msg {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  text-align: center; z-index: 10;
}
.forest-msg p { color: #22c55e; font-size: 20px; }
.forest-msg .sub { color: #666; font-style: italic; font-size: 16px; margin-bottom: 20px; }

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
