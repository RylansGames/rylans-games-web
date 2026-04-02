<template>
  <div class="bc-app">
    <!-- Level Select Screen -->
    <div v-if="screen === 'select'" class="select-screen">
      <div class="select-card">
        <div class="select-icon">🧩</div>
        <h1 class="select-title">Block Coder</h1>
        <p class="select-sub">Drag blocks to guide your character to the star!</p>
        <div class="level-grid">
          <div
            v-for="(lvl, i) in levels"
            :key="i"
            class="level-btn"
            :class="{ completed: completedLevels.includes(i), locked: isLevelLocked(i) }"
            @click="startLevel(i)"
          >
            <span class="level-num">{{ i + 1 }}</span>
            <span class="level-name">{{ lvl.name }}</span>
            <span v-if="completedLevels.includes(i)" class="level-star">⭐</span>
            <span v-if="isLevelLocked(i)" class="level-lock">🔒</span>
          </div>
        </div>
        <button class="back-link" @click="$router.push('/')">Back to Games</button>
      </div>
    </div>

    <!-- Puzzle Screen -->
    <div v-if="screen === 'puzzle'" class="puzzle-screen">
      <!-- Top bar -->
      <div class="top-bar">
        <button class="top-btn" @click="screen = 'select'">Levels</button>
        <span class="top-level">Level {{ currentLevel + 1 }}: {{ currentLevelData.name }}</span>
        <span class="top-hint">{{ currentLevelData.hint }}</span>
      </div>

      <div class="puzzle-layout">
        <!-- Block Toolbox (left) -->
        <div class="toolbox">
          <h3 class="toolbox-title">Blocks</h3>
          <div
            v-for="block in availableBlocks"
            :key="block.type"
            class="block-item"
            :class="'block-' + block.color"
            :style="{ opacity: selectedToolboxBlock === block.type ? 0.5 : 1 }"
            draggable="true"
            @dragstart="onDragStart($event, block.type)"
            @click="onToolboxTap(block.type)"
          >
            <span class="block-icon">{{ block.icon }}</span>
            <span class="block-label">{{ block.label }}</span>
          </div>
          <div class="toolbox-tip" v-if="isTouchDevice">Tap a block, then tap workspace to place it</div>
          <div class="toolbox-tip" v-else>Drag blocks to the workspace</div>
        </div>

        <!-- Workspace (middle) -->
        <div class="workspace"
          @dragover.prevent="onDragOver"
          @drop="onDrop"
          @click="onWorkspaceTap"
        >
          <h3 class="ws-title">Your Program</h3>
          <div v-if="program.length === 0" class="ws-empty">
            {{ isTouchDevice ? 'Tap a block, then tap here!' : 'Drag blocks here!' }}
          </div>
          <div
            v-for="(inst, i) in program"
            :key="i"
            class="ws-block"
            :class="['block-' + getBlockColor(inst.type), { active: runIndex === i }]"
            :style="{ marginLeft: (inst.indent || 0) * 24 + 'px' }"
          >
            <span class="ws-block-icon">{{ getBlockIcon(inst.type) }}</span>
            <span class="ws-block-label">{{ getBlockLabel(inst) }}</span>
            <input
              v-if="inst.type === 'repeat'"
              type="number"
              class="repeat-input"
              v-model.number="inst.count"
              min="2"
              max="9"
              @click.stop
            />
            <button class="ws-remove" @click.stop="removeBlock(i)">✕</button>
          </div>
          <div class="ws-actions">
            <button class="action-btn run-btn" @click="runProgram" :disabled="isRunning || program.length === 0">
              {{ isRunning ? 'Running...' : '▶ Run' }}
            </button>
            <button class="action-btn clear-btn" @click="clearProgram" :disabled="isRunning">🗑 Clear</button>
            <button class="action-btn reset-btn" @click="resetPuzzle" :disabled="isRunning">↺ Reset</button>
          </div>
          <div v-if="runMessage" class="run-message" :class="runMessageType">{{ runMessage }}</div>
        </div>

        <!-- Grid (right) -->
        <div class="grid-area">
          <h3 class="grid-title">Puzzle</h3>
          <div class="grid-container" :style="gridStyle">
            <div
              v-for="(cell, ci) in gridCells"
              :key="ci"
              class="grid-cell"
              :class="{
                wall: cell === 'W',
                goal: cell === 'G',
                'player-cell': isPlayerCell(ci)
              }"
            >
              <span v-if="isPlayerCell(ci)" class="player-emoji">{{ playerDirectionEmoji }}</span>
              <span v-else-if="cell === 'G'" class="goal-emoji">⭐</span>
              <span v-else-if="cell === 'W'" class="wall-emoji">🧱</span>
            </div>
          </div>
          <div class="grid-legend">
            <span>{{ playerDirectionEmoji }} You</span>
            <span>⭐ Goal</span>
            <span>🧱 Wall</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Level Complete overlay -->
    <div v-if="showComplete" class="complete-overlay" @click="dismissComplete">
      <div class="complete-card" @click.stop>
        <div class="complete-icon">🎉</div>
        <h2>Level Complete!</h2>
        <p>You solved Level {{ currentLevel + 1 }}!</p>
        <p class="complete-blocks">Used {{ program.length }} blocks</p>
        <div class="complete-btns">
          <button class="step-btn ready" @click="goNextLevel" v-if="hasNextLevel">Next Level</button>
          <button class="step-btn ready" @click="screen = 'select'; showComplete = false">Level Select</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

// --- Types ---
interface Instruction {
  type: string
  count?: number
  indent?: number
}

interface Level {
  name: string
  hint: string
  cols: number
  rows: number
  grid: string[] // 'E' empty, 'W' wall, 'G' goal, 'S' start
  startDir: number // 0=up 1=right 2=down 3=left
  blocks: string[]
}

// --- State ---
const screen = ref<'select' | 'puzzle'>('select')
const currentLevel = ref(0)
const completedLevels = ref<number[]>([])
const program = ref<Instruction[]>([])
const isRunning = ref(false)
const runIndex = ref(-1)
const runMessage = ref('')
const runMessageType = ref('')
const showComplete = ref(false)
const selectedToolboxBlock = ref<string | null>(null)

// Player position and direction
const playerRow = ref(0)
const playerCol = ref(0)
const playerDir = ref(1) // 0=up 1=right 2=down 3=left

// Detect touch device
const isTouchDevice = ref(false)
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

// --- Levels ---
const levels: Level[] = [
  {
    name: 'First Steps',
    hint: 'Move forward to reach the star!',
    cols: 3, rows: 1,
    grid: ['S', 'E', 'G'],
    startDir: 1,
    blocks: ['forward']
  },
  {
    name: 'A Bit Further',
    hint: 'Move forward 4 times!',
    cols: 5, rows: 1,
    grid: ['S', 'E', 'E', 'E', 'G'],
    startDir: 1,
    blocks: ['forward']
  },
  {
    name: 'Turn Right',
    hint: 'Go forward, then turn and go forward again!',
    cols: 3, rows: 3,
    grid: [
      'E', 'E', 'E',
      'E', 'E', 'E',
      'S', 'E', 'G'
    ],
    startDir: 0,
    blocks: ['forward', 'turnRight']
  },
  {
    name: 'L Shape',
    hint: 'Make an L-shaped path!',
    cols: 3, rows: 3,
    grid: [
      'E', 'E', 'G',
      'E', 'E', 'E',
      'S', 'E', 'E'
    ],
    startDir: 0,
    blocks: ['forward', 'turnLeft', 'turnRight']
  },
  {
    name: 'Use Repeat',
    hint: 'Use the Repeat block to move forward many times!',
    cols: 7, rows: 1,
    grid: ['S', 'E', 'E', 'E', 'E', 'E', 'G'],
    startDir: 1,
    blocks: ['forward', 'repeat']
  },
  {
    name: 'Walls!',
    hint: 'Watch out for walls! Go around them.',
    cols: 4, rows: 3,
    grid: [
      'E', 'E', 'E', 'G',
      'E', 'W', 'W', 'E',
      'S', 'E', 'E', 'E'
    ],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight']
  },
  {
    name: 'Zigzag',
    hint: 'Zigzag through the maze!',
    cols: 5, rows: 5,
    grid: [
      'E', 'E', 'E', 'E', 'G',
      'E', 'W', 'W', 'W', 'E',
      'E', 'E', 'E', 'E', 'E',
      'E', 'W', 'W', 'W', 'E',
      'S', 'E', 'E', 'E', 'E'
    ],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight', 'repeat']
  },
  {
    name: 'If Wall',
    hint: 'Use If Wall Ahead to avoid walls automatically!',
    cols: 5, rows: 1,
    grid: ['S', 'E', 'W', 'E', 'G'],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight', 'ifWall']
  },
  {
    name: 'Spiral Path',
    hint: 'Spiral inward to reach the goal!',
    cols: 5, rows: 5,
    grid: [
      'S', 'E', 'E', 'E', 'E',
      'W', 'W', 'W', 'W', 'E',
      'E', 'E', 'E', 'E', 'E',
      'E', 'W', 'W', 'W', 'W',
      'E', 'E', 'G', 'E', 'E'
    ],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight', 'repeat']
  },
  {
    name: 'Maze Runner',
    hint: 'Navigate the maze using all your blocks!',
    cols: 5, rows: 5,
    grid: [
      'E', 'E', 'E', 'W', 'G',
      'E', 'W', 'E', 'W', 'E',
      'E', 'W', 'E', 'E', 'E',
      'E', 'W', 'W', 'W', 'E',
      'S', 'E', 'E', 'E', 'E'
    ],
    startDir: 0,
    blocks: ['forward', 'turnLeft', 'turnRight', 'repeat', 'ifWall']
  },
  {
    name: 'Twisty Corridor',
    hint: 'Follow the winding path!',
    cols: 7, rows: 5,
    grid: [
      'S', 'E', 'W', 'E', 'E', 'E', 'G',
      'W', 'E', 'W', 'E', 'W', 'W', 'E',
      'E', 'E', 'E', 'E', 'E', 'W', 'E',
      'E', 'W', 'W', 'W', 'E', 'E', 'E',
      'E', 'E', 'E', 'E', 'E', 'W', 'E'
    ],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight', 'repeat', 'ifWall']
  },
  {
    name: 'Grand Maze',
    hint: 'The ultimate challenge! Use everything you learned!',
    cols: 7, rows: 7,
    grid: [
      'S', 'E', 'E', 'W', 'E', 'E', 'E',
      'W', 'W', 'E', 'W', 'E', 'W', 'E',
      'E', 'E', 'E', 'E', 'E', 'W', 'E',
      'E', 'W', 'W', 'W', 'E', 'E', 'E',
      'E', 'E', 'E', 'W', 'W', 'W', 'E',
      'W', 'W', 'E', 'E', 'E', 'E', 'E',
      'E', 'E', 'E', 'W', 'E', 'W', 'G'
    ],
    startDir: 1,
    blocks: ['forward', 'turnLeft', 'turnRight', 'repeat', 'ifWall']
  }
]

// --- Block definitions ---
const blockDefs: Record<string, { label: string; icon: string; color: string }> = {
  forward: { label: 'Move Forward', icon: '⬆️', color: 'green' },
  turnLeft: { label: 'Turn Left', icon: '↩️', color: 'blue' },
  turnRight: { label: 'Turn Right', icon: '↪️', color: 'blue' },
  repeat: { label: 'Repeat', icon: '🔁', color: 'orange' },
  ifWall: { label: 'If Wall Ahead', icon: '🧱', color: 'purple' }
}

// --- Computed ---
const currentLevelData = computed(() => levels[currentLevel.value])

const availableBlocks = computed(() => {
  return currentLevelData.value.blocks.map(type => ({
    type,
    ...blockDefs[type]
  }))
})

const gridCells = computed(() => currentLevelData.value.grid)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${currentLevelData.value.cols}, 1fr)`,
  gridTemplateRows: `repeat(${currentLevelData.value.rows}, 1fr)`
}))

const playerDirectionEmoji = computed(() => {
  const emojis = ['😀', '😀', '😀', '😀'] // up right down left
  const arrows = ['⬆', '➡', '⬇', '⬅']
  return arrows[playerDir.value] || '➡'
})

const hasNextLevel = computed(() => currentLevel.value + 1 < levels.length)

// --- Helper functions ---
function isPlayerCell(cellIndex: number): boolean {
  const cols = currentLevelData.value.cols
  const r = Math.floor(cellIndex / cols)
  const c = cellIndex % cols
  return r === playerRow.value && c === playerCol.value
}

function getBlockColor(type: string): string {
  return blockDefs[type]?.color || 'green'
}

function getBlockIcon(type: string): string {
  return blockDefs[type]?.icon || '?'
}

function getBlockLabel(inst: Instruction): string {
  if (inst.type === 'repeat') return `Repeat ${inst.count || 3}x`
  if (inst.type === 'ifWall') return 'If Wall: Turn Right'
  return blockDefs[inst.type]?.label || inst.type
}

function isLevelLocked(index: number): boolean {
  if (index === 0) return false
  return !completedLevels.value.includes(index - 1)
}

// --- Level management ---
function startLevel(index: number) {
  if (isLevelLocked(index)) return
  currentLevel.value = index
  resetPuzzle()
  screen.value = 'puzzle'
}

function resetPuzzle() {
  const lvl = levels[currentLevel.value]
  const startIdx = lvl.grid.indexOf('S')
  playerRow.value = Math.floor(startIdx / lvl.cols)
  playerCol.value = startIdx % lvl.cols
  playerDir.value = lvl.startDir
  runMessage.value = ''
  runMessageType.value = ''
  runIndex.value = -1
  isRunning.value = false
}

function clearProgram() {
  program.value = []
  resetPuzzle()
}

function goNextLevel() {
  showComplete.value = false
  if (currentLevel.value + 1 < levels.length) {
    startLevel(currentLevel.value + 1)
  } else {
    screen.value = 'select'
  }
}

function dismissComplete() {
  showComplete.value = false
}

// --- Drag and Drop ---
let dragType = ''

function onDragStart(e: DragEvent, type: string) {
  dragType = type
  e.dataTransfer?.setData('text/plain', type)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const type = e.dataTransfer?.getData('text/plain') || dragType
  if (type && blockDefs[type]) {
    addBlock(type)
  }
  dragType = ''
}

// --- Touch support ---
function onToolboxTap(type: string) {
  if (!isTouchDevice.value) return
  selectedToolboxBlock.value = type
}

function onWorkspaceTap() {
  if (!isTouchDevice.value) return
  if (selectedToolboxBlock.value) {
    addBlock(selectedToolboxBlock.value)
    selectedToolboxBlock.value = null
  }
}

function addBlock(type: string) {
  const inst: Instruction = { type, indent: 0 }
  if (type === 'repeat') inst.count = 3
  // Items after repeat or ifWall get indented
  if (program.value.length > 0) {
    const last = program.value[program.value.length - 1]
    if (last.type === 'repeat' || last.type === 'ifWall') {
      inst.indent = (last.indent || 0) + 1
    } else {
      inst.indent = last.indent || 0
    }
  }
  program.value.push(inst)
}

function removeBlock(index: number) {
  program.value.splice(index, 1)
}

// --- Run program ---
function getCell(r: number, c: number): string {
  const lvl = currentLevelData.value
  if (r < 0 || r >= lvl.rows || c < 0 || c >= lvl.cols) return 'OUT'
  return lvl.grid[r * lvl.cols + c]
}

function dirOffset(dir: number): [number, number] {
  // 0=up 1=right 2=down 3=left
  const offsets: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]
  return offsets[dir]
}

function isWallAhead(): boolean {
  const [dr, dc] = dirOffset(playerDir.value)
  const nr = playerRow.value + dr
  const nc = playerCol.value + dc
  const cell = getCell(nr, nc)
  return cell === 'W' || cell === 'OUT'
}

async function runProgram() {
  if (isRunning.value || program.value.length === 0) return
  resetPuzzle()
  isRunning.value = true
  runMessage.value = ''

  // Flatten instructions (expand repeats)
  const flat: { type: string; originalIndex: number }[] = []
  let i = 0
  while (i < program.value.length) {
    const inst = program.value[i]
    if (inst.type === 'repeat') {
      const count = inst.count || 3
      // Collect indented blocks after this repeat
      const children: number[] = []
      let j = i + 1
      const baseIndent = inst.indent || 0
      while (j < program.value.length && (program.value[j].indent || 0) > baseIndent) {
        children.push(j)
        j++
      }
      if (children.length === 0) {
        // No children, skip
        i++
        continue
      }
      for (let rep = 0; rep < count; rep++) {
        for (const ci of children) {
          flat.push({ type: program.value[ci].type, originalIndex: ci })
        }
      }
      i = j
    } else if (inst.type === 'ifWall') {
      // If wall ahead, execute next indented block; otherwise skip
      const baseIndent = inst.indent || 0
      let j = i + 1
      const children: number[] = []
      while (j < program.value.length && (program.value[j].indent || 0) > baseIndent) {
        children.push(j)
        j++
      }
      flat.push({ type: 'ifWall', originalIndex: i })
      // Children will be conditionally executed
      for (const ci of children) {
        flat.push({ type: 'ifWall-child:' + program.value[ci].type, originalIndex: ci })
      }
      i = j
    } else {
      flat.push({ type: inst.type, originalIndex: i })
      i++
    }
  }

  // Execute flattened instructions step by step
  let stepCount = 0
  const maxSteps = 200
  let inIfWall = false
  let ifWallResult = false

  for (const step of flat) {
    if (stepCount++ > maxSteps) {
      runMessage.value = 'Too many steps! Try a shorter program.'
      runMessageType.value = 'error'
      isRunning.value = false
      return
    }

    runIndex.value = step.originalIndex
    await delay(350)

    if (step.type === 'ifWall') {
      ifWallResult = isWallAhead()
      inIfWall = true
      continue
    }

    let actionType = step.type
    if (step.type.startsWith('ifWall-child:')) {
      if (!inIfWall || !ifWallResult) {
        continue
      }
      actionType = step.type.replace('ifWall-child:', '')
    } else {
      inIfWall = false
    }

    if (actionType === 'forward') {
      const [dr, dc] = dirOffset(playerDir.value)
      const nr = playerRow.value + dr
      const nc = playerCol.value + dc
      const cell = getCell(nr, nc)
      if (cell === 'W' || cell === 'OUT') {
        runMessage.value = 'Oops! Hit a wall! Try again.'
        runMessageType.value = 'error'
        isRunning.value = false
        runIndex.value = -1
        return
      }
      playerRow.value = nr
      playerCol.value = nc
      if (cell === 'G') {
        runMessage.value = 'Level Complete!'
        runMessageType.value = 'success'
        isRunning.value = false
        runIndex.value = -1
        onLevelComplete()
        return
      }
    } else if (actionType === 'turnLeft') {
      playerDir.value = (playerDir.value + 3) % 4
    } else if (actionType === 'turnRight') {
      playerDir.value = (playerDir.value + 1) % 4
    }
  }

  // Check if on goal
  const lvl = currentLevelData.value
  const cellAtPlayer = getCell(playerRow.value, playerCol.value)
  if (cellAtPlayer === 'G') {
    runMessage.value = 'Level Complete!'
    runMessageType.value = 'success'
    onLevelComplete()
  } else {
    runMessage.value = 'Didn\'t reach the star. Try adding more blocks!'
    runMessageType.value = 'error'
  }
  isRunning.value = false
  runIndex.value = -1
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function onLevelComplete() {
  if (!completedLevels.value.includes(currentLevel.value)) {
    completedLevels.value.push(currentLevel.value)
    localStorage.setItem('bc-completed', JSON.stringify(completedLevels.value))
    gameState.addCoins(5)
  }
  showComplete.value = true
}

// --- Lifecycle ---
onMounted(() => {
  completedLevels.value = JSON.parse(localStorage.getItem('bc-completed') || '[]')
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Block Coder')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Block Coder')
  OnlineTracker.onAdminAction((action: any) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  OnlineTracker.goOffline()
})
</script>

<style scoped>
.bc-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #fff;
  font-family: 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

/* ---- Level Select ---- */
.select-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}
.select-card {
  background: rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  max-width: 700px;
  width: 100%;
}
.select-icon { font-size: 64px; }
.select-title { font-size: 36px; margin: 8px 0; }
.select-sub { color: #aaa; margin-bottom: 24px; font-size: 16px; }

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.level-btn {
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  position: relative;
}
.level-btn:hover:not(.locked) {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}
.level-btn.completed {
  border-color: #ffd700;
  background: rgba(255,215,0,0.1);
}
.level-btn.locked {
  opacity: 0.4;
  cursor: not-allowed;
}
.level-num {
  display: block;
  font-size: 28px;
  font-weight: bold;
}
.level-name {
  display: block;
  font-size: 12px;
  color: #ccc;
  margin-top: 4px;
}
.level-star {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 16px;
}
.level-lock {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 16px;
}

.back-link {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  margin-top: 12px;
}
.back-link:hover { color: #fff; }

/* ---- Top Bar ---- */
.top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.3);
  flex-wrap: wrap;
}
.top-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.top-btn:hover { background: rgba(255,255,255,0.2); }
.top-level { font-weight: bold; font-size: 16px; }
.top-hint { color: #aaa; font-size: 13px; }

/* ---- Puzzle Layout ---- */
.puzzle-layout {
  display: flex;
  gap: 12px;
  padding: 12px;
  height: calc(100vh - 52px);
  overflow: hidden;
}

/* ---- Toolbox ---- */
.toolbox {
  width: 160px;
  min-width: 140px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}
.toolbox-title {
  margin: 0 0 4px;
  font-size: 15px;
  text-align: center;
}
.block-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: grab;
  font-size: 13px;
  font-weight: 600;
  user-select: none;
  transition: transform 0.15s;
}
.block-item:hover { transform: scale(1.05); }
.block-item:active { cursor: grabbing; }
.block-icon { font-size: 18px; }

.block-green { background: #2ecc40; color: #fff; }
.block-blue { background: #3498db; color: #fff; }
.block-orange { background: #ff851b; color: #fff; }
.block-purple { background: #9b59b6; color: #fff; }

.toolbox-tip {
  font-size: 11px;
  color: #888;
  text-align: center;
  margin-top: auto;
  padding-top: 8px;
}

/* ---- Workspace ---- */
.workspace {
  flex: 1;
  min-width: 200px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  border: 2px dashed rgba(255,255,255,0.15);
}
.ws-title {
  margin: 0 0 4px;
  font-size: 15px;
  text-align: center;
}
.ws-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 15px;
  min-height: 100px;
}
.ws-block {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  position: relative;
  transition: all 0.2s;
}
.ws-block.active {
  box-shadow: 0 0 12px rgba(255,255,255,0.5);
  transform: scale(1.05);
}
.ws-block-icon { font-size: 16px; }
.repeat-input {
  width: 36px;
  padding: 2px 4px;
  border: none;
  border-radius: 4px;
  background: rgba(0,0,0,0.3);
  color: #fff;
  font-size: 13px;
  text-align: center;
  font-weight: bold;
}
.ws-remove {
  margin-left: auto;
  background: rgba(0,0,0,0.3);
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}
.ws-remove:hover { opacity: 1; background: #e74c3c; }

.ws-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  flex-wrap: wrap;
}
.action-btn {
  flex: 1;
  min-width: 70px;
  padding: 10px 8px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.run-btn { background: #2ecc40; color: #fff; }
.run-btn:hover:not(:disabled) { background: #27ae60; }
.clear-btn { background: #e74c3c; color: #fff; }
.clear-btn:hover:not(:disabled) { background: #c0392b; }
.reset-btn { background: #3498db; color: #fff; }
.reset-btn:hover:not(:disabled) { background: #2980b9; }

.run-message {
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
}
.run-message.success { background: rgba(46,204,64,0.2); color: #2ecc40; }
.run-message.error { background: rgba(231,76,60,0.2); color: #e74c3c; }

/* ---- Grid Area ---- */
.grid-area {
  width: 320px;
  min-width: 200px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.grid-title {
  margin: 0 0 8px;
  font-size: 15px;
  text-align: center;
}
.grid-container {
  display: grid;
  gap: 2px;
  flex: 1;
  max-height: calc(100vh - 160px);
}
.grid-cell {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  transition: all 0.3s;
}
.grid-cell.wall {
  background: rgba(139,69,19,0.5);
}
.grid-cell.goal {
  background: rgba(255,215,0,0.15);
}
.grid-cell.player-cell {
  background: rgba(46,204,64,0.25);
}
.player-emoji { font-size: 22px; }
.goal-emoji { font-size: 22px; }
.wall-emoji { font-size: 20px; }

.grid-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #aaa;
}

/* ---- Complete Overlay ---- */
.complete-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.complete-card {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
}
.complete-icon { font-size: 64px; }
.complete-card h2 { color: #ffd700; margin: 8px 0; font-size: 28px; }
.complete-blocks { color: #aaa; font-size: 14px; }
.complete-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
  flex-wrap: wrap;
}
.step-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.step-btn.ready {
  background: linear-gradient(135deg, #2ecc40, #27ae60);
  color: #fff;
}
.step-btn:hover { transform: scale(1.05); }

/* ---- Mobile ---- */
@media (max-width: 768px) {
  .puzzle-layout {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 52px);
  }
  .toolbox {
    width: 100%;
    min-width: unset;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px;
    gap: 6px;
  }
  .toolbox-title { display: none; }
  .block-item { padding: 8px 10px; font-size: 12px; }
  .toolbox-tip { display: none; }
  .workspace {
    min-height: 200px;
    border: 2px dashed rgba(255,255,255,0.2);
  }
  .grid-area {
    width: 100%;
    min-width: unset;
  }
  .grid-container {
    max-height: 300px;
  }
  .grid-cell { font-size: 18px; }
  .player-emoji, .goal-emoji { font-size: 16px; }
  .wall-emoji { font-size: 14px; }
  .level-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .top-bar { gap: 8px; }
  .top-hint { display: none; }
}
</style>
