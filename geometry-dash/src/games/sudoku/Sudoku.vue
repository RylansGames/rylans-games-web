<template>
  <div class="sudoku-app">
    <!-- Menu -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-icon">🧩</div>
        <h1 class="menu-title">Sudoku</h1>
        <p class="menu-sub">10,000 puzzles to solve!</p>
        <div class="stats-row" v-if="totalSolved > 0">
          <div class="stat">🏆 {{ totalSolved }} Solved</div>
          <div class="stat">⭐ Best: {{ bestTime > 0 ? formatTime(bestTime) : '--' }}</div>
        </div>
        <div class="difficulty-pick">
          <h3>Pick Difficulty</h3>
          <div class="diff-buttons">
            <button class="diff-btn easy" @click="startGame('easy')">
              <span class="diff-label">Easy</span>
              <span class="diff-desc">Great for beginners</span>
              <span class="diff-count">{{ getLevelRange('easy') }}</span>
            </button>
            <button class="diff-btn medium" @click="startGame('medium')">
              <span class="diff-label">Medium</span>
              <span class="diff-desc">A good challenge</span>
              <span class="diff-count">{{ getLevelRange('medium') }}</span>
            </button>
            <button class="diff-btn hard" @click="startGame('hard')">
              <span class="diff-label">Hard</span>
              <span class="diff-desc">For experts</span>
              <span class="diff-count">{{ getLevelRange('hard') }}</span>
            </button>
            <button class="diff-btn expert" @click="startGame('expert')">
              <span class="diff-label">Expert</span>
              <span class="diff-desc">Brain melter</span>
              <span class="diff-count">{{ getLevelRange('expert') }}</span>
            </button>
          </div>
        </div>
        <!-- Level select -->
        <div class="level-select">
          <h3>Or pick a level</h3>
          <div class="level-input-row">
            <input v-model.number="selectedLevel" type="number" min="1" max="10000" class="level-input" placeholder="1-10000" />
            <button class="level-go" @click="startLevel(selectedLevel)" :disabled="!selectedLevel || selectedLevel < 1 || selectedLevel > 10000">Go</button>
          </div>
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Game -->
    <div v-if="screen === 'game'" class="game-screen">
      <div class="game-header">
        <button class="hdr-btn" @click="screen = 'menu'">← Menu</button>
        <div class="game-info">
          <span class="level-badge">Level {{ currentLevel }}</span>
          <span class="diff-badge" :class="difficulty">{{ difficulty }}</span>
        </div>
        <div class="timer">⏱️ {{ formatTime(timer) }}</div>
      </div>

      <!-- Mistakes -->
      <div class="mistakes-bar">
        Mistakes: <span :class="{ danger: mistakes >= 3 }">{{ mistakes }}/3</span>
        <button class="hint-btn" @click="useHint" :disabled="hints <= 0">💡 Hint ({{ hints }})</button>
      </div>

      <!-- Board -->
      <div class="board">
        <div v-for="(row, r) in board" :key="r" class="board-row">
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="cell"
            :class="{
              selected: selectedRow === r && selectedCol === c,
              sameRow: selectedRow === r || selectedCol === c,
              sameBox: sameBox(r, c),
              sameNum: cell.value && cell.value === selectedNum,
              given: cell.given,
              wrong: cell.wrong,
              right3: (c + 1) % 3 === 0 && c < 8,
              bottom3: (r + 1) % 3 === 0 && r < 8,
            }"
            @click="selectCell(r, c)"
          >
            <span v-if="cell.value" class="cell-value">{{ cell.value }}</span>
            <div v-else-if="cell.notes.length > 0" class="cell-notes">
              <span v-for="n in cell.notes" :key="n" class="note">{{ n }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Number pad -->
      <div class="numpad">
        <button
          v-for="n in 9"
          :key="n"
          class="num-btn"
          :class="{ exhausted: isExhausted(n) }"
          @click="enterNumber(n)"
        >
          {{ n }}
        </button>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button class="ctrl-btn" @click="eraseCell">🗑️ Erase</button>
        <button class="ctrl-btn" :class="{ active: noteMode }" @click="noteMode = !noteMode">📝 Notes {{ noteMode ? 'ON' : 'OFF' }}</button>
        <button class="ctrl-btn" @click="undoMove" :disabled="undoStack.length === 0">↩️ Undo</button>
      </div>

      <!-- Win screen -->
      <div v-if="showWin" class="win-overlay">
        <div class="win-card">
          <div class="win-icon">🎉</div>
          <h2>Puzzle Complete!</h2>
          <div class="win-stats">
            <div class="win-stat">⏱️ {{ formatTime(timer) }}</div>
            <div class="win-stat">❌ {{ mistakes }} mistakes</div>
            <div class="win-stat">💡 {{ 3 - hints }} hints used</div>
          </div>
          <div class="win-stars">
            <span v-for="i in starRating" :key="'s'+i">⭐</span>
            <span v-for="i in (3 - starRating)" :key="'e'+i">☆</span>
          </div>
          <div class="win-actions">
            <button class="win-btn next" @click="nextPuzzle">Next Puzzle →</button>
            <button class="win-btn menu" @click="screen = 'menu'">Menu</button>
          </div>
        </div>
      </div>

      <!-- Game Over -->
      <div v-if="showGameOver" class="win-overlay">
        <div class="win-card gameover">
          <div class="win-icon">😔</div>
          <h2>Too Many Mistakes!</h2>
          <p>You made 3 mistakes. Try again!</p>
          <div class="win-actions">
            <button class="win-btn next" @click="restartLevel">Try Again</button>
            <button class="win-btn menu" @click="screen = 'menu'">Menu</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

interface Cell {
  value: number
  given: boolean
  wrong: boolean
  notes: number[]
}

const screen = ref<'menu' | 'game'>('menu')
const difficulty = ref<Difficulty>('easy')
const currentLevel = ref(1)
const selectedLevel = ref<number | null>(null)
const selectedRow = ref(-1)
const selectedCol = ref(-1)
const noteMode = ref(false)
const mistakes = ref(0)
const hints = ref(3)
const timer = ref(0)
const showWin = ref(false)
const showGameOver = ref(false)
const totalSolved = ref(0)
const bestTime = ref(0)

const board = ref<Cell[][]>([])
let solution: number[][] = []
let timerInterval: number | null = null
const undoStack = ref<{ r: number; c: number; oldValue: number; oldNotes: number[] }[]>([])

const selectedNum = computed(() => {
  if (selectedRow.value < 0 || selectedCol.value < 0) return 0
  return board.value[selectedRow.value]?.[selectedCol.value]?.value || 0
})

const starRating = computed(() => {
  if (mistakes.value === 0 && hints.value === 3) return 3
  if (mistakes.value <= 1) return 2
  return 1
})

function getLevelRange(diff: Difficulty): string {
  const ranges: Record<Difficulty, string> = {
    easy: 'Levels 1-2500',
    medium: 'Levels 2501-5000',
    hard: 'Levels 5001-7500',
    expert: 'Levels 7501-10000',
  }
  return ranges[diff]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ========== PUZZLE GENERATION ==========
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function generateSolution(seed: number): number[][] {
  const rand = seededRandom(seed)
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))

  function isValid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false
    }
    const boxR = Math.floor(row / 3) * 3
    const boxC = Math.floor(col / 3) * 3
    for (let r = boxR; r < boxR + 3; r++) {
      for (let c = boxC; c < boxC + 3; c++) {
        if (grid[r][c] === num) return false
      }
    }
    return true
  }

  function fillGrid(grid: number[][]): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const nums = [1,2,3,4,5,6,7,8,9]
          // Shuffle using seeded random
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1))
            ;[nums[i], nums[j]] = [nums[j], nums[i]]
          }
          for (const num of nums) {
            if (isValid(grid, r, c, num)) {
              grid[r][c] = num
              if (fillGrid(grid)) return true
              grid[r][c] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  fillGrid(grid)
  return grid
}

function generatePuzzle(level: number): { puzzle: number[][]; solution: number[][] } {
  const sol = generateSolution(level * 7919 + 1234567)

  // Determine difficulty based on level
  let removals: number
  if (level <= 2500) removals = 30 + Math.floor((level / 2500) * 10) // 30-40 removed (easy)
  else if (level <= 5000) removals = 40 + Math.floor(((level - 2500) / 2500) * 8) // 40-48 removed
  else if (level <= 7500) removals = 48 + Math.floor(((level - 5000) / 2500) * 6) // 48-54 removed
  else removals = 54 + Math.floor(((level - 7500) / 2500) * 5) // 54-59 removed

  const puzzle = sol.map(row => [...row])
  const rand = seededRandom(level * 3571 + 9876543)

  const positions: [number, number][] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c])
    }
  }
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  for (let i = 0; i < removals && i < positions.length; i++) {
    const [r, c] = positions[i]
    puzzle[r][c] = 0
  }

  return { puzzle, solution: sol }
}

// ========== GAME ==========
function startGame(diff: Difficulty) {
  difficulty.value = diff
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [1, 2500], medium: [2501, 5000], hard: [5001, 7500], expert: [7501, 10000],
  }
  const [min, max] = ranges[diff]
  // Pick next unsolved or random
  const solved = getSolvedLevels()
  let level = min
  for (let l = min; l <= max; l++) {
    if (!solved.includes(l)) { level = l; break }
  }
  startLevel(level)
}

function startLevel(level: number | null) {
  if (!level || level < 1 || level > 1000) return
  currentLevel.value = level

  // Set difficulty based on level
  if (level <= 2500) difficulty.value = 'easy'
  else if (level <= 5000) difficulty.value = 'medium'
  else if (level <= 7500) difficulty.value = 'hard'
  else difficulty.value = 'expert'

  const { puzzle, solution: sol } = generatePuzzle(level)
  solution = sol

  board.value = puzzle.map(row =>
    row.map(val => ({
      value: val,
      given: val !== 0,
      wrong: false,
      notes: [],
    }))
  )

  selectedRow.value = -1
  selectedCol.value = -1
  mistakes.value = 0
  hints.value = 3
  timer.value = 0
  noteMode.value = false
  showWin.value = false
  showGameOver.value = false
  undoStack.value = []
  screen.value = 'game'

  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => { timer.value++ }, 1000) as unknown as number
}

function restartLevel() {
  startLevel(currentLevel.value)
}

function nextPuzzle() {
  const next = currentLevel.value < 10000 ? currentLevel.value + 1 : 1
  startLevel(next)
}

function selectCell(r: number, c: number) {
  selectedRow.value = r
  selectedCol.value = c
}

function sameBox(r: number, c: number): boolean {
  if (selectedRow.value < 0) return false
  return Math.floor(r / 3) === Math.floor(selectedRow.value / 3) &&
    Math.floor(c / 3) === Math.floor(selectedCol.value / 3)
}

function enterNumber(n: number) {
  if (selectedRow.value < 0 || selectedCol.value < 0) return
  const cell = board.value[selectedRow.value][selectedCol.value]
  if (cell.given) return

  if (noteMode.value) {
    // Toggle note
    const idx = cell.notes.indexOf(n)
    if (idx >= 0) cell.notes.splice(idx, 1)
    else cell.notes.push(n)
    cell.notes.sort()
    return
  }

  // Save undo
  undoStack.value.push({
    r: selectedRow.value, c: selectedCol.value,
    oldValue: cell.value, oldNotes: [...cell.notes],
  })

  cell.notes = []
  cell.value = n

  // Check if correct
  if (n !== solution[selectedRow.value][selectedCol.value]) {
    cell.wrong = true
    mistakes.value++
    if (mistakes.value >= 3) {
      showGameOver.value = true
      if (timerInterval) clearInterval(timerInterval)
    }
  } else {
    cell.wrong = false
    // Remove this number from notes in same row/col/box
    removeNotesFor(selectedRow.value, selectedCol.value, n)
    // Check win
    checkWin()
  }
}

function removeNotesFor(row: number, col: number, num: number) {
  for (let i = 0; i < 9; i++) {
    const idx1 = board.value[row][i].notes.indexOf(num)
    if (idx1 >= 0) board.value[row][i].notes.splice(idx1, 1)
    const idx2 = board.value[i][col].notes.indexOf(num)
    if (idx2 >= 0) board.value[i][col].notes.splice(idx2, 1)
  }
  const boxR = Math.floor(row / 3) * 3
  const boxC = Math.floor(col / 3) * 3
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) {
      const idx = board.value[r][c].notes.indexOf(num)
      if (idx >= 0) board.value[r][c].notes.splice(idx, 1)
    }
  }
}

function eraseCell() {
  if (selectedRow.value < 0 || selectedCol.value < 0) return
  const cell = board.value[selectedRow.value][selectedCol.value]
  if (cell.given) return
  undoStack.value.push({
    r: selectedRow.value, c: selectedCol.value,
    oldValue: cell.value, oldNotes: [...cell.notes],
  })
  cell.value = 0
  cell.wrong = false
  cell.notes = []
}

function undoMove() {
  const move = undoStack.value.pop()
  if (!move) return
  const cell = board.value[move.r][move.c]
  cell.value = move.oldValue
  cell.notes = move.oldNotes
  cell.wrong = false
}

function useHint() {
  if (hints.value <= 0) return
  // Find an empty cell and fill it
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.value[r][c].value === 0) {
        board.value[r][c].value = solution[r][c]
        board.value[r][c].given = false
        board.value[r][c].wrong = false
        board.value[r][c].notes = []
        removeNotesFor(r, c, solution[r][c])
        hints.value--
        checkWin()
        return
      }
    }
  }
}

function isExhausted(n: number): boolean {
  let count = 0
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.value === n) count++
    }
  }
  return count >= 9
}

function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.value[r][c].value !== solution[r][c]) return
    }
  }
  // WIN!
  if (timerInterval) clearInterval(timerInterval)
  showWin.value = true
  totalSolved.value++
  if (bestTime.value === 0 || timer.value < bestTime.value) bestTime.value = timer.value
  saveSolvedLevel(currentLevel.value)
  saveStats()
}

// ========== SAVE/LOAD ==========
function getSolvedLevels(): number[] {
  const saved = localStorage.getItem('sudokuSolved')
  return saved ? JSON.parse(saved) : []
}

function saveSolvedLevel(level: number) {
  const solved = getSolvedLevels()
  if (!solved.includes(level)) {
    solved.push(level)
    localStorage.setItem('sudokuSolved', JSON.stringify(solved))
  }
}

function saveStats() {
  localStorage.setItem('sudokuStats', JSON.stringify({
    totalSolved: totalSolved.value,
    bestTime: bestTime.value,
  }))
}

function loadStats() {
  const saved = localStorage.getItem('sudokuStats')
  if (saved) {
    const d = JSON.parse(saved)
    totalSolved.value = d.totalSolved || 0
    bestTime.value = d.bestTime || 0
  }
}

// Keyboard input
function onKeyDown(e: KeyboardEvent) {
  const n = parseInt(e.key)
  if (n >= 1 && n <= 9) enterNumber(n)
  if (e.code === 'Backspace' || e.code === 'Delete') eraseCell()
  if (e.code === 'KeyN') noteMode.value = !noteMode.value
  if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) undoMove()
  if (e.code === 'ArrowUp' && selectedRow.value > 0) selectedRow.value--
  if (e.code === 'ArrowDown' && selectedRow.value < 8) selectedRow.value++
  if (e.code === 'ArrowLeft' && selectedCol.value > 0) selectedCol.value--
  if (e.code === 'ArrowRight' && selectedCol.value < 8) selectedCol.value++
}

onMounted(() => {
  loadStats()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.sudoku-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* Menu */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #1a2744);
}
.menu-card {
  background: #111827; border-radius: 24px; padding: 36px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid #1f2937; max-width: 440px; width: 95%;
}
.menu-icon { font-size: 64px; }
.menu-title { color: #fff; font-size: 36px; font-weight: 900; margin: 8px 0 4px; }
.menu-sub { color: #94a3b8; font-size: 16px; margin: 0 0 20px; }
.stats-row { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
.stat { color: #fbbf24; font-size: 15px; font-weight: 700; background: rgba(251,191,36,0.1); padding: 6px 14px; border-radius: 8px; }

.difficulty-pick h3 { color: #fff; font-size: 16px; margin: 0 0 10px; }
.diff-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.diff-btn {
  display: flex; flex-direction: column; gap: 2px; padding: 14px; border-radius: 14px;
  border: 2px solid #1f2937; background: #0f172a; cursor: pointer; text-align: left;
  transition: all 0.15s;
}
.diff-btn:hover { border-color: #374151; transform: translateY(-2px); }
.diff-label { font-size: 16px; font-weight: 800; }
.diff-desc { font-size: 11px; color: #94a3b8; }
.diff-count { font-size: 10px; color: #666; margin-top: 2px; }
.diff-btn.easy .diff-label { color: #4ade80; }
.diff-btn.easy:hover { border-color: #4ade80; }
.diff-btn.medium .diff-label { color: #fbbf24; }
.diff-btn.medium:hover { border-color: #fbbf24; }
.diff-btn.hard .diff-label { color: #f97316; }
.diff-btn.hard:hover { border-color: #f97316; }
.diff-btn.expert .diff-label { color: #ef4444; }
.diff-btn.expert:hover { border-color: #ef4444; }

.level-select h3 { color: #fff; font-size: 14px; margin: 0 0 8px; }
.level-input-row { display: flex; gap: 8px; justify-content: center; }
.level-input {
  width: 100px; padding: 8px 12px; border-radius: 10px; border: 1px solid #333;
  background: #0f172a; color: #fff; font-size: 16px; text-align: center; outline: none;
}
.level-input:focus { border-color: #3b82f6; }
.level-go {
  padding: 8px 20px; border-radius: 10px; border: none; background: #3b82f6;
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
}
.level-go:disabled { opacity: 0.4; }
.back-link { display: block; margin-top: 16px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Game */
.game-screen {
  min-height: 100vh; background: #0f172a; display: flex; flex-direction: column;
  align-items: center; padding: 12px;
}

.game-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; max-width: 400px; margin-bottom: 8px;
}
.hdr-btn { background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer; font-weight: 600; }
.hdr-btn:hover { color: #fff; }
.game-info { display: flex; gap: 8px; align-items: center; }
.level-badge { color: #fff; font-size: 14px; font-weight: 700; }
.diff-badge {
  padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase;
}
.diff-badge.easy { background: rgba(74,222,128,0.2); color: #4ade80; }
.diff-badge.medium { background: rgba(251,191,36,0.2); color: #fbbf24; }
.diff-badge.hard { background: rgba(249,115,22,0.2); color: #f97316; }
.diff-badge.expert { background: rgba(239,68,68,0.2); color: #ef4444; }
.timer { color: #94a3b8; font-size: 14px; font-weight: 600; }

.mistakes-bar {
  width: 100%; max-width: 400px; display: flex; align-items: center; justify-content: space-between;
  color: #94a3b8; font-size: 13px; font-weight: 600; margin-bottom: 10px;
}
.mistakes-bar .danger { color: #ef4444; }
.hint-btn {
  background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3);
  padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
}
.hint-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Board */
.board {
  display: flex; flex-direction: column; border: 3px solid #4b5563;
  border-radius: 6px; overflow: hidden; background: #1e293b;
}
.board-row { display: flex; }
.cell {
  width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #334155; cursor: pointer; position: relative;
  font-size: 20px; font-weight: 700; transition: background 0.1s;
}
.cell:hover { background: rgba(59,130,246,0.1); }
.cell.selected { background: rgba(59,130,246,0.3); }
.cell.sameRow, .cell.sameBox { background: rgba(59,130,246,0.08); }
.cell.sameNum { background: rgba(59,130,246,0.2); }
.cell.given .cell-value { color: #e2e8f0; }
.cell .cell-value { color: #60a5fa; }
.cell.wrong .cell-value { color: #ef4444; }
.cell.right3 { border-right: 2px solid #4b5563; }
.cell.bottom3 { border-bottom: 2px solid #4b5563; }

.cell-notes {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
  width: 100%; height: 100%; padding: 1px;
}
.note { font-size: 8px; color: #64748b; text-align: center; line-height: 12px; }

/* Numpad */
.numpad {
  display: flex; gap: 6px; margin: 12px 0; flex-wrap: wrap; justify-content: center;
  max-width: 400px;
}
.num-btn {
  width: 40px; height: 40px; border-radius: 10px; border: none;
  background: #1e293b; color: #60a5fa; font-size: 20px; font-weight: 800;
  cursor: pointer; transition: all 0.1s; border: 2px solid #334155;
}
.num-btn:hover { background: #334155; }
.num-btn:active { transform: scale(0.95); }
.num-btn.exhausted { opacity: 0.2; pointer-events: none; }

/* Controls */
.controls { display: flex; gap: 8px; }
.ctrl-btn {
  padding: 8px 14px; border-radius: 10px; border: 1px solid #334155;
  background: #1e293b; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer;
}
.ctrl-btn:hover { background: #334155; color: #fff; }
.ctrl-btn:disabled { opacity: 0.3; }
.ctrl-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* Win */
.win-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 30;
}
.win-card {
  background: #111827; border-radius: 24px; padding: 32px; text-align: center;
  border: 3px solid #22c55e; max-width: 360px; width: 90%;
  animation: pop-in 0.4s ease-out;
}
.win-card.gameover { border-color: #ef4444; }
@keyframes pop-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.win-icon { font-size: 56px; margin-bottom: 8px; }
.win-card h2 { color: #fff; font-size: 24px; margin: 0 0 14px; }
.win-card p { color: #94a3b8; font-size: 15px; margin: 0 0 16px; }
.win-stats { display: flex; gap: 12px; justify-content: center; margin-bottom: 12px; }
.win-stat { background: #1e293b; padding: 6px 12px; border-radius: 8px; color: #94a3b8; font-size: 13px; font-weight: 600; }
.win-stars { font-size: 28px; margin-bottom: 16px; }
.win-actions { display: flex; gap: 10px; justify-content: center; }
.win-btn {
  padding: 10px 24px; border-radius: 12px; border: none; font-size: 15px;
  font-weight: 700; cursor: pointer;
}
.win-btn.next { background: #22c55e; color: #fff; }
.win-btn.menu { background: #334155; color: #fff; }

@media (max-width: 420px) {
  .cell { width: 36px; height: 36px; font-size: 17px; }
  .num-btn { width: 36px; height: 36px; font-size: 18px; }
}
</style>
