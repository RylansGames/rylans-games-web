<template>
  <div class="owner-wrapper">
    <button class="back-button" @click="goBack">← Back to Portal</button>

    <div class="owner-container">
      <div class="owner-header">
        <h1 class="owner-title">OWNER PANEL</h1>
        <button class="lock-btn" @click="toggleLock">
          {{ adminLocked && isOwner ? '🔓 UNLOCK ADMIN' : '🔒 LOCK ADMIN' }}
        </button>
      </div>

      <!-- Active Players Section -->
      <div class="section players-section">
        <h2 class="section-title">ALL PLAYERS ({{ activePlayers.length }})</h2>
        <div v-if="activePlayers.length === 0" class="no-players">
          <p>No players currently online</p>
        </div>
        <div v-else class="players-list">
          <div v-for="player in activePlayers" :key="player.id" class="player-card">
            <div class="player-info">
              <div class="player-name">{{ player.playerName }}</div>
              <div class="player-stats">
                <span class="stat">Coins: {{ player.coins }}</span>
                <span class="stat">Lvl {{ player.level }}</span>
                <span class="stat">{{ player.exp }} EXP</span>
                <span class="stat">{{ player.petsCount }} pets</span>
              </div>
              <span class="game-badge" :style="{ background: gameBadgeColor(player.currentGame) }">
                {{ player.currentGame || 'Portal' }}
              </span>
            </div>
            <div class="player-actions">
              <button @click="giveCoins(player.id, 100)" class="btn btn-green btn-sm">+100 Coins</button>
              <button @click="giveCoins(player.id, 100000000)" class="btn btn-green btn-sm">+100M Coins</button>
              <button @click="giveCoins(player.id, 1e21)" class="btn btn-gold btn-sm">+100 Sextillion</button>
              <button @click="warnPlayer(player.id)" class="btn btn-yellow btn-sm">WARN</button>
              <button @click="kickPlayer(player.id)" class="btn btn-orange btn-sm">KICK</button>
              <button @click="banPlayer(player.id)" class="btn btn-darkred btn-sm">BAN</button>
              <button @click="unbanPlayer(player.id)" class="btn btn-blue btn-sm">UNBAN</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Camera Watch Section -->
      <div class="section camera-section">
        <h2 class="section-title">CAMERA WATCH</h2>
        <p class="camera-desc">Spawn anomalies in the Camera Watch game!</p>
        <div class="anomaly-grid">
          <button @click="spawnAnomaly('Preacher')" class="btn btn-anomaly btn-preacher">PREACHER</button>
          <button @click="spawnAnomaly('Cloak')" class="btn btn-anomaly btn-cloak">CLOAK</button>
          <button @click="spawnAnomaly('Corpse')" class="btn btn-anomaly btn-corpse">CORPSE</button>
          <button @click="spawnAnomaly('Displacement')" class="btn btn-anomaly btn-displacement">DISPLACEMENT</button>
          <button @click="spawnAnomaly('Imagery')" class="btn btn-anomaly btn-imagery">IMAGERY</button>
          <button @click="spawnAllAnomalies()" class="btn btn-red btn-full btn-big">SPAWN ALL AT ONCE</button>
        </div>
      </div>

      <!-- Two Column Layout for GD + Brainrot -->
      <div class="panels-grid">
        <!-- Geometry Dash Section -->
        <div class="section gd-section">
          <h2 class="section-title">GEOMETRY DASH</h2>
          <div class="button-group">
            <button @click="giveAllPowers()" class="btn btn-blue btn-full">Give All Powers</button>
          </div>
          <div class="button-group">
            <button @click="showGdTimerPicker = true" class="btn btn-red btn-full btn-big">
              START ADMIN ABUSE
            </button>
          </div>
          <div class="talk-section">
            <div class="talk-label">Talk to People</div>
            <form @submit.prevent="sendMessage" class="talk-form">
              <input
                v-model="chatMessage"
                type="text"
                class="talk-input"
                placeholder="Type a message..."
                maxlength="100"
              />
              <button type="submit" class="btn btn-green">Send</button>
            </form>
          </div>

          <!-- Admin Abuse Effects -->
          <div class="effects-section">
            <div class="effects-label">ABUSE EFFECTS</div>
            <div class="effects-grid">
              <button @click="startEffect('screen_shake')" class="btn btn-red">SCREEN SHAKE</button>
              <button @click="startEffect('rainbow')" class="btn btn-rainbow">RAINBOW MODE</button>
              <button @click="startEffect('upside_down')" class="btn btn-purple">UPSIDE DOWN</button>
              <button @click="startAllEffects()" class="btn btn-gold btn-full btn-big">ALL EFFECTS AT ONCE</button>
              <button @click="stopAllEffects()" class="btn btn-gray btn-full">STOP EFFECTS</button>
            </div>
          </div>
        </div>

        <!-- Brainrot Evolution Section -->
        <div class="section brainrot-section">
          <h2 class="section-title">BRAINROT EVOLUTION</h2>

          <div class="current-value">
            Level: <span class="value">{{ brainrotData.level }}</span> |
            EXP: <span class="value">{{ brainrotData.exp }}</span> |
            Coins: <span class="value">{{ currentCoins }}</span>
          </div>

          <div class="button-group">
            <button @click="levelUpOne()" class="btn btn-purple">Level Up +1</button>
            <button @click="levelUpMax()" class="btn btn-gold">Level Up MAX</button>
          </div>

          <div class="coin-group">
            <button @click="addBrainrotCoins(100)" class="btn btn-green">+100 Coins</button>
            <button @click="addBrainrotCoins(100000000)" class="btn btn-green">+100M Coins</button>
            <button @click="addBrainrotCoins(1e21)" class="btn btn-gold">+100 Sextillion</button>
          </div>

          <div class="button-group">
            <button @click="startAdminAbuse('Brainrot Evolution')" class="btn btn-red btn-full btn-big">
              START ADMIN ABUSE
            </button>
          </div>

          <div class="button-group">
            <button @click="maxEverything()" class="btn btn-gold btn-full">MAX EVERYTHING</button>
          </div>
        </div>
      </div>

      <!-- Status Message -->
      <div v-if="statusMessage" class="status-message">
        {{ statusMessage }}
      </div>
    </div>

    <!-- GD Admin Abuse Timer Picker -->
    <div v-if="showGdTimerPicker" class="timer-overlay" @click.self="showGdTimerPicker = false">
      <div class="timer-box">
        <h2 class="timer-title">HOW LONG?</h2>
        <p class="timer-subtitle">Pick admin abuse duration</p>

        <!-- Preset buttons -->
        <div v-if="!showCustomClock" class="timer-presets">
          <button @click="startGdAbuse(10000)" class="btn btn-red btn-full">10 Seconds</button>
          <button @click="startGdAbuse(30000)" class="btn btn-red btn-full">30 Seconds</button>
          <button @click="startGdAbuse(60000)" class="btn btn-red btn-full">1 Minute</button>
          <button @click="showCustomClock = true" class="btn btn-gold btn-full btn-big">CUSTOM TIME</button>
        </div>

        <!-- Custom Clock Picker -->
        <div v-else class="clock-picker">
          <div class="clock-row">
            <div class="clock-col">
              <button @click="customMinutes = Math.min(customMinutes + 1, 10)" class="clock-btn">+</button>
              <div class="clock-display">{{ customMinutes }}</div>
              <button @click="customMinutes = Math.max(customMinutes - 1, 0)" class="clock-btn">-</button>
              <div class="clock-label">MIN</div>
            </div>
            <div class="clock-colon">:</div>
            <div class="clock-col">
              <button @click="customSeconds = Math.min(customSeconds + 5, 55)" class="clock-btn">+</button>
              <div class="clock-display">{{ String(customSeconds).padStart(2, '0') }}</div>
              <button @click="customSeconds = Math.max(customSeconds - 5, 0)" class="clock-btn">-</button>
              <div class="clock-label">SEC</div>
            </div>
          </div>
          <div class="clock-total">Total: {{ customMinutes }}m {{ String(customSeconds).padStart(2, '0') }}s</div>
          <button @click="startGdAbuseCustom()" class="btn btn-red btn-full btn-big">START!</button>
          <button @click="showCustomClock = false" class="btn btn-blue btn-full">Back</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'
import { PlayerTracker, type PlayerSession } from '../../components/shared/PlayerTracker'
import { OnlineTracker, type OnlinePlayer } from '../../components/shared/OnlineTracker'
import { db } from '../../firebase'
import { ref as dbRef, set, remove, onValue, type Unsubscribe } from 'firebase/database'

const router = useRouter()
const activePlayers = ref<OnlinePlayer[]>([])
const statusMessage = ref('')
const adminLocked = ref(false)
const isOwner = ref(false)
const currentCoins = ref(0)
const showGdTimerPicker = ref(false)
const showCustomClock = ref(false)
const customMinutes = ref(0)
const customSeconds = ref(30)
const chatMessage = ref('')
let playerUpdateInterval: number | null = null

interface Pet {
  id: string
  name: string
  damage: number
  rarity: string
}

interface BrainrotData {
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

const brainrotData = ref<BrainrotData>({
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

const loadBrainrotData = () => {
  const saved = localStorage.getItem('brainrotEvolution3D')
  if (saved) {
    brainrotData.value = JSON.parse(saved)
  }
  currentCoins.value = gameState.getCoins()
}

const saveBrainrotData = () => {
  localStorage.setItem('brainrotEvolution3D', JSON.stringify(brainrotData.value))
}

const showStatus = (message: string) => {
  statusMessage.value = message
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const sendMessage = () => {
  if (!chatMessage.value.trim()) return
  OnlineTracker.sendGlobalMessage(chatMessage.value.trim())
  showStatus(`Message sent: "${chatMessage.value.trim()}"`)
  chatMessage.value = ''
}

const gameBadgeColor = (game: string): string => {
  const colors: Record<string, string> = {
    'Geometry Dash': '#d97706',
    'Brainrot Evolution': '#7c3aed',
    'Camera Watch': '#991b1b',
    'Music Beats': '#2563eb',
    'Organize the Fridge': '#059669',
    'Portal': '#555'
  }
  return colors[game] || '#555'
}

// --- Player Actions (Firebase) ---
let unsubPlayers: (() => void) | null = null

const giveCoins = (sessionId: string, amount: number) => {
  OnlineTracker.giveCoins(sessionId, amount)
  const label = amount >= 1e21 ? '100 Sextillion' : amount >= 1e8 ? '100M' : amount.toString()
  showStatus(`Gave ${label} coins to player!`)
}

// --- Ban/Kick ---
const kickPlayer = (sessionId: string) => {
  OnlineTracker.kickPlayer(sessionId)
  showStatus('Player KICKED!')
}

const warnPlayer = (sessionId: string) => {
  OnlineTracker.warnPlayer(sessionId)
  showStatus('Player WARNED!')
}

const banPlayer = (sessionId: string) => {
  OnlineTracker.banPlayer(sessionId)
  showStatus('Player BANNED!')
}

const unbanPlayer = (sessionId: string) => {
  OnlineTracker.unbanPlayer(sessionId)
  showStatus('Player UNBANNED!')
}

// --- Abuse Effects ---
const startEffect = (effect: string) => {
  const duration = parseInt(localStorage.getItem('admin_abuse_duration') || '10000')
  OnlineTracker.startAbuseEffect(effect, duration)
  const names: Record<string, string> = {
    screen_shake: 'Screen Shake',
    rainbow: 'Rainbow Mode',
    upside_down: 'Upside Down'
  }
  showStatus(`${names[effect] || effect} activated for ${duration / 1000}s!`)
}

const startAllEffects = () => {
  const duration = parseInt(localStorage.getItem('admin_abuse_duration') || '10000')
  OnlineTracker.startAbuseEffect('screen_shake', duration)
  OnlineTracker.startAbuseEffect('rainbow', duration)
  OnlineTracker.startAbuseEffect('upside_down', duration)
  showStatus(`ALL EFFECTS activated for ${duration / 1000}s!`)
}

const stopAllEffects = () => {
  OnlineTracker.stopAllAbuseEffects()
  showStatus('All effects stopped!')
}

// --- Camera Watch ---
const spawnAnomaly = (type: string) => {
  OnlineTracker.spawnCameraAnomaly(type)
  showStatus(`Spawned ${type} in Camera Watch!`)
}

const spawnAllAnomalies = () => {
  const types = ['Preacher', 'Cloak', 'Corpse', 'Displacement', 'Imagery']
  types.forEach((type, i) => {
    setTimeout(() => {
      OnlineTracker.spawnCameraAnomaly(type)
    }, i * 500)
  })
  showStatus('Spawning ALL anomalies!')
}

// --- Geometry Dash ---
const giveAllPowers = () => {
  // Powers: 0=shoot, 1=Rage Table, 2=Super Jump, 3=Kamehame haaa
  for (let i = 0; i <= 3; i++) {
    gameState.purchasePower(i)
  }
  showStatus('Gave all GD powers!')
}

const startAdminAbuse = (game: string, durationMs: number = 10000) => {
  OnlineTracker.startAdminAbuse(game, durationMs)
  localStorage.setItem('admin_abuse_duration', String(durationMs))
  showStatus(`Admin Abuse started for ${game}!`)
}

const startGdAbuse = (durationMs: number) => {
  showGdTimerPicker.value = false
  showCustomClock.value = false
  startAdminAbuse('Geometry Dash', durationMs)
}

const startGdAbuseCustom = () => {
  const totalMs = (customMinutes.value * 60 + customSeconds.value) * 1000
  if (totalMs <= 0) return
  startGdAbuse(totalMs)
}

// --- Brainrot Evolution ---
const addBrainrotCoins = (amount: number) => {
  gameState.addCoins(amount)
  currentCoins.value = gameState.getCoins()
  const label = amount >= 1e21 ? '100 Sextillion' : amount >= 1e8 ? '100M' : amount.toString()
  showStatus(`Added ${label} coins!`)
}

const levelUpOne = () => {
  brainrotData.value.level += 1
  brainrotData.value.exp = 0
  saveBrainrotData()
  showStatus(`Leveled up to ${brainrotData.value.level}!`)
}

const levelUpMax = () => {
  brainrotData.value.level = 99
  brainrotData.value.exp = 999
  saveBrainrotData()
  showStatus('Set to MAX level 99!')
}

const maxEverything = () => {
  // Max coins
  gameState.addCoins(999999)
  currentCoins.value = gameState.getCoins()

  // Max level
  brainrotData.value.level = 99
  brainrotData.value.exp = 999
  brainrotData.value.orangeHP = [200, 200, 200, 200, 200]

  // Give all pets
  if (!brainrotData.value.pets) {
    brainrotData.value.pets = []
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
    brainrotData.value.pets!.push(newPet)
  })

  brainrotData.value.activePet = brainrotData.value.pets[brainrotData.value.pets.length - 1]
  saveBrainrotData()

  // Give all GD powers
  for (let i = 0; i <= 3; i++) {
    gameState.purchasePower(i)
  }

  showStatus('MAXED EVERYTHING!')
}

const toggleLock = () => {
  if (adminLocked.value && isOwner.value) {
    remove(dbRef(db, 'admin_lock'))
  } else {
    const key = `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('adminOwnerKey', key)
    set(dbRef(db, 'admin_lock'), { ownerKey: key, timestamp: Date.now() })
    isOwner.value = true
  }
}

let unsubLock: Unsubscribe | null = null

onMounted(() => {
  loadBrainrotData()
  // Listen for players in real-time from Firebase
  unsubPlayers = OnlineTracker.onPlayersChanged((players) => {
    activePlayers.value = players
  })
  playerUpdateInterval = setInterval(() => {
    loadBrainrotData()
  }, 2000)

  // Listen for admin lock status
  const ownerKey = localStorage.getItem('adminOwnerKey')
  unsubLock = onValue(dbRef(db, 'admin_lock'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      adminLocked.value = true
      isOwner.value = ownerKey === data.ownerKey
    } else {
      adminLocked.value = false
    }
  })
})

onUnmounted(() => {
  if (unsubPlayers) unsubPlayers()
  if (unsubLock) unsubLock()
  if (playerUpdateInterval) {
    clearInterval(playerUpdateInterval)
  }
})
</script>

<style scoped>
.owner-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000a00 100%);
  padding: 20px;
  color: white;
  font-family: 'Segoe UI', sans-serif;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: #555;
}

.owner-container {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 20px;
}

.owner-header {
  text-align: center;
  margin-bottom: 30px;
}

.owner-title {
  font-size: 52px;
  color: #00ff00;
  text-shadow: 0 0 20px rgba(0, 255, 0, 0.5), 0 0 40px rgba(0, 255, 0, 0.2);
  font-family: monospace;
  letter-spacing: 8px;
  margin: 0;
}

.lock-btn {
  margin-top: 10px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  font-family: monospace;
  background: transparent;
  color: #ff4444;
  border: 1px solid #ff4444;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.lock-btn:hover {
  background: #ff4444;
  color: #000;
}

/* Sections */
.section {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
}

.section-title {
  font-size: 22px;
  font-family: monospace;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* Players Section */
.players-section {
  border-color: rgba(0, 255, 0, 0.3);
}

.players-section .section-title {
  color: #00ff00;
}

.no-players {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 20px;
  font-style: italic;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 5px;
}

.player-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stat {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
}

.game-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.player-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Panels Grid */
.panels-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}

@media (max-width: 768px) {
  .panels-grid {
    grid-template-columns: 1fr;
  }
}

/* Camera Watch Section */
.camera-section {
  border-color: rgba(139, 0, 0, 0.5);
  background: rgba(139, 0, 0, 0.08);
}

.camera-section .section-title {
  color: #ff3333;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

.camera-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin: 0 0 15px 0;
  font-style: italic;
}

.anomaly-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-anomaly {
  padding: 16px 12px;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  font-family: monospace;
  border: 2px solid;
}

.btn-preacher {
  background: linear-gradient(135deg, #1a0a2e, #2d1b4e);
  border-color: #8b5cf6;
  color: #c4b5fd;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

.btn-cloak {
  background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
  border-color: #ef4444;
  color: #fca5a5;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.btn-corpse {
  background: linear-gradient(135deg, #1a1a0a, #2e2e1b);
  border-color: #a3a3a3;
  color: #d4d4d4;
  text-shadow: 0 0 8px rgba(163, 163, 163, 0.6);
}

.btn-displacement {
  background: linear-gradient(135deg, #0a1a2e, #1b2d4e);
  border-color: #3b82f6;
  color: #93c5fd;
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.btn-imagery {
  background: linear-gradient(135deg, #2e0a0a, #4e1b1b);
  border-color: #f97316;
  color: #fdba74;
  text-shadow: 0 0 8px rgba(249, 115, 22, 0.6);
}

.btn-anomaly:hover {
  transform: scale(1.05);
  filter: brightness(1.3);
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
}

/* GD Section */
.gd-section {
  border-color: rgba(59, 130, 246, 0.4);
}

.gd-section .section-title {
  color: #3b82f6;
}

/* Brainrot Section */
.brainrot-section {
  border-color: rgba(168, 85, 247, 0.4);
}

.brainrot-section .section-title {
  color: #a855f7;
}

.current-value {
  color: #ffd700;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  text-align: center;
}

.value {
  color: #4ade80;
}

/* Buttons */
.button-group,
.coin-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  font-size: 14px;
  flex: 1;
  min-width: 100px;
  text-align: center;
}

.btn:hover {
  transform: scale(1.03);
  filter: brightness(1.2);
}

.btn:active {
  transform: scale(0.97);
}

.btn-sm {
  padding: 8px 14px;
  font-size: 12px;
  min-width: 80px;
  flex: 0;
}

.btn-full {
  width: 100%;
  flex: unset;
}

.btn-big {
  padding: 18px 20px;
  font-size: 18px;
  letter-spacing: 2px;
}

.btn-green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.btn-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.btn-purple {
  background: linear-gradient(135deg, #a855f7, #9333ea);
}

.btn-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

.btn-gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
}

.btn-yellow {
  background: linear-gradient(135deg, #eab308, #ca8a04);
  color: #000;
}

.btn-orange {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.btn-darkred {
  background: linear-gradient(135deg, #991b1b, #7f1d1d);
  border: 1px solid #ef4444;
}

.btn-rainbow {
  background: linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff);
  color: #fff;
  text-shadow: 1px 1px 2px #000;
}

.btn-gray {
  background: linear-gradient(135deg, #555, #333);
  border: 1px solid #777;
}

/* Status message */
.status-message {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 30px;
  background: rgba(0, 255, 0, 0.2);
  border: 2px solid #00ff00;
  border-radius: 10px;
  color: #00ff00;
  font-family: monospace;
  font-weight: bold;
  font-size: 16px;
  z-index: 9999;
  animation: fadeIn 0.3s;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Timer Picker */
.timer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.timer-box {
  background: #111;
  border: 3px solid #ff0000;
  border-radius: 20px;
  padding: 35px 40px;
  text-align: center;
  width: 380px;
  box-shadow: 0 0 40px rgba(255, 0, 0, 0.4);
}

.timer-title {
  color: #ff0000;
  font-size: 36px;
  font-family: 'Impact', sans-serif;
  margin: 0 0 5px 0;
  text-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
}

.timer-subtitle {
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 25px 0;
  font-size: 14px;
}

.timer-presets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Clock Picker */
.clock-picker {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.clock-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.clock-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.clock-btn {
  width: 50px;
  height: 40px;
  font-size: 24px;
  font-weight: bold;
  background: #333;
  color: white;
  border: 2px solid #555;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.clock-btn:hover {
  background: #555;
  border-color: #ff0000;
}

.clock-display {
  font-size: 64px;
  font-weight: 900;
  color: #ff0000;
  font-family: monospace;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
  line-height: 1;
}

.clock-colon {
  font-size: 64px;
  font-weight: 900;
  color: #ff0000;
  font-family: monospace;
  padding-bottom: 30px;
}

.clock-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
}

.clock-total {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
  font-family: monospace;
}

/* Talk to People */
.talk-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.talk-label {
  color: #3b82f6;
  font-size: 16px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 10px;
}

.talk-form {
  display: flex;
  gap: 8px;
}

.talk-input {
  flex: 1;
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #333;
  border-radius: 8px;
  background: #0a0a0a;
  color: white;
  font-family: sans-serif;
}

.talk-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.talk-input::placeholder {
  color: #555;
}

/* Effects Section */
.effects-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.effects-label {
  color: #ef4444;
  font-size: 16px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.effects-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
