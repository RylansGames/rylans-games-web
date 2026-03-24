export interface BlockType {
  id: string
  color: string
  label: string
  emoji: string
}

export interface LevelBlock {
  x: number
  y: number
  type: string
}

export interface LevelData {
  id: string
  name: string
  author: string
  blocks: LevelBlock[]
  startX: number
  startY: number
  endX: number
  endY: number
  gridWidth: number
  gridHeight: number
  createdAt: number
  plays: number
  likes: number
}

export interface UserProfile {
  username: string
  passwordHash: string
  dateOfBirth: string
  createdAt: number
}

export const BLOCK_TYPES: BlockType[] = [
  { id: 'ground', color: '#8B4513', label: 'Ground', emoji: '🟫' },
  { id: 'spike', color: '#DC2626', label: 'Spike', emoji: '🔺' },
  { id: 'bounce', color: '#16A34A', label: 'Bounce', emoji: '🟢' },
  { id: 'ice', color: '#60A5FA', label: 'Ice', emoji: '🧊' },
  { id: 'lava', color: '#EA580C', label: 'Lava', emoji: '🔥' },
]

export const DEFAULT_GRID_WIDTH = 20
export const DEFAULT_GRID_HEIGHT = 12
