<template>
  <div class="browser-container">
    <div class="browser-header">
      <button class="back-btn" @click="$emit('back')">← Back</button>
      <h2 class="browser-title">Browse Levels</h2>
    </div>

    <!-- Search & Sort -->
    <div class="controls-row">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Search levels..."
      />
      <div class="sort-buttons">
        <button
          v-for="s in sortOptions"
          :key="s.value"
          class="sort-btn"
          :class="{ active: sortBy === s.value }"
          @click="sortBy = s.value"
        >{{ s.label }}</button>
      </div>
    </div>

    <!-- Level Cards -->
    <div v-if="filteredLevels.length === 0" class="empty-state">
      <p>{{ loading ? 'Loading levels...' : 'No levels found. Be the first to publish one!' }}</p>
    </div>

    <div class="level-grid">
      <div
        v-for="level in filteredLevels"
        :key="level.id"
        class="level-card"
      >
        <!-- Mini preview -->
        <div class="level-preview">
          <canvas
            :ref="(el) => drawPreview(el as HTMLCanvasElement, level)"
            width="200"
            height="120"
          ></canvas>
        </div>
        <div class="level-info">
          <h3 class="level-name">{{ level.name }}</h3>
          <p class="level-author">by {{ level.author }}</p>
          <div class="level-stats">
            <span>▶ {{ level.plays || 0 }}</span>
            <span>❤ {{ level.likes || 0 }}</span>
          </div>
        </div>
        <button class="play-btn" @click="$emit('play', level)">PLAY</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LevelData } from './types'
import { BLOCK_TYPES } from './types'
import { listenToPublishedLevels } from './levelStore'
import type { Unsubscribe } from 'firebase/database'

defineEmits<{
  (e: 'back'): void
  (e: 'play', level: LevelData): void
}>()

const levels = ref<LevelData[]>([])
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('newest')
let unsubscribe: Unsubscribe | null = null

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Played' },
  { value: 'liked', label: 'Most Liked' },
]

const filteredLevels = computed(() => {
  let result = [...levels.value]

  // Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.author.toLowerCase().includes(q)
    )
  }

  // Sort
  if (sortBy.value === 'newest') {
    result.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sortBy.value === 'popular') {
    result.sort((a, b) => (b.plays || 0) - (a.plays || 0))
  } else if (sortBy.value === 'liked') {
    result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }

  return result
})

function getBlockColor(type: string): string {
  const bt = BLOCK_TYPES.find((b) => b.id === type)
  return bt ? bt.color : '#4a5568'
}

function drawPreview(canvas: HTMLCanvasElement | null, level: LevelData) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const tileW = w / level.gridWidth
  const tileH = h / level.gridHeight

  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, w, h)

  for (const block of level.blocks) {
    ctx.fillStyle = getBlockColor(block.type)
    ctx.fillRect(block.x * tileW, block.y * tileH, tileW, tileH)
  }

  // Start & end
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(level.startX * tileW, level.startY * tileH, tileW, tileH)
  ctx.fillStyle = '#ffd700'
  ctx.fillRect(level.endX * tileW, level.endY * tileH, tileW, tileH)
}

onMounted(() => {
  unsubscribe = listenToPublishedLevels((data) => {
    levels.value = data
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.browser-container {
  min-height: 100vh;
  background: #1a202c;
  padding: 12px;
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.back-btn {
  background: #4a5568;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.browser-title {
  color: #fff;
  font-size: 24px;
  margin: 0;
}

.controls-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  background: #2d3748;
  border: 2px solid #4a5568;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.search-input:focus {
  border-color: #6366f1;
}

.sort-buttons {
  display: flex;
  gap: 6px;
}

.sort-btn {
  padding: 10px 14px;
  background: #2d3748;
  border: 2px solid #4a5568;
  border-radius: 8px;
  color: #a0aec0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.sort-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.empty-state {
  text-align: center;
  color: #a0aec0;
  padding: 60px 20px;
  font-size: 18px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.level-card {
  background: #2d3748;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}

.level-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.level-preview canvas {
  width: 100%;
  height: 120px;
  display: block;
}

.level-info {
  padding: 12px;
}

.level-name {
  color: #fff;
  font-size: 16px;
  margin: 0 0 4px 0;
}

.level-author {
  color: #a0aec0;
  font-size: 13px;
  margin: 0 0 8px 0;
}

.level-stats {
  display: flex;
  gap: 14px;
  color: #a0aec0;
  font-size: 13px;
}

.play-btn {
  display: block;
  width: calc(100% - 24px);
  margin: 0 12px 12px;
  padding: 10px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.play-btn:hover {
  background: #15803d;
}

@media (max-width: 480px) {
  .level-grid {
    grid-template-columns: 1fr;
  }
}
</style>
