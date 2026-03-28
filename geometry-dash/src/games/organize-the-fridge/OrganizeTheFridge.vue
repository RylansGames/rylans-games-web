<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>

    <div ref="gameContainer" class="game-container">
      <!-- Game Over Screen -->
      <div v-if="gameOver" class="game-over-screen">
        <h1>🎉 FRIDGE ORGANIZED! 🎉</h1>
        <p class="score-text">You organized {{ score }} items!</p>
        <p class="coins-text">💰 Coins Collected: {{ coins }}</p>
        <p class="high-score-text">High Score: {{ highScore }} items</p>
        <button @click="restartGame" class="restart-button">🧊 Organize Again</button>
        <button @click="goBack" class="exit-button">← Back to Portal</button>
      </div>

      <!-- Start Screen -->
      <div v-if="!gameStarted && !gameOver" class="start-screen">
        <h1>🧊 ORGANIZE THE FRIDGE 🧊</h1>
        <p class="subtitle">Keep the Kitchen Clean!</p>
        <p class="instructions">🖱️ Click or touch and drag food items</p>
        <p class="instructions">🥕 Drop items on the correct colored shelves!</p>
        <p class="instructions">🔴 Red items → Bottom shelf</p>
        <p class="instructions">🟢 Green items → Middle shelf</p>
        <p class="instructions">🔵 Blue items → Top shelf</p>
        <p class="instructions">💰 Earn coins for organizing!</p>
        <button @click="startGame" class="start-button">OPEN FRIDGE</button>
      </div>

      <!-- Game HUD -->
      <div v-if="gameStarted && !gameOver" class="game-hud">
        <div class="hud-item">📦 {{ score }} organized</div>
        <div class="hud-item">💰 {{ coins }}</div>
        <div class="hud-item progress-meter" :style="{ background: progressColor }">
          ✨ Progress: {{ Math.round(progress * 100) }}%
        </div>
      </div>

      <!-- Crosshair -->
      <div v-if="gameStarted && !gameOver" class="crosshair"></div>

      <!-- Instructions overlay -->
      <div v-if="gameStarted && !gameOver && showInstructions" class="instructions-overlay">
        <p>Click and drag food items to the matching colored shelf!</p>
        <p>Red → Bottom • Green → Middle • Blue → Top</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'
import * as THREE from 'three'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()
const gameContainer = ref<HTMLDivElement>()

const gameStarted = ref(false)
const gameOver = ref(false)
const score = ref(0)
const coins = ref(0)
const highScore = ref(0)
const showInstructions = ref(true)
const progress = ref(0)
const progressColor = ref('rgba(34, 197, 94, 0.3)')

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// Drag and drop state
let draggedItem: FoodItem | null = null
let isDragging = false

// Food items to organize
interface FoodItem {
  mesh: THREE.Group
  position: THREE.Vector3
  targetShelf: number
  organized: boolean
  type: string
}

const foodItems: FoodItem[] = []
const totalItemsToOrganize = 15

const goBack = () => {
  router.push('/')
}

const loadHighScore = () => {
  const saved = localStorage.getItem('organizeTheFridgeHighScore')
  if (saved) {
    highScore.value = parseInt(saved)
  }
}

const saveHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('organizeTheFridgeHighScore', highScore.value.toString())
  }
}

// Shelf drop zones (for reference)
interface Shelf {
  y: number
  color: number
  index: number
}

const shelves: Shelf[] = [
  { y: 0.7, color: 0xff0000, index: 0 }, // Bottom - Red
  { y: 2.7, color: 0x00ff00, index: 1 }, // Middle - Green
  { y: 4.7, color: 0x0000ff, index: 2 }  // Top - Blue
]

const createFridge = () => {
  // Fridge interior floor
  const floorGeometry = new THREE.PlaneGeometry(6, 8)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Walls - white fridge interior
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4
  })

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 0.2), wallMaterial)
  backWall.position.set(0, 3, -4)
  backWall.receiveShadow = true
  scene.add(backWall)

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 8), wallMaterial)
  leftWall.position.set(-3, 3, 0)
  leftWall.receiveShadow = true
  scene.add(leftWall)

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 8), wallMaterial)
  rightWall.position.set(3, 3, 0)
  rightWall.receiveShadow = true
  scene.add(rightWall)

  // Shelves with colored highlights
  shelves.forEach(shelf => {
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: shelf.color,
      transparent: true,
      opacity: 0.3,
      emissive: shelf.color,
      emissiveIntensity: 0.2
    })

    const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.15, 1.5), shelfMaterial)
    shelfMesh.position.set(0, shelf.y - 0.2, -3.2)
    shelfMesh.castShadow = true
    shelfMesh.receiveShadow = true
    scene.add(shelfMesh)
  })

  // Bright white lighting like inside a fridge
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const mainLight = new THREE.PointLight(0xffffff, 1, 20)
  mainLight.position.set(0, 5, 0)
  mainLight.castShadow = true
  scene.add(mainLight)

  // Door light
  const doorLight = new THREE.PointLight(0xaaddff, 0.5, 15)
  doorLight.position.set(0, 3, 3)
  scene.add(doorLight)
}

const createFoodMesh = (type: string): THREE.Group => {
  const group = new THREE.Group()

  if (type === 'milk') {
    // Milk carton
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    group.add(body)

    // Red cap
    const capGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.2)
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const cap = new THREE.Mesh(capGeometry, capMaterial)
    cap.position.y = 0.475
    cap.castShadow = true
    group.add(cap)
  } else if (type === 'apple') {
    // Apple
    const appleGeometry = new THREE.SphereGeometry(0.3)
    const appleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const apple = new THREE.Mesh(appleGeometry, appleMaterial)
    apple.castShadow = true
    group.add(apple)

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2)
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = 0.4
    group.add(stem)
  } else if (type === 'cheese') {
    // Cheese wedge
    const cheeseGeometry = new THREE.ConeGeometry(0.3, 0.5, 4)
    const cheeseMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 })
    const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial)
    cheese.rotation.z = Math.PI / 2
    cheese.castShadow = true
    group.add(cheese)
  } else if (type === 'carrot') {
    // Carrot
    const carrotGeometry = new THREE.ConeGeometry(0.15, 0.8, 8)
    const carrotMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 })
    const carrot = new THREE.Mesh(carrotGeometry, carrotMaterial)
    carrot.rotation.x = Math.PI
    carrot.castShadow = true
    group.add(carrot)

    // Green top
    const topGeometry = new THREE.ConeGeometry(0.2, 0.3, 6)
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.y = 0.5
    group.add(top)
  } else if (type === 'egg') {
    // Egg
    const eggGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const eggMaterial = new THREE.MeshStandardMaterial({ color: 0xfff8dc })
    const egg = new THREE.Mesh(eggGeometry, eggMaterial)
    egg.scale.y = 1.3
    egg.castShadow = true
    group.add(egg)
  }

  return group
}

const spawnFoodItems = () => {
  const types = ['milk', 'apple', 'cheese', 'carrot', 'egg']

  for (let i = 0; i < totalItemsToOrganize; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const targetShelf = Math.floor(Math.random() * 3) // 0, 1, or 2 for bottom, middle, top

    // Spawn randomly on the floor
    const x = (Math.random() - 0.5) * 4
    const z = (Math.random() - 0.5) * 6

    const foodMesh = createFoodMesh(type)
    foodMesh.position.set(x, 0.5, z)
    scene.add(foodMesh)

    // Add a colored ring to indicate target shelf
    const ringGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 16)
    let ringColor
    if (targetShelf === 0) ringColor = 0xff0000 // Red for bottom
    else if (targetShelf === 1) ringColor = 0x00ff00 // Green for middle
    else ringColor = 0x0000ff // Blue for top

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: ringColor,
      emissive: ringColor,
      emissiveIntensity: 0.5
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.3
    foodMesh.add(ring)

    const foodItem: FoodItem = {
      mesh: foodMesh,
      position: new THREE.Vector3(x, 0.5, z),
      targetShelf,
      organized: false,
      type
    }

    foodItems.push(foodItem)
  }
}

const startGame = () => {
  if (!gameContainer.value) return

  gameStarted.value = true
  gameOver.value = false
  score.value = 0
  coins.value = 0
  progress.value = 0

  // Setup Three.js scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xaaccff)

  // Fixed camera position looking at the fridge
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 2.5, 4)
  camera.lookAt(0, 2.5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  gameContainer.value.appendChild(renderer.domElement)

  // Setup raycaster for mouse picking
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Create fridge
  createFridge()

  // Spawn food items
  spawnFoodItems()

  // Hide instructions after 5 seconds
  setTimeout(() => {
    showInstructions.value = false
  }, 5000)

  animate()
}

const restartGame = () => {
  // Clean up old game
  if (renderer) {
    gameContainer.value?.removeChild(renderer.domElement)
  }

  foodItems.length = 0
  cancelAnimationFrame(animationId)
  isDragging = false
  draggedItem = null

  // Start new game
  startGame()
}

const endGame = () => {
  gameOver.value = true
  gameStarted.value = false
  cancelAnimationFrame(animationId)

  // Add coins to global state
  gameState.addCoins(coins.value)

  saveHighScore()
}

const handleMouseDown = (e: MouseEvent) => {
  if (!renderer) return

  // Calculate mouse position in normalized device coordinates
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

  // Update raycaster
  raycaster.setFromCamera(mouse, camera)

  // Check for intersections with food items
  const foodMeshes = foodItems
    .filter(item => !item.organized)
    .map(item => item.mesh)

  const intersects = raycaster.intersectObjects(foodMeshes, true)

  if (intersects.length > 0) {
    // Find which food item was clicked
    const clickedMesh = intersects[0].object
    let parentGroup = clickedMesh
    while (parentGroup.parent && !(parentGroup.parent === scene)) {
      parentGroup = parentGroup.parent as THREE.Object3D
    }

    const clickedItem = foodItems.find(item => item.mesh === parentGroup)
    if (clickedItem && !clickedItem.organized) {
      draggedItem = clickedItem
      isDragging = true
      // Make item slightly larger when picked up
      draggedItem.mesh.scale.set(1.2, 1.2, 1.2)
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!renderer || !isDragging || !draggedItem) return

  // Update mouse position
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

  // Update raycaster
  raycaster.setFromCamera(mouse, camera)

  // Move the item to follow the mouse on a plane
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2)
  const intersection = new THREE.Vector3()
  raycaster.ray.intersectPlane(plane, intersection)

  if (intersection) {
    draggedItem.mesh.position.x = Math.max(-2.5, Math.min(2.5, intersection.x))
    draggedItem.mesh.position.y = Math.max(0.5, Math.min(5.5, intersection.y))
    draggedItem.position.copy(draggedItem.mesh.position)
  }
}

const handleMouseUp = () => {
  if (!isDragging || !draggedItem) return

  isDragging = false

  // Check if item is dropped on correct shelf
  const itemY = draggedItem.mesh.position.y
  const targetShelf = shelves[draggedItem.targetShelf]

  // Check if dropped close to the correct shelf
  if (Math.abs(itemY - targetShelf.y) < 0.8) {
    // Correct shelf!
    draggedItem.organized = true
    score.value++
    coins.value += 10

    // Snap to shelf position
    draggedItem.mesh.position.set(
      (Math.random() - 0.5) * 5,
      targetShelf.y,
      -3.2
    )
    draggedItem.mesh.scale.set(0.8, 0.8, 0.8)

    // Update progress
    progress.value = score.value / totalItemsToOrganize
    progressColor.value = `rgba(34, ${197 - progress.value * 50}, 94, ${0.3 + progress.value * 0.4})`

    // Check if all items organized
    if (score.value >= totalItemsToOrganize) {
      setTimeout(() => endGame(), 1000)
    }
  } else {
    // Wrong shelf - return to original position
    draggedItem.mesh.scale.set(1, 1, 1)
    // Item stays where it was dropped
  }

  draggedItem = null
}

// Touch event handlers for iPad/mobile
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
}

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
}

const handleTouchEnd = (e: TouchEvent) => {
  e.preventDefault()
  handleMouseUp()
}

const updateFoodItems = () => {
  foodItems.forEach(item => {
    // Make unorganized items bob slightly
    if (!item.organized && !isDragging) {
      item.mesh.rotation.y += 0.02
    }
  })
}

const animate = () => {
  if (gameOver.value) return

  updateFoodItems()

  renderer.render(scene, camera)
  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

onMounted(() => {
  loadHighScore()
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchstart', handleTouchStart, { passive: false })
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd, { passive: false })
  window.addEventListener('resize', handleResize)
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Organize the Fridge')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Organize the Fridge')

  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('resize', handleResize)
  playerTracker.endSession()
  OnlineTracker.goOffline()
  cancelAnimationFrame(animationId)

  if (renderer && gameContainer.value) {
    gameContainer.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.game-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #87ceeb;
  overflow: hidden;
}

.game-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: rgba(59, 130, 246, 0.8);
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: rgba(37, 99, 235, 0.9);
}

.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 60px;
  border-radius: 20px;
  border: 3px solid #3b82f6;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
  z-index: 10;
}

.start-screen h1 {
  color: #3b82f6;
  font-size: 56px;
  margin-bottom: 10px;
  text-shadow: 3px 3px 6px rgba(59, 130, 246, 0.5);
  animation: glow 2s infinite;
}

.subtitle {
  color: #60a5fa;
  font-size: 24px;
  margin-bottom: 30px;
  font-style: italic;
}

.instructions {
  color: #1e293b;
  font-size: 18px;
  margin: 10px 0;
}

.warning {
  color: #f59e0b;
  font-size: 20px;
  margin: 20px 0;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes glow {
  0%, 100% { text-shadow: 3px 3px 6px rgba(59, 130, 246, 0.5); }
  50% { text-shadow: 3px 3px 20px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.8); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.start-button {
  margin-top: 30px;
  padding: 15px 40px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: 3px solid white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  transition: all 0.3s;
  text-transform: uppercase;
}

.start-button:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(59, 130, 246, 1);
}

.game-over-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 40px 60px;
  border-radius: 20px;
  border: 3px solid #22c55e;
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.8);
  z-index: 10;
}

.game-over-screen h1 {
  color: #22c55e;
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 3px 3px 6px rgba(34, 197, 94, 0.5);
  animation: celebrate 1s infinite;
}

@keyframes celebrate {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  75% { transform: translateY(-10px) rotate(5deg); }
}

.score-text {
  color: #1e293b;
  font-size: 28px;
  margin: 15px 0;
}

.coins-text {
  color: #fcd34d;
  font-size: 24px;
  margin: 10px 0;
}

.high-score-text {
  color: #fcd34d;
  font-size: 20px;
  margin: 10px 0;
}

.restart-button {
  margin: 20px 10px 10px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s;
}

.restart-button:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  transform: scale(1.05);
}

.exit-button {
  margin: 10px;
  padding: 12px 30px;
  background: #6b7280;
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s;
}

.exit-button:hover {
  background: #4b5563;
  transform: scale(1.05);
}

.game-hud {
  position: fixed;
  top: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.hud-item {
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  padding: 12px 20px;
  border-radius: 8px;
  border: 2px solid #3b82f6;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  min-width: 150px;
}

.progress-meter {
  transition: background 0.3s;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: rgba(59, 130, 246, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  z-index: 100;
  pointer-events: none;
}

.crosshair::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 2px;
  background: rgba(59, 130, 246, 0.8);
}

.crosshair::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background: rgba(59, 130, 246, 0.8);
}

.instructions-overlay {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 30px;
  border-radius: 10px;
  border: 2px solid #3b82f6;
  z-index: 100;
  animation: fadeOut 5s forwards;
}

.instructions-overlay p {
  color: #1e293b;
  font-size: 16px;
  margin: 5px 0;
  text-align: center;
}

@keyframes fadeOut {
  0% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* Mobile responsiveness */
@media (max-width: 700px) {
  .start-screen {
    padding: 20px 24px;
    width: 85%;
    box-sizing: border-box;
  }
  .start-screen h1 {
    font-size: 28px;
  }
  .subtitle {
    font-size: 16px;
    margin-bottom: 16px;
  }
  .instructions {
    font-size: 14px;
  }
  .warning {
    font-size: 14px;
    margin: 10px 0;
  }
  .start-button {
    padding: 12px 28px;
    font-size: 18px;
    margin-top: 16px;
  }
  .game-over-screen {
    padding: 24px 20px;
    width: 85%;
    box-sizing: border-box;
  }
  .game-over-screen h1 {
    font-size: 28px;
    margin-bottom: 12px;
  }
  .score-text {
    font-size: 20px;
    margin: 10px 0;
  }
  .coins-text {
    font-size: 18px;
  }
  .high-score-text {
    font-size: 16px;
  }
  .restart-button, .exit-button {
    padding: 10px 20px;
    font-size: 15px;
  }
  .back-button {
    top: 10px;
    left: 10px;
    padding: 10px 18px;
    font-size: 15px;
    z-index: 9999;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .game-hud {
    top: 10px;
    right: 10px;
    gap: 6px;
  }
  .hud-item {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 80px;
  }
  .instructions-overlay {
    bottom: 20px;
    padding: 10px 16px;
    width: 85%;
    box-sizing: border-box;
  }
  .instructions-overlay p {
    font-size: 12px;
  }
  .start-button, .restart-button, .exit-button {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}

@media (max-width: 400px) {
  .start-screen h1 {
    font-size: 22px;
  }
  .subtitle {
    font-size: 14px;
  }
  .game-over-screen h1 {
    font-size: 22px;
  }
  .score-text {
    font-size: 18px;
  }
}
</style>
