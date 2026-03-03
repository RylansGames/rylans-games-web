<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ModeratorPanel from './components/ModeratorPanel.vue'
import GlobalMessage from './components/shared/GlobalMessage.vue'
import AdminEffects from './components/shared/AdminEffects.vue'
import { db } from './firebase'
import { ref as dbRef, set, remove, onValue, type Unsubscribe } from 'firebase/database'

const router = useRouter()

const showAdminBox = ref(false)
const adminCode = ref('')
const adminError = ref(false)
const adminLocked = ref(false)
const isOwner = ref(false)
const isAdmin = ref(localStorage.getItem('adminAuth') === 'true')

// Check if this browser is the owner (the one who locked it)
const ownerKey = localStorage.getItem('adminOwnerKey')

let unsubLock: Unsubscribe | null = null

onMounted(() => {
  // Listen for lock status from Firebase
  unsubLock = onValue(dbRef(db, 'admin_lock'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      adminLocked.value = true
      isOwner.value = ownerKey === data.ownerKey
    } else {
      adminLocked.value = false
      isOwner.value = false
    }
  })
})

onUnmounted(() => {
  if (unsubLock) unsubLock()
})

const lockAdmin = () => {
  // Generate a secret key and save it in localStorage
  const key = `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem('adminOwnerKey', key)
  set(dbRef(db, 'admin_lock'), { ownerKey: key, timestamp: Date.now() })
  isOwner.value = true
}

const unlockAdmin = () => {
  remove(dbRef(db, 'admin_lock'))
  adminLocked.value = false
  isOwner.value = false
}

const checkAdminCode = () => {
  if (adminCode.value === 'rylan2026') {
    // If locked and not the owner, block access
    if (adminLocked.value && !isOwner.value) {
      adminError.value = true
      adminCode.value = ''
      setTimeout(() => { adminError.value = false }, 2000)
      return
    }
    adminCode.value = ''
    showAdminBox.value = false
    localStorage.setItem('adminAuth', 'true')
    router.push('/games/brainrot-admin')
  } else {
    adminError.value = true
    adminCode.value = ''
    setTimeout(() => { adminError.value = false }, 2000)
  }
}
</script>

<template>
  <RouterView />
  <ModeratorPanel />
  <GlobalMessage />
  <AdminEffects />

  <!-- Small admin button on the side -->
  <button class="admin-side-btn" @click="showAdminBox = !showAdminBox">A</button>

  <!-- Secret lock button - only visible if you've been admin before -->
  <button v-if="isAdmin" class="lock-side-btn" @click="adminLocked && isOwner ? unlockAdmin() : lockAdmin()">
    {{ adminLocked && isOwner ? '🔓' : '🔒' }}
  </button>

  <!-- Green admin code box -->
  <div v-if="showAdminBox" class="admin-box-overlay" @click.self="showAdminBox = false">
    <div class="admin-box">
      <h2 class="admin-box-title">ADMIN ACCESS</h2>

      <!-- Show locked message if locked and not owner -->
      <div v-if="adminLocked && !isOwner" class="locked-msg">
        ADMIN PANEL IS LOCKED
      </div>

      <!-- Show code input if not locked, or if owner -->
      <form v-else @submit.prevent="checkAdminCode">
        <input
          v-model="adminCode"
          type="password"
          class="admin-code-input"
          placeholder="Enter admin code..."
          maxlength="30"
          autofocus
        />
        <button type="submit" class="admin-code-btn">ENTER</button>
      </form>

      <p v-if="adminError" class="admin-error">Wrong code!</p>
    </div>
  </div>
</template>

<style scoped>
.admin-side-btn {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: #1a1a1a;
  color: #333;
  border: 1px solid #333;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 10px;
  cursor: pointer;
  z-index: 9998;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.admin-side-btn:hover {
  opacity: 1;
  background: #00ff00;
  color: #000;
  border-color: #00ff00;
}

.lock-side-btn {
  position: fixed;
  right: 0;
  top: calc(50% + 30px);
  width: 20px;
  height: 20px;
  background: #1a1a1a;
  border: 1px solid #1a1a1a;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 8px;
  cursor: pointer;
  z-index: 9998;
  opacity: 0.05;
  transition: opacity 0.3s;
  padding: 0;
  line-height: 20px;
}

.lock-side-btn:hover {
  opacity: 0.8;
}

.admin-box-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.admin-box {
  background: #0a0a0a;
  border: 2px solid #00ff00;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  width: 350px;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
}

.admin-box-title {
  color: #00ff00;
  font-size: 24px;
  margin: 0 0 20px 0;
  font-family: monospace;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.admin-code-input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  border: 2px solid #00ff00;
  border-radius: 8px;
  background: #000;
  color: #00ff00;
  text-align: center;
  letter-spacing: 3px;
  font-family: monospace;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.admin-code-input:focus {
  outline: none;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
}

.admin-code-btn {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  font-weight: bold;
  background: #00ff00;
  color: #000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: monospace;
  transition: all 0.3s;
}

.admin-code-btn:hover {
  background: #00cc00;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
}

.admin-error {
  color: #ff4444;
  margin-top: 12px;
  font-family: monospace;
  font-weight: bold;
}

.locked-msg {
  color: #ff4444;
  font-size: 20px;
  font-weight: bold;
  font-family: monospace;
  padding: 20px;
  border: 2px solid #ff4444;
  border-radius: 8px;
  background: rgba(255, 68, 68, 0.1);
  margin-bottom: 12px;
}

</style>
