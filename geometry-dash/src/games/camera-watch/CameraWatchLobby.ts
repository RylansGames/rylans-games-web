// Camera Watch Co-op Multiplayer Lobby (Firebase-based for cross-device play)
import { db } from '../../firebase'
import {
  ref as dbRef,
  set,
  remove,
  get,
  onValue,
  onDisconnect,
  type Unsubscribe
} from 'firebase/database'

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
  players: Record<string, CoopPlayer>
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

const LOBBY_PATH = 'camera_watch_lobby'
const ANOMALIES_PATH = 'camera_watch_anomalies'

class CameraWatchLobbyManager {
  private playerId: string
  private playerName: string
  private unsubs: Unsubscribe[] = []

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

  async createLobby(): Promise<CoopLobby> {
    const player: CoopPlayer = {
      id: this.playerId,
      name: this.playerName,
      currentCamera: 0,
      score: 0,
      joinedAt: Date.now(),
      lastActive: Date.now()
    }
    const lobby: CoopLobby = {
      hostId: this.playerId,
      players: { [this.playerId]: player },
      gameState: 'waiting',
      createdAt: Date.now()
    }
    await set(dbRef(db, LOBBY_PATH), lobby)
    await remove(dbRef(db, ANOMALIES_PATH))

    // Auto-remove this player if they disconnect
    onDisconnect(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}`)).remove()

    return lobby
  }

  async joinLobby(): Promise<CoopLobby | null> {
    const lobby = await this.getLobby()
    if (!lobby || lobby.gameState !== 'waiting') return null

    const player: CoopPlayer = {
      id: this.playerId,
      name: this.playerName,
      currentCamera: 0,
      score: 0,
      joinedAt: Date.now(),
      lastActive: Date.now()
    }
    await set(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}`), player)

    // Auto-remove this player if they disconnect
    onDisconnect(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}`)).remove()

    return await this.getLobby()
  }

  async getLobby(): Promise<CoopLobby | null> {
    const snapshot = await get(dbRef(db, LOBBY_PATH))
    if (!snapshot.exists()) return null
    return snapshot.val() as CoopLobby
  }

  // Real-time listener for lobby changes
  onLobbyChanged(callback: (lobby: CoopLobby | null) => void): Unsubscribe {
    const unsub = onValue(dbRef(db, LOBBY_PATH), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as CoopLobby)
      } else {
        callback(null)
      }
    })
    this.unsubs.push(unsub)
    return unsub
  }

  async isHost(): Promise<boolean> {
    const lobby = await this.getLobby()
    return lobby?.hostId === this.playerId
  }

  async startGame(): Promise<void> {
    const lobby = await this.getLobby()
    if (!lobby || lobby.hostId !== this.playerId) return
    await set(dbRef(db, `${LOBBY_PATH}/gameState`), 'playing')
  }

  async endGame(): Promise<void> {
    await set(dbRef(db, `${LOBBY_PATH}/gameState`), 'ended')
  }

  // --- Player State Updates ---

  updatePlayerState(currentCamera: number, score: number): void {
    set(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}/currentCamera`), currentCamera)
    set(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}/score`), score)
    set(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}/lastActive`), Date.now())
  }

  getActivePlayersFromData(lobby: CoopLobby): CoopPlayer[] {
    if (!lobby.players) return []
    const now = Date.now()
    return Object.values(lobby.players).filter(p => now - p.lastActive < 5000)
  }

  getTeamScoreFromData(lobby: CoopLobby): number {
    return this.getActivePlayersFromData(lobby).reduce((sum, p) => sum + p.score, 0)
  }

  // --- Shared Anomalies ---

  async shareAnomalySpawn(objectIndex: number, type: string, roomIndex: number): Promise<string> {
    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    const anomaly: SharedAnomaly = {
      id,
      objectIndex,
      type,
      roomIndex,
      spawnedAt: Date.now(),
      fixedBy: null,
      fixedAt: null
    }
    await set(dbRef(db, `${ANOMALIES_PATH}/${id}`), anomaly)
    return id
  }

  async shareAnomalyFix(anomalyId: string, fixerName: string): Promise<void> {
    await set(dbRef(db, `${ANOMALIES_PATH}/${anomalyId}/fixedBy`), fixerName)
    await set(dbRef(db, `${ANOMALIES_PATH}/${anomalyId}/fixedAt`), Date.now())
  }

  onAnomaliesChanged(callback: (anomalies: SharedAnomaly[]) => void): Unsubscribe {
    const unsub = onValue(dbRef(db, ANOMALIES_PATH), (snapshot) => {
      if (snapshot.exists()) {
        callback(Object.values(snapshot.val()))
      } else {
        callback([])
      }
    })
    this.unsubs.push(unsub)
    return unsub
  }

  // --- Cleanup ---

  async leaveLobby(): Promise<void> {
    const lobby = await this.getLobby()
    if (!lobby) return

    // Remove this player
    await remove(dbRef(db, `${LOBBY_PATH}/players/${this.playerId}`))

    // Check remaining players
    const remaining = lobby.players ? Object.values(lobby.players).filter(p => p.id !== this.playerId) : []

    if (remaining.length === 0) {
      // Last player — destroy lobby
      await remove(dbRef(db, LOBBY_PATH))
      await remove(dbRef(db, ANOMALIES_PATH))
    } else if (lobby.hostId === this.playerId) {
      // Host left — assign new host
      await set(dbRef(db, `${LOBBY_PATH}/hostId`), remaining[0].id)
    }

    // Clean up all listeners
    this.unsubs.forEach(unsub => unsub())
    this.unsubs = []
  }

  async destroyLobby(): Promise<void> {
    await remove(dbRef(db, LOBBY_PATH))
    await remove(dbRef(db, ANOMALIES_PATH))
    this.unsubs.forEach(unsub => unsub())
    this.unsubs = []
  }
}

export const coopLobby = new CameraWatchLobbyManager()
