<template>
  <div class="wrest-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🤼</div>
        <h1 class="menu-title">WRESTLING MANIA</h1>
        <p class="menu-sub">Choose your fighter and dominate the ring!</p>
        <div class="fighter-select">
          <h3>Pick Your Fighter</h3>
          <div class="fighter-grid">
            <div v-for="f in fighters" :key="f.id" class="fighter-card"
              :class="{ selected: selectedFighter === f.id }" @click="selectedFighter = f.id">
              <div class="fc-avatar" :style="{ background: f.color }">{{ f.emoji }}</div>
              <div class="fc-name">{{ f.name }}</div>
              <div class="fc-stats">
                <div class="fc-stat"><span class="stat-label">PWR</span><div class="stat-bar"><div class="stat-fill pwr" :style="{ width: f.power * 10 + '%' }"></div></div></div>
                <div class="fc-stat"><span class="stat-label">SPD</span><div class="stat-bar"><div class="stat-fill spd" :style="{ width: f.speed * 10 + '%' }"></div></div></div>
                <div class="fc-stat"><span class="stat-label">DEF</span><div class="stat-bar"><div class="stat-fill def" :style="{ width: f.defense * 10 + '%' }"></div></div></div>
              </div>
              <div class="fc-special">⚡ {{ f.specialName }}</div>
            </div>
          </div>
        </div>
        <button class="play-btn" @click="startGame" :disabled="!selectedFighter">ENTER THE RING</button>
        <div class="record" v-if="totalWins > 0 || totalLosses > 0">
          Record: {{ totalWins }}W - {{ totalLosses }}L
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- Health Bars -->
      <div class="health-bars">
        <div class="hb-player">
          <div class="hb-name">{{ myFighter?.name }}</div>
          <div class="hb-bar"><div class="hb-fill player" :style="{ width: playerHealth + '%' }"></div></div>
          <div class="hb-special-bar"><div class="hb-special-fill" :style="{ width: specialMeter + '%' }"></div></div>
        </div>
        <div class="hb-vs">VS</div>
        <div class="hb-enemy">
          <div class="hb-name">{{ enemyFighter?.name }}</div>
          <div class="hb-bar"><div class="hb-fill enemy" :style="{ width: enemyHealth + '%' }"></div></div>
        </div>
      </div>

      <!-- Round indicator -->
      <div class="round-display">Round {{ currentRound }} / {{ maxRounds }}</div>

      <!-- Combo display -->
      <div v-if="comboCount > 1" class="combo-display">{{ comboCount }}x COMBO!</div>

      <!-- Action text -->
      <div v-if="actionText" class="action-text">{{ actionText }}</div>

      <!-- Controls -->
      <div class="controls-bar">
        <div class="move-buttons">
          <button class="ctrl punch" @click="doAttack('punch')" :disabled="attackCooldown > 0">👊 Punch</button>
          <button class="ctrl kick" @click="doAttack('kick')" :disabled="attackCooldown > 0">🦵 Kick</button>
          <button class="ctrl grab" @click="doAttack('grab')" :disabled="attackCooldown > 0">🤲 Grab</button>
          <button class="ctrl special" @click="doAttack('special')" :disabled="specialMeter < 100">⚡ Special</button>
          <button class="ctrl block" @touchstart.prevent="startBlock" @touchend.prevent="endBlock"
            @mousedown="startBlock" @mouseup="endBlock" :class="{ active: isBlocking }">🛡️ Block</button>
          <button class="ctrl dodge" @click="doDodge" :disabled="dodgeCooldown > 0">💨 Dodge</button>
        </div>
      </div>

      <!-- Mobile D-pad -->
      <div class="mobile-dpad">
        <button class="dp-btn up" @touchstart.prevent="moveDir('up')" @touchend.prevent="stopMove">▲</button>
        <div class="dp-mid">
          <button class="dp-btn left" @touchstart.prevent="moveDir('left')" @touchend.prevent="stopMove">◀</button>
          <button class="dp-btn right" @touchstart.prevent="moveDir('right')" @touchend.prevent="stopMove">▶</button>
        </div>
        <button class="dp-btn down" @touchstart.prevent="moveDir('down')" @touchend.prevent="stopMove">▼</button>
      </div>

      <!-- Round End -->
      <div v-if="showRoundEnd" class="round-overlay">
        <div class="round-card">
          <h2>{{ roundWinner === 'player' ? '🏆 YOU WIN THE ROUND!' : '💀 YOU LOST THE ROUND' }}</h2>
          <p>{{ roundWinner === 'player' ? myFighter?.name : enemyFighter?.name }} wins!</p>
          <div class="round-score">{{ playerRoundWins }} - {{ enemyRoundWins }}</div>
        </div>
      </div>

      <!-- Match End -->
      <div v-if="showMatchEnd" class="round-overlay">
        <div class="round-card match-end">
          <h1>{{ matchWinner === 'player' ? '🏆 CHAMPION!' : '💀 DEFEATED' }}</h1>
          <p>{{ matchWinner === 'player' ? myFighter?.name + ' is the champion!' : enemyFighter?.name + ' wins the match!' }}</p>
          <div class="match-actions">
            <button class="play-btn" @click="startGame">Rematch</button>
            <button class="back-link" @click="screen = 'menu'">Menu</button>
          </div>
        </div>
      </div>

      <!-- Leave -->
      <button class="leave-btn" @click="leaveGame">← Leave</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'

const screen = ref<'menu' | 'game'>('menu')
const selectedFighter = ref('')
const playerHealth = ref(100)
const enemyHealth = ref(100)
const specialMeter = ref(0)
const attackCooldown = ref(0)
const dodgeCooldown = ref(0)
const isBlocking = ref(false)
const comboCount = ref(0)
const actionText = ref('')
const currentRound = ref(1)
const maxRounds = 3
const showRoundEnd = ref(false)
const showMatchEnd = ref(false)
const roundWinner = ref('')
const matchWinner = ref('')
const playerRoundWins = ref(0)
const enemyRoundWins = ref(0)
const totalWins = ref(0)
const totalLosses = ref(0)

interface Fighter {
  id: string; name: string; emoji: string; color: string
  power: number; speed: number; defense: number; specialName: string
  specialDamage: number
}

const fighters: Fighter[] = [
  { id: 'thunder', name: 'Thunder Strike', emoji: '⚡', color: '#fbbf24', power: 8, speed: 6, defense: 5, specialName: 'Lightning Slam', specialDamage: 35 },
  { id: 'iron', name: 'Iron Crusher', emoji: '🔩', color: '#64748b', power: 9, speed: 4, defense: 8, specialName: 'Iron Maiden', specialDamage: 40 },
  { id: 'shadow', name: 'Shadow Viper', emoji: '🐍', color: '#7c3aed', power: 6, speed: 9, defense: 4, specialName: 'Venom Strike', specialDamage: 30 },
  { id: 'blaze', name: 'Blaze Phoenix', emoji: '🔥', color: '#ef4444', power: 7, speed: 7, defense: 6, specialName: 'Inferno Burst', specialDamage: 35 },
  { id: 'frost', name: 'Frost Giant', emoji: '❄️', color: '#06b6d4', power: 8, speed: 5, defense: 7, specialName: 'Glacier Crush', specialDamage: 38 },
  { id: 'wild', name: 'Wild Tiger', emoji: '🐯', color: '#f97316', power: 7, speed: 8, defense: 5, specialName: 'Tiger Pounce', specialDamage: 32 },
  { id: 'skull', name: 'Skull Breaker', emoji: '💀', color: '#1a1a2e', power: 10, speed: 3, defense: 7, specialName: 'Death Drop', specialDamage: 45 },
  { id: 'star', name: 'Star Princess', emoji: '⭐', color: '#ec4899', power: 6, speed: 8, defense: 6, specialName: 'Star Suplex', specialDamage: 33 },
  { id: 'earth', name: 'Earthquake', emoji: '🌍', color: '#22c55e', power: 9, speed: 5, defense: 9, specialName: 'Seismic Slam', specialDamage: 42 },
  { id: 'rocket', name: 'Rocket Fist', emoji: '🚀', color: '#3b82f6', power: 7, speed: 9, defense: 4, specialName: 'Rocket Uppercut', specialDamage: 34 },
]

let myFighter = ref<Fighter | null>(null)
let enemyFighter = ref<Fighter | null>(null)

// Three.js
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number
let playerMesh: THREE.Group
let enemyMesh: THREE.Group
let playerPos = new THREE.Vector3(-2, 0, 0)
let enemyPos = new THREE.Vector3(2, 0, 0)
let ringMesh: THREE.Group

// Movement
const keys: Record<string, boolean> = {}
let moveX = 0
let moveZ = 0
let comboTimer = 0
let lastAttackTime = 0
let cooldownInterval: number | null = null

// Bot AI
let botTimer = 0
let botAction = ''
let botBlocking = false

function startGame() {
  myFighter.value = fighters.find(f => f.id === selectedFighter.value) || fighters[0]
  // Pick random enemy
  const others = fighters.filter(f => f.id !== selectedFighter.value)
  enemyFighter.value = others[Math.floor(Math.random() * others.length)]

  playerHealth.value = 100
  enemyHealth.value = 100
  specialMeter.value = 0
  currentRound.value = 1
  playerRoundWins.value = 0
  enemyRoundWins.value = 0
  showRoundEnd.value = false
  showMatchEnd.value = false
  comboCount.value = 0
  attackCooldown.value = 0
  dodgeCooldown.value = 0
  isBlocking.value = false

  screen.value = 'game'
  nextTick(() => init3D())
}

function leaveGame() {
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (cooldownInterval) clearInterval(cooldownInterval)
  screen.value = 'menu'
}

// ========== THREE.JS ==========
function init3D() {
  const container = document.querySelector('.three-container') as HTMLElement
  if (!container) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a1a2e')

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 5, 8)
  camera.lookAt(0, 1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  // Lights
  scene.add(new THREE.AmbientLight('#ffffff', 0.5))

  const spot1 = new THREE.SpotLight('#ff4444', 1.5, 20, 0.6)
  spot1.position.set(-5, 8, 0)
  spot1.castShadow = true
  scene.add(spot1)

  const spot2 = new THREE.SpotLight('#4444ff', 1.5, 20, 0.6)
  spot2.position.set(5, 8, 0)
  spot2.castShadow = true
  scene.add(spot2)

  const topLight = new THREE.PointLight('#ffffff', 1, 15)
  topLight.position.set(0, 7, 0)
  scene.add(topLight)

  buildRing()
  buildFighters()

  // Reset positions
  playerPos.set(-2, 0, 0)
  enemyPos.set(2, 0, 0)

  // Cooldown timer
  cooldownInterval = setInterval(() => {
    if (attackCooldown.value > 0) attackCooldown.value--
    if (dodgeCooldown.value > 0) dodgeCooldown.value--
    comboTimer--
    if (comboTimer <= 0) comboCount.value = 0
  }, 100) as unknown as number

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)

  gameLoop()
}

function buildRing() {
  ringMesh = new THREE.Group()

  // Ring floor
  const floorGeo = new THREE.BoxGeometry(8, 0.3, 8)
  const floorMat = new THREE.MeshStandardMaterial({ color: '#2a4a6a', roughness: 0.6 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.position.y = -0.15
  floor.receiveShadow = true
  ringMesh.add(floor)

  // Ring mat (center)
  const matGeo = new THREE.BoxGeometry(7.5, 0.02, 7.5)
  const matMaterial = new THREE.MeshStandardMaterial({ color: '#1a3050', roughness: 0.8 })
  const mat = new THREE.Mesh(matGeo, matMaterial)
  mat.position.y = 0.01
  mat.receiveShadow = true
  ringMesh.add(mat)

  // Ring circle in center
  const circleGeo = new THREE.RingGeometry(1.2, 1.4, 32)
  const circleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })
  const circle = new THREE.Mesh(circleGeo, circleMat)
  circle.rotation.x = -Math.PI / 2
  circle.position.y = 0.02
  ringMesh.add(circle)

  // Corner posts
  const postMat = new THREE.MeshStandardMaterial({ color: '#888' })
  const postPositions = [[-3.8, -3.8], [3.8, -3.8], [-3.8, 3.8], [3.8, 3.8]]
  for (const [x, z] of postPositions) {
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8)
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(x, 1, z)
    post.castShadow = true
    ringMesh.add(post)

    // Turnbuckle pad
    const padGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const padMat = new THREE.MeshStandardMaterial({ color: x < 0 ? '#ef4444' : '#3b82f6' })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.set(x, 1.5, z)
    ringMesh.add(pad)
  }

  // Ropes (3 levels)
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#fff' })
  const ropeHeights = [0.5, 1, 1.5]
  for (const rh of ropeHeights) {
    // Front and back ropes
    for (const z of [-3.8, 3.8]) {
      const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, 7.6, 8)
      const rope = new THREE.Mesh(ropeGeo, ropeMat)
      rope.rotation.z = Math.PI / 2
      rope.position.set(0, rh, z)
      ringMesh.add(rope)
    }
    // Side ropes
    for (const x of [-3.8, 3.8]) {
      const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, 7.6, 8)
      const rope = new THREE.Mesh(ropeGeo, ropeMat)
      rope.rotation.x = Math.PI / 2
      rope.position.set(x, rh, 0)
      ringMesh.add(rope)
    }
  }

  // Audience (simple stands)
  const standMat = new THREE.MeshStandardMaterial({ color: '#111' })
  for (const side of [-6, 6]) {
    const standGeo = new THREE.BoxGeometry(12, 3, 2)
    const stand = new THREE.Mesh(standGeo, standMat)
    stand.position.set(0, 1, side)
    ringMesh.add(stand)

    // Crowd dots
    for (let i = 0; i < 20; i++) {
      const crowdGeo = new THREE.SphereGeometry(0.12, 6, 6)
      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#ec4899', '#f97316']
      const crowdMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] })
      const crowd = new THREE.Mesh(crowdGeo, crowdMat)
      crowd.position.set(-5 + i * 0.55, 2.5 + Math.random() * 0.5, side + (side > 0 ? 0.5 : -0.5))
      ringMesh.add(crowd)
    }
  }

  scene.add(ringMesh)
}

function createWrestlerMesh(fighter: Fighter): THREE.Group {
  const group = new THREE.Group()
  const c = fighter.color

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.7 })
  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8)
  const leftLeg = new THREE.Mesh(legGeo, legMat)
  leftLeg.position.set(-0.15, 0.3, 0)
  leftLeg.castShadow = true
  group.add(leftLeg)
  const rightLeg = leftLeg.clone()
  rightLeg.position.x = 0.15
  group.add(rightLeg)

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.5, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1
  body.castShadow = true
  group.add(body)

  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: '#ddb892', roughness: 0.7 })
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 6, 8)
  const leftArm = new THREE.Mesh(armGeo, armMat)
  leftArm.position.set(-0.38, 1, 0)
  leftArm.castShadow = true
  leftArm.name = 'leftArm'
  group.add(leftArm)
  const rightArm = leftArm.clone()
  rightArm.position.x = 0.38
  rightArm.name = 'rightArm'
  group.add(rightArm)

  // Head
  const headGeo = new THREE.SphereGeometry(0.2, 16, 16)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ddb892', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.55
  head.castShadow = true
  group.add(head)

  // Mask/face color
  const maskGeo = new THREE.SphereGeometry(0.21, 16, 16, 0, Math.PI)
  const maskMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })
  const mask = new THREE.Mesh(maskGeo, maskMat)
  mask.position.y = 1.55
  mask.rotation.y = Math.PI
  group.add(mask)

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#fff' })
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8)
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(-0.08, 1.58, 0.17)
  group.add(leftEye)
  const rightEye = leftEye.clone()
  rightEye.position.x = 0.08
  group.add(rightEye)

  // Pupils
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#000' })
  const pupilGeo = new THREE.SphereGeometry(0.02, 6, 6)
  const lp = new THREE.Mesh(pupilGeo, pupilMat)
  lp.position.set(-0.08, 1.58, 0.2)
  group.add(lp)
  const rp = lp.clone()
  rp.position.x = 0.08
  group.add(rp)

  // Belt
  const beltGeo = new THREE.TorusGeometry(0.26, 0.04, 8, 16)
  const beltMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.2 })
  const belt = new THREE.Mesh(beltGeo, beltMat)
  belt.position.y = 0.75
  belt.rotation.x = Math.PI / 2
  group.add(belt)

  // Name tag
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 48
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, 256, 48)
  ctx.fillStyle = c
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(fighter.name, 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
  sprite.position.y = 2
  sprite.scale.set(1.5, 0.3, 1)
  group.add(sprite)

  return group
}

function buildFighters() {
  if (playerMesh) scene.remove(playerMesh)
  if (enemyMesh) scene.remove(enemyMesh)

  playerMesh = createWrestlerMesh(myFighter.value!)
  playerMesh.position.copy(playerPos)
  scene.add(playerMesh)

  enemyMesh = createWrestlerMesh(enemyFighter.value!)
  enemyMesh.position.copy(enemyPos)
  enemyMesh.rotation.y = Math.PI
  scene.add(enemyMesh)
}

// ========== GAME LOOP ==========
function gameLoop() {
  if (screen.value !== 'game') return
  animFrame = requestAnimationFrame(gameLoop)

  if (showRoundEnd.value || showMatchEnd.value) {
    renderer.render(scene, camera)
    return
  }

  updatePlayer()
  updateBot()
  updateMeshes()
  renderer.render(scene, camera)
}

function updatePlayer() {
  let dx = 0, dz = 0
  const spd = (myFighter.value?.speed || 5) * 0.008

  if (keys['KeyW'] || keys['ArrowUp'] || moveZ < 0) dz -= spd
  if (keys['KeyS'] || keys['ArrowDown'] || moveZ > 0) dz += spd
  if (keys['KeyA'] || keys['ArrowLeft'] || moveX < 0) dx -= spd
  if (keys['KeyD'] || keys['ArrowRight'] || moveX > 0) dx += spd

  playerPos.x = Math.max(-3.5, Math.min(3.5, playerPos.x + dx))
  playerPos.z = Math.max(-3.5, Math.min(3.5, playerPos.z + dz))

  // Face enemy
  const toEnemy = enemyPos.clone().sub(playerPos)
  playerMesh.rotation.y = Math.atan2(toEnemy.x, toEnemy.z)
}

function updateBot() {
  if (!enemyFighter.value) return
  botTimer--

  const dist = playerPos.distanceTo(enemyPos)
  const spd = (enemyFighter.value.speed || 5) * 0.006

  // Bot AI
  if (botTimer <= 0) {
    botTimer = 30 + Math.floor(Math.random() * 60)
    const roll = Math.random()
    if (dist > 2) botAction = 'approach'
    else if (roll < 0.3) botAction = 'punch'
    else if (roll < 0.5) botAction = 'kick'
    else if (roll < 0.6) botAction = 'grab'
    else if (roll < 0.7) botAction = 'block'
    else if (roll < 0.8) botAction = 'dodge'
    else botAction = 'approach'
  }

  if (botAction === 'approach' || dist > 2.5) {
    const dir = playerPos.clone().sub(enemyPos).normalize()
    enemyPos.x += dir.x * spd
    enemyPos.z += dir.z * spd
  }

  if (dist < 2 && !botBlocking) {
    if (botAction === 'punch' && botTimer === 25) botAttack('punch')
    if (botAction === 'kick' && botTimer === 20) botAttack('kick')
    if (botAction === 'grab' && botTimer === 15) botAttack('grab')
  }

  if (botAction === 'block') {
    botBlocking = true
    if (botTimer <= 0) botBlocking = false
  } else {
    botBlocking = false
  }

  // Keep in ring
  enemyPos.x = Math.max(-3.5, Math.min(3.5, enemyPos.x))
  enemyPos.z = Math.max(-3.5, Math.min(3.5, enemyPos.z))

  // Face player
  const toPlayer = playerPos.clone().sub(enemyPos)
  enemyMesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z)
}

function updateMeshes() {
  playerMesh.position.lerp(playerPos, 0.2)
  enemyMesh.position.lerp(enemyPos, 0.2)

  // Idle animation - gentle bob
  const time = Date.now() * 0.003
  playerMesh.position.y = Math.sin(time) * 0.03
  enemyMesh.position.y = Math.sin(time + 1) * 0.03

  // Camera follows action
  const midX = (playerPos.x + enemyPos.x) / 2
  const midZ = (playerPos.z + enemyPos.z) / 2
  camera.position.lerp(new THREE.Vector3(midX, 4.5, midZ + 7), 0.05)
  camera.lookAt(midX, 1, midZ)
}

// ========== ATTACKS ==========
function doAttack(type: string) {
  if (showRoundEnd.value || showMatchEnd.value) return
  const dist = playerPos.distanceTo(enemyPos)
  if (dist > 2.5 && type !== 'special') {
    showAction('Too far away!')
    return
  }

  const fighter = myFighter.value!
  let damage = 0
  let cooldown = 3

  if (type === 'punch') {
    damage = 5 + fighter.power
    cooldown = 3
    showAction('👊 PUNCH!')
    animateAttack(playerMesh, 'punch')
  } else if (type === 'kick') {
    damage = 7 + fighter.power
    cooldown = 5
    showAction('🦵 KICK!')
    animateAttack(playerMesh, 'kick')
  } else if (type === 'grab') {
    damage = 10 + fighter.power * 1.5
    cooldown = 8
    showAction('🤲 GRAB & SLAM!')
    animateAttack(playerMesh, 'grab')
  } else if (type === 'special') {
    if (specialMeter.value < 100) return
    damage = fighter.specialDamage
    specialMeter.value = 0
    cooldown = 10
    showAction('⚡ ' + fighter.specialName + '!!')
    animateAttack(playerMesh, 'special')
  }

  attackCooldown.value = cooldown

  // Check if bot is blocking
  if (botBlocking && type !== 'grab') {
    damage = Math.floor(damage * 0.2)
    showAction('🛡️ BLOCKED!')
  }

  // Combo
  const now = Date.now()
  if (now - lastAttackTime < 1500) {
    comboCount.value++
    damage = Math.floor(damage * (1 + comboCount.value * 0.15))
    comboTimer = 15
  } else {
    comboCount.value = 1
    comboTimer = 15
  }
  lastAttackTime = now

  enemyHealth.value = Math.max(0, enemyHealth.value - damage)
  specialMeter.value = Math.min(100, specialMeter.value + damage * 0.8)

  // Knockback
  const dir = enemyPos.clone().sub(playerPos).normalize()
  enemyPos.add(dir.multiplyScalar(0.3))

  animateHit(enemyMesh)

  if (enemyHealth.value <= 0) endRound('player')
}

function botAttack(type: string) {
  const fighter = enemyFighter.value!
  let damage = 0

  if (type === 'punch') damage = 4 + fighter.power * 0.8
  else if (type === 'kick') damage = 6 + fighter.power * 0.8
  else if (type === 'grab') damage = 8 + fighter.power

  // Player blocking
  if (isBlocking.value && type !== 'grab') {
    damage = Math.floor(damage * 0.15)
    showAction('🛡️ You blocked!')
  } else {
    showAction(type === 'punch' ? '👊' : type === 'kick' ? '🦵' : '🤲')
  }

  // Player defense reduces damage
  damage = Math.max(1, damage - (myFighter.value?.defense || 0) * 0.5)

  playerHealth.value = Math.max(0, playerHealth.value - Math.floor(damage))

  // Knockback
  const dir = playerPos.clone().sub(enemyPos).normalize()
  playerPos.add(dir.multiplyScalar(0.2))

  animateAttack(enemyMesh, type)
  animateHit(playerMesh)

  if (playerHealth.value <= 0) endRound('enemy')
}

function startBlock() { isBlocking.value = true }
function endBlock() { isBlocking.value = false }

function doDodge() {
  if (dodgeCooldown.value > 0) return
  dodgeCooldown.value = 10
  // Move away from enemy
  const dir = playerPos.clone().sub(enemyPos).normalize()
  playerPos.add(dir.multiplyScalar(1.5))
  playerPos.x = Math.max(-3.5, Math.min(3.5, playerPos.x))
  playerPos.z = Math.max(-3.5, Math.min(3.5, playerPos.z))
  showAction('💨 DODGE!')
}

function moveDir(dir: string) {
  moveX = 0; moveZ = 0
  if (dir === 'up') moveZ = -1
  if (dir === 'down') moveZ = 1
  if (dir === 'left') moveX = -1
  if (dir === 'right') moveX = 1
}

function stopMove() { moveX = 0; moveZ = 0 }

// ========== ANIMATIONS ==========
function animateAttack(mesh: THREE.Group, type: string) {
  const arm = mesh.children.find(c => c.name === 'rightArm') as THREE.Mesh
  if (!arm) return

  if (type === 'punch') {
    arm.position.z = 0.4
    setTimeout(() => { arm.position.z = 0 }, 200)
  } else if (type === 'kick') {
    mesh.rotation.x = -0.2
    setTimeout(() => { mesh.rotation.x = 0 }, 300)
  } else if (type === 'grab' || type === 'special') {
    mesh.position.y = 0.3
    setTimeout(() => { mesh.position.y = 0 }, 400)
  }
}

function animateHit(mesh: THREE.Group) {
  const orig = mesh.position.x
  mesh.position.x += 0.15
  setTimeout(() => { mesh.position.x -= 0.3 }, 50)
  setTimeout(() => { mesh.position.x = orig }, 150)
}

// ========== ROUNDS ==========
function endRound(winner: string) {
  roundWinner.value = winner
  if (winner === 'player') playerRoundWins.value++
  else enemyRoundWins.value++

  showRoundEnd.value = true

  setTimeout(() => {
    showRoundEnd.value = false

    if (playerRoundWins.value >= 2 || enemyRoundWins.value >= 2) {
      matchWinner.value = playerRoundWins.value >= 2 ? 'player' : 'enemy'
      showMatchEnd.value = true
      if (matchWinner.value === 'player') totalWins.value++
      else totalLosses.value++
      localStorage.setItem('wrestlingWins', totalWins.value.toString())
      localStorage.setItem('wrestlingLosses', totalLosses.value.toString())
    } else {
      currentRound.value++
      playerHealth.value = 100
      enemyHealth.value = 100
      playerPos.set(-2, 0, 0)
      enemyPos.set(2, 0, 0)
    }
  }, 2500)
}

function showAction(text: string) {
  actionText.value = text
  setTimeout(() => { actionText.value = '' }, 1000)
}

// ========== INPUT ==========
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyJ') doAttack('punch')
  if (e.code === 'KeyK') doAttack('kick')
  if (e.code === 'KeyL') doAttack('grab')
  if (e.code === 'KeyU') doAttack('special')
  if (e.code === 'Space') { e.preventDefault(); isBlocking.value = true }
  if (e.code === 'ShiftLeft') doDodge()
}

function onKeyUp(e: KeyboardEvent) {
  keys[e.code] = false
  if (e.code === 'Space') isBlocking.value = false
}

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  totalWins.value = parseInt(localStorage.getItem('wrestlingWins') || '0')
  totalLosses.value = parseInt(localStorage.getItem('wrestlingLosses') || '0')
})

onUnmounted(() => {
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (cooldownInterval) clearInterval(cooldownInterval)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.wrest-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a0a0a, #2a1020, #1a0a2a);
}
.menu-card {
  background: rgba(10,5,15,0.95); border-radius: 24px; padding: 32px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 2px solid #ef4444; max-width: 600px; width: 95%;
  max-height: 90vh; overflow-y: auto;
}
.menu-icon { font-size: 64px; }
.menu-title { color: #ef4444; font-size: 32px; font-weight: 900; margin: 4px 0; letter-spacing: 3px; }
.menu-sub { color: #f87171; font-size: 14px; margin: 0 0 16px; }

.fighter-select h3 { color: #fff; font-size: 16px; margin: 0 0 10px; }
.fighter-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin-bottom: 16px;
}
.fighter-card {
  background: #1a1a2e; border: 2px solid #333; border-radius: 12px; padding: 10px;
  cursor: pointer; transition: all 0.15s; text-align: center;
}
.fighter-card:hover { border-color: #555; transform: translateY(-2px); }
.fighter-card.selected { border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.3); }
.fc-avatar { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.fc-name { color: #fff; font-size: 12px; font-weight: 800; margin-bottom: 4px; }
.fc-stats { display: flex; flex-direction: column; gap: 2px; margin-bottom: 4px; }
.fc-stat { display: flex; align-items: center; gap: 4px; }
.stat-label { color: #666; font-size: 8px; font-weight: 700; width: 24px; }
.stat-bar { flex: 1; height: 4px; background: #333; border-radius: 2px; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 2px; }
.stat-fill.pwr { background: #ef4444; }
.stat-fill.spd { background: #3b82f6; }
.stat-fill.def { background: #22c55e; }
.fc-special { color: #fbbf24; font-size: 9px; font-weight: 700; }

.play-btn {
  padding: 14px 40px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 20px; font-weight: 900; cursor: pointer; letter-spacing: 2px;
  transition: transform 0.15s; margin-bottom: 8px;
}
.play-btn:hover { transform: scale(1.05); }
.play-btn:disabled { opacity: 0.4; }
.record { color: #94a3b8; font-size: 14px; margin-bottom: 8px; }
.back-link { display: block; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Game */
.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.three-container { position: fixed; inset: 0; z-index: 1; }

/* Health bars */
.health-bars {
  position: fixed; top: 12px; left: 0; right: 0; display: flex; align-items: center;
  justify-content: center; gap: 12px; z-index: 10; padding: 0 12px;
}
.hb-player, .hb-enemy { flex: 1; max-width: 250px; }
.hb-name { color: #fff; font-size: 13px; font-weight: 800; margin-bottom: 2px; }
.hb-player .hb-name { text-align: left; }
.hb-enemy .hb-name { text-align: right; }
.hb-bar { height: 16px; background: #333; border-radius: 8px; overflow: hidden; }
.hb-fill { height: 100%; border-radius: 8px; transition: width 0.2s; }
.hb-fill.player { background: linear-gradient(90deg, #22c55e, #4ade80); }
.hb-fill.enemy { background: linear-gradient(90deg, #ef4444, #f87171); float: right; }
.hb-special-bar { height: 6px; background: #222; border-radius: 3px; margin-top: 2px; overflow: hidden; }
.hb-special-fill { height: 100%; background: linear-gradient(90deg, #fbbf24, #f97316); border-radius: 3px; transition: width 0.2s; }
.hb-vs { color: #fbbf24; font-size: 20px; font-weight: 900; }

.round-display {
  position: fixed; top: 56px; left: 50%; transform: translateX(-50%);
  color: #94a3b8; font-size: 12px; font-weight: 700; z-index: 10;
}

.combo-display {
  position: fixed; top: 50%; right: 16px; transform: translateY(-50%);
  color: #fbbf24; font-size: 24px; font-weight: 900; z-index: 10;
  animation: combo-pop 0.3s ease-out; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
@keyframes combo-pop { from { transform: translateY(-50%) scale(1.5); } to { transform: translateY(-50%) scale(1); } }

.action-text {
  position: fixed; top: 40%; left: 50%; transform: translate(-50%,-50%);
  color: #fff; font-size: 32px; font-weight: 900; z-index: 10;
  text-shadow: 3px 3px 6px rgba(0,0,0,0.6); animation: action-pop 0.5s ease-out;
  pointer-events: none;
}
@keyframes action-pop { from { transform: translate(-50%,-50%) scale(2); opacity: 0; } 30% { opacity: 1; } to { transform: translate(-50%,-50%) scale(1); } }

/* Controls */
.controls-bar {
  position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.move-buttons { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.ctrl {
  padding: 10px 16px; border-radius: 10px; border: 2px solid; font-size: 14px;
  font-weight: 700; cursor: pointer; color: #fff; backdrop-filter: blur(4px);
}
.ctrl:disabled { opacity: 0.3; cursor: not-allowed; }
.ctrl:active { transform: scale(0.95); }
.punch { background: rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.5); }
.kick { background: rgba(249,115,22,0.4); border-color: rgba(249,115,22,0.5); }
.grab { background: rgba(139,92,246,0.4); border-color: rgba(139,92,246,0.5); }
.special { background: rgba(251,191,36,0.4); border-color: rgba(251,191,36,0.5); }
.block { background: rgba(59,130,246,0.4); border-color: rgba(59,130,246,0.5); }
.block.active { background: rgba(59,130,246,0.8); }
.dodge { background: rgba(34,197,94,0.4); border-color: rgba(34,197,94,0.5); }

/* Mobile d-pad */
.mobile-dpad {
  display: none; position: fixed; bottom: 70px; left: 16px; z-index: 10;
  flex-direction: column; align-items: center; gap: 2px;
}
.dp-mid { display: flex; gap: 2px; }
.dp-btn {
  width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 16px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}

.leave-btn {
  position: fixed; top: 12px; left: 12px; background: rgba(0,0,0,0.5);
  color: #fff; border: none; padding: 6px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer; z-index: 10;
}

/* Round/Match overlays */
.round-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 20;
}
.round-card {
  background: #111; border-radius: 20px; padding: 32px; text-align: center;
  border: 3px solid #fbbf24; max-width: 380px; width: 90%;
  animation: pop-in 0.4s ease-out;
}
.round-card.match-end { border-color: #ef4444; }
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.round-card h2, .round-card h1 { color: #fff; margin: 0 0 8px; }
.round-card p { color: #94a3b8; font-size: 15px; margin: 0 0 12px; }
.round-score { color: #fbbf24; font-size: 36px; font-weight: 900; }
.match-actions { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }

@media (max-width: 700px), (pointer: coarse) {
  .mobile-dpad { display: flex; }
  .ctrl { padding: 8px 10px; font-size: 12px; }
  .fighter-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
</style>
