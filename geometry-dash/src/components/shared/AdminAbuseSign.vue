<template>
  <div v-if="showSign" class="abuse-overlay">
    <div class="abuse-sign">
      <div class="abuse-text">{{ abuseGame }} ADMIN ABUSE STARTING NOW</div>
      <div class="abuse-timer">{{ timeLeft }}s</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PlayerTracker } from './PlayerTracker'

const showSign = ref(false)
const abuseGame = ref('')
const timeLeft = ref(10)
let checkInterval: number | null = null
let countdownInterval: number | null = null

const checkForAbuse = () => {
  const abuse = PlayerTracker.checkForAdminAbuse()
  if (abuse && !showSign.value) {
    showSign.value = true
    abuseGame.value = abuse.game
    const remaining = Math.ceil((abuse.duration - (Date.now() - abuse.startTime)) / 1000)
    timeLeft.value = remaining

    countdownInterval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        showSign.value = false
        if (countdownInterval) clearInterval(countdownInterval)
      }
    }, 1000)
  } else if (!abuse && showSign.value) {
    showSign.value = false
    if (countdownInterval) clearInterval(countdownInterval)
  }
}

onMounted(() => {
  checkForAbuse()
  checkInterval = setInterval(checkForAbuse, 500)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style scoped>
.abuse-overlay {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 99999;
  pointer-events: none;
}

.abuse-sign {
  background: linear-gradient(135deg, #ff0000, #cc0000);
  border: 4px solid #ffff00;
  border-radius: 12px;
  padding: 12px 20px;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 255, 0, 0.3);
  animation: pulseSign 0.8s ease-in-out infinite alternate;
}

@keyframes pulseSign {
  from { transform: scale(1); }
  to { transform: scale(1.03); }
}

.abuse-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  font-family: 'Impact', 'Arial Black', sans-serif;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
  letter-spacing: 1px;
}

.abuse-timer {
  color: #ffff00;
  font-size: 36px;
  font-weight: 900;
  font-family: monospace;
  text-shadow: 2px 2px 0 #000;
  margin-top: 5px;
}
</style>
