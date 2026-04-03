<template>
  <div class="spelling-app">
    <!-- Back button -->
    <button class="back-btn" @click="$router.push('/')">← Back</button>

    <!-- MAIN MENU -->
    <div v-if="screen === 'menu'" class="screen menu-screen">
      <h1 class="game-title">Spelling Champion</h1>
      <div class="stats-bar">
        <div class="stat-box points-box">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">{{ points }} pts</span>
        </div>
        <div class="stat-box streak-box">
          <span class="stat-icon">🔥</span>
          <span class="stat-value">{{ streakCount }}/5 days</span>
        </div>
        <div class="stat-box ticket-box" v-if="titanicTickets > 0">
          <span class="stat-icon">🎫</span>
          <span class="stat-value">{{ titanicTickets }} ticket{{ titanicTickets === 1 ? '' : 's' }}</span>
        </div>
      </div>
      <div class="menu-buttons">
        <button class="menu-btn practice-btn" @click="goToListSelect">📖 Practice Spelling</button>
        <button class="menu-btn lists-btn" @click="screen = 'lists'">📋 My Spelling Lists</button>
        <button class="menu-btn shop-btn" @click="screen = 'shop'">🛒 Rewards Shop</button>
        <button class="menu-btn streak-btn" @click="screen = 'streak'">🔥 Daily Streak</button>
        <button class="menu-btn titanic-btn" v-if="titanicTickets > 0" @click="screen = 'titanic'">🚢 Titanic AFK Session</button>
      </div>
    </div>

    <!-- MY SPELLING LISTS -->
    <div v-if="screen === 'lists'" class="screen lists-screen">
      <h2 class="screen-title">My Spelling Lists</h2>
      <div class="new-list-area">
        <input
          v-model="newListName"
          class="text-input"
          placeholder="New list name (e.g. Week 1)"
          @keyup.enter="createList"
        />
        <button class="action-btn add-btn" @click="createList">+ Create List</button>
      </div>
      <div v-if="lists.length === 0" class="empty-msg">No lists yet! Create one above.</div>
      <div v-for="(list, li) in lists" :key="li" class="list-card">
        <div class="list-header">
          <div v-if="editingListIndex === li" class="edit-name-area">
            <input v-model="editingListName" class="text-input small" @keyup.enter="saveListName(li)" />
            <button class="action-btn small-btn" @click="saveListName(li)">Save</button>
            <button class="action-btn small-btn cancel-btn" @click="editingListIndex = -1">Cancel</button>
          </div>
          <div v-else class="list-name-area">
            <h3 class="list-name">{{ list.name }}</h3>
            <span class="word-count">({{ list.words.length }} words)</span>
            <button class="icon-btn" @click="startEditListName(li)">✏️</button>
            <button class="icon-btn delete-icon" @click="deleteList(li)">🗑️</button>
          </div>
        </div>
        <div class="add-word-area">
          <input
            v-model="newWordInputs[li]"
            class="text-input small"
            placeholder="Add a word..."
            @keyup.enter="addWord(li)"
          />
          <button class="action-btn small-btn" @click="addWord(li)">Add</button>
        </div>
        <div class="word-list">
          <span v-for="(word, wi) in list.words" :key="wi" class="word-tag">
            {{ word }}
            <button class="remove-word" @click="removeWord(li, wi)">x</button>
          </span>
        </div>
        <button
          class="action-btn practice-list-btn"
          :disabled="list.words.length === 0"
          @click="startPractice(li)"
        >
          Practice This List
        </button>
      </div>
      <button class="back-link" @click="screen = 'menu'">← Back to Menu</button>
    </div>

    <!-- PRACTICE MODE -->
    <div v-if="screen === 'practice'" class="screen practice-screen">
      <h2 class="screen-title">Practice Mode</h2>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        <span class="progress-text">{{ currentWordIndex + 1 }} / {{ practiceWords.length }}</span>
      </div>

      <!-- Show word phase -->
      <div v-if="practicePhase === 'show'" class="word-display">
        <div class="big-word">{{ practiceWords[currentWordIndex] }}</div>
        <div class="countdown-text">Remember this word!</div>
      </div>

      <!-- Type word phase -->
      <div v-if="practicePhase === 'type'" class="type-area">
        <div class="prompt-text">Type the word you saw:</div>
        <button class="speak-btn" @click="speakCurrentWord">🔊 Hear it again</button>
        <input
          ref="typeInput"
          v-model="typedWord"
          class="type-input"
          placeholder="Type the word..."
          @keyup.enter="checkAnswer"
          :disabled="practicePhase !== 'type'"
        />
        <button class="action-btn check-btn" @click="checkAnswer">Check!</button>
      </div>

      <!-- Result phase -->
      <div v-if="practicePhase === 'result'" class="result-area">
        <div v-if="lastCorrect" class="correct-msg">
          <span class="big-emoji">🎉</span>
          Correct! +10 points!
          <div class="confetti-container">
            <div v-for="n in 20" :key="n" class="confetti-piece" :style="confettiStyle(n)"></div>
          </div>
        </div>
        <div v-else class="wrong-msg">
          <span class="big-emoji">😅</span>
          Not quite! The correct spelling is:
          <div class="correct-word-show">{{ practiceWords[currentWordIndex] }}</div>
          <button class="action-btn retry-btn" @click="retryWord">Try Again</button>
        </div>
        <button v-if="lastCorrect" class="action-btn next-btn" @click="nextWord">
          {{ isLastWord ? 'See Results' : 'Next Word →' }}
        </button>
      </div>

      <!-- Summary -->
      <div v-if="practicePhase === 'summary'" class="summary-area">
        <h2 class="summary-title">Practice Complete!</h2>
        <div class="summary-stats">
          <div class="summary-stat">
            <span class="summary-num">{{ correctCount }}</span>
            <span class="summary-label">out of {{ practiceWords.length }} correct</span>
          </div>
          <div class="summary-stat">
            <span class="summary-num">{{ sessionPoints }}</span>
            <span class="summary-label">points earned</span>
          </div>
          <div v-if="gotPerfect" class="perfect-bonus">
            <span class="big-emoji">🏆</span> Perfect Score! +50 bonus points!
          </div>
        </div>
        <button class="action-btn" @click="screen = 'menu'">Back to Menu</button>
      </div>
    </div>

    <!-- REWARDS SHOP -->
    <div v-if="screen === 'shop'" class="screen shop-screen">
      <h2 class="screen-title">Rewards Shop</h2>
      <div class="shop-points">Your Points: <span class="highlight">{{ points }}</span></div>
      <div class="shop-grid">
        <div v-for="(reward, ri) in rewards" :key="ri" class="reward-card" :class="{ affordable: canAfford(reward.cost) }">
          <div class="reward-icon">{{ reward.icon }}</div>
          <div class="reward-name">{{ reward.name }}</div>
          <div class="reward-desc">{{ reward.description }}</div>
          <div class="reward-cost">{{ reward.cost }} pts</div>
          <button
            class="action-btn buy-btn"
            :disabled="!canAfford(reward.cost)"
            @click="buyReward(ri)"
          >
            {{ canAfford(reward.cost) ? 'Buy!' : 'Need more pts' }}
          </button>
        </div>
      </div>
      <div v-if="shopMessage" class="shop-message" :class="shopMessageClass">{{ shopMessage }}</div>
      <button class="back-link" @click="screen = 'menu'">← Back to Menu</button>
    </div>

    <!-- DAILY STREAK -->
    <div v-if="screen === 'streak'" class="screen streak-screen">
      <h2 class="screen-title">Daily Streak</h2>
      <div class="streak-display">
        <div class="fire-row">
          <span v-for="n in 5" :key="n" class="fire-emoji" :class="{ active: n <= streakCount }">
            {{ n <= streakCount ? '🔥' : '⬜' }}
          </span>
        </div>
        <div class="streak-label">{{ streakCount }} day{{ streakCount === 1 ? '' : 's' }} in a row!</div>
        <div v-if="streakCount >= 5" class="streak-reward-msg">
          🎫 You earned a FREE Titanic Ticket for 5-day streak!
        </div>
      </div>
      <div class="calendar-section">
        <h3>Practice History (Last 14 Days)</h3>
        <div class="calendar-grid">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-day"
            :class="{ practiced: day.practiced, today: day.isToday }"
          >
            <div class="cal-day-name">{{ day.dayName }}</div>
            <div class="cal-day-num">{{ day.dayNum }}</div>
            <div class="cal-check">{{ day.practiced ? '✅' : '' }}</div>
          </div>
        </div>
      </div>
      <div v-if="practicedToday" class="streak-msg good">Great job! Come back tomorrow to keep your streak!</div>
      <div v-else class="streak-msg warn">Practice today to keep your streak going!</div>
      <button class="back-link" @click="screen = 'menu'">← Back to Menu</button>
    </div>

    <!-- TITANIC AFK SESSION -->
    <div v-if="screen === 'titanic'" class="screen titanic-screen">
      <h2 class="screen-title">🚢 Titanic AFK Session</h2>
      <div v-if="!afkSessionActive && titanicTickets > 0 && !afkCollectReady">
        <p class="titanic-info">Use a Titanic Ticket to start an AFK session!</p>
        <p class="titanic-info">Earn 1 Fishing Tycoon coin per second, even while away!</p>
        <div class="ticket-display">
          <span class="big-emoji">🎫</span> x{{ titanicTickets }}
        </div>
        <button class="action-btn start-afk-btn" @click="startAfkSession">Use Ticket &amp; Start Session</button>
      </div>
      <div v-if="afkSessionActive" class="afk-active-area">
        <div class="afk-badge">AFK Session Active</div>
        <div class="afk-subtitle">Earning Fishing Tycoon coins overnight!</div>
        <div class="afk-timer">{{ afkTimerDisplay }}</div>
        <div class="afk-coins">Coins earned so far: {{ afkCoinsEarned }}</div>
        <button class="action-btn collect-btn" @click="collectAfk">Collect &amp; End Session</button>
      </div>
      <div v-if="afkCollectReady" class="afk-collect-area">
        <div class="afk-badge collect">Session Complete!</div>
        <div class="afk-coins">You earned {{ afkCoinsEarned }} Fishing coins!</div>
        <button class="action-btn collect-btn" @click="collectAfk">Collect Coins!</button>
      </div>
      <div v-if="!afkSessionActive && titanicTickets === 0 && !afkCollectReady" class="no-tickets">
        <p>No Titanic Tickets! Earn them from the Rewards Shop or 5-day streaks.</p>
      </div>
      <button class="back-link" @click="screen = 'menu'">← Back to Menu</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { PlayerTracker, playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

// ---------- TYPES ----------
interface SpellingList {
  name: string
  words: string[]
}

interface SpellingData {
  lists: SpellingList[]
  points: number
  titanicTickets: number
  streakDates: string[]
  lastStreakDate: string
  afkStartTime: number | null
}

// ---------- STATE ----------
const screen = ref('menu')
const points = ref(0)
const titanicTickets = ref(0)
const lists = ref<SpellingList[]>([])
const newListName = ref('')
const newWordInputs = ref<Record<number, string>>({})
const editingListIndex = ref(-1)
const editingListName = ref('')
const streakDates = ref<string[]>([])
const lastStreakDate = ref('')

// Practice state
const practiceWords = ref<string[]>([])
const currentWordIndex = ref(0)
const practicePhase = ref<'show' | 'type' | 'result' | 'summary'>('show')
const typedWord = ref('')
const lastCorrect = ref(false)
const correctCount = ref(0)
const sessionPoints = ref(0)
const gotPerfect = ref(false)
const typeInput = ref<HTMLInputElement | null>(null)

// Shop state
const shopMessage = ref('')
const shopMessageClass = ref('')

// AFK state
const afkStartTime = ref<number | null>(null)
const afkSessionActive = ref(false)
const afkCollectReady = ref(false)
const afkCoinsEarned = ref(0)
const afkTimerDisplay = ref('00:00:00')
let afkInterval: number | null = null

// ---------- COMPUTED ----------
const streakCount = computed(() => {
  const today = getTodayStr()
  let count = 0
  const d = new Date()
  for (let i = 0; i < 5; i++) {
    const ds = formatDate(d)
    if (streakDates.value.includes(ds)) {
      count++
    } else if (i === 0) {
      // today not practiced yet is ok, check from yesterday
      // but don't count it
    } else {
      break
    }
    d.setDate(d.getDate() - 1)
  }
  return count
})

const practicedToday = computed(() => {
  return streakDates.value.includes(getTodayStr())
})

const progressPercent = computed(() => {
  if (practiceWords.value.length === 0) return 0
  return Math.round(((currentWordIndex.value) / practiceWords.value.length) * 100)
})

const isLastWord = computed(() => {
  return currentWordIndex.value >= practiceWords.value.length - 1
})

const calendarDays = computed(() => {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const ds = formatDate(d)
    days.push({
      date: ds,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      practiced: streakDates.value.includes(ds),
      isToday: i === 0
    })
  }
  return days
})

// Rewards definition
const rewards = [
  { name: '$500 Pizza Zoo Cash', description: 'Add $500 to your Pizza Zoo game!', cost: 100, icon: '🍕', type: 'pizza', amount: 500 },
  { name: '$2,000 Pizza Zoo Cash', description: 'Add $2,000 to your Pizza Zoo game!', cost: 200, icon: '🍕', type: 'pizza', amount: 2000 },
  { name: '5 Fishing Coins', description: 'Add 5 coins to Fishing Tycoon!', cost: 150, icon: '🎣', type: 'fishing', amount: 5 },
  { name: 'Rare Fishing Rod', description: 'Unlock a rare rod in Fishing Tycoon!', cost: 300, icon: '🐟', type: 'fishingRod', amount: 0 },
  { name: 'Titanic Ticket', description: 'A golden ticket for an AFK coin session!', cost: 500, icon: '🎫', type: 'titanicTicket', amount: 1 },
]

// ---------- HELPERS ----------
function getTodayStr(): string {
  return formatDate(new Date())
}

function formatDate(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function canAfford(cost: number): boolean {
  return points.value >= cost
}

function confettiStyle(n: number) {
  const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
  return {
    left: (Math.random() * 100) + '%',
    animationDelay: (Math.random() * 0.5) + 's',
    backgroundColor: colors[n % colors.length],
    animationDuration: (1 + Math.random()) + 's',
  }
}

// ---------- SAVE/LOAD ----------
const SAVE_KEY = 'spellingChampion'

function saveData() {
  const data: SpellingData = {
    lists: lists.value,
    points: points.value,
    titanicTickets: titanicTickets.value,
    streakDates: streakDates.value,
    lastStreakDate: lastStreakDate.value,
    afkStartTime: afkStartTime.value,
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

function loadData() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return
  try {
    const d: SpellingData = JSON.parse(raw)
    lists.value = d.lists || []
    points.value = d.points || 0
    titanicTickets.value = d.titanicTickets || 0
    streakDates.value = d.streakDates || []
    lastStreakDate.value = d.lastStreakDate || ''
    afkStartTime.value = d.afkStartTime || null
  } catch {}
}

// ---------- LIST MANAGEMENT ----------
function createList() {
  const name = newListName.value.trim()
  if (!name) return
  lists.value.push({ name, words: [] })
  newListName.value = ''
  saveData()
}

function deleteList(index: number) {
  lists.value.splice(index, 1)
  saveData()
}

function startEditListName(index: number) {
  editingListIndex.value = index
  editingListName.value = lists.value[index].name
}

function saveListName(index: number) {
  const name = editingListName.value.trim()
  if (name) {
    lists.value[index].name = name
    saveData()
  }
  editingListIndex.value = -1
}

function addWord(listIndex: number) {
  const word = (newWordInputs.value[listIndex] || '').trim().toLowerCase()
  if (!word) return
  if (!lists.value[listIndex].words.includes(word)) {
    lists.value[listIndex].words.push(word)
    saveData()
  }
  newWordInputs.value[listIndex] = ''
}

function removeWord(listIndex: number, wordIndex: number) {
  lists.value[listIndex].words.splice(wordIndex, 1)
  saveData()
}

// ---------- PRACTICE ----------
function goToListSelect() {
  if (lists.value.length === 0) {
    screen.value = 'lists'
    return
  }
  if (lists.value.length === 1 && lists.value[0].words.length > 0) {
    startPractice(0)
    return
  }
  screen.value = 'lists'
}

function startPractice(listIndex: number) {
  const words = [...lists.value[listIndex].words]
  if (words.length === 0) return
  // Shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]]
  }
  practiceWords.value = words
  currentWordIndex.value = 0
  correctCount.value = 0
  sessionPoints.value = 0
  gotPerfect.value = false
  practicePhase.value = 'show'
  screen.value = 'practice'
  showWordThenHide()
}

function showWordThenHide() {
  practicePhase.value = 'show'
  speakCurrentWord()
  setTimeout(() => {
    practicePhase.value = 'type'
    typedWord.value = ''
    nextTick(() => {
      typeInput.value?.focus()
    })
  }, 2000)
}

function speakCurrentWord() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(practiceWords.value[currentWordIndex.value])
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }
}

function checkAnswer() {
  const typed = typedWord.value.trim().toLowerCase()
  const correct = practiceWords.value[currentWordIndex.value].toLowerCase()
  if (typed === correct) {
    lastCorrect.value = true
    correctCount.value++
    points.value += 10
    sessionPoints.value += 10
  } else {
    lastCorrect.value = false
  }
  practicePhase.value = 'result'
  saveData()
}

function retryWord() {
  typedWord.value = ''
  practicePhase.value = 'type'
  nextTick(() => {
    typeInput.value?.focus()
  })
}

function nextWord() {
  if (isLastWord.value) {
    // End of practice
    if (correctCount.value === practiceWords.value.length) {
      gotPerfect.value = true
      points.value += 50
      sessionPoints.value += 50
    }
    // Record today as practiced
    const today = getTodayStr()
    if (!streakDates.value.includes(today)) {
      streakDates.value.push(today)
    }
    lastStreakDate.value = today
    // Check for 5-day streak reward
    checkStreakReward()
    practicePhase.value = 'summary'
    saveData()
    return
  }
  currentWordIndex.value++
  showWordThenHide()
}

function checkStreakReward() {
  if (streakCount.value >= 5) {
    titanicTickets.value++
    // Reset streak dates for counting (keep history but acknowledge reward)
    shopMessage.value = 'You earned a FREE Titanic Ticket for your 5-day streak!'
    shopMessageClass.value = 'success'
    saveData()
  }
}

// ---------- SHOP ----------
function buyReward(index: number) {
  const reward = rewards[index]
  if (points.value < reward.cost) return

  points.value -= reward.cost

  if (reward.type === 'pizza') {
    addPizzaZooCash(reward.amount)
    shopMessage.value = 'Added $' + reward.amount + ' to Pizza Zoo!'
    shopMessageClass.value = 'success'
  } else if (reward.type === 'fishing') {
    addFishingCoins(reward.amount)
    shopMessage.value = 'Added ' + reward.amount + ' coins to Fishing Tycoon!'
    shopMessageClass.value = 'success'
  } else if (reward.type === 'fishingRod') {
    unlockFishingRod()
    shopMessage.value = 'Rare Fishing Rod unlocked!'
    shopMessageClass.value = 'success'
  } else if (reward.type === 'titanicTicket') {
    titanicTickets.value++
    shopMessage.value = 'You got a Golden Titanic Ticket!'
    shopMessageClass.value = 'success'
  }

  saveData()
  setTimeout(() => { shopMessage.value = '' }, 3000)
}

function addPizzaZooCash(amount: number) {
  const raw = localStorage.getItem('pizzaZooSave')
  if (raw) {
    try {
      const d = JSON.parse(raw)
      d.cash = (d.cash || 0) + amount
      localStorage.setItem('pizzaZooSave', JSON.stringify(d))
    } catch {}
  } else {
    localStorage.setItem('pizzaZooSave', JSON.stringify({ cash: amount }))
  }
}

function addFishingCoins(amount: number) {
  const raw = localStorage.getItem('fishingGame')
  if (raw) {
    try {
      const d = JSON.parse(raw)
      d.money = (d.money || 0) + amount
      localStorage.setItem('fishingGame', JSON.stringify(d))
    } catch {}
  } else {
    localStorage.setItem('fishingGame', JSON.stringify({ money: amount }))
  }
}

function unlockFishingRod() {
  const raw = localStorage.getItem('fishingGame')
  if (raw) {
    try {
      const d = JSON.parse(raw)
      const rods = d.ownedRods || ['wooden']
      if (!rods.includes('rare-spelling')) {
        rods.push('rare-spelling')
      }
      d.ownedRods = rods
      localStorage.setItem('fishingGame', JSON.stringify(d))
    } catch {}
  }
}

// ---------- AFK SESSION ----------
function startAfkSession() {
  if (titanicTickets.value <= 0) return
  titanicTickets.value--
  afkStartTime.value = Date.now()
  afkSessionActive.value = true
  afkCollectReady.value = false
  saveData()
  startAfkTimer()
}

function startAfkTimer() {
  if (afkInterval) clearInterval(afkInterval)
  afkInterval = window.setInterval(() => {
    if (!afkStartTime.value) return
    const elapsed = Math.floor((Date.now() - afkStartTime.value) / 1000)
    afkCoinsEarned.value = elapsed
    const hours = Math.floor(elapsed / 3600)
    const mins = Math.floor((elapsed % 3600) / 60)
    const secs = elapsed % 60
    afkTimerDisplay.value = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
  }, 1000)
}

function collectAfk() {
  if (!afkStartTime.value) return
  const elapsed = Math.floor((Date.now() - afkStartTime.value) / 1000)
  afkCoinsEarned.value = elapsed
  addFishingCoins(elapsed)
  afkStartTime.value = null
  afkSessionActive.value = false
  afkCollectReady.value = false
  if (afkInterval) {
    clearInterval(afkInterval)
    afkInterval = null
  }
  shopMessage.value = 'Collected ' + elapsed + ' Fishing coins!'
  shopMessageClass.value = 'success'
  saveData()
  screen.value = 'menu'
}

function checkPendingAfk() {
  if (afkStartTime.value) {
    const elapsed = Math.floor((Date.now() - afkStartTime.value) / 1000)
    afkCoinsEarned.value = elapsed
    if (elapsed > 0) {
      afkCollectReady.value = true
      afkSessionActive.value = true
      startAfkTimer()
    }
  }
}

// ---------- LIFECYCLE ----------
onMounted(() => {
  loadData()
  checkPendingAfk()

  // Track player
  playerTracker.startSession(
    gameState.playerName || 'Player',
    gameState.getCoins(),
    1,
    0,
    0,
    'Spelling Champion'
  )
  OnlineTracker.goOnline(
    gameState.playerName || 'Player',
    gameState.getCoins(),
    1,
    0,
    0,
    'Spelling Champion'
  )
})

onUnmounted(() => {
  if (afkInterval) clearInterval(afkInterval)
  OnlineTracker.goOffline()
})
</script>

<style scoped>
.spelling-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  padding-top: 60px;
}

.back-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: 2px solid #818cf8;
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 16px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #4338ca;
  transform: scale(1.05);
}

/* MENU SCREEN */
.game-title {
  text-align: center;
  font-size: 52px;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  animation: titlePulse 2s ease-in-out infinite alternate;
}
@keyframes titlePulse {
  from { transform: scale(1); }
  to { transform: scale(1.03); }
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.stat-box {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}
.stat-box:hover { transform: scale(1.05); }
.stat-icon { font-size: 24px; }
.stat-value { font-size: 18px; font-weight: 700; }
.points-box { border-color: #fbbf24; }
.streak-box { border-color: #ef4444; }
.ticket-box { border-color: #a855f7; }

.menu-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 400px;
  margin: 0 auto;
}
.menu-btn {
  width: 100%;
  padding: 18px 24px;
  font-size: 20px;
  font-weight: 700;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}
.menu-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); }
.practice-btn { background: linear-gradient(135deg, #22c55e, #16a34a); }
.lists-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.shop-btn { background: linear-gradient(135deg, #f59e0b, #d97706); }
.streak-btn { background: linear-gradient(135deg, #ef4444, #dc2626); }
.titanic-btn { background: linear-gradient(135deg, #a855f7, #7c3aed); }

/* LISTS SCREEN */
.screen-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 24px;
  color: #fbbf24;
}

.new-list-area {
  display: flex;
  gap: 10px;
  max-width: 500px;
  margin: 0 auto 20px;
}

.text-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid #6366f1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}
.text-input:focus { border-color: #a5b4fc; }
.text-input.small { padding: 8px 12px; font-size: 14px; }
.text-input::placeholder { color: rgba(255, 255, 255, 0.4); }

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  transition: all 0.2s;
}
.action-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn.add-btn { background: linear-gradient(135deg, #22c55e, #16a34a); }
.action-btn.small-btn { padding: 8px 14px; font-size: 13px; }
.action-btn.cancel-btn { background: #6b7280; }
.action-btn.check-btn { background: linear-gradient(135deg, #22c55e, #16a34a); font-size: 18px; }
.action-btn.retry-btn { background: linear-gradient(135deg, #f59e0b, #d97706); margin-top: 10px; }
.action-btn.next-btn { background: linear-gradient(135deg, #22c55e, #16a34a); margin-top: 14px; }
.action-btn.buy-btn { font-size: 14px; padding: 8px 16px; }
.action-btn.start-afk-btn { background: linear-gradient(135deg, #a855f7, #7c3aed); font-size: 18px; padding: 14px 28px; }
.action-btn.collect-btn { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1e1b4b; font-size: 18px; padding: 14px 28px; }

.empty-msg {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  margin: 40px 0;
}

.list-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  transition: border-color 0.2s;
}
.list-card:hover { border-color: rgba(255, 255, 255, 0.3); }

.list-header { margin-bottom: 12px; }
.list-name-area { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.edit-name-area { display: flex; gap: 8px; align-items: center; }
.list-name { margin: 0; font-size: 22px; color: #a5b4fc; }
.word-count { color: rgba(255, 255, 255, 0.5); font-size: 14px; }
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: transform 0.2s;
}
.icon-btn:hover { transform: scale(1.2); }
.delete-icon:hover { filter: brightness(1.5); }

.add-word-area {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.word-tag {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: tagIn 0.3s ease;
}
@keyframes tagIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.remove-word {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.remove-word:hover { background: #ef4444; }

.practice-list-btn {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.back-link {
  display: block;
  margin: 24px auto 0;
  background: none;
  border: none;
  color: #a5b4fc;
  font-size: 16px;
  cursor: pointer;
  text-decoration: underline;
}
.back-link:hover { color: #fff; }

/* PRACTICE SCREEN */
.progress-bar-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin: 0 auto 30px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 16px;
  transition: width 0.5s ease;
}
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 14px;
}

.word-display {
  text-align: center;
  padding: 40px;
}
.big-word {
  font-size: 56px;
  font-weight: 900;
  color: #fbbf24;
  margin-bottom: 16px;
  animation: wordIn 0.5s ease;
  letter-spacing: 4px;
}
@keyframes wordIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.countdown-text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.type-area {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}
.prompt-text {
  font-size: 22px;
  margin-bottom: 16px;
  color: #a5b4fc;
}
.speak-btn {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
}
.speak-btn:hover { transform: scale(1.05); }
.type-input {
  width: 100%;
  padding: 16px;
  font-size: 28px;
  text-align: center;
  border-radius: 14px;
  border: 3px solid #6366f1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  outline: none;
  margin-bottom: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.type-input:focus { border-color: #a5b4fc; }

.result-area {
  text-align: center;
  padding: 30px;
}
.correct-msg {
  font-size: 28px;
  font-weight: 700;
  color: #22c55e;
  position: relative;
  animation: bounceIn 0.5s ease;
}
.wrong-msg {
  font-size: 22px;
  color: #f87171;
  animation: shakeIn 0.4s ease;
}
@keyframes bounceIn {
  0% { transform: scale(0.3); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes shakeIn {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
.big-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}
.correct-word-show {
  font-size: 36px;
  font-weight: 900;
  color: #ef4444;
  margin: 12px 0;
  letter-spacing: 3px;
}

/* Confetti */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
}
@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* Summary */
.summary-area {
  text-align: center;
  padding: 40px 20px;
}
.summary-title {
  font-size: 36px;
  color: #fbbf24;
  margin-bottom: 24px;
}
.summary-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.summary-stat {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 16px 30px;
}
.summary-num {
  font-size: 42px;
  font-weight: 900;
  color: #22c55e;
  display: block;
}
.summary-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}
.perfect-bonus {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  animation: bounceIn 0.5s ease;
}

/* SHOP SCREEN */
.shop-points {
  text-align: center;
  font-size: 22px;
  margin-bottom: 24px;
}
.highlight { color: #fbbf24; font-weight: 900; font-size: 28px; }

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto 20px;
}
.reward-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}
.reward-card.affordable { border-color: #22c55e; }
.reward-card:hover { transform: translateY(-4px); }
.reward-icon { font-size: 48px; margin-bottom: 8px; }
.reward-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.reward-desc { font-size: 13px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }
.reward-cost { font-size: 16px; font-weight: 700; color: #fbbf24; margin-bottom: 10px; }

.shop-message {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  padding: 12px;
  border-radius: 10px;
  max-width: 500px;
  margin: 16px auto;
  animation: bounceIn 0.4s ease;
}
.shop-message.success { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

/* STREAK SCREEN */
.streak-display {
  text-align: center;
  margin-bottom: 30px;
}
.fire-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}
.fire-emoji {
  font-size: 40px;
  transition: transform 0.3s;
}
.fire-emoji.active { animation: fireWobble 0.6s ease infinite alternate; }
@keyframes fireWobble {
  from { transform: scale(1) rotate(-5deg); }
  to { transform: scale(1.15) rotate(5deg); }
}
.streak-label { font-size: 22px; font-weight: 700; color: #fbbf24; }
.streak-reward-msg { font-size: 18px; color: #a855f7; margin-top: 8px; font-weight: 700; }

.calendar-section {
  max-width: 600px;
  margin: 0 auto 24px;
}
.calendar-section h3 { text-align: center; color: #a5b4fc; margin-bottom: 12px; }
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.calendar-day {
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  transition: all 0.2s;
}
.calendar-day.practiced { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); }
.calendar-day.today { border-color: #fbbf24; }
.cal-day-name { color: rgba(255, 255, 255, 0.4); font-size: 11px; }
.cal-day-num { font-size: 18px; font-weight: 700; }
.cal-check { font-size: 14px; }

.streak-msg {
  text-align: center;
  font-size: 16px;
  padding: 12px;
  border-radius: 10px;
  max-width: 400px;
  margin: 0 auto;
}
.streak-msg.good { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.streak-msg.warn { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

/* TITANIC SCREEN */
.titanic-info {
  text-align: center;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}
.ticket-display {
  text-align: center;
  font-size: 48px;
  margin: 20px 0;
}
.afk-active-area, .afk-collect-area {
  text-align: center;
}
.afk-badge {
  display: inline-block;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  padding: 12px 28px;
  border-radius: 30px;
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 12px;
  animation: pulse 1.5s ease infinite;
}
.afk-badge.collect { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1e1b4b; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
}
.afk-subtitle { color: rgba(255, 255, 255, 0.6); font-size: 16px; margin-bottom: 20px; }
.afk-timer {
  font-size: 52px;
  font-weight: 900;
  font-family: monospace;
  color: #22c55e;
  margin-bottom: 12px;
}
.afk-coins {
  font-size: 20px;
  color: #fbbf24;
  margin-bottom: 20px;
  font-weight: 700;
}
.no-tickets {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  margin: 40px 0;
}

/* Screen containers */
.screen {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile */
@media (max-width: 600px) {
  .game-title { font-size: 32px; }
  .big-word { font-size: 36px; }
  .type-input { font-size: 22px; }
  .menu-btn { font-size: 17px; padding: 14px 18px; }
  .stats-bar { gap: 8px; }
  .stat-box { padding: 8px 12px; }
  .shop-grid { grid-template-columns: 1fr; }
  .calendar-grid { gap: 3px; }
  .calendar-day { padding: 4px 2px; }
  .cal-day-num { font-size: 14px; }
  .afk-timer { font-size: 36px; }
}
</style>
