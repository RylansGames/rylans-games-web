<template>
  <div v-if="showPanel" class="moderator-overlay">
    <div class="moderator-panel">
      <div class="panel-header">
        <h2>🔒 Moderator Dashboard</h2>
        <button @click="closePanel" class="close-btn">✕</button>
      </div>
      
      <div v-if="!isModerator" class="access-denied">
        <h1>⚠️ Access DENIED ⚠️</h1>
        <p>No admin for you.</p>
        <p class="warning">RYLAN ONLY - EXCLUSIVE ACCESS</p>
        <p class="small-text">This panel is reserved for Rylan only!</p>
      </div>
      
      <div v-else class="panel-content">
        <div class="admin-controls">
          <button @click="showGeometryDashAdmin = !showGeometryDashAdmin" class="game-admin-btn">
            🎮 Geometry Dash Admin
          </button>
          <button @click="showBrainrotAdmin = !showBrainrotAdmin" class="game-admin-btn brainrot-btn">
            🧠 Brainrot Evolution Admin
          </button>
        </div>
        
        <div v-if="showGeometryDashAdmin" class="admin-commands">
          <h3>🔧 Geometry Dash Admin Commands</h3>
          <div class="command-grid">
            <div class="command-card">
              <h4>👥 Players in Game</h4>
              <div class="players-in-game">
                <div v-for="player in geometryDashPlayers" :key="player.id" class="ingame-player-row">
                  <span class="player-info">{{ player.avatar }} {{ player.name }} - Score: {{ player.score }}</span>
                  <button @click="viewPlayerProfile(player)" class="join-btn">View Profile</button>
                </div>
                <p v-if="geometryDashPlayers.length === 0" class="no-players">No players currently in game</p>
              </div>
            </div>
            <div class="command-card">
              <h4>💪 Power Controls</h4>
              <button @click="giveAllPowers" class="admin-action-btn">
                🎁 Give All Powers
              </button>
              <p v-if="powersGranted" class="success-msg">✅ All powers granted!</p>
            </div>
            <div class="command-card">
              <h4>💰 Coin Controls</h4>
              <button @click="giveCoins(10000)" class="admin-action-btn">
                💵 Give 10,000 Coins
              </button>
              <button @click="giveCoins(100000)" class="admin-action-btn">
                💎 Give 100,000 Coins
              </button>
              <button @click="giveCoins(1000000)" class="admin-action-btn">
                💰 Give 1 Million
              </button>
              <button @click="giveCoins(1000000000)" class="admin-action-btn">
                🤑 Give 1 Billion
              </button>
              <button @click="giveCoins(1000000000000)" class="admin-action-btn">
                💸 Give 1 Trillion
              </button>
              <button @click="giveCoins(1000000000000000000000)" class="admin-action-btn">
                🌟 Give 1 Sextillion
              </button>
            </div>
            <div class="command-card">
              <h4>🏆 Score Controls</h4>
              <button @click="setHighScore(1000000000000000000000)" class="admin-action-btn special-score">
                🔥 Set High Score: 1 Sextillion
              </button>
              <p v-if="scoreSet" class="success-msg">✅ High score set to 1 sextillion!</p>
            </div>
          </div>
        </div>

        <div v-if="showBrainrotAdmin" class="admin-commands">
          <h3>🧠 Brainrot Evolution Admin Commands</h3>
          <div class="command-grid">
            <div class="command-card">
              <h4>💰 Coin Controls</h4>
              <button @click="giveCoins(10000)" class="admin-action-btn">
                💵 Give 10,000 Coins
              </button>
              <button @click="giveCoins(100000)" class="admin-action-btn">
                💎 Give 100,000 Coins
              </button>
              <button @click="giveCoins(1000000)" class="admin-action-btn">
                💰 Give 1 Million
              </button>
              <button @click="giveCoins(1000000000)" class="admin-action-btn">
                🤑 Give 1 Billion
              </button>
            </div>
            <div class="command-card">
              <h4>🐾 Pet Controls</h4>
              <button @click="giveBrainrotPet('Dog', 1, 'Common')" class="admin-action-btn">
                🐕 Give Dog (1x Common)
              </button>
              <button @click="giveBrainrotPet('Cat', 1.25, 'Rare')" class="admin-action-btn">
                🐱 Give Cat (1.25x Rare)
              </button>
              <button @click="giveBrainrotPet('Cat Vampire', 1.50, 'Epic')" class="admin-action-btn">
                🧛 Give Cat Vampire (1.50x Epic)
              </button>
              <button @click="giveBrainrotPet('Mushroom Head', 1.75, 'Legendary')" class="admin-action-btn">
                🍄 Give Mushroom Head (1.75x Legendary)
              </button>
              <button @click="giveBrainrotPet('Dragon', 2, 'Mythic')" class="admin-action-btn special-dragon">
                🐉 Give Dragon (2x Mythic)
              </button>
              <button @click="giveBrainrotPet('Moderator God', 100000000000000000000000000000000000000, 'MODERATOR')" class="admin-action-btn special-moderator">
                👑 Give Moderator God (∞ MODERATOR ONLY)
              </button>
            </div>
            <div class="command-card">
              <h4>⭐ Level Controls</h4>
              <button @click="setBrainrotLevel(1)" class="admin-action-btn">
                Set Level 1
              </button>
              <button @click="setBrainrotLevel(3)" class="admin-action-btn">
                Set Level 3
              </button>
              <button @click="setBrainrotLevel(5)" class="admin-action-btn">
                Set Level 5
              </button>
              <button @click="setBrainrotLevel(8)" class="admin-action-btn">
                Set Level 8 (MAX)
              </button>
              <button @click="giveBrainrotExp(100)" class="admin-action-btn">
                ⚡ Give 100 EXP
              </button>
            </div>
            <div class="command-card">
              <h4>🔄 Reset Controls</h4>
              <button @click="resetBrainrotProgress" class="admin-action-btn special-reset">
                ⚠️ Reset All Progress
              </button>
              <p class="warning-text">This will reset all Brainrot Evolution progress!</p>
            </div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-number">{{ onlineCount }}</div>
            <div class="stat-label">Players Online</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">{{ playingCount }}</div>
            <div class="stat-label">In Games</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">{{ offlineCount }}</div>
            <div class="stat-label">Offline</div>
          </div>
        </div>
        
        <div class="player-list">
          <h3>All Players</h3>
          <div class="player-grid">
            <div v-for="player in players" :key="player.id" class="player-card" :class="player.status">
              <div class="player-avatar">{{ player.avatar }}</div>
              <div class="player-info">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-status">
                  <span class="status-dot" :class="player.status"></span>
                  {{ player.statusText }}
                </div>
                <div v-if="player.currentGame" class="player-game">
                  Playing: {{ player.currentGame }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Player Profile Modal -->
    <div v-if="selectedPlayer" class="profile-modal" @click.self="selectedPlayer = null">
      <div class="profile-content">
        <h2>{{ selectedPlayer.avatar }} {{ selectedPlayer.name }}'s Profile</h2>
        <div class="profile-stats">
          <div class="stat-row">
            <span class="stat-label">Status:</span>
            <span :class="'status-' + selectedPlayer.status">{{ selectedPlayer.statusText }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Current Score:</span>
            <span>{{ selectedPlayer.score }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Coins:</span>
            <span>{{ selectedPlayer.coins || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Powers Owned:</span>
            <span>{{ selectedPlayer.powers || 'None' }}</span>
          </div>
        </div>
        
        <div class="profile-actions">
          <h3>Admin Actions</h3>
          <button @click="joinPlayer(selectedPlayer)" class="action-btn join-game-btn">
            🎮 Join Their Game
          </button>
          
          <div class="give-coins-section">
            <h4>💝 Give Coins</h4>
            <div class="coin-buttons-grid">
              <button @click="giveCoinsToPlayer(selectedPlayer, 100)" class="coin-give-btn">
                Give 100 Coins
              </button>
              <button @click="giveCoinsToPlayer(selectedPlayer, 500)" class="coin-give-btn">
                Give 500 Coins
              </button>
              <button @click="giveCoinsToPlayer(selectedPlayer, 1000)" class="coin-give-btn">
                Give 1000 Coins
              </button>
              <button @click="giveCoinsToPlayer(selectedPlayer, 1000000000000000000000)" class="coin-give-btn special">
                Give 1 Sextillion Coins
              </button>
            </div>
            <p v-if="giftMessage" class="gift-message">{{ giftMessage }}</p>
          </div>
        </div>
        
        <button @click="selectedPlayer = null" class="close-profile-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gameState } from '../components/shared/GameState'

interface Player {
  id: number
  name: string
  avatar: string
  status: 'online' | 'offline' | 'playing'
  statusText: string
  currentGame?: string
  score?: number
  coins?: number
  powers?: string
}

const showPanel = ref(false)
const isModerator = ref(false)
const secretCode = ref('')
const showGeometryDashAdmin = ref(false)
const showBrainrotAdmin = ref(false)
const powersGranted = ref(false)
const scoreSet = ref(false)
const selectedPlayer = ref<Player | null>(null)
const giftMessage = ref('')

// Fake players data
const players = ref<Player[]>([
  { id: 1, name: 'CoolGamer42', avatar: '😎', status: 'playing', statusText: 'In Game', currentGame: 'Geometry Dash' },
  { id: 2, name: 'NinjaKid', avatar: '🥷', status: 'online', statusText: 'Online' },
  { id: 3, name: 'ProPlayer99', avatar: '🎮', status: 'playing', statusText: 'In Game', currentGame: 'Geometry Dash' },
  { id: 4, name: 'SpeedRunner', avatar: '⚡', status: 'offline', statusText: 'Offline' },
  { id: 5, name: 'MasterJumper', avatar: '🦘', status: 'online', statusText: 'Online' },
  { id: 6, name: 'PixelHero', avatar: '🟦', status: 'playing', statusText: 'In Game', currentGame: 'Space Shooter' },
  { id: 7, name: 'GameWizard', avatar: '🧙', status: 'offline', statusText: 'Offline' },
  { id: 8, name: 'SuperStar', avatar: '⭐', status: 'online', statusText: 'Online' },
  { id: 9, name: 'RocketMan', avatar: '🚀', status: 'offline', statusText: 'Offline' },
  { id: 10, name: 'TheBoss', avatar: '👑', status: 'playing', statusText: 'In Game', currentGame: 'Geometry Dash' },
  { id: 11, name: 'LuckyDuck', avatar: '🦆', status: 'offline', statusText: 'Offline' },
  { id: 12, name: 'FireDragon', avatar: '🐉', status: 'online', statusText: 'Online' },
])

// Fake Geometry Dash players currently in game
const geometryDashPlayers = computed(() => {
  return players.value
    .filter(p => p.currentGame === 'Geometry Dash')
    .map(p => ({
      ...p,
      score: Math.floor(Math.random() * 1000), // Random score
      coins: Math.floor(Math.random() * 5000), // Random coins
      powers: Math.random() > 0.5 ? 'Rage Table, Super Jump' : 'None'
    }))
})

const onlineCount = computed(() => players.value.filter(p => p.status === 'online').length)
const playingCount = computed(() => players.value.filter(p => p.status === 'playing').length)
const offlineCount = computed(() => players.value.filter(p => p.status === 'offline').length)

const openPanel = () => {
  showPanel.value = true
  // Check if user is Rylan (exclusive access)
  const isRylan = localStorage.getItem('isRylan') === 'true'
  isModerator.value = isRylan
  
  // Auto-grant Rylan access on first open (one-time setup)
  if (!isRylan && !localStorage.getItem('rylanSetupDone')) {
    localStorage.setItem('isRylan', 'true')
    localStorage.setItem('isModerator', 'true')
    localStorage.setItem('rylanSetupDone', 'true')
    isModerator.value = true
    console.log('👑 Rylan access auto-granted! Welcome!')
  }
  
  secretCode.value = ''
}

const closePanel = () => {
  showPanel.value = false
  secretCode.value = ''
  // Keep moderator status when closing (can only be changed by developer)
}

// Secret keyboard shortcut: Ctrl+Shift+M (only opens panel, doesn't grant access)
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    openPanel()
  }
  
  // No secret codes work anymore - moderator status must be set externally
}

// Admin functions
const giveAllPowers = () => {
  // Give all powers (1, 2, 3 for Rage Table, Super Jump, Kamehame haaa)
  for (let i = 1; i <= 3; i++) {
    if (!gameState.hasPower(i)) {
      gameState.purchasePower(i)
    }
  }
  powersGranted.value = true
  setTimeout(() => {
    powersGranted.value = false
  }, 3000)
}

const setHighScore = (score: number) => {
  gameState.updateHighScore(score)
  scoreSet.value = true
  
  // Show epic success message
  const epicMsg = document.createElement('div')
  epicMsg.innerHTML = `<div style="font-size: 48px;">🔥🏆🔥</div><div>HIGH SCORE: 1 SEXTILLION!</div><div style="font-size: 20px;">ABSOLUTELY LEGENDARY!</div>`
  epicMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #ff0000, #ff6600, #ffff00); color: white; padding: 40px; border-radius: 20px; font-size: 36px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 50px rgba(255, 0, 0, 1);'
  document.body.appendChild(epicMsg)
  
  // Add epic animation
  epicMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.3) rotate(720deg)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1) rotate(720deg)', opacity: 1 }
  ], {
    duration: 1000,
    easing: 'ease-out'
  })
  
  setTimeout(() => {
    epicMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 }
    ], {
      duration: 500,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(epicMsg)
  }, 3500)
  
  setTimeout(() => {
    scoreSet.value = false
  }, 4000)
}

const giveCoins = (amount: number) => {
  gameState.addCoins(amount)
  
  // Format the amount for display
  let displayAmount = ''
  if (amount >= 1000000000000000000000) {
    displayAmount = '1 SEXTILLION'
  } else if (amount >= 1000000000000) {
    displayAmount = '1 TRILLION'
  } else if (amount >= 1000000000) {
    displayAmount = '1 BILLION'
  } else if (amount >= 1000000) {
    displayAmount = '1 MILLION'
  } else {
    displayAmount = amount.toLocaleString()
  }
  
  // Show success message
  const successMsg = document.createElement('div')
  successMsg.innerHTML = `<div style="font-size: 32px;">💰💰💰</div><div>+${displayAmount} coins added!</div>`
  successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #ffd700, #ffed4e); color: black; padding: 30px; border-radius: 15px; font-size: 28px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);'
  document.body.appendChild(successMsg)
  
  // Add sparkle animation
  successMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
  ], {
    duration: 500,
    easing: 'ease-out'
  })
  
  setTimeout(() => {
    successMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(successMsg)
  }, 2500)
}

const viewPlayerProfile = (player: Player) => {
  selectedPlayer.value = player
  giftMessage.value = ''
}

const joinPlayer = (player: Player) => {
  // Simulate joining their game
  alert(`Joining ${player.name}'s game... You would see their gameplay here!`)
  selectedPlayer.value = null
}

const giveCoinsToPlayer = (player: Player, amount: number) => {
  // This is a moderator power - they can give coins without spending their own
  // Format the amount for display
  let displayAmount = ''
  if (amount >= 1000000000000000000000) {
    displayAmount = '1 SEXTILLION'
  } else {
    displayAmount = amount.toLocaleString()
  }
  
  giftMessage.value = `✨ You gave ${displayAmount} coins to ${player.name}! How generous!`
  
  // Update the player's displayed coins
  if (player.coins !== undefined) {
    player.coins += amount
  }
  
  // If it's a sextillion, show special effects
  if (amount >= 1000000000000000000000) {
    // Show mega success message
    const megaMsg = document.createElement('div')
    megaMsg.innerHTML = `<div style="font-size: 48px;">💰💎🌟</div><div>SEXTILLION COINS!</div><div style="font-size: 20px;">Lucky ${player.name}!</div>`
    megaMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #ffd700, #ff00ff, #00ffff); color: white; padding: 40px; border-radius: 20px; font-size: 36px; font-weight: bold; text-align: center; z-index: 10002; box-shadow: 0 0 50px rgba(255, 215, 0, 1);'
    document.body.appendChild(megaMsg)
    
    // Add sparkle animation
    megaMsg.animate([
      { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.2) rotate(360deg)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(360deg)', opacity: 1 }
    ], {
      duration: 800,
      easing: 'ease-out'
    })
    
    setTimeout(() => {
      megaMsg.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 }
      ], {
        duration: 400,
        easing: 'ease-in'
      }).onfinish = () => document.body.removeChild(megaMsg)
    }, 3000)
  }
  
  setTimeout(() => {
    giftMessage.value = ''
  }, 3000)
}

// Brainrot Evolution admin functions
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
  activePets?: Pet[]
}

const giveBrainrotPet = (name: string, damage: number, rarity: string) => {
  // Load current game data
  const saved = localStorage.getItem('brainrotEvolution3D')
  let gameData: GameData

  if (saved) {
    gameData = JSON.parse(saved)
  } else {
    gameData = {
      playerX: 0,
      playerZ: 0,
      coinsCollectedCount: 0,
      hasMetTungTung: false,
      level: 1,
      exp: 0,
      orangeHP: [200, 200, 200, 200, 200],
      pets: [],
      activePets: []
    }
  }

  // Ensure pets array exists
  if (!gameData.pets) {
    gameData.pets = []
  }

  // Ensure activePets array exists
  if (!gameData.activePets) {
    gameData.activePets = []
  }

  // Create new pet
  const newPet: Pet = {
    id: `${name.toLowerCase().replace(/\s/g, '')}-${Date.now()}-${Math.random()}`,
    name,
    damage,
    rarity
  }

  gameData.pets.push(newPet)

  // Auto-equip if less than 3 active pets
  if (gameData.activePets.length < 3) {
    gameData.activePets.push(newPet)
  }

  // Save back to localStorage
  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData))

  // Debug logging
  console.log('=== GAVE PET DEBUG ===')
  console.log('Pet given:', newPet)
  console.log('Total pets now:', gameData.pets.length)
  console.log('Active pets now:', gameData.activePets.length)
  console.log('Saved to localStorage:', localStorage.getItem('brainrotEvolution3D'))
  console.log('=== END DEBUG ===')

  // Show success message
  const successMsg = document.createElement('div')
  successMsg.innerHTML = `<div style="font-size: 32px;">🐾</div><div>Gave ${name} pet!</div><div style="font-size: 14px;">${damage}x damage (${rarity})</div><div style="font-size: 12px; margin-top: 10px; color: #ffed4e;">Reload Brainrot Evolution to see it!</div>`
  successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #9f7aea, #667eea); color: white; padding: 30px; border-radius: 15px; font-size: 24px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 30px rgba(159, 122, 234, 0.8);'
  document.body.appendChild(successMsg)

  successMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
  ], {
    duration: 500,
    easing: 'ease-out'
  })

  setTimeout(() => {
    successMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(successMsg)
  }, 2500)
}

const setBrainrotLevel = (level: number) => {
  // Load current game data
  const saved = localStorage.getItem('brainrotEvolution3D')
  let gameData: GameData

  if (saved) {
    gameData = JSON.parse(saved)
  } else {
    gameData = {
      playerX: 0,
      playerZ: 0,
      coinsCollectedCount: 0,
      hasMetTungTung: false,
      level: 1,
      exp: 0,
      orangeHP: [200, 200, 200, 200, 200],
      pets: [],
      activePets: []
    }
  }

  gameData.level = level
  gameData.exp = 0 // Reset exp when setting level

  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData))

  // Show success message
  const successMsg = document.createElement('div')
  successMsg.innerHTML = `<div style="font-size: 32px;">⭐</div><div>Level set to ${level}!</div><div style="font-size: 16px; margin-top: 10px;">Reload the game to see changes</div>`
  successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #ffd700, #ff6347); color: white; padding: 30px; border-radius: 15px; font-size: 24px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);'
  document.body.appendChild(successMsg)

  successMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
  ], {
    duration: 500,
    easing: 'ease-out'
  })

  setTimeout(() => {
    successMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(successMsg)
  }, 3000)
}

const giveBrainrotExp = (amount: number) => {
  // Load current game data
  const saved = localStorage.getItem('brainrotEvolution3D')
  let gameData: GameData

  if (saved) {
    gameData = JSON.parse(saved)
  } else {
    gameData = {
      playerX: 0,
      playerZ: 0,
      coinsCollectedCount: 0,
      hasMetTungTung: false,
      level: 1,
      exp: 0,
      orangeHP: [200, 200, 200, 200, 200],
      pets: [],
      activePets: []
    }
  }

  gameData.exp += amount

  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData))

  // Show success message
  const successMsg = document.createElement('div')
  successMsg.innerHTML = `<div style="font-size: 32px;">⚡</div><div>+${amount} EXP!</div>`
  successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #00ffff, #00ff00); color: black; padding: 30px; border-radius: 15px; font-size: 24px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);'
  document.body.appendChild(successMsg)

  successMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
  ], {
    duration: 500,
    easing: 'ease-out'
  })

  setTimeout(() => {
    successMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(successMsg)
  }, 2500)
}

const resetBrainrotProgress = () => {
  if (!confirm('Are you SURE you want to reset ALL Brainrot Evolution progress? This cannot be undone!')) {
    return
  }

  // Clear all Brainrot Evolution data
  localStorage.removeItem('brainrotEvolution3D')

  // Also clear the gameCoins if you want to reset coins too
  const currentCoins = gameState.getCoins()
  if (currentCoins > 0) {
    gameState.spendCoins(currentCoins)
  }

  // Show success message
  const successMsg = document.createElement('div')
  successMsg.innerHTML = `<div style="font-size: 48px;">🔄</div><div>Progress Reset!</div><div style="font-size: 14px;">All Brainrot Evolution data cleared</div>`
  successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(45deg, #ff0000, #ff6347); color: white; padding: 40px; border-radius: 15px; font-size: 28px; font-weight: bold; text-align: center; z-index: 10000; box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);'
  document.body.appendChild(successMsg)

  successMsg.animate([
    { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
  ], {
    duration: 500,
    easing: 'ease-out'
  })

  setTimeout(() => {
    successMsg.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in'
    }).onfinish = () => document.body.removeChild(successMsg)
  }, 2500)
}

// Randomly update player statuses
const updateStatuses = () => {
  const randomPlayer = players.value[Math.floor(Math.random() * players.value.length)]
  const statuses: Array<'online' | 'offline' | 'playing'> = ['online', 'offline', 'playing']
  const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
  
  randomPlayer.status = newStatus
  randomPlayer.statusText = newStatus === 'playing' ? 'In Game' : newStatus === 'online' ? 'Online' : 'Offline'
  
  if (newStatus === 'playing') {
    const games = ['Geometry Dash', 'Space Shooter', 'Puzzle Master', 'Racing Pro']
    randomPlayer.currentGame = games[Math.floor(Math.random() * games.length)]
  } else {
    randomPlayer.currentGame = undefined
  }
}

let updateInterval: number

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  // Update statuses every 5 seconds
  updateInterval = setInterval(updateStatuses, 5000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  clearInterval(updateInterval)
})
</script>

<style scoped>
.moderator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.moderator-panel {
  background: #1a1a1a;
  border: 2px solid #00ff00;
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
}

.panel-header {
  background: #000;
  color: #00ff00;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #00ff00;
}

.panel-header h2 {
  margin: 0;
  font-family: monospace;
}

.close-btn {
  background: #ff0000;
  color: white;
  border: none;
  padding: 5px 15px;
  cursor: pointer;
  font-size: 20px;
  border-radius: 5px;
}

.close-btn:hover {
  background: #cc0000;
}

.access-denied {
  padding: 100px 20px;
  text-align: center;
}

.access-denied h1 {
  color: #ff0000;
  font-size: 48px;
  margin-bottom: 10px;
  animation: blink 0.5s infinite;
}

.access-denied p {
  color: #ff0000;
  font-size: 24px;
  font-family: monospace;
}

.access-denied .warning {
  color: #ff8800;
  font-size: 16px;
  margin-top: 20px;
  text-transform: uppercase;
}

.access-denied .small-text {
  color: #ff6666;
  font-size: 14px;
  margin-top: 10px;
  font-style: italic;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-box {
  background: #2a2a2a;
  border: 1px solid #00ff00;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-number {
  font-size: 36px;
  color: #00ff00;
  font-weight: bold;
}

.stat-label {
  color: #888;
  margin-top: 5px;
}

.player-list h3 {
  color: #00ff00;
  margin-bottom: 20px;
  font-family: monospace;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.player-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.player-card.online {
  border-color: #00ff00;
}

.player-card.playing {
  border-color: #ffff00;
  background: #2a2a1a;
}

.player-card.offline {
  opacity: 0.6;
}

.player-avatar {
  font-size: 32px;
}

.player-info {
  flex: 1;
}

.player-name {
  color: white;
  font-weight: bold;
  margin-bottom: 5px;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #888;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
}

.status-dot.online {
  background: #00ff00;
}

.status-dot.playing {
  background: #ffff00;
}

.status-dot.offline {
  background: #ff0000;
}

.player-game {
  color: #ffff00;
  font-size: 12px;
  margin-top: 5px;
}

.admin-controls {
  margin-bottom: 20px;
  text-align: center;
}

.game-admin-btn {
  background: #4a00ff;
  color: white;
  border: 2px solid #00ff00;
  padding: 15px 30px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  font-family: monospace;
  transition: all 0.3s;
}

.game-admin-btn:hover {
  background: #6a00ff;
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
}

.admin-commands {
  background: #1a1a1a;
  border: 2px solid #4a00ff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.admin-commands h3 {
  color: #00ff00;
  margin-bottom: 20px;
  text-align: center;
  font-size: 24px;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.command-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
}

.command-card h4 {
  color: #ffff00;
  margin-bottom: 15px;
}

.players-in-game {
  max-height: 150px;
  overflow-y: auto;
}

.ingame-player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 5px 0;
  padding: 5px;
  background: #1a1a1a;
  border-radius: 5px;
}

.player-info {
  color: #00ff00;
  font-family: monospace;
}

.join-btn {
  background: #4a5568;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 12px;
}

.join-btn:hover {
  background: #667eea;
}

.no-players {
  color: #888;
  font-style: italic;
}

.admin-action-btn {
  background: #00aa00;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
  transition: all 0.3s;
}

.admin-action-btn:hover {
  background: #00ff00;
  color: black;
  transform: scale(1.1);
}

.admin-action-btn.special-score {
  background: linear-gradient(45deg, #ff0000, #ff6600, #ffff00);
  color: white;
  font-weight: bold;
  animation: flame 2s ease-in-out infinite;
}

.admin-action-btn.special-score:hover {
  background: linear-gradient(45deg, #ff6600, #ffff00, #ff0000);
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
}

@keyframes flame {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

.success-msg {
  color: #00ff00;
  margin-top: 10px;
  font-weight: bold;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.profile-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.profile-content {
  background: #1a1a1a;
  border: 2px solid #00ff00;
  border-radius: 10px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
}

.profile-content h2 {
  color: #00ff00;
  margin-bottom: 20px;
  text-align: center;
}

.profile-stats {
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  color: white;
}

.stat-label {
  color: #888;
}

.status-online { color: #00ff00; }
.status-playing { color: #ffff00; }
.status-offline { color: #ff0000; }

.profile-actions {
  margin-top: 20px;
}

.profile-actions h3 {
  color: #ffff00;
  margin-bottom: 15px;
}

.action-btn {
  background: #4a5568;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s;
}

.join-game-btn {
  background: #667eea;
  width: 100%;
  margin-bottom: 20px;
}

.join-game-btn:hover {
  background: #8899ff;
  transform: scale(1.05);
}

.give-coins-section {
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.give-coins-section h4 {
  color: #ffd700;
  margin-bottom: 10px;
}

.coin-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.coin-give-btn {
  background: #ffd700;
  color: #000;
  border: 2px solid #000;
  padding: 15px 10px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s;
}

.coin-give-btn:hover {
  background: #ffed4e;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
}

.coin-give-btn.special {
  background: linear-gradient(45deg, #ffd700, #ff00ff, #00ffff);
  color: white;
  grid-column: 1 / -1;
  font-size: 16px;
  animation: rainbow 3s linear infinite;
}

@keyframes rainbow {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.gift-message {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
}

.close-profile-btn {
  background: #ff0000;
  color: white;
  border: none;
  padding: 10px 20px;
  width: 100%;
  margin-top: 20px;
  cursor: pointer;
  border-radius: 5px;
}

.close-profile-btn:hover {
  background: #cc0000;
}

.brainrot-btn {
  background: #9f7aea;
  border: 2px solid #667eea;
}

.brainrot-btn:hover {
  background: #b794f4;
  box-shadow: 0 0 20px rgba(159, 122, 234, 0.5);
}

.special-dragon {
  background: linear-gradient(45deg, #ff6b6b, #ff0000, #ff6b6b);
  color: white;
  font-weight: bold;
  animation: dragon-glow 2s ease-in-out infinite;
}

.special-dragon:hover {
  background: linear-gradient(45deg, #ff0000, #ff6b6b, #ff0000);
  transform: scale(1.15);
  box-shadow: 0 0 25px rgba(255, 0, 0, 0.8);
}

@keyframes dragon-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.special-moderator {
  background: linear-gradient(45deg, #ffd700, #ffed4e, #ffa500, #ffd700);
  background-size: 300% 300%;
  color: #000;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: moderator-rainbow 3s ease-in-out infinite, moderator-glow 2s ease-in-out infinite;
  border: 3px solid #fff;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3);
}

.special-moderator:hover {
  background: linear-gradient(45deg, #ffed4e, #ffd700, #ffa500, #ffed4e);
  background-size: 300% 300%;
  transform: scale(1.15);
  box-shadow: 0 0 40px rgba(255, 215, 0, 1), inset 0 0 30px rgba(255, 255, 255, 0.5);
}

@keyframes moderator-rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes moderator-glow {
  0%, 100% { filter: brightness(1.2) drop-shadow(0 0 10px gold); }
  50% { filter: brightness(1.5) drop-shadow(0 0 20px gold); }
}

.special-reset {
  background: linear-gradient(45deg, #ff0000, #cc0000);
  color: white;
  font-weight: bold;
}

.special-reset:hover {
  background: linear-gradient(45deg, #cc0000, #ff0000);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
}

.warning-text {
  color: #ff6666;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
  font-style: italic;
}
</style>