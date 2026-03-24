import type { UserProfile } from './types'

const USERS_KEY = 'ai_world_users'
const SESSION_KEY = 'ai_world_session'

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

function getUsers(): UserProfile[] {
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

function saveUsers(users: UserProfile[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function signUp(
  username: string,
  password: string,
  dateOfBirth: string
): { success: boolean; error?: string } {
  if (!username.trim()) return { success: false, error: 'Username is required' }
  if (username.trim().length < 3) return { success: false, error: 'Username must be at least 3 characters' }
  if (!password) return { success: false, error: 'Password is required' }
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters' }
  if (!dateOfBirth) return { success: false, error: 'Date of birth is required' }

  const users = getUsers()
  const exists = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  )
  if (exists) return { success: false, error: 'Username is already taken' }

  const newUser: UserProfile = {
    username: username.trim(),
    passwordHash: simpleHash(password),
    dateOfBirth,
    createdAt: Date.now(),
  }

  users.push(newUser)
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, newUser.username)
  return { success: true }
}

export function login(
  username: string,
  password: string
): { success: boolean; error?: string } {
  if (!username.trim()) return { success: false, error: 'Username is required' }
  if (!password) return { success: false, error: 'Password is required' }

  const users = getUsers()
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  )
  if (!user) return { success: false, error: 'User not found' }
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Wrong password' }
  }

  localStorage.setItem(SESSION_KEY, user.username)
  return { success: true }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(SESSION_KEY)
}
