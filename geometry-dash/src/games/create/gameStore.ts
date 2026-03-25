import type { GameData, GameObject } from './types'

const STORAGE_KEY = 'roblox_created_games'

export function saveGame(game: GameData): void {
  const games = getAllGames()
  const idx = games.findIndex((g) => g.id === game.id)
  if (idx >= 0) {
    games[idx] = game
  } else {
    games.push(game)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
}

export function getAllGames(): GameData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function getPublishedGames(): GameData[] {
  return getAllGames().filter((g) => g.published)
}

export function getMyGames(author: string): GameData[] {
  return getAllGames().filter((g) => g.author === author)
}

export function getGameById(id: string): GameData | undefined {
  return getAllGames().find((g) => g.id === id)
}

export function deleteGame(id: string): void {
  const games = getAllGames().filter((g) => g.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
}

export function incrementPlays(id: string): void {
  const games = getAllGames()
  const game = games.find((g) => g.id === id)
  if (game) {
    game.plays++
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  }
}

export function toggleLike(id: string): void {
  const games = getAllGames()
  const game = games.find((g) => g.id === id)
  if (game) {
    game.likes++
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  }
}

// AI Helper - generates objects based on genre
export function generateAILevel(
  genre: string,
  mode: '2d' | '3d'
): GameObject[] {
  const objects: GameObject[] = []
  let nextId = 1
  const uid = () => `ai_${nextId++}`

  // Always add a player
  objects.push({
    id: uid(),
    type: 'player',
    x: 1,
    y: mode === '2d' ? 13 : 1,
    width: 1,
    height: 1,
    color: '#3b82f6',
    behavior: 'static',
  })

  // Always add a goal
  objects.push({
    id: uid(),
    type: 'goal',
    x: 18,
    y: mode === '2d' ? 13 : 1,
    width: 1,
    height: 1,
    color: '#22c55e',
    behavior: 'static',
  })

  if (genre === 'platformer') {
    // Ground
    for (let x = 0; x < 20; x++) {
      objects.push({ id: uid(), type: 'platform', x, y: 14, width: 1, height: 1, color: '#78716c', behavior: 'static' })
    }
    // Floating platforms
    const platforms = [[3, 11], [6, 9], [9, 11], [12, 8], [15, 10]]
    for (const [px, py] of platforms) {
      objects.push({ id: uid(), type: 'platform', x: px, y: py, width: 2, height: 1, color: '#78716c', behavior: 'static' })
    }
    // Coins
    for (const [px, py] of platforms) {
      objects.push({ id: uid(), type: 'coin', x: px, y: py - 1, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
    }
    // Enemies
    objects.push({ id: uid(), type: 'enemy', x: 5, y: 13, width: 1, height: 1, color: '#ef4444', behavior: 'patrol-horizontal', speed: 2 })
    objects.push({ id: uid(), type: 'enemy', x: 13, y: 13, width: 1, height: 1, color: '#ef4444', behavior: 'patrol-horizontal', speed: 3 })
  } else if (genre === 'scary') {
    // Dark walls forming a maze
    for (let x = 0; x < 20; x++) {
      objects.push({ id: uid(), type: 'wall', x, y: 0, width: 1, height: 1, color: '#1e1b2e', behavior: 'static' })
      objects.push({ id: uid(), type: 'wall', x, y: 14, width: 1, height: 1, color: '#1e1b2e', behavior: 'static' })
    }
    for (let y = 0; y < 15; y++) {
      objects.push({ id: uid(), type: 'wall', x: 0, y, width: 1, height: 1, color: '#1e1b2e', behavior: 'static' })
      objects.push({ id: uid(), type: 'wall', x: 19, y, width: 1, height: 1, color: '#1e1b2e', behavior: 'static' })
    }
    // Internal maze walls
    const mazeWalls = [[4, 2], [4, 3], [4, 4], [4, 5], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [12, 2], [12, 3], [12, 4], [12, 9], [12, 10], [12, 11], [16, 5], [16, 6], [16, 7], [16, 8]]
    for (const [wx, wy] of mazeWalls) {
      objects.push({ id: uid(), type: 'wall', x: wx, y: wy, width: 1, height: 1, color: '#2d1f4e', behavior: 'static' })
    }
    // Chasing enemies
    objects.push({ id: uid(), type: 'enemy', x: 10, y: 7, width: 1, height: 1, color: '#7f1d1d', behavior: 'chase', speed: 1.5 })
    objects.push({ id: uid(), type: 'enemy', x: 15, y: 3, width: 1, height: 1, color: '#7f1d1d', behavior: 'chase', speed: 1 })
    // Dim lights
    objects.push({ id: uid(), type: 'light', x: 5, y: 7, width: 1, height: 1, color: '#fde68a', behavior: 'static' })
    objects.push({ id: uid(), type: 'light', x: 14, y: 7, width: 1, height: 1, color: '#fde68a', behavior: 'static' })
  } else if (genre === 'obby') {
    // Obby - obstacle course with gaps and spikes
    // Start platform
    for (let x = 0; x < 3; x++) {
      objects.push({ id: uid(), type: 'platform', x, y: 14, width: 1, height: 1, color: '#78716c', behavior: 'static' })
    }
    // Jumping platforms with gaps
    const obbyPlatforms = [[4, 12], [6, 10], [8, 12], [10, 9], [12, 11], [14, 8], [16, 10], [18, 12]]
    for (const [px, py] of obbyPlatforms) {
      objects.push({ id: uid(), type: 'platform', x: px, y: py, width: 1, height: 1, color: '#60a5fa', behavior: 'static' })
    }
    // Spikes between platforms
    objects.push({ id: uid(), type: 'spike', x: 5, y: 14, width: 1, height: 1, color: '#f97316', behavior: 'static' })
    objects.push({ id: uid(), type: 'spike', x: 9, y: 14, width: 1, height: 1, color: '#f97316', behavior: 'static' })
    objects.push({ id: uid(), type: 'spike', x: 13, y: 14, width: 1, height: 1, color: '#f97316', behavior: 'static' })
    // Moving platform
    objects.push({ id: uid(), type: 'platform', x: 7, y: 7, width: 2, height: 1, color: '#a78bfa', behavior: 'patrol-horizontal', speed: 2 })
    // Coins on hard spots
    objects.push({ id: uid(), type: 'coin', x: 10, y: 8, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
    objects.push({ id: uid(), type: 'coin', x: 14, y: 7, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
  } else if (genre === 'adventure') {
    // Ground
    for (let x = 0; x < 20; x++) {
      objects.push({ id: uid(), type: 'platform', x, y: 14, width: 1, height: 1, color: '#4ade80', behavior: 'static' })
    }
    // Trees
    for (let x = 3; x < 18; x += 4) {
      objects.push({ id: uid(), type: 'decoration', x, y: 13, width: 1, height: 1, color: '#16a34a', behavior: 'static' })
    }
    // Coins scattered
    for (let x = 2; x < 18; x += 3) {
      objects.push({ id: uid(), type: 'coin', x, y: 12, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
    }
    // Friendly patrolling NPCs
    objects.push({ id: uid(), type: 'enemy', x: 8, y: 13, width: 1, height: 1, color: '#f472b6', behavior: 'patrol-horizontal', speed: 1 })
  } else if (genre === 'puzzle') {
    // Walls forming rooms
    for (let x = 0; x < 20; x++) {
      objects.push({ id: uid(), type: 'wall', x, y: 0, width: 1, height: 1, color: '#475569', behavior: 'static' })
      objects.push({ id: uid(), type: 'wall', x, y: 14, width: 1, height: 1, color: '#475569', behavior: 'static' })
    }
    for (let y = 0; y < 15; y++) {
      objects.push({ id: uid(), type: 'wall', x: 0, y, width: 1, height: 1, color: '#475569', behavior: 'static' })
      objects.push({ id: uid(), type: 'wall', x: 19, y, width: 1, height: 1, color: '#475569', behavior: 'static' })
    }
    // Room dividers with gaps
    for (let y = 0; y < 12; y++) {
      objects.push({ id: uid(), type: 'wall', x: 6, y, width: 1, height: 1, color: '#475569', behavior: 'static' })
    }
    for (let y = 3; y < 15; y++) {
      objects.push({ id: uid(), type: 'wall', x: 13, y, width: 1, height: 1, color: '#475569', behavior: 'static' })
    }
    // Coins as keys
    objects.push({ id: uid(), type: 'coin', x: 3, y: 7, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
    objects.push({ id: uid(), type: 'coin', x: 10, y: 4, width: 1, height: 1, color: '#fbbf24', behavior: 'static' })
  } else if (genre === 'tycoon') {
    // Ground
    for (let x = 0; x < 20; x++) {
      objects.push({ id: uid(), type: 'platform', x, y: 14, width: 1, height: 1, color: '#78716c', behavior: 'static' })
    }
    // Lots of coins
    for (let x = 2; x < 19; x += 2) {
      for (let y = 10; y < 14; y += 2) {
        objects.push({ id: uid(), type: 'coin', x, y, width: 1, height: 1, color: '#fbbf24', behavior: 'bounce' })
      }
    }
    // Decorations
    objects.push({ id: uid(), type: 'decoration', x: 5, y: 13, width: 1, height: 1, color: '#16a34a', behavior: 'static' })
    objects.push({ id: uid(), type: 'decoration', x: 15, y: 13, width: 1, height: 1, color: '#16a34a', behavior: 'static' })
  }

  return objects
}
