<template>
  <div class="feedback-app">
    <!-- Header -->
    <div class="feedback-header">
      <button class="back-btn" @click="$router.push('/')">← Back</button>
      <h1 class="feedback-title">💡 Feedback</h1>
      <p class="feedback-sub">Got an idea for a new game? Want something improved? Tell us!</p>
    </div>

    <!-- Submit Form -->
    <div class="submit-card">
      <div class="form-row">
        <div class="form-group">
          <label>Your Name</label>
          <input v-model="authorName" type="text" placeholder="What's your name?" maxlength="20" class="form-input" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <div class="category-picker">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="cat-chip"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <span>{{ cat.icon }}</span>
              <span>{{ cat.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Your Idea</label>
        <textarea
          v-model="ideaText"
          placeholder="Describe your idea..."
          maxlength="500"
          rows="3"
          class="form-textarea"
        ></textarea>
        <span class="char-count">{{ ideaText.length }}/500</span>
      </div>
      <button class="submit-btn" @click="submitIdea" :disabled="!ideaText.trim() || !authorName.trim()">
        Submit Idea ✨
      </button>
    </div>

    <!-- Ideas Feed -->
    <div class="feed-header">
      <h2 class="feed-title">All Ideas ({{ ideas.length }})</h2>
      <div class="sort-buttons">
        <button class="sort-btn" :class="{ active: sortBy === 'newest' }" @click="sortBy = 'newest'">Newest</button>
        <button class="sort-btn" :class="{ active: sortBy === 'popular' }" @click="sortBy = 'popular'">Most Liked</button>
      </div>
    </div>

    <div v-if="sortedIdeas.length === 0" class="no-ideas">
      No ideas yet. Be the first to share one! 🚀
    </div>

    <div class="ideas-feed">
      <div v-for="idea in sortedIdeas" :key="idea.id" class="idea-card">
        <div class="idea-vote">
          <button class="vote-btn" :class="{ voted: idea.likedByMe }" @click="toggleLike(idea.id)">
            ▲
          </button>
          <span class="vote-count">{{ idea.likes }}</span>
        </div>
        <div class="idea-content">
          <div class="idea-top">
            <span class="idea-cat-badge" :style="{ background: getCatColor(idea.category) }">
              {{ getCatIcon(idea.category) }} {{ getCatLabel(idea.category) }}
            </span>
            <span class="idea-time">{{ timeAgo(idea.timestamp) }}</span>
          </div>
          <div class="idea-text-row">
            <div class="idea-text">{{ idea.text }}</div>
            <button class="copy-btn" @click="copyText(idea.text)" title="Copy to clipboard">{{ copiedId === idea.text ? '✅' : '📋' }}</button>
          </div>
          <div class="idea-author">— {{ idea.author }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db } from '../../firebase'
import { ref as dbRef, push, onValue, set, get } from 'firebase/database'

const authorName = ref('')
const ideaText = ref('')
const selectedCategory = ref('new-game')
const sortBy = ref<'newest' | 'popular'>('newest')

interface Idea {
  id: string
  author: string
  text: string
  category: string
  timestamp: number
  likes: number
  likedByMe: boolean
}

const ideas = ref<Idea[]>([])

const categories = [
  { id: 'new-game', label: 'New Game', icon: '🎮' },
  { id: 'improve', label: 'Improve a Game', icon: '⬆️' },
  { id: 'bug', label: 'Bug Report', icon: '🐛' },
  { id: 'other', label: 'Other', icon: '💭' },
]

const sortedIdeas = computed(() => {
  const sorted = [...ideas.value]
  if (sortBy.value === 'newest') {
    sorted.sort((a, b) => b.timestamp - a.timestamp)
  } else {
    sorted.sort((a, b) => b.likes - a.likes)
  }
  return sorted
})

function getCatColor(id: string): string {
  const colors: Record<string, string> = { 'new-game': '#5a67d8', improve: '#38a169', bug: '#e53e3e', other: '#d69e2e' }
  return colors[id] || '#5a67d8'
}

function getCatIcon(id: string): string {
  const cat = categories.find(c => c.id === id)
  return cat ? cat.icon : '💭'
}

function getCatLabel(id: string): string {
  const cat = categories.find(c => c.id === id)
  return cat ? cat.label : 'Other'
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).then(() => {
    copiedId.value = text
    setTimeout(() => { copiedId.value = '' }, 1500)
  })
}

const copiedId = ref('')

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getMyId(): string {
  let id = localStorage.getItem('feedbackUserId')
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('feedbackUserId', id)
  }
  return id
}

function submitIdea() {
  if (!ideaText.value.trim() || !authorName.value.trim()) return

  const feedbackRef = dbRef(db, 'feedback/ideas')
  push(feedbackRef, {
    author: authorName.value.trim(),
    text: ideaText.value.trim(),
    category: selectedCategory.value,
    timestamp: Date.now(),
    likes: 0,
    likedBy: {},
  })

  localStorage.setItem('feedbackName', authorName.value)
  ideaText.value = ''
}

async function toggleLike(ideaId: string) {
  const myId = getMyId()
  const likeRef = dbRef(db, `feedback/ideas/${ideaId}/likedBy/${myId}`)
  const likesRef = dbRef(db, `feedback/ideas/${ideaId}/likes`)

  const idea = ideas.value.find(i => i.id === ideaId)
  if (!idea) return

  if (idea.likedByMe) {
    set(likeRef, null)
    set(likesRef, Math.max(0, idea.likes - 1))
  } else {
    set(likeRef, true)
    set(likesRef, idea.likes + 1)
  }
}

onMounted(() => {
  const savedName = localStorage.getItem('feedbackName')
  if (savedName) authorName.value = savedName

  const myId = getMyId()

  onValue(dbRef(db, 'feedback/ideas'), (snapshot) => {
    const data = snapshot.val()
    if (!data) { ideas.value = []; return }
    ideas.value = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      author: val.author,
      text: val.text,
      category: val.category || 'other',
      timestamp: val.timestamp,
      likes: val.likes || 0,
      likedByMe: !!(val.likedBy && val.likedBy[myId]),
    }))
  })
})
</script>

<style scoped>
.feedback-app {
  min-height: 100vh;
  background: #1a1a2e;
  color: #fff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  padding: 20px;
  max-width: 700px;
  margin: 0 auto;
}

/* Header */
.feedback-header { text-align: center; margin-bottom: 24px; }

.back-btn {
  position: absolute;
  left: 20px;
  top: 20px;
  background: #2a2a4a;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
}
.back-btn:hover { background: #3a3a5a; }

.feedback-title { font-size: 36px; font-weight: 800; margin: 0 0 8px 0; }
.feedback-sub { color: #8892b0; font-size: 16px; margin: 0; }

/* Submit Card */
.submit-card {
  background: #16213e;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 28px;
  border: 1px solid #1a3a5c;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  flex: 1;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input, .form-textarea {
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid #1a3a5c;
  background: #0f1a2e;
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-input:focus, .form-textarea:focus { border-color: #5a67d8; }
.form-input::placeholder, .form-textarea::placeholder { color: #4a5568; }

.form-textarea { resize: vertical; min-height: 80px; }

.char-count {
  font-size: 11px;
  color: #4a5568;
  text-align: right;
  margin-top: 2px;
}

/* Category Picker */
.category-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: #0f1a2e;
  border: 2px solid #1a3a5c;
  color: #8892b0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-chip:hover { border-color: #5a67d8; color: #ccd6f6; }
.cat-chip.active { border-color: #5a67d8; background: #5a67d8; color: #fff; }

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #5a67d8, #7c3aed);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}
.submit-btn:hover { transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Feed */
.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.feed-title { font-size: 20px; font-weight: 800; margin: 0; }

.sort-buttons { display: flex; gap: 6px; }

.sort-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #1a3a5c;
  background: none;
  color: #8892b0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.sort-btn:hover { color: #fff; }
.sort-btn.active { background: #5a67d8; color: #fff; border-color: #5a67d8; }

.no-ideas {
  text-align: center;
  color: #4a5568;
  font-size: 18px;
  padding: 40px 0;
}

/* Ideas */
.ideas-feed { display: flex; flex-direction: column; gap: 12px; padding-bottom: 40px; }

.idea-card {
  display: flex;
  gap: 14px;
  background: #16213e;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #1a3a5c;
  transition: border-color 0.15s;
}
.idea-card:hover { border-color: #2a4a6c; }

/* Vote */
.idea-vote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 40px;
}

.vote-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #1a3a5c;
  background: none;
  color: #8892b0;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vote-btn:hover { border-color: #5a67d8; color: #5a67d8; }
.vote-btn.voted { border-color: #5a67d8; background: #5a67d8; color: #fff; }

.vote-count { font-size: 14px; font-weight: 700; color: #ccd6f6; }

/* Idea Content */
.idea-content { flex: 1; min-width: 0; }

.idea-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }

.idea-cat-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.idea-time { font-size: 11px; color: #4a5568; }

.idea-text-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.idea-text {
  font-size: 15px;
  color: #e2e8f0;
  line-height: 1.5;
  margin-bottom: 6px;
  word-break: break-word;
  flex: 1;
}

.copy-btn {
  background: none;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.copy-btn:hover {
  background: #334155;
  border-color: #475569;
}

.idea-author { font-size: 13px; color: #8892b0; font-weight: 600; }

/* Mobile */
@media (max-width: 600px) {
  .feedback-app { padding: 14px; }
  .form-row { flex-direction: column; gap: 4px; }
  .submit-card { padding: 16px; }
  .back-btn { position: static; margin-bottom: 12px; }
  .feedback-header { text-align: left; }
}
</style>
