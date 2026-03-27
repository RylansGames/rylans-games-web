<template>
  <div class="fishing-app">
    <!-- Back button -->
    <button class="back-btn" @click="$router.push('/')" v-if="screen !== 'catch'">← Back</button>

    <!-- Money Display -->
    <div class="money-hud" v-if="screen !== 'title'">
      <span class="money-icon">💰</span>
      <span class="money-amount">${{ money.toLocaleString() }}</span>
    </div>

    <!-- Rod Display -->
    <div class="rod-hud" v-if="inFishingScreens">
      <span>🎣 {{ currentRod.name }}</span>
      <span class="luck-badge">Luck: {{ currentRod.luck }}x</span>
    </div>

    <!-- ===== TITLE SCREEN ===== -->
    <div v-if="screen === 'title'" class="title-screen">
      <div class="title-card">
        <div class="title-fish">🐟</div>
        <h1 class="title-text">Fishing Tycoon</h1>
        <p class="title-sub">Catch fish, sell 'em, get rich!</p>
        <button class="play-btn" @click="startGame">Start Fishing</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
      <div class="water-bg">
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
      </div>
    </div>

    <!-- ===== 3D CANVAS ===== -->
    <div ref="canvasContainer" class="canvas-container" v-show="screen !== 'title' && screen !== 'shop' && screen !== 'inventory' && screen !== 'upgrades'"></div>

    <!-- Cast Button -->
    <div v-if="screen === 'fishing'" class="action-area">
      <button class="cast-btn" @click="castLine">🎣 Cast Line</button>
      <button class="shop-btn" @click="screen = 'shop'">🛒 Shop</button>
      <button class="inv-btn" @click="screen = 'inventory'">🎒 Inventory</button>
      <button class="upgrade-btn" @click="screen = 'upgrades'">⬆️ Upgrades</button>
    </div>

    <!-- Waiting -->
    <div v-if="screen === 'waiting'" class="waiting-text">
      <div class="dots-loading">Waiting for a bite{{ '.'.repeat(dotCount) }}</div>
    </div>

    <!-- BITE! -->
    <div v-if="screen === 'catch'" class="bite-alert" @click="startMinigame">
      <div class="bite-text">🐟 BITE! TAP NOW!</div>
    </div>

    <!-- ===== CATCH MINIGAME ===== -->
    <div v-if="screen === 'minigame'" class="minigame-overlay">
      <div class="minigame-card">
        <h2 class="mg-title">Reel it in!</h2>
        <p class="mg-sub">Press SPACE or TAP when the needle is in the green!</p>
        <div class="gauge-container">
          <div class="gauge-bar">
            <div class="gauge-green" :style="{ left: greenStart + '%', width: greenWidth + '%' }"></div>
            <div class="gauge-needle" :style="{ left: needlePos + '%' }"></div>
          </div>
          <div class="gauge-labels">
            <span>Miss</span>
            <span style="color: #22c55e; font-weight: 800;">CATCH!</span>
            <span>Miss</span>
          </div>
        </div>
        <button class="reel-btn" @click="reelIn">🎣 REEL!</button>
        <div class="mg-hint">
          <span :class="'rarity-hint ' + currentFishRarity">
            {{ rarityHintText }}
          </span>
        </div>
      </div>
    </div>

    <!-- ===== RESULT ===== -->
    <div v-if="screen === 'result'" class="result-overlay">
      <div class="result-card" :class="caughtFish?.rarity">
        <template v-if="caughtFish">
          <div class="result-emoji">{{ caughtFish.emoji }}</div>
          <h2 class="result-name">{{ caughtFish.name }}</h2>
          <div class="result-rarity" :class="caughtFish.rarity">{{ caughtFish.rarity.toUpperCase() }}</div>
          <div class="result-value">Worth: ${{ getSellPrice(caughtFish).toLocaleString() }}</div>
          <div class="result-actions">
            <button class="sell-btn" @click="sellFish">💰 Sell for ${{ getSellPrice(caughtFish).toLocaleString() }}</button>
            <button class="keep-btn" @click="keepFish">🎒 Keep</button>
          </div>
        </template>
        <template v-else>
          <div class="result-emoji">💨</div>
          <h2 class="result-name">It got away!</h2>
          <p class="result-miss">The fish escaped... try again!</p>
          <button class="try-again-btn" @click="screen = 'fishing'">Try Again</button>
        </template>
      </div>
    </div>

    <!-- ===== SHOP ===== -->
    <div v-if="screen === 'shop'" class="shop-screen">
      <div class="shop-header">
        <h1>🛒 Rod Shop</h1>
        <button class="close-btn" @click="screen = 'fishing'">✕</button>
      </div>
      <div class="shop-grid">
        <div v-for="rod in rods" :key="rod.id" class="shop-card" :class="{ owned: ownedRods.includes(rod.id), equipped: currentRod.id === rod.id }">
          <div class="shop-rod-icon">{{ rod.icon }}</div>
          <div class="shop-rod-name">{{ rod.name }}</div>
          <div class="shop-rod-luck">Luck: {{ rod.luck }}x</div>
          <div class="shop-rod-desc">{{ rod.desc }}</div>
          <button v-if="!ownedRods.includes(rod.id)" class="buy-btn" :disabled="money < rod.price" @click="buyRod(rod)">
            Buy - ${{ rod.price.toLocaleString() }}
          </button>
          <button v-else-if="currentRod.id !== rod.id" class="equip-btn" @click="equipRod(rod)">Equip</button>
          <div v-else class="equipped-badge">✅ Equipped</div>
        </div>
      </div>
    </div>

    <!-- ===== UPGRADES ===== -->
    <div v-if="screen === 'upgrades'" class="upgrades-screen">
      <div class="shop-header">
        <h1>⬆️ Upgrades</h1>
        <button class="close-btn" @click="screen = 'fishing'">✕</button>
      </div>
      <div class="upgrades-grid">
        <!-- Money Upgrade -->
        <div class="upgrade-card">
          <div class="upgrade-icon">💰</div>
          <h3 class="upgrade-name">Upgrade Money</h3>
          <p class="upgrade-desc">Fish sell for more money!</p>
          <div class="upgrade-level">Level {{ moneyUpgradeLevel }} / {{ maxMoneyLevel }}</div>
          <div class="upgrade-effect">Current: {{ moneyMultiplier.toFixed(1) }}x sell price</div>
          <div class="upgrade-next" v-if="moneyUpgradeLevel < maxMoneyLevel">
            Next: {{ (1 + (moneyUpgradeLevel + 1) * 0.5).toFixed(1) }}x sell price
          </div>
          <div class="upgrade-next maxed" v-else>MAXED OUT!</div>
          <button
            v-if="moneyUpgradeLevel < maxMoneyLevel"
            class="upgrade-buy-btn"
            :disabled="money < moneyUpgradeCost"
            @click="buyMoneyUpgrade"
          >
            Buy - ${{ moneyUpgradeCost.toLocaleString() }}
          </button>
        </div>

        <!-- Fish Faster Upgrade -->
        <div class="upgrade-card">
          <div class="upgrade-icon">⚡</div>
          <h3 class="upgrade-name">Fish Faster</h3>
          <p class="upgrade-desc">Fish bite quicker!</p>
          <div class="upgrade-level">Level {{ speedUpgradeLevel }} / {{ maxSpeedLevel }}</div>
          <div class="upgrade-effect">Current: {{ currentWaitMin.toFixed(1) }}s - {{ currentWaitMax.toFixed(1) }}s wait</div>
          <div class="upgrade-next" v-if="speedUpgradeLevel < maxSpeedLevel">
            Next: {{ nextWaitMin.toFixed(1) }}s - {{ nextWaitMax.toFixed(1) }}s wait
          </div>
          <div class="upgrade-next maxed" v-else>MAXED OUT!</div>
          <button
            v-if="speedUpgradeLevel < maxSpeedLevel"
            class="upgrade-buy-btn"
            :disabled="money < speedUpgradeCost"
            @click="buySpeedUpgrade"
          >
            Buy - ${{ speedUpgradeCost.toLocaleString() }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== INVENTORY ===== -->
    <div v-if="screen === 'inventory'" class="inv-screen">
      <div class="shop-header">
        <h1>🎒 My Fish ({{ inventory.length }})</h1>
        <button class="close-btn" @click="screen = 'fishing'">✕</button>
      </div>
      <div v-if="inventory.length === 0" class="inv-empty">No fish yet! Go catch some! 🎣</div>
      <div class="inv-grid">
        <div v-for="(fish, i) in inventory" :key="'inv'+i" class="inv-card" :class="fish.rarity">
          <div class="inv-emoji">{{ fish.emoji }}</div>
          <div class="inv-name">{{ fish.name }}</div>
          <div class="inv-rarity" :class="fish.rarity">{{ fish.rarity }}</div>
          <button class="sell-sm-btn" @click="sellFromInv(i)">${{ getSellPrice(fish).toLocaleString() }}</button>
        </div>
      </div>
      <button v-if="inventory.length > 0" class="sell-all-btn" @click="sellAll">
        💰 Sell All (${{ inventoryValue.toLocaleString() }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'

type Screen = 'title' | 'fishing' | 'casting' | 'waiting' | 'catch' | 'minigame' | 'result' | 'shop' | 'inventory' | 'upgrades'
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface Fish { name: string; emoji: string; rarity: Rarity; value: number }
interface Rod { id: string; name: string; icon: string; luck: number; price: number; desc: string }

const screen = ref<Screen>('title')
const money = ref(0)
const dotCount = ref(1)
const caughtFish = ref<Fish | null>(null)
const currentFishRarity = ref<Rarity>('common')
const inventory = ref<Fish[]>([])
const canvasContainer = ref<HTMLElement | null>(null)

// Upgrades
const moneyUpgradeLevel = ref(0)
const speedUpgradeLevel = ref(0)
const maxMoneyLevel = 10
const maxSpeedLevel = 8

const moneyMultiplier = computed(() => 1 + moneyUpgradeLevel.value * 0.5)
// Wait time: starts at 5-9s, goes down to 1-3s at max level
const currentWaitMin = computed(() => Math.max(1, 5 - speedUpgradeLevel.value * 0.5))
const currentWaitMax = computed(() => Math.max(3, 9 - speedUpgradeLevel.value * 0.75))
const nextWaitMin = computed(() => Math.max(1, 5 - (speedUpgradeLevel.value + 1) * 0.5))
const nextWaitMax = computed(() => Math.max(3, 9 - (speedUpgradeLevel.value + 1) * 0.75))

const moneyUpgradeCost = computed(() => {
  const costs = [100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000, 100000]
  return costs[moneyUpgradeLevel.value] || 999999
})

const speedUpgradeCost = computed(() => {
  const costs = [150, 500, 1200, 3000, 7000, 15000, 35000, 80000]
  return costs[speedUpgradeLevel.value] || 999999
})

function buyMoneyUpgrade() {
  if (moneyUpgradeLevel.value >= maxMoneyLevel || money.value < moneyUpgradeCost.value) return
  money.value -= moneyUpgradeCost.value
  moneyUpgradeLevel.value++
  saveGame()
}

function buySpeedUpgrade() {
  if (speedUpgradeLevel.value >= maxSpeedLevel || money.value < speedUpgradeCost.value) return
  money.value -= speedUpgradeCost.value
  speedUpgradeLevel.value++
  saveGame()
}

// Minigame
const needlePos = ref(0)
const greenStart = ref(35)
const greenWidth = ref(30)
let needleDir = 1
let needleSpeed = 1.5
let minigameInterval: number | null = null

const inFishingScreens = computed(() =>
  ['fishing', 'casting', 'waiting', 'catch', 'result'].includes(screen.value)
)

const rarityHintText = computed(() => {
  const hints: Record<Rarity, string> = {
    legendary: '⭐ LEGENDARY on the line!',
    epic: '💜 EPIC fish spotted!',
    rare: '💙 Rare fish!',
    uncommon: '💚 Uncommon catch',
    common: '🤍 Common fish',
  }
  return hints[currentFishRarity.value]
})

// Rods
const rods: Rod[] = [
  { id: 'wooden', name: 'Wooden Rod', icon: '🪵', luck: 1, price: 0, desc: 'A basic wooden rod. Gets the job done!' },
  { id: 'bamboo', name: 'Bamboo Rod', icon: '🎋', luck: 1.5, price: 200, desc: 'Light and flexible. Better luck finding uncommon fish.' },
  { id: 'fiberglass', name: 'Fiberglass Rod', icon: '🔧', luck: 2, price: 800, desc: 'Modern and strong. Rare fish appear more often.' },
  { id: 'carbon', name: 'Carbon Fiber Rod', icon: '⚡', luck: 3, price: 2500, desc: 'High-tech rod. Epic fish are within reach!' },
  { id: 'titanium', name: 'Titanium Pro Rod', icon: '🔩', luck: 4.5, price: 8000, desc: 'Professional grade. Legendary fish fear this rod.' },
  { id: 'golden', name: 'Golden Rod', icon: '👑', luck: 6, price: 25000, desc: 'The ultimate rod. Legends bow before you.' },
  { id: 'mythic', name: 'Mythic Trident', icon: '🔱', luck: 10, price: 100000, desc: 'Forged by Poseidon himself. Nothing escapes.' },
]
const ownedRods = ref<string[]>(['wooden'])
const currentRod = ref<Rod>(rods[0])

// Fish
const allFish: Fish[] = [
  { name: 'Bluegill', emoji: '🐟', rarity: 'common', value: 5 },
  { name: 'Sardine', emoji: '🐟', rarity: 'common', value: 8 },
  { name: 'Minnow', emoji: '🐟', rarity: 'common', value: 3 },
  { name: 'Perch', emoji: '🐟', rarity: 'common', value: 12 },
  { name: 'Catfish', emoji: '🐱', rarity: 'common', value: 15 },
  { name: 'Carp', emoji: '🐟', rarity: 'common', value: 10 },
  { name: 'Sunfish', emoji: '🌞', rarity: 'common', value: 8 },
  { name: 'Trout', emoji: '🐟', rarity: 'common', value: 20 },
  { name: 'Bass', emoji: '🐠', rarity: 'uncommon', value: 35 },
  { name: 'Salmon', emoji: '🐠', rarity: 'uncommon', value: 45 },
  { name: 'Pike', emoji: '🐠', rarity: 'uncommon', value: 55 },
  { name: 'Walleye', emoji: '🐠', rarity: 'uncommon', value: 40 },
  { name: 'Rainbow Trout', emoji: '🌈', rarity: 'uncommon', value: 60 },
  { name: 'Koi', emoji: '🎏', rarity: 'uncommon', value: 75 },
  { name: 'Swordfish', emoji: '🗡️', rarity: 'rare', value: 120 },
  { name: 'Electric Eel', emoji: '⚡', rarity: 'rare', value: 180 },
  { name: 'Pufferfish', emoji: '🐡', rarity: 'rare', value: 150 },
  { name: 'Clownfish', emoji: '🤡', rarity: 'rare', value: 200 },
  { name: 'Anglerfish', emoji: '🔦', rarity: 'rare', value: 250 },
  { name: 'Shark', emoji: '🦈', rarity: 'epic', value: 500 },
  { name: 'Octopus', emoji: '🐙', rarity: 'epic', value: 600 },
  { name: 'Manta Ray', emoji: '🦅', rarity: 'epic', value: 800 },
  { name: 'Giant Squid', emoji: '🦑', rarity: 'epic', value: 1200 },
  { name: 'Whale', emoji: '🐳', rarity: 'epic', value: 1500 },
  { name: 'Golden Koi', emoji: '✨', rarity: 'legendary', value: 2500 },
  { name: 'Dragon Fish', emoji: '🐉', rarity: 'legendary', value: 5000 },
  { name: 'Crystal Jellyfish', emoji: '💎', rarity: 'legendary', value: 4000 },
  { name: "Poseidon's Pet", emoji: '🔱', rarity: 'legendary', value: 8000 },
  { name: 'The Kraken', emoji: '👾', rarity: 'legendary', value: 10000 },
]

const inventoryValue = computed(() => inventory.value.reduce((sum, f) => sum + Math.floor(f.value * moneyMultiplier.value), 0))

// ========== THREE.JS ==========
let scene3d: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrame: number
let fishingLine: THREE.Line | null = null
let bobber: THREE.Mesh | null = null
let bobberTarget = new THREE.Vector3()
let waterMesh: THREE.Mesh
let fishMeshes: THREE.Mesh[] = []

function initThree() {
  if (!canvasContainer.value) return

  scene3d = new THREE.Scene()
  scene3d.background = new THREE.Color('#87CEEB')
  scene3d.fog = new THREE.FogExp2('#a8d5e2', 0.008)

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 8, 14)
  camera.lookAt(0, 0, -5)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  canvasContainer.value.appendChild(renderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight('#b0d4f1', 0.7)
  scene3d.add(ambient)

  const sun = new THREE.DirectionalLight('#fff5e0', 1.5)
  sun.position.set(30, 40, 20)
  sun.castShadow = true
  sun.shadow.mapSize.width = 2048
  sun.shadow.mapSize.height = 2048
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 100
  sun.shadow.camera.left = -40
  sun.shadow.camera.right = 40
  sun.shadow.camera.top = 40
  sun.shadow.camera.bottom = -40
  scene3d.add(sun)

  const hemi = new THREE.HemisphereLight('#87CEEB', '#4a8c5c', 0.4)
  scene3d.add(hemi)

  buildScene()
  animate()

  window.addEventListener('resize', onResize)
}

function buildScene() {
  // Ground - large grass plane
  const groundGeo = new THREE.PlaneGeometry(200, 200)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#3a8c3f', roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.1
  ground.receiveShadow = true
  scene3d.add(ground)

  // Pond - oval water body
  const pondGeo = new THREE.CircleGeometry(18, 48)
  const pondMat = new THREE.MeshStandardMaterial({
    color: '#1a7a9b',
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    metalness: 0.3,
  })
  waterMesh = new THREE.Mesh(pondGeo, pondMat)
  waterMesh.rotation.x = -Math.PI / 2
  waterMesh.position.set(0, 0.05, -8)
  waterMesh.scale.set(1, 1.3, 1)
  waterMesh.receiveShadow = true
  scene3d.add(waterMesh)

  // Pond bed (darker underneath)
  const bedGeo = new THREE.CircleGeometry(18, 48)
  const bedMat = new THREE.MeshStandardMaterial({ color: '#0c3d4d', roughness: 1 })
  const bed = new THREE.Mesh(bedGeo, bedMat)
  bed.rotation.x = -Math.PI / 2
  bed.position.set(0, -0.5, -8)
  bed.scale.set(1, 1.3, 1)
  scene3d.add(bed)

  // Pond edge - ring of dirt/sand
  const edgeGeo = new THREE.TorusGeometry(18, 1.2, 8, 48)
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#8B7355', roughness: 0.95 })
  const edge = new THREE.Mesh(edgeGeo, edgeMat)
  edge.rotation.x = -Math.PI / 2
  edge.position.set(0, 0, -8)
  edge.scale.set(1, 1.3, 1)
  edge.receiveShadow = true
  scene3d.add(edge)

  // Wooden Deck
  buildDeck()

  // Trees around the pond
  const treePositions = [
    [-20, -15], [-15, -25], [-25, -5], [20, -15], [15, -25], [25, -8],
    [-18, 2], [18, 2], [-10, -28], [10, -28], [0, -30], [-28, -12], [28, -12],
  ]
  for (const [x, z] of treePositions) {
    createTree(x, z)
  }

  // Rocks around pond
  const rockPositions = [
    [-12, -2], [14, -3], [-8, -20], [10, -22], [-16, -10], [17, -14],
  ]
  for (const [x, z] of rockPositions) {
    createRock(x, z)
  }

  // Lily pads on water
  createLilyPad(-5, -6)
  createLilyPad(7, -10)
  createLilyPad(-3, -14)
  createLilyPad(4, -5)

  // Fish swimming in pond
  for (let i = 0; i < 6; i++) {
    createSwimmingFish(i)
  }

  // Reeds/cattails
  const reedPositions = [[-13, -1], [-14, -2], [12, -2], [13, -3], [-10, -19], [9, -20]]
  for (const [x, z] of reedPositions) {
    createReed(x, z)
  }
}

function buildDeck() {
  const deckGroup = new THREE.Group()

  // Main platform
  const platformGeo = new THREE.BoxGeometry(6, 0.3, 4)
  const woodMat = new THREE.MeshStandardMaterial({ color: '#a0782c', roughness: 0.85 })
  const platform = new THREE.Mesh(platformGeo, woodMat)
  platform.position.set(0, 0.15, 2)
  platform.castShadow = true
  platform.receiveShadow = true
  deckGroup.add(platform)

  // Deck planks (visual lines)
  for (let i = -2.5; i <= 2.5; i += 0.8) {
    const plankGeo = new THREE.BoxGeometry(0.75, 0.32, 4)
    const plankMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#a0782c').lerp(new THREE.Color('#8B6914'), Math.random() * 0.3),
      roughness: 0.9,
    })
    const plank = new THREE.Mesh(plankGeo, plankMat)
    plank.position.set(i, 0.16, 2)
    plank.castShadow = true
    deckGroup.add(plank)
  }

  // Support legs
  const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8)
  const legMat = new THREE.MeshStandardMaterial({ color: '#654321', roughness: 0.9 })
  const legPositions = [[-2.5, 0.5], [2.5, 0.5], [-2.5, 3.5], [2.5, 3.5]]
  for (const [x, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(x, -0.5, z)
    leg.castShadow = true
    deckGroup.add(leg)
  }

  // Railing
  const railGeo = new THREE.BoxGeometry(6, 0.1, 0.1)
  const rail = new THREE.Mesh(railGeo, legMat)
  rail.position.set(0, 0.8, 0.1)
  deckGroup.add(rail)

  // Railing posts
  for (const x of [-2.8, 0, 2.8]) {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8)
    const post = new THREE.Mesh(postGeo, legMat)
    post.position.set(x, 0.5, 0.1)
    deckGroup.add(post)
  }

  // Character sitting on deck
  const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.6, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.7 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.set(0, 0.9, 0.8)
  body.castShadow = true
  deckGroup.add(body)

  const headGeo = new THREE.SphereGeometry(0.3, 16, 16)
  const headMat = new THREE.MeshStandardMaterial({ color: '#ffd5b4', roughness: 0.7 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.set(0, 1.55, 0.8)
  head.castShadow = true
  deckGroup.add(head)

  // Fishing rod
  const rodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, 1.2, 0.6),
    new THREE.Vector3(0.5, 2, 0),
    new THREE.Vector3(0.4, 2.5, -1.5),
    new THREE.Vector3(0.2, 2.2, -3),
  ])
  const rodGeo = new THREE.TubeGeometry(rodCurve, 20, 0.04, 8, false)
  const rodMat = new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.7 })
  const rod = new THREE.Mesh(rodGeo, rodMat)
  rod.castShadow = true
  deckGroup.add(rod)

  scene3d.add(deckGroup)
}

function createTree(x: number, z: number) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  const height = 4 + Math.random() * 3
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, height, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c3a1e', roughness: 0.9 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = height / 2
  trunk.castShadow = true
  group.add(trunk)

  // Foliage layers
  for (let i = 0; i < 3; i++) {
    const radius = 2.5 - i * 0.6
    const foliageGeo = new THREE.SphereGeometry(radius, 8, 8)
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#228B22').lerp(new THREE.Color('#32CD32'), Math.random() * 0.4),
      roughness: 0.8,
    })
    const foliage = new THREE.Mesh(foliageGeo, foliageMat)
    foliage.position.y = height - 0.5 + i * 1.2
    foliage.scale.y = 0.7
    foliage.castShadow = true
    group.add(foliage)
  }

  scene3d.add(group)
}

function createRock(x: number, z: number) {
  const size = 0.5 + Math.random() * 1.2
  const geo = new THREE.DodecahedronGeometry(size, 1)
  const positions = geo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.2)
    positions.setY(i, positions.getY(i) * (0.4 + Math.random() * 0.3))
    positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.2)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#777').lerp(new THREE.Color('#999'), Math.random()),
    roughness: 0.95, flatShading: true,
  })
  const rock = new THREE.Mesh(geo, mat)
  rock.position.set(x, size * 0.2, z)
  rock.rotation.y = Math.random() * Math.PI
  rock.castShadow = true
  rock.receiveShadow = true
  scene3d.add(rock)
}

function createLilyPad(x: number, z: number) {
  const geo = new THREE.CircleGeometry(0.7, 16, 0, Math.PI * 1.7)
  const mat = new THREE.MeshStandardMaterial({ color: '#2d8a4e', roughness: 0.8, side: THREE.DoubleSide })
  const pad = new THREE.Mesh(geo, mat)
  pad.rotation.x = -Math.PI / 2
  pad.position.set(x, 0.08, z)
  pad.rotation.z = Math.random() * Math.PI
  scene3d.add(pad)

  // Flower on some
  if (Math.random() > 0.5) {
    const flowerGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const flowerMat = new THREE.MeshStandardMaterial({ color: '#ff69b4', emissive: '#ff69b4', emissiveIntensity: 0.2 })
    const flower = new THREE.Mesh(flowerGeo, flowerMat)
    flower.position.set(x + 0.2, 0.2, z)
    flower.scale.y = 0.6
    scene3d.add(flower)
  }
}

function createSwimmingFish(index: number) {
  const fishGroup = new THREE.Group()

  // Body
  const bodyGeo = new THREE.ConeGeometry(0.15, 0.6, 8)
  const colors = ['#ff6b35', '#ffa500', '#ff4444', '#44aaff', '#ffcc00', '#66ff66']
  const bodyMat = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.5 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.rotation.z = Math.PI / 2
  fishGroup.add(body)

  // Tail
  const tailGeo = new THREE.ConeGeometry(0.12, 0.2, 4)
  const tail = new THREE.Mesh(tailGeo, bodyMat)
  tail.position.x = -0.35
  tail.rotation.z = Math.PI / 2
  fishGroup.add(tail)

  const angle = (index / 6) * Math.PI * 2
  const radius = 4 + Math.random() * 8
  fishGroup.position.set(
    Math.cos(angle) * radius,
    -0.3,
    -8 + Math.sin(angle) * radius * 0.8,
  )
  fishGroup.userData = { angle, radius, speed: 0.003 + Math.random() * 0.004, index }

  scene3d.add(fishGroup)
  fishMeshes.push(fishGroup as unknown as THREE.Mesh)
}

function createReed(x: number, z: number) {
  for (let i = 0; i < 3; i++) {
    const reedGeo = new THREE.CylinderGeometry(0.03, 0.05, 2 + Math.random(), 6)
    const reedMat = new THREE.MeshStandardMaterial({ color: '#5a7a3a', roughness: 0.9 })
    const reed = new THREE.Mesh(reedGeo, reedMat)
    reed.position.set(x + (Math.random() - 0.5) * 0.5, 1, z + (Math.random() - 0.5) * 0.5)
    reed.rotation.x = (Math.random() - 0.5) * 0.15
    reed.rotation.z = (Math.random() - 0.5) * 0.15
    scene3d.add(reed)

    // Cattail top
    if (Math.random() > 0.4) {
      const topGeo = new THREE.CapsuleGeometry(0.06, 0.2, 4, 8)
      const topMat = new THREE.MeshStandardMaterial({ color: '#4a3020' })
      const top = new THREE.Mesh(topGeo, topMat)
      top.position.set(x + (Math.random() - 0.5) * 0.3, 2.2 + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.3)
      scene3d.add(top)
    }
  }
}

function showFishingLine(show: boolean) {
  // Remove old
  if (fishingLine) { scene3d.remove(fishingLine); fishingLine = null }
  if (bobber) { scene3d.remove(bobber); bobber = null }

  if (!show) return

  // Bobber
  const bobGeo = new THREE.SphereGeometry(0.12, 8, 8)
  const bobMat = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 0.3 })
  bobber = new THREE.Mesh(bobGeo, bobMat)
  bobberTarget.set(-2 + Math.random() * 4, 0.15, -5 - Math.random() * 6)
  bobber.position.copy(bobberTarget)
  scene3d.add(bobber)

  // Line from rod tip to bobber
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.2, 2.2, -3), // rod tip
    bobberTarget,
  ])
  const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 })
  fishingLine = new THREE.Line(lineGeo, lineMat)
  scene3d.add(fishingLine)
}

// ========== ANIMATION ==========
function animate() {
  animFrame = requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  // Water animation
  if (waterMesh) {
    waterMesh.position.y = 0.05 + Math.sin(time * 0.8) * 0.03
  }

  // Fish swimming
  for (const fish of fishMeshes) {
    const d = fish.userData
    d.angle += d.speed
    fish.position.x = Math.cos(d.angle) * d.radius
    fish.position.z = -8 + Math.sin(d.angle) * d.radius * 0.8
    fish.rotation.y = -d.angle + Math.PI / 2
  }

  // Bobber animation
  if (bobber && screen.value === 'waiting') {
    bobber.position.y = 0.15 + Math.sin(time * 2) * 0.04
  }
  if (bobber && screen.value === 'catch') {
    bobber.position.y = 0.15 + Math.sin(time * 12) * 0.1
  }

  // Update fishing line
  if (fishingLine && bobber) {
    const points = [new THREE.Vector3(0.2, 2.2, -3), bobber.position.clone()]
    fishingLine.geometry.setFromPoints(points)
  }

  // Gentle camera sway
  camera.position.x = Math.sin(time * 0.1) * 0.3
  camera.position.y = 8 + Math.sin(time * 0.15) * 0.15

  renderer.render(scene3d, camera)
}

function onResize() {
  if (!renderer || !camera) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ========== GAME LOGIC ==========
let waitTimer: number | null = null
let dotTimer: number | null = null

function startGame() {
  screen.value = 'fishing'
  nextTick(() => {
    if (!renderer) initThree()
  })
}

function castLine() {
  screen.value = 'casting'
  showFishingLine(true)

  setTimeout(() => {
    screen.value = 'waiting'
    dotCount.value = 1
    dotTimer = setInterval(() => { dotCount.value = (dotCount.value % 3) + 1 }, 500) as unknown as number

    const waitTime = currentWaitMin.value * 1000 + Math.random() * (currentWaitMax.value - currentWaitMin.value) * 1000
    waitTimer = setTimeout(() => {
      if (dotTimer) clearInterval(dotTimer)
      screen.value = 'catch'
      waitTimer = setTimeout(() => {
        if (screen.value === 'catch') {
          caughtFish.value = null
          showFishingLine(false)
          screen.value = 'result'
        }
      }, 3000) as unknown as number
    }, waitTime) as unknown as number
  }, 800)
}

function rollFishRarity(): Rarity {
  const luck = currentRod.value.luck
  const roll = Math.random() * 100
  const l = 1 * luck, e = 4 * luck, r = 10 * luck, u = 25 * luck
  if (roll < l) return 'legendary'
  if (roll < l + e) return 'epic'
  if (roll < l + e + r) return 'rare'
  if (roll < l + e + r + u) return 'uncommon'
  return 'common'
}

function startMinigame() {
  if (waitTimer) clearTimeout(waitTimer)
  const rarity = rollFishRarity()
  currentFishRarity.value = rarity

  const sizes: Record<Rarity, number> = { common: 35, uncommon: 25, rare: 18, epic: 12, legendary: 7 }
  greenWidth.value = sizes[rarity]
  greenStart.value = 20 + Math.random() * (60 - greenWidth.value)

  const speeds: Record<Rarity, number> = { common: 1.2, uncommon: 1.5, rare: 2, epic: 2.5, legendary: 3.2 }
  needleSpeed = speeds[rarity]
  needlePos.value = 0
  needleDir = 1
  screen.value = 'minigame'

  minigameInterval = setInterval(() => {
    needlePos.value += needleDir * needleSpeed
    if (needlePos.value >= 100) { needlePos.value = 100; needleDir = -1 }
    if (needlePos.value <= 0) { needlePos.value = 0; needleDir = 1 }
  }, 16) as unknown as number
}

function reelIn() {
  if (minigameInterval) clearInterval(minigameInterval)
  const inGreen = needlePos.value >= greenStart.value && needlePos.value <= greenStart.value + greenWidth.value
  if (inGreen) {
    const fishOfRarity = allFish.filter(f => f.rarity === currentFishRarity.value)
    caughtFish.value = fishOfRarity[Math.floor(Math.random() * fishOfRarity.length)]
  } else {
    caughtFish.value = null
  }
  showFishingLine(false)
  screen.value = 'result'
}

function getSellPrice(fish: Fish): number {
  return Math.floor(fish.value * moneyMultiplier.value)
}

function sellFish() {
  if (caughtFish.value) { money.value += getSellPrice(caughtFish.value); saveGame() }
  caughtFish.value = null; screen.value = 'fishing'
}

function keepFish() {
  if (caughtFish.value) { inventory.value.push({ ...caughtFish.value }); saveGame() }
  caughtFish.value = null; screen.value = 'fishing'
}

function sellFromInv(i: number) {
  money.value += getSellPrice(inventory.value[i]); inventory.value.splice(i, 1); saveGame()
}

function sellAll() {
  for (const fish of inventory.value) money.value += getSellPrice(fish)
  inventory.value = []; saveGame()
}

function buyRod(rod: Rod) {
  if (money.value < rod.price) return
  money.value -= rod.price; ownedRods.value.push(rod.id); currentRod.value = rod; saveGame()
}

function equipRod(rod: Rod) { currentRod.value = rod; saveGame() }

function saveGame() {
  localStorage.setItem('fishingGame', JSON.stringify({
    money: money.value, ownedRods: ownedRods.value,
    currentRodId: currentRod.value.id, inventory: inventory.value,
    moneyUpgradeLevel: moneyUpgradeLevel.value, speedUpgradeLevel: speedUpgradeLevel.value,
  }))
}

function loadGame() {
  const saved = localStorage.getItem('fishingGame')
  if (saved) {
    const d = JSON.parse(saved)
    money.value = d.money || 0
    ownedRods.value = d.ownedRods || ['wooden']
    inventory.value = d.inventory || []
    const rod = rods.find(r => r.id === d.currentRodId)
    if (rod) currentRod.value = rod
    moneyUpgradeLevel.value = d.moneyUpgradeLevel || 0
    speedUpgradeLevel.value = d.speedUpgradeLevel || 0
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    if (screen.value === 'catch') startMinigame()
    else if (screen.value === 'minigame') reelIn()
  }
}

onMounted(() => {
  loadGame()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (waitTimer) clearTimeout(waitTimer)
  if (dotTimer) clearInterval(dotTimer)
  if (minigameInterval) clearInterval(minigameInterval)
})
</script>

<style scoped>
.fishing-app {
  min-height: 100vh; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #1a3a1a; position: relative; overflow: hidden; user-select: none;
}

.canvas-container { position: fixed; inset: 0; z-index: 1; }

/* HUD */
.back-btn {
  position: fixed; top: 12px; left: 12px; z-index: 50;
  background: rgba(0,0,0,0.5); color: #fff; border: none;
  padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
  backdrop-filter: blur(4px);
}
.back-btn:hover { background: rgba(0,0,0,0.7); }

.money-hud {
  position: fixed; top: 12px; right: 12px; z-index: 50;
  background: rgba(0,0,0,0.6); color: #fbbf24;
  padding: 10px 18px; border-radius: 12px; font-size: 20px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
  backdrop-filter: blur(4px); border: 1px solid rgba(251,191,36,0.3);
}

.rod-hud {
  position: fixed; top: 60px; right: 12px; z-index: 50;
  background: rgba(0,0,0,0.5); color: #fff;
  padding: 6px 14px; border-radius: 10px; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px; backdrop-filter: blur(4px);
}
.luck-badge { color: #4ade80; }

/* TITLE */
.title-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #87CEEB 0%, #4a90c2 40%, #1a6b8a 70%, #0c3547 100%);
  position: relative; overflow: hidden; z-index: 10;
}
.title-card { text-align: center; z-index: 2; position: relative; }
.title-fish { font-size: 80px; animation: fish-bounce 2s ease-in-out infinite; }
@keyframes fish-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.title-text { font-size: 48px; font-weight: 900; color: #fff; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.4); }
.title-sub { font-size: 18px; color: #b8e0f0; margin: 8px 0 28px; }
.play-btn {
  padding: 16px 48px; border-radius: 16px; border: none;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff; font-size: 22px; font-weight: 800; cursor: pointer;
  box-shadow: 0 6px 20px rgba(245,158,11,0.5); transition: transform 0.15s;
}
.play-btn:hover { transform: translateY(-3px) scale(1.05); }
.back-link { display: block; margin-top: 16px; background: none; border: none; color: #8ec8e8; font-size: 14px; cursor: pointer; }
.water-bg { position: absolute; bottom: 0; left: 0; right: 0; height: 30%; }
.wave {
  position: absolute; width: 200%; height: 100px; bottom: 0;
  background: rgba(26,107,138,0.3); border-radius: 50% 50% 0 0;
  animation: wave-move 4s ease-in-out infinite;
}
.wave2 { bottom: -10px; animation-delay: 1s; opacity: 0.5; }
@keyframes wave-move { 0%,100% { transform: translateX(-25%); } 50% { transform: translateX(0); } }

/* ACTION */
.action-area {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 12px; z-index: 20;
}
.cast-btn {
  padding: 16px 36px; border-radius: 16px; border: none;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #fff; font-size: 20px; font-weight: 800; cursor: pointer;
  box-shadow: 0 6px 20px rgba(14,165,233,0.5); transition: transform 0.15s;
}
.cast-btn:hover { transform: translateY(-3px); }
.cast-btn:active { transform: scale(0.95); }
.shop-btn, .inv-btn {
  padding: 16px 24px; border-radius: 16px; border: none;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
  backdrop-filter: blur(4px);
}
.shop-btn:hover, .inv-btn:hover, .upgrade-btn:hover { background: rgba(0,0,0,0.7); }
.upgrade-btn {
  padding: 16px 24px; border-radius: 16px; border: none;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
  backdrop-filter: blur(4px);
}

/* WAITING */
.waiting-text {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 20;
}
.dots-loading {
  background: rgba(0,0,0,0.6); color: #fff; padding: 12px 24px;
  border-radius: 12px; font-size: 16px; font-weight: 600; backdrop-filter: blur(4px);
}

/* BITE */
.bite-alert {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 30; cursor: pointer; animation: bite-pulse 0.5s ease-in-out infinite alternate;
}
@keyframes bite-pulse { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.1); } }
.bite-text {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff; padding: 24px 48px; border-radius: 20px;
  font-size: 32px; font-weight: 900; box-shadow: 0 8px 30px rgba(220,38,38,0.6);
}

/* MINIGAME */
.minigame-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 40; backdrop-filter: blur(4px);
}
.minigame-card {
  background: #1e293b; border-radius: 24px; padding: 32px 40px;
  text-align: center; max-width: 420px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #334155;
}
.mg-title { color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 4px; }
.mg-sub { color: #94a3b8; font-size: 13px; margin: 0 0 24px; }
.gauge-container { margin-bottom: 24px; }
.gauge-bar {
  height: 40px; background: #dc2626; border-radius: 20px;
  position: relative; overflow: hidden; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
}
.gauge-green {
  position: absolute; top: 0; height: 100%;
  background: linear-gradient(180deg, #22c55e, #16a34a); border-radius: 4px;
}
.gauge-needle {
  position: absolute; top: -6px; width: 4px; height: 52px;
  background: #fff; border-radius: 2px; transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(255,255,255,0.8);
}
.gauge-labels {
  display: flex; justify-content: space-between;
  margin-top: 6px; font-size: 11px; color: #94a3b8; font-weight: 600;
}
.reel-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff; font-size: 20px; font-weight: 800; cursor: pointer;
  box-shadow: 0 4px 16px rgba(245,158,11,0.5); margin-bottom: 16px;
}
.reel-btn:active { transform: scale(0.95); }
.mg-hint { font-size: 14px; font-weight: 700; }
.rarity-hint.common { color: #94a3b8; }
.rarity-hint.uncommon { color: #4ade80; }
.rarity-hint.rare { color: #60a5fa; }
.rarity-hint.epic { color: #c084fc; }
.rarity-hint.legendary { color: #fbbf24; animation: legendary-glow 1s ease-in-out infinite alternate; }
@keyframes legendary-glow { from { text-shadow: 0 0 5px #fbbf24; } to { text-shadow: 0 0 20px #fbbf24; } }

/* RESULT */
.result-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 40; backdrop-filter: blur(4px);
}
.result-card {
  background: #1e293b; border-radius: 24px; padding: 36px 44px;
  text-align: center; max-width: 380px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 3px solid #334155;
  animation: result-pop 0.4s ease-out;
}
@keyframes result-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.result-card.legendary { border-color: #fbbf24; box-shadow: 0 0 40px rgba(251,191,36,0.4); }
.result-card.epic { border-color: #c084fc; box-shadow: 0 0 30px rgba(192,132,252,0.3); }
.result-card.rare { border-color: #60a5fa; }
.result-card.uncommon { border-color: #4ade80; }
.result-emoji { font-size: 72px; margin-bottom: 8px; }
.result-name { color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 8px; }
.result-rarity {
  display: inline-block; padding: 4px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
}
.result-rarity.common { background: #475569; color: #cbd5e1; }
.result-rarity.uncommon { background: #166534; color: #4ade80; }
.result-rarity.rare { background: #1e40af; color: #60a5fa; }
.result-rarity.epic { background: #581c87; color: #c084fc; }
.result-rarity.legendary { background: #713f12; color: #fbbf24; }
.result-value { color: #fbbf24; font-size: 22px; font-weight: 800; margin-bottom: 20px; }
.result-miss { color: #94a3b8; font-size: 15px; margin-bottom: 20px; }
.result-actions { display: flex; gap: 12px; justify-content: center; }
.sell-btn {
  padding: 12px 24px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
}
.sell-btn:hover { transform: scale(1.05); }
.keep-btn {
  padding: 12px 24px; border-radius: 12px; border: 2px solid #475569;
  background: none; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
}
.keep-btn:hover { background: #334155; }
.try-again-btn {
  padding: 12px 32px; border-radius: 12px; border: none;
  background: #3b82f6; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
}

/* SHOP */
.shop-screen, .inv-screen {
  min-height: 100vh; background: #0f172a; padding: 20px; position: relative; z-index: 10;
}
.shop-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}
.shop-header h1 { color: #fff; font-size: 28px; font-weight: 900; margin: 0; }
.close-btn {
  background: #334155; color: #fff; border: none; width: 40px; height: 40px;
  border-radius: 50%; font-size: 20px; cursor: pointer;
}
.close-btn:hover { background: #475569; }
.shop-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; max-width: 900px; margin: 0 auto;
}
.shop-card {
  background: #1e293b; border-radius: 16px; padding: 20px; text-align: center;
  border: 2px solid #334155; transition: border-color 0.15s;
}
.shop-card:hover { border-color: #475569; }
.shop-card.owned { border-color: #22c55e; }
.shop-card.equipped { border-color: #fbbf24; box-shadow: 0 0 15px rgba(251,191,36,0.2); }
.shop-rod-icon { font-size: 40px; margin-bottom: 8px; }
.shop-rod-name { color: #fff; font-size: 16px; font-weight: 800; }
.shop-rod-luck { color: #4ade80; font-size: 14px; font-weight: 700; margin: 4px 0; }
.shop-rod-desc { color: #94a3b8; font-size: 12px; margin-bottom: 12px; line-height: 1.4; }
.buy-btn {
  padding: 8px 20px; border-radius: 10px; border: none;
  background: #f59e0b; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
}
.buy-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.equip-btn {
  padding: 8px 20px; border-radius: 10px; border: 2px solid #3b82f6;
  background: none; color: #3b82f6; font-size: 14px; font-weight: 700; cursor: pointer;
}
.equip-btn:hover { background: #3b82f6; color: #fff; }
.equipped-badge { color: #22c55e; font-size: 14px; font-weight: 700; }

/* INVENTORY */
.inv-empty { color: #64748b; text-align: center; font-size: 18px; padding: 60px 0; }
.inv-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px; max-width: 900px; margin: 0 auto;
}
.inv-card {
  background: #1e293b; border-radius: 14px; padding: 16px; text-align: center; border: 2px solid #334155;
}
.inv-card.legendary { border-color: #fbbf24; }
.inv-card.epic { border-color: #c084fc; }
.inv-card.rare { border-color: #60a5fa; }
.inv-card.uncommon { border-color: #4ade80; }
.inv-emoji { font-size: 36px; }
.inv-name { color: #fff; font-size: 13px; font-weight: 700; margin: 4px 0; }
.inv-rarity { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
.inv-rarity.common { color: #94a3b8; }
.inv-rarity.uncommon { color: #4ade80; }
.inv-rarity.rare { color: #60a5fa; }
.inv-rarity.epic { color: #c084fc; }
.inv-rarity.legendary { color: #fbbf24; }
.sell-sm-btn {
  padding: 4px 12px; border-radius: 8px; border: none;
  background: #f59e0b; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
}
.sell-all-btn {
  display: block; margin: 24px auto; padding: 14px 36px; border-radius: 14px;
  border: none; background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff; font-size: 18px; font-weight: 800; cursor: pointer;
}

/* UPGRADES */
.upgrades-screen {
  min-height: 100vh; background: #0f172a; padding: 20px; position: relative; z-index: 10;
}
.upgrades-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px; max-width: 700px; margin: 0 auto;
}
.upgrade-card {
  background: #1e293b; border-radius: 20px; padding: 28px; text-align: center;
  border: 2px solid #334155; transition: border-color 0.15s;
}
.upgrade-card:hover { border-color: #475569; }
.upgrade-icon { font-size: 48px; margin-bottom: 8px; }
.upgrade-name { color: #fff; font-size: 20px; font-weight: 800; margin: 0 0 6px; }
.upgrade-desc { color: #94a3b8; font-size: 14px; margin: 0 0 14px; }
.upgrade-level {
  color: #fbbf24; font-size: 14px; font-weight: 700; margin-bottom: 6px;
}
.upgrade-effect {
  color: #4ade80; font-size: 15px; font-weight: 700; margin-bottom: 4px;
}
.upgrade-next {
  color: #60a5fa; font-size: 13px; margin-bottom: 14px;
}
.upgrade-next.maxed {
  color: #fbbf24; font-size: 16px; font-weight: 800;
}
.upgrade-buy-btn {
  padding: 10px 24px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
  transition: transform 0.15s;
}
.upgrade-buy-btn:hover { transform: scale(1.05); }
.upgrade-buy-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

@media (max-width: 600px) {
  .action-area { flex-direction: column; align-items: center; bottom: 20px; }
  .bite-text { font-size: 24px; padding: 18px 32px; }
  .shop-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}
</style>
