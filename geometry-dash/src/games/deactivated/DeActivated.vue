<template>
  <div class="da-app">
    <!-- ===== MAIN MENU ===== -->
    <div v-if="screen === 'menu'" class="menu-screen">
      <div class="menu-card">
        <div class="menu-logo">🟢</div>
        <h1 class="menu-title">De-Activated</h1>
        <p class="menu-sub">Find the impostor before it's too late!</p>
        <input v-model="playerName" type="text" placeholder="Your name" maxlength="12" class="menu-input" />
        <div class="menu-buttons">
          <button class="menu-btn host-btn" @click="hostGame" :disabled="!playerName.trim()">🏠 Host Game</button>
          <button class="menu-btn join-btn" @click="screen = 'join'" :disabled="!playerName.trim()">🔗 Join Game</button>
          <button class="menu-btn bot-btn" @click="playBots" :disabled="!playerName.trim()">🤖 Play with Bots</button>
        </div>
        <div class="stats-bar" v-if="xp > 0">
          <span>⭐ Level {{ playerLevel }}</span>
          <span>🏆 {{ wins }} Wins</span>
          <span>{{ xp }} XP</span>
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- ===== JOIN SCREEN ===== -->
    <div v-if="screen === 'join'" class="menu-screen">
      <div class="menu-card">
        <h2 class="join-title">Join a Game</h2>
        <input v-model="joinCode" type="text" placeholder="Enter room code" maxlength="6" class="menu-input code-input" />
        <button class="menu-btn join-btn" @click="joinGame" :disabled="!joinCode.trim()">Join</button>
        <button class="back-link" @click="screen = 'menu'">← Back</button>
      </div>
    </div>

    <!-- ===== LOBBY ===== -->
    <div v-if="screen === 'lobby'" class="lobby-screen">
      <div class="lobby-card">
        <h2 class="lobby-title">Lobby</h2>
        <div class="room-code">Code: <span class="code-text">{{ roomCode }}</span></div>
        <div class="lobby-players">
          <div v-for="p in lobbyPlayers" :key="p.id" class="lobby-player" :style="{ borderColor: p.color }">
            <div class="lp-avatar" :style="{ background: p.color }">
              <div class="lp-visor"></div>
            </div>
            <span class="lp-name">{{ p.name }}</span>
            <span v-if="p.isHost" class="lp-host">HOST</span>
          </div>
        </div>
        <div class="lobby-settings" v-if="isHost">
          <label>Impostors: </label>
          <select v-model="impostorCount" class="lobby-select">
            <option :value="1">1</option>
            <option :value="2">2</option>
          </select>
        </div>
        <div class="lobby-count">{{ lobbyPlayers.length }} / 10 players</div>
        <button v-if="isHost" class="menu-btn start-btn" @click="startOnlineGame" :disabled="lobbyPlayers.length < 3">
          Start Game (need 3+)
        </button>
        <button class="back-link" @click="leaveLobby">← Leave</button>
      </div>
    </div>

    <!-- ===== GAME ===== -->
    <div v-if="screen === 'game'" class="game-screen">
      <div ref="threeContainer" class="three-container"></div>

      <!-- Role reveal -->
      <div v-if="showRoleReveal" class="role-reveal" :class="myRole">
        <div class="role-icon">{{ myRole === 'impostor' ? '🔴' : '🟢' }}</div>
        <h2 class="role-text">{{ myRole === 'impostor' ? 'IMPOSTOR' : 'CREWMATE' }}</h2>
        <p class="role-sub">{{ myRole === 'impostor' ? 'Sabotage and eliminate the crew.' : 'Complete tasks and find the impostor!' }}</p>
      </div>

      <!-- HUD -->
      <div class="game-hud" v-if="!showRoleReveal && !showMeeting && !showVoting && !showEjection">
        <!-- Task bar -->
        <div class="task-bar-container">
          <div class="task-bar-fill" :style="{ width: taskProgress + '%' }"></div>
          <span class="task-bar-text">Tasks: {{ completedTasks }}/{{ totalTasks }}</span>
        </div>

        <!-- Buttons -->
        <div class="action-buttons">
          <button v-if="myRole === 'impostor' && !isDead" class="action-btn kill-btn" :disabled="killCooldown > 0" @click="tryKill">
            🔪 {{ killCooldown > 0 ? killCooldown + 's' : 'Kill' }}
          </button>
          <button v-if="!isDead" class="action-btn report-btn" @click="tryReport" :disabled="!canReport">
            ⚠️ Report
          </button>
          <button v-if="!isDead && nearEmergency" class="action-btn emergency-btn" @click="callEmergency">
            🚨 Emergency
          </button>
          <button v-if="!isDead && nearTask" class="action-btn task-btn" @click="doTask">
            ✅ Task
          </button>
          <button v-if="myRole === 'impostor' && !isDead && nearVent" class="action-btn vent-btn" @click="useVent">
            🕳️ Vent
          </button>
        </div>

        <!-- Mini role indicator -->
        <div class="role-badge" :class="myRole">
          {{ myRole === 'impostor' ? '🔴 Impostor' : '🟢 Crewmate' }}
        </div>

        <!-- Dead indicator -->
        <div v-if="isDead" class="dead-badge">👻 GHOST</div>
      </div>

      <!-- Task mini-game -->
      <div v-if="showTaskGame" class="task-overlay">
        <div class="task-card">
          <h3>{{ currentTaskName }}</h3>
          <div class="task-game">
            <div class="wires-game" v-if="currentTaskType === 'wires'">
              <div v-for="(wire, i) in taskWires" :key="i" class="wire-row">
                <div class="wire-left" :style="{ background: wire.color }" @click="selectWire(i, 'left')"></div>
                <div class="wire-line" v-if="wire.connected" :style="{ background: wire.color }"></div>
                <div class="wire-right" :style="{ background: wire.rightColor }" @click="selectWire(i, 'right')"></div>
              </div>
            </div>
            <div class="swipe-game" v-if="currentTaskType === 'swipe'">
              <div class="swipe-track">
                <div class="swipe-zone"></div>
                <div class="swipe-handle" :style="{ left: swipePos + '%' }"
                  @mousedown="swipeStart" @touchstart.prevent="swipeStart"></div>
              </div>
              <p class="swipe-hint">Swipe the card at the right speed</p>
            </div>
            <div class="click-game" v-if="currentTaskType === 'click'">
              <p>Click the buttons in order!</p>
              <div class="click-grid">
                <button v-for="n in clickButtons" :key="n" class="click-num"
                  :class="{ done: n < clickNext, wrong: clickWrong === n }"
                  @click="clickButton(n)">{{ n }}</button>
              </div>
            </div>
          </div>
          <button class="task-close" @click="showTaskGame = false">✕ Close</button>
        </div>
      </div>

      <!-- Emergency Meeting -->
      <div v-if="showMeeting" class="meeting-overlay">
        <div class="meeting-banner">
          <h1>🚨 EMERGENCY MEETING 🚨</h1>
          <p>{{ meetingCaller }} called a meeting!</p>
        </div>
      </div>

      <!-- Voting -->
      <div v-if="showVoting" class="voting-overlay">
        <div class="voting-card">
          <h2 class="vote-title">Who is the Impostor?</h2>
          <div class="vote-timer">⏱️ {{ voteTimer }}s</div>
          <div class="vote-grid">
            <div v-for="p in alivePlayers" :key="p.id" class="vote-player"
              :class="{ voted: myVote === p.id, dead: p.dead }" @click="castVote(p.id)">
              <div class="vp-avatar" :style="{ background: p.color }">
                <div class="vp-visor"></div>
              </div>
              <span class="vp-name">{{ p.name }}</span>
              <span class="vp-votes" v-if="votesRevealed">{{ getVoteCount(p.id) }}</span>
            </div>
            <div class="vote-player skip" :class="{ voted: myVote === 'skip' }" @click="castVote('skip')">
              <span class="vp-name">⏭️ Skip Vote</span>
            </div>
          </div>
          <!-- Chat -->
          <div class="vote-chat">
            <div class="chat-messages" ref="chatBox">
              <div v-for="(msg, i) in chatMessages" :key="i" class="chat-msg">
                <span class="chat-sender" :style="{ color: msg.color }">{{ msg.name }}:</span>
                {{ msg.text }}
              </div>
            </div>
            <div class="chat-input-row">
              <input v-model="chatText" type="text" placeholder="Type..." class="chat-input"
                maxlength="100" @keydown.enter="sendChat" />
              <button class="chat-send" @click="sendChat">Send</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ejection -->
      <div v-if="showEjection" class="ejection-overlay">
        <div class="ejection-text">{{ ejectionText }}</div>
      </div>

      <!-- Game Over -->
      <div v-if="showGameOver" class="gameover-overlay">
        <div class="gameover-card" :class="gameOverWinner">
          <h1>{{ gameOverWinner === 'impostor' ? '🔴 Impostors Win!' : '🟢 Crewmates Win!' }}</h1>
          <div class="go-roles">
            <div v-for="p in allGamePlayers" :key="p.id" class="go-player">
              <div class="go-avatar" :style="{ background: p.color }"><div class="go-visor"></div></div>
              <span>{{ p.name }}</span>
              <span class="go-role" :class="p.role">{{ p.role }}</span>
            </div>
          </div>
          <div class="go-reward">+{{ gameOverXP }} XP</div>
          <button class="menu-btn" @click="backToMenu">Back to Menu</button>
        </div>
      </div>

      <!-- Mobile Controls -->
      <div class="mobile-controls" v-if="!showRoleReveal && !showMeeting && !showVoting && !showTaskGame">
        <div class="joystick" @touchstart.prevent="joyStart" @touchmove.prevent="joyMove" @touchend.prevent="joyEnd">
          <div class="joy-knob" :style="{ transform: `translate(${joyX}px, ${joyY}px)` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../firebase'
import { ref as dbRef, push, onValue, set, remove, get, onDisconnect } from 'firebase/database'
import * as THREE from 'three'

const router = useRouter()

// ========== STATE ==========
type Screen = 'menu' | 'join' | 'lobby' | 'game'
const screen = ref<Screen>('menu')
const playerName = ref('')
const joinCode = ref('')
const roomCode = ref('')
const isHost = ref(false)
const impostorCount = ref(1)

// Game state
const myRole = ref<'crewmate' | 'impostor'>('crewmate')
const isDead = ref(false)
const showRoleReveal = ref(false)
const showMeeting = ref(false)
const showVoting = ref(false)
const showEjection = ref(false)
const showGameOver = ref(false)
const showTaskGame = ref(false)
const meetingCaller = ref('')
const ejectionText = ref('')
const gameOverWinner = ref('')
const gameOverXP = ref(0)
const votesRevealed = ref(false)
const myVote = ref('')
const voteTimer = ref(30)
const killCooldown = ref(0)
const canReport = ref(false)
const nearEmergency = ref(false)
const nearTask = ref(false)
const nearVent = ref(false)

// Tasks
const completedTasks = ref(0)
const totalTasks = ref(5)
const currentTaskName = ref('')
const currentTaskType = ref('')
const taskWires = ref<{ color: string; rightColor: string; connected: boolean }[]>([])
const swipePos = ref(0)
const clickButtons = ref<number[]>([])
const clickNext = ref(1)
const clickWrong = ref(0)

// Chat
const chatMessages = ref<{ name: string; text: string; color: string }[]>([])
const chatText = ref('')
const chatBox = ref<HTMLElement | null>(null)

// Stats
const xp = ref(0)
const wins = ref(0)
const playerLevel = computed(() => Math.floor(xp.value / 100) + 1)

// 3D
const threeContainer = ref<HTMLElement | null>(null)
let scene3d: THREE.Scene
let camera3d: THREE.PerspectiveCamera
let renderer3d: THREE.WebGLRenderer
let animFrame: number
let gameActive = false
let playerMeshes: Map<string, THREE.Group> = new Map()
let bodyMeshes: Map<string, THREE.Group> = new Map()
let cameraYaw = 0

// Player
const PLAYER_COLORS = ['#e53e3e', '#3b82f6', '#22c55e', '#fbbf24', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#6366f1']
let myX = 400
let myY = 300
let myColor = '#e53e3e'
const myId = ref('')
const SPEED = 2.5

// Mobile joystick
const joyX = ref(0)
const joyY = ref(0)
let joyTouchId: number | null = null
let joyCenter = { x: 0, y: 0 }

// Input
const keys: Record<string, boolean> = {}

// Players
interface GamePlayer {
  id: string; name: string; x: number; y: number; color: string
  role: 'crewmate' | 'impostor'; dead: boolean; tasks: number
}

const allGamePlayers = ref<GamePlayer[]>([])
const lobbyPlayers = ref<{ id: string; name: string; color: string; isHost: boolean }[]>([])

const alivePlayers = computed(() => allGamePlayers.value.filter(p => !p.dead))
const taskProgress = computed(() => {
  if (totalTasks.value === 0) return 0
  const total = allGamePlayers.value.filter(p => p.role === 'crewmate').length * totalTasks.value
  const done = allGamePlayers.value.reduce((s, p) => s + (p.tasks || 0), 0)
  return Math.min(100, (done / Math.max(1, total)) * 100)
})

// Map
interface MapRoom {
  name: string; x: number; y: number; w: number; h: number; color: string
  hasTask?: boolean; hasVent?: boolean; hasEmergency?: boolean
}

interface DeadBody { x: number; y: number; color: string; id: string }

const deadBodies = ref<DeadBody[]>([])

const MAP_ROOMS: MapRoom[] = [
  { name: 'Cafeteria', x: 300, y: 50, w: 200, h: 150, color: '#2a3a4a', hasEmergency: true },
  { name: 'Weapons', x: 550, y: 50, w: 130, h: 120, color: '#3a2a2a', hasTask: true },
  { name: 'Navigation', x: 600, y: 250, w: 120, h: 130, color: '#2a2a3a', hasTask: true },
  { name: 'O2', x: 450, y: 200, w: 100, h: 100, color: '#2a3a2a', hasTask: true },
  { name: 'Admin', x: 350, y: 300, w: 120, h: 100, color: '#3a3a2a', hasTask: true },
  { name: 'Storage', x: 250, y: 350, w: 130, h: 120, color: '#2a2a2a', hasTask: true },
  { name: 'Electrical', x: 100, y: 300, w: 110, h: 110, color: '#2a2a1a', hasTask: true, hasVent: true },
  { name: 'Lower Engine', x: 50, y: 200, w: 100, h: 100, color: '#1a2a2a' },
  { name: 'Reactor', x: 30, y: 50, w: 120, h: 120, color: '#3a1a1a', hasTask: true, hasVent: true },
  { name: 'Upper Engine', x: 50, y: 0, w: 100, h: 80, color: '#1a2a2a' },
  { name: 'Medbay', x: 180, y: 100, w: 110, h: 100, color: '#1a3a3a', hasTask: true, hasVent: true },
  { name: 'Security', x: 180, y: 250, w: 100, h: 80, color: '#1a1a3a', hasVent: true },
]

// Hallways connecting rooms
const HALLWAYS = [
  { x: 150, y: 170, w: 150, h: 30 }, // Reactor to Cafeteria
  { x: 230, y: 200, w: 120, h: 30 }, // Medbay to O2
  { x: 150, y: 50, w: 150, h: 30 },  // Upper engine to Cafeteria
  { x: 500, y: 150, w: 30, h: 100 }, // Cafeteria to Navigation
  { x: 350, y: 200, w: 100, h: 30 }, // Admin area
  { x: 210, y: 300, w: 40, h: 50 },  // Electrical to Storage
  { x: 100, y: 170, w: 30, h: 130 }, // Engines
  { x: 350, y: 400, w: 30, h: 70 },  // Storage down
  { x: 480, y: 300, w: 120, h: 30 }, // To navigation
]

let isBotGame = false
let bots: { id: string; name: string; x: number; y: number; color: string; role: string; dead: boolean; tasks: number; targetX: number; targetY: number; moveTimer: number }[] = []
let killCooldownTimer: number | null = null
let voteTimerInterval: number | null = null
let onlineUnsubs: (() => void)[] = []

// ========== MENU / LOBBY ==========
function hostGame() {
  if (!playerName.value.trim()) return
  localStorage.setItem('daName', playerName.value)
  roomCode.value = Math.random().toString(36).slice(2, 8).toUpperCase()
  myId.value = 'da-' + Math.random().toString(36).slice(2, 10)
  myColor = PLAYER_COLORS[0]
  isHost.value = true

  const roomRef = dbRef(db, `deactivated/rooms/${roomCode.value}`)
  set(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`), {
    name: playerName.value, color: myColor, isHost: true,
  })
  onDisconnect(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`)).remove()

  listenToLobby()
  screen.value = 'lobby'
}

function joinGame() {
  if (!joinCode.value.trim()) return
  localStorage.setItem('daName', playerName.value)
  roomCode.value = joinCode.value.toUpperCase()
  myId.value = 'da-' + Math.random().toString(36).slice(2, 10)
  isHost.value = false

  get(dbRef(db, `deactivated/rooms/${roomCode.value}/players`)).then(snap => {
    const existing = snap.val()
    const count = existing ? Object.keys(existing).length : 0
    myColor = PLAYER_COLORS[count % PLAYER_COLORS.length]

    set(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`), {
      name: playerName.value, color: myColor, isHost: false,
    })
    onDisconnect(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`)).remove()

    listenToLobby()
    screen.value = 'lobby'
  })
}

function listenToLobby() {
  const unsub = onValue(dbRef(db, `deactivated/rooms/${roomCode.value}/players`), (snap) => {
    const data = snap.val()
    if (!data) { lobbyPlayers.value = []; return }
    lobbyPlayers.value = Object.entries(data).map(([id, val]: [string, any]) => ({
      id, name: val.name, color: val.color, isHost: val.isHost,
    }))
  })
  onlineUnsubs.push(unsub)

  // Listen for game start
  const unsub2 = onValue(dbRef(db, `deactivated/rooms/${roomCode.value}/gameState`), (snap) => {
    const state = snap.val()
    if (state === 'playing' && screen.value === 'lobby') {
      loadOnlineGame()
    }
  })
  onlineUnsubs.push(unsub2)
}

function leaveLobby() {
  remove(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`))
  onlineUnsubs.forEach(u => u())
  onlineUnsubs = []
  screen.value = 'menu'
}

function startOnlineGame() {
  // Assign roles
  const playerIds = lobbyPlayers.value.map(p => p.id)
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  const impostors = shuffled.slice(0, impostorCount.value)

  const roles: Record<string, string> = {}
  for (const id of playerIds) {
    roles[id] = impostors.includes(id) ? 'impostor' : 'crewmate'
  }

  set(dbRef(db, `deactivated/rooms/${roomCode.value}/roles`), roles)
  set(dbRef(db, `deactivated/rooms/${roomCode.value}/gameState`), 'playing')
}

function loadOnlineGame() {
  get(dbRef(db, `deactivated/rooms/${roomCode.value}/roles`)).then(snap => {
    const roles = snap.val()
    if (roles && roles[myId.value]) {
      myRole.value = roles[myId.value]
    }
    initGame(false)
  })
}

// ========== BOT GAME ==========
function playBots() {
  if (!playerName.value.trim()) return
  localStorage.setItem('daName', playerName.value)
  myId.value = 'local'
  myColor = PLAYER_COLORS[0]
  isBotGame = true
  isHost.value = true

  // Assign roles - player + 7 bots
  const allIds = ['local', 'bot1', 'bot2', 'bot3', 'bot4', 'bot5', 'bot6', 'bot7']
  const impostor = allIds[Math.floor(Math.random() * allIds.length)]
  myRole.value = impostor === 'local' ? 'impostor' : 'crewmate'

  const botNames = ['Red', 'Blue', 'Lime', 'Yellow', 'Purple', 'Pink', 'Orange']
  bots = botNames.map((name, i) => ({
    id: 'bot' + (i + 1), name, x: 350 + (Math.random() - 0.5) * 100,
    y: 100 + (Math.random() - 0.5) * 60, color: PLAYER_COLORS[i + 1],
    role: allIds[i + 1] === impostor ? 'impostor' : 'crewmate',
    dead: false, tasks: 0, targetX: 0, targetY: 0, moveTimer: 0,
  }))

  initGame(true)
}

// ========== INIT GAME ==========
function initGame(botMode: boolean) {
  screen.value = 'game'
  isBotGame = botMode
  isDead.value = false
  completedTasks.value = 0
  totalTasks.value = 5
  killCooldown.value = 15
  deadBodies.value = []
  chatMessages.value = []
  showGameOver.value = false

  // Spawn in cafeteria
  myX = 380 + (Math.random() - 0.5) * 80
  myY = 110 + (Math.random() - 0.5) * 40

  // Build player list
  allGamePlayers.value = [{
    id: myId.value, name: playerName.value, x: myX, y: myY,
    color: myColor, role: myRole.value, dead: false, tasks: 0,
  }]

  if (isBotGame) {
    for (const bot of bots) {
      allGamePlayers.value.push({
        id: bot.id, name: bot.name, x: bot.x, y: bot.y,
        color: bot.color, role: bot.role as any, dead: false, tasks: 0,
      })
      bot.targetX = MAP_ROOMS[Math.floor(Math.random() * MAP_ROOMS.length)].x + 50
      bot.targetY = MAP_ROOMS[Math.floor(Math.random() * MAP_ROOMS.length)].y + 50
      bot.moveTimer = 60 + Math.floor(Math.random() * 120)
    }
  }

  // Create own mesh (will be added after 3D init)
  setTimeout(() => {
    const myMesh = createPlayerMesh3D(myColor, playerName.value)
    myMesh.position.set(myX / 30, 0, myY / 30)
    scene3d.add(myMesh)
    playerMeshes.set(myId.value + '_self', myMesh)
  }, 100)

  // Show role
  showRoleReveal.value = true
  setTimeout(() => { showRoleReveal.value = false }, 3000)

  // Kill cooldown
  startKillCooldown()

  nextTick(() => {
    init3D()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove3D)
    window.addEventListener('resize', onResize3D)
    gameActive = true
    gameLoop()
  })
}

function init3D() {
  if (!threeContainer.value) return

  scene3d = new THREE.Scene()
  scene3d.background = new THREE.Color('#0a0a1a')

  camera3d = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)

  renderer3d = new THREE.WebGLRenderer({ antialias: true })
  renderer3d.setSize(window.innerWidth, window.innerHeight)
  renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer3d.shadowMap.enabled = true
  renderer3d.shadowMap.type = THREE.PCFSoftShadowMap
  threeContainer.value.appendChild(renderer3d.domElement)

  // Request pointer lock on click
  renderer3d.domElement.addEventListener('click', () => {
    renderer3d.domElement.requestPointerLock?.()
  })

  // Lights
  scene3d.add(new THREE.AmbientLight('#334466', 0.4))

  // Ceiling lights per room
  for (const room of MAP_ROOMS) {
    const light = new THREE.PointLight('#aabbcc', 0.8, 15)
    light.position.set((room.x + room.w / 2) / 30, 3.5, (room.y + room.h / 2) / 30)
    light.castShadow = true
    scene3d.add(light)
  }

  // Build 3D map
  build3DMap()
  playerMeshes = new Map()
  bodyMeshes = new Map()
}

function build3DMap() {
  const S = 30 // Scale: divide 2D coords by this to get 3D world coords

  // Floor for each room
  for (const room of MAP_ROOMS) {
    const floorGeo = new THREE.PlaneGeometry(room.w / S, room.h / S)
    const floorMat = new THREE.MeshStandardMaterial({ color: room.color, roughness: 0.8 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set((room.x + room.w / 2) / S, 0, (room.y + room.h / 2) / S)
    floor.receiveShadow = true
    scene3d.add(floor)

    // Walls around room (4 walls with gaps for doors)
    const wallH = 2.5
    const wallMat = new THREE.MeshStandardMaterial({ color: '#1a1a2a', roughness: 0.9 })

    // Simple box walls on each side
    const sides = [
      { x: room.x + room.w / 2, z: room.y, w: room.w, d: 2, rx: 0 },           // top
      { x: room.x + room.w / 2, z: room.y + room.h, w: room.w, d: 2, rx: 0 },   // bottom
      { x: room.x, z: room.y + room.h / 2, w: 2, d: room.h, rx: 0 },             // left
      { x: room.x + room.w, z: room.y + room.h / 2, w: 2, d: room.h, rx: 0 },    // right
    ]

    for (const s of sides) {
      const geo = new THREE.BoxGeometry(s.w / S, wallH, s.d / S)
      const wall = new THREE.Mesh(geo, wallMat)
      wall.position.set(s.x / S, wallH / 2, s.z / S)
      wall.castShadow = true
      wall.receiveShadow = true
      scene3d.add(wall)
    }

    // Room name sign
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 64
    const c = canvas.getContext('2d')!
    c.fillStyle = '#222'
    c.fillRect(0, 0, 256, 64)
    c.fillStyle = '#aaa'
    c.font = 'bold 20px Arial'
    c.textAlign = 'center'
    c.fillText(room.name, 128, 42)
    const tex = new THREE.CanvasTexture(canvas)
    const signMat = new THREE.MeshBasicMaterial({ map: tex })
    const signGeo = new THREE.PlaneGeometry(room.w / S * 0.6, 0.3)
    const sign = new THREE.Mesh(signGeo, signMat)
    sign.position.set((room.x + room.w / 2) / S, 2, (room.y + room.h / 2) / S)
    scene3d.add(sign)

    // Emergency button (3D)
    if (room.hasEmergency) {
      const btnGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16)
      const btnMat = new THREE.MeshStandardMaterial({ color: '#e53e3e', emissive: '#e53e3e', emissiveIntensity: 0.3 })
      const btn = new THREE.Mesh(btnGeo, btnMat)
      btn.position.set((room.x + room.w / 2) / S, 0.5, (room.y + room.h / 2) / S)
      scene3d.add(btn)
      // Table under button
      const tableGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16)
      const tableMat = new THREE.MeshStandardMaterial({ color: '#444' })
      const table = new THREE.Mesh(tableGeo, tableMat)
      table.position.set((room.x + room.w / 2) / S, 0.2, (room.y + room.h / 2) / S)
      scene3d.add(table)
    }

    // Task station
    if (room.hasTask) {
      const taskGeo = new THREE.BoxGeometry(0.3, 0.6, 0.15)
      const taskMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.2 })
      const task = new THREE.Mesh(taskGeo, taskMat)
      task.position.set((room.x + room.w / 2 + 15) / S, 0.6, (room.y + room.h / 2) / S)
      scene3d.add(task)
    }

    // Vent
    if (room.hasVent) {
      const ventGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5)
      const ventMat = new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.5 })
      const vent = new THREE.Mesh(ventGeo, ventMat)
      vent.position.set((room.x + room.w / 2 - 15) / S, 0.01, (room.y + room.h / 2) / S)
      scene3d.add(vent)
      // Vent slats
      for (let i = -2; i <= 2; i++) {
        const slatGeo = new THREE.BoxGeometry(0.45, 0.02, 0.03)
        const slat = new THREE.Mesh(slatGeo, ventMat)
        slat.position.set((room.x + room.w / 2 - 15) / S, 0.04, (room.y + room.h / 2) / S + i * 0.08)
        scene3d.add(slat)
      }
    }

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(room.w / S, room.h / S)
    const ceilMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 1 })
    const ceil = new THREE.Mesh(ceilGeo, ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set((room.x + room.w / 2) / S, 4, (room.y + room.h / 2) / S)
    scene3d.add(ceil)
  }

  // Hallway floors
  for (const hall of HALLWAYS) {
    const floorGeo = new THREE.PlaneGeometry(hall.w / S, hall.h / S)
    const floorMat = new THREE.MeshStandardMaterial({ color: '#151520', roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set((hall.x + hall.w / 2) / S, 0, (hall.y + hall.h / 2) / S)
    floor.receiveShadow = true
    scene3d.add(floor)

    // Hallway light
    const hl = new THREE.PointLight('#556677', 0.3, 5)
    hl.position.set((hall.x + hall.w / 2) / S, 2, (hall.y + hall.h / 2) / S)
    scene3d.add(hl)
  }
}

function createPlayerMesh3D(color: string, name: string): THREE.Group {
  const group = new THREE.Group()

  // Body (Among Us capsule shape)
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.35, 8, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.55
  body.castShadow = true
  group.add(body)

  // Visor
  const visorGeo = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const visorMat = new THREE.MeshStandardMaterial({ color: '#87CEEB', roughness: 0.2, metalness: 0.5 })
  const visor = new THREE.Mesh(visorGeo, visorMat)
  visor.position.set(0.08, 0.65, 0.12)
  visor.rotation.x = -0.3
  group.add(visor)

  // Backpack
  const bpGeo = new THREE.BoxGeometry(0.12, 0.25, 0.15)
  const bpMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const bp = new THREE.Mesh(bpGeo, bpMat)
  bp.position.set(-0.22, 0.5, 0)
  bp.castShadow = true
  group.add(bp)

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8)
  const leftLeg = new THREE.Mesh(legGeo, legMat)
  leftLeg.position.set(-0.08, 0.1, 0)
  group.add(leftLeg)
  const rightLeg = new THREE.Mesh(legGeo, legMat)
  rightLeg.position.set(0.08, 0.1, 0)
  group.add(rightLeg)

  // Name tag
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 48
  const c = canvas.getContext('2d')!
  c.fillStyle = 'rgba(0,0,0,0.6)'
  c.fillRect(0, 0, 256, 48)
  c.fillStyle = '#fff'
  c.font = 'bold 24px Arial'
  c.textAlign = 'center'
  c.fillText(name, 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(spriteMat)
  sprite.position.y = 1.2
  sprite.scale.set(1.2, 0.25, 1)
  group.add(sprite)

  return group
}

function createGhostMesh3D(color: string): THREE.Group {
  const group = new THREE.Group()
  const ghostGeo = new THREE.SphereGeometry(0.2, 12, 12)
  const ghostMat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.3 })
  const ghost = new THREE.Mesh(ghostGeo, ghostMat)
  ghost.position.y = 0.6
  group.add(ghost)
  return group
}

function createDeadBodyMesh3D(color: string): THREE.Group {
  const group = new THREE.Group()
  // Half body (split in half like Among Us)
  const halfGeo = new THREE.CapsuleGeometry(0.18, 0.15, 8, 16)
  const halfMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const half = new THREE.Mesh(halfGeo, halfMat)
  half.position.y = 0.15
  half.rotation.z = Math.PI / 2
  group.add(half)
  // Bone
  const boneGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6)
  const boneMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5' })
  const bone = new THREE.Mesh(boneGeo, boneMat)
  bone.position.set(0.15, 0.15, 0)
  bone.rotation.z = Math.PI / 4
  group.add(bone)
  return group
}

function update3DPlayers() {
  const S = 30
  const currentIds = new Set<string>()

  for (const p of allGamePlayers.value) {
    if (p.id === myId.value) continue
    currentIds.add(p.id)

    // Skip invisible players (out of vision, dead and we're alive)
    const dist = Math.sqrt((myX - p.x) ** 2 + (myY - p.y) ** 2)
    const visionRadius = myRole.value === 'impostor' ? 200 : 150
    if (dist > visionRadius && !isDead.value) {
      const existing = playerMeshes.get(p.id)
      if (existing) { existing.visible = false }
      continue
    }

    let mesh = playerMeshes.get(p.id)
    if (!mesh) {
      mesh = p.dead ? createGhostMesh3D(p.color) : createPlayerMesh3D(p.color, p.name)
      scene3d.add(mesh)
      playerMeshes.set(p.id, mesh)
    }

    // If player died, swap mesh
    if (p.dead && mesh.children.length > 2) {
      scene3d.remove(mesh)
      mesh = createGhostMesh3D(p.color)
      scene3d.add(mesh)
      playerMeshes.set(p.id, mesh)
    }

    if (p.dead && !isDead.value) { mesh.visible = false; continue }

    mesh.visible = true
    const targetPos = new THREE.Vector3(p.x / S, 0, p.y / S)
    mesh.position.lerp(targetPos, 0.2)
  }

  // Remove old meshes
  for (const [id, mesh] of playerMeshes) {
    if (!currentIds.has(id)) {
      scene3d.remove(mesh)
      playerMeshes.delete(id)
    }
  }

  // Dead bodies
  const bodyIds = new Set(deadBodies.value.map(b => b.id))
  for (const body of deadBodies.value) {
    if (!bodyMeshes.has(body.id)) {
      const bm = createDeadBodyMesh3D(body.color)
      bm.position.set(body.x / S, 0, body.y / S)
      scene3d.add(bm)
      bodyMeshes.set(body.id, bm)
    }
  }
  for (const [id, mesh] of bodyMeshes) {
    if (!bodyIds.has(id)) {
      scene3d.remove(mesh)
      bodyMeshes.delete(id)
    }
  }
}

function update3DCamera() {
  const S = 30
  const camDist = 4
  const camHeight = 3
  const cx = myX / S - Math.sin(cameraYaw) * camDist
  const cz = myY / S - Math.cos(cameraYaw) * camDist
  camera3d.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.12)
  camera3d.lookAt(new THREE.Vector3(myX / S, 0.5, myY / S))
}

function onMouseMove3D(e: MouseEvent) {
  if (document.pointerLockElement) {
    cameraYaw -= e.movementX * 0.003
  }
}

function onResize3D() {
  if (!renderer3d || !camera3d) return
  camera3d.aspect = window.innerWidth / window.innerHeight
  camera3d.updateProjectionMatrix()
  renderer3d.setSize(window.innerWidth, window.innerHeight)
}

function handleCanvasClick() {}

// ========== GAME LOOP ==========
function gameLoop() {
  if (!gameActive) return
  animFrame = requestAnimationFrame(gameLoop)

  if (showRoleReveal.value || showMeeting.value || showVoting.value || showEjection.value || showGameOver.value || showTaskGame.value) {
    return
  }

  updatePlayer()
  if (isBotGame) updateBots()
  checkProximity()
  update3DPlayers()
  update3DCamera()
  if (renderer3d) renderer3d.render(scene3d, camera3d)
}

function updatePlayer() {
  if (isDead.value) return

  // Camera-relative movement
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))

  let moveX = 0, moveZ = 0
  if (keys['KeyW'] || keys['ArrowUp']) { moveX += forward.x; moveZ += forward.z }
  if (keys['KeyS'] || keys['ArrowDown']) { moveX -= forward.x; moveZ -= forward.z }
  if (keys['KeyA'] || keys['ArrowLeft']) { moveX -= right.x; moveZ -= right.z }
  if (keys['KeyD'] || keys['ArrowRight']) { moveX += right.x; moveZ += right.z }

  // Mobile joystick
  if (joyX.value !== 0 || joyY.value !== 0) {
    moveX += (forward.x * (-joyY.value / 40) + right.x * (joyX.value / 40))
    moveZ += (forward.z * (-joyY.value / 40) + right.z * (joyX.value / 40))
  }

  if (moveX !== 0 || moveZ !== 0) {
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    const dx = (moveX / len) * SPEED
    const dz = (moveZ / len) * SPEED
    // Convert 3D direction back to 2D map coords (x = x*30, y = z*30)
    const newX = myX + dx * 30
    const newY = myY + dz * 30
    if (isWalkable(newX, newY)) {
      myX = newX
      myY = newY
    }
  }

  // Update my position in players list
  const me = allGamePlayers.value.find(p => p.id === myId.value)
  if (me) { me.x = myX; me.y = myY }

  // Update own 3D mesh
  const selfMesh = playerMeshes.get(myId.value + '_self')
  if (selfMesh) {
    selfMesh.position.set(myX / 30, 0, myY / 30)
    selfMesh.rotation.y = cameraYaw
  }
}

function isWalkable(x: number, y: number): boolean {
  // Check if position is inside any room or hallway
  for (const room of MAP_ROOMS) {
    if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) return true
  }
  for (const hall of HALLWAYS) {
    if (x >= hall.x && x <= hall.x + hall.w && y >= hall.y && y <= hall.y + hall.h) return true
  }
  return false
}

function checkProximity() {
  nearEmergency.value = false
  nearTask.value = false
  nearVent.value = false
  canReport.value = false

  for (const room of MAP_ROOMS) {
    const cx = room.x + room.w / 2
    const cy = room.y + room.h / 2
    const dist = Math.sqrt((myX - cx) ** 2 + (myY - cy) ** 2)

    if (dist < 80) {
      if (room.hasEmergency) nearEmergency.value = true
      if (room.hasTask && myRole.value === 'crewmate') nearTask.value = true
      if (room.hasVent && myRole.value === 'impostor') nearVent.value = true
    }
  }

  // Check near dead bodies
  for (const body of deadBodies.value) {
    const dist = Math.sqrt((myX - body.x) ** 2 + (myY - body.y) ** 2)
    if (dist < 60) canReport.value = true
  }
}

// ========== ACTIONS ==========
function tryKill() {
  if (killCooldown.value > 0 || myRole.value !== 'impostor') return

  let closest: GamePlayer | null = null
  let closestDist = 80

  for (const p of allGamePlayers.value) {
    if (p.id === myId.value || p.dead || p.role === 'impostor') continue
    const dist = Math.sqrt((myX - p.x) ** 2 + (myY - p.y) ** 2)
    if (dist < closestDist) {
      closestDist = dist
      closest = p
    }
  }

  if (closest) {
    closest.dead = true
    deadBodies.value.push({ x: closest.x, y: closest.y, color: closest.color, id: closest.id })

    if (isBotGame) {
      const bot = bots.find(b => b.id === closest!.id)
      if (bot) bot.dead = true
    }

    startKillCooldown()
    checkWinCondition()
  }
}

function tryReport() {
  if (!canReport.value) return
  startMeeting(playerName.value + ' reported a body!')
}

function callEmergency() {
  if (!nearEmergency.value) return
  startMeeting(playerName.value + ' called an emergency meeting!')
}

function startMeeting(reason: string) {
  meetingCaller.value = reason
  showMeeting.value = true
  chatMessages.value = []

  setTimeout(() => {
    showMeeting.value = false
    showVoting.value = true
    myVote.value = ''
    votesRevealed.value = false
    voteTimer.value = 30

    voteTimerInterval = setInterval(() => {
      voteTimer.value--
      if (voteTimer.value <= 0) {
        endVoting()
      }
    }, 1000) as unknown as number

    // Bots vote after a delay
    if (isBotGame) {
      setTimeout(() => botVote(), 5000 + Math.random() * 10000)
    }
  }, 3000)
}

function castVote(targetId: string) {
  if (myVote.value || isDead.value) return
  myVote.value = targetId
}

function botVote() {
  // Bots vote randomly (slightly smart)
  for (const bot of bots) {
    if (bot.dead) continue
    const alive = allGamePlayers.value.filter(p => !p.dead && p.id !== bot.id)
    if (alive.length > 0) {
      // 30% chance to skip
      if (Math.random() < 0.3) continue
      const target = alive[Math.floor(Math.random() * alive.length)]
      // Impostor bots don't vote for other impostors
      if (bot.role === 'impostor' && target.role === 'impostor') continue
    }
  }
}

function getVoteCount(playerId: string): number {
  // In bot mode, simulate votes
  return playerId === myVote.value ? 1 : 0
}

function endVoting() {
  if (voteTimerInterval) clearInterval(voteTimerInterval)
  votesRevealed.value = true

  setTimeout(() => {
    showVoting.value = false

    // Determine who gets ejected (most votes)
    const ejectedId = myVote.value
    if (ejectedId && ejectedId !== 'skip') {
      const player = allGamePlayers.value.find(p => p.id === ejectedId)
      if (player) {
        player.dead = true
        if (isBotGame) {
          const bot = bots.find(b => b.id === ejectedId)
          if (bot) bot.dead = true
        }
        const wasImpostor = player.role === 'impostor'
        ejectionText.value = `${player.name} was ${wasImpostor ? 'An Impostor.' : 'not An Impostor.'}`
      }
    } else {
      ejectionText.value = 'No one was ejected. (Skipped)'
    }

    showEjection.value = true
    setTimeout(() => {
      showEjection.value = false
      // Remove dead bodies after meeting
      deadBodies.value = []
      checkWinCondition()
    }, 4000)
  }, 2000)
}

function startKillCooldown() {
  killCooldown.value = 15
  if (killCooldownTimer) clearInterval(killCooldownTimer)
  killCooldownTimer = setInterval(() => {
    killCooldown.value--
    if (killCooldown.value <= 0 && killCooldownTimer) clearInterval(killCooldownTimer)
  }, 1000) as unknown as number
}

function useVent() {
  // Teleport to another vent room
  const ventRooms = MAP_ROOMS.filter(r => r.hasVent)
  const currentRoom = ventRooms.find(r =>
    myX >= r.x && myX <= r.x + r.w && myY >= r.y && myY <= r.y + r.h
  )
  const otherVents = ventRooms.filter(r => r !== currentRoom)
  if (otherVents.length > 0) {
    const target = otherVents[Math.floor(Math.random() * otherVents.length)]
    myX = target.x + target.w / 2
    myY = target.y + target.h / 2
  }
}

// ========== TASKS ==========
function doTask() {
  if (!nearTask.value || myRole.value !== 'crewmate') return
  const types = ['wires', 'swipe', 'click']
  currentTaskType.value = types[Math.floor(Math.random() * types.length)]
  currentTaskName.value = ['Fix Wires', 'Swipe Card', 'Enter Code'][types.indexOf(currentTaskType.value)]
  showTaskGame.value = true

  if (currentTaskType.value === 'wires') {
    const colors = ['#e53e3e', '#3b82f6', '#22c55e', '#fbbf24']
    const shuffled = [...colors].sort(() => Math.random() - 0.5)
    taskWires.value = colors.map((c, i) => ({ color: c, rightColor: shuffled[i], connected: false }))
  }
  if (currentTaskType.value === 'click') {
    clickButtons.value = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5)
    clickNext.value = 1
    clickWrong.value = 0
  }
  if (currentTaskType.value === 'swipe') {
    swipePos.value = 0
  }
}

let selectedLeftWire = -1
function selectWire(i: number, side: string) {
  if (side === 'left') {
    selectedLeftWire = i
  } else if (selectedLeftWire >= 0) {
    if (taskWires.value[selectedLeftWire].color === taskWires.value[i].rightColor) {
      taskWires.value[i].connected = true
      taskWires.value[selectedLeftWire].connected = true
    }
    selectedLeftWire = -1
    if (taskWires.value.every(w => w.connected)) completeTask()
  }
}

function clickButton(n: number) {
  if (n === clickNext.value) {
    clickNext.value++
    if (clickNext.value > 9) completeTask()
  } else {
    clickWrong.value = n
    setTimeout(() => { clickWrong.value = 0 }, 500)
  }
}

let swiping = false
function swipeStart() { swiping = true }

function completeTask() {
  completedTasks.value++
  showTaskGame.value = false
  const me = allGamePlayers.value.find(p => p.id === myId.value)
  if (me) me.tasks = completedTasks.value

  // Check if all tasks done
  if (taskProgress.value >= 100) {
    gameWin('crewmate')
  }
}

// ========== CHAT ==========
function sendChat() {
  if (!chatText.value.trim() || isDead.value) return
  chatMessages.value.push({ name: playerName.value, text: chatText.value.trim(), color: myColor })
  chatText.value = ''
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
  })
}

// ========== WIN CONDITION ==========
function checkWinCondition() {
  const alive = allGamePlayers.value.filter(p => !p.dead)
  const impostors = alive.filter(p => p.role === 'impostor')
  const crew = alive.filter(p => p.role === 'crewmate')

  if (impostors.length === 0) gameWin('crewmate')
  else if (impostors.length >= crew.length) gameWin('impostor')
}

function gameWin(winner: string) {
  gameOverWinner.value = winner
  const won = (winner === 'impostor' && myRole.value === 'impostor') ||
              (winner === 'crewmate' && myRole.value === 'crewmate')
  gameOverXP.value = won ? 50 : 15
  xp.value += gameOverXP.value
  if (won) wins.value++
  localStorage.setItem('daXP', xp.value.toString())
  localStorage.setItem('daWins', wins.value.toString())
  showGameOver.value = true
  gameActive = false
}

function backToMenu() {
  gameActive = false
  if (animFrame) cancelAnimationFrame(animFrame)
  screen.value = 'menu'
}

// ========== BOT AI ==========
function updateBots() {
  for (const bot of bots) {
    if (bot.dead) continue

    bot.moveTimer--
    if (bot.moveTimer <= 0) {
      const room = MAP_ROOMS[Math.floor(Math.random() * MAP_ROOMS.length)]
      bot.targetX = room.x + Math.random() * room.w
      bot.targetY = room.y + Math.random() * room.h
      bot.moveTimer = 120 + Math.floor(Math.random() * 180)
    }

    const dx = bot.targetX - bot.x
    const dy = bot.targetY - bot.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 3) {
      const speed = 1.5
      bot.x += (dx / dist) * speed
      bot.y += (dy / dist) * speed
    }

    // Update in players list
    const p = allGamePlayers.value.find(pp => pp.id === bot.id)
    if (p) { p.x = bot.x; p.y = bot.y }

    // Bot impostor kills
    if (bot.role === 'impostor' && !showMeeting.value && !showVoting.value) {
      for (const target of allGamePlayers.value) {
        if (target.id === bot.id || target.dead || target.role === 'impostor') continue
        const d = Math.sqrt((bot.x - target.x) ** 2 + (bot.y - target.y) ** 2)
        if (d < 50 && Math.random() < 0.003) {
          target.dead = true
          const targetBot = bots.find(b => b.id === target.id)
          if (targetBot) targetBot.dead = true
          deadBodies.value.push({ x: target.x, y: target.y, color: target.color, id: target.id })
          if (target.id === myId.value) isDead.value = true
          checkWinCondition()
        }
      }
    }

    // Bot does tasks
    if (bot.role === 'crewmate' && Math.random() < 0.001) {
      bot.tasks++
      const p2 = allGamePlayers.value.find(pp => pp.id === bot.id)
      if (p2) p2.tasks = bot.tasks
    }
  }
}

// ========== DRAWING ==========
// Old 2D draw functions removed - using 3D now

// ========== INPUT ==========
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (e.code === 'KeyE') {
    if (nearTask.value) doTask()
    else if (nearVent.value) useVent()
  }
  if (e.code === 'KeyQ') tryKill()
  if (e.code === 'KeyR') tryReport()
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

// Mobile joystick
function joyStart(e: TouchEvent) {
  const touch = e.touches[0]
  joyTouchId = touch.identifier
  joyCenter = { x: touch.clientX, y: touch.clientY }
}
function joyMove(e: TouchEvent) {
  for (const touch of Array.from(e.touches)) {
    if (touch.identifier === joyTouchId) {
      joyX.value = Math.max(-40, Math.min(40, touch.clientX - joyCenter.x))
      joyY.value = Math.max(-40, Math.min(40, touch.clientY - joyCenter.y))
    }
  }
}
function joyEnd() { joyTouchId = null; joyX.value = 0; joyY.value = 0 }

// ========== LIFECYCLE ==========
onMounted(() => {
  const saved = localStorage.getItem('daName')
  if (saved) playerName.value = saved
  xp.value = parseInt(localStorage.getItem('daXP') || '0')
  wins.value = parseInt(localStorage.getItem('daWins') || '0')

  // Swipe handler
  window.addEventListener('mousemove', (e) => {
    if (swiping && showTaskGame.value && currentTaskType.value === 'swipe') {
      swipePos.value = Math.min(100, swipePos.value + 2)
      if (swipePos.value >= 80 && swipePos.value <= 95) {
        swiping = false
        completeTask()
      }
    }
  })
  window.addEventListener('mouseup', () => {
    if (swiping) { swiping = false; swipePos.value = 0 }
  })
  window.addEventListener('touchmove', (e) => {
    if (swiping && showTaskGame.value && currentTaskType.value === 'swipe') {
      swipePos.value = Math.min(100, swipePos.value + 1.5)
      if (swipePos.value >= 80 && swipePos.value <= 95) {
        swiping = false
        completeTask()
      }
    }
  })
  window.addEventListener('touchend', () => {
    if (swiping) { swiping = false; swipePos.value = 0 }
  })
})

onUnmounted(() => {
  gameActive = false
  if (animFrame) cancelAnimationFrame(animFrame)
  if (renderer3d) renderer3d.dispose()
  if (killCooldownTimer) clearInterval(killCooldownTimer)
  if (voteTimerInterval) clearInterval(voteTimerInterval)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove3D)
  window.removeEventListener('resize', onResize3D)
  onlineUnsubs.forEach(u => u())
  if (roomCode.value) {
    remove(dbRef(db, `deactivated/rooms/${roomCode.value}/players/${myId.value}`))
  }
})
</script>

<style scoped>
.da-app { font-family: 'Segoe UI', system-ui, sans-serif; }

/* ===== MENU ===== */
.menu-screen {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a0a1a, #1a1a3a, #0a1a2a);
}
.menu-card {
  background: rgba(10,10,30,0.9); border-radius: 24px; padding: 40px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 2px solid #333; max-width: 400px; width: 90%;
}
.menu-logo { font-size: 64px; }
.menu-title { color: #e53e3e; font-size: 36px; font-weight: 900; margin: 8px 0 4px; letter-spacing: 2px; }
.menu-sub { color: #94a3b8; font-size: 15px; margin: 0 0 24px; }
.menu-input {
  width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #333;
  background: #0a0a1a; color: #fff; font-size: 16px; outline: none; margin-bottom: 14px; box-sizing: border-box;
}
.menu-input:focus { border-color: #e53e3e; }
.code-input { text-align: center; letter-spacing: 6px; font-size: 24px; text-transform: uppercase; }
.menu-buttons { display: flex; flex-direction: column; gap: 8px; }
.menu-btn {
  padding: 14px; border-radius: 12px; border: none; font-size: 16px; font-weight: 800; cursor: pointer;
  transition: transform 0.15s;
}
.menu-btn:hover { transform: translateY(-2px); }
.menu-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.host-btn { background: linear-gradient(135deg, #e53e3e, #dc2626); color: #fff; }
.join-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.bot-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.start-btn { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }
.stats-bar {
  display: flex; justify-content: center; gap: 16px; margin: 16px 0 0; color: #94a3b8; font-size: 13px; font-weight: 600;
}
.join-title { color: #fff; font-size: 24px; font-weight: 800; margin: 0 0 16px; }

/* ===== LOBBY ===== */
.lobby-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a1a; }
.lobby-card {
  background: #111; border-radius: 20px; padding: 30px; text-align: center;
  border: 2px solid #333; max-width: 500px; width: 90%;
}
.lobby-title { color: #fff; font-size: 24px; font-weight: 800; margin: 0 0 12px; }
.room-code { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
.code-text { color: #fbbf24; font-size: 28px; font-weight: 900; letter-spacing: 4px; }
.lobby-players { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 16px; }
.lobby-player {
  background: #1a1a2a; border-radius: 12px; padding: 10px 14px;
  display: flex; align-items: center; gap: 8px; border: 2px solid;
}
.lp-avatar { width: 30px; height: 36px; border-radius: 8px 8px 4px 4px; position: relative; }
.lp-visor {
  position: absolute; top: 6px; right: -2px; width: 14px; height: 10px;
  background: #87CEEB; border-radius: 4px;
}
.lp-name { color: #fff; font-size: 14px; font-weight: 600; }
.lp-host { color: #fbbf24; font-size: 10px; font-weight: 800; background: rgba(251,191,36,0.2); padding: 2px 6px; border-radius: 4px; }
.lobby-settings { margin-bottom: 12px; color: #94a3b8; font-size: 14px; }
.lobby-select { background: #1a1a2a; color: #fff; border: 1px solid #333; padding: 4px 8px; border-radius: 6px; }
.lobby-count { color: #666; font-size: 13px; margin-bottom: 12px; }

/* ===== GAME ===== */
.game-screen {
  min-height: 100vh; background: #000; display: flex; flex-direction: column;
  align-items: center; justify-content: center; position: relative;
}
.three-container { position: fixed; inset: 0; z-index: 1; }

/* Role Reveal */
.role-reveal {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 30; animation: fade-in 0.5s;
}
.role-reveal.impostor { background: rgba(139,0,0,0.9); }
.role-reveal.crewmate { background: rgba(0,80,0,0.9); }
.role-icon { font-size: 80px; margin-bottom: 16px; }
.role-text { color: #fff; font-size: 42px; font-weight: 900; margin: 0; }
.role-sub { color: rgba(255,255,255,0.7); font-size: 16px; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

/* HUD */
.game-hud { position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; pointer-events: none; }
.task-bar-container {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  width: 200px; height: 20px; background: rgba(0,0,0,0.7); border-radius: 10px; overflow: hidden;
}
.task-bar-fill { height: 100%; background: #22c55e; border-radius: 10px; transition: width 0.3s; }
.task-bar-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 10px; font-weight: 700;
}
.action-buttons {
  position: fixed; bottom: 16px; right: 16px; display: flex; gap: 8px; pointer-events: auto;
}
.action-btn {
  padding: 10px 16px; border-radius: 12px; border: none; font-size: 14px;
  font-weight: 700; cursor: pointer; color: #fff;
}
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.kill-btn { background: #dc2626; }
.report-btn { background: #f59e0b; }
.emergency-btn { background: #e53e3e; }
.task-btn { background: #22c55e; }
.vent-btn { background: #6366f1; }
.role-badge {
  position: fixed; top: 40px; left: 12px; padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 700; color: #fff;
}
.role-badge.impostor { background: rgba(220,38,38,0.7); }
.role-badge.crewmate { background: rgba(34,197,94,0.7); }
.dead-badge {
  position: fixed; top: 40px; right: 12px; padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 700; color: #fff; background: rgba(100,100,100,0.7);
}

/* Task Game */
.task-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 25;
}
.task-card {
  background: #1a1a2e; border-radius: 20px; padding: 24px; text-align: center;
  border: 2px solid #333; max-width: 360px; width: 90%; color: #fff;
}
.task-card h3 { margin: 0 0 16px; font-size: 20px; }
.wire-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; justify-content: center; }
.wire-left, .wire-right {
  width: 40px; height: 20px; border-radius: 4px; cursor: pointer; border: 2px solid #555;
}
.wire-left:hover, .wire-right:hover { border-color: #fff; }
.wire-line { flex: 1; height: 4px; border-radius: 2px; }
.swipe-track {
  height: 40px; background: #333; border-radius: 20px; position: relative; margin: 20px 0;
}
.swipe-zone {
  position: absolute; right: 5%; width: 15%; height: 100%; background: rgba(34,197,94,0.3);
  border-radius: 20px;
}
.swipe-handle {
  position: absolute; top: 2px; width: 30px; height: 36px; background: #3b82f6;
  border-radius: 8px; cursor: pointer;
}
.swipe-hint { color: #94a3b8; font-size: 12px; }
.click-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 200px; margin: 0 auto; }
.click-num {
  padding: 14px; border-radius: 10px; border: 2px solid #333; background: #1a1a2a;
  color: #fff; font-size: 18px; font-weight: 800; cursor: pointer;
}
.click-num:hover { border-color: #3b82f6; }
.click-num.done { background: #22c55e; border-color: #22c55e; }
.click-num.wrong { background: #dc2626; border-color: #dc2626; }
.task-close {
  margin-top: 14px; background: #333; color: #fff; border: none; padding: 8px 20px;
  border-radius: 8px; font-size: 14px; cursor: pointer;
}

/* Meeting & Voting */
.meeting-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center; z-index: 30;
}
.meeting-banner { text-align: center; animation: shake 0.5s; }
.meeting-banner h1 { color: #e53e3e; font-size: 36px; }
.meeting-banner p { color: #fff; font-size: 18px; }
@keyframes shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }

.voting-overlay {
  position: fixed; inset: 0; background: rgba(10,10,20,0.95);
  display: flex; align-items: center; justify-content: center; z-index: 30; overflow-y: auto;
}
.voting-card {
  background: #111; border-radius: 20px; padding: 24px; max-width: 500px; width: 95%;
  border: 2px solid #333;
}
.vote-title { color: #fff; font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 8px; }
.vote-timer { text-align: center; color: #fbbf24; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
.vote-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 14px; }
.vote-player {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px;
  background: #1a1a2a; border: 2px solid #333; cursor: pointer; min-width: 120px;
}
.vote-player:hover { border-color: #555; }
.vote-player.voted { border-color: #22c55e; background: rgba(34,197,94,0.2); }
.vote-player.dead { opacity: 0.3; pointer-events: none; }
.vote-player.skip { justify-content: center; }
.vp-avatar { width: 24px; height: 28px; border-radius: 6px 6px 3px 3px; position: relative; }
.vp-visor { position: absolute; top: 5px; right: -1px; width: 10px; height: 7px; background: #87CEEB; border-radius: 3px; }
.vp-name { color: #fff; font-size: 13px; font-weight: 600; }
.vp-votes { color: #fbbf24; font-size: 12px; font-weight: 800; margin-left: auto; }

/* Chat */
.vote-chat { border-top: 1px solid #333; padding-top: 10px; }
.chat-messages { height: 100px; overflow-y: auto; margin-bottom: 8px; }
.chat-msg { font-size: 12px; color: #ccc; padding: 2px 0; }
.chat-sender { font-weight: 700; }
.chat-input-row { display: flex; gap: 6px; }
.chat-input {
  flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #333;
  background: #0a0a1a; color: #fff; font-size: 13px; outline: none;
}
.chat-send {
  padding: 8px 14px; border-radius: 8px; border: none; background: #3b82f6;
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}

/* Ejection */
.ejection-overlay {
  position: fixed; inset: 0; background: linear-gradient(135deg, #000, #0a0a2a);
  display: flex; align-items: center; justify-content: center; z-index: 30;
}
.ejection-text { color: #fff; font-size: 28px; font-weight: 900; text-align: center; animation: float-away 4s; }
@keyframes float-away { 0% { transform: translateX(-200px); opacity: 0; } 20% { opacity: 1; transform: translateX(0); } 80% { opacity: 1; } 100% { transform: translateX(300px) rotate(90deg); opacity: 0; } }

/* Game Over */
.gameover-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center; z-index: 30;
}
.gameover-card {
  background: #111; border-radius: 20px; padding: 30px; text-align: center;
  border: 3px solid; max-width: 400px; width: 90%;
}
.gameover-card.impostor { border-color: #e53e3e; }
.gameover-card.crewmate { border-color: #22c55e; }
.gameover-card h1 { color: #fff; font-size: 26px; margin: 0 0 16px; }
.go-roles { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 16px; }
.go-player { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: #1a1a2a; border-radius: 8px; font-size: 13px; color: #fff; }
.go-avatar { width: 20px; height: 24px; border-radius: 4px; position: relative; }
.go-visor { position: absolute; top: 4px; right: -1px; width: 8px; height: 6px; background: #87CEEB; border-radius: 2px; }
.go-role { font-weight: 800; font-size: 11px; }
.go-role.impostor { color: #e53e3e; }
.go-role.crewmate { color: #22c55e; }
.go-reward { color: #fbbf24; font-size: 20px; font-weight: 800; margin-bottom: 16px; }

/* Mobile */
.mobile-controls {
  display: none; position: fixed; bottom: 80px; left: 20px; z-index: 10;
}
.joystick {
  width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
}
.joy-knob { width: 40px; height: 40px; background: rgba(255,255,255,0.3); border-radius: 50%; }

@media (max-width: 800px), (pointer: coarse) {
  .mobile-controls { display: block; }
}
</style>
