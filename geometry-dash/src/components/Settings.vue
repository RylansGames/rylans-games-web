<template>
  <div>
    <!-- Settings Icon -->
    <button @click="showSettings = true" class="settings-icon" title="Settings">
      ⚙️
    </button>
    
    <!-- Settings Modal -->
    <div v-if="showSettings" class="settings-overlay" @click.self="closeSettings">
      <div class="settings-modal">
        <div class="settings-header">
          <h2>⚙️ Settings</h2>
          <button @click="closeSettings" class="close-btn">✕</button>
        </div>
        
        <div class="settings-content">
          <div class="setting-group">
            <label for="playerName">Player Name:</label>
            <div class="name-input-group">
              <input 
                id="playerName"
                v-model="playerName" 
                type="text" 
                class="name-input"
                placeholder="Enter your name"
                maxlength="20"
                @keyup.enter="saveName"
              />
              <button @click="saveName" class="save-btn">Save</button>
            </div>
            <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
          </div>
          
          <div class="setting-group">
            <h3>Account Info</h3>
            <div v-if="isInGeometryDash" class="info-row">
              <span class="info-label">Total Coins:</span>
              <span class="info-value">{{ totalCoins }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Games Played:</span>
              <span class="info-value">{{ gamesPlayed }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { gameState } from './shared/GameState'

const route = useRoute()
const showSettings = ref(false)
const playerName = ref('')
const saveMessage = ref('')
const totalCoins = ref(0)
const gamesPlayed = ref(0)

// Check if we're in Geometry Dash
const isInGeometryDash = computed(() => {
  return route.path === '/games/geometry-dash'
})

onMounted(() => {
  playerName.value = gameState.getPlayerName()
  totalCoins.value = gameState.getCoins()
  // Random games played for now
  gamesPlayed.value = Math.floor(Math.random() * 100)
})

const closeSettings = () => {
  showSettings.value = false
  saveMessage.value = ''
}

const saveName = () => {
  if (playerName.value.trim()) {
    gameState.setPlayerName(playerName.value)
    saveMessage.value = '✅ Name saved!'
    setTimeout(() => {
      saveMessage.value = ''
    }, 2000)
  }
}
</script>

<style scoped>
.settings-icon {
  position: fixed;
  top: 20px;
  left: 20px;
  background: #4a5568;
  border: 2px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-icon:hover {
  background: #667eea;
  transform: rotate(90deg);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: #2d3748;
  border: 2px solid #667eea;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
}

.settings-header {
  background: #1a202c;
  padding: 20px;
  border-radius: 13px 13px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #667eea;
}

.settings-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
}

.close-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 5px 15px;
  cursor: pointer;
  font-size: 20px;
  border-radius: 5px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #c53030;
  transform: scale(1.1);
}

.settings-content {
  padding: 30px;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group label {
  display: block;
  color: #a0aec0;
  margin-bottom: 10px;
  font-size: 18px;
}

.setting-group h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.name-input-group {
  display: flex;
  gap: 10px;
}

.name-input {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #4a5568;
  border-radius: 8px;
  background: #1a202c;
  color: white;
  transition: all 0.3s;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
}

.save-btn {
  background: #48bb78;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.save-btn:hover {
  background: #38a169;
  transform: translateY(-2px);
}

.save-message {
  color: #48bb78;
  margin-top: 10px;
  font-size: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #4a5568;
}

.info-label {
  color: #a0aec0;
}

.info-value {
  color: #ffffff;
  font-weight: bold;
}
</style>