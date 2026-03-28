<template>
  <div class="bball-app">
    <!-- MENU -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🏀</div>
        <h1 class="menu-title">Basketball</h1>
        <p class="menu-sub">Score hoops, steal the ball, win the game!</p>
        <input v-model="playerName" type="text" placeholder="Your name" maxlength="16" class="menu-input" />
        <div class="menu-buttons">
          <button class="menu-btn online-btn" @click="joinOnline" :disabled="!playerName.trim()">
            🌐 Play Online
          </button>
          <button class="menu-btn bot-btn" @click="playBots" :disabled="!playerName.trim()">
            🤖 Play with Bots
          </button>
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- GAME -->
    <div v-if="screen === 'game'" class="game-screen">
      <div ref="canvasContainer" class="canvas-container"></div>

      <!-- Scoreboard -->
      <div class="scoreboard">
        <div class="score-team home">
          <span class="team-label">HOME</span>
          <span class="team-score">{{ homeScore }}</span>
        </div>
        <div class="score-timer">{{ formatTime(gameTime) }}</div>
        <div class="score-team away">
          <span class="team-label">AWAY</span>
          <span class="team-score">{{ awayScore }}</span>
        </div>
      </div>

      <!-- Shot Power -->
      <div v-if="isAiming" class="power-meter">
        <div class="power-bar">
          <div class="power-fill" :style="{ height: shotPower + '%' }"></div>
        </div>
        <span class="power-label">POWER</span>
      </div>

      <!-- Ball indicator -->
      <div class="ball-indicator" v-if="hasBall">
        🏀 You have the ball!
      </div>

      <!-- Scored! -->
      <div v-if="scoredAlert" class="scored-alert">
        <div class="scored-text">{{ scoredAlert }}</div>
      </div>

      <!-- Controls -->
      <div class="controls-hint" v-if="showHint">
        WASD - Move | Mouse - Look | Click - Shoot | E - Steal ball | Space - Jump
      </div>

      <!-- Leave -->
      <div class="leave-area">
        <button class="leave-btn" @click="leaveGame">← Leave</button>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls">
        <div class="mobile-left">
          <div class="dpad">
            <button class="dp up" @touchstart.prevent="tDown('up')" @touchend.prevent="tUp('up')">▲</button>
            <div class="dp-mid">
              <button class="dp left" @touchstart.prevent="tDown('left')" @touchend.prevent="tUp('left')">◀</button>
              <div class="dp-center"></div>
              <button class="dp right" @touchstart.prevent="tDown('right')" @touchend.prevent="tUp('right')">▶</button>
            </div>
            <button class="dp down" @touchstart.prevent="tDown('down')" @touchend.prevent="tUp('down')">▼</button>
          </div>
        </div>
        <div class="mobile-right">
          <button class="m-btn shoot-btn" @touchstart.prevent="startShot" @touchend.prevent="releaseShot">🏀</button>
          <button class="m-btn steal-btn" @touchstart.prevent="trySteal">E</button>
          <button class="m-btn jump-btn" @touchstart.prevent="doJump">⬆</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../firebase'
import { ref as dbRef, set, remove, onValue, onDisconnect } from 'firebase/database'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()

const screen = ref<'menu' | 'game'>('menu')
const playerName = ref('')
const homeScore = ref(0)
const awayScore = ref(0)
const gameTime = ref(120)
const isAiming = ref(false)
const shotPower = ref(0)
const hasBall = ref(true)
const scoredAlert = ref('')
const showHint = ref(true)
const canvasContainer = ref<HTMLElement | null>(null)

let isOnline = false
let isBotMode = false
const myId = ref('')

// Three.js
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number

// Player
let playerPos = new THREE.Vector3(0, 0, 8)
let playerVel = new THREE.Vector3()
let yaw = Math.PI
let pitch = 0
let isJumping = false
let onGround = true

// Ball
let ballMesh: THREE.Mesh
let ballPos = new THREE.Vector3(0, 1, 8)
let ballVel = new THREE.Vector3()
let ballInAir = false
let ballOwner: string | null = 'player'
let ballBouncing = false

// Hoops
const HOOP_HOME = new THREE.Vector3(0, 3.05, -13)
const HOOP_AWAY = new THREE.Vector3(0, 3.05, 13)

// Physics
const GRAVITY = -0.012
const MOVE_SPEED = 0.12
const MOUSE_SENS = 0.002

// Input
const keys: Record<string, boolean> = {}
const touchKeys: Record<string, boolean> = {}
let mouseDown = false
let powerTimer: number | null = null

// Bots
interface Bot {
  id: string
  name: string
  pos: THREE.Vector3
  vel: THREE.Vector3
  rotY: number
  mesh: THREE.Group | null
  team: 'home' | 'away'
  hasBall: boolean
  state: string
  target: THREE.Vector3
  shootTimer: number
}

let bots: Bot[] = []
let gameTimer: number | null = null

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ========== JOIN ==========
function joinOnline() {
  if (!playerName.value.trim()) return
  localStorage.setItem('bballName', playerName.value)
  isOnline = true; isBotMode = false
  myId.value = 'bb-' + Math.random().toString(36).slice(2, 10)
  screen.value = 'game'
  nextTick(() => initGame())
}

function playBots() {
  if (!playerName.value.trim()) return
  localStorage.setItem('bballName', playerName.value)
  isOnline = false; isBotMode = true
  myId.value = 'local'
  screen.value = 'game'
  nextTick(() => { initGame(); spawnBots() })
}

function leaveGame() {
  if (isOnline) remove(dbRef(db, `basketball/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (gameTimer) clearInterval(gameTimer)
  document.exitPointerLock?.()
  screen.value = 'menu'
}

function spawnBots() {
  const names = ['AirJordan', 'DunkKing', 'SlamBot', 'Hoopster', 'SwishMaster']
  // 2 teammates, 3 opponents
  const configs = [
    { name: names[0], team: 'home' as const, pos: new THREE.Vector3(-4, 0, 5) },
    { name: names[1], team: 'home' as const, pos: new THREE.Vector3(4, 0, 5) },
    { name: names[2], team: 'away' as const, pos: new THREE.Vector3(-4, 0, -5) },
    { name: names[3], team: 'away' as const, pos: new THREE.Vector3(0, 0, -8) },
    { name: names[4], team: 'away' as const, pos: new THREE.Vector3(4, 0, -5) },
  ]
  for (const c of configs) {
    bots.push({
      id: 'bot-' + c.name,
      name: c.name,
      pos: c.pos.clone(),
      vel: new THREE.Vector3(),
      rotY: c.team === 'home' ? Math.PI : 0,
      mesh: null,
      team: c.team,
      hasBall: false,
      state: 'idle',
      target: new THREE.Vector3(),
      shootTimer: 60 + Math.floor(Math.random() * 120),
    })
  }
}

// ========== THREE.JS ==========
function initGame() {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a1a2e')

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Lights
  scene.add(new THREE.AmbientLight('#c0d0e0', 0.5))

  const topLight = new THREE.DirectionalLight('#ffffff', 1)
  topLight.position.set(0, 20, 0)
  topLight.castShadow = true
  topLight.shadow.mapSize.set(2048, 2048)
  topLight.shadow.camera.near = 1
  topLight.shadow.camera.far = 40
  topLight.shadow.camera.left = -20
  topLight.shadow.camera.right = 20
  topLight.shadow.camera.top = 20
  topLight.shadow.camera.bottom = -20
  scene.add(topLight)

  // Stadium lights
  const colors = ['#ff8800', '#ffaa00']
  for (const x of [-12, 12]) {
    for (const z of [-10, 10]) {
      const pl = new THREE.PointLight(colors[Math.abs(x + z) % 2], 0.6, 25)
      pl.position.set(x, 8, z)
      scene.add(pl)
    }
  }

  buildCourt()
  createBall()

  // Start timer
  gameTime.value = 120
  gameTimer = setInterval(() => {
    if (gameTime.value > 0) gameTime.value--
    else {
      if (gameTimer) clearInterval(gameTimer)
      showScored(homeScore.value > awayScore.value ? 'HOME WINS!' : awayScore.value > homeScore.value ? 'AWAY WINS!' : 'TIE GAME!')
    }
  }, 1000) as unknown as number

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)

  setTimeout(() => { showHint.value = false }, 5000)
  gameLoop()
}

function buildCourt() {
  // Court floor
  const courtGeo = new THREE.PlaneGeometry(28, 30)
  const courtMat = new THREE.MeshStandardMaterial({ color: '#c4873b', roughness: 0.6 })
  const court = new THREE.Mesh(courtGeo, courtMat)
  court.rotation.x = -Math.PI / 2
  court.receiveShadow = true
  scene.add(court)

  // Court lines
  const lineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })

  // Center circle
  const circleGeo = new THREE.RingGeometry(2.8, 3, 48)
  const circle = new THREE.Mesh(circleGeo, lineMat)
  circle.rotation.x = -Math.PI / 2
  circle.position.y = 0.01
  scene.add(circle)

  // Center line
  const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(28, 0.1), lineMat)
  centerLine.rotation.x = -Math.PI / 2
  centerLine.position.y = 0.01
  scene.add(centerLine)

  // Three point arcs
  for (const z of [-13, 13]) {
    const arcGeo = new THREE.RingGeometry(5.8, 6, 32, 1, 0, Math.PI)
    const arc = new THREE.Mesh(arcGeo, lineMat)
    arc.rotation.x = -Math.PI / 2
    arc.rotation.z = z > 0 ? 0 : Math.PI
    arc.position.set(0, 0.01, z)
    scene.add(arc)
  }

  // Free throw areas
  for (const z of [-13, 13]) {
    const dir = z > 0 ? -1 : 1
    // Box
    const boxLines = [
      { pos: [-3, 0.01, z + dir * 5.8], size: [0.1, 5.8] },
      { pos: [3, 0.01, z + dir * 5.8], size: [0.1, 5.8] },
      { pos: [0, 0.01, z + dir * 5.8], size: [6, 0.1] },
    ]
    for (const l of boxLines) {
      const geo = new THREE.PlaneGeometry(l.size[0], l.size[1])
      const mesh = new THREE.Mesh(geo, lineMat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(l.pos[0], l.pos[1], l.pos[2])
      scene.add(mesh)
    }
  }

  // Backboards and hoops
  createHoop(0, -14, false)
  createHoop(0, 14, true)

  // Arena walls
  const wallMat = new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.9 })
  const walls = [
    { pos: [0, 4, -16], size: [30, 8, 0.5] },
    { pos: [0, 4, 16], size: [30, 8, 0.5] },
    { pos: [-15, 4, 0], size: [0.5, 8, 32] },
    { pos: [15, 4, 0], size: [0.5, 8, 32] },
  ]
  for (const w of walls) {
    const geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2])
    const mesh = new THREE.Mesh(geo, wallMat)
    mesh.position.set(w.pos[0], w.pos[1], w.pos[2])
    scene.add(mesh)
  }

  // Bleachers/stands (simple)
  const standMat = new THREE.MeshStandardMaterial({ color: '#2a2a4a', roughness: 0.8 })
  for (const x of [-14.5, 14.5]) {
    for (let row = 0; row < 3; row++) {
      const geo = new THREE.BoxGeometry(0.3, 1 + row * 0.8, 28)
      const stand = new THREE.Mesh(geo, standMat)
      stand.position.set(x + (x > 0 ? row * 0.4 : -row * 0.4), 0.5 + row * 0.8, 0)
      scene.add(stand)
    }
  }

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(32, 34)
  const ceilMat = new THREE.MeshStandardMaterial({ color: '#111122', roughness: 1 })
  const ceil = new THREE.Mesh(ceilGeo, ceilMat)
  ceil.rotation.x = Math.PI / 2
  ceil.position.y = 10
  scene.add(ceil)
}

function createHoop(x: number, z: number, flipped: boolean) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 8)
  const poleMat = new THREE.MeshStandardMaterial({ color: '#888' })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.set(0, 1.75, flipped ? -0.5 : 0.5)
  pole.castShadow = true
  group.add(pole)

  // Backboard
  const bbGeo = new THREE.BoxGeometry(1.8, 1.2, 0.08)
  const bbMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })
  const bb = new THREE.Mesh(bbGeo, bbMat)
  bb.position.set(0, 3.2, flipped ? -0.5 : 0.5)
  bb.castShadow = true
  group.add(bb)

  // Backboard border
  const borderMat = new THREE.MeshStandardMaterial({ color: '#ff4444' })
  const borders = [
    { pos: [0, 3.8, flipped ? -0.45 : 0.45], size: [1.8, 0.05, 0.02] },
    { pos: [0, 2.6, flipped ? -0.45 : 0.45], size: [1.8, 0.05, 0.02] },
    { pos: [-0.9, 3.2, flipped ? -0.45 : 0.45], size: [0.05, 1.2, 0.02] },
    { pos: [0.9, 3.2, flipped ? -0.45 : 0.45], size: [0.05, 1.2, 0.02] },
  ]
  for (const b of borders) {
    const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2])
    const mesh = new THREE.Mesh(geo, borderMat)
    mesh.position.set(b.pos[0], b.pos[1], b.pos[2])
    group.add(mesh)
  }

  // Rim
  const rimGeo = new THREE.TorusGeometry(0.23, 0.02, 8, 24)
  const rimMat = new THREE.MeshStandardMaterial({ color: '#ff6600' })
  const rim = new THREE.Mesh(rimGeo, rimMat)
  rim.rotation.x = Math.PI / 2
  rim.position.set(0, 3.05, flipped ? -0.9 : 0.1)
  group.add(rim)

  // Net (simplified)
  const netGeo = new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 1, true)
  const netMat = new THREE.MeshStandardMaterial({
    color: '#ffffff', transparent: true, opacity: 0.5, side: THREE.DoubleSide, wireframe: true,
  })
  const net = new THREE.Mesh(netGeo, netMat)
  net.position.set(0, 2.85, flipped ? -0.9 : 0.1)
  group.add(net)

  scene.add(group)
}

function createBall() {
  const ballGeo = new THREE.SphereGeometry(0.24, 24, 24)
  const ballMat = new THREE.MeshStandardMaterial({ color: '#ff6b00', roughness: 0.6 })
  ballMesh = new THREE.Mesh(ballGeo, ballMat)
  ballMesh.castShadow = true
  ballMesh.position.copy(ballPos)
  scene.add(ballMesh)

  // Ball lines
  const lineGeo = new THREE.TorusGeometry(0.24, 0.008, 4, 32)
  const ballLineMat = new THREE.MeshBasicMaterial({ color: '#3a2000' })
  const line1 = new THREE.Mesh(lineGeo, ballLineMat)
  ballMesh.add(line1)
  const line2 = new THREE.Mesh(lineGeo, ballLineMat)
  line2.rotation.y = Math.PI / 2
  ballMesh.add(line2)
}

// ========== GAME LOOP ==========
function gameLoop() {
  animFrame = requestAnimationFrame(gameLoop)

  updatePlayer()
  updateBall()
  if (isBotMode) updateAllBots()
  updateBotMeshes()

  renderer.render(scene, camera)
}

function updatePlayer() {
  // Camera-relative movement
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))

  let moveDir = new THREE.Vector3()
  if (keys['KeyW'] || keys['ArrowUp'] || touchKeys['up']) moveDir.add(forward)
  if (keys['KeyS'] || keys['ArrowDown'] || touchKeys['down']) moveDir.sub(forward)
  if (keys['KeyA'] || keys['ArrowLeft'] || touchKeys['left']) moveDir.sub(right)
  if (keys['KeyD'] || keys['ArrowRight'] || touchKeys['right']) moveDir.add(right)

  if (moveDir.length() > 0) {
    moveDir.normalize().multiplyScalar(MOVE_SPEED)
    playerPos.x += moveDir.x
    playerPos.z += moveDir.z
  }

  // Jump
  playerVel.y += GRAVITY
  playerPos.y += playerVel.y
  if (playerPos.y <= 0) { playerPos.y = 0; playerVel.y = 0; onGround = true; isJumping = false }

  // Bounds
  playerPos.x = Math.max(-13.5, Math.min(13.5, playerPos.x))
  playerPos.z = Math.max(-15, Math.min(15, playerPos.z))

  // Camera - third person
  const camDist = 5
  const camHeight = 3
  const cx = playerPos.x - Math.sin(yaw) * camDist
  const cz = playerPos.z - Math.cos(yaw) * camDist
  camera.position.lerp(new THREE.Vector3(cx, playerPos.y + camHeight, cz), 0.15)
  camera.lookAt(new THREE.Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z))

  // Ball follows player if they have it
  if (ballOwner === 'player') {
    const ballOffset = forward.clone().multiplyScalar(0.8)
    ballPos.set(
      playerPos.x + ballOffset.x + Math.sin(Date.now() * 0.008) * 0.05,
      playerPos.y + 0.8 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.15,
      playerPos.z + ballOffset.z,
    )
    ballVel.set(0, 0, 0)
    ballInAir = false
    hasBall.value = true
  } else {
    hasBall.value = false
  }
}

function updateBall() {
  if (ballInAir) {
    ballVel.y += GRAVITY
    ballPos.add(ballVel)

    // Bounce off floor
    if (ballPos.y < 0.24) {
      ballPos.y = 0.24
      ballVel.y *= -0.6
      ballVel.x *= 0.8
      ballVel.z *= 0.8
      if (Math.abs(ballVel.y) < 0.02) {
        ballVel.set(0, 0, 0)
        ballInAir = false
        ballBouncing = true
        ballOwner = null
      }
    }

    // Bounce off walls
    if (Math.abs(ballPos.x) > 14) { ballPos.x = Math.sign(ballPos.x) * 14; ballVel.x *= -0.5 }
    if (Math.abs(ballPos.z) > 15.5) { ballPos.z = Math.sign(ballPos.z) * 15.5; ballVel.z *= -0.5 }

    // Check hoop scoring
    checkScore(HOOP_HOME, 'home')
    checkScore(HOOP_AWAY, 'away')
  }

  // Loose ball pickup
  if (!ballOwner && !ballInAir) {
    const distToPlayer = ballPos.distanceTo(new THREE.Vector3(playerPos.x, 0.24, playerPos.z))
    if (distToPlayer < 1.5) {
      ballOwner = 'player'
    }
  }

  // Update mesh
  ballMesh.position.copy(ballPos)
  if (ballInAir) {
    ballMesh.rotation.x += ballVel.z * 2
    ballMesh.rotation.z -= ballVel.x * 2
  }
}

function checkScore(hoop: THREE.Vector3, side: string) {
  const dist = new THREE.Vector2(ballPos.x - hoop.x, ballPos.z - hoop.z).length()
  if (dist < 0.35 && Math.abs(ballPos.y - hoop.y) < 0.5 && ballVel.y < 0) {
    // SCORED!
    if (side === 'home') {
      // Scoring on home hoop = away team scores
      awayScore.value += 2
      showScored('AWAY +2!')
    } else {
      homeScore.value += 2
      showScored('HOME +2!')
    }

    // Reset ball
    ballInAir = false
    ballOwner = 'player'
    playerPos.set(0, 0, 8)
    ballPos.set(0, 1, 8)
  }
}

function showScored(text: string) {
  scoredAlert.value = text
  setTimeout(() => { scoredAlert.value = '' }, 2000)
}

function shootBall() {
  if (ballOwner !== 'player') return

  const power = shotPower.value / 100
  const dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))

  ballVel.set(
    dir.x * power * 0.35,
    0.2 + power * 0.15,
    dir.z * power * 0.35,
  )

  ballOwner = null
  ballInAir = true
  isAiming.value = false
  shotPower.value = 0
}

function trySteal() {
  if (ballOwner === 'player') return

  // Check if near a bot with ball
  for (const bot of bots) {
    if (bot.hasBall && bot.pos.distanceTo(playerPos) < 2) {
      bot.hasBall = false
      ballOwner = 'player'
      return
    }
  }

  // Pick up loose ball
  if (!ballOwner) {
    const dist = ballPos.distanceTo(new THREE.Vector3(playerPos.x, ballPos.y, playerPos.z))
    if (dist < 2) {
      ballOwner = 'player'
    }
  }
}

function doJump() {
  if (onGround) { playerVel.y = 0.2; onGround = false; isJumping = true }
}

// ========== BOT AI ==========
function updateAllBots() {
  for (const bot of bots) {
    const targetHoop = bot.team === 'home' ? HOOP_AWAY : HOOP_HOME

    if (bot.hasBall) {
      // Move toward enemy hoop
      const dir = targetHoop.clone().sub(bot.pos)
      dir.y = 0
      const dist = dir.length()
      dir.normalize()

      bot.pos.x += dir.x * 0.07
      bot.pos.z += dir.z * 0.07
      bot.rotY = Math.atan2(dir.x, dir.z)

      // Update ball position
      ballPos.set(bot.pos.x + dir.x * 0.5, bot.pos.y + 1, bot.pos.z + dir.z * 0.5)
      ballOwner = bot.id

      // Shoot when close
      bot.shootTimer--
      if (dist < 7 || bot.shootTimer <= 0) {
        // Bot shoots
        const shootDir = targetHoop.clone().sub(bot.pos).normalize()
        const power = 0.6 + Math.random() * 0.3
        ballVel.set(
          shootDir.x * power * 0.3,
          0.22 + power * 0.12,
          shootDir.z * power * 0.3,
        )
        bot.hasBall = false
        ballOwner = null
        ballInAir = true
        bot.shootTimer = 90 + Math.floor(Math.random() * 60)
      }
    } else if (!ballOwner && !ballInAir) {
      // Go for loose ball
      const toBall = ballPos.clone().sub(bot.pos)
      toBall.y = 0
      if (toBall.length() < 1.5) {
        bot.hasBall = true
        ballOwner = bot.id
      } else {
        const dir = toBall.normalize()
        bot.pos.x += dir.x * 0.06
        bot.pos.z += dir.z * 0.06
        bot.rotY = Math.atan2(dir.x, dir.z)
      }
    } else {
      // Move to position
      const targetPos = bot.team === 'home'
        ? new THREE.Vector3((Math.random() - 0.5) * 10, 0, -3 + Math.random() * 8)
        : new THREE.Vector3((Math.random() - 0.5) * 10, 0, -5 - Math.random() * 8)

      if (!bot.target.length() || bot.pos.distanceTo(bot.target) < 1) {
        bot.target.copy(targetPos)
      }

      const dir = bot.target.clone().sub(bot.pos)
      dir.y = 0
      if (dir.length() > 0.5) {
        dir.normalize()
        bot.pos.x += dir.x * 0.04
        bot.pos.z += dir.z * 0.04
        bot.rotY = Math.atan2(dir.x, dir.z)
      }

      // Try steal from player
      if (ballOwner === 'player' && bot.team === 'away') {
        const toPlayer = playerPos.clone().sub(bot.pos)
        toPlayer.y = 0
        if (toPlayer.length() < 1.5 && Math.random() < 0.02) {
          ballOwner = bot.id
          bot.hasBall = true
        } else if (toPlayer.length() < 8) {
          const chase = toPlayer.normalize()
          bot.pos.x += chase.x * 0.06
          bot.pos.z += chase.z * 0.06
          bot.rotY = Math.atan2(chase.x, chase.z)
        }
      }
    }

    // Bounds
    bot.pos.x = Math.max(-13, Math.min(13, bot.pos.x))
    bot.pos.z = Math.max(-14.5, Math.min(14.5, bot.pos.z))
  }
}

function createBotMesh(bot: Bot): THREE.Group {
  const group = new THREE.Group()
  const isHome = bot.team === 'home'

  const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.7, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: isHome ? '#2563eb' : '#dc2626', roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1.1; body.castShadow = true
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.28, 12, 12)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ffd5b4', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.85; head.castShadow = true
  group.add(head)

  // Shorts
  const shortGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.4, 8)
  const shortMat = new THREE.MeshStandardMaterial({ color: isHome ? '#1d4ed8' : '#b91c1c' })
  const shorts = new THREE.Mesh(shortGeo, shortMat)
  shorts.position.y = 0.5
  group.add(shorts)

  // Name
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, 256, 48)
  ctx.fillStyle = isHome ? '#60a5fa' : '#f87171'
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(bot.name, 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
  sprite.position.y = 2.3; sprite.scale.set(2, 0.4, 1)
  group.add(sprite)

  group.position.copy(bot.pos)
  return group
}

function updateBotMeshes() {
  for (const bot of bots) {
    if (!bot.mesh) {
      bot.mesh = createBotMesh(bot)
      scene.add(bot.mesh)
    }
    bot.mesh.position.lerp(bot.pos, 0.3)
    bot.mesh.rotation.y = bot.rotY
  }
}

// ========== INPUT ==========
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyE') trySteal()
  if (e.code === 'Space') { e.preventDefault(); doJump() }
  if (e.code === 'Escape') leaveGame()
}
function onKeyUp(e: KeyboardEvent) {
  keys[e.code] = false
}
function onMouseDown() {
  canvasContainer.value?.requestPointerLock?.()
  if (ballOwner === 'player') startShot()
}
function onMouseUp() {
  if (isAiming.value) releaseShot()
}
function onMouseMove(e: MouseEvent) {
  if (document.pointerLockElement) {
    yaw -= e.movementX * MOUSE_SENS
    pitch -= e.movementY * MOUSE_SENS
    pitch = Math.max(-0.5, Math.min(0.8, pitch))
  }
}

function startShot() {
  if (ballOwner !== 'player') return
  isAiming.value = true
  shotPower.value = 0
  powerTimer = setInterval(() => {
    shotPower.value = Math.min(100, shotPower.value + 2)
  }, 16) as unknown as number
}

function releaseShot() {
  if (powerTimer) clearInterval(powerTimer)
  if (isAiming.value) shootBall()
  isAiming.value = false
}

function tDown(dir: string) { touchKeys[dir] = true }
function tUp(dir: string) { touchKeys[dir] = false }

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  const saved = localStorage.getItem('bballName')
  if (saved) playerName.value = saved
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Basketball')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Basketball')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (isOnline) remove(dbRef(db, `basketball/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (gameTimer) clearInterval(gameTimer)
  if (powerTimer) clearInterval(powerTimer)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  document.exitPointerLock?.()
})
</script>

<style scoped>
.bball-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* MENU */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a0a00, #4a2000, #8a4000);
}
.menu-card {
  background: rgba(0,0,0,0.7); border-radius: 24px; padding: 44px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #ff8c00; max-width: 400px; width: 90%;
  backdrop-filter: blur(10px);
}
.menu-icon { font-size: 72px; animation: bounce-ball 0.8s ease-in-out infinite alternate; }
@keyframes bounce-ball { from { transform: translateY(0); } to { transform: translateY(-12px); } }
.menu-title { color: #ff8c00; font-size: 36px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #d4a373; font-size: 16px; margin: 0 0 24px; }
.menu-input {
  width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #5a3000;
  background: #1a0a00; color: #fff; font-size: 16px; outline: none; margin-bottom: 16px;
  box-sizing: border-box;
}
.menu-input:focus { border-color: #ff8c00; }
.menu-buttons { display: flex; flex-direction: column; gap: 10px; }
.menu-btn {
  padding: 16px; border-radius: 14px; border: none; font-size: 18px;
  font-weight: 800; cursor: pointer; transition: transform 0.15s;
}
.menu-btn:hover { transform: translateY(-2px); }
.menu-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.online-btn { background: linear-gradient(135deg, #ff8c00, #ff6b00); color: #fff; }
.bot-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.back-link { display: block; margin-top: 16px; background: none; border: none; color: #8a6040; font-size: 14px; cursor: pointer; }

/* GAME */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.canvas-container { width: 100%; height: 100%; }

/* Scoreboard */
.scoreboard {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0; z-index: 10;
  background: rgba(0,0,0,0.8); border-radius: 12px; overflow: hidden;
  border: 2px solid #444;
}
.score-team {
  padding: 8px 20px; display: flex; flex-direction: column; align-items: center;
}
.score-team.home { background: rgba(37,99,235,0.3); }
.score-team.away { background: rgba(220,38,38,0.3); }
.team-label { font-size: 10px; font-weight: 700; color: #aaa; letter-spacing: 1px; }
.team-score { font-size: 28px; font-weight: 900; color: #fff; }
.score-timer {
  padding: 8px 16px; font-size: 18px; font-weight: 800; color: #fbbf24;
  border-left: 1px solid #444; border-right: 1px solid #444;
}

/* Power Meter */
.power-meter {
  position: fixed; right: 30px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 10;
}
.power-bar {
  width: 20px; height: 150px; background: #333; border-radius: 10px;
  overflow: hidden; position: relative; border: 2px solid #555;
}
.power-fill {
  position: absolute; bottom: 0; width: 100%;
  background: linear-gradient(180deg, #ef4444, #f59e0b, #22c55e);
  border-radius: 8px; transition: height 0.05s;
}
.power-label { font-size: 10px; font-weight: 800; color: #fff; }

/* Ball indicator */
.ball-indicator {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); color: #ff8c00; padding: 6px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 700; z-index: 10;
}

/* Scored */
.scored-alert {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 20; pointer-events: none; animation: score-pop 0.4s ease-out;
}
@keyframes score-pop { from { transform: translate(-50%,-50%) scale(0.5); opacity: 0; } to { transform: translate(-50%,-50%) scale(1); opacity: 1; } }
.scored-text {
  background: linear-gradient(135deg, #ff8c00, #ff6b00);
  color: #fff; padding: 20px 40px; border-radius: 16px;
  font-size: 32px; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
  box-shadow: 0 8px 30px rgba(255,140,0,0.5);
}

/* Controls */
.controls-hint {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); color: #94a3b8; padding: 8px 16px; border-radius: 8px;
  font-size: 11px; z-index: 10; pointer-events: none;
}

.leave-area { position: fixed; top: 12px; left: 12px; z-index: 10; }
.leave-btn {
  background: rgba(0,0,0,0.5); color: #fff; border: none; padding: 6px 14px;
  border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.leave-btn:hover { background: rgba(220,38,38,0.7); }

/* Mobile */
.mobile-controls {
  display: none; position: fixed; bottom: 10px; left: 0; right: 0;
  justify-content: space-between; padding: 0 16px; z-index: 10; pointer-events: none;
}
.mobile-left, .mobile-right { pointer-events: auto; }
.dpad { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dp-mid { display: flex; gap: 4px; }
.dp-center { width: 48px; height: 48px; }
.dp {
  width: 50px; height: 50px; border-radius: 10px;
  background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3);
  color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.dp:active { background: rgba(255,255,255,0.4); }
.mobile-right { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.m-btn {
  width: 60px; height: 60px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
  font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.shoot-btn { background: rgba(255,140,0,0.4); }
.steal-btn { background: rgba(255,255,255,0.15); color: #fff; font-size: 18px; font-weight: 800; width: 50px; height: 50px; }
.jump-btn { background: rgba(255,255,255,0.15); width: 50px; height: 50px; }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: flex; }
}
</style>
