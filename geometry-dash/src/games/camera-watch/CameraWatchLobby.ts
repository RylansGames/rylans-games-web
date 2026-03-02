// Camera Watch Co-op Multiplayer Lobby (localStorage-based cross-tab communication)

export interface CoopPlayer {
  id: string
  name: string
  currentCamera: number
  score: number
  joinedAt: number
  lastActive: number
}

export interface CoopLobby {
  hostId: string
  players: CoopPlayer[]
  gameState: 'waiting' | 'playing' | 'ended'
  createdAt: number
}

export interface SharedAnomaly {
  id: string
  objectIndex: number
  type: string
  roomIndex: number
  spawnedAt: number
  fixedBy: string | null
  fixedAt: number | null
}

const LOBBY_KEY = 'camera_watch_lobby'
const ANOMALIES_KEY = 'camera_watch_shared_anomalies'
const ACTIVE_THRESHOLD = 5000 // 5 seconds

class CameraWatchLobbyManager {
  private playerId: string
  private playerName: string

  constructor() {
    this.playerId = `coop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    this.playerName = 'Player'
  }

  setPlayerName(name: string): void {
    this.playerName = name
  }

  getPlayerId(): string {
    return this.playerId
  }

  getPlayerName(): string {
    return this.playerName
  }

  // --- Lobby Management ---

  createLobby(): CoopLobby {
    const lobby: CoopLobby = {
      hostId: this.playerId,
      players: [{
        id: this.playerId,
        name: this.playerName,
        currentCamera: 0,
        score: 0,
        joinedAt: Date.now(),
        lastActive: Date.now()
      }],
      gameState: 'waiting',
      createdAt: Date.now()
    }
    localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
    // Clear any old shared anomalies
    localStorage.removeItem(ANOMALIES_KEY)
    return lobby
  }

  joinLobby(): CoopLobby | null {
    const lobby = this.getLobby()
    if (!lobby || lobby.gameState !== 'waiting') return null

    // Check if already in lobby
    if (lobby.players.some(p => p.id === this.playerId)) return lobby

    lobby.players.push({
      id: this.playerId,
      name: this.playerName,
      currentCamera: 0,
      score: 0,
      joinedAt: Date.now(),
      lastActive: Date.now()
    })
    localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
    return lobby
  }

  getLobby(): CoopLobby | null {
    const saved = localStorage.getItem(LOBBY_KEY)
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }

  isHost(): boolean {
    const lobby = this.getLobby()
    return lobby?.hostId === this.playerId
  }

  isInLobby(): boolean {
    const lobby = this.getLobby()
    if (!lobby) return false
    return lobby.players.some(p => p.id === this.playerId)
  }

  startGame(): void {
    const lobby = this.getLobby()
    if (!lobby || lobby.hostId !== this.playerId) return
    lobby.gameState = 'playing'
    localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
  }

  endGame(): void {
    const lobby = this.getLobby()
    if (!lobby) return
    lobby.gameState = 'ended'
    localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
  }

  // --- Player State Updates ---

  updatePlayerState(currentCamera: number, score: number): void {
    const lobby = this.getLobby()
    if (!lobby) return

    const player = lobby.players.find(p => p.id === this.playerId)
    if (player) {
      player.currentCamera = currentCamera
      player.score = score
      player.lastActive = Date.now()
      localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
    }
  }

  getActivePlayers(): CoopPlayer[] {
    const lobby = this.getLobby()
    if (!lobby) return []
    const now = Date.now()
    return lobby.players.filter(p => now - p.lastActive < ACTIVE_THRESHOLD)
  }

  getTeamScore(): number {
    return this.getActivePlayers().reduce((sum, p) => sum + p.score, 0)
  }

  // --- Shared Anomalies ---

  getSharedAnomalies(): SharedAnomaly[] {
    const saved = localStorage.getItem(ANOMALIES_KEY)
    if (!saved) return []
    try {
      return JSON.parse(saved)
    } catch {
      return []
    }
  }

  shareAnomalySpawn(objectIndex: number, type: string, roomIndex: number): string {
    const anomalies = this.getSharedAnomalies()
    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    anomalies.push({
      id,
      objectIndex,
      type,
      roomIndex,
      spawnedAt: Date.now(),
      fixedBy: null,
      fixedAt: null
    })
    localStorage.setItem(ANOMALIES_KEY, JSON.stringify(anomalies))
    return id
  }

  shareAnomalyFix(anomalyId: string, fixerName: string): void {
    const anomalies = this.getSharedAnomalies()
    const anomaly = anomalies.find(a => a.id === anomalyId)
    if (anomaly && !anomaly.fixedBy) {
      anomaly.fixedBy = fixerName
      anomaly.fixedAt = Date.now()
      localStorage.setItem(ANOMALIES_KEY, JSON.stringify(anomalies))
    }
  }

  getUnfixedAnomalies(): SharedAnomaly[] {
    return this.getSharedAnomalies().filter(a => !a.fixedBy)
  }

  // --- Cleanup ---

  leaveLobby(): void {
    const lobby = this.getLobby()
    if (!lobby) return

    lobby.players = lobby.players.filter(p => p.id !== this.playerId)

    if (lobby.players.length === 0) {
      // Last player — remove lobby entirely
      localStorage.removeItem(LOBBY_KEY)
      localStorage.removeItem(ANOMALIES_KEY)
    } else {
      // If host left, assign new host
      if (lobby.hostId === this.playerId) {
        lobby.hostId = lobby.players[0].id
      }
      localStorage.setItem(LOBBY_KEY, JSON.stringify(lobby))
    }
  }

  destroyLobby(): void {
    localStorage.removeItem(LOBBY_KEY)
    localStorage.removeItem(ANOMALIES_KEY)
  }
}

export const coopLobby = new CameraWatchLobbyManager()
