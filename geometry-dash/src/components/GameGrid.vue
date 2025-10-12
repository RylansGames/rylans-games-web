<template>
  <div class="game-grid-container">
    <Settings />
    <h1 class="portal-title">Rylan's Game Portal</h1>
    <div class="game-grid">
      <GameCard
        v-for="game in visibleGames"
        :key="game.id"
        :title="game.title"
        :description="game.description"
        :route="game.route"
        :icon="game.icon"
        :thumbnail-color="game.thumbnailColor"
        :rating="game.rating"
        :available="game.available"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GameCard from './GameCard.vue'
import Settings from './Settings.vue'

const showAdmin = ref(false)

interface Game {
  id: string
  title: string
  description: string
  route?: string
  icon: string
  thumbnailColor: string
  rating: number
  available: boolean
}

const games: Game[] = [
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    description: 'Jump over obstacles in this fast-paced rhythm game!',
    route: '/games/geometry-dash',
    icon: '🟨',
    thumbnailColor: '#ffd700',
    rating: 4.8,
    available: true
  },
  {
    id: 'brainrot-admin',
    title: 'Brainrot Admin Panel',
    description: 'Admin controls for Brainrot Evolution - manage coins, pets, and progress!',
    route: '/games/brainrot-admin',
    icon: '⚙️',
    thumbnailColor: '#ef4444',
    rating: 5.0,
    available: true
  },
  {
    id: 'brainrot-evolution',
    title: 'Brainrot Evolution',
    description: 'Click to evolve through stages of internet brainrot! Starting with tung tung tung tung sahur!',
    route: '/games/brainrot-evolution',
    icon: '🧠',
    thumbnailColor: '#9f7aea',
    rating: 5.0,
    available: true
  },
  {
    id: 'scary-shushi',
    title: 'Scary Shushi',
    description: 'Survive the haunted sushi restaurant! Spooky and delicious!',
    route: '/games/scary-shushi',
    icon: '🍣',
    thumbnailColor: '#ff4444',
    rating: 4.8,
    available: true
  },
  {
    id: 'racing-pro',
    title: 'Racing Pro',
    description: 'Race against time in this high-speed driving game!',
    icon: '🏎️',
    thumbnailColor: '#e53e3e',
    rating: 4.7,
    available: false
  },
  {
    id: 'platform-adventure',
    title: 'Platform Adventure',
    description: 'Explore magical worlds and collect treasures!',
    icon: '🗺️',
    thumbnailColor: '#38a169',
    rating: 4.4,
    available: false
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Match pairs and improve your memory skills!',
    icon: '🎴',
    thumbnailColor: '#3182ce',
    rating: 4.3,
    available: false
  }
]

// Filter games to hide admin panel unless authenticated
const visibleGames = computed(() => {
  return games.filter(game => {
    if (game.id === 'brainrot-admin') {
      return showAdmin.value
    }
    return true
  })
})

onMounted(() => {
  // Check if user is authenticated as admin
  const adminAuth = localStorage.getItem('adminAuth')
  if (adminAuth === 'true') {
    showAdmin.value = true
  }
})
</script>

<style scoped>
.game-grid-container {
  padding: 20px;
  min-height: 100vh;
  background: #1a202c;
}

.portal-title {
  text-align: center;
  color: #fff;
  font-size: 48px;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .portal-title {
    font-size: 32px;
  }
  
  .game-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>