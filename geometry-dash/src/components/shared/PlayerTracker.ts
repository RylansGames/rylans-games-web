// Player tracking system for admin monitoring

export interface PlayerSession {
  id: string
  playerName: string
  isActive: boolean
  lastActive: number
  coins: number
  level: number
  exp: number
  petsCount: number
  currentGame: string
}

class PlayerTrackerManager {
  private sessionId: string
  private updateInterval: number | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  startSession(playerName: string, coins: number, level: number, exp: number, petsCount: number, currentGame: string = 'Portal'): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    const session: PlayerSession = {
      id: this.sessionId,
      playerName,
      isActive: true,
      lastActive: Date.now(),
      coins,
      level,
      exp,
      petsCount,
      currentGame
    }

    // Store this player's session
    localStorage.setItem(`playerSession_${this.sessionId}`, JSON.stringify(session))

    // Start heartbeat to keep session active
    this.updateInterval = setInterval(() => {
      this.updateSession(coins, level, exp, petsCount, currentGame)
    }, 2000) // Update every 2 seconds
  }

  updateSession(coins: number, level: number, exp: number, petsCount: number, currentGame?: string): void {
    const sessionKey = `playerSession_${this.sessionId}`
    const saved = localStorage.getItem(sessionKey)

    if (saved) {
      const session: PlayerSession = JSON.parse(saved)
      session.lastActive = Date.now()
      session.coins = coins
      session.level = level
      session.exp = exp
      session.petsCount = petsCount
      if (currentGame) session.currentGame = currentGame
      session.isActive = true
      localStorage.setItem(sessionKey, JSON.stringify(session))
    }
  }

  endSession(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    const sessionKey = `playerSession_${this.sessionId}`
    const saved = localStorage.getItem(sessionKey)

    if (saved) {
      const session: PlayerSession = JSON.parse(saved)
      session.isActive = false
      localStorage.setItem(sessionKey, JSON.stringify(session))
    }
  }

  getSessionId(): string {
    return this.sessionId
  }

  static getAllActivePlayers(): PlayerSession[] {
    const players: PlayerSession[] = []
    const now = Date.now()
    const ACTIVE_THRESHOLD = 10000 // 10 seconds

    // Find all player sessions in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('playerSession_')) {
        try {
          const session: PlayerSession = JSON.parse(localStorage.getItem(key)!)

          // Consider active if updated within last 10 seconds
          if (now - session.lastActive < ACTIVE_THRESHOLD) {
            players.push(session)
          } else {
            // Mark as inactive
            session.isActive = false
            localStorage.setItem(key, JSON.stringify(session))
          }
        } catch (e) {
          console.error('Failed to parse player session:', e)
        }
      }
    }

    return players.filter(p => p.isActive)
  }

  static grantInfiniteCoins(sessionId: string): void {
    const sessionKey = `playerSession_${sessionId}`
    const adminAction = {
      type: 'grantCoins',
      amount: 999999,
      timestamp: Date.now()
    }
    localStorage.setItem(`admin_action_${sessionId}`, JSON.stringify(adminAction))
  }

  static grantGodPet(sessionId: string): void {
    const adminAction = {
      type: 'grantGodPet',
      timestamp: Date.now()
    }
    localStorage.setItem(`admin_action_${sessionId}`, JSON.stringify(adminAction))
  }

  static startAdminAbuse(game: string, durationMs: number = 10000): void {
    const abuse = {
      game,
      startTime: Date.now(),
      duration: durationMs
    }
    localStorage.setItem('admin_abuse_active', JSON.stringify(abuse))
  }

  static checkForAdminAbuse(): { game: string; startTime: number; duration: number } | null {
    const saved = localStorage.getItem('admin_abuse_active')
    if (saved) {
      const abuse = JSON.parse(saved)
      if (Date.now() - abuse.startTime < abuse.duration) {
        return abuse
      } else {
        localStorage.removeItem('admin_abuse_active')
      }
    }
    return null
  }

  static sendGlobalMessage(message: string): void {
    const msg = {
      from: 'DA OWNER',
      text: message,
      timestamp: Date.now(),
      duration: 10000
    }
    localStorage.setItem('global_message', JSON.stringify(msg))
  }

  static checkForGlobalMessage(): { from: string; text: string; timestamp: number; duration: number } | null {
    const saved = localStorage.getItem('global_message')
    if (saved) {
      const msg = JSON.parse(saved)
      if (Date.now() - msg.timestamp < msg.duration) {
        return msg
      } else {
        localStorage.removeItem('global_message')
      }
    }
    return null
  }

  checkForAdminActions(): { type: string; amount?: number } | null {
    const actionKey = `admin_action_${this.sessionId}`
    const saved = localStorage.getItem(actionKey)

    if (saved) {
      const action = JSON.parse(saved)
      // Remove the action after reading
      localStorage.removeItem(actionKey)
      return action
    }

    return null
  }

  // Check if this player is banned
  checkIfBanned(): boolean {
    return localStorage.getItem(`banned_${this.sessionId}`) !== null
  }

  // --- Ban/Kick ---
  static banPlayer(sessionId: string): void {
    localStorage.setItem(`banned_${sessionId}`, JSON.stringify({ timestamp: Date.now() }))
    // Also send a kick action so they get removed immediately
    localStorage.setItem(`admin_action_${sessionId}`, JSON.stringify({ type: 'kick', timestamp: Date.now() }))
  }

  static unbanPlayer(sessionId: string): void {
    localStorage.removeItem(`banned_${sessionId}`)
  }

  static kickPlayer(sessionId: string): void {
    localStorage.setItem(`admin_action_${sessionId}`, JSON.stringify({ type: 'kick', timestamp: Date.now() }))
  }

  static warnPlayer(sessionId: string): void {
    localStorage.setItem(`admin_action_${sessionId}`, JSON.stringify({ type: 'warn', timestamp: Date.now() }))
  }

  // --- Admin Abuse Effects ---
  static startAbuseEffect(effect: string, durationMs: number = 10000): void {
    const effectData = {
      effect,
      startTime: Date.now(),
      duration: durationMs
    }
    localStorage.setItem(`admin_abuse_effect_${effect}`, JSON.stringify(effectData))
  }

  // --- Camera Watch Anomaly Spawning ---
  static spawnCameraAnomaly(anomalyType: string): void {
    const spawn = {
      type: anomalyType,
      timestamp: Date.now()
    }
    localStorage.setItem('camera_watch_admin_spawn', JSON.stringify(spawn))
  }

  static checkForAdminAnomaly(): { type: string; timestamp: number } | null {
    const saved = localStorage.getItem('camera_watch_admin_spawn')
    if (saved) {
      const spawn = JSON.parse(saved)
      // Only valid for 2 seconds
      if (Date.now() - spawn.timestamp < 2000) {
        localStorage.removeItem('camera_watch_admin_spawn')
        return spawn
      } else {
        localStorage.removeItem('camera_watch_admin_spawn')
      }
    }
    return null
  }

  static stopAllAbuseEffects(): void {
    const effectTypes = ['screen_shake', 'rainbow', 'upside_down']
    for (const effect of effectTypes) {
      localStorage.removeItem(`admin_abuse_effect_${effect}`)
    }
  }

  static checkForAbuseEffects(): string[] {
    const activeEffects: string[] = []
    const effectTypes = ['screen_shake', 'rainbow', 'upside_down']

    for (const effect of effectTypes) {
      const saved = localStorage.getItem(`admin_abuse_effect_${effect}`)
      if (saved) {
        const data = JSON.parse(saved)
        if (Date.now() - data.startTime < data.duration) {
          activeEffects.push(effect)
        } else {
          localStorage.removeItem(`admin_abuse_effect_${effect}`)
        }
      }
    }

    return activeEffects
  }
}

// Export class for static method access and singleton instance
export { PlayerTrackerManager as PlayerTracker }
export const playerTracker = new PlayerTrackerManager()
