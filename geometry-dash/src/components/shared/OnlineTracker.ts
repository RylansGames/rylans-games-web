// Online player tracking via Firebase Realtime Database
import { db } from '../../firebase'
import {
  ref as dbRef,
  set,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/database'

export interface OnlinePlayer {
  id: string
  playerName: string
  coins: number
  level: number
  exp: number
  petsCount: number
  currentGame: string
  lastActive: number
}

export interface AdminAction {
  type: 'kick' | 'warn' | 'grantCoins'
  amount?: number
  timestamp: number
}

const sessionId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
let heartbeatInterval: number | null = null

export const OnlineTracker = {
  getSessionId(): string {
    return sessionId
  },

  // --- Player goes online ---
  goOnline(playerName: string, coins: number, level: number, exp: number, petsCount: number, currentGame: string): void {
    const playerRef = dbRef(db, `players/${sessionId}`)
    const data: OnlinePlayer = {
      id: sessionId,
      playerName,
      coins,
      level,
      exp,
      petsCount,
      currentGame,
      lastActive: Date.now()
    }
    set(playerRef, data)
    // Auto-remove when browser disconnects
    onDisconnect(playerRef).remove()

    // Heartbeat every 3 seconds
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    heartbeatInterval = setInterval(() => {
      set(dbRef(db, `players/${sessionId}/lastActive`), Date.now())
    }, 3000) as unknown as number
  },

  // --- Update player stats ---
  updateStats(coins: number, level: number, exp: number, petsCount: number, currentGame?: string): void {
    const updates: Record<string, unknown> = {
      coins,
      level,
      exp,
      petsCount,
      lastActive: Date.now()
    }
    if (currentGame) updates.currentGame = currentGame

    Object.entries(updates).forEach(([key, value]) => {
      set(dbRef(db, `players/${sessionId}/${key}`), value)
    })
  },

  // --- Player goes offline ---
  goOffline(): void {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    remove(dbRef(db, `players/${sessionId}`))
  },

  // --- Listen for all online players (used by admin panel) ---
  onPlayersChanged(callback: (players: OnlinePlayer[]) => void): Unsubscribe {
    const playersRef = dbRef(db, 'players')
    return onValue(playersRef, (snapshot) => {
      const players: OnlinePlayer[] = []
      if (snapshot.exists()) {
        const data = snapshot.val()
        Object.values(data).forEach((player: any) => {
          // Only include players active in last 15 seconds
          if (Date.now() - player.lastActive < 15000) {
            players.push(player as OnlinePlayer)
          }
        })
      }
      callback(players)
    })
  },

  // --- Admin actions ---
  giveCoins(targetSessionId: string, amount: number): void {
    const action: AdminAction = { type: 'grantCoins', amount, timestamp: Date.now() }
    set(dbRef(db, `admin_actions/${targetSessionId}`), action)
  },

  kickPlayer(targetSessionId: string): void {
    const action: AdminAction = { type: 'kick', timestamp: Date.now() }
    set(dbRef(db, `admin_actions/${targetSessionId}`), action)
  },

  warnPlayer(targetSessionId: string): void {
    const action: AdminAction = { type: 'warn', timestamp: Date.now() }
    set(dbRef(db, `admin_actions/${targetSessionId}`), action)
  },

  banPlayer(targetSessionId: string): void {
    set(dbRef(db, `banned/${targetSessionId}`), { timestamp: Date.now() })
    this.kickPlayer(targetSessionId)
  },

  unbanPlayer(targetSessionId: string): void {
    remove(dbRef(db, `banned/${targetSessionId}`))
  },

  // --- Check for admin actions on THIS player ---
  onAdminAction(callback: (action: AdminAction) => void): Unsubscribe {
    const actionRef = dbRef(db, `admin_actions/${sessionId}`)
    return onValue(actionRef, (snapshot) => {
      if (snapshot.exists()) {
        const action = snapshot.val() as AdminAction
        callback(action)
        // Clear it after reading
        remove(actionRef)
      }
    })
  },

  // --- Check if this player is banned ---
  onBanStatus(callback: (isBanned: boolean) => void): Unsubscribe {
    const bannedRef = dbRef(db, `banned/${sessionId}`)
    return onValue(bannedRef, (snapshot) => {
      callback(snapshot.exists())
    })
  },

  // --- Global message ---
  sendGlobalMessage(text: string): void {
    set(dbRef(db, 'global_message'), {
      from: 'DA OWNER',
      text,
      timestamp: Date.now(),
      duration: 10000
    })
  },

  onGlobalMessage(callback: (msg: { from: string; text: string; timestamp: number; duration: number } | null) => void): Unsubscribe {
    return onValue(dbRef(db, 'global_message'), (snapshot) => {
      if (snapshot.exists()) {
        const msg = snapshot.val()
        if (Date.now() - msg.timestamp < msg.duration) {
          callback(msg)
        } else {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  },

  // --- Admin abuse ---
  startAdminAbuse(game: string, durationMs: number): void {
    set(dbRef(db, 'admin_abuse'), {
      game,
      startTime: Date.now(),
      duration: durationMs
    })
  },

  startAbuseEffect(effect: string, durationMs: number): void {
    set(dbRef(db, `admin_effects/${effect}`), {
      startTime: Date.now(),
      duration: durationMs
    })
  },

  stopAllAbuseEffects(): void {
    remove(dbRef(db, 'admin_effects'))
  },

  onAbuseEffects(callback: (effects: string[]) => void): Unsubscribe {
    return onValue(dbRef(db, 'admin_effects'), (snapshot) => {
      const active: string[] = []
      if (snapshot.exists()) {
        const data = snapshot.val()
        Object.entries(data).forEach(([effect, info]: [string, any]) => {
          if (Date.now() - info.startTime < info.duration) {
            active.push(effect)
          }
        })
      }
      callback(active)
    })
  },

  // --- Camera Watch anomaly spawning ---
  spawnCameraAnomaly(type: string): void {
    set(dbRef(db, 'camera_anomaly'), { type, timestamp: Date.now() })
  },

  onCameraAnomaly(callback: (spawn: { type: string; timestamp: number } | null) => void): Unsubscribe {
    return onValue(dbRef(db, 'camera_anomaly'), (snapshot) => {
      if (snapshot.exists()) {
        const spawn = snapshot.val()
        if (Date.now() - spawn.timestamp < 2000) {
          callback(spawn)
        } else {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}
