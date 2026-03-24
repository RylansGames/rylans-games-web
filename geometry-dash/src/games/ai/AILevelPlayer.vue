<template>
  <div class="player-container">
    <div class="player-header">
      <button class="back-btn" @click="$emit('back')">← Back</button>
      <span class="level-title">{{ level.name }}</span>
      <span class="level-author">by {{ level.author }}</span>
    </div>

    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas ref="canvas"></canvas>
      <div v-if="won" class="win-overlay">
        <div class="win-card">
          <h2>⭐ Level Complete! ⭐</h2>
          <p>You beat "{{ level.name }}"!</p>
          <p class="coins-earned">+5 coins!</p>
          <div class="win-buttons">
            <button class="win-btn replay" @click="resetPlayer">Play Again</button>
            <button class="win-btn back" @click="$emit('back')">Back</button>
          </div>
        </div>
      </div>
      <div v-if="dead" class="dead-overlay">
        <div class="dead-card">
          <h2>💀 Oops!</h2>
          <button class="win-btn replay" @click="resetPlayer">Try Again</button>
        </div>
      </div>
    </div>

    <!-- Touch controls -->
    <div class="touch-controls">
      <button
        class="touch-btn left"
        @touchstart.prevent="keys.left = true"
        @touchend.prevent="keys.left = false"
        @mousedown="keys.left = true"
        @mouseup="keys.left = false"
      >◀</button>
      <button
        class="touch-btn jump"
        @touchstart.prevent="tryJump()"
        @mousedown="tryJump()"
      >▲ Jump</button>
      <button
        class="touch-btn right"
        @touchstart.prevent="keys.right = true"
        @touchend.prevent="keys.right = false"
        @mousedown="keys.right = true"
        @mouseup="keys.right = false"
      >▶</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { BLOCK_TYPES } from './types'
import type { LevelData } from './types'
import { incrementPlays } from './levelStore'

const props = defineProps<{
  level: LevelData
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'won'): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasWrapper = ref<HTMLDivElement | null>(null)
const won = ref(false)
const dead = ref(false)

const keys = reactive({ left: false, right: false, up: false })

// Player state
let playerX = 0
let playerY = 0
let velX = 0
let velY = 0
let onGround = false
let animFrame = 0

// Grid lookup
const blockGrid = new Map<string, string>()

const TILE_SIZE = 40
const PLAYER_SIZE = 32
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 5
const FRICTION = 0.85
const ICE_FRICTION = 0.98
const BOUNCE_FORCE = -16

function blockAt(gx: number, gy: number): string | undefined {
  return blockGrid.get(`${gx},${gy}`)
}

function getBlockColor(type: string): string {
  const bt = BLOCK_TYPES.find((b) => b.id === type)
  return bt ? bt.color : '#4a5568'
}

function resetPlayer() {
  playerX = props.level.startX * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2
  playerY = props.level.startY * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE)
  velX = 0
  velY = 0
  onGround = false
  won.value = false
  dead.value = false
}

function tryJump() {
  if (onGround) {
    velY = JUMP_FORCE
    onGround = false
  }
}

function update() {
  if (won.value || dead.value) return

  // Movement
  if (keys.left) velX -= MOVE_SPEED * 0.3
  if (keys.right) velX += MOVE_SPEED * 0.3

  // Clamp horizontal speed
  if (velX > MOVE_SPEED) velX = MOVE_SPEED
  if (velX < -MOVE_SPEED) velX = -MOVE_SPEED

  // Jump
  if (keys.up && onGround) {
    tryJump()
  }

  // Gravity
  velY += GRAVITY

  // Check which surface we're on for friction
  const feetGridX = Math.floor((playerX + PLAYER_SIZE / 2) / TILE_SIZE)
  const feetGridY = Math.floor((playerY + PLAYER_SIZE + 2) / TILE_SIZE)
  const surfaceBlock = blockAt(feetGridX, feetGridY)
  const friction = surfaceBlock === 'ice' ? ICE_FRICTION : FRICTION

  // Apply friction
  if (!keys.left && !keys.right) {
    velX *= friction
  }

  // Move horizontally
  playerX += velX

  // Horizontal collision
  resolveHorizontalCollisions()

  // Move vertically
  playerY += velY

  // Vertical collision
  resolveVerticalCollisions()

  // Check for hazards
  checkHazards()

  // Check win
  checkWin()

  // Keep in bounds
  const worldWidth = props.level.gridWidth * TILE_SIZE
  const worldHeight = props.level.gridHeight * TILE_SIZE
  if (playerX < 0) { playerX = 0; velX = 0 }
  if (playerX + PLAYER_SIZE > worldWidth) { playerX = worldWidth - PLAYER_SIZE; velX = 0 }
  if (playerY > worldHeight + 100) {
    die()
  }
}

function resolveHorizontalCollisions() {
  const left = Math.floor(playerX / TILE_SIZE)
  const right = Math.floor((playerX + PLAYER_SIZE - 1) / TILE_SIZE)
  const top = Math.floor(playerY / TILE_SIZE)
  const bottom = Math.floor((playerY + PLAYER_SIZE - 1) / TILE_SIZE)

  for (let gy = top; gy <= bottom; gy++) {
    for (let gx = left; gx <= right; gx++) {
      const block = blockAt(gx, gy)
      if (block && (block === 'ground' || block === 'ice')) {
        if (velX > 0) {
          playerX = gx * TILE_SIZE - PLAYER_SIZE
          velX = 0
        } else if (velX < 0) {
          playerX = (gx + 1) * TILE_SIZE
          velX = 0
        }
      }
    }
  }
}

function resolveVerticalCollisions() {
  const left = Math.floor(playerX / TILE_SIZE)
  const right = Math.floor((playerX + PLAYER_SIZE - 1) / TILE_SIZE)
  const top = Math.floor(playerY / TILE_SIZE)
  const bottom = Math.floor((playerY + PLAYER_SIZE - 1) / TILE_SIZE)

  onGround = false

  for (let gy = top; gy <= bottom; gy++) {
    for (let gx = left; gx <= right; gx++) {
      const block = blockAt(gx, gy)
      if (!block) continue

      if (block === 'ground' || block === 'ice') {
        if (velY > 0) {
          playerY = gy * TILE_SIZE - PLAYER_SIZE
          velY = 0
          onGround = true
        } else if (velY < 0) {
          playerY = (gy + 1) * TILE_SIZE
          velY = 0
        }
      } else if (block === 'bounce') {
        if (velY > 0) {
          playerY = gy * TILE_SIZE - PLAYER_SIZE
          velY = BOUNCE_FORCE
        }
      }
    }
  }
}

function checkHazards() {
  const cx = Math.floor((playerX + PLAYER_SIZE / 2) / TILE_SIZE)
  const cy = Math.floor((playerY + PLAYER_SIZE / 2) / TILE_SIZE)

  // Check all cells the player overlaps
  const left = Math.floor(playerX / TILE_SIZE)
  const right = Math.floor((playerX + PLAYER_SIZE - 1) / TILE_SIZE)
  const top = Math.floor(playerY / TILE_SIZE)
  const bottom = Math.floor((playerY + PLAYER_SIZE - 1) / TILE_SIZE)

  for (let gy = top; gy <= bottom; gy++) {
    for (let gx = left; gx <= right; gx++) {
      const block = blockAt(gx, gy)
      if (block === 'spike' || block === 'lava') {
        die()
        return
      }
    }
  }
}

function checkWin() {
  const cx = Math.floor((playerX + PLAYER_SIZE / 2) / TILE_SIZE)
  const cy = Math.floor((playerY + PLAYER_SIZE / 2) / TILE_SIZE)
  if (cx === props.level.endX && cy === props.level.endY) {
    won.value = true
    emit('won')
    incrementPlays(props.level.id).catch(() => {})
  }
}

function die() {
  dead.value = true
}

function draw(ctx: CanvasRenderingContext2D) {
  const canvasEl = canvas.value!
  const w = canvasEl.width
  const h = canvasEl.height

  // Camera offset to follow player
  const camX = Math.max(0, playerX + PLAYER_SIZE / 2 - w / 2)
  const camY = Math.max(0, playerY + PLAYER_SIZE / 2 - h / 2)

  ctx.clearRect(0, 0, w, h)

  // Background
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(-camX, -camY)

  // Draw grid lines (subtle)
  ctx.strokeStyle = '#1a202c'
  ctx.lineWidth = 1
  for (let x = 0; x <= props.level.gridWidth; x++) {
    ctx.beginPath()
    ctx.moveTo(x * TILE_SIZE, 0)
    ctx.lineTo(x * TILE_SIZE, props.level.gridHeight * TILE_SIZE)
    ctx.stroke()
  }
  for (let y = 0; y <= props.level.gridHeight; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * TILE_SIZE)
    ctx.lineTo(props.level.gridWidth * TILE_SIZE, y * TILE_SIZE)
    ctx.stroke()
  }

  // Draw blocks
  for (const [key, type] of blockGrid.entries()) {
    const [gx, gy] = key.split(',').map(Number)
    ctx.fillStyle = getBlockColor(type)
    ctx.fillRect(gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE)

    // Add detail
    if (type === 'spike') {
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.moveTo(gx * TILE_SIZE, (gy + 1) * TILE_SIZE)
      ctx.lineTo(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE)
      ctx.lineTo((gx + 1) * TILE_SIZE, (gy + 1) * TILE_SIZE)
      ctx.fill()
    }
  }

  // Draw start marker
  ctx.fillStyle = '#00ff00'
  ctx.font = '24px serif'
  ctx.textAlign = 'center'
  ctx.fillText('🏁', props.level.startX * TILE_SIZE + TILE_SIZE / 2, props.level.startY * TILE_SIZE + TILE_SIZE * 0.75)

  // Draw goal
  ctx.fillText('⭐', props.level.endX * TILE_SIZE + TILE_SIZE / 2, props.level.endY * TILE_SIZE + TILE_SIZE * 0.75)

  // Draw player
  ctx.fillStyle = '#6366f1'
  ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE)
  // Eyes
  ctx.fillStyle = '#fff'
  ctx.fillRect(playerX + 6, playerY + 8, 6, 6)
  ctx.fillRect(playerX + 20, playerY + 8, 6, 6)
  ctx.fillStyle = '#000'
  ctx.fillRect(playerX + 8, playerY + 10, 3, 3)
  ctx.fillRect(playerX + 22, playerY + 10, 3, 3)

  ctx.restore()
}

function gameLoop() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')!
  update()
  draw(ctx)
  animFrame = requestAnimationFrame(gameLoop)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
    keys.up = true
    e.preventDefault()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = false
}

function resizeCanvas() {
  if (!canvas.value || !canvasWrapper.value) return
  const wrapper = canvasWrapper.value
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = wrapper.clientWidth * dpr
  canvas.value.height = wrapper.clientHeight * dpr
  canvas.value.style.width = wrapper.clientWidth + 'px'
  canvas.value.style.height = wrapper.clientHeight + 'px'
  const ctx = canvas.value.getContext('2d')!
  ctx.scale(dpr, dpr)
  // Store logical size for draw
  canvas.value.dataset.logicalWidth = String(wrapper.clientWidth)
  canvas.value.dataset.logicalHeight = String(wrapper.clientHeight)
}

onMounted(() => {
  // Build block grid
  for (const block of props.level.blocks) {
    blockGrid.set(`${block.x},${block.y}`, block.type)
  }

  resetPlayer()
  resizeCanvas()
  gameLoop()

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.player-container {
  min-height: 100vh;
  background: #0d1117;
  display: flex;
  flex-direction: column;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #1a202c;
}

.back-btn {
  background: #4a5568;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.level-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.level-author {
  color: #a0aec0;
  font-size: 14px;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper canvas {
  display: block;
}

.win-overlay,
.dead-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.win-card,
.dead-card {
  background: #2d3748;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  color: #fff;
}

.win-card h2,
.dead-card h2 {
  font-size: 28px;
  margin: 0 0 12px 0;
}

.coins-earned {
  color: #ffd700;
  font-size: 24px;
  font-weight: 700;
}

.win-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.win-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
}

.win-btn.replay {
  background: #16a34a;
}

.win-btn.back {
  background: #4a5568;
}

.touch-controls {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: #1a202c;
  justify-content: center;
}

.touch-btn {
  padding: 16px 28px;
  background: #4a5568;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.touch-btn.jump {
  background: #6366f1;
  flex: 1;
  max-width: 200px;
}

.touch-btn:active {
  background: #6366f1;
  transform: scale(0.95);
}

@media (min-width: 768px) {
  .touch-controls {
    display: none;
  }
}
</style>
