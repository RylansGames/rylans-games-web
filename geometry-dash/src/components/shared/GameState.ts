// Shared game state management across all games

export interface GameState {
  totalCoins: number
  equippedAvatar: number
  purchasedAvatars: number[]
  equippedPowers: number[]
  purchasedPowers: number[]
  playerName: string
  speedBoostLevel: number
  jumpPowerLevel: number
  scoreMultiplierLevel: number
}

class GameStateManager {
  private state: GameState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): GameState {
    const savedState = localStorage.getItem('miniclipPortalState')
    const defaultState: GameState = {
      totalCoins: 0,
      equippedAvatar: 0,
      purchasedAvatars: [0], // Bored face is always owned
      equippedPowers: [], // No powers equipped by default (only one can be equipped at a time)
      purchasedPowers: [0], // Press to shoot is always owned
      playerName: 'Player45125',
      speedBoostLevel: 0,
      jumpPowerLevel: 0,
      scoreMultiplierLevel: 0
    }

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Validate loaded state
        if (parsed.totalCoins < 0 || isNaN(parsed.totalCoins)) {
          parsed.totalCoins = 0
        }
        if (parsed.equippedAvatar < 0 || parsed.equippedAvatar > 49) {
          parsed.equippedAvatar = 0
        }
        if (!Array.isArray(parsed.purchasedAvatars)) {
          parsed.purchasedAvatars = [0]
        }
        if (!Array.isArray(parsed.equippedPowers)) {
          parsed.equippedPowers = [0]
        }
        if (!Array.isArray(parsed.purchasedPowers)) {
          parsed.purchasedPowers = [0]
        }
        return { ...defaultState, ...parsed }
      } catch (e) {
        console.error('Failed to load saved state:', e)
        return defaultState
      }
    }

    return defaultState
  }

  saveState(): void {
    localStorage.setItem('miniclipPortalState', JSON.stringify(this.state))
  }

  getCoins(): number {
    return this.state.totalCoins
  }

  addCoins(amount: number): void {
    this.state.totalCoins = this.state.totalCoins + amount
    this.saveState()
  }

  spendCoins(amount: number): boolean {
    if (this.state.totalCoins >= amount) {
      this.state.totalCoins -= amount
      this.saveState()
      return true
    }
    return false
  }

  getEquippedAvatar(): number {
    return this.state.equippedAvatar
  }

  setEquippedAvatar(avatarId: number): void {
    this.state.equippedAvatar = avatarId
    this.saveState()
  }

  getPurchasedAvatars(): number[] {
    return [...this.state.purchasedAvatars]
  }

  purchaseAvatar(avatarId: number): void {
    if (!this.state.purchasedAvatars.includes(avatarId)) {
      this.state.purchasedAvatars.push(avatarId)
      this.saveState()
    }
  }

  hasAvatar(avatarId: number): boolean {
    return this.state.purchasedAvatars.includes(avatarId)
  }

  getEquippedPowers(): number[] {
    return [...this.state.equippedPowers]
  }

  equipPower(powerId: number): void {
    if (!this.state.equippedPowers.includes(powerId) && this.state.purchasedPowers.includes(powerId)) {
      // Unequip all other powers first (only one power at a time)
      this.state.equippedPowers = [powerId]
      this.saveState()
    }
  }

  unequipPower(powerId: number): void {
    this.state.equippedPowers = this.state.equippedPowers.filter(id => id !== powerId)
    this.saveState()
  }

  getPurchasedPowers(): number[] {
    return [...this.state.purchasedPowers]
  }

  purchasePower(powerId: number): void {
    if (!this.state.purchasedPowers.includes(powerId)) {
      this.state.purchasedPowers.push(powerId)
      this.saveState()
    }
  }

  hasPower(powerId: number): boolean {
    return this.state.purchasedPowers.includes(powerId)
  }

  isPowerEquipped(powerId: number): boolean {
    return this.state.equippedPowers.includes(powerId)
  }

  getPlayerName(): string {
    return this.state.playerName
  }

  setPlayerName(name: string): void {
    this.state.playerName = name.trim() || 'Player45125'
    this.saveState()
  }

  getSpeedBoostLevel(): number {
    return this.state.speedBoostLevel
  }

  upgradeSpeedBoost(): void {
    this.state.speedBoostLevel++
    this.saveState()
  }

  getJumpPowerLevel(): number {
    return this.state.jumpPowerLevel
  }

  upgradeJumpPower(): void {
    this.state.jumpPowerLevel++
    this.saveState()
  }

  getScoreMultiplierLevel(): number {
    return this.state.scoreMultiplierLevel
  }

  upgradeScoreMultiplier(): void {
    this.state.scoreMultiplierLevel++
    this.saveState()
  }

  resetState(): void {
    this.state = {
      totalCoins: 0,
      equippedAvatar: 0,
      purchasedAvatars: [0],
      equippedPowers: [], // Only one power can be equipped at a time
      purchasedPowers: [0],
      playerName: 'Player45125',
      speedBoostLevel: 0,
      jumpPowerLevel: 0,
      scoreMultiplierLevel: 0
    }
    this.saveState()
  }
}

// Export singleton instance
export const gameState = new GameStateManager()