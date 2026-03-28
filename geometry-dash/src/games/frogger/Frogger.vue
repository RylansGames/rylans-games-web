<template>
  <div class="frogger-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🐸</div>
        <h1 class="menu-title">Frogger</h1>
        <p class="menu-sub">Cross the road and river to get home!</p>
        <div class="highscore-display" v-if="highScore > 0">🏆 High Score: {{ highScore.toLocaleString() }}</div>
        <button class="play-btn" @click="startGame">Play</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- HUD -->
      <div class="hud">
        <div class="hud-score">Score: {{ score }}</div>
        <div class="hud-high">🏆 {{ highScore }}</div>
        <div class="hud-lives">
          <span v-for="i in lives" :key="i">🐸</span>
        </div>
        <div class="hud-level">Level {{ level }}</div>
      </div>

      <!-- Game Over -->
      <div v-if="gameOver" class="gameover-overlay">
        <div class="gameover-card">
          <h2 class="go-title">{{ newHighScore ? '🏆 NEW HIGH SCORE!' : 'GAME OVER' }}</h2>
          <div class="go-score">Score: {{ score.toLocaleString() }}</div>
          <div v-if="newHighScore" class="go-new">You beat your old record!</div>
          <div class="go-high">Best: {{ highScore.toLocaleString() }}</div>
          <button class="play-btn" @click="startGame">Play Again</button>
          <button class="back-link" @click="screen = 'menu'">Menu</button>
        </div>
      </div>

      <!-- Mobile Controls -->
      <div class="mobile-controls">
        <button class="m-btn m-up" @touchstart.prevent="move('up')">▲</button>
        <div class="m-mid">
          <button class="m-btn m-left" @touchstart.prevent="move('left')">◀</button>
          <button class="m-btn m-right" @touchstart.prevent="move('right')">▶</button>
        </div>
        <button class="m-btn m-down" @touchstart.prevent="move('down')">▼</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '../../firebase'
import { ref as dbRef, onValue, set, get } from 'firebase/database'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const screen = ref<'menu' | 'game'>('menu')
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const highScore = ref(0)
const lives = ref(3)
const level = ref(1)
const gameOver = ref(false)
const newHighScore = ref(false)

let ctx: CanvasRenderingContext2D
let animFrame: number
let canvasW = 0
let canvasH = 0

const COLS = 13
const TILE = 48
let frogX = 6
let frogY = 12
let frogMoving = false

interface Lane {
  y: number
  type: 'safe' | 'road' | 'water' | 'home'
  color: string
  objects: { x: number; w: number; speed: number; color: string; isLog?: boolean }[]
}

let lanes: Lane[] = []
let homeSlots: { x: number; filled: boolean }[] = []
let gameActive = false

function startGame() {
  screen.value = 'game'
  score.value = 0
  lives.value = 3
  level.value = 1
  gameOver.value = false
  newHighScore.value = false
  nextTick(() => initCanvas())
}

function initCanvas() {
  if (!gameCanvas.value) return
  const canvas = gameCanvas.value
  canvasW = COLS * TILE
  canvasH = 13 * TILE

  canvas.width = canvasW
  canvas.height = canvasH
  canvas.style.width = Math.min(canvasW, window.innerWidth - 20) + 'px'
  canvas.style.height = Math.min(canvasH, window.innerHeight - 120) + 'px'

  ctx = canvas.getContext('2d')!
  buildLevel()
  resetFrog()
  gameActive = true
  gameLoop()
}

function buildLevel() {
  const spd = 0.5 + level.value * 0.15
  lanes = []
  homeSlots = []

  // Row 0: Home (top)
  lanes.push({ y: 0, type: 'home', color: '#1a4d1a', objects: [] })
  homeSlots = [
    { x: 1, filled: false },
    { x: 4, filled: false },
    { x: 7, filled: false },
    { x: 10, filled: false },
  ]

  // Rows 1-5: Water (logs and turtles)
  lanes.push({ y: 1, type: 'water', color: '#1a3a8a', objects: [
    { x: 0, w: 3, speed: spd * 0.7, color: '#8B6914', isLog: true },
    { x: 6, w: 3, speed: spd * 0.7, color: '#8B6914', isLog: true },
  ]})
  lanes.push({ y: 2, type: 'water', color: '#1a3a8a', objects: [
    { x: 1, w: 2, speed: -spd * 0.9, color: '#2d6b2d', isLog: true },
    { x: 5, w: 2, speed: -spd * 0.9, color: '#2d6b2d', isLog: true },
    { x: 9, w: 2, speed: -spd * 0.9, color: '#2d6b2d', isLog: true },
  ]})
  lanes.push({ y: 3, type: 'water', color: '#1a3a8a', objects: [
    { x: 0, w: 4, speed: spd * 0.6, color: '#8B6914', isLog: true },
    { x: 7, w: 4, speed: spd * 0.6, color: '#8B6914', isLog: true },
  ]})
  lanes.push({ y: 4, type: 'water', color: '#1a3a8a', objects: [
    { x: 2, w: 2, speed: -spd * 1.1, color: '#2d6b2d', isLog: true },
    { x: 7, w: 2, speed: -spd * 1.1, color: '#2d6b2d', isLog: true },
    { x: 11, w: 2, speed: -spd * 1.1, color: '#2d6b2d', isLog: true },
  ]})
  lanes.push({ y: 5, type: 'water', color: '#1a3a8a', objects: [
    { x: 0, w: 3, speed: spd * 0.8, color: '#8B6914', isLog: true },
    { x: 5, w: 3, speed: spd * 0.8, color: '#8B6914', isLog: true },
    { x: 10, w: 3, speed: spd * 0.8, color: '#8B6914', isLog: true },
  ]})

  // Row 6: Safe middle
  lanes.push({ y: 6, type: 'safe', color: '#2d5a1e', objects: [] })

  // Rows 7-11: Roads (cars and trucks)
  lanes.push({ y: 7, type: 'road', color: '#333', objects: [
    { x: 2, w: 1, speed: -spd * 1, color: '#e53e3e' },
    { x: 6, w: 1, speed: -spd * 1, color: '#e53e3e' },
    { x: 10, w: 1, speed: -spd * 1, color: '#dd6b20' },
  ]})
  lanes.push({ y: 8, type: 'road', color: '#333', objects: [
    { x: 0, w: 2, speed: spd * 0.7, color: '#3182ce' },
    { x: 5, w: 2, speed: spd * 0.7, color: '#3182ce' },
    { x: 10, w: 2, speed: spd * 0.7, color: '#805ad5' },
  ]})
  lanes.push({ y: 9, type: 'road', color: '#333', objects: [
    { x: 1, w: 1, speed: -spd * 1.3, color: '#fbbf24' },
    { x: 4, w: 1, speed: -spd * 1.3, color: '#fbbf24' },
    { x: 8, w: 1, speed: -spd * 1.3, color: '#f97316' },
    { x: 11, w: 1, speed: -spd * 1.3, color: '#fbbf24' },
  ]})
  lanes.push({ y: 10, type: 'road', color: '#333', objects: [
    { x: 0, w: 2, speed: spd * 0.6, color: '#38a169' },
    { x: 6, w: 2, speed: spd * 0.6, color: '#38a169' },
  ]})
  lanes.push({ y: 11, type: 'road', color: '#333', objects: [
    { x: 3, w: 1, speed: -spd * 1.5, color: '#e53e3e' },
    { x: 7, w: 1, speed: -spd * 1.5, color: '#dd6b20' },
    { x: 11, w: 1, speed: -spd * 1.5, color: '#e53e3e' },
  ]})

  // Row 12: Start (bottom safe zone)
  lanes.push({ y: 12, type: 'safe', color: '#2d5a1e', objects: [] })
}

function resetFrog() {
  frogX = 6
  frogY = 12
  frogMoving = false
}

function move(dir: string) {
  if (!gameActive || gameOver.value || frogMoving) return
  frogMoving = true

  if (dir === 'up' && frogY > 0) frogY--
  else if (dir === 'down' && frogY < 12) frogY++
  else if (dir === 'left' && frogX > 0) frogX--
  else if (dir === 'right' && frogX < COLS - 1) frogX++

  // Score for moving forward
  if (dir === 'up') score.value += 10

  setTimeout(() => { frogMoving = false }, 100)
}

function gameLoop() {
  if (!gameActive) return
  animFrame = requestAnimationFrame(gameLoop)

  // Move objects
  for (const lane of lanes) {
    for (const obj of lane.objects) {
      obj.x += obj.speed * 0.02
      // Wrap around
      if (obj.speed > 0 && obj.x > COLS + 1) obj.x = -obj.w - 1
      if (obj.speed < 0 && obj.x + obj.w < -1) obj.x = COLS + 1
    }
  }

  // Check collisions
  checkCollisions()

  // Draw
  draw()
}

function checkCollisions() {
  const lane = lanes.find(l => l.y === frogY)
  if (!lane) return

  if (lane.type === 'road') {
    for (const obj of lane.objects) {
      if (frogX >= obj.x && frogX < obj.x + obj.w) {
        die()
        return
      }
    }
  }

  if (lane.type === 'water') {
    let onLog = false
    for (const obj of lane.objects) {
      if (frogX >= obj.x - 0.3 && frogX < obj.x + obj.w + 0.3) {
        onLog = true
        frogX += obj.speed * 0.02 // Ride the log
        break
      }
    }
    if (!onLog) {
      die()
      return
    }
    // Off screen on log
    if (frogX < -1 || frogX > COLS) {
      die()
      return
    }
  }

  if (lane.type === 'home') {
    let landed = false
    for (const slot of homeSlots) {
      if (Math.abs(frogX - slot.x) < 1.5 && !slot.filled) {
        slot.filled = true
        score.value += 200
        landed = true

        // Check if all homes filled
        if (homeSlots.every(s => s.filled)) {
          level.value++
          score.value += 1000
          buildLevel()
        }
        resetFrog()
        break
      }
    }
    if (!landed) {
      die()
    }
  }
}

function die() {
  lives.value--
  if (lives.value <= 0) {
    endGame()
  } else {
    resetFrog()
  }
}

function endGame() {
  gameActive = false
  gameOver.value = true
  if (score.value > highScore.value) {
    highScore.value = score.value
    newHighScore.value = true
    saveHighScore()
  }
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Draw lanes
  for (const lane of lanes) {
    ctx.fillStyle = lane.color
    ctx.fillRect(0, lane.y * TILE, canvasW, TILE)

    // Road markings
    if (lane.type === 'road') {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.moveTo(0, lane.y * TILE)
      ctx.lineTo(canvasW, lane.y * TILE)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw objects
    for (const obj of lane.objects) {
      ctx.fillStyle = obj.color
      const rx = obj.x * TILE
      const ry = lane.y * TILE + 4
      const rw = obj.w * TILE - 4
      const rh = TILE - 8

      // Rounded rect
      const rad = 6
      ctx.beginPath()
      ctx.moveTo(rx + rad, ry)
      ctx.lineTo(rx + rw - rad, ry)
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
      ctx.lineTo(rx + rw, ry + rh - rad)
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
      ctx.lineTo(rx + rad, ry + rh)
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
      ctx.lineTo(rx, ry + rad)
      ctx.quadraticCurveTo(rx, ry, rx + rad, ry)
      ctx.fill()

      // Car headlights
      if (!obj.isLog && obj.w === 1) {
        ctx.fillStyle = '#fde68a'
        ctx.fillRect(rx + (obj.speed < 0 ? 2 : rw - 6), ry + 6, 4, 4)
        ctx.fillRect(rx + (obj.speed < 0 ? 2 : rw - 6), ry + rh - 10, 4, 4)
      }

      // Log texture
      if (obj.isLog) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.lineWidth = 1
        for (let i = 0; i < obj.w; i++) {
          ctx.beginPath()
          ctx.arc(rx + i * TILE + TILE / 2, ry + rh / 2, 6, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }
  }

  // Draw home slots
  for (const slot of homeSlots) {
    if (slot.filled) {
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(slot.x * TILE + 4, 4, TILE - 8, TILE - 8)
      ctx.font = '28px serif'
      ctx.fillText('🐸', slot.x * TILE + 10, 36)
    } else {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'
      ctx.fillRect(slot.x * TILE + 4, 4, TILE - 8, TILE - 8)
    }
  }

  // Draw frog
  const fx = Math.round(frogX) * TILE
  const fy = frogY * TILE
  // Frog body
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.ellipse(fx + TILE / 2, fy + TILE / 2, 18, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  // Eyes
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(fx + 14, fy + 14, 6, 0, Math.PI * 2)
  ctx.arc(fx + 34, fy + 14, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(fx + 14, fy + 14, 3, 0, Math.PI * 2)
  ctx.arc(fx + 34, fy + 14, 3, 0, Math.PI * 2)
  ctx.fill()
}

// High score - Firebase global leaderboard
async function loadHighScore() {
  // Local high score
  const local = localStorage.getItem('froggerHighScore')
  if (local) highScore.value = parseInt(local)

  // Check global
  const snap = await get(dbRef(db, 'frogger/highscore'))
  const global = snap.val()
  if (global && global > highScore.value) {
    highScore.value = global
  }
}

function saveHighScore() {
  localStorage.setItem('froggerHighScore', highScore.value.toString())
  // Save to Firebase if it's the global best
  get(dbRef(db, 'frogger/highscore')).then(snap => {
    const current = snap.val() || 0
    if (highScore.value > current) {
      set(dbRef(db, 'frogger/highscore'), highScore.value)
    }
  })
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); move('up') }
  if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); move('down') }
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); move('left') }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); move('right') }
}

onMounted(() => {
  loadHighScore()
  window.addEventListener('keydown', onKeyDown)
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Frogger')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Frogger')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  gameActive = false
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.frogger-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a2a0a, #1a4d1a, #2d6b2d);
}
.menu-card {
  background: rgba(0,0,0,0.7); border-radius: 24px; padding: 44px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #22c55e; max-width: 380px; width: 90%;
}
.menu-icon { font-size: 80px; animation: frog-hop 1s ease-in-out infinite; }
@keyframes frog-hop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.menu-title { color: #22c55e; font-size: 42px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #86efac; font-size: 16px; margin: 0 0 20px; }
.highscore-display {
  color: #fbbf24; font-size: 20px; font-weight: 800; margin-bottom: 20px;
  background: rgba(251,191,36,0.1); padding: 8px 16px; border-radius: 10px;
}
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff; font-size: 20px; font-weight: 800; cursor: pointer;
  box-shadow: 0 4px 16px rgba(34,197,94,0.5); transition: transform 0.15s;
  display: inline-block;
}
.play-btn:hover { transform: translateY(-2px); }
.back-link { display: block; margin-top: 16px; background: none; border: none; color: #6b7280; font-size: 14px; cursor: pointer; }

/* Game */
.game-screen {
  min-height: 100vh; background: #0a0a0a;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative;
}
.game-canvas {
  border: 3px solid #22c55e; border-radius: 8px;
  image-rendering: pixelated;
}

/* HUD */
.hud {
  position: fixed; top: 12px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 16px; z-index: 10;
}
.hud-score, .hud-high, .hud-lives, .hud-level {
  background: rgba(0,0,0,0.7); color: #fff; padding: 6px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 700; backdrop-filter: blur(4px);
}
.hud-high { color: #fbbf24; }
.hud-level { color: #60a5fa; }

/* Game Over */
.gameover-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 20;
}
.gameover-card {
  background: #1a1a2e; border-radius: 24px; padding: 36px; text-align: center;
  border: 3px solid #22c55e; max-width: 360px; width: 90%;
  animation: pop-in 0.4s ease-out;
}
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.go-title { color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 12px; }
.go-score { color: #22c55e; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.go-new { color: #fbbf24; font-size: 16px; font-weight: 700; margin-bottom: 8px; animation: glow 1s ease-in-out infinite alternate; }
@keyframes glow { from { text-shadow: 0 0 5px #fbbf24; } to { text-shadow: 0 0 20px #fbbf24; } }
.go-high { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }

/* Mobile Controls */
.mobile-controls {
  display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  flex-direction: column; align-items: center; gap: 4px; z-index: 10;
}
.m-mid { display: flex; gap: 4px; }
.m-btn {
  width: 56px; height: 56px; border-radius: 12px;
  background: rgba(34,197,94,0.3); border: 2px solid rgba(34,197,94,0.5);
  color: #fff; font-size: 22px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.m-btn:active { background: rgba(34,197,94,0.6); }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: flex; }
}
</style>
