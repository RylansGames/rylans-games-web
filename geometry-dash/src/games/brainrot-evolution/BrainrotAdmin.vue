<template>
  <div class="admin-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>

    <!-- Password Screen -->
    <div v-if="!isAuthenticated" class="password-screen">
      <div class="password-box">
        <h1>🔒 Admin Access Required</h1>
        <p>Enter the admin password to continue</p>
        <input
          v-model="passwordInput"
          type="password"
          placeholder="Enter password"
          @keyup.enter="checkPassword"
          class="password-input"
          autofocus
        />
        <button @click="checkPassword" class="password-btn">Unlock</button>
        <p v-if="wrongPassword" class="error-message">❌ Incorrect password!</p>
      </div>
    </div>

    <div v-else class="admin-container">
      <div class="admin-header">
        <h1 class="admin-title">⚙️ Brainrot Evolution Admin Panel</h1>
        <button class="logout-button" @click="logout">🚪 Logout</button>
      </div>

      <div class="admin-grid">
        <!-- Coin Management -->
        <div class="admin-card">
          <h2>💰 Coin Management</h2>
          <div class="current-value">
            Current Coins: <span class="value">{{ currentCoins }}</span>
          </div>
          <div class="button-group">
            <button @click="addCoins(10)" class="admin-btn green">+10 Coins</button>
            <button @click="addCoins(50)" class="admin-btn green">+50 Coins</button>
            <button @click="addCoins(100)" class="admin-btn green">+100 Coins</button>
            <button @click="addCoins(1000)" class="admin-btn green">+1000 Coins</button>
          </div>
          <div class="button-group">
            <button @click="removeCoins(10)" class="admin-btn red">-10 Coins</button>
            <button @click="removeCoins(50)" class="admin-btn red">-50 Coins</button>
            <button @click="setCoins(0)" class="admin-btn red">Reset to 0</button>
          </div>
        </div>

        <!-- Level & EXP Management -->
        <div class="admin-card">
          <h2>⬆️ Level & EXP</h2>
          <div class="current-value">
            Level: <span class="value">{{ gameData.level }}</span> |
            EXP: <span class="value">{{ gameData.exp }}</span>
          </div>
          <div class="button-group">
            <button @click="setLevel(1)" class="admin-btn blue">Set Level 1</button>
            <button @click="setLevel(2)" class="admin-btn blue">Set Level 2</button>
            <button @click="setLevel(5)" class="admin-btn blue">Set Level 5</button>
            <button @click="setLevel(10)" class="admin-btn blue">Set Level 10</button>
          </div>
          <div class="button-group">
            <button @click="addExp(10)" class="admin-btn blue">+10 EXP</button>
            <button @click="addExp(50)" class="admin-btn blue">+50 EXP</button>
            <button @click="addExp(100)" class="admin-btn blue">+100 EXP</button>
          </div>
        </div>

        <!-- Pet Management -->
        <div class="admin-card">
          <h2>🐾 Pet Management</h2>
          <div class="current-value">
            Pets Owned: <span class="value">{{ gameData.pets?.length || 0 }}</span>
          </div>
          <div class="button-group">
            <button @click="givePet('Dog', 1, 'Common')" class="admin-btn purple">Give Dog</button>
            <button @click="givePet('Cat', 1.25, 'Uncommon')" class="admin-btn purple">Give Cat</button>
            <button @click="givePet('Cat Vampire', 1.50, 'Rare')" class="admin-btn purple">Give Cat Vampire</button>
          </div>
          <div class="button-group">
            <button @click="givePet('Mushroom Head', 1.75, 'Epic')" class="admin-btn purple">Give Mushroom Head</button>
            <button @click="givePet('Dragon', 2, 'Legendary')" class="admin-btn purple">Give Dragon 🐉</button>
            <button @click="clearAllPets()" class="admin-btn red">Clear All Pets</button>
          </div>
        </div>

        <!-- Orange HP Management -->
        <div class="admin-card">
          <h2>🍊 Orange HP</h2>
          <div class="current-value" v-if="gameData.orangeHP">
            Orange HP:
            <span class="value" v-for="(hp, index) in gameData.orangeHP" :key="index">
              #{{ index + 1 }}: {{ hp }}
            </span>
          </div>
          <div class="button-group">
            <button @click="resetOrangeHP()" class="admin-btn orange">Reset All Oranges to 200 HP</button>
            <button @click="setOrangeHP(0)" class="admin-btn red">Destroy All Oranges</button>
          </div>
        </div>

        <!-- Full Reset -->
        <div class="admin-card danger">
          <h2>🔄 Full Reset</h2>
          <p class="warning">⚠️ This will reset ALL progress!</p>
          <button @click="fullReset()" class="admin-btn danger-btn">RESET EVERYTHING</button>
        </div>

        <!-- Quick Actions -->
        <div class="admin-card">
          <h2>⚡ Quick Actions</h2>
          <div class="button-group">
            <button @click="maxEverything()" class="admin-btn gold">MAX EVERYTHING</button>
            <button @click="openGameData()" class="admin-btn blue">View Raw Data</button>
          </div>
        </div>
      </div>

      <!-- Status Message -->
      <div v-if="statusMessage" class="status-message" :class="statusType">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'

const router = useRouter()
const currentCoins = ref(0)
const statusMessage = ref('')
const statusType = ref('success')
const isAuthenticated = ref(false)
const passwordInput = ref('')
const wrongPassword = ref(false)

// Admin password - change this to whatever you want!
const ADMIN_PASSWORD = 'rylan2025'

interface Pet {
  id: string
  name: string
  damage: number
  rarity: string
}

interface GameData {
  playerX: number
  playerZ: number
  coinsCollectedCount: number
  hasMetTungTung: boolean
  level: number
  exp: number
  orangeHP?: number[]
  pets?: Pet[]
  activePet?: Pet | null
}

const gameData = ref<GameData>({
  playerX: 0,
  playerZ: 0,
  coinsCollectedCount: 0,
  hasMetTungTung: false,
  level: 1,
  exp: 0,
  orangeHP: [],
  pets: [],
  activePet: null
})

const goBack = () => {
  router.push('/')
}

const checkPassword = () => {
  if (passwordInput.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    wrongPassword.value = false
    localStorage.setItem('adminAuth', 'true')
  } else {
    wrongPassword.value = true
    setTimeout(() => {
      wrongPassword.value = false
    }, 2000)
  }
}

const logout = () => {
  localStorage.removeItem('adminAuth')
  isAuthenticated.value = false
  passwordInput.value = ''
  router.push('/')
}

const loadGameData = () => {
  const saved = localStorage.getItem('brainrotEvolution3D')
  if (saved) {
    gameData.value = JSON.parse(saved)
  }
  currentCoins.value = gameState.getCoins()
}

const saveGameData = () => {
  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData.value))
}

const showStatus = (message: string, type: 'success' | 'error' = 'success') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const addCoins = (amount: number) => {
  gameState.addCoins(amount)
  currentCoins.value = gameState.getCoins()
  showStatus(`Added ${amount} coins!`)
}

const removeCoins = (amount: number) => {
  gameState.spendCoins(amount)
  currentCoins.value = gameState.getCoins()
  showStatus(`Removed ${amount} coins!`)
}

const setCoins = (amount: number) => {
  const current = gameState.getCoins()
  if (current > amount) {
    gameState.spendCoins(current - amount)
  } else {
    gameState.addCoins(amount - current)
  }
  currentCoins.value = gameState.getCoins()
  showStatus(`Set coins to ${amount}!`)
}

const setLevel = (level: number) => {
  gameData.value.level = level
  gameData.value.exp = 0
  saveGameData()
  showStatus(`Set level to ${level}!`)
}

const addExp = (amount: number) => {
  gameData.value.exp += amount
  saveGameData()
  showStatus(`Added ${amount} EXP!`)
}

const givePet = (name: string, damage: number, rarity: string) => {
  if (!gameData.value.pets) {
    gameData.value.pets = []
  }

  const newPet: Pet = {
    id: `${name.toLowerCase().replace(/\s/g, '')}-${Date.now()}-${Math.random()}`,
    name,
    damage,
    rarity
  }

  gameData.value.pets.push(newPet)

  if (!gameData.value.activePet) {
    gameData.value.activePet = newPet
  }

  saveGameData()

  // Debug logging
  console.log('Gave pet:', newPet)
  console.log('Total pets:', gameData.value.pets.length)
  console.log('Active pet:', gameData.value.activePet)
  console.log('Saved data:', localStorage.getItem('brainrotEvolution3D'))

  showStatus(`Gave ${name}!`)
}

const clearAllPets = () => {
  gameData.value.pets = []
  gameData.value.activePet = null
  saveGameData()
  showStatus('Cleared all pets!')
}

const resetOrangeHP = () => {
  gameData.value.orangeHP = [200, 200, 200, 200, 200]
  saveGameData()
  showStatus('Reset all oranges to 200 HP!')
}

const setOrangeHP = (hp: number) => {
  gameData.value.orangeHP = [hp, hp, hp, hp, hp]
  saveGameData()
  showStatus(`Set all oranges to ${hp} HP!`)
}

const fullReset = () => {
  if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
    // Clear all game-related localStorage
    localStorage.removeItem('brainrotEvolution3D')
    localStorage.removeItem('gameCoins')
    localStorage.removeItem('adminAuth')

    // Reset gameState coins to 0
    const currentCoins = gameState.getCoins()
    if (currentCoins > 0) {
      gameState.spendCoins(currentCoins)
    }

    // Clear the gameData in memory
    gameData.value = {
      playerX: 0,
      playerZ: 0,
      coinsCollectedCount: 0,
      hasMetTungTung: false,
      level: 1,
      exp: 0,
      orangeHP: [200, 200, 200, 200, 200],
      pets: [],
      activePet: null
    }

    // Save the reset data
    saveGameData()

    // Reload the page
    setTimeout(() => {
      location.reload()
    }, 100)
  }
}

const maxEverything = () => {
  gameState.addCoins(99999)
  currentCoins.value = gameState.getCoins()
  gameData.value.level = 99
  gameData.value.exp = 999
  gameData.value.orangeHP = [200, 200, 200, 200, 200]

  // Give all pets
  if (!gameData.value.pets) {
    gameData.value.pets = []
  }

  const allPets = [
    { name: 'Dog', damage: 1, rarity: 'Common' },
    { name: 'Cat', damage: 1.25, rarity: 'Uncommon' },
    { name: 'Cat Vampire', damage: 1.50, rarity: 'Rare' },
    { name: 'Mushroom Head', damage: 1.75, rarity: 'Epic' },
    { name: 'Dragon', damage: 2, rarity: 'Legendary' }
  ]

  allPets.forEach(pet => {
    const newPet: Pet = {
      id: `${pet.name.toLowerCase().replace(/\s/g, '')}-${Date.now()}-${Math.random()}`,
      name: pet.name,
      damage: pet.damage,
      rarity: pet.rarity
    }
    gameData.value.pets!.push(newPet)
  })

  gameData.value.activePet = gameData.value.pets[gameData.value.pets.length - 1]

  saveGameData()
  showStatus('MAXED EVERYTHING! 🚀', 'success')
}

const openGameData = () => {
  console.log('Game Data:', gameData.value)
  console.log('Coins:', gameState.getCoins())
  alert('Game data logged to console! Press F12 to view.')
}

onMounted(() => {
  // Check if already authenticated
  const authStatus = localStorage.getItem('adminAuth')
  if (authStatus === 'true') {
    isAuthenticated.value = true
  }

  loadGameData()
})
</script>

<style scoped>
.admin-wrapper {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
  padding: 20px;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: #4f46e5;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
}

.admin-title {
  color: #fff;
  font-size: 48px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  flex: 1;
  text-align: center;
}

.logout-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  white-space: nowrap;
}

.logout-button:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: scale(1.05);
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.admin-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.admin-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.admin-card.danger {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.admin-card h2 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 24px;
}

.current-value {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.value {
  color: #4ade80;
  margin: 0 5px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.admin-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
  font-size: 14px;
}

.admin-btn:hover {
  transform: scale(1.05);
}

.admin-btn.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.admin-btn.green:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.admin-btn.red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.admin-btn.red:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.admin-btn.blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.admin-btn.blue:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.admin-btn.purple {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.admin-btn.purple:hover {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
}

.admin-btn.orange {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.admin-btn.orange:hover {
  background: linear-gradient(135deg, #ea580c, #c2410c);
}

.admin-btn.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  font-size: 16px;
  padding: 15px 25px;
}

.admin-btn.gold:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.admin-btn.danger-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  font-size: 18px;
  padding: 15px 30px;
  width: 100%;
}

.admin-btn.danger-btn:hover {
  background: linear-gradient(135deg, #991b1b, #7f1d1d);
}

.warning {
  color: #fbbf24;
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
}

.status-message {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 20px 30px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

.status-message.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.status-message.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.password-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a0033 0%, #330066 100%);
  z-index: 10000;
}

.password-box {
  background: rgba(255, 255, 255, 0.1);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 50px;
  backdrop-filter: blur(10px);
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.password-box h1 {
  color: #fff;
  font-size: 32px;
  margin-bottom: 20px;
}

.password-box p {
  color: #aaa;
  font-size: 16px;
  margin-bottom: 30px;
}

.password-input {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  margin-bottom: 20px;
  text-align: center;
  transition: all 0.3s;
}

.password-input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.15);
}

.password-input::placeholder {
  color: #888;
}

.password-btn {
  width: 100%;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.password-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: scale(1.05);
}

.error-message {
  color: #ef4444;
  font-weight: bold;
  margin-top: 15px;
  font-size: 16px;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .admin-title {
    font-size: 32px;
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .admin-btn {
    width: 100%;
  }
}
</style>
