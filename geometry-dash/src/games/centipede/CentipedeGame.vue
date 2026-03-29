<template>
  <div class="centi-app">
    <!-- ===== MENU ===== -->
    <div v-if="phase === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🐛</div>
        <h1 class="menu-title">THE CENTIPEDE</h1>
        <p class="menu-sub">A survival horror story</p>
        <button class="play-btn" @click="startGame">▶ Play</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- ===== CUTSCENE: TV NEWS ===== -->
    <div v-if="phase === 'cutscene-news'" class="cutscene-screen">
      <div class="tv-frame">
        <div class="tv-screen">
          <div v-if="newsStep === 0" class="news-intro">
            <div class="channel-bug">CH 7 NEWS</div>
            <div class="show-name">Evening Report</div>
            <div class="show-host">🧑‍💼</div>
          </div>
          <div v-if="newsStep >= 1" class="news-breaking">
            <div class="breaking-bar">⚠️ BREAKING NEWS ⚠️</div>
            <div class="news-desk">
              <div class="anchor">🧑‍💼</div>
              <div class="news-text" v-if="newsStep === 1">Breaking news! A centipede the size of a tree has escaped!</div>
              <div class="news-text" v-if="newsStep === 2">Please stay indoors and don't look outside.</div>
              <div class="news-text" v-if="newsStep === 3">People can still deliver food to you, but it can't be at night because the centipede comes at night.</div>
              <div class="news-text" v-if="newsStep === 4">Stay safe and don't go outside at night.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="cutscene-skip" @click="advanceNews">{{ newsStep < 4 ? 'Next ▶' : 'Continue ▶' }}</div>
    </div>

    <!-- ===== CUTSCENE: REACTION ===== -->
    <div v-if="phase === 'cutscene-reaction'" class="cutscene-screen dark-bg">
      <div class="dialogue-box">
        <div class="dialogue-speaker">You</div>
        <div class="dialogue-text">{{ reactionText }}</div>
        <button class="dialogue-next" @click="advanceReaction">Next ▶</button>
      </div>
    </div>

    <!-- ===== CUTSCENE: PHONE ===== -->
    <div v-if="phase === 'cutscene-phone'" class="cutscene-screen dark-bg">
      <div class="phone-frame">
        <div class="phone-screen">
          <div class="phone-wallpaper">
            <div class="capy-forest">🌲🦫🌲</div>
            <div class="phone-time">9:47 PM</div>
          </div>
          <div class="phone-notifs">
            <div class="notif" v-for="n in phoneNotifs" :key="n.name">
              <span class="notif-name">{{ n.name }}</span>
              <span class="notif-text">{{ n.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <button class="dialogue-next" @click="advancePhone">Put Phone Away ▶</button>
    </div>

    <!-- ===== CUTSCENE: PHONE REACTION ===== -->
    <div v-if="phase === 'cutscene-phone-react'" class="cutscene-screen dark-bg">
      <div class="dialogue-box">
        <div class="dialogue-speaker">You</div>
        <div class="dialogue-text">{{ phoneReactText }}</div>
        <button class="dialogue-next" @click="advancePhoneReact">Next ▶</button>
      </div>
    </div>

    <!-- ===== 3D GAME ===== -->
    <div v-if="phase === 'explore' || phase === 'homework-walk' || phase === 'lock-doors' || phase === 'chase'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- Dialogue overlay -->
      <div v-if="dialogueText" class="game-dialogue">
        <div class="gd-speaker">You</div>
        <div class="gd-text">{{ dialogueText }}</div>
        <button class="gd-next" @click="dialogueText = ''">OK</button>
      </div>

      <!-- Arrow indicator -->
      <div v-if="showArrow" class="arrow-indicator">
        <div class="arrow-icon">➡️</div>
        <div class="arrow-label">{{ arrowLabel }}</div>
      </div>

      <!-- Interaction prompt -->
      <div v-if="interactPrompt" class="interact-prompt">
        <button class="interact-btn" @click="doInteract">{{ interactPrompt }}</button>
      </div>

      <!-- Timer (lock doors) -->
      <div v-if="phase === 'lock-doors'" class="timer-display">
        <div class="timer-text">🔒 LOCK THE DOORS!</div>
        <div class="timer-countdown" :class="{ danger: lockTimer <= 10 }">{{ lockTimer }}s</div>
        <div class="doors-status">
          Front Door: {{ frontDoorLocked ? '🔒 Locked' : '🔓 UNLOCKED' }} |
          Back Door: {{ backDoorLocked ? '🔒 Locked' : '🔓 UNLOCKED' }}
        </div>
      </div>

      <!-- Light toggle -->
      <div class="light-controls">
        <button class="light-btn" @click="toggleLight('downstairs')">
          💡 Downstairs {{ lightsOn.downstairs ? 'ON' : 'OFF' }}
        </button>
        <button class="light-btn" @click="toggleLight('upstairs')">
          💡 Upstairs {{ lightsOn.upstairs ? 'ON' : 'OFF' }}
        </button>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls">
        <div class="joy-area" @touchstart.prevent="joyStart" @touchmove.prevent="joyMove" @touchend.prevent="joyEnd">
          <div class="joy-knob" :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"></div>
        </div>
      </div>
    </div>

    <!-- ===== HOMEWORK ===== -->
    <div v-if="phase === 'homework'" class="homework-screen">
      <div class="hw-card">
        <h2>📚 Homework Time!</h2>
        <div class="hw-question">{{ hwQuestion }}</div>
        <input v-model="hwAnswer" type="number" class="hw-input" placeholder="?" @keydown.enter="checkAnswer" autofocus />
        <button class="hw-submit" @click="checkAnswer">Submit</button>
        <div v-if="hwWrong" class="hw-wrong">❌ Wrong! Try again!</div>
        <div class="hw-progress">Question {{ hwIndex + 1 }} / {{ hwQuestions.length }}</div>
      </div>
    </div>

    <!-- ===== JUMPSCARE ===== -->
    <div v-if="phase === 'jumpscare'" class="jumpscare-screen">
      <div class="jumpscare-img">🐛</div>
    </div>

    <!-- ===== DEATH ===== -->
    <div v-if="phase === 'death'" class="death-screen">
      <h1>You died :/</h1>
      <p>Better luck next time!</p>
      <button class="play-btn" @click="startGame">Try Again</button>
      <button class="back-link" @click="phase = 'menu'">Menu</button>
    </div>

    <!-- ===== WIN (for now) ===== -->
    <div v-if="phase === 'safe'" class="safe-screen">
      <h1>🔒 You're Safe!</h1>
      <p>All doors locked! The centipede can't get in... for now.</p>
      <p class="safe-sub">To be continued...</p>
      <button class="play-btn" @click="phase = 'menu'">Menu</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()

type Phase = 'menu' | 'cutscene-news' | 'cutscene-reaction' | 'cutscene-phone' | 'cutscene-phone-react' |
  'explore' | 'homework-walk' | 'homework' | 'lock-doors' | 'chase' | 'jumpscare' | 'death' | 'safe'

const phase = ref<Phase>('menu')

// Cutscene state
const newsStep = ref(0)
const reactionStep = ref(0)
const phoneReactStep = ref(0)

const reactionTexts = [
  "Dang, that's crazy! A centipede on the loose!",
  "I need to tell my friends!",
]
const reactionText = ref(reactionTexts[0])

const phoneNotifs = [
  { name: '📱 David', text: 'Did you see that?! A centipede is loose??' },
  { name: '📱 Luke', text: 'BRO a giant centipede!! stay inside!!' },
  { name: '📱 Colin', text: 'yoo that centipede thing is crazy' },
  { name: '📱 Nathanael', text: 'did you see the news? centipede escaped!' },
]

const phoneReactTexts = [
  "Dang, I didn't know they watched the news?!",
  "I thought they only watched brainrot!",
  "Ok, I need to go study for my test.",
]
const phoneReactText = ref(phoneReactTexts[0])

// Game state
const dialogueText = ref('')
const showArrow = ref(false)
const arrowLabel = ref('')
const interactPrompt = ref('')
const lightsOn = reactive({ downstairs: true, upstairs: true })
const frontDoorLocked = ref(false)
const backDoorLocked = ref(false)
const lockTimer = ref(30)

// Homework
const hwQuestions = [
  { q: '300 + 400 = ?', a: 700 },
  { q: '700 - 300 = ?', a: 400 },
  { q: '600 + 300 = ?', a: 900 },
]
const hwIndex = ref(0)
const hwQuestion = ref('')
const hwAnswer = ref<number | null>(null)
const hwWrong = ref(false)

// 3D
const threeContainer = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number

let playerX = 0
let playerY = 0 // 0 = downstairs, 5 = upstairs
let playerZ = 3
let playerYaw = 0
const SPEED = 0.08
const keys: Record<string, boolean> = {}

// Joystick
const joyX = ref(0)
const joyY = ref(0)
let joyTouchId: number | null = null
let joyCenter = { x: 0, y: 0 }

// Interaction zones
interface Zone { x: number; z: number; y: number; radius: number; id: string; label: string }
let zones: Zone[] = []

// Centipede chase
let centipedeMesh: THREE.Group | null = null
let centipedeX = 0
let centipedeZ = 8
let lockTimerInterval: number | null = null

// Room meshes for lights
let downstairsLights: THREE.PointLight[] = []
let upstairsLights: THREE.PointLight[] = []

function startGame() {
  phase.value = 'cutscene-news'
  newsStep.value = 0
  reactionStep.value = 0
  phoneReactStep.value = 0
  hwIndex.value = 0
  frontDoorLocked.value = false
  backDoorLocked.value = false
  lockTimer.value = 30
  lightsOn.downstairs = true
  lightsOn.upstairs = true
}

// ===== CUTSCENE CONTROLS =====
function advanceNews() {
  if (newsStep.value < 4) {
    newsStep.value++
  } else {
    reactionStep.value = 0
    reactionText.value = reactionTexts[0]
    phase.value = 'cutscene-reaction'
  }
}

function advanceReaction() {
  reactionStep.value++
  if (reactionStep.value < reactionTexts.length) {
    reactionText.value = reactionTexts[reactionStep.value]
  } else {
    phase.value = 'cutscene-phone'
  }
}

function advancePhone() {
  phoneReactStep.value = 0
  phoneReactText.value = phoneReactTexts[0]
  phase.value = 'cutscene-phone-react'
}

function advancePhoneReact() {
  phoneReactStep.value++
  if (phoneReactStep.value < phoneReactTexts.length) {
    phoneReactText.value = phoneReactTexts[phoneReactStep.value]
  } else {
    phase.value = 'explore'
    nextTick(() => init3D())
  }
}

// ===== 3D SETUP =====
function init3D() {
  if (!threeContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a1520')

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  threeContainer.value.appendChild(renderer.domElement)

  // Mouse look directly on the canvas
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock?.()
  })
  renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
    if (document.pointerLockElement === renderer.domElement) {
      playerYaw -= e.movementX * 0.004
    }
  })
  renderer.domElement.addEventListener('mousedown', () => { mouseDown = true })
  renderer.domElement.addEventListener('mouseup', () => { mouseDown = false })

  scene.add(new THREE.AmbientLight('#888899', 0.7))

  buildHouse()
  setupZones()

  // Start in living room
  playerX = 0; playerZ = 3; playerY = 0
  showArrow.value = true
  arrowLabel.value = 'Go Upstairs'
  dialogueText.value = "I need to go upstairs and study for my test."

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', () => { mouseDown = true })
  window.addEventListener('mouseup', () => { mouseDown = false })
  window.addEventListener('resize', onResize)

  gameLoop()
}

function buildHouse() {
  downstairsLights = []
  upstairsLights = []

  const floorMat = new THREE.MeshStandardMaterial({ color: '#5a3a1e', roughness: 0.8 })
  const wallMat = new THREE.MeshStandardMaterial({ color: '#d4c4a0', roughness: 0.9 })
  const ceilMat = new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: 1 })
  const carpetMat = new THREE.MeshStandardMaterial({ color: '#4a3a6a', roughness: 0.9 })

  // === DOWNSTAIRS ===
  // Floor
  const floor1 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), floorMat)
  floor1.position.set(0, -0.1, 2)
  floor1.receiveShadow = true
  scene.add(floor1)

  // Walls
  const addWall = (x: number, y: number, z: number, w: number, h: number, d: number) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat)
    wall.position.set(x, y, z)
    wall.castShadow = true
    wall.receiveShadow = true
    scene.add(wall)
  }

  // Downstairs outer walls
  addWall(0, 1.5, -3, 12, 3, 0.2)   // back wall
  addWall(0, 1.5, 7, 12, 3, 0.2)    // front wall
  addWall(-6, 1.5, 2, 0.2, 3, 10)   // left wall
  addWall(6, 1.5, 2, 0.2, 3, 10)    // right wall

  // Ceiling/Floor between floors - only visible from below
  const ceil1 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 10), new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: 1, side: THREE.FrontSide }))
  ceil1.position.set(0, 3, 2)
  scene.add(ceil1)

  // Living room - couch
  const couchMat = new THREE.MeshStandardMaterial({ color: '#4a5568' })
  const couch = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 1), couchMat)
  couch.position.set(0, 0.3, 4)
  couch.castShadow = true
  scene.add(couch)
  // Couch back
  const couchBack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.2), couchMat)
  couchBack.position.set(0, 0.7, 4.5)
  scene.add(couchBack)

  // TV on wall
  const tvMat = new THREE.MeshStandardMaterial({ color: '#111' })
  const tv = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.1), tvMat)
  tv.position.set(0, 1.5, 6.85)
  scene.add(tv)
  // TV screen glow
  const tvScreen = new THREE.MeshStandardMaterial({ color: '#334', emissive: '#223', emissiveIntensity: 0.3 })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), tvScreen)
  screen.position.set(0, 1.5, 6.84)
  scene.add(screen)

  // Kitchen area (left side)
  const counterMat = new THREE.MeshStandardMaterial({ color: '#888' })
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 0.8), counterMat)
  counter.position.set(-4, 0.45, 0)
  counter.castShadow = true
  scene.add(counter)

  // Dining table
  const tableMat = new THREE.MeshStandardMaterial({ color: '#6b4226' })
  const table = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), tableMat)
  table.position.set(-3, 0.75, 3)
  scene.add(table)
  // Table legs
  for (const [tx, tz] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75), tableMat)
    leg.position.set(-3 + tx, 0.375, 3 + tz)
    scene.add(leg)
  }

  // Front door
  const doorMat = new THREE.MeshStandardMaterial({ color: '#3a2010' })
  const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 0.15), doorMat)
  frontDoor.position.set(3, 1.25, 6.9)
  scene.add(frontDoor)

  // Back door (in kitchen)
  const backDoor = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 0.15), doorMat)
  backDoor.position.set(-4, 1.25, -2.9)
  scene.add(backDoor)

  // Stairs
  const stairMat = new THREE.MeshStandardMaterial({ color: '#5a3a1e' })
  for (let i = 0; i < 8; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.5), stairMat)
    step.position.set(5, i * 0.375, -1 + i * 0.4)
    step.castShadow = true
    scene.add(step)
  }

  // Downstairs lights
  const dl1 = new THREE.PointLight('#ffddaa', 1, 10)
  dl1.position.set(0, 2.8, 3)
  scene.add(dl1)
  downstairsLights.push(dl1)
  const dl2 = new THREE.PointLight('#ffddaa', 0.6, 8)
  dl2.position.set(-4, 2.8, 0)
  scene.add(dl2)
  downstairsLights.push(dl2)

  // === UPSTAIRS ===
  // Floor
  const floor2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), carpetMat)
  floor2.position.set(0, 3.1, 2)
  floor2.receiveShadow = true
  scene.add(floor2)

  // Upstairs walls
  addWall(0, 4.5, -3, 12, 3, 0.2)   // back
  addWall(0, 4.5, 7, 12, 3, 0.2)    // front
  addWall(-6, 4.5, 2, 0.2, 3, 10)   // left
  addWall(6, 4.5, 2, 0.2, 3, 10)    // right

  // Ceiling
  const ceil2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), ceilMat)
  ceil2.position.set(0, 6, 2)
  scene.add(ceil2)

  // Hallway wall with doors
  addWall(-2, 4.5, 2, 0.15, 3, 4)  // hallway divider

  // Closed door 1 (left room)
  const closedDoor1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.12), doorMat)
  closedDoor1.position.set(-4, 4.2, 1)
  scene.add(closedDoor1)

  // Closed door 2 (hallway room)
  const closedDoor2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.12), doorMat)
  closedDoor2.position.set(-2, 4.2, 4)
  scene.add(closedDoor2)

  // === BEDROOM (right side upstairs, open door) ===
  // Bed
  const bedMat = new THREE.MeshStandardMaterial({ color: '#2563eb' })
  const bedFrame = new THREE.MeshStandardMaterial({ color: '#5a3a1e' })
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.2), bedMat)
  bed.position.set(4, 3.45, 0)
  bed.castShadow = true
  scene.add(bed)
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 2.4), bedFrame)
  bedBase.position.set(4, 3.25, 0)
  scene.add(bedBase)
  // Pillow
  const pillowMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5' })
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.4), pillowMat)
  pillow.position.set(4, 3.75, -0.8)
  scene.add(pillow)

  // Bedroom TV
  const bedroomTV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), tvMat)
  bedroomTV.position.set(4, 4.5, -2.9)
  scene.add(bedroomTV)

  // Nightstand
  const nsMat = new THREE.MeshStandardMaterial({ color: '#4a3020' })
  const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), nsMat)
  nightstand.position.set(5.2, 3.35, 0)
  scene.add(nightstand)

  // Lamp on nightstand
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8), new THREE.MeshStandardMaterial({ color: '#888' }))
  lampBase.position.set(5.2, 3.75, 0)
  scene.add(lampBase)
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 8), new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#fde68a', emissiveIntensity: 0.3 }))
  lampShade.position.set(5.2, 3.95, 0)
  scene.add(lampShade)

  // Desk
  const deskMat = new THREE.MeshStandardMaterial({ color: '#5a4030' })
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.8), deskMat)
  desk.position.set(2, 3.85, -2)
  scene.add(desk)
  // Desk legs
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) {
    const dleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65), deskMat)
    dleg.position.set(2 + dx, 3.5, -2 + dz)
    scene.add(dleg)
  }

  // Homework paper on desk
  const paperMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5' })
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), paperMat)
  paper.rotation.x = -Math.PI / 2
  paper.position.set(2, 3.9, -2)
  scene.add(paper)

  // Desk lamp
  const deskLamp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 8), new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.2 }))
  deskLamp.position.set(2.6, 4.1, -2.2)
  scene.add(deskLamp)

  // Desk chair
  const chairMat = new THREE.MeshStandardMaterial({ color: '#333' })
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), chairMat)
  chair.position.set(2, 3.4, -1.4)
  scene.add(chair)
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), chairMat)
  chairBack.position.set(2, 3.7, -1.65)
  scene.add(chairBack)

  // Upstairs lights
  const ul1 = new THREE.PointLight('#ffddaa', 1.5, 12)
  ul1.position.set(3, 5.5, 0)
  scene.add(ul1)
  upstairsLights.push(ul1)
  const ul2 = new THREE.PointLight('#ffddaa', 1.2, 10)
  ul2.position.set(0, 5.5, 3)
  scene.add(ul2)
  upstairsLights.push(ul2)
}

function setupZones() {
  zones = [
    { x: 5, z: 2, y: 0, radius: 1.5, id: 'stairs-up', label: 'Go Upstairs' },
    { x: 5, z: 2, y: 3.2, radius: 1.5, id: 'stairs-down', label: 'Go Downstairs' },
    { x: 2, z: -1.4, y: 3.2, radius: 1, id: 'desk', label: '📚 Sit at Desk' },
    { x: 3, z: 6.8, y: 0, radius: 1.2, id: 'front-door', label: '🔒 Lock Front Door' },
    { x: -4, z: -2.5, y: 0, radius: 1.2, id: 'back-door', label: '🔒 Lock Back Door' },
  ]
}

// ===== GAME LOOP =====
function gameLoop() {
  if (phase.value === 'menu' || phase.value.startsWith('cutscene') || phase.value === 'homework' ||
      phase.value === 'jumpscare' || phase.value === 'death' || phase.value === 'safe') {
    return
  }
  animFrame = requestAnimationFrame(gameLoop)

  updatePlayer()
  checkZones()
  if (phase.value === 'chase') updateChase()
  updateCamera()

  renderer.render(scene, camera)
}

function updatePlayer() {
  let dx = 0, dz = 0

  // Camera-relative movement: W=forward where camera looks, S=back, A=left, D=right
  let inputForward = 0
  let inputRight = 0
  if (keys['KeyW'] || keys['ArrowUp']) inputForward += 1
  if (keys['KeyS'] || keys['ArrowDown']) inputForward -= 1
  if (keys['KeyA'] || keys['ArrowLeft']) inputRight -= 1
  if (keys['KeyD'] || keys['ArrowRight']) inputRight += 1

  // Joystick
  if (joyX.value !== 0 || joyY.value !== 0) {
    inputRight += joyX.value / 40
    inputForward -= joyY.value / 40
  }

  if (inputForward !== 0 || inputRight !== 0) {
    // Forward direction is opposite of camera (camera is behind player)
    const forwardX = -Math.sin(playerYaw)
    const forwardZ = -Math.cos(playerYaw)
    const rightX = Math.cos(playerYaw)
    const rightZ = -Math.sin(playerYaw)

    dx = (forwardX * inputForward + rightX * inputRight) * SPEED
    dz = (forwardZ * inputForward + rightZ * inputRight) * SPEED

    playerX += dx
    playerZ += dz

    // Bounds
    playerX = Math.max(-5.5, Math.min(5.5, playerX))
    playerZ = Math.max(-2.5, Math.min(6.5, playerZ))
  }
}

function checkZones() {
  interactPrompt.value = ''
  for (const zone of zones) {
    if (Math.abs(playerY - zone.y) > 2) continue
    const dist = Math.sqrt((playerX - zone.x) ** 2 + (playerZ - zone.z) ** 2)
    if (dist < zone.radius) {
      if (zone.id === 'stairs-up' && playerY < 3) {
        interactPrompt.value = '⬆️ Go Upstairs (E)'
      } else if (zone.id === 'stairs-down' && playerY > 3) {
        interactPrompt.value = '⬇️ Go Downstairs (E)'
      } else if (zone.id === 'desk' && playerY > 3 && phase.value === 'explore') {
        interactPrompt.value = '📚 Sit and Do Homework (E)'
      } else if (zone.id === 'front-door' && phase.value === 'lock-doors' && !frontDoorLocked.value) {
        interactPrompt.value = '🔒 Lock Front Door (E)'
      } else if (zone.id === 'back-door' && phase.value === 'lock-doors' && !backDoorLocked.value) {
        interactPrompt.value = '🔒 Lock Back Door (E)'
      }
      return
    }
  }
}

function doInteract() {
  for (const zone of zones) {
    if (Math.abs(playerY - zone.y) > 2) continue
    const dist = Math.sqrt((playerX - zone.x) ** 2 + (playerZ - zone.z) ** 2)
    if (dist < zone.radius) {
      if (zone.id === 'stairs-up' && playerY < 3) {
        playerY = 3.2; playerX = 4; playerZ = 2
        showArrow.value = true
        arrowLabel.value = 'Go to your room'
      } else if (zone.id === 'stairs-down' && playerY > 3) {
        playerY = 0; playerX = 4; playerZ = 2
        if (phase.value === 'lock-doors') {
          showArrow.value = true
          arrowLabel.value = 'Lock the doors!'
        }
      } else if (zone.id === 'desk' && playerY > 3 && phase.value === 'explore') {
        showArrow.value = false
        startHomework()
      } else if (zone.id === 'front-door' && phase.value === 'lock-doors') {
        frontDoorLocked.value = true
        checkDoorsLocked()
      } else if (zone.id === 'back-door' && phase.value === 'lock-doors') {
        backDoorLocked.value = true
        checkDoorsLocked()
      }
      return
    }
  }
}

function updateCamera() {
  // Camera orbits around player based on mouse yaw
  const camDist = 3.5
  const camHeight = playerY + 1.5
  const cx = playerX + Math.sin(playerYaw) * camDist
  const cz = playerZ + Math.cos(playerYaw) * camDist
  camera.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.12)
  camera.lookAt(playerX, playerY + 0.8, playerZ)
}

// ===== HOMEWORK =====
function startHomework() {
  hwIndex.value = 0
  hwQuestion.value = hwQuestions[0].q
  hwAnswer.value = null
  hwWrong.value = false
  phase.value = 'homework'
}

function checkAnswer() {
  if (hwAnswer.value === hwQuestions[hwIndex.value].a) {
    hwWrong.value = false
    hwIndex.value++
    if (hwIndex.value >= hwQuestions.length) {
      finishHomework()
    } else {
      hwQuestion.value = hwQuestions[hwIndex.value].q
      hwAnswer.value = null
    }
  } else {
    hwWrong.value = true
    setTimeout(() => { hwWrong.value = false }, 2000)
  }
}

function finishHomework() {
  phase.value = 'explore'
  nextTick(() => {
    dialogueText.value = "Dang, that was hard!"
    setTimeout(() => {
      dialogueText.value = "OH MY! It's night! I need to lock my doors QUICK!!!!!"
      setTimeout(() => {
        dialogueText.value = ''
        startLockDoors()
      }, 3000)
    }, 2000)
    gameLoop()
  })
}

// ===== LOCK DOORS =====
function startLockDoors() {
  phase.value = 'lock-doors'
  lockTimer.value = 30
  playerY = 3.2 // Still upstairs
  showArrow.value = true
  arrowLabel.value = 'Go downstairs and lock the doors!'

  lockTimerInterval = setInterval(() => {
    lockTimer.value--
    if (lockTimer.value <= 0) {
      clearInterval(lockTimerInterval!)
      // Time's up - centipede comes!
      startChase()
    }
  }, 1000) as unknown as number
}

function checkDoorsLocked() {
  if (frontDoorLocked.value && backDoorLocked.value) {
    if (lockTimerInterval) clearInterval(lockTimerInterval)
    showArrow.value = false
    phase.value = 'safe'
  }
}

// ===== CHASE =====
function startChase() {
  phase.value = 'chase'
  showArrow.value = false
  // Spawn centipede at front door
  centipedeX = 3; centipedeZ = 6.5
  if (!centipedeMesh) {
    centipedeMesh = new THREE.Group()
    // Body segments
    const segMat = new THREE.MeshStandardMaterial({ color: '#3a0a0a', roughness: 0.6 })
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), segMat)
      seg.position.set(0, 0.5, i * 0.5)
      seg.castShadow = true
      centipedeMesh.add(seg)
      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: '#5a1a0a' })
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), legMat)
        leg.position.set(side * 0.3, 0.2, i * 0.5)
        leg.rotation.z = side * 0.5
        centipedeMesh.add(leg)
      }
    }
    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: '#5a0000', emissive: '#ff0000', emissiveIntensity: 0.3 })
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), headMat)
    head.position.set(0, 0.5, -0.3)
    centipedeMesh.add(head)
    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 1 })
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat)
    eye1.position.set(-0.15, 0.6, -0.5)
    centipedeMesh.add(eye1)
    const eye2 = eye1.clone()
    eye2.position.x = 0.15
    centipedeMesh.add(eye2)

    scene.add(centipedeMesh)
  }
  centipedeMesh.position.set(centipedeX, playerY, centipedeZ)
  gameLoop()
}

function updateChase() {
  if (!centipedeMesh) return
  // Centipede chases player
  const dx = playerX - centipedeX
  const dz = playerZ - centipedeZ
  const dist = Math.sqrt(dx * dx + dz * dz)

  if (dist > 0.5) {
    const speed = 0.04
    centipedeX += (dx / dist) * speed
    centipedeZ += (dz / dist) * speed
    centipedeMesh.position.set(centipedeX, playerY, centipedeZ)
    centipedeMesh.lookAt(playerX, playerY + 0.5, playerZ)
    // Wiggle animation
    const time = Date.now() * 0.01
    centipedeMesh.children.forEach((seg, i) => {
      seg.position.x = Math.sin(time + i * 0.5) * 0.1
    })
  }

  // Caught!
  if (dist < 0.8) {
    phase.value = 'jumpscare'
    setTimeout(() => {
      phase.value = 'death'
    }, 2000)
  }
}

// ===== LIGHTS =====
function toggleLight(area: string) {
  if (area === 'downstairs') {
    lightsOn.downstairs = !lightsOn.downstairs
    for (const l of downstairsLights) l.intensity = lightsOn.downstairs ? 1 : 0
  } else {
    lightsOn.upstairs = !lightsOn.upstairs
    for (const l of upstairsLights) l.intensity = lightsOn.upstairs ? 0.8 : 0
  }
}

// ===== INPUT =====
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyE') doInteract()
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

let mouseDown = false

function onMouseMove(e: MouseEvent) {
  if (document.pointerLockElement) {
    playerYaw -= e.movementX * 0.004
  } else if (mouseDown) {
    playerYaw -= e.movementX * 0.006
  }
}

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
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'The Centipede')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'The Centipede')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (lockTimerInterval) clearInterval(lockTimerInterval)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.centi-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a0a0a, #1a0a0a, #0a0a1a);
}
.menu-card {
  background: rgba(10,5,5,0.95); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 2px solid #4a0a0a; max-width: 400px; width: 90%;
}
.menu-icon { font-size: 80px; }
.menu-title { color: #ef4444; font-size: 36px; font-weight: 900; margin: 8px 0 4px; letter-spacing: 3px; }
.menu-sub { color: #94a3b8; font-size: 16px; margin: 0 0 24px; font-style: italic; }
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 20px; font-weight: 900; cursor: pointer;
}
.play-btn:hover { transform: scale(1.05); }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Cutscenes */
.cutscene-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0a0a0a; }
.dark-bg { background: #111; }

.tv-frame {
  background: #222; border-radius: 12px; padding: 16px; border: 4px solid #444;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8); max-width: 600px; width: 90%;
}
.tv-screen { background: #0a0a2a; border-radius: 8px; padding: 24px; min-height: 250px; position: relative; }
.channel-bug { position: absolute; top: 8px; right: 12px; color: #fbbf24; font-size: 11px; font-weight: 700; }
.show-name { color: #fff; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 16px; }
.show-host { font-size: 60px; text-align: center; }
.news-breaking { text-align: center; }
.breaking-bar {
  background: #dc2626; color: #fff; padding: 8px 16px; font-size: 18px; font-weight: 900;
  border-radius: 4px; margin-bottom: 16px; animation: flash-bar 0.5s ease-in-out infinite alternate;
}
@keyframes flash-bar { from { opacity: 1; } to { opacity: 0.7; } }
.news-desk { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.anchor { font-size: 50px; }
.news-text { color: #e2e8f0; font-size: 16px; line-height: 1.5; max-width: 400px; }
.cutscene-skip {
  margin-top: 20px; padding: 10px 24px; background: #333; color: #fff; border: none;
  border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer;
}
.cutscene-skip:hover { background: #555; }

/* Dialogue */
.dialogue-box {
  background: rgba(0,0,0,0.9); border: 2px solid #555; border-radius: 16px;
  padding: 24px 32px; max-width: 500px; width: 90%; text-align: center;
}
.dialogue-speaker { color: #fbbf24; font-size: 14px; font-weight: 800; margin-bottom: 8px; }
.dialogue-text { color: #e2e8f0; font-size: 18px; line-height: 1.5; margin-bottom: 16px; }
.dialogue-next {
  padding: 8px 20px; background: #3b82f6; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
}

/* Phone */
.phone-frame {
  background: #111; border-radius: 24px; padding: 8px; border: 3px solid #333;
  max-width: 280px; width: 80%; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}
.phone-screen { background: #1a3a1a; border-radius: 18px; padding: 16px; min-height: 350px; }
.capy-forest { font-size: 40px; text-align: center; margin: 20px 0; }
.phone-time { text-align: center; color: #fff; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
.phone-notifs { display: flex; flex-direction: column; gap: 6px; }
.notif {
  background: rgba(255,255,255,0.15); border-radius: 10px; padding: 8px 12px;
  backdrop-filter: blur(4px);
}
.notif-name { color: #4ade80; font-size: 12px; font-weight: 700; display: block; }
.notif-text { color: #e2e8f0; font-size: 13px; }

/* Game screen */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.three-container { position: fixed; inset: 0; z-index: 1; }

.game-dialogue {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.9); border: 2px solid #555; border-radius: 14px;
  padding: 16px 24px; max-width: 500px; width: 90%; text-align: center; z-index: 20;
}
.gd-speaker { color: #fbbf24; font-size: 12px; font-weight: 800; }
.gd-text { color: #fff; font-size: 16px; margin: 6px 0; }
.gd-next { padding: 6px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }

.arrow-indicator {
  position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
  z-index: 10; text-align: center; animation: bounce-arrow 1s ease-in-out infinite;
}
.arrow-icon { font-size: 36px; }
.arrow-label { color: #fbbf24; font-size: 12px; font-weight: 700; }
@keyframes bounce-arrow { 0%,100% { transform: translateY(-50%) translateX(0); } 50% { transform: translateY(-50%) translateX(10px); } }

.interact-prompt {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.interact-btn {
  padding: 12px 24px; background: rgba(251,191,36,0.9); color: #000; border: none;
  border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer;
}

.timer-display {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 12px;
  text-align: center; z-index: 10; border: 2px solid #ef4444;
}
.timer-text { color: #ef4444; font-size: 16px; font-weight: 900; }
.timer-countdown { color: #fff; font-size: 36px; font-weight: 900; }
.timer-countdown.danger { color: #ef4444; animation: flash-bar 0.3s ease-in-out infinite alternate; }
.doors-status { color: #94a3b8; font-size: 12px; margin-top: 4px; }

.light-controls {
  position: fixed; top: 12px; right: 12px; display: flex; flex-direction: column;
  gap: 4px; z-index: 10;
}
.light-btn {
  padding: 6px 12px; background: rgba(0,0,0,0.6); color: #fde68a;
  border: 1px solid #555; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;
}

.mobile-controls {
  display: none; position: fixed; bottom: 20px; left: 20px; z-index: 10;
}
.joy-area {
  width: 100px; height: 100px; background: rgba(255,255,255,0.1);
  border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.joy-knob { width: 40px; height: 40px; background: rgba(255,255,255,0.3); border-radius: 50%; }

/* Homework */
.homework-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #1a1a2e;
}
.hw-card {
  background: #fff; border-radius: 20px; padding: 32px; text-align: center;
  max-width: 400px; width: 90%; color: #1a1a2e;
}
.hw-card h2 { margin: 0 0 16px; font-size: 24px; }
.hw-question { font-size: 36px; font-weight: 900; margin-bottom: 20px; color: #1e40af; }
.hw-input {
  width: 120px; padding: 12px; font-size: 24px; text-align: center;
  border: 3px solid #3b82f6; border-radius: 12px; outline: none; margin-bottom: 12px;
}
.hw-submit {
  display: block; margin: 0 auto; padding: 10px 30px; background: #22c55e;
  color: #fff; border: none; border-radius: 10px; font-size: 18px; font-weight: 700; cursor: pointer;
}
.hw-wrong { color: #ef4444; font-size: 18px; font-weight: 800; margin-top: 10px; }
.hw-progress { color: #94a3b8; font-size: 13px; margin-top: 12px; }

/* Jumpscare */
.jumpscare-screen {
  position: fixed; inset: 0; background: #000; display: flex; align-items: center;
  justify-content: center; z-index: 100; animation: jumpscare-shake 0.1s infinite;
}
.jumpscare-img { font-size: 200px; animation: jumpscare-zoom 0.3s ease-out; }
@keyframes jumpscare-zoom { from { transform: scale(5); } to { transform: scale(1); } }
@keyframes jumpscare-shake { 0% { transform: translate(0); } 25% { transform: translate(-5px, 5px); } 50% { transform: translate(5px, -5px); } 75% { transform: translate(-5px, -5px); } }

/* Death */
.death-screen {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #0a0a0a; color: #fff; text-align: center;
}
.death-screen h1 { font-size: 36px; color: #ef4444; }
.death-screen p { color: #94a3b8; font-size: 18px; margin-bottom: 20px; }

/* Safe */
.safe-screen {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #0a1a0a; color: #fff; text-align: center;
}
.safe-screen h1 { font-size: 36px; color: #22c55e; }
.safe-screen p { color: #94a3b8; font-size: 18px; }
.safe-sub { font-style: italic; margin-bottom: 20px; }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: block; }
  .news-text { font-size: 14px; }
  .tv-frame { padding: 10px; }
}
</style>
