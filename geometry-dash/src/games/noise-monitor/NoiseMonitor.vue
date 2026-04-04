<template>
  <div class="noise-monitor" :class="{ 'flash-red': isFlashingRed }">
    <!-- Back button -->
    <router-link to="/" class="back-btn">← Back</router-link>

    <!-- Fullscreen button -->
    <button class="fullscreen-btn" @click="toggleFullscreen">
      {{ isFullscreen ? '⬜ Exit Fullscreen' : '⛶ Fullscreen' }}
    </button>

    <!-- Settings button -->
    <button class="settings-btn" @click="showSettings = !showSettings" title="Settings">⚙️</button>

    <!-- Settings panel -->
    <div v-if="showSettings" class="settings-overlay" @click.self="showSettings = false">
      <div class="settings-panel">
        <h2>Settings</h2>

        <div class="setting-group">
          <label>Sensitivity</label>
          <div class="sensitivity-btns">
            <button
              v-for="s in ['low', 'medium', 'high']"
              :key="s"
              :class="{ active: sensitivity === s }"
              @click="sensitivity = s as any"
            >{{ s }}</button>
          </div>
        </div>

        <div class="setting-group">
          <label>Green → Yellow threshold</label>
          <input type="range" min="10" max="50" v-model.number="thresholdYellow" />
          <span>{{ thresholdYellow }}</span>
        </div>

        <div class="setting-group">
          <label>Yellow → Orange threshold</label>
          <input type="range" min="30" max="70" v-model.number="thresholdOrange" />
          <span>{{ thresholdOrange }}</span>
        </div>

        <div class="setting-group">
          <label>Orange → Red threshold</label>
          <input type="range" min="50" max="90" v-model.number="thresholdRed" />
          <span>{{ thresholdRed }}</span>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="enableFlash" />
            Screen flash on RED
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="enableWarningSound" />
            Warning sound on RED
          </label>
        </div>

        <button class="close-settings" @click="showSettings = false">Close</button>
      </div>
    </div>

    <!-- Confetti -->
    <div v-if="showConfetti" class="confetti-container">
      <div v-for="i in 60" :key="i" class="confetti-piece" :style="confettiStyle(i)"></div>
    </div>

    <!-- Main content -->
    <h1 class="title">Classroom Noise Monitor</h1>

    <div class="main-area">
      <!-- Circular gauge -->
      <div class="gauge-section">
        <div class="gauge-outer" :style="{ borderColor: zoneColor }">
          <div class="gauge-inner" :style="{ background: gaugeGradient }">
            <div class="gauge-emoji" :class="{ shaking: isVeryLoud }">{{ currentEmoji }}</div>
            <div class="gauge-level" :style="{ color: zoneColor }">{{ Math.round(noiseLevel) }}</div>
            <div class="gauge-label">{{ zoneMessage }}</div>
          </div>
        </div>

        <!-- Volume bar -->
        <div class="volume-bar-container">
          <div class="volume-bar-bg">
            <div class="volume-bar-fill" :style="{ width: noiseLevel + '%', background: volumeBarGradient }"></div>
          </div>
          <div class="volume-bar-labels">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-section">
        <div class="stat-card green-card">
          <div class="stat-icon">🤫</div>
          <div class="stat-value">{{ formatTime(quietStreak) }}</div>
          <div class="stat-label">Quiet Streak</div>
        </div>
        <div class="stat-card gold-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ formatTime(bestStreak) }}</div>
          <div class="stat-label">Best Streak</div>
        </div>
        <div class="stat-card red-card">
          <div class="stat-icon">🚨</div>
          <div class="stat-value">{{ tooLoudCount }}</div>
          <div class="stat-label">Too Loud Count</div>
        </div>
      </div>
    </div>

    <!-- Start / Stop buttons -->
    <div class="controls">
      <button v-if="!isListening" class="start-btn" @click="startListening">
        🎤 Start Listening
      </button>
      <button v-if="isListening" class="stop-btn" @click="stopListening">
        ⏹ Stop
      </button>
      <button v-if="!isListening && hasHistory" class="reset-btn" @click="resetAll">
        🗑 Reset
      </button>
    </div>

    <!-- History graph -->
    <div v-if="hasHistory" class="history-section">
      <h2 class="history-title">Noise History (Last 60s)</h2>
      <canvas ref="historyCanvas" class="history-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

// --- State ---
const isListening = ref(false)
const noiseLevel = ref(0)
const showSettings = ref(false)
const isFullscreen = ref(false)
const showConfetti = ref(false)

// Thresholds
const thresholdYellow = ref(25)
const thresholdOrange = ref(50)
const thresholdRed = ref(75)
const sensitivity = ref<'low' | 'medium' | 'high'>('medium')
const enableFlash = ref(true)
const enableWarningSound = ref(true)

// Stats
const quietStreak = ref(0)
const bestStreak = ref(0)
const tooLoudCount = ref(0)

// History
const historyData = ref<number[]>([])
const historyCanvas = ref<HTMLCanvasElement | null>(null)

// Audio
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let mediaStream: MediaStream | null = null
let animationId: number | null = null
let warningOscillator: OscillatorNode | null = null
let warningGain: GainNode | null = null

// Timers
let quietTimer: number | null = null
let historyInterval: number | null = null
let flashTimer: number | null = null

const isFlashingRed = ref(false)

// Load best streak from localStorage
onMounted(() => {
  const saved = localStorage.getItem('noiseMonitor_bestStreak')
  if (saved) bestStreak.value = parseInt(saved)
})

// --- Computed ---
const sensitivityMultiplier = computed(() => {
  if (sensitivity.value === 'low') return 0.6
  if (sensitivity.value === 'high') return 1.6
  return 1.0
})

const isQuiet = computed(() => noiseLevel.value < thresholdYellow.value)
const isMedium = computed(() => noiseLevel.value >= thresholdYellow.value && noiseLevel.value < thresholdOrange.value)
const isLoud = computed(() => noiseLevel.value >= thresholdOrange.value && noiseLevel.value < thresholdRed.value)
const isVeryLoud = computed(() => noiseLevel.value >= thresholdRed.value)

const hasHistory = computed(() => historyData.value.length > 0)

const zoneColor = computed(() => {
  if (isVeryLoud.value) return '#ef4444'
  if (isLoud.value) return '#f97316'
  if (isMedium.value) return '#eab308'
  return '#22c55e'
})

const zoneMessage = computed(() => {
  if (isVeryLoud.value) return 'WAY TOO LOUD!!!'
  if (isLoud.value) return 'Too loud! Quiet down!'
  if (isMedium.value) return 'Getting a little loud...'
  return 'Perfect! Nice and quiet'
})

const currentEmoji = computed(() => {
  if (isVeryLoud.value) return '\u{1F92F}'
  if (isLoud.value) return '\u{1F61F}'
  if (isMedium.value) return '\u{1F610}'
  return '\u{1F60A}'
})

const gaugeGradient = computed(() => {
  const pct = Math.min(noiseLevel.value, 100)
  return `conic-gradient(${zoneColor.value} ${pct * 3.6}deg, #2d3748 ${pct * 3.6}deg)`
})

const volumeBarGradient = computed(() => {
  return `linear-gradient(90deg, #22c55e 0%, #eab308 40%, #f97316 70%, #ef4444 100%)`
})

// --- Functions ---
function confettiStyle(i: number) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4']
  return {
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (2 + Math.random() * 3) + 's',
    backgroundColor: colors[i % colors.length],
    width: (6 + Math.random() * 8) + 'px',
    height: (6 + Math.random() * 8) + 'px',
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

async function startListening() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.3

    microphone = audioContext.createMediaStreamSource(mediaStream)
    microphone.connect(analyser)

    isListening.value = true
    quietStreak.value = 0
    tooLoudCount.value = 0
    historyData.value = []

    // Start quiet streak timer
    quietTimer = window.setInterval(() => {
      if (isQuiet.value) {
        quietStreak.value++
        if (quietStreak.value > bestStreak.value) {
          bestStreak.value = quietStreak.value
          localStorage.setItem('noiseMonitor_bestStreak', String(bestStreak.value))
        }
        // Confetti at 5 minutes
        if (quietStreak.value === 300) {
          triggerConfetti()
        }
      } else {
        quietStreak.value = 0
      }
    }, 1000)

    // Start history recording (one sample per second)
    historyInterval = window.setInterval(() => {
      historyData.value.push(noiseLevel.value)
      if (historyData.value.length > 60) {
        historyData.value.shift()
      }
      drawHistory()
    }, 1000)

    // Start analysis loop
    updateLevel()
  } catch (err) {
    console.error('Microphone access denied:', err)
    alert('Could not access microphone. Please allow microphone access and try again.')
  }
}

function stopListening() {
  isListening.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (quietTimer) {
    clearInterval(quietTimer)
    quietTimer = null
  }
  if (historyInterval) {
    clearInterval(historyInterval)
    historyInterval = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  stopWarningSound()
  isFlashingRed.value = false
  noiseLevel.value = 0
}

function resetAll() {
  historyData.value = []
  quietStreak.value = 0
  tooLoudCount.value = 0
}

let lastRedState = false
let lastUpdateTime = 0

function updateLevel() {
  if (!analyser || !isListening.value) return

  const now = performance.now()
  // Throttle to ~15 fps
  if (now - lastUpdateTime < 66) {
    animationId = requestAnimationFrame(updateLevel)
    return
  }
  lastUpdateTime = now

  const dataArray = new Uint8Array(analyser.fftSize)
  analyser.getByteTimeDomainData(dataArray)

  // Calculate RMS
  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    const val = (dataArray[i] - 128) / 128
    sum += val * val
  }
  const rms = Math.sqrt(sum / dataArray.length)

  // Map to 0-100 with sensitivity
  const raw = rms * 300 * sensitivityMultiplier.value
  noiseLevel.value = Math.min(100, Math.max(0, raw))

  // Track "too loud" transitions
  const currentlyRed = isVeryLoud.value
  if (currentlyRed && !lastRedState) {
    tooLoudCount.value++
    if (enableFlash.value) {
      triggerFlash()
    }
    if (enableWarningSound.value) {
      playWarningSound()
    }
  }
  if (!currentlyRed && lastRedState) {
    stopWarningSound()
    isFlashingRed.value = false
  }
  lastRedState = currentlyRed

  animationId = requestAnimationFrame(updateLevel)
}

function triggerFlash() {
  isFlashingRed.value = true
}

function playWarningSound() {
  if (warningOscillator || !audioContext) return
  try {
    warningOscillator = audioContext.createOscillator()
    warningGain = audioContext.createGain()
    warningOscillator.type = 'square'
    warningOscillator.frequency.value = 440
    warningGain.gain.value = 0.15
    warningOscillator.connect(warningGain)
    warningGain.connect(audioContext.destination)
    warningOscillator.start()
  } catch (e) {
    // Ignore audio errors
  }
}

function stopWarningSound() {
  if (warningOscillator) {
    try { warningOscillator.stop() } catch (e) { /* ignore */ }
    warningOscillator = null
  }
  warningGain = null
}

function triggerConfetti() {
  showConfetti.value = true
  setTimeout(() => { showConfetti.value = false }, 5000)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function drawHistory() {
  nextTick(() => {
    const canvas = historyCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const data = historyData.value

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, w, h)

    // Threshold lines
    const drawThresholdLine = (val: number, color: string) => {
      const y = h - (val / 100) * h
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    drawThresholdLine(thresholdYellow.value, '#eab30855')
    drawThresholdLine(thresholdOrange.value, '#f9731655')
    drawThresholdLine(thresholdRed.value, '#ef444455')

    // Zone backgrounds
    ctx.fillStyle = '#22c55e11'
    ctx.fillRect(0, h - (thresholdYellow.value / 100) * h, w, (thresholdYellow.value / 100) * h)
    ctx.fillStyle = '#eab30811'
    const yY = h - (thresholdOrange.value / 100) * h
    ctx.fillRect(0, yY, w, ((thresholdOrange.value - thresholdYellow.value) / 100) * h)
    ctx.fillStyle = '#f9731611'
    const yO = h - (thresholdRed.value / 100) * h
    ctx.fillRect(0, yO, w, ((thresholdRed.value - thresholdOrange.value) / 100) * h)
    ctx.fillStyle = '#ef444411'
    ctx.fillRect(0, 0, w, h - (thresholdRed.value / 100) * h)

    if (data.length < 2) return

    // Draw line
    ctx.beginPath()
    const stepX = w / 59
    for (let i = 0; i < data.length; i++) {
      const x = (60 - data.length + i) * stepX
      const y = h - (data[i] / 100) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Fill under
    const lastX = (60 - data.length + data.length - 1) * stepX
    ctx.lineTo(lastX, h)
    ctx.lineTo((60 - data.length) * stepX, h)
    ctx.closePath()
    ctx.fillStyle = '#60a5fa22'
    ctx.fill()
  })
}

// Fullscreen change listener
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  stopListening()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.noise-monitor {
  min-height: 100vh;
  background: #0f172a;
  color: #fff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: background 0.3s;
}

.noise-monitor.flash-red {
  animation: flashBg 0.5s ease-in-out infinite alternate;
}

@keyframes flashBg {
  from { background: #0f172a; }
  to { background: #450a0a; }
}

/* Navigation */
.back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 18px;
  padding: 8px 16px;
  background: #1e293b;
  border-radius: 10px;
  z-index: 100;
  transition: background 0.2s;
}
.back-btn:hover { background: #334155; color: #fff; }

.fullscreen-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  color: #94a3b8;
  font-size: 16px;
  padding: 8px 16px;
  background: #1e293b;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  z-index: 100;
  transition: background 0.2s;
}
.fullscreen-btn:hover { background: #334155; color: #fff; }

.settings-btn {
  position: fixed;
  top: 16px;
  right: 180px;
  font-size: 24px;
  padding: 6px 12px;
  background: #1e293b;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  z-index: 100;
  transition: background 0.2s;
}
.settings-btn:hover { background: #334155; }

/* Title */
.title {
  text-align: center;
  font-size: clamp(28px, 5vw, 56px);
  margin: 60px 0 30px;
  background: linear-gradient(135deg, #60a5fa, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
}

/* Main area */
.main-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  max-width: 800px;
  margin: 0 auto;
}

/* Gauge */
.gauge-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.gauge-outer {
  width: clamp(220px, 40vw, 340px);
  height: clamp(220px, 40vw, 340px);
  border-radius: 50%;
  border: 8px solid #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.gauge-inner {
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.gauge-inner::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: #0f172a;
}

.gauge-emoji {
  font-size: clamp(48px, 8vw, 80px);
  position: relative;
  z-index: 1;
  transition: transform 0.1s;
}

.gauge-emoji.shaking {
  animation: shake 0.1s linear infinite;
}

@keyframes shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-4px, 2px) rotate(-5deg); }
  50% { transform: translate(4px, -2px) rotate(5deg); }
  75% { transform: translate(-2px, 4px) rotate(-3deg); }
}

.gauge-level {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 900;
  position: relative;
  z-index: 1;
  transition: color 0.3s;
}

.gauge-label {
  font-size: clamp(14px, 2vw, 20px);
  text-align: center;
  position: relative;
  z-index: 1;
  color: #94a3b8;
  padding: 0 20px;
  font-weight: 600;
}

/* Volume bar */
.volume-bar-container {
  width: 100%;
  max-width: 600px;
}

.volume-bar-bg {
  width: 100%;
  height: 32px;
  background: #1e293b;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #334155;
}

.volume-bar-fill {
  height: 100%;
  border-radius: 16px;
  transition: width 0.07s linear;
}

.volume-bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

/* Stats */
.stats-section {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.stat-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 20px 28px;
  text-align: center;
  min-width: 150px;
  flex: 1;
  max-width: 220px;
  border: 2px solid #334155;
}

.green-card { border-color: #22c55e44; }
.gold-card { border-color: #eab30844; }
.red-card { border-color: #ef444444; }

.stat-icon { font-size: 32px; margin-bottom: 6px; }
.stat-value { font-size: clamp(24px, 3vw, 36px); font-weight: 900; }
.stat-label { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 600; }

.green-card .stat-value { color: #22c55e; }
.gold-card .stat-value { color: #eab308; }
.red-card .stat-value { color: #ef4444; }

/* Controls */
.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 30px 0;
}

.start-btn, .stop-btn, .reset-btn {
  padding: 16px 40px;
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 800;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.start-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
}
.start-btn:hover { transform: scale(1.05); box-shadow: 0 6px 30px rgba(34, 197, 94, 0.6); }

.stop-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
}
.stop-btn:hover { transform: scale(1.05); box-shadow: 0 6px 30px rgba(239, 68, 68, 0.6); }

.reset-btn {
  background: #334155;
  color: #94a3b8;
}
.reset-btn:hover { transform: scale(1.05); background: #475569; }

/* History */
.history-section {
  max-width: 800px;
  margin: 0 auto 40px;
}

.history-title {
  text-align: center;
  font-size: 20px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.history-canvas {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  border: 2px solid #334155;
}

/* Settings overlay */
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-panel {
  background: #1e293b;
  border-radius: 20px;
  padding: 30px;
  max-width: 420px;
  width: 90%;
  border: 2px solid #334155;
}

.settings-panel h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

.setting-group {
  margin-bottom: 18px;
}

.setting-group label {
  display: block;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 600;
}

.setting-group input[type="range"] {
  width: 80%;
  vertical-align: middle;
}

.setting-group span {
  margin-left: 10px;
  font-weight: 700;
  color: #60a5fa;
}

.setting-group input[type="checkbox"] {
  margin-right: 8px;
  transform: scale(1.2);
  vertical-align: middle;
}

.sensitivity-btns {
  display: flex;
  gap: 8px;
}

.sensitivity-btns button {
  flex: 1;
  padding: 8px;
  border: 2px solid #334155;
  background: #0f172a;
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  text-transform: capitalize;
  transition: all 0.2s;
}

.sensitivity-btns button.active {
  border-color: #60a5fa;
  color: #60a5fa;
  background: #1e3a5f;
}

.close-settings {
  display: block;
  margin: 20px auto 0;
  padding: 10px 30px;
  background: #334155;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}
.close-settings:hover { background: #475569; }

/* Confetti */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 300;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 3px;
  animation: confettiFall linear forwards;
}

@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* Mobile */
@media (max-width: 600px) {
  .noise-monitor { padding: 12px; }
  .settings-btn { right: 140px; font-size: 20px; }
  .fullscreen-btn { font-size: 14px; padding: 6px 10px; }
  .stats-section { gap: 10px; }
  .stat-card { padding: 14px 16px; min-width: 100px; }
  .controls { flex-wrap: wrap; }
  .start-btn, .stop-btn, .reset-btn { padding: 14px 28px; }
}
</style>
