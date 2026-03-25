<template>
  <div class="create-root">
    <!-- STEP 1: Setup -->
    <div v-if="step === 'setup'" class="setup-page">
      <button class="back-btn" @click="$router.push('/')">← Back</button>
      <h1 class="setup-title">Create a Level</h1>

      <div class="setup-form">
        <div class="form-group">
          <label>Game Name</label>
          <input v-model="gameName" type="text" placeholder="My Awesome Game" maxlength="40" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="gameDesc" placeholder="What's your game about?" maxlength="10000" rows="4"></textarea>
        </div>

        <div class="form-group">
          <label>Your Name</label>
          <input v-model="authorName" type="text" placeholder="Your creator name" maxlength="20" />
        </div>

        <div class="form-group">
          <label>Pick a Genre</label>
          <div class="genre-grid">
            <div
              v-for="g in GENRES"
              :key="g.id"
              class="genre-card"
              :class="{ selected: genre === g.id }"
              @click="genre = g.id"
            >
              <span class="genre-icon">{{ g.icon }}</span>
              <span class="genre-label">{{ g.label }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Game Mode</label>
          <div class="mode-buttons">
            <button
              class="mode-btn"
              :class="{ active: gameMode === '2d' }"
              @click="gameMode = '2d'"
            >
              <span class="mode-icon">🎮</span>
              <span class="mode-label">2D</span>
              <span class="mode-desc">Side-view game</span>
            </button>
            <button
              class="mode-btn"
              :class="{ active: gameMode === '3d' }"
              @click="gameMode = '3d'"
            >
              <span class="mode-icon">🌐</span>
              <span class="mode-label">3D</span>
              <span class="mode-desc">First-person 3D</span>
            </button>
          </div>
        </div>

        <div class="setup-actions">
          <button class="btn-primary" @click="startEditor" :disabled="!gameName">
            Start Building
          </button>
          <button class="btn-ai" @click="startWithAI" :disabled="!gameName || !genre">
            🤖 AI Help Me Build It
          </button>
        </div>
      </div>
    </div>

    <!-- STEP 2: Editor -->
    <div v-else-if="step === 'editor'" class="editor-page">
      <div class="editor-topbar">
        <button class="back-btn" @click="step = 'setup'">← Back</button>
        <span class="editor-title">{{ gameName }}</span>
        <span class="editor-mode-tag">{{ gameMode.toUpperCase() }}</span>
        <div class="editor-actions">
          <button class="btn-small btn-test" @click="testGame">▶ Test</button>
          <button class="btn-small btn-save" @click="saveCurrentGame">💾 Save</button>
          <button class="btn-small btn-publish" @click="publishGame">🚀 Publish</button>
          <button class="btn-small btn-ai-help" @click="aiGenerate">🤖 AI Help</button>
        </div>
      </div>

      <div class="editor-layout">
        <!-- Left: Object Palette -->
        <div class="palette-panel">
          <h3 class="panel-title">Objects</h3>
          <div
            v-for="obj in OBJECT_PALETTE"
            :key="obj.type"
            class="palette-item"
            :class="{ selected: selectedTool === obj.type }"
            @click="selectedTool = obj.type"
          >
            <span class="palette-icon">{{ obj.icon }}</span>
            <span class="palette-label">{{ obj.label }}</span>
          </div>
          <div class="palette-divider"></div>
          <div
            class="palette-item"
            :class="{ selected: selectedTool === 'eraser' }"
            @click="selectedTool = 'eraser'"
          >
            <span class="palette-icon">🧹</span>
            <span class="palette-label">Eraser</span>
          </div>
          <div
            class="palette-item"
            :class="{ selected: selectedTool === 'select' }"
            @click="selectedTool = 'select'"
          >
            <span class="palette-icon">👆</span>
            <span class="palette-label">Select</span>
          </div>
        </div>

        <!-- Center: 2D Canvas -->
        <div v-if="gameMode === '2d'" class="canvas-panel">
          <div
            class="game-canvas"
            :style="{ background: bgColor }"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @touchstart.prevent="onCanvasTouchStart"
            @touchmove.prevent="onCanvasTouchMove"
            @touchend.prevent="onCanvasMouseUp"
            ref="canvasRef"
          >
            <!-- Grid lines -->
            <div class="grid-overlay">
              <div
                v-for="x in gridCols"
                :key="'vl' + x"
                class="grid-line-v"
                :style="{ left: ((x) / gridCols * 100) + '%' }"
              ></div>
              <div
                v-for="y in gridRows"
                :key="'hl' + y"
                class="grid-line-h"
                :style="{ top: ((y) / gridRows * 100) + '%' }"
              ></div>
            </div>

            <!-- Objects -->
            <div
              v-for="obj in gameObjects"
              :key="obj.id"
              class="canvas-object"
              :class="{ selected: selectedObject?.id === obj.id, ['obj-' + obj.type]: true }"
              :style="getObjectStyle(obj)"
              @mousedown.stop="selectObject(obj, $event)"
              @touchstart.stop.prevent="selectObject(obj, $event)"
            >
              <span class="obj-icon">{{ getObjectIcon(obj.type) }}</span>
            </div>
          </div>
          <div class="canvas-info">
            {{ gameObjects.length }} objects | Grid: {{ gridCols }}x{{ gridRows }} | Click to place {{ selectedTool }}
          </div>
        </div>

        <!-- Center: 3D Canvas -->
        <div v-else class="canvas-panel">
          <div class="three-canvas-wrap" ref="threeEditorRef"></div>
          <div class="canvas-info">
            {{ gameObjects.length }} objects | 3D Mode | Click ground to place, right-click to remove | Scroll to zoom, drag to orbit
          </div>
        </div>

        <!-- Right: Properties -->
        <div class="props-panel">
          <h3 class="panel-title">Properties</h3>

          <div v-if="selectedObject" class="prop-section">
            <h4 class="prop-heading">{{ getObjectIcon(selectedObject.type) }} {{ selectedObject.type }}</h4>

            <div class="prop-row">
              <label>Color</label>
              <input type="color" v-model="selectedObject.color" />
            </div>

            <div class="prop-row">
              <label>Behavior</label>
              <select v-model="selectedObject.behavior">
                <option value="static">Static</option>
                <option value="patrol-horizontal">Patrol ↔</option>
                <option value="patrol-vertical">Patrol ↕</option>
                <option value="chase">Chase Player</option>
                <option value="bounce">Bounce</option>
                <option value="spin">Spin</option>
              </select>
            </div>

            <div v-if="selectedObject.behavior !== 'static'" class="prop-row">
              <label>Speed</label>
              <input type="range" v-model.number="selectedObject.speed" min="1" max="10" />
              <span class="prop-val">{{ selectedObject.speed }}</span>
            </div>

            <div v-if="selectedObject.type === 'text'" class="prop-row">
              <label>Text</label>
              <input type="text" v-model="selectedObject.label" placeholder="Enter text" />
            </div>

            <button class="btn-delete" @click="deleteSelected">🗑️ Delete</button>
          </div>

          <div v-else class="prop-section">
            <p class="prop-hint">Click an object to edit it, or click the canvas to place objects.</p>
          </div>

          <div class="prop-section">
            <h4 class="prop-heading">Game Settings</h4>
            <div class="prop-row">
              <label>Background</label>
              <input type="color" v-model="bgColor" />
            </div>
            <div class="prop-row">
              <label>Gravity</label>
              <input type="range" v-model.number="gravity" min="0" max="20" />
              <span class="prop-val">{{ gravity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: Testing / Playing (2D) -->
    <div v-else-if="step === 'testing' && gameMode === '2d'" class="test-page">
      <div class="test-topbar">
        <button class="back-btn" @click="stopTest">← Back to Editor</button>
        <span class="test-title">Testing: {{ gameName }}</span>
        <button class="btn-small btn-restart" @click="restartTest">🔄 Restart</button>
      </div>
      <div class="test-canvas" ref="testCanvasRef">
        <canvas ref="gameCanvasEl" class="play-canvas"></canvas>
        <div v-if="gameOver" class="game-over-overlay">
          <div class="game-over-box">
            <h2>{{ gameWon ? '🎉 You Win!' : '💀 Game Over!' }}</h2>
            <p>Score: {{ score }} coins</p>
            <button class="btn-primary" @click="restartTest">Play Again</button>
            <button class="btn-small btn-save" @click="stopTest">Back to Editor</button>
          </div>
        </div>
      </div>
      <div class="test-controls">
        <div class="touch-controls">
          <button class="touch-btn" @touchstart.prevent="touchLeft = true" @touchend.prevent="touchLeft = false" @mousedown="touchLeft = true" @mouseup="touchLeft = false">⬅️</button>
          <button class="touch-btn" @touchstart.prevent="touchJump = true" @touchend.prevent="touchJump = false" @mousedown="touchJump = true" @mouseup="touchJump = false">⬆️</button>
          <button class="touch-btn" @touchstart.prevent="touchRight = true" @touchend.prevent="touchRight = false" @mousedown="touchRight = true" @mouseup="touchRight = false">➡️</button>
        </div>
        <p class="controls-hint">Arrow keys or WASD to move, Space to jump</p>
      </div>
    </div>

    <!-- STEP 3: Testing / Playing (3D) -->
    <div v-else-if="step === 'testing' && gameMode === '3d'" class="test-page">
      <div class="test-topbar">
        <button class="back-btn" @click="stopTest">← Back to Editor</button>
        <span class="test-title">Testing: {{ gameName }} (3D)</span>
        <span class="score-display">🪙 {{ score }}</span>
        <button class="btn-small btn-restart" @click="restartTest3D">🔄 Restart</button>
      </div>
      <div class="test-canvas" ref="testCanvas3DRef">
        <div v-if="gameOver" class="game-over-overlay">
          <div class="game-over-box">
            <h2>{{ gameWon ? '🎉 You Win!' : '💀 Game Over!' }}</h2>
            <p>Score: {{ score }} coins</p>
            <button class="btn-primary" @click="restartTest3D">Play Again</button>
            <button class="btn-small btn-save" @click="stopTest">Back to Editor</button>
          </div>
        </div>
      </div>
      <div class="test-controls">
        <div class="touch-controls">
          <button class="touch-btn" @touchstart.prevent="touchLeft = true" @touchend.prevent="touchLeft = false" @mousedown="touchLeft = true" @mouseup="touchLeft = false">⬅️</button>
          <button class="touch-btn" @touchstart.prevent="touchForward = true" @touchend.prevent="touchForward = false" @mousedown="touchForward = true" @mouseup="touchForward = false">⬆️</button>
          <button class="touch-btn" @touchstart.prevent="touchRight = true" @touchend.prevent="touchRight = false" @mousedown="touchRight = true" @mouseup="touchRight = false">➡️</button>
          <button class="touch-btn" @touchstart.prevent="touchJump = true" @touchend.prevent="touchJump = false" @mousedown="touchJump = true" @mouseup="touchJump = false">🔼</button>
        </div>
        <p class="controls-hint">WASD to move, Space to jump, Mouse to look around</p>
      </div>
    </div>

    <!-- Save/Publish Toast -->
    <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { GameObject, ObjectType } from './types'
import { OBJECT_PALETTE, GENRES } from './types'
import { saveGame, generateAILevel } from './gameStore'
import { gameState } from '../../components/shared/GameState'

// Setup state
const step = ref<'setup' | 'editor' | 'testing'>('setup')
const gameName = ref('')
const gameDesc = ref('')
const authorName = ref(gameState.getPlayerName() || 'Player')
const genre = ref('')
const gameMode = ref<'2d' | '3d'>('2d')

// Editor state
const selectedTool = ref<ObjectType | 'eraser' | 'select'>('platform')
const selectedObject = ref<GameObject | null>(null)
const gameObjects = ref<GameObject[]>([])
const bgColor = ref('#1e293b')
const gravity = ref(10)
const canvasRef = ref<HTMLDivElement | null>(null)
const gridCols = 20
const gridRows = 15
const isDrawing = ref(false)
let gameId = ''

// Test/Play state
const testCanvasRef = ref<HTMLDivElement | null>(null)
const gameCanvasEl = ref<HTMLCanvasElement | null>(null)
const gameOver = ref(false)
const gameWon = ref(false)
const score = ref(0)
const touchLeft = ref(false)
const touchRight = ref(false)
const touchJump = ref(false)
const touchForward = ref(false)
let animFrame = 0
let playerState = { x: 0, y: 0, vx: 0, vy: 0, onGround: false }
let runtimeObjects: { obj: GameObject; x: number; y: number; originX: number; originY: number; collected: boolean; t: number }[] = []
let keysDown: Record<string, boolean> = {}

// 3D Editor state
const threeEditorRef = ref<HTMLDivElement | null>(null)
let editorScene: THREE.Scene | null = null
let editorCamera: THREE.PerspectiveCamera | null = null
let editorRenderer: THREE.WebGLRenderer | null = null
let editorControls: OrbitControls | null = null
let editorAnimFrame = 0
let editorMeshes: Map<string, THREE.Mesh> = new Map()

// 3D Test state
const testCanvas3DRef = ref<HTMLDivElement | null>(null)
let testScene: THREE.Scene | null = null
let testCamera: THREE.PerspectiveCamera | null = null
let testRenderer: THREE.WebGLRenderer | null = null
let testAnimFrame = 0
let player3D = { x: 1, y: 1, z: 1, vx: 0, vy: 0, vz: 0, onGround: false, rotY: 0 }
let test3DMeshes: { mesh: THREE.Mesh; obj: GameObject; collected: boolean; originX: number; originZ: number; t: number }[] = []

// Toast
const toast = ref<{ message: string; type: string } | null>(null)
function showToast(message: string, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => (toast.value = null), 2500)
}

function getObjectIcon(type: ObjectType): string {
  return OBJECT_PALETTE.find((p) => p.type === type)?.icon || '❓'
}

function getObjectColor(type: ObjectType): string {
  return OBJECT_PALETTE.find((p) => p.type === type)?.color || '#666'
}

function getObjectStyle(obj: GameObject) {
  return {
    left: (obj.x / gridCols) * 100 + '%',
    top: (obj.y / gridRows) * 100 + '%',
    width: (obj.width / gridCols) * 100 + '%',
    height: (obj.height / gridRows) * 100 + '%',
    background: obj.color,
  }
}

// Canvas interaction
function getGridPos(e: MouseEvent | Touch): { gx: number; gy: number } | null {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()
  const px = (('clientX' in e ? e.clientX : 0) - rect.left) / rect.width
  const py = (('clientY' in e ? e.clientY : 0) - rect.top) / rect.height
  return { gx: Math.floor(px * gridCols), gy: Math.floor(py * gridRows) }
}

function placeOrErase(gx: number, gy: number) {
  if (gx < 0 || gx >= gridCols || gy < 0 || gy >= gridRows) return

  if (selectedTool.value === 'eraser') {
    gameObjects.value = gameObjects.value.filter(
      (o) => !(o.x === gx && o.y === gy)
    )
    return
  }

  if (selectedTool.value === 'select') return

  const existing = gameObjects.value.find((o) => o.x === gx && o.y === gy)
  if (existing) return

  // Only one player allowed
  if (selectedTool.value === 'player') {
    gameObjects.value = gameObjects.value.filter((o) => o.type !== 'player')
  }

  gameObjects.value.push({
    id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: selectedTool.value as ObjectType,
    x: gx,
    y: gy,
    width: 1,
    height: 1,
    color: getObjectColor(selectedTool.value as ObjectType),
    behavior: 'static',
    speed: 3,
  })
}

function onCanvasMouseDown(e: MouseEvent) {
  const pos = getGridPos(e)
  if (!pos) return
  if (selectedTool.value === 'select') return
  isDrawing.value = true
  placeOrErase(pos.gx, pos.gy)
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!isDrawing.value) return
  const pos = getGridPos(e)
  if (!pos) return
  placeOrErase(pos.gx, pos.gy)
}

function onCanvasMouseUp() {
  isDrawing.value = false
}

function onCanvasTouchStart(e: TouchEvent) {
  const pos = getGridPos(e.touches[0])
  if (!pos) return
  if (selectedTool.value === 'select') return
  isDrawing.value = true
  placeOrErase(pos.gx, pos.gy)
}

function onCanvasTouchMove(e: TouchEvent) {
  if (!isDrawing.value) return
  const pos = getGridPos(e.touches[0])
  if (!pos) return
  placeOrErase(pos.gx, pos.gy)
}

function selectObject(obj: GameObject, e: Event) {
  if (selectedTool.value === 'eraser') {
    gameObjects.value = gameObjects.value.filter((o) => o.id !== obj.id)
    return
  }
  selectedTool.value = 'select'
  selectedObject.value = obj
}

function deleteSelected() {
  if (!selectedObject.value) return
  gameObjects.value = gameObjects.value.filter((o) => o.id !== selectedObject.value!.id)
  selectedObject.value = null
}

// Editor actions
function startEditor() {
  gameId = `game_${Date.now()}`
  gameObjects.value = []
  step.value = 'editor'
}

function startWithAI() {
  gameId = `game_${Date.now()}`
  gameObjects.value = generateAILevel(genre.value || 'platformer', gameMode.value)
  if (genre.value === 'scary') bgColor.value = '#0a0a12'
  else if (genre.value === 'adventure') bgColor.value = '#87ceeb'
  else bgColor.value = '#1e293b'
  step.value = 'editor'
  showToast('🤖 AI generated your level!')
}

function aiGenerate() {
  if (!genre.value) {
    showToast('Pick a genre first!', 'error')
    return
  }
  gameObjects.value = generateAILevel(genre.value, gameMode.value)
  if (genre.value === 'scary') bgColor.value = '#0a0a12'
  else if (genre.value === 'adventure') bgColor.value = '#87ceeb'
  showToast('🤖 AI rebuilt the level!')
}

function saveCurrentGame() {
  saveGame({
    id: gameId,
    name: gameName.value,
    description: gameDesc.value,
    author: authorName.value,
    mode: gameMode.value,
    genre: genre.value,
    objects: JSON.parse(JSON.stringify(gameObjects.value)),
    bgColor: bgColor.value,
    gravity: gravity.value,
    createdAt: Date.now(),
    published: false,
    plays: 0,
    likes: 0,
  })
  showToast('💾 Game saved!')
}

function publishGame() {
  saveGame({
    id: gameId,
    name: gameName.value,
    description: gameDesc.value,
    author: authorName.value,
    mode: gameMode.value,
    genre: genre.value,
    objects: JSON.parse(JSON.stringify(gameObjects.value)),
    bgColor: bgColor.value,
    gravity: gravity.value,
    createdAt: Date.now(),
    published: true,
    plays: 0,
    likes: 0,
  })
  showToast('🚀 Game published! Others can now play it!')
}

// ====== GAME ENGINE (2D Canvas) ======
function restartTest() {
  gameOver.value = false
  gameWon.value = false
  score.value = 0
  cancelAnimationFrame(animFrame)
  initGameEngine()
}

function initGameEngine() {
  const canvas = gameCanvasEl.value
  if (!canvas) return
  const container = testCanvasRef.value
  if (!container) return

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight - 4

  const cellW = canvas.width / gridCols
  const cellH = canvas.height / gridRows

  // Initialize runtime objects
  runtimeObjects = gameObjects.value.map((obj) => ({
    obj: { ...obj },
    x: obj.x * cellW,
    y: obj.y * cellH,
    originX: obj.x * cellW,
    originY: obj.y * cellH,
    collected: false,
    t: Math.random() * Math.PI * 2,
  }))

  // Find player
  const playerObj = runtimeObjects.find((r) => r.obj.type === 'player')
  if (playerObj) {
    playerState = { x: playerObj.x, y: playerObj.y, vx: 0, vy: 0, onGround: false }
  } else {
    playerState = { x: cellW, y: cellH * 13, vx: 0, vy: 0, onGround: false }
  }

  keysDown = {}
  const ctx = canvas.getContext('2d')!
  const grav = gravity.value * 0.3

  function isSolid(type: ObjectType) {
    return type === 'platform' || type === 'wall'
  }

  function gameLoop() {
    if (gameOver.value) return
    animFrame = requestAnimationFrame(gameLoop)

    const pw = cellW * 0.8
    const ph = cellH * 0.8
    const speed = 4

    // Input
    if (keysDown['ArrowLeft'] || keysDown['a'] || keysDown['A'] || touchLeft.value) {
      playerState.vx = -speed
    } else if (keysDown['ArrowRight'] || keysDown['d'] || keysDown['D'] || touchRight.value) {
      playerState.vx = speed
    } else {
      playerState.vx *= 0.7
      if (Math.abs(playerState.vx) < 0.1) playerState.vx = 0
    }

    if ((keysDown[' '] || keysDown['ArrowUp'] || keysDown['w'] || keysDown['W'] || touchJump.value) && playerState.onGround) {
      playerState.vy = -8
      playerState.onGround = false
    }

    // Gravity
    playerState.vy += grav * 0.05
    if (playerState.vy > 12) playerState.vy = 12

    // Move X
    playerState.x += playerState.vx
    // Collide X with solids
    for (const r of runtimeObjects) {
      if (!isSolid(r.obj.type) || r.collected) continue
      const ow = r.obj.width * cellW
      const oh = r.obj.height * cellH
      if (
        playerState.x + pw > r.x &&
        playerState.x < r.x + ow &&
        playerState.y + ph > r.y + 1 &&
        playerState.y < r.y + oh - 1
      ) {
        if (playerState.vx > 0) playerState.x = r.x - pw
        else if (playerState.vx < 0) playerState.x = r.x + ow
        playerState.vx = 0
      }
    }

    // Move Y
    playerState.y += playerState.vy
    playerState.onGround = false
    // Collide Y with solids
    for (const r of runtimeObjects) {
      if (!isSolid(r.obj.type) || r.collected) continue
      const ow = r.obj.width * cellW
      const oh = r.obj.height * cellH
      if (
        playerState.x + pw > r.x + 1 &&
        playerState.x < r.x + ow - 1 &&
        playerState.y + ph > r.y &&
        playerState.y < r.y + oh
      ) {
        if (playerState.vy > 0) {
          playerState.y = r.y - ph
          playerState.onGround = true
        } else if (playerState.vy < 0) {
          playerState.y = r.y + oh
        }
        playerState.vy = 0
      }
    }

    // Floor
    if (playerState.y + ph > canvas.height) {
      playerState.y = canvas.height - ph
      playerState.vy = 0
      playerState.onGround = true
    }
    // Walls
    if (playerState.x < 0) playerState.x = 0
    if (playerState.x + pw > canvas.width) playerState.x = canvas.width - pw

    // Update runtime objects (behaviors)
    for (const r of runtimeObjects) {
      if (r.collected) continue
      r.t += 0.02
      const spd = (r.obj.speed || 3) * 0.5
      if (r.obj.behavior === 'patrol-horizontal') {
        r.x = r.originX + Math.sin(r.t * spd) * cellW * 3
      } else if (r.obj.behavior === 'patrol-vertical') {
        r.y = r.originY + Math.sin(r.t * spd) * cellH * 2
      } else if (r.obj.behavior === 'chase') {
        const dx = playerState.x - r.x
        const dy = playerState.y - r.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0 && dist < cellW * 8) {
          r.x += (dx / dist) * spd * 0.5
          r.y += (dy / dist) * spd * 0.5
        }
      } else if (r.obj.behavior === 'bounce') {
        r.y = r.originY + Math.sin(r.t * 3) * cellH * 0.5
      } else if (r.obj.behavior === 'spin') {
        // Visual only, handled in render
      }
    }

    // Check collisions with special objects
    for (const r of runtimeObjects) {
      if (r.collected) continue
      const ow = r.obj.width * cellW
      const oh = r.obj.height * cellH
      if (
        playerState.x + pw > r.x + 4 &&
        playerState.x < r.x + ow - 4 &&
        playerState.y + ph > r.y + 4 &&
        playerState.y < r.y + oh - 4
      ) {
        if (r.obj.type === 'coin') {
          r.collected = true
          score.value++
        } else if (r.obj.type === 'goal') {
          gameOver.value = true
          gameWon.value = true
        } else if (r.obj.type === 'enemy' || r.obj.type === 'spike') {
          gameOver.value = true
          gameWon.value = false
        }
      }
    }

    // ====== RENDER ======
    ctx.fillStyle = bgColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid (faint)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x <= gridCols; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellW, 0)
      ctx.lineTo(x * cellW, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= gridRows; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellH)
      ctx.lineTo(canvas.width, y * cellH)
      ctx.stroke()
    }

    // Draw objects
    for (const r of runtimeObjects) {
      if (r.collected) continue
      if (r.obj.type === 'player') continue // draw player separately
      const ow = r.obj.width * cellW
      const oh = r.obj.height * cellH

      ctx.save()
      if (r.obj.behavior === 'spin') {
        ctx.translate(r.x + ow / 2, r.y + oh / 2)
        ctx.rotate(r.t * 2)
        ctx.translate(-(r.x + ow / 2), -(r.y + oh / 2))
      }

      // Light glow
      if (r.obj.type === 'light') {
        const gradient = ctx.createRadialGradient(r.x + ow / 2, r.y + oh / 2, 0, r.x + ow / 2, r.y + oh / 2, cellW * 3)
        gradient.addColorStop(0, 'rgba(253, 230, 138, 0.3)')
        gradient.addColorStop(1, 'rgba(253, 230, 138, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(r.x - cellW * 2, r.y - cellH * 2, ow + cellW * 4, oh + cellH * 4)
      }

      ctx.fillStyle = r.obj.color
      ctx.fillRect(r.x, r.y, ow, oh)

      // Icon overlay
      ctx.font = `${Math.min(ow, oh) * 0.6}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(getObjectIcon(r.obj.type), r.x + ow / 2, r.y + oh / 2)

      ctx.restore()
    }

    // Draw player
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(playerState.x, playerState.y, pw, ph)
    ctx.font = `${ph * 0.6}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧍', playerState.x + pw / 2, playerState.y + ph / 2)

    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`🪙 ${score.value}`, 10, 10)
  }

  gameLoop()
}

function stopTest() {
  cancelAnimationFrame(animFrame)
  cancelAnimationFrame(testAnimFrame)
  cleanupTestScene()
  step.value = 'editor'
  if (gameMode.value === '3d') {
    nextTick(() => init3DEditor())
  }
}

// ====== 3D EDITOR ======
function init3DEditor() {
  cleanup3DEditor()
  const container = threeEditorRef.value
  if (!container) return

  const w = container.clientWidth
  const h = container.clientHeight

  editorScene = new THREE.Scene()
  editorScene.background = new THREE.Color(bgColor.value)
  editorScene.fog = new THREE.Fog(bgColor.value, 30, 60)

  editorCamera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
  editorCamera.position.set(10, 12, 16)
  editorCamera.lookAt(10, 0, 7)

  editorRenderer = new THREE.WebGLRenderer({ antialias: true })
  editorRenderer.setSize(w, h)
  editorRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  editorRenderer.shadowMap.enabled = true
  container.appendChild(editorRenderer.domElement)

  editorControls = new OrbitControls(editorCamera, editorRenderer.domElement)
  editorControls.target.set(10, 0, 7)
  editorControls.update()

  // Lights
  const ambient = new THREE.AmbientLight(0x606080, 0.8)
  editorScene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffffff, 1)
  sun.position.set(10, 15, 10)
  sun.castShadow = true
  editorScene.add(sun)

  // Ground grid
  const gridHelper = new THREE.GridHelper(gridCols, gridCols, 0x444466, 0x333355)
  editorScene.add(gridHelper)

  // Ground plane (for raycasting clicks)
  const groundGeo = new THREE.PlaneGeometry(gridCols, gridCols)
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2d42, roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(gridCols / 2 - 0.5, -0.01, gridCols / 2 - 0.5)
  ground.receiveShadow = true
  ground.name = 'ground'
  editorScene.add(ground)

  // Render existing objects
  rebuildEditor3DMeshes()

  // Click to place
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function onEditorClick(event: MouseEvent) {
    if (!editorRenderer || !editorCamera || !editorScene) return
    const rect = editorRenderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, editorCamera)

    // Right click = delete
    if (event.button === 2) {
      const meshArray = Array.from(editorMeshes.values())
      const hits = raycaster.intersectObjects(meshArray)
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh
        const objId = hitMesh.userData.objId
        if (objId) {
          gameObjects.value = gameObjects.value.filter(o => o.id !== objId)
          rebuildEditor3DMeshes()
        }
      }
      return
    }

    if (selectedTool.value === 'select' || selectedTool.value === 'eraser') {
      // Handle select/erase on meshes
      const meshArray = Array.from(editorMeshes.values())
      const hits = raycaster.intersectObjects(meshArray)
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh
        const objId = hitMesh.userData.objId
        if (selectedTool.value === 'eraser' && objId) {
          gameObjects.value = gameObjects.value.filter(o => o.id !== objId)
          rebuildEditor3DMeshes()
        } else if (selectedTool.value === 'select' && objId) {
          selectedObject.value = gameObjects.value.find(o => o.id === objId) || null
        }
      }
      return
    }

    // Place on ground
    const groundMesh = editorScene!.getObjectByName('ground')
    if (!groundMesh) return
    const hits = raycaster.intersectObject(groundMesh)
    if (hits.length > 0) {
      const point = hits[0].point
      const gx = Math.round(point.x)
      const gz = Math.round(point.z)
      if (gx < 0 || gx >= gridCols || gz < 0 || gz >= gridRows) return

      const existing = gameObjects.value.find(o => o.x === gx && (o.z ?? o.y) === gz)
      if (existing) return

      if (selectedTool.value === 'player') {
        gameObjects.value = gameObjects.value.filter(o => o.type !== 'player')
      }

      gameObjects.value.push({
        id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: selectedTool.value as ObjectType,
        x: gx,
        y: 0,
        z: gz,
        width: 1,
        height: 1,
        depth: 1,
        color: getObjectColor(selectedTool.value as ObjectType),
        behavior: 'static',
        speed: 3,
      })
      rebuildEditor3DMeshes()
    }
  }

  editorRenderer.domElement.addEventListener('click', onEditorClick)
  editorRenderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    onEditorClick(e as MouseEvent)
  })

  function editorAnimate() {
    editorAnimFrame = requestAnimationFrame(editorAnimate)
    editorControls?.update()
    editorRenderer!.render(editorScene!, editorCamera!)
  }
  editorAnimate()

  // Handle resize
  const resizeObs = new ResizeObserver(() => {
    if (!container || !editorCamera || !editorRenderer) return
    const nw = container.clientWidth
    const nh = container.clientHeight
    editorCamera.aspect = nw / nh
    editorCamera.updateProjectionMatrix()
    editorRenderer.setSize(nw, nh)
  })
  resizeObs.observe(container)
}

function rebuildEditor3DMeshes() {
  if (!editorScene) return
  // Remove old meshes
  for (const mesh of editorMeshes.values()) {
    editorScene.remove(mesh)
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
  }
  editorMeshes.clear()

  // Add new
  for (const obj of gameObjects.value) {
    const color = new THREE.Color(obj.color)
    const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9)
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 })
    if (obj.type === 'coin') {
      mat.emissive = color
      mat.emissiveIntensity = 0.3
    }
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(obj.x, 0.45, obj.z ?? obj.y)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.objId = obj.id
    editorScene.add(mesh)
    editorMeshes.set(obj.id, mesh)
  }
}

function cleanup3DEditor() {
  cancelAnimationFrame(editorAnimFrame)
  if (editorRenderer) {
    editorRenderer.dispose()
    editorRenderer.domElement.remove()
  }
  editorControls?.dispose()
  if (editorScene) {
    editorScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mat = obj.material
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
      }
    })
  }
  editorScene = null
  editorCamera = null
  editorRenderer = null
  editorControls = null
  editorMeshes.clear()
}

// Watch for step changes to init 3D editor
watch(step, (newStep) => {
  if (newStep === 'editor' && gameMode.value === '3d') {
    nextTick(() => init3DEditor())
  } else if (newStep !== 'editor') {
    cleanup3DEditor()
  }
})

// ====== 3D GAME ENGINE ======
function testGame() {
  step.value = 'testing'
  gameOver.value = false
  gameWon.value = false
  score.value = 0
  if (gameMode.value === '3d') {
    nextTick(() => init3DGameEngine())
  } else {
    nextTick(() => initGameEngine())
  }
}

function restartTest3D() {
  gameOver.value = false
  gameWon.value = false
  score.value = 0
  cancelAnimationFrame(testAnimFrame)
  cleanupTestScene()
  init3DGameEngine()
}

function cleanupTestScene() {
  cancelAnimationFrame(testAnimFrame)
  if (testRenderer) {
    testRenderer.dispose()
    testRenderer.domElement.remove()
  }
  if (testScene) {
    testScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mat = obj.material
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
      }
    })
  }
  testScene = null
  testCamera = null
  testRenderer = null
  test3DMeshes = []
}

function init3DGameEngine() {
  cleanupTestScene()
  const container = testCanvas3DRef.value
  if (!container) return

  const w = container.clientWidth
  const h = container.clientHeight

  testScene = new THREE.Scene()
  testScene.background = new THREE.Color(bgColor.value)
  testScene.fog = new THREE.Fog(bgColor.value, 15, 40)

  testCamera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100)
  testRenderer = new THREE.WebGLRenderer({ antialias: true })
  testRenderer.setSize(w, h)
  testRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  testRenderer.shadowMap.enabled = true
  container.appendChild(testRenderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight(0x606080, 0.6)
  testScene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffffff, 1.2)
  sun.position.set(10, 20, 10)
  sun.castShadow = true
  testScene.add(sun)

  // Add light objects as actual point lights
  for (const obj of gameObjects.value) {
    if (obj.type === 'light') {
      const light = new THREE.PointLight(new THREE.Color(obj.color).getHex(), 2, 10)
      light.position.set(obj.x, 1.5, obj.z ?? obj.y)
      testScene.add(light)
    }
  }

  // Ground
  const groundGeo = new THREE.PlaneGeometry(gridCols + 4, gridRows + 4)
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a3d52, roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(gridCols / 2, 0, gridRows / 2)
  ground.receiveShadow = true
  testScene.add(ground)

  // Build world objects
  test3DMeshes = []
  for (const obj of gameObjects.value) {
    if (obj.type === 'player' || obj.type === 'light') continue
    const color = new THREE.Color(obj.color)
    let geo: THREE.BufferGeometry
    if (obj.type === 'coin') {
      geo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16)
    } else if (obj.type === 'spike') {
      geo = new THREE.ConeGeometry(0.4, 0.8, 4)
    } else if (obj.type === 'goal') {
      geo = new THREE.BoxGeometry(0.9, 1.8, 0.9)
    } else {
      geo = new THREE.BoxGeometry(0.95, 0.95, 0.95)
    }
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 })
    if (obj.type === 'coin' || obj.type === 'goal') {
      mat.emissive = color
      mat.emissiveIntensity = 0.4
    }
    const mesh = new THREE.Mesh(geo, mat)
    const posY = obj.type === 'goal' ? 0.9 : obj.type === 'coin' ? 0.8 : 0.475
    mesh.position.set(obj.x, posY, obj.z ?? obj.y)
    mesh.castShadow = true
    mesh.receiveShadow = true
    testScene.add(mesh)
    test3DMeshes.push({
      mesh,
      obj,
      collected: false,
      originX: obj.x,
      originZ: obj.z ?? obj.y,
      t: Math.random() * Math.PI * 2,
    })
  }

  // Player start
  const playerObj = gameObjects.value.find(o => o.type === 'player')
  player3D = {
    x: playerObj ? playerObj.x : 1,
    y: 0.5,
    z: playerObj ? (playerObj.z ?? playerObj.y) : 1,
    vx: 0, vy: 0, vz: 0,
    onGround: true,
    rotY: 0,
  }

  // Mouse look
  let mouseSensitivity = 0.003
  function onMouseMove(e: MouseEvent) {
    if (document.pointerLockElement === testRenderer!.domElement) {
      player3D.rotY -= e.movementX * mouseSensitivity
    }
  }
  testRenderer.domElement.addEventListener('click', () => {
    testRenderer?.domElement.requestPointerLock()
  })
  document.addEventListener('mousemove', onMouseMove)

  const grav3D = gravity.value * 0.015

  function gameLoop3D() {
    if (gameOver.value) return
    testAnimFrame = requestAnimationFrame(gameLoop3D)

    const speed = 0.1
    const forward = new THREE.Vector3(-Math.sin(player3D.rotY), 0, -Math.cos(player3D.rotY))
    const right = new THREE.Vector3(Math.cos(player3D.rotY), 0, -Math.sin(player3D.rotY))

    // Input
    let moveX = 0, moveZ = 0
    if (keysDown['w'] || keysDown['W'] || keysDown['ArrowUp'] || touchForward.value) {
      moveX += forward.x * speed
      moveZ += forward.z * speed
    }
    if (keysDown['s'] || keysDown['S'] || keysDown['ArrowDown']) {
      moveX -= forward.x * speed
      moveZ -= forward.z * speed
    }
    if (keysDown['a'] || keysDown['A'] || touchLeft.value) {
      moveX -= right.x * speed
      moveZ -= right.z * speed
    }
    if (keysDown['d'] || keysDown['D'] || keysDown['ArrowRight'] || touchRight.value) {
      moveX += right.x * speed
      moveZ += right.z * speed
    }
    if ((keysDown[' '] || touchJump.value) && player3D.onGround) {
      player3D.vy = 0.2
      player3D.onGround = false
    }

    // Gravity
    player3D.vy -= grav3D
    if (player3D.vy < -0.5) player3D.vy = -0.5

    // Move
    player3D.x += moveX
    player3D.y += player3D.vy
    player3D.z += moveZ

    // Collision with solid blocks
    for (const entry of test3DMeshes) {
      if (entry.collected) continue
      const o = entry.obj
      if (o.type !== 'platform' && o.type !== 'wall') continue
      const bx = entry.mesh.position.x, bz = entry.mesh.position.z
      const halfW = 0.475
      if (
        player3D.x + 0.3 > bx - halfW &&
        player3D.x - 0.3 < bx + halfW &&
        player3D.z + 0.3 > bz - halfW &&
        player3D.z - 0.3 < bz + halfW &&
        player3D.y - 0.4 < 0.95 &&
        player3D.y + 0.4 > 0
      ) {
        // Push player out
        const dx = player3D.x - bx
        const dz = player3D.z - bz
        if (Math.abs(dx) > Math.abs(dz)) {
          player3D.x = dx > 0 ? bx + halfW + 0.3 : bx - halfW - 0.3
        } else {
          player3D.z = dz > 0 ? bz + halfW + 0.3 : bz - halfW - 0.3
        }
      }
    }

    // Floor
    if (player3D.y < 0.5) {
      player3D.y = 0.5
      player3D.vy = 0
      player3D.onGround = true
    }

    // Boundaries
    if (player3D.x < -1) player3D.x = -1
    if (player3D.x > gridCols + 1) player3D.x = gridCols + 1
    if (player3D.z < -1) player3D.z = -1
    if (player3D.z > gridRows + 1) player3D.z = gridRows + 1

    // Update behaviors
    for (const entry of test3DMeshes) {
      if (entry.collected) continue
      entry.t += 0.02
      const spd = (entry.obj.speed || 3) * 0.5
      if (entry.obj.behavior === 'patrol-horizontal') {
        entry.mesh.position.x = entry.originX + Math.sin(entry.t * spd) * 3
      } else if (entry.obj.behavior === 'patrol-vertical') {
        entry.mesh.position.z = entry.originZ + Math.sin(entry.t * spd) * 2
      } else if (entry.obj.behavior === 'chase') {
        const dx = player3D.x - entry.mesh.position.x
        const dz = player3D.z - entry.mesh.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0 && dist < 8) {
          entry.mesh.position.x += (dx / dist) * spd * 0.02
          entry.mesh.position.z += (dz / dist) * spd * 0.02
        }
      } else if (entry.obj.behavior === 'bounce') {
        entry.mesh.position.y = 0.5 + Math.abs(Math.sin(entry.t * 3)) * 0.8
      } else if (entry.obj.behavior === 'spin') {
        entry.mesh.rotation.y = entry.t * 2
      }

      if (entry.obj.type === 'coin') {
        entry.mesh.rotation.y = entry.t * 2
      }
    }

    // Check collisions with special objects
    for (const entry of test3DMeshes) {
      if (entry.collected) continue
      const dx = player3D.x - entry.mesh.position.x
      const dz = player3D.z - entry.mesh.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 0.7) {
        if (entry.obj.type === 'coin') {
          entry.collected = true
          entry.mesh.visible = false
          score.value++
        } else if (entry.obj.type === 'goal') {
          gameOver.value = true
          gameWon.value = true
        } else if (entry.obj.type === 'enemy' || entry.obj.type === 'spike') {
          gameOver.value = true
          gameWon.value = false
        }
      }
    }

    // Camera follows player (third person behind)
    const camDist = 4
    const camHeight = 2.5
    testCamera!.position.set(
      player3D.x - forward.x * camDist,
      player3D.y + camHeight,
      player3D.z - forward.z * camDist
    )
    testCamera!.lookAt(player3D.x, player3D.y + 0.5, player3D.z)

    testRenderer!.render(testScene!, testCamera!)
  }

  gameLoop3D()
}

function onKeyDown(e: KeyboardEvent) {
  keysDown[e.key] = true
}

function onKeyUp(e: KeyboardEvent) {
  keysDown[e.key] = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(animFrame)
  cancelAnimationFrame(editorAnimFrame)
  cancelAnimationFrame(testAnimFrame)
  cleanup3DEditor()
  cleanupTestScene()
})
</script>

<style scoped>
.create-root {
  min-height: 100vh;
  background: #191b2a;
  color: #fff;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* SETUP PAGE */
.setup-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  background: #3b3f5c;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
}

.back-btn:hover { background: #4a4f70; }

.setup-title {
  font-size: 32px;
  font-weight: 800;
  margin: 16px 0;
  color: #eef0ff;
}

.setup-form { display: flex; flex-direction: column; gap: 18px; }

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #b0b4c8;
  margin-bottom: 6px;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px 14px;
  background: #2a2d42;
  border: 2px solid #3b3f5c;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
}

.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  background: #2a2d42;
  border: 2px solid #3b3f5c;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus { border-color: #6366f1; }
.form-group input::placeholder,
.form-group textarea::placeholder { color: #5a5e78; }

.genre-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.genre-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: #2a2d42;
  border: 2px solid #3b3f5c;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.genre-card:hover { border-color: #6366f1; background: #32355a; }
.genre-card.selected { border-color: #6366f1; background: #3b3f8c; }
.genre-icon { font-size: 28px; }
.genre-label { font-size: 13px; font-weight: 700; color: #e0e2f0; }

.mode-buttons {
  display: flex;
  gap: 14px;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 12px;
  background: #2a2d42;
  border: 3px solid #3b3f5c;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: #fff;
}

.mode-btn:hover { border-color: #6366f1; }
.mode-btn.active { border-color: #6366f1; background: #3b3f8c; }
.mode-icon { font-size: 36px; }
.mode-label { font-size: 20px; font-weight: 800; }
.mode-desc { font-size: 12px; color: #b0b4c8; }

.setup-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  flex: 1;
  padding: 14px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary:hover { background: #4338ca; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ai {
  flex: 1;
  padding: 14px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-ai:hover { background: #15803d; }
.btn-ai:disabled { opacity: 0.4; cursor: not-allowed; }

/* EDITOR PAGE */
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: #232538;
  border-bottom: 1px solid #2a2d42;
  flex-wrap: wrap;
}

.editor-title {
  font-size: 16px;
  font-weight: 700;
  color: #eef0ff;
}

.editor-mode-tag {
  background: #4f46e5;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 4px;
}

.editor-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.btn-small {
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
}

.btn-test { background: #16a34a; }
.btn-save { background: #2563eb; }
.btn-publish { background: #9333ea; }
.btn-ai-help { background: #d97706; }
.btn-restart { background: #4f46e5; }
.btn-delete { background: #dc2626; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; margin-top: 8px; width: 100%; }

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Palette */
.palette-panel {
  width: 90px;
  background: #232538;
  border-right: 1px solid #2a2d42;
  padding: 8px;
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  font-weight: 800;
  color: #7a7e98;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  text-align: center;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
  margin-bottom: 2px;
}

.palette-item:hover { background: #2f3250; }
.palette-item.selected { background: #4f46e5; }
.palette-icon { font-size: 22px; }
.palette-label { font-size: 9px; font-weight: 700; color: #b0b4c8; }
.palette-item.selected .palette-label { color: #fff; }
.palette-divider { height: 1px; background: #2a2d42; margin: 8px 0; }

/* Canvas */
.canvas-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.game-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  user-select: none;
  -webkit-user-select: none;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line-v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.grid-line-h {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.canvas-object {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  box-sizing: border-box;
  transition: outline 0.1s;
}

.canvas-object.selected {
  outline: 2px solid #fbbf24;
  outline-offset: 1px;
  z-index: 10;
}

.obj-icon {
  font-size: 20px;
  pointer-events: none;
}

.three-canvas-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.score-display {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  margin-left: auto;
}

.canvas-info {
  padding: 4px 12px;
  background: #1a1c2e;
  font-size: 11px;
  color: #5a5e78;
}

/* Properties */
.props-panel {
  width: 200px;
  background: #232538;
  border-left: 1px solid #2a2d42;
  padding: 10px;
  overflow-y: auto;
  flex-shrink: 0;
}

.prop-section {
  margin-bottom: 16px;
}

.prop-heading {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #eef0ff;
}

.prop-hint {
  color: #5a5e78;
  font-size: 13px;
  margin: 0;
}

.prop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.prop-row label {
  font-size: 12px;
  color: #b0b4c8;
  min-width: 55px;
}

.prop-row input[type="color"] {
  width: 32px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.prop-row select,
.prop-row input[type="text"] {
  flex: 1;
  padding: 5px 8px;
  background: #2a2d42;
  border: 1px solid #3b3f5c;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  outline: none;
}

.prop-row input[type="range"] {
  flex: 1;
}

.prop-val {
  font-size: 12px;
  color: #7a7e98;
  min-width: 20px;
}

/* TEST PAGE */
.test-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.test-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: #232538;
  border-bottom: 1px solid #2a2d42;
}

.test-title {
  font-size: 16px;
  font-weight: 700;
  color: #eef0ff;
  flex: 1;
}

.test-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.play-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.game-over-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.game-over-box {
  background: #232538;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-over-box h2 {
  font-size: 28px;
  margin: 0;
}

.game-over-box p {
  font-size: 18px;
  color: #b0b4c8;
  margin: 0;
}

.test-controls {
  padding: 8px;
  background: #232538;
  text-align: center;
}

.touch-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 4px;
}

.touch-btn {
  width: 56px;
  height: 56px;
  font-size: 24px;
  background: #3b3f5c;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  user-select: none;
  -webkit-user-select: none;
}

.touch-btn:active { background: #4f46e5; }

.controls-hint {
  font-size: 11px;
  color: #5a5e78;
  margin: 0;
}

/* TOAST */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  z-index: 100;
  animation: toastIn 0.3s ease;
}

.toast.success { background: #16a34a; color: #fff; }
.toast.error { background: #dc2626; color: #fff; }

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* MOBILE */
@media (max-width: 700px) {
  .editor-layout { flex-direction: column; }
  .palette-panel {
    width: 100%;
    flex-direction: row;
    display: flex;
    overflow-x: auto;
    padding: 4px 8px;
    gap: 2px;
    border-right: none;
    border-bottom: 1px solid #2a2d42;
  }
  .palette-panel .panel-title { display: none; }
  .palette-divider { display: none; }
  .palette-item { flex-direction: row; padding: 6px 10px; gap: 4px; }
  .props-panel { width: 100%; max-height: 180px; border-left: none; border-top: 1px solid #2a2d42; }
  .genre-grid { grid-template-columns: repeat(2, 1fr); }
  .setup-actions { flex-direction: column; }
}
</style>
