<template>
  <div class="portal-root">
    <!-- Sign up / Login -->
    <AISignup
      v-if="currentView === 'signup'"
      @authenticated="onAuthenticated"
    />

    <!-- 3D Hub -->
    <AIHub
      v-else-if="currentView === 'hub'"
      :username="username"
      @navigate="handleNavigate"
      @logout="handleLogout"
      @back="goHome"
    />

    <!-- Level Editor -->
    <AILevelEditor
      v-else-if="currentView === 'editor'"
      :edit-level="editingLevel"
      @back="currentView = 'hub'"
      @test="testLevel"
    />

    <!-- Level Player -->
    <AILevelPlayer
      v-else-if="currentView === 'playing' && playingLevel"
      :level="playingLevel"
      @back="returnFromPlay"
      @won="onLevelWon"
    />

    <!-- Level Browser -->
    <AILevelBrowser
      v-else-if="currentView === 'browser'"
      @back="currentView = 'hub'"
      @play="playLevel"
    />

    <!-- My Drafts -->
    <div v-else-if="currentView === 'drafts'" class="drafts-container">
      <div class="drafts-header">
        <button class="back-btn" @click="currentView = 'hub'">← Back</button>
        <h2 class="drafts-title">My Drafts</h2>
      </div>

      <div v-if="drafts.length === 0" class="empty-drafts">
        <p>No drafts yet. Go create a level!</p>
      </div>

      <div class="drafts-grid">
        <div v-for="draft in drafts" :key="draft.id" class="draft-card">
          <h3 class="draft-name">{{ draft.name || 'Untitled' }}</h3>
          <p class="draft-blocks">{{ draft.blocks.length }} blocks</p>
          <div class="draft-actions">
            <button class="draft-btn edit" @click="editDraft(draft)">Edit</button>
            <button class="draft-btn play" @click="playLevel(draft)">Play</button>
            <button class="draft-btn delete" @click="removeDraft(draft.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { LevelData } from './types'
import { getCurrentUser, logout } from './userStore'
import { getLocalDrafts, deleteLocalDraft } from './levelStore'
import AISignup from './AISignup.vue'
import AIHub from './AIHub.vue'
import AILevelEditor from './AILevelEditor.vue'
import AILevelPlayer from './AILevelPlayer.vue'
import AILevelBrowser from './AILevelBrowser.vue'

type ViewName = 'signup' | 'hub' | 'editor' | 'browser' | 'playing' | 'drafts'

const router = useRouter()
const currentView = ref<ViewName>('signup')
const username = ref('')
const playingLevel = ref<LevelData | null>(null)
const editingLevel = ref<LevelData | null>(null)
const drafts = ref<LevelData[]>([])
const previousView = ref<ViewName>('hub')

function onAuthenticated() {
  username.value = getCurrentUser() || 'Player'
  currentView.value = 'hub'
}

function handleNavigate(target: string) {
  if (target === 'editor') {
    editingLevel.value = null
    currentView.value = 'editor'
  } else if (target === 'browser') {
    currentView.value = 'browser'
  } else if (target === 'drafts') {
    loadDrafts()
    currentView.value = 'drafts'
  }
}

function handleLogout() {
  logout()
  username.value = ''
  currentView.value = 'signup'
}

function goHome() {
  router.push('/')
}

function playLevel(level: LevelData) {
  previousView.value = currentView.value
  playingLevel.value = level
  currentView.value = 'playing'
}

function testLevel(level: LevelData) {
  previousView.value = 'editor'
  playingLevel.value = level
  currentView.value = 'playing'
}

function returnFromPlay() {
  currentView.value = previousView.value
  playingLevel.value = null
}

function onLevelWon() {
  // Could add coin rewards here via GameState
}

function loadDrafts() {
  drafts.value = getLocalDrafts()
}

function editDraft(draft: LevelData) {
  editingLevel.value = draft
  currentView.value = 'editor'
}

function removeDraft(id: string) {
  deleteLocalDraft(id)
  loadDrafts()
}

onMounted(() => {
  const user = getCurrentUser()
  if (user) {
    username.value = user
    currentView.value = 'hub'
  }
})
</script>

<style scoped>
.portal-root {
  min-height: 100vh;
  background: #0a0a1a;
}

.drafts-container {
  min-height: 100vh;
  background: #1a202c;
  padding: 12px;
}

.drafts-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  background: #4a5568;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.drafts-title {
  color: #fff;
  font-size: 24px;
  margin: 0;
}

.empty-drafts {
  text-align: center;
  color: #a0aec0;
  padding: 60px 20px;
  font-size: 18px;
}

.drafts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.draft-card {
  background: #2d3748;
  border-radius: 12px;
  padding: 16px;
}

.draft-name {
  color: #fff;
  font-size: 16px;
  margin: 0 0 4px 0;
}

.draft-blocks {
  color: #a0aec0;
  font-size: 13px;
  margin: 0 0 12px 0;
}

.draft-actions {
  display: flex;
  gap: 8px;
}

.draft-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
}

.draft-btn.edit {
  background: #2563eb;
}

.draft-btn.play {
  background: #16a34a;
}

.draft-btn.delete {
  background: #dc2626;
}
</style>
