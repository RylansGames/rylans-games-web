<template>
  <div class="game-wrapper">
    <Settings />
    <CoinDisplay />
    <button class="back-button" @click="goBack">← Back to Portal</button>
    <div ref="gameContainer" id="phaser-game"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { gameState } from '../../components/shared/GameState'
import CoinDisplay from '../../components/shared/CoinDisplay.vue'
import Settings from '../../components/Settings.vue'

const gameContainer = ref<HTMLDivElement>()
const router = useRouter()
let game: Phaser.Game | null = null

const goBack = () => {
  router.push('/')
}

// Game State Management
interface GameData {
  brainrotPoints: number
  totalClicks: number
  currentEvolution: number
  autoClickerLevel: number
  clickMultiplier: number
  upgrades: {
    autoClicker1: boolean
    autoClicker2: boolean
    autoClicker3: boolean
    multiplier2x: boolean
    multiplier5x: boolean
    multiplier10x: boolean
  }
}

const defaultGameData: GameData = {
  brainrotPoints: 0,
  totalClicks: 0,
  currentEvolution: 1,
  autoClickerLevel: 0,
  clickMultiplier: 1,
  upgrades: {
    autoClicker1: false,
    autoClicker2: false,
    autoClicker3: false,
    multiplier2x: false,
    multiplier5x: false,
    multiplier10x: false
  }
}

class MainScene extends Phaser.Scene {
  private gameData!: GameData
  private evolutionSprite!: Phaser.GameObjects.Container
  private bpText!: Phaser.GameObjects.Text
  private clickText!: Phaser.GameObjects.Text
  private evolutionText!: Phaser.GameObjects.Text
  private clickableArea!: Phaser.GameObjects.Rectangle
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter
  private autoClickerTimer!: Phaser.Time.TimerEvent
  private shopButton!: Phaser.GameObjects.Rectangle
  private shopOpen = false
  private shopPanel!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    // Load game data
    const savedData = localStorage.getItem('brainrotEvolution')
    if (savedData) {
      this.gameData = JSON.parse(savedData)
    } else {
      this.gameData = { ...defaultGameData }
    }
  }

  create() {
    // Background with brainrot gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a0033, 0x1a0033, 0x330066, 0x330066, 1)
    bg.fillRect(0, 0, 800, 600)

    // Title
    const title = this.add.text(400, 40, '🧠 BRAINROT EVOLUTION 🧠', {
      fontSize: '36px',
      color: '#ff00ff',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setStroke('#ffffff', 4)

    // Brainrot Points display
    this.bpText = this.add.text(400, 90, `BP: ${Math.floor(this.gameData.brainrotPoints)}`, {
      fontSize: '28px',
      color: '#00ffff',
      fontStyle: 'bold'
    })
    this.bpText.setOrigin(0.5)
    this.bpText.setStroke('#000000', 3)

    // Click counter
    this.clickText = this.add.text(400, 120, `Clicks: ${this.gameData.totalClicks}`, {
      fontSize: '18px',
      color: '#ffffff'
    })
    this.clickText.setOrigin(0.5)

    // Evolution stage
    this.evolutionText = this.add.text(400, 150, this.getEvolutionName(), {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    this.evolutionText.setOrigin(0.5)
    this.evolutionText.setStroke('#000000', 3)

    // Create evolution character
    this.createEvolutionCharacter()

    // Clickable area (invisible)
    this.clickableArea = this.add.rectangle(400, 350, 300, 300, 0x000000, 0)
    this.clickableArea.setInteractive({ useHandCursor: true })
    this.clickableArea.on('pointerdown', () => this.handleClick())

    // Particle system for clicks
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 200,
      tint: [0xff00ff, 0x00ffff, 0xffff00],
      emitting: false
    })

    // Shop button
    this.shopButton = this.add.rectangle(700, 550, 150, 50, 0x9f7aea)
    this.shopButton.setStrokeStyle(3, 0xffffff)
    this.shopButton.setInteractive({ useHandCursor: true })

    const shopText = this.add.text(700, 550, '🛒 SHOP', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    shopText.setOrigin(0.5)

    this.shopButton.on('pointerdown', () => this.toggleShop())
    this.shopButton.on('pointerover', () => this.shopButton.setFillStyle(0xb794f4))
    this.shopButton.on('pointerout', () => this.shopButton.setFillStyle(0x9f7aea))

    // Create shop panel
    this.createShopPanel()

    // Auto-clicker timer
    this.autoClickerTimer = this.time.addEvent({
      delay: 1000,
      callback: this.autoClick,
      callbackScope: this,
      loop: true
    })

    // Instructions
    const instructions = this.add.text(400, 530, 'Click the brainrot to generate BP! 🧠', {
      fontSize: '16px',
      color: '#ffffff'
    })
    instructions.setOrigin(0.5)

    // Save progress every 5 seconds
    this.time.addEvent({
      delay: 5000,
      callback: this.saveProgress,
      callbackScope: this,
      loop: true
    })
  }

  private createEvolutionCharacter() {
    // Remove old character if exists
    if (this.evolutionSprite) {
      this.evolutionSprite.destroy()
    }

    this.evolutionSprite = this.add.container(400, 350)

    // Evolution 1: "tung tung tung tung sahur"
    if (this.gameData.currentEvolution === 1) {
      // Main body
      const body = this.add.circle(0, 0, 60, 0xff00ff)
      body.setStrokeStyle(4, 0x000000)

      // Eyes
      const leftEye = this.add.circle(-20, -10, 8, 0xffffff)
      leftEye.setStrokeStyle(2, 0x000000)
      const leftPupil = this.add.circle(-20, -10, 4, 0x000000)

      const rightEye = this.add.circle(20, -10, 8, 0xffffff)
      rightEye.setStrokeStyle(2, 0x000000)
      const rightPupil = this.add.circle(20, -10, 4, 0x000000)

      // Mouth
      const mouth = this.add.graphics()
      mouth.lineStyle(3, 0x000000)
      mouth.beginPath()
      mouth.arc(0, 10, 20, 0, Math.PI, false)
      mouth.strokePath()

      // Add text below
      const nameText = this.add.text(0, 90, 'tung tung tung\ntung sahur', {
        fontSize: '18px',
        color: '#00ffff',
        fontStyle: 'bold',
        align: 'center'
      })
      nameText.setOrigin(0.5)

      this.evolutionSprite.add([body, leftEye, leftPupil, rightEye, rightPupil, mouth, nameText])

      // Bouncing animation
      this.tweens.add({
        targets: this.evolutionSprite,
        y: 330,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Rotation animation
      this.tweens.add({
        targets: this.evolutionSprite,
        angle: { from: -10, to: 10 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private createShopPanel() {
    this.shopPanel = this.add.container(400, 300)
    this.shopPanel.setVisible(false)
    this.shopPanel.setDepth(1000)

    // Background
    const bg = this.add.rectangle(0, 0, 600, 400, 0x1a1a2e, 0.95)
    bg.setStrokeStyle(4, 0xff00ff)

    // Title
    const title = this.add.text(0, -170, '🛒 UPGRADE SHOP 🛒', {
      fontSize: '28px',
      color: '#ff00ff',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)

    // Close button
    const closeBtn = this.add.rectangle(270, -170, 40, 40, 0xff0000)
    closeBtn.setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.toggleShop())

    const closeText = this.add.text(270, -170, '✕', {
      fontSize: '24px',
      color: '#ffffff'
    })
    closeText.setOrigin(0.5)

    // Upgrades
    const upgrades = [
      { name: 'Auto Clicker 1', cost: 50, key: 'autoClicker1', desc: '+1 BP/sec' },
      { name: 'Auto Clicker 2', cost: 200, key: 'autoClicker2', desc: '+5 BP/sec' },
      { name: 'Auto Clicker 3', cost: 1000, key: 'autoClicker3', desc: '+25 BP/sec' },
      { name: '2x Click Power', cost: 100, key: 'multiplier2x', desc: 'Double clicks' },
      { name: '5x Click Power', cost: 500, key: 'multiplier5x', desc: '5x clicks' },
      { name: '10x Click Power', cost: 2500, key: 'multiplier10x', desc: '10x clicks' }
    ]

    upgrades.forEach((upgrade, index) => {
      const y = -120 + index * 70
      const x = index < 3 ? -150 : 150
      const localY = y - (Math.floor(index / 3) * 210)

      this.createUpgradeButton(upgrade, x, localY)
    })

    this.shopPanel.add([bg, title, closeBtn, closeText])
  }

  private createUpgradeButton(upgrade: any, x: number, y: number) {
    const isPurchased = (this.gameData.upgrades as any)[upgrade.key]
    const canAfford = this.gameData.brainrotPoints >= upgrade.cost

    const btn = this.add.rectangle(x, y, 240, 60, isPurchased ? 0x00ff00 : (canAfford ? 0x9f7aea : 0x4a4a4a))
    btn.setStrokeStyle(2, 0xffffff)

    const nameText = this.add.text(x, y - 12, upgrade.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    nameText.setOrigin(0.5)

    const costText = this.add.text(x, y + 8, isPurchased ? '✓ OWNED' : `${upgrade.cost} BP`, {
      fontSize: '14px',
      color: isPurchased ? '#000000' : '#ffff00'
    })
    costText.setOrigin(0.5)

    if (!isPurchased) {
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => this.purchaseUpgrade(upgrade))
      btn.on('pointerover', () => btn.setFillStyle(canAfford ? 0xb794f4 : 0x666666))
      btn.on('pointerout', () => btn.setFillStyle(canAfford ? 0x9f7aea : 0x4a4a4a))
    }

    this.shopPanel.add([btn, nameText, costText])
  }

  private purchaseUpgrade(upgrade: any) {
    if (this.gameData.brainrotPoints >= upgrade.cost && !(this.gameData.upgrades as any)[upgrade.key]) {
      this.gameData.brainrotPoints -= upgrade.cost;
      (this.gameData.upgrades as any)[upgrade.key] = true

      // Apply upgrade effects
      if (upgrade.key.startsWith('autoClicker')) {
        this.gameData.autoClickerLevel++
      }
      if (upgrade.key === 'multiplier2x') this.gameData.clickMultiplier = 2
      if (upgrade.key === 'multiplier5x') this.gameData.clickMultiplier = 5
      if (upgrade.key === 'multiplier10x') this.gameData.clickMultiplier = 10

      this.saveProgress()
      this.toggleShop()
      this.toggleShop() // Refresh shop

      // Show purchase effect
      this.showFloatingText(400, 300, 'PURCHASED!', '#00ff00')
    }
  }

  private handleClick() {
    if (this.shopOpen) return

    const basePoints = 1 * this.gameData.clickMultiplier
    this.gameData.brainrotPoints += basePoints
    this.gameData.totalClicks++

    // Update displays
    this.updateDisplay()

    // Particle effect
    this.particles.explode(10, this.evolutionSprite.x, this.evolutionSprite.y)

    // Floating text
    this.showFloatingText(this.evolutionSprite.x, this.evolutionSprite.y - 80, `+${basePoints}`, '#00ffff')

    // Scale animation on character
    this.tweens.add({
      targets: this.evolutionSprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true
    })

    // Check for evolution milestone
    this.checkEvolution()
  }

  private autoClick() {
    if (this.shopOpen) return

    let bpPerSecond = 0
    if (this.gameData.upgrades.autoClicker1) bpPerSecond += 1
    if (this.gameData.upgrades.autoClicker2) bpPerSecond += 5
    if (this.gameData.upgrades.autoClicker3) bpPerSecond += 25

    if (bpPerSecond > 0) {
      this.gameData.brainrotPoints += bpPerSecond
      this.updateDisplay()
    }
  }

  private checkEvolution() {
    // Evolution 2 at 500 BP (add more evolutions later!)
    if (this.gameData.brainrotPoints >= 500 && this.gameData.currentEvolution === 1) {
      this.gameData.currentEvolution = 2
      // TODO: Add more evolutions in future!
      this.showFloatingText(400, 300, '✨ EVOLUTION UNLOCKED! ✨', '#ffff00', 32)

      // Give coin reward
      gameState.addCoins(50)
    }
  }

  private updateDisplay() {
    this.bpText.setText(`BP: ${Math.floor(this.gameData.brainrotPoints)}`)
    this.clickText.setText(`Clicks: ${this.gameData.totalClicks}`)
    this.evolutionText.setText(this.getEvolutionName())
  }

  private getEvolutionName(): string {
    switch (this.gameData.currentEvolution) {
      case 1: return 'Stage 1: tung tung tung tung sahur'
      case 2: return 'Stage 2: ???' // Add more later!
      default: return 'Stage 1'
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string, size: number = 20) {
    const floatingText = this.add.text(x, y, text, {
      fontSize: `${size}px`,
      color: color,
      fontStyle: 'bold'
    })
    floatingText.setOrigin(0.5)
    floatingText.setStroke('#000000', 3)

    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => floatingText.destroy()
    })
  }

  private toggleShop() {
    this.shopOpen = !this.shopOpen

    if (this.shopOpen) {
      // Recreate shop panel to refresh
      this.shopPanel.destroy()
      this.createShopPanel()
      this.shopPanel.setVisible(true)
    } else {
      this.shopPanel.setVisible(false)
    }
  }

  private saveProgress() {
    localStorage.setItem('brainrotEvolution', JSON.stringify(this.gameData))
  }

  update() {
    // Continuous updates can go here
  }
}

onMounted(() => {
  if (gameContainer.value) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.value,
      backgroundColor: '#1a0033',
      scene: [MainScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
    }

    game = new Phaser.Game(config)
  }
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
  }
})
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #ff0000;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: background 0.3s;
}

.back-button:hover {
  background: #cc0000;
}

#phaser-game {
  border: 3px solid #ff00ff;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
}
</style>
