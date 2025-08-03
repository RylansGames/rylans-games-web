<template>
  <div class="coin-display">
    <div class="coin-icon">
      <span class="coin-symbol">C</span>
    </div>
    <span class="coin-amount">{{ coins }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from './GameState'

const coins = ref(0)
let updateInterval: number | null = null

onMounted(() => {
  // Update coins immediately
  coins.value = gameState.getCoins()
  
  // Poll for updates every 500ms (in case coins change from another component)
  updateInterval = window.setInterval(() => {
    coins.value = gameState.getCoins()
  }, 500)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.coin-display {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 25px;
  border: 2px solid #ffd700;
  z-index: 1000;
}

.coin-icon {
  width: 30px;
  height: 30px;
  background: #ffd700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
}

.coin-symbol {
  color: #000;
  font-weight: bold;
  font-size: 18px;
}

.coin-amount {
  color: #ffd700;
  font-size: 24px;
  font-weight: bold;
  min-width: 60px;
}
</style>