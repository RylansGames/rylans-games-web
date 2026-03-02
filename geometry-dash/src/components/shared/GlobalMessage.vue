<template>
  <div v-if="showMessage" class="global-msg">
    <div class="msg-from">DA OWNER</div>
    <div class="msg-text">{{ messageText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PlayerTracker } from './PlayerTracker'

const showMessage = ref(false)
const messageText = ref('')
let checkInterval: number | null = null
let hideTimeout: number | null = null

const checkForMessage = () => {
  const msg = PlayerTracker.checkForGlobalMessage()
  if (msg && messageText.value !== msg.text) {
    showMessage.value = true
    messageText.value = msg.text

    if (hideTimeout) clearTimeout(hideTimeout)
    const remaining = msg.duration - (Date.now() - msg.timestamp)
    hideTimeout = setTimeout(() => {
      showMessage.value = false
      messageText.value = ''
    }, remaining)
  } else if (!msg && showMessage.value) {
    showMessage.value = false
    messageText.value = ''
  }
}

onMounted(() => {
  checkForMessage()
  checkInterval = setInterval(checkForMessage, 500)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>

<style scoped>
.global-msg {
  position: fixed;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  padding: 10px 25px;
  text-align: center;
  z-index: 99998;
  pointer-events: none;
  animation: slideDown 0.3s ease-out;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.msg-from {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 900;
  font-family: monospace;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.msg-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  max-width: 400px;
  word-wrap: break-word;
}
</style>
