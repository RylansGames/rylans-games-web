import { db } from '../../firebase'
import {
  ref as dbRef,
  set,
  remove,
  get,
  onValue,
  type Unsubscribe,
} from 'firebase/database'
import type { LevelData } from './types'

const DRAFTS_KEY = 'ai_my_levels'

// --- localStorage drafts ---

export function getLocalDrafts(): LevelData[] {
  const data = localStorage.getItem(DRAFTS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveLocalDraft(level: LevelData) {
  const drafts = getLocalDrafts()
  const idx = drafts.findIndex((d) => d.id === level.id)
  if (idx >= 0) {
    drafts[idx] = level
  } else {
    drafts.push(level)
  }
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

export function deleteLocalDraft(levelId: string) {
  const drafts = getLocalDrafts().filter((d) => d.id !== levelId)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

// --- Firebase published levels ---

export async function publishLevel(level: LevelData): Promise<void> {
  const levelRef = dbRef(db, `ai_levels/${level.id}`)
  await set(levelRef, level)
}

export function listenToPublishedLevels(
  callback: (levels: LevelData[]) => void
): Unsubscribe {
  const levelsRef = dbRef(db, 'ai_levels')
  return onValue(levelsRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) {
      callback([])
      return
    }
    const levels: LevelData[] = Object.values(data)
    levels.sort((a, b) => b.createdAt - a.createdAt)
    callback(levels)
  })
}

export async function incrementPlays(levelId: string): Promise<void> {
  const levelRef = dbRef(db, `ai_levels/${levelId}`)
  const snapshot = await get(levelRef)
  if (snapshot.exists()) {
    const level = snapshot.val() as LevelData
    await set(levelRef, { ...level, plays: (level.plays || 0) + 1 })
  }
}

export async function toggleLike(
  levelId: string,
  delta: number
): Promise<void> {
  const levelRef = dbRef(db, `ai_levels/${levelId}`)
  const snapshot = await get(levelRef)
  if (snapshot.exists()) {
    const level = snapshot.val() as LevelData
    await set(levelRef, {
      ...level,
      likes: Math.max(0, (level.likes || 0) + delta),
    })
  }
}

export async function deletePublishedLevel(levelId: string): Promise<void> {
  const levelRef = dbRef(db, `ai_levels/${levelId}`)
  await remove(levelRef)
}

export function generateLevelId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
