<template>
  <div class="game-card" @click="playGame">
    <div class="game-thumbnail" :style="{ backgroundColor: thumbnailColor }">
      <div class="game-icon">{{ icon }}</div>
    </div>
    <h3 class="game-title">{{ title }}</h3>
    <p class="game-description">{{ description }}</p>
    <div class="game-stats">
      <span class="plays">⭐ {{ rating }}</span>
      <span class="status" :class="statusClass">{{ status }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  title: string
  description: string
  route?: string
  icon?: string
  thumbnailColor?: string
  rating?: number
  available?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '🎮',
  thumbnailColor: '#4a5568',
  rating: 4.5,
  available: true
})

const router = useRouter()

const status = computed(() => props.available ? 'PLAY' : 'COMING SOON')
const statusClass = computed(() => props.available ? 'available' : 'coming-soon')

const playGame = () => {
  if (props.available && props.route) {
    router.push(props.route)
  }
}
</script>

<style scoped>
.game-card {
  background: #2d3748;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  width: 250px;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.game-card:hover {
  transform: translateY(-5px);
  border-color: #4299e1;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.game-thumbnail {
  width: 100%;
  height: 140px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.game-icon {
  font-size: 48px;
}

.game-title {
  color: #fff;
  font-size: 20px;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.game-description {
  color: #a0aec0;
  font-size: 14px;
  margin: 0 0 15px 0;
  flex-grow: 1;
}

.game-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plays {
  color: #ffd700;
  font-size: 14px;
}

.status {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status.available {
  background: #48bb78;
  color: white;
}

.status.coming-soon {
  background: #718096;
  color: #e2e8f0;
}
</style>