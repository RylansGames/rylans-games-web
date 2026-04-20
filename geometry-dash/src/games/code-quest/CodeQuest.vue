<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { units, type LessonQuestion } from './units'

const router = useRouter()

const SAVE_KEY = 'code-quest-save-v1'
const MAX_HEARTS = 5
const HEART_REFILL_MS = 5 * 60 * 1000

type Screen = 'path' | 'lesson' | 'done' | 'sandbox'

const screen = ref<Screen>('path')
const activeUnitIdx = ref(0)
const activeLessonIdx = ref(0)
const qIdx = ref(0)

const hearts = ref(MAX_HEARTS)
const lastHeartLoss = ref(0)
const xp = ref(0)
const streak = ref(0)
const lastStreakDay = ref('')
const completed = ref<Record<string, true>>({})
const lessonXp = ref(0)
const lessonMistakes = ref(0)

const mcChoice = ref<number | null>(null)
const fillAnswer = ref('')
const predictChoice = ref<number | null>(null)
const orderChosen = ref<string[]>([])
const orderAvailable = ref<string[]>([])
const feedback = ref<'' | 'right' | 'wrong'>('')
const showExplain = ref('')

const voiceOn = ref(true)
const voiceRate = ref(1)
const voicePitch = ref(1)
const voiceName = ref('')
const voices = ref<SpeechSynthesisVoice[]>([])
const showVoiceMenu = ref(false)

const sandboxCode = ref(`// Try me! Write JavaScript here.
let greeting = "Hi " + "Rylan!"
console.log(greeting)

for (let i = 1; i <= 3; i++) {
  console.log("Count: " + i)
}
`)
const sandboxOutput = ref<string[]>([])
const showSandbox = ref(false)
const publishedName = ref('')
const publishedToast = ref('')

const activeUnit = computed(() => units[activeUnitIdx.value])
const activeLesson = computed(() => activeUnit.value?.lessons[activeLessonIdx.value])
const activeQuestion = computed<LessonQuestion | undefined>(() => activeLesson.value?.questions[qIdx.value])
const progressPct = computed(() => {
  const l = activeLesson.value
  if (!l) return 0
  return Math.round((qIdx.value / l.questions.length) * 100)
})

function save() {
  const data = {
    hearts: hearts.value,
    lastHeartLoss: lastHeartLoss.value,
    xp: xp.value,
    streak: streak.value,
    lastStreakDay: lastStreakDay.value,
    completed: completed.value,
    voiceOn: voiceOn.value,
    voiceRate: voiceRate.value,
    voicePitch: voicePitch.value,
    voiceName: voiceName.value,
    sandboxCode: sandboxCode.value,
  }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    hearts.value = d.hearts ?? MAX_HEARTS
    lastHeartLoss.value = d.lastHeartLoss ?? 0
    xp.value = d.xp ?? 0
    streak.value = d.streak ?? 0
    lastStreakDay.value = d.lastStreakDay ?? ''
    completed.value = d.completed ?? {}
    voiceOn.value = d.voiceOn ?? true
    voiceRate.value = d.voiceRate ?? 1
    voicePitch.value = d.voicePitch ?? 1
    voiceName.value = d.voiceName ?? ''
    sandboxCode.value = d.sandboxCode ?? sandboxCode.value
  } catch {}
}

function refillHearts() {
  if (hearts.value >= MAX_HEARTS) return
  const since = Date.now() - lastHeartLoss.value
  const add = Math.floor(since / HEART_REFILL_MS)
  if (add > 0) {
    hearts.value = Math.min(MAX_HEARTS, hearts.value + add)
    lastHeartLoss.value = Date.now()
    save()
  }
}

function speak(text: string) {
  if (!voiceOn.value || !text) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = voiceRate.value
    u.pitch = voicePitch.value
    if (voiceName.value) {
      const v = voices.value.find((v) => v.name === voiceName.value)
      if (v) u.voice = v
    }
    window.speechSynthesis.speak(u)
  } catch {}
}

function loadVoices() {
  voices.value = window.speechSynthesis.getVoices()
}

function bumpStreak() {
  const today = new Date().toISOString().slice(0, 10)
  if (lastStreakDay.value === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  streak.value = lastStreakDay.value === yesterday ? streak.value + 1 : 1
  lastStreakDay.value = today
}

function startLesson(unitIdx: number, lessonIdx: number) {
  if (hearts.value <= 0) {
    publishedToast.value = 'Out of hearts! Wait for refill or take a break.'
    setTimeout(() => (publishedToast.value = ''), 2500)
    return
  }
  activeUnitIdx.value = unitIdx
  activeLessonIdx.value = lessonIdx
  qIdx.value = 0
  lessonXp.value = 0
  lessonMistakes.value = 0
  resetChoices()
  screen.value = 'lesson'
  speak(activeLesson.value?.title ?? '')
}

function resetChoices() {
  mcChoice.value = null
  fillAnswer.value = ''
  predictChoice.value = null
  feedback.value = ''
  showExplain.value = ''
  const q = activeQuestion.value
  if (q && q.kind === 'order') {
    orderAvailable.value = shuffle([...q.tiles])
    orderChosen.value = []
  }
}

function shuffle<T>(arr: T[]) {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v)
}

function checkAnswer() {
  const q = activeQuestion.value
  if (!q) return
  let correct = false
  if (q.kind === 'mc') correct = mcChoice.value === q.answer
  if (q.kind === 'predict') correct = predictChoice.value === q.answer
  if (q.kind === 'fill') correct = fillAnswer.value.trim() === q.answer
  if (q.kind === 'order') correct = JSON.stringify(orderChosen.value) === JSON.stringify(q.answer)

  if (correct) {
    feedback.value = 'right'
    lessonXp.value += 10
    speak('Nice!')
  } else {
    feedback.value = 'wrong'
    lessonMistakes.value += 1
    hearts.value = Math.max(0, hearts.value - 1)
    lastHeartLoss.value = Date.now()
    speak('Oops, try again next time.')
  }
  showExplain.value = q.explain ?? (correct ? 'Correct!' : 'Not quite.')
  save()
}

function nextQuestion() {
  const lesson = activeLesson.value
  if (!lesson) return
  if (qIdx.value + 1 >= lesson.questions.length) {
    completed.value[lesson.id] = true
    xp.value += lessonXp.value + (lessonMistakes.value === 0 ? 5 : 0)
    bumpStreak()
    save()
    screen.value = 'done'
    speak('Lesson complete!')
    return
  }
  qIdx.value += 1
  resetChoices()
}

function pickOrder(tile: string) {
  orderAvailable.value = orderAvailable.value.filter((t) => t !== tile)
  orderChosen.value.push(tile)
}
function unpickOrder(idx: number) {
  const [t] = orderChosen.value.splice(idx, 1)
  orderAvailable.value.push(t)
}

function unitProgress(unit: typeof units[number]) {
  const total = unit.lessons.length
  const done = unit.lessons.filter((l) => completed.value[l.id]).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

function isUnitLocked(idx: number) {
  if (idx === 0) return false
  const prev = units[idx - 1]
  return prev.lessons.some((l) => !completed.value[l.id])
}

function runSandbox() {
  sandboxOutput.value = []
  const logs: string[] = []
  const mockConsole = {
    log: (...args: unknown[]) => logs.push(args.map(stringify).join(' ')),
    error: (...args: unknown[]) => logs.push('❌ ' + args.map(stringify).join(' ')),
    warn: (...args: unknown[]) => logs.push('⚠️ ' + args.map(stringify).join(' ')),
  }
  try {
    const fn = new Function('console', sandboxCode.value)
    fn(mockConsole)
    sandboxOutput.value = logs.length ? logs : ['(no output)']
  } catch (e) {
    sandboxOutput.value = [...logs, '❌ ' + String(e)]
  }
}
function stringify(v: unknown): string {
  if (typeof v === 'string') return v
  try { return JSON.stringify(v) } catch { return String(v) }
}

function publishGame() {
  const n = (publishedName.value || 'my-game').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const fakeUrl = `rylanscodes.com/${n}`
  try {
    navigator.clipboard?.writeText(fakeUrl)
  } catch {}
  publishedToast.value = `📋 Copied: ${fakeUrl} (pretend for now!)`
  setTimeout(() => (publishedToast.value = ''), 3000)
  speak('Your game is published!')
}

function heartRow() {
  return Array.from({ length: MAX_HEARTS }, (_, i) => i < hearts.value)
}

onMounted(() => {
  load()
  refillHearts()
  loadVoices()
  if (typeof window.speechSynthesis !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
})

watch([voiceOn, voiceRate, voicePitch, voiceName, sandboxCode], save)
</script>

<template>
  <div class="cq-app">
    <!-- Top HUD -->
    <header class="cq-hud">
      <button class="cq-back" @click="router.push('/')" aria-label="Back">←</button>
      <div class="cq-brand">🧠 Code Quest</div>
      <div class="cq-stats">
        <span class="cq-stat streak" title="Streak">🔥 {{ streak }}</span>
        <span class="cq-stat xp" title="XP">⭐ {{ xp }}</span>
        <span class="cq-stat hearts" title="Hearts">
          <span v-for="(on, i) in heartRow()" :key="i" class="cq-heart" :class="{ off: !on }">❤️</span>
        </span>
        <button class="cq-iconbtn" @click="showSandbox = !showSandbox" title="Code Sandbox">💻</button>
        <button class="cq-iconbtn" @click="showVoiceMenu = !showVoiceMenu" title="Voice">
          {{ voiceOn ? '🔊' : '🔇' }}
        </button>
      </div>
    </header>

    <!-- Voice menu -->
    <div v-if="showVoiceMenu" class="cq-voice">
      <label><input type="checkbox" v-model="voiceOn" /> Voice lines on</label>
      <label>Voice:
        <select v-model="voiceName">
          <option value="">(default)</option>
          <option v-for="v in voices" :key="v.name" :value="v.name">{{ v.name }} — {{ v.lang }}</option>
        </select>
      </label>
      <label>Speed: <input type="range" min="0.5" max="1.6" step="0.1" v-model.number="voiceRate" /> {{ voiceRate }}</label>
      <label>Pitch: <input type="range" min="0.5" max="1.6" step="0.1" v-model.number="voicePitch" /> {{ voicePitch }}</label>
      <button class="cq-btn mini" @click="speak('Hello Rylan! Ready to code?')">Test voice</button>
      <button class="cq-btn mini close" @click="showVoiceMenu = false">Close</button>
    </div>

    <!-- Toast -->
    <div v-if="publishedToast" class="cq-toast">{{ publishedToast }}</div>

    <!-- PATH SCREEN -->
    <section v-if="screen === 'path'" class="cq-path">
      <div
        v-for="(unit, uIdx) in units"
        :key="unit.id"
        class="cq-unit"
        :style="{ '--unit-color': unit.color }"
      >
        <div class="cq-unit-head">
          <div class="cq-unit-icon">{{ unit.icon }}</div>
          <div>
            <div class="cq-unit-title">{{ unit.title }}</div>
            <div class="cq-unit-sub">{{ unit.subtitle }}</div>
          </div>
          <div class="cq-unit-progress">{{ unitProgress(unit).done }}/{{ unitProgress(unit).total }}</div>
        </div>
        <div class="cq-lessons">
          <button
            v-for="(lesson, lIdx) in unit.lessons"
            :key="lesson.id"
            class="cq-lesson"
            :class="{ done: completed[lesson.id], locked: isUnitLocked(uIdx) }"
            :disabled="isUnitLocked(uIdx)"
            @click="!isUnitLocked(uIdx) && startLesson(uIdx, lIdx)"
            :style="{ '--i': lIdx }"
          >
            <span class="cq-lesson-icon">{{ completed[lesson.id] ? '⭐' : isUnitLocked(uIdx) ? '🔒' : lesson.icon }}</span>
            <span class="cq-lesson-title">{{ lesson.title }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- LESSON SCREEN -->
    <section v-else-if="screen === 'lesson' && activeQuestion" class="cq-lesson-screen">
      <div class="cq-progress">
        <div class="cq-progress-bar" :style="{ width: progressPct + '%' }"></div>
      </div>
      <div class="cq-q-wrap">
        <h2 class="cq-q-prompt">{{ activeQuestion.prompt }}</h2>
        <pre v-if="'code' in activeQuestion && activeQuestion.code" class="cq-code">{{ activeQuestion.code }}</pre>

        <!-- Multiple choice / predict -->
        <div v-if="activeQuestion.kind === 'mc' || activeQuestion.kind === 'predict'" class="cq-choices">
          <button
            v-for="(c, i) in activeQuestion.choices"
            :key="i"
            class="cq-choice"
            :class="{
              picked: (activeQuestion.kind === 'mc' ? mcChoice : predictChoice) === i,
              right: feedback === 'right' && (activeQuestion.kind === 'mc' ? mcChoice : predictChoice) === i,
              wrong: feedback === 'wrong' && (activeQuestion.kind === 'mc' ? mcChoice : predictChoice) === i,
            }"
            :disabled="feedback !== ''"
            @click="activeQuestion.kind === 'mc' ? (mcChoice = i) : (predictChoice = i)"
          >{{ c }}</button>
        </div>

        <!-- Fill -->
        <div v-if="activeQuestion.kind === 'fill'" class="cq-fill">
          <input
            v-model="fillAnswer"
            class="cq-fill-input"
            :disabled="feedback !== ''"
            placeholder="Type your answer…"
            @keydown.enter="!feedback && checkAnswer()"
          />
        </div>

        <!-- Order -->
        <div v-if="activeQuestion.kind === 'order'" class="cq-order">
          <div class="cq-order-row chosen">
            <button
              v-for="(t, i) in orderChosen"
              :key="i"
              class="cq-tile picked"
              :disabled="feedback !== ''"
              @click="unpickOrder(i)"
            >{{ t }}</button>
            <span v-if="orderChosen.length === 0" class="cq-order-hint">Tap tiles below in order</span>
          </div>
          <div class="cq-order-row">
            <button
              v-for="t in orderAvailable"
              :key="t"
              class="cq-tile"
              :disabled="feedback !== ''"
              @click="pickOrder(t)"
            >{{ t }}</button>
          </div>
        </div>

        <div v-if="showExplain" class="cq-explain" :class="feedback">
          <strong>{{ feedback === 'right' ? '✅ Nice!' : '❌ Not quite.' }}</strong>
          <div>{{ showExplain }}</div>
        </div>
      </div>

      <div class="cq-actions">
        <button class="cq-btn ghost" @click="screen = 'path'">Quit</button>
        <button
          v-if="!feedback"
          class="cq-btn primary"
          :disabled="
            (activeQuestion.kind === 'mc' && mcChoice === null) ||
            (activeQuestion.kind === 'predict' && predictChoice === null) ||
            (activeQuestion.kind === 'fill' && !fillAnswer.trim()) ||
            (activeQuestion.kind === 'order' && orderAvailable.length > 0)
          "
          @click="checkAnswer"
        >Check</button>
        <button v-else class="cq-btn primary" @click="nextQuestion">Continue →</button>
      </div>
    </section>

    <!-- DONE SCREEN -->
    <section v-else-if="screen === 'done'" class="cq-done">
      <div class="cq-done-burst">🎉</div>
      <h1>Lesson Complete!</h1>
      <div class="cq-done-stats">
        <div class="cq-done-stat"><div>+{{ lessonXp + (lessonMistakes === 0 ? 5 : 0) }}</div><span>XP</span></div>
        <div class="cq-done-stat"><div>🔥 {{ streak }}</div><span>Streak</span></div>
        <div class="cq-done-stat"><div>{{ lessonMistakes === 0 ? 'Perfect!' : lessonMistakes + ' miss' + (lessonMistakes === 1 ? '' : 'es') }}</div><span>Accuracy</span></div>
      </div>
      <div class="cq-actions">
        <button class="cq-btn primary" @click="screen = 'path'">Back to map</button>
      </div>
    </section>

    <!-- SANDBOX PANEL -->
    <aside v-if="showSandbox" class="cq-sandbox">
      <header class="cq-sandbox-head">
        <strong>💻 Your Code Sandbox</strong>
        <button class="cq-iconbtn" @click="showSandbox = false">✖</button>
      </header>
      <textarea v-model="sandboxCode" class="cq-sandbox-code" spellcheck="false"></textarea>
      <div class="cq-sandbox-actions">
        <button class="cq-btn primary mini" @click="runSandbox">▶ Run</button>
        <input v-model="publishedName" class="cq-sandbox-name" placeholder="my-game-name" />
        <button class="cq-btn mini" @click="publishGame">🚀 Publish to rylanscodes.com</button>
      </div>
      <pre class="cq-sandbox-out">{{ sandboxOutput.join('\n') }}</pre>
    </aside>
  </div>
</template>

<style scoped>
.cq-app {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b1221 0%, #1a2238 100%);
  color: #f1f5f9;
  font-family: 'Nunito', 'Inter', system-ui, sans-serif;
  padding-bottom: 40px;
}

.cq-hud {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: rgba(11, 18, 33, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #1e293b;
}
.cq-back {
  background: #1e293b;
  border: none;
  color: #f1f5f9;
  font-size: 20px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
}
.cq-brand { font-weight: 900; font-size: 20px; letter-spacing: 0.5px; }
.cq-stats { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.cq-stat { font-weight: 800; font-size: 16px; display: inline-flex; gap: 6px; align-items: center; }
.cq-stat.streak { color: #ff9500; }
.cq-stat.xp { color: #ffd700; }
.cq-heart { font-size: 18px; filter: none; transition: filter 0.2s; }
.cq-heart.off { filter: grayscale(1) brightness(0.4); }
.cq-iconbtn {
  background: #1e293b;
  border: 2px solid #334155;
  color: #f1f5f9;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
}
.cq-iconbtn:hover { background: #334155; }

.cq-voice {
  position: fixed;
  top: 72px;
  right: 18px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 10px;
  z-index: 20;
  width: 300px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}
.cq-voice label { display: grid; gap: 4px; font-size: 14px; }
.cq-voice select, .cq-voice input[type=text] {
  background: #0b1221; border: 1px solid #334155; color: #f1f5f9; padding: 6px; border-radius: 8px;
}

.cq-toast {
  position: fixed;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  background: #1cb0f6;
  color: white;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 800;
  z-index: 30;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* PATH */
.cq-path { max-width: 800px; margin: 0 auto; padding: 20px; display: grid; gap: 22px; }
.cq-unit {
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid var(--unit-color);
  border-radius: 18px;
  padding: 18px;
}
.cq-unit-head { display: flex; gap: 12px; align-items: center; }
.cq-unit-icon {
  font-size: 34px; background: var(--unit-color); width: 56px; height: 56px;
  border-radius: 14px; display: grid; place-items: center;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
}
.cq-unit-title { font-size: 20px; font-weight: 900; }
.cq-unit-sub { font-size: 13px; color: #94a3b8; }
.cq-unit-progress { margin-left: auto; font-weight: 900; color: var(--unit-color); }

.cq-lessons { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; justify-content: center; }
.cq-lesson {
  --s: 78px;
  width: var(--s); height: var(--s);
  background: var(--unit-color);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-weight: 900;
  display: grid; place-items: center; gap: 2px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  transform: translateX(calc(var(--i) * 8px));
  transition: transform 0.15s;
}
.cq-lesson:hover:not(:disabled) { transform: translateX(calc(var(--i) * 8px)) translateY(-2px); }
.cq-lesson:active:not(:disabled) { transform: translateX(calc(var(--i) * 8px)) translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
.cq-lesson.done { background: #ffd700; color: #1a202c; }
.cq-lesson.locked { background: #334155; color: #64748b; cursor: not-allowed; }
.cq-lesson-icon { font-size: 28px; }
.cq-lesson-title { font-size: 10px; text-align: center; padding: 0 4px; line-height: 1.1; }

/* LESSON */
.cq-lesson-screen { max-width: 720px; margin: 0 auto; padding: 20px; }
.cq-progress { height: 14px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-bottom: 24px; }
.cq-progress-bar { height: 100%; background: #58cc02; transition: width 0.3s; border-radius: 999px; }
.cq-q-prompt { font-size: 22px; margin-bottom: 16px; }
.cq-code {
  background: #0b1221;
  border: 2px solid #334155;
  border-radius: 12px;
  padding: 14px;
  font-family: 'Consolas', 'Courier New', monospace;
  white-space: pre-wrap;
  color: #7dd3fc;
  margin-bottom: 18px;
}
.cq-choices { display: grid; gap: 10px; }
.cq-choice {
  background: #1e293b;
  border: 3px solid #334155;
  border-bottom-width: 5px;
  border-radius: 14px;
  padding: 16px;
  color: #f1f5f9;
  font-weight: 700;
  font-family: 'Consolas', monospace;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
}
.cq-choice:hover:not(:disabled) { border-color: #58cc02; }
.cq-choice.picked { border-color: #58cc02; background: #14532d; }
.cq-choice.right { border-color: #58cc02; background: #14532d; color: white; }
.cq-choice.wrong { border-color: #ef4444; background: #7f1d1d; }
.cq-choice:disabled { cursor: default; opacity: 0.85; }

.cq-fill-input {
  width: 100%;
  font-family: 'Consolas', monospace;
  font-size: 18px;
  padding: 14px;
  background: #1e293b;
  color: #f1f5f9;
  border: 3px solid #334155;
  border-bottom-width: 5px;
  border-radius: 14px;
}
.cq-fill-input:focus { outline: none; border-color: #58cc02; }

.cq-order { display: grid; gap: 14px; }
.cq-order-row {
  display: flex; flex-wrap: wrap; gap: 8px;
  min-height: 60px; padding: 12px;
  background: #0b1221;
  border: 2px dashed #334155;
  border-radius: 12px;
  align-items: center;
}
.cq-order-row.chosen { background: #14532d20; border-color: #58cc02; }
.cq-order-hint { color: #64748b; font-style: italic; padding: 0 10px; }
.cq-tile {
  background: #1e293b;
  border: 2px solid #334155;
  border-bottom-width: 4px;
  color: #f1f5f9;
  padding: 8px 14px;
  border-radius: 10px;
  font-family: 'Consolas', monospace;
  font-weight: 700;
  cursor: pointer;
}
.cq-tile.picked { background: #14532d; border-color: #58cc02; }

.cq-explain {
  margin-top: 18px;
  padding: 14px;
  border-radius: 14px;
  background: #1e293b;
  border-left: 6px solid #58cc02;
}
.cq-explain.wrong { border-left-color: #ef4444; }

.cq-actions { display: flex; gap: 10px; margin-top: 24px; justify-content: flex-end; }
.cq-btn {
  background: #58cc02;
  color: white;
  border: none;
  padding: 14px 22px;
  border-radius: 14px;
  font-weight: 900;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 5px 0 #3d9900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cq-btn:hover:not(:disabled) { filter: brightness(1.05); }
.cq-btn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 2px 0 #3d9900; }
.cq-btn:disabled { background: #334155; color: #64748b; box-shadow: 0 5px 0 #1e293b; cursor: not-allowed; }
.cq-btn.ghost { background: transparent; color: #94a3b8; box-shadow: none; border: 2px solid #334155; }
.cq-btn.primary { background: #58cc02; box-shadow: 0 5px 0 #3d9900; }
.cq-btn.mini { padding: 8px 12px; font-size: 13px; box-shadow: 0 3px 0 rgba(0,0,0,0.3); }
.cq-btn.close { background: #334155; box-shadow: 0 3px 0 #1e293b; }

/* DONE */
.cq-done { max-width: 640px; margin: 0 auto; padding: 40px 20px; text-align: center; }
.cq-done-burst { font-size: 90px; animation: pop 0.5s; }
@keyframes pop { 0% { transform: scale(0.2); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
.cq-done h1 { font-size: 36px; margin: 10px 0 28px; }
.cq-done-stats { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.cq-done-stat {
  background: #1e293b;
  padding: 16px 22px;
  border-radius: 14px;
  border: 2px solid #334155;
  min-width: 120px;
}
.cq-done-stat div { font-size: 28px; font-weight: 900; color: #58cc02; }
.cq-done-stat span { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }

/* SANDBOX */
.cq-sandbox {
  position: fixed;
  right: 0; top: 68px; bottom: 0;
  width: min(460px, 95vw);
  background: #0b1221;
  border-left: 3px solid #334155;
  display: flex; flex-direction: column;
  z-index: 15;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.6);
}
.cq-sandbox-head {
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 2px solid #334155;
}
.cq-sandbox-code {
  flex: 1;
  background: #0b1221;
  color: #7dd3fc;
  border: none;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  padding: 14px;
  resize: none;
  min-height: 220px;
}
.cq-sandbox-code:focus { outline: none; }
.cq-sandbox-actions {
  display: flex; gap: 8px; padding: 10px;
  border-top: 2px solid #334155; flex-wrap: wrap;
}
.cq-sandbox-name {
  flex: 1; min-width: 100px;
  background: #1e293b; color: #f1f5f9;
  border: 2px solid #334155; border-radius: 8px;
  padding: 6px 10px; font-family: inherit;
}
.cq-sandbox-out {
  background: #000;
  color: #a7f3d0;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  padding: 12px;
  margin: 0;
  max-height: 180px;
  overflow: auto;
  border-top: 2px solid #334155;
  white-space: pre-wrap;
}
</style>
