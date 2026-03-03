<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">&#8592; Back to Portal</button>

    <div ref="gameContainer" class="game-container">
      <!-- Title Screen -->
      <div v-if="!gameStarted && !inLobby" class="title-screen">
        <h1 class="title">THE CAMERA WATCH</h1>
        <p class="subtitle">Security Camera Surveillance</p>
        <div class="instructions">
          <p>&#9664; &#9654; Arrow Keys = Switch Cameras</p>
          <p>Watch the rooms for anomalies</p>
          <p>Report the correct anomaly type</p>
          <p>5 mistakes and you're done!</p>
        </div>
        <div class="mode-buttons">
          <button class="start-btn" @click="startSolo">SOLO WATCH</button>
          <button class="start-btn coop-btn" @click="createCoopRoom">CREATE CO-OP ROOM</button>
          <button class="start-btn join-btn" @click="joinCoopRoom" :disabled="!lobbyExists">JOIN CO-OP ROOM</button>
        </div>
        <p v-if="!lobbyExists" class="no-lobby-hint">No co-op room found. Create one or ask a friend to create one!</p>
      </div>

      <!-- Co-op Lobby Waiting Screen -->
      <div v-if="inLobby && !gameStarted" class="title-screen lobby-screen">
        <h1 class="title">CO-OP LOBBY</h1>
        <p class="subtitle">{{ isHost ? 'You are the HOST' : 'Waiting for host to start...' }}</p>
        <div class="lobby-players">
          <div v-for="p in lobbyPlayers" :key="p.id" class="lobby-player" :class="{ 'lobby-host': p.id === lobbyHostId }">
            <span class="lobby-player-name">{{ p.name }}</span>
            <span v-if="p.id === lobbyHostId" class="host-badge">HOST</span>
          </div>
        </div>
        <p class="lobby-count">{{ lobbyPlayers.length }} player{{ lobbyPlayers.length === 1 ? '' : 's' }} in room</p>
        <div class="lobby-actions">
          <button v-if="isHost" class="start-btn" @click="startCoopGame">START GAME</button>
          <button class="start-btn leave-btn" @click="leaveLobby">LEAVE</button>
        </div>
      </div>

      <!-- Scanlines overlay -->
      <div v-if="gameStarted && !gameOver" class="scanlines"></div>

      <!-- Static burst on camera switch -->
      <div v-if="staticBurst" class="static-burst"></div>

      <!-- Camera HUD top-left -->
      <div v-if="gameStarted && !gameOver" class="camera-hud">
        <div class="camera-info">
          <span class="rec-dot">&#9679;</span> REC
        </div>
        <div class="camera-name">CAM {{ currentCamera + 1 }} - {{ currentRoomName }}</div>
        <div class="timestamp">{{ gameTimestamp }}</div>
      </div>

      <!-- Score + Mistakes top-right -->
      <div v-if="gameStarted && !gameOver" class="score-hud">
        <div>FIXED: {{ score }}</div>
        <div class="mistakes-row">
          MISTAKES:
          <span v-for="i in maxMistakes" :key="i" class="mistake-x" :class="{ used: i <= mistakes }">X</span>
        </div>
        <div class="next-spawn">NEXT ANOMALY: {{ nextSpawnTimer }}s</div>
      </div>

      <!-- Camera Switcher bottom -->
      <div v-if="gameStarted && !gameOver" class="camera-switcher">
        <button class="cam-arrow" @click="prevCamera">&#9664;</button>
        <div class="cam-dots">
          <button
            v-for="(name, i) in roomNames"
            :key="i"
            class="cam-dot"
            :class="{ active: i === currentCamera }"
            @click="switchCamera(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <button class="cam-arrow" @click="nextCamera">&#9654;</button>
      </div>

      <!-- Anomaly warning -->
      <div v-if="activeAnomalyCount > 0 && gameStarted && !gameOver" class="anomaly-warning">
        &#9888; {{ activeAnomalyCount }} ANOMAL{{ activeAnomalyCount === 1 ? 'Y' : 'IES' }} ACTIVE
      </div>

      <!-- Co-op Player Panel -->
      <div v-if="coopMode && gameStarted && !gameOver" class="coop-panel">
        <div class="coop-title">CO-OP TEAM</div>
        <div v-for="p in lobbyPlayers" :key="p.id" class="coop-player" :class="{ 'coop-me': p.id === myPlayerId }">
          <span class="coop-name">{{ p.name }}</span>
          <span class="coop-cam">CAM {{ p.currentCamera + 1 }}</span>
          <span class="coop-score">{{ p.score }}</span>
        </div>
        <div class="coop-team-score">TEAM: {{ teamScore }}</div>
      </div>

      <!-- Fixed by other player feedback -->
      <div v-if="fixedByMessage" class="fixed-by-popup">{{ fixedByMessage }}</div>

      <!-- Report Panel -->
      <div v-if="gameStarted && !gameOver" class="report-panel">
        <div class="report-title">REPORT ANOMALY:</div>
        <div class="report-buttons">
          <button
            v-for="t in anomalyTypeList"
            :key="t"
            class="report-btn"
            @click="reportAnomaly(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Admin Panel -->
      <div v-if="showAdmin && gameStarted && !gameOver" class="admin-panel">
        <div class="admin-title">ADMIN CONTROLS</div>
        <div class="admin-label">ROOM: {{ currentRoomName }}</div>
        <div class="admin-buttons">
          <button class="admin-btn admin-preacher" @click="adminSpawn('Preacher')">Spawn Preacher</button>
          <button class="admin-btn admin-cloak" @click="adminSpawn('Cloak')">Spawn Cloak</button>
          <button class="admin-btn admin-corpse" @click="adminSpawn('Corpse')">Add Corpse</button>
          <button class="admin-btn admin-displacement" @click="adminSpawn('Displacement')">Move Furniture</button>
          <button class="admin-btn admin-imagery" @click="adminSpawn('Imagery')">Wrong Imagery</button>
        </div>
      </div>

      <!-- Preacher speech -->
      <div v-if="preacherLine" class="preacher-speech">{{ preacherLine }}</div>

      <!-- Feedback popup -->
      <div v-if="feedbackMessage" class="feedback" :class="feedbackClass">{{ feedbackMessage }}</div>

      <!-- Game Over -->
      <div v-if="gameOver" class="game-over-screen">
        <h1 class="game-over-title">SIGNAL LOST</h1>
        <p class="game-over-sub">Too many mistakes. The facility has been compromised.</p>
        <p class="final-score">Anomalies Fixed: {{ score }}</p>
        <p v-if="coopMode" class="final-score team-final">Team Total: {{ teamScore }}</p>
        <p class="coins-earned">+ {{ coinsEarned }} coins earned</p>
        <div class="game-over-buttons">
          <button class="report-btn" @click="restartGame">WATCH AGAIN</button>
          <button class="report-btn" @click="goBack">EXIT</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'
import { gameState } from '../../components/shared/GameState'
import { PlayerTracker, playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'
import { coopLobby, type CoopPlayer } from './CameraWatchLobby'

const router = useRouter()
const goBack = () => {
  if (coopMode.value) coopLobby.leaveLobby()
  router.push('/')
}

// ─── Types ───
type AnomalyType = 'Displacement' | 'Imagery' | 'Corpse' | 'Preacher' | 'Cloak'
const anomalyTypeList: AnomalyType[] = ['Displacement', 'Imagery', 'Corpse', 'Preacher', 'Cloak']

interface TrackedObject {
  mesh: THREE.Mesh | THREE.Group
  name: string
  originalPosition: THREE.Vector3
  originalRotation: THREE.Euler
  originalScale: THREE.Vector3
  originalColor: number
  roomIndex: number
  hasAnomaly: boolean
  anomalyType: AnomalyType | null
  spawnedFigure: THREE.Group | null
}

interface RoomInfo {
  name: string
  group: THREE.Group
  cameraPosition: THREE.Vector3
  cameraLookAt: THREE.Vector3
  objects: TrackedObject[]
}

// ─── Vue Refs ───
const gameContainer = ref<HTMLDivElement | null>(null)
const gameStarted = ref(false)
const gameOver = ref(false)
const currentCamera = ref(0)
const score = ref(0)
const mistakes = ref(0)
const maxMistakes = 5
const feedbackMessage = ref('')
const feedbackClass = ref('')
const staticBurst = ref(false)
const coinsEarned = ref(0)
const nextSpawnTimer = ref(20)
const preacherLine = ref('')
let preacherLineTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Co-op State ───
const coopMode = ref(false)
const inLobby = ref(false)
const isHost = ref(false)
const lobbyPlayers = ref<CoopPlayer[]>([])
const lobbyHostId = ref('')
const lobbyExists = ref(false)
const myPlayerId = ref('')
const teamScore = ref(0)
const fixedByMessage = ref('')
let fixedByTimeout: ReturnType<typeof setTimeout> | null = null
let coopSyncInterval: number | null = null
let lobbyUnsub: (() => void) | null = null
let anomalyUnsub: (() => void) | null = null

// Track which shared anomaly IDs we've already applied locally
const appliedAnomalyIds = new Set<string>()
// Map shared anomaly IDs to our local TrackedObject indices
const sharedToLocalMap = new Map<string, number>()

const preacherLines = [
  'THE WALLS HAVE EARS... AND THEY ARE LISTENING.',
  'YOU CANNOT HIDE FROM WHAT YOU HAVE DONE.',
  'I SEE YOU WATCHING... BUT WHO WATCHES YOU?',
  'THE SIGNAL CALLS TO ALL WHO LISTEN.',
  'REPENT... BEFORE THE STATIC TAKES YOU.',
  'THE CAMERAS CANNOT SAVE YOU.',
  'I HAVE BEEN HERE LONGER THAN YOU KNOW.',
  'DO NOT TURN AWAY. I AM ALREADY BEHIND YOU.',
  'THE DARKNESS IS NOT EMPTY. IT IS FULL.',
  'EVERY ROOM HAS A SECRET. EVERY SECRET HAS A PRICE.',
]
const gameElapsed = ref(0)
const showAdmin = ref(false)

const roomNames = ['LIVING ROOM', 'KITCHEN', 'BATHROOM', 'ATTIC', 'BASEMENT', 'HALLWAY']
const currentRoomName = computed(() => roomNames[currentCamera.value] || '')
const activeAnomalyCount = computed(() => allObjects.filter((o) => o.hasAnomaly).length)
const gameTimestamp = computed(() => {
  const base = new Date(2026, 1, 28, 3, 17, 0)
  base.setSeconds(base.getSeconds() + Math.floor(gameElapsed.value))
  const h = String(base.getHours()).padStart(2, '0')
  const m = String(base.getMinutes()).padStart(2, '0')
  const s = String(base.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
})

// ─── Three.js Variables ───
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let clock: THREE.Clock
let animationId: number

const rooms: RoomInfo[] = []
const allObjects: TrackedObject[] = []

// Game timing
let spawnTimer = 20
let adminCheckTimer = 0
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Helpers ───
function createBox(w: number, h: number, d: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createCylinder(rt: number, rb: number, h: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  )
  mesh.castShadow = true
  return mesh
}

function trackObject(mesh: THREE.Mesh | THREE.Group, name: string, roomIndex: number, color: number) {
  const obj: TrackedObject = {
    mesh,
    name,
    originalPosition: mesh.position.clone(),
    originalRotation: mesh.rotation.clone(),
    originalScale: mesh.scale.clone(),
    originalColor: color,
    roomIndex,
    hasAnomaly: false,
    anomalyType: null,
    spawnedFigure: null,
  }
  allObjects.push(obj)
  return obj
}

// ─── Figure Creators (for Corpse / Preacher / Cloak) ───
function createPreacherFigure(): THREE.Group {
  const g = new THREE.Group()

  // Tall dark robe body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 2.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a0a1a, roughness: 0.9 }),
  )
  body.position.y = 1.0
  body.castShadow = true
  g.add(body)

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.6 }),
  )
  head.position.y = 2.2
  head.castShadow = true
  g.add(head)

  // Glowing white eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    )
    eye.position.set(side * 0.08, 2.25, 0.18)
    g.add(eye)
  }

  // Arms stretched outward
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a0a1a }),
    )
    arm.rotation.z = side * Math.PI / 3
    arm.position.set(side * 0.6, 1.6, 0)
    g.add(arm)
  }

  // Eerie glow light around the preacher
  const glow = new THREE.PointLight(0x8844ff, 1.5, 4)
  glow.position.set(0, 1.5, 0)
  g.add(glow)

  return g
}

function speakPreacherLine() {
  const line = preacherLines[Math.floor(Math.random() * preacherLines.length)]
  preacherLine.value = line

  // Use Web Speech API
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(line)
    utterance.rate = 0.7
    utterance.pitch = 0.3
    utterance.volume = 0.8
    window.speechSynthesis.speak(utterance)
  }

  if (preacherLineTimeout) clearTimeout(preacherLineTimeout)
  preacherLineTimeout = setTimeout(() => {
    preacherLine.value = ''
  }, 5000)
}

function createCloakFigure(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x080808 }),
  )
  body.position.y = 1.1
  g.add(body)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x050505 }),
  )
  head.position.y = 2.3
  g.add(head)
  // Glowing red eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    )
    eye.position.set(side * 0.06, 2.35, 0.15)
    g.add(eye)
  }
  return g
}

function createCorpseFigure(): THREE.Group {
  const g = new THREE.Group()
  const body = createCylinder(0.12, 0.12, 1.4, 0x555555)
  body.rotation.z = Math.PI / 2
  body.position.y = 0.12
  g.add(body)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x666666 }),
  )
  head.position.set(0.8, 0.14, 0)
  g.add(head)
  return g
}

// ─── Room Builders ───
function buildRoom(
  cx: number, cz: number, w: number, d: number, h: number,
  floorColor: number, wallColor: number,
): THREE.Group {
  const g = new THREE.Group()

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.8, side: THREE.DoubleSide }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(cx, 0, cz)
  floor.receiveShadow = true
  g.add(floor)

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, side: THREE.DoubleSide }),
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.set(cx, h, cz)
  g.add(ceiling)

  // 4 walls
  const wm = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.75 })
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), wm)
  back.position.set(cx, h / 2, cz - d / 2)
  back.receiveShadow = true
  g.add(back)
  const front = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), wm)
  front.position.set(cx, h / 2, cz + d / 2)
  front.receiveShadow = true
  g.add(front)
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, d), wm)
  left.position.set(cx - w / 2, h / 2, cz)
  left.receiveShadow = true
  g.add(left)
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, d), wm)
  right.position.set(cx + w / 2, h / 2, cz)
  right.receiveShadow = true
  g.add(right)

  // Light
  const light = new THREE.PointLight(0xffeedd, 1.4, 18)
  light.position.set(cx, h - 0.3, cz)
  light.castShadow = true
  g.add(light)

  const ambient = new THREE.PointLight(0xffffff, 0.6, 25)
  ambient.position.set(cx, h / 2, cz)
  g.add(ambient)

  return g
}

function createLivingRoom(): RoomInfo {
  const cx = 0, cz = 0, w = 8, d = 6, h = 3, ri = 0
  const g = buildRoom(cx, cz, w, d, h, 0x4a3628, 0x3a3a3a)

  const couch = createBox(2.5, 0.5, 0.8, 0x334466)
  couch.position.set(cx - 1, 0.25, cz + 2)
  g.add(couch)
  trackObject(couch, 'Couch', ri, 0x334466)

  const table = createBox(1.2, 0.3, 0.6, 0x5c3d2e)
  table.position.set(cx - 1, 0.15, cz + 0.5)
  g.add(table)
  trackObject(table, 'Coffee Table', ri, 0x5c3d2e)

  const tvStand = createBox(0.6, 0.5, 0.3, 0x222222)
  tvStand.position.set(cx + 2.5, 0.25, cz - 2)
  g.add(tvStand)
  const tv = createBox(1.4, 0.9, 0.06, 0x111111)
  tv.position.set(cx + 2.5, 0.95, cz - 2)
  g.add(tv)
  trackObject(tv, 'TV', ri, 0x111111)

  const lamp = createCylinder(0.06, 0.12, 1.2, 0xaaaa55)
  lamp.position.set(cx - 3, 0.6, cz - 1.5)
  g.add(lamp)
  const lampShade = createCylinder(0.25, 0.15, 0.3, 0xddcc88)
  lampShade.position.set(cx - 3, 1.35, cz - 1.5)
  g.add(lampShade)
  trackObject(lamp, 'Lamp', ri, 0xaaaa55)

  const shelf = createBox(0.6, 1.8, 0.3, 0x4a3628)
  shelf.position.set(cx + 3.2, 0.9, cz)
  g.add(shelf)
  trackObject(shelf, 'Bookshelf', ri, 0x4a3628)

  return {
    name: 'LIVING ROOM',
    group: g,
    cameraPosition: new THREE.Vector3(cx + w / 2 - 0.5, h - 0.4, cz + d / 2 - 0.5),
    cameraLookAt: new THREE.Vector3(cx - 1, 0.5, cz - 1),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

function createKitchen(): RoomInfo {
  const cx = 20, cz = 0, w = 7, d = 5, h = 3, ri = 1
  const g = buildRoom(cx, cz, w, d, h, 0x555555, 0x3d3d3d)

  const counter = createBox(3, 0.85, 0.5, 0x666666)
  counter.position.set(cx - 0.5, 0.425, cz - 1.8)
  g.add(counter)
  trackObject(counter, 'Counter', ri, 0x666666)

  const fridge = createBox(0.7, 1.8, 0.6, 0xcccccc)
  fridge.position.set(cx + 2.5, 0.9, cz - 1.5)
  g.add(fridge)
  trackObject(fridge, 'Fridge', ri, 0xcccccc)

  const table = createBox(1.2, 0.7, 0.8, 0x5c3d2e)
  table.position.set(cx, 0.35, cz + 1)
  g.add(table)
  trackObject(table, 'Table', ri, 0x5c3d2e)

  const chair = createBox(0.4, 0.7, 0.4, 0x4a3628)
  chair.position.set(cx - 0.8, 0.35, cz + 1)
  g.add(chair)
  trackObject(chair, 'Chair', ri, 0x4a3628)

  const stove = createBox(0.8, 0.85, 0.5, 0x333333)
  stove.position.set(cx - 2.5, 0.425, cz - 1.8)
  g.add(stove)
  trackObject(stove, 'Stove', ri, 0x333333)

  return {
    name: 'KITCHEN',
    group: g,
    cameraPosition: new THREE.Vector3(cx + w / 2 - 0.5, h - 0.4, cz - d / 2 + 0.5),
    cameraLookAt: new THREE.Vector3(cx - 1, 0.5, cz + 1),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

function createBathroom(): RoomInfo {
  const cx = 40, cz = 0, w = 5, d = 4, h = 3, ri = 2
  const g = buildRoom(cx, cz, w, d, h, 0x556666, 0x445555)

  const tub = createBox(1.6, 0.5, 0.7, 0xeeeeee)
  tub.position.set(cx - 1, 0.25, cz - 1)
  g.add(tub)
  trackObject(tub, 'Bathtub', ri, 0xeeeeee)

  const toilet = createCylinder(0.2, 0.2, 0.4, 0xdddddd)
  toilet.position.set(cx + 1.5, 0.2, cz - 1.2)
  g.add(toilet)
  const toiletBack = createBox(0.4, 0.5, 0.15, 0xdddddd)
  toiletBack.position.set(cx + 1.5, 0.45, cz - 1.35)
  g.add(toiletBack)
  trackObject(toilet, 'Toilet', ri, 0xdddddd)

  const sink = createBox(0.5, 0.7, 0.35, 0x5c3d2e)
  sink.position.set(cx + 0.5, 0.35, cz + 1.5)
  g.add(sink)
  trackObject(sink, 'Sink', ri, 0x5c3d2e)

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.8, roughness: 0.1 }),
  )
  mirror.position.set(cx + 0.5, 1.5, cz + 1.95)
  g.add(mirror)
  trackObject(mirror, 'Mirror', ri, 0x8899aa)

  return {
    name: 'BATHROOM',
    group: g,
    cameraPosition: new THREE.Vector3(cx - w / 2 + 0.5, h - 0.4, cz + d / 2 - 0.5),
    cameraLookAt: new THREE.Vector3(cx + 1, 0.5, cz - 1),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

function createAttic(): RoomInfo {
  const cx = 60, cz = 0, w = 7, d = 6, h = 3, ri = 3
  const g = buildRoom(cx, cz, w, d, h, 0x3d3020, 0x2d2520)

  const box1 = createBox(0.8, 0.6, 0.6, 0x6b5b3a)
  box1.position.set(cx - 2, 0.3, cz - 1.5)
  g.add(box1)
  trackObject(box1, 'Box', ri, 0x6b5b3a)

  const box2 = createBox(0.6, 0.5, 0.5, 0x7a6b4a)
  box2.position.set(cx - 1.5, 0.25, cz + 1)
  g.add(box2)
  trackObject(box2, 'Crate', ri, 0x7a6b4a)

  const chair = createBox(0.45, 0.7, 0.45, 0x4a3628)
  chair.position.set(cx + 1, 0.35, cz - 0.5)
  g.add(chair)
  const chairBack = createBox(0.45, 0.5, 0.06, 0x4a3628)
  chairBack.position.set(cx + 1, 0.85, cz - 0.72)
  g.add(chairBack)
  trackObject(chair, 'Old Chair', ri, 0x4a3628)

  // Mannequin
  const mannBody = createCylinder(0.12, 0.15, 1.0, 0xccbbaa)
  mannBody.position.set(cx + 2, 0.7, cz + 1.5)
  g.add(mannBody)
  const mannHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xccbbaa }),
  )
  mannHead.position.set(cx + 2, 1.35, cz + 1.5)
  g.add(mannHead)
  trackObject(mannBody, 'Mannequin', ri, 0xccbbaa)

  const trunk = createBox(1.0, 0.5, 0.6, 0x5c3d2e)
  trunk.position.set(cx, 0.25, cz + 2.2)
  g.add(trunk)
  trackObject(trunk, 'Trunk', ri, 0x5c3d2e)

  return {
    name: 'ATTIC',
    group: g,
    cameraPosition: new THREE.Vector3(cx + w / 2 - 0.5, h - 0.4, cz + d / 2 - 0.5),
    cameraLookAt: new THREE.Vector3(cx - 1, 0.5, cz - 1),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

function createBasement(): RoomInfo {
  const cx = 80, cz = 0, w = 8, d = 6, h = 3, ri = 4
  const g = buildRoom(cx, cz, w, d, h, 0x333333, 0x444444)

  const shelf = createBox(1.5, 1.8, 0.4, 0x5c3d2e)
  shelf.position.set(cx - 3, 0.9, cz - 2.5)
  g.add(shelf)
  trackObject(shelf, 'Shelf', ri, 0x5c3d2e)

  const bench = createBox(1.8, 0.8, 0.6, 0x555555)
  bench.position.set(cx + 1, 0.4, cz - 2)
  g.add(bench)
  trackObject(bench, 'Workbench', ri, 0x555555)

  const barrel = createCylinder(0.3, 0.3, 0.8, 0x6b5b3a)
  barrel.position.set(cx + 3, 0.4, cz + 1)
  g.add(barrel)
  trackObject(barrel, 'Barrel', ri, 0x6b5b3a)

  const washer = createBox(0.7, 0.8, 0.6, 0xaaaaaa)
  washer.position.set(cx - 1, 0.4, cz + 2)
  g.add(washer)
  trackObject(washer, 'Washer', ri, 0xaaaaaa)

  // Pipes on ceiling
  for (let i = -3; i <= 3; i += 2) {
    const pipe = createCylinder(0.04, 0.04, d, 0x777777)
    pipe.rotation.x = Math.PI / 2
    pipe.position.set(cx + i, h - 0.2, cz)
    g.add(pipe)
  }

  return {
    name: 'BASEMENT',
    group: g,
    cameraPosition: new THREE.Vector3(cx - w / 2 + 0.5, h - 0.4, cz - d / 2 + 0.5),
    cameraLookAt: new THREE.Vector3(cx + 1, 0.5, cz + 1),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

function createHallway(): RoomInfo {
  const cx = 100, cz = 0, w = 4, d = 8, h = 3, ri = 5
  const g = buildRoom(cx, cz, w, d, h, 0x3d2b1f, 0x2d2d2d)

  // Coat rack
  const rackPole = createCylinder(0.04, 0.04, 1.5, 0x5c3d2e)
  rackPole.position.set(cx - 1.2, 0.75, cz - 3)
  g.add(rackPole)
  trackObject(rackPole, 'Coat Rack', ri, 0x5c3d2e)

  // Door
  const door = createBox(0.8, 2, 0.08, 0x4a3628)
  door.position.set(cx + 1.5, 1, cz + 3.5)
  g.add(door)
  trackObject(door, 'Door', ri, 0x4a3628)

  // Picture frames
  const frame1 = createBox(0.5, 0.4, 0.03, 0x222222)
  frame1.position.set(cx - 1.9, 1.8, cz - 1)
  g.add(frame1)
  trackObject(frame1, 'Picture Frame', ri, 0x222222)

  // Small table
  const hallTable = createBox(0.6, 0.6, 0.35, 0x4a3628)
  hallTable.position.set(cx + 1, 0.3, cz)
  g.add(hallTable)
  trackObject(hallTable, 'Hall Table', ri, 0x4a3628)

  return {
    name: 'HALLWAY',
    group: g,
    cameraPosition: new THREE.Vector3(cx + w / 2 - 0.5, h - 0.4, cz - d / 2 + 0.5),
    cameraLookAt: new THREE.Vector3(cx - 0.5, 0.5, cz + 2),
    objects: allObjects.filter((o) => o.roomIndex === ri),
  }
}

// ─── Scene Init ───
function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  gameContainer.value!.appendChild(renderer.domElement)

  clock = new THREE.Clock()

  // Global ambient
  const ambient = new THREE.AmbientLight(0x444444, 0.8)
  scene.add(ambient)

  // Build all rooms
  allObjects.length = 0
  rooms.length = 0

  const roomBuilders = [createLivingRoom, createKitchen, createBathroom, createAttic, createBasement, createHallway]
  for (const builder of roomBuilders) {
    const room = builder()
    scene.add(room.group)
    rooms.push(room)
  }

  // Set camera to first room
  switchCamera(0)
}

// ─── Camera Switching ───
function switchCamera(index: number) {
  if (index < 0 || index >= rooms.length) return
  currentCamera.value = index

  // Static burst effect
  staticBurst.value = true
  setTimeout(() => { staticBurst.value = false }, 200)

  // Move camera
  const room = rooms[index]
  camera.position.copy(room.cameraPosition)
  camera.lookAt(room.cameraLookAt)
}

function nextCamera() {
  switchCamera((currentCamera.value + 1) % rooms.length)
}

function prevCamera() {
  switchCamera((currentCamera.value - 1 + rooms.length) % rooms.length)
}

// ─── Anomaly System ───
function spawnAnomaly() {
  // In co-op: only host spawns anomalies
  if (coopMode.value && !isHost.value) return

  // Find objects without anomalies
  const available = allObjects.filter((o) => !o.hasAnomaly)
  if (available.length === 0) return

  // Pick random object and anomaly type
  const objIdx = Math.floor(Math.random() * available.length)
  const obj = available[objIdx]
  const type = anomalyTypeList[Math.floor(Math.random() * anomalyTypeList.length)]

  obj.hasAnomaly = true
  obj.anomalyType = type

  const room = rooms[obj.roomIndex]

  // In co-op, share the spawn so other players can apply it
  if (coopMode.value) {
    const localIdx = allObjects.indexOf(obj)
    coopLobby.shareAnomalySpawn(objIdx, type, obj.roomIndex).then((sharedId) => {
      sharedToLocalMap.set(sharedId, localIdx)
      appliedAnomalyIds.add(sharedId)
    })
  }

  switch (type) {
    case 'Displacement': {
      // Move object from original position
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 3,
      )
      obj.mesh.position.copy(obj.originalPosition).add(offset)
      break
    }
    case 'Imagery': {
      // Turn red with glow
      const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.color) {
        mat.color.set(0xff0000)
        mat.emissive = new THREE.Color(0xff0000)
        mat.emissiveIntensity = 0.4
      }
      break
    }
    case 'Corpse': {
      const fig = createCorpseFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 2,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
    case 'Preacher': {
      const fig = createPreacherFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 1.5,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      speakPreacherLine()
      break
    }
    case 'Cloak': {
      const fig = createCloakFigure()
      // Place in a corner of the room
      const corners = [
        new THREE.Vector3(-2, 0, -2),
        new THREE.Vector3(2, 0, -2),
        new THREE.Vector3(-2, 0, 2),
        new THREE.Vector3(2, 0, 2),
      ]
      const corner = corners[Math.floor(Math.random() * corners.length)]
      fig.position.set(
        obj.originalPosition.x + corner.x,
        0,
        obj.originalPosition.z + corner.z,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
  }
}

// ─── Admin: Spawn specific anomaly in current room ───
function adminSpawn(type: AnomalyType) {
  const roomIndex = currentCamera.value
  const available = allObjects.filter((o) => !o.hasAnomaly && o.roomIndex === roomIndex)
  if (available.length === 0) return

  const obj = available[Math.floor(Math.random() * available.length)]
  obj.hasAnomaly = true
  obj.anomalyType = type

  const room = rooms[obj.roomIndex]

  switch (type) {
    case 'Displacement': {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 3,
      )
      obj.mesh.position.copy(obj.originalPosition).add(offset)
      break
    }
    case 'Imagery': {
      const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.color) {
        mat.color.set(0xff0000)
        mat.emissive = new THREE.Color(0xff0000)
        mat.emissiveIntensity = 0.4
      }
      break
    }
    case 'Corpse': {
      const fig = createCorpseFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 2,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
    case 'Preacher': {
      const fig = createPreacherFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 1.5,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      speakPreacherLine()
      break
    }
    case 'Cloak': {
      const fig = createCloakFigure()
      const corners = [
        new THREE.Vector3(-2, 0, -2),
        new THREE.Vector3(2, 0, -2),
        new THREE.Vector3(-2, 0, 2),
        new THREE.Vector3(2, 0, 2),
      ]
      const corner = corners[Math.floor(Math.random() * corners.length)]
      fig.position.set(
        obj.originalPosition.x + corner.x,
        0,
        obj.originalPosition.z + corner.z,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
  }
  showFeedback('ADMIN: Spawned ' + type + ' in ' + roomNames[roomIndex], 'correct')
}

function fixAnomaly(obj: TrackedObject) {
  const room = rooms[obj.roomIndex]

  switch (obj.anomalyType) {
    case 'Displacement':
      obj.mesh.position.copy(obj.originalPosition)
      break
    case 'Imagery': {
      const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.color) {
        mat.color.set(obj.originalColor)
        mat.emissive = new THREE.Color(0x000000)
        mat.emissiveIntensity = 0
      }
      break
    }
    case 'Corpse':
    case 'Preacher':
    case 'Cloak':
      if (obj.spawnedFigure) {
        room.group.remove(obj.spawnedFigure)
        obj.spawnedFigure = null
      }
      break
  }

  obj.mesh.rotation.copy(obj.originalRotation)
  obj.mesh.scale.copy(obj.originalScale)
  obj.hasAnomaly = false
  obj.anomalyType = null
}

function reportAnomaly(type: AnomalyType) {
  if (gameOver.value) return

  // Check if any active anomaly matches the reported type
  const match = allObjects.find((o) => o.hasAnomaly && o.anomalyType === type)

  if (match) {
    fixAnomaly(match)
    score.value++
    gameState.addCoins(2)
    showFeedback('CORRECT! ' + type + ' fixed!', 'correct')

    // In co-op, share the fix
    if (coopMode.value) {
      const localIdx = allObjects.indexOf(match)
      for (const [sharedId, idx] of sharedToLocalMap.entries()) {
        if (idx === localIdx) {
          coopLobby.shareAnomalyFix(sharedId, coopLobby.getPlayerName())
          sharedToLocalMap.delete(sharedId)
          break
        }
      }
    }
  } else {
    mistakes.value++
    showFeedback('WRONG! No ' + type + ' anomaly found!', 'wrong')

    if (mistakes.value >= maxMistakes) {
      endGame()
    }
  }
}

function showFeedback(message: string, cls: string) {
  feedbackMessage.value = message
  feedbackClass.value = cls
  if (feedbackTimeout) clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    feedbackMessage.value = ''
  }, 1500)
}

function endGame() {
  gameOver.value = true
  coinsEarned.value = score.value * 5
  gameState.addCoins(coinsEarned.value)
  if (coopMode.value) {
    if (isHost.value) coopLobby.endGame()
  }
}

// ─── Co-op Functions ───
function startLobbyCheck() {
  // Listen for lobby changes in real-time via Firebase
  lobbyUnsub = coopLobby.onLobbyChanged((lobby) => {
    // Only update lobbyExists if we're not already in a lobby
    if (!inLobby.value) {
      lobbyExists.value = lobby !== null && lobby.gameState === 'waiting'
    }
  })
}

function startSolo() {
  coopMode.value = false
  startGame()
}

async function createCoopRoom() {
  coopLobby.setPlayerName(gameState.playerName || 'Player')
  myPlayerId.value = coopLobby.getPlayerId()
  // Clean up old listener before creating new one
  if (lobbyUnsub) { lobbyUnsub(); lobbyUnsub = null }
  const lobby = await coopLobby.createLobby()
  inLobby.value = true
  isHost.value = true
  lobbyHostId.value = lobby.hostId
  lobbyPlayers.value = Object.values(lobby.players)
  startLobbyListening()
}

async function joinCoopRoom() {
  coopLobby.setPlayerName(gameState.playerName || 'Player')
  myPlayerId.value = coopLobby.getPlayerId()
  // Clean up old listener before creating new one
  if (lobbyUnsub) { lobbyUnsub(); lobbyUnsub = null }
  const lobby = await coopLobby.joinLobby()
  if (!lobby) return
  inLobby.value = true
  isHost.value = false
  lobbyHostId.value = lobby.hostId
  lobbyPlayers.value = Object.values(lobby.players)
  startLobbyListening()
}

function startLobbyListening() {
  // Real-time listener for lobby updates
  lobbyUnsub = coopLobby.onLobbyChanged((lobby) => {
    if (!lobby) {
      inLobby.value = false
      coopMode.value = false
      return
    }
    lobbyPlayers.value = lobby.players ? Object.values(lobby.players) : []
    lobbyHostId.value = lobby.hostId
    isHost.value = lobby.hostId === myPlayerId.value

    // If game started by host, start for all
    if (lobby.gameState === 'playing' && !gameStarted.value) {
      coopMode.value = true
      startGame()
    }

    // During gameplay, update team info
    if (coopMode.value && gameStarted.value) {
      teamScore.value = coopLobby.getTeamScoreFromData(lobby)
    }
  })
}

async function startCoopGame() {
  await coopLobby.startGame()
  coopMode.value = true
  startGame()
}

function leaveLobby() {
  coopLobby.leaveLobby()
  inLobby.value = false
  coopMode.value = false
  if (lobbyUnsub) { lobbyUnsub(); lobbyUnsub = null }
}

function startCoopSync() {
  // Update our state every 500ms
  coopSyncInterval = setInterval(() => {
    if (!coopMode.value || !gameStarted.value || gameOver.value) return
    coopLobby.updatePlayerState(currentCamera.value, score.value)
  }, 500) as unknown as number

  // Listen for anomaly changes in real-time
  anomalyUnsub = coopLobby.onAnomaliesChanged((sharedAnomalies) => {
    if (!coopMode.value || !gameStarted.value || gameOver.value) return

    // Check for anomalies fixed by others
    for (const sa of sharedAnomalies) {
      if (sa.fixedBy && sa.fixedBy !== coopLobby.getPlayerName() && sharedToLocalMap.has(sa.id)) {
        const localIdx = sharedToLocalMap.get(sa.id)!
        const obj = allObjects[localIdx]
        if (obj && obj.hasAnomaly) {
          fixAnomaly(obj)
          showFixedBy(sa.fixedBy)
          sharedToLocalMap.delete(sa.id)
        }
      }
    }

    // If not host, check for new anomalies to apply locally
    if (!isHost.value) {
      for (const sa of sharedAnomalies) {
        if (!appliedAnomalyIds.has(sa.id) && !sa.fixedBy) {
          appliedAnomalyIds.add(sa.id)
          applySharedAnomaly(sa.id, sa.objectIndex, sa.type as AnomalyType, sa.roomIndex)
        }
      }
    }
  })
}

function applySharedAnomaly(sharedId: string, objectIndex: number, type: AnomalyType, roomIndex: number) {
  // Find an available object in the same room
  const available = allObjects.filter((o) => !o.hasAnomaly && o.roomIndex === roomIndex)
  if (available.length === 0) return

  // Use objectIndex to pick deterministically (mod available count)
  const obj = available[objectIndex % available.length]
  const localIdx = allObjects.indexOf(obj)
  sharedToLocalMap.set(sharedId, localIdx)

  obj.hasAnomaly = true
  obj.anomalyType = type
  const room = rooms[obj.roomIndex]

  switch (type) {
    case 'Displacement': {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 3,
      )
      obj.mesh.position.copy(obj.originalPosition).add(offset)
      break
    }
    case 'Imagery': {
      const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.color) {
        mat.color.set(0xff0000)
        mat.emissive = new THREE.Color(0xff0000)
        mat.emissiveIntensity = 0.4
      }
      break
    }
    case 'Corpse': {
      const fig = createCorpseFigure()
      fig.position.set(obj.originalPosition.x + (Math.random() - 0.5) * 2, 0, obj.originalPosition.z + (Math.random() - 0.5) * 2)
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
    case 'Preacher': {
      const fig = createPreacherFigure()
      fig.position.set(obj.originalPosition.x + (Math.random() - 0.5) * 2, 0, obj.originalPosition.z + (Math.random() - 0.5) * 1.5)
      room.group.add(fig)
      obj.spawnedFigure = fig
      speakPreacherLine()
      break
    }
    case 'Cloak': {
      const fig = createCloakFigure()
      const corners = [new THREE.Vector3(-2, 0, -2), new THREE.Vector3(2, 0, -2), new THREE.Vector3(-2, 0, 2), new THREE.Vector3(2, 0, 2)]
      const corner = corners[Math.floor(Math.random() * corners.length)]
      fig.position.set(obj.originalPosition.x + corner.x, 0, obj.originalPosition.z + corner.z)
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
  }
}

function showFixedBy(name: string) {
  fixedByMessage.value = `Fixed by ${name}!`
  if (fixedByTimeout) clearTimeout(fixedByTimeout)
  fixedByTimeout = setTimeout(() => { fixedByMessage.value = '' }, 2000)
}

// ─── Admin Remote Spawn (from Owner Panel) ───
function adminRemoteSpawn(type: AnomalyType) {
  const available = allObjects.filter((o) => !o.hasAnomaly)
  if (available.length === 0) return

  const obj = available[Math.floor(Math.random() * available.length)]
  obj.hasAnomaly = true
  obj.anomalyType = type

  const room = rooms[obj.roomIndex]

  switch (type) {
    case 'Displacement': {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 3,
      )
      obj.mesh.position.copy(obj.originalPosition).add(offset)
      break
    }
    case 'Imagery': {
      const mat = (obj.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.color) {
        mat.color.set(0xff0000)
        mat.emissive = new THREE.Color(0xff0000)
        mat.emissiveIntensity = 0.4
      }
      break
    }
    case 'Corpse': {
      const fig = createCorpseFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 2,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
    case 'Preacher': {
      const fig = createPreacherFigure()
      fig.position.set(
        obj.originalPosition.x + (Math.random() - 0.5) * 2,
        0,
        obj.originalPosition.z + (Math.random() - 0.5) * 1.5,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      speakPreacherLine()
      break
    }
    case 'Cloak': {
      const fig = createCloakFigure()
      const corners = [
        new THREE.Vector3(-2, 0, -2),
        new THREE.Vector3(2, 0, -2),
        new THREE.Vector3(-2, 0, 2),
        new THREE.Vector3(2, 0, 2),
      ]
      const corner = corners[Math.floor(Math.random() * corners.length)]
      fig.position.set(
        obj.originalPosition.x + corner.x,
        0,
        obj.originalPosition.z + corner.z,
      )
      room.group.add(fig)
      obj.spawnedFigure = fig
      break
    }
  }
}

// ─── Game Loop ───
function animate() {
  animationId = requestAnimationFrame(animate)
  if (!scene || !camera || !renderer) return

  const delta = clock.getDelta()

  if (gameStarted.value && !gameOver.value) {
    gameElapsed.value += delta

    // Check for admin-spawned anomalies from Owner Panel
    adminCheckTimer -= delta
    if (adminCheckTimer <= 0) {
      adminCheckTimer = 0.5 // Check every 0.5 seconds
      const adminAnomaly = PlayerTracker.checkForAdminAnomaly()
      if (adminAnomaly) {
        const validTypes: AnomalyType[] = ['Displacement', 'Imagery', 'Corpse', 'Preacher', 'Cloak']
        if (validTypes.includes(adminAnomaly.type as AnomalyType)) {
          adminRemoteSpawn(adminAnomaly.type as AnomalyType)
        }
      }
    }

    // Spawn timer
    spawnTimer -= delta
    nextSpawnTimer.value = Math.max(0, Math.ceil(spawnTimer))

    if (spawnTimer <= 0) {
      spawnAnomaly()
      // Speed up as score increases
      const interval = Math.max(10, 20 - score.value)
      spawnTimer = interval
      nextSpawnTimer.value = interval
    }

    // Too many active anomalies = auto mistakes
    if (activeAnomalyCount.value > 3) {
      // Remove the oldest anomaly as a missed one
      const oldest = allObjects.find((o) => o.hasAnomaly)
      if (oldest) {
        fixAnomaly(oldest)
        mistakes.value++
        showFeedback('ANOMALY MISSED! Auto-penalty!', 'wrong')
        if (mistakes.value >= maxMistakes) {
          endGame()
        }
      }
    }
  }

  renderer.render(scene, camera)
}

// ─── Game Start / Restart ───
function startGame() {
  gameStarted.value = true
  gameOver.value = false
  score.value = 0
  mistakes.value = 0
  coinsEarned.value = 0
  gameElapsed.value = 0
  spawnTimer = 8 // First anomaly comes quickly
  nextSpawnTimer.value = 8
  appliedAnomalyIds.clear()
  sharedToLocalMap.clear()

  initScene()
  animate()

  if (coopMode.value) {
    startCoopSync()
  }
}

function restartGame() {
  // Cleanup
  cancelAnimationFrame(animationId)
  if (renderer && gameContainer.value) {
    gameContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  allObjects.length = 0
  rooms.length = 0

  gameStarted.value = false
  setTimeout(() => startGame(), 100)
}

// ─── Admin Code (Ctrl + type "rylan2026") ───
let adminBuffer = ''
let adminBufferTimeout: ReturnType<typeof setTimeout> | null = null

function handleAdminCode(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.length === 1) {
    adminBuffer += e.key.toLowerCase()
    if (adminBufferTimeout) clearTimeout(adminBufferTimeout)
    adminBufferTimeout = setTimeout(() => { adminBuffer = '' }, 3000)

    if (adminBuffer === 'rylan2026') {
      showAdmin.value = !showAdmin.value
      adminBuffer = ''
    }
  }
}

// ─── Input ───
function handleKeyDown(e: KeyboardEvent) {
  if (!gameStarted.value || gameOver.value) return
  if (e.code === 'ArrowRight') nextCamera()
  if (e.code === 'ArrowLeft') prevCamera()
}

function handleResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

// ─── Lifecycle ───
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleAdminCode)
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Camera Watch')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Camera Watch')

  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })

  // Listen for admin-spawned anomalies from Firebase
  OnlineTracker.onCameraAnomaly((spawn) => {
    if (spawn && gameStarted.value && !gameOver.value) {
      adminSpawn(spawn.type as AnomalyType)
    }
  })

  startLobbyCheck()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keydown', handleAdminCode)
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (coopMode.value) coopLobby.leaveLobby()
  if (lobbyUnsub) lobbyUnsub()
  if (anomalyUnsub) anomalyUnsub()
  if (coopSyncInterval) clearInterval(coopSyncInterval)
  if (renderer && gameContainer.value) {
    gameContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
})
</script>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  position: relative;
}

.back-button {
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.8);
  color: #88ff88;
  border: 1px solid #446644;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  font-size: 13px;
  z-index: 200;
}

.back-button:hover {
  background: rgba(0, 80, 0, 0.4);
}

.game-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* ─── Scanlines ─── */
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 50;
}

/* ─── Static burst ─── */
.static-burst {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(255, 255, 255, 0.05) 4px
  );
  z-index: 60;
  pointer-events: none;
  animation: staticAnim 0.1s steps(3) infinite;
}

@keyframes staticAnim {
  0% { opacity: 0.8; transform: translateY(0); }
  33% { opacity: 0.6; transform: translateY(-2px); }
  66% { opacity: 0.9; transform: translateY(1px); }
  100% { opacity: 0.7; transform: translateY(-1px); }
}

/* ─── Title Screen ─── */
.title-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
  z-index: 150;
  font-family: monospace;
  color: #88ff88;
}

.title {
  font-size: 48px;
  text-shadow: 0 0 20px rgba(136, 255, 136, 0.4);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.6;
  margin-bottom: 30px;
}

.instructions {
  text-align: center;
  opacity: 0.5;
  font-size: 14px;
  line-height: 2;
  margin-bottom: 40px;
}

.start-btn {
  background: transparent;
  color: #88ff88;
  border: 2px solid #88ff88;
  padding: 14px 36px;
  font-family: monospace;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover {
  background: #88ff88;
  color: #000;
}

/* ─── Camera HUD ─── */
.camera-hud {
  position: absolute;
  top: 50px;
  left: 20px;
  font-family: monospace;
  color: #88ff88;
  font-size: 14px;
  z-index: 100;
  text-shadow: 0 0 5px rgba(136, 255, 136, 0.5);
}

.camera-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-dot {
  color: #ff3333;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.camera-name {
  font-size: 16px;
  font-weight: bold;
  margin-top: 4px;
}

.timestamp {
  opacity: 0.6;
  margin-top: 2px;
}

/* ─── Score HUD ─── */
.score-hud {
  position: absolute;
  top: 50px;
  right: 20px;
  font-family: monospace;
  color: #88ff88;
  font-size: 14px;
  text-align: right;
  z-index: 100;
  line-height: 1.8;
}

.mistakes-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.mistake-x {
  opacity: 0.2;
  color: #ff4444;
}

.mistake-x.used {
  opacity: 1;
  text-shadow: 0 0 5px #ff4444;
}

.next-spawn {
  opacity: 0.5;
  font-size: 12px;
}

/* ─── Camera Switcher ─── */
.camera-switcher {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.cam-arrow {
  background: rgba(0, 0, 0, 0.6);
  color: #88ff88;
  border: 1px solid #446644;
  padding: 8px 14px;
  font-size: 18px;
  cursor: pointer;
  font-family: monospace;
}

.cam-arrow:hover {
  background: rgba(0, 80, 0, 0.4);
}

.cam-dots {
  display: flex;
  gap: 4px;
}

.cam-dot {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  color: #446644;
  border: 1px solid #446644;
  font-family: monospace;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cam-dot.active {
  background: rgba(0, 80, 0, 0.5);
  color: #88ff88;
  border-color: #88ff88;
}

/* ─── Anomaly Warning ─── */
.anomaly-warning {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  font-family: monospace;
  color: #ff4444;
  font-size: 16px;
  z-index: 100;
  animation: pulse 1s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ─── Report Panel ─── */
.report-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.report-title {
  font-family: monospace;
  color: #88ff88;
  font-size: 12px;
  opacity: 0.6;
}

.report-buttons {
  display: flex;
  gap: 6px;
}

.report-btn {
  background: rgba(0, 0, 0, 0.7);
  color: #88ff88;
  border: 1px solid #446644;
  padding: 8px 14px;
  font-family: monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-btn:hover {
  background: rgba(0, 80, 0, 0.4);
  border-color: #88ff88;
}

/* ─── Admin Panel ─── */
.admin-panel {
  position: absolute;
  top: 130px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #ff4444;
  border-radius: 6px;
  padding: 12px;
  z-index: 120;
  font-family: monospace;
  min-width: 160px;
}

.admin-title {
  color: #ff4444;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 6px;
  text-shadow: 0 0 5px rgba(255, 68, 68, 0.5);
}

.admin-label {
  color: #ff8888;
  font-size: 11px;
  text-align: center;
  margin-bottom: 8px;
  opacity: 0.7;
}

.admin-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.admin-btn {
  background: rgba(60, 0, 0, 0.6);
  color: #ff8888;
  border: 1px solid #663333;
  padding: 6px 10px;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.admin-btn:hover {
  background: rgba(100, 0, 0, 0.6);
  border-color: #ff4444;
  color: #ffaaaa;
}

.admin-preacher:hover { border-color: #8844ff; color: #cc88ff; }
.admin-cloak:hover { border-color: #ff0000; color: #ff6666; }
.admin-corpse:hover { border-color: #888888; color: #aaaaaa; }
.admin-displacement:hover { border-color: #ffaa00; color: #ffcc66; }
.admin-imagery:hover { border-color: #ff0000; color: #ff4444; }

/* ─── Preacher Speech ─── */
.preacher-speech {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: monospace;
  font-size: 22px;
  color: #cc88ff;
  background: rgba(20, 0, 30, 0.85);
  border: 2px solid #8844ff;
  padding: 18px 30px;
  text-align: center;
  z-index: 115;
  pointer-events: none;
  text-shadow: 0 0 15px rgba(136, 68, 255, 0.8), 0 0 30px rgba(136, 68, 255, 0.4);
  max-width: 70%;
  animation: preacherFade 5s ease-in-out forwards;
  letter-spacing: 2px;
}

@keyframes preacherFade {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* ─── Feedback ─── */
.feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: monospace;
  font-size: 24px;
  z-index: 110;
  padding: 15px 30px;
  text-align: center;
  pointer-events: none;
}

.feedback.correct {
  color: #88ff88;
  background: rgba(0, 60, 0, 0.8);
  border: 2px solid #88ff88;
  text-shadow: 0 0 10px rgba(136, 255, 136, 0.5);
}

.feedback.wrong {
  color: #ff4444;
  background: rgba(60, 0, 0, 0.8);
  border: 2px solid #ff4444;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

/* ─── Game Over ─── */
.game-over-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 130;
  font-family: monospace;
  color: #ff4444;
}

.game-over-title {
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
}

.game-over-sub {
  color: #886666;
  margin-bottom: 30px;
}

.final-score {
  color: #88ff88;
  font-size: 20px;
}

.coins-earned {
  color: #ffd700;
  font-size: 18px;
  margin-top: 10px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.game-over-buttons {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.team-final {
  color: #66ccff;
  text-shadow: 0 0 10px rgba(102, 204, 255, 0.5);
}

/* ─── Mode Selection ─── */
.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.coop-btn {
  border-color: #66ccff;
  color: #66ccff;
}

.coop-btn:hover {
  background: #66ccff;
  color: #000;
}

.join-btn {
  border-color: #ffaa44;
  color: #ffaa44;
}

.join-btn:hover:not(:disabled) {
  background: #ffaa44;
  color: #000;
}

.join-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.no-lobby-hint {
  margin-top: 15px;
  font-size: 12px;
  opacity: 0.4;
  color: #888;
}

/* ─── Lobby Screen ─── */
.lobby-screen {
  gap: 10px;
}

.lobby-players {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0, 40, 0, 0.3);
  border: 1px solid #446644;
  padding: 12px 20px;
  border-radius: 6px;
  min-width: 200px;
  margin: 10px 0;
}

.lobby-player {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 14px;
}

.lobby-host {
  color: #ffdd44;
}

.lobby-player-name {
  font-weight: bold;
}

.host-badge {
  background: #ffdd44;
  color: #000;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.lobby-count {
  font-size: 13px;
  opacity: 0.5;
}

.lobby-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.leave-btn {
  border-color: #ff4444;
  color: #ff4444;
}

.leave-btn:hover {
  background: #ff4444;
  color: #000;
}

/* ─── Co-op Player Panel ─── */
.coop-panel {
  position: absolute;
  top: 130px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #446644;
  border-radius: 6px;
  padding: 10px 14px;
  z-index: 100;
  font-family: monospace;
  min-width: 150px;
}

.coop-title {
  color: #66ccff;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0 0 5px rgba(102, 204, 255, 0.5);
}

.coop-player {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  color: #88ff88;
  font-size: 12px;
}

.coop-me {
  color: #66ccff;
  font-weight: bold;
}

.coop-name {
  flex: 1;
}

.coop-cam {
  opacity: 0.6;
  font-size: 10px;
}

.coop-score {
  color: #ffdd44;
  min-width: 20px;
  text-align: right;
}

.coop-team-score {
  color: #66ccff;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #336644;
}

/* ─── Fixed By Popup ─── */
.fixed-by-popup {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  font-family: monospace;
  font-size: 18px;
  color: #66ccff;
  background: rgba(0, 30, 60, 0.85);
  border: 2px solid #66ccff;
  padding: 12px 24px;
  z-index: 115;
  pointer-events: none;
  text-shadow: 0 0 10px rgba(102, 204, 255, 0.6);
  animation: fixedByFade 2s ease-in-out forwards;
}

@keyframes fixedByFade {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
