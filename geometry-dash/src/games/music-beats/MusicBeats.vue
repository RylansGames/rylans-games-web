<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">&#8592; Back to Portal</button>

    <!-- Title Screen -->
    <div v-if="!gameStarted" class="title-screen">
      <h1 class="title">MUSIC BEATS</h1>
      <p class="subtitle">Beat Maker / DJ Launchpad</p>
      <div class="instructions">
        <p>Tap the pads or use your keyboard to make beats!</p>
        <p>1 2 3 4 = Drums</p>
        <p>Q W E R = Synths</p>
        <p>A S D F = Bass</p>
        <p>Z X C V = Effects</p>
        <p>Record a loop and let it play!</p>
      </div>
      <button class="start-btn" @click="startGame">DROP THE BEAT</button>
    </div>

    <!-- Main Game -->
    <div v-if="gameStarted" class="dj-booth">
      <!-- Controls Bar -->
      <div class="controls-bar">
        <div class="bpm-control">
          <label>BPM: {{ bpm }}</label>
          <input type="range" min="60" max="200" v-model.number="bpm" class="bpm-slider" />
        </div>
        <div class="transport-buttons">
          <button class="transport-btn play-btn" :class="{ active: isPlaying }" @click="togglePlay">
            {{ isPlaying ? '&#9632; STOP' : '&#9654; PLAY' }}
          </button>
          <button class="transport-btn record-btn" :class="{ active: isRecording }" @click="toggleRecord">
            &#9679; REC
          </button>
          <button class="transport-btn clear-btn" @click="clearSequence">CLEAR</button>
        </div>
        <div class="coins-display">+{{ coinsEarned }} coins</div>
      </div>

      <!-- Category Labels + Launchpad Grid -->
      <div class="launchpad-area">
        <div class="category-labels">
          <div class="cat-label drums-label">DRUMS</div>
          <div class="cat-label synths-label">SYNTHS</div>
          <div class="cat-label bass-label">BASS</div>
          <div class="cat-label fx-label">FX</div>
        </div>
        <div class="launchpad-grid">
          <button
            v-for="pad in pads"
            :key="pad.id"
            class="pad"
            :class="{ active: activePads.has(pad.id), sequenced: isPadInCurrentStep(pad.id) }"
            :style="{ '--pad-color': pad.color, '--pad-bg': pad.color + '66' }"
            @mousedown="hitPad(pad.id)"
            @touchstart.prevent="hitPad(pad.id)"
          >
            <span class="pad-name">{{ pad.name }}</span>
            <span class="pad-key">{{ pad.key }}</span>
          </button>
        </div>
      </div>

      <!-- Step Sequencer -->
      <div class="sequencer-area">
        <div class="sequencer-label">SEQUENCER</div>
        <div class="sequencer-row">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="seq-step"
            :class="{
              'is-current': isPlaying && currentStep === step - 1,
              'has-notes': sequence[step - 1].size > 0,
            }"
            @click="toggleStepEdit(step - 1)"
          >
            <div
              v-for="padId in Array.from(sequence[step - 1])"
              :key="padId"
              class="step-dot"
              :style="{ background: pads[padId].color }"
            ></div>
          </div>
        </div>
        <div class="step-numbers">
          <span v-for="step in totalSteps" :key="step">{{ step }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

const router = useRouter()
const goBack = () => { router.push('/') }

// ─── Game State ───
const gameStarted = ref(false)
const bpm = ref(120)
const isPlaying = ref(false)
const isRecording = ref(false)
const currentStep = ref(0)
const totalSteps = 16
const coinsEarned = ref(0)
const activePads = reactive(new Set<number>())
const sequence = reactive<Set<number>[]>(
  Array.from({ length: totalSteps }, () => new Set<number>())
)

let audioCtx: AudioContext | null = null
let sequencerInterval: ReturnType<typeof setInterval> | null = null
let coinTimer: ReturnType<typeof setInterval> | null = null
const keysDown = new Set<string>()

// ─── Pad Definitions ───
interface PadDef {
  id: number
  name: string
  category: string
  color: string
  key: string
  play: (ctx: AudioContext) => void
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const size = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

// Sound synthesis functions
function playKick(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

function playSnare(ctx: AudioContext) {
  // Noise part
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 0.2)
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0.8, ctx.currentTime)
  nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 3000
  noise.connect(filter).connect(nGain).connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + 0.2)
  // Tone part
  const osc = ctx.createOscillator()
  const oGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 200
  oGain.gain.setValueAtTime(0.7, ctx.currentTime)
  oGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  osc.connect(oGain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}

function playHiHat(ctx: AudioContext) {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.5, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 7000
  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + 0.08)
}

function playClap(ctx: AudioContext) {
  for (let i = 0; i < 3; i++) {
    const noise = ctx.createBufferSource()
    noise.buffer = createNoiseBuffer(ctx, 0.15)
    const gain = ctx.createGain()
    const t = ctx.currentTime + i * 0.01
    gain.gain.setValueAtTime(0.6, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    noise.connect(filter).connect(gain).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + 0.15)
  }
}

function playSynth(ctx: AudioContext, freq: number) {
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'square'
  osc1.frequency.value = freq
  osc2.type = 'square'
  osc2.frequency.value = freq * 1.005
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start()
  osc2.start()
  osc1.stop(ctx.currentTime + 0.35)
  osc2.stop(ctx.currentTime + 0.35)
}

function playLowBoom(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = 55
  gain.gain.setValueAtTime(0.8, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}

function playBassDrop(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4)
  gain.gain.setValueAtTime(0.8, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}

function playSubBass(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 40
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.05)
  gain.gain.setValueAtTime(0.7, ctx.currentTime + 0.2)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}

function playBassPluck(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  osc.type = 'sawtooth'
  osc.frequency.value = 110
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2000, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.6, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
  osc.connect(filter).connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.25)
}

function playLaser(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1500, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

function playScratch(ctx: AudioContext) {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 0.2)
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(500, ctx.currentTime)
  filter.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.1)
  filter.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.6, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + 0.2)
}

function playRise(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.5)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}

function playNoiseBurst(ctx: AudioContext) {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 0.08)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.7, ctx.currentTime)
  gain.gain.setValueAtTime(0.7, ctx.currentTime + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  noise.connect(gain).connect(ctx.destination)
  noise.start()
  noise.stop(ctx.currentTime + 0.08)
}

const pads: PadDef[] = [
  // Row 1: Drums
  { id: 0, name: 'KICK', category: 'drums', color: '#ff3366', key: '1', play: playKick },
  { id: 1, name: 'SNARE', category: 'drums', color: '#ff6633', key: '2', play: playSnare },
  { id: 2, name: 'HI-HAT', category: 'drums', color: '#ff9933', key: '3', play: playHiHat },
  { id: 3, name: 'CLAP', category: 'drums', color: '#ffcc33', key: '4', play: playClap },
  // Row 2: Synths
  { id: 4, name: 'C', category: 'synths', color: '#9933ff', key: 'Q', play: (ctx) => playSynth(ctx, 261.63) },
  { id: 5, name: 'E', category: 'synths', color: '#6633ff', key: 'W', play: (ctx) => playSynth(ctx, 329.63) },
  { id: 6, name: 'G', category: 'synths', color: '#3366ff', key: 'E', play: (ctx) => playSynth(ctx, 392.0) },
  { id: 7, name: 'HIGH C', category: 'synths', color: '#33ccff', key: 'R', play: (ctx) => playSynth(ctx, 523.25) },
  // Row 3: Bass
  { id: 8, name: 'BOOM', category: 'bass', color: '#33ff66', key: 'A', play: playLowBoom },
  { id: 9, name: 'DROP', category: 'bass', color: '#33ff99', key: 'S', play: playBassDrop },
  { id: 10, name: 'SUB', category: 'bass', color: '#33ffcc', key: 'D', play: playSubBass },
  { id: 11, name: 'PLUCK', category: 'bass', color: '#66ff33', key: 'F', play: playBassPluck },
  // Row 4: Effects
  { id: 12, name: 'LASER', category: 'effects', color: '#ff33ff', key: 'Z', play: playLaser },
  { id: 13, name: 'SCRATCH', category: 'effects', color: '#ff33cc', key: 'X', play: playScratch },
  { id: 14, name: 'RISE', category: 'effects', color: '#ffff33', key: 'C', play: playRise },
  { id: 15, name: 'BURST', category: 'effects', color: '#ff6699', key: 'V', play: playNoiseBurst },
]

const keyToPad: Record<string, number> = {}
for (const pad of pads) {
  keyToPad[pad.key.toLowerCase()] = pad.id
}

// ─── Pad Interaction ───
function hitPad(id: number) {
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  pads[id].play(audioCtx)

  activePads.add(id)
  setTimeout(() => activePads.delete(id), 150)

  if (isRecording.value && isPlaying.value) {
    sequence[currentStep.value].add(id)
  }
}

function isPadInCurrentStep(id: number): boolean {
  if (!isPlaying.value) return false
  return sequence[currentStep.value].has(id)
}

// ─── Sequencer ───
function startSequencer() {
  isPlaying.value = true
  currentStep.value = 0
  // Slow down to half speed when recording so it's easier to tap in beats
  const speedMultiplier = isRecording.value ? 2 : 1
  const stepMs = ((60 / bpm.value) / 4) * 1000 * speedMultiplier

  sequencerInterval = setInterval(() => {
    const padsInStep = sequence[currentStep.value]
    padsInStep.forEach((padId) => {
      if (audioCtx) {
        pads[padId].play(audioCtx)
        activePads.add(padId)
        setTimeout(() => activePads.delete(padId), 100)
      }
    })
    currentStep.value = (currentStep.value + 1) % totalSteps
  }, stepMs)
}

function stopSequencer() {
  isPlaying.value = false
  isRecording.value = false
  if (sequencerInterval) {
    clearInterval(sequencerInterval)
    sequencerInterval = null
  }
}

function togglePlay() {
  if (isPlaying.value) {
    stopSequencer()
  } else {
    startSequencer()
  }
}

function toggleRecord() {
  if (!isPlaying.value) {
    isRecording.value = true
    startSequencer()
  } else {
    isRecording.value = !isRecording.value
  }
}

function clearSequence() {
  stopSequencer()
  for (const step of sequence) {
    step.clear()
  }
}

function toggleStepEdit(stepIndex: number) {
  // Clicking a step in the sequencer while not playing does nothing for now
}

watch(bpm, () => {
  if (isPlaying.value) {
    stopSequencer()
    startSequencer()
  }
})

// ─── Keyboard Input ───
function handleKeyDown(e: KeyboardEvent) {
  if (!gameStarted.value) return
  const key = e.key.toLowerCase()
  if (keysDown.has(key)) return
  keysDown.add(key)

  if (key in keyToPad) {
    hitPad(keyToPad[key])
  }
  if (key === ' ') {
    e.preventDefault()
    togglePlay()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  keysDown.delete(e.key.toLowerCase())
}

// ─── Coin System ───
let playSeconds = 0

function startCoinTimer() {
  coinTimer = setInterval(() => {
    playSeconds++
    if (playSeconds % 30 === 0) {
      coinsEarned.value += 5
      gameState.addCoins(5)
    }
  }, 1000)
}

// ─── Game Start ───
function startGame() {
  audioCtx = new AudioContext()
  gameStarted.value = true
  startCoinTimer()
}

// ─── Lifecycle ───
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Music Beats')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Music Beats')

  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  playerTracker.endSession()
  OnlineTracker.goOffline()
  stopSequencer()
  if (coinTimer) clearInterval(coinTimer)
  if (audioCtx) audioCtx.close()
})
</script>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a1a;
  position: relative;
  font-family: 'Segoe UI', sans-serif;
}

.back-button {
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.8);
  color: #cc88ff;
  border: 1px solid #6633aa;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  font-size: 13px;
  z-index: 200;
}

.back-button:hover {
  background: rgba(60, 0, 80, 0.4);
}

/* ─── Title Screen ─── */
.title-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 150;
  color: white;
}

.title {
  font-size: 64px;
  font-weight: 900;
  background: linear-gradient(135deg, #ff3366, #9933ff, #33ccff, #33ff66);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 18px;
  opacity: 0.5;
  margin-bottom: 30px;
  color: #aaa;
}

.instructions {
  text-align: center;
  opacity: 0.6;
  font-size: 14px;
  line-height: 2;
  margin-bottom: 40px;
  font-family: monospace;
  color: #ccc;
}

.start-btn {
  background: linear-gradient(135deg, #9933ff, #ff3366);
  color: white;
  border: none;
  padding: 16px 40px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 30px rgba(153, 51, 255, 0.4);
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 50px rgba(153, 51, 255, 0.6);
}

/* ─── DJ Booth ─── */
.dj-booth {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
}

/* ─── Controls Bar ─── */
.controls-bar {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.bpm-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #aaa;
  font-size: 14px;
  font-weight: bold;
}

.bpm-control label {
  margin-bottom: 4px;
  font-family: monospace;
}

.bpm-slider {
  width: 120px;
  accent-color: #9933ff;
}

.transport-buttons {
  display: flex;
  gap: 8px;
}

.transport-btn {
  padding: 10px 20px;
  border: 2px solid #444;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.transport-btn:hover {
  border-color: #888;
  background: rgba(255, 255, 255, 0.1);
}

.play-btn.active {
  border-color: #33ff66;
  color: #33ff66;
  box-shadow: 0 0 15px rgba(51, 255, 102, 0.3);
}

.record-btn.active {
  border-color: #ff3333;
  color: #ff3333;
  box-shadow: 0 0 15px rgba(255, 51, 51, 0.3);
  animation: recordBlink 0.8s ease-in-out infinite;
}

@keyframes recordBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.clear-btn:hover {
  border-color: #ff6633;
  color: #ff6633;
}

.coins-display {
  color: #ffd700;
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* ─── Launchpad ─── */
.launchpad-area {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.category-labels {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-around;
}

.cat-label {
  writing-mode: horizontal-tb;
  font-size: 11px;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  padding: 0 6px;
}

.drums-label { color: #ff3366; }
.synths-label { color: #9933ff; }
.bass-label { color: #33ff66; }
.fx-label { color: #ff33ff; }

.launchpad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
}

.pad {
  width: 100px;
  height: 100px;
  border-radius: 14px;
  border: 2px solid var(--pad-color);
  background: var(--pad-bg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.08s ease;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
}

.pad:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px var(--pad-color);
}

.pad.active {
  transform: scale(1.12);
  background: var(--pad-color);
  box-shadow: 0 0 40px var(--pad-color), 0 0 80px var(--pad-color);
}

.pad.sequenced {
  box-shadow: 0 0 15px var(--pad-color), inset 0 0 15px rgba(255, 255, 255, 0.1);
}

.pad-name {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.pad-key {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  font-family: monospace;
  margin-top: 4px;
}

.pad.active .pad-name,
.pad.active .pad-key {
  color: #0a0a1a;
}

/* ─── Sequencer ─── */
.sequencer-area {
  margin-top: 30px;
  text-align: center;
}

.sequencer-label {
  color: #555;
  font-size: 12px;
  font-family: monospace;
  font-weight: bold;
  letter-spacing: 3px;
  margin-bottom: 8px;
}

.sequencer-row {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 4px;
  max-width: 500px;
  margin: 0 auto;
}

.seq-step {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 2px;
  transition: all 0.1s;
}

.seq-step:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.seq-step.is-current {
  border-color: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.seq-step.has-notes {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}

.step-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.step-numbers {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 4px;
  max-width: 500px;
  margin: 4px auto 0;
}

.step-numbers span {
  font-size: 9px;
  color: #333;
  font-family: monospace;
  text-align: center;
  width: 28px;
}

@media (max-width: 600px) {
  .pad {
    width: 70px;
    height: 70px;
  }

  .pad-name {
    font-size: 11px;
  }

  .title {
    font-size: 40px;
  }

  .launchpad-grid {
    gap: 8px;
  }

  .seq-step {
    width: 18px;
    height: 18px;
  }

  .step-numbers span {
    width: 18px;
    font-size: 7px;
  }

  .sequencer-row {
    max-width: 340px;
  }

  .step-numbers {
    max-width: 340px;
  }
}
</style>
