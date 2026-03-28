<template>
  <div class="ht-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🦸</div>
        <h1 class="menu-title">Superheroes Tycoon</h1>
        <p class="menu-sub">Build your base, recruit heroes, defeat villains!</p>
        <button class="play-btn" @click="startGame">⚡ Play</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- HUD -->
      <div class="hud-top">
        <div class="hud-money">💰 ${{ money.toLocaleString() }}</div>
        <div class="hud-gems">💎 {{ gems.toLocaleString() }}</div>
        <div class="hud-income">+${{ income.toLocaleString() }}/s</div>
        <div class="hud-wave" v-if="waveActive">⚔️ Wave {{ currentWave }}</div>
      </div>

      <!-- Prompt when near pad -->
      <div v-if="nearPad" class="pad-prompt">
        <div class="pp-name">{{ nearPad.label }}</div>
        <div class="pp-cost">{{ nearPad.costText }}</div>
        <button class="pp-btn" @click="buyPad" :disabled="!canAffordPad">
          {{ canAffordPad ? '✅ Buy' : '❌ Not enough' }}
        </button>
      </div>

      <!-- Tab buttons -->
      <div class="tab-bar">
        <button class="tab" :class="{ active: activeTab === 'base' }" @click="activeTab = 'base'">🏗️ Base</button>
        <button class="tab" :class="{ active: activeTab === 'heroes' }" @click="activeTab = 'heroes'">🦸 Heroes</button>
        <button class="tab" :class="{ active: activeTab === 'battle' }" @click="activeTab = 'battle'">⚔️ Battle</button>
        <button class="tab" :class="{ active: activeTab === 'powers' }" @click="activeTab = 'powers'">💥 Powers</button>
        <button class="tab" :class="{ active: activeTab === 'shop' }" @click="activeTab = 'shop'">💎 Gem Shop</button>
      </div>

      <!-- Base Panel -->
      <div v-if="activeTab === 'base'" class="panel">
        <h3>🏗️ Build Your Base</h3>
        <div class="build-grid">
          <div v-for="b in buildings" :key="b.id" class="build-card" :class="{ owned: b.level > 0 }">
            <div class="bc-icon">{{ b.icon }}</div>
            <div class="bc-name">{{ b.name }}</div>
            <div class="bc-level" v-if="b.level > 0">Level {{ b.level }}</div>
            <div class="bc-effect">{{ b.effect }}</div>
            <button class="bc-btn" :disabled="money < b.cost" @click="buyBuilding(b)">
              {{ b.level > 0 ? 'Upgrade' : 'Build' }} - ${{ b.cost.toLocaleString() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Heroes Panel -->
      <div v-if="activeTab === 'heroes'" class="panel">
        <h3>🦸 Recruit Heroes</h3>
        <div class="hero-grid">
          <div v-for="h in allHeroes" :key="h.id" class="hero-card" :class="{ owned: ownedHeroes.includes(h.id), deployed: deployedHeroes.includes(h.id) }">
            <div class="hc-avatar" :style="{ background: h.color }">{{ h.emoji }}</div>
            <div class="hc-info">
              <div class="hc-name">{{ h.name }}</div>
              <div class="hc-power">{{ h.powerName }}</div>
              <div class="hc-stats">
                <span>⚔️{{ h.attack }}</span>
                <span>🛡️{{ h.defense }}</span>
                <span>💨{{ h.speed }}</span>
              </div>
            </div>
            <button v-if="!ownedHeroes.includes(h.id)" class="hc-btn buy" :disabled="money < h.cost" @click="recruitHero(h)">
              ${{ h.cost.toLocaleString() }}
            </button>
            <button v-else-if="!deployedHeroes.includes(h.id)" class="hc-btn deploy" @click="deployHero(h.id)">Deploy</button>
            <div v-else class="hc-deployed">✅ Active</div>
          </div>
        </div>
      </div>

      <!-- Battle Panel -->
      <div v-if="activeTab === 'battle'" class="panel">
        <h3>⚔️ Battle</h3>
        <div class="battle-info">
          <div class="bi-stat">Heroes Deployed: {{ deployedHeroes.length }}</div>
          <div class="bi-stat">Total Power: {{ totalPower }}</div>
          <div class="bi-stat">Waves Cleared: {{ wavesCleared }}</div>
        </div>
        <button v-if="!waveActive" class="wave-btn" @click="startWave" :disabled="deployedHeroes.length === 0">
          ⚔️ Start Wave {{ currentWave }}
        </button>
        <button class="wave-btn bot-mode" @click="toggleAutoWave">
          🤖 Auto Waves: {{ autoWave ? 'ON' : 'OFF' }}
        </button>
        <div v-if="waveActive" class="wave-progress">
          <div class="wp-bar"><div class="wp-fill" :style="{ width: waveProgress + '%' }"></div></div>
          <div class="wp-enemies">Villains: {{ enemiesLeft }} remaining</div>
        </div>
        <!-- Battle log -->
        <div class="battle-log">
          <div v-for="(msg, i) in battleLog.slice(-8)" :key="i" class="log-msg" :class="msg.type">{{ msg.text }}</div>
        </div>
      </div>

      <!-- Powers Panel -->
      <div v-if="activeTab === 'powers'" class="panel">
        <h3>💥 Superpowers</h3>
        <p class="powers-sub">Use your heroes' powers in battle!</p>
        <div class="power-grid">
          <div v-for="h in deployedHeroData" :key="'pw-'+h.id" class="power-card">
            <div class="pw-icon" :style="{ background: h.color }">{{ h.emoji }}</div>
            <div class="pw-name">{{ h.powerName }}</div>
            <div class="pw-desc">{{ h.powerDesc }}</div>
            <button class="pw-btn" :disabled="!waveActive || powerCooldowns[h.id] > 0" @click="usePower(h)">
              {{ powerCooldowns[h.id] > 0 ? powerCooldowns[h.id] + 's' : '💥 Use' }}
            </button>
          </div>
        </div>
        <div v-if="deployedHeroData.length === 0" class="no-powers">Deploy heroes first to use their powers!</div>
      </div>

      <!-- Gem Shop Panel -->
      <div v-if="activeTab === 'shop'" class="panel">
        <h3>💎 Gem Shop</h3>
        <p class="shop-sub">Earn gems from waves! Spend them on gold!</p>
        <div class="gem-balance">Your Gems: 💎 {{ gems.toLocaleString() }}</div>
        <div class="gem-grid">
          <div class="gem-card" @click="buyGold(30, 30000)">
            <div class="gc-gold">💰 30,000</div>
            <div class="gc-price">💎 30 Gems</div>
            <button class="gc-btn" :disabled="gems < 30">Buy</button>
          </div>
          <div class="gem-card" @click="buyGold(50, 50000)">
            <div class="gc-gold">💰 50,000</div>
            <div class="gc-price">💎 50 Gems</div>
            <button class="gc-btn" :disabled="gems < 50">Buy</button>
          </div>
          <div class="gem-card hot" @click="buyGold(100, 1000000)">
            <div class="gc-tag">🔥 HOT</div>
            <div class="gc-gold">💰 1,000,000</div>
            <div class="gc-price">💎 100 Gems</div>
            <button class="gc-btn" :disabled="gems < 100">Buy</button>
          </div>
          <div class="gem-card legendary" @click="buyGold(500, 50000000)">
            <div class="gc-tag">⭐ BEST VALUE</div>
            <div class="gc-gold">💰 50,000,000</div>
            <div class="gc-price">💎 500 Gems</div>
            <button class="gc-btn" :disabled="gems < 500">Buy</button>
          </div>
        </div>
      </div>

      <!-- Wave Complete -->
      <div v-if="showWaveComplete" class="wave-complete-overlay">
        <div class="wc-card">
          <h2>⚔️ Wave {{ currentWave - 1 }} Complete!</h2>
          <div class="wc-reward">+${{ waveReward.toLocaleString() }}</div>
          <button class="wc-btn" @click="showWaveComplete = false">Continue</button>
        </div>
      </div>

      <!-- Leave -->
      <button class="leave-btn" @click="leaveGame">← Leave</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import * as THREE from 'three'

const screen = ref<'menu' | 'game'>('menu')
const money = ref(500)
const gems = ref(10)
const activeTab = ref('base')
const waveActive = ref(false)
const currentWave = ref(1)
const wavesCleared = ref(0)
const enemiesLeft = ref(0)
const waveProgress = ref(0)
const showWaveComplete = ref(false)
const waveReward = ref(0)
const autoWave = ref(false)
const battleLog = ref<{ text: string; type: string }[]>([])
const powerCooldowns = reactive<Record<string, number>>({})

interface Building {
  id: string; name: string; icon: string; effect: string; level: number
  cost: number; baseCost: number; incomePerLevel: number
}

interface Hero {
  id: string; name: string; emoji: string; color: string
  attack: number; defense: number; speed: number
  powerName: string; powerDesc: string; powerDamage: number
  cost: number
}

const buildings = reactive<Building[]>([
  { id: 'hq', name: 'Headquarters', icon: '🏢', effect: '+$10/s per level', level: 1, cost: 200, baseCost: 200, incomePerLevel: 10 },
  { id: 'lab', name: 'Science Lab', icon: '🔬', effect: '+$15/s per level', level: 0, cost: 500, baseCost: 500, incomePerLevel: 15 },
  { id: 'gym', name: 'Training Gym', icon: '💪', effect: '+10% hero attack', level: 0, cost: 800, baseCost: 800, incomePerLevel: 0 },
  { id: 'shield', name: 'Shield Generator', icon: '🛡️', effect: '+10% hero defense', level: 0, cost: 1000, baseCost: 1000, incomePerLevel: 0 },
  { id: 'radar', name: 'Radar Tower', icon: '📡', effect: '+$20/s per level', level: 0, cost: 1500, baseCost: 1500, incomePerLevel: 20 },
  { id: 'vault', name: 'Money Vault', icon: '💰', effect: '+$25/s per level', level: 0, cost: 2500, baseCost: 2500, incomePerLevel: 25 },
  { id: 'portal', name: 'Hero Portal', icon: '🌀', effect: 'Unlock epic heroes', level: 0, cost: 5000, baseCost: 5000, incomePerLevel: 0 },
  { id: 'fortress', name: 'Sky Fortress', icon: '🏰', effect: '+$50/s per level', level: 0, cost: 10000, baseCost: 10000, incomePerLevel: 50 },
])

const allHeroes: Hero[] = [
  { id: 'arachnid', name: 'Arachnid', emoji: '🕷️', color: '#dc2626', attack: 7, defense: 5, speed: 9, powerName: 'Web Blast', powerDesc: 'Traps enemies in webs, dealing 50 damage', powerDamage: 50, cost: 300 },
  { id: 'titan', name: 'Green Titan', emoji: '💪', color: '#22c55e', attack: 10, defense: 8, speed: 4, powerName: 'Smash', powerDesc: 'Massive ground pound dealing 80 damage', powerDamage: 80, cost: 500 },
  { id: 'thunder', name: 'Thunder God', emoji: '⚡', color: '#3b82f6', attack: 9, defense: 6, speed: 7, powerName: 'Lightning Strike', powerDesc: 'Calls down lightning for 70 damage', powerDamage: 70, cost: 800 },
  { id: 'stealth', name: 'Shadow Agent', emoji: '🥷', color: '#1a1a2e', attack: 8, defense: 4, speed: 10, powerName: 'Stealth Strike', powerDesc: 'Invisible attack dealing 60 damage', powerDamage: 60, cost: 600 },
  { id: 'flame', name: 'Inferno', emoji: '🔥', color: '#f97316', attack: 9, defense: 5, speed: 7, powerName: 'Fire Storm', powerDesc: 'Burns all enemies for 65 damage', powerDamage: 65, cost: 700 },
  { id: 'ice', name: 'Frost Queen', emoji: '❄️', color: '#06b6d4', attack: 7, defense: 7, speed: 6, powerName: 'Blizzard', powerDesc: 'Freezes enemies, 55 damage + slow', powerDamage: 55, cost: 650 },
  { id: 'speed', name: 'Velocity', emoji: '💨', color: '#fbbf24', attack: 6, defense: 3, speed: 10, powerName: 'Speed Blitz', powerDesc: 'Hits 5 times for 10 damage each', powerDamage: 50, cost: 400 },
  { id: 'shield', name: 'Captain Shield', emoji: '🛡️', color: '#2563eb', attack: 7, defense: 9, speed: 6, powerName: 'Shield Throw', powerDesc: 'Bouncing shield hitting for 60 damage', powerDamage: 60, cost: 750 },
  { id: 'psychic', name: 'Mind Master', emoji: '🧠', color: '#8b5cf6', attack: 8, defense: 6, speed: 7, powerName: 'Psychic Wave', powerDesc: 'Mental blast dealing 70 damage', powerDamage: 70, cost: 900 },
  { id: 'metal', name: 'Iron Knight', emoji: '🤖', color: '#64748b', attack: 8, defense: 10, speed: 5, powerName: 'Missile Barrage', powerDesc: 'Launches missiles for 75 damage', powerDamage: 75, cost: 1000 },
  { id: 'laser', name: 'Laser Eye', emoji: '👁️', color: '#ef4444', attack: 10, defense: 4, speed: 8, powerName: 'Laser Beam', powerDesc: 'Devastating beam for 85 damage', powerDamage: 85, cost: 2000 },
  { id: 'earth', name: 'Terra', emoji: '🌍', color: '#854d0e', attack: 8, defense: 9, speed: 5, powerName: 'Earthquake', powerDesc: 'Shakes the ground for 70 damage to all', powerDamage: 70, cost: 1500 },
  { id: 'dragon', name: 'Dragon Knight', emoji: '🐉', color: '#7c2d12', attack: 10, defense: 7, speed: 7, powerName: 'Dragon Breath', powerDesc: 'Fire breath dealing 90 damage', powerDamage: 90, cost: 3000 },
  { id: 'cosmic', name: 'Cosmic Guardian', emoji: '🌟', color: '#a855f7', attack: 10, defense: 8, speed: 8, powerName: 'Star Nova', powerDesc: 'Cosmic explosion dealing 100 damage', powerDamage: 100, cost: 5000 },
  { id: 'void', name: 'Void Walker', emoji: '🕳️', color: '#0f0f0f', attack: 10, defense: 10, speed: 10, powerName: 'Void Collapse', powerDesc: 'Opens a black hole for 120 damage', powerDamage: 120, cost: 10000 },
]

const ownedHeroes = ref<string[]>([])
const deployedHeroes = ref<string[]>([])

const deployedHeroData = computed(() => {
  return deployedHeroes.value.map(id => allHeroes.find(h => h.id === id)!).filter(Boolean)
})

const income = computed(() => {
  let total = 0
  for (const b of buildings) {
    total += b.level * b.incomePerLevel
  }
  return total
})

const totalPower = computed(() => {
  let power = 0
  const gymBonus = 1 + (buildings.find(b => b.id === 'gym')?.level || 0) * 0.1
  const shieldBonus = 1 + (buildings.find(b => b.id === 'shield')?.level || 0) * 0.1
  for (const id of deployedHeroes.value) {
    const h = allHeroes.find(hero => hero.id === id)
    if (h) power += Math.floor((h.attack * gymBonus + h.defense * shieldBonus + h.speed) * 10)
  }
  return power
})

// Pad system
interface FloorPad {
  id: string; label: string; costText: string; cost: number; currency: 'money' | 'gems'
  x: number; z: number; bought: boolean; type: 'building' | 'hero'
  mesh?: THREE.Mesh
}

const nearPad = ref<FloorPad | null>(null)
const canAffordPad = computed(() => {
  if (!nearPad.value) return false
  if (nearPad.value.currency === 'gems') return gems.value >= nearPad.value.cost
  return money.value >= nearPad.value.cost
})

let floorPads: FloorPad[] = []

function buyGold(gemCost: number, goldAmount: number) {
  if (gems.value < gemCost) return
  gems.value -= gemCost
  money.value += goldAmount
  addLog(`💎 Bought $${goldAmount.toLocaleString()} for ${gemCost} gems!`, 'power')
  saveGame()
}

function buyPad() {
  if (!nearPad.value || !canAffordPad.value) return
  const pad = nearPad.value
  if (pad.currency === 'gems') gems.value -= pad.cost
  else money.value -= pad.cost
  pad.bought = true

  if (pad.type === 'building') {
    const b = buildings.find(bb => bb.id === pad.id)
    if (b) { b.level++; b.cost = Math.floor(b.baseCost * Math.pow(1.5, b.level)) }
  } else if (pad.type === 'hero') {
    if (!ownedHeroes.value.includes(pad.id)) {
      ownedHeroes.value.push(pad.id)
      if (deployedHeroes.value.length < 5) deployedHeroes.value.push(pad.id)
    }
  }

  // Update 3D pad appearance
  if (pad.mesh) {
    (pad.mesh.material as THREE.MeshStandardMaterial).color.set('#22c55e')
    ;(pad.mesh.material as THREE.MeshStandardMaterial).emissive.set('#22c55e')
  }

  update3DBuildings()
  update3DHeroes()
  addLog(`✅ Bought ${pad.label}!`, 'success')
  nearPad.value = null
  saveGame()
}

// Three.js
let scene3d: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number
let buildingMeshes: THREE.Mesh[] = []
let heroMeshes: THREE.Group[] = []
let enemyMeshes: THREE.Group[] = []
let playerMesh: THREE.Group
let playerX = 0
let playerZ = 5
let cameraYaw = 0
const keys: Record<string, boolean> = {}
const WALK_SPEED = 0.08

// Timers
let incomeTimer: number | null = null
let waveTimer: number | null = null
let cooldownTimer: number | null = null

function startGame() {
  screen.value = 'game'
  loadGame()
  nextTick(() => {
    init3D()
    startIncome()
    startCooldowns()
  })
}

function leaveGame() {
  saveGame()
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (incomeTimer) clearInterval(incomeTimer)
  if (waveTimer) clearInterval(waveTimer)
  if (cooldownTimer) clearInterval(cooldownTimer)
  screen.value = 'menu'
}

function startIncome() {
  incomeTimer = setInterval(() => {
    money.value += income.value
    saveGame()
  }, 1000) as unknown as number
}

function startCooldowns() {
  cooldownTimer = setInterval(() => {
    for (const key of Object.keys(powerCooldowns)) {
      if (powerCooldowns[key] > 0) powerCooldowns[key]--
    }
  }, 1000) as unknown as number
}

// ========== BUILDINGS ==========
function buyBuilding(b: Building) {
  if (money.value < b.cost) return
  money.value -= b.cost
  b.level++
  b.cost = Math.floor(b.baseCost * Math.pow(1.5, b.level))
  update3DBuildings()
  saveGame()
}

// ========== HEROES ==========
function recruitHero(h: Hero) {
  if (money.value < h.cost || ownedHeroes.value.includes(h.id)) return
  money.value -= h.cost
  ownedHeroes.value.push(h.id)
  saveGame()
}

function deployHero(id: string) {
  if (!ownedHeroes.value.includes(id) || deployedHeroes.value.includes(id)) return
  if (deployedHeroes.value.length >= 5) {
    addLog('Max 5 heroes deployed!', 'warn')
    return
  }
  deployedHeroes.value.push(id)
  update3DHeroes()
  saveGame()
}

// ========== BATTLE ==========
function startWave() {
  if (deployedHeroes.value.length === 0) return
  waveActive.value = true
  const enemyCount = 3 + currentWave.value * 2
  enemiesLeft.value = enemyCount
  waveProgress.value = 0

  addLog(`Wave ${currentWave.value} started! ${enemyCount} villains incoming!`, 'info')
  spawn3DEnemies(enemyCount)

  waveTimer = setInterval(() => {
    if (enemiesLeft.value <= 0) {
      clearInterval(waveTimer!)
      waveActive.value = false
      waveReward.value = currentWave.value * 200 + totalPower.value
      money.value += waveReward.value
      const gemsEarned = 2 + currentWave.value
      gems.value += gemsEarned
      wavesCleared.value++
      currentWave.value++
      showWaveComplete.value = true
      clear3DEnemies()
      addLog(`Wave complete! +$${waveReward.value.toLocaleString()}`, 'success')
      saveGame()
      if (autoWave.value) {
        setTimeout(() => {
          showWaveComplete.value = false
          startWave()
        }, 2000)
      }
      return
    }

    // Heroes auto-attack
    for (const id of deployedHeroes.value) {
      const h = allHeroes.find(hero => hero.id === id)
      if (!h) continue
      const gymBonus = 1 + (buildings.find(b => b.id === 'gym')?.level || 0) * 0.1
      const dmg = Math.floor(h.attack * gymBonus * (0.8 + Math.random() * 0.4))
      if (Math.random() < 0.3) {
        enemiesLeft.value = Math.max(0, enemiesLeft.value - 1)
        addLog(`${h.name} defeated a villain! (${dmg} dmg)`, 'success')
        remove3DEnemy()
      }
    }

    // Enemies fight back
    if (Math.random() < 0.15 * currentWave.value * 0.3) {
      const randomHero = deployedHeroData.value[Math.floor(Math.random() * deployedHeroData.value.length)]
      if (randomHero) {
        addLog(`A villain attacks ${randomHero.name}!`, 'danger')
      }
    }

    waveProgress.value = Math.floor(((3 + currentWave.value * 2 - enemiesLeft.value) / (3 + currentWave.value * 2)) * 100)
  }, 800) as unknown as number
}

function usePower(h: Hero) {
  if (!waveActive.value || powerCooldowns[h.id] > 0) return
  const kills = Math.floor(h.powerDamage / (20 + currentWave.value * 3))
  enemiesLeft.value = Math.max(0, enemiesLeft.value - Math.max(1, kills))
  powerCooldowns[h.id] = 10
  addLog(`⚡ ${h.name} uses ${h.powerName}! Defeated ${kills} villains!`, 'power')
  for (let i = 0; i < kills; i++) remove3DEnemy()
}

function toggleAutoWave() {
  autoWave.value = !autoWave.value
}

function addLog(text: string, type: string) {
  battleLog.value.push({ text, type })
  if (battleLog.value.length > 50) battleLog.value.shift()
}

// ========== THREE.JS ==========
function init3D() {
  const container = document.querySelector('.three-container') as HTMLElement
  if (!container) return

  scene3d = new THREE.Scene()
  scene3d.background = new THREE.Color('#1a2040')
  scene3d.fog = new THREE.Fog('#1a2040', 30, 60)

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 10, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  scene3d.add(new THREE.AmbientLight('#6688aa', 0.6))
  const sun = new THREE.DirectionalLight('#ffffff', 1)
  sun.position.set(10, 15, 5)
  sun.castShadow = true
  scene3d.add(sun)

  // Ground
  const groundGeo = new THREE.PlaneGeometry(40, 40)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#1a3a2a', roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene3d.add(ground)

  // Platform
  const platGeo = new THREE.CylinderGeometry(6, 6.5, 0.5, 32)
  const platMat = new THREE.MeshStandardMaterial({ color: '#2a3a4a', roughness: 0.7 })
  const plat = new THREE.Mesh(platGeo, platMat)
  plat.position.y = 0.25
  plat.receiveShadow = true
  scene3d.add(plat)

  // Player character
  playerMesh = new THREE.Group()
  const pBody = new THREE.CapsuleGeometry(0.25, 0.5, 8, 16)
  const pMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.5 })
  const pMesh = new THREE.Mesh(pBody, pMat)
  pMesh.position.y = 0.75
  pMesh.castShadow = true
  playerMesh.add(pMesh)
  const pHead = new THREE.SphereGeometry(0.2, 12, 12)
  const pHeadMat = new THREE.MeshStandardMaterial({ color: '#ddb892' })
  const pHeadMesh = new THREE.Mesh(pHead, pHeadMat)
  pHeadMesh.position.y = 1.3
  playerMesh.add(pHeadMesh)
  // Cape
  const capeMat = new THREE.MeshStandardMaterial({ color: '#ef4444', side: THREE.DoubleSide })
  const capeGeo = new THREE.PlaneGeometry(0.45, 0.5)
  const cape = new THREE.Mesh(capeGeo, capeMat)
  cape.position.set(0, 0.7, 0.2)
  cape.rotation.x = 0.2
  playerMesh.add(cape)
  playerMesh.position.set(playerX, 0.5, playerZ)
  scene3d.add(playerMesh)

  // Create floor pads
  createFloorPads()

  update3DBuildings()
  update3DHeroes()
  animate()

  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', (e) => { keys[e.code] = true })
  window.addEventListener('keyup', (e) => { keys[e.code] = false })
}

function createFloorPads() {
  floorPads = []

  // Building pads in a ring
  const bPads = buildings.map((b, i) => ({
    id: b.id, label: b.name + (b.level > 0 ? ` (Lv${b.level + 1})` : ''),
    costText: '$' + b.cost.toLocaleString(), cost: b.cost, currency: 'money' as const,
    x: Math.cos((i / buildings.length) * Math.PI * 2) * 5,
    z: Math.sin((i / buildings.length) * Math.PI * 2) * 5,
    bought: false, type: 'building' as const,
  }))

  // Hero pads in outer ring
  const hPads = allHeroes.slice(0, 10).map((h, i) => ({
    id: h.id, label: h.name,
    costText: '$' + h.cost.toLocaleString(), cost: h.cost, currency: 'money' as const,
    x: Math.cos((i / 10) * Math.PI * 2) * 9,
    z: Math.sin((i / 10) * Math.PI * 2) * 9,
    bought: ownedHeroes.value.includes(h.id), type: 'hero' as const,
  }))

  floorPads = [...bPads, ...hPads]

  // Create 3D pad meshes
  for (const pad of floorPads) {
    const padGeo = new THREE.BoxGeometry(1.2, 0.1, 1.2)
    const padColor = pad.bought ? '#22c55e' : pad.type === 'building' ? '#3b82f6' : '#fbbf24'
    const padMat = new THREE.MeshStandardMaterial({
      color: padColor, emissive: padColor, emissiveIntensity: 0.3, roughness: 0.5,
    })
    const padMesh = new THREE.Mesh(padGeo, padMat)
    padMesh.position.set(pad.x, 0.55, pad.z)
    padMesh.receiveShadow = true
    scene3d.add(padMesh)
    pad.mesh = padMesh

    // Label above pad
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 64
    const c = canvas.getContext('2d')!
    c.fillStyle = 'rgba(0,0,0,0.6)'
    c.fillRect(0, 0, 256, 64)
    c.fillStyle = '#fff'
    c.font = 'bold 16px Arial'
    c.textAlign = 'center'
    c.fillText(pad.label.substring(0, 20), 128, 25)
    c.fillStyle = pad.bought ? '#4ade80' : '#fbbf24'
    c.font = '14px Arial'
    c.fillText(pad.bought ? '✅ Owned' : pad.costText, 128, 48)
    const tex = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
    sprite.position.set(pad.x, 1.5, pad.z)
    sprite.scale.set(1.8, 0.45, 1)
    scene3d.add(sprite)
  }
}

function update3DBuildings() {
  for (const m of buildingMeshes) scene3d.remove(m)
  buildingMeshes = []

  const builtBuildings = buildings.filter(b => b.level > 0)
  const count = builtBuildings.length
  builtBuildings.forEach((b, i) => {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2
    const r = 3
    const height = 1 + b.level * 0.5
    const colors: Record<string, string> = {
      hq: '#3b82f6', lab: '#22c55e', gym: '#f97316', shield: '#06b6d4',
      radar: '#8b5cf6', vault: '#fbbf24', portal: '#ec4899', fortress: '#ef4444',
    }

    const geo = new THREE.BoxGeometry(1, height, 1)
    const mat = new THREE.MeshStandardMaterial({ color: colors[b.id] || '#666', roughness: 0.6 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(Math.cos(angle) * r, height / 2 + 0.5, Math.sin(angle) * r)
    mesh.castShadow = true
    scene3d.add(mesh)
    buildingMeshes.push(mesh)

    // Roof
    const roofGeo = new THREE.ConeGeometry(0.7, 0.5, 4)
    const roof = new THREE.Mesh(roofGeo, mat)
    roof.position.set(Math.cos(angle) * r, height + 0.75, Math.sin(angle) * r)
    roof.rotation.y = Math.PI / 4
    scene3d.add(roof)
    buildingMeshes.push(roof)
  })
}

function update3DHeroes() {
  for (const m of heroMeshes) scene3d.remove(m)
  heroMeshes = []

  deployedHeroes.value.forEach((id, i) => {
    const h = allHeroes.find(hero => hero.id === id)
    if (!h) return

    const group = new THREE.Group()
    const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.4, 8, 16)
    const bodyMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.5 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.7
    body.castShadow = true
    group.add(body)

    const headGeo = new THREE.SphereGeometry(0.15, 12, 12)
    const headMat = new THREE.MeshStandardMaterial({ color: '#ddb892' })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.15
    group.add(head)

    // Cape
    const capeGeo = new THREE.PlaneGeometry(0.4, 0.5)
    const capeMat = new THREE.MeshStandardMaterial({ color: h.color, side: THREE.DoubleSide })
    const cape = new THREE.Mesh(capeGeo, capeMat)
    cape.position.set(0, 0.7, 0.2)
    cape.rotation.x = 0.2
    group.add(cape)

    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
    group.position.set(Math.cos(angle) * 1.5, 0.5, Math.sin(angle) * 1.5)
    scene3d.add(group)
    heroMeshes.push(group)
  })
}

function spawn3DEnemies(count: number) {
  clear3DEnemies()
  for (let i = 0; i < Math.min(count, 15); i++) {
    const group = new THREE.Group()
    const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.4, 8, 16)
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#4a0020', roughness: 0.6 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.7
    body.castShadow = true
    group.add(body)

    const headGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const headMat = new THREE.MeshStandardMaterial({ color: '#2a0010' })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.15
    group.add(head)

    // Evil horns
    const hornGeo = new THREE.ConeGeometry(0.04, 0.15, 6)
    const hornMat = new THREE.MeshStandardMaterial({ color: '#ff0000' })
    const horn1 = new THREE.Mesh(hornGeo, hornMat)
    horn1.position.set(-0.08, 1.3, 0)
    group.add(horn1)
    const horn2 = horn1.clone()
    horn2.position.x = 0.08
    group.add(horn2)

    const angle = Math.random() * Math.PI * 2
    const dist = 7 + Math.random() * 4
    group.position.set(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist)
    group.userData.targetAngle = angle
    scene3d.add(group)
    enemyMeshes.push(group)
  }
}

function remove3DEnemy() {
  if (enemyMeshes.length > 0) {
    const m = enemyMeshes.pop()!
    scene3d.remove(m)
  }
}

function clear3DEnemies() {
  for (const m of enemyMeshes) scene3d.remove(m)
  enemyMeshes = []
}

function animate() {
  animFrame = requestAnimationFrame(animate)
  const time = Date.now() * 0.001

  // Player movement (WASD)
  let dx = 0, dz = 0
  if (keys['KeyW'] || keys['ArrowUp']) dz -= WALK_SPEED
  if (keys['KeyS'] || keys['ArrowDown']) dz += WALK_SPEED
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= WALK_SPEED
  if (keys['KeyD'] || keys['ArrowRight']) dx += WALK_SPEED

  if (dx !== 0 || dz !== 0) {
    playerX = Math.max(-15, Math.min(15, playerX + dx))
    playerZ = Math.max(-15, Math.min(15, playerZ + dz))
    if (playerMesh) {
      playerMesh.position.set(playerX, 0.5, playerZ)
      playerMesh.rotation.y = Math.atan2(dx, dz)
    }
  }

  // Walking bob
  if (playerMesh && (dx !== 0 || dz !== 0)) {
    playerMesh.position.y = 0.5 + Math.abs(Math.sin(time * 8)) * 0.06
  }

  // Check near floor pads
  nearPad.value = null
  for (const pad of floorPads) {
    if (pad.bought) continue
    const dist = Math.sqrt((playerX - pad.x) ** 2 + (playerZ - pad.z) ** 2)
    if (dist < 1.2) {
      nearPad.value = pad
      // Glow the pad
      if (pad.mesh) {
        (pad.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(time * 4) * 0.3
      }
      break
    }
  }

  // Third person camera follows player
  const camDist = 6
  const camHeight = 4
  camera.position.lerp(new THREE.Vector3(playerX, camHeight, playerZ + camDist), 0.08)
  camera.lookAt(playerX, 1, playerZ)

  // Bob heroes
  heroMeshes.forEach((m, i) => {
    m.position.y = 0.5 + Math.sin(time * 2 + i) * 0.05
  })

  // Enemies approach
  for (const e of enemyMeshes) {
    const dir = new THREE.Vector3(-e.position.x, 0, -e.position.z).normalize()
    e.position.x += dir.x * 0.005
    e.position.z += dir.z * 0.005
    e.lookAt(0, e.position.y, 0)
  }

  // Pulse unbought pads
  for (const pad of floorPads) {
    if (!pad.bought && pad.mesh && pad !== nearPad.value) {
      (pad.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1
    }
  }

  renderer.render(scene3d, camera)
}

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ========== SAVE/LOAD ==========
function saveGame() {
  localStorage.setItem('heroTycoon', JSON.stringify({
    money: money.value,
    gems: gems.value,
    buildings: buildings.map(b => ({ id: b.id, level: b.level, cost: b.cost })),
    ownedHeroes: ownedHeroes.value,
    deployedHeroes: deployedHeroes.value,
    currentWave: currentWave.value,
    wavesCleared: wavesCleared.value,
  }))
}

function loadGame() {
  const saved = localStorage.getItem('heroTycoon')
  if (saved) {
    const d = JSON.parse(saved)
    money.value = d.money || 500
    gems.value = d.gems || 10
    if (d.buildings) {
      for (const sb of d.buildings) {
        const b = buildings.find(bb => bb.id === sb.id)
        if (b) { b.level = sb.level; b.cost = sb.cost }
      }
    }
    ownedHeroes.value = d.ownedHeroes || []
    deployedHeroes.value = d.deployedHeroes || []
    currentWave.value = d.currentWave || 1
    wavesCleared.value = d.wavesCleared || 0
  }
}

onMounted(() => {})

onUnmounted(() => {
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (incomeTimer) clearInterval(incomeTimer)
  if (waveTimer) clearInterval(waveTimer)
  if (cooldownTimer) clearInterval(cooldownTimer)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.ht-app { font-family: 'Segoe UI', system-ui, sans-serif; }

.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a0a2a, #1a1040, #0a2040);
}
.menu-card {
  background: rgba(10,10,30,0.95); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #fbbf24; max-width: 400px; width: 90%;
}
.menu-icon { font-size: 72px; }
.menu-title { color: #fbbf24; font-size: 32px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #94a3b8; font-size: 15px; margin: 0 0 24px; }
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #fbbf24, #f97316); color: #000;
  font-size: 20px; font-weight: 900; cursor: pointer;
}
.play-btn:hover { transform: scale(1.05); }
.play-btn:disabled { opacity: 0.4; }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

.game-screen { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.three-container { position: fixed; inset: 0; z-index: 1; }

/* HUD */
.hud-top {
  position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 12px; z-index: 10;
}
.hud-money, .hud-income, .hud-wave {
  background: rgba(0,0,0,0.7); padding: 6px 14px; border-radius: 10px;
  font-size: 14px; font-weight: 700; backdrop-filter: blur(4px);
}
.hud-money { color: #fbbf24; }
.hud-gems { color: #60d5f7; }
.hud-income { color: #4ade80; }
.hud-wave { color: #ef4444; }

/* Pad prompt */
.pad-prompt {
  position: fixed; bottom: 55vh; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.85); padding: 12px 20px; border-radius: 12px;
  text-align: center; z-index: 15; border: 2px solid #fbbf24;
  backdrop-filter: blur(4px);
}
.pp-name { color: #fff; font-size: 16px; font-weight: 800; }
.pp-cost { color: #fbbf24; font-size: 14px; font-weight: 700; margin: 4px 0; }
.pp-btn {
  padding: 6px 20px; border-radius: 8px; border: none; background: #22c55e;
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
}
.pp-btn:disabled { background: #ef4444; opacity: 0.7; }

/* Tabs */
.tab-bar {
  position: fixed; top: 50px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px; z-index: 10;
}
.tab {
  padding: 6px 14px; border-radius: 8px; border: 1px solid #333;
  background: rgba(0,0,0,0.6); color: #94a3b8; font-size: 12px; font-weight: 700;
  cursor: pointer; backdrop-filter: blur(4px);
}
.tab:hover { color: #fff; }
.tab.active { background: rgba(251,191,36,0.3); color: #fbbf24; border-color: #fbbf24; }

/* Panel */
.panel {
  position: fixed; bottom: 0; left: 0; right: 0; max-height: 55vh;
  background: rgba(10,10,20,0.95); border-top: 2px solid #333;
  padding: 14px; overflow-y: auto; z-index: 10;
  backdrop-filter: blur(8px);
}
.panel h3 { color: #fff; font-size: 18px; margin: 0 0 10px; }

/* Build grid */
.build-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.build-card {
  background: #1a1a2e; border: 1px solid #333; border-radius: 10px; padding: 10px; text-align: center;
}
.build-card.owned { border-color: #22c55e; }
.bc-icon { font-size: 28px; }
.bc-name { color: #fff; font-size: 13px; font-weight: 700; }
.bc-level { color: #4ade80; font-size: 11px; font-weight: 700; }
.bc-effect { color: #94a3b8; font-size: 10px; margin: 4px 0; }
.bc-btn {
  padding: 4px 12px; border-radius: 6px; border: none;
  background: #3b82f6; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
}
.bc-btn:disabled { opacity: 0.3; }

/* Hero grid */
.hero-grid { display: flex; flex-direction: column; gap: 8px; }
.hero-card {
  display: flex; align-items: center; gap: 10px; background: #1a1a2e;
  border: 1px solid #333; border-radius: 10px; padding: 10px;
}
.hero-card.owned { border-color: #22c55e; }
.hero-card.deployed { border-color: #fbbf24; }
.hc-avatar {
  width: 40px; height: 40px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.hc-info { flex: 1; }
.hc-name { color: #fff; font-size: 14px; font-weight: 800; }
.hc-power { color: #fbbf24; font-size: 11px; }
.hc-stats { display: flex; gap: 8px; font-size: 11px; color: #94a3b8; }
.hc-btn {
  padding: 6px 14px; border-radius: 8px; border: none; font-size: 12px;
  font-weight: 700; cursor: pointer; flex-shrink: 0;
}
.hc-btn.buy { background: #3b82f6; color: #fff; }
.hc-btn.buy:disabled { opacity: 0.3; }
.hc-btn.deploy { background: #22c55e; color: #fff; }
.hc-deployed { color: #fbbf24; font-size: 12px; font-weight: 700; flex-shrink: 0; }

/* Battle */
.battle-info { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.bi-stat { background: #1a1a2e; padding: 6px 12px; border-radius: 8px; color: #94a3b8; font-size: 13px; font-weight: 600; }
.wave-btn {
  padding: 10px 24px; border-radius: 10px; border: none;
  background: #ef4444; color: #fff; font-size: 16px; font-weight: 800; cursor: pointer;
  margin-right: 8px; margin-bottom: 8px;
}
.wave-btn.bot-mode { background: #f59e0b; }
.wave-btn:disabled { opacity: 0.3; }
.wave-progress { margin: 10px 0; }
.wp-bar { height: 12px; background: #333; border-radius: 6px; overflow: hidden; }
.wp-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); border-radius: 6px; transition: width 0.3s; }
.wp-enemies { color: #f87171; font-size: 13px; margin-top: 4px; }
.battle-log { max-height: 120px; overflow-y: auto; margin-top: 8px; }
.log-msg { font-size: 12px; padding: 2px 0; }
.log-msg.info { color: #94a3b8; }
.log-msg.success { color: #4ade80; }
.log-msg.danger { color: #f87171; }
.log-msg.warn { color: #fbbf24; }
.log-msg.power { color: #c084fc; font-weight: 700; }

/* Powers */
.powers-sub { color: #94a3b8; font-size: 13px; margin: 0 0 10px; }
.power-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.power-card {
  background: #1a1a2e; border: 1px solid #333; border-radius: 10px; padding: 10px; text-align: center;
}
.pw-icon {
  width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 6px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.pw-name { color: #fbbf24; font-size: 13px; font-weight: 700; }
.pw-desc { color: #94a3b8; font-size: 10px; margin: 4px 0 8px; }
.pw-btn {
  padding: 4px 14px; border-radius: 6px; border: none;
  background: #8b5cf6; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
}
.pw-btn:disabled { opacity: 0.3; }
.no-powers { color: #666; font-size: 14px; text-align: center; padding: 20px; }

/* Gem Shop */
.shop-sub { color: #94a3b8; font-size: 13px; margin: 0 0 8px; }
.gem-balance { color: #60d5f7; font-size: 18px; font-weight: 800; margin-bottom: 12px; }
.gem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.gem-card {
  background: #1a1a2e; border: 2px solid #333; border-radius: 14px; padding: 14px;
  text-align: center; cursor: pointer; transition: all 0.15s; position: relative;
}
.gem-card:hover { border-color: #60d5f7; transform: translateY(-2px); }
.gem-card.hot { border-color: #f97316; }
.gem-card.legendary { border-color: #fbbf24; box-shadow: 0 0 15px rgba(251,191,36,0.3); }
.gc-tag {
  position: absolute; top: -8px; right: -4px; background: #f97316; color: #fff;
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800;
}
.gem-card.legendary .gc-tag { background: #fbbf24; color: #000; }
.gc-gold { color: #fbbf24; font-size: 18px; font-weight: 900; margin-bottom: 4px; }
.gc-price { color: #60d5f7; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.gc-btn {
  padding: 6px 18px; border-radius: 8px; border: none; background: #3b82f6;
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}
.gc-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Wave complete */
.wave-complete-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 30;
}
.wc-card {
  background: #111; border-radius: 20px; padding: 32px; text-align: center;
  border: 3px solid #fbbf24; animation: pop-in 0.4s ease-out;
}
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.wc-card h2 { color: #fff; margin: 0 0 12px; }
.wc-reward { color: #fbbf24; font-size: 28px; font-weight: 900; margin-bottom: 16px; }
.wc-btn { padding: 10px 30px; border-radius: 10px; border: none; background: #22c55e; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; }

.leave-btn {
  position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.5);
  color: #fff; border: none; padding: 6px 12px; border-radius: 8px;
  font-size: 12px; cursor: pointer; z-index: 10;
}

@media (max-width: 600px) {
  .build-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .hud-top { gap: 6px; }
  .hud-money, .hud-income, .hud-wave { font-size: 12px; padding: 4px 10px; }
  .tab { padding: 5px 10px; font-size: 11px; }
  .panel { max-height: 50vh; padding: 10px; }
}
</style>
