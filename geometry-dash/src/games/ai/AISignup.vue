<template>
  <div class="signup-container">
    <div class="signup-card">
      <h1 class="signup-title">🌐 Roblox</h1>
      <p class="signup-subtitle">{{ isLogin ? 'Log in to your account' : 'Create your account' }}</p>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-group">
        <label>Username</label>
        <input
          v-model="username"
          type="text"
          placeholder="Pick a cool username"
          maxlength="20"
          @keyup.enter="handleSubmit"
        />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="Enter a password"
          @keyup.enter="handleSubmit"
        />
      </div>

      <div v-if="!isLogin" class="form-group">
        <label>Confirm Password</label>
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Type your password again"
          @keyup.enter="handleSubmit"
        />
      </div>

      <div v-if="!isLogin" class="form-group">
        <label>Date of Birth</label>
        <div class="dob-row">
          <select v-model="dobMonth">
            <option value="">Month</option>
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model="dobDay">
            <option value="">Day</option>
            <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="dobYear">
            <option value="">Year</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <button class="submit-btn" @click="handleSubmit">
        {{ isLogin ? 'Log In' : 'Sign Up' }}
      </button>

      <p class="toggle-text">
        {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
        <span class="toggle-link" @click="toggleMode">
          {{ isLogin ? 'Sign Up' : 'Log In' }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { signUp, login } from './userStore'

const emit = defineEmits<{
  (e: 'authenticated'): void
}>()

const isLogin = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const dobMonth = ref('')
const dobDay = ref('')
const dobYear = ref('')
const error = ref('')

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const currentYear = new Date().getFullYear()
const years = computed(() => {
  const result: number[] = []
  for (let y = currentYear; y >= currentYear - 100; y--) {
    result.push(y)
  }
  return result
})

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
}

function handleSubmit() {
  error.value = ''

  if (isLogin.value) {
    const result = login(username.value, password.value)
    if (result.success) {
      emit('authenticated')
    } else {
      error.value = result.error || 'Login failed'
    }
  } else {
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match'
      return
    }
    if (!dobMonth.value || !dobDay.value || !dobYear.value) {
      error.value = 'Please enter your date of birth'
      return
    }
    const dob = `${dobYear.value}-${dobMonth.value}-${dobDay.value}`
    const result = signUp(username.value, password.value, dob)
    if (result.success) {
      emit('authenticated')
    } else {
      error.value = result.error || 'Sign up failed'
    }
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.signup-card {
  background: #2d3748;
  border-radius: 16px;
  padding: 40px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.signup-title {
  text-align: center;
  font-size: 36px;
  color: #fff;
  margin: 0 0 8px 0;
}

.signup-subtitle {
  text-align: center;
  color: #a0aec0;
  margin: 0 0 24px 0;
  font-size: 16px;
}

.error-message {
  background: #fc8181;
  color: #1a202c;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  background: #1a202c;
  border: 2px solid #4a5568;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #6366f1;
}

.form-group input::placeholder {
  color: #718096;
}

.dob-row {
  display: flex;
  gap: 8px;
}

.dob-row select {
  flex: 1;
  padding: 12px 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s, transform 0.1s;
}

.submit-btn:hover {
  background: #4f46e5;
}

.submit-btn:active {
  transform: scale(0.98);
}

.toggle-text {
  text-align: center;
  color: #a0aec0;
  margin-top: 20px;
  font-size: 14px;
}

.toggle-link {
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.toggle-link:hover {
  color: #818cf8;
}

@media (max-width: 480px) {
  .signup-card {
    padding: 24px;
  }

  .signup-title {
    font-size: 28px;
  }
}
</style>
