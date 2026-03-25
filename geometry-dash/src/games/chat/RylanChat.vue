<template>
  <div class="chat-app">
    <!-- Login Screen -->
    <div v-if="!loggedIn" class="login-screen">
      <div class="login-card">
        <div class="login-logo">💬</div>
        <h1 class="login-title">Rylan Chat</h1>
        <p class="login-sub">Chat, voice call, and video call with friends!</p>
        <div class="login-form">
          <input
            v-model="username"
            type="text"
            placeholder="Pick a username"
            maxlength="20"
            class="login-input"
            @keydown.enter="login"
          />
          <button class="login-btn" @click="login" :disabled="!username.trim()">Join Chat</button>
        </div>
        <button class="back-btn" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Main Chat App -->
    <div v-else class="chat-shell">
      <!-- Sidebar -->
      <div class="chat-sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-top">
          <h2 class="app-title">💬 Rylan Chat</h2>
          <button class="sidebar-close" @click="sidebarOpen = false">✕</button>
        </div>

        <!-- User Info -->
        <div class="user-info">
          <div class="user-avatar" :style="{ background: getColor(username) }">
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <span class="user-name">{{ username }}</span>
          <span class="online-dot"></span>
        </div>

        <!-- Online Users -->
        <div class="section-label">Online ({{ onlineUsers.length }})</div>
        <div class="online-list">
          <div
            v-for="user in onlineUsers"
            :key="user.name"
            class="online-user"
            @click="startDM(user.name)"
          >
            <div class="user-avatar-sm" :style="{ background: getColor(user.name) }">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <span class="online-name">{{ user.name }}</span>
            <span class="online-indicator"></span>
          </div>
        </div>

        <!-- Chat Rooms -->
        <div class="section-label">Rooms</div>
        <div class="room-list">
          <div
            v-for="room in rooms"
            :key="room.id"
            class="room-item"
            :class="{ active: currentRoom === room.id }"
            @click="switchRoom(room.id)"
          >
            <span class="room-icon">{{ room.icon }}</span>
            <span class="room-name">{{ room.name }}</span>
          </div>
        </div>

        <div class="sidebar-bottom">
          <button class="logout-btn" @click="logout">Log Out</button>
        </div>
      </div>

      <!-- Main Area -->
      <div class="chat-main">
        <!-- Top Bar -->
        <div class="chat-topbar">
          <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>
          <span class="room-title">{{ currentRoomName }}</span>
          <div class="call-buttons">
            <button
              class="call-btn voice-call"
              :class="{ active: inVoiceCall }"
              @click="toggleVoiceCall"
              title="Voice Call"
            >
              🎤
            </button>
            <button
              class="call-btn video-call"
              :class="{ active: inVideoCall }"
              @click="toggleVideoCall"
              title="Video Call"
            >
              📹
            </button>
          </div>
        </div>

        <!-- Video Call Area -->
        <div v-if="inVideoCall" class="video-area">
          <div class="video-grid">
            <div class="video-box self-video">
              <video ref="localVideo" autoplay muted playsinline></video>
              <span class="video-label">{{ username }} (You)</span>
            </div>
            <div v-for="peer in connectedPeers" :key="peer" class="video-box">
              <div class="video-placeholder">
                <div class="placeholder-avatar" :style="{ background: getColor(peer) }">
                  {{ peer.charAt(0).toUpperCase() }}
                </div>
              </div>
              <span class="video-label">{{ peer }}</span>
            </div>
          </div>
          <div class="call-controls">
            <button class="ctrl-btn" :class="{ off: micMuted }" @click="toggleMic">
              {{ micMuted ? '🔇' : '🎤' }}
            </button>
            <button class="ctrl-btn" :class="{ off: camOff }" @click="toggleCam">
              {{ camOff ? '📷' : '📹' }}
            </button>
            <button class="ctrl-btn end-call" @click="endCall">
              📞
            </button>
          </div>
        </div>

        <!-- Voice Call Banner -->
        <div v-else-if="inVoiceCall" class="voice-banner">
          <span class="voice-icon-pulse">🎤</span>
          <span>In voice call - {{ currentRoomName }}</span>
          <div class="call-controls-mini">
            <button class="ctrl-btn-sm" :class="{ off: micMuted }" @click="toggleMic">
              {{ micMuted ? '🔇' : '🎤' }}
            </button>
            <button class="ctrl-btn-sm end-call" @click="endCall">📞</button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-area" ref="messagesContainer">
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            class="message"
            :class="{ own: msg.sender === username, system: msg.type === 'system' }"
          >
            <div v-if="msg.type === 'system'" class="system-msg">
              {{ msg.text }}
            </div>
            <template v-else>
              <div class="msg-avatar" :style="{ background: getColor(msg.sender) }">
                {{ msg.sender.charAt(0).toUpperCase() }}
              </div>
              <div class="msg-content">
                <div class="msg-header">
                  <span class="msg-sender">{{ msg.sender }}</span>
                  <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                </div>
                <div class="msg-text">{{ msg.text }}</div>
              </div>
            </template>
          </div>
          <div v-if="currentMessages.length === 0" class="no-messages">
            No messages yet. Say hi! 👋
          </div>
        </div>

        <!-- Filter Warning -->
        <div v-if="filterWarning" class="filter-warning">{{ filterWarning }}</div>

        <!-- Message Input -->
        <div class="message-input-area">
          <div class="input-row">
            <button class="emoji-btn" @click="showEmojis = !showEmojis">😀</button>
            <input
              v-model="messageText"
              type="text"
              placeholder="Type a message..."
              class="message-input"
              maxlength="500"
              @keydown.enter="sendMessage"
            />
            <button class="send-btn" @click="sendMessage" :disabled="!messageText.trim()">
              ➤
            </button>
          </div>
          <!-- Emoji Picker -->
          <div v-if="showEmojis" class="emoji-picker">
            <span
              v-for="emoji in emojis"
              :key="emoji"
              class="emoji-item"
              @click="addEmoji(emoji)"
            >{{ emoji }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../../firebase'
import { ref as dbRef, push, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database'

// State
const loggedIn = ref(false)
const username = ref('')
const messageText = ref('')
const currentRoom = ref('general')
const sidebarOpen = ref(true)
const showEmojis = ref(false)
const inVoiceCall = ref(false)
const inVideoCall = ref(false)
const micMuted = ref(false)
const camOff = ref(false)
const localVideo = ref<HTMLVideoElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const localStream = ref<MediaStream | null>(null)

interface Message {
  id: string
  sender: string
  text: string
  room: string
  timestamp: number
  type: 'message' | 'system'
}

interface OnlineUser {
  name: string
  joinedAt: number
}

const messages = ref<Message[]>([])
const onlineUsers = ref<OnlineUser[]>([])
const connectedPeers = ref<string[]>([])

const rooms = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'memes', name: 'Memes', icon: '😂' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'random', name: 'Random', icon: '🎲' },
]

const emojis = [
  '😀', '😂', '🤣', '😎', '🥳', '😭', '💀', '🔥', '❤️', '👍',
  '👎', '🎮', '🏆', '⭐', '💯', '🤡', '👻', '🧠', '💪', '✅',
  '❌', '🎵', '🎶', '🤔', '😱', '🥶', '🫡', '💀', '☠️', '🤯',
  '😈', '👀', '🗿', '💩', '🦆', '🐐', '🍕', '🎉', '🚀', '⚡',
]

// Computed
const currentMessages = computed(() => {
  return messages.value
    .filter(m => m.room === currentRoom.value)
    .sort((a, b) => a.timestamp - b.timestamp)
})

const currentRoomName = computed(() => {
  const room = rooms.find(r => r.id === currentRoom.value)
  return room ? `${room.icon} ${room.name}` : currentRoom.value
})

// Functions
function getColor(name: string): string {
  const colors = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#5a67d8', '#805ad5', '#d53f8c']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function login() {
  if (!username.value.trim()) return
  loggedIn.value = true
  localStorage.setItem('chatUsername', username.value)

  // Set online status
  const userRef = dbRef(db, `chat/online/${username.value}`)
  set(userRef, { name: username.value, joinedAt: Date.now() })
  onDisconnect(userRef).remove()

  // Send join message
  const msgRef = dbRef(db, 'chat/messages')
  push(msgRef, {
    sender: 'System',
    text: `${username.value} joined the chat!`,
    room: 'general',
    timestamp: Date.now(),
    type: 'system',
  })

  // Listen for messages
  onValue(dbRef(db, 'chat/messages'), (snapshot) => {
    const data = snapshot.val()
    if (!data) { messages.value = []; return }
    messages.value = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      sender: val.sender,
      text: val.text,
      room: val.room,
      timestamp: val.timestamp,
      type: val.type || 'message',
    }))
    nextTick(() => scrollToBottom())
  })

  // Listen for online users
  onValue(dbRef(db, 'chat/online'), (snapshot) => {
    const data = snapshot.val()
    if (!data) { onlineUsers.value = []; return }
    onlineUsers.value = Object.values(data) as OnlineUser[]
  })

  // Listen for calls
  onValue(dbRef(db, `chat/calls/${currentRoom.value}`), (snapshot) => {
    const data = snapshot.val()
    if (!data) { connectedPeers.value = []; return }
    connectedPeers.value = Object.keys(data).filter(name => name !== username.value)
  })
}

function logout() {
  // Remove online status
  remove(dbRef(db, `chat/online/${username.value}`))

  // Send leave message
  push(dbRef(db, 'chat/messages'), {
    sender: 'System',
    text: `${username.value} left the chat.`,
    room: currentRoom.value,
    timestamp: Date.now(),
    type: 'system',
  })

  endCall()
  loggedIn.value = false
}

const badWords = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap',
  'dick', 'pussy', 'cock', 'bastard', 'slut', 'whore',
  'nigga', 'nigger', 'fag', 'faggot', 'retard', 'retarded',
  'stfu', 'wtf', 'kys', 'kill yourself',
]

const filterWarning = ref('')

function filterMessage(text: string): { clean: boolean; filtered: string } {
  let filtered = text
  let clean = true
  const lower = text.toLowerCase()
  for (const word of badWords) {
    // Check for the bad word with word boundaries
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    if (regex.test(lower)) {
      clean = false
      const stars = '*'.repeat(word.length)
      filtered = filtered.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), stars)
    }
  }
  return { clean, filtered }
}

function sendMessage() {
  if (!messageText.value.trim()) return

  const { filtered } = filterMessage(messageText.value.trim())

  if (filtered !== messageText.value.trim()) {
    filterWarning.value = 'Watch your language! Message was filtered.'
    setTimeout(() => { filterWarning.value = '' }, 3000)
  }

  const msgRef = dbRef(db, 'chat/messages')
  push(msgRef, {
    sender: username.value,
    text: filtered,
    room: currentRoom.value,
    timestamp: Date.now(),
    type: 'message',
  })
  messageText.value = ''
  showEmojis.value = false
}

function addEmoji(emoji: string) {
  messageText.value += emoji
}

function switchRoom(roomId: string) {
  if (inVoiceCall.value || inVideoCall.value) {
    endCall()
  }
  currentRoom.value = roomId
  sidebarOpen.value = false
}

function startDM(otherUser: string) {
  if (otherUser === username.value) return
  // Create a DM room ID (alphabetical order so both users get same room)
  const dmId = [username.value, otherUser].sort().join('-dm-')
  // Add DM room if not exists
  const existingRoom = rooms.find(r => r.id === dmId)
  if (!existingRoom) {
    rooms.push({ id: dmId, name: `DM: ${otherUser}`, icon: '✉️' })
  }
  switchRoom(dmId)
}

async function toggleVoiceCall() {
  if (inVoiceCall.value) {
    endCall()
    return
  }
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    inVoiceCall.value = true
    inVideoCall.value = false

    // Register in call
    set(dbRef(db, `chat/calls/${currentRoom.value}/${username.value}`), {
      type: 'voice',
      timestamp: Date.now(),
    })
    onDisconnect(dbRef(db, `chat/calls/${currentRoom.value}/${username.value}`)).remove()

    push(dbRef(db, 'chat/messages'), {
      sender: 'System',
      text: `${username.value} started a voice call in ${currentRoomName.value}`,
      room: currentRoom.value,
      timestamp: Date.now(),
      type: 'system',
    })
  } catch {
    alert('Could not access microphone! Check your permissions.')
  }
}

async function toggleVideoCall() {
  if (inVideoCall.value) {
    endCall()
    return
  }
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    inVideoCall.value = true
    inVoiceCall.value = false

    nextTick(() => {
      if (localVideo.value && localStream.value) {
        localVideo.value.srcObject = localStream.value
      }
    })

    // Register in call
    set(dbRef(db, `chat/calls/${currentRoom.value}/${username.value}`), {
      type: 'video',
      timestamp: Date.now(),
    })
    onDisconnect(dbRef(db, `chat/calls/${currentRoom.value}/${username.value}`)).remove()

    push(dbRef(db, 'chat/messages'), {
      sender: 'System',
      text: `${username.value} started a video call in ${currentRoomName.value}`,
      room: currentRoom.value,
      timestamp: Date.now(),
      type: 'system',
    })
  } catch {
    alert('Could not access camera/microphone! Check your permissions.')
  }
}

function toggleMic() {
  micMuted.value = !micMuted.value
  if (localStream.value) {
    localStream.value.getAudioTracks().forEach(track => {
      track.enabled = !micMuted.value
    })
  }
}

function toggleCam() {
  camOff.value = !camOff.value
  if (localStream.value) {
    localStream.value.getVideoTracks().forEach(track => {
      track.enabled = !camOff.value
    })
  }
}

function endCall() {
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }
  inVoiceCall.value = false
  inVideoCall.value = false
  micMuted.value = false
  camOff.value = false
  remove(dbRef(db, `chat/calls/${currentRoom.value}/${username.value}`))
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for room changes to update call listeners
watch(currentRoom, (newRoom) => {
  onValue(dbRef(db, `chat/calls/${newRoom}`), (snapshot) => {
    const data = snapshot.val()
    if (!data) { connectedPeers.value = []; return }
    connectedPeers.value = Object.keys(data).filter(name => name !== username.value)
  })
})

onMounted(() => {
  const saved = localStorage.getItem('chatUsername')
  if (saved) username.value = saved
})

onUnmounted(() => {
  if (loggedIn.value) {
    remove(dbRef(db, `chat/online/${username.value}`))
    endCall()
  }
})
</script>

<style scoped>
.chat-app {
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #1a1a2e;
}

/* ===== LOGIN ===== */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
}

.login-card {
  background: #16213e;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #1a3a5c;
  max-width: 360px;
  width: 100%;
}

.login-logo { font-size: 64px; margin-bottom: 8px; }
.login-title { color: #fff; font-size: 28px; font-weight: 800; margin: 0 0 8px 0; }
.login-sub { color: #8892b0; font-size: 14px; margin: 0 0 28px 0; }

.login-form { display: flex; flex-direction: column; gap: 12px; }

.login-input {
  padding: 14px 18px;
  border-radius: 12px;
  border: 2px solid #1a3a5c;
  background: #0f1a2e;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}
.login-input:focus { border-color: #5a67d8; }
.login-input::placeholder { color: #4a5568; }

.login-btn {
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
.login-btn:hover { transform: translateY(-2px); }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.back-btn {
  margin-top: 16px;
  background: none;
  border: none;
  color: #8892b0;
  font-size: 14px;
  cursor: pointer;
}
.back-btn:hover { color: #fff; }

/* ===== CHAT SHELL ===== */
.chat-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== SIDEBAR ===== */
.chat-sidebar {
  width: 260px;
  background: #16213e;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1a3a5c;
  flex-shrink: 0;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #1a3a5c;
}

.app-title { color: #fff; font-size: 18px; font-weight: 800; margin: 0; }
.sidebar-close { display: none; background: none; border: none; color: #8892b0; font-size: 20px; cursor: pointer; }

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid #1a3a5c;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.user-name { color: #fff; font-weight: 600; font-size: 15px; }

.online-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #38a169;
  margin-left: auto;
}

.section-label {
  color: #8892b0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 12px 16px 6px;
}

/* Online Users */
.online-list {
  max-height: 150px;
  overflow-y: auto;
}

.online-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.online-user:hover { background: #1a3a5c; }

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}

.online-name { color: #ccd6f6; font-size: 13px; }

.online-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38a169;
  margin-left: auto;
}

/* Rooms */
.room-list { flex: 1; overflow-y: auto; }

.room-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  color: #8892b0;
  font-size: 14px;
  font-weight: 500;
}
.room-item:hover { background: #1a3a5c; color: #ccd6f6; }
.room-item.active { background: #1a3a5c; color: #fff; font-weight: 600; }
.room-icon { font-size: 18px; }

.sidebar-bottom { padding: 12px 16px; border-top: 1px solid #1a3a5c; }

.logout-btn {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e53e3e;
  background: none;
  color: #e53e3e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.logout-btn:hover { background: #e53e3e; color: #fff; }

/* ===== MAIN AREA ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #1a1a2e;
}

/* Top Bar */
.chat-topbar {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #16213e;
  border-bottom: 1px solid #1a3a5c;
  gap: 12px;
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.room-title { color: #fff; font-size: 18px; font-weight: 700; flex: 1; }

.call-buttons { display: flex; gap: 8px; }

.call-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #1a3a5c;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.call-btn:hover { background: #2a4a6c; transform: scale(1.1); }
.call-btn.active { background: #38a169; animation: pulse-call 1.5s ease-in-out infinite; }

@keyframes pulse-call {
  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 161, 105, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(56, 161, 105, 0); }
}

/* Video Area */
.video-area {
  background: #0f1a2e;
  border-bottom: 1px solid #1a3a5c;
  padding: 16px;
}

.video-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 12px;
}

.video-box {
  width: 240px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #16213e;
  border: 2px solid #1a3a5c;
}

.video-box video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 28px;
}

.video-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.ctrl-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #1a3a5c;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ctrl-btn:hover { background: #2a4a6c; }
.ctrl-btn.off { background: #e53e3e; }
.ctrl-btn.end-call { background: #e53e3e; }
.ctrl-btn.end-call:hover { background: #c53030; }

/* Voice Banner */
.voice-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #276749, #38a169);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.voice-icon-pulse { font-size: 20px; animation: pulse-call 1.5s ease-in-out infinite; }

.call-controls-mini { display: flex; gap: 8px; margin-left: auto; }

.ctrl-btn-sm {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ctrl-btn-sm.off { background: #e53e3e; }
.ctrl-btn-sm.end-call { background: #e53e3e; }

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}

.message.own { flex-direction: row-reverse; }

.message.system {
  justify-content: center;
}

.system-msg {
  color: #8892b0;
  font-size: 12px;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.msg-content { max-width: 70%; }

.msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
.message.own .msg-header { flex-direction: row-reverse; }

.msg-sender { color: #ccd6f6; font-size: 13px; font-weight: 700; }
.msg-time { color: #4a5568; font-size: 11px; }

.msg-text {
  background: #16213e;
  color: #e2e8f0;
  padding: 10px 14px;
  border-radius: 12px 12px 12px 4px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.message.own .msg-text {
  background: #5a67d8;
  color: #fff;
  border-radius: 12px 12px 4px 12px;
}

.no-messages {
  color: #4a5568;
  text-align: center;
  font-size: 16px;
  margin-top: 40px;
}

/* Message Input */
.message-input-area {
  padding: 12px 20px;
  background: #16213e;
  border-top: 1px solid #1a3a5c;
}

.input-row { display: flex; gap: 8px; align-items: center; }

.emoji-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #1a3a5c;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
}
.emoji-btn:hover { background: #2a4a6c; }

.message-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 24px;
  border: 2px solid #1a3a5c;
  background: #0f1a2e;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.message-input:focus { border-color: #5a67d8; }
.message-input::placeholder { color: #4a5568; }

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #5a67d8;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send-btn:hover { background: #4c51bf; transform: scale(1.1); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Emoji Picker */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px 0;
  max-height: 120px;
  overflow-y: auto;
}

.emoji-item {
  font-size: 24px;
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}
.emoji-item:hover { background: #1a3a5c; }

/* Filter Warning */
.filter-warning {
  padding: 8px 20px;
  background: #e53e3e;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

/* ===== MOBILE ===== */
@media (max-width: 700px) {
  .chat-sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.25s;
  }
  .chat-sidebar.open { left: 0; }
  .sidebar-close { display: block; }
  .menu-btn { display: block; }
  .video-box { width: 160px; height: 120px; }
}
</style>
