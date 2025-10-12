<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>

    <div ref="gameContainer" class="game-container">
      <!-- Game Over Screen -->
      <div v-if="gameOver" class="game-over-screen">
        <h1>⏰ TIME'S UP! ⏰</h1>
        <p class="score-text">Orders Completed: {{ ordersCompleted }}</p>
        <p class="coins-text">💰 Coins Earned: {{ coins }}</p>
        <p class="high-score-text">High Score: {{ highScore }} orders</p>
        <button @click="restartGame" class="restart-button">🍣 Play Again</button>
        <button @click="goBack" class="exit-button">← Back to Portal</button>
      </div>

      <!-- Start Screen -->
      <div v-if="!gameStarted && !gameOver" class="start-screen">
        <h1>🍣 SCARY SHUSHI 🍣</h1>
        <p class="subtitle">Sushi Chef Challenge</p>
        <p class="instructions">🎮 WASD or Arrow Keys to move</p>
        <p class="instructions">🖱️ Click on stations to interact</p>
        <p class="instructions">📋 Complete orders before time runs out!</p>
        <p class="instructions">⏰ You have 3 minutes!</p>
        <div class="stations-info">
          <h3>Stations:</h3>
          <p>1️⃣ Rice Station - Get rice</p>
          <p>2️⃣ Nori Station - Get seaweed</p>
          <p>3️⃣ Fish Station - Get fish</p>
          <p>4️⃣ Assembly Station - Make sushi</p>
          <p>5️⃣ Delivery Station - Serve orders</p>
        </div>
        <button @click="startGame" class="start-button">START COOKING!</button>
      </div>

      <!-- Game HUD -->
      <div v-if="gameStarted && !gameOver" class="game-hud">
        <div class="hud-item timer" :class="{ warning: timeLeft < 30 }">
          ⏰ {{ Math.floor(timeLeft / 60) }}:{{ String(timeLeft % 60).padStart(2, '0') }}
        </div>
        <div class="hud-item">📋 Orders: {{ ordersCompleted }}</div>
        <div class="hud-item">💰 {{ coins }}</div>
      </div>

      <!-- Current Order Display -->
      <div v-if="gameStarted && !gameOver && currentOrder" class="current-order">
        <h3>Current Order:</h3>
        <div class="order-items">
          <span v-for="(item, index) in currentOrder.items" :key="index" class="order-item">
            {{ item.icon }} {{ item.name }}
          </span>
        </div>
      </div>

      <!-- Inventory Display -->
      <div v-if="gameStarted && !gameOver" class="inventory">
        <h4>Your Inventory:</h4>
        <div class="inventory-items">
          <span v-if="inventory.rice > 0">🍚 Rice: {{ inventory.rice }}</span>
          <span v-if="inventory.nori > 0">🌿 Nori: {{ inventory.nori }}</span>
          <span v-if="inventory.fish > 0">🐟 Fish: {{ inventory.fish }}</span>
        </div>
      </div>

      <!-- Station Interaction Prompt -->
      <div v-if="gameStarted && !gameOver && nearStation" class="interaction-prompt">
        <p>Press SPACE to {{ nearStation.action }}</p>
      </div>

      <!-- Game Canvas -->
      <canvas ref="gameCanvas" width="800" height="600"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'

const router = useRouter()
const gameCanvas = ref<HTMLCanvasElement>()
const gameContainer = ref<HTMLDivElement>()

const gameStarted = ref(false)
const gameOver = ref(false)
const timeLeft = ref(180) // 3 minutes = 180 seconds
const ordersCompleted = ref(0)
const coins = ref(0)
const highScore = ref(0)

let ctx: CanvasRenderingContext2D
let animationId: number
let timerInterval: number

// Player
const player = {
  x: 400,
  y: 500,
  size: 25,
  speed: 5,
  color: '#ffffff'
}

// Controls
const keys: Record<string, boolean> = {}

// Inventory
const inventory = ref({
  rice: 0,
  nori: 0,
  fish: 0
})

// Stations
interface Station {
  x: number
  y: number
  width: number
  height: number
  name: string
  color: string
  icon: string
  action: string
  type: string
}

const stations: Station[] = [
  { x: 50, y: 100, width: 120, height: 100, name: 'Rice Station', color: '#f0f0f0', icon: '🍚', action: 'Get Rice', type: 'rice' },
  { x: 200, y: 100, width: 120, height: 100, name: 'Nori Station', color: '#2d5016', icon: '🌿', action: 'Get Nori', type: 'nori' },
  { x: 350, y: 100, width: 120, height: 100, name: 'Fish Station', color: '#4a90e2', icon: '🐟', action: 'Get Fish', type: 'fish' },
  { x: 500, y: 100, width: 120, height: 100, name: 'Assembly Station', color: '#8b4513', icon: '🔧', action: 'Make Sushi', type: 'assembly' },
  { x: 650, y: 100, width: 120, height: 100, name: 'Delivery Station', color: '#ffd700', icon: '📦', action: 'Deliver Order', type: 'delivery' }
]

const nearStation = ref<Station | null>(null)

// Orders
interface OrderItem {
  name: string
  icon: string
  type: string
}

interface Order {
  id: number
  items: OrderItem[]
  reward: number
}

const currentOrder = ref<Order | null>(null)
const orderQueue: Order[] = []

// Predefined orders
const orderTemplates = [
  { items: [{ name: 'Rice', icon: '🍚', type: 'rice' }], reward: 10 },
  { items: [{ name: 'Nori', icon: '🌿', type: 'nori' }], reward: 10 },
  { items: [{ name: 'Rice', icon: '🍚', type: 'rice' }, { name: 'Nori', icon: '🌿', type: 'nori' }], reward: 25 },
  { items: [{ name: 'Fish', icon: '🐟', type: 'fish' }], reward: 15 },
  { items: [{ name: 'Rice', icon: '🍚', type: 'rice' }, { name: 'Fish', icon: '🐟', type: 'fish' }], reward: 30 },
  { items: [{ name: 'Nori', icon: '🌿', type: 'nori' }, { name: 'Fish', icon: '🐟', type: 'fish' }], reward: 30 },
  { items: [{ name: 'Rice', icon: '🍚', type: 'rice' }, { name: 'Nori', icon: '🌿', type: 'nori' }, { name: 'Fish', icon: '🐟', type: 'fish' }], reward: 50 }
]

let orderId = 0

const goBack = () => {
  router.push('/')
}

const loadHighScore = () => {
  const saved = localStorage.getItem('scaryShushiHighScore')
  if (saved) {
    highScore.value = parseInt(saved)
  }
}

const saveHighScore = () => {
  if (ordersCompleted.value > highScore.value) {
    highScore.value = ordersCompleted.value
    localStorage.setItem('scaryShushiHighScore', highScore.value.toString())
  }
}

const generateOrder = (): Order => {
  // For the first 3 orders, use specific templates
  if (ordersCompleted.value === 0) {
    // First order: just rice
    return {
      id: orderId++,
      items: [{ name: 'Rice', icon: '🍚', type: 'rice' }],
      reward: 10
    }
  } else if (ordersCompleted.value === 1) {
    // Second order: just nori
    return {
      id: orderId++,
      items: [{ name: 'Nori', icon: '🌿', type: 'nori' }],
      reward: 10
    }
  } else if (ordersCompleted.value === 2) {
    // Third order: rice and nori
    return {
      id: orderId++,
      items: [
        { name: 'Rice', icon: '🍚', type: 'rice' },
        { name: 'Nori', icon: '🌿', type: 'nori' }
      ],
      reward: 25
    }
  } else {
    // After that, random orders
    const template = orderTemplates[Math.floor(Math.random() * orderTemplates.length)]
    return {
      id: orderId++,
      items: [...template.items],
      reward: template.reward
    }
  }
}

const startGame = () => {
  gameStarted.value = true
  gameOver.value = false
  timeLeft.value = 180
  ordersCompleted.value = 0
  coins.value = 0
  inventory.value = { rice: 0, nori: 0, fish: 0 }

  // Reset player position
  player.x = 400
  player.y = 500

  // Generate first order
  currentOrder.value = generateOrder()

  // Start timer
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)

  animate()
}

const restartGame = () => {
  clearInterval(timerInterval)
  startGame()
}

const endGame = () => {
  gameOver.value = true
  gameStarted.value = false
  clearInterval(timerInterval)
  cancelAnimationFrame(animationId)

  // Add coins to global state
  gameState.addCoins(coins.value)

  saveHighScore()
}

const handleKeyDown = (e: KeyboardEvent) => {
  keys[e.key.toLowerCase()] = true

  // Space bar for interaction
  if (e.key === ' ' && nearStation.value) {
    e.preventDefault()
    interactWithStation(nearStation.value)
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  keys[e.key.toLowerCase()] = false
}

const interactWithStation = (station: Station) => {
  if (station.type === 'rice') {
    inventory.value.rice++
  } else if (station.type === 'nori') {
    inventory.value.nori++
  } else if (station.type === 'fish') {
    inventory.value.fish++
  } else if (station.type === 'assembly') {
    // Assembly station doesn't do anything in this simplified version
    // Items are collected directly from ingredient stations
  } else if (station.type === 'delivery') {
    // Check if player has all required items
    if (currentOrder.value) {
      const requiredRice = currentOrder.value.items.filter(item => item.type === 'rice').length
      const requiredNori = currentOrder.value.items.filter(item => item.type === 'nori').length
      const requiredFish = currentOrder.value.items.filter(item => item.type === 'fish').length

      if (
        inventory.value.rice >= requiredRice &&
        inventory.value.nori >= requiredNori &&
        inventory.value.fish >= requiredFish
      ) {
        // Deliver order
        inventory.value.rice -= requiredRice
        inventory.value.nori -= requiredNori
        inventory.value.fish -= requiredFish

        coins.value += currentOrder.value.reward
        ordersCompleted.value++

        // Generate next order
        currentOrder.value = generateOrder()
      }
    }
  }
}

const updatePlayer = () => {
  // Movement
  if (keys['w'] || keys['arrowup']) {
    player.y = Math.max(player.size, player.y - player.speed)
  }
  if (keys['s'] || keys['arrowdown']) {
    player.y = Math.min(600 - player.size, player.y + player.speed)
  }
  if (keys['a'] || keys['arrowleft']) {
    player.x = Math.max(player.size, player.x - player.speed)
  }
  if (keys['d'] || keys['arrowright']) {
    player.x = Math.min(800 - player.size, player.x + player.speed)
  }

  // Check if near any station
  nearStation.value = null
  for (const station of stations) {
    const distanceX = Math.abs(player.x - (station.x + station.width / 2))
    const distanceY = Math.abs(player.y - (station.y + station.height / 2))

    if (distanceX < station.width / 2 + 50 && distanceY < station.height / 2 + 50) {
      nearStation.value = station
      break
    }
  }
}

const draw = () => {
  if (!ctx) return

  // Clear canvas
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, 800, 600)

  // Draw grid floor
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let i = 0; i < 800; i += 40) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 600)
    ctx.stroke()
  }
  for (let i = 0; i < 600; i += 40) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(800, i)
    ctx.stroke()
  }

  // Draw stations
  ctx.font = '40px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  stations.forEach(station => {
    // Station background
    ctx.fillStyle = station.color
    ctx.fillRect(station.x, station.y, station.width, station.height)

    // Station border
    ctx.strokeStyle = nearStation.value === station ? '#ffff00' : '#ffffff'
    ctx.lineWidth = nearStation.value === station ? 4 : 2
    ctx.strokeRect(station.x, station.y, station.width, station.height)

    // Station icon
    ctx.fillText(station.icon, station.x + station.width / 2, station.y + station.height / 2 - 10)

    // Station name
    ctx.font = '12px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(station.name, station.x + station.width / 2, station.y + station.height + 15)
    ctx.font = '40px Arial'
  })

  // Draw player
  ctx.fillStyle = player.color
  ctx.beginPath()
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2)
  ctx.fill()

  // Draw player face
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(player.x - 8, player.y - 5, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(player.x + 8, player.y - 5, 3, 0, Math.PI * 2)
  ctx.fill()

  // Draw smile
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(player.x, player.y + 5, 10, 0, Math.PI)
  ctx.stroke()

  // Draw chef hat
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(player.x - 15, player.y - 25, 30, 10)
  ctx.beginPath()
  ctx.arc(player.x, player.y - 25, 12, 0, Math.PI * 2)
  ctx.fill()
}

const animate = () => {
  if (gameOver.value) return

  updatePlayer()
  draw()

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (gameCanvas.value) {
    ctx = gameCanvas.value.getContext('2d')!
    loadHighScore()
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  clearInterval(timerInterval)
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  position: relative;
  width: 800px;
  height: 600px;
  border: 3px solid #4ade80;
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
  background: #1a1a1a;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #ef4444;
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
  background: #dc2626;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.95);
  padding: 30px 40px;
  border-radius: 20px;
  border: 3px solid #4ade80;
  z-index: 10;
  max-height: 90%;
  overflow-y: auto;
}

.start-screen h1 {
  color: #4ade80;
  font-size: 42px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(74, 222, 128, 0.5);
}

.subtitle {
  color: #a7f3d0;
  font-size: 20px;
  margin-bottom: 20px;
  font-style: italic;
}

.instructions {
  color: white;
  font-size: 16px;
  margin: 8px 0;
}

.stations-info {
  background: rgba(74, 222, 128, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  border: 2px solid #4ade80;
}

.stations-info h3 {
  color: #4ade80;
  font-size: 18px;
  margin-bottom: 10px;
}

.stations-info p {
  color: white;
  font-size: 14px;
  margin: 5px 0;
  text-align: left;
}

.start-button {
  margin-top: 20px;
  padding: 15px 40px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
  border: 3px solid white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 22px;
  font-weight: bold;
  transition: all 0.3s;
  text-transform: uppercase;
}

.start-button:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.8);
}

.game-over-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.95);
  padding: 40px;
  border-radius: 20px;
  border: 3px solid #4ade80;
  z-index: 10;
}

.game-over-screen h1 {
  color: #4ade80;
  font-size: 38px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(74, 222, 128, 0.5);
}

.score-text {
  color: white;
  font-size: 24px;
  margin: 15px 0;
}

.coins-text {
  color: #ffd700;
  font-size: 22px;
  margin: 10px 0;
}

.high-score-text {
  color: #ffd700;
  font-size: 18px;
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
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
}

.hud-item {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  border: 2px solid #4ade80;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  min-width: 120px;
}

.timer {
  font-size: 20px;
  border-color: #4ade80;
}

.timer.warning {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.3);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.current-order {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.9);
  padding: 15px 20px;
  border-radius: 10px;
  border: 3px solid #ffd700;
  z-index: 5;
  max-width: 300px;
}

.current-order h3 {
  color: #ffd700;
  font-size: 18px;
  margin: 0 0 10px 0;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.order-item {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.inventory {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 18px;
  border-radius: 10px;
  border: 2px solid #4ade80;
  z-index: 5;
}

.inventory h4 {
  color: #4ade80;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.inventory-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.inventory-items span {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.interaction-prompt {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(74, 222, 128, 0.9);
  padding: 12px 25px;
  border-radius: 8px;
  border: 2px solid white;
  z-index: 5;
  animation: bounce 0.5s infinite alternate;
}

.interaction-prompt p {
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes bounce {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-5px); }
}
</style>
