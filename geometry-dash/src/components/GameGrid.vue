<template>
  <div class="game-grid-container">
    <AdminAbuseSign />
    <Settings />
    <h1 class="portal-title">Rylans Games</h1>
    <button v-if="hasActiveEffects" class="stop-effects-btn" @click="stopEffects">STOP EFFECTS</button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import GameCard from './GameCard.vue'
import Settings from './Settings.vue'
import AdminAbuseSign from './shared/AdminAbuseSign.vue'
import { PlayerTracker } from './shared/PlayerTracker'

const showAdmin = ref(false)
const hasActiveEffects = ref(false)

const stopEffects = () => {
  PlayerTracker.stopAllAbuseEffects()
  hasActiveEffects.value = false
}

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
    title: 'Owner Panel',
    description: 'Owner controls for all games - manage players, coins, powers, and admin abuse!',
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
    id: 'organize-the-fridge',
    title: 'Organize the Fridge',
    description: 'Pick up food items and organize them on the correct shelves!',
    route: '/games/organize-the-fridge',
    icon: '🧊',
    thumbnailColor: '#60a5fa',
    rating: 4.9,
    available: true
  },
  {
    id: 'music-beats',
    title: 'Music Beats',
    description: 'Make sick beats with a DJ launchpad! Record loops, mix sounds, and drop the bass!',
    route: '/games/music-beats',
    icon: '🎵',
    thumbnailColor: '#7c3aed',
    rating: 5.0,
    available: true
  },
  {
    id: 'camera-watch',
    title: 'The Camera Watch',
    description: 'Monitor security cameras and report anomalies before the facility is compromised!',
    route: '/games/camera-watch',
    icon: '📷',
    thumbnailColor: '#1a3a1a',
    rating: 4.9,
    available: true
  },
  {
    id: 'roblox',
    title: 'Roblox',
    description: 'Create your own levels! Pick 2D or 3D, use AI to help build, and let others play your games!',
    route: '/games/roblox',
    icon: '🌐',
    thumbnailColor: '#6366f1',
    rating: 5.0,
    available: true
  },
  {
    id: 'frogger',
    title: 'Frogger',
    description: 'Cross the road and river to get home! Dodge cars and hop on logs!',
    route: '/games/frogger',
    icon: '🐸',
    thumbnailColor: '#22c55e',
    rating: 5.0,
    available: true
  },
  {
    id: 'basketball',
    title: 'Basketball',
    description: 'Play basketball against friends or bots! Dribble, shoot, and score in a 3D arena!',
    route: '/games/basketball',
    icon: '🏀',
    thumbnailColor: '#ff6b00',
    rating: 5.0,
    available: true
  },
  {
    id: 'gunfight',
    title: 'Gun Fight',
    description: '1v1 arena shooter! Play online or battle bots in a 3D arena!',
    route: '/games/gunfight',
    icon: '🔫',
    thumbnailColor: '#dc2626',
    rating: 5.0,
    available: true
  },
  {
    id: 'fishing',
    title: 'Fishing Tycoon',
    description: 'Catch fish, sell them for money, and buy better rods to find legendary fish!',
    route: '/games/fishing',
    icon: '🎣',
    thumbnailColor: '#0ea5e9',
    rating: 5.0,
    available: true
  },
  {
    id: 'island-tag',
    title: 'Island Tag',
    description: 'Play tag with friends on a tropical island! Run, hide, and survive!',
    route: '/games/island-tag',
    icon: '🏝️',
    thumbnailColor: '#0ea5e9',
    rating: 5.0,
    available: true
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Got an idea for a new game? Submit it and vote on other ideas!',
    route: '/games/feedback',
    icon: '💡',
    thumbnailColor: '#d69e2e',
    rating: 5.0,
    available: true
  },
  {
    id: 'chat',
    title: 'Rylan Chat',
    description: 'Chat, voice call, and video call with your friends!',
    route: '/games/chat',
    icon: '💬',
    thumbnailColor: '#5a67d8',
    rating: 5.0,
    available: true
  },
  {
    id: 'de-activated',
    title: 'De-Activated',
    description: 'Find the impostor before its too late!',
    icon: '🟢',
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

let effectCheckInterval: number | null = null

onMounted(() => {
  // Check if user is authenticated as admin
  const adminAuth = localStorage.getItem('adminAuth')
  if (adminAuth === 'true') {
    showAdmin.value = true
  }

  effectCheckInterval = setInterval(() => {
    hasActiveEffects.value = PlayerTracker.checkForAbuseEffects().length > 0
  }, 500)
})

onUnmounted(() => {
  if (effectCheckInterval) clearInterval(effectCheckInterval)
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

.stop-effects-btn {
  display: block;
  margin: 0 auto 25px auto;
  padding: 14px 40px;
  font-size: 20px;
  font-weight: 900;
  font-family: monospace;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: 3px solid #fbbf24;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px #000;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  animation: pulseStop 1s ease-in-out infinite alternate;
}

.stop-effects-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
}

@keyframes pulseStop {
  from { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
  to { box-shadow: 0 0 30px rgba(251, 191, 36, 0.6); }
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
