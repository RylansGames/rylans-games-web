<template>
  <div class="lc-app">
    <!-- Step 1: Welcome -->
    <div v-if="step === 'welcome'" class="step-screen">
      <div class="step-card">
        <div class="step-icon">💻</div>
        <h1 class="step-title">Learn to Code!</h1>
        <p class="step-sub">Start your coding journey today!</p>
        <div class="step-info">
          <p>Before we begin, you'll need a code editor.</p>
          <p><strong>On Computer:</strong> Download Visual Studio Code (VS Code)</p>
          <a href="https://code.visualstudio.com" target="_blank" class="download-link">
            📥 code.visualstudio.com
          </a>
          <p style="margin-top: 12px"><strong>On iPad:</strong> Search "Visual Code" in the App Store</p>
        </div>
        <div class="step-buttons">
          <button class="step-btn ready" @click="step = 'setup'">I already have it</button>
          <button class="step-btn download" @click="step = 'setup'">Just downloaded it</button>
        </div>
        <button class="back-link" @click="$router.push('/')">Back to Games</button>
      </div>
    </div>

    <!-- Step 2: Setup -->
    <div v-if="step === 'setup'" class="step-screen">
      <div class="step-card">
        <h2>Setting Up VS Code</h2>
        <div class="setup-steps">
          <div class="ss" v-for="(s, i) in setupSteps" :key="i" :class="{ done: i &lt; setupDone }">
            <span class="ss-num">{{ i + 1 }}</span>
            <span class="ss-text">{{ s }}</span>
          </div>
        </div>
        <button class="step-btn ready" @click="advanceSetup">
          {{ setupBtnText }}
        </button>
      </div>
    </div>

    <!-- Step 3: Pick language -->
    <div v-if="step === 'pick-lang'" class="step-screen">
      <div class="step-card">
        <h2>What do you want to learn?</h2>
        <p class="step-sub">Pick a language to start with!</p>
        <div class="lang-grid">
          <div v-for="lang in languages" :key="lang.id" class="lang-card" @click="selectLanguage(lang.id)">
            <div class="lang-icon">{{ lang.icon }}</div>
            <div class="lang-name">{{ lang.name }}</div>
            <div class="lang-desc">{{ lang.desc }}</div>
            <div class="lang-diff" :class="lang.difficulty">{{ lang.difficulty }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 4: Lessons -->
    <div v-if="step === 'lesson'" class="lesson-screen">
      <div class="lesson-sidebar">
        <div class="ls-header">
          <span class="ls-lang">{{ currentLangData?.icon }} {{ currentLangData?.name }}</span>
          <button class="ls-back" @click="step = 'pick-lang'">Languages</button>
        </div>
        <div class="ls-progress">
          {{ completedLessons.length }} / {{ currentLessons.length }} lessons
          <div class="ls-bar"><div class="ls-fill" :style="{ width: lessonProgress + '%' }"></div></div>
        </div>
        <div class="ls-list">
          <div v-for="(lesson, i) in currentLessons" :key="i" class="ls-item"
            :class="{ active: currentLessonIndex === i, done: completedLessons.includes(i) }"
            @click="goToLesson(i)">
            <span>{{ lesson.title }}</span>
          </div>
        </div>
      </div>

      <div class="lesson-main">
        <div class="lesson-content">
          <h2 class="lesson-title">{{ currentLesson?.title }}</h2>
          <div class="lesson-explanation">{{ currentLesson?.explanation }}</div>

          <div class="code-block" v-if="currentLesson?.code">
            <div class="cb-header">
              <span>{{ currentLesson?.codeFile || 'code' }}</span>
              <button class="copy-code" @click="copyCode">Copy</button>
            </div>
            <pre class="cb-code">{{ currentLesson?.code }}</pre>
          </div>

          <div class="try-section" v-if="currentLesson?.challenge">
            <h3>Try it yourself!</h3>
            <p>{{ currentLesson?.challenge }}</p>
            <textarea v-model="userCode" class="code-editor" :placeholder="currentLesson?.starterCode || 'Type your code here...'" rows="8"></textarea>
            <button class="run-btn" @click="checkChallenge">Check Answer</button>
            <div v-if="challengeResult" class="challenge-result" :class="challengeResult.correct ? 'correct' : 'wrong'">
              {{ challengeResult.message }}
            </div>
          </div>

          <div class="tip-box" v-if="currentLesson?.tip">
            <span>Tip: {{ currentLesson?.tip }}</span>
          </div>
        </div>

        <div class="lesson-nav">
          <button class="nav-btn prev" @click="prevLesson" :disabled="currentLessonIndex &lt;= 0">Previous</button>
          <button class="nav-btn next" @click="nextLesson">
            {{ isLastLesson ? 'Finish!' : 'Next' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Completion -->
    <div v-if="step === 'complete'" class="step-screen">
      <div class="step-card">
        <div class="step-icon">🎉</div>
        <h1>You did it!</h1>
        <p>You completed all {{ currentLangData?.name }} lessons!</p>
        <p class="step-sub">Keep practicing and building projects!</p>
        <button class="step-btn ready" @click="step = 'pick-lang'">Learn Another Language</button>
        <button class="back-link" @click="$router.push('/')">Back to Games</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'
import { languages, allLessons } from './lessons'

const step = ref<'welcome' | 'setup' | 'pick-lang' | 'lesson' | 'complete'>('welcome')
const currentLang = ref('')
const currentLessonIndex = ref(0)
const completedLessons = ref<number[]>([])
const userCode = ref('')
const challengeResult = ref<{ correct: boolean; message: string } | null>(null)
const setupDone = ref(0)

const setupBtnText = computed(() => {
  return setupDone.value < setupSteps.length ? 'Done - Next step' : 'All set!'
})

function advanceSetup() {
  setupDone.value++
  if (setupDone.value >= setupSteps.length) step.value = 'pick-lang'
}

const setupSteps = [
  'Open VS Code',
  'Create a new folder on your computer called "my-code"',
  'In VS Code, click File, then Open Folder, then select "my-code"',
  'Click the new file button and create "index.html"',
  'You are ready to code!',
]

const currentLangData = computed(() => languages.find(l => l.id === currentLang.value))
const currentLessons = computed(() => allLessons[currentLang.value] || [])
const currentLesson = computed(() => currentLessons.value[currentLessonIndex.value])
const isLastLesson = computed(() => currentLessonIndex.value >= currentLessons.value.length - 1)
const lessonProgress = computed(() => {
  if (currentLessons.value.length === 0) return 0
  return (completedLessons.value.length / currentLessons.value.length) * 100
})

function selectLanguage(langId: string) {
  currentLang.value = langId
  currentLessonIndex.value = 0
  completedLessons.value = JSON.parse(localStorage.getItem('lc-done-' + langId) || '[]')
  userCode.value = ''
  challengeResult.value = null
  step.value = 'lesson'
}

function goToLesson(index: number) {
  currentLessonIndex.value = index
  userCode.value = ''
  challengeResult.value = null
}

function nextLesson() {
  if (!completedLessons.value.includes(currentLessonIndex.value)) {
    completedLessons.value.push(currentLessonIndex.value)
    localStorage.setItem('lc-done-' + currentLang.value, JSON.stringify(completedLessons.value))
  }
  if (currentLessonIndex.value < currentLessons.value.length - 1) {
    currentLessonIndex.value++
    userCode.value = ''
    challengeResult.value = null
  } else {
    step.value = 'complete'
  }
}

function prevLesson() {
  if (currentLessonIndex.value > 0) {
    currentLessonIndex.value--
    userCode.value = ''
    challengeResult.value = null
  }
}

function checkChallenge() {
  const lesson = currentLesson.value
  if (!lesson?.answer) return
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  if (clean(userCode.value).includes(clean(lesson.answer)) || clean(userCode.value) === clean(lesson.answer)) {
    challengeResult.value = { correct: true, message: 'Correct! Great job!' }
  } else {
    challengeResult.value = { correct: false, message: 'Not quite. Check the example above and try again!' }
  }
}

function copyCode() {
  if (currentLesson.value?.code) {
    navigator.clipboard?.writeText(currentLesson.value.code)
  }
}

onMounted(() => {
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Learn to Code')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Learn to Code')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
})
</script>

<style scoped>
.lc-app { font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; background: #0f172a; color: #e2e8f0; }
.step-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.step-card {
  background: #1e293b; border-radius: 20px; padding: 36px; text-align: center;
  max-width: 500px; width: 100%; border: 1px solid #334155;
}
.step-icon { font-size: 64px; margin-bottom: 8px; }
.step-title { color: #fff; font-size: 32px; font-weight: 900; margin: 0 0 8px; }
.step-sub { color: #94a3b8; font-size: 15px; margin: 0 0 20px; }
.step-info { text-align: left; margin-bottom: 20px; }
.step-info p { margin: 6px 0; color: #cbd5e1; font-size: 15px; }
.download-hint { color: #94a3b8; font-style: italic; }
.download-link {
  display: inline-block; padding: 10px 20px; background: #3b82f6; color: #fff;
  text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 8px;
}
.step-buttons { display: flex; flex-direction: column; gap: 10px; }
.step-btn {
  padding: 14px 24px; border-radius: 12px; border: none; font-size: 16px;
  font-weight: 700; cursor: pointer; transition: transform 0.15s;
}
.step-btn:hover { transform: translateY(-2px); }
.step-btn.ready { background: #22c55e; color: #fff; }
.step-btn.download { background: #3b82f6; color: #fff; }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }
.setup-steps { text-align: left; margin-bottom: 20px; }
.ss {
  display: flex; align-items: center; gap: 10px; padding: 10px; margin: 6px 0;
  background: #0f172a; border-radius: 8px; border: 1px solid #334155;
}
.ss.done { border-color: #22c55e; background: rgba(34,197,94,0.1); }
.ss-num {
  width: 28px; height: 28px; border-radius: 50%; background: #334155;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0;
}
.ss.done .ss-num { background: #22c55e; }
.ss-text { font-size: 14px; }
.lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; }
.lang-card {
  background: #0f172a; border: 2px solid #334155; border-radius: 14px; padding: 16px;
  cursor: pointer; transition: all 0.15s;
}
.lang-card:hover { border-color: #3b82f6; transform: translateY(-3px); }
.lang-icon { font-size: 32px; margin-bottom: 4px; }
.lang-name { color: #fff; font-size: 18px; font-weight: 800; }
.lang-desc { color: #94a3b8; font-size: 12px; margin: 4px 0; }
.lang-diff { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; display: inline-block; }
.lang-diff.Beginner { background: rgba(34,197,94,0.2); color: #4ade80; }
.lang-diff.Intermediate { background: rgba(251,191,36,0.2); color: #fbbf24; }
.lesson-screen { display: flex; min-height: 100vh; }
.lesson-sidebar {
  width: 260px; background: #1e293b; border-right: 1px solid #334155;
  display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
}
.ls-header { padding: 14px; border-bottom: 1px solid #334155; }
.ls-lang { color: #fff; font-size: 16px; font-weight: 800; }
.ls-back { display: block; margin-top: 6px; background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; }
.ls-progress { padding: 10px 14px; border-bottom: 1px solid #334155; font-size: 12px; color: #94a3b8; }
.ls-bar { height: 4px; background: #334155; border-radius: 2px; margin-top: 6px; }
.ls-fill { height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.3s; }
.ls-list { flex: 1; padding: 8px 0; }
.ls-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 13px;
  color: #94a3b8; cursor: pointer; transition: background 0.15s;
}
.ls-item:hover { background: #0f172a; color: #fff; }
.ls-item.active { background: #0f172a; color: #3b82f6; font-weight: 700; }
.ls-item.done { color: #4ade80; }
.lesson-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.lesson-content { flex: 1; padding: 24px 32px; max-width: 750px; }
.lesson-title { color: #fff; font-size: 26px; font-weight: 900; margin: 0 0 16px; }
.lesson-explanation { color: #cbd5e1; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
.code-block {
  background: #0f172a; border: 1px solid #334155; border-radius: 10px; margin-bottom: 20px; overflow: hidden;
}
.cb-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 14px; background: #1e293b; font-size: 12px; color: #94a3b8;
}
.copy-code { background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; }
.cb-code { margin: 0; padding: 16px; font-size: 14px; color: #e2e8f0; overflow-x: auto; line-height: 1.6; font-family: 'Courier New', monospace; }
.try-section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
.try-section h3 { color: #fbbf24; margin: 0 0 8px; }
.try-section p { color: #94a3b8; font-size: 14px; margin: 0 0 12px; }
.code-editor {
  width: 100%; padding: 12px; background: #0f172a; color: #e2e8f0; border: 1px solid #334155;
  border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: vertical;
  outline: none; box-sizing: border-box;
}
.code-editor:focus { border-color: #3b82f6; }
.run-btn {
  margin-top: 8px; padding: 8px 20px; background: #22c55e; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
}
.challenge-result { margin-top: 8px; padding: 8px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; }
.challenge-result.correct { background: rgba(34,197,94,0.15); color: #4ade80; }
.challenge-result.wrong { background: rgba(239,68,68,0.15); color: #f87171; }
.tip-box {
  display: flex; align-items: flex-start; gap: 8px; background: rgba(251,191,36,0.1);
  border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;
  color: #fbbf24; font-size: 14px;
}
.lesson-nav {
  display: flex; justify-content: space-between; padding: 16px 32px; border-top: 1px solid #334155;
}
.nav-btn {
  padding: 10px 24px; border-radius: 10px; border: none; font-size: 14px;
  font-weight: 700; cursor: pointer;
}
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.nav-btn.prev { background: #334155; color: #fff; }
.nav-btn.next { background: #3b82f6; color: #fff; }
@media (max-width: 700px) {
  .lesson-screen { flex-direction: column; }
  .lesson-sidebar { width: 100%; max-height: 200px; border-right: none; border-bottom: 1px solid #334155; }
  .lesson-content { padding: 16px; }
  .lesson-nav { padding: 12px 16px; }
  .lang-grid { grid-template-columns: 1fr; }
  .step-card { padding: 24px 16px; }
}
</style>
