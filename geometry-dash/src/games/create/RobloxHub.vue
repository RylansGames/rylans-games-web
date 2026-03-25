<template>
  <div class="roblox-shell">
    <!-- Left Sidebar -->
    <nav class="sidebar">
      <div class="sidebar-logo">
        <svg viewBox="0 0 24 24" class="logo-icon" fill="white" width="28" height="28">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/>
          <rect x="9" y="9" width="6" height="6" rx="1" fill="white"/>
        </svg>
      </div>
      <div
        v-for="item in sidebarItems"
        :key="item.label"
        class="sidebar-item"
        :class="{ active: item.label === activeTab }"
        @click="activeTab = item.label"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        <span class="sidebar-label">{{ item.label }}</span>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <button class="back-home-btn" @click="$router.push('/')">← Home</button>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search"
            class="search-input"
          />
        </div>
        <div class="top-right">
          <span class="username-display">{{ playerName }}</span>
          <div class="avatar-circle">
            {{ playerName.charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="page-content">
        <!-- Connections Bar -->
        <section class="section connections-section">
          <h2 class="section-title">Connections ({{ connections.length }}) ›</h2>
          <div class="connections-row">
            <div class="connection-add">
              <div class="connection-avatar add-avatar">+</div>
              <span class="connection-name">Connect</span>
            </div>
            <div
              v-for="conn in connections"
              :key="conn.name"
              class="connection-item"
            >
              <div class="connection-avatar" :style="{ background: conn.color }">
                {{ conn.name.charAt(0) }}
              </div>
              <span class="connection-name">{{ conn.name }}</span>
            </div>
          </div>
        </section>

        <!-- Create a Level Button -->
        <section class="section">
          <button class="create-btn" @click="$router.push('/studio')">
            <span class="create-icon">➕</span>
            <span>Create a Level</span>
          </button>
        </section>

        <!-- Recommended Section -->
        <section class="section">
          <h2 class="section-title">Recommended For You</h2>
          <div class="game-grid">
            <div
              v-for="game in filteredGames"
              :key="game.title"
              class="game-card"
              @click="playPublished(game)"
            >
              <div class="game-thumbnail" :style="{ background: game.gradient }">
                <span class="game-thumb-icon">{{ game.icon }}</span>
              </div>
              <div class="game-info">
                <span class="game-title">{{ game.title }}</span>
                <span class="game-rating">👍 {{ game.rating }}% Rating</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Player Created Levels -->
        <section v-if="publishedGames.length > 0" class="section">
          <h2 class="section-title">Player Created Levels</h2>
          <div class="game-grid">
            <div
              v-for="game in publishedGames"
              :key="game.id"
              class="game-card"
              @click="$router.push('/create?play=' + game.id)"
            >
              <div class="game-thumbnail" :style="{ background: game.bgColor || '#1e293b' }">
                <span class="game-thumb-icon">{{ getGenreIcon(game.genre) }}</span>
              </div>
              <div class="game-info">
                <span class="game-title">{{ game.name }}</span>
                <span class="game-rating">by {{ game.author }} | {{ game.mode.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Continue Section -->
        <section class="section">
          <h2 class="section-title">Continue ›</h2>
          <div class="game-grid">
            <div
              v-for="game in continueGames"
              :key="game.title"
              class="game-card"
              @click="playPublished(game)"
            >
              <div class="game-thumbnail" :style="{ background: game.gradient }">
                <span class="game-thumb-icon">{{ game.icon }}</span>
              </div>
              <div class="game-info">
                <span class="game-title">{{ game.title }}</span>
                <span class="game-rating">👍 {{ game.rating }}% Rating</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'
import { getPublishedGames } from './gameStore'
import type { GameData } from './types'

const router = useRouter()
const activeTab = ref('Home')
const searchQuery = ref('')
const playerName = ref('Player')
const publishedGames = ref<GameData[]>([])

const sidebarItems = [
  { icon: '🏠', label: 'Home' },
  { icon: '📊', label: 'Charts' },
  { icon: '😀', label: 'Avatar' },
  { icon: '🎉', label: 'Party' },
  { icon: '☰', label: 'More' },
]

const connections = [
  { name: 'BuilderBot', color: '#e53e3e' },
  { name: 'PixelKing', color: '#38a169' },
  { name: 'StarJumper', color: '#3182ce' },
  { name: 'NeonGlow', color: '#d69e2e' },
  { name: 'CosmicRay', color: '#805ad5' },
  { name: 'TurboMax', color: '#dd6b20' },
  { name: 'SkyDiver', color: '#319795' },
  { name: 'BlazeFire', color: '#e53e3e' },
]

interface FakeGame {
  title: string
  icon: string
  rating: number
  gradient: string
}

const allGames: FakeGame[] = [
  { title: 'Obstacle Run', icon: '🏃', rating: 94, gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
  { title: 'Tower Defense', icon: '🏰', rating: 89, gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { title: 'Racing Sim', icon: '🏎️', rating: 81, gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
  { title: 'Scary Mansion', icon: '👻', rating: 92, gradient: 'linear-gradient(135deg, #1e1b2e, #4c1d95)' },
  { title: 'Obby Paradise', icon: '🏔️', rating: 88, gradient: 'linear-gradient(135deg, #16a34a, #059669)' },
  { title: 'Tycoon City', icon: '💰', rating: 85, gradient: 'linear-gradient(135deg, #eab308, #f59e0b)' },
]

const continueGames: FakeGame[] = [
  { title: 'Obstacle Run', icon: '🏃', rating: 94, gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
  { title: 'Scary Mansion', icon: '👻', rating: 92, gradient: 'linear-gradient(135deg, #1e1b2e, #4c1d95)' },
]

const filteredGames = computed(() => {
  if (!searchQuery.value) return allGames
  const q = searchQuery.value.toLowerCase()
  return allGames.filter(g => g.title.toLowerCase().includes(q))
})

function getGenreIcon(genre: string): string {
  const icons: Record<string, string> = { platformer: '🏃', scary: '👻', adventure: '🗺️', puzzle: '🧩', obby: '🏔️', tycoon: '💰' }
  return icons[genre] || '🎮'
}

function playPublished(_game: FakeGame) {
  // Placeholder - these are display-only cards for now
}

onMounted(() => {
  playerName.value = gameState.getPlayerName() || 'Player'
  publishedGames.value = getPublishedGames()
})
</script>

<style scoped>
.roblox-shell {
  display: flex;
  min-height: 100vh;
  background: #191b2a;
  color: #fff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.sidebar {
  width: 68px;
  background: #232538;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 4px;
  flex-shrink: 0;
  border-right: 1px solid #2a2d42;
}

.sidebar-logo { padding: 8px; margin-bottom: 8px; }
.logo-icon { display: block; }

.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  width: 60px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.sidebar-item:hover { background: #2f3250; }
.sidebar-item.active { background: #3b3f5c; }
.sidebar-icon { font-size: 22px; }
.sidebar-label { font-size: 10px; color: #b0b4c8; font-weight: 600; }
.sidebar-item.active .sidebar-label { color: #fff; }

.main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.top-bar {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 16px;
  background: #232538;
  border-bottom: 1px solid #2a2d42;
}

.back-home-btn {
  background: #3b3f5c;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
}

.back-home-btn:hover { background: #4a4f70; }

.search-bar {
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
  background: #393c54;
  border-radius: 24px;
  padding: 0 16px;
  gap: 8px;
}

.search-icon { font-size: 16px; opacity: 0.6; }

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 15px;
  padding: 10px 0;
  outline: none;
}

.search-input::placeholder { color: #7a7e98; }

.top-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.username-display { font-size: 14px; font-weight: 700; color: #e0e2f0; }

.avatar-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.page-content { flex: 1; overflow-y: auto; padding: 20px 24px; }

.section { margin-bottom: 28px; }
.section-title { font-size: 18px; font-weight: 800; margin: 0 0 14px 0; color: #eef0ff; }

/* Create Button */
.create-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6);
}

.create-btn:active { transform: scale(0.97); }
.create-icon { font-size: 24px; }

/* Connections */
.connections-row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }

.connection-item, .connection-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  cursor: pointer;
}

.connection-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  border: 3px solid #2a2d42;
}

.add-avatar { background: #393c54; font-size: 26px; color: #7a7e98; border: 3px dashed #4a4f70; }

.connection-name {
  font-size: 11px;
  color: #b0b4c8;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Game Grid */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.game-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  background: #232538;
  transition: transform 0.15s, box-shadow 0.15s;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.game-card:active { transform: scale(0.97); }

.game-thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-thumb-icon { font-size: 48px; }

.game-info { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.game-title { font-size: 14px; font-weight: 700; color: #eef0ff; }
.game-rating { font-size: 12px; color: #7a7e98; }

@media (max-width: 600px) {
  .sidebar { width: 52px; }
  .sidebar-label { display: none; }
  .sidebar-item { width: 44px; padding: 10px 4px; }
  .top-bar { padding: 8px 12px; gap: 8px; }
  .username-display { display: none; }
  .page-content { padding: 14px 12px; }
  .game-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
}
</style>
