<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ModeratorPanel from './components/ModeratorPanel.vue'
import GlobalMessage from './components/shared/GlobalMessage.vue'
import AdminEffects from './components/shared/AdminEffects.vue'

const router = useRouter()

const showAdminBox = ref(false)
const adminCode = ref('')
const adminError = ref(false)

const checkAdminCode = () => {
  if (adminCode.value === 'rylan2026') {
    adminCode.value = ''
    showAdminBox.value = false
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

  <!-- Green admin code box -->
  <div v-if="showAdminBox" class="admin-box-overlay" @click.self="showAdminBox = false">
    <div class="admin-box">
      <h2 class="admin-box-title">ADMIN ACCESS</h2>
      <form @submit.prevent="checkAdminCode">
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
</style>
