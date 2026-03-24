<template>
  <div class="editor-container">
    <div class="editor-header">
      <button class="back-btn" @click="$emit('back')">← Back</button>
      <input
        v-model="levelName"
        class="level-name-input"
        placeholder="Name your level..."
        maxlength="30"
      />
    </div>

    <!-- Block Palette -->
    <div class="palette">
      <button
        v-for="block in BLOCK_TYPES"
        :key="block.id"
        class="palette-btn"
        :class="{ active: selectedTool === block.id }"
        :style="{ borderColor: selectedTool === block.id ? block.color : 'transparent' }"
        @click="selectedTool = block.id"
      >
        <span class="palette-emoji">{{ block.emoji }}</span>
        <span class="palette-label">{{ block.label }}</span>
      </button>
      <button
        class="palette-btn"
        :class="{ active: selectedTool === 'start' }"
        @click="selectedTool = 'start'"
      >
        <span class="palette-emoji">🏁</span>
        <span class="palette-label">Start</span>
      </button>
      <button
        class="palette-btn"
        :class="{ active: selectedTool === 'end' }"
        @click="selectedTool = 'end'"
      >
        <span class="palette-emoji">⭐</span>
        <span class="palette-label">Goal</span>
      </button>
      <button
        class="palette-btn"
        :class="{ active: selectedTool === 'eraser' }"
        @click="selectedTool = 'eraser'"
      >
        <span class="palette-emoji">🧹</span>
        <span class="palette-label">Erase</span>
      </button>
    </div>

    <!-- Grid -->
    <div class="grid-wrapper">
      <div
        class="editor-grid"
        :style="{ gridTemplateColumns: `repeat(${gridWidth}, 1fr)` }"
        @touchmove.prevent="handleTouchMove"
      >
        <div
          v-for="cell in cells"
          :key="`${cell.x}-${cell.y}`"
          class="grid-cell"
          :style="cellStyle(cell.x, cell.y)"
          @mousedown="startPaint(cell.x, cell.y)"
          @mouseenter="paintIfDown(cell.x, cell.y)"
          @touchstart.prevent="startPaint(cell.x, cell.y)"
        >
          <span v-if="cell.x === startX && cell.y === startY" class="cell-marker">🏁</span>
          <span v-else-if="cell.x === endX && cell.y === endY" class="cell-marker">⭐</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="action-btn undo-btn" @click="undo" :disabled="historyIndex <= 0">Undo</button>
      <button class="action-btn clear-btn" @click="clearAll">Clear All</button>
      <button class="action-btn test-btn" @click="testLevel">▶ Test Level</button>
      <button class="action-btn save-btn" @click="saveDraft">Save Draft</button>
      <button class="action-btn publish-btn" @click="publish" :disabled="!canPublish">
        Publish
      </button>
    </div>

    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { BLOCK_TYPES, DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT } from './types'
import type { LevelBlock, LevelData } from './types'
import { saveLocalDraft, publishLevel, generateLevelId } from './levelStore'
import { getCurrentUser } from './userStore'

const props = defineProps<{
  editLevel?: LevelData | null
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'test', level: LevelData): void
}>()

const gridWidth = ref(DEFAULT_GRID_WIDTH)
const gridHeight = ref(DEFAULT_GRID_HEIGHT)
const levelName = ref('')
const levelId = ref('')
const selectedTool = ref('ground')
const startX = ref(1)
const startY = ref(DEFAULT_GRID_HEIGHT - 2)
const endX = ref(DEFAULT_GRID_WIDTH - 2)
const endY = ref(DEFAULT_GRID_HEIGHT - 2)
const message = ref('')
const messageType = ref('info')
const isPainting = ref(false)

// Block grid: key is "x,y" -> block type
const blockMap = reactive<Map<string, string>>(new Map())

// History for undo
const history = ref<string[]>([])
const historyIndex = ref(-1)

const cells = computed(() => {
  const result: { x: number; y: number }[] = []
  for (let y = 0; y < gridHeight.value; y++) {
    for (let x = 0; x < gridWidth.value; x++) {
      result.push({ x, y })
    }
  }
  return result
})

const canPublish = computed(() => {
  return levelName.value.trim().length > 0 && blockMap.size > 0
})

function cellStyle(x: number, y: number) {
  const key = `${x},${y}`
  const blockType = blockMap.get(key)
  if (blockType) {
    const bt = BLOCK_TYPES.find((b) => b.id === blockType)
    return { backgroundColor: bt ? bt.color : '#4a5568' }
  }
  return {}
}

function saveState() {
  const state = JSON.stringify(Array.from(blockMap.entries()))
  // Discard future states if we undid
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(state)
  if (history.value.length > 30) history.value.shift()
  historyIndex.value = history.value.length - 1
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const state: [string, string][] = JSON.parse(history.value[historyIndex.value])
    blockMap.clear()
    for (const [k, v] of state) {
      blockMap.set(k, v)
    }
  }
}

function placeBlock(x: number, y: number) {
  const key = `${x},${y}`

  if (selectedTool.value === 'start') {
    startX.value = x
    startY.value = y
    return
  }
  if (selectedTool.value === 'end') {
    endX.value = x
    endY.value = y
    return
  }
  if (selectedTool.value === 'eraser') {
    if (blockMap.has(key)) {
      blockMap.delete(key)
      saveState()
    }
    return
  }

  blockMap.set(key, selectedTool.value)
  saveState()
}

function startPaint(x: number, y: number) {
  isPainting.value = true
  placeBlock(x, y)
}

function paintIfDown(x: number, y: number) {
  if (isPainting.value) {
    placeBlock(x, y)
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isPainting.value) return
  const touch = e.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
  if (el && el.classList.contains('grid-cell')) {
    const cellIndex = Array.from(el.parentElement!.children).indexOf(el)
    const x = cellIndex % gridWidth.value
    const y = Math.floor(cellIndex / gridWidth.value)
    placeBlock(x, y)
  }
}

function clearAll() {
  blockMap.clear()
  saveState()
  showMessage('Cleared!', 'info')
}

function buildLevelData(): LevelData {
  const blocks: LevelBlock[] = []
  for (const [key, type] of blockMap.entries()) {
    const [x, y] = key.split(',').map(Number)
    blocks.push({ x, y, type })
  }
  return {
    id: levelId.value,
    name: levelName.value.trim() || 'Untitled Level',
    author: getCurrentUser() || 'Unknown',
    blocks,
    startX: startX.value,
    startY: startY.value,
    endX: endX.value,
    endY: endY.value,
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    createdAt: Date.now(),
    plays: 0,
    likes: 0,
  }
}

function testLevel() {
  const level = buildLevelData()
  emit('test', level)
}

function saveDraft() {
  const level = buildLevelData()
  saveLocalDraft(level)
  showMessage('Draft saved!', 'success')
}

async function publish() {
  if (!canPublish.value) return
  const level = buildLevelData()
  try {
    await publishLevel(level)
    saveLocalDraft(level)
    showMessage('Level published!', 'success')
  } catch {
    showMessage('Failed to publish. Try again.', 'error')
  }
}

function showMessage(msg: string, type: string) {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 2500)
}

function handleMouseUp() {
  isPainting.value = false
}

onMounted(() => {
  levelId.value = props.editLevel?.id || generateLevelId()

  if (props.editLevel) {
    levelName.value = props.editLevel.name
    startX.value = props.editLevel.startX
    startY.value = props.editLevel.startY
    endX.value = props.editLevel.endX
    endY.value = props.editLevel.endY
    gridWidth.value = props.editLevel.gridWidth
    gridHeight.value = props.editLevel.gridHeight
    for (const block of props.editLevel.blocks) {
      blockMap.set(`${block.x},${block.y}`, block.type)
    }
  }

  saveState()
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('touchend', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('touchend', handleMouseUp)
})
</script>

<style scoped>
.editor-container {
  min-height: 100vh;
  background: #1a202c;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: #4a5568;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.level-name-input {
  flex: 1;
  padding: 10px 14px;
  background: #2d3748;
  border: 2px solid #4a5568;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  outline: none;
}

.level-name-input:focus {
  border-color: #6366f1;
}

.palette {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.palette-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  background: #2d3748;
  border: 3px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 56px;
}

.palette-btn.active {
  background: #4a5568;
  border-color: #6366f1;
  transform: scale(1.05);
}

.palette-emoji {
  font-size: 24px;
}

.palette-label {
  font-size: 11px;
  color: #a0aec0;
  font-weight: 600;
}

.grid-wrapper {
  flex: 1;
  overflow: auto;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #0d1117;
}

.editor-grid {
  display: grid;
  min-width: 100%;
  user-select: none;
  -webkit-user-select: none;
}

.grid-cell {
  aspect-ratio: 1;
  background: #1a202c;
  border: 1px solid #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-width: 28px;
  min-height: 28px;
  transition: background-color 0.1s;
}

.grid-cell:hover {
  outline: 2px solid #6366f1;
  outline-offset: -2px;
}

.cell-marker {
  font-size: 16px;
  pointer-events: none;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  color: #fff;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.undo-btn {
  background: #4a5568;
}

.clear-btn {
  background: #dc2626;
}

.test-btn {
  background: #16a34a;
  flex: 1;
}

.save-btn {
  background: #2563eb;
}

.publish-btn {
  background: #6366f1;
}

.action-btn:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.message {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.message.success {
  background: #16a34a;
  color: #fff;
}

.message.error {
  background: #dc2626;
  color: #fff;
}

.message.info {
  background: #2563eb;
  color: #fff;
}

@media (max-width: 600px) {
  .palette-btn {
    padding: 6px 8px;
    min-width: 48px;
  }

  .palette-emoji {
    font-size: 20px;
  }

  .palette-label {
    font-size: 10px;
  }

  .action-btn {
    padding: 10px 12px;
    font-size: 13px;
  }

  .grid-cell {
    min-width: 22px;
    min-height: 22px;
  }
}
</style>
