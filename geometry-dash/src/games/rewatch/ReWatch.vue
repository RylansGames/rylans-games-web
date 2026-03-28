<template>
  <div class="rw-app">
    <!-- Header -->
    <header class="rw-header">
      <button class="back-btn" @click="$router.push('/')">←</button>
      <div class="rw-logo" @click="currentView = 'home'; selectedVideo = null">
        <span class="logo-icon">▶</span>
        <span class="logo-text">Re Watch</span>
      </div>
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="Search videos..." class="search-input" />
      </div>
      <div class="header-right">
        <button class="add-btn" @click="showAddVideo = true">+ Add Video</button>
        <div class="user-avatar">{{ userName.charAt(0).toUpperCase() }}</div>
      </div>
    </header>

    <!-- Add Video Modal -->
    <div v-if="showAddVideo" class="modal-overlay" @click.self="showAddVideo = false">
      <div class="modal-card">
        <h2>Add a Video</h2>
        <p class="modal-sub">Paste a YouTube link to share with everyone!</p>
        <input v-model="newVideoUrl" type="text" placeholder="https://youtube.com/watch?v=..." class="modal-input" />
        <input v-model="newVideoTitle" type="text" placeholder="Video title" class="modal-input" maxlength="80" />
        <select v-model="newVideoCategory" class="modal-select">
          <option value="">Pick a category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
        </select>
        <div class="modal-actions">
          <button class="modal-cancel" @click="showAddVideo = false">Cancel</button>
          <button class="modal-submit" @click="addVideo" :disabled="!newVideoUrl || !newVideoTitle">Add Video</button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="rw-body">
      <!-- Sidebar -->
      <nav class="rw-sidebar">
        <div class="nav-item" :class="{ active: currentView === 'home' }" @click="currentView = 'home'; selectedVideo = null">
          🏠 Home
        </div>
        <div class="nav-item" :class="{ active: currentView === 'trending' }" @click="currentView = 'trending'; selectedVideo = null">
          🔥 Trending
        </div>
        <div class="nav-item" :class="{ active: currentView === 'liked' }" @click="currentView = 'liked'; selectedVideo = null">
          ❤️ Liked
        </div>
        <div class="nav-section">Categories</div>
        <div v-for="cat in categories" :key="cat.id" class="nav-item"
          :class="{ active: currentView === cat.id }" @click="currentView = cat.id; selectedVideo = null">
          {{ cat.icon }} {{ cat.name }}
        </div>
      </nav>

      <!-- Content Area -->
      <main class="rw-content">
        <!-- Video Player -->
        <div v-if="selectedVideo" class="video-player-section">
          <div class="video-player">
            <iframe
              :src="'https://www.youtube.com/embed/' + selectedVideo.youtubeId + '?autoplay=1'"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="video-iframe"
            ></iframe>
          </div>
          <div class="video-info">
            <h1 class="video-title">{{ selectedVideo.title }}</h1>
            <div class="video-meta">
              <span>{{ selectedVideo.views.toLocaleString() }} views</span>
              <span>{{ timeAgo(selectedVideo.addedAt) }}</span>
            </div>
            <div class="video-actions">
              <button class="vid-action" :class="{ liked: selectedVideo.likedByMe }" @click="toggleLikeVideo(selectedVideo.id)">
                ❤️ {{ selectedVideo.likes }}
              </button>
              <button class="vid-action" @click="shareVideo">📤 Share</button>
            </div>
            <div class="video-uploader">
              <div class="uploader-avatar" :style="{ background: getColor(selectedVideo.addedBy) }">
                {{ selectedVideo.addedBy.charAt(0).toUpperCase() }}
              </div>
              <span class="uploader-name">{{ selectedVideo.addedBy }}</span>
            </div>
          </div>

          <!-- Comments -->
          <div class="comments-section">
            <h3>Comments ({{ selectedVideo.comments?.length || 0 }})</h3>
            <div class="comment-input-row">
              <input v-model="commentText" type="text" placeholder="Add a comment..." class="comment-input"
                maxlength="200" @keydown.enter="addComment" />
              <button class="comment-send" @click="addComment" :disabled="!commentText.trim()">Send</button>
            </div>
            <div v-for="(c, i) in selectedVideo.comments || []" :key="i" class="comment">
              <div class="comment-avatar" :style="{ background: getColor(c.name) }">{{ c.name.charAt(0).toUpperCase() }}</div>
              <div class="comment-body">
                <span class="comment-name">{{ c.name }}</span>
                <span class="comment-time">{{ timeAgo(c.time) }}</span>
                <p class="comment-text">{{ c.text }}</p>
              </div>
            </div>
          </div>

          <button class="back-to-browse" @click="selectedVideo = null">← Back to videos</button>
        </div>

        <!-- Video Grid -->
        <div v-else>
          <h2 class="section-title">{{ currentViewTitle }}</h2>
          <div class="video-grid">
            <div v-for="video in filteredVideos" :key="video.id" class="video-card" @click="watchVideo(video)">
              <div class="thumb" :style="{ backgroundImage: 'url(https://img.youtube.com/vi/' + video.youtubeId + '/mqdefault.jpg)' }">
                <div class="thumb-overlay">▶</div>
                <div class="thumb-cat">{{ getCategoryIcon(video.category) }}</div>
              </div>
              <div class="card-info">
                <div class="card-title">{{ video.title }}</div>
                <div class="card-meta">
                  <span>{{ video.addedBy }}</span> · <span>{{ video.views.toLocaleString() }} views</span>
                  · <span>❤️ {{ video.likes }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="filteredVideos.length === 0" class="no-videos">
            No videos found. Be the first to add one! 🎬
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase'
import { ref as dbRef, push, onValue, set, get } from 'firebase/database'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'

interface Video {
  id: string
  title: string
  youtubeId: string
  category: string
  addedBy: string
  addedAt: number
  views: number
  likes: number
  likedByMe: boolean
  comments: { name: string; text: string; time: number }[]
}

const userName = ref('Player')
const searchQuery = ref('')
const currentView = ref('home')
const selectedVideo = ref<Video | null>(null)
const showAddVideo = ref(false)
const newVideoUrl = ref('')
const newVideoTitle = ref('')
const newVideoCategory = ref('')
const commentText = ref('')
const allVideos = ref<Video[]>([])

const categories = [
  { id: 'funny', name: 'Funny', icon: '😂' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'satisfying', name: 'Satisfying', icon: '✨' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'other', name: 'Other', icon: '📺' },
]

const currentViewTitle = computed(() => {
  if (currentView.value === 'home') return '🏠 Home'
  if (currentView.value === 'trending') return '🔥 Trending'
  if (currentView.value === 'liked') return '❤️ Liked Videos'
  const cat = categories.find(c => c.id === currentView.value)
  return cat ? `${cat.icon} ${cat.name}` : 'Videos'
})

const filteredVideos = computed(() => {
  let vids = [...allVideos.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    vids = vids.filter(v => v.title.toLowerCase().includes(q) || v.addedBy.toLowerCase().includes(q))
  }

  if (currentView.value === 'trending') {
    vids.sort((a, b) => b.views - a.views)
  } else if (currentView.value === 'liked') {
    vids = vids.filter(v => v.likedByMe)
  } else if (currentView.value !== 'home') {
    vids = vids.filter(v => v.category === currentView.value)
  }

  if (currentView.value === 'home') {
    vids.sort((a, b) => b.addedAt - a.addedAt)
  }

  return vids
})

function getColor(name: string): string {
  const colors = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#5a67d8', '#805ad5', '#d53f8c']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getCategoryIcon(catId: string): string {
  const cat = categories.find(c => c.id === catId)
  return cat ? cat.icon : '📺'
}

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

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

function getMyId(): string {
  let id = localStorage.getItem('rwUserId')
  if (!id) {
    id = 'rw-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('rwUserId', id)
  }
  return id
}

function addVideo() {
  const ytId = extractYoutubeId(newVideoUrl.value)
  if (!ytId || !newVideoTitle.value.trim()) return

  push(dbRef(db, 'rewatch/videos'), {
    title: newVideoTitle.value.trim(),
    youtubeId: ytId,
    category: newVideoCategory.value || 'other',
    addedBy: userName.value,
    addedAt: Date.now(),
    views: 0,
    likes: 0,
    likedBy: {},
    comments: [],
  })

  newVideoUrl.value = ''
  newVideoTitle.value = ''
  newVideoCategory.value = ''
  showAddVideo.value = false
}

function watchVideo(video: Video) {
  selectedVideo.value = video
  // Increment views
  const currentViews = video.views || 0
  set(dbRef(db, `rewatch/videos/${video.id}/views`), currentViews + 1)
}

function toggleLikeVideo(videoId: string) {
  const myId = getMyId()
  const video = allVideos.value.find(v => v.id === videoId)
  if (!video) return

  if (video.likedByMe) {
    set(dbRef(db, `rewatch/videos/${videoId}/likedBy/${myId}`), null)
    set(dbRef(db, `rewatch/videos/${videoId}/likes`), Math.max(0, video.likes - 1))
  } else {
    set(dbRef(db, `rewatch/videos/${videoId}/likedBy/${myId}`), true)
    set(dbRef(db, `rewatch/videos/${videoId}/likes`), video.likes + 1)
  }
}

function addComment() {
  if (!commentText.value.trim() || !selectedVideo.value) return
  const vid = selectedVideo.value
  const comments = vid.comments || []
  comments.push({ name: userName.value, text: commentText.value.trim(), time: Date.now() })
  set(dbRef(db, `rewatch/videos/${vid.id}/comments`), comments)
  commentText.value = ''
}

function shareVideo() {
  if (!selectedVideo.value) return
  const url = `https://rylansgames.com/games/rewatch?v=${selectedVideo.value.youtubeId}`
  navigator.clipboard?.writeText(url)
  alert('Link copied!')
}

function loadVideos() {
  const myId = getMyId()
  onValue(dbRef(db, 'rewatch/videos'), (snap) => {
    const data = snap.val()
    if (!data) { allVideos.value = []; return }
    allVideos.value = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      title: val.title,
      youtubeId: val.youtubeId,
      category: val.category || 'other',
      addedBy: val.addedBy || 'Unknown',
      addedAt: val.addedAt || 0,
      views: val.views || 0,
      likes: val.likes || 0,
      likedByMe: !!(val.likedBy && val.likedBy[myId]),
      comments: val.comments || [],
    }))

    // Update selected video if watching
    if (selectedVideo.value) {
      const updated = allVideos.value.find(v => v.id === selectedVideo.value!.id)
      if (updated) selectedVideo.value = updated
    }
  })
}

onMounted(() => {
  userName.value = gameState.getPlayerName() || localStorage.getItem('rwName') || 'Player'
  loadVideos()
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Re Watch')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Re Watch')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) {
      gameState.addCoins(action.amount)
    }
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
})
</script>

<style scoped>
.rw-app {
  min-height: 100vh; background: #0f0f0f; color: #fff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Header */
.rw-header {
  display: flex; align-items: center; gap: 12px; padding: 8px 16px;
  background: #1a1a1a; border-bottom: 1px solid #272727; position: sticky; top: 0; z-index: 20;
}
.back-btn {
  background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer; padding: 6px 10px;
}
.back-btn:hover { color: #fff; }
.rw-logo { display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0; }
.logo-icon {
  background: #e53e3e; color: #fff; width: 28px; height: 20px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.logo-text { font-size: 18px; font-weight: 800; color: #fff; }
.search-bar { flex: 1; max-width: 500px; margin: 0 auto; }
.search-input {
  width: 100%; padding: 8px 14px; border-radius: 20px; border: 1px solid #333;
  background: #121212; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;
}
.search-input:focus { border-color: #3b82f6; }
.search-input::placeholder { color: #666; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.add-btn {
  background: #e53e3e; color: #fff; border: none; padding: 6px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 700; cursor: pointer;
}
.add-btn:hover { background: #dc2626; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #5a67d8;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;
}

/* Body */
.rw-body { display: flex; min-height: calc(100vh - 50px); }

/* Sidebar */
.rw-sidebar {
  width: 200px; background: #0f0f0f; padding: 12px 0; flex-shrink: 0;
  border-right: 1px solid #1a1a1a; overflow-y: auto;
}
.nav-item {
  padding: 8px 20px; font-size: 13px; color: #aaa; cursor: pointer;
  transition: background 0.15s; font-weight: 500;
}
.nav-item:hover { background: #1a1a1a; color: #fff; }
.nav-item.active { background: #272727; color: #fff; font-weight: 700; }
.nav-section {
  padding: 16px 20px 6px; font-size: 11px; color: #666; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}

/* Content */
.rw-content { flex: 1; padding: 20px; overflow-y: auto; }
.section-title { font-size: 22px; font-weight: 800; margin: 0 0 16px; color: #fff; }

/* Video Grid */
.video-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}
.video-card { cursor: pointer; border-radius: 12px; overflow: hidden; transition: transform 0.15s; }
.video-card:hover { transform: translateY(-4px); }

.thumb {
  width: 100%; aspect-ratio: 16/9; background-size: cover; background-position: center;
  background-color: #1a1a1a; position: relative; border-radius: 12px;
}
.thumb-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.3); color: #fff; font-size: 36px; opacity: 0;
  transition: opacity 0.2s; border-radius: 12px;
}
.video-card:hover .thumb-overlay { opacity: 1; }
.thumb-cat {
  position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 2px 8px;
  border-radius: 4px; font-size: 12px;
}

.card-info { padding: 10px 4px; }
.card-title { font-size: 14px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { font-size: 12px; color: #888; }

/* Video Player */
.video-player-section { max-width: 900px; }
.video-player { width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; }
.video-iframe { width: 100%; height: 100%; }

.video-info { padding: 16px 0; }
.video-title { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
.video-meta { color: #888; font-size: 14px; display: flex; gap: 12px; margin-bottom: 12px; }
.video-actions { display: flex; gap: 8px; margin-bottom: 14px; }
.vid-action {
  background: #272727; border: none; color: #fff; padding: 8px 16px; border-radius: 20px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.vid-action:hover { background: #333; }
.vid-action.liked { background: #e53e3e; }

.video-uploader { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-top: 1px solid #272727; }
.uploader-avatar {
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; color: #fff; font-weight: 700; font-size: 16px;
}
.uploader-name { font-size: 15px; font-weight: 700; }

.back-to-browse {
  background: none; border: none; color: #3b82f6; font-size: 14px; cursor: pointer;
  padding: 12px 0; font-weight: 600;
}

/* Comments */
.comments-section { padding: 16px 0; border-top: 1px solid #272727; }
.comments-section h3 { font-size: 16px; margin: 0 0 12px; }
.comment-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
.comment-input {
  flex: 1; padding: 10px 14px; border-radius: 20px; border: 1px solid #333;
  background: #121212; color: #fff; font-size: 14px; outline: none;
}
.comment-input:focus { border-color: #3b82f6; }
.comment-send {
  background: #3b82f6; color: #fff; border: none; padding: 8px 18px; border-radius: 20px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.comment-send:disabled { opacity: 0.4; }

.comment { display: flex; gap: 10px; margin-bottom: 14px; }
.comment-avatar {
  width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; color: #fff; font-weight: 700; font-size: 13px; flex-shrink: 0;
}
.comment-body { flex: 1; }
.comment-name { font-size: 13px; font-weight: 700; color: #fff; margin-right: 8px; }
.comment-time { font-size: 11px; color: #666; }
.comment-text { font-size: 14px; color: #ccc; margin: 2px 0 0; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
  align-items: center; justify-content: center; z-index: 30;
}
.modal-card {
  background: #1a1a1a; border-radius: 16px; padding: 28px; max-width: 420px; width: 90%;
  border: 1px solid #333;
}
.modal-card h2 { color: #fff; margin: 0 0 4px; font-size: 22px; }
.modal-sub { color: #888; font-size: 14px; margin: 0 0 16px; }
.modal-input {
  width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #333;
  background: #0f0f0f; color: #fff; font-size: 14px; outline: none; margin-bottom: 10px;
  box-sizing: border-box;
}
.modal-input:focus { border-color: #3b82f6; }
.modal-select {
  width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #333;
  background: #0f0f0f; color: #fff; font-size: 14px; margin-bottom: 14px;
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.modal-cancel { background: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer; }
.modal-submit {
  background: #e53e3e; color: #fff; border: none; padding: 10px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 700; cursor: pointer;
}
.modal-submit:disabled { opacity: 0.4; }

.no-videos { text-align: center; color: #666; font-size: 18px; padding: 60px 0; }

/* Mobile */
@media (max-width: 700px) {
  .rw-sidebar { display: none; }
  .rw-header { gap: 8px; padding: 6px 10px; }
  .logo-text { display: none; }
  .add-btn { font-size: 12px; padding: 5px 10px; }
  .video-grid { grid-template-columns: 1fr; }
  .rw-content { padding: 12px; }
}
</style>
