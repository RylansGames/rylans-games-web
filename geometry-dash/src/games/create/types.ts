export interface GameObject {
  id: string
  type: ObjectType
  x: number
  y: number
  z?: number
  width: number
  height: number
  depth?: number
  color: string
  behavior: BehaviorType
  speed?: number
  label?: string
}

export type ObjectType =
  | 'player'
  | 'platform'
  | 'enemy'
  | 'coin'
  | 'goal'
  | 'spike'
  | 'wall'
  | 'decoration'
  | 'light'
  | 'text'

export type BehaviorType =
  | 'static'
  | 'patrol-horizontal'
  | 'patrol-vertical'
  | 'chase'
  | 'bounce'
  | 'spin'

export interface GameData {
  id: string
  name: string
  description: string
  author: string
  mode: '2d' | '3d'
  genre: string
  objects: GameObject[]
  bgColor: string
  gravity: number
  createdAt: number
  published: boolean
  plays: number
  likes: number
}

export const OBJECT_PALETTE: { type: ObjectType; icon: string; label: string; color: string }[] = [
  { type: 'player', icon: '🧍', label: 'Player', color: '#3b82f6' },
  { type: 'platform', icon: '🟫', label: 'Platform', color: '#78716c' },
  { type: 'enemy', icon: '👾', label: 'Enemy', color: '#ef4444' },
  { type: 'coin', icon: '🪙', label: 'Coin', color: '#fbbf24' },
  { type: 'goal', icon: '🏁', label: 'Goal', color: '#22c55e' },
  { type: 'spike', icon: '🔺', label: 'Spike', color: '#f97316' },
  { type: 'wall', icon: '🧱', label: 'Wall', color: '#64748b' },
  { type: 'decoration', icon: '🌳', label: 'Decor', color: '#16a34a' },
  { type: 'light', icon: '💡', label: 'Light', color: '#fde68a' },
  { type: 'text', icon: '📝', label: 'Text', color: '#a78bfa' },
]

export const GENRES = [
  { id: 'platformer', label: 'Platformer', icon: '🏃' },
  { id: 'scary', label: 'Scary', icon: '👻' },
  { id: 'adventure', label: 'Adventure', icon: '🗺️' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
  { id: 'obby', label: 'Obby', icon: '🏔️' },
  { id: 'tycoon', label: 'Tycoon', icon: '💰' },
]
