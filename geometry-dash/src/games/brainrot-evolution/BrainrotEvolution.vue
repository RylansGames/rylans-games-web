<template>
  <div class="game-wrapper">
    <AdminAbuseSign />
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>
    <button class="auto-attack-button" @click="toggleAutoAttack">
      {{ autoAttackEnabled ? '🗡️ Auto Attack: ON' : '⚔️ Auto Attack: OFF' }}
    </button>
    <button class="inventory-button" @click="toggleInventory">
      🎒 Inventory
    </button>
    <button class="pet-button" @click="togglePets">
      🐾 Pets
    </button>
    <button class="fullscreen-button" @click="toggleFullscreen">
      {{ isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen' }}
    </button>
    <button class="restart-button" @click="restartGame">
      🔄 Restart
    </button>

    <!-- Inventory Panel -->
    <div v-if="inventoryOpen" class="inventory-panel">
      <div class="inventory-header">
        <h2>🎒 Inventory</h2>
        <button class="inventory-close" @click="toggleInventory">✕</button>
      </div>
      <div class="inventory-content">
        <div class="inventory-section">
          <h3>📍 Current World</h3>
          <div class="world-info">
            <div class="world-name">Tung Tung Park</div>
            <div class="world-character">
              <canvas ref="characterCanvas" width="80" height="80" class="character-circle"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Egg Opening Panel -->
    <div v-if="showEggPanel" class="egg-panel">
      <div class="egg-panel-header">
        <h3>🥚 Common Egg - 10 coins each</h3>
      </div>
      <div class="egg-panel-buttons">
        <button class="egg-open-button" @click="openMultipleEggs(1)">
          Open 1<br><span class="egg-cost">10 coins</span>
        </button>
        <button class="egg-open-button" @click="openMultipleEggs(2)">
          Open 2<br><span class="egg-cost">20 coins</span>
        </button>
        <button class="egg-open-button" @click="openMultipleEggs(3)">
          Open 3<br><span class="egg-cost">30 coins</span>
        </button>
      </div>
      <div v-if="eggResults.length > 0" class="egg-results">
        <h4>You got:</h4>
        <div v-for="(pet, index) in eggResults" :key="index" class="egg-result-item">
          {{ pet.name }} ({{ pet.rarity }}) - {{ pet.damage }}x damage
        </div>
      </div>
    </div>

    <!-- Pets Panel -->
    <div v-if="petsOpen" class="pets-panel">
      <div class="pets-panel-header">
        <h2>🐾 Your Pets</h2>
        <button class="pets-close" @click="togglePets">✕</button>
      </div>
      <div class="pets-content">
        <div v-if="gameData.activePets && gameData.activePets.length > 0" class="active-pet-section">
          <h3>Active Pets ({{ gameData.activePets.length }}/3):</h3>
          <div class="active-pets-grid">
            <div v-for="pet in gameData.activePets" :key="pet.id" class="active-pet-card">
              <div class="pet-name">{{ pet.name }}</div>
              <div class="pet-rarity">{{ pet.rarity }}</div>
              <div class="pet-damage">{{ pet.damage }}x Damage</div>
              <button @click="equipPet(pet)" class="unequip-button">Unequip</button>
            </div>
          </div>
        </div>

        <div class="pet-collection-section">
          <div class="collection-header">
            <h3>Pet Collection ({{ gameData.pets?.length || 0 }} pets):</h3>
            <button v-if="gameData.pets && gameData.pets.length > 0" @click="equipBestPets" class="equip-best-button">
              ⭐ Equip Best Pets
            </button>
          </div>

          <!-- Rarity Delete Buttons -->
          <div v-if="gameData.pets && gameData.pets.length > 0" class="rarity-delete-section">
            <h4>🗑️ Delete by Rarity:</h4>
            <div class="rarity-buttons">
              <button @click="deletePetsByRarity('Common')" class="rarity-delete-btn common">
                Common
              </button>
              <button @click="deletePetsByRarity('Rare')" class="rarity-delete-btn rare">
                Rare
              </button>
              <button @click="deletePetsByRarity('Epic')" class="rarity-delete-btn epic">
                Epic
              </button>
              <button @click="deletePetsByRarity('Legendary')" class="rarity-delete-btn legendary">
                Legendary
              </button>
              <button @click="deletePetsByRarity('Mythic')" class="rarity-delete-btn mythic">
                Mythic
              </button>
              <button @click="deletePetsByRarity('MODERATOR')" class="rarity-delete-btn moderator">
                MODERATOR
              </button>
            </div>
          </div>

          <div v-if="!gameData.pets || gameData.pets.length === 0" class="no-pets">
            No pets yet! Open eggs to get pets! 🥚
          </div>
          <div v-else class="pet-grid">
            <div v-for="pet in gameData.pets" :key="pet.id" class="pet-card" :class="{ 'is-active': gameData.activePets?.some(p => p.id === pet.id) }">
              <div class="pet-card-name">{{ pet.name }}</div>
              <div class="pet-card-rarity" :class="'rarity-' + pet.rarity.toLowerCase()">{{ pet.rarity }}</div>
              <div class="pet-card-damage">{{ pet.damage }}x damage</div>
              <button v-if="!gameData.activePets?.some(p => p.id === pet.id)" @click="equipPet(pet)" class="equip-button">Equip</button>
              <div v-else class="equipped-badge">✓ Equipped</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="gameContainer" class="game-container">
      <div class="hud">
        <div class="hud-title">🧠 BRAINROT EVOLUTION 3D 🧠</div>
        <div class="hud-info">{{ infoText }}</div>
        <div class="hud-coins">Coins: {{ gameState.getCoins() }}</div>
        <div v-if="gameData.activePets && gameData.activePets.length > 0" class="hud-pets">
          Active Pets ({{ gameData.activePets.length }}/3):
          <div v-for="pet in gameData.activePets" :key="pet.id" class="hud-pet-item">
            {{ pet.name }} ({{ pet.damage }}x)
          </div>
        </div>
      </div>
      <div class="controls-hint">
        WASD/Arrows: Move | Mouse: Look Around | SPACE: Jump | B: Toggle Camera | Left Click: Hit Apple
      </div>

      <!-- Level/EXP Bar at Bottom -->
      <div class="level-bar">
        <div class="level-bar-bg">
          <div class="level-bar-fill" :style="{ width: (playerExp / maxExp * 100) + '%' }"></div>
          <div class="level-text">Level {{ playerLevel }}</div>
          <div class="exp-text">{{ playerExp }}/{{ maxExp }} EXP</div>
        </div>
      </div>

      <!-- Level Up Shark -->
      <div v-if="showLevelUpShark" class="level-up-shark">
        <canvas ref="sharkCanvas" width="400" height="400" class="shark-canvas"></canvas>
        <div class="shark-name">{{ transformationName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'
import AdminAbuseSign from '../../components/shared/AdminAbuseSign.vue'

const gameContainer = ref<HTMLDivElement>()
const characterCanvas = ref<HTMLCanvasElement>()
const sharkCanvas = ref<HTMLCanvasElement>()
const router = useRouter()
const infoText = ref('Benvenuto! Welcome to the Italian Brainrot World! Find tung tung tung tung sahur! 🇮🇹🤌')
const coinsCollected = ref(0)
const autoAttackEnabled = ref(false)
const inventoryOpen = ref(false)
const petsOpen = ref(false)
const isFullscreen = ref(false)
const showEggPanel = ref(false)
const eggResults = ref<Pet[]>([])
const playerLevel = ref(1)
const playerExp = ref(0)
const maxExp = ref(10)
const showLevelUpShark = ref(false)
const transformationName = ref('tralalero tralala')

// Background music
let backgroundMusic: HTMLAudioElement | null = null

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let player: THREE.Mesh
let coins: THREE.Mesh[] = []
let rocks: THREE.Group[] = []
let apples: THREE.Mesh[] = []
let oranges: THREE.Mesh[] = []
let eggs: THREE.Mesh[] = []
let animationId: number
let isSharkForm = false

// Player movement
const moveSpeed = 0.15
const jumpPower = 0.3
const gravity = 0.015
let velocityY = 0
let isJumping = false
const playerHeight = 1.6

// Controls
const keys: Record<string, boolean> = {}
let mouseX = 0
let mouseY = 0
let yaw = 0
let pitch = 0
let isFirstPerson = true // Camera mode
let lastNPCInteraction = 0 // Cooldown timer for NPC interaction
let lastAppleAttack = 0 // Cooldown timer for apple attacks

// Pet data
interface Pet {
  id: string
  name: string
  damage: number
  rarity: string
}

// Game data
interface GameData {
  playerX: number
  playerZ: number
  coinsCollectedCount: number
  hasMetTungTung: boolean
  level: number
  exp: number
  orangeHP?: number[] // Track HP for each of the 5 oranges
  pets?: Pet[] // Player's pet collection
  activePets?: Pet[] // Up to 3 currently equipped pets
}

const gameData = ref<GameData>({
  playerX: 0,
  playerZ: 0,
  coinsCollectedCount: 0,
  hasMetTungTung: false,
  level: 1,
  exp: 0,
  pets: [],
  activePets: []
})

const goBack = () => {
  router.push('/')
}

const toggleAutoAttack = () => {
  autoAttackEnabled.value = !autoAttackEnabled.value
  if (autoAttackEnabled.value) {
    infoText.value = 'Auto Attack enabled! 🗡️'
  } else {
    infoText.value = 'Auto Attack disabled! ⚔️'
  }
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 2000)
}

const toggleInventory = () => {
  inventoryOpen.value = !inventoryOpen.value

  // Draw character face when inventory opens
  if (inventoryOpen.value) {
    setTimeout(() => {
      drawCharacterFace()
    }, 0)
  }
}

const togglePets = () => {
  petsOpen.value = !petsOpen.value
}

const equipBestPets = () => {
  if (!gameData.value.pets || gameData.value.pets.length === 0) {
    infoText.value = 'No pets to equip! 🐾'
    setTimeout(() => {
      infoText.value = 'Explore the brainrot world! 🧠'
    }, 2000)
    return
  }

  // Sort pets by damage (highest first)
  const sortedPets = [...gameData.value.pets].sort((a, b) => b.damage - a.damage)

  // Take top 3 pets
  const bestPets = sortedPets.slice(0, 3)

  // Equip the best pets
  gameData.value.activePets = bestPets

  saveGameData()

  // Show success message
  const petNames = bestPets.map(p => p.name).join(', ')
  infoText.value = `Equipped best pets: ${petNames}! 🌟`
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 3000)
}

const deletePetsByRarity = (rarity: string) => {
  if (!gameData.value.pets || gameData.value.pets.length === 0) {
    infoText.value = 'No pets to delete! 🐾'
    setTimeout(() => {
      infoText.value = 'Explore the brainrot world! 🧠'
    }, 2000)
    return
  }

  // Count how many pets of this rarity exist
  const petsToDelete = gameData.value.pets.filter(p => p.rarity === rarity)
  const count = petsToDelete.length

  if (count === 0) {
    infoText.value = `No ${rarity} pets found! 🔍`
    setTimeout(() => {
      infoText.value = 'Explore the brainrot world! 🧠'
    }, 2000)
    return
  }

  // Confirm deletion
  if (!confirm(`Delete all ${count} ${rarity} pet(s)? This cannot be undone!`)) {
    return
  }

  // Remove pets of this rarity from collection
  gameData.value.pets = gameData.value.pets.filter(p => p.rarity !== rarity)

  // Remove any of these pets from active pets
  if (gameData.value.activePets) {
    gameData.value.activePets = gameData.value.activePets.filter(p => p.rarity !== rarity)
  }

  saveGameData()

  // Show success message
  infoText.value = `Deleted ${count} ${rarity} pet(s)! 🗑️`
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 3000)
}

const equipPet = (pet: Pet) => {
  if (!gameData.value.activePets) {
    gameData.value.activePets = []
  }

  // Check if pet is already equipped
  const isEquipped = gameData.value.activePets.some(p => p.id === pet.id)

  if (isEquipped) {
    // Unequip the pet
    gameData.value.activePets = gameData.value.activePets.filter(p => p.id !== pet.id)
    infoText.value = `Unequipped ${pet.name}! 🐾`
  } else if (gameData.value.activePets.length < 3) {
    // Equip the pet if less than 3
    gameData.value.activePets.push(pet)
    infoText.value = `Equipped ${pet.name}! (${gameData.value.activePets.length}/3 pets active) 🐾`
  } else {
    // Can't equip more than 3
    infoText.value = `Max 3 pets! Unequip one first! 🐾`
  }

  saveGameData()
  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 2000)
}

const toggleFullscreen = () => {
  const elem = document.documentElement

  if (!document.fullscreenElement) {
    elem.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(err => {
      console.error('Error attempting to enable fullscreen:', err)
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(err => {
      console.error('Error attempting to exit fullscreen:', err)
    })
  }
}

const restartGame = () => {
  if (confirm('Are you sure you want to restart? This will reset your level back to 1 and clear all progress!')) {
    // Reset game data to starting values
    gameData.value = {
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

    // Reset player level and exp
    playerLevel.value = 1
    playerExp.value = 0
    maxExp.value = 10
    coinsCollected.value = 0

    // Save the reset data
    saveGameData()

    // Reload the page to restart the game
    location.reload()
  }
}

const restartProgress = () => {
  // Clear saved game data
  localStorage.removeItem('brainrotEvolution3D')
  // Reload the page to restart
  window.location.reload()
}

const openCommonEgg = (): Pet => {
  // Common egg pet pool with chances
  const random = Math.random() * 100 // 0-100

  // Dog: 45% (0-45)
  if (random < 45) {
    return {
      id: `dog-${Date.now()}-${Math.random()}`,
      name: 'Dog',
      damage: 1,
      rarity: 'Common'
    }
  }
  // Cat: 15% (45-60) - RARE
  else if (random < 60) {
    return {
      id: `cat-${Date.now()}-${Math.random()}`,
      name: 'Cat',
      damage: 1.25,
      rarity: 'Rare'
    }
  }
  // Cat Vampire: 5% (60-65) - EPIC
  else if (random < 65) {
    return {
      id: `catvampire-${Date.now()}-${Math.random()}`,
      name: 'Cat Vampire',
      damage: 1.50,
      rarity: 'Epic'
    }
  }
  // Mushroom Head: 1% (65-66) - LEGENDARY
  else if (random < 66) {
    return {
      id: `mushroomhead-${Date.now()}-${Math.random()}`,
      name: 'Mushroom Head',
      damage: 1.75,
      rarity: 'Legendary'
    }
  }
  // Dragon: 0.25% (66-66.25) - MYTHIC
  else if (random < 66.25) {
    return {
      id: `dragon-${Date.now()}-${Math.random()}`,
      name: 'Dragon',
      damage: 2,
      rarity: 'Mythic'
    }
  }
  // Fallback to Dog (remaining 33.75%)
  else {
    return {
      id: `dog-${Date.now()}-${Math.random()}`,
      name: 'Dog',
      damage: 1,
      rarity: 'Common'
    }
  }
}

const openMultipleEggs = (count: number) => {
  const price = 10 * count
  const currentCoins = gameState.getCoins()

  console.log(`Trying to open ${count} eggs. Price: ${price}, Current coins: ${currentCoins}`)

  if (currentCoins < price) {
    infoText.value = `Not enough coins! Need ${price}, have ${currentCoins} 💰`
    setTimeout(() => {
      infoText.value = 'Explore the brainrot world! 🧠'
    }, 2000)
    return
  }

  // Deduct coins
  gameState.spendCoins(price)

  // Open eggs and collect results
  const results: Pet[] = []
  for (let i = 0; i < count; i++) {
    const newPet = openCommonEgg()

    // Add pet to collection
    if (!gameData.value.pets) {
      gameData.value.pets = []
    }
    gameData.value.pets.push(newPet)

    // Auto-equip if less than 3 active pets
    if (!gameData.value.activePets) {
      gameData.value.activePets = []
    }
    if (gameData.value.activePets.length < 3) {
      gameData.value.activePets.push(newPet)
    }

    results.push(newPet)
  }

  // Show results
  eggResults.value = results

  // Save game data
  saveGameData()

  infoText.value = `Opened ${count} egg${count > 1 ? 's' : ''}! Check the panel for results! 🎉`

  setTimeout(() => {
    infoText.value = 'Explore the brainrot world! 🧠'
  }, 3000)
}

const drawCharacterFace = () => {
  if (!characterCanvas.value) return

  const canvas = characterCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 80, 80)

  // Draw circular border
  ctx.beginPath()
  ctx.arc(40, 40, 38, 0, Math.PI * 2)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 3
  ctx.stroke()

  // Fill circle with wood color
  ctx.fillStyle = '#8B4513'
  ctx.fill()

  // Add wood texture rings
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.arc(40, 40, 10 + i * 6, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Draw straight face

  // Left eye (black dot)
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(32, 35, 3, 0, Math.PI * 2)
  ctx.fill()

  // Right eye (black dot)
  ctx.beginPath()
  ctx.arc(48, 35, 3, 0, Math.PI * 2)
  ctx.fill()

  // Straight mouth (horizontal line)
  ctx.fillStyle = '#000000'
  ctx.fillRect(32, 45, 16, 1.5)

  // Draw mini bat on the side
  ctx.save()
  ctx.translate(57, 50)
  ctx.rotate(-Math.PI / 6)

  // Bat handle
  ctx.fillStyle = '#D2691E'
  ctx.fillRect(-0.5, 0, 1.5, 8)

  // Bat barrel
  ctx.beginPath()
  ctx.ellipse(0, -3, 2, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

const loadGameData = () => {
  const saved = localStorage.getItem('brainrotEvolution3D')
  if (saved) {
    const loadedData = JSON.parse(saved)

    // Migrate old activePet to activePets array
    let activePets = loadedData.activePets || []
    if (loadedData.activePet && !loadedData.activePets) {
      // Old save format - convert single pet to array
      activePets = [loadedData.activePet]
    }

    gameData.value = {
      ...loadedData,
      pets: loadedData.pets || [],
      activePets: activePets
    }
    coinsCollected.value = gameData.value.coinsCollectedCount
    playerLevel.value = gameData.value.level || 1
    playerExp.value = gameData.value.exp || 0

    // Set maxExp based on loaded level
    if (playerLevel.value === 1) maxExp.value = 10
    else if (playerLevel.value === 2) maxExp.value = 30
    else if (playerLevel.value === 3) maxExp.value = 50
    else if (playerLevel.value === 4) maxExp.value = 100
    else if (playerLevel.value === 5) maxExp.value = 150
    else if (playerLevel.value === 6) maxExp.value = 150
    else if (playerLevel.value === 7) maxExp.value = 200
    else if (playerLevel.value >= 8) maxExp.value = 200 // Max level

    // Log pets for debugging
    console.log('Loaded pets:', gameData.value.pets)
    console.log('Active pets:', gameData.value.activePets)
    console.log('Loaded level:', playerLevel.value, 'maxExp:', maxExp.value)
  }
}

const addExp = (amount: number) => {
  // Don't add exp if already at max level
  if (playerLevel.value >= 8) {
    infoText.value = '⭐ MAX LEVEL REACHED! Level 8 ⭐'
    setTimeout(() => {
      infoText.value = 'Explore the brainrot world! 🧠'
    }, 2000)
    return
  }

  playerExp.value += amount
  gameData.value.exp = playerExp.value

  // Check for level up
  if (playerExp.value >= maxExp.value) {
    playerExp.value -= maxExp.value
    playerLevel.value += 1
    gameData.value.level = playerLevel.value
    gameData.value.exp = playerExp.value

    // Cap at level 8
    if (playerLevel.value > 8) {
      playerLevel.value = 8
      gameData.value.level = 8
      playerExp.value = 0
      gameData.value.exp = 0
    }

    // Update max exp based on level
    if (playerLevel.value === 2) {
      maxExp.value = 30 // Level 2 requires 30 exp to reach level 3
    } else if (playerLevel.value === 3) {
      maxExp.value = 50 // Level 3 requires 50 exp
    } else if (playerLevel.value === 4) {
      maxExp.value = 100 // Level 4 requires 100 exp (chimpanzini bananini!)
    } else if (playerLevel.value === 5) {
      maxExp.value = 150 // Level 5 requires 150 exp
    } else if (playerLevel.value === 6) {
      maxExp.value = 150 // Level 6 requires 150 exp
    } else if (playerLevel.value === 7) {
      maxExp.value = 200 // Level 7 requires 200 exp
    }

    infoText.value = `🎉 LEVEL UP! You are now Level ${playerLevel.value}! 🎉`

    if (playerLevel.value === 8) {
      infoText.value = `🎉 LEVEL UP! MAX LEVEL REACHED! Level 8! 🎉⭐`
    }

    // Handle transformations based on level
    if (playerLevel.value === 2) {
      // Level 2: Transform into shark
      transformationName.value = 'tralalero tralala'
      showLevelUpShark.value = true
      setTimeout(() => {
        drawLevelUpShark()
      }, 0)

      if (!isSharkForm) {
        setTimeout(() => {
          transformToShark()
          infoText.value = `You have transformed into tralalero tralala! 🦈 You now deal 2 damage!`
        }, 1500)
      }

      setTimeout(() => {
        showLevelUpShark.value = false
        infoText.value = 'Explore the brainrot world as tralalero tralala! 🦈'
      }, 3000)
    } else if (playerLevel.value === 3) {
      // Level 3: Transform into military airplane with crocodile head
      transformationName.value = 'bombardido crocodilo'
      showLevelUpShark.value = true
      setTimeout(() => {
        drawCrocodilePlane()
      }, 0)

      setTimeout(() => {
        transformToCrocodilePlane()
        infoText.value = `You have transformed into bombardido crocodilo! 🐊✈️ You now deal 3 damage!`
      }, 1500)

      setTimeout(() => {
        showLevelUpShark.value = false
        infoText.value = 'Explore the brainrot world as bombardido crocodilo! 🐊✈️'
      }, 3000)
    } else if (playerLevel.value === 4) {
      // Level 4: Transform into banana with chimpanzee
      transformationName.value = 'chimpanzini'
      showLevelUpShark.value = true
      setTimeout(() => {
        drawChimpanzini()
      }, 0)

      setTimeout(() => {
        transformToChimpanzini()
        infoText.value = `You have transformed into chimpanzini! 🍌🐵 You now deal 4 damage!`
      }, 1500)

      setTimeout(() => {
        showLevelUpShark.value = false
        infoText.value = 'Explore the brainrot world as chimpanzini! 🍌🐵'
      }, 3000)
    }
  }
}

const drawLevelUpShark = () => {
  if (!sharkCanvas.value) return

  const canvas = sharkCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 400, 400)

  // Draw shark body (gray)
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.ellipse(200, 180, 120, 60, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw shark head
  ctx.beginPath()
  ctx.ellipse(280, 180, 60, 50, 0, 0, Math.PI * 2)
  ctx.fill()

  // Draw shark mouth (open)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(310, 190, 25, 0, Math.PI)
  ctx.fill()

  // Draw teeth
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(290 + i * 10, 190)
    ctx.lineTo(295 + i * 10, 200)
    ctx.lineTo(300 + i * 10, 190)
    ctx.fill()
  }

  // Draw eyes
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(290, 160, 8, 0, Math.PI * 2)
  ctx.fill()

  // Draw dorsal fin
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.moveTo(180, 130)
  ctx.lineTo(200, 80)
  ctx.lineTo(220, 130)
  ctx.fill()

  // Draw 3 LEGS with NIKES!

  // Leg 1 (front left)
  ctx.fillStyle = '#808080'
  ctx.fillRect(160, 240, 15, 60)
  // Nike shoe 1
  ctx.fillStyle = '#000000'
  ctx.fillRect(155, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(158, 310)
  ctx.lineTo(165, 305)
  ctx.lineTo(175, 315)
  ctx.stroke()

  // Leg 2 (middle)
  ctx.fillStyle = '#808080'
  ctx.fillRect(195, 240, 15, 60)
  // Nike shoe 2
  ctx.fillStyle = '#000000'
  ctx.fillRect(190, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(193, 310)
  ctx.lineTo(200, 305)
  ctx.lineTo(210, 315)
  ctx.stroke()

  // Leg 3 (back right)
  ctx.fillStyle = '#808080'
  ctx.fillRect(230, 240, 15, 60)
  // Nike shoe 3
  ctx.fillStyle = '#000000'
  ctx.fillRect(225, 300, 25, 20)
  // Nike swoosh
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(228, 310)
  ctx.lineTo(235, 305)
  ctx.lineTo(245, 315)
  ctx.stroke()

  // Draw tail
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.moveTo(80, 180)
  ctx.lineTo(50, 150)
  ctx.lineTo(50, 210)
  ctx.fill()
}

const drawCrocodilePlane = () => {
  if (!sharkCanvas.value) return

  const canvas = sharkCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 400, 400)

  // Draw military plane body (green camouflage)
  ctx.fillStyle = '#4a5d23'
  ctx.beginPath()
  ctx.ellipse(200, 200, 140, 40, 0, 0, Math.PI * 2)
  ctx.fill()

  // Camouflage pattern
  ctx.fillStyle = '#3a4d13'
  ctx.beginPath()
  ctx.arc(160, 190, 20, 0, Math.PI * 2)
  ctx.arc(220, 210, 25, 0, Math.PI * 2)
  ctx.arc(180, 205, 15, 0, Math.PI * 2)
  ctx.fill()

  // Draw wings (military green)
  ctx.fillStyle = '#4a5d23'
  // Left wing
  ctx.beginPath()
  ctx.moveTo(200, 180)
  ctx.lineTo(120, 160)
  ctx.lineTo(120, 200)
  ctx.lineTo(200, 200)
  ctx.fill()
  // Right wing
  ctx.beginPath()
  ctx.moveTo(200, 200)
  ctx.lineTo(120, 200)
  ctx.lineTo(120, 240)
  ctx.lineTo(200, 220)
  ctx.fill()

  // Draw tail fins
  ctx.fillStyle = '#4a5d23'
  // Top tail fin
  ctx.beginPath()
  ctx.moveTo(60, 200)
  ctx.lineTo(50, 160)
  ctx.lineTo(70, 190)
  ctx.fill()
  // Bottom tail fin
  ctx.beginPath()
  ctx.moveTo(60, 200)
  ctx.lineTo(50, 240)
  ctx.lineTo(70, 210)
  ctx.fill()

  // Draw CROCODILE HEAD at front!
  // Crocodile snout (long green)
  ctx.fillStyle = '#5d7a29'
  ctx.fillRect(340, 185, 60, 30)

  // Crocodile mouth line
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(340, 200)
  ctx.lineTo(400, 200)
  ctx.stroke()

  // Crocodile teeth (pointy!)
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 5; i++) {
    // Top teeth
    ctx.beginPath()
    ctx.moveTo(350 + i * 10, 200)
    ctx.lineTo(345 + i * 10, 190)
    ctx.lineTo(355 + i * 10, 200)
    ctx.fill()
    // Bottom teeth
    ctx.beginPath()
    ctx.moveTo(350 + i * 10, 200)
    ctx.lineTo(345 + i * 10, 210)
    ctx.lineTo(355 + i * 10, 200)
    ctx.fill()
  }

  // Crocodile head (main part)
  ctx.fillStyle = '#5d7a29'
  ctx.beginPath()
  ctx.arc(330, 200, 35, 0, Math.PI * 2)
  ctx.fill()

  // Crocodile eye (angry red!)
  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.arc(335, 190, 8, 0, Math.PI * 2)
  ctx.fill()

  // Crocodile pupil (vertical slit like a reptile!)
  ctx.fillStyle = '#000000'
  ctx.fillRect(333, 185, 4, 10)

  // Crocodile scales (bumpy texture)
  ctx.fillStyle = '#4a5d23'
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(320 + i * 10, 210, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw jet engines under wings
  ctx.fillStyle = '#808080'
  ctx.fillRect(140, 195, 20, 25)
  ctx.fillRect(140, 175, 20, 25)

  // Engine flames (rocket boosters!)
  ctx.fillStyle = '#ff4500'
  ctx.beginPath()
  ctx.moveTo(140, 202)
  ctx.lineTo(120, 195)
  ctx.lineTo(120, 210)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(140, 182)
  ctx.lineTo(120, 175)
  ctx.lineTo(120, 190)
  ctx.fill()

  // Cockpit window
  ctx.fillStyle = '#4da6ff'
  ctx.beginPath()
  ctx.arc(260, 200, 15, 0, Math.PI * 2)
  ctx.fill()

  // Military star emblem on wing
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const x = 150 + Math.cos(angle) * 12
    const y = 215 + Math.sin(angle) * 12
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

const drawChimpanzini = () => {
  if (!sharkCanvas.value) return

  const canvas = sharkCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, 400, 400)

  // Draw GIANT BANANA body
  // Banana body (curved yellow shape)
  ctx.fillStyle = '#ffe135'
  ctx.beginPath()
  ctx.moveTo(150, 150)
  ctx.quadraticCurveTo(120, 200, 150, 250)
  ctx.quadraticCurveTo(180, 280, 220, 280)
  ctx.quadraticCurveTo(260, 270, 280, 240)
  ctx.quadraticCurveTo(290, 200, 260, 160)
  ctx.quadraticCurveTo(230, 140, 150, 150)
  ctx.fill()

  // Banana highlights (lighter yellow)
  ctx.fillStyle = '#ffed4e'
  ctx.beginPath()
  ctx.moveTo(170, 170)
  ctx.quadraticCurveTo(160, 200, 180, 230)
  ctx.quadraticCurveTo(200, 250, 220, 250)
  ctx.quadraticCurveTo(240, 240, 250, 200)
  ctx.quadraticCurveTo(250, 170, 230, 160)
  ctx.lineTo(170, 170)
  ctx.fill()

  // Banana brown spots
  ctx.fillStyle = '#8B4513'
  const spots = [
    { x: 180, y: 180, r: 8 },
    { x: 210, y: 200, r: 10 },
    { x: 240, y: 190, r: 7 },
    { x: 190, y: 230, r: 9 },
    { x: 230, y: 240, r: 8 }
  ]
  spots.forEach(spot => {
    ctx.beginPath()
    ctx.ellipse(spot.x, spot.y, spot.r, spot.r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  })

  // Banana stem (brown at top)
  ctx.fillStyle = '#654321'
  ctx.beginPath()
  ctx.moveTo(150, 150)
  ctx.lineTo(140, 130)
  ctx.lineTo(145, 125)
  ctx.lineTo(155, 145)
  ctx.fill()

  // CHIMPANZEE sitting on/in the banana!
  // Chimp body (brown)
  ctx.fillStyle = '#654321'
  ctx.beginPath()
  ctx.arc(200, 200, 40, 0, Math.PI * 2)
  ctx.fill()

  // Chimp head (brown, slightly lighter)
  ctx.fillStyle = '#8B6F47'
  ctx.beginPath()
  ctx.arc(200, 170, 35, 0, Math.PI * 2)
  ctx.fill()

  // Chimp face (tan/peach color)
  ctx.fillStyle = '#daa06d'
  ctx.beginPath()
  ctx.ellipse(200, 175, 25, 22, 0, 0, Math.PI * 2)
  ctx.fill()

  // Chimp ears (large and round)
  ctx.fillStyle = '#8B6F47'
  ctx.beginPath()
  ctx.arc(170, 165, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(230, 165, 12, 0, Math.PI * 2)
  ctx.fill()

  // Inner ear (tan)
  ctx.fillStyle = '#daa06d'
  ctx.beginPath()
  ctx.arc(170, 165, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(230, 165, 6, 0, Math.PI * 2)
  ctx.fill()

  // Chimp eyes (big and expressive)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(190, 170, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(210, 170, 8, 0, Math.PI * 2)
  ctx.fill()

  // Pupils (brown)
  ctx.fillStyle = '#654321'
  ctx.beginPath()
  ctx.arc(190, 170, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(210, 170, 4, 0, Math.PI * 2)
  ctx.fill()

  // Chimp nose (two nostrils)
  ctx.fillStyle = '#654321'
  ctx.beginPath()
  ctx.arc(195, 182, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(205, 182, 3, 0, Math.PI * 2)
  ctx.fill()

  // Chimp mouth (big smile!)
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(200, 185, 12, 0, Math.PI)
  ctx.stroke()

  // Chimp teeth (showing excitement!)
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(188 + i * 4, 185, 3, 5)
  }

  // Chimp arms (one holding banana)
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 8
  // Left arm holding banana
  ctx.beginPath()
  ctx.moveTo(175, 210)
  ctx.lineTo(160, 240)
  ctx.lineTo(150, 220)
  ctx.stroke()

  // Right arm
  ctx.beginPath()
  ctx.moveTo(225, 210)
  ctx.lineTo(250, 230)
  ctx.stroke()

  // Chimp hands (grabbing banana)
  ctx.fillStyle = '#8B6F47'
  ctx.beginPath()
  ctx.arc(150, 220, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(250, 230, 10, 0, Math.PI * 2)
  ctx.fill()

  // Chimp legs
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(185, 235)
  ctx.lineTo(180, 270)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(215, 235)
  ctx.lineTo(220, 270)
  ctx.stroke()

  // Chimp feet
  ctx.fillStyle = '#8B6F47'
  ctx.beginPath()
  ctx.ellipse(180, 275, 12, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(220, 275, 12, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Small bananas around (banana bunch theme!)
  ctx.fillStyle = '#ffe135'
  const smallBananas = [
    { x: 280, y: 150, rot: 0.3 },
    { x: 120, y: 180, rot: -0.5 },
    { x: 300, y: 250, rot: 0.8 }
  ]

  smallBananas.forEach(banana => {
    ctx.save()
    ctx.translate(banana.x, banana.y)
    ctx.rotate(banana.rot)
    ctx.fillRect(-5, -15, 10, 30)
    ctx.restore()
  })
}

const saveGameData = () => {
  // Save orange HP
  gameData.value.orangeHP = oranges.map(orange => orange.userData.hp)
  localStorage.setItem('brainrotEvolution3D', JSON.stringify(gameData.value))
}

const init3DScene = () => {
  // Create scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a0033)
  scene.fog = new THREE.Fog(0x330066, 10, 100)

  // Create camera (first person view)
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  if (gameContainer.value) {
    gameContainer.value.appendChild(renderer.domElement)
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x6633ff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.8
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Add grid helper
  const gridHelper = new THREE.GridHelper(200, 40, 0x00cc00, 0x008800)
  scene.add(gridHelper)

  // Create player character as tung tung tung sahur (log with straight face and bat)
  const playerGroup = new THREE.Group()

  // LOG BODY - Brown wooden cylinder
  const playerLogGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32)

  // Create wood texture with rings
  const playerCanvas = document.createElement('canvas')
  playerCanvas.width = 512
  playerCanvas.height = 512
  const playerCtx = playerCanvas.getContext('2d')!

  // Wood color
  playerCtx.fillStyle = '#8B4513' // Brown
  playerCtx.fillRect(0, 0, 512, 512)

  // Add wood rings
  for (let i = 0; i < 10; i++) {
    playerCtx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    playerCtx.lineWidth = 2 + Math.random() * 3
    playerCtx.beginPath()
    playerCtx.arc(256, 256 + i * 20, 100 + i * 15, 0, Math.PI * 2)
    playerCtx.stroke()
  }

  const playerWoodTexture = new THREE.CanvasTexture(playerCanvas)
  const playerLogMaterial = new THREE.MeshStandardMaterial({
    map: playerWoodTexture,
    roughness: 0.8,
    metalness: 0.1
  })
  const playerLog = new THREE.Mesh(playerLogGeometry, playerLogMaterial)
  playerLog.castShadow = true
  playerGroup.add(playerLog)

  // STRAIGHT FACE - Simple dots and line

  // Left eye (black dot)
  const playerLeftEyeGeometry = new THREE.CircleGeometry(0.05, 16)
  const playerEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const playerLeftEye = new THREE.Mesh(playerLeftEyeGeometry, playerEyeMaterial)
  playerLeftEye.position.set(-0.12, 0.2, 0.31)
  playerGroup.add(playerLeftEye)

  // Right eye (black dot)
  const playerRightEye = new THREE.Mesh(playerLeftEyeGeometry, playerEyeMaterial)
  playerRightEye.position.set(0.12, 0.2, 0.31)
  playerGroup.add(playerRightEye)

  // Straight mouth (horizontal line)
  const playerMouthGeometry = new THREE.BoxGeometry(0.18, 0.02, 0.01)
  const playerMouth = new THREE.Mesh(playerMouthGeometry, playerEyeMaterial)
  playerMouth.position.set(0, 0, 0.31)
  playerGroup.add(playerMouth)

  // BASEBALL BAT - Wooden bat held by log
  const playerBatGroup = new THREE.Group()

  // Bat handle
  const playerHandleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 16)
  const playerBatMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2691E,
    roughness: 0.7
  })
  const playerHandle = new THREE.Mesh(playerHandleGeometry, playerBatMaterial)
  playerHandle.position.y = 0.2
  playerBatGroup.add(playerHandle)

  // Bat barrel (thicker part)
  const playerBarrelGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.5, 16)
  const playerBarrel = new THREE.Mesh(playerBarrelGeometry, playerBatMaterial)
  playerBarrel.position.y = 0.65
  playerBatGroup.add(playerBarrel)

  // Position bat to side of log, angled
  playerBatGroup.position.set(0.4, 0, 0)
  playerBatGroup.rotation.z = -Math.PI / 6 // Angle it
  playerBatGroup.castShadow = true
  playerGroup.add(playerBatGroup)

  playerGroup.position.set(gameData.value.playerX, playerHeight, gameData.value.playerZ)
  player = playerGroup as any
  scene.add(player)

  // Create walls around the world
  createWalls()

  // Create giant statue in center
  createStatue()

  // Create collectible coins
  createCoins()

  // Create rocks and apples
  createRocksAndApples()

  // Create oranges
  createOranges()

  // Create eggs at spawn
  createEggs()

  // Create cute elephant-cactus at corner
  createElephantCactus()

  // Create skybox with stars
  createStars()

  // Setup controls
  setupControls()

  // Start animation loop
  animate()

  // Auto-save every 5 seconds
  setInterval(saveGameData, 5000)
}

const transformToShark = () => {
  // Remove old player model
  scene.remove(player)

  // Create shark player
  const sharkGroup = new THREE.Group()

  // Shark body (gray ellipse)
  const bodyGeometry = new THREE.SphereGeometry(1, 16, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.scale.set(1.2, 0.6, 0.6)
  body.castShadow = true
  sharkGroup.add(body)

  // Shark head
  const headGeometry = new THREE.SphereGeometry(0.6, 16, 16)
  const head = new THREE.Mesh(headGeometry, bodyMaterial)
  head.position.set(1, 0, 0)
  head.scale.set(1, 0.8, 0.8)
  head.castShadow = true
  sharkGroup.add(head)

  // Eye
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye.position.set(1.2, 0.2, 0.3)
  sharkGroup.add(eye)

  // Dorsal fin
  const finGeometry = new THREE.ConeGeometry(0.3, 0.8, 4)
  const fin = new THREE.Mesh(finGeometry, bodyMaterial)
  fin.position.set(0, 1, 0)
  fin.rotation.x = Math.PI
  fin.castShadow = true
  sharkGroup.add(fin)

  // Tail
  const tailGeometry = new THREE.ConeGeometry(0.4, 0.8, 3)
  const tail = new THREE.Mesh(tailGeometry, bodyMaterial)
  tail.position.set(-1.5, 0, 0)
  tail.rotation.z = Math.PI / 2
  tail.castShadow = true
  sharkGroup.add(tail)

  // 3 LEGS with NIKES!
  const legPositions = [
    { x: 0.3, z: -0.5 },  // Front
    { x: -0.2, z: -0.5 }, // Middle
    { x: -0.7, z: -0.5 }  // Back
  ]

  legPositions.forEach(pos => {
    // Leg
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8)
    const leg = new THREE.Mesh(legGeometry, bodyMaterial)
    leg.position.set(pos.x, -0.8, pos.z)
    leg.castShadow = true
    sharkGroup.add(leg)

    // Nike shoe
    const shoeGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.35)
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial)
    shoe.position.set(pos.x, -1.3, pos.z)
    shoe.castShadow = true
    sharkGroup.add(shoe)

    // Nike swoosh (white stripe)
    const swooshGeometry = new THREE.PlaneGeometry(0.15, 0.05)
    const swooshMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const swoosh = new THREE.Mesh(swooshGeometry, swooshMaterial)
    swoosh.position.set(pos.x, -1.25, pos.z + 0.18)
    swoosh.rotation.z = -0.3
    sharkGroup.add(swoosh)
  })

  sharkGroup.position.copy(player.position)
  sharkGroup.rotation.copy(player.rotation)
  player = sharkGroup as any
  scene.add(player)
  isSharkForm = true
}

const transformToCrocodilePlane = () => {
  // Remove old player model
  scene.remove(player)

  // Create crocodile plane
  const planeGroup = new THREE.Group()

  // Plane body (military green with camouflage)
  const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5d23 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  planeGroup.add(body)

  // Camouflage spots
  const camoGeometry = new THREE.SphereGeometry(0.2, 8, 8)
  const camoMaterial = new THREE.MeshStandardMaterial({ color: 0x3a4d13 })
  const camoSpots = [
    { x: 0.5, y: 0.3, z: 0 },
    { x: -0.8, y: -0.2, z: 0 },
    { x: 0, y: 0.2, z: 0.3 }
  ]
  camoSpots.forEach(pos => {
    const spot = new THREE.Mesh(camoGeometry, camoMaterial)
    spot.position.set(pos.x, pos.y, pos.z)
    planeGroup.add(spot)
  })

  // Wings (large military wings)
  const wingGeometry = new THREE.BoxGeometry(0.1, 3, 1.2)
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5d23 })
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial)
  leftWing.position.set(0, 1.5, 0)
  leftWing.castShadow = true
  planeGroup.add(leftWing)

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial)
  rightWing.position.set(0, -1.5, 0)
  rightWing.castShadow = true
  planeGroup.add(rightWing)

  // Tail fins
  const tailFinGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.8)
  const tailFin1 = new THREE.Mesh(tailFinGeometry, wingMaterial)
  tailFin1.position.set(-1.5, 0.5, 0)
  tailFin1.rotation.z = Math.PI / 4
  tailFin1.castShadow = true
  planeGroup.add(tailFin1)

  const tailFin2 = new THREE.Mesh(tailFinGeometry, wingMaterial)
  tailFin2.position.set(-1.5, -0.5, 0)
  tailFin2.rotation.z = -Math.PI / 4
  tailFin2.castShadow = true
  planeGroup.add(tailFin2)

  // CROCODILE HEAD at front!
  // Crocodile head (main sphere)
  const headGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x5d7a29 })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.set(1.8, 0, 0)
  head.castShadow = true
  planeGroup.add(head)

  // Crocodile snout (long pointy)
  const snoutGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8)
  const snout = new THREE.Mesh(snoutGeometry, headMaterial)
  snout.rotation.z = Math.PI / 2
  snout.position.set(2.4, 0, 0)
  snout.castShadow = true
  planeGroup.add(snout)

  // Crocodile teeth (sharp!)
  const toothGeometry = new THREE.ConeGeometry(0.05, 0.15, 4)
  const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
  for (let i = 0; i < 8; i++) {
    const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
    const angle = (i / 8) * Math.PI * 2
    tooth.position.set(2.4 + Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0)
    tooth.rotation.x = angle
    planeGroup.add(tooth)
  }

  // Crocodile eyes (angry red!)
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
  const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye1.position.set(2, 0, 0.3)
  planeGroup.add(eye1)

  const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye2.position.set(2, 0, -0.3)
  planeGroup.add(eye2)

  // Crocodile pupils (vertical slits!)
  const pupilGeometry = new THREE.PlaneGeometry(0.03, 0.12)
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const pupil1 = new THREE.Mesh(pupilGeometry, pupilMaterial)
  pupil1.position.set(2.05, 0, 0.3)
  pupil1.rotation.y = Math.PI / 2
  planeGroup.add(pupil1)

  const pupil2 = new THREE.Mesh(pupilGeometry, pupilMaterial)
  pupil2.position.set(2.05, 0, -0.3)
  pupil2.rotation.y = Math.PI / 2
  planeGroup.add(pupil2)

  // Crocodile scales (bumpy texture on head)
  const scaleGeometry = new THREE.SphereGeometry(0.08, 6, 6)
  const scaleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5d23 })
  for (let i = 0; i < 5; i++) {
    const scale = new THREE.Mesh(scaleGeometry, scaleMaterial)
    scale.position.set(1.5 + i * 0.15, 0.25, 0)
    planeGroup.add(scale)
  }

  // Jet engines (under wings)
  const engineGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8)
  const engineMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 })
  const engine1 = new THREE.Mesh(engineGeometry, engineMaterial)
  engine1.position.set(0.5, 1.5, -0.5)
  engine1.rotation.x = Math.PI / 2
  engine1.castShadow = true
  planeGroup.add(engine1)

  const engine2 = new THREE.Mesh(engineGeometry, engineMaterial)
  engine2.position.set(0.5, -1.5, -0.5)
  engine2.rotation.x = Math.PI / 2
  engine2.castShadow = true
  planeGroup.add(engine2)

  // Engine flames (rocket boosters!)
  const flameGeometry = new THREE.ConeGeometry(0.15, 0.4, 8)
  const flameMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 0.8 })
  const flame1 = new THREE.Mesh(flameGeometry, flameMaterial)
  flame1.position.set(0.5, 1.5, -1)
  flame1.rotation.x = -Math.PI / 2
  planeGroup.add(flame1)

  const flame2 = new THREE.Mesh(flameGeometry, flameMaterial)
  flame2.position.set(0.5, -1.5, -1)
  flame2.rotation.x = -Math.PI / 2
  planeGroup.add(flame2)

  // Cockpit window (blue tinted)
  const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16)
  const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x4da6ff, transparent: true, opacity: 0.7, metalness: 0.8 })
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial)
  cockpit.position.set(0.8, 0, 0.45)
  planeGroup.add(cockpit)

  // Military star emblem on wing
  const starGeometry = new THREE.CircleGeometry(0.2, 5)
  const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const star = new THREE.Mesh(starGeometry, starMaterial)
  star.position.set(0, 1.5, 0.05)
  star.rotation.x = Math.PI / 2
  planeGroup.add(star)

  planeGroup.position.copy(player.position)
  planeGroup.rotation.copy(player.rotation)
  // Rotate to face forward properly
  planeGroup.rotation.y = Math.PI / 2
  player = planeGroup as any
  scene.add(player)
  isSharkForm = false // No longer shark
}

const transformToChimpanzini = () => {
  // Remove old player model
  scene.remove(player)

  // Create chimpanzini (banana with chimp)
  const chimpGroup = new THREE.Group()

  // GIANT BANANA body (curved)
  const bananaGeometry = new THREE.CylinderGeometry(0.5, 0.3, 2.5, 16)
  const bananaMaterial = new THREE.MeshStandardMaterial({ color: 0xffe135 })
  const banana = new THREE.Mesh(bananaGeometry, bananaMaterial)
  banana.rotation.z = Math.PI / 6 // Curved banana
  banana.castShadow = true
  chimpGroup.add(banana)

  // Banana highlights (lighter yellow stripes)
  const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffed4e })
  for (let i = 0; i < 3; i++) {
    const highlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2, 0.3),
      highlightMaterial
    )
    const angle = (i / 3) * Math.PI * 2
    highlight.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5)
    highlight.rotation.z = Math.PI / 6
    chimpGroup.add(highlight)
  }

  // Banana brown spots
  const spotMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const spotPositions = [
    { x: 0.3, y: 0.5 }, { x: -0.3, y: -0.3 }, { x: 0.2, y: -0.8 }
  ]
  spotPositions.forEach(pos => {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      spotMaterial
    )
    spot.position.set(pos.x, pos.y, 0.5)
    chimpGroup.add(spot)
  })

  // Banana stem (brown at top)
  const stemGeometry = new THREE.ConeGeometry(0.1, 0.3, 8)
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })
  const stem = new THREE.Mesh(stemGeometry, stemMaterial)
  stem.position.set(-0.3, 1.5, 0)
  stem.rotation.z = -Math.PI / 3
  chimpGroup.add(stem)

  // CHIMPANZEE sitting on banana!
  // Chimp body
  const chimpBodyGeometry = new THREE.SphereGeometry(0.4, 16, 16)
  const chimpBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })
  const chimpBody = new THREE.Mesh(chimpBodyGeometry, chimpBodyMaterial)
  chimpBody.position.set(0, 0.3, 0)
  chimpBody.scale.set(1, 1.2, 0.8)
  chimpBody.castShadow = true
  chimpGroup.add(chimpBody)

  // Chimp head
  const chimpHeadGeometry = new THREE.SphereGeometry(0.35, 16, 16)
  const chimpHeadMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6F47 })
  const chimpHead = new THREE.Mesh(chimpHeadGeometry, chimpHeadMaterial)
  chimpHead.position.set(0, 0.8, 0.1)
  chimpHead.castShadow = true
  chimpGroup.add(chimpHead)

  // Chimp face (tan)
  const faceGeometry = new THREE.CircleGeometry(0.25, 16)
  const faceMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa06d })
  const face = new THREE.Mesh(faceGeometry, faceMaterial)
  face.position.set(0, 0.75, 0.35)
  face.rotation.y = Math.PI
  chimpGroup.add(face)

  // Chimp ears
  const earGeometry = new THREE.SphereGeometry(0.12, 12, 12)
  const ear1 = new THREE.Mesh(earGeometry, chimpHeadMaterial)
  ear1.position.set(-0.3, 0.85, 0.1)
  ear1.scale.set(0.6, 1, 0.3)
  chimpGroup.add(ear1)

  const ear2 = new THREE.Mesh(earGeometry, chimpHeadMaterial)
  ear2.position.set(0.3, 0.85, 0.1)
  ear2.scale.set(0.6, 1, 0.3)
  chimpGroup.add(ear2)

  // Chimp eyes (big and white)
  const eyeGeometry = new THREE.SphereGeometry(0.08, 12, 12)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye1.position.set(-0.1, 0.8, 0.35)
  chimpGroup.add(eye1)

  const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eye2.position.set(0.1, 0.8, 0.35)
  chimpGroup.add(eye2)

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8)
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })
  const pupil1 = new THREE.Mesh(pupilGeometry, pupilMaterial)
  pupil1.position.set(-0.1, 0.8, 0.4)
  chimpGroup.add(pupil1)

  const pupil2 = new THREE.Mesh(pupilGeometry, pupilMaterial)
  pupil2.position.set(0.1, 0.8, 0.4)
  chimpGroup.add(pupil2)

  // Chimp nose
  const noseGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const nose = new THREE.Mesh(noseGeometry, new THREE.MeshStandardMaterial({ color: 0x654321 }))
  nose.position.set(0, 0.72, 0.37)
  nose.scale.set(0.8, 0.6, 1)
  chimpGroup.add(nose)

  // Chimp mouth (smiling!)
  const mouthGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI)
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
  mouth.position.set(0, 0.65, 0.36)
  mouth.rotation.z = Math.PI
  chimpGroup.add(mouth)

  // Chimp arms (holding banana)
  const armGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 8)
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 })

  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.35, 0.1, 0)
  leftArm.rotation.z = Math.PI / 3
  leftArm.castShadow = true
  chimpGroup.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.35, 0.1, 0)
  rightArm.rotation.z = -Math.PI / 3
  rightArm.castShadow = true
  chimpGroup.add(rightArm)

  // Chimp hands
  const handGeometry = new THREE.SphereGeometry(0.1, 12, 12)
  const hand1 = new THREE.Mesh(handGeometry, chimpHeadMaterial)
  hand1.position.set(-0.55, -0.2, 0)
  chimpGroup.add(hand1)

  const hand2 = new THREE.Mesh(handGeometry, chimpHeadMaterial)
  hand2.position.set(0.55, -0.2, 0)
  chimpGroup.add(hand2)

  // Chimp legs
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8)
  const leg1 = new THREE.Mesh(legGeometry, armMaterial)
  leg1.position.set(-0.15, -0.25, 0)
  leg1.castShadow = true
  chimpGroup.add(leg1)

  const leg2 = new THREE.Mesh(legGeometry, armMaterial)
  leg2.position.set(0.15, -0.25, 0)
  leg2.castShadow = true
  chimpGroup.add(leg2)

  // Chimp feet
  const footGeometry = new THREE.SphereGeometry(0.12, 12, 12)
  const foot1 = new THREE.Mesh(footGeometry, chimpHeadMaterial)
  foot1.position.set(-0.15, -0.55, 0.05)
  foot1.scale.set(1, 0.6, 1.2)
  chimpGroup.add(foot1)

  const foot2 = new THREE.Mesh(footGeometry, chimpHeadMaterial)
  foot2.position.set(0.15, -0.55, 0.05)
  foot2.scale.set(1, 0.6, 1.2)
  chimpGroup.add(foot2)

  // Small bananas floating around (banana power!)
  const smallBananaGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.5, 8)
  const smallBananaPositions = [
    { x: 1, y: 0.8, z: 0.5, rot: 0.5 },
    { x: -1, y: 0.5, z: -0.5, rot: -0.3 },
    { x: 0.8, y: -0.3, z: -0.8, rot: 0.8 }
  ]

  smallBananaPositions.forEach(pos => {
    const smallBanana = new THREE.Mesh(smallBananaGeometry, bananaMaterial)
    smallBanana.position.set(pos.x, pos.y, pos.z)
    smallBanana.rotation.z = pos.rot
    chimpGroup.add(smallBanana)
  })

  chimpGroup.position.copy(player.position)
  chimpGroup.rotation.copy(player.rotation)
  player = chimpGroup as any
  scene.add(player)
  isSharkForm = false
}

const createWalls = () => {
  const wallHeight = 10
  const wallThickness = 30  // 30 units thick walls!
  const worldSize = 100 // Half of 200

  // Wall material with purple brainrot theme
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x9f7aea,
    roughness: 0.6,
    metalness: 0.2
  })

  // North wall (positive Z)
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, wallHeight, wallThickness),
    wallMaterial
  )
  northWall.position.set(0, wallHeight / 2, worldSize)
  northWall.castShadow = true
  northWall.receiveShadow = true
  scene.add(northWall)

  // South wall (negative Z)
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, wallHeight, wallThickness),
    wallMaterial
  )
  southWall.position.set(0, wallHeight / 2, -worldSize)
  southWall.castShadow = true
  southWall.receiveShadow = true
  scene.add(southWall)

  // East wall (positive X)
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, worldSize * 2),
    wallMaterial
  )
  eastWall.position.set(worldSize, wallHeight / 2, 0)
  eastWall.castShadow = true
  eastWall.receiveShadow = true
  scene.add(eastWall)

  // West wall (negative X)
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, worldSize * 2),
    wallMaterial
  )
  westWall.position.set(-worldSize, wallHeight / 2, 0)
  westWall.castShadow = true
  westWall.receiveShadow = true
  scene.add(westWall)

  // Add glowing purple line at top of each wall for visibility
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5
  })

  // Top glow lines
  const topLineHeight = 0.3

  const northGlow = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, topLineHeight, wallThickness),
    glowMaterial
  )
  northGlow.position.set(0, wallHeight, worldSize)
  scene.add(northGlow)

  const southGlow = new THREE.Mesh(
    new THREE.BoxGeometry(worldSize * 2, topLineHeight, wallThickness),
    glowMaterial
  )
  southGlow.position.set(0, wallHeight, -worldSize)
  scene.add(southGlow)

  const eastGlow = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, topLineHeight, worldSize * 2),
    glowMaterial
  )
  eastGlow.position.set(worldSize, wallHeight, 0)
  scene.add(eastGlow)

  const westGlow = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, topLineHeight, worldSize * 2),
    glowMaterial
  )
  westGlow.position.set(-worldSize, wallHeight, 0)
  scene.add(westGlow)
}

const createStatue = () => {
  // Create a massive statue of tung tung tung tung sahur in the center!
  const statueGroup = new THREE.Group()
  statueGroup.position.set(0, 0, 0) // Dead center of the map

  const statueScale = 5 // 5x larger than the NPC!

  // Pedestal base
  const pedestalGeometry = new THREE.CylinderGeometry(3, 4, 2, 32)
  const pedestalMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.7
  })
  const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
  pedestal.position.y = 1
  pedestal.castShadow = true
  pedestal.receiveShadow = true
  statueGroup.add(pedestal)

  // Plaque on pedestal
  const plaqueGeometry = new THREE.BoxGeometry(3, 0.5, 0.1)
  const plaqueMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.8
  })
  const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial)
  plaque.position.set(0, 1, 4.1)
  statueGroup.add(plaque)

  // Giant LOG statue body with wood texture
  const bodyGeometry = new THREE.CylinderGeometry(statueScale * 0.5, statueScale * 0.5, statueScale * 2, 32)

  // Create wood texture for giant statue
  const statueCanvas = document.createElement('canvas')
  statueCanvas.width = 512
  statueCanvas.height = 512
  const statueCtx = statueCanvas.getContext('2d')!

  // Wood color
  statueCtx.fillStyle = '#8B4513' // Brown
  statueCtx.fillRect(0, 0, 512, 512)

  // Add wood rings
  for (let i = 0; i < 15; i++) {
    statueCtx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.3})`
    statueCtx.lineWidth = 3 + Math.random() * 5
    statueCtx.beginPath()
    statueCtx.arc(256, 256 + i * 30, 120 + i * 20, 0, Math.PI * 2)
    statueCtx.stroke()
  }

  const statueTexture = new THREE.CanvasTexture(statueCanvas)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: statueTexture,
    roughness: 0.8,
    metalness: 0.1
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 2 + statueScale
  body.castShadow = true
  statueGroup.add(body)

  // Giant STRAIGHT FACE on statue

  // Giant left eye (black dot)
  const giantEyeGeometry = new THREE.CircleGeometry(statueScale * 0.08, 16)
  const giantEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const leftEye = new THREE.Mesh(giantEyeGeometry, giantEyeMaterial)
  leftEye.position.set(-statueScale * 0.2, 2 + statueScale + statueScale * 0.3, statueScale * 0.51)
  statueGroup.add(leftEye)

  // Giant right eye (black dot)
  const rightEye = new THREE.Mesh(giantEyeGeometry, giantEyeMaterial)
  rightEye.position.set(statueScale * 0.2, 2 + statueScale + statueScale * 0.3, statueScale * 0.51)
  statueGroup.add(rightEye)

  // Giant straight mouth (horizontal line)
  const giantMouthGeometry = new THREE.BoxGeometry(statueScale * 0.3, statueScale * 0.03, 0.1)
  const giantMouth = new THREE.Mesh(giantMouthGeometry, giantEyeMaterial)
  giantMouth.position.set(0, 2 + statueScale, statueScale * 0.51)
  statueGroup.add(giantMouth)

  // Giant BASEBALL BAT held by statue
  const statueBatGroup = new THREE.Group()

  // Giant bat handle
  const statueHandleGeometry = new THREE.CylinderGeometry(statueScale * 0.05, statueScale * 0.05, statueScale * 0.6, 16)
  const statueBatMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2691E,
    roughness: 0.7
  })
  const statueHandle = new THREE.Mesh(statueHandleGeometry, statueBatMaterial)
  statueHandle.position.y = statueScale * 0.3
  statueBatGroup.add(statueHandle)

  // Giant bat barrel
  const statueBarrelGeometry = new THREE.CylinderGeometry(statueScale * 0.1, statueScale * 0.06, statueScale * 0.8, 16)
  const statueBarrel = new THREE.Mesh(statueBarrelGeometry, statueBatMaterial)
  statueBarrel.position.y = statueScale
  statueBatGroup.add(statueBarrel)

  // Position giant bat
  statueBatGroup.position.set(statueScale * 0.7, 2 + statueScale, 0)
  statueBatGroup.rotation.z = -Math.PI / 6
  statueBatGroup.castShadow = true
  statueGroup.add(statueBatGroup)

  // Add spotlights pointing at statue
  const spotlight1 = new THREE.SpotLight(0x00ffff, 1, 50, Math.PI / 6)
  spotlight1.position.set(-10, 15, -10)
  spotlight1.target.position.set(0, 7, 0)
  spotlight1.castShadow = true
  scene.add(spotlight1)
  scene.add(spotlight1.target)

  const spotlight2 = new THREE.SpotLight(0xff00ff, 1, 50, Math.PI / 6)
  spotlight2.position.set(10, 15, 10)
  spotlight2.target.position.set(0, 7, 0)
  spotlight2.castShadow = true
  scene.add(spotlight2)
  scene.add(spotlight2.target)

  // Add a glowing aura around the statue
  const auraGeometry = new THREE.SphereGeometry(statueScale * 1.2, 32, 32)
  const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  })
  const aura = new THREE.Mesh(auraGeometry, auraMaterial)
  aura.position.y = 2 + statueScale
  statueGroup.add(aura)

  // Animate the aura (pulsing effect)
  const animateAura = () => {
    const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1
    aura.scale.set(scale, scale, scale)
    aura.rotation.y += 0.01
  }

  // Store animation function
  statueGroup.userData.animate = animateAura

  scene.add(statueGroup)

  // Store reference for animation
  scene.userData.statue = statueGroup
}

const createCoins = () => {
  const coinPositions = [
    { x: 5, y: 1.5, z: 5 },
    { x: -10, y: 1.5, z: 10 },
    { x: 15, y: 1.5, z: -5 },
    { x: -20, y: 1.5, z: -15 },
    { x: 25, y: 1.5, z: 8 },
    { x: 35, y: 1.5, z: 15 },
    { x: -30, y: 1.5, z: 20 },
    { x: 12, y: 1.5, z: 20 },
    { x: 10, y: 1.5, z: -15 },
    { x: -5, y: 1.5, z: -5 },
    { x: 20, y: 1.5, z: 20 },
    { x: -25, y: 1.5, z: -25 },
    { x: 40, y: 1.5, z: -10 },
    { x: -40, y: 1.5, z: 10 },
    { x: 0, y: 1.5, z: 30 }
  ]

  coinPositions.forEach(pos => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    })
    const coin = new THREE.Mesh(geometry, material)
    coin.position.set(pos.x, pos.y, pos.z)
    coin.rotation.x = Math.PI / 2
    coin.castShadow = true
    coin.userData.isCollectible = true
    coins.push(coin)
    scene.add(coin)
  })
}

const createRocksAndApples = () => {
  // 4 rock locations with 3 apples each (1 golden, 2 normal)
  const rockLocations = [
    { x: -50, z: -50 },
    { x: 50, z: -50 },
    { x: -50, z: 50 },
    { x: 50, z: 50 }
  ]

  rockLocations.forEach((loc, rockIndex) => {
    // Create a rock group
    const rockGroup = new THREE.Group()
    rockGroup.position.set(loc.x, 0, loc.z)

    // Create gray rock (irregular sphere shape)
    const rockGeometry = new THREE.SphereGeometry(2, 8, 6) // Low poly for rocky look
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1
    })
    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.position.y = 1.5
    rock.scale.set(1, 0.7, 1) // Flatten it a bit
    rock.castShadow = true
    rock.receiveShadow = true
    rockGroup.add(rock)

    scene.add(rockGroup)
    rocks.push(rockGroup)

    // Create 3 apples next to each rock (1 golden, 2 normal)
    const applePositions = [
      { x: loc.x + 3, z: loc.z, isGolden: false },
      { x: loc.x - 3, z: loc.z, isGolden: false },
      { x: loc.x, z: loc.z + 3, isGolden: true }
    ]

    applePositions.forEach((applePos, appleIndex) => {
      // Apple body (sphere)
      const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16)
      const appleMaterial = new THREE.MeshStandardMaterial({
        color: applePos.isGolden ? 0xffd700 : 0xff0000,
        metalness: applePos.isGolden ? 0.8 : 0.2,
        roughness: applePos.isGolden ? 0.2 : 0.6,
        emissive: applePos.isGolden ? 0xffaa00 : 0x000000,
        emissiveIntensity: applePos.isGolden ? 0.3 : 0
      })
      const apple = new THREE.Mesh(appleGeometry, appleMaterial)
      apple.position.set(applePos.x, 0.5, applePos.z)
      apple.castShadow = true

      // Add stem on top
      const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      const stem = new THREE.Mesh(stemGeometry, stemMaterial)
      stem.position.set(applePos.x, 0.8, applePos.z)
      scene.add(stem)

      // Store apple data
      apple.userData.isApple = true
      apple.userData.isGolden = applePos.isGolden
      apple.userData.hp = applePos.isGolden ? 20 : 5
      apple.userData.maxHp = applePos.isGolden ? 20 : 5
      apple.userData.stem = stem
      apple.userData.rockIndex = rockIndex
      apple.userData.appleIndex = appleIndex

      apples.push(apple)
      scene.add(apple)
    })
  })
}

const createOranges = () => {
  // 5 orange locations scattered around the map
  const orangePositions = [
    { x: 60, y: 2, z: 30 },
    { x: -60, y: 2, z: -30 },
    { x: 30, y: 2, z: -60 },
    { x: -30, y: 2, z: 60 },
    { x: 0, y: 2, z: -80 }
  ]

  orangePositions.forEach((pos, index) => {
    // Orange body (sphere)
    const orangeGeometry = new THREE.SphereGeometry(1.5, 16, 16)
    const orangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c00, // Dark orange
      metalness: 0.3,
      roughness: 0.5
    })
    const orange = new THREE.Mesh(orangeGeometry, orangeMaterial)
    orange.position.set(pos.x, pos.y, pos.z)
    orange.castShadow = true

    // Add stem on top
    const stemGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8)
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.set(pos.x, pos.y + 1.7, pos.z)
    scene.add(stem)

    // Store orange data - load saved HP or default to 200
    const savedHP = gameData.value.orangeHP?.[index] ?? 200
    orange.userData.isOrange = true
    orange.userData.hp = savedHP
    orange.userData.maxHp = 200
    orange.userData.stem = stem
    orange.userData.index = index

    oranges.push(orange)
    scene.add(orange)
  })
}

const createEggs = () => {
  // Three eggs at spawn point in a row
  const eggData = [
    { x: -3, z: 3, price: 10, color: 0xffffff, name: 'Common Egg' },
    { x: 0, z: 3, price: 35, color: 0x3b82f6, name: 'Rare Egg' },
    { x: 3, z: 3, price: 250, color: 0x9333ea, name: 'Epic Egg' }
  ]

  eggData.forEach((data, index) => {
    // Create egg shape (ellipsoid)
    const eggGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const eggMaterial = new THREE.MeshStandardMaterial({
      color: data.color,
      metalness: 0.3,
      roughness: 0.4
    })
    const egg = new THREE.Mesh(eggGeometry, eggMaterial)
    egg.scale.set(0.8, 1.2, 0.8) // Make it egg-shaped
    egg.position.set(data.x, 1, data.z)
    egg.castShadow = true

    // Store egg data
    egg.userData.isEgg = true
    egg.userData.price = data.price
    egg.userData.name = data.name
    egg.userData.index = index

    eggs.push(egg)
    scene.add(egg)

    // Add price label above egg (using a simple plane with text texture)
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${data.price} coins`, 128, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const labelGeometry = new THREE.PlaneGeometry(2, 1)
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })
    const label = new THREE.Mesh(labelGeometry, labelMaterial)
    label.position.set(data.x, 2.5, data.z)
    scene.add(label)
    egg.userData.label = label
  })
}

const createStars = () => {
  const starGeometry = new THREE.BufferGeometry()
  const starPositions = []

  for (let i = 0; i < 500; i++) {
    const x = (Math.random() - 0.5) * 400
    const y = Math.random() * 100 + 20
    const z = (Math.random() - 0.5) * 400
    starPositions.push(x, y, z)
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true
  })

  const stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)
}

const createElephantCactus = () => {
  // Create a cute elephant-cactus hybrid with 2 feet at the corner of the map
  const elephantGroup = new THREE.Group()

  // Position at corner of map
  elephantGroup.position.set(90, 0, 90)

  // Make it BIG!
  elephantGroup.scale.set(3, 3, 3)

  // Cactus body (green cylinder for main body)
  const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.8, 4, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5016, // Dark cactus green
    roughness: 0.8
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 3
  body.castShadow = true
  elephantGroup.add(body)

  // Cactus arms (cylinder segments sticking out)
  const armGeometry = new THREE.CylinderGeometry(0.6, 0.7, 2, 12)
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5016,
    roughness: 0.8
  })

  // Left arm
  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-1.8, 3.5, 0)
  leftArm.rotation.z = Math.PI / 2
  leftArm.castShadow = true
  elephantGroup.add(leftArm)

  // Right arm
  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(1.8, 3.5, 0)
  rightArm.rotation.z = -Math.PI / 2
  rightArm.castShadow = true
  elephantGroup.add(rightArm)

  // Elephant trunk (curved cylinder coming from front)
  const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 12)
  const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial)
  trunk.position.set(0, 4, 1.5)
  trunk.rotation.x = Math.PI / 4
  trunk.castShadow = true
  elephantGroup.add(trunk)

  // Elephant ears (flat circles on sides)
  const earGeometry = new THREE.CircleGeometry(1, 16)
  const earMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5016,
    side: THREE.DoubleSide
  })

  const leftEar = new THREE.Mesh(earGeometry, earMaterial)
  leftEar.position.set(-1.5, 4.5, 0)
  leftEar.rotation.y = Math.PI / 4
  elephantGroup.add(leftEar)

  const rightEar = new THREE.Mesh(earGeometry, earMaterial)
  rightEar.position.set(1.5, 4.5, 0)
  rightEar.rotation.y = -Math.PI / 4
  elephantGroup.add(rightEar)

  // Cute face
  // Eyes (white spheres with black pupils)
  const eyeWhiteGeometry = new THREE.SphereGeometry(0.3, 16, 16)
  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })

  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial)
  leftEyeWhite.position.set(-0.5, 4.5, 1.3)
  elephantGroup.add(leftEyeWhite)

  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial)
  rightEyeWhite.position.set(0.5, 4.5, 1.3)
  elephantGroup.add(rightEyeWhite)

  // Pupils (black)
  const pupilGeometry = new THREE.SphereGeometry(0.15, 16, 16)
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })

  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  leftPupil.position.set(-0.5, 4.5, 1.5)
  elephantGroup.add(leftPupil)

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  rightPupil.position.set(0.5, 4.5, 1.5)
  elephantGroup.add(rightPupil)

  // Cute smile (curved line made with torus)
  const smileGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16, Math.PI)
  const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const smile = new THREE.Mesh(smileGeometry, smileMaterial)
  smile.position.set(0, 3.8, 1.4)
  smile.rotation.x = Math.PI
  smile.rotation.z = Math.PI
  elephantGroup.add(smile)

  // Rosy cheeks (pink spheres)
  const cheekGeometry = new THREE.SphereGeometry(0.25, 16, 16)
  const cheekMaterial = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    emissive: 0xff69b4,
    emissiveIntensity: 0.2
  })

  const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial)
  leftCheek.position.set(-0.9, 4, 1.2)
  elephantGroup.add(leftCheek)

  const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial)
  rightCheek.position.set(0.9, 4, 1.2)
  elephantGroup.add(rightCheek)

  // 2 Feet (cylinders at bottom)
  const footGeometry = new THREE.CylinderGeometry(0.6, 0.7, 1, 16)
  const footMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a6b1f, // Slightly lighter green
    roughness: 0.9
  })

  const leftFoot = new THREE.Mesh(footGeometry, footMaterial)
  leftFoot.position.set(-0.8, 0.5, 0)
  leftFoot.castShadow = true
  elephantGroup.add(leftFoot)

  const rightFoot = new THREE.Mesh(footGeometry, footMaterial)
  rightFoot.position.set(0.8, 0.5, 0)
  rightFoot.castShadow = true
  elephantGroup.add(rightFoot)

  // Add cactus spikes (small cones)
  const spikeGeometry = new THREE.ConeGeometry(0.1, 0.4, 8)
  const spikeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a3d0c, // Darker green for spikes
    roughness: 0.9
  })

  // Add random spikes around the body
  for (let i = 0; i < 15; i++) {
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial)
    const angle = (Math.PI * 2 * i) / 15
    const radius = 1.6
    spike.position.set(
      Math.cos(angle) * radius,
      2 + Math.random() * 2,
      Math.sin(angle) * radius
    )
    spike.rotation.z = -angle
    spike.rotation.x = Math.PI / 2
    elephantGroup.add(spike)
  }

  scene.add(elephantGroup)

  // Make it gently sway
  elephantGroup.userData.animate = () => {
    const time = Date.now() * 0.001
    elephantGroup.rotation.y = Math.sin(time * 0.5) * 0.1
    elephantGroup.position.y = Math.sin(time) * 0.2
  }

  // Store reference for animation
  scene.userData.elephantCactus = elephantGroup
}

const setupControls = () => {
  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    keys[key] = true

    // Toggle camera view with B key
    if (key === 'b') {
      isFirstPerson = !isFirstPerson
      infoText.value = isFirstPerson ? 'Switched to First Person View' : 'Switched to Third Person View'
      setTimeout(() => {
        infoText.value = 'Explore the Italian brainrot world! 🇮🇹'
      }, 2000)
    }
  })

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false
  })

  // Mouse controls
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock()
  })

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      mouseX = e.movementX
      mouseY = e.movementY
    }
  })

  // Mouse click to hit apples
  renderer.domElement.addEventListener('click', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      hitApple()
    }
  })
}

const hitApple = () => {
  // Check cooldown (1 second = 1000ms)
  const currentTime = Date.now()
  const canAttack = currentTime - lastAppleAttack >= 1000

  if (!canAttack) {
    const timeLeft = Math.ceil((1000 - (currentTime - lastAppleAttack)) / 1000)
    infoText.value = `Attack cooldown: ${timeLeft}s ⏱️`
    return
  }

  // Create a raycaster to detect what we're looking at
  const raycaster = new THREE.Raycaster()

  // In third person, raycast from player's looking direction, not camera
  if (isFirstPerson) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera) // Center of screen
  } else {
    // Cast from player position in the direction they're facing
    const direction = new THREE.Vector3()
    direction.x = -Math.sin(yaw) * Math.cos(pitch)
    direction.y = Math.sin(pitch)
    direction.z = -Math.cos(yaw) * Math.cos(pitch)
    direction.normalize()

    raycaster.set(player.position, direction)
  }

  // Check if we're looking at any apples, oranges, or eggs
  const targets = [...apples, ...oranges, ...eggs]
  const intersects = raycaster.intersectObjects(targets)

  if (intersects.length > 0) {
    const target = intersects[0].object as THREE.Mesh
    const isApple = target.userData.isApple
    const isOrange = target.userData.isOrange
    const isEgg = target.userData.isEgg

    // Handle egg click
    if (isEgg) {
      // For Common Egg, show the panel with open 1/2/3 buttons
      if (target.userData.name === 'Common Egg') {
        showEggPanel.value = !showEggPanel.value
        eggResults.value = [] // Clear previous results when toggling panel
        infoText.value = showEggPanel.value ? 'Choose how many eggs to open! 🥚' : 'Explore the brainrot world! 🧠'
      } else {
        // For Rare and Epic eggs, use old system (direct purchase)
        const price = target.userData.price
        const currentCoins = gameState.getCoins()

        if (currentCoins >= price) {
          gameState.spendCoins(price)

          // Open the egg
          const newPet = openCommonEgg()

          // Add pet to collection
          if (!gameData.value.pets) {
            gameData.value.pets = []
          }
          gameData.value.pets.push(newPet)

          // Auto-equip if less than 3 active pets
          if (!gameData.value.activePets) {
            gameData.value.activePets = []
          }
          if (gameData.value.activePets.length < 3) {
            gameData.value.activePets.push(newPet)
          }

          // Save game data
          saveGameData()

          infoText.value = `Got ${newPet.name} (${newPet.rarity})! +${newPet.damage} damage! 🎉`

          setTimeout(() => {
            infoText.value = 'Explore the brainrot world! 🧠'
          }, 3000)
        } else {
          infoText.value = `Not enough coins! Need ${price}, have ${currentCoins} 💰`
          setTimeout(() => {
            infoText.value = 'Explore the brainrot world! 🧠'
          }, 2000)
        }
      }
      return
    }

    if ((isApple || isOrange) && target.userData.hp > 0) {
      // Hit the target - deal more damage at level 2+
      let baseDamage = playerLevel.value >= 2 ? 2 : 1

      // Apply pet damage bonus - multiply all active pets' damage together
      let petBonus = 1
      if (gameData.value.activePets && gameData.value.activePets.length > 0) {
        gameData.value.activePets.forEach(pet => {
          petBonus *= pet.damage
        })
      }
      const damage = baseDamage * petBonus

      target.userData.hp -= damage
      lastAppleAttack = currentTime // Update cooldown timer

      let targetType = 'Target'
      if (isApple) {
        const isGolden = target.userData.isGolden
        targetType = isGolden ? 'Golden Apple' : 'Apple'
      } else if (isOrange) {
        targetType = 'Orange'
      }

      if (target.userData.hp <= 0) {
        // Target destroyed
        scene.remove(target)
        scene.remove(target.userData.stem)

        infoText.value = `${targetType} destroyed! 💥`

        // Give rewards
        if (isApple) {
          const isGolden = target.userData.isGolden
          if (isGolden) {
            gameState.addCoins(50)
            addExp(5) // Golden apples give 5 exp (50%)
            infoText.value = `Golden Apple destroyed! +50 coins, +5 EXP! 💰`
          } else {
            gameState.addCoins(10)
            addExp(2) // Normal apples give 2 exp (20%)
            infoText.value = `Apple destroyed! +10 coins, +2 EXP! 🍎`
          }

          // Respawn apple after 3 seconds
          setTimeout(() => {
            respawnApple(target)
          }, 3000)
        } else if (isOrange) {
          // Oranges give more rewards since they have more HP
          gameState.addCoins(30)
          addExp(10) // Oranges give 10 exp
          infoText.value = `Orange destroyed! +30 coins, +10 EXP! 🍊`

          // Respawn orange after 5 seconds
          setTimeout(() => {
            respawnOrange(target)
          }, 5000)
        }

        setTimeout(() => {
          infoText.value = 'Explore the brainrot world! 🧠'
        }, 2000)
      } else {
        // Target hit but not destroyed
        infoText.value = `${targetType} HP: ${target.userData.hp}/${target.userData.maxHp}`

        // Make target flash red when hit
        const originalEmissive = (target.material as THREE.MeshStandardMaterial).emissive.clone()
        ;(target.material as THREE.MeshStandardMaterial).emissive.set(0xff0000)
        setTimeout(() => {
          if (target.parent) { // Check if still exists
            ;(target.material as THREE.MeshStandardMaterial).emissive.copy(originalEmissive)
          }
        }, 100)
      }
    }
  } else {
    // Clicked but not looking at a target
    lastAppleAttack = currentTime // Still trigger cooldown to prevent spam clicking
    // Don't show any message when missing
  }
}

const respawnApple = (apple: THREE.Mesh) => {
  // Reset apple HP
  apple.userData.hp = apple.userData.maxHp

  // Recreate the apple mesh
  const isGolden = apple.userData.isGolden
  const appleGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const appleMaterial = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xffd700 : 0xff0000,
    metalness: isGolden ? 0.8 : 0.2,
    roughness: isGolden ? 0.2 : 0.6,
    emissive: isGolden ? 0xffaa00 : 0x000000,
    emissiveIntensity: isGolden ? 0.3 : 0
  })

  const newApple = new THREE.Mesh(appleGeometry, appleMaterial)
  newApple.position.copy(apple.position)
  newApple.castShadow = true

  // Copy all user data
  newApple.userData = { ...apple.userData }

  // Recreate stem
  const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const newStem = new THREE.Mesh(stemGeometry, stemMaterial)
  newStem.position.set(apple.position.x, apple.position.y + 0.3, apple.position.z)

  // Store new stem reference
  newApple.userData.stem = newStem

  // Add back to scene and apples array
  scene.add(newApple)
  scene.add(newStem)
  apples.push(newApple)
}

const respawnOrange = (orange: THREE.Mesh) => {
  // Reset orange HP
  orange.userData.hp = orange.userData.maxHp

  // Recreate the orange mesh
  const orangeGeometry = new THREE.SphereGeometry(1.5, 16, 16)
  const orangeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8c00, // Dark orange
    metalness: 0.3,
    roughness: 0.5
  })

  const newOrange = new THREE.Mesh(orangeGeometry, orangeMaterial)
  newOrange.position.copy(orange.position)
  newOrange.castShadow = true

  // Copy all user data
  newOrange.userData = { ...orange.userData }

  // Recreate stem
  const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8)
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const newStem = new THREE.Mesh(stemGeometry, stemMaterial)
  newStem.position.set(orange.position.x, orange.position.y + 1.5, orange.position.z)

  // Store new stem reference
  newOrange.userData.stem = newStem

  // Add back to scene and oranges array
  scene.add(newOrange)
  scene.add(newStem)
  oranges.push(newOrange)
}

const updatePlayer = () => {
  // Mouse look
  const sensitivity = 0.002
  yaw -= mouseX * sensitivity
  pitch -= mouseY * sensitivity
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))
  mouseX = 0
  mouseY = 0

  // Update camera rotation
  camera.rotation.order = 'YXZ'
  camera.rotation.y = yaw
  camera.rotation.x = pitch

  // Movement - calculate direction based on player's yaw, not camera
  const direction = new THREE.Vector3()
  const right = new THREE.Vector3()

  // Calculate forward direction from player's yaw
  direction.x = Math.sin(yaw)
  direction.y = 0
  direction.z = Math.cos(yaw)
  direction.normalize()

  // Calculate right direction (perpendicular to forward)
  right.x = -Math.cos(yaw)
  right.y = 0
  right.z = Math.sin(yaw)
  right.normalize()

  if (keys['w'] || keys['arrowup']) {
    player.position.add(direction.clone().multiplyScalar(moveSpeed))
  }
  if (keys['s'] || keys['arrowdown']) {
    player.position.add(direction.clone().multiplyScalar(-moveSpeed))
  }
  if (keys['a'] || keys['arrowleft']) {
    player.position.add(right.clone().multiplyScalar(-moveSpeed))
  }
  if (keys['d'] || keys['arrowright']) {
    player.position.add(right.clone().multiplyScalar(moveSpeed))
  }

  // Jumping
  if (keys[' '] && !isJumping && player.position.y <= playerHeight + 0.1) {
    velocityY = jumpPower
    isJumping = true
  }

  // Apply gravity
  velocityY -= gravity
  player.position.y += velocityY

  // Ground collision
  if (player.position.y <= playerHeight) {
    player.position.y = playerHeight
    velocityY = 0
    isJumping = false
  }

  // Rotate player to face the direction they're looking
  player.rotation.y = yaw

  // Update camera position based on view mode
  if (isFirstPerson) {
    // First person: camera at player position
    camera.position.copy(player.position)
  } else {
    // Third person: camera behind and above player
    const thirdPersonDistance = 8
    const thirdPersonHeight = 3

    // Calculate camera position behind the player based on yaw
    const offsetX = Math.sin(yaw) * thirdPersonDistance
    const offsetZ = Math.cos(yaw) * thirdPersonDistance

    camera.position.set(
      player.position.x - offsetX,
      player.position.y + thirdPersonHeight,
      player.position.z - offsetZ
    )

    // Make camera look at the player
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z)
  }

  // Keep player within bounds
  const bound = 95
  player.position.x = Math.max(-bound, Math.min(bound, player.position.x))
  player.position.z = Math.max(-bound, Math.min(bound, player.position.z))

  // Update game data
  gameData.value.playerX = player.position.x
  gameData.value.playerZ = player.position.z
}

const checkCollisions = () => {
  // Check coin collection
  coins.forEach((coin, index) => {
    if (!coin.parent) return // Already collected

    const distance = player.position.distanceTo(coin.position)
    if (distance < 1.5) {
      scene.remove(coin)
      coins.splice(index, 1)
      gameData.value.coinsCollectedCount++
      coinsCollected.value++
      gameState.addCoins(10)
      infoText.value = '+10 coins collected! Keep exploring!'
      setTimeout(() => {
        infoText.value = 'Explore the 3D brainrot world!'
      }, 2000)
    }
  })

}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // Update player
  updatePlayer()

  // Check collisions
  checkCollisions()

  // Check distance to eggs - close panel if too far away
  if (showEggPanel.value && camera) {
    const eggPosition = new THREE.Vector3(-3, 1.5, 3) // Common egg position
    const playerPosition = new THREE.Vector3(camera.position.x, 0, camera.position.z)
    const distance = playerPosition.distanceTo(new THREE.Vector3(eggPosition.x, 0, eggPosition.z))

    // Close panel if player is more than 5 units away
    if (distance > 5) {
      showEggPanel.value = false
      eggResults.value = []
      if (infoText.value === 'Choose how many eggs to open! 🥚') {
        infoText.value = 'Explore the brainrot world! 🧠'
      }
    }
  }

  // Auto-attack logic
  if (autoAttackEnabled.value) {
    const currentTime = Date.now()
    const canAutoAttack = currentTime - lastAppleAttack >= 1000

    if (canAutoAttack) {
      hitApple()
    }
  }

  // Show/hide player mesh based on camera mode
  if (player) {
    player.visible = !isFirstPerson
  }

  // Animate coins
  coins.forEach(coin => {
    coin.rotation.z += 0.02
    coin.position.y += Math.sin(Date.now() * 0.001 + coin.position.x) * 0.005
  })

  // Animate statue
  if (scene.userData.statue) {
    scene.userData.statue.userData.animate()
  }

  // Animate elephant-cactus
  if (scene.userData.elephantCactus) {
    scene.userData.elephantCactus.userData.animate()
  }

  // Render scene
  renderer.render(scene, camera)
}

onMounted(() => {
  loadGameData()
  init3DScene()

  // Start player tracking session
  playerTracker.startSession(
    gameState.getPlayerName(),
    gameState.getCoins(),
    level.value,
    exp.value,
    pets.value.length,
    'Brainrot Evolution'
  )
  OnlineTracker.goOnline(gameState.getPlayerName(), gameState.getCoins(), level.value, exp.value, pets.value.length, 'Brainrot Evolution')

  // Check for admin actions every second
  setInterval(() => {
    const action = playerTracker.checkForAdminActions()
    if (action) {
      if (action.type === 'grantCoins' && action.amount) {
        gameState.addCoins(action.amount)
        showNotification(`Admin granted you ${action.amount} coins!`)
      } else if (action.type === 'grantGodPet') {
        const godPet: Pet = {
          id: `god_${Date.now()}`,
          name: 'Moderator God',
          damage: Infinity,
          rarity: 'Divine'
        }
        pets.value.push(godPet)
        saveGameData()
        showNotification('Admin granted you a GOD PET!')
      }
    }
  }, 1000)

  // Initialize background music - "The Natural Kingdom" by Afro Musique
  backgroundMusic = new Audio('https://www.bensound.com/bensound-music/bensound-thelounge.mp3')
  backgroundMusic.loop = true
  backgroundMusic.volume = 0.3

  // Play music on first user interaction (browsers require user interaction to play audio)
  const playMusic = () => {
    if (backgroundMusic) {
      backgroundMusic.play().catch(err => {
        console.log('Audio playback failed:', err)
      })
    }
    // Remove listener after first interaction
    document.removeEventListener('click', playMusic)
    document.removeEventListener('keydown', playMusic)
  }

  document.addEventListener('click', playMusic)
  document.addEventListener('keydown', playMusic)

  // Listen for fullscreen changes (e.g., when user presses ESC)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
  if (backgroundMusic) {
    backgroundMusic.pause()
    backgroundMusic = null
  }
  // End player tracking session
  playerTracker.endSession()
  OnlineTracker.goOffline()
  saveGameData()
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #ff0000;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: #cc0000;
}

.auto-attack-button {
  position: absolute;
  top: 70px;
  left: 20px;
  padding: 10px 20px;
  background: #9f7aea;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.auto-attack-button:hover {
  background: #805ad5;
}

.inventory-button {
  position: absolute;
  top: 120px;
  left: 20px;
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.inventory-button:hover {
  background: #d97706;
}

.pet-button {
  position: absolute;
  top: 170px;
  left: 20px;
  padding: 10px 20px;
  background: #ec4899;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.pet-button:hover {
  background: #db2777;
}

.fullscreen-button {
  position: absolute;
  top: 220px;
  left: 20px;
  padding: 10px 20px;
  background: #8b5cf6;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.fullscreen-button:hover {
  background: #7c3aed;
}

.restart-button {
  position: absolute;
  top: 270px;
  left: 20px;
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.restart-button:hover {
  background: #d97706;
}

.egg-panel {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 450px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #ec4899;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(236, 72, 153, 0.5);
  z-index: 2000;
  padding: 20px;
  color: white;
}

.egg-panel-header {
  text-align: center;
  margin-bottom: 15px;
  border-bottom: 2px solid #ec4899;
  padding-bottom: 10px;
}

.egg-panel-header h3 {
  margin: 0;
  font-size: 24px;
  color: #ec4899;
}

.egg-panel-buttons {
  display: flex;
  justify-content: space-around;
  gap: 15px;
  margin-bottom: 15px;
}

.egg-open-button {
  flex: 1;
  padding: 15px 10px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s;
}

.egg-open-button:hover {
  background: linear-gradient(135deg, #db2777, #be185d);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.6);
}

.egg-cost {
  font-size: 14px;
  color: #ffd700;
}

.egg-results {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #ec4899;
}

.egg-results h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #ec4899;
  text-align: center;
}

.egg-result-item {
  background: rgba(236, 72, 153, 0.2);
  padding: 8px 12px;
  margin: 5px 0;
  border-radius: 5px;
  border-left: 3px solid #ec4899;
  font-size: 16px;
}

.pets-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #ec4899;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(236, 72, 153, 0.5);
  z-index: 2000;
  padding: 20px;
  color: white;
}

.pets-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #ec4899;
  padding-bottom: 10px;
}

.pets-panel-header h2 {
  margin: 0;
  font-size: 28px;
  color: #ec4899;
}

.pets-close {
  background: #ec4899;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  transition: background 0.3s;
}

.pets-close:hover {
  background: #db2777;
}

.pets-content {
  color: white;
}

.active-pet-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #ec4899;
}

.active-pet-section h3 {
  color: #ec4899;
  margin-bottom: 10px;
}

.active-pets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.active-pet-card {
  background: linear-gradient(135deg, #ec4899, #db2777);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
}

.unequip-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.unequip-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.pet-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.pet-rarity {
  font-size: 18px;
  margin-bottom: 5px;
  opacity: 0.9;
}

.pet-damage {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pet-collection-section h3 {
  color: #ec4899;
  margin: 0;
}

.equip-best-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #000;
  border: 2px solid #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.equip-best-button:hover {
  background: linear-gradient(135deg, #ffed4e, #ffd700);
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
}

.rarity-delete-section {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid rgba(255, 0, 0, 0.3);
  border-radius: 10px;
}

.rarity-delete-section h4 {
  color: #ff6b6b;
  margin-bottom: 10px;
  font-size: 16px;
}

.rarity-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rarity-delete-btn {
  padding: 8px 16px;
  border: 2px solid white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: all 0.3s;
  color: white;
}

.rarity-delete-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px currentColor;
}

.rarity-delete-btn.common {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.rarity-delete-btn.rare {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.rarity-delete-btn.epic {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.rarity-delete-btn.legendary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.rarity-delete-btn.mythic {
  background: linear-gradient(135deg, #ff0080, #ff6b6b);
  animation: mythic-glow 2s ease-in-out infinite;
}

.rarity-delete-btn.moderator {
  background: linear-gradient(135deg, #ffd700, #ffed4e, #ffa500);
  background-size: 300% 300%;
  color: #000;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
  border: 2px solid #fff;
  animation: moderator-button-glow 2s ease-in-out infinite, moderator-rainbow 3s ease-in-out infinite;
}

@keyframes mythic-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 128, 0.5); }
  50% { box-shadow: 0 0 25px rgba(255, 0, 128, 1); }
}

@keyframes moderator-button-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.8); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 1); }
}

.no-pets {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #aaa;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.pet-card {
  background: rgba(236, 72, 153, 0.15);
  border: 2px solid #ec4899;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.pet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(236, 72, 153, 0.4);
}

.pet-card.is-active {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.pet-card-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: white;
}

.pet-card-rarity {
  font-size: 14px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.rarity-common {
  background: #9ca3af;
  color: white;
}

.rarity-rare {
  background: #3b82f6;
  color: white;
}

.rarity-epic {
  background: #a855f7;
  color: white;
}

.rarity-legendary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-weight: bold;
}

.rarity-mythic {
  background: linear-gradient(135deg, #ff0080, #ff6b6b);
  color: white;
  font-weight: bold;
  animation: mythic-glow 2s ease-in-out infinite;
}

.rarity-moderator {
  background: linear-gradient(135deg, #ffd700, #ffed4e, #ffa500, #ffd700);
  background-size: 300% 300%;
  color: #000;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: moderator-rainbow 3s ease-in-out infinite, moderator-shine 2s ease-in-out infinite;
  border: 3px solid #fff;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}

@keyframes moderator-rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes moderator-shine {
  0%, 100% { filter: brightness(1.2) drop-shadow(0 0 10px gold); }
  50% { filter: brightness(1.5) drop-shadow(0 0 20px gold); }
}

.pet-card-damage {
  font-size: 16px;
  color: #ffd700;
  margin-bottom: 10px;
  font-weight: bold;
}

.equip-button {
  background: #ec4899;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.equip-button:hover {
  background: #db2777;
}

.equipped-badge {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}

.inventory-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #f59e0b;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
  z-index: 2000;
  padding: 20px;
  color: white;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f59e0b;
  padding-bottom: 10px;
}

.inventory-header h2 {
  margin: 0;
  font-size: 28px;
  color: #f59e0b;
}

.inventory-close {
  background: #ff0000;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: bold;
}

.inventory-close:hover {
  background: #cc0000;
}

.inventory-content {
  padding: 10px;
}

.inventory-section {
  margin-bottom: 20px;
  background: rgba(245, 158, 11, 0.1);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #f59e0b;
}

.inventory-section h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #fbbf24;
}

.world-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.world-name {
  flex: 1;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  padding: 15px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 5px;
  border: 2px solid #fbbf24;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.world-character {
  flex-shrink: 0;
}

.character-circle {
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  background: #8B4513;
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 100;
  pointer-events: none;
}

.hud-title {
  font-size: 24px;
  color: #ff00ff;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  margin-bottom: 10px;
}

.hud-info {
  font-size: 16px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 5px;
}

.hud-coins {
  font-size: 18px;
  color: #ffd700;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  font-weight: bold;
}

.hud-pets {
  font-size: 16px;
  color: #ec4899;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  margin-top: 5px;
  text-align: center;
  font-weight: bold;
}

.hud-pet-item {
  font-size: 14px;
  color: #fbbf24;
  margin-top: 4px;
}

.controls-hint {
  position: absolute;
  bottom: 50px;
  left: 10px;
  right: 10px;
  font-size: 14px;
  color: #00ffff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 5px;
  text-align: center;
  z-index: 100;
  pointer-events: none;
}

.level-bar {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 100;
  pointer-events: none;
}

.level-bar-bg {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #ffd700;
  border-radius: 5px;
  overflow: hidden;
}

.level-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.level-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
  z-index: 1;
}

.exp-text {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
  z-index: 1;
}

.level-up-shark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  text-align: center;
  animation: sharkBounce 0.5s ease-in-out infinite;
}

@keyframes sharkBounce {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -55%) scale(1.05);
  }
}

.shark-canvas {
  border: 5px solid #ffd700;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
}

.shark-name {
  margin-top: 10px;
  font-size: 32px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 10px;
  border: 3px solid #ffd700;
}
</style>
