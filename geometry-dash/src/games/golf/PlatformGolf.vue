<template>
  <div class="golf-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">⛳</div>
        <h1 class="menu-title">Platform Golf</h1>
        <p class="menu-sub">9 holes of crazy golf!</p>
        <div class="best-score" v-if="bestTotal > 0">🏆 Best: {{ bestTotal }} strokes</div>
        <button class="play-btn" @click="startGame">⛳ Tee Off!</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- HUD -->
      <div class="hud">
        <div class="hud-hole">Hole {{ currentHole + 1 }}/9</div>
        <div class="hud-par">Par {{ holes[currentHole]?.par }}</div>
        <div class="hud-strokes">Strokes: {{ strokes }}</div>
        <div class="hud-total">Total: {{ totalStrokes }}</div>
        <div class="hud-powerup" v-if="activePowerup">{{ activePowerup.icon }} {{ activePowerup.name }}</div>
      </div>

      <!-- Power indicator -->
      <div v-if="isAiming" class="power-hud">
        <div class="power-bar-h">
          <div class="power-fill-h" :style="{ width: shotPower + '%' }"></div>
        </div>
        <div class="power-label">{{ Math.round(shotPower) }}%</div>
      </div>

      <!-- Hole complete -->
      <div v-if="holeComplete" class="hole-overlay">
        <div class="hole-card">
          <h2>{{ getScoreName() }}</h2>
          <div class="hole-score">{{ strokes }} strokes (Par {{ holes[currentHole]?.par }})</div>
          <button class="next-btn" @click="nextHole">{{ currentHole < 8 ? 'Next Hole →' : 'See Results' }}</button>
        </div>
      </div>

      <!-- Game complete -->
      <div v-if="gameComplete" class="hole-overlay">
        <div class="hole-card results">
          <h2>⛳ Round Complete!</h2>
          <div class="scorecard">
            <div class="sc-row header">
              <span>Hole</span><span>Par</span><span>Score</span>
            </div>
            <div v-for="(s, i) in scorecard" :key="i" class="sc-row" :class="getScoreClass(s.strokes, s.par)">
              <span>{{ i + 1 }}</span><span>{{ s.par }}</span><span>{{ s.strokes }}</span>
            </div>
            <div class="sc-row total">
              <span>Total</span><span>{{ totalPar }}</span><span>{{ totalStrokes }}</span>
            </div>
          </div>
          <div class="final-score">
            {{ totalStrokes - totalPar > 0 ? '+' : '' }}{{ totalStrokes - totalPar }} ({{ totalStrokes }} strokes)
          </div>
          <div class="new-best" v-if="isNewBest">🏆 NEW BEST SCORE!</div>
          <button class="next-btn" @click="startGame">Play Again</button>
          <button class="back-link" @click="screen = 'menu'">Menu</button>
        </div>
      </div>

      <!-- Controls hint -->
      <div class="controls-hint" v-if="showHint">
        Click ball → drag to aim → release to shoot. Arrow keys to nudge camera.
      </div>

      <!-- Mobile shoot button -->
      <div class="mobile-shoot">
        <button class="ms-btn" v-if="!isAiming && !ballMoving && !holeComplete && !gameComplete" @click="startAimMobile">🏌️ Aim</button>
        <button class="ms-btn fire" v-if="isAiming" @click="releaseShotMobile">🏌️ SHOOT!</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const screen = ref<'menu' | 'game'>('menu')
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const currentHole = ref(0)
const strokes = ref(0)
const totalStrokes = ref(0)
const shotPower = ref(0)
const isAiming = ref(false)
const ballMoving = ref(false)
const holeComplete = ref(false)
const gameComplete = ref(false)
const showHint = ref(true)
const bestTotal = ref(0)
const isNewBest = ref(false)

let ctx: CanvasRenderingContext2D
let canvasW = 800
let canvasH = 500
let animFrame: number
let cameraX = 0

// Ball
let ballX = 0, ballY = 0, ballVX = 0, ballVY = 0
const BALL_R = 6
const GRAVITY = 0.35
const FRICTION = 0.985
const BOUNCE = 0.6
const SAND_FRICTION = 0.95
const WATER_SINK = 0.02

// Aim
let aimStartX = 0, aimStartY = 0, aimEndX = 0, aimEndY = 0
let powerTimer: number | null = null

// Powerups
interface Powerup { id: string; name: string; icon: string; x: number; y: number; collected: boolean; effect: string }
const activePowerup = ref<Powerup | null>(null)

// Scorecard
const scorecard = ref<{ par: number; strokes: number }[]>([])
const totalPar = computed(() => holes.reduce((s, h) => s + h.par, 0))

// Holes
interface Platform { x: number; y: number; w: number; h: number; type: 'grass' | 'sand' | 'ice' | 'bounce' }
interface Water { x: number; y: number; w: number; h: number }
interface Wind { x: number; y: number; w: number; h: number; force: number }
interface Hole {
  par: number; startX: number; startY: number; holeX: number; holeY: number
  platforms: Platform[]; waters: Water[]; winds: Wind[]; powerups: Powerup[]; width: number
}

const holes: Hole[] = [
  // Hole 1 - Simple flat
  {
    par: 2, startX: 80, startY: 350, holeX: 650, holeY: 350, width: 800,
    platforms: [
      { x: 0, y: 370, w: 800, h: 30, type: 'grass' },
    ],
    waters: [], winds: [], powerups: [],
  },
  // Hole 2 - Small hill
  {
    par: 3, startX: 60, startY: 320, holeX: 700, holeY: 280, width: 800,
    platforms: [
      { x: 0, y: 340, w: 350, h: 30, type: 'grass' },
      { x: 350, y: 300, w: 200, h: 70, type: 'grass' },
      { x: 550, y: 300, w: 250, h: 30, type: 'grass' },
    ],
    waters: [], winds: [], powerups: [],
  },
  // Hole 3 - Sand trap
  {
    par: 3, startX: 60, startY: 300, holeX: 720, holeY: 340, width: 800,
    platforms: [
      { x: 0, y: 320, w: 250, h: 30, type: 'grass' },
      { x: 250, y: 360, w: 200, h: 30, type: 'sand' },
      { x: 450, y: 360, w: 350, h: 30, type: 'grass' },
    ],
    waters: [], winds: [],
    powerups: [{ id: 'power1', name: 'Power Shot', icon: '💪', x: 150, y: 290, collected: false, effect: 'power' }],
  },
  // Hole 4 - Water hazard
  {
    par: 3, startX: 60, startY: 280, holeX: 750, holeY: 330, width: 850,
    platforms: [
      { x: 0, y: 300, w: 200, h: 30, type: 'grass' },
      { x: 350, y: 350, w: 150, h: 30, type: 'grass' },
      { x: 600, y: 350, w: 250, h: 30, type: 'grass' },
    ],
    waters: [{ x: 200, y: 380, w: 150, h: 50 }],
    winds: [],
    powerups: [],
  },
  // Hole 5 - Bouncy platforms
  {
    par: 3, startX: 60, startY: 250, holeX: 700, holeY: 200, width: 800,
    platforms: [
      { x: 0, y: 270, w: 180, h: 30, type: 'grass' },
      { x: 250, y: 320, w: 120, h: 20, type: 'bounce' },
      { x: 450, y: 280, w: 120, h: 20, type: 'bounce' },
      { x: 600, y: 220, w: 200, h: 30, type: 'grass' },
    ],
    waters: [], winds: [],
    powerups: [{ id: 'magnet', name: 'Ball Magnet', icon: '🧲', x: 350, y: 290, collected: false, effect: 'magnet' }],
  },
  // Hole 6 - Wind tunnel
  {
    par: 4, startX: 60, startY: 300, holeX: 900, holeY: 300, width: 1000,
    platforms: [
      { x: 0, y: 320, w: 300, h: 30, type: 'grass' },
      { x: 400, y: 320, w: 200, h: 30, type: 'grass' },
      { x: 700, y: 320, w: 300, h: 30, type: 'grass' },
    ],
    waters: [],
    winds: [{ x: 300, y: 200, w: 100, h: 150, force: -0.15 }],
    powerups: [],
  },
  // Hole 7 - Ice and hills
  {
    par: 4, startX: 60, startY: 250, holeX: 850, holeY: 200, width: 950,
    platforms: [
      { x: 0, y: 270, w: 200, h: 30, type: 'grass' },
      { x: 250, y: 300, w: 150, h: 30, type: 'ice' },
      { x: 450, y: 260, w: 150, h: 30, type: 'grass' },
      { x: 650, y: 220, w: 150, h: 30, type: 'ice' },
      { x: 800, y: 220, w: 150, h: 30, type: 'grass' },
    ],
    waters: [{ x: 400, y: 330, w: 50, h: 80 }],
    winds: [],
    powerups: [{ id: 'sticky', name: 'Sticky Ball', icon: '🍯', x: 500, y: 230, collected: false, effect: 'sticky' }],
  },
  // Hole 8 - The Gauntlet
  {
    par: 5, startX: 60, startY: 200, holeX: 950, holeY: 350, width: 1050,
    platforms: [
      { x: 0, y: 220, w: 180, h: 30, type: 'grass' },
      { x: 230, y: 280, w: 120, h: 20, type: 'bounce' },
      { x: 400, y: 250, w: 100, h: 30, type: 'sand' },
      { x: 550, y: 300, w: 120, h: 30, type: 'ice' },
      { x: 720, y: 320, w: 100, h: 20, type: 'bounce' },
      { x: 870, y: 370, w: 180, h: 30, type: 'grass' },
    ],
    waters: [{ x: 180, y: 350, w: 50, h: 80 }, { x: 670, y: 380, w: 50, h: 50 }],
    winds: [{ x: 500, y: 180, w: 70, h: 120, force: 0.2 }],
    powerups: [{ id: 'super', name: 'Super Ball', icon: '⭐', x: 300, y: 250, collected: false, effect: 'super' }],
  },
  // Hole 9 - The Finale
  {
    par: 5, startX: 60, startY: 150, holeX: 1050, holeY: 350, width: 1150,
    platforms: [
      { x: 0, y: 170, w: 200, h: 30, type: 'grass' },
      { x: 250, y: 220, w: 100, h: 20, type: 'bounce' },
      { x: 400, y: 180, w: 80, h: 30, type: 'ice' },
      { x: 530, y: 250, w: 120, h: 30, type: 'sand' },
      { x: 700, y: 300, w: 100, h: 20, type: 'bounce' },
      { x: 850, y: 280, w: 80, h: 30, type: 'ice' },
      { x: 970, y: 370, w: 180, h: 30, type: 'grass' },
    ],
    waters: [{ x: 350, y: 300, w: 50, h: 100 }, { x: 650, y: 350, w: 50, h: 80 }, { x: 930, y: 400, w: 40, h: 40 }],
    winds: [{ x: 480, y: 150, w: 50, h: 100, force: -0.2 }, { x: 800, y: 200, w: 50, h: 100, force: 0.15 }],
    powerups: [
      { id: 'mega', name: 'Mega Power', icon: '🔥', x: 200, y: 140, collected: false, effect: 'power' },
      { id: 'mag2', name: 'Ball Magnet', icon: '🧲', x: 750, y: 270, collected: false, effect: 'magnet' },
    ],
  },
]

function startGame() {
  screen.value = 'game'
  currentHole.value = 0
  totalStrokes.value = 0
  scorecard.value = []
  gameComplete.value = false
  isNewBest.value = false
  showHint.value = true
  setTimeout(() => { showHint.value = false }, 4000)
  nextTick(() => { initCanvas(); loadHole() })
}

function initCanvas() {
  if (!gameCanvas.value) return
  const canvas = gameCanvas.value
  canvasW = 800; canvasH = 500
  canvas.width = canvasW; canvas.height = canvasH
  const maxW = Math.min(canvasW, window.innerWidth - 10)
  canvas.style.width = maxW + 'px'
  canvas.style.height = (canvasH * maxW / canvasW) + 'px'
  ctx = canvas.getContext('2d')!

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMoveCanvas)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMoveCanvas, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)

  window.addEventListener('keydown', onKeyDown)
  gameLoop()
}

function loadHole() {
  const hole = holes[currentHole.value]
  ballX = hole.startX; ballY = hole.startY
  ballVX = 0; ballVY = 0
  strokes.value = 0; holeComplete.value = false
  activePowerup.value = null
  cameraX = 0
  // Reset powerups
  for (const p of hole.powerups) p.collected = false
}

function getScoreName(): string {
  const diff = strokes.value - holes[currentHole.value].par
  if (strokes.value === 1) return '🦅 HOLE IN ONE!'
  if (diff <= -3) return '🦅 Albatross!'
  if (diff === -2) return '🦅 Eagle!'
  if (diff === -1) return '🐦 Birdie!'
  if (diff === 0) return '👍 Par'
  if (diff === 1) return '😐 Bogey'
  if (diff === 2) return '😬 Double Bogey'
  return '😅 +' + diff
}

function getScoreClass(s: number, p: number): string {
  const diff = s - p
  if (diff < 0) return 'under'
  if (diff === 0) return 'par-score'
  return 'over'
}

function nextHole() {
  scorecard.value.push({ par: holes[currentHole.value].par, strokes: strokes.value })
  totalStrokes.value += strokes.value

  if (currentHole.value < 8) {
    currentHole.value++
    loadHole()
  } else {
    gameComplete.value = true
    if (bestTotal.value === 0 || totalStrokes.value < bestTotal.value) {
      bestTotal.value = totalStrokes.value
      isNewBest.value = true
      localStorage.setItem('golfBest', totalStrokes.value.toString())
    }
  }
}

// ===== GAME LOOP =====
function gameLoop() {
  if (screen.value !== 'game') return
  animFrame = requestAnimationFrame(gameLoop)
  update()
  draw()
}

function update() {
  if (!ballMoving.value) return
  const hole = holes[currentHole.value]

  // Apply gravity
  ballVY += GRAVITY

  // Apply wind
  for (const w of hole.winds) {
    if (ballX >= w.x && ballX <= w.x + w.w && ballY >= w.y && ballY <= w.y + w.h) {
      ballVX += w.force
    }
  }

  // Move ball
  ballX += ballVX
  ballY += ballVY

  // Platform collision
  let onPlatform = false
  let platformType: string = 'grass'
  for (const p of hole.platforms) {
    if (ballX + BALL_R > p.x && ballX - BALL_R < p.x + p.w) {
      // Top collision
      if (ballY + BALL_R >= p.y && ballY + BALL_R <= p.y + 15 && ballVY > 0) {
        ballY = p.y - BALL_R
        if (p.type === 'bounce') {
          ballVY = -ballVY * 1.2
        } else {
          ballVY = -ballVY * BOUNCE
          if (Math.abs(ballVY) < 1) ballVY = 0
        }
        onPlatform = true
        platformType = p.type
      }
      // Bottom collision
      if (ballY - BALL_R <= p.y + p.h && ballY - BALL_R >= p.y + p.h - 10 && ballVY < 0) {
        ballY = p.y + p.h + BALL_R
        ballVY = -ballVY * 0.3
      }
      // Side collisions
      if (ballY > p.y && ballY < p.y + p.h) {
        if (ballX + BALL_R > p.x && ballX < p.x && ballVX > 0) {
          ballX = p.x - BALL_R; ballVX = -ballVX * 0.5
        }
        if (ballX - BALL_R < p.x + p.w && ballX > p.x + p.w && ballVX < 0) {
          ballX = p.x + p.w + BALL_R; ballVX = -ballVX * 0.5
        }
      }
    }
  }

  // Friction
  if (onPlatform || Math.abs(ballVY) < 0.5) {
    if (platformType === 'sand') ballVX *= SAND_FRICTION
    else if (platformType === 'ice') ballVX *= 0.998
    else if (activePowerup.value?.effect === 'sticky') ballVX *= 0.95
    else ballVX *= FRICTION
  }

  // Water hazard - reset ball
  for (const w of hole.waters) {
    if (ballX > w.x && ballX < w.x + w.w && ballY > w.y && ballY < w.y + w.h) {
      strokes.value++ // Penalty stroke
      ballX = hole.startX; ballY = hole.startY
      ballVX = 0; ballVY = 0
      ballMoving.value = false
      return
    }
  }

  // Powerup collection
  for (const p of hole.powerups) {
    if (p.collected) continue
    const dist = Math.sqrt((ballX - p.x) ** 2 + (ballY - p.y) ** 2)
    if (dist < 20) {
      p.collected = true
      activePowerup.value = p
    }
  }

  // Magnet effect (pull toward hole)
  if (activePowerup.value?.effect === 'magnet') {
    const dx = hole.holeX - ballX
    const dy = hole.holeY - ballY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 100) {
      ballVX += (dx / dist) * 0.08
      ballVY += (dy / dist) * 0.08
    }
  }

  // Ball out of bounds (fell off screen)
  if (ballY > canvasH + 50) {
    strokes.value++
    ballX = hole.startX; ballY = hole.startY
    ballVX = 0; ballVY = 0
    ballMoving.value = false
    return
  }

  // Ball in hole!
  const holeDist = Math.sqrt((ballX - hole.holeX) ** 2 + (ballY - hole.holeY) ** 2)
  if (holeDist < 15 && Math.abs(ballVX) < 3 && Math.abs(ballVY) < 3) {
    ballMoving.value = false
    holeComplete.value = true
    return
  }

  // Stop when slow enough
  if (onPlatform && Math.abs(ballVX) < 0.15 && Math.abs(ballVY) < 0.5) {
    ballVX = 0; ballVY = 0
    ballMoving.value = false
  }

  // Camera follow
  cameraX = Math.max(0, Math.min(hole.width - canvasW, ballX - canvasW / 3))
}

// ===== DRAWING =====
function draw() {
  if (!ctx) return
  const hole = holes[currentHole.value]
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, canvasH)
  sky.addColorStop(0, '#87CEEB')
  sky.addColorStop(0.6, '#b8dff0')
  sky.addColorStop(1, '#d4eaf7')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 200 + 50) - cameraX * 0.3) % (canvasW + 100) - 50
    ctx.beginPath()
    ctx.ellipse(cx, 60 + i * 15, 40, 18, 0, 0, Math.PI * 2)
    ctx.ellipse(cx + 25, 55 + i * 15, 30, 15, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.translate(-cameraX, 0)

  // Water
  for (const w of hole.waters) {
    const time = Date.now() * 0.003
    ctx.fillStyle = '#2563eb'
    ctx.globalAlpha = 0.6
    ctx.fillRect(w.x, w.y, w.w, w.h)
    // Waves
    ctx.fillStyle = '#3b82f6'
    for (let i = 0; i < w.w; i += 8) {
      ctx.fillRect(w.x + i, w.y + Math.sin(time + i * 0.3) * 3, 6, 3)
    }
    ctx.globalAlpha = 1
  }

  // Wind zones
  for (const w of hole.winds) {
    ctx.fillStyle = 'rgba(200,200,255,0.15)'
    ctx.fillRect(w.x, w.y, w.w, w.h)
    // Wind arrows
    ctx.fillStyle = 'rgba(150,150,255,0.4)'
    ctx.font = '16px Arial'
    const arrow = w.force > 0 ? '→' : '←'
    for (let wy = w.y + 20; wy < w.y + w.h; wy += 25) {
      ctx.fillText(arrow, w.x + w.w / 2 - 5, wy)
    }
  }

  // Platforms
  for (const p of hole.platforms) {
    if (p.type === 'grass') {
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(p.x, p.y, p.w, p.h)
      // Grass detail on top
      ctx.fillStyle = '#16a34a'
      for (let gx = p.x; gx < p.x + p.w; gx += 6) {
        ctx.fillRect(gx, p.y - 2, 3, 4)
      }
      // Dirt
      ctx.fillStyle = '#8B6914'
      ctx.fillRect(p.x, p.y + 8, p.w, p.h - 8)
    } else if (p.type === 'sand') {
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(p.x, p.y, p.w, p.h)
      // Sand dots
      ctx.fillStyle = '#f59e0b'
      for (let sx = p.x + 5; sx < p.x + p.w; sx += 10) {
        for (let sy = p.y + 5; sy < p.y + p.h; sy += 8) {
          ctx.fillRect(sx, sy, 2, 2)
        }
      }
    } else if (p.type === 'ice') {
      ctx.fillStyle = '#bae6fd'
      ctx.fillRect(p.x, p.y, p.w, p.h)
      // Ice shine
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillRect(p.x + 5, p.y + 2, p.w - 10, 4)
    } else if (p.type === 'bounce') {
      ctx.fillStyle = '#ec4899'
      ctx.fillRect(p.x, p.y, p.w, p.h)
      // Bounce arrows
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      for (let bx = p.x + 15; bx < p.x + p.w; bx += 25) {
        ctx.fillText('↑', bx, p.y + 14)
      }
    }
  }

  // Powerups
  for (const p of hole.powerups) {
    if (p.collected) continue
    const bob = Math.sin(Date.now() * 0.005) * 4
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.icon, p.x, p.y + bob)
    // Glow
    ctx.fillStyle = 'rgba(251,191,36,0.2)'
    ctx.beginPath()
    ctx.arc(p.x, p.y + bob - 5, 15, 0, Math.PI * 2)
    ctx.fill()
  }

  // Hole (flag)
  ctx.fillStyle = '#333'
  ctx.fillRect(hole.holeX, hole.holeY - 30, 2, 30)
  // Flag
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.moveTo(hole.holeX + 2, hole.holeY - 30)
  ctx.lineTo(hole.holeX + 20, hole.holeY - 22)
  ctx.lineTo(hole.holeX + 2, hole.holeY - 14)
  ctx.fill()
  // Hole cup
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.ellipse(hole.holeX, hole.holeY, 12, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Aim line
  if (isAiming.value) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(ballX, ballY)
    // Direction is OPPOSITE of drag
    const dx = aimStartX - aimEndX
    const dy = aimStartY - aimEndY
    const power = shotPower.value / 100
    ctx.lineTo(ballX + dx * power * 2, ballY + dy * power * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Ball
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(ballX, ballY + BALL_R + 2, BALL_R, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ball glow if powerup
  if (activePowerup.value) {
    ctx.fillStyle = 'rgba(251,191,36,0.3)'
    ctx.beginPath()
    ctx.arc(ballX, ballY, BALL_R + 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ball
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.stroke()
  // Dimple
  ctx.fillStyle = '#ddd'
  ctx.beginPath()
  ctx.arc(ballX - 1, ballY - 1, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  // Hole label
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(hole.platforms.some(p => p.type === 'sand') ? '🏖️ Sand Trap!' :
    hole.platforms.some(p => p.type === 'ice') ? '🧊 Icy!' :
    hole.platforms.some(p => p.type === 'bounce') ? '🦘 Bouncy!' :
    hole.winds.length > 0 ? '💨 Windy!' : '', 10, canvasH - 10)
}

// ===== INPUT =====
function getCanvasPos(clientX: number, clientY: number): [number, number] {
  if (!gameCanvas.value) return [0, 0]
  const rect = gameCanvas.value.getBoundingClientRect()
  const scaleX = canvasW / rect.width
  const scaleY = canvasH / rect.height
  return [(clientX - rect.left) * scaleX + cameraX, (clientY - rect.top) * scaleY]
}

function onMouseDown(e: MouseEvent) {
  if (ballMoving.value || holeComplete.value || gameComplete.value) return
  const [mx, my] = getCanvasPos(e.clientX, e.clientY)
  const dist = Math.sqrt((mx - ballX) ** 2 + (my - ballY) ** 2)
  if (dist < 30) {
    isAiming.value = true
    aimStartX = mx; aimStartY = my
    aimEndX = mx; aimEndY = my
    shotPower.value = 0
  }
}

function onMouseMoveCanvas(e: MouseEvent) {
  if (!isAiming.value) return
  const [mx, my] = getCanvasPos(e.clientX, e.clientY)
  aimEndX = mx; aimEndY = my
  const dx = aimStartX - aimEndX
  const dy = aimStartY - aimEndY
  shotPower.value = Math.min(100, Math.sqrt(dx * dx + dy * dy) / 2)
}

function onMouseUp() {
  if (!isAiming.value) return
  shoot()
}

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const t = e.touches[0]
  onMouseDown({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
}

function onTouchMoveCanvas(e: TouchEvent) {
  e.preventDefault()
  const t = e.touches[0]
  onMouseMoveCanvas({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
}

function onTouchEnd() {
  if (isAiming.value) shoot()
}

function startAimMobile() {
  if (ballMoving.value) return
  isAiming.value = true
  aimStartX = ballX; aimStartY = ballY
  aimEndX = ballX - 50; aimEndY = ballY - 30
  shotPower.value = 0
  powerTimer = setInterval(() => {
    shotPower.value = Math.min(100, shotPower.value + 1.5)
  }, 30) as unknown as number
}

function releaseShotMobile() {
  if (powerTimer) clearInterval(powerTimer)
  aimEndX = ballX - 80; aimEndY = ballY - 40
  shoot()
}

function shoot() {
  isAiming.value = false
  if (shotPower.value < 5) return

  const dx = aimStartX - aimEndX
  const dy = aimStartY - aimEndY
  const power = (shotPower.value / 100) * (activePowerup.value?.effect === 'power' ? 18 : 12)

  const len = Math.sqrt(dx * dx + dy * dy)
  if (len > 0) {
    ballVX = (dx / len) * power
    ballVY = (dy / len) * power
  }

  if (activePowerup.value?.effect === 'super') {
    ballVX *= 1.5; ballVY *= 1.5
  }

  strokes.value++
  totalStrokes.value
  ballMoving.value = true
  shotPower.value = 0

  // Use up power powerup after shot
  if (activePowerup.value?.effect === 'power' || activePowerup.value?.effect === 'super') {
    activePowerup.value = null
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'ArrowLeft') cameraX = Math.max(0, cameraX - 20)
  if (e.code === 'ArrowRight') cameraX = Math.min(holes[currentHole.value].width - canvasW, cameraX + 20)
  if (e.code === 'KeyR' && !ballMoving.value && !holeComplete.value) {
    ballX = holes[currentHole.value].startX
    ballY = holes[currentHole.value].startY
    ballVX = 0; ballVY = 0
  }
}

onMounted(() => {
  bestTotal.value = parseInt(localStorage.getItem('golfBest') || '0')
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Platform Golf')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Platform Golf')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
  if (animFrame) cancelAnimationFrame(animFrame)
  if (powerTimer) clearInterval(powerTimer)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.golf-app { font-family: 'Segoe UI', system-ui, sans-serif; }

.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #065f46, #047857, #10b981);
}
.menu-card {
  background: rgba(0,40,20,0.9); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4); border: 2px solid #22c55e; max-width: 380px; width: 90%;
}
.menu-icon { font-size: 72px; }
.menu-title { color: #22c55e; font-size: 36px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #86efac; font-size: 16px; margin: 0 0 16px; }
.best-score { color: #fbbf24; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.play-btn {
  padding: 14px 48px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff;
  font-size: 20px; font-weight: 900; cursor: pointer;
}
.play-btn:hover { transform: scale(1.05); }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #6b7280; font-size: 13px; cursor: pointer; }

.game-screen {
  min-height: 100vh; background: #111; display: flex; flex-direction: column;
  align-items: center; justify-content: center; position: relative;
}
.game-canvas { border: 2px solid #22c55e; border-radius: 8px; display: block; cursor: crosshair; }

.hud {
  position: fixed; top: 8px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 10px; z-index: 10; flex-wrap: wrap;
}
.hud > div {
  background: rgba(0,0,0,0.7); color: #fff; padding: 5px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 700; backdrop-filter: blur(4px);
}
.hud-powerup { color: #fbbf24; }

.power-hud {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  z-index: 10; text-align: center;
}
.power-bar-h { width: 200px; height: 14px; background: #333; border-radius: 7px; overflow: hidden; }
.power-fill-h { height: 100%; background: linear-gradient(90deg, #22c55e, #fbbf24, #ef4444); border-radius: 7px; transition: width 0.05s; }
.power-label { color: #fff; font-size: 12px; font-weight: 700; margin-top: 2px; }

.hole-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 20;
}
.hole-card {
  background: #111827; border-radius: 20px; padding: 28px; text-align: center;
  border: 3px solid #22c55e; max-width: 400px; width: 90%;
  animation: pop-in 0.4s ease-out;
}
.hole-card.results { border-color: #fbbf24; }
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.hole-card h2 { color: #fff; font-size: 26px; margin: 0 0 8px; }
.hole-score { color: #94a3b8; font-size: 16px; margin-bottom: 16px; }
.next-btn {
  padding: 10px 30px; border-radius: 10px; border: none; background: #22c55e;
  color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
}

.scorecard { margin-bottom: 16px; }
.sc-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 4px 12px;
  font-size: 14px; color: #94a3b8;
}
.sc-row.header { font-weight: 800; color: #fff; border-bottom: 1px solid #333; padding-bottom: 6px; }
.sc-row.total { font-weight: 800; color: #fbbf24; border-top: 1px solid #333; padding-top: 6px; }
.sc-row.under { color: #22c55e; }
.sc-row.par-score { color: #fff; }
.sc-row.over { color: #ef4444; }
.final-score { color: #fbbf24; font-size: 22px; font-weight: 900; margin-bottom: 8px; }
.new-best { color: #fbbf24; font-size: 16px; font-weight: 700; animation: glow 1s ease-in-out infinite alternate; }
@keyframes glow { from { text-shadow: 0 0 5px #fbbf24; } to { text-shadow: 0 0 20px #fbbf24; } }

.controls-hint {
  position: fixed; bottom: 8px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); color: #94a3b8; padding: 6px 14px; border-radius: 6px;
  font-size: 11px; z-index: 10;
}

.mobile-shoot {
  display: none; position: fixed; bottom: 16px; right: 16px; z-index: 10;
}
.ms-btn {
  padding: 14px 24px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.3);
  background: rgba(34,197,94,0.4); color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;
}
.ms-btn.fire { background: rgba(239,68,68,0.6); border-color: rgba(239,68,68,0.5); }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-shoot { display: block; }
}
</style>
