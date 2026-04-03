<template>
  <div class="pizza-zoo-app" ref="appRef">
    <!-- Menu -->
    <div v-if="phase === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icons">
          <span class="bounce-icon">&#x1F355;</span>
          <span class="bounce-icon d2">&#x1F981;</span>
          <span class="bounce-icon d3">&#x1F4B0;</span>
        </div>
        <h1 class="menu-title">Pizza Zoo Treasure</h1>
        <p class="menu-sub">Deliver pizzas! Hunt treasure! Build a zoo!</p>
        <button class="play-btn" @click="startGame">&#x1F680; PLAY!</button>
        <button class="back-link" @click="$router.push('/')">&#x2190; Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="phase === 'playing'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- HUD -->
      <div class="hud-top">
        <div class="hud-cash">&#x1F4B5; ${{ cash.toLocaleString() }}</div>
        <div class="hud-mode">{{ modeLabel }}</div>
      </div>

      <div class="hud-objective" v-if="objectiveText">{{ objectiveText }}</div>

      <!-- Mode buttons -->
      <div class="mode-buttons">
        <button :class="['mode-btn', { active: gameMode === 'pizza' }]" @click="switchMode('pizza')">&#x1F355; Pizza</button>
        <button :class="['mode-btn', { active: gameMode === 'temple' }]" @click="switchMode('temple')" :disabled="cash < 500 && templesCompleted === 0">&#x1F3DB; Temple</button>
        <button :class="['mode-btn', { active: gameMode === 'zoo' }]" @click="switchMode('zoo')">&#x1F981; Zoo</button>
      </div>

      <!-- Pizza delivery timer -->
      <div v-if="gameMode === 'pizza' && deliveryActive" class="delivery-timer">
        <div class="dt-label">Delivery Timer</div>
        <div class="dt-bar-bg"><div class="dt-bar" :style="{ width: deliveryTimerPct + '%' }"></div></div>
        <div class="dt-time">{{ deliveryTimeLeft.toFixed(1) }}s</div>
      </div>

      <!-- Pickup prompt -->
      <div v-if="showPickupPrompt" class="prompt-box">Press E or Tap to pick up pizza!</div>
      <div v-if="showDeliverPrompt" class="prompt-box deliver-prompt">Press E or Tap to deliver!</div>
      <div v-if="showTemplePrompt" class="prompt-box temple-prompt">Press E or Tap to enter temple!</div>
      <div v-if="showGaragePrompt" class="prompt-box garage-prompt">Press E or Tap to open garage!</div>

      <!-- Garage UI -->
      <div v-if="showGarage" class="garage-overlay">
        <div class="garage-card">
          <h2>&#x1F527; Garage - Upgrade Your Car</h2>
          <div class="garage-item">
            <span>Speed Lv{{ carSpeed }}</span>
            <button @click="upgradeSpeed" :disabled="cash < speedCost">Upgrade ${{ speedCost }}</button>
          </div>
          <div class="garage-item">
            <span>Handling Lv{{ carHandling }}</span>
            <button @click="upgradeHandling" :disabled="cash < handlingCost">Upgrade ${{ handlingCost }}</button>
          </div>
          <button class="garage-close" @click="showGarage = false">Close</button>
        </div>
      </div>

      <!-- Temple Interior -->
      <div v-if="inTemple" class="temple-hud">
        <div class="temple-health-bar">
          <div class="th-label">HP</div>
          <div class="th-bg"><div class="th-fill" :style="{ width: templeHP + '%' }"></div></div>
        </div>
        <div class="temple-progress">Room {{ templeRoom }}/{{ templeRoomCount }}</div>
      </div>

      <!-- Temple puzzle UI -->
      <div v-if="showPuzzle" class="puzzle-overlay">
        <div class="puzzle-card">
          <h2>&#x1F9E9; Step on buttons in order!</h2>
          <div class="puzzle-buttons">
            <button v-for="(b, i) in puzzleButtons" :key="i" :class="['pz-btn', { done: b.done, wrong: b.wrong }]" @click="pressPuzzleButton(i)">{{ b.label }}</button>
          </div>
        </div>
      </div>

      <!-- Zoo build UI -->
      <div v-if="showZooBuild" class="zoo-build-overlay">
        <div class="zoo-build-card">
          <h2>&#x1F3D7; Build Enclosure</h2>
          <div class="zoo-animals-list">
            <div v-for="animal in availableAnimals" :key="animal.id" class="zoo-animal-option">
              <span>{{ animal.icon }} {{ animal.name }}</span>
              <button v-if="!zooEnclosures.includes(animal.id)" @click="buildEnclosure(animal)" :disabled="cash < animal.buildCost">${{ animal.buildCost }}</button>
              <span v-else class="built-label">Built!</span>
            </div>
          </div>
          <button class="garage-close" @click="showZooBuild = false">Close</button>
        </div>
      </div>

      <!-- Zoo feed prompt -->
      <div v-if="showFeedPrompt" class="prompt-box feed-prompt">Press E to feed! ($50)</div>

      <!-- Message popup -->
      <div v-if="popupMessage" class="popup-msg" :class="popupClass">{{ popupMessage }}</div>

      <!-- Mobile controls -->
      <div v-if="isMobile" class="mobile-controls">
        <div class="joystick-area" ref="joystickArea"
          @touchstart.prevent="joystickStart"
          @touchmove.prevent="joystickMove"
          @touchend.prevent="joystickEnd">
          <div class="joystick-base">
            <div class="joystick-knob" :style="joystickStyle"></div>
          </div>
        </div>
        <button class="mobile-action-btn" @touchstart.prevent="mobileAction">E</button>
      </div>

      <!-- Back button -->
      <button class="back-btn" @click="goBack">&#x2190; Back</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()
const appRef = ref<HTMLElement>()
const threeContainer = ref<HTMLElement>()
const joystickArea = ref<HTMLElement>()

// Phases
const phase = ref<'menu' | 'playing'>('menu')
const gameMode = ref<'pizza' | 'temple' | 'zoo'>('pizza')

// Game state
const cash = ref(0)
const deliveryActive = ref(false)
const deliveryTimerMax = ref(30)
const deliveryTimeLeft = ref(30)
const deliveryTimerPct = computed(() => (deliveryTimeLeft.value / deliveryTimerMax.value) * 100)
const showPickupPrompt = ref(false)
const showDeliverPrompt = ref(false)
const showTemplePrompt = ref(false)
const showGaragePrompt = ref(false)
const showGarage = ref(false)
const showZooBuild = ref(false)
const showFeedPrompt = ref(false)
const showPuzzle = ref(false)
const inTemple = ref(false)
const templeHP = ref(100)
const templeRoom = ref(1)
const templeRoomCount = ref(3)
const templesCompleted = ref(0)
const objectiveText = ref('')
const popupMessage = ref('')
const popupClass = ref('')

// Car upgrades
const carSpeed = ref(1)
const carHandling = ref(1)
const speedCost = computed(() => carSpeed.value * 200)
const handlingCost = computed(() => carHandling.value * 150)

// Zoo data
const ownedAnimals = ref<string[]>([])
const zooEnclosures = ref<string[]>([])
const animalHappiness = ref<Record<string, number>>({})
const zooVisitors = ref(0)

// Puzzle
interface PuzzleButton { label: number; done: boolean; wrong: boolean }
const puzzleButtons = ref<PuzzleButton[]>([])
let puzzleOrder: number[] = []
let puzzleStep = 0

// Mode label
const modeLabel = computed(() => {
  if (gameMode.value === 'pizza') return 'Pizza Delivery'
  if (gameMode.value === 'temple') return 'Treasure Hunt'
  return 'Zoo Tycoon'
})

// Animals
interface AnimalDef {
  id: string; name: string; icon: string; color: number; rare: boolean
  buildCost: number; incomePerTick: number
}

const ALL_ANIMALS: AnimalDef[] = [
  { id: 'lion', name: 'Lion', icon: '\u{1F981}', color: 0xD4882B, rare: false, buildCost: 300, incomePerTick: 5 },
  { id: 'elephant', name: 'Elephant', icon: '\u{1F418}', color: 0x888888, rare: false, buildCost: 400, incomePerTick: 7 },
  { id: 'penguin', name: 'Penguin', icon: '\u{1F427}', color: 0x222222, rare: false, buildCost: 200, incomePerTick: 3 },
  { id: 'monkey', name: 'Monkey', icon: '\u{1F412}', color: 0x8B4513, rare: false, buildCost: 250, incomePerTick: 4 },
  { id: 'panda', name: 'Panda', icon: '\u{1F43C}', color: 0xEEEEEE, rare: false, buildCost: 350, incomePerTick: 6 },
  { id: 'tiger', name: 'Tiger', icon: '\u{1F405}', color: 0xFF8C00, rare: false, buildCost: 350, incomePerTick: 6 },
  { id: 'dolphin', name: 'Dolphin', icon: '\u{1F42C}', color: 0x4488CC, rare: false, buildCost: 500, incomePerTick: 8 },
  { id: 'phoenix', name: 'Phoenix', icon: '\u{1F525}', color: 0xFF4400, rare: true, buildCost: 800, incomePerTick: 20 },
  { id: 'dragon', name: 'Dragon', icon: '\u{1F409}', color: 0x22AA22, rare: true, buildCost: 1000, incomePerTick: 30 },
  { id: 'unicorn', name: 'Unicorn', icon: '\u{1F984}', color: 0xFFAAFF, rare: true, buildCost: 900, incomePerTick: 25 },
  { id: 'griffin', name: 'Griffin', icon: '\u{1F985}', color: 0xCCAA44, rare: true, buildCost: 1200, incomePerTick: 35 },
]

const availableAnimals = computed(() => ALL_ANIMALS.filter(a => ownedAnimals.value.includes(a.id)))

// Mobile
const isMobile = ref(false)
const joystickX = ref(0)
const joystickY = ref(0)
const joystickStyle = computed(() => ({
  transform: `translate(${joystickX.value * 30}px, ${joystickY.value * 30}px)`
}))
let joystickTouchId: number | null = null

// Three.js
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animFrameId: number
let clock: THREE.Clock

// Player
let playerMesh: THREE.Group
let playerPos = new THREE.Vector3(0, 0.5, 0)
let playerVel = new THREE.Vector3()
let cameraYaw = 0
let cameraPitch = 0.6

// Input
const keys: Record<string, boolean> = {}
let mouseMovX = 0
let mouseMovY = 0
let prevMouseX = 0
let prevMouseY = 0
let mouseDown = false

// City objects
interface CityBuilding { mesh: THREE.Mesh; type: string; pos: THREE.Vector3 }
let cityBuildings: CityBuilding[] = []
let pizzaShopPos = new THREE.Vector3(-15, 0, -15)
let garagePos = new THREE.Vector3(15, 0, -15)
let deliveryTarget: THREE.Vector3 | null = null
let deliveryArrow: THREE.Mesh | null = null
let houses: THREE.Vector3[] = []
let templePositions: THREE.Vector3[] = []
let currentTempleIdx = -1

// Zoo area
let zooBasePos = new THREE.Vector3(30, 0, 30)
let enclosureMeshes: THREE.Group[] = []
let zooAnimalMeshes: THREE.Mesh[] = []

// Temple interior
let templeTraps: THREE.Mesh[] = []
let templeWalls: THREE.Mesh[] = []
let templeChest: THREE.Mesh | null = null
let templeExitPos = new THREE.Vector3()
let savedCityPos = new THREE.Vector3()

// Intervals
let deliveryInterval: number | null = null
let zooIncomeInterval: number | null = null
let trapAnimInterval: number | null = null

// Save/Load
const SAVE_KEY = 'pizzaZooSave'

function saveProg() {
  const data = {
    cash: cash.value,
    ownedAnimals: ownedAnimals.value,
    zooEnclosures: zooEnclosures.value,
    animalHappiness: animalHappiness.value,
    carSpeed: carSpeed.value,
    carHandling: carHandling.value,
    templesCompleted: templesCompleted.value,
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

function loadProg() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return
  try {
    const d = JSON.parse(raw)
    cash.value = d.cash || 0
    ownedAnimals.value = d.ownedAnimals || []
    zooEnclosures.value = d.zooEnclosures || []
    animalHappiness.value = d.animalHappiness || {}
    carSpeed.value = d.carSpeed || 1
    carHandling.value = d.carHandling || 1
    templesCompleted.value = d.templesCompleted || 0
  } catch {}
}

function showPopup(msg: string, cls = '') {
  popupMessage.value = msg
  popupClass.value = cls
  setTimeout(() => { popupMessage.value = '' }, 2000)
}

// ==================== THREE.JS SETUP ====================

function initThree() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87CEEB)
  scene.fog = new THREE.Fog(0x87CEEB, 80, 200)

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  threeContainer.value!.appendChild(renderer.domElement)

  clock = new THREE.Clock()

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffffff, 0.8)
  sun.position.set(50, 80, 30)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -100
  sun.shadow.camera.right = 100
  sun.shadow.camera.top = 100
  sun.shadow.camera.bottom = -100
  scene.add(sun)

  // Ground
  const groundGeo = new THREE.PlaneGeometry(300, 300)
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x55AA55 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Build city
  buildCity()

  // Player (car in pizza mode)
  playerMesh = new THREE.Group()
  createPlayerCar()
  scene.add(playerMesh)

  // Delivery arrow
  const arrowGeo = new THREE.ConeGeometry(0.8, 2.5, 4)
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 })
  deliveryArrow = new THREE.Mesh(arrowGeo, arrowMat)
  deliveryArrow.visible = false
  scene.add(deliveryArrow)
}

function createPlayerCar() {
  // Clear old
  while (playerMesh.children.length) playerMesh.remove(playerMesh.children[0])

  // Car body
  const bodyGeo = new THREE.BoxGeometry(1.8, 0.7, 3)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xFF3333 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.5
  body.castShadow = true
  playerMesh.add(body)

  // Cabin
  const cabGeo = new THREE.BoxGeometry(1.4, 0.6, 1.4)
  const cabMat = new THREE.MeshLambertMaterial({ color: 0x4488FF })
  const cab = new THREE.Mesh(cabGeo, cabMat)
  cab.position.set(0, 1.0, -0.3)
  cab.castShadow = true
  playerMesh.add(cab)

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8)
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
  const offsets = [[-0.9, 0.3, 0.9], [0.9, 0.3, 0.9], [-0.9, 0.3, -0.9], [0.9, 0.3, -0.9]]
  for (const o of offsets) {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.position.set(o[0], o[1], o[2])
    w.rotation.z = Math.PI / 2
    playerMesh.add(w)
  }

  // Pizza sign on top
  const signGeo = new THREE.BoxGeometry(1.0, 0.3, 0.6)
  const signMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
  const sign = new THREE.Mesh(signGeo, signMat)
  sign.position.set(0, 1.45, -0.3)
  playerMesh.add(sign)
}

function buildCity() {
  cityBuildings = []
  houses = []
  templePositions = []

  // Roads
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x444444 })
  for (let i = -4; i <= 4; i++) {
    // Horizontal roads
    const hRoad = new THREE.Mesh(new THREE.BoxGeometry(120, 0.05, 6), roadMat)
    hRoad.position.set(0, 0.01, i * 20)
    hRoad.receiveShadow = true
    scene.add(hRoad)
    // Road lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
    const line = new THREE.Mesh(new THREE.BoxGeometry(120, 0.06, 0.15), lineMat)
    line.position.set(0, 0.03, i * 20)
    scene.add(line)
  }
  for (let i = -4; i <= 4; i++) {
    // Vertical roads
    const vRoad = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 120), roadMat)
    vRoad.position.set(i * 20, 0.01, 0)
    vRoad.receiveShadow = true
    scene.add(vRoad)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 120), lineMat)
    line.position.set(i * 20, 0.03, 0)
    scene.add(line)
  }

  // Pizza shop
  const shopGroup = new THREE.Group()
  const shopBody = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshLambertMaterial({ color: 0xFF4444 }))
  shopBody.position.y = 2
  shopBody.castShadow = true
  shopGroup.add(shopBody)
  const shopRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 2, 4), new THREE.MeshLambertMaterial({ color: 0xCC2222 }))
  shopRoof.position.y = 5
  shopRoof.rotation.y = Math.PI / 4
  shopGroup.add(shopRoof)
  // Pizza sign sphere
  const pizzaSign = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshLambertMaterial({ color: 0xFFCC00 }))
  pizzaSign.position.set(0, 7, 0)
  shopGroup.add(pizzaSign)
  shopGroup.position.copy(pizzaShopPos)
  scene.add(shopGroup)

  // Garage
  const garageGroup = new THREE.Group()
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), new THREE.MeshLambertMaterial({ color: 0x666699 }))
  gBody.position.y = 1.5
  gBody.castShadow = true
  garageGroup.add(gBody)
  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x888888 }))
  gDoor.position.set(0, 1.25, 3.05)
  garageGroup.add(gDoor)
  // Wrench sign
  const wrenchSign = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 8, 16), new THREE.MeshLambertMaterial({ color: 0xFFDD00 }))
  wrenchSign.position.set(0, 4, 0)
  garageGroup.add(wrenchSign)
  garageGroup.position.copy(garagePos)
  scene.add(garageGroup)

  // Random buildings
  const buildingColors = [0x6688AA, 0x8866AA, 0xAA6644, 0x66AA88, 0xAA88CC, 0xCC8866, 0x88AACC]
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      if (Math.abs(x) < 1 && Math.abs(z) < 1) continue
      const bx = x * 20 + (Math.random() - 0.5) * 8
      const bz = z * 20 + (Math.random() - 0.5) * 8
      // Skip if too close to pizza shop or garage
      const tp = new THREE.Vector3(bx, 0, bz)
      if (tp.distanceTo(pizzaShopPos) < 10) continue
      if (tp.distanceTo(garagePos) < 10) continue
      if (tp.distanceTo(zooBasePos) < 25) continue

      if (Math.random() < 0.4) {
        // House
        const h = 2 + Math.random() * 2
        const houseGroup = new THREE.Group()
        const hBody = new THREE.Mesh(
          new THREE.BoxGeometry(4, h, 4),
          new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)] })
        )
        hBody.position.y = h / 2
        hBody.castShadow = true
        houseGroup.add(hBody)
        // Roof
        const hRoof = new THREE.Mesh(
          new THREE.ConeGeometry(3.5, 1.5, 4),
          new THREE.MeshLambertMaterial({ color: 0x884422 })
        )
        hRoof.position.y = h + 0.75
        hRoof.rotation.y = Math.PI / 4
        houseGroup.add(hRoof)
        // Door
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.4, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x553311 })
        )
        door.position.set(0, 0.7, 2.05)
        houseGroup.add(door)

        houseGroup.position.set(bx, 0, bz)
        scene.add(houseGroup)
        houses.push(new THREE.Vector3(bx, 0, bz))
        cityBuildings.push({ mesh: hBody, type: 'house', pos: new THREE.Vector3(bx, 0, bz) })
      } else {
        // Tall building
        const h = 4 + Math.random() * 8
        const bMesh = new THREE.Mesh(
          new THREE.BoxGeometry(5, h, 5),
          new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)] })
        )
        bMesh.position.set(bx, h / 2, bz)
        bMesh.castShadow = true
        scene.add(bMesh)
        cityBuildings.push({ mesh: bMesh, type: 'building', pos: new THREE.Vector3(bx, 0, bz) })
      }
    }
  }

  // Temple entrances (appear after $500 earned)
  const templeCoords = [
    new THREE.Vector3(-40, 0, 40),
    new THREE.Vector3(40, 0, -40),
    new THREE.Vector3(-40, 0, -40),
  ]
  for (const tc of templeCoords) {
    const tGroup = new THREE.Group()
    // Pyramid shape
    const pyramid = new THREE.Mesh(
      new THREE.ConeGeometry(5, 8, 4),
      new THREE.MeshLambertMaterial({ color: 0xDDAA44 })
    )
    pyramid.position.y = 4
    pyramid.rotation.y = Math.PI / 4
    pyramid.castShadow = true
    tGroup.add(pyramid)
    // Entrance
    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x332200 })
    )
    entrance.position.set(0, 1.5, 5)
    tGroup.add(entrance)
    // Glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xFFDD00, transparent: true, opacity: 0.6 })
    )
    glow.position.set(0, 8.5, 0)
    tGroup.add(glow)

    tGroup.position.copy(tc)
    tGroup.visible = false // Hidden until player earns enough
    scene.add(tGroup)
    templePositions.push(tc)
    cityBuildings.push({ mesh: pyramid, type: 'temple', pos: tc })
  }

  // Zoo area ground
  const zooGround = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.1, 40),
    new THREE.MeshLambertMaterial({ color: 0x88BB66 })
  )
  zooGround.position.set(zooBasePos.x, 0.05, zooBasePos.z)
  zooGround.receiveShadow = true
  scene.add(zooGround)

  // Zoo entrance sign
  const zooSign = new THREE.Group()
  const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshLambertMaterial({ color: 0x884422 }))
  pole1.position.set(-3, 2.5, 0)
  zooSign.add(pole1)
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshLambertMaterial({ color: 0x884422 }))
  pole2.position.set(3, 2.5, 0)
  zooSign.add(pole2)
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7, 1.5, 0.3), new THREE.MeshLambertMaterial({ color: 0xFF6600 }))
  signBoard.position.set(0, 5.2, 0)
  zooSign.add(signBoard)
  zooSign.position.set(zooBasePos.x, 0, zooBasePos.z - 20)
  scene.add(zooSign)

  // Trees scattered around
  for (let i = 0; i < 60; i++) {
    const tx = (Math.random() - 0.5) * 250
    const tz = (Math.random() - 0.5) * 250
    const tp2 = new THREE.Vector3(tx, 0, tz)
    // Skip if on a road or near buildings
    let tooClose = false
    for (const b of cityBuildings) {
      if (tp2.distanceTo(b.pos) < 6) { tooClose = true; break }
    }
    if (tp2.distanceTo(pizzaShopPos) < 8) tooClose = true
    if (tooClose) continue

    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2),
      new THREE.MeshLambertMaterial({ color: 0x664422 })
    )
    trunk.position.y = 1
    tree.add(trunk)
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x22AA22 })
    )
    leaves.position.y = 3
    leaves.castShadow = true
    tree.add(leaves)
    tree.position.set(tx, 0, tz)
    scene.add(tree)
  }
}

function rebuildZoo() {
  // Remove old enclosure meshes
  for (const m of enclosureMeshes) scene.remove(m)
  enclosureMeshes = []
  for (const m of zooAnimalMeshes) scene.remove(m)
  zooAnimalMeshes = []

  let idx = 0
  for (const encId of zooEnclosures.value) {
    const animal = ALL_ANIMALS.find(a => a.id === encId)
    if (!animal) continue

    const row = Math.floor(idx / 3)
    const col = idx % 3
    const ex = zooBasePos.x - 12 + col * 12
    const ez = zooBasePos.z - 12 + row * 12

    const encGroup = new THREE.Group()
    // Fence
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x884422 })
    const fencePositions = [
      [5, 0.5, 0, 0.2, 1, 10],
      [-5, 0.5, 0, 0.2, 1, 10],
      [0, 0.5, 5, 10, 1, 0.2],
      [0, 0.5, -5, 10, 1, 0.2],
    ]
    for (const fp of fencePositions) {
      const fence = new THREE.Mesh(new THREE.BoxGeometry(fp[3], fp[4], fp[5]), fenceMat)
      fence.position.set(fp[0], fp[1], fp[2])
      encGroup.add(fence)
    }

    // Ground
    const eGround = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.1, 10),
      new THREE.MeshLambertMaterial({ color: 0xBBAA77 })
    )
    eGround.position.y = 0.06
    encGroup.add(eGround)

    encGroup.position.set(ex, 0, ez)
    scene.add(encGroup)
    enclosureMeshes.push(encGroup)

    // Animal mesh (simple shapes)
    const animalMesh = createAnimalMesh(animal)
    animalMesh.position.set(ex + (Math.random() - 0.5) * 4, 0, ez + (Math.random() - 0.5) * 4)
    scene.add(animalMesh)
    zooAnimalMeshes.push(animalMesh)

    idx++
  }
}

function createAnimalMesh(animal: AnimalDef): THREE.Mesh {
  const mat = new THREE.MeshLambertMaterial({ color: animal.color })

  if (animal.id === 'penguin') {
    // Black body, white belly
    const group = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 4, 8), mat)
    body.position.y = 1
    group.add(body)
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }))
    belly.position.set(0, 0.9, 0.25)
    group.add(belly)
    return body // simplified
  }

  if (animal.id === 'elephant') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), mat)
    body.position.y = 1.5
    body.scale.set(1.3, 1, 1)
    return body
  }

  if (animal.id === 'dolphin') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 8), mat)
    body.position.y = 0.8
    body.rotation.z = 0.3
    return body
  }

  if (animal.rare) {
    // Rare animals get a bigger, glowing look
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshLambertMaterial({ color: animal.color, emissive: animal.color, emissiveIntensity: 0.3 }))
    body.position.y = 1.2
    return body
  }

  // Default: round body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), mat)
  body.position.y = 0.8
  return body
}

// ==================== TEMPLE GENERATION ====================

function enterTemple(idx: number) {
  if (inTemple.value) return
  currentTempleIdx = idx
  savedCityPos.copy(playerPos)
  inTemple.value = true
  templeHP.value = 100
  templeRoom.value = 1
  templeRoomCount.value = 3 + templesCompleted.value
  showPuzzle.value = false

  // Clear city scene partially - just move player to a temple area far away
  playerPos.set(200, 0.5, 200)

  buildTempleRoom()
  objectiveText.value = 'Find the treasure chest!'
}

function buildTempleRoom() {
  // Clear old temple
  for (const t of templeTraps) scene.remove(t)
  templeTraps = []
  for (const w of templeWalls) scene.remove(w)
  templeWalls = []
  if (templeChest) { scene.remove(templeChest); templeChest = null }

  const baseX = 200
  const baseZ = 200
  const roomSize = 20

  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, 0.2, roomSize),
    new THREE.MeshLambertMaterial({ color: 0x886644 })
  )
  floor.position.set(baseX, 0, baseZ)
  scene.add(floor)
  templeWalls.push(floor)

  // Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x664422 })
  const wallDefs = [
    [baseX, 3, baseZ - roomSize / 2, roomSize, 6, 0.5],
    [baseX, 3, baseZ + roomSize / 2, roomSize, 6, 0.5],
    [baseX - roomSize / 2, 3, baseZ, 0.5, 6, roomSize],
    [baseX + roomSize / 2, 3, baseZ, 0.5, 6, roomSize],
  ]
  for (const wd of wallDefs) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wd[3], wd[4], wd[5]), wallMat)
    wall.position.set(wd[0], wd[1], wd[2])
    wall.castShadow = true
    scene.add(wall)
    templeWalls.push(wall)
  }

  // Torches (light sources)
  const torchPositions = [
    [baseX - 9, 3, baseZ - 9],
    [baseX + 9, 3, baseZ - 9],
    [baseX - 9, 3, baseZ + 9],
    [baseX + 9, 3, baseZ + 9],
  ]
  for (const tp of torchPositions) {
    const torch = new THREE.PointLight(0xFF8800, 1.5, 15)
    torch.position.set(tp[0], tp[1], tp[2])
    scene.add(torch as unknown as THREE.Object3D)
    const torchMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x553311 })
    )
    torchMesh.position.set(tp[0], tp[1] - 0.75, tp[2])
    scene.add(torchMesh)
    templeWalls.push(torchMesh)
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xFF6600 })
    )
    flame.position.set(tp[0], tp[1] + 0.2, tp[2])
    scene.add(flame)
    templeWalls.push(flame)
  }

  // Traps based on difficulty
  const difficulty = templesCompleted.value + templeRoom.value
  const trapCount = Math.min(2 + difficulty, 8)

  for (let i = 0; i < trapCount; i++) {
    const trapType = Math.floor(Math.random() * 3)
    const tx = baseX + (Math.random() - 0.5) * (roomSize - 6)
    const tz = baseZ + (Math.random() - 0.5) * (roomSize - 6)

    if (trapType === 0) {
      // Swinging axe
      const axe = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 1.5),
        new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
      )
      axe.position.set(tx, 2, tz)
      axe.userData = { trapType: 'axe', baseX: tx, time: Math.random() * Math.PI * 2 }
      scene.add(axe)
      templeTraps.push(axe)
    } else if (trapType === 1) {
      // Spike floor
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      )
      spike.position.set(tx, 0.1, tz)
      spike.userData = { trapType: 'spike', baseY: 0.1, time: Math.random() * Math.PI * 2 }
      scene.add(spike)
      templeTraps.push(spike)
    } else {
      // Rolling boulder
      const boulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x776655 })
      )
      boulder.position.set(tx, 0.8, tz)
      boulder.userData = { trapType: 'boulder', baseX: tx, baseZ: tz, time: Math.random() * Math.PI * 2 }
      scene.add(boulder)
      templeTraps.push(boulder)
    }
  }

  // Treasure chest at far end of room
  const chestX = baseX + (Math.random() - 0.5) * 8
  const chestZ = baseZ + 6
  templeChest = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xFFCC00 })
  )
  templeChest.position.set(chestX, 0.5, chestZ)
  scene.add(templeChest)

  // Exit door
  templeExitPos.set(baseX, 0.5, baseZ - 9)

  playerPos.set(baseX, 0.5, baseZ - 8)
}

function exitTemple() {
  // Clean up temple
  for (const t of templeTraps) scene.remove(t)
  templeTraps = []
  for (const w of templeWalls) scene.remove(w)
  templeWalls = []
  if (templeChest) { scene.remove(templeChest); templeChest = null }

  inTemple.value = false
  showPuzzle.value = false
  playerPos.copy(savedCityPos)
  objectiveText.value = ''
}

function openTreasureChest() {
  const goldAmount = 200 + Math.floor(Math.random() * 300) + (templesCompleted.value * 100)
  cash.value += goldAmount
  showPopup('Found $' + goldAmount + ' gold!', 'gold')

  // Chance to find animal egg
  const rareAnimals = ALL_ANIMALS.filter(a => a.rare && !ownedAnimals.value.includes(a.id))
  const commonAnimals = ALL_ANIMALS.filter(a => !a.rare && !ownedAnimals.value.includes(a.id))

  let foundAnimal: AnimalDef | null = null
  if (rareAnimals.length > 0 && Math.random() < 0.4) {
    foundAnimal = rareAnimals[Math.floor(Math.random() * rareAnimals.length)]
  } else if (commonAnimals.length > 0 && Math.random() < 0.6) {
    foundAnimal = commonAnimals[Math.floor(Math.random() * commonAnimals.length)]
  }

  if (foundAnimal) {
    ownedAnimals.value.push(foundAnimal.id)
    setTimeout(() => {
      showPopup('Found a ' + foundAnimal!.name + ' egg! ' + foundAnimal!.icon, 'animal')
    }, 2200)
  }

  // Next room or finish
  if (templeRoom.value < templeRoomCount.value) {
    templeRoom.value++
    setTimeout(() => buildTempleRoom(), 500)
  } else {
    templesCompleted.value++
    showPopup('Temple Complete!', 'gold')
    setTimeout(() => exitTemple(), 1500)
  }

  saveProg()
}

// ==================== PUZZLE ====================

function startPuzzle() {
  const count = 4 + templesCompleted.value
  const nums = Array.from({ length: count }, (_, i) => i + 1)
  puzzleOrder = [...nums]
  // Shuffle display
  const shuffled = [...nums].sort(() => Math.random() - 0.5)
  puzzleButtons.value = shuffled.map(n => ({ label: n, done: false, wrong: false }))
  puzzleStep = 0
  showPuzzle.value = true
}

function pressPuzzleButton(idx: number) {
  const btn = puzzleButtons.value[idx]
  if (btn.done) return
  if (btn.label === puzzleOrder[puzzleStep]) {
    btn.done = true
    puzzleStep++
    if (puzzleStep >= puzzleOrder.length) {
      showPuzzle.value = false
      showPopup('Puzzle solved!', 'gold')
    }
  } else {
    btn.wrong = true
    templeHP.value = Math.max(0, templeHP.value - 10)
    setTimeout(() => { btn.wrong = false }, 500)
    if (templeHP.value <= 0) {
      showPuzzle.value = false
      showPopup('You got knocked out!', 'damage')
      setTimeout(() => exitTemple(), 1500)
    }
  }
}

// ==================== GAME MODES ====================

function switchMode(mode: 'pizza' | 'temple' | 'zoo') {
  if (inTemple.value) {
    exitTemple()
  }
  gameMode.value = mode
  showGarage.value = false
  showZooBuild.value = false
  showPuzzle.value = false

  if (mode === 'pizza') {
    objectiveText.value = 'Drive to the Pizza Shop to pick up a pizza!'
    // Move player near pizza shop if far away
    if (playerPos.distanceTo(pizzaShopPos) > 80) {
      playerPos.set(pizzaShopPos.x + 5, 0.5, pizzaShopPos.z + 5)
    }
  } else if (mode === 'temple') {
    objectiveText.value = 'Drive to a Temple entrance!'
  } else {
    objectiveText.value = 'Welcome to your Zoo!'
    if (playerPos.distanceTo(zooBasePos) > 80) {
      playerPos.set(zooBasePos.x, 0.5, zooBasePos.z - 18)
    }
    rebuildZoo()
  }
}

function startDelivery() {
  if (houses.length === 0) return
  const target = houses[Math.floor(Math.random() * houses.length)]
  deliveryTarget = target.clone()
  deliveryActive.value = true
  const dist = playerPos.distanceTo(target)
  deliveryTimerMax.value = Math.max(15, dist * 0.5)
  deliveryTimeLeft.value = deliveryTimerMax.value
  objectiveText.value = 'Deliver the pizza!'
  showPopup('Pizza picked up! GO GO GO!', 'gold')

  if (deliveryInterval) clearInterval(deliveryInterval)
  deliveryInterval = window.setInterval(() => {
    deliveryTimeLeft.value -= 0.1
    if (deliveryTimeLeft.value <= 0) {
      deliveryTimeLeft.value = 0
      completeDelivery(true)
    }
  }, 100)
}

function completeDelivery(timedOut = false) {
  if (deliveryInterval) { clearInterval(deliveryInterval); deliveryInterval = null }
  deliveryActive.value = false
  deliveryTarget = null
  if (deliveryArrow) deliveryArrow.visible = false

  if (timedOut) {
    const pay = 50
    cash.value += pay
    showPopup('Late delivery... $' + pay, '')
  } else {
    const timePct = deliveryTimeLeft.value / deliveryTimerMax.value
    const pay = Math.floor(50 + 150 * timePct)
    cash.value += pay
    showPopup('Delivered! $' + pay + (timePct > 0.5 ? ' + Nice tip!' : ''), 'gold')
  }

  objectiveText.value = 'Drive to the Pizza Shop for another delivery!'
  saveProg()
}

// ==================== ZOO ====================

function buildEnclosure(animal: AnimalDef) {
  if (cash.value < animal.buildCost) return
  cash.value -= animal.buildCost
  zooEnclosures.value.push(animal.id)
  animalHappiness.value[animal.id] = 80
  rebuildZoo()
  showPopup('Built ' + animal.name + ' enclosure!', 'gold')
  saveProg()
}

function feedAnimal(animalId: string) {
  if (cash.value < 50) return
  cash.value -= 50
  animalHappiness.value[animalId] = Math.min(100, (animalHappiness.value[animalId] || 50) + 30)
  showPopup('Fed the ' + animalId + '!', 'gold')
  saveProg()
}

function startZooIncome() {
  if (zooIncomeInterval) clearInterval(zooIncomeInterval)
  zooIncomeInterval = window.setInterval(() => {
    let income = 0
    for (const encId of zooEnclosures.value) {
      const animal = ALL_ANIMALS.find(a => a.id === encId)
      if (!animal) continue
      const happiness = animalHappiness.value[encId] || 50
      const multiplier = happiness / 100
      income += Math.floor(animal.incomePerTick * multiplier)
      // Decay happiness slowly
      animalHappiness.value[encId] = Math.max(10, (animalHappiness.value[encId] || 50) - 1)
    }
    if (income > 0) {
      cash.value += income
      zooVisitors.value = zooEnclosures.value.length * 3 + Math.floor(Math.random() * 5)
    }
    saveProg()
  }, 5000)
}

// ==================== UPGRADES ====================

function upgradeSpeed() {
  if (cash.value < speedCost.value) return
  cash.value -= speedCost.value
  carSpeed.value++
  showPopup('Speed upgraded to Lv' + carSpeed.value + '!', 'gold')
  saveProg()
}

function upgradeHandling() {
  if (cash.value < handlingCost.value) return
  cash.value -= handlingCost.value
  carHandling.value++
  showPopup('Handling upgraded to Lv' + carHandling.value + '!', 'gold')
  saveProg()
}

// ==================== INPUT ====================

function onKeyDown(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = true
  if (e.key.toLowerCase() === 'e') handleAction()
}

function onKeyUp(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = false
}

function onMouseMove(e: MouseEvent) {
  if (document.pointerLockElement === renderer?.domElement) {
    mouseMovX += e.movementX
    mouseMovY += e.movementY
  } else if (mouseDown) {
    mouseMovX += e.movementX || (e.clientX - prevMouseX)
    mouseMovY += e.movementY || (e.clientY - prevMouseY)
  }
  prevMouseX = e.clientX
  prevMouseY = e.clientY
}

function onMouseDown(e: MouseEvent) {
  mouseDown = true
  prevMouseX = e.clientX
  prevMouseY = e.clientY
  if (renderer && !document.pointerLockElement) {
    renderer.domElement.requestPointerLock()
  }
}

function onMouseUp() {
  mouseDown = false
}

function onTouchMoveCamera(e: TouchEvent) {
  // Handle camera rotation from non-joystick touches
  if (e.touches.length > 0) {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i]
      if (joystickTouchId !== null && touch.identifier === joystickTouchId) continue
      // Use this touch for camera
      const dx = touch.clientX - prevMouseX
      const dy = touch.clientY - prevMouseY
      mouseMovX += dx
      mouseMovY += dy
      prevMouseX = touch.clientX
      prevMouseY = touch.clientY
    }
  }
}

function onTouchStartCamera(e: TouchEvent) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i]
    if (touch.clientX > window.innerWidth * 0.4) {
      prevMouseX = touch.clientX
      prevMouseY = touch.clientY
    }
  }
}

function joystickStart(e: TouchEvent) {
  const touch = e.touches[0]
  joystickTouchId = touch.identifier
}

function joystickMove(e: TouchEvent) {
  for (let i = 0; i < e.touches.length; i++) {
    if (e.touches[i].identifier === joystickTouchId) {
      const rect = joystickArea.value!.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.touches[i].clientX - cx) / (rect.width / 2)
      const dy = (e.touches[i].clientY - cy) / (rect.height / 2)
      const len = Math.sqrt(dx * dx + dy * dy)
      const maxLen = 1
      if (len > maxLen) {
        joystickX.value = (dx / len) * maxLen
        joystickY.value = (dy / len) * maxLen
      } else {
        joystickX.value = dx
        joystickY.value = dy
      }
    }
  }
}

function joystickEnd() {
  joystickTouchId = null
  joystickX.value = 0
  joystickY.value = 0
}

function mobileAction() {
  handleAction()
}

function handleAction() {
  if (showGarage.value || showZooBuild.value || showPuzzle.value) return

  if (showPickupPrompt.value && gameMode.value === 'pizza') {
    startDelivery()
    return
  }
  if (showDeliverPrompt.value && deliveryActive.value) {
    completeDelivery(false)
    return
  }
  if (showTemplePrompt.value) {
    const idx = templePositions.findIndex(tp => playerPos.distanceTo(tp) < 8)
    if (idx >= 0) enterTemple(idx)
    return
  }
  if (showGaragePrompt.value) {
    showGarage.value = true
    return
  }
  if (showFeedPrompt.value) {
    // Find nearest enclosure
    const nearest = findNearestEnclosureAnimal()
    if (nearest) feedAnimal(nearest)
    return
  }
  if (gameMode.value === 'zoo') {
    showZooBuild.value = true
  }
}

function findNearestEnclosureAnimal(): string | null {
  let minDist = Infinity
  let nearest: string | null = null
  let idx = 0
  for (const encId of zooEnclosures.value) {
    const row = Math.floor(idx / 3)
    const col = idx % 3
    const ex = zooBasePos.x - 12 + col * 12
    const ez = zooBasePos.z - 12 + row * 12
    const dist = playerPos.distanceTo(new THREE.Vector3(ex, 0, ez))
    if (dist < minDist) {
      minDist = dist
      nearest = encId
    }
    idx++
  }
  return minDist < 8 ? nearest : null
}

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ==================== GAME LOOP ====================

function gameLoop() {
  animFrameId = requestAnimationFrame(gameLoop)
  const dt = Math.min(clock.getDelta(), 0.05)

  // Camera rotation
  const sensitivity = 0.003
  cameraYaw -= mouseMovX * sensitivity
  cameraPitch = Math.max(0.2, Math.min(1.2, cameraPitch - mouseMovY * sensitivity))
  mouseMovX = 0
  mouseMovY = 0

  // Movement
  const speed = (3 + carSpeed.value * 1.5) * dt
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
  const right = new THREE.Vector3(forward.z, 0, -forward.x)

  let moveX = 0
  let moveZ = 0

  if (isMobile.value) {
    moveX = joystickX.value
    moveZ = joystickY.value
  } else {
    if (keys['w']) moveZ -= 1
    if (keys['s']) moveZ += 1
    if (keys['a']) moveX -= 1
    if (keys['d']) moveX += 1
  }

  if (moveX !== 0 || moveZ !== 0) {
    const moveDir = new THREE.Vector3()
    moveDir.addScaledVector(forward, -moveZ)
    moveDir.addScaledVector(right, moveX)
    moveDir.normalize()
    playerPos.x += moveDir.x * speed
    playerPos.z += moveDir.z * speed

    // Face movement direction
    const targetAngle = Math.atan2(moveDir.x, moveDir.z)
    const handling = 0.1 + carHandling.value * 0.05
    let currentAngle = playerMesh.rotation.y
    let diff = targetAngle - currentAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    playerMesh.rotation.y += diff * handling
  }

  // Clamp player position
  playerPos.x = Math.max(-120, Math.min(120, playerPos.x))
  playerPos.z = Math.max(-120, Math.min(120, playerPos.z))

  // Update player mesh
  playerMesh.position.copy(playerPos)

  // Camera follow
  const camDist = 10
  const camHeight = camDist * Math.sin(cameraPitch)
  const camHoriz = camDist * Math.cos(cameraPitch)
  camera.position.set(
    playerPos.x + Math.sin(cameraYaw) * camHoriz,
    playerPos.y + camHeight,
    playerPos.z + Math.cos(cameraYaw) * camHoriz
  )
  camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z)

  // Update prompts
  updatePrompts()

  // Update delivery arrow
  if (deliveryArrow && deliveryTarget && deliveryActive.value) {
    deliveryArrow.visible = true
    const dir = deliveryTarget.clone().sub(playerPos).normalize()
    deliveryArrow.position.set(
      deliveryTarget.x,
      5 + Math.sin(Date.now() * 0.003) * 0.5,
      deliveryTarget.z
    )
    deliveryArrow.rotation.x = Math.PI // Point down
  } else if (deliveryArrow) {
    deliveryArrow.visible = false
  }

  // Temple trap animations
  if (inTemple.value) {
    const time = Date.now() * 0.002
    for (const trap of templeTraps) {
      if (trap.userData.trapType === 'axe') {
        trap.position.x = trap.userData.baseX + Math.sin(time + trap.userData.time) * 3
        trap.rotation.z = Math.sin(time + trap.userData.time) * 0.8
      } else if (trap.userData.trapType === 'spike') {
        trap.position.y = trap.userData.baseY + Math.max(0, Math.sin(time + trap.userData.time)) * 1.5
      } else if (trap.userData.trapType === 'boulder') {
        trap.position.x = trap.userData.baseX + Math.sin(time * 0.7 + trap.userData.time) * 5
        trap.position.z = trap.userData.baseZ + Math.cos(time * 0.5 + trap.userData.time) * 5
        trap.rotation.x += dt * 3
      }

      // Check collision with player
      if (trap.position.distanceTo(playerPos) < 1.5) {
        templeHP.value = Math.max(0, templeHP.value - 20 * dt)
        if (templeHP.value <= 0) {
          showPopup('You got knocked out!', 'damage')
          setTimeout(() => exitTemple(), 1000)
        }
      }
    }

    // Check treasure chest
    if (templeChest && playerPos.distanceTo(templeChest.position) < 2) {
      // Random chance to trigger puzzle
      if (Math.random() < 0.3 && !showPuzzle.value) {
        startPuzzle()
      } else {
        openTreasureChest()
      }
    }
  }

  // Update temple visibility
  for (let i = 0; i < templePositions.length; i++) {
    const tBuilding = cityBuildings.find(b => b.type === 'temple' && b.pos.equals(templePositions[i]))
    if (tBuilding && tBuilding.mesh.parent) {
      tBuilding.mesh.parent.visible = cash.value >= 500 || templesCompleted.value > 0
    }
  }

  // Animate zoo animals slightly
  for (const am of zooAnimalMeshes) {
    am.rotation.y += dt * 0.5
    am.position.y = 0.8 + Math.sin(Date.now() * 0.002 + am.position.x) * 0.1
  }

  renderer.render(scene, camera)
}

function updatePrompts() {
  showPickupPrompt.value = false
  showDeliverPrompt.value = false
  showTemplePrompt.value = false
  showGaragePrompt.value = false
  showFeedPrompt.value = false

  if (inTemple.value || showGarage.value || showZooBuild.value || showPuzzle.value) return

  // Near pizza shop
  if (gameMode.value === 'pizza' && !deliveryActive.value && playerPos.distanceTo(pizzaShopPos) < 8) {
    showPickupPrompt.value = true
  }

  // Near delivery target
  if (deliveryActive.value && deliveryTarget && playerPos.distanceTo(deliveryTarget) < 5) {
    showDeliverPrompt.value = true
  }

  // Near temple
  if (gameMode.value === 'temple' && (cash.value >= 500 || templesCompleted.value > 0)) {
    for (const tp of templePositions) {
      if (playerPos.distanceTo(tp) < 8) {
        showTemplePrompt.value = true
        break
      }
    }
  }

  // Near garage
  if (playerPos.distanceTo(garagePos) < 8) {
    showGaragePrompt.value = true
  }

  // Near zoo animal
  if (gameMode.value === 'zoo' && zooEnclosures.value.length > 0) {
    const nearest = findNearestEnclosureAnimal()
    if (nearest) showFeedPrompt.value = true
  }
}

// ==================== LIFECYCLE ====================

function startGame() {
  loadProg()
  // Give starter animals if none
  if (ownedAnimals.value.length === 0) {
    ownedAnimals.value = ['lion', 'penguin', 'monkey']
  }
  phase.value = 'playing'
  nextTick(() => {
    initThree()
    setupInput()
    startZooIncome()
    gameMode.value = 'pizza'
    objectiveText.value = 'Drive to the Pizza Shop to pick up a pizza!'
    clock = new THREE.Clock()
    gameLoop()
  })
}

function setupInput() {
  isMobile.value = 'ontouchstart' in window
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('resize', onResize)

  if (isMobile.value) {
    const el = threeContainer.value
    if (el) {
      el.addEventListener('touchstart', onTouchStartCamera as EventListener, { passive: false })
      el.addEventListener('touchmove', onTouchMoveCamera as EventListener, { passive: false })
    }
  }
}

function cleanupInput() {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('resize', onResize)
}

function goBack() {
  saveProg()
  router.push('/')
}

onMounted(() => {
  playerTracker.startSession('Player', 0, 1, 0, 0, 'Pizza Zoo Treasure')
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (deliveryInterval) clearInterval(deliveryInterval)
  if (zooIncomeInterval) clearInterval(zooIncomeInterval)
  if (trapAnimInterval) clearInterval(trapAnimInterval)
  cleanupInput()
  if (renderer) {
    renderer.dispose()
  }
  playerTracker.endSession()
})
</script>

<style scoped>
.pizza-zoo-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', Arial, sans-serif;
  user-select: none;
}

/* Menu */
.menu-screen {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #ff6b35, #d62828, #f77f00, #003049);
  background-size: 400% 400%;
  animation: menuGrad 6s ease infinite;
  display: flex; align-items: center; justify-content: center;
}
@keyframes menuGrad {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.menu-card {
  background: rgba(0,0,0,0.7); border-radius: 24px; padding: 40px;
  text-align: center; max-width: 450px; width: 90%;
  border: 3px solid #ffd700;
  box-shadow: 0 0 40px rgba(255,215,0,0.3);
}
.menu-icons { font-size: 60px; margin-bottom: 16px; }
.bounce-icon {
  display: inline-block;
  animation: bounce 1s ease infinite;
}
.bounce-icon.d2 { animation-delay: 0.2s; }
.bounce-icon.d3 { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
.menu-title {
  color: #ffd700; font-size: 36px; margin: 0 0 8px;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
}
.menu-sub { color: #ffaa44; font-size: 18px; margin: 0 0 24px; }
.play-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white; border: none; border-radius: 14px;
  padding: 16px 48px; font-size: 24px; font-weight: bold;
  cursor: pointer; transition: transform 0.2s;
  box-shadow: 0 4px 20px rgba(34,197,94,0.4);
}
.play-btn:hover { transform: scale(1.08); }
.back-link {
  display: block; margin-top: 16px; background: none; border: none;
  color: #aaa; font-size: 14px; cursor: pointer;
}
.back-link:hover { color: #fff; }

/* Game screen */
.game-screen { position: relative; width: 100%; height: 100%; }
.three-container { width: 100%; height: 100%; }

/* HUD */
.hud-top {
  position: absolute; top: 16px; right: 16px;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
}
.hud-cash {
  background: rgba(0,0,0,0.7); color: #22c55e; font-size: 28px;
  font-weight: bold; padding: 8px 20px; border-radius: 12px;
  border: 2px solid #22c55e;
  text-shadow: 0 0 10px rgba(34,197,94,0.5);
}
.hud-mode {
  background: rgba(0,0,0,0.7); color: #ffd700; font-size: 16px;
  font-weight: bold; padding: 6px 14px; border-radius: 8px;
}
.hud-objective {
  position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); color: #fff; font-size: 16px;
  padding: 8px 20px; border-radius: 10px; white-space: nowrap;
  border: 1px solid #ffd700;
}

/* Mode buttons */
.mode-buttons {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 10px;
}
.mode-btn {
  background: rgba(0,0,0,0.7); color: #fff; border: 2px solid #555;
  border-radius: 12px; padding: 10px 20px; font-size: 16px;
  font-weight: bold; cursor: pointer; transition: all 0.2s;
}
.mode-btn:hover { border-color: #ffd700; }
.mode-btn.active { border-color: #ffd700; background: rgba(255,215,0,0.2); color: #ffd700; }
.mode-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Delivery timer */
.delivery-timer {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 10px;
  text-align: center; min-width: 200px;
}
.dt-label { color: #ffa500; font-weight: bold; font-size: 14px; }
.dt-bar-bg {
  background: #333; height: 10px; border-radius: 5px; margin: 6px 0;
  overflow: hidden;
}
.dt-bar {
  background: linear-gradient(90deg, #ef4444, #fbbf24, #22c55e);
  height: 100%; border-radius: 5px; transition: width 0.1s;
}
.dt-time { color: #fff; font-size: 18px; font-weight: bold; }

/* Prompts */
.prompt-box {
  position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.85); color: #ffd700; font-size: 18px;
  font-weight: bold; padding: 12px 24px; border-radius: 12px;
  border: 2px solid #ffd700;
  animation: promptPulse 1s ease infinite alternate;
}
@keyframes promptPulse {
  from { box-shadow: 0 0 10px rgba(255,215,0,0.3); }
  to { box-shadow: 0 0 25px rgba(255,215,0,0.6); }
}
.deliver-prompt { border-color: #22c55e; color: #22c55e; }
.temple-prompt { border-color: #ff8800; color: #ff8800; }
.garage-prompt { border-color: #4488ff; color: #4488ff; }
.feed-prompt { border-color: #ff66aa; color: #ff66aa; }

/* Popup */
.popup-msg {
  position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.9); color: #fff; font-size: 28px;
  font-weight: bold; padding: 20px 40px; border-radius: 16px;
  border: 3px solid #ffd700;
  animation: popIn 0.3s ease;
  z-index: 100;
}
.popup-msg.gold { color: #ffd700; border-color: #ffd700; }
.popup-msg.animal { color: #ff66cc; border-color: #ff66cc; }
.popup-msg.damage { color: #ef4444; border-color: #ef4444; }
@keyframes popIn {
  from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* Garage overlay */
.garage-overlay, .zoo-build-overlay, .puzzle-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); display: flex;
  align-items: center; justify-content: center; z-index: 50;
}
.garage-card, .zoo-build-card, .puzzle-card {
  background: #1a202c; border: 2px solid #ffd700; border-radius: 20px;
  padding: 30px; min-width: 320px; max-width: 90%; color: #fff;
}
.garage-card h2, .zoo-build-card h2, .puzzle-card h2 {
  color: #ffd700; margin: 0 0 20px; text-align: center;
}
.garage-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #333;
}
.garage-item span { font-size: 18px; }
.garage-item button {
  background: #22c55e; color: white; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer;
}
.garage-item button:disabled { background: #555; cursor: not-allowed; }
.garage-close {
  display: block; margin: 20px auto 0; background: #ef4444; color: white;
  border: none; border-radius: 8px; padding: 10px 30px; font-size: 16px;
  cursor: pointer;
}

/* Zoo build */
.zoo-animals-list { max-height: 300px; overflow-y: auto; }
.zoo-animal-option {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #333;
}
.zoo-animal-option span { font-size: 16px; }
.zoo-animal-option button {
  background: #22c55e; color: white; border: none; border-radius: 8px;
  padding: 6px 14px; cursor: pointer; font-weight: bold;
}
.zoo-animal-option button:disabled { background: #555; cursor: not-allowed; }
.built-label { color: #22c55e; font-weight: bold; }

/* Puzzle */
.puzzle-buttons {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
}
.pz-btn {
  width: 60px; height: 60px; font-size: 24px; font-weight: bold;
  border: 3px solid #ffd700; border-radius: 12px;
  background: #2d3748; color: #fff; cursor: pointer;
  transition: all 0.2s;
}
.pz-btn.done { background: #22c55e; border-color: #22c55e; }
.pz-btn.wrong { background: #ef4444; border-color: #ef4444; animation: shake 0.3s; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Temple HUD */
.temple-hud {
  position: absolute; top: 16px; left: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.temple-health-bar {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.7); padding: 6px 12px; border-radius: 8px;
}
.th-label { color: #ef4444; font-weight: bold; }
.th-bg { width: 120px; height: 10px; background: #333; border-radius: 5px; overflow: hidden; }
.th-fill { height: 100%; background: #ef4444; border-radius: 5px; transition: width 0.2s; }
.temple-progress {
  background: rgba(0,0,0,0.7); color: #ffd700; padding: 4px 12px;
  border-radius: 8px; font-size: 14px; font-weight: bold;
}

/* Mobile controls */
.mobile-controls {
  position: absolute; bottom: 80px; left: 0; width: 100%; pointer-events: none;
}
.joystick-area {
  position: absolute; bottom: 20px; left: 30px;
  width: 120px; height: 120px; pointer-events: all;
}
.joystick-base {
  width: 100%; height: 100%; border-radius: 50%;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
}
.joystick-knob {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.5); transition: transform 0.05s;
}
.mobile-action-btn {
  position: absolute; bottom: 30px; right: 30px;
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(255,215,0,0.6); border: 2px solid #ffd700;
  color: #fff; font-size: 24px; font-weight: bold;
  pointer-events: all; cursor: pointer;
}

/* Back button */
.back-btn {
  position: absolute; top: 16px; left: 16px;
  background: rgba(0,0,0,0.7); color: #fff; border: 1px solid #555;
  border-radius: 8px; padding: 8px 16px; font-size: 14px; cursor: pointer;
  z-index: 10;
}
.back-btn:hover { background: rgba(0,0,0,0.9); border-color: #ffd700; }

@media (max-width: 768px) {
  .hud-cash { font-size: 20px; padding: 6px 14px; }
  .mode-btn { padding: 8px 14px; font-size: 14px; }
  .menu-title { font-size: 28px; }
  .menu-icons { font-size: 44px; }
}
</style>
