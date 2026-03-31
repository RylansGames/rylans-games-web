<template>
  <div class="teddy-app">
    <!-- Menu -->
    <div v-if="phase === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🧸</div>
        <h1 class="menu-title">TEDDY</h1>
        <p class="menu-sub">You woke up... as a teddy bear.</p>
        <button class="play-btn" @click="startGame">▶ Play</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Cutscene: Wake Up -->
    <div v-if="phase === 'wake-up'" class="cutscene-screen">
      <div class="scene-view">
        <div class="bedroom-bg">
          <div class="bed-visual">🛏️</div>
          <div class="teddy-visual">🧸</div>
        </div>
      </div>
      <div class="dialogue-box">
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <button class="dialogue-next" @click="advanceWakeUp">Next ▶</button>
      </div>
    </div>

    <!-- Cutscene: Look at hands -->
    <div v-if="phase === 'hands'" class="cutscene-screen dark">
      <div class="hands-view">
        <div class="hand left-hand">🧸🤚</div>
        <div class="hand right-hand">🤚🧸</div>
      </div>
      <div class="dialogue-box panic">
        <div class="dialogue-speaker">You (Mr. Teddy)</div>
        <div class="dialogue-text shake">WHY AM I A TEDDY BEAR?!?!</div>
        <button class="dialogue-next" @click="afterHands">Next ▶</button>
      </div>
    </div>

    <!-- 3D Explore Phase -->
    <div v-if="phase === 'explore' || phase === 'rush-back' || phase === 'investigate'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- Dialogue overlay - doesn't block movement -->
      <div v-if="gameDialogue" class="game-dialogue" style="pointer-events: none;">
        <div class="gd-speaker">{{ gameDialogueSpeaker }}</div>
        <div class="gd-text">{{ gameDialogue }}</div>
      </div>

      <!-- Timer (rush back to bed) -->
      <div v-if="phase === 'rush-back'" class="rush-timer">
        <div class="rush-text">🛏️ GET BACK ON THE BED!</div>
        <div class="rush-countdown" :class="{ danger: rushTimer <= 3 }">{{ rushTimer }}s</div>
      </div>

      <!-- Interact prompt -->
      <div v-if="interactPrompt" class="interact-prompt">
        <button class="interact-btn" @click="doInteract">{{ interactPrompt }}</button>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls">
        <div class="joy-area" @touchstart.prevent="joyStart" @touchmove.prevent="joyMove" @touchend.prevent="joyEnd">
          <div class="joy-knob" :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"></div>
        </div>
      </div>
    </div>

    <!-- Cutscene: Children enter -->
    <div v-if="phase === 'children-enter'" class="cutscene-screen">
      <div class="scene-view children-scene">
        <div class="child diana">👧 Diana</div>
        <div class="child david">👦 David</div>
        <div class="teddy-on-bed">🧸</div>
      </div>
      <div class="dialogue-box">
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <button class="dialogue-next" @click="advanceChildren">Next ▶</button>
      </div>
    </div>

    <!-- Cutscene: Mom -->
    <div v-if="phase === 'mom'" class="cutscene-screen">
      <div class="scene-view mom-scene">
        <div class="mom-visual">👩 Mom</div>
        <div class="children-leaving">
          <span>👧</span><span>👦</span>
        </div>
      </div>
      <div class="dialogue-box">
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <button class="dialogue-next" @click="advanceMom">Next ▶</button>
      </div>
    </div>

    <!-- Cutscene: After kids leave -->
    <div v-if="phase === 'alone'" class="cutscene-screen dark">
      <div class="scene-view">
        <div class="door-shut">🚪 *SLAM*</div>
        <div class="teddy-alone">🧸</div>
      </div>
      <div class="dialogue-box">
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <button class="dialogue-next" @click="advanceAlone">Next ▶</button>
      </div>
    </div>

    <!-- Game Over (failed to get back on bed) -->
    <div v-if="phase === 'caught'" class="death-screen">
      <div class="caught-scene">
        <div class="caught-children">
          <span class="caught-child">👧😱</span>
          <span class="caught-child">👦😱</span>
        </div>
        <div class="caught-teddy">🧸💦</div>
      </div>
      <h1>BUSTED!</h1>
      <p>The children saw you moving! They screamed and ran away!</p>
      <p class="sub">A teddy bear should NEVER be caught moving...</p>
      <button class="play-btn" @click="startGame">Try Again</button>
      <button class="back-link" @click="phase = 'menu'">Menu</button>
    </div>

    <!-- To Be Continued -->
    <div v-if="phase === 'tbc'" class="tbc-screen">
      <div class="tbc-teddy">🧸</div>
      <h1>To Be Continued...</h1>
      <p>What secrets does this room hold?</p>
      <button class="play-btn" @click="phase = 'menu'">Menu</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

type Phase = 'menu' | 'wake-up' | 'hands' | 'explore' | 'rush-back' | 'children-enter' | 'mom' | 'alone' | 'investigate' | 'caught' | 'tbc'

const phase = ref<Phase>('menu')
const dialogueSpeaker = ref('')
const dialogueText = ref('')
const gameDialogue = ref('')
const gameDialogueSpeaker = ref('')
const interactPrompt = ref('')
const rushTimer = ref(10)

// Wake up cutscene
const wakeUpStep = ref(0)
const wakeUpLines = [
  { speaker: '...', text: '*You slowly open your eyes...*' },
  { speaker: '...', text: '*Everything looks... huge. The bed feels enormous.*' },
  { speaker: '...', text: '*You try to sit up... your body feels soft... and fluffy?*' },
  { speaker: 'You', text: 'What... what happened to me...' },
]

// Children cutscene
const childStep = ref(0)
const childLines = [
  { speaker: 'Diana', text: 'MR. TEDDY BEAR! Where were you?!' },
  { speaker: 'Diana', text: 'We couldn\'t find you Mr. Teddy! We looked everywhere!' },
  { speaker: 'David', text: 'MR. TEDDDDYYYYY!!!' },
  { speaker: '', text: '*David leaps onto the bed and grabs you*' },
  { speaker: 'You (thinking)', text: 'Ow-' },
  { speaker: 'You (thinking)', text: 'I need to be quiet...' },
  { speaker: 'Diana', text: 'What was that sound?' },
  { speaker: 'Diana', text: 'Oh well!' },
]

// Mom cutscene
const momStep = ref(0)
const momLines = [
  { speaker: 'Mom', text: 'Kids! Time for dinner!' },
  { speaker: 'Diana & David', text: 'YAYYYY!! CHICKEN NUGGIESSSSS!!!' },
  { speaker: '', text: '*Diana and David run downstairs screaming about chicken nuggets*' },
  { speaker: '', text: '*SLAM! The door shuts behind them.*' },
]

// Alone cutscene
const aloneStep = ref(0)
const aloneLines = [
  { speaker: 'You (Mr. Teddy)', text: 'GOSH!' },
  { speaker: 'You (Mr. Teddy)', text: 'That was close... I almost got caught.' },
  { speaker: 'You (Mr. Teddy)', text: 'Now that they\'re gone... I need to investigate this room.' },
  { speaker: 'You (Mr. Teddy)', text: 'Something weird is going on. Why am I alive?!' },
]

// 3D
const threeContainer = ref<HTMLElement | null>(null)
let scene3d: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number

let playerX = 0
let playerY = 0
let playerZ = 0
const SPEED = 0.07
const keys: Record<string, boolean> = {}

// Joystick
const joyX = ref(0)
const joyY = ref(0)
let joyTouchId: number | null = null
let joyCenter = { x: 0, y: 0 }

// Mouse look
let lastMouseX = -1
let playerYaw = 0

// Zones
interface Zone { x: number; z: number; radius: number; id: string; label: string }
let zones: Zone[] = []
let rushTimerInterval: number | null = null

function startGame() {
  wakeUpStep.value = 0
  childStep.value = 0
  momStep.value = 0
  aloneStep.value = 0
  const line = wakeUpLines[0]
  dialogueSpeaker.value = line.speaker
  dialogueText.value = line.text
  phase.value = 'wake-up'
}

// ===== WAKE UP =====
function advanceWakeUp() {
  wakeUpStep.value++
  if (wakeUpStep.value < wakeUpLines.length) {
    const line = wakeUpLines[wakeUpStep.value]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
  } else {
    phase.value = 'hands'
  }
}

function afterHands() {
  phase.value = 'explore'
  nextTick(() => init3D('explore'))
}

// ===== 3D =====
function init3D(mode: string) {
  if (!threeContainer.value) return

  scene3d = new THREE.Scene()
  scene3d.background = new THREE.Color('#2a2535')

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 50)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  threeContainer.value.appendChild(renderer.domElement)

  // Mouse look on canvas
  let lmx = -1
  renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
    if (lmx >= 0) playerYaw += (e.clientX - lmx) * 0.005
    lmx = e.clientX
  })
  renderer.domElement.addEventListener('mouseleave', () => { lmx = -1 })
  renderer.domElement.addEventListener('mouseenter', (e: MouseEvent) => { lmx = e.clientX })

  scene3d.add(new THREE.AmbientLight('#998877', 0.6))

  buildBedroom()

  if (mode === 'explore') {
    // Start AWAY from the bed so you need to run back
    playerX = 1.5; playerZ = 2; playerY = 0
    playerYaw = 0
    zones = [{ x: 0, z: 0, radius: 1.2, id: 'bed', label: '🛏️ Get on Bed' }]

    // Auto dialogue sequence - doesn't block movement
    gameDialogueSpeaker.value = 'You (Mr. Teddy)'
    gameDialogue.value = "I got off the bed... I need to look around."
    setTimeout(() => {
      gameDialogue.value = ''
    }, 2500)

    // After 5 seconds, trigger the noises
    setTimeout(() => {
      if (phase.value !== 'explore') return
      gameDialogueSpeaker.value = '???'
      gameDialogue.value = '*footsteps... giggling...*'
      setTimeout(() => {
        if (phase.value !== 'explore') return
        gameDialogueSpeaker.value = 'You (Mr. Teddy)'
        gameDialogue.value = "Children?! I need to get back on the bed! QUICK!"
        setTimeout(() => {
          gameDialogue.value = ''
          startRushBack()
        }, 2500)
      }, 2000)
    }, 5000)
  } else if (mode === 'investigate') {
    playerX = 0; playerZ = 1; playerY = 0
    playerYaw = 0
    gameDialogueSpeaker.value = 'You (Mr. Teddy)'
    gameDialogue.value = "Now I can explore... Let me look around this room."
    zones = [
      { x: -2.5, z: -2, radius: 0.8, id: 'closet', label: '🚪 Open Closet' },
      { x: 2, z: -2.5, radius: 0.8, id: 'toybox', label: '📦 Check Toy Box' },
      { x: 0, z: -3, radius: 0.8, id: 'window', label: '🪟 Look Outside' },
      { x: 2.5, z: 0, radius: 0.8, id: 'drawer', label: '🗄️ Open Drawer' },
    ]
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)

  gameLoop()
}

function buildBedroom() {
  const floorMat = new THREE.MeshStandardMaterial({ color: '#6b5b4e', roughness: 0.9 })
  const wallMat = new THREE.MeshStandardMaterial({ color: '#c9b8a8', roughness: 0.8 })

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene3d.add(floor)

  // Walls
  const addWall = (x: number, y: number, z: number, w: number, h: number, d: number, color?: string) => {
    const mat = color ? new THREE.MeshStandardMaterial({ color, roughness: 0.8 }) : wallMat
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    wall.position.set(x, y, z)
    wall.castShadow = true
    scene3d.add(wall)
  }

  addWall(0, 1.5, -3.5, 7, 3, 0.15)   // back
  addWall(0, 1.5, 3.5, 7, 3, 0.15)    // front
  addWall(-3.5, 1.5, 0, 0.15, 3, 7)   // left
  addWall(3.5, 1.5, 0, 0.15, 3, 7)    // right

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ color: '#e8e0d8' }))
  ceil.rotation.x = Math.PI / 2
  ceil.position.y = 3
  scene3d.add(ceil)

  // Ceiling light
  const light = new THREE.PointLight('#ffeecc', 1.2, 10)
  light.position.set(0, 2.8, 0)
  light.castShadow = true
  scene3d.add(light)

  // Light fixture
  const fixture = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#fde68a', emissiveIntensity: 0.5 }))
  fixture.position.set(0, 2.75, 0)
  scene3d.add(fixture)

  // BED (center-left)
  const bedFrameMat = new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.7 })
  // Frame
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 2.5), bedFrameMat)
  bedFrame.position.set(0, 0.3, 0)
  bedFrame.castShadow = true
  scene3d.add(bedFrame)
  // Legs
  for (const [lx, lz] of [[-0.9, -1.1], [0.9, -1.1], [-0.9, 1.1], [0.9, 1.1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), bedFrameMat)
    leg.position.set(lx, 0.15, lz)
    scene3d.add(leg)
  }
  // Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 2.3),
    new THREE.MeshStandardMaterial({ color: '#f5f5f0', roughness: 0.9 }))
  mattress.position.set(0, 0.5, 0)
  scene3d.add(mattress)
  // Blanket
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.8),
    new THREE.MeshStandardMaterial({ color: '#4a90d9', roughness: 0.8 }))
  blanket.position.set(0, 0.6, 0.2)
  scene3d.add(blanket)
  // Pillows
  for (const px of [-0.4, 0.4]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.35),
      new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.9 }))
    pillow.position.set(px, 0.62, -0.9)
    scene3d.add(pillow)
  }
  // Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.12), bedFrameMat)
  headboard.position.set(0, 0.9, -1.25)
  scene3d.add(headboard)

  // Teddy bear on bed (small sphere + body)
  const teddyMat = new THREE.MeshStandardMaterial({ color: '#c4956a', roughness: 0.8 })
  const teddyBody = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), teddyMat)
  teddyBody.position.set(0, 0.75, 0)
  scene3d.add(teddyBody)
  const teddyHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), teddyMat)
  teddyHead.position.set(0, 0.95, 0)
  scene3d.add(teddyHead)
  // Teddy ears
  for (const ex of [-0.08, 0.08]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), teddyMat)
    ear.position.set(ex, 1.05, 0)
    scene3d.add(ear)
  }
  // Teddy eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#111' })
  for (const ex of [-0.04, 0.04]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat)
    eye.position.set(ex, 0.97, 0.1)
    scene3d.add(eye)
  }

  // NIGHTSTAND
  const nsMat = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.8 })
  const ns = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), nsMat)
  ns.position.set(1.5, 0.25, -0.5)
  ns.castShadow = true
  scene3d.add(ns)
  // Lamp on nightstand
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: '#888' }))
  lampBase.position.set(1.5, 0.58, -0.5)
  scene3d.add(lampBase)
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#fde68a', emissiveIntensity: 0.3 }))
  lampShade.position.set(1.5, 0.72, -0.5)
  scene3d.add(lampShade)
  const nsLight = new THREE.PointLight('#ffddaa', 0.4, 3)
  nsLight.position.set(1.5, 0.8, -0.5)
  scene3d.add(nsLight)

  // CLOSET (left wall)
  const closetMat = new THREE.MeshStandardMaterial({ color: '#4a3520', roughness: 0.7 })
  const closet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.6), closetMat)
  closet.position.set(-2.5, 1, -2)
  closet.castShadow = true
  scene3d.add(closet)
  // Closet handles
  const handleMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8 })
  for (const hx of [-0.15, 0.15]) {
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), handleMat)
    handle.position.set(-2.5 + hx, 1, -1.68)
    scene3d.add(handle)
  }

  // TOY BOX (right side)
  const toyMat = new THREE.MeshStandardMaterial({ color: '#e53e3e', roughness: 0.6 })
  const toyBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), toyMat)
  toyBox.position.set(2, 0.25, -2.5)
  toyBox.castShadow = true
  scene3d.add(toyBox)
  // Toys sticking out
  const toy1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
    new THREE.MeshStandardMaterial({ color: '#3b82f6' }))
  toy1.position.set(2.1, 0.55, -2.5)
  scene3d.add(toy1)

  // WINDOW (back wall)
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.08),
    new THREE.MeshStandardMaterial({ color: '#87CEEB', emissive: '#334466', emissiveIntensity: 0.2 }))
  windowFrame.position.set(0, 1.8, -3.4)
  scene3d.add(windowFrame)
  // Window frame border
  const frameMat = new THREE.MeshStandardMaterial({ color: '#fff' })
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.1), frameMat)
  frameTop.position.set(0, 2.3, -3.4)
  scene3d.add(frameTop)
  const frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.1), frameMat)
  frameBot.position.set(0, 1.3, -3.4)
  scene3d.add(frameBot)

  // DRAWER/DRESSER (right wall)
  const drawerMat = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.7 })
  const dresser = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.5), drawerMat)
  dresser.position.set(2.5, 0.4, 0)
  dresser.castShadow = true
  scene3d.add(dresser)
  // Drawer handles
  for (const dy of [0.15, 0.45]) {
    const dh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), handleMat)
    dh.position.set(2.5, dy, 0.27)
    scene3d.add(dh)
  }

  // RUG
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24),
    new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.9 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0, 0.01, 2)
  scene3d.add(rug)

  // DOOR (front wall)
  const doorMat = new THREE.MeshStandardMaterial({ color: '#3a2515' })
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.1), doorMat)
  door.position.set(-1, 1.1, 3.4)
  scene3d.add(door)
  const doorknob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), handleMat)
  doorknob.position.set(-0.6, 1, 3.35)
  scene3d.add(doorknob)
}

// ===== RUSH BACK =====
function startRushBack() {
  phase.value = 'rush-back'
  rushTimer.value = 10
  rushTimerInterval = setInterval(() => {
    rushTimer.value--
    if (rushTimer.value <= 0) {
      clearInterval(rushTimerInterval!)
      // Failed!
      phase.value = 'caught'
      cleanup3D()
    }
  }, 1000) as unknown as number
}

// ===== GAME LOOP =====
function gameLoop() {
  if (phase.value === 'menu' || phase.value.startsWith('wake') || phase.value === 'hands' ||
      phase.value === 'children-enter' || phase.value === 'mom' || phase.value === 'alone' ||
      phase.value === 'caught' || phase.value === 'tbc') {
    return
  }
  animFrame = requestAnimationFrame(gameLoop)

  updatePlayer()
  checkZones()
  updateCamera()

  renderer.render(scene3d, camera)
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
    playerX = Math.max(-3, Math.min(3, playerX))
    playerZ = Math.max(-3, Math.min(3, playerZ))
  }
}

function checkZones() {
  interactPrompt.value = ''
  for (const zone of zones) {
    const dist = Math.sqrt((playerX - zone.x) ** 2 + (playerZ - zone.z) ** 2)
    if (dist < zone.radius) {
      interactPrompt.value = zone.label + ' (E)'
      return
    }
  }
}

function doInteract() {
  for (const zone of zones) {
    const dist = Math.sqrt((playerX - zone.x) ** 2 + (playerZ - zone.z) ** 2)
    if (dist < zone.radius) {
      if (zone.id === 'bed' && phase.value === 'rush-back') {
        // Made it back!
        if (rushTimerInterval) clearInterval(rushTimerInterval)
        cleanup3D()
        childStep.value = 0
        const line = childLines[0]
        dialogueSpeaker.value = line.speaker
        dialogueText.value = line.text
        phase.value = 'children-enter'
      } else if (zone.id === 'closet') {
        gameDialogueSpeaker.value = 'You (Mr. Teddy)'
        gameDialogue.value = "It's dark in here... just some clothes and... wait, is that a journal? I can't read it with these paws..."
      } else if (zone.id === 'toybox') {
        gameDialogueSpeaker.value = 'You (Mr. Teddy)'
        gameDialogue.value = "A toy box full of other stuffed animals... they're not alive like me though. Or are they?"
      } else if (zone.id === 'window') {
        gameDialogueSpeaker.value = 'You (Mr. Teddy)'
        gameDialogue.value = "It's dark outside... I can see the backyard. The moon is full tonight. Something feels wrong..."
      } else if (zone.id === 'drawer') {
        gameDialogueSpeaker.value = 'You (Mr. Teddy)'
        gameDialogue.value = "There's a weird glowing stone in here... It feels warm. Maybe this is why I'm alive?"
        setTimeout(() => {
          gameDialogue.value = ''
          cleanup3D()
          phase.value = 'tbc'
        }, 4000)
      }
      return
    }
  }
}

function clearDialogue() {
  gameDialogue.value = ''
}

function updateCamera() {
  const camDist = 3
  const camHeight = playerY + 1.2
  const cx = playerX + Math.sin(playerYaw) * camDist
  const cz = playerZ + Math.cos(playerYaw) * camDist
  camera.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.12)
  camera.lookAt(playerX, playerY + 0.5, playerZ)
}

function cleanup3D() {
  if (animFrame) cancelAnimationFrame(animFrame)
  if (renderer && threeContainer.value && threeContainer.value.contains(renderer.domElement)) {
    threeContainer.value.removeChild(renderer.domElement)
  }
}

// ===== CHILDREN CUTSCENE =====
function advanceChildren() {
  childStep.value++
  if (childStep.value < childLines.length) {
    const line = childLines[childStep.value]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
  } else {
    momStep.value = 0
    const line = momLines[0]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
    phase.value = 'mom'
  }
}

// ===== MOM CUTSCENE =====
function advanceMom() {
  momStep.value++
  if (momStep.value < momLines.length) {
    const line = momLines[momStep.value]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
  } else {
    aloneStep.value = 0
    const line = aloneLines[0]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
    phase.value = 'alone'
  }
}

// ===== ALONE CUTSCENE =====
function advanceAlone() {
  aloneStep.value++
  if (aloneStep.value < aloneLines.length) {
    const line = aloneLines[aloneStep.value]
    dialogueSpeaker.value = line.speaker
    dialogueText.value = line.text
  } else {
    phase.value = 'investigate'
    nextTick(() => init3D('investigate'))
  }
}

// ===== INPUT =====
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyE') doInteract()
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
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Teddy')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Teddy')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  cleanup3D()
  if (rushTimerInterval) clearInterval(rushTimerInterval)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.teddy-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2a1a10, #3a2a1a, #1a1520);
}
.menu-card {
  background: rgba(20,10,5,0.95); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 2px solid #c4956a; max-width: 400px; width: 90%;
}
.menu-icon { font-size: 80px; }
.menu-title { color: #c4956a; font-size: 42px; font-weight: 900; margin: 8px 0 4px; letter-spacing: 4px; }
.menu-sub { color: #94a3b8; font-size: 16px; margin: 0 0 24px; font-style: italic; }
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #c4956a, #a07850); color: #fff;
  font-size: 20px; font-weight: 900; cursor: pointer;
}
.play-btn:hover { transform: scale(1.05); }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Cutscenes */
.cutscene-screen {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #1a1520; padding: 20px;
}
.cutscene-screen.dark { background: #0a0a0f; }

.scene-view {
  margin-bottom: 20px; text-align: center;
}
.bedroom-bg { font-size: 60px; margin-bottom: 10px; }
.bed-visual { font-size: 80px; }
.teddy-visual { font-size: 50px; margin-top: -20px; }

.hands-view { display: flex; gap: 40px; margin-bottom: 20px; }
.hand { font-size: 40px; animation: hand-shake 0.5s ease-in-out infinite alternate; }
.left-hand { animation-delay: 0.2s; }
@keyframes hand-shake { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }

.dialogue-box {
  background: rgba(0,0,0,0.85); border: 2px solid #555; border-radius: 16px;
  padding: 20px 28px; max-width: 500px; width: 90%; text-align: center;
}
.dialogue-box.panic { border-color: #ef4444; }
.dialogue-speaker { color: #fbbf24; font-size: 13px; font-weight: 800; margin-bottom: 6px; }
.dialogue-text { color: #e2e8f0; font-size: 18px; line-height: 1.5; margin-bottom: 14px; }
.dialogue-text.shake { animation: text-shake 0.1s infinite; color: #ef4444; font-size: 24px; font-weight: 900; }
@keyframes text-shake { 0% { transform: translate(0); } 25% { transform: translate(-3px, 2px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(-2px, -3px); } }
.dialogue-next {
  padding: 8px 20px; background: #3b82f6; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
}

/* Children scene */
.children-scene { display: flex; gap: 30px; align-items: flex-end; }
.child { font-size: 40px; text-align: center; }
.teddy-on-bed { font-size: 50px; }

/* Mom scene */
.mom-scene { text-align: center; }
.mom-visual { font-size: 50px; margin-bottom: 10px; }
.children-leaving { font-size: 30px; display: flex; gap: 10px; justify-content: center; animation: run-away 1s ease-in; }
@keyframes run-away { from { transform: translateX(0); } to { transform: translateX(50px); opacity: 0.5; } }

/* Alone scene */
.door-shut { font-size: 40px; margin-bottom: 10px; color: #ef4444; animation: slam 0.3s; }
@keyframes slam { from { transform: scale(1.5); } to { transform: scale(1); } }
.teddy-alone { font-size: 60px; }

/* Game screen */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.three-container { position: fixed; inset: 0; z-index: 1; }

.game-dialogue {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.9); border: 2px solid #555; border-radius: 14px;
  padding: 14px 22px; max-width: 500px; width: 90%; text-align: center; z-index: 20;
}
.gd-speaker { color: #fbbf24; font-size: 12px; font-weight: 800; }
.gd-text { color: #fff; font-size: 15px; margin: 6px 0; }
.gd-next { padding: 5px 14px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }

.rush-timer {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.85); padding: 10px 24px; border-radius: 12px;
  text-align: center; z-index: 20; border: 2px solid #ef4444;
}
.rush-text { color: #ef4444; font-size: 16px; font-weight: 900; }
.rush-countdown { color: #fff; font-size: 40px; font-weight: 900; }
.rush-countdown.danger { color: #ef4444; animation: flash-danger 0.3s infinite alternate; }
@keyframes flash-danger { from { opacity: 1; } to { opacity: 0.4; } }

.interact-prompt {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.interact-btn {
  padding: 12px 24px; background: rgba(251,191,36,0.9); color: #000; border: none;
  border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer;
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

/* Caught/Death */
.death-screen {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #0a0a0a; color: #fff; text-align: center; padding: 20px;
}
.caught-scene { margin-bottom: 20px; }
.caught-children { display: flex; gap: 20px; font-size: 50px; margin-bottom: 10px; }
.caught-teddy { font-size: 60px; }
.death-screen h1 { font-size: 42px; color: #ef4444; margin: 0 0 10px; }
.death-screen p { color: #94a3b8; font-size: 18px; margin: 0 0 8px; }
.sub { font-style: italic; font-size: 14px !important; }

/* TBC */
.tbc-screen {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #0a0a0f; color: #fff; text-align: center;
}
.tbc-teddy { font-size: 80px; margin-bottom: 16px; }
.tbc-screen h1 { font-size: 36px; color: #c4956a; font-style: italic; }
.tbc-screen p { color: #94a3b8; font-size: 16px; margin-bottom: 20px; }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: block; }
  .dialogue-text { font-size: 15px; }
}
</style>
