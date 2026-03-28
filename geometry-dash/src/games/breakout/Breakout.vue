<template>
  <div class="breakout-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🧱</div>
        <h1 class="menu-title">Super Breakout</h1>
        <p class="menu-sub">Smash all the bricks!</p>
        <div class="high-score" v-if="highScore > 0">🏆 High Score: {{ highScore.toLocaleString() }}</div>
        <div class="mode-buttons">
          <button class="mode-btn" @click="startGame('classic')">
            <span class="mode-name">Classic</span>
            <span class="mode-desc">Single ball, pure skill</span>
          </button>
          <button class="mode-btn" @click="startGame('double')">
            <span class="mode-name">Double</span>
            <span class="mode-desc">Two balls at once!</span>
          </button>
          <button class="mode-btn" @click="startGame('cavity')">
            <span class="mode-name">Cavity</span>
            <span class="mode-desc">Balls hidden in the bricks</span>
          </button>
          <button class="mode-btn" @click="startGame('progressive')">
            <span class="mode-name">Progressive</span>
            <span class="mode-desc">Walls move down!</span>
          </button>
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- HUD -->
      <div class="hud">
        <div class="hud-item">Score: {{ score }}</div>
        <div class="hud-item">Level: {{ level }}</div>
        <div class="hud-item lives-hud">
          <span v-for="i in lives" :key="i">🟡</span>
        </div>
        <button class="hud-btn" @click="screen = 'menu'">Menu</button>
      </div>

      <!-- Paused / Start -->
      <div v-if="paused && !gameOver" class="pause-overlay" @click="unpause">
        <div class="pause-text">{{ ballLaunched ? 'PAUSED' : 'TAP TO LAUNCH' }}</div>
      </div>

      <!-- Game Over -->
      <div v-if="gameOver" class="gameover-overlay">
        <div class="gameover-card">
          <h2>{{ won ? '🎉 YOU WIN!' : 'GAME OVER' }}</h2>
          <div class="go-score">Score: {{ score.toLocaleString() }}</div>
          <div class="go-high" v-if="newHigh">🏆 NEW HIGH SCORE!</div>
          <div class="go-actions">
            <button class="go-btn play" @click="startGame(gameMode)">Play Again</button>
            <button class="go-btn menu" @click="screen = 'menu'">Menu</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

type GameMode = 'classic' | 'double' | 'cavity' | 'progressive'

const screen = ref<'menu' | 'game'>('menu')
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const highScore = ref(0)
const lives = ref(3)
const level = ref(1)
const paused = ref(true)
const gameOver = ref(false)
const won = ref(false)
const newHigh = ref(false)
const ballLaunched = ref(false)
const gameMode = ref<GameMode>('classic')

let ctx: CanvasRenderingContext2D
let animFrame: number
let canvasW = 0
let canvasH = 0

// Paddle
let paddleX = 0
let paddleW = 80
const PADDLE_H = 12
const PADDLE_Y_OFFSET = 30
let paddleSpeed = 0

// Balls
interface Ball {
  x: number; y: number; dx: number; dy: number; radius: number; active: boolean; speed: number
}
let balls: Ball[] = []

// Bricks
interface Brick {
  x: number; y: number; w: number; h: number; color: string; hits: number
  maxHits: number; points: number; hasBall?: boolean; active: boolean
}
let bricks: Brick[] = []

// Powerups
interface Powerup {
  x: number; y: number; type: string; dy: number; active: boolean; icon: string
}
let powerups: Powerup[] = []

// Progressive mode
let progressiveTimer = 0
const PROGRESSIVE_INTERVAL = 600 // frames between shifts

// Colors for brick rows
const ROW_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f43f5e',
]

const BRICK_POINTS = [7, 7, 5, 5, 3, 3, 1, 1, 1, 1]

function startGame(mode: GameMode) {
  gameMode.value = mode
  screen.value = 'game'
  score.value = 0
  lives.value = 3
  level.value = 1
  gameOver.value = false
  won.value = false
  newHigh.value = false
  paused.value = true
  ballLaunched.value = false
  powerups = []
  paddleW = 80

  nextTick(() => {
    initCanvas()
    buildLevel()
    resetBalls()
    gameLoop()
  })
}

function initCanvas() {
  if (!gameCanvas.value) return
  const canvas = gameCanvas.value
  canvasW = 480
  canvasH = 640
  canvas.width = canvasW
  canvas.height = canvasH

  const maxW = Math.min(480, window.innerWidth - 16)
  const scale = maxW / 480
  canvas.style.width = maxW + 'px'
  canvas.style.height = (640 * scale) + 'px'

  ctx = canvas.getContext('2d')!
  paddleX = canvasW / 2 - paddleW / 2
}

function buildLevel() {
  bricks = []
  const rows = Math.min(8 + level.value, 12)
  const cols = 10
  const brickW = (canvasW - 20) / cols
  const brickH = 18
  const topOffset = 60 + (gameMode.value === 'progressive' ? 0 : 0)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const maxHits = r < 2 && level.value > 2 ? 2 : 1
      const brick: Brick = {
        x: 10 + c * brickW,
        y: topOffset + r * (brickH + 3),
        w: brickW - 2,
        h: brickH,
        color: ROW_COLORS[r % ROW_COLORS.length],
        hits: 0,
        maxHits,
        points: (BRICK_POINTS[r] || 1) * 10 * level.value,
        active: true,
        hasBall: false,
      }

      // Cavity mode: hide balls in some bricks
      if (gameMode.value === 'cavity' && r >= 3 && r <= 5 && (c === 2 || c === 7)) {
        brick.hasBall = true
      }

      bricks.push(brick)
    }
  }

  progressiveTimer = 0
}

function resetBalls() {
  balls = []
  const mainBall: Ball = {
    x: canvasW / 2,
    y: canvasH - PADDLE_Y_OFFSET - PADDLE_H - 10,
    dx: 3 + level.value * 0.3,
    dy: -(3 + level.value * 0.3),
    radius: 6,
    active: true,
    speed: 3 + level.value * 0.3,
  }
  balls.push(mainBall)

  if (gameMode.value === 'double') {
    balls.push({
      ...mainBall,
      x: mainBall.x + 20,
      dx: -(3 + level.value * 0.3),
    })
  }

  ballLaunched.value = false
  paused.value = true
}

function unpause() {
  if (gameOver.value) return
  paused.value = false
  ballLaunched.value = true
}

// ========== GAME LOOP ==========
function gameLoop() {
  if (screen.value !== 'game') return
  animFrame = requestAnimationFrame(gameLoop)

  if (paused.value || gameOver.value) {
    draw()
    return
  }

  update()
  draw()
}

function update() {
  // Move paddle with keys/touch
  paddleX += paddleSpeed
  paddleX = Math.max(0, Math.min(canvasW - paddleW, paddleX))

  // Move balls
  for (const ball of balls) {
    if (!ball.active) continue

    // Stick to paddle before launch
    if (!ballLaunched.value) {
      ball.x = paddleX + paddleW / 2
      ball.y = canvasH - PADDLE_Y_OFFSET - PADDLE_H - ball.radius - 2
      continue
    }

    ball.x += ball.dx
    ball.y += ball.dy

    // Wall bounces
    if (ball.x - ball.radius <= 0) { ball.x = ball.radius; ball.dx = Math.abs(ball.dx) }
    if (ball.x + ball.radius >= canvasW) { ball.x = canvasW - ball.radius; ball.dx = -Math.abs(ball.dx) }
    if (ball.y - ball.radius <= 0) { ball.y = ball.radius; ball.dy = Math.abs(ball.dy) }

    // Paddle bounce
    const paddleY = canvasH - PADDLE_Y_OFFSET
    if (ball.dy > 0 && ball.y + ball.radius >= paddleY && ball.y + ball.radius <= paddleY + PADDLE_H + 4 &&
        ball.x >= paddleX - 4 && ball.x <= paddleX + paddleW + 4) {
      ball.dy = -Math.abs(ball.dy)
      // Angle based on where ball hits paddle
      const hitPos = (ball.x - paddleX) / paddleW // 0 to 1
      const angle = (hitPos - 0.5) * 2.5 // -1.25 to 1.25
      ball.dx = angle * ball.speed
      ball.dy = -Math.sqrt(ball.speed * ball.speed - ball.dx * ball.dx)
      if (Math.abs(ball.dy) < 1) ball.dy = -1
    }

    // Ball lost - check if below paddle area
    if (ball.y > canvasH - PADDLE_Y_OFFSET + 40 || ball.y > canvasH + 20) {
      ball.active = false
    }

    // Brick collision
    for (const brick of bricks) {
      if (!brick.active) continue

      if (ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brick.w &&
          ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brick.h) {

        // Determine bounce direction
        const overlapLeft = (ball.x + ball.radius) - brick.x
        const overlapRight = (brick.x + brick.w) - (ball.x - ball.radius)
        const overlapTop = (ball.y + ball.radius) - brick.y
        const overlapBottom = (brick.y + brick.h) - (ball.y - ball.radius)
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          ball.dy = -ball.dy
        } else {
          ball.dx = -ball.dx
        }

        brick.hits++
        if (brick.hits >= brick.maxHits) {
          brick.active = false
          score.value += brick.points

          // Release cavity ball
          if (brick.hasBall) {
            balls.push({
              x: brick.x + brick.w / 2,
              y: brick.y + brick.h,
              dx: (Math.random() - 0.5) * 4,
              dy: 3,
              radius: 6,
              active: true,
              speed: 3 + level.value * 0.3,
            })
          }

          // Random powerup drop (15% chance)
          if (Math.random() < 0.15) {
            spawnPowerup(brick.x + brick.w / 2, brick.y + brick.h)
          }
        }

        break // One brick per frame per ball
      }
    }
  }

  // Check if all balls lost - must happen every frame
  if (ballLaunched.value) {
    const anyActive = balls.some(b => b.active)
    if (!anyActive) {
      lives.value--
      if (lives.value <= 0) {
        endGame(false)
        return
      } else {
        resetBalls()
        return
      }
    }
  }

  // Check if all bricks cleared
  if (bricks.every(b => !b.active)) {
    level.value++
    if (level.value > 10) {
      endGame(true)
    } else {
      buildLevel()
      resetBalls()
    }
  }

  // Progressive mode: shift bricks down
  if (gameMode.value === 'progressive') {
    progressiveTimer++
    if (progressiveTimer >= PROGRESSIVE_INTERVAL) {
      progressiveTimer = 0
      for (const brick of bricks) {
        if (brick.active) {
          brick.y += 20
          // If bricks reach paddle, game over
          if (brick.y + brick.h >= canvasH - PADDLE_Y_OFFSET - 20) {
            endGame(false)
            return
          }
        }
      }
    }
  }

  // Update powerups
  for (const pu of powerups) {
    if (!pu.active) continue
    pu.y += pu.dy
    if (pu.y > canvasH) { pu.active = false; continue }

    // Catch powerup
    const paddleY = canvasH - PADDLE_Y_OFFSET
    if (pu.y >= paddleY && pu.y <= paddleY + PADDLE_H && pu.x >= paddleX && pu.x <= paddleX + paddleW) {
      pu.active = false
      applyPowerup(pu.type)
    }
  }
}

function spawnPowerup(x: number, y: number) {
  const types = [
    { type: 'wide', icon: '↔' },
    { type: 'multi', icon: '×3' },
    { type: 'slow', icon: '🐌' },
    { type: 'life', icon: '❤️' },
    { type: 'fire', icon: '🔥' },
  ]
  const t = types[Math.floor(Math.random() * types.length)]
  powerups.push({ x, y, type: t.type, dy: 2, active: true, icon: t.icon })
}

function applyPowerup(type: string) {
  if (type === 'wide') {
    paddleW = Math.min(160, paddleW + 30)
  } else if (type === 'multi') {
    const activeBalls = balls.filter(b => b.active)
    for (const ball of activeBalls) {
      balls.push({ ...ball, dx: ball.dx + 1, x: ball.x + 5 })
      balls.push({ ...ball, dx: ball.dx - 1, x: ball.x - 5 })
    }
  } else if (type === 'slow') {
    for (const ball of balls) {
      ball.dx *= 0.6
      ball.dy *= 0.6
      ball.speed *= 0.6
    }
  } else if (type === 'life') {
    lives.value++
  } else if (type === 'fire') {
    // Fire ball - goes through bricks for 5 seconds
    for (const ball of balls) {
      (ball as any).fire = true
    }
    setTimeout(() => {
      for (const ball of balls) {
        (ball as any).fire = false
      }
    }, 5000)
  }
  score.value += 50
}

function endGame(didWin: boolean) {
  gameOver.value = true
  won.value = didWin
  if (score.value > highScore.value) {
    highScore.value = score.value
    newHigh.value = true
    localStorage.setItem('breakoutHighScore', highScore.value.toString())
  }
}

// ========== DRAWING ==========
function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Background
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Stars background
  const starSeed = level.value * 100
  for (let i = 0; i < 40; i++) {
    const sx = ((starSeed + i * 73) * 13) % canvasW
    const sy = ((starSeed + i * 91) * 17) % canvasH
    ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 3) * 0.2})`
    ctx.fillRect(sx, sy, 1.5, 1.5)
  }

  // Draw bricks
  for (const brick of bricks) {
    if (!brick.active) continue

    // Main brick
    ctx.fillStyle = brick.color
    ctx.beginPath()
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3)
    ctx.fill()

    // Shine effect
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, brick.h / 3)

    // Multi-hit indicator
    if (brick.maxHits > 1 && brick.hits < brick.maxHits) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText((brick.maxHits - brick.hits).toString(), brick.x + brick.w / 2, brick.y + brick.h / 2 + 4)
    }

    // Cavity ball indicator
    if (brick.hasBall) {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(brick.x + brick.w / 2, brick.y + brick.h / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw paddle
  const paddleY = canvasH - PADDLE_Y_OFFSET
  const paddleGrad = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + PADDLE_H)
  paddleGrad.addColorStop(0, '#60a5fa')
  paddleGrad.addColorStop(1, '#3b82f6')
  ctx.fillStyle = paddleGrad
  ctx.beginPath()
  roundRect(ctx, paddleX, paddleY, paddleW, PADDLE_H, 6)
  ctx.fill()

  // Paddle shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(paddleX + 4, paddleY + 2, paddleW - 8, 3)

  // Draw balls
  for (const ball of balls) {
    if (!ball.active) continue

    const isFire = (ball as any).fire

    // Glow
    ctx.shadowColor = isFire ? '#f97316' : '#fbbf24'
    ctx.shadowBlur = 12

    ctx.fillStyle = isFire ? '#f97316' : '#fbbf24'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fill()

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0

    // Fire trail
    if (isFire) {
      ctx.fillStyle = 'rgba(249,115,22,0.3)'
      ctx.beginPath()
      ctx.arc(ball.x - ball.dx * 2, ball.y - ball.dy * 2, ball.radius * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw powerups
  for (const pu of powerups) {
    if (!pu.active) continue
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.beginPath()
    roundRect(ctx, pu.x - 14, pu.y - 10, 28, 20, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(pu.icon, pu.x, pu.y + 4)
  }

  // Progressive mode indicator
  if (gameMode.value === 'progressive') {
    const progress = progressiveTimer / PROGRESSIVE_INTERVAL
    ctx.fillStyle = 'rgba(239,68,68,0.3)'
    ctx.fillRect(0, canvasH - 4, canvasW * progress, 4)
  }

  // Level complete flash
  if (bricks.every(b => !b.active) && !gameOver.value) {
    ctx.fillStyle = 'rgba(34,197,94,0.2)'
    ctx.fillRect(0, 0, canvasW, canvasH)
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}

// ========== INPUT ==========
function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') paddleSpeed = -6
  if (e.code === 'ArrowRight' || e.code === 'KeyD') paddleSpeed = 6
  if (e.code === 'Space') {
    e.preventDefault()
    if (paused.value && !gameOver.value) unpause()
  }
}

function onKeyUp(e: KeyboardEvent) {
  if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && paddleSpeed < 0) paddleSpeed = 0
  if ((e.code === 'ArrowRight' || e.code === 'KeyD') && paddleSpeed > 0) paddleSpeed = 0
}

// Touch/mouse control
let touchActive = false
function onTouchStart(e: TouchEvent) {
  touchActive = true
  handleTouch(e.touches[0].clientX)
  if (paused.value && !gameOver.value) unpause()
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (touchActive) handleTouch(e.touches[0].clientX)
}

function onTouchEnd() {
  touchActive = false
  paddleSpeed = 0
}

function onMouseMove(e: MouseEvent) {
  if (!gameCanvas.value) return
  const rect = gameCanvas.value.getBoundingClientRect()
  const scaleX = canvasW / rect.width
  const mouseX = (e.clientX - rect.left) * scaleX
  paddleX = mouseX - paddleW / 2
  paddleX = Math.max(0, Math.min(canvasW - paddleW, paddleX))
}

function onMouseDown() {
  if (paused.value && !gameOver.value) unpause()
}

function handleTouch(clientX: number) {
  if (!gameCanvas.value) return
  const rect = gameCanvas.value.getBoundingClientRect()
  const scaleX = canvasW / rect.width
  const touchX = (clientX - rect.left) * scaleX
  paddleX = touchX - paddleW / 2
  paddleX = Math.max(0, Math.min(canvasW - paddleW, paddleX))
}

onMounted(() => {
  highScore.value = parseInt(localStorage.getItem('breakoutHighScore') || '0')
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('touchstart', onTouchStart, { passive: false })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
.breakout-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a0a1a, #1a1a3a, #0a1a2a);
}
.menu-card {
  background: #111827; border-radius: 24px; padding: 36px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 2px solid #1f2937; max-width: 400px; width: 90%;
}
.menu-icon { font-size: 64px; }
.menu-title { color: #60a5fa; font-size: 36px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #94a3b8; font-size: 16px; margin: 0 0 16px; }
.high-score {
  color: #fbbf24; font-size: 18px; font-weight: 700; margin-bottom: 16px;
  background: rgba(251,191,36,0.1); padding: 8px 16px; border-radius: 10px;
}

.mode-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.mode-btn {
  display: flex; flex-direction: column; gap: 2px; padding: 14px 12px; border-radius: 14px;
  border: 2px solid #1f2937; background: #0f172a; cursor: pointer; text-align: left;
  transition: all 0.15s;
}
.mode-btn:hover { border-color: #60a5fa; transform: translateY(-2px); }
.mode-name { font-size: 16px; font-weight: 800; color: #60a5fa; }
.mode-desc { font-size: 11px; color: #94a3b8; }
.back-link { display: block; margin-top: 12px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Game */
.game-screen {
  min-height: 100vh; background: #0a0a1a; display: flex; flex-direction: column;
  align-items: center; justify-content: center; position: relative;
}
.game-canvas { border: 2px solid #1f2937; border-radius: 8px; display: block; cursor: none; }

/* HUD */
.hud {
  position: fixed; top: 8px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 12px; z-index: 10;
}
.hud-item {
  background: rgba(0,0,0,0.7); color: #fff; padding: 5px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 700; backdrop-filter: blur(4px);
}
.lives-hud { display: flex; gap: 2px; }
.hud-btn {
  background: rgba(0,0,0,0.7); color: #94a3b8; border: none; padding: 5px 12px;
  border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
}

/* Pause */
.pause-overlay {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4); z-index: 15; cursor: pointer;
}
.pause-text {
  color: #fff; font-size: 28px; font-weight: 900; text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
  animation: pulse-text 1.5s ease-in-out infinite;
}
@keyframes pulse-text { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Game Over */
.gameover-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 20;
}
.gameover-card {
  background: #111827; border-radius: 24px; padding: 32px; text-align: center;
  border: 3px solid #3b82f6; max-width: 340px; width: 90%;
  animation: pop-in 0.4s ease-out;
}
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.gameover-card h2 { color: #fff; font-size: 28px; margin: 0 0 12px; }
.go-score { color: #60a5fa; font-size: 22px; font-weight: 800; margin-bottom: 8px; }
.go-high { color: #fbbf24; font-size: 16px; font-weight: 700; margin-bottom: 12px; animation: glow 1s ease-in-out infinite alternate; }
@keyframes glow { from { text-shadow: 0 0 5px #fbbf24; } to { text-shadow: 0 0 20px #fbbf24; } }
.go-actions { display: flex; gap: 10px; justify-content: center; }
.go-btn {
  padding: 10px 24px; border-radius: 12px; border: none; font-size: 15px; font-weight: 700; cursor: pointer;
}
.go-btn.play { background: #3b82f6; color: #fff; }
.go-btn.menu { background: #334155; color: #fff; }

/* Mobile */
@media (max-width: 500px) {
  .menu-card { padding: 24px 16px; }
  .menu-title { font-size: 28px; }
  .mode-buttons { grid-template-columns: 1fr 1fr; gap: 8px; }
  .hud { gap: 6px; }
  .hud-item { padding: 4px 8px; font-size: 11px; }
}
</style>
