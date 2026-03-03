<script setup lang="ts">
import { ref } from 'vue'

const SECRET_CODE = 'gamezone'

const showCodePage = ref(false)
const codeInput = ref('')
const error = ref(false)

const emit = defineEmits<{
  (e: 'granted'): void
}>()

const checkCode = () => {
  if (codeInput.value === SECRET_CODE) {
    localStorage.setItem('accessGranted', 'true')
    emit('granted')
  } else {
    error.value = true
    codeInput.value = ''
    setTimeout(() => { error.value = false }, 2000)
  }
}
</script>

<template>
  <div class="gate-overlay">
    <div class="gate-box" v-if="!showCodePage">
      <div class="gate-icon">💰</div>
      <h1 class="gate-title">FREE MONEY</h1>
      <p class="gate-subtitle">Click below to claim your free money!</p>
      <button class="money-btn" @click="showCodePage = true">CLICK HERE FOR FREE MONEY</button>
    </div>

    <div class="gate-box" v-else>
      <div class="gate-icon">🔒</div>
      <h1 class="gate-title">Rylans Games</h1>
      <p class="gate-subtitle">Enter the secret code to play</p>

      <form @submit.prevent="checkCode">
        <input
          v-model="codeInput"
          type="password"
          class="code-input"
          placeholder="Secret code..."
          maxlength="30"
          autofocus
        />
        <button type="submit" class="enter-btn">Enter</button>
      </form>

      <p v-if="error" class="error-msg">Wrong code! Try again.</p>
    </div>
  </div>
</template>

<style scoped>
.gate-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a202c;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.gate-box {
  background: #2d3748;
  border: 2px solid #667eea;
  border-radius: 20px;
  padding: 50px 40px;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.4);
}

.gate-icon {
  font-size: 72px;
  margin-bottom: 10px;
}

.gate-title {
  color: #fff;
  font-size: 32px;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.gate-subtitle {
  color: #a0aec0;
  font-size: 16px;
  margin: 0 0 30px 0;
}

.code-input {
  width: 100%;
  padding: 14px;
  font-size: 20px;
  border: 2px solid #4a5568;
  border-radius: 10px;
  background: #1a202c;
  color: #fff;
  text-align: center;
  letter-spacing: 4px;
  margin-bottom: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.code-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.4);
}

.enter-btn {
  width: 100%;
  padding: 14px;
  font-size: 20px;
  font-weight: bold;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.enter-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.5);
}

.money-btn {
  width: 100%;
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #1a202c;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.money-btn:hover {
  box-shadow: 0 5px 25px rgba(253, 160, 133, 0.6);
}

.error-msg {
  color: #fc8181;
  margin-top: 16px;
  font-size: 16px;
  font-weight: bold;
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
</style>
