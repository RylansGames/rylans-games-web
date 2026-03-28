<template>
  <div class="tag-app">
    <!-- Join Screen -->
    <div v-if="screen === 'join'" class="join-screen">
      <div class="join-card">
        <div class="join-logo">🏝️</div>
        <h1 class="join-title">Island Tag</h1>
        <p class="join-sub">Run, hide, and survive on the island!</p>
        <div class="join-form">
          <input
            v-model="playerName"
            type="text"
            placeholder="Enter your name"
            maxlength="16"
            class="join-input"
            @keydown.enter="joinGame"
          />
          <button class="join-btn" @click="joinGame" :disabled="!playerName.trim()">
            Join Game
          </button>
        </div>
        <button class="back-btn" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else class="game-screen">
      <!-- HUD -->
      <div class="hud">
        <div class="hud-left">
          <div class="hud-item" :class="{ 'is-it': myPlayer?.isIt }">
            {{ myPlayer?.isIt ? '🔴 YOU ARE IT!' : '🟢 RUN!' }}
          </div>
          <div class="hud-item hud-timer">⏱️ {{ formatTime(gameTimer) }}</div>
        </div>
        <div class="hud-center">
          <div class="hud-players">
            <div
              v-for="p in allPlayers"
              :key="p.id"
              class="hud-player"
              :class="{ it: p.isIt }"
            >
              <span class="hp-dot" :style="{ background: p.color }"></span>
              {{ p.name }} {{ p.isIt ? '(IT)' : '' }}
            </div>
          </div>
        </div>
        <div class="hud-right">
          <button class="hud-btn" @click="leaveGame">Leave</button>
        </div>
      </div>

      <!-- 3D Canvas -->
      <div ref="canvasContainer" class="canvas-container"></div>

      <!-- Mobile Controls -->
      <div class="mobile-controls">
        <div class="dpad">
          <button class="dpad-btn up" @touchstart.prevent="touchDir('up')" @touchend.prevent="touchEnd('up')">▲</button>
          <div class="dpad-mid">
            <button class="dpad-btn left" @touchstart.prevent="touchDir('left')" @touchend.prevent="touchEnd('left')">◀</button>
            <div class="dpad-center"></div>
            <button class="dpad-btn right" @touchstart.prevent="touchDir('right')" @touchend.prevent="touchEnd('right')">▶</button>
          </div>
          <button class="dpad-btn down" @touchstart.prevent="touchDir('down')" @touchend.prevent="touchEnd('down')">▼</button>
        </div>
        <button class="sprint-btn" @touchstart.prevent="touchSprint(true)" @touchend.prevent="touchSprint(false)">
          🏃 Sprint
        </button>
      </div>

      <!-- Tag Alert -->
      <div v-if="tagAlert" class="tag-alert" :class="tagAlert.type">
        {{ tagAlert.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../firebase'
import { ref as dbRef, push, onValue, set, remove, onDisconnect, get } from 'firebase/database'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()

// State
const screen = ref<'join' | 'game'>('join')
const playerName = ref('')
const canvasContainer = ref<HTMLElement | null>(null)
const gameTimer = ref(0)
const tagAlert = ref<{ text: string; type: string } | null>(null)

interface Player {
  id: string
  name: string
  x: number
  y: number
  z: number
  rotY: number
  isIt: boolean
  color: string
  speed: number
  lastTag: number
}

const myId = ref('')
const myPlayer = ref<Player | null>(null)
const allPlayers = ref<Player[]>([])

// Three.js
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number
let playerMeshes: Map<string, THREE.Group> = new Map()
let nameSprites: Map<string, THREE.Sprite> = new Map()

// Input
const keys: Record<string, boolean> = {}
const touchKeys: Record<string, boolean> = {}
let isSprinting = false
let cameraAngle = 0 // Camera orbit angle around player

// Constants
const ISLAND_RADIUS = 60
const WALK_SPEED = 0.15
const SPRINT_SPEED = 0.28
const TAG_COOLDOWN = 2000
const TAG_DISTANCE = 3

const PLAYER_COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#e53e3e',
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ========== JOIN / LEAVE ==========
async function joinGame() {
  if (!playerName.value.trim()) return
  localStorage.setItem('tagName', playerName.value)

  myId.value = 'p-' + Math.random().toString(36).slice(2, 10)
  const color = getColor(playerName.value)

  // Check if anyone is "it"
  const snap = await get(dbRef(db, 'tag/players'))
  const existing = snap.val()
  let isIt = !existing || Object.keys(existing).length === 0

  const player: Player = {
    id: myId.value,
    name: playerName.value.trim(),
    x: (Math.random() - 0.5) * 40,
    y: 0,
    z: (Math.random() - 0.5) * 40,
    rotY: 0,
    isIt,
    color,
    speed: WALK_SPEED,
    lastTag: 0,
  }

  myPlayer.value = player
  const playerRef = dbRef(db, `tag/players/${myId.value}`)
  set(playerRef, player)
  onDisconnect(playerRef).remove()

  screen.value = 'game'
  nextTick(() => initThree())

  // Listen for players
  onValue(dbRef(db, 'tag/players'), (snapshot) => {
    const data = snapshot.val()
    if (!data) { allPlayers.value = []; return }
    allPlayers.value = Object.values(data) as Player[]
    const me = allPlayers.value.find(p => p.id === myId.value)
    if (me) myPlayer.value = me
    updatePlayerMeshes()
  })
}

function leaveGame() {
  remove(dbRef(db, `tag/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  screen.value = 'join'
}

// ========== THREE.JS SETUP ==========
function initThree() {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()

  // Sky
  scene.background = new THREE.Color('#87CEEB')
  scene.fog = new THREE.Fog('#87CEEB', 80, 150)

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 12, 18)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Lights
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.6)
  scene.add(ambientLight)

  const sunLight = new THREE.DirectionalLight('#fff5e0', 1.2)
  sunLight.position.set(40, 60, 30)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width = 2048
  sunLight.shadow.mapSize.height = 2048
  sunLight.shadow.camera.near = 1
  sunLight.shadow.camera.far = 150
  sunLight.shadow.camera.left = -80
  sunLight.shadow.camera.right = 80
  sunLight.shadow.camera.top = 80
  sunLight.shadow.camera.bottom = -80
  scene.add(sunLight)

  // Ocean
  const oceanGeo = new THREE.CircleGeometry(150, 64)
  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#1a8fb5',
    transparent: true,
    opacity: 0.85,
    roughness: 0.2,
    metalness: 0.1,
  })
  const ocean = new THREE.Mesh(oceanGeo, oceanMat)
  ocean.rotation.x = -Math.PI / 2
  ocean.position.y = -0.5
  scene.add(ocean)

  // Island - main land
  createIsland()

  // Palm trees
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 15 + Math.random() * 35
    const x = Math.cos(angle) * dist
    const z = Math.sin(angle) * dist
    if (getTerrainHeight(x, z) > 0) {
      createPalmTree(x, z)
    }
  }

  // Rocks
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * 45
    const x = Math.cos(angle) * dist
    const z = Math.sin(angle) * dist
    if (getTerrainHeight(x, z) > -0.3) {
      createRock(x, z)
    }
  }

  // Beach huts
  createBeachHut(-20, 8)
  createBeachHut(25, -15)

  // Start game loop
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  gameLoop()
  startTimer()
}

function createIsland() {
  // Sandy beach ring
  const beachGeo = new THREE.CircleGeometry(ISLAND_RADIUS + 5, 64)
  const beachMat = new THREE.MeshStandardMaterial({ color: '#f4d699', roughness: 0.9 })
  const beach = new THREE.Mesh(beachGeo, beachMat)
  beach.rotation.x = -Math.PI / 2
  beach.position.y = -0.2
  beach.receiveShadow = true
  scene.add(beach)

  // Grass island
  const islandShape = new THREE.Shape()
  const segments = 32
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const r = ISLAND_RADIUS * (0.7 + 0.3 * Math.sin(angle * 3 + 1) * Math.cos(angle * 2 + 0.5))
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (i === 0) islandShape.moveTo(x, z)
    else islandShape.lineTo(x, z)
  }

  const extrudeSettings = { depth: 1.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 2, bevelSegments: 3 }
  const islandGeo = new THREE.ExtrudeGeometry(islandShape, extrudeSettings)
  const islandMat = new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.8 })
  const island = new THREE.Mesh(islandGeo, islandMat)
  island.rotation.x = -Math.PI / 2
  island.position.y = -0.5
  island.receiveShadow = true
  island.castShadow = true
  scene.add(island)

  // Dirt underneath
  const dirtGeo = new THREE.CylinderGeometry(ISLAND_RADIUS - 2, ISLAND_RADIUS - 5, 3, 32)
  const dirtMat = new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 1 })
  const dirt = new THREE.Mesh(dirtGeo, dirtMat)
  dirt.position.y = -2
  dirt.receiveShadow = true
  scene.add(dirt)
}

function createPalmTree(x: number, z: number) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  // Trunk - curved
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, 3, 0.3),
    new THREE.Vector3(0.3, 6, -0.2),
    new THREE.Vector3(-0.2, 8 + Math.random() * 2, 0.1),
  ])
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.3, 8, false)
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.9 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.castShadow = true
  group.add(trunk)

  // Palm leaves
  const topPos = trunkCurve.getPoint(1)
  for (let i = 0; i < 7; i++) {
    const leafAngle = (i / 7) * Math.PI * 2
    const leafGeo = new THREE.PlaneGeometry(4, 1.2)
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#22c55e',
      side: THREE.DoubleSide,
      roughness: 0.7,
    })
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.position.copy(topPos)
    leaf.position.x += Math.cos(leafAngle) * 1.5
    leaf.position.z += Math.sin(leafAngle) * 1.5
    leaf.rotation.z = Math.PI * 0.25
    leaf.rotation.y = leafAngle
    leaf.castShadow = true
    group.add(leaf)
  }

  // Coconuts
  for (let i = 0; i < 3; i++) {
    const coconutGeo = new THREE.SphereGeometry(0.2, 8, 8)
    const coconutMat = new THREE.MeshStandardMaterial({ color: '#8B4513' })
    const coconut = new THREE.Mesh(coconutGeo, coconutMat)
    coconut.position.copy(topPos)
    coconut.position.x += (Math.random() - 0.5) * 0.8
    coconut.position.y -= 0.3
    coconut.position.z += (Math.random() - 0.5) * 0.8
    group.add(coconut)
  }

  scene.add(group)
}

function createRock(x: number, z: number) {
  const size = 0.5 + Math.random() * 1.5
  const geo = new THREE.DodecahedronGeometry(size, 1)
  // Distort vertices for natural look
  const positions = geo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.3)
    positions.setY(i, positions.getY(i) * (0.5 + Math.random() * 0.3))
    positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.3)
  }
  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#888').lerp(new THREE.Color('#666'), Math.random()),
    roughness: 0.95,
    flatShading: true,
  })
  const rock = new THREE.Mesh(geo, mat)
  rock.position.set(x, size * 0.3, z)
  rock.rotation.y = Math.random() * Math.PI
  rock.castShadow = true
  rock.receiveShadow = true
  scene.add(rock)
}

function createBeachHut(x: number, z: number) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  // Poles
  for (let i = 0; i < 4; i++) {
    const px = (i % 2 === 0 ? -1.5 : 1.5)
    const pz = (i < 2 ? -1.5 : 1.5)
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 3, 8)
    const poleMat = new THREE.MeshStandardMaterial({ color: '#8B6914' })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(px, 1.5, pz)
    pole.castShadow = true
    group.add(pole)
  }

  // Roof
  const roofGeo = new THREE.ConeGeometry(3, 1.5, 4)
  const roofMat = new THREE.MeshStandardMaterial({ color: '#d4a854', roughness: 0.9 })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.set(0, 3.5, 0)
  roof.rotation.y = Math.PI / 4
  roof.castShadow = true
  group.add(roof)

  scene.add(group)
}

function getTerrainHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z)
  if (dist > ISLAND_RADIUS) return -1
  if (dist > ISLAND_RADIUS - 5) return -0.2
  return 0.5
}

// ========== PLAYER MESHES ==========
function createPlayerMesh(player: Player): THREE.Group {
  const group = new THREE.Group()

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: player.color, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1.2
  body.castShadow = true
  group.add(body)

  // Head
  const headGeo = new THREE.SphereGeometry(0.35, 16, 16)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ffd5b4', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 2.1
  head.castShadow = true
  group.add(head)

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8)
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' })
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(-0.12, 2.15, 0.3)
  group.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.12, 2.15, 0.3)
  group.add(rightEye)

  // "IT" glow ring
  if (player.isIt) {
    const ringGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 32)
    const ringMat = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 0.8 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = 2.6
    ring.rotation.x = Math.PI / 2
    group.add(ring)
  }

  // Name tag
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = player.isIt ? '#ff0000' : '#000000'
  ctx.globalAlpha = 0.6
  ctx.fillRect(0, 0, 256, 64)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(player.name, 128, 42)

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 3
  sprite.scale.set(2.5, 0.6, 1)
  group.add(sprite)

  group.position.set(player.x, 0, player.z)
  group.rotation.y = player.rotY || 0
  return group
}

function updatePlayerMeshes() {
  const currentIds = new Set(allPlayers.value.map(p => p.id))

  // Remove old meshes
  for (const [id, mesh] of playerMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(mesh)
      playerMeshes.delete(id)
    }
  }

  // Add/update meshes
  for (const player of allPlayers.value) {
    if (player.id === myId.value) continue // Don't show own mesh in third person offset

    let mesh = playerMeshes.get(player.id)
    if (!mesh) {
      mesh = createPlayerMesh(player)
      scene.add(mesh)
      playerMeshes.set(player.id, mesh)
    }

    // Update position smoothly
    mesh.position.lerp(new THREE.Vector3(player.x, 0, player.z), 0.3)
    mesh.rotation.y = player.rotY || 0

    // Update IT status - rebuild if changed
    const wasIt = mesh.userData.isIt
    if (wasIt !== player.isIt) {
      scene.remove(mesh)
      mesh = createPlayerMesh(player)
      mesh.userData.isIt = player.isIt
      scene.add(mesh)
      playerMeshes.set(player.id, mesh)
    }
  }
}

// ========== GAME LOOP ==========
let timerInterval: number

function startTimer() {
  timerInterval = setInterval(() => {
    gameTimer.value++
  }, 1000) as unknown as number
}

function gameLoop() {
  animFrame = requestAnimationFrame(gameLoop)

  if (!myPlayer.value) return

  // Get camera-relative directions
  const camForward = new THREE.Vector3()
  camera.getWorldDirection(camForward)
  camForward.y = 0
  camForward.normalize()

  const camRight = new THREE.Vector3()
  camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize()

  // Movement relative to camera
  let inputX = 0
  let inputZ = 0
  const sprint = isSprinting || keys['Shift'] || keys['ShiftLeft']
  const speed = sprint ? SPRINT_SPEED : WALK_SPEED

  if (keys['KeyW'] || keys['ArrowUp'] || touchKeys['up']) inputZ += 1
  if (keys['KeyS'] || keys['ArrowDown'] || touchKeys['down']) inputZ -= 1
  if (keys['KeyA'] || keys['ArrowLeft'] || touchKeys['left']) inputX -= 1
  if (keys['KeyD'] || keys['ArrowRight'] || touchKeys['right']) inputX += 1

  if (inputX !== 0 || inputZ !== 0) {
    const len = Math.sqrt(inputX * inputX + inputZ * inputZ)
    inputX /= len
    inputZ /= len

    // Convert input to world movement using camera direction
    const moveX = (camRight.x * inputX + camForward.x * inputZ) * speed
    const moveZ = (camRight.z * inputX + camForward.z * inputZ) * speed

    const newX = myPlayer.value.x + moveX
    const newZ = myPlayer.value.z + moveZ

    // Keep on island
    const dist = Math.sqrt(newX * newX + newZ * newZ)
    if (dist < ISLAND_RADIUS - 2) {
      myPlayer.value.x = newX
      myPlayer.value.z = newZ
      myPlayer.value.rotY = Math.atan2(moveX, moveZ)
    }

    // Sync to Firebase (throttled)
    syncPlayer()
  }

  // Check for tags
  if (myPlayer.value.isIt) {
    checkForTag()
  }

  // Camera: smooth third-person follow behind player
  const camDist = 10
  const camHeight = 6
  // Smoothly rotate camera angle to match player facing
  const targetAngle = myPlayer.value.rotY + Math.PI
  let angleDiff = targetAngle - cameraAngle
  // Wrap angle difference to -PI..PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
  cameraAngle += angleDiff * 0.05

  const camTargetX = myPlayer.value.x + Math.sin(cameraAngle) * camDist
  const camTargetZ = myPlayer.value.z + Math.cos(cameraAngle) * camDist

  camera.position.lerp(new THREE.Vector3(camTargetX, camHeight, camTargetZ), 0.12)
  camera.lookAt(new THREE.Vector3(myPlayer.value.x, 1.5, myPlayer.value.z))

  // Animate ocean
  const ocean = scene.children.find(c => (c as THREE.Mesh).geometry?.type === 'CircleGeometry') as THREE.Mesh
  if (ocean) ocean.position.y = -0.5 + Math.sin(Date.now() * 0.001) * 0.15

  renderer.render(scene, camera)
}

let lastSync = 0
function syncPlayer() {
  const now = Date.now()
  if (now - lastSync < 50) return // Max 20 syncs per second
  lastSync = now
  if (!myPlayer.value) return
  set(dbRef(db, `tag/players/${myId.value}`), myPlayer.value)
}

function checkForTag() {
  if (!myPlayer.value || !myPlayer.value.isIt) return
  const now = Date.now()
  if (now - myPlayer.value.lastTag < TAG_COOLDOWN) return

  for (const other of allPlayers.value) {
    if (other.id === myId.value || other.isIt) continue
    const dx = myPlayer.value.x - other.x
    const dz = myPlayer.value.z - other.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < TAG_DISTANCE) {
      // Tag them!
      myPlayer.value.isIt = false
      myPlayer.value.lastTag = now
      set(dbRef(db, `tag/players/${myId.value}`), myPlayer.value)
      set(dbRef(db, `tag/players/${other.id}/isIt`), true)
      set(dbRef(db, `tag/players/${other.id}/lastTag`), now)

      showTagAlert(`You tagged ${other.name}!`, 'tagged')
      break
    }
  }
}

function showTagAlert(text: string, type: string) {
  tagAlert.value = { text, type }
  setTimeout(() => { tagAlert.value = null }, 2000)
}

// ========== INPUT ==========
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
}

function onKeyUp(e: KeyboardEvent) {
  keys[e.code] = false
}

function touchDir(dir: string) {
  touchKeys[dir] = true
}

function touchEnd(dir: string) {
  touchKeys[dir] = false
}

function touchSprint(on: boolean) {
  isSprinting = on
}

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Watch for being tagged
let wasIt = false
setInterval(() => {
  if (!myPlayer.value) return
  if (myPlayer.value.isIt && !wasIt) {
    showTagAlert("You're IT! Catch someone!", 'youre-it')
  }
  wasIt = myPlayer.value.isIt
}, 500)

onMounted(() => {
  const saved = localStorage.getItem('tagName')
  if (saved) playerName.value = saved
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Island Tag')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Island Tag')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (myId.value) remove(dbRef(db, `tag/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.tag-app {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ===== JOIN SCREEN ===== */
.join-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c4a6e, #0ea5e9, #22d3ee);
}

.join-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 44px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 380px;
  width: 100%;
}

.join-logo { font-size: 72px; margin-bottom: 8px; }
.join-title { color: #0c4a6e; font-size: 32px; font-weight: 900; margin: 0 0 8px 0; }
.join-sub { color: #64748b; font-size: 15px; margin: 0 0 28px 0; }

.join-form { display: flex; flex-direction: column; gap: 12px; }

.join-input {
  padding: 14px 18px; border-radius: 14px; border: 2px solid #e2e8f0;
  font-size: 16px; outline: none; transition: border-color 0.2s;
  color: #1e293b;
}
.join-input:focus { border-color: #0ea5e9; }
.join-input::placeholder { color: #94a3b8; }

.join-btn {
  padding: 14px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  color: #fff; font-size: 17px; font-weight: 700;
  cursor: pointer; transition: transform 0.15s;
}
.join-btn:hover { transform: translateY(-2px); }
.join-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.back-btn {
  margin-top: 16px; background: none; border: none;
  color: #64748b; font-size: 14px; cursor: pointer;
}
.back-btn:hover { color: #0c4a6e; }

/* ===== GAME SCREEN ===== */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.canvas-container { width: 100%; height: 100%; }

/* HUD */
.hud {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; z-index: 10;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.hud-left, .hud-right { display: flex; gap: 10px; pointer-events: auto; }

.hud-item {
  background: rgba(0, 0, 0, 0.6); color: #fff;
  padding: 8px 16px; border-radius: 10px;
  font-size: 14px; font-weight: 700;
  backdrop-filter: blur(4px);
}

.hud-item.is-it {
  background: rgba(220, 38, 38, 0.8);
  animation: pulse-it 1s ease-in-out infinite alternate;
}

@keyframes pulse-it {
  from { box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }
  to { box-shadow: 0 0 20px rgba(220, 38, 38, 0.9); }
}

.hud-center { pointer-events: auto; }

.hud-players {
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
}

.hud-player {
  display: flex; align-items: center; gap: 5px;
  background: rgba(0, 0, 0, 0.5); padding: 4px 10px;
  border-radius: 8px; font-size: 12px; font-weight: 600; color: #fff;
}

.hud-player.it { background: rgba(220, 38, 38, 0.7); }

.hp-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.hud-btn {
  background: rgba(0, 0, 0, 0.6); color: #fff; border: none;
  padding: 8px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 700; cursor: pointer; pointer-events: auto;
}
.hud-btn:hover { background: rgba(220, 38, 38, 0.7); }

/* Tag Alert */
.tag-alert {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  padding: 20px 40px; border-radius: 16px;
  font-size: 28px; font-weight: 900; color: #fff;
  z-index: 20; animation: pop-in 0.3s ease-out;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.tag-alert.tagged { background: linear-gradient(135deg, #16a34a, #22c55e); }
.tag-alert.youre-it { background: linear-gradient(135deg, #dc2626, #ef4444); }

@keyframes pop-in {
  from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* Mobile Controls */
.mobile-controls {
  position: absolute; bottom: 20px; left: 0; right: 0;
  display: none; justify-content: space-between;
  padding: 0 24px; z-index: 10; pointer-events: none;
}

.dpad {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: auto;
}

.dpad-mid { display: flex; gap: 4px; align-items: center; }
.dpad-center { width: 48px; height: 48px; }

.dpad-btn {
  width: 52px; height: 52px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.25); border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff; font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px); pointer-events: auto;
}

.dpad-btn:active { background: rgba(255, 255, 255, 0.5); }

.sprint-btn {
  align-self: flex-end;
  padding: 16px 28px; border-radius: 16px;
  background: rgba(234, 179, 8, 0.4); border: 2px solid rgba(234, 179, 8, 0.5);
  color: #fff; font-size: 16px; font-weight: 700;
  cursor: pointer; pointer-events: auto;
  backdrop-filter: blur(4px);
}

.sprint-btn:active { background: rgba(234, 179, 8, 0.7); }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: flex; }
}
</style>
