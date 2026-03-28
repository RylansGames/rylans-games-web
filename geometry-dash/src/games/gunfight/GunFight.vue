<template>
  <div class="gun-app">
    <!-- MENU -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🔫</div>
        <h1 class="menu-title">Gun Fight</h1>
        <p class="menu-sub">1v1 Arena Shooter</p>
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
      <!-- 3D Canvas -->
      <div ref="canvasContainer" class="canvas-container" @click="lockPointer"></div>

      <!-- Crosshair -->
      <div class="crosshair">
        <div class="cross-h"></div>
        <div class="cross-v"></div>
      </div>

      <!-- HUD -->
      <div class="hud-top">
        <div class="hud-score">
          <span class="score-you">{{ myKills }}</span>
          <span class="score-sep">-</span>
          <span class="score-enemy">{{ enemyKills }}</span>
        </div>
      </div>

      <div class="hud-bottom">
        <div class="health-bar-container">
          <div class="health-bar" :style="{ width: health + '%' }"></div>
          <span class="health-text">{{ health }} HP</span>
        </div>
        <div class="ammo-display">
          <span class="ammo-icon">🔫</span>
          <span class="ammo-count">{{ ammo }} / {{ maxAmmo }}</span>
        </div>
      </div>

      <!-- Hit marker -->
      <div v-if="showHitMarker" class="hit-marker">✕</div>

      <!-- Kill feed -->
      <div class="kill-feed">
        <div v-for="(msg, i) in killFeed" :key="i" class="kill-msg">{{ msg }}</div>
      </div>

      <!-- Death screen -->
      <div v-if="isDead" class="death-overlay">
        <div class="death-text">YOU DIED</div>
        <div class="respawn-timer">Respawning in {{ respawnTimer }}...</div>
      </div>

      <!-- Damage flash -->
      <div v-if="damageFlash" class="damage-flash"></div>

      <!-- Controls info -->
      <div class="controls-info" v-if="showControls">
        <div>WASD - Move | Mouse - Look | Click - Shoot | R - Reload | Space - Jump</div>
        <div>Click anywhere to lock mouse</div>
      </div>

      <!-- Leave button -->
      <div class="leave-area">
        <button class="leave-btn" @click="leaveGame">ESC Leave</button>
      </div>

      <!-- Mobile controls -->
      <div class="mobile-controls">
        <div class="mobile-left">
          <div class="joystick" ref="joystickArea"
            @touchstart.prevent="joystickStart"
            @touchmove.prevent="joystickMove"
            @touchend.prevent="joystickEnd">
            <div class="joystick-knob" :style="{ transform: `translate(${joystickX}px, ${joystickY}px)` }"></div>
          </div>
        </div>
        <div class="mobile-right">
          <button class="mobile-shoot" @touchstart.prevent="mobileShoot" @touchend.prevent="mobileShootEnd">🔫</button>
          <button class="mobile-reload" @touchstart.prevent="reload">R</button>
          <button class="mobile-jump" @touchstart.prevent="jump">⬆</button>
        </div>
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
const screen = ref<'menu' | 'game'>('menu')
const playerName = ref('')
const health = ref(100)
const ammo = ref(30)
const maxAmmo = 30
const myKills = ref(0)
const enemyKills = ref(0)
const showHitMarker = ref(false)
const isDead = ref(false)
const respawnTimer = ref(3)
const damageFlash = ref(false)
const showControls = ref(true)
const killFeed = ref<string[]>([])
const canvasContainer = ref<HTMLElement | null>(null)
const joystickX = ref(0)
const joystickY = ref(0)

let isOnline = false
let isBotMode = false
const myId = ref('')

// Three.js
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number

// Player physics
let playerPos = new THREE.Vector3(0, 1.7, 0)
let playerVel = new THREE.Vector3(0, 0, 0)
let yaw = 0
let pitch = 0
let isJumping = false
let onGround = true
const GRAVITY = -0.015
const JUMP_FORCE = 0.25
const MOVE_SPEED = 0.12
const MOUSE_SENS = 0.002

// Input
const keys: Record<string, boolean> = {}
let mouseDown = false
let shootCooldown = 0
let reloading = false

// Enemies (bots or online players)
interface Enemy {
  id: string
  name: string
  pos: THREE.Vector3
  rotY: number
  health: number
  mesh: THREE.Group | null
  isBot: boolean
  botState: string
  botTarget: THREE.Vector3
  botShootTimer: number
  lastDamageTime: number
}

let enemies: Enemy[] = []
let bulletTrails: { line: THREE.Line; time: number }[] = []

// ========== JOIN ==========
function joinOnline() {
  if (!playerName.value.trim()) return
  localStorage.setItem('gunName', playerName.value)
  isOnline = true
  isBotMode = false
  myId.value = 'gp-' + Math.random().toString(36).slice(2, 10)
  screen.value = 'game'
  nextTick(() => initGame())
}

function playBots() {
  if (!playerName.value.trim()) return
  localStorage.setItem('gunName', playerName.value)
  isOnline = false
  isBotMode = true
  myId.value = 'local'
  screen.value = 'game'
  nextTick(() => {
    initGame()
    spawnBots()
  })
}

function leaveGame() {
  if (isOnline) remove(dbRef(db, `gunfight/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  document.exitPointerLock?.()
  screen.value = 'menu'
}

function spawnBots() {
  const botNames = ['ShadowX', 'ProSniper', 'DeathBot', 'GhostAim', 'NoScope420']
  const count = 3
  for (let i = 0; i < count; i++) {
    const spawnPos = getSpawnPoint()
    enemies.push({
      id: 'bot-' + i,
      name: botNames[i],
      pos: spawnPos.clone(),
      rotY: Math.random() * Math.PI * 2,
      health: 100,
      mesh: null,
      isBot: true,
      botState: 'patrol',
      botTarget: getRandomPoint(),
      botShootTimer: 0,
      lastDamageTime: 0,
    })
  }
  updateEnemyMeshes()
}

function getSpawnPoint(): THREE.Vector3 {
  const spawns = [
    new THREE.Vector3(-15, 1.7, -15),
    new THREE.Vector3(15, 1.7, -15),
    new THREE.Vector3(-15, 1.7, 15),
    new THREE.Vector3(15, 1.7, 15),
    new THREE.Vector3(0, 1.7, -20),
    new THREE.Vector3(0, 1.7, 20),
  ]
  return spawns[Math.floor(Math.random() * spawns.length)]
}

function getRandomPoint(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 36,
    1.7,
    (Math.random() - 0.5) * 36,
  )
}

// ========== THREE.JS ==========
function initGame() {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#4a6d8c')
  scene.fog = new THREE.Fog('#4a6d8c', 30, 80)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.copy(playerPos)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight('#b0c4de', 0.6)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight('#fff5e0', 1.2)
  sun.position.set(20, 30, 10)
  sun.castShadow = true
  sun.shadow.mapSize.width = 2048
  sun.shadow.mapSize.height = 2048
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 80
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  scene.add(sun)

  buildArena()

  // Spawn player
  const spawn = getSpawnPoint()
  playerPos.copy(spawn)

  // Input
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)

  // Online listeners
  if (isOnline) {
    const playerRef = dbRef(db, `gunfight/players/${myId.value}`)
    set(playerRef, {
      name: playerName.value, x: playerPos.x, y: playerPos.y, z: playerPos.z,
      rotY: yaw, health: 100, kills: 0,
    })
    onDisconnect(playerRef).remove()

    onValue(dbRef(db, 'gunfight/players'), (snap) => {
      const data = snap.val()
      if (!data) return
      for (const [id, val] of Object.entries(data) as [string, any][]) {
        if (id === myId.value) continue
        let enemy = enemies.find(e => e.id === id)
        if (!enemy) {
          enemy = {
            id, name: val.name, pos: new THREE.Vector3(val.x, val.y, val.z),
            rotY: val.rotY, health: val.health, mesh: null, isBot: false,
            botState: '', botTarget: new THREE.Vector3(), botShootTimer: 0, lastDamageTime: 0,
          }
          enemies.push(enemy)
        } else {
          enemy.pos.set(val.x, val.y, val.z)
          enemy.rotY = val.rotY
          enemy.health = val.health
        }
      }
      updateEnemyMeshes()
    })
  }

  setTimeout(() => { showControls.value = false }, 5000)
  gameLoop()
}

function buildArena() {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(50, 50)
  const floorMat = new THREE.MeshStandardMaterial({ color: '#555566', roughness: 0.9 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Walls around arena
  const wallMat = new THREE.MeshStandardMaterial({ color: '#3a3a4a', roughness: 0.8 })
  const wallHeight = 6
  const arenaSize = 25

  const wallConfigs = [
    { pos: [0, wallHeight / 2, -arenaSize], size: [arenaSize * 2, wallHeight, 0.5] },
    { pos: [0, wallHeight / 2, arenaSize], size: [arenaSize * 2, wallHeight, 0.5] },
    { pos: [-arenaSize, wallHeight / 2, 0], size: [0.5, wallHeight, arenaSize * 2] },
    { pos: [arenaSize, wallHeight / 2, 0], size: [0.5, wallHeight, arenaSize * 2] },
  ]

  for (const w of wallConfigs) {
    const geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2])
    const mesh = new THREE.Mesh(geo, wallMat)
    mesh.position.set(w.pos[0], w.pos[1], w.pos[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  // Cover objects - boxes and walls
  const coverMat = new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.85 })
  const coverMat2 = new THREE.MeshStandardMaterial({ color: '#4a5a6a', roughness: 0.8 })

  const covers = [
    // Center structure
    { pos: [0, 1.5, 0], size: [4, 3, 4], mat: coverMat2 },
    // Corner covers
    { pos: [-12, 1, -12], size: [3, 2, 3], mat: coverMat },
    { pos: [12, 1, -12], size: [3, 2, 3], mat: coverMat },
    { pos: [-12, 1, 12], size: [3, 2, 3], mat: coverMat },
    { pos: [12, 1, 12], size: [3, 2, 3], mat: coverMat },
    // Side walls
    { pos: [-8, 1.5, 0], size: [1, 3, 6], mat: coverMat2 },
    { pos: [8, 1.5, 0], size: [1, 3, 6], mat: coverMat2 },
    { pos: [0, 1.5, -10], size: [6, 3, 1], mat: coverMat2 },
    { pos: [0, 1.5, 10], size: [6, 3, 1], mat: coverMat2 },
    // Small boxes
    { pos: [-5, 0.5, -6], size: [2, 1, 2], mat: coverMat },
    { pos: [5, 0.5, 6], size: [2, 1, 2], mat: coverMat },
    { pos: [-18, 0.5, -5], size: [2, 1, 1], mat: coverMat },
    { pos: [18, 0.5, 5], size: [2, 1, 1], mat: coverMat },
    // Ramps
    { pos: [-15, 0.75, 0], size: [3, 1.5, 3], mat: coverMat },
    { pos: [15, 0.75, 0], size: [3, 1.5, 3], mat: coverMat },
  ]

  for (const c of covers) {
    const geo = new THREE.BoxGeometry(c.size[0], c.size[1], c.size[2])
    const mesh = new THREE.Mesh(geo, c.mat)
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.isCollider = true
    scene.add(mesh)
  }

  // Barrel props
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.7 })
  const barrelPositions = [[-6, 0, -15], [7, 0, 14], [-17, 0, 10], [16, 0, -8]]
  for (const [x, _, z] of barrelPositions) {
    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12)
    const barrel = new THREE.Mesh(barrelGeo, barrelMat)
    barrel.position.set(x, 0.6, z)
    barrel.castShadow = true
    scene.add(barrel)
  }

  // Lights in arena
  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffff00', emissive: '#ffff00', emissiveIntensity: 0.5 })
  const lampPositions = [[-10, 5, -10], [10, 5, -10], [-10, 5, 10], [10, 5, 10]]
  for (const [x, y, z] of lampPositions) {
    const lampGeo = new THREE.SphereGeometry(0.3, 8, 8)
    const lamp = new THREE.Mesh(lampGeo, lampMat)
    lamp.position.set(x, y, z)
    scene.add(lamp)

    const light = new THREE.PointLight('#ffd080', 0.8, 15)
    light.position.set(x, y, z)
    scene.add(light)
  }
}

// ========== ENEMY MESHES ==========
function createEnemyMesh(enemy: Enemy): THREE.Group {
  const group = new THREE.Group()

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.7, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#cc3333', roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1.1
  body.castShadow = true
  group.add(body)

  // Head
  const headGeo = new THREE.SphereGeometry(0.28, 12, 12)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ffd5b4', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.85
  head.castShadow = true
  group.add(head)

  // Gun
  const gunGeo = new THREE.BoxGeometry(0.1, 0.1, 0.5)
  const gunMat = new THREE.MeshStandardMaterial({ color: '#222' })
  const gun = new THREE.Mesh(gunGeo, gunMat)
  gun.position.set(0.35, 1.2, -0.3)
  group.add(gun)

  // Name tag
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, 256, 48)
  ctx.fillStyle = '#ff4444'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(enemy.name, 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 2.4
  sprite.scale.set(2, 0.4, 1)
  group.add(sprite)

  // Health bar
  const hbBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.08),
    new THREE.MeshBasicMaterial({ color: '#333' })
  )
  hbBg.position.y = 2.15
  group.add(hbBg)

  const hbFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.08),
    new THREE.MeshBasicMaterial({ color: '#22cc22' })
  )
  hbFill.position.y = 2.15
  hbFill.position.z = 0.01
  hbFill.name = 'healthBar'
  group.add(hbFill)

  group.position.copy(enemy.pos)
  group.rotation.y = enemy.rotY
  return group
}

function updateEnemyMeshes() {
  for (const enemy of enemies) {
    if (!enemy.mesh) {
      enemy.mesh = createEnemyMesh(enemy)
      scene.add(enemy.mesh)
    }

    enemy.mesh.position.lerp(enemy.pos, 0.3)
    enemy.mesh.rotation.y = enemy.rotY

    // Update health bar
    const hb = enemy.mesh.getObjectByName('healthBar') as THREE.Mesh
    if (hb) {
      hb.scale.x = Math.max(0, enemy.health / 100)
      ;(hb.material as THREE.MeshBasicMaterial).color.set(
        enemy.health > 50 ? '#22cc22' : enemy.health > 25 ? '#cccc22' : '#cc2222'
      )
    }

    // Health bar faces camera
    const hbBg = enemy.mesh.children.find(c => c.position.y === 2.15 && c.name !== 'healthBar')
    if (hbBg) hbBg.lookAt(camera.position)
    if (hb) hb.lookAt(camera.position)
  }
}

// ========== GAME LOOP ==========
function gameLoop() {
  animFrame = requestAnimationFrame(gameLoop)

  if (isDead.value) {
    renderer.render(scene, camera)
    return
  }

  // Movement
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))

  let moveDir = new THREE.Vector3()
  if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward)
  if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward)
  if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right)
  if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right)

  // Mobile joystick
  if (joystickX.value !== 0 || joystickY.value !== 0) {
    const jx = joystickX.value / 40
    const jy = -joystickY.value / 40
    moveDir.add(forward.clone().multiplyScalar(jy))
    moveDir.add(right.clone().multiplyScalar(jx))
  }

  if (moveDir.length() > 0) {
    moveDir.normalize().multiplyScalar(MOVE_SPEED)
    playerPos.x += moveDir.x
    playerPos.z += moveDir.z
  }

  // Gravity & jump
  playerVel.y += GRAVITY
  playerPos.y += playerVel.y

  if (playerPos.y <= 1.7) {
    playerPos.y = 1.7
    playerVel.y = 0
    onGround = true
    isJumping = false
  }

  // Arena bounds
  playerPos.x = Math.max(-24, Math.min(24, playerPos.x))
  playerPos.z = Math.max(-24, Math.min(24, playerPos.z))

  // Camera
  camera.position.copy(playerPos)
  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch

  // Shooting
  if (shootCooldown > 0) shootCooldown--
  if (mouseDown && shootCooldown <= 0 && ammo.value > 0 && !reloading) {
    shoot()
    shootCooldown = 8
  }

  // Update bots
  if (isBotMode) updateBots()

  // Update enemy meshes
  updateEnemyMeshes()

  // Update bullet trails
  for (let i = bulletTrails.length - 1; i >= 0; i--) {
    bulletTrails[i].time--
    if (bulletTrails[i].time <= 0) {
      scene.remove(bulletTrails[i].line)
      bulletTrails.splice(i, 1)
    }
  }

  // Sync online
  if (isOnline) syncOnline()

  renderer.render(scene, camera)
}

function shoot() {
  ammo.value--

  // Raycast from camera
  const dir = new THREE.Vector3(0, 0, -1)
  dir.applyQuaternion(camera.quaternion)

  // Add slight spread
  dir.x += (Math.random() - 0.5) * 0.02
  dir.y += (Math.random() - 0.5) * 0.02

  const raycaster = new THREE.Raycaster(camera.position.clone(), dir, 0, 100)

  // Check hits on enemies
  let hitEnemy: Enemy | null = null
  let hitDist = Infinity

  for (const enemy of enemies) {
    if (enemy.health <= 0) continue
    const dist = camera.position.distanceTo(enemy.pos)
    if (dist > 50) continue

    // Simple sphere hit detection
    const toEnemy = enemy.pos.clone().sub(camera.position)
    const proj = toEnemy.dot(dir)
    if (proj < 0) continue

    const closest = camera.position.clone().add(dir.clone().multiplyScalar(proj))
    const hitRadius = 0.8
    if (closest.distanceTo(enemy.pos) < hitRadius && proj < hitDist) {
      hitDist = proj
      hitEnemy = enemy
    }
  }

  // Bullet trail
  const trailEnd = hitEnemy
    ? hitEnemy.pos.clone()
    : camera.position.clone().add(dir.clone().multiplyScalar(50))
  const trailGeo = new THREE.BufferGeometry().setFromPoints([
    camera.position.clone().add(dir.clone().multiplyScalar(0.5)),
    trailEnd,
  ])
  const trailMat = new THREE.LineBasicMaterial({ color: '#ffff00', transparent: true, opacity: 0.6 })
  const trail = new THREE.Line(trailGeo, trailMat)
  scene.add(trail)
  bulletTrails.push({ line: trail, time: 5 })

  if (hitEnemy) {
    const damage = 15 + Math.floor(Math.random() * 10)
    hitEnemy.health -= damage
    hitEnemy.lastDamageTime = Date.now()

    showHitMarker.value = true
    setTimeout(() => { showHitMarker.value = false }, 150)

    if (hitEnemy.health <= 0) {
      myKills.value++
      addKillFeed(`${playerName.value} eliminated ${hitEnemy.name}`)

      // Respawn enemy
      setTimeout(() => {
        hitEnemy!.health = 100
        hitEnemy!.pos.copy(getSpawnPoint())
        hitEnemy!.botState = 'patrol'
        hitEnemy!.botTarget = getRandomPoint()
      }, 3000)
    }
  }

  if (ammo.value <= 0) reload()
}

function reload() {
  if (reloading || ammo.value >= maxAmmo) return
  reloading = true
  setTimeout(() => {
    ammo.value = maxAmmo
    reloading = false
  }, 1500)
}

function jump() {
  if (onGround && !isJumping) {
    playerVel.y = JUMP_FORCE
    onGround = false
    isJumping = true
  }
}

function takeDamage(amount: number, from: string) {
  if (isDead.value) return
  health.value -= amount
  damageFlash.value = true
  setTimeout(() => { damageFlash.value = false }, 150)

  if (health.value <= 0) {
    health.value = 0
    isDead.value = true
    enemyKills.value++
    addKillFeed(`${from} eliminated ${playerName.value}`)

    respawnTimer.value = 3
    const interval = setInterval(() => {
      respawnTimer.value--
      if (respawnTimer.value <= 0) {
        clearInterval(interval)
        respawn()
      }
    }, 1000)
  }
}

function respawn() {
  isDead.value = false
  health.value = 100
  ammo.value = maxAmmo
  playerPos.copy(getSpawnPoint())
}

function addKillFeed(msg: string) {
  killFeed.value.unshift(msg)
  if (killFeed.value.length > 5) killFeed.value.pop()
  setTimeout(() => {
    killFeed.value.pop()
  }, 4000)
}

// ========== BOT AI ==========
function updateBots() {
  for (const bot of enemies) {
    if (!bot.isBot || bot.health <= 0) continue

    const distToPlayer = bot.pos.distanceTo(playerPos)

    // Can see player?
    const canSee = distToPlayer < 30

    if (canSee && !isDead.value) {
      bot.botState = 'chase'

      // Move toward player
      const dir = playerPos.clone().sub(bot.pos).normalize()
      const botSpeed = 0.06
      bot.pos.x += dir.x * botSpeed
      bot.pos.z += dir.z * botSpeed
      bot.rotY = Math.atan2(dir.x, dir.z)

      // Shoot at player
      bot.botShootTimer--
      if (bot.botShootTimer <= 0 && distToPlayer < 25) {
        // Bot shoots - accuracy depends on distance
        const accuracy = Math.max(0.3, 1 - distToPlayer / 30)
        if (Math.random() < accuracy * 0.3) {
          takeDamage(8 + Math.floor(Math.random() * 7), bot.name)
        }

        // Muzzle flash trail
        const toPlayer = playerPos.clone().sub(bot.pos).normalize()
        const trailGeo = new THREE.BufferGeometry().setFromPoints([
          bot.pos.clone().add(new THREE.Vector3(0, 1.2, 0)),
          bot.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).add(toPlayer.multiplyScalar(distToPlayer)),
        ])
        const trailMat = new THREE.LineBasicMaterial({ color: '#ff4444', transparent: true, opacity: 0.4 })
        const trail = new THREE.Line(trailGeo, trailMat)
        scene.add(trail)
        bulletTrails.push({ line: trail, time: 4 })

        bot.botShootTimer = 15 + Math.floor(Math.random() * 20)
      }
    } else {
      bot.botState = 'patrol'

      // Patrol to random point
      const dir = bot.botTarget.clone().sub(bot.pos)
      if (dir.length() < 2) {
        bot.botTarget = getRandomPoint()
      } else {
        dir.normalize()
        bot.pos.x += dir.x * 0.04
        bot.pos.z += dir.z * 0.04
        bot.rotY = Math.atan2(dir.x, dir.z)
      }
    }

    // Keep in arena
    bot.pos.x = Math.max(-23, Math.min(23, bot.pos.x))
    bot.pos.z = Math.max(-23, Math.min(23, bot.pos.z))
  }
}

// ========== ONLINE SYNC ==========
let lastSync = 0
function syncOnline() {
  const now = Date.now()
  if (now - lastSync < 50) return
  lastSync = now
  set(dbRef(db, `gunfight/players/${myId.value}`), {
    name: playerName.value, x: playerPos.x, y: playerPos.y, z: playerPos.z,
    rotY: yaw, health: health.value, kills: myKills.value,
  })
}

// ========== INPUT ==========
function lockPointer() {
  canvasContainer.value?.requestPointerLock?.()
}

function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyR') reload()
  if (e.code === 'Space') { e.preventDefault(); jump() }
  if (e.code === 'Escape') leaveGame()
}

function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }
function onMouseDown() { mouseDown = true }
function onMouseUp() { mouseDown = false }

function onMouseMove(e: MouseEvent) {
  if (document.pointerLockElement) {
    yaw -= e.movementX * MOUSE_SENS
    pitch -= e.movementY * MOUSE_SENS
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch))
  }
}

// Mobile
let joystickTouchId: number | null = null
let joystickCenter = { x: 0, y: 0 }

function joystickStart(e: TouchEvent) {
  const touch = e.touches[0]
  joystickTouchId = touch.identifier
  joystickCenter = { x: touch.clientX, y: touch.clientY }
}

function joystickMove(e: TouchEvent) {
  for (const touch of Array.from(e.touches)) {
    if (touch.identifier === joystickTouchId) {
      joystickX.value = Math.max(-40, Math.min(40, touch.clientX - joystickCenter.x))
      joystickY.value = Math.max(-40, Math.min(40, touch.clientY - joystickCenter.y))
    }
  }
}

function joystickEnd() {
  joystickTouchId = null
  joystickX.value = 0
  joystickY.value = 0
}

function mobileShoot() { mouseDown = true }
function mobileShootEnd() { mouseDown = false }

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  const saved = localStorage.getItem('gunName')
  if (saved) playerName.value = saved
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Gun Fight')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Gun Fight')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (isOnline) remove(dbRef(db, `gunfight/players/${myId.value}`))
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
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
.gun-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* MENU */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
}
.menu-card {
  background: rgba(0,0,0,0.7); border-radius: 24px; padding: 44px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #333; max-width: 400px; width: 90%;
  backdrop-filter: blur(10px);
}
.menu-icon { font-size: 64px; }
.menu-title { color: #fff; font-size: 36px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #94a3b8; font-size: 16px; margin: 0 0 24px; }
.menu-input {
  width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #334155;
  background: #0f172a; color: #fff; font-size: 16px; outline: none; margin-bottom: 16px;
  box-sizing: border-box;
}
.menu-input:focus { border-color: #3b82f6; }
.menu-buttons { display: flex; flex-direction: column; gap: 10px; }
.menu-btn {
  padding: 16px; border-radius: 14px; border: none; font-size: 18px;
  font-weight: 800; cursor: pointer; transition: transform 0.15s;
}
.menu-btn:hover { transform: translateY(-2px); }
.menu-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.online-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.bot-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.back-link { display: block; margin-top: 16px; background: none; border: none; color: #64748b; font-size: 14px; cursor: pointer; }

/* GAME */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; cursor: none; }
.canvas-container { width: 100%; height: 100%; }

/* Crosshair */
.crosshair {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 10; pointer-events: none;
}
.cross-h, .cross-v { background: rgba(255,255,255,0.8); position: absolute; }
.cross-h { width: 20px; height: 2px; top: -1px; left: -10px; }
.cross-v { width: 2px; height: 20px; top: -10px; left: -1px; }

/* HUD */
.hud-top {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 10; pointer-events: none;
}
.hud-score {
  background: rgba(0,0,0,0.6); padding: 8px 24px; border-radius: 10px;
  font-size: 24px; font-weight: 900; backdrop-filter: blur(4px);
}
.score-you { color: #4ade80; }
.score-sep { color: #666; margin: 0 10px; }
.score-enemy { color: #ef4444; }

.hud-bottom {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px; align-items: center; z-index: 10; pointer-events: none;
}
.health-bar-container {
  width: 200px; height: 24px; background: rgba(0,0,0,0.6); border-radius: 12px;
  overflow: hidden; position: relative;
}
.health-bar {
  height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 12px; transition: width 0.2s;
}
.health-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 800;
}
.ammo-display {
  background: rgba(0,0,0,0.6); padding: 6px 14px; border-radius: 10px;
  color: #fbbf24; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; gap: 6px;
}

/* Hit marker */
.hit-marker {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  color: #ff4444; font-size: 28px; font-weight: 900; z-index: 15; pointer-events: none;
  text-shadow: 0 0 10px #ff4444;
}

/* Kill feed */
.kill-feed {
  position: fixed; top: 60px; right: 16px; z-index: 10;
  display: flex; flex-direction: column; gap: 4px; pointer-events: none;
}
.kill-msg {
  background: rgba(0,0,0,0.6); color: #fff; padding: 6px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 600; backdrop-filter: blur(4px);
  animation: feed-in 0.3s ease-out;
}
@keyframes feed-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Death */
.death-overlay {
  position: fixed; inset: 0; background: rgba(139,0,0,0.5);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 20; pointer-events: none;
}
.death-text { color: #ff0000; font-size: 48px; font-weight: 900; text-shadow: 2px 2px 8px #000; }
.respawn-timer { color: #fff; font-size: 20px; margin-top: 12px; }

/* Damage flash */
.damage-flash {
  position: fixed; inset: 0; background: rgba(255,0,0,0.3);
  z-index: 18; pointer-events: none; animation: flash 0.15s;
}
@keyframes flash { from { opacity: 1; } to { opacity: 0; } }

/* Controls info */
.controls-info {
  position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.7); color: #94a3b8; padding: 8px 16px; border-radius: 8px;
  font-size: 11px; text-align: center; z-index: 10; pointer-events: none;
  line-height: 1.6;
}

/* Leave */
.leave-area { position: fixed; top: 12px; left: 12px; z-index: 10; }
.leave-btn {
  background: rgba(0,0,0,0.5); color: #fff; border: none; padding: 6px 14px;
  border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.leave-btn:hover { background: rgba(220,38,38,0.7); }

/* Mobile */
.mobile-controls {
  display: none; position: fixed; bottom: 0; left: 0; right: 0;
  justify-content: space-between; padding: 20px; z-index: 10; pointer-events: none;
}
.mobile-left, .mobile-right { pointer-events: auto; }
.joystick {
  width: 100px; height: 100px; background: rgba(255,255,255,0.15);
  border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
}
.joystick-knob {
  width: 40px; height: 40px; background: rgba(255,255,255,0.4);
  border-radius: 50%;
}
.mobile-right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.mobile-shoot {
  width: 70px; height: 70px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
  background: rgba(239,68,68,0.4); font-size: 28px; cursor: pointer;
}
.mobile-reload, .mobile-jump {
  width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.15); color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;
}

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: flex; }
}
</style>
