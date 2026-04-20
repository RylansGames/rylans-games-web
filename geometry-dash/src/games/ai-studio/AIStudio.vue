<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type Tab = 'chat' | 'image'
const tab = ref<Tab>('chat')

// ======= SAFETY FILTER =======
const BLOCKED = [
  'nude', 'naked', 'porn', 'sex', 'sexy', 'blood', 'gore', 'kill', 'murder',
  'dead body', 'weapon', 'gun', 'knife', 'drug', 'cocaine', 'heroin',
  'alcohol', 'beer', 'wine', 'cigarette', 'smoking', 'suicide',
]
function isSafe(text: string) {
  const low = text.toLowerCase()
  return !BLOCKED.some((w) => low.includes(w))
}

// ======= CHAT =======
interface Msg { role: 'user' | 'ai'; text: string; time: number }
const chat = ref<Msg[]>([
  { role: 'ai', text: "Hey Rylan! I'm Pixie — your AI buddy. Ask me anything, or try the Image tab to make pictures!", time: Date.now() },
])
const draft = ref('')
const chatScroll = ref<HTMLDivElement | null>(null)

function aiReply(userText: string): string {
  const q = userText.toLowerCase().trim()
  if (!q) return "Hmm, say something!"
  if (!isSafe(userText)) return "Let's keep it kid-safe! Try a different question."
  // pattern matching for smart-ish answers
  const patterns: [RegExp, () => string][] = [
    [/hello|hi|hey/, () => 'Hi Rylan! What do you want to build today?'],
    [/your name|who are you/, () => "I'm Pixie, your pretend-AI pal. I can chat and make pictures!"],
    [/how are you/, () => "I'm amazing! I ran out of coffee though. Robots drink coffee, right?"],
    [/joke/, () => pick(JOKES)],
    [/love|like/, () => "Aw, I like you too! High-five! ✋"],
    [/weather/, () => 'I can\'t check real weather (no internet brain), but I bet it\'s sunny in your coding world!'],
    [/time/, () => `It's ${new Date().toLocaleTimeString()} on your computer.`],
    [/date|day/, () => `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`],
    [/code|coding|javascript|js/, () => 'Code is like giving the computer a recipe! Try the Code Quest game to learn.'],
    [/game|play/, () => 'I love games! My favorite is one where the player is the hero. Got an idea?'],
    [/color|colour/, () => `My favorite color is ${pick(['neon pink', 'electric blue', 'galaxy purple', 'lava orange'])}!`],
    [/math|add|plus/, () => tryMath(userText) ?? 'Try "what is 5 + 3"'],
    [/what can you do/, () => "I can chat, tell jokes, do simple math, and make AI pictures (try the Image tab!)."],
    [/picture|image|draw|paint/, () => 'Switch to the Image tab and type what you want me to draw!'],
    [/bye|goodbye/, () => 'Bye Rylan! Come back soon!'],
    [/thank/, () => "You're welcome! 🎉"],
    [/no|nope/, () => 'Ok, no worries!'],
    [/yes|yeah|yep/, () => 'Awesome!'],
    [/why/, () => "Because magic. Or physics. Or both!"],
    [/how/, () => "Good question! Usually with a lot of practice and snacks."],
  ]
  for (const [re, fn] of patterns) if (re.test(q)) return fn()
  return pick(GENERIC_REPLIES).replace('{q}', userText)
}
const JOKES = [
  'Why did the coder go broke? Because he used up all his cache! 💰',
  'Why was the computer cold? It left its Windows open! ❄️',
  'What does a baby computer call its dad? Data! 👨',
  'Why did the JS developer leave? Because he didn\'t get arrays.',
  'How many programmers does it take to change a bulb? None — that\'s a hardware issue!',
]
const GENERIC_REPLIES = [
  "Hmm, that\'s interesting! Tell me more about \"{q}\".",
  "I think \"{q}\" sounds cool! What else?",
  "Whoa! I haven\'t learned about that yet. Want to code one with me?",
  "Cool question. I\'d say yes? Maybe? Let\'s pretend it\'s yes.",
]
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] }
function tryMath(t: string): string | null {
  const m = t.match(/(-?\d+(?:\.\d+)?)\s*([+\-*x/])\s*(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  const a = parseFloat(m[1]); const b = parseFloat(m[3])
  const op = m[2] === 'x' ? '*' : m[2]
  let r = 0
  if (op === '+') r = a + b
  else if (op === '-') r = a - b
  else if (op === '*') r = a * b
  else if (op === '/') r = b === 0 ? NaN : a / b
  return `${a} ${op} ${b} = ${r}`
}

async function send() {
  const t = draft.value.trim()
  if (!t) return
  chat.value.push({ role: 'user', text: t, time: Date.now() })
  draft.value = ''
  await scrollToBottom()
  setTimeout(async () => {
    const reply = aiReply(t)
    chat.value.push({ role: 'ai', text: reply, time: Date.now() })
    speak(reply)
    await scrollToBottom()
  }, 300 + Math.random() * 500)
}
async function scrollToBottom() {
  await nextTick()
  if (chatScroll.value) chatScroll.value.scrollTop = chatScroll.value.scrollHeight
}

// ======= IMAGE =======
interface ImgItem { id: number; prompt: string; url: string; style: string; status: 'loading' | 'ready' | 'error' }
const imgPrompt = ref('')
const imgStyle = ref('realistic')
const imgHistory = ref<ImgItem[]>([])
const imgError = ref('')
let imgSeq = 1

const IMG_STYLES = [
  { id: 'realistic', label: '📷 Realistic', suffix: ', highly detailed, realistic photo' },
  { id: 'cartoon', label: '🎨 Cartoon', suffix: ', cartoon style, colorful, kid friendly' },
  { id: 'pixel', label: '👾 Pixel Art', suffix: ', pixel art, 16-bit game style' },
  { id: 'watercolor', label: '🖌️ Watercolor', suffix: ', watercolor painting, soft colors' },
  { id: 'anime', label: '🗾 Anime', suffix: ', anime style, vibrant' },
  { id: 'lego', label: '🧱 Lego', suffix: ', lego style, plastic bricks' },
]

const imgLoading = computed(() => imgHistory.value.some((x) => x.status === 'loading'))

function generateImage() {
  const p = imgPrompt.value.trim()
  if (!p) return
  if (!isSafe(p)) {
    imgError.value = "That prompt isn't kid-safe — try something else!"
    return
  }
  imgError.value = ''
  const style = IMG_STYLES.find((s) => s.id === imgStyle.value)
  const fullPrompt = p + (style?.suffix ?? '')
  const seed = Math.floor(Math.random() * 1_000_000)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=512&height=512&seed=${seed}&nologo=true`
  imgHistory.value.unshift({
    id: imgSeq++,
    prompt: p,
    url,
    style: style?.label ?? '',
    status: 'loading',
  })
}

function onImgLoad(item: ImgItem) {
  item.status = 'ready'
  save()
}
function onImgError(item: ImgItem) {
  item.status = 'error'
}
function retryImage(item: ImgItem) {
  item.status = 'loading'
  const u = new URL(item.url)
  u.searchParams.set('seed', String(Math.floor(Math.random() * 1_000_000)))
  item.url = u.toString()
}
function removeImage(id: number) {
  imgHistory.value = imgHistory.value.filter((x) => x.id !== id)
  save()
}

function downloadImage(url: string, prompt: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = (prompt.replace(/[^a-z0-9]/gi, '-').slice(0, 40) || 'image') + '.jpg'
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}

// ======= VOICE =======
const voiceOn = ref(true)
const voiceName = ref('')
const voiceRate = ref(1)
const voicePitch = ref(1)
const voices = ref<SpeechSynthesisVoice[]>([])
const showVoiceMenu = ref(false)
function loadVoices() { voices.value = window.speechSynthesis.getVoices() }
function speak(text: string) {
  if (!voiceOn.value) return
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

// ======= SPEECH-TO-TEXT =======
const listening = ref(false)
const sttSupported = ref(false)
let recog: any = null
function setupStt() {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return
  sttSupported.value = true
  recog = new SR()
  recog.continuous = false
  recog.interimResults = false
  recog.lang = 'en-US'
  recog.onresult = (e: any) => {
    const transcript = e.results[0][0].transcript
    draft.value = transcript
    listening.value = false
    send()
  }
  recog.onend = () => { listening.value = false }
  recog.onerror = () => { listening.value = false }
}
function toggleListen() {
  if (!recog) return
  if (listening.value) { recog.stop(); listening.value = false; return }
  listening.value = true
  try { recog.start() } catch { listening.value = false }
}

// ======= SAVE =======
const SAVE_KEY = 'ai-studio-save-v1'
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      chat: chat.value.slice(-50),
      imgHistory: imgHistory.value.slice(0, 20),
      voiceOn: voiceOn.value, voiceName: voiceName.value, voiceRate: voiceRate.value, voicePitch: voicePitch.value,
    }))
  } catch {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    if (d.chat) chat.value = d.chat
    if (d.imgHistory) imgHistory.value = d.imgHistory
    voiceOn.value = d.voiceOn ?? true
    voiceName.value = d.voiceName ?? ''
    voiceRate.value = d.voiceRate ?? 1
    voicePitch.value = d.voicePitch ?? 1
  } catch {}
}
function clearChat() {
  chat.value = [{ role: 'ai', text: 'Cleared! Ready for a fresh chat. 🌟', time: Date.now() }]
  save()
}

onMounted(() => {
  load()
  loadVoices()
  if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.onvoiceschanged = loadVoices
  setupStt()
})
onBeforeUnmount(() => {
  try { window.speechSynthesis.cancel() } catch {}
  try { recog?.stop?.() } catch {}
})
</script>

<template>
  <div class="ai-app">
    <header class="ai-hud">
      <button class="ai-back" @click="router.push('/')">←</button>
      <div class="ai-brand">✨ AI Studio <span class="ai-brand-sub">by Pixie</span></div>
      <div class="ai-tabs">
        <button :class="{ active: tab === 'chat' }" @click="tab = 'chat'">💬 Chat</button>
        <button :class="{ active: tab === 'image' }" @click="tab = 'image'">🎨 Image</button>
      </div>
      <button class="ai-iconbtn" @click="showVoiceMenu = !showVoiceMenu">{{ voiceOn ? '🔊' : '🔇' }}</button>
    </header>

    <div v-if="showVoiceMenu" class="ai-voice">
      <label><input type="checkbox" v-model="voiceOn" /> Voice replies</label>
      <label>Voice/Accent:
        <select v-model="voiceName">
          <option value="">(default)</option>
          <option v-for="v in voices" :key="v.name" :value="v.name">{{ v.name }} — {{ v.lang }}</option>
        </select>
      </label>
      <label>Speed: <input type="range" min="0.5" max="1.6" step="0.1" v-model.number="voiceRate" /> {{ voiceRate }}</label>
      <label>Pitch: <input type="range" min="0.5" max="1.6" step="0.1" v-model.number="voicePitch" /> {{ voicePitch }}</label>
      <button class="ai-btn mini" @click="speak('Hi Rylan! How do I sound?')">Test voice</button>
      <button class="ai-btn mini close" @click="showVoiceMenu = false">Close</button>
    </div>

    <!-- CHAT TAB -->
    <main v-if="tab === 'chat'" class="ai-chat">
      <div ref="chatScroll" class="ai-msgs">
        <div v-for="(m, i) in chat" :key="i" class="ai-msg" :class="m.role">
          <div class="ai-avatar">{{ m.role === 'ai' ? '🤖' : '🧒' }}</div>
          <div class="ai-bubble">{{ m.text }}</div>
        </div>
      </div>
      <div class="ai-input-row">
        <button v-if="sttSupported" class="ai-iconbtn mic" :class="{ on: listening }" @click="toggleListen" :title="listening ? 'Listening…' : 'Talk'">
          🎤
        </button>
        <input
          v-model="draft"
          class="ai-input"
          placeholder="Type to Pixie… (or tap the mic)"
          @keydown.enter="send"
        />
        <button class="ai-btn" @click="send">Send</button>
        <button class="ai-btn ghost mini" @click="clearChat">Clear</button>
      </div>
    </main>

    <!-- IMAGE TAB -->
    <main v-else class="ai-image">
      <div class="ai-image-form">
        <input
          v-model="imgPrompt"
          class="ai-input big"
          placeholder="Describe a picture… e.g. a dragon reading a book"
          @keydown.enter="generateImage"
        />
        <div class="ai-styles">
          <button
            v-for="s in IMG_STYLES"
            :key="s.id"
            class="ai-style"
            :class="{ active: imgStyle === s.id }"
            @click="imgStyle = s.id"
          >{{ s.label }}</button>
        </div>
        <button class="ai-btn big" :disabled="!imgPrompt.trim()" @click="generateImage">
          🎨 Make it!
        </button>
        <div v-if="imgError" class="ai-error">{{ imgError }}</div>
      </div>

      <div v-if="imgHistory.length" class="ai-gallery">
        <div v-for="img in imgHistory" :key="img.id" class="ai-gal-item">
          <div class="ai-gal-imgwrap">
            <div v-if="img.status === 'loading'" class="ai-gal-overlay">
              <div class="ai-spin">✨</div>
              <div>Pixie is painting…<br /><small>(can take 10–30s)</small></div>
            </div>
            <div v-if="img.status === 'error'" class="ai-gal-overlay err">
              <div>😿 Failed to load</div>
              <button class="ai-btn mini" @click="retryImage(img)">↻ Retry</button>
            </div>
            <img
              :src="img.url"
              :alt="img.prompt"
              loading="eager"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
              @load="onImgLoad(img)"
              @error="onImgError(img)"
            />
          </div>
          <div class="ai-gal-info">
            <div class="ai-gal-prompt">"{{ img.prompt }}"</div>
            <div class="ai-gal-style">{{ img.style }}</div>
            <div class="ai-gal-actions">
              <button class="ai-btn mini" :disabled="img.status !== 'ready'" @click="downloadImage(img.url, img.prompt)">⬇ Download</button>
              <button class="ai-btn ghost mini" @click="removeImage(img.id)">✖</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="ai-empty">
        <div class="ai-empty-icon">🖼️</div>
        <p>Type something above and tap "Make it!" to generate an AI picture.</p>
        <p class="ai-hint">Powered by Pollinations.ai · free · client-side<br />First image can take 10–30 seconds.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ai-app {
  min-height: 100vh;
  background: radial-gradient(ellipse at top, #2a1b4f 0%, #0d0820 60%);
  color: #f1e6ff;
  font-family: 'Nunito', 'Inter', system-ui, sans-serif;
  display: flex; flex-direction: column;
}
.ai-hud {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 18px;
  background: rgba(13, 8, 32, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #3a2766;
}
.ai-back, .ai-iconbtn {
  background: #3a2766; border: none; color: #f1e6ff;
  width: 38px; height: 38px; border-radius: 10px;
  cursor: pointer; font-size: 18px;
}
.ai-iconbtn:hover, .ai-back:hover { background: #553d8c; }
.ai-iconbtn.mic.on { background: #ff4b82; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.ai-brand { font-weight: 900; font-size: 20px; }
.ai-brand-sub { font-size: 12px; color: #bca6e0; font-weight: 500; }
.ai-tabs { margin-left: auto; display: flex; gap: 6px; }
.ai-tabs button {
  background: #3a2766; color: #f1e6ff; border: none;
  padding: 8px 16px; border-radius: 10px; cursor: pointer;
  font-weight: 700;
}
.ai-tabs button.active { background: #ff4b82; }

.ai-voice {
  position: fixed; top: 72px; right: 18px;
  background: #2a1b4f; border: 2px solid #3a2766;
  border-radius: 14px; padding: 14px;
  display: grid; gap: 10px; z-index: 20; width: 320px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6);
}
.ai-voice label { display: grid; gap: 4px; font-size: 14px; }
.ai-voice select { background: #0d0820; border: 1px solid #3a2766; color: #f1e6ff; padding: 6px; border-radius: 8px; }

/* CHAT */
.ai-chat { flex: 1; display: flex; flex-direction: column; max-width: 900px; margin: 0 auto; width: 100%; padding: 16px; }
.ai-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 10px; }
.ai-msg { display: flex; gap: 10px; align-items: flex-start; }
.ai-msg.user { flex-direction: row-reverse; }
.ai-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: #3a2766; display: grid; place-items: center; font-size: 22px; flex-shrink: 0;
}
.ai-msg.user .ai-avatar { background: #ff4b82; }
.ai-bubble {
  background: #2a1b4f; padding: 12px 16px; border-radius: 16px;
  max-width: 75%; line-height: 1.45; border: 2px solid #3a2766;
}
.ai-msg.user .ai-bubble { background: #ff4b82; border-color: #ff4b82; }

.ai-input-row { display: flex; gap: 8px; padding: 10px 0; align-items: center; }
.ai-input {
  flex: 1; padding: 14px 18px; border-radius: 999px;
  border: 2px solid #3a2766; background: #1a1030; color: #f1e6ff;
  font-family: inherit; font-size: 16px;
}
.ai-input:focus { outline: none; border-color: #ff4b82; }
.ai-input.big { font-size: 18px; padding: 18px 22px; }

.ai-btn {
  background: #ff4b82; color: white; border: none;
  padding: 12px 22px; border-radius: 999px;
  font-weight: 900; cursor: pointer; font-size: 15px;
  box-shadow: 0 4px 0 #b83263;
}
.ai-btn:hover:not(:disabled) { filter: brightness(1.1); }
.ai-btn:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 2px 0 #b83263; }
.ai-btn:disabled { background: #3a2766; color: #7a6199; box-shadow: 0 4px 0 #261846; cursor: not-allowed; }
.ai-btn.ghost { background: transparent; border: 2px solid #3a2766; color: #bca6e0; box-shadow: none; }
.ai-btn.mini { padding: 6px 12px; font-size: 13px; box-shadow: 0 2px 0 #b83263; }
.ai-btn.big { padding: 16px 32px; font-size: 18px; width: 100%; }
.ai-btn.close { background: #3a2766; box-shadow: 0 2px 0 #261846; }

/* IMAGE */
.ai-image { max-width: 1000px; width: 100%; margin: 0 auto; padding: 20px; }
.ai-image-form { display: grid; gap: 14px; margin-bottom: 20px; }
.ai-styles { display: flex; flex-wrap: wrap; gap: 8px; }
.ai-style {
  background: #2a1b4f; border: 2px solid #3a2766; color: #f1e6ff;
  padding: 8px 14px; border-radius: 999px; cursor: pointer; font-weight: 700;
}
.ai-style.active { background: #ff4b82; border-color: #ff4b82; }
.ai-error { background: #7f1d1d; color: #fecaca; padding: 10px 14px; border-radius: 10px; }

.ai-loader { text-align: center; padding: 40px; }
.ai-spin { font-size: 60px; animation: spin 2s infinite; }
@keyframes spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }

.ai-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.ai-gal-item {
  background: #2a1b4f; border-radius: 14px; overflow: hidden; border: 2px solid #3a2766;
}
.ai-gal-imgwrap { position: relative; aspect-ratio: 1; background: #1a1030; }
.ai-gal-item img { width: 100%; display: block; aspect-ratio: 1; object-fit: cover; }
.ai-gal-overlay {
  position: absolute; inset: 0; display: grid; place-items: center; gap: 10px;
  background: rgba(13, 8, 32, 0.88); color: #f1e6ff; text-align: center;
  font-weight: 700; z-index: 2; padding: 14px;
}
.ai-gal-overlay.err { background: rgba(127, 29, 29, 0.9); }
.ai-gal-info { padding: 10px; display: grid; gap: 6px; }
.ai-gal-prompt { font-size: 14px; font-style: italic; }
.ai-gal-style { font-size: 11px; color: #bca6e0; text-transform: uppercase; letter-spacing: 1px; }
.ai-gal-actions { display: flex; gap: 6px; justify-content: space-between; }

.ai-empty { text-align: center; padding: 50px 20px; color: #bca6e0; }
.ai-empty-icon { font-size: 80px; opacity: 0.4; }
.ai-hint { font-size: 12px; opacity: 0.7; margin-top: 4px; }
</style>
