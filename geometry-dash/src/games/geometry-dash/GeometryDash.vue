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

// Use shared game state
let totalCoins = gameState.getCoins()
let equippedAvatar = gameState.getEquippedAvatar()
let purchasedAvatars = gameState.getPurchasedAvatars()

function saveGameState() {
  // Game state is now automatically saved by the GameState manager
}

const goBack = () => {
  router.push('/')
}

class HomeScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'HomeScene' })
  }

  create() {
    // Coin display in top-left corner
    const coinIcon = this.add.circle(50, 50, 15, 0xffd700)
    coinIcon.setStrokeStyle(2, 0x000000)
    
    // Add a "C" to make it look like a coin
    const coinLetter = this.add.text(50, 50, 'C', {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    })
    coinLetter.setOrigin(0.5)
    
    // Coin count text
    this.coinText = this.add.text(80, 50, `: ${totalCoins}`, {
      fontSize: '24px',
      color: '#ffd700'
    })
    this.coinText.setOrigin(0, 0.5)
    this.coinText.setStroke('#000000', 2)
    
    // Show coin multiplier if player has rebirths
    const rebirthCount = gameState.getRebirthCount()
    if (rebirthCount > 0) {
      const multiplier = gameState.getCoinMultiplier()
      const multiplierText = this.add.text(50, 85, `Coin Multiplier: x${multiplier} ⭐`, {
        fontSize: '16px',
        color: '#ff00ff'
      })
      multiplierText.setOrigin(0, 0.5)
      multiplierText.setStroke('#000000', 2)
      
      // Add rebirth stars display
      const rebirthStarsText = this.add.text(50, 110, `Rebirths: ${rebirthCount} ⭐`, {
        fontSize: '16px',
        color: '#ffd700'
      })
      rebirthStarsText.setOrigin(0, 0.5)
      rebirthStarsText.setStroke('#000000', 2)
    }
    
    // Title
    const title = this.add.text(400, 200, 'Geometry Dash', {
      fontSize: '48px',
      color: '#ffff00'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 4)

    // Play button
    const playButton = this.add.rectangle(400, 350, 200, 60, 0x00ff00)
    playButton.setStrokeStyle(3, 0x000000)
    playButton.setInteractive()

    const playText = this.add.text(400, 350, 'PLAY', {
      fontSize: '32px',
      color: '#000000'
    })
    playText.setOrigin(0.5)

    // Hover effects
    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x00dd00)
    })

    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x00ff00)
    })

    // Start game on click
    playButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })

    // Instructions
    const instructions = this.add.text(400, 450, 'Click or SPACE to jump\nPress F to shoot (20s cooldown)', {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    })
    instructions.setOrigin(0.5)
    
    // Avatar button
    const avatarButton = this.add.rectangle(700, 50, 120, 40, 0x9400d3)
    avatarButton.setStrokeStyle(3, 0x000000)
    avatarButton.setInteractive()
    
    const avatarText = this.add.text(700, 50, 'Avatar', {
      fontSize: '20px',
      color: '#ffffff'
    })
    avatarText.setOrigin(0.5)
    
    // Avatar button hover effects
    avatarButton.on('pointerover', () => {
      avatarButton.setFillStyle(0xb300ff)
    })
    
    avatarButton.on('pointerout', () => {
      avatarButton.setFillStyle(0x9400d3)
    })
    
    // Avatar button click
    avatarButton.on('pointerdown', () => {
      this.scene.start('AvatarScene')
    })
    
    // Powers button
    const powersButton = this.add.rectangle(700, 100, 120, 40, 0x667eea)
    powersButton.setStrokeStyle(3, 0x000000)
    powersButton.setInteractive()
    
    const powersText = this.add.text(700, 100, 'Powers', {
      fontSize: '20px',
      color: '#ffffff'
    })
    powersText.setOrigin(0.5)
    
    // Powers button hover effects
    powersButton.on('pointerover', () => {
      powersButton.setFillStyle(0x8899ff)
    })
    
    powersButton.on('pointerout', () => {
      powersButton.setFillStyle(0x667eea)
    })
    
    // Powers button click
    powersButton.on('pointerdown', () => {
      this.scene.start('PowersScene')
    })
    
    // Upgrades button
    const upgradesButton = this.add.rectangle(700, 150, 120, 40, 0x48bb78)
    upgradesButton.setStrokeStyle(3, 0x000000)
    upgradesButton.setInteractive()
    
    const upgradesText = this.add.text(700, 150, 'Upgrades', {
      fontSize: '20px',
      color: '#ffffff'
    })
    upgradesText.setOrigin(0.5)
    
    // Upgrades button hover effects
    upgradesButton.on('pointerover', () => {
      upgradesButton.setFillStyle(0x68d391)
    })
    
    upgradesButton.on('pointerout', () => {
      upgradesButton.setFillStyle(0x48bb78)
    })
    
    // Upgrades button click
    upgradesButton.on('pointerdown', () => {
      this.scene.start('UpgradesScene')
    })
    
    // Rebirth button (under Upgrades)
    const rebirthButton = this.add.rectangle(700, 200, 120, 40, 0xff0000)
    rebirthButton.setStrokeStyle(3, 0x000000)
    rebirthButton.setInteractive()
    
    const rebirthText = this.add.text(700, 200, 'Rebirth', {
      fontSize: '20px',
      color: '#ffffff'
    })
    rebirthText.setOrigin(0.5)
    
    // Rebirth button hover effects
    rebirthButton.on('pointerover', () => {
      rebirthButton.setFillStyle(0xcc0000)
    })
    
    rebirthButton.on('pointerout', () => {
      rebirthButton.setFillStyle(0xff0000)
    })
    
    // Rebirth button click
    rebirthButton.on('pointerdown', () => {
      this.scene.start('RebirthScene')
    })
  }
}

class AvatarScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AvatarScene' })
  }

  create() {
    // Check for ultra rare free event (0.001% chance)
    const isFreeEvent = Math.random() < 0.00001 // 0.001% chance
    
    // Title
    const titleText = isFreeEvent ? '🎉 EVERYTHING FREE! 🎉' : 'Avatar Customization'
    const title = this.add.text(400, 50, titleText, {
      fontSize: '36px',
      color: isFreeEvent ? '#ff00ff' : '#ffff00'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 3)
    
    if (isFreeEvent) {
      // Add sparkle effect text
      const sparkleText = this.add.text(400, 90, '✨ ULTRA RARE EVENT! ✨', {
        fontSize: '20px',
        color: '#ffffff'
      })
      sparkleText.setOrigin(0.5)
      sparkleText.setStroke('#ff00ff', 2)
      
      // Make it blink
      this.tweens.add({
        targets: sparkleText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
    }

    // Back button
    const backButton = this.add.rectangle(50, 50, 80, 40, 0xff0000)
    backButton.setStrokeStyle(2, 0x000000)
    backButton.setInteractive()
    
    const backText = this.add.text(50, 50, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    
    // Back button hover
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xdd0000)
    })
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0xff0000)
    })
    
    // Back button click
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene')
    })

    // Create 50 medium square slots at the bottom
    const slotSize = 50
    const padding = 10
    const slotsPerRow = 10
    const totalRows = 5
    const startY = 180
    
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < slotsPerRow; col++) {
        const index = row * slotsPerRow + col
        const x = 100 + col * (slotSize + padding)
        const y = startY + row * (slotSize + padding)
        
        // Create slot
        const slot = this.add.rectangle(x, y, slotSize, slotSize, 0x333333)
        slot.setStrokeStyle(2, 0x666666)
        slot.setInteractive()
        
        // Add slot number (except for slot 1)
        if (index !== 0) {
          const slotNumber = this.add.text(x, y, (index + 1).toString(), {
            fontSize: '14px',
            color: '#999999'
          })
          slotNumber.setOrigin(0.5)
        }
        
        // Add bored face to slot 1
        if (index === 0) {
          // Yellow background for the face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xffff00)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Eyes
          const leftEye = this.add.circle(x - 10, y - 5, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 5, 3, 0x000000)
          
          // Mouth
          const mouth = this.add.rectangle(x, y + 10, 20, 2, 0x000000)
          
          // Add Equip/Equipped text below
          const equipText = this.add.text(x, y + 35, equippedAvatar === 0 ? 'Equipped' : 'Equip', {
            fontSize: '12px',
            color: equippedAvatar === 0 ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10) // Make sure text is above other slots
          
          // Store reference to update later
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 0)
        }
        
        // Add happy face to slot 2
        if (index === 1) {
          // Yellow background for the face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xffff00)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Eyes
          const leftEye = this.add.circle(x - 10, y - 8, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 8, 3, 0x000000)
          
          // Happy smile (arc)
          const graphics = this.add.graphics()
          graphics.lineStyle(2, 0x000000, 1)
          graphics.beginPath()
          graphics.arc(x, y + 5, 15, 0, Math.PI, false)
          graphics.strokePath()
          
          // Add price
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '30', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 20, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 30 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(1)) {
            equipTextStr = equippedAvatar === 1 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 1 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 1)
          slot.setData('price', 30)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(1)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add mischievous cat face >:3 to slot 3
        if (index === 2) {
          // Yellow background for the face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xffff00)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // > eye
          const leftEyeText = this.add.text(x - 12, y - 8, '>', {
            fontSize: '16px',
            color: '#000000',
            fontStyle: 'bold'
          })
          leftEyeText.setOrigin(0.5)
          
          // Normal eye (dot)
          const rightEye = this.add.circle(x + 10, y - 5, 3, 0x000000)
          
          // :3 mouth
          const mouthText = this.add.text(x, y + 8, ':3', {
            fontSize: '14px',
            color: '#000000',
            fontStyle: 'bold'
          })
          mouthText.setOrigin(0.5)
          
          // Add price (50 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '50', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 20, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 50 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(2)) {
            equipTextStr = equippedAvatar === 2 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 2 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 2)
          slot.setData('price', 50)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(2)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add rainbow throwing up face to slot 4
        if (index === 3) {
          // Light blue background for the face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x87CEEB)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // X eyes (dead/sick look)
          const leftEyeX = this.add.text(x - 10, y - 8, 'X', {
            fontSize: '12px',
            color: '#000000',
            fontStyle: 'bold'
          })
          leftEyeX.setOrigin(0.5)
          
          const rightEyeX = this.add.text(x + 10, y - 8, 'X', {
            fontSize: '12px',
            color: '#000000',
            fontStyle: 'bold'
          })
          rightEyeX.setOrigin(0.5)
          
          // Open mouth
          const mouth = this.add.ellipse(x, y + 8, 20, 12, 0x000000)
          
          // Rainbow vomit
          const rainbowColors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3]
          for (let i = 0; i < 7; i++) {
            const rainbowStripe = this.add.rectangle(
              x, 
              y + 15 + (i * 3), 
              25 - (i * 2), 
              3, 
              rainbowColors[i]
            )
          }
          
          // Add price (75 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '75', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 20, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 75 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(3)) {
            equipTextStr = equippedAvatar === 3 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 3 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 3)
          slot.setData('price', 75)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(3)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add Roblox man face to slot 5
        if (index === 4) {
          // Tan/beige background for the face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xF5DEB3)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Classic Roblox face - simple dots for eyes and curved smile
          // Eyes (simple black dots)
          const leftEye = this.add.circle(x - 8, y - 5, 2, 0x000000)
          const rightEye = this.add.circle(x + 8, y - 5, 2, 0x000000)
          
          // Classic Roblox smile (arc)
          const smile = this.add.arc(x, y + 5, 12, 0, 180, false, 0x000000)
          smile.setStrokeStyle(3, 0x000000)
          smile.setRotation(Math.PI)
          
          // Add price (100 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '100', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 100 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(4)) {
            equipTextStr = equippedAvatar === 4 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 4 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 4)
          slot.setData('price', 100)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(4)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add funny face to slot 6
        if (index === 5) {
          // Light pink background for the funny face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFB6C1)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Derpy eyes - one looking up, one looking to the side
          const leftEye = this.add.circle(x - 10, y - 8, 8, 0xFFFFFF)
          leftEye.setStrokeStyle(2, 0x000000)
          const leftPupil = this.add.circle(x - 10, y - 12, 3, 0x000000) // Looking up
          
          const rightEye = this.add.circle(x + 10, y - 8, 8, 0xFFFFFF)
          rightEye.setStrokeStyle(2, 0x000000)
          const rightPupil = this.add.circle(x + 14, y - 8, 3, 0x000000) // Looking right
          
          // Silly wavy mouth - using simple line segments for a wavy effect
          const graphics = this.add.graphics()
          graphics.lineStyle(3, 0x000000, 1)
          graphics.beginPath()
          graphics.moveTo(x - 15, y + 5)
          graphics.lineTo(x - 8, y + 12)
          graphics.lineTo(x, y + 3)
          graphics.lineTo(x + 8, y + 10)
          graphics.lineTo(x + 15, y + 8)
          graphics.strokePath()
          
          // Tongue sticking out
          const tongue = this.add.ellipse(x + 5, y + 12, 10, 15, 0xFF69B4)
          tongue.setStrokeStyle(2, 0x000000)
          
          // Add price (200 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '200', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 200 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(5)) {
            equipTextStr = equippedAvatar === 5 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 5 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 5)
          slot.setData('price', 200)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(5)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add serious face to slot 7
        if (index === 6) {
          // Dark gray background for the serious face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x4B4B4D)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Intense eyes - narrow rectangles
          const leftEye = this.add.rectangle(x - 10, y - 8, 12, 4, 0x000000)
          const rightEye = this.add.rectangle(x + 10, y - 8, 12, 4, 0x000000)
          
          // Thick eyebrows angled downward (furrowed brow)
          const leftEyebrow = this.add.rectangle(x - 10, y - 15, 15, 3, 0x000000)
          leftEyebrow.setRotation(-0.3) // Angle down toward center
          
          const rightEyebrow = this.add.rectangle(x + 10, y - 15, 15, 3, 0x000000)
          rightEyebrow.setRotation(0.3) // Angle down toward center
          
          // Straight, thin mouth (no smile)
          const mouth = this.add.rectangle(x, y + 8, 25, 2, 0x000000)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Serious', {
            fontSize: '10px',
            color: '#ffffff'
          })
          nameText.setOrigin(0.5)
          
          // Add price (300 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '300', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 300 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(6)) {
            equipTextStr = equippedAvatar === 6 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 6 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 6)
          slot.setData('price', 300)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(6)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add Sigma face to slot 8
        if (index === 7) {
          // Cool blue-gray background for the Sigma face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x536878)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Confident half-lidded eyes
          const leftEye = this.add.rectangle(x - 10, y - 8, 10, 6, 0x000000)
          const rightEye = this.add.rectangle(x + 10, y - 8, 10, 6, 0x000000)
          
          // Cool sunglasses overlay (semi-transparent)
          const leftShade = this.add.rectangle(x - 10, y - 8, 14, 10, 0x000000, 0.3)
          leftShade.setStrokeStyle(2, 0x000000)
          const rightShade = this.add.rectangle(x + 10, y - 8, 14, 10, 0x000000, 0.3)
          rightShade.setStrokeStyle(2, 0x000000)
          // Bridge between sunglasses
          const bridge = this.add.rectangle(x, y - 8, 8, 2, 0x000000)
          
          // Confident smirk (curved line)
          const graphics = this.add.graphics()
          graphics.lineStyle(3, 0x000000, 1)
          graphics.beginPath()
          graphics.moveTo(x - 8, y + 8)
          graphics.lineTo(x + 2, y + 10)
          graphics.lineTo(x + 12, y + 6)
          graphics.strokePath()
          
          // Add Sigma symbol (Σ)
          const sigmaText = this.add.text(x + 20, y - 20, 'Σ', {
            fontSize: '16px',
            color: '#4169E1',
            fontWeight: 'bold'
          })
          sigmaText.setOrigin(0.5)
          sigmaText.setStroke('#000000', 2)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Sigma', {
            fontSize: '10px',
            color: '#4169E1',
            fontWeight: 'bold'
          })
          nameText.setOrigin(0.5)
          
          // Add price (500 coins - expensive for the alpha)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '500', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon next to price
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text below price
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 500 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(7)) {
            equipTextStr = equippedAvatar === 7 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 7 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 7)
          slot.setData('price', 500)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(7)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
          
          // Store extra elements for the smirk
          slot.setData('sigmaSmirk', graphics)
        }
        
        // Add sad face to slot 9
        if (index === 8) {
          // Light blue background for the sad face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x87CEEB)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Sad eyes (downward curved)
          const leftEye = this.add.circle(x - 10, y - 8, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 8, 3, 0x000000)
          
          // Tears
          const leftTear = this.add.ellipse(x - 10, y - 2, 4, 8, 0x00BFFF)
          leftTear.setStrokeStyle(1, 0x0080FF)
          const rightTear = this.add.ellipse(x + 10, y - 2, 4, 8, 0x00BFFF)
          rightTear.setStrokeStyle(1, 0x0080FF)
          
          // Sad frown
          const frown = this.add.graphics()
          frown.lineStyle(3, 0x000000, 1)
          frown.beginPath()
          frown.moveTo(x - 12, y + 12)
          frown.lineTo(x - 5, y + 8)
          frown.lineTo(x + 5, y + 8)
          frown.lineTo(x + 12, y + 12)
          frown.strokePath()
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Sad', {
            fontSize: '10px',
            color: '#87CEEB'
          })
          nameText.setOrigin(0.5)
          
          // Add price (150 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '150', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 150 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(8)) {
            equipTextStr = equippedAvatar === 8 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 8 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 8)
          slot.setData('price', 150)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('sadFrown', frown)
          slot.setData('tears', [leftTear, rightTear])
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(8)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add scared face to slot 10
        if (index === 9) {
          // Pale yellow background for the scared face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFFACD)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Wide scared eyes
          const leftEyeWhite = this.add.circle(x - 10, y - 8, 10, 0xFFFFFF)
          leftEyeWhite.setStrokeStyle(2, 0x000000)
          const leftPupil = this.add.circle(x - 10, y - 8, 5, 0x000000)
          
          const rightEyeWhite = this.add.circle(x + 10, y - 8, 10, 0xFFFFFF)
          rightEyeWhite.setStrokeStyle(2, 0x000000)
          const rightPupil = this.add.circle(x + 10, y - 8, 5, 0x000000)
          
          // Raised eyebrows
          const leftBrow = this.add.rectangle(x - 10, y - 18, 12, 2, 0x000000)
          leftBrow.setRotation(0.3)
          const rightBrow = this.add.rectangle(x + 10, y - 18, 12, 2, 0x000000)
          rightBrow.setRotation(-0.3)
          
          // Open mouth (shocked)
          const mouth = this.add.ellipse(x, y + 10, 15, 20, 0x000000)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Scared', {
            fontSize: '10px',
            color: '#FFD700'
          })
          nameText.setOrigin(0.5)
          
          // Add price (175 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '175', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 175 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(9)) {
            equipTextStr = equippedAvatar === 9 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 9 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 9)
          slot.setData('price', 175)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('scaredElements', [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow])
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(9)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add really happy face to slot 11
        if (index === 10) {
          // Bright yellow background for the really happy face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFFF00)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Sparkle eyes (star shaped)
          const leftStar = this.add.star(x - 10, y - 8, 5, 3, 6, 0x000000)
          const rightStar = this.add.star(x + 10, y - 8, 5, 3, 6, 0x000000)
          
          // Huge smile
          const bigSmile = this.add.graphics()
          bigSmile.lineStyle(4, 0x000000, 1)
          bigSmile.beginPath()
          bigSmile.arc(x, y, 20, 0, Math.PI, false)
          bigSmile.strokePath()
          
          // Rosy cheeks
          const leftCheek = this.add.circle(x - 20, y, 8, 0xFF69B4, 0.5)
          const rightCheek = this.add.circle(x + 20, y, 8, 0xFF69B4, 0.5)
          
          // Sparkles around face
          const sparkle1 = this.add.text(x - 25, y - 20, '✨', { fontSize: '12px' })
          const sparkle2 = this.add.text(x + 20, y - 20, '✨', { fontSize: '12px' })
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Super Happy', {
            fontSize: '10px',
            color: '#FF6347'
          })
          nameText.setOrigin(0.5)
          
          // Add price (250 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '250', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 250 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(10)) {
            equipTextStr = equippedAvatar === 10 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 10 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 10)
          slot.setData('price', 250)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('happySmile', bigSmile)
          slot.setData('happyElements', [leftCheek, rightCheek, sparkle1, sparkle2])
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(10)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add embarrassed face to slot 12
        if (index === 11) {
          // Light pink/peach background for the embarrassed face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFDAB9)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Avoiding eyes (looking to the side)
          const leftEye = this.add.circle(x - 10, y - 8, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 8, 3, 0x000000)
          
          // Sweat drop
          const sweatDrop = this.add.ellipse(x + 18, y - 15, 5, 8, 0x87CEEB)
          sweatDrop.setStrokeStyle(1, 0x4682B4)
          
          // Nervous smile
          const nervousSmile = this.add.graphics()
          nervousSmile.lineStyle(2, 0x000000, 1)
          nervousSmile.beginPath()
          nervousSmile.moveTo(x - 10, y + 8)
          nervousSmile.lineTo(x - 3, y + 10)
          nervousSmile.lineTo(x + 3, y + 8)
          nervousSmile.lineTo(x + 10, y + 10)
          nervousSmile.strokePath()
          
          // Blush marks
          const leftBlush = this.add.graphics()
          leftBlush.lineStyle(2, 0xFF1493, 0.8)
          leftBlush.moveTo(x - 20, y - 2)
          leftBlush.lineTo(x - 15, y)
          leftBlush.moveTo(x - 20, y + 2)
          leftBlush.lineTo(x - 15, y + 4)
          leftBlush.strokePath()
          
          const rightBlush = this.add.graphics()
          rightBlush.lineStyle(2, 0xFF1493, 0.8)
          rightBlush.moveTo(x + 15, y - 2)
          rightBlush.lineTo(x + 20, y)
          rightBlush.moveTo(x + 15, y + 2)
          rightBlush.lineTo(x + 20, y + 4)
          rightBlush.strokePath()
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Embarrassed', {
            fontSize: '10px',
            color: '#FF69B4'
          })
          nameText.setOrigin(0.5)
          
          // Add price (225 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '225', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 225 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(11)) {
            equipTextStr = equippedAvatar === 11 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 11 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 11)
          slot.setData('price', 225)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('nervousSmile', nervousSmile)
          slot.setData('embarrassedElements', [sweatDrop, leftBlush, rightBlush])
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(11)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add really really bored face to slot 13
        if (index === 12) {
          // Gray background for extremely bored face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xCCCCCC)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Half-closed tired eyes
          const leftEye = this.add.rectangle(x - 10, y - 8, 12, 2, 0x000000)
          const rightEye = this.add.rectangle(x + 10, y - 8, 12, 2, 0x000000)
          
          // Extremely flat mouth
          const mouth = this.add.rectangle(x, y + 10, 25, 1, 0x000000)
          
          // Add bags under eyes
          const leftBag = this.add.graphics()
          leftBag.lineStyle(1, 0x666666, 0.8)
          leftBag.beginPath()
          leftBag.arc(x - 10, y - 4, 8, 0, Math.PI, false)
          leftBag.strokePath()
          
          const rightBag = this.add.graphics()
          rightBag.lineStyle(1, 0x666666, 0.8)
          rightBag.beginPath()
          rightBag.arc(x + 10, y - 4, 8, 0, Math.PI, false)
          rightBag.strokePath()
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Really Bored', {
            fontSize: '10px',
            color: '#666666'
          })
          nameText.setOrigin(0.5)
          
          // Add price (250 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '250', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 250 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(12)) {
            equipTextStr = equippedAvatar === 12 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 12 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 12)
          slot.setData('price', 250)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(12)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add depressed face to slot 14
        if (index === 13) {
          // Dark blue-gray background for depressed face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x4B5D7E)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Downcast eyes
          const leftEye = this.add.circle(x - 10, y - 5, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 5, 3, 0x000000)
          
          // Sad frown
          const frown = this.add.graphics()
          frown.lineStyle(2, 0x000000, 1)
          frown.beginPath()
          frown.arc(x, y + 18, 12, Math.PI, 0, false)
          frown.strokePath()
          
          // Tear drops
          const leftTear = this.add.ellipse(x - 10, y + 2, 4, 6, 0x87CEEB)
          leftTear.setStrokeStyle(1, 0x4682B4)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Depressed', {
            fontSize: '10px',
            color: '#4B5D7E'
          })
          nameText.setOrigin(0.5)
          
          // Add price (275 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '275', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 275 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(13)) {
            equipTextStr = equippedAvatar === 13 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 13 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 13)
          slot.setData('price', 275)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('frown', frown)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(13)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add surprised face to slot 15
        if (index === 14) {
          // Light yellow background for surprised face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFFACD)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Wide open eyes
          const leftEyeWhite = this.add.circle(x - 10, y - 8, 6, 0xFFFFFF)
          leftEyeWhite.setStrokeStyle(1, 0x000000)
          const leftPupil = this.add.circle(x - 10, y - 8, 3, 0x000000)
          
          const rightEyeWhite = this.add.circle(x + 10, y - 8, 6, 0xFFFFFF)
          rightEyeWhite.setStrokeStyle(1, 0x000000)
          const rightPupil = this.add.circle(x + 10, y - 8, 3, 0x000000)
          
          // Raised eyebrows
          const leftBrow = this.add.graphics()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.beginPath()
          leftBrow.arc(x - 10, y - 18, 8, Math.PI, 0, false)
          leftBrow.strokePath()
          
          const rightBrow = this.add.graphics()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.beginPath()
          rightBrow.arc(x + 10, y - 18, 8, Math.PI, 0, false)
          rightBrow.strokePath()
          
          // Open mouth (O shape)
          const mouth = this.add.circle(x, y + 10, 8, 0x000000)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Surprised', {
            fontSize: '10px',
            color: '#FFD700'
          })
          nameText.setOrigin(0.5)
          
          // Add price (300 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '300', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 300 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(14)) {
            equipTextStr = equippedAvatar === 14 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 14 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 14)
          slot.setData('price', 300)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(14)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add wow face to slot 16
        if (index === 15) {
          // Bright orange background for wow face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFA500)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Star eyes
          const leftStar = this.add.star(x - 10, y - 8, 5, 3, 6, 0xFFFF00)
          leftStar.setStrokeStyle(1, 0x000000)
          
          const rightStar = this.add.star(x + 10, y - 8, 5, 3, 6, 0xFFFF00)
          rightStar.setStrokeStyle(1, 0x000000)
          
          // Wide open mouth
          const mouth = this.add.ellipse(x, y + 10, 16, 12, 0xFF1493)
          mouth.setStrokeStyle(2, 0x000000)
          
          // Sparkles around face
          const sparkle1 = this.add.star(x - 25, y - 20, 4, 2, 4, 0xFFFF00)
          const sparkle2 = this.add.star(x + 25, y - 20, 4, 2, 4, 0xFFFF00)
          const sparkle3 = this.add.star(x, y + 25, 4, 2, 4, 0xFFFF00)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'WOW!', {
            fontSize: '10px',
            color: '#FF4500'
          })
          nameText.setOrigin(0.5)
          
          // Add price (325 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '325', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 325 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(15)) {
            equipTextStr = equippedAvatar === 15 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 15 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 15)
          slot.setData('price', 325)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(15)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add silly face to slot 17
        if (index === 16) {
          // Light green background for silly face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0x90EE90)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Crossed eyes
          const leftEyeWhite = this.add.circle(x - 10, y - 8, 6, 0xFFFFFF)
          leftEyeWhite.setStrokeStyle(1, 0x000000)
          const leftPupil = this.add.circle(x - 7, y - 8, 3, 0x000000)
          
          const rightEyeWhite = this.add.circle(x + 10, y - 8, 6, 0xFFFFFF)
          rightEyeWhite.setStrokeStyle(1, 0x000000)
          const rightPupil = this.add.circle(x + 7, y - 8, 3, 0x000000)
          
          // Big silly grin with tongue
          const mouth = this.add.graphics()
          mouth.lineStyle(3, 0x000000, 1)
          mouth.beginPath()
          mouth.arc(x, y + 5, 15, 0, Math.PI, false)
          mouth.strokePath()
          
          // Tongue sticking out
          const tongue = this.add.ellipse(x + 8, y + 18, 12, 8, 0xFF69B4)
          tongue.setStrokeStyle(1, 0x000000)
          
          // Silly curved eyebrows
          const leftBrow = this.add.graphics()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.beginPath()
          leftBrow.arc(x - 10, y - 16, 8, Math.PI, 0, false)
          leftBrow.strokePath()
          
          const rightBrow = this.add.graphics()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.beginPath()
          rightBrow.arc(x + 10, y - 16, 8, Math.PI, 0, false)
          rightBrow.strokePath()
          
          // Add a propeller hat
          const hatBase = this.add.rectangle(x, y - 28, 20, 8, 0xFF0000)
          hatBase.setStrokeStyle(1, 0x000000)
          const propeller1 = this.add.ellipse(x - 10, y - 32, 15, 4, 0xFFFF00)
          propeller1.setStrokeStyle(1, 0x000000)
          propeller1.setRotation(0.3)
          const propeller2 = this.add.ellipse(x + 10, y - 32, 15, 4, 0xFFFF00)
          propeller2.setStrokeStyle(1, 0x000000)
          propeller2.setRotation(-0.3)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Silly!', {
            fontSize: '10px',
            color: '#32CD32'
          })
          nameText.setOrigin(0.5)
          
          // Add price (350 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '350', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 350 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(16)) {
            equipTextStr = equippedAvatar === 16 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 16 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 16)
          slot.setData('price', 350)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('sillyElements', [leftEyeWhite, rightEyeWhite, leftPupil, rightPupil, tongue, mouth, leftBrow, rightBrow, hatBase, propeller1, propeller2])
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(16)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add Easter Bunny face to slot 18
        if (index === 17) {
          // Light pink background for bunny
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFFB6C1)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Bunny ears
          const leftEar = this.add.ellipse(x - 8, y - 25, 8, 20, 0xFFFFFF)
          leftEar.setStrokeStyle(2, 0x000000)
          const leftEarInner = this.add.ellipse(x - 8, y - 25, 4, 12, 0xFFB6C1)
          
          const rightEar = this.add.ellipse(x + 8, y - 25, 8, 20, 0xFFFFFF)
          rightEar.setStrokeStyle(2, 0x000000)
          const rightEarInner = this.add.ellipse(x + 8, y - 25, 4, 12, 0xFFB6C1)
          
          // Cute eyes
          const leftEye = this.add.circle(x - 10, y - 5, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 5, 3, 0x000000)
          
          // Pink nose
          const nose = this.add.triangle(x, y + 5, 0, 0, -4, 6, 4, 6, 0xFF69B4)
          nose.setStrokeStyle(1, 0x000000)
          
          // Bunny teeth
          const teeth = this.add.rectangle(x, y + 12, 8, 6, 0xFFFFFF)
          teeth.setStrokeStyle(1, 0x000000)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Easter Bunny', {
            fontSize: '10px',
            color: '#FF69B4'
          })
          nameText.setOrigin(0.5)
          
          // Add price (400 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '400', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 400 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(17)) {
            equipTextStr = equippedAvatar === 17 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 17 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 17)
          slot.setData('price', 400)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(17)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add mad face to slot 19
        if (index === 18) {
          // Red background for mad face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xFF4444)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Angry eyes
          const leftEye = this.add.circle(x - 10, y - 5, 3, 0x000000)
          const rightEye = this.add.circle(x + 10, y - 5, 3, 0x000000)
          
          // Angry eyebrows
          const leftBrow = this.add.graphics()
          leftBrow.lineStyle(3, 0x000000, 1)
          leftBrow.moveTo(x - 15, y - 15)
          leftBrow.lineTo(x - 5, y - 10)
          leftBrow.strokePath()
          
          const rightBrow = this.add.graphics()
          rightBrow.lineStyle(3, 0x000000, 1)
          rightBrow.moveTo(x + 5, y - 10)
          rightBrow.lineTo(x + 15, y - 15)
          rightBrow.strokePath()
          
          // Angry mouth
          const mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(x - 12, y + 12)
          mouth.lineTo(x - 5, y + 8)
          mouth.lineTo(x + 5, y + 8)
          mouth.lineTo(x + 12, y + 12)
          mouth.strokePath()
          
          // Steam puffs
          const steam1 = this.add.circle(x - 20, y - 20, 4, 0xFFFFFF)
          steam1.setAlpha(0.7)
          const steam2 = this.add.circle(x + 20, y - 20, 4, 0xFFFFFF)
          steam2.setAlpha(0.7)
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'MAD!', {
            fontSize: '10px',
            color: '#FF0000'
          })
          nameText.setOrigin(0.5)
          
          // Add price (425 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '425', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 425 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(18)) {
            equipTextStr = equippedAvatar === 18 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 18 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 18)
          slot.setData('price', 425)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('mouth', mouth)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(18)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add scared face to slot 20
        if (index === 19) {
          // Pale purple background for scared face
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, 0xE6E6FA)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Wide scared eyes
          const leftEyeWhite = this.add.circle(x - 10, y - 8, 7, 0xFFFFFF)
          leftEyeWhite.setStrokeStyle(1, 0x000000)
          const leftPupil = this.add.circle(x - 10, y - 6, 2, 0x000000)
          
          const rightEyeWhite = this.add.circle(x + 10, y - 8, 7, 0xFFFFFF)
          rightEyeWhite.setStrokeStyle(1, 0x000000)
          const rightPupil = this.add.circle(x + 10, y - 6, 2, 0x000000)
          
          // Raised worried eyebrows
          const leftBrow = this.add.graphics()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.moveTo(x - 15, y - 18)
          leftBrow.lineTo(x - 5, y - 15)
          leftBrow.strokePath()
          
          const rightBrow = this.add.graphics()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.moveTo(x + 5, y - 15)
          rightBrow.lineTo(x + 15, y - 18)
          rightBrow.strokePath()
          
          // Wavy scared mouth
          const mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(x - 10, y + 10)
          mouth.lineTo(x - 5, y + 8)
          mouth.lineTo(x, y + 10)
          mouth.lineTo(x + 5, y + 8)
          mouth.lineTo(x + 10, y + 10)
          mouth.strokePath()
          
          // Shaking lines
          const shake1 = this.add.graphics()
          shake1.lineStyle(1, 0x666666, 0.5)
          shake1.moveTo(x - 25, y - 10)
          shake1.lineTo(x - 22, y - 10)
          shake1.moveTo(x - 25, y)
          shake1.lineTo(x - 22, y)
          shake1.strokePath()
          
          const shake2 = this.add.graphics()
          shake2.lineStyle(1, 0x666666, 0.5)
          shake2.moveTo(x + 22, y - 10)
          shake2.lineTo(x + 25, y - 10)
          shake2.moveTo(x + 22, y)
          shake2.lineTo(x + 25, y)
          shake2.strokePath()
          
          // Add name text
          const nameText = this.add.text(x, y - 30, 'Scared', {
            fontSize: '10px',
            color: '#9370DB'
          })
          nameText.setOrigin(0.5)
          
          // Add price (450 coins)
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : '450', {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= 450 ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(19)) {
            equipTextStr = equippedAvatar === 19 ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === 19 ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', 19)
          slot.setData('price', 450)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          slot.setData('mouth', mouth)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(19)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Add random faces for slots 21-50
        if (index >= 20 && index <= 49) {
          const faceType = index - 20 // 0-29 for variety
          const price = 500 + (faceType * 50) // Prices from 500 to 1950
          
          // Random background colors
          const bgColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xF7DC6F, 0xBB8FCE, 0x85C1E2, 0xF8C471, 0x82E0AA, 0xF1948A, 0xAED6F1]
          const bgColor = bgColors[faceType % bgColors.length]
          
          const faceBackground = this.add.rectangle(x, y, slotSize - 10, slotSize - 10, bgColor)
          faceBackground.setStrokeStyle(2, 0x000000)
          
          // Generate different face styles based on index
          let leftEye: any, rightEye: any, mouth: any
          
          switch(faceType % 10) {
            case 0: // Dizzy face
              leftEye = this.add.text(x - 10, y - 8, '@', { fontSize: '16px', color: '#000000' })
              rightEye = this.add.text(x + 10, y - 8, '@', { fontSize: '16px', color: '#000000' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(x, y + 8, 10, 0.2, 2.94, false)
              mouth.strokePath()
              break
              
            case 1: // Star eyes
              leftEye = this.add.star(x - 10, y - 8, 5, 3, 6, 0x000000)
              rightEye = this.add.star(x + 10, y - 8, 5, 3, 6, 0x000000)
              mouth = this.add.rectangle(x, y + 10, 15, 3, 0x000000)
              break
              
            case 2: // Heart eyes
              leftEye = this.add.text(x - 10, y - 8, '♥', { fontSize: '14px', color: '#FF1493' })
              rightEye = this.add.text(x + 10, y - 8, '♥', { fontSize: '14px', color: '#FF1493' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(x, y + 5, 12, 0, Math.PI, false)
              mouth.strokePath()
              break
              
            case 3: // X eyes (knocked out)
              leftEye = this.add.text(x - 10, y - 8, 'X', { fontSize: '14px', color: '#000000' })
              rightEye = this.add.text(x + 10, y - 8, 'X', { fontSize: '14px', color: '#000000' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.ellipse(x, y + 10, 10, 6, 0x000000)
              break
              
            case 4: // Winking face
              leftEye = this.add.graphics()
              leftEye.lineStyle(2, 0x000000)
              leftEye.moveTo(x - 15, y - 8)
              leftEye.lineTo(x - 5, y - 8)
              leftEye.strokePath()
              rightEye = this.add.circle(x + 10, y - 8, 3, 0x000000)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(x + 3, y + 5, 10, 0, Math.PI, false)
              mouth.strokePath()
              break
              
            case 5: // Cyclops (one big eye)
              leftEye = this.add.circle(x, y - 8, 8, 0xFFFFFF)
              leftEye.setStrokeStyle(2, 0x000000)
              rightEye = this.add.circle(x, y - 8, 4, 0x000000)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.moveTo(x - 8, y + 10)
              mouth.lineTo(x + 8, y + 10)
              mouth.strokePath()
              break
              
            case 6: // Dollar sign eyes (greedy)
              leftEye = this.add.text(x - 10, y - 8, '$', { fontSize: '14px', color: '#228B22' })
              rightEye = this.add.text(x + 10, y - 8, '$', { fontSize: '14px', color: '#228B22' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.graphics()
              mouth.lineStyle(3, 0x000000)
              mouth.beginPath()
              mouth.arc(x, y + 3, 15, 0, Math.PI, false)
              mouth.strokePath()
              break
              
            case 7: // Spiral eyes (hypnotized)
              leftEye = this.add.text(x - 10, y - 8, '◉', { fontSize: '14px', color: '#000000' })
              rightEye = this.add.text(x + 10, y - 8, '◉', { fontSize: '14px', color: '#000000' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.moveTo(x - 10, y + 10)
              mouth.lineTo(x - 5, y + 12)
              mouth.lineTo(x + 5, y + 12)
              mouth.lineTo(x + 10, y + 10)
              mouth.strokePath()
              break
              
            case 8: // Question mark eyes (confused)
              leftEye = this.add.text(x - 10, y - 8, '?', { fontSize: '14px', color: '#000000' })
              rightEye = this.add.text(x + 10, y - 8, '?', { fontSize: '14px', color: '#000000' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.graphics()
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(x, y + 15, 10, Math.PI, 0, false)
              mouth.strokePath()
              break
              
            case 9: // Lightning bolt eyes (shocked)
              leftEye = this.add.text(x - 10, y - 8, '⚡', { fontSize: '12px', color: '#FFD700' })
              rightEye = this.add.text(x + 10, y - 8, '⚡', { fontSize: '12px', color: '#FFD700' })
              leftEye.setOrigin(0.5)
              rightEye.setOrigin(0.5)
              mouth = this.add.ellipse(x, y + 10, 12, 8, 0x000000)
              break
          }
          
          // Add accessories for some faces
          if (faceType >= 10 && faceType < 20) {
            // Add various accessories
            switch(faceType % 10) {
              case 0: // Sunglasses
                const sunglasses = this.add.rectangle(x, y - 8, 35, 8, 0x000000)
                sunglasses.setStrokeStyle(1, 0x333333)
                break
              case 1: // Monocle
                const monocle = this.add.circle(x + 10, y - 8, 8, 0x000000, 0)
                monocle.setStrokeStyle(2, 0x000000)
                break
              case 2: // Mustache
                const mustache = this.add.graphics()
                mustache.lineStyle(3, 0x000000)
                mustache.beginPath()
                mustache.arc(x - 5, y + 3, 8, 0, Math.PI, true)
                mustache.arc(x + 5, y + 3, 8, 0, Math.PI, true)
                mustache.strokePath()
                break
              case 3: // Top hat
                const hatBrim = this.add.rectangle(x, y - 22, 30, 3, 0x000000)
                const hatTop = this.add.rectangle(x, y - 28, 20, 10, 0x000000)
                break
              case 4: // Bow tie
                const bowLeft = this.add.triangle(x - 8, y + 15, 0, 0, -6, -4, -6, 4, 0xFF0000)
                const bowRight = this.add.triangle(x + 8, y + 15, 0, 0, 6, -4, 6, 4, 0xFF0000)
                const bowCenter = this.add.rectangle(x, y + 15, 4, 6, 0x8B0000)
                break
              case 5: // Crown
                const crown = this.add.triangle(x, y - 25, 0, 0, -10, 10, 10, 10, 0xFFD700)
                crown.setStrokeStyle(1, 0x000000)
                break
              case 6: // Eye patch
                const patch = this.add.ellipse(x - 10, y - 8, 12, 10, 0x000000)
                const strap = this.add.rectangle(x - 5, y - 8, 40, 2, 0x000000)
                break
              case 7: // Headband
                const band = this.add.rectangle(x, y - 18, 35, 5, 0xFF4500)
                band.setStrokeStyle(1, 0x000000)
                break
              case 8: // Antenna
                const antennaStick = this.add.rectangle(x, y - 22, 2, 15, 0x808080)
                const antennaBall = this.add.circle(x, y - 30, 4, 0xFF0000)
                break
              case 9: // Halo
                const halo = this.add.ellipse(x, y - 25, 25, 8, 0xFFFF00, 0)
                halo.setStrokeStyle(2, 0xFFD700)
                break
            }
          }
          
          // Special faces for 30-40
          if (faceType >= 20) {
            // Add special effects
            switch(faceType % 10) {
              case 0: // Rainbow face
                const rainbow = this.add.graphics()
                rainbow.lineStyle(2, 0xFF0000)
                rainbow.arc(x, y, 20, 0, Math.PI, true)
                rainbow.lineStyle(2, 0xFF7F00)
                rainbow.arc(x, y + 2, 18, 0, Math.PI, true)
                rainbow.lineStyle(2, 0xFFFF00)
                rainbow.arc(x, y + 4, 16, 0, Math.PI, true)
                break
              case 1: // Fire effect
                const fire1 = this.add.triangle(x - 15, y - 20, 0, 0, -3, 8, 3, 8, 0xFF4500)
                const fire2 = this.add.triangle(x, y - 20, 0, 0, -3, 8, 3, 8, 0xFF6347)
                const fire3 = this.add.triangle(x + 15, y - 20, 0, 0, -3, 8, 3, 8, 0xFF4500)
                break
              case 2: // Sparkles
                this.add.text(x - 20, y - 20, '✨', { fontSize: '12px' })
                this.add.text(x + 15, y - 20, '✨', { fontSize: '12px' })
                this.add.text(x, y + 20, '✨', { fontSize: '12px' })
                break
              case 3: // Bubble effect
                const bubble1 = this.add.circle(x - 15, y - 20, 4, 0x87CEEB, 0.5)
                const bubble2 = this.add.circle(x + 10, y - 25, 3, 0x87CEEB, 0.5)
                const bubble3 = this.add.circle(x + 5, y - 15, 5, 0x87CEEB, 0.5)
                bubble1.setStrokeStyle(1, 0x4682B4)
                bubble2.setStrokeStyle(1, 0x4682B4)
                bubble3.setStrokeStyle(1, 0x4682B4)
                break
              case 4: // Music notes
                this.add.text(x - 15, y - 20, '♪', { fontSize: '14px', color: '#000000' })
                this.add.text(x + 10, y - 15, '♫', { fontSize: '14px', color: '#000000' })
                break
              case 5: // Snowflake
                this.add.text(x, y - 25, '❄️', { fontSize: '20px' })
                break
              case 6: // Flower crown
                this.add.text(x - 10, y - 20, '🌸', { fontSize: '12px' })
                this.add.text(x, y - 22, '🌸', { fontSize: '12px' })
                this.add.text(x + 10, y - 20, '🌸', { fontSize: '12px' })
                break
              case 7: // Devil horns
                const horn1 = this.add.triangle(x - 10, y - 20, 0, 0, -3, 10, 3, 10, 0xDC143C)
                const horn2 = this.add.triangle(x + 10, y - 20, 0, 0, -3, 10, 3, 10, 0xDC143C)
                horn1.setStrokeStyle(1, 0x8B0000)
                horn2.setStrokeStyle(1, 0x8B0000)
                break
              case 8: // Cat ears
                const ear1 = this.add.triangle(x - 12, y - 20, 0, 0, -6, 12, 6, 12, 0x000000)
                const ear2 = this.add.triangle(x + 12, y - 20, 0, 0, -6, 12, 6, 12, 0x000000)
                const earInner1 = this.add.triangle(x - 12, y - 18, 0, 0, -3, 6, 3, 6, 0xFFC0CB)
                const earInner2 = this.add.triangle(x + 12, y - 18, 0, 0, -3, 6, 3, 6, 0xFFC0CB)
                break
              case 9: // Robot antenna
                const antenna1 = this.add.rectangle(x - 8, y - 20, 2, 10, 0x808080)
                const antenna2 = this.add.rectangle(x + 8, y - 20, 2, 10, 0x808080)
                const light1 = this.add.circle(x - 8, y - 25, 3, 0x00FF00)
                const light2 = this.add.circle(x + 8, y - 25, 3, 0xFF0000)
                break
            }
          }
          
          // Add price and equip text
          const priceText = this.add.text(x, y + 35, isFreeEvent ? 'FREE!' : price.toString(), {
            fontSize: '14px',
            color: isFreeEvent ? '#ff00ff' : '#ffd700'
          })
          priceText.setOrigin(0.5)
          priceText.setDepth(10)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 25, y + 35, 6, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          coinIcon.setDepth(10)
          
          // Add Equip/Equipped text
          let equipTextStr = 'Buy'
          let equipTextColor = totalCoins >= price ? '#ffffff' : '#666666'
          
          if (purchasedAvatars.includes(index)) {
            equipTextStr = equippedAvatar === index ? 'Equipped' : 'Equip'
            equipTextColor = equippedAvatar === index ? '#00ff00' : '#ffffff'
          }
          
          const equipText = this.add.text(x, y + 50, equipTextStr, {
            fontSize: '12px',
            color: equipTextColor
          })
          equipText.setOrigin(0.5)
          equipText.setDepth(10)
          
          // Store references
          slot.setData('equipText', equipText)
          slot.setData('avatarIndex', index)
          slot.setData('price', price)
          slot.setData('priceText', priceText)
          slot.setData('coinIcon', coinIcon)
          
          // Hide price if already purchased
          if (purchasedAvatars.includes(index)) {
            priceText.setVisible(false)
            coinIcon.setVisible(false)
          }
        }
        
        // Hover effect
        slot.on('pointerover', () => {
          slot.setFillStyle(0x555555)
        })
        
        slot.on('pointerout', () => {
          slot.setFillStyle(0x333333)
        })
        
        // Click effect
        slot.on('pointerdown', () => {
          const avatarIndex = slot.getData('avatarIndex')
          const price = slot.getData('price') || 0
          
          // Check if this slot has an avatar
          if (avatarIndex !== undefined) {
            // Check if avatar is already purchased
            if (purchasedAvatars.includes(avatarIndex)) {
              // Already owned, just equip it
              if (equippedAvatar !== avatarIndex) {
                gameState.setEquippedAvatar(avatarIndex)
                equippedAvatar = avatarIndex
                
                // Update all equip texts
                this.updateAllEquipTexts()
              }
            } else {
              // Need to purchase
              if (isFreeEvent || totalCoins >= price) {
                // Purchase the avatar (free if event, otherwise spend coins)
                if (isFreeEvent || gameState.spendCoins(price)) {
                  gameState.purchaseAvatar(avatarIndex)
                  gameState.setEquippedAvatar(avatarIndex)
                  
                  // Update local references
                  totalCoins = gameState.getCoins()
                  purchasedAvatars = gameState.getPurchasedAvatars()
                  equippedAvatar = avatarIndex
                  
                  // Hide price and coin icon
                  const priceText = slot.getData('priceText')
                  const coinIcon = slot.getData('coinIcon')
                  if (priceText) priceText.setVisible(false)
                  if (coinIcon) coinIcon.setVisible(false)
                  
                  // Update all equip texts
                  this.updateAllEquipTexts()
                }
              } else {
                // Not enough coins
                const errorText = this.add.text(400, 300, 'Not enough coins!', {
                  fontSize: '24px',
                  color: '#ff0000'
                })
                errorText.setOrigin(0.5)
                errorText.setStroke('#000000', 3)
                
                // Fade out the message
                this.tweens.add({
                  targets: errorText,
                  alpha: 0,
                  duration: 1500,
                  onComplete: () => errorText.destroy()
                })
              }
            }
          }
          
          // Highlight selected slot
          slot.setStrokeStyle(3, 0xffff00)
        })
      }
    }
  }
  
  updateAllEquipTexts() {
    // Update all avatar slot texts
    if (!this.children || !this.children.list) return;
    
    for (let i = 0; i < 50; i++) {
      const slot = this.children.list.find((child: any) => 
        child && child.getData && child.getData('avatarIndex') === i
      )
      if (slot) {
        const text = slot.getData('equipText')
        const price = slot.getData('price') || 0
        if (text && text.setText) {
          if (purchasedAvatars && purchasedAvatars.includes(i)) {
            // Owned avatar
            if (i === equippedAvatar) {
              text.setText('Equipped')
              text.setColor('#00ff00')
            } else {
              text.setText('Equip')
              text.setColor('#ffffff')
            }
          } else {
            // Not owned
            text.setText('Buy')
            text.setColor(totalCoins >= price ? '#ffffff' : '#666666')
          }
        }
      }
    }
  }
}

class UpgradesScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradesScene' })
  }

  create() {
    // Get current levels and coins
    const totalCoins = gameState.getCoins()
    const speedBoostLevel = gameState.getSpeedBoostLevel()
    const jumpPowerLevel = gameState.getJumpPowerLevel()
    
    // Speed Boost price levels: $5, $10, $15, $20, $100, $1000, $10000
    const speedBoostPrices = [5, 10, 15, 20, 100, 1000, 10000]
    
    // Jump Power price levels: $10, $20, $40, $100, $10000, $30000
    const jumpPowerPrices = [10, 20, 40, 100, 10000, 30000]
    
    // Title
    const title = this.add.text(400, 50, 'Upgrades', {
      fontSize: '36px',
      color: '#48bb78'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 3)

    // Back button
    const backButton = this.add.rectangle(50, 50, 80, 40, 0xff0000)
    backButton.setStrokeStyle(2, 0x000000)
    backButton.setInteractive()
    
    const backText = this.add.text(50, 50, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    
    // Back button hover
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xdd0000)
    })
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0xff0000)
    })
    
    // Back button click
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene')
    })
    
    // Create three upgrade rectangles side by side
    const rectWidth = 200
    const rectHeight = 300
    const spacing = 50
    const startX = 150
    const centerY = 300
    
    const upgradeColors = [0x4299e1, 0x9f7aea, 0xed8936]
    const upgradeTitles = ['Speed Boost', 'Jump Power', 'Score Multiplier']
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * (rectWidth + spacing)
      
      // Create upgrade rectangle
      const upgradeRect = this.add.rectangle(x, centerY, rectWidth, rectHeight, upgradeColors[i])
      upgradeRect.setStrokeStyle(3, 0x000000)
      upgradeRect.setInteractive()
      
      // Add title
      const titleText = this.add.text(x, centerY - 120, upgradeTitles[i], {
        fontSize: '20px',
        color: '#ffffff'
      })
      titleText.setOrigin(0.5)
      
      // Speed Boost specific content
      if (i === 0) {
        // Show current level
        const levelText = this.add.text(x, centerY - 60, `Level: ${speedBoostLevel}`, {
          fontSize: '18px',
          color: '#ffffff'
        })
        levelText.setOrigin(0.5)
        
        // Show effect
        const effectText = this.add.text(x, centerY - 30, `Speed: +${speedBoostLevel * 10}%`, {
          fontSize: '16px',
          color: '#90EE90'
        })
        effectText.setOrigin(0.5)
        
        // Show price or max
        if (speedBoostLevel >= speedBoostPrices.length) {
          const maxText = this.add.text(x, centerY + 60, 'MAX LEVEL', {
            fontSize: '24px',
            color: '#FFD700'
          })
          maxText.setOrigin(0.5)
          maxText.setStroke('#000000', 2)
        } else {
          const price = speedBoostPrices[speedBoostLevel]
          const priceText = this.add.text(x, centerY + 40, `$${price}`, {
            fontSize: '24px',
            color: totalCoins >= price ? '#00FF00' : '#FF0000'
          })
          priceText.setOrigin(0.5)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 40, centerY + 40, 8, 0xffd700)
          coinIcon.setStrokeStyle(2, 0x000000)
          
          // Buy button
          const buyButton = this.add.text(x, centerY + 80, 'UPGRADE', {
            fontSize: '18px',
            color: totalCoins >= price ? '#ffffff' : '#888888'
          })
          buyButton.setOrigin(0.5)
          buyButton.setStroke('#000000', 2)
        }
      } else if (i === 1) {
        // Jump Power content
        // Show current level
        const levelText = this.add.text(x, centerY - 60, `Level: ${jumpPowerLevel}`, {
          fontSize: '18px',
          color: '#ffffff'
        })
        levelText.setOrigin(0.5)
        
        // Show effect
        const effectText = this.add.text(x, centerY - 30, `Jump: +${jumpPowerLevel * 15}%`, {
          fontSize: '16px',
          color: '#90EE90'
        })
        effectText.setOrigin(0.5)
        
        // Show price or max
        if (jumpPowerLevel >= jumpPowerPrices.length) {
          const maxText = this.add.text(x, centerY + 60, 'MAX LEVEL', {
            fontSize: '24px',
            color: '#FFD700'
          })
          maxText.setOrigin(0.5)
          maxText.setStroke('#000000', 2)
        } else {
          const price = jumpPowerPrices[jumpPowerLevel]
          const priceText = this.add.text(x, centerY + 40, `$${price}`, {
            fontSize: '24px',
            color: totalCoins >= price ? '#00FF00' : '#FF0000'
          })
          priceText.setOrigin(0.5)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 40, centerY + 40, 8, 0xffd700)
          coinIcon.setStrokeStyle(2, 0x000000)
          
          // Buy button
          const buyButton = this.add.text(x, centerY + 80, 'UPGRADE', {
            fontSize: '18px',
            color: totalCoins >= price ? '#ffffff' : '#888888'
          })
          buyButton.setOrigin(0.5)
          buyButton.setStroke('#000000', 2)
        }
      } else {
        // Coming soon for other upgrades
        const comingSoon = this.add.text(x, centerY, 'Coming Soon', {
          fontSize: '18px',
          color: '#888888'
        })
        comingSoon.setOrigin(0.5)
      }
      
      // Hover effect
      upgradeRect.on('pointerover', () => {
        upgradeRect.setScale(1.05)
      })
      
      upgradeRect.on('pointerout', () => {
        upgradeRect.setScale(1)
      })
      
      // Click handler
      upgradeRect.on('pointerdown', () => {
        if (i === 0 && speedBoostLevel < speedBoostPrices.length) {
          const price = speedBoostPrices[speedBoostLevel]
          if (totalCoins >= price) {
            if (gameState.spendCoins(price)) {
              gameState.upgradeSpeedBoost()
              this.scene.restart()
            }
          }
        } else if (i === 1 && jumpPowerLevel < jumpPowerPrices.length) {
          const price = jumpPowerPrices[jumpPowerLevel]
          if (totalCoins >= price) {
            if (gameState.spendCoins(price)) {
              gameState.upgradeJumpPower()
              this.scene.restart()
            }
          }
        }
      })
    }
  }
}

class RebirthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RebirthScene' })
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x1a1a1a)
    
    // Title
    const title = this.add.text(400, 80, '🔥 REBIRTH 🔥', {
      fontSize: '48px',
      color: '#ff0000'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 4)
    
    // Warning text
    const warningText = this.add.text(400, 150, '⚠️ WARNING ⚠️', {
      fontSize: '32px',
      color: '#ffff00'
    })
    warningText.setOrigin(0.5)
    warningText.setStroke('#ff0000', 3)
    
    // Explanation
    const explainText = this.add.text(400, 250, [
      'Rebirth will reset:',
      '• All your coins to 0',
      '• All purchased avatars and powers',
      '• All upgrade levels',
      '',
      'But you will gain:',
      '• Rebirth Stars ⭐',
      '• Permanent coin multiplier',
      '• Special rebirth rewards!'
    ], {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    })
    explainText.setOrigin(0.5)
    
    // Current rebirth info
    const rebirthCount = gameState.getRebirthCount()
    const currentCoins = gameState.getCoins()
    const currentHighScore = gameState.getHighScore()
    const currentMultiplier = gameState.getCoinMultiplier()
    const nextMultiplier = Math.pow(2, rebirthCount + 1)
    
    // Requirements scale with rebirth count
    let requiredScore = 5000
    let requiredCoins = 150000
    
    // After first rebirth: 10k score and 250k coins
    if (rebirthCount >= 1) {
      requiredScore = 10000
      requiredCoins = 250000
    }
    
    const hasEnoughScore = currentHighScore >= requiredScore
    const hasEnoughCoins = currentCoins >= requiredCoins
    const canRebirth = hasEnoughScore && hasEnoughCoins
    
    const infoText = this.add.text(400, 400, [
      `Current Rebirths: ${rebirthCount} ⭐`,
      `Current Coin Multiplier: x${currentMultiplier}`,
      `After Rebirth: x${nextMultiplier}`,
      '',
      'Requirements:',
      `High Score: ${currentHighScore.toLocaleString()} / ${requiredScore.toLocaleString()} ${hasEnoughScore ? '✅' : '❌'}`,
      `Coins: ${currentCoins.toLocaleString()} / ${requiredCoins.toLocaleString()} ${hasEnoughCoins ? '✅' : '❌'}`,
    ], {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    })
    infoText.setOrigin(0.5)
    infoText.setStroke('#000000', 2)
    
    // Rebirth button
    const rebirthButton = this.add.rectangle(400, 500, 200, 60, canRebirth ? 0xff0000 : 0x666666)
    rebirthButton.setStrokeStyle(3, canRebirth ? 0xffff00 : 0x444444)
    if (canRebirth) {
      rebirthButton.setInteractive()
    }
    
    let buttonText = 'REBIRTH NOW'
    if (!hasEnoughScore && !hasEnoughCoins) {
      buttonText = 'NEED MORE SCORE & COINS'
    } else if (!hasEnoughScore) {
      buttonText = 'NEED MORE SCORE'
    } else if (!hasEnoughCoins) {
      buttonText = 'NEED MORE COINS'
    }
    
    const rebirthButtonText = this.add.text(400, 500, buttonText, {
      fontSize: canRebirth ? '24px' : '18px',
      color: canRebirth ? '#ffffff' : '#999999'
    })
    rebirthButtonText.setOrigin(0.5)
    
    // Rebirth button hover (only if can rebirth)
    if (canRebirth) {
      rebirthButton.on('pointerover', () => {
        rebirthButton.setFillStyle(0xaa0000)
        rebirthButton.setScale(1.1)
      })
      
      rebirthButton.on('pointerout', () => {
        rebirthButton.setFillStyle(0xff0000)
        rebirthButton.setScale(1)
      })
      
      // Rebirth button click
      rebirthButton.on('pointerdown', () => {
        // Perform the rebirth
        gameState.incrementRebirthCount()
        gameState.resetState() // This preserves high score and rebirth count
        
        // Show success message
        const successText = this.add.text(400, 300, '🌟 REBIRTH SUCCESSFUL! 🌟', {
          fontSize: '36px',
          color: '#ff00ff'
        })
        successText.setOrigin(0.5)
        successText.setStroke('#000000', 3)
        
        // Add sparkle effect
        this.tweens.add({
          targets: successText,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            // Return to home screen
            this.scene.start('HomeScene')
          }
        })
      })
    }
    
    // Back button
    const backButton = this.add.rectangle(50, 50, 80, 40, 0x666666)
    backButton.setStrokeStyle(2, 0xffffff)
    backButton.setInteractive()
    
    const backText = this.add.text(50, 50, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    
    // Back button hover
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0x888888)
    })
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x666666)
    })
    
    // Back button click
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene')
    })
  }
}

class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x1a1a1a)
    
    // Title
    const title = this.add.text(400, 50, 'Select Level', {
      fontSize: '36px',
      color: '#ffff00'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 3)
    
    // Back button
    const backButton = this.add.rectangle(50, 50, 80, 40, 0xff0000)
    backButton.setStrokeStyle(2, 0x000000)
    backButton.setInteractive()
    
    const backText = this.add.text(50, 50, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    
    // Back button hover
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xdd0000)
    })
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0xff0000)
    })
    
    // Back button click
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene')
    })
    
    // Level 1: Stereo Madness
    const level1Box = this.add.rectangle(400, 200, 600, 100, 0x003366)
    level1Box.setStrokeStyle(3, 0x0066cc)
    level1Box.setInteractive()
    
    // Level icon (speaker symbol for Stereo)
    const speakerIcon = this.add.graphics()
    speakerIcon.x = 150
    speakerIcon.y = 200
    speakerIcon.fillStyle(0xffffff, 1)
    speakerIcon.fillRect(-15, -10, 20, 20)
    speakerIcon.fillTriangle(5, 0, 20, -15, 20, 15)
    
    // Sound waves
    speakerIcon.lineStyle(2, 0xffffff, 1)
    speakerIcon.arc(25, 0, 8, -0.5, 0.5, false)
    speakerIcon.strokePath()
    speakerIcon.beginPath()
    speakerIcon.arc(30, 0, 12, -0.5, 0.5, false)
    speakerIcon.strokePath()
    
    // Level name
    const levelName = this.add.text(400, 180, 'Stereo Madness', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    levelName.setOrigin(0.5)
    
    // Difficulty stars
    const stars = []
    for (let i = 0; i < 5; i++) {
      const star = this.add.text(320 + i * 35, 210, '⭐', {
        fontSize: '24px',
        color: i < 1 ? '#ffff00' : '#444444' // 1 star difficulty
      })
      stars.push(star)
    }
    
    // Get level progress
    const levelProgress = gameState.getLevelProgress('stereoMadness')
    const progressPercent = Math.min(100, Math.floor((levelProgress / 10000) * 100))
    const isCompleted = gameState.isLevelCompleted('stereoMadness')
    
    // Progress bar
    const progressBg = this.add.rectangle(400, 235, 400, 10, 0x333333)
    const progressWidth = (progressPercent / 100) * 400
    const progressFill = this.add.rectangle(200 + progressWidth/2, 235, progressWidth, 10, isCompleted ? 0x00ff00 : 0xffaa00)
    
    // Progress text
    const progressText = this.add.text(400, 235, isCompleted ? '100% COMPLETE!' : `${progressPercent}%`, {
      fontSize: '12px',
      color: isCompleted ? '#00ff00' : '#ffffff'
    })
    progressText.setOrigin(0.5)
    
    // Hover effect
    level1Box.on('pointerover', () => {
      level1Box.setFillStyle(0x004488)
      level1Box.setScale(1.02)
    })
    
    level1Box.on('pointerout', () => {
      level1Box.setFillStyle(0x003366)
      level1Box.setScale(1)
    })
    
    // Click to start level
    level1Box.on('pointerdown', () => {
      this.scene.start('MainScene')
    })
    
    // Check if user is Rylan (exclusive access)
    const isRylan = localStorage.getItem('isRylan') === 'true'
    
    if (isRylan) {
      // Design button for moderators only
      const designButton = this.add.rectangle(400, 290, 150, 40, 0xff6600)
      designButton.setStrokeStyle(2, 0x000000)
      designButton.setInteractive()
      
      const designText = this.add.text(400, 290, '🔧 Design', {
        fontSize: '20px',
        color: '#ffffff'
      })
      designText.setOrigin(0.5)
      
      // Hover effect
      designButton.on('pointerover', () => {
        designButton.setFillStyle(0xff8800)
        designButton.setScale(1.05)
      })
      
      designButton.on('pointerout', () => {
        designButton.setFillStyle(0xff6600)
        designButton.setScale(1)
      })
      
      // Click to open level editor
      designButton.on('pointerdown', () => {
        this.scene.start('LevelEditorScene', { level: 'stereoMadness' })
      })
    }
    
    // No secret codes work anymore - moderator status must be set by developer only
    
    // Coming soon text for other levels
    const comingSoonText = this.add.text(400, 350, 'More levels coming soon!', {
      fontSize: '24px',
      color: '#666666',
      fontStyle: 'italic'
    })
    comingSoonText.setOrigin(0.5)
    
    // Locked level preview
    const level2Box = this.add.rectangle(400, 450, 600, 100, 0x222222)
    level2Box.setStrokeStyle(3, 0x444444)
    
    const lockIcon = this.add.text(150, 450, '🔒', {
      fontSize: '36px'
    })
    lockIcon.setOrigin(0.5)
    
    const level2Name = this.add.text(400, 450, '???', {
      fontSize: '28px',
      color: '#666666'
    })
    level2Name.setOrigin(0.5)
  }
}

class LevelEditorScene extends Phaser.Scene {
  private levelData: any[] = []
  private selectedTool = 'spike'
  private previewObject: any = null
  private deleteHighlight: any = null
  private groundSnapIndicator: any = null
  private gridSize = 40
  private cameraSpeed = 20  // Faster scrolling!
  private levelLength = 20000 // Double the length for more space
  private toolButtons: any = {}
  
  constructor() {
    super({ key: 'LevelEditorScene' })
  }
  
  init(data: any) {
    // Load existing level data if any
    const savedLevel = localStorage.getItem(`level_${data.level}`)
    if (savedLevel) {
      this.levelData = JSON.parse(savedLevel)
    } else {
      this.levelData = []
    }
  }
  
  create() {
    // Set world bounds for scrolling
    this.physics.world.setBounds(0, 0, this.levelLength, 600)
    
    // Background
    this.add.rectangle(0, 0, this.levelLength, 600, 0x2d2d2d).setOrigin(0, 0)
    
    // Ground
    this.add.rectangle(0, 550, this.levelLength, 100, 0x00ff00).setOrigin(0, 0)
    
    // Grid overlay
    const grid = this.add.graphics()
    grid.lineStyle(1, 0x444444, 0.3)
    for (let x = 0; x < this.levelLength; x += this.gridSize) {
      grid.moveTo(x, 0)
      grid.lineTo(x, 600)
    }
    for (let y = 0; y < 600; y += this.gridSize) {
      grid.moveTo(0, y)
      grid.lineTo(this.levelLength, y)
    }
    grid.strokePath()
    
    // Draw existing objects
    this.levelData.forEach(obj => {
      this.drawObject(obj)
    })
    
    // UI Panel (fixed to camera)
    const uiPanel = this.add.rectangle(400, 550, 800, 100, 0x000000, 0.8)
    uiPanel.setScrollFactor(0)
    
    // Tool buttons
    const tools = [
      { name: 'spike', icon: '🔺', color: 0xff0000 },
      { name: 'block', icon: '⬛', color: 0x666666 },
      { name: 'stairs', icon: '📶', color: 0x888888 },
      { name: 'platform', icon: '➖', color: 0x4444ff },
      { name: 'delete', icon: '🗑️', color: 0xff0000 }
    ]
    
    tools.forEach((tool, index) => {
      const x = 150 + index * 100
      const button = this.add.rectangle(x, 550, 80, 60, tool.color)
      button.setStrokeStyle(2, 0xffffff)
      button.setInteractive()
      button.setScrollFactor(0)
      
      const icon = this.add.text(x, 540, tool.icon, {
        fontSize: '24px'
      })
      icon.setOrigin(0.5)
      icon.setScrollFactor(0)
      
      const label = this.add.text(x, 565, tool.name, {
        fontSize: '12px',
        color: '#ffffff'
      })
      label.setOrigin(0.5)
      label.setScrollFactor(0)
      
      this.toolButtons[tool.name] = button
      
      button.on('pointerdown', () => {
        this.selectTool(tool.name)
      })
    })
    
    // Select spike tool by default
    this.selectTool('spike')
    
    // Save button
    const saveButton = this.add.rectangle(700, 30, 100, 40, 0x00ff00)
    saveButton.setStrokeStyle(2, 0x000000)
    saveButton.setInteractive()
    saveButton.setScrollFactor(0)
    
    // Clear All button
    const clearButton = this.add.rectangle(700, 80, 100, 40, 0xff0000)
    clearButton.setStrokeStyle(2, 0x000000)
    clearButton.setInteractive()
    clearButton.setScrollFactor(0)
    
    const clearText = this.add.text(700, 80, 'Clear All', {
      fontSize: '18px',
      color: '#ffffff'
    })
    clearText.setOrigin(0.5)
    clearText.setScrollFactor(0)
    
    clearButton.on('pointerdown', () => {
      // Confirm before clearing
      const confirmText = this.add.text(400, 300, 'Clear ALL objects? Click again to confirm', {
        fontSize: '24px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      })
      confirmText.setOrigin(0.5)
      confirmText.setScrollFactor(0)
      
      // Make button pulse
      this.tweens.add({
        targets: clearButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        repeat: 3
      })
      
      // Wait for second click
      clearButton.once('pointerdown', () => {
        // Clear all level objects
        this.children.list.forEach(child => {
          if (child.getData('levelObject')) {
            child.destroy()
          }
        })
        
        // Clear level data
        this.levelData = []
        
        // Show cleared message
        confirmText.setText('All objects cleared!')
        confirmText.setColor('#00ff00')
        
        this.tweens.add({
          targets: confirmText,
          alpha: 0,
          duration: 2000,
          onComplete: () => confirmText.destroy()
        })
      })
      
      // Remove confirm text after 3 seconds if not clicked
      this.time.delayedCall(3000, () => {
        if (confirmText && confirmText.active) {
          confirmText.destroy()
        }
      })
    })
    
    const saveText = this.add.text(700, 30, 'Save', {
      fontSize: '20px',
      color: '#000000'
    })
    saveText.setOrigin(0.5)
    saveText.setScrollFactor(0)
    
    saveButton.on('pointerdown', () => {
      this.saveLevel()
    })
    
    // Back button
    const backButton = this.add.rectangle(50, 30, 80, 40, 0xff0000)
    backButton.setStrokeStyle(2, 0x000000)
    backButton.setInteractive()
    backButton.setScrollFactor(0)
    
    const backText = this.add.text(50, 30, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    backText.setScrollFactor(0)
    
    backButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })
    
    // Instructions
    const instructions = this.add.text(400, 30, 'Click to place/delete | Arrow keys to scroll | Keys: 1=Spike 2=Block 3=Stairs 4=Platform 5/D=Delete | Scroll: 0', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    })
    instructions.setOrigin(0.5)
    instructions.setScrollFactor(0)
    instructions.setName('instructions')
    
    // Set up camera
    this.cameras.main.setBounds(0, 0, this.levelLength, 600)
    
    // Mouse input for placing objects
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 500) { // Don't place objects on UI panel
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        const gridX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize
        const gridY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize
        
        if (this.selectedTool === 'delete') {
          this.deleteObjectAt(gridX, gridY)
        } else {
          this.placeObject(gridX, gridY)
        }
      }
    })
    
    // Preview object follows mouse
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 500) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        const gridX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize
        const gridY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize
        
        if (this.selectedTool === 'delete') {
          // Clear previous highlight
          if (this.deleteHighlight) {
            this.deleteHighlight.destroy()
            this.deleteHighlight = null
          }
          
          // Find objects near mouse position
          const clickBounds = new Phaser.Geom.Rectangle(gridX - 40, gridY - 40, 80, 80)
          
          this.children.list.forEach(child => {
            const obj = child.getData('levelObject')
            if (obj) {
              // Different bounds for different object types
              let objBounds: Phaser.Geom.Rectangle
              
              switch (obj.type) {
                case 'stairs':
                  objBounds = new Phaser.Geom.Rectangle(obj.x - 60, obj.y - 60, 120, 120)
                  break
                case 'platform':
                  objBounds = new Phaser.Geom.Rectangle(obj.x - 60, obj.y - 20, 120, 40)
                  break
                case 'block':
                  objBounds = new Phaser.Geom.Rectangle(obj.x - 40, obj.y - 40, 80, 80)
                  break
                default:
                  objBounds = new Phaser.Geom.Rectangle(obj.x - 30, obj.y - 30, 60, 60)
              }
              
              if (Phaser.Geom.Rectangle.Overlaps(clickBounds, objBounds)) {
                // Create highlight
                this.deleteHighlight = this.add.graphics()
                this.deleteHighlight.lineStyle(3, 0xff0000, 0.8)
                this.deleteHighlight.strokeRect(
                  objBounds.x,
                  objBounds.y,
                  objBounds.width,
                  objBounds.height
                )
                
                // Add pulsing effect
                this.tweens.add({
                  targets: this.deleteHighlight,
                  alpha: { from: 0.8, to: 0.3 },
                  duration: 500,
                  yoyo: true,
                  repeat: -1
                })
              }
            }
          })
        } else if (this.previewObject) {
          this.previewObject.x = gridX
          
          // Clear previous ground snap indicator
          if (this.groundSnapIndicator) {
            const snapText = this.groundSnapIndicator.getData('snapText')
            if (snapText) snapText.destroy()
            this.groundSnapIndicator.destroy()
            this.groundSnapIndicator = null
          }
          
          // Snap spike preview to ground if near it
          if (this.selectedTool === 'spike' && gridY >= 500) {
            this.previewObject.y = 530
            
            // Show ground snap indicator
            this.groundSnapIndicator = this.add.graphics()
            this.groundSnapIndicator.lineStyle(2, 0x00ff00, 0.8)
            this.groundSnapIndicator.strokeRect(gridX - 20, 530 - 20, 40, 40)
            
            // Add text
            const snapText = this.add.text(gridX, 530 - 40, 'Ground Snap', {
              fontSize: '12px',
              color: '#00ff00',
              backgroundColor: '#000000',
              padding: { x: 5, y: 2 }
            })
            snapText.setOrigin(0.5)
            
            // Store text reference to destroy later
            this.groundSnapIndicator.setData('snapText', snapText)
          } else {
            this.previewObject.y = gridY
          }
        }
      }
    })
    
    // Keyboard controls for camera and tool switching
    const cursors = this.input.keyboard?.createCursorKeys()
    
    // Add keyboard shortcuts for tools
    this.input.keyboard?.on('keydown-ONE', () => this.selectTool('spike'))
    this.input.keyboard?.on('keydown-TWO', () => this.selectTool('block'))
    this.input.keyboard?.on('keydown-THREE', () => this.selectTool('stairs'))
    this.input.keyboard?.on('keydown-FOUR', () => this.selectTool('platform'))
    this.input.keyboard?.on('keydown-FIVE', () => this.selectTool('delete'))
    this.input.keyboard?.on('keydown-X', () => this.selectTool('delete'))  // Use X for delete instead

    // Add A and D key support for scrolling
    const keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    const keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    if (cursors) {
      this.events.on('update', () => {
        const cam = this.cameras.main

        // Arrow key scrolling
        if (cursors.left.isDown && cam.scrollX > 0) {
          cam.scrollX -= this.cameraSpeed
        }
        if (cursors.right.isDown && cam.scrollX < this.levelLength - 800) {
          cam.scrollX += this.cameraSpeed
        }

        // A and D key scrolling
        if (keyA?.isDown && cam.scrollX > 0) {
          cam.scrollX -= this.cameraSpeed
        }
        if (keyD?.isDown && cam.scrollX < this.levelLength - 800) {
          cam.scrollX += this.cameraSpeed
        }

        // Mouse edge scrolling - move mouse to edge to scroll
        const pointer = this.input.activePointer
        if (pointer.y < 500) {  // Only scroll if mouse is not over UI
          if (pointer.x < 50 && cam.scrollX > 0) {
            cam.scrollX -= this.cameraSpeed / 2
          }
          if (pointer.x > 750 && cam.scrollX < this.levelLength - 800) {
            cam.scrollX += this.cameraSpeed / 2
          }
        }

        // Update scroll position text
        const instructions = this.children.getByName('instructions') as Phaser.GameObjects.Text
        if (instructions) {
          instructions.setText(`Click to place | Arrow/A/D=Scroll | Mouse to edge | 1=Spike 2=Block 3=Stairs 4=Platform 5/X=Delete | Pos: ${Math.floor(cam.scrollX)}`)
        }
      })
    }
  }
  
  private selectTool(toolName: string) {
    this.selectedTool = toolName
    
    // Update button highlights
    Object.keys(this.toolButtons).forEach(key => {
      this.toolButtons[key].setStrokeStyle(2, key === toolName ? 0x00ff00 : 0xffffff)
    })
    
    // Update preview object
    if (this.previewObject) {
      this.previewObject.destroy()
      this.previewObject = null
    }
    
    // Clear delete highlight when switching tools
    if (this.deleteHighlight) {
      this.deleteHighlight.destroy()
      this.deleteHighlight = null
    }
    
    // Clear ground snap indicator when switching tools
    if (this.groundSnapIndicator) {
      const snapText = this.groundSnapIndicator.getData('snapText')
      if (snapText) snapText.destroy()
      this.groundSnapIndicator.destroy()
      this.groundSnapIndicator = null
    }
    
    if (toolName !== 'delete') {
      this.createPreviewObject(toolName)
    }
  }
  
  private createPreviewObject(type: string) {
    switch (type) {
      case 'spike':
        this.previewObject = this.add.triangle(0, 0, 0, -20, -20, 20, 20, 20, 0xff0000, 0.5)
        break
      case 'block':
        this.previewObject = this.add.rectangle(0, 0, 40, 40, 0x666666, 0.5)
        break
      case 'stairs':
        const stairs = this.add.graphics()
        stairs.fillStyle(0x888888, 0.5)
        stairs.fillRect(0, 0, 40, 40)
        stairs.fillRect(40, -40, 40, 80)
        stairs.fillRect(80, -80, 40, 120)
        this.previewObject = stairs
        break
      case 'platform':
        this.previewObject = this.add.rectangle(0, 0, 120, 20, 0x4444ff, 0.5)
        break
    }
  }
  
  private placeObject(x: number, y: number) {
    // Check if object already exists at this position
    const existing = this.levelData.find(obj => obj.x === x && obj.y === y)
    if (existing) return

    // Snap spikes to ground if placed near it
    if (this.selectedTool === 'spike' && y >= 500) {
      y = 530 // Place spike on ground (ground is at 550, spike bottom at 550, center at 530)
    }

    // Smart spike placement: if placing a spike and there's a block directly below, place spike on top of block
    if (this.selectedTool === 'spike') {
      const blockBelow = this.levelData.find(obj =>
        obj.type === 'block' &&
        obj.x === x &&
        obj.y === y + 40 // Block is one grid cell below (40 pixels)
      )
      if (blockBelow) {
        // Place spike on top of block perfectly aligned
        // Block: 40x40, centered at blockBelow.y, top edge at blockBelow.y - 20
        // Spike: triangle with bottom at y + 20
        // For perfect alignment: spike bottom (y + 20) = block top (blockY - 20)
        // Therefore: y = blockY - 40
        // But accounting for 2px stroke on both, we want them to meet at the outline
        y = blockBelow.y - 40
      }
    }

    const obj = {
      type: this.selectedTool,
      x: x,
      y: y
    }

    this.levelData.push(obj)
    this.drawObject(obj)
  }
  
  private drawObject(obj: any) {
    switch (obj.type) {
      case 'spike':
        const spike = this.add.triangle(obj.x, obj.y, 0, -20, -20, 20, 20, 20, 0xff0000)
        spike.setStrokeStyle(2, 0x000000)
        spike.setData('levelObject', obj)
        break
      case 'block':
        const block = this.add.rectangle(obj.x, obj.y, 40, 40, 0x666666)
        block.setStrokeStyle(2, 0x000000)
        block.setData('levelObject', obj)
        break
      case 'stairs':
        const stairs = this.add.graphics()
        stairs.fillStyle(0x888888, 1)
        stairs.lineStyle(2, 0x000000)
        stairs.fillRect(obj.x, obj.y, 40, 40)
        stairs.strokeRect(obj.x, obj.y, 40, 40)
        stairs.fillRect(obj.x + 40, obj.y - 40, 40, 80)
        stairs.strokeRect(obj.x + 40, obj.y - 40, 40, 80)
        stairs.fillRect(obj.x + 80, obj.y - 80, 40, 120)
        stairs.strokeRect(obj.x + 80, obj.y - 80, 40, 120)
        stairs.setData('levelObject', obj)
        break
      case 'platform':
        const platform = this.add.rectangle(obj.x, obj.y, 120, 20, 0x4444ff)
        platform.setStrokeStyle(2, 0x000000)
        platform.setData('levelObject', obj)
        break
    }
  }
  
  private deleteObjectAt(x: number, y: number) {
    // Find objects near click position - larger detection area for easier deletion
    const clickBounds = new Phaser.Geom.Rectangle(x - 40, y - 40, 80, 80)
    
    let deletedCount = 0
    
    this.children.list.forEach(child => {
      const obj = child.getData('levelObject')
      if (obj) {
        // Different bounds for different object types
        let objBounds: Phaser.Geom.Rectangle
        
        switch (obj.type) {
          case 'stairs':
            // Stairs are wider, so use larger bounds
            objBounds = new Phaser.Geom.Rectangle(obj.x - 60, obj.y - 60, 120, 120)
            break
          case 'platform':
            // Platforms are horizontal, so wider bounds
            objBounds = new Phaser.Geom.Rectangle(obj.x - 60, obj.y - 20, 120, 40)
            break
          case 'block':
            // Blocks can vary in size
            objBounds = new Phaser.Geom.Rectangle(obj.x - 40, obj.y - 40, 80, 80)
            break
          default:
            // Default for spikes and other objects
            objBounds = new Phaser.Geom.Rectangle(obj.x - 30, obj.y - 30, 60, 60)
        }
        
        if (Phaser.Geom.Rectangle.Overlaps(clickBounds, objBounds)) {
          // Remove from level data
          const index = this.levelData.indexOf(obj)
          if (index > -1) {
            this.levelData.splice(index, 1)
          }
          
          // Add deletion effect
          const deleteEffect = this.add.graphics()
          deleteEffect.x = obj.x
          deleteEffect.y = obj.y
          deleteEffect.lineStyle(3, 0xff0000, 1)
          deleteEffect.strokeCircle(0, 0, 20)
          
          // Animate the deletion effect
          this.tweens.add({
            targets: deleteEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => deleteEffect.destroy()
          })
          
          // Remove visual
          child.destroy()
          deletedCount++
        }
      }
    })
    
    // Show deletion feedback
    if (deletedCount > 0) {
      const deleteText = this.add.text(x, y - 30, `Deleted ${deletedCount} object${deletedCount > 1 ? 's' : ''}`, {
        fontSize: '16px',
        color: '#ff0000'
      })
      deleteText.setOrigin(0.5)
      
      this.tweens.add({
        targets: deleteText,
        y: deleteText.y - 20,
        alpha: 0,
        duration: 1000,
        onComplete: () => deleteText.destroy()
      })
    }
  }
  
  private saveLevel() {
    localStorage.setItem('level_stereoMadness', JSON.stringify(this.levelData))
    
    // Show save confirmation
    const saveMsg = this.add.text(400, 300, 'Level Saved!', {
      fontSize: '48px',
      color: '#00ff00'
    })
    saveMsg.setOrigin(0.5)
    saveMsg.setStroke('#000000', 4)
    saveMsg.setScrollFactor(0)
    
    this.tweens.add({
      targets: saveMsg,
      alpha: 0,
      duration: 2000,
      onComplete: () => saveMsg.destroy()
    })
  }
}

class PowersScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PowersScene' })
  }

  create() {
    // Check for ultra rare free event (0.001% chance)
    const isFreeEvent = Math.random() < 0.00001 // 0.001% chance
    
    // Get game state
    const totalCoins = gameState.getCoins()
    const purchasedPowers = gameState.getPurchasedPowers()
    const equippedPowers = gameState.getEquippedPowers()
    
    // Title
    const titleText = isFreeEvent ? '🎉 ALL POWERS FREE! 🎉' : 'Powers'
    const title = this.add.text(400, 50, titleText, {
      fontSize: '36px',
      color: isFreeEvent ? '#ff00ff' : '#ffff00'
    })
    title.setOrigin(0.5)
    title.setStroke('#000000', 3)
    
    if (isFreeEvent) {
      // Add sparkle effect text
      const sparkleText = this.add.text(400, 90, '✨ ULTRA RARE EVENT! ✨', {
        fontSize: '20px',
        color: '#ffffff'
      })
      sparkleText.setOrigin(0.5)
      sparkleText.setStroke('#ff00ff', 2)
      
      // Make it blink
      this.tweens.add({
        targets: sparkleText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
    }

    // Back button
    const backButton = this.add.rectangle(50, 50, 80, 40, 0xff0000)
    backButton.setStrokeStyle(2, 0x000000)
    backButton.setInteractive()
    
    const backText = this.add.text(50, 50, 'Back', {
      fontSize: '18px',
      color: '#ffffff'
    })
    backText.setOrigin(0.5)
    
    // Back button hover
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xdd0000)
    })
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0xff0000)
    })
    
    // Back button click
    backButton.on('pointerdown', () => {
      this.scene.start('HomeScene')
    })
    
    // Create 50 power slots (10 columns x 5 rows)
    const slotSize = 60
    const padding = 10
    const startX = 80
    const startY = 120
    const slotsPerRow = 10
    const totalSlots = 50
    
    for (let i = 0; i < totalSlots; i++) {
      const row = Math.floor(i / slotsPerRow)
      const col = i % slotsPerRow
      const x = startX + col * (slotSize + padding)
      const y = startY + row * (slotSize + padding)
      
      // Create slot - make first slot lighter
      const slotColor = i === 0 ? 0x555555 : 0x333333
      const slot = this.add.rectangle(x, y, slotSize, slotSize, slotColor)
      slot.setStrokeStyle(2, 0x666666)
      slot.setInteractive()
      slot.setData('index', i)
      
      // Add slot number or special text for first slot
      let slotText = (i + 1).toString()
      let fontSize = '14px'
      
      if (i === 0) {
        slotText = 'Press to\nshoot'
        fontSize = '12px'
      } else if (i === 1) {
        slotText = 'Rage\nTable'
        fontSize = '12px'
      } else if (i === 2) {
        slotText = 'Super\nJump'
        fontSize = '12px'
      } else if (i === 3) {
        slotText = 'Kamehame\nhaaa'
        fontSize = '12px'
      } else if (i === 4) {
        slotText = 'Reviver'
        fontSize = '12px'
      } else if (i === 5) {
        slotText = 'Fireball'
        fontSize = '12px'
      } else if (i === 6) {
        slotText = 'Double\nJump'
        fontSize = '12px'
      } else if (i === 7) {
        slotText = 'Telekinesis'
        fontSize = '12px'
      }
      
      const textColor = (i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 5 || i === 6 || i === 7) ? '#ffffff' : '#666666'
      const slotNumber = this.add.text(x, y, slotText, {
        fontSize: fontSize,
        color: textColor,
        align: 'center'
      })
      slotNumber.setOrigin(0.5)
      
      // Add "Equipped" text and Unequip button for first slot (Press to Shoot)
      if (i === 0) {
        const isEquipped = equippedPowers.includes(0)
        
        if (isEquipped) {
          const equippedText = this.add.text(x, y + 20, 'Equipped', {
            fontSize: '10px',
            color: '#00ff00'
          })
          equippedText.setOrigin(0.5)
          
          // Add Unequip button
          const unequipButton = this.add.text(x, y + 35, 'Unequip', {
            fontSize: '10px',
            color: '#ff6666'
          })
          unequipButton.setOrigin(0.5)
          unequipButton.setInteractive()
          
          // Hover effect for unequip button
          unequipButton.on('pointerover', () => {
            unequipButton.setColor('#ff0000')
          })
          
          unequipButton.on('pointerout', () => {
            unequipButton.setColor('#ff6666')
          })
          
          // Click handler for unequip button
          unequipButton.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
            if (event) event.stopPropagation()
            gameState.unequipPower(0) // Unequip Press to Shoot
            this.scene.restart()
          })
          
          slot.setData('equippedText', equippedText)
          slot.setData('unequipButton', unequipButton)
        } else {
          // Show Equip button when not equipped
          const equipButton = this.add.text(x, y + 20, 'Equip', {
            fontSize: '10px',
            color: '#ffffff'
          })
          equipButton.setOrigin(0.5)
          equipButton.setInteractive()
          
          // Hover effect for equip button
          equipButton.on('pointerover', () => {
            equipButton.setColor('#00ff00')
          })
          
          equipButton.on('pointerout', () => {
            equipButton.setColor('#ffffff')
          })
          
          // Click handler for equip button
          equipButton.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
            if (event) event.stopPropagation()
            gameState.equipPower(0) // Equip Press to Shoot
            this.scene.restart()
          })
          
          slot.setData('equipButton', equipButton)
        }
        
        slot.setData('powerId', 0)
      }
      
      // Add price/status for Rage Table (slot 2)
      if (i === 1) {
        if (purchasedPowers.includes(1)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(1)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '1000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 1000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 1)
        slot.setData('price', 1000)
      }
      
      // Add price/status for Super Jump (slot 3)
      if (i === 2) {
        if (purchasedPowers.includes(2)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(2)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '3000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 3000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 2)
        slot.setData('price', 3000)
      }
      
      // Add price/status for Kamehame haaa (slot 4)
      if (i === 3) {
        if (purchasedPowers.includes(3)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(3)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '5000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 5000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 3)
        slot.setData('price', 5000)
      }
      
      // Add price/status for Reviver (slot 5)
      if (i === 4) {
        if (purchasedPowers.includes(4)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(4)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '8000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 8000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 4)
        slot.setData('price', 8000)
      }
      
      // Add price/status for Fireball (slot 6)
      if (i === 5) {
        if (purchasedPowers.includes(5)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(5)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '12000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 12000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 5)
        slot.setData('price', 12000)
      }
      
      // Add price/status for Double Jump (slot 7)
      if (i === 6) {
        if (purchasedPowers.includes(6)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(6)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '6000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 6000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 6)
        slot.setData('price', 6000)
      }
      
      // Add price/status for Telekinesis (slot 8)
      if (i === 7) {
        if (purchasedPowers.includes(7)) {
          // Show equip status
          const isEquipped = equippedPowers.includes(7)
          const equipText = this.add.text(x, y + 20, isEquipped ? 'Equipped' : 'Equip', {
            fontSize: '10px',
            color: isEquipped ? '#00ff00' : '#ffffff'
          })
          equipText.setOrigin(0.5)
          slot.setData('equipText', equipText)
        } else {
          // Show price
          const priceText = this.add.text(x, y + 20, isFreeEvent ? 'FREE!' : '15000', {
            fontSize: '10px',
            color: isFreeEvent ? '#ff00ff' : (totalCoins >= 15000 ? '#ffd700' : '#666666')
          })
          priceText.setOrigin(0.5)
          slot.setData('priceText', priceText)
          
          // Add coin icon
          const coinIcon = this.add.circle(x + 20, y + 20, 4, 0xffd700)
          coinIcon.setStrokeStyle(1, 0x000000)
          slot.setData('coinIcon', coinIcon)
        }
        
        slot.setData('powerId', 7)
        slot.setData('price', 15000)
      }
      
      // Slot hover effect
      slot.on('pointerover', () => {
        slot.setStrokeStyle(2, 0xffffff)
      })
      
      slot.on('pointerout', () => {
        slot.setStrokeStyle(2, 0x666666)
      })
      
      // Click handler
      slot.on('pointerdown', () => {
        const powerId = slot.getData('powerId')
        
        if (powerId === 1 || powerId === 2 || powerId === 3 || powerId === 4 || powerId === 5 || powerId === 6 || powerId === 7) { // Rage Table, Super Jump, Kamehame haaa, Reviver, Fireball, Double Jump, or Telekinesis
          if (gameState.hasPower(powerId)) {
            // Toggle equip/unequip
            if (gameState.isPowerEquipped(powerId)) {
              gameState.unequipPower(powerId)
            } else {
              gameState.equipPower(powerId)
            }
            this.scene.restart()
          } else {
            // Try to purchase
            const price = slot.getData('price')
            if (isFreeEvent || gameState.getCoins() >= price) {
              if (isFreeEvent || gameState.spendCoins(price)) {
                gameState.purchasePower(powerId)
                gameState.equipPower(powerId)
                this.scene.restart()
              }
            }
          }
        }
      })
    }
    
    // Add instruction text at bottom
    const instructionText = this.add.text(400, 480, 'Only one power can be equipped at a time! Choose wisely.', {
      fontSize: '16px',
      color: '#ffff00'
    })
    instructionText.setOrigin(0.5)
    instructionText.setStroke('#000000', 2)
  }
}

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private obstacles!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private isJumping = false
  private gameOver = false
  private score = 0
  private scoreText!: Phaser.GameObjects.Text
  private gameSpeed = 300
  private baseGameSpeed = 300
  private canShoot = true
  private cooldownText!: Phaser.GameObjects.Text
  private coinsEarned = 0
  private coinText!: Phaser.GameObjects.Text
  private coinsAdded = false
  private hasRageTable = false
  private canUseRageTable = true
  private rageTableCooldown = 0
  private rageTableCooldownText!: Phaser.GameObjects.Text
  private rageTables!: Phaser.Physics.Arcade.Group
  private hasSuperJump = false
  private isSuperJumping = false
  private superJumpStartX = 0
  private canUseSuperJump = true
  private superJumpCooldown = 0
  private superJumpCooldownText!: Phaser.GameObjects.Text
  private hasKamehameHaaa = false
  private isUsingKamehameHaaa = false
  private kamehameStairs!: Phaser.GameObjects.Rectangle[]
  private originalY = 0
  private spikeCounter = 0
  private hasReviver = false
  private canUseReviver = true
  private reviverCooldown = 0
  private reviverActive = false
  private reviverCooldownText!: Phaser.GameObjects.Text
  private hasFireball = false
  private canUseFireball = true
  private fireballCooldown = 0
  private fireballCooldownText!: Phaser.GameObjects.Text
  private isRidingFireball = false
  private fireballRide: any = null
  private fireballRideTime = 0
  private hasDoubleJump = false
  private canDoubleJump = true
  private doubleJumpUsed = false
  private doubleJumpCooldown = 0
  private doubleJumpCooldownText!: Phaser.GameObjects.Text
  private hasTelekinesis = false
  private telekinesisActive = false
  private floatingSpikes: any[] = []
  private currentLevel = 'stereoMadness'
  private levelProgressText!: Phaser.GameObjects.Text
  private levelCompleted = false
  private otherPlayers: any[] = []
  private playerNameTexts: any[] = []
  private canJump = true
  private jumpCooldown = 0
  private jumpCooldownText!: Phaser.GameObjects.Text
  private isModerator = false

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    // Reset game state
    this.isJumping = false
    this.gameOver = false
    this.score = 0
    this.coinsEarned = 0
    this.canShoot = true
    this.coinsAdded = false
    this.spikeCounter = 0
    
    // Check equipped powers
    const equippedPowers = gameState.getEquippedPowers()
    this.hasRageTable = equippedPowers.includes(1)
    this.canUseRageTable = true
    this.rageTableCooldown = 0
    this.hasSuperJump = equippedPowers.includes(2)
    this.isSuperJumping = false
    this.canUseSuperJump = true
    this.superJumpCooldown = 0
    this.hasKamehameHaaa = equippedPowers.includes(3)
    this.isUsingKamehameHaaa = false
    this.hasReviver = equippedPowers.includes(4)
    this.canUseReviver = true
    this.reviverCooldown = 0
    this.reviverActive = false
    this.hasFireball = equippedPowers.includes(5)
    this.canUseFireball = true
    this.fireballCooldown = 0
    this.hasDoubleJump = equippedPowers.includes(6)
    this.canDoubleJump = true
    this.doubleJumpUsed = false
    this.doubleJumpCooldown = 0
    this.hasTelekinesis = equippedPowers.includes(7)
    this.telekinesisActive = false
    
    // Initialize jump cooldown
    this.canJump = true
    this.jumpCooldown = 0
    
    // Check if player is moderator
    this.isModerator = localStorage.getItem('isModerator') === 'true'
    
    // Apply speed boost upgrade
    const speedBoostLevel = gameState.getSpeedBoostLevel()
    this.gameSpeed = this.baseGameSpeed * (1 + speedBoostLevel * 0.1) // +10% per level
    
    // Jump power level will be applied in the jump method
  }

  preload() {
    // Create simple colored rectangles as assets
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    this.load.image('obstacle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
  }

  create() {
    // Create ground
    this.ground = this.physics.add.staticGroup()
    const groundRect = this.add.rectangle(400, 550, 800, 100, 0x00ff00)
    this.ground.add(groundRect)

    // Create player (cube)
    const playerRect = this.add.rectangle(100, 450, 40, 40, 0xffff00)
    playerRect.setStrokeStyle(3, 0x000000) // Black outline
    this.player = this.physics.add.existing(playerRect) as Phaser.Physics.Arcade.Sprite
    this.player.body!.setCollideWorldBounds(true)
    
    // Make hitbox bigger than visual size (more challenging)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(45, 45) // Bigger hitbox (visual is 40x40)
    body.setOffset(-2.5, -2.5) // Center the bigger hitbox
    
    // Add face based on equipped avatar
    let leftEye: any, rightEye: any, mouth: any
    
    if (equippedAvatar === 1) {
      // Happy face
      leftEye = this.add.circle(90, 442, 3, 0x000000)
      rightEye = this.add.circle(110, 442, 3, 0x000000)
      
      // Create smile
      const graphics = this.add.graphics()
      graphics.lineStyle(2, 0x000000, 1)
      graphics.beginPath()
      graphics.arc(100, 455, 15, 0, Math.PI, false)
      graphics.strokePath()
      mouth = graphics
    } else if (equippedAvatar === 2) {
      // Mischievous cat face >:3
      leftEye = this.add.text(88, 442, '>', {
        fontSize: '16px',
        color: '#000000',
        fontStyle: 'bold'
      })
      leftEye.setOrigin(0.5)
      
      rightEye = this.add.circle(110, 445, 3, 0x000000)
      
      mouth = this.add.text(100, 458, ':3', {
        fontSize: '14px',
        color: '#000000',
        fontStyle: 'bold'
      })
      mouth.setOrigin(0.5)
    } else if (equippedAvatar === 3) {
      // Rainbow throwing up face
      leftEye = this.add.text(90, 442, 'X', {
        fontSize: '12px',
        color: '#000000',
        fontStyle: 'bold'
      })
      leftEye.setOrigin(0.5)
      
      rightEye = this.add.text(110, 442, 'X', {
        fontSize: '12px',
        color: '#000000',
        fontStyle: 'bold'
      })
      rightEye.setOrigin(0.5)
      
      // Open mouth (ellipse)
      mouth = this.add.ellipse(100, 458, 20, 12, 0x000000)
    } else if (equippedAvatar === 4) {
      // Roblox man face
      leftEye = this.add.circle(90, 445, 2, 0x000000)
      rightEye = this.add.circle(110, 445, 2, 0x000000)
      
      // Roblox smile (arc)
      mouth = this.add.arc(100, 455, 12, 0, 180, false, 0x000000)
      mouth.setStrokeStyle(3, 0x000000)
      mouth.setRotation(Math.PI)
    } else if (equippedAvatar === 5) {
      // Funny face with derpy eyes
      const leftEyeWhite = this.add.circle(90, 445, 8, 0xFFFFFF)
      leftEyeWhite.setStrokeStyle(2, 0x000000)
      leftEye = this.add.circle(90, 441, 3, 0x000000) // Looking up
      
      const rightEyeWhite = this.add.circle(110, 445, 8, 0xFFFFFF)
      rightEyeWhite.setStrokeStyle(2, 0x000000)
      rightEye = this.add.circle(114, 445, 3, 0x000000) // Looking right
      
      // Silly wavy mouth with tongue - using simple line segments
      const graphics = this.add.graphics()
      graphics.lineStyle(3, 0x000000, 1)
      graphics.beginPath()
      graphics.moveTo(85, 455)
      graphics.lineTo(92, 462)
      graphics.lineTo(100, 453)
      graphics.lineTo(108, 460)
      graphics.lineTo(115, 458)
      graphics.strokePath()
      
      // Tongue
      mouth = this.add.ellipse(105, 462, 10, 15, 0xFF69B4)
      mouth.setStrokeStyle(2, 0x000000)
      
      // Store extra elements for position updates
      this.player.setData('extraFaceElements', [leftEyeWhite, rightEyeWhite, graphics])
    } else if (equippedAvatar === 6) {
      // Serious face
      leftEye = this.add.rectangle(90, 445, 12, 4, 0x000000)
      rightEye = this.add.rectangle(110, 445, 12, 4, 0x000000)
      
      // Thick eyebrows angled downward
      const leftEyebrow = this.add.rectangle(90, 438, 15, 3, 0x000000)
      leftEyebrow.setRotation(-0.3)
      
      const rightEyebrow = this.add.rectangle(110, 438, 15, 3, 0x000000)
      rightEyebrow.setRotation(0.3)
      
      // Straight mouth
      mouth = this.add.rectangle(100, 458, 25, 2, 0x000000)
      
      // Store eyebrows for position updates
      this.player.setData('eyebrows', [leftEyebrow, rightEyebrow])
    } else if (equippedAvatar === 7) {
      // Sigma face
      leftEye = this.add.rectangle(90, 445, 10, 6, 0x000000)
      rightEye = this.add.rectangle(110, 445, 10, 6, 0x000000)
      
      // Cool sunglasses
      const leftShade = this.add.rectangle(90, 445, 14, 10, 0x000000, 0.3)
      leftShade.setStrokeStyle(2, 0x000000)
      const rightShade = this.add.rectangle(110, 445, 14, 10, 0x000000, 0.3)
      rightShade.setStrokeStyle(2, 0x000000)
      const bridge = this.add.rectangle(100, 445, 8, 2, 0x000000)
      
      // Confident smirk
      const smirk = this.add.graphics()
      smirk.lineStyle(3, 0x000000, 1)
      smirk.beginPath()
      smirk.moveTo(92, 458)
      smirk.lineTo(102, 460)
      smirk.lineTo(112, 456)
      smirk.strokePath()
      
      // Sigma symbol
      const sigmaSymbol = this.add.text(120, 435, 'Σ', {
        fontSize: '16px',
        color: '#4169E1',
        fontWeight: 'bold'
      })
      sigmaSymbol.setOrigin(0.5)
      sigmaSymbol.setStroke('#000000', 2)
      
      mouth = smirk // Store smirk as mouth for consistency
      
      // Store extra elements
      this.player.setData('sigmaElements', [leftShade, rightShade, bridge, sigmaSymbol])
    } else if (equippedAvatar === 8) {
      // Sad face
      leftEye = this.add.circle(90, 445, 3, 0x000000)
      rightEye = this.add.circle(110, 445, 3, 0x000000)
      
      // Tears
      const leftTear = this.add.ellipse(90, 450, 4, 8, 0x00BFFF)
      leftTear.setStrokeStyle(1, 0x0080FF)
      const rightTear = this.add.ellipse(110, 450, 4, 8, 0x00BFFF)
      rightTear.setStrokeStyle(1, 0x0080FF)
      
      // Sad frown
      const frown = this.add.graphics()
      frown.lineStyle(3, 0x000000, 1)
      frown.beginPath()
      frown.moveTo(88, 462)
      frown.lineTo(95, 458)
      frown.lineTo(105, 458)
      frown.lineTo(112, 462)
      frown.strokePath()
      
      mouth = frown
      this.player.setData('tears', [leftTear, rightTear])
    } else if (equippedAvatar === 9) {
      // Scared face
      const leftEyeWhite = this.add.circle(90, 445, 10, 0xFFFFFF)
      leftEyeWhite.setStrokeStyle(2, 0x000000)
      leftEye = this.add.circle(90, 445, 5, 0x000000)
      
      const rightEyeWhite = this.add.circle(110, 445, 10, 0xFFFFFF)
      rightEyeWhite.setStrokeStyle(2, 0x000000)
      rightEye = this.add.circle(110, 445, 5, 0x000000)
      
      // Raised eyebrows
      const leftBrow = this.add.rectangle(90, 435, 12, 2, 0x000000)
      leftBrow.setRotation(0.3)
      const rightBrow = this.add.rectangle(110, 435, 12, 2, 0x000000)
      rightBrow.setRotation(-0.3)
      
      // Open mouth (shocked)
      mouth = this.add.ellipse(100, 460, 15, 20, 0x000000)
      
      this.player.setData('scaredElements', [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow])
    } else if (equippedAvatar === 10) {
      // Really happy face
      leftEye = this.add.star(90, 445, 5, 3, 6, 0x000000)
      rightEye = this.add.star(110, 445, 5, 3, 6, 0x000000)
      
      // Huge smile
      const bigSmile = this.add.graphics()
      bigSmile.lineStyle(4, 0x000000, 1)
      bigSmile.beginPath()
      bigSmile.arc(100, 450, 20, 0, Math.PI, false)
      bigSmile.strokePath()
      
      // Rosy cheeks
      const leftCheek = this.add.circle(80, 450, 8, 0xFF69B4, 0.5)
      const rightCheek = this.add.circle(120, 450, 8, 0xFF69B4, 0.5)
      
      // Sparkles
      const sparkle1 = this.add.text(75, 435, '✨', { fontSize: '12px' })
      const sparkle2 = this.add.text(120, 435, '✨', { fontSize: '12px' })
      
      mouth = bigSmile
      this.player.setData('happyElements', [leftCheek, rightCheek, sparkle1, sparkle2])
    } else if (equippedAvatar === 11) {
      // Embarrassed face
      leftEye = this.add.circle(90, 445, 3, 0x000000)
      rightEye = this.add.circle(110, 445, 3, 0x000000)
      
      // Sweat drop
      const sweatDrop = this.add.ellipse(118, 438, 5, 8, 0x87CEEB)
      sweatDrop.setStrokeStyle(1, 0x4682B4)
      
      // Nervous smile
      const nervousSmile = this.add.graphics()
      nervousSmile.lineStyle(2, 0x000000, 1)
      nervousSmile.beginPath()
      nervousSmile.moveTo(90, 458)
      nervousSmile.lineTo(97, 460)
      nervousSmile.lineTo(103, 458)
      nervousSmile.lineTo(110, 460)
      nervousSmile.strokePath()
      
      // Blush marks
      const leftBlush = this.add.graphics()
      leftBlush.lineStyle(2, 0xFF1493, 0.8)
      leftBlush.moveTo(80, 448)
      leftBlush.lineTo(85, 450)
      leftBlush.moveTo(80, 452)
      leftBlush.lineTo(85, 454)
      leftBlush.strokePath()
      
      const rightBlush = this.add.graphics()
      rightBlush.lineStyle(2, 0xFF1493, 0.8)
      rightBlush.moveTo(115, 448)
      rightBlush.lineTo(120, 450)
      rightBlush.moveTo(115, 452)
      rightBlush.lineTo(120, 454)
      rightBlush.strokePath()
      
      mouth = nervousSmile
      this.player.setData('embarrassedElements', [sweatDrop, leftBlush, rightBlush])
    } else if (equippedAvatar === 12) {
      // Really really bored face
      leftEye = this.add.rectangle(90, 445, 12, 2, 0x000000)
      rightEye = this.add.rectangle(110, 445, 12, 2, 0x000000)
      mouth = this.add.rectangle(100, 460, 25, 1, 0x000000)
      
      // Bags under eyes
      const leftBag = this.add.graphics()
      leftBag.lineStyle(1, 0x666666, 0.8)
      leftBag.beginPath()
      leftBag.arc(90, 449, 8, 0, Math.PI, false)
      leftBag.strokePath()
      
      const rightBag = this.add.graphics()
      rightBag.lineStyle(1, 0x666666, 0.8)
      rightBag.beginPath()
      rightBag.arc(110, 449, 8, 0, Math.PI, false)
      rightBag.strokePath()
      
      this.player.setData('boredElements', [leftBag, rightBag])
    } else if (equippedAvatar === 13) {
      // Depressed face
      leftEye = this.add.circle(90, 448, 3, 0x000000)
      rightEye = this.add.circle(110, 448, 3, 0x000000)
      
      // Sad frown
      const frown = this.add.graphics()
      frown.lineStyle(2, 0x000000, 1)
      frown.beginPath()
      frown.arc(100, 468, 12, Math.PI, 0, false)
      frown.strokePath()
      
      // Tear drop
      const leftTear = this.add.ellipse(90, 455, 4, 6, 0x87CEEB)
      leftTear.setStrokeStyle(1, 0x4682B4)
      
      mouth = frown
      this.player.setData('depressedElements', [leftTear])
    } else if (equippedAvatar === 14) {
      // Surprised face
      const leftEyeWhite = this.add.circle(90, 445, 6, 0xFFFFFF)
      leftEyeWhite.setStrokeStyle(1, 0x000000)
      leftEye = this.add.circle(90, 445, 3, 0x000000)
      
      const rightEyeWhite = this.add.circle(110, 445, 6, 0xFFFFFF)
      rightEyeWhite.setStrokeStyle(1, 0x000000)
      rightEye = this.add.circle(110, 445, 3, 0x000000)
      
      // Raised eyebrows
      const leftBrow = this.add.graphics()
      leftBrow.lineStyle(2, 0x000000, 1)
      leftBrow.beginPath()
      leftBrow.arc(90, 435, 8, Math.PI, 0, false)
      leftBrow.strokePath()
      
      const rightBrow = this.add.graphics()
      rightBrow.lineStyle(2, 0x000000, 1)
      rightBrow.beginPath()
      rightBrow.arc(110, 435, 8, Math.PI, 0, false)
      rightBrow.strokePath()
      
      // Open mouth (O shape)
      mouth = this.add.circle(100, 460, 8, 0x000000)
      
      this.player.setData('surprisedElements', [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow])
    } else if (equippedAvatar === 15) {
      // WOW face
      // Star eyes
      leftEye = this.add.star(90, 445, 5, 3, 6, 0xFFFF00)
      leftEye.setStrokeStyle(1, 0x000000)
      
      rightEye = this.add.star(110, 445, 5, 3, 6, 0xFFFF00)
      rightEye.setStrokeStyle(1, 0x000000)
      
      // Wide open mouth
      mouth = this.add.ellipse(100, 460, 16, 12, 0xFF1493)
      mouth.setStrokeStyle(2, 0x000000)
      
      // Sparkles
      const sparkle1 = this.add.star(75, 430, 4, 2, 4, 0xFFFF00)
      const sparkle2 = this.add.star(125, 430, 4, 2, 4, 0xFFFF00)
      const sparkle3 = this.add.star(100, 475, 4, 2, 4, 0xFFFF00)
      
      this.player.setData('wowElements', [sparkle1, sparkle2, sparkle3])
    } else if (equippedAvatar === 16) {
      // Silly face
      // Crossed eyes
      const leftEyeWhite = this.add.circle(90, 445, 6, 0xFFFFFF)
      leftEyeWhite.setStrokeStyle(1, 0x000000)
      leftEye = this.add.circle(93, 445, 3, 0x000000)
      
      const rightEyeWhite = this.add.circle(110, 445, 6, 0xFFFFFF)
      rightEyeWhite.setStrokeStyle(1, 0x000000)
      rightEye = this.add.circle(107, 445, 3, 0x000000)
      
      // Big silly grin
      mouth = this.add.graphics()
      mouth.lineStyle(3, 0x000000, 1)
      mouth.beginPath()
      mouth.arc(100, 455, 15, 0, Math.PI, false)
      mouth.strokePath()
      
      // Tongue sticking out
      const tongue = this.add.ellipse(108, 468, 12, 8, 0xFF69B4)
      tongue.setStrokeStyle(1, 0x000000)
      
      // Silly curved eyebrows
      const leftBrow = this.add.graphics()
      leftBrow.lineStyle(2, 0x000000, 1)
      leftBrow.beginPath()
      leftBrow.arc(90, 437, 8, Math.PI, 0, false)
      leftBrow.strokePath()
      
      const rightBrow = this.add.graphics()
      rightBrow.lineStyle(2, 0x000000, 1)
      rightBrow.beginPath()
      rightBrow.arc(110, 437, 8, Math.PI, 0, false)
      rightBrow.strokePath()
      
      // Propeller hat
      const hatBase = this.add.rectangle(100, 422, 20, 8, 0xFF0000)
      hatBase.setStrokeStyle(1, 0x000000)
      const propeller1 = this.add.ellipse(90, 418, 15, 4, 0xFFFF00)
      propeller1.setStrokeStyle(1, 0x000000)
      propeller1.setRotation(0.3)
      const propeller2 = this.add.ellipse(110, 418, 15, 4, 0xFFFF00)
      propeller2.setStrokeStyle(1, 0x000000)
      propeller2.setRotation(-0.3)
      
      this.player.setData('sillyElements', [leftEyeWhite, rightEyeWhite, tongue, leftBrow, rightBrow, hatBase, propeller1, propeller2])
    } else if (equippedAvatar === 17) {
      // Easter Bunny face
      // Bunny ears
      const leftEar = this.add.ellipse(92, 428, 8, 20, 0xFFFFFF)
      leftEar.setStrokeStyle(2, 0x000000)
      const leftEarInner = this.add.ellipse(92, 428, 4, 12, 0xFFB6C1)
      
      const rightEar = this.add.ellipse(108, 428, 8, 20, 0xFFFFFF)
      rightEar.setStrokeStyle(2, 0x000000)
      const rightEarInner = this.add.ellipse(108, 428, 4, 12, 0xFFB6C1)
      
      // Cute eyes
      leftEye = this.add.circle(90, 448, 3, 0x000000)
      rightEye = this.add.circle(110, 448, 3, 0x000000)
      
      // Pink nose
      const nose = this.add.triangle(100, 455, 0, 0, -4, 6, 4, 6, 0xFF69B4)
      nose.setStrokeStyle(1, 0x000000)
      
      // Bunny teeth
      const teeth = this.add.rectangle(100, 462, 8, 6, 0xFFFFFF)
      teeth.setStrokeStyle(1, 0x000000)
      
      mouth = teeth
      this.player.setData('bunnyElements', [leftEar, leftEarInner, rightEar, rightEarInner, nose])
    } else if (equippedAvatar === 18) {
      // Mad face
      leftEye = this.add.circle(90, 448, 3, 0x000000)
      rightEye = this.add.circle(110, 448, 3, 0x000000)
      
      // Angry eyebrows
      const leftBrow = this.add.graphics()
      leftBrow.lineStyle(3, 0x000000, 1)
      leftBrow.moveTo(85, 438)
      leftBrow.lineTo(95, 443)
      leftBrow.strokePath()
      
      const rightBrow = this.add.graphics()
      rightBrow.lineStyle(3, 0x000000, 1)
      rightBrow.moveTo(105, 443)
      rightBrow.lineTo(115, 438)
      rightBrow.strokePath()
      
      // Angry mouth
      mouth = this.add.graphics()
      mouth.lineStyle(2, 0x000000, 1)
      mouth.beginPath()
      mouth.moveTo(88, 462)
      mouth.lineTo(95, 458)
      mouth.lineTo(105, 458)
      mouth.lineTo(112, 462)
      mouth.strokePath()
      
      // Steam puffs
      const steam1 = this.add.circle(80, 430, 4, 0xFFFFFF)
      steam1.setAlpha(0.7)
      const steam2 = this.add.circle(120, 430, 4, 0xFFFFFF)
      steam2.setAlpha(0.7)
      
      this.player.setData('madElements', [leftBrow, rightBrow, steam1, steam2])
    } else if (equippedAvatar === 19) {
      // Scared face
      // Wide scared eyes
      const leftEyeWhite = this.add.circle(90, 445, 7, 0xFFFFFF)
      leftEyeWhite.setStrokeStyle(1, 0x000000)
      leftEye = this.add.circle(90, 447, 2, 0x000000)
      
      const rightEyeWhite = this.add.circle(110, 445, 7, 0xFFFFFF)
      rightEyeWhite.setStrokeStyle(1, 0x000000)
      rightEye = this.add.circle(110, 447, 2, 0x000000)
      
      // Worried eyebrows
      const leftBrow = this.add.graphics()
      leftBrow.lineStyle(2, 0x000000, 1)
      leftBrow.moveTo(85, 435)
      leftBrow.lineTo(95, 438)
      leftBrow.strokePath()
      
      const rightBrow = this.add.graphics()
      rightBrow.lineStyle(2, 0x000000, 1)
      rightBrow.moveTo(105, 438)
      rightBrow.lineTo(115, 435)
      rightBrow.strokePath()
      
      // Wavy scared mouth
      mouth = this.add.graphics()
      mouth.lineStyle(2, 0x000000, 1)
      mouth.beginPath()
      mouth.moveTo(90, 460)
      mouth.lineTo(95, 458)
      mouth.lineTo(100, 460)
      mouth.lineTo(105, 458)
      mouth.lineTo(110, 460)
      mouth.strokePath()
      
      // Shaking lines
      const shake1 = this.add.graphics()
      shake1.lineStyle(1, 0x666666, 0.5)
      shake1.moveTo(75, 443)
      shake1.lineTo(78, 443)
      shake1.moveTo(75, 453)
      shake1.lineTo(78, 453)
      shake1.strokePath()
      
      const shake2 = this.add.graphics()
      shake2.lineStyle(1, 0x666666, 0.5)
      shake2.moveTo(122, 443)
      shake2.lineTo(125, 443)
      shake2.moveTo(122, 453)
      shake2.lineTo(125, 453)
      shake2.strokePath()
      
      this.player.setData('scaredElements', [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow, shake1, shake2])
    } else if (equippedAvatar >= 20 && equippedAvatar <= 49) {
      // Random faces 21-50
      const faceType = equippedAvatar - 20
      
      switch(faceType % 10) {
        case 0: // Dizzy face
          leftEye = this.add.text(90, 445, '@', { fontSize: '16px', color: '#000000' })
          rightEye = this.add.text(110, 445, '@', { fontSize: '16px', color: '#000000' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.beginPath()
          mouth.arc(100, 458, 10, 0.2, 2.94, false)
          mouth.strokePath()
          break
          
        case 1: // Star eyes
          leftEye = this.add.star(90, 445, 5, 3, 6, 0x000000)
          rightEye = this.add.star(110, 445, 5, 3, 6, 0x000000)
          mouth = this.add.rectangle(100, 460, 15, 3, 0x000000)
          break
          
        case 2: // Heart eyes
          leftEye = this.add.text(90, 445, '♥', { fontSize: '14px', color: '#FF1493' })
          rightEye = this.add.text(110, 445, '♥', { fontSize: '14px', color: '#FF1493' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.beginPath()
          mouth.arc(100, 455, 12, 0, Math.PI, false)
          mouth.strokePath()
          break
          
        case 3: // X eyes
          leftEye = this.add.text(90, 445, 'X', { fontSize: '14px', color: '#000000' })
          rightEye = this.add.text(110, 445, 'X', { fontSize: '14px', color: '#000000' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.ellipse(100, 460, 10, 6, 0x000000)
          break
          
        case 4: // Winking
          leftEye = this.add.graphics()
          leftEye.lineStyle(2, 0x000000)
          leftEye.moveTo(85, 445)
          leftEye.lineTo(95, 445)
          leftEye.strokePath()
          rightEye = this.add.circle(110, 445, 3, 0x000000)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.beginPath()
          mouth.arc(103, 455, 10, 0, Math.PI, false)
          mouth.strokePath()
          break
          
        case 5: // Cyclops
          leftEye = this.add.circle(100, 445, 8, 0xFFFFFF)
          leftEye.setStrokeStyle(2, 0x000000)
          rightEye = this.add.circle(100, 445, 4, 0x000000)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.moveTo(92, 460)
          mouth.lineTo(108, 460)
          mouth.strokePath()
          break
          
        case 6: // Dollar eyes
          leftEye = this.add.text(90, 445, '$', { fontSize: '14px', color: '#228B22' })
          rightEye = this.add.text(110, 445, '$', { fontSize: '14px', color: '#228B22' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.graphics()
          mouth.lineStyle(3, 0x000000)
          mouth.beginPath()
          mouth.arc(100, 453, 15, 0, Math.PI, false)
          mouth.strokePath()
          break
          
        case 7: // Spiral eyes
          leftEye = this.add.text(90, 445, '◉', { fontSize: '14px', color: '#000000' })
          rightEye = this.add.text(110, 445, '◉', { fontSize: '14px', color: '#000000' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.moveTo(90, 460)
          mouth.lineTo(95, 462)
          mouth.lineTo(105, 462)
          mouth.lineTo(110, 460)
          mouth.strokePath()
          break
          
        case 8: // Question eyes
          leftEye = this.add.text(90, 445, '?', { fontSize: '14px', color: '#000000' })
          rightEye = this.add.text(110, 445, '?', { fontSize: '14px', color: '#000000' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.graphics()
          mouth.lineStyle(2, 0x000000)
          mouth.beginPath()
          mouth.arc(100, 465, 10, Math.PI, 0, false)
          mouth.strokePath()
          break
          
        case 9: // Lightning eyes
          leftEye = this.add.text(90, 445, '⚡', { fontSize: '12px', color: '#FFD700' })
          rightEye = this.add.text(110, 445, '⚡', { fontSize: '12px', color: '#FFD700' })
          leftEye.setOrigin(0.5)
          rightEye.setOrigin(0.5)
          mouth = this.add.ellipse(100, 460, 12, 8, 0x000000)
          break
      }
      
      // Store special elements for certain face types
      const specialElements: any[] = []
      
      // Add accessories for faces 30-39
      if (faceType >= 10 && faceType < 20) {
        switch(faceType % 10) {
          case 0: // Sunglasses
            const sunglasses = this.add.rectangle(100, 445, 35, 8, 0x000000)
            sunglasses.setStrokeStyle(1, 0x333333)
            specialElements.push(sunglasses)
            break
          case 1: // Monocle
            const monocle = this.add.circle(110, 445, 8, 0x000000, 0)
            monocle.setStrokeStyle(2, 0x000000)
            specialElements.push(monocle)
            break
          case 2: // Mustache
            const mustache = this.add.graphics()
            mustache.lineStyle(3, 0x000000)
            mustache.beginPath()
            mustache.arc(95, 453, 8, 0, Math.PI, true)
            mustache.arc(105, 453, 8, 0, Math.PI, true)
            mustache.strokePath()
            specialElements.push(mustache)
            break
          case 3: // Top hat
            const hatBrim = this.add.rectangle(100, 428, 30, 3, 0x000000)
            const hatTop = this.add.rectangle(100, 422, 20, 10, 0x000000)
            specialElements.push(hatBrim, hatTop)
            break
          case 4: // Bow tie
            const bowLeft = this.add.triangle(92, 465, 0, 0, -6, -4, -6, 4, 0xFF0000)
            const bowRight = this.add.triangle(108, 465, 0, 0, 6, -4, 6, 4, 0xFF0000)
            const bowCenter = this.add.rectangle(100, 465, 4, 6, 0x8B0000)
            specialElements.push(bowLeft, bowRight, bowCenter)
            break
          case 5: // Crown
            const crown = this.add.triangle(100, 425, 0, 0, -10, 10, 10, 10, 0xFFD700)
            crown.setStrokeStyle(1, 0x000000)
            specialElements.push(crown)
            break
          case 6: // Eye patch
            const patch = this.add.ellipse(90, 445, 12, 10, 0x000000)
            const strap = this.add.rectangle(95, 445, 40, 2, 0x000000)
            specialElements.push(patch, strap)
            break
          case 7: // Headband
            const band = this.add.rectangle(100, 432, 35, 5, 0xFF4500)
            band.setStrokeStyle(1, 0x000000)
            specialElements.push(band)
            break
          case 8: // Antenna
            const antennaStick = this.add.rectangle(100, 428, 2, 15, 0x808080)
            const antennaBall = this.add.circle(100, 420, 4, 0xFF0000)
            specialElements.push(antennaStick, antennaBall)
            break
          case 9: // Halo
            const halo = this.add.ellipse(100, 425, 25, 8, 0xFFFF00, 0)
            halo.setStrokeStyle(2, 0xFFD700)
            specialElements.push(halo)
            break
        }
      }
      
      // Special effects for faces 40-49
      if (faceType >= 20) {
        switch(faceType % 10) {
          case 0: // Rainbow
            const rainbow = this.add.graphics()
            rainbow.lineStyle(2, 0xFF0000)
            rainbow.arc(100, 450, 20, 0, Math.PI, true)
            rainbow.lineStyle(2, 0xFF7F00)
            rainbow.arc(100, 452, 18, 0, Math.PI, true)
            rainbow.lineStyle(2, 0xFFFF00)
            rainbow.arc(100, 454, 16, 0, Math.PI, true)
            specialElements.push(rainbow)
            break
          case 1: // Fire
            const fire1 = this.add.triangle(85, 430, 0, 0, -3, 8, 3, 8, 0xFF4500)
            const fire2 = this.add.triangle(100, 430, 0, 0, -3, 8, 3, 8, 0xFF6347)
            const fire3 = this.add.triangle(115, 430, 0, 0, -3, 8, 3, 8, 0xFF4500)
            specialElements.push(fire1, fire2, fire3)
            break
          case 2: // Sparkles
            const spark1 = this.add.text(80, 430, '✨', { fontSize: '12px' })
            const spark2 = this.add.text(115, 430, '✨', { fontSize: '12px' })
            const spark3 = this.add.text(100, 470, '✨', { fontSize: '12px' })
            specialElements.push(spark1, spark2, spark3)
            break
          case 3: // Bubbles
            const bubble1 = this.add.circle(85, 430, 4, 0x87CEEB, 0.5)
            const bubble2 = this.add.circle(110, 425, 3, 0x87CEEB, 0.5)
            const bubble3 = this.add.circle(105, 435, 5, 0x87CEEB, 0.5)
            bubble1.setStrokeStyle(1, 0x4682B4)
            bubble2.setStrokeStyle(1, 0x4682B4)
            bubble3.setStrokeStyle(1, 0x4682B4)
            specialElements.push(bubble1, bubble2, bubble3)
            break
          case 4: // Music notes
            const note1 = this.add.text(85, 430, '♪', { fontSize: '14px', color: '#000000' })
            const note2 = this.add.text(110, 435, '♫', { fontSize: '14px', color: '#000000' })
            specialElements.push(note1, note2)
            break
          case 5: // Snowflake
            const snow = this.add.text(100, 425, '❄️', { fontSize: '20px' })
            specialElements.push(snow)
            break
          case 6: // Flower crown
            const flower1 = this.add.text(90, 430, '🌸', { fontSize: '12px' })
            const flower2 = this.add.text(100, 428, '🌸', { fontSize: '12px' })
            const flower3 = this.add.text(110, 430, '🌸', { fontSize: '12px' })
            specialElements.push(flower1, flower2, flower3)
            break
          case 7: // Devil horns
            const horn1 = this.add.triangle(90, 430, 0, 0, -3, 10, 3, 10, 0xDC143C)
            const horn2 = this.add.triangle(110, 430, 0, 0, -3, 10, 3, 10, 0xDC143C)
            horn1.setStrokeStyle(1, 0x8B0000)
            horn2.setStrokeStyle(1, 0x8B0000)
            specialElements.push(horn1, horn2)
            break
          case 8: // Cat ears
            const ear1 = this.add.triangle(88, 430, 0, 0, -6, 12, 6, 12, 0x000000)
            const ear2 = this.add.triangle(112, 430, 0, 0, -6, 12, 6, 12, 0x000000)
            const earInner1 = this.add.triangle(88, 432, 0, 0, -3, 6, 3, 6, 0xFFC0CB)
            const earInner2 = this.add.triangle(112, 432, 0, 0, -3, 6, 3, 6, 0xFFC0CB)
            specialElements.push(ear1, ear2, earInner1, earInner2)
            break
          case 9: // Robot antenna
            const antenna1 = this.add.rectangle(92, 430, 2, 10, 0x808080)
            const antenna2 = this.add.rectangle(108, 430, 2, 10, 0x808080)
            const light1 = this.add.circle(92, 425, 3, 0x00FF00)
            const light2 = this.add.circle(108, 425, 3, 0xFF0000)
            specialElements.push(antenna1, antenna2, light1, light2)
            break
        }
      }
      
      this.player.setData('specialElements', specialElements)
    } else {
      // Bored face (default)
      leftEye = this.add.circle(90, 445, 3, 0x000000)
      rightEye = this.add.circle(110, 445, 3, 0x000000)
      mouth = this.add.rectangle(100, 460, 20, 2, 0x000000)
    }
    
    // Group face elements with player
    this.player.setData('faceElements', [leftEye, rightEye, mouth])
    this.player.setData('avatarType', equippedAvatar)
    
    // Create obstacles group
    this.obstacles = this.physics.add.group()
    
    // Create bullets group
    this.bullets = this.physics.add.group()
    
    // Create rage tables group
    this.rageTables = this.physics.add.group()

    // Set up collisions
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, undefined, this)
    this.physics.add.collider(this.bullets, this.obstacles, this.bulletHitObstacle, undefined, this)
    this.physics.add.collider(this.rageTables, this.obstacles, this.rageTableHitObstacle, undefined, this)

    // Create score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', color: '#ffffff' })
    
    // Create cooldown text
    this.cooldownText = this.add.text(16, 50, '', { fontSize: '18px', color: '#ffffff' })
    
    // Create rage table cooldown text if equipped
    if (this.hasRageTable) {
      this.rageTableCooldownText = this.add.text(16, 70, '', { fontSize: '16px', color: '#ff8800' })
    }
    
    // Create super jump cooldown text if equipped
    if (this.hasSuperJump) {
      this.superJumpCooldownText = this.add.text(16, 90, '', { fontSize: '16px', color: '#00ff88' })
    }
    
    // Create reviver cooldown text if equipped
    if (this.hasReviver) {
      this.reviverCooldownText = this.add.text(16, 110, '', { fontSize: '16px', color: '#ff00ff' })
    }
    
    // Create fireball cooldown text if equipped
    if (this.hasFireball) {
      this.fireballCooldownText = this.add.text(16, 130, '', { fontSize: '16px', color: '#ff6600' })
    }
    
    // Create double jump cooldown text if equipped
    if (this.hasDoubleJump) {
      this.doubleJumpCooldownText = this.add.text(16, 150, '', { fontSize: '16px', color: '#00ffff' })
    }
    
    // Create jump cooldown text (for non-moderators)
    if (!this.isModerator) {
      this.jumpCooldownText = this.add.text(16, 170, '', { fontSize: '16px', color: '#ffff00' })
    }
    
    // Create telekinesis text if equipped
    if (this.hasTelekinesis) {
      this.add.text(16, 190, 'Telekinesis ready! Press K', { fontSize: '16px', color: '#ff00ff' })
    }
    
    // Create coin display
    const coinIcon = this.add.circle(750, 30, 12, 0xffd700)
    coinIcon.setStrokeStyle(2, 0x000000)
    const coinLetter = this.add.text(750, 30, 'C', {
      fontSize: '14px',
      color: '#000000',
      fontStyle: 'bold'
    })
    coinLetter.setOrigin(0.5)
    this.coinText = this.add.text(730, 30, `${this.coinsEarned}/100`, {
      fontSize: '20px',
      color: '#ffd700'
    })
    this.coinText.setOrigin(1, 0.5)
    this.coinText.setStroke('#000000', 2)
    
    // Level progress display on the right side
    this.add.text(790, 200, 'STEREO\nMADNESS', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'right'
    }).setOrigin(1, 0.5)
    
    // Progress bar background
    const progressBg = this.add.graphics()
    progressBg.fillStyle(0x333333, 1)
    progressBg.fillRect(700, 240, 20, 200)
    
    // Progress bar fill (will update as score increases)
    const progressBar = this.add.graphics()
    progressBar.fillStyle(0x00ff00, 1)
    this.data.set('progressBar', progressBar)
    
    // Progress text
    this.levelProgressText = this.add.text(710, 460, '0%', {
      fontSize: '14px',
      color: '#ffffff'
    })
    this.levelProgressText.setOrigin(0.5, 0)
    
    // Goal text
    this.add.text(710, 480, 'Goal:\n10,000', {
      fontSize: '12px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5, 0)

    // Input handling
    this.input.on('pointerdown', this.jump, this)
    this.input.keyboard?.on('keydown-SPACE', this.jump, this)
    this.input.keyboard?.on('keydown-F', this.shoot, this)
    
    // Add R key for Rage Table if equipped
    if (this.hasRageTable) {
      this.input.keyboard?.on('keydown-R', this.useRageTable, this)
    }
    
    // Add Q key for Super Jump if equipped
    if (this.hasSuperJump) {
      this.input.keyboard?.on('keydown-Q', this.useSuperJump, this)
    }
    
    // Add E key for Kamehame haaa if equipped
    if (this.hasKamehameHaaa) {
      this.input.keyboard?.on('keydown-E', this.useKamehameHaaa, this)
    }
    
    // Add Y key for Reviver if equipped
    if (this.hasReviver) {
      this.input.keyboard?.on('keydown-Y', this.useReviver, this)
    }
    
    // Add T key for Fireball if equipped
    if (this.hasFireball) {
      this.input.keyboard?.on('keydown-T', this.useFireball, this)
    }
    
    // Add K key for Telekinesis if equipped
    if (this.hasTelekinesis) {
      this.input.keyboard?.on('keydown-K', this.useTelekinesis, this)
    }

    // Load custom level data if exists
    const customLevel = localStorage.getItem('level_stereoMadness')
    if (customLevel) {
      const levelData = JSON.parse(customLevel)
      this.loadCustomLevel(levelData)
    } else {
      // Default obstacle spawning
      this.time.addEvent({
        delay: 1500,
        callback: this.spawnObstacle,
        callbackScope: this,
        loop: true
      })
    }
    
    // Initialize multiplayer display
    this.createOtherPlayers()
    
    // Update other players positions every frame
    this.time.addEvent({
      delay: 100,
      callback: this.updateOtherPlayers,
      callbackScope: this,
      loop: true
    })
  }

  update() {
    // Always update face position, even when game is over
    const faceElements = this.player.getData('faceElements')
    const avatarType = this.player.getData('avatarType')
    if (faceElements) {
      const [leftEye, rightEye, mouth] = faceElements
      
      if (avatarType === 1) {
        // Happy face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 8
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 8
        
        // Redraw smile at new position
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.arc(this.player.x, this.player.y + 5, 15, 0, Math.PI, false)
          mouth.strokePath()
        }
      } else if (avatarType === 2) {
        // Mischievous cat face >:3 positions
        leftEye.x = this.player.x - 12
        leftEye.y = this.player.y - 8
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 8
      } else if (avatarType === 3) {
        // Rainbow throwing up face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 8
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 8
        mouth.x = this.player.x
        mouth.y = this.player.y + 8
      } else if (avatarType === 4) {
        // Roblox man face positions
        leftEye.x = this.player.x - 8
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 8
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 5
      } else if (avatarType === 5) {
        // Funny face positions
        const extraElements = this.player.getData('extraFaceElements')
        if (extraElements) {
          const [leftEyeWhite, rightEyeWhite, graphics] = extraElements
          
          // Update white part of eyes
          leftEyeWhite.x = this.player.x - 10
          leftEyeWhite.y = this.player.y - 5
          rightEyeWhite.x = this.player.x + 10
          rightEyeWhite.y = this.player.y - 5
          
          // Update pupils (derpy positions)
          leftEye.x = this.player.x - 10
          leftEye.y = this.player.y - 9 // Looking up
          rightEye.x = this.player.x + 14 // Looking right
          rightEye.y = this.player.y - 5
          
          // Redraw wavy mouth
          graphics.clear()
          graphics.lineStyle(3, 0x000000, 1)
          graphics.beginPath()
          graphics.moveTo(this.player.x - 15, this.player.y + 5)
          graphics.lineTo(this.player.x - 8, this.player.y + 12)
          graphics.lineTo(this.player.x, this.player.y + 3)
          graphics.lineTo(this.player.x + 8, this.player.y + 10)
          graphics.lineTo(this.player.x + 15, this.player.y + 8)
          graphics.strokePath()
          
          // Update tongue position
          mouth.x = this.player.x + 5
          mouth.y = this.player.y + 12
        }
      } else if (avatarType === 6) {
        // Serious face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 8
        
        // Update eyebrows
        const eyebrows = this.player.getData('eyebrows')
        if (eyebrows) {
          const [leftEyebrow, rightEyebrow] = eyebrows
          leftEyebrow.x = this.player.x - 10
          leftEyebrow.y = this.player.y - 12
          rightEyebrow.x = this.player.x + 10
          rightEyebrow.y = this.player.y - 12
        }
      } else if (avatarType === 7) {
        // Sigma face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        
        // Update sigma elements
        const sigmaElements = this.player.getData('sigmaElements')
        if (sigmaElements) {
          const [leftShade, rightShade, bridge, sigmaSymbol] = sigmaElements
          
          // Update sunglasses
          leftShade.x = this.player.x - 10
          leftShade.y = this.player.y - 5
          rightShade.x = this.player.x + 10
          rightShade.y = this.player.y - 5
          bridge.x = this.player.x
          bridge.y = this.player.y - 5
          
          // Update sigma symbol
          sigmaSymbol.x = this.player.x + 20
          sigmaSymbol.y = this.player.y - 15
          
          // Redraw smirk
          if (mouth && mouth.clear) {
            mouth.clear()
            mouth.lineStyle(3, 0x000000, 1)
            mouth.beginPath()
            mouth.moveTo(this.player.x - 8, this.player.y + 8)
            mouth.lineTo(this.player.x + 2, this.player.y + 10)
            mouth.lineTo(this.player.x + 12, this.player.y + 6)
            mouth.strokePath()
          }
        }
      } else if (avatarType === 8) {
        // Sad face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        
        // Update tears
        const tears = this.player.getData('tears')
        if (tears) {
          const [leftTear, rightTear] = tears
          leftTear.x = this.player.x - 10
          leftTear.y = this.player.y
          rightTear.x = this.player.x + 10
          rightTear.y = this.player.y
        }
        
        // Redraw frown
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(3, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(this.player.x - 12, this.player.y + 12)
          mouth.lineTo(this.player.x - 5, this.player.y + 8)
          mouth.lineTo(this.player.x + 5, this.player.y + 8)
          mouth.lineTo(this.player.x + 12, this.player.y + 12)
          mouth.strokePath()
        }
      } else if (avatarType === 9) {
        // Scared face positions
        const scaredElements = this.player.getData('scaredElements')
        if (scaredElements) {
          const [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow] = scaredElements
          
          leftEyeWhite.x = this.player.x - 10
          leftEyeWhite.y = this.player.y - 5
          leftEye.x = this.player.x - 10
          leftEye.y = this.player.y - 5
          
          rightEyeWhite.x = this.player.x + 10
          rightEyeWhite.y = this.player.y - 5
          rightEye.x = this.player.x + 10
          rightEye.y = this.player.y - 5
          
          leftBrow.x = this.player.x - 10
          leftBrow.y = this.player.y - 15
          rightBrow.x = this.player.x + 10
          rightBrow.y = this.player.y - 15
        }
        
        mouth.x = this.player.x
        mouth.y = this.player.y + 10
      } else if (avatarType === 10) {
        // Really happy face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        
        // Update happy elements
        const happyElements = this.player.getData('happyElements')
        if (happyElements) {
          const [leftCheek, rightCheek, sparkle1, sparkle2] = happyElements
          
          leftCheek.x = this.player.x - 20
          leftCheek.y = this.player.y
          rightCheek.x = this.player.x + 20
          rightCheek.y = this.player.y
          
          sparkle1.x = this.player.x - 25
          sparkle1.y = this.player.y - 15
          sparkle2.x = this.player.x + 20
          sparkle2.y = this.player.y - 15
        }
        
        // Redraw big smile
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(4, 0x000000, 1)
          mouth.beginPath()
          mouth.arc(this.player.x, this.player.y, 20, 0, Math.PI, false)
          mouth.strokePath()
        }
      } else if (avatarType === 11) {
        // Embarrassed face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        
        // Update embarrassed elements
        const embarrassedElements = this.player.getData('embarrassedElements')
        if (embarrassedElements) {
          const [sweatDrop, leftBlush, rightBlush] = embarrassedElements
          
          sweatDrop.x = this.player.x + 18
          sweatDrop.y = this.player.y - 12
          
          // Redraw blush marks
          leftBlush.clear()
          leftBlush.lineStyle(2, 0xFF1493, 0.8)
          leftBlush.moveTo(this.player.x - 20, this.player.y - 2)
          leftBlush.lineTo(this.player.x - 15, this.player.y)
          leftBlush.moveTo(this.player.x - 20, this.player.y + 2)
          leftBlush.lineTo(this.player.x - 15, this.player.y + 4)
          leftBlush.strokePath()
          
          rightBlush.clear()
          rightBlush.lineStyle(2, 0xFF1493, 0.8)
          rightBlush.moveTo(this.player.x + 15, this.player.y - 2)
          rightBlush.lineTo(this.player.x + 20, this.player.y)
          rightBlush.moveTo(this.player.x + 15, this.player.y + 2)
          rightBlush.lineTo(this.player.x + 20, this.player.y + 4)
          rightBlush.strokePath()
        }
        
        // Redraw nervous smile
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(this.player.x - 10, this.player.y + 8)
          mouth.lineTo(this.player.x - 3, this.player.y + 10)
          mouth.lineTo(this.player.x + 3, this.player.y + 8)
          mouth.lineTo(this.player.x + 10, this.player.y + 10)
          mouth.strokePath()
        }
      } else if (avatarType === 12) {
        // Really really bored face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 10
        
        // Update bags under eyes
        const boredElements = this.player.getData('boredElements')
        if (boredElements) {
          const [leftBag, rightBag] = boredElements
          
          leftBag.clear()
          leftBag.lineStyle(1, 0x666666, 0.8)
          leftBag.beginPath()
          leftBag.arc(this.player.x - 10, this.player.y - 1, 8, 0, Math.PI, false)
          leftBag.strokePath()
          
          rightBag.clear()
          rightBag.lineStyle(1, 0x666666, 0.8)
          rightBag.beginPath()
          rightBag.arc(this.player.x + 10, this.player.y - 1, 8, 0, Math.PI, false)
          rightBag.strokePath()
        }
      } else if (avatarType === 13) {
        // Depressed face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 2
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 2
        
        // Update frown
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.arc(this.player.x, this.player.y + 18, 12, Math.PI, 0, false)
          mouth.strokePath()
        }
        
        // Update tear
        const depressedElements = this.player.getData('depressedElements')
        if (depressedElements) {
          const [leftTear] = depressedElements
          leftTear.x = this.player.x - 10
          leftTear.y = this.player.y + 5
        }
      } else if (avatarType === 14) {
        // Surprised face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 10
        
        // Update surprised elements
        const surprisedElements = this.player.getData('surprisedElements')
        if (surprisedElements) {
          const [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow] = surprisedElements
          
          leftEyeWhite.x = this.player.x - 10
          leftEyeWhite.y = this.player.y - 5
          rightEyeWhite.x = this.player.x + 10
          rightEyeWhite.y = this.player.y - 5
          
          leftBrow.clear()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.beginPath()
          leftBrow.arc(this.player.x - 10, this.player.y - 15, 8, Math.PI, 0, false)
          leftBrow.strokePath()
          
          rightBrow.clear()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.beginPath()
          rightBrow.arc(this.player.x + 10, this.player.y - 15, 8, Math.PI, 0, false)
          rightBrow.strokePath()
        }
      } else if (avatarType === 15) {
        // WOW face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 10
        
        // Update sparkles
        const wowElements = this.player.getData('wowElements')
        if (wowElements) {
          const [sparkle1, sparkle2, sparkle3] = wowElements
          sparkle1.x = this.player.x - 25
          sparkle1.y = this.player.y - 20
          sparkle2.x = this.player.x + 25
          sparkle2.y = this.player.y - 20
          sparkle3.x = this.player.x
          sparkle3.y = this.player.y + 25
        }
      } else if (avatarType === 16) {
        // Silly face positions
        leftEye.x = this.player.x - 7
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 7
        rightEye.y = this.player.y - 5
        
        // Update silly elements
        const sillyElements = this.player.getData('sillyElements')
        if (sillyElements) {
          const [leftEyeWhite, rightEyeWhite, tongue, leftBrow, rightBrow, hatBase, propeller1, propeller2] = sillyElements
          
          leftEyeWhite.x = this.player.x - 10
          leftEyeWhite.y = this.player.y - 5
          rightEyeWhite.x = this.player.x + 10
          rightEyeWhite.y = this.player.y - 5
          
          tongue.x = this.player.x + 8
          tongue.y = this.player.y + 18
          
          // Redraw eyebrows
          leftBrow.clear()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.beginPath()
          leftBrow.arc(this.player.x - 10, this.player.y - 13, 8, Math.PI, 0, false)
          leftBrow.strokePath()
          
          rightBrow.clear()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.beginPath()
          rightBrow.arc(this.player.x + 10, this.player.y - 13, 8, Math.PI, 0, false)
          rightBrow.strokePath()
          
          // Update hat position
          hatBase.x = this.player.x
          hatBase.y = this.player.y - 28
          propeller1.x = this.player.x - 10
          propeller1.y = this.player.y - 32
          propeller2.x = this.player.x + 10
          propeller2.y = this.player.y - 32
          
          // Rotate propellers
          propeller1.rotation += 0.1
          propeller2.rotation -= 0.1
        }
        
        // Redraw silly grin
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(3, 0x000000, 1)
          mouth.beginPath()
          mouth.arc(this.player.x, this.player.y + 5, 15, 0, Math.PI, false)
          mouth.strokePath()
        }
      } else if (avatarType === 17) {
        // Easter Bunny face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 2
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 2
        mouth.x = this.player.x
        mouth.y = this.player.y + 12
        
        // Update bunny elements
        const bunnyElements = this.player.getData('bunnyElements')
        if (bunnyElements) {
          const [leftEar, leftEarInner, rightEar, rightEarInner, nose] = bunnyElements
          
          leftEar.x = this.player.x - 8
          leftEar.y = this.player.y - 22
          leftEarInner.x = this.player.x - 8
          leftEarInner.y = this.player.y - 22
          
          rightEar.x = this.player.x + 8
          rightEar.y = this.player.y - 22
          rightEarInner.x = this.player.x + 8
          rightEarInner.y = this.player.y - 22
          
          nose.x = this.player.x
          nose.y = this.player.y + 5
        }
      } else if (avatarType === 18) {
        // Mad face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 2
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 2
        
        // Update mad elements
        const madElements = this.player.getData('madElements')
        if (madElements) {
          const [leftBrow, rightBrow, steam1, steam2] = madElements
          
          leftBrow.clear()
          leftBrow.lineStyle(3, 0x000000, 1)
          leftBrow.moveTo(this.player.x - 15, this.player.y - 12)
          leftBrow.lineTo(this.player.x - 5, this.player.y - 7)
          leftBrow.strokePath()
          
          rightBrow.clear()
          rightBrow.lineStyle(3, 0x000000, 1)
          rightBrow.moveTo(this.player.x + 5, this.player.y - 7)
          rightBrow.lineTo(this.player.x + 15, this.player.y - 12)
          rightBrow.strokePath()
          
          steam1.x = this.player.x - 20
          steam1.y = this.player.y - 20
          steam2.x = this.player.x + 20
          steam2.y = this.player.y - 20
        }
        
        // Redraw angry mouth
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(this.player.x - 12, this.player.y + 12)
          mouth.lineTo(this.player.x - 5, this.player.y + 8)
          mouth.lineTo(this.player.x + 5, this.player.y + 8)
          mouth.lineTo(this.player.x + 12, this.player.y + 12)
          mouth.strokePath()
        }
      } else if (avatarType === 19) {
        // Scared face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 3
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 3
        
        // Update scared elements
        const scaredElements = this.player.getData('scaredElements')
        if (scaredElements) {
          const [leftEyeWhite, rightEyeWhite, leftBrow, rightBrow, shake1, shake2] = scaredElements
          
          leftEyeWhite.x = this.player.x - 10
          leftEyeWhite.y = this.player.y - 5
          rightEyeWhite.x = this.player.x + 10
          rightEyeWhite.y = this.player.y - 5
          
          leftBrow.clear()
          leftBrow.lineStyle(2, 0x000000, 1)
          leftBrow.moveTo(this.player.x - 15, this.player.y - 15)
          leftBrow.lineTo(this.player.x - 5, this.player.y - 12)
          leftBrow.strokePath()
          
          rightBrow.clear()
          rightBrow.lineStyle(2, 0x000000, 1)
          rightBrow.moveTo(this.player.x + 5, this.player.y - 12)
          rightBrow.lineTo(this.player.x + 15, this.player.y - 15)
          rightBrow.strokePath()
          
          shake1.clear()
          shake1.lineStyle(1, 0x666666, 0.5)
          shake1.moveTo(this.player.x - 25, this.player.y - 7)
          shake1.lineTo(this.player.x - 22, this.player.y - 7)
          shake1.moveTo(this.player.x - 25, this.player.y + 3)
          shake1.lineTo(this.player.x - 22, this.player.y + 3)
          shake1.strokePath()
          
          shake2.clear()
          shake2.lineStyle(1, 0x666666, 0.5)
          shake2.moveTo(this.player.x + 22, this.player.y - 7)
          shake2.lineTo(this.player.x + 25, this.player.y - 7)
          shake2.moveTo(this.player.x + 22, this.player.y + 3)
          shake2.lineTo(this.player.x + 25, this.player.y + 3)
          shake2.strokePath()
        }
        
        // Redraw wavy mouth
        if (mouth && mouth.clear) {
          mouth.clear()
          mouth.lineStyle(2, 0x000000, 1)
          mouth.beginPath()
          mouth.moveTo(this.player.x - 10, this.player.y + 10)
          mouth.lineTo(this.player.x - 5, this.player.y + 8)
          mouth.lineTo(this.player.x, this.player.y + 10)
          mouth.lineTo(this.player.x + 5, this.player.y + 8)
          mouth.lineTo(this.player.x + 10, this.player.y + 10)
          mouth.strokePath()
        }
      } else if (avatarType >= 20 && avatarType <= 49) {
        // Random faces 21-50 positions
        const faceType = avatarType - 20
        
        // Update eye positions based on type
        switch(faceType % 10) {
          case 0: // Dizzy face
          case 1: // Star eyes
          case 2: // Heart eyes
          case 3: // X eyes
          case 6: // Dollar eyes
          case 7: // Spiral eyes
          case 8: // Question eyes
          case 9: // Lightning eyes
            if (leftEye.x !== undefined) {
              leftEye.x = this.player.x - 10
              leftEye.y = this.player.y - 8
              rightEye.x = this.player.x + 10
              rightEye.y = this.player.y - 8
            }
            break
          case 4: // Winking
            if (leftEye.clear) {
              leftEye.clear()
              leftEye.lineStyle(2, 0x000000)
              leftEye.moveTo(this.player.x - 15, this.player.y - 8)
              leftEye.lineTo(this.player.x - 5, this.player.y - 8)
              leftEye.strokePath()
            }
            rightEye.x = this.player.x + 10
            rightEye.y = this.player.y - 8
            break
          case 5: // Cyclops
            leftEye.x = this.player.x
            leftEye.y = this.player.x - 8
            rightEye.x = this.player.x
            rightEye.y = this.player.y - 8
            break
        }
        
        // Update mouth position based on type
        if (mouth.clear) {
          mouth.clear()
          switch(faceType % 10) {
            case 0: // Dizzy mouth
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(this.player.x, this.player.y + 8, 10, 0.2, 2.94, false)
              mouth.strokePath()
              break
            case 2: // Heart eyes smile
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(this.player.x, this.player.y + 5, 12, 0, Math.PI, false)
              mouth.strokePath()
              break
            case 4: // Winking smile
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(this.player.x + 3, this.player.y + 5, 10, 0, Math.PI, false)
              mouth.strokePath()
              break
            case 5: // Cyclops mouth
              mouth.lineStyle(2, 0x000000)
              mouth.moveTo(this.player.x - 8, this.player.y + 10)
              mouth.lineTo(this.player.x + 8, this.player.y + 10)
              mouth.strokePath()
              break
            case 6: // Dollar smile
              mouth.lineStyle(3, 0x000000)
              mouth.beginPath()
              mouth.arc(this.player.x, this.player.y + 3, 15, 0, Math.PI, false)
              mouth.strokePath()
              break
            case 7: // Spiral mouth
              mouth.lineStyle(2, 0x000000)
              mouth.moveTo(this.player.x - 10, this.player.y + 10)
              mouth.lineTo(this.player.x - 5, this.player.y + 12)
              mouth.lineTo(this.player.x + 5, this.player.y + 12)
              mouth.lineTo(this.player.x + 10, this.player.y + 10)
              mouth.strokePath()
              break
            case 8: // Question mouth
              mouth.lineStyle(2, 0x000000)
              mouth.beginPath()
              mouth.arc(this.player.x, this.player.y + 15, 10, Math.PI, 0, false)
              mouth.strokePath()
              break
          }
        } else {
          // Rectangle and ellipse mouths
          mouth.x = this.player.x
          mouth.y = this.player.y + 10
        }
        
        // Update special elements
        const specialElements = this.player.getData('specialElements')
        if (specialElements) {
          specialElements.forEach((element: any, index: number) => {
            if (!element) return
            
            // Update accessory positions
            if (faceType >= 10 && faceType < 20) {
              switch(faceType % 10) {
                case 0: // Sunglasses
                  element.x = this.player.x
                  element.y = this.player.y - 8
                  break
                case 1: // Monocle
                  element.x = this.player.x + 10
                  element.y = this.player.y - 8
                  break
                case 2: // Mustache
                  if (element.clear) {
                    element.clear()
                    element.lineStyle(3, 0x000000)
                    element.beginPath()
                    element.arc(this.player.x - 5, this.player.y + 3, 8, 0, Math.PI, true)
                    element.arc(this.player.x + 5, this.player.y + 3, 8, 0, Math.PI, true)
                    element.strokePath()
                  }
                  break
                case 3: // Top hat
                  if (index === 0) {
                    element.x = this.player.x
                    element.y = this.player.y - 22
                  } else {
                    element.x = this.player.x
                    element.y = this.player.y - 28
                  }
                  break
                case 4: // Bow tie
                  if (index === 0) element.x = this.player.x - 8
                  else if (index === 1) element.x = this.player.x + 8
                  else element.x = this.player.x
                  element.y = this.player.y + 15
                  break
                case 5: // Crown
                  element.x = this.player.x
                  element.y = this.player.y - 25
                  break
                case 6: // Eye patch
                  if (index === 0) {
                    element.x = this.player.x - 10
                    element.y = this.player.y - 8
                  } else {
                    element.x = this.player.x - 5
                    element.y = this.player.y - 8
                  }
                  break
                case 7: // Headband
                  element.x = this.player.x
                  element.y = this.player.y - 18
                  break
                case 8: // Antenna
                  if (index === 0) {
                    element.x = this.player.x
                    element.y = this.player.y - 22
                  } else {
                    element.x = this.player.x
                    element.y = this.player.y - 30
                  }
                  break
                case 9: // Halo
                  element.x = this.player.x
                  element.y = this.player.y - 25
                  break
              }
            }
            
            // Update special effects for 40-49
            if (faceType >= 20) {
              switch(faceType % 10) {
                case 0: // Rainbow
                  if (element.clear) {
                    element.clear()
                    element.lineStyle(2, 0xFF0000)
                    element.arc(this.player.x, this.player.y, 20, 0, Math.PI, true)
                    element.lineStyle(2, 0xFF7F00)
                    element.arc(this.player.x, this.player.y + 2, 18, 0, Math.PI, true)
                    element.lineStyle(2, 0xFFFF00)
                    element.arc(this.player.x, this.player.y + 4, 16, 0, Math.PI, true)
                    element.strokePath()
                  }
                  break
                case 1: // Fire
                  if (index === 0) element.x = this.player.x - 15
                  else if (index === 1) element.x = this.player.x
                  else element.x = this.player.x + 15
                  element.y = this.player.y - 20
                  break
                case 2: // Sparkles
                  if (index === 0) {
                    element.x = this.player.x - 20
                    element.y = this.player.y - 20
                  } else if (index === 1) {
                    element.x = this.player.x + 15
                    element.y = this.player.y - 20
                  } else {
                    element.x = this.player.x
                    element.y = this.player.y + 20
                  }
                  break
                case 3: // Bubbles
                  if (index === 0) {
                    element.x = this.player.x - 15
                    element.y = this.player.y - 20
                  } else if (index === 1) {
                    element.x = this.player.x + 10
                    element.y = this.player.y - 25
                  } else {
                    element.x = this.player.x + 5
                    element.y = this.player.y - 15
                  }
                  break
                case 4: // Music notes
                  if (index === 0) {
                    element.x = this.player.x - 15
                    element.y = this.player.y - 20
                  } else {
                    element.x = this.player.x + 10
                    element.y = this.player.y - 15
                  }
                  break
                case 5: // Snowflake
                  element.x = this.player.x
                  element.y = this.player.y - 25
                  break
                case 6: // Flower crown
                  if (index === 0) {
                    element.x = this.player.x - 10
                    element.y = this.player.y - 20
                  } else if (index === 1) {
                    element.x = this.player.x
                    element.y = this.player.y - 22
                  } else {
                    element.x = this.player.x + 10
                    element.y = this.player.y - 20
                  }
                  break
                case 7: // Devil horns
                  if (index === 0) element.x = this.player.x - 10
                  else element.x = this.player.x + 10
                  element.y = this.player.y - 20
                  break
                case 8: // Cat ears
                  if (index === 0 || index === 2) element.x = this.player.x - 12
                  else element.x = this.player.x + 12
                  if (index < 2) element.y = this.player.y - 20
                  else element.y = this.player.y - 18
                  break
                case 9: // Robot antenna
                  if (index === 0 || index === 2) element.x = this.player.x - 8
                  else element.x = this.player.x + 8
                  if (index < 2) element.y = this.player.y - 20
                  else element.y = this.player.y - 25
                  break
              }
            }
          })
        }
      } else {
        // Bored face positions
        leftEye.x = this.player.x - 10
        leftEye.y = this.player.y - 5
        rightEye.x = this.player.x + 10
        rightEye.y = this.player.y - 5
        mouth.x = this.player.x
        mouth.y = this.player.y + 10
      }
    }
    
    if (this.gameOver) {
      return
    }

    // Update score
    this.score += 1
    this.scoreText.setText('Score: ' + this.score)
    
    // Update level progress
    const progressPercent = Math.min(100, Math.floor((this.score / 10000) * 100))
    const progressBar = this.data.get('progressBar') as Phaser.GameObjects.Graphics
    progressBar.clear()
    progressBar.fillStyle(progressPercent === 100 ? 0x00ff00 : 0xffaa00, 1)
    const barHeight = (progressPercent / 100) * 200
    progressBar.fillRect(700, 440 - barHeight, 20, barHeight)
    
    this.levelProgressText.setText(`${progressPercent}%`)
    
    // Check for level completion
    if (this.score >= 10000 && !this.levelCompleted) {
      this.levelCompleted = true
      this.completeLevel()
    }

    // Move obstacles
    this.obstacles.children.entries.forEach((obstacle: any) => {
      obstacle.x -= this.gameSpeed * 0.016 // 60fps normalized
      
      // Remove obstacles that are off screen
      if (obstacle.x < -50) {
        obstacle.destroy()
      }
    })

    // Check if player is on ground
    if (this.player.body!.touching.down) {
      this.isJumping = false
    }
    
    // Move bullets
    this.bullets.children.entries.forEach((bullet: any) => {
      bullet.x += 10 // Move bullets to the right
      
      // Remove bullets that are off screen
      if (bullet.x > 850) {
        bullet.destroy()
      }
    })
    
    // Update fireball ride
    if (this.isRidingFireball && this.fireballRide) {
      this.fireballRideTime++
      
      // Move player with fireball
      this.player.x = this.fireballRide.x
      this.player.y = this.fireballRide.y - 30 // Player rides on top
      
      // Camera follows the fireball
      this.cameras.main.centerOn(this.fireballRide.x, this.fireballRide.y)
      
      // After 2 seconds (120 frames at 60fps), drop the player
      if (this.fireballRideTime >= 120) {
        this.dropFromFireball()
      }
    }
  }

  private jump() {
    if (!this.gameOver) {
      const jumpPowerLevel = gameState.getJumpPowerLevel()
      const jumpVelocity = -500 * (1 + jumpPowerLevel * 0.15) // +15% per level
      
      // Check if player can jump (moderators have no cooldown)
      if (!this.canJump && !this.isModerator) {
        return // Regular players must wait for cooldown
      }
      
      // Regular jump from ground
      if (!this.isJumping || this.isModerator) {
        this.player.body!.setVelocityY(jumpVelocity)
        this.isJumping = true
        
        // Apply jump cooldown for non-moderators
        if (!this.isModerator) {
          this.canJump = false
          this.jumpCooldown = 1 // 1 second cooldown
          this.jumpCooldownText.setText(`Jump cooldown: ${this.jumpCooldown}s`)
          
          // Start cooldown timer
          const cooldownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
              this.jumpCooldown--
              if (this.jumpCooldown > 0) {
                this.jumpCooldownText.setText(`Jump cooldown: ${this.jumpCooldown}s`)
              } else {
                this.jumpCooldownText.setText('')
                this.canJump = true
                cooldownTimer.destroy()
              }
            },
            callbackScope: this,
            loop: true
          })
        }
        
        // Award coin for every jump (with rebirth multiplier)
        if (this.coinsEarned < 100) {
          const coinMultiplier = gameState.getCoinMultiplier()
          this.coinsEarned = Math.min(this.coinsEarned + coinMultiplier, 100) // Apply multiplier but cap at 100
          this.coinText.setText(`${this.coinsEarned}/100`)
        }
        
        // Reset double jump when jumping from ground
        if (this.player.body!.touching.down) {
          this.doubleJumpUsed = false
        }
      }
      // Double jump in air
      else if (this.hasDoubleJump && !this.doubleJumpUsed && this.canDoubleJump && this.isJumping) {
        this.player.body!.setVelocityY(jumpVelocity * 0.9) // Slightly weaker than first jump
        this.doubleJumpUsed = true
        
        // Visual effect for double jump
        const jumpEffect = this.add.circle(this.player.x, this.player.y + 20, 20, 0x00ffff, 0.6)
        this.tweens.add({
          targets: jumpEffect,
          scale: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => jumpEffect.destroy()
        })
        
        // Start cooldown
        this.canDoubleJump = false
        this.doubleJumpCooldown = 10
        this.doubleJumpCooldownText.setText(`Double Jump cooldown: ${this.doubleJumpCooldown}s`)
        
        // Cooldown timer
        const cooldownTimer = this.time.addEvent({
          delay: 1000,
          callback: () => {
            this.doubleJumpCooldown--
            if (this.doubleJumpCooldown > 0) {
              this.doubleJumpCooldownText.setText(`Double Jump cooldown: ${this.doubleJumpCooldown}s`)
            } else {
              this.doubleJumpCooldownText.setText('')
              this.canDoubleJump = true
              cooldownTimer.destroy()
            }
          },
          callbackScope: this,
          loop: true
        })
      }
    }
  }

  private spawnObstacle() {
    if (this.gameOver) return

    // Increment spike counter
    this.spikeCounter++
    
    // After every 2 spikes, spawn a block with spike on top
    if (this.spikeCounter % 3 === 0) {
      // Create block with spike on top
      const spikeHeight = 80  // Match regular spike height
      const blockHeight = 60
      const totalHeight = blockHeight + spikeHeight

      // Create the block (smooth rectangle)
      const block = this.add.rectangle(
        850,
        540 - blockHeight/2, // Position at ground level
        80, // width
        blockHeight,
        0x666666 // gray color
      )
      block.setStrokeStyle(3, 0x000000)
      this.obstacles.add(block)

      // Create spike on top of block - aligned with regular spikes
      const spike = this.add.triangle(
        850,
        500,  // Match regular spike height - center at y=500
        0, 0, // Top point
        -20, spikeHeight, // Bottom left
        20, spikeHeight, // Bottom right
        0xff0000
      )
      spike.setStrokeStyle(3, 0x000000)  // Match regular spike outline
      this.obstacles.add(spike)
      
      // Disable gravity for both
      const blockBody = block.body as Phaser.Physics.Arcade.Body
      blockBody.setAllowGravity(false)
      
      const spikeBody = spike.body as Phaser.Physics.Arcade.Body
      spikeBody.setAllowGravity(false)
      
      // Set hitbox for block
      blockBody.setSize(80, blockHeight)
      
      // Set smaller hitbox for spike on block
      spikeBody.setSize(30, spikeHeight * 0.8)
      spikeBody.setOffset(5, spikeHeight * 0.1)
    } else {
      // Regular spike
      const type = { width: 40, height: 80, y: 460 }

      // Create spike as a triangle
      const spike = this.add.triangle(
        850,
        500,  // Center the spike at y=500 (bottom at 540, which is ground level)
        0, 0,                    // Top point
        -type.width/2, type.height,  // Bottom left
        type.width/2, type.height,   // Bottom right
        0xff0000
      )
      spike.setStrokeStyle(3, 0x000000) // Black outline
      this.obstacles.add(spike)
      
      // Disable gravity for obstacles so they don't fall
      const obstacleBody = spike.body as Phaser.Physics.Arcade.Body
      obstacleBody.setAllowGravity(false)
      
      // Make hitbox smaller based on spike size
      if (type.height >= 80) {
        // Large spike - much smaller hitbox
        obstacleBody.setSize(type.width * 0.6, type.height * 0.7)
        obstacleBody.setOffset(type.width * 0.2, type.height * 0.15)
      } else if (type.height >= 50) {
        // Medium spike - moderately smaller hitbox
        obstacleBody.setSize(type.width * 0.7, type.height * 0.8)
        obstacleBody.setOffset(type.width * 0.15, type.height * 0.1)
      } else {
        // Small spike - slightly smaller hitbox
        obstacleBody.setSize(type.width * 0.8, type.height * 0.85)
        obstacleBody.setOffset(type.width * 0.1, type.height * 0.075)
      }
    }
  }

  private hitObstacle() {
    // Prevent multiple calls
    if (this.gameOver) return
    
    // Check if player has reviver shield
    if (this.player.getData('hasShield')) {
      // Remove shield
      const shield = this.player.getData('shield')
      const shieldUpdate = this.player.getData('shieldUpdate')
      if (shield) shield.destroy()
      if (shieldUpdate) shieldUpdate.remove()
      
      this.player.setData('hasShield', false)
      this.player.setData('shield', null)
      this.player.setData('shieldUpdate', null)
      
      // Show revived text
      const revivedText = this.add.text(this.player.x, this.player.y - 50, 'REVIVED!', {
        fontSize: '24px',
        color: '#00ff00'
      })
      revivedText.setOrigin(0.5)
      revivedText.setStroke('#000000', 3)
      
      this.tweens.add({
        targets: revivedText,
        y: revivedText.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => revivedText.destroy()
      })
      
      // Create immunity effect
      this.tweens.add({
        targets: this.player,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 10,
        onComplete: () => {
          this.player.alpha = 1
        }
      })
      
      // Deactivate reviver
      this.reviverActive = false
      
      return // Don't end the game
    }
    
    this.gameOver = true
    this.player.body!.setVelocity(0)
    
    // Update high score
    gameState.updateHighScore(this.score)
    
    // Clean up other players
    this.otherPlayers.forEach(otherPlayer => {
      if (otherPlayer.sprite) otherPlayer.sprite.destroy()
      if (otherPlayer.nameText) otherPlayer.nameText.destroy()
      if (otherPlayer.scoreText) otherPlayer.scoreText.destroy()
      if (otherPlayer.faceElements) {
        otherPlayer.faceElements.forEach((element: any) => {
          if (element && element.destroy) element.destroy()
        })
      }
    })
    this.otherPlayers = []
    
    // Show game over text
    const gameOverText = this.add.text(400, 250, 'Game Over!', {
      fontSize: '48px',
      color: '#ff0000'
    })
    gameOverText.setOrigin(0.5)
    
    // Show coins earned and update total (only once)
    if (this.coinsEarned > 0 && !this.coinsAdded) {
      this.coinsAdded = true
      gameState.addCoins(this.coinsEarned) // Add coins through the game state manager
      totalCoins = gameState.getCoins() // Update local reference
    }
    
    const coinsEarnedText = this.add.text(400, 190, `Coins Earned: ${this.coinsEarned}`, {
      fontSize: '24px',
      color: '#ffd700'
    })
    coinsEarnedText.setOrigin(0.5)
    coinsEarnedText.setStroke('#000000', 2)

    const restartText = this.add.text(400, 320, 'Click to Restart', {
      fontSize: '24px',
      color: '#ffffff'
    })
    restartText.setOrigin(0.5)
    
    // Create Leave button
    const leaveButton = this.add.rectangle(400, 380, 120, 40, 0x444444)
    leaveButton.setStrokeStyle(2, 0xffffff)
    leaveButton.setInteractive()
    leaveButton.setDepth(100) // Ensure button is on top
    
    const leaveText = this.add.text(400, 380, 'Leave', {
      fontSize: '20px',
      color: '#ffffff'
    })
    leaveText.setOrigin(0.5)
    leaveText.setDepth(101) // Ensure text is on top
    
    // Leave button click
    leaveButton.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
      if (event) event.stopPropagation()
      this.scene.start('HomeScene')
    })
    
    // Hover effects for Leave button
    leaveButton.on('pointerover', () => {
      leaveButton.setFillStyle(0x666666)
    })
    
    leaveButton.on('pointerout', () => {
      leaveButton.setFillStyle(0x444444)
    })

    // Make restart text clickable
    restartText.setInteractive()
    restartText.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
      if (event) event.stopPropagation()
      this.scene.restart()
    })
    
    // Add hover effect to restart text
    restartText.on('pointerover', () => {
      restartText.setColor('#ffff00')
    })
    
    restartText.on('pointerout', () => {
      restartText.setColor('#ffffff')
    })
  }
  
  private shoot() {
    if (!this.canShoot || this.gameOver) return
    
    // Create bullet
    const bullet = this.add.circle(this.player.x + 30, this.player.y, 5, 0x00ffff)
    bullet.setStrokeStyle(2, 0x000000)
    this.bullets.add(bullet)
    
    // Disable gravity for bullet
    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body
    bulletBody.setAllowGravity(false)
    
    // Set cooldown
    this.canShoot = false
    let cooldownTime = 20
    this.cooldownText.setText(`Bullet cooldown: ${cooldownTime}s`)
    
    // Cooldown timer
    const cooldownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        cooldownTime--
        if (cooldownTime > 0) {
          this.cooldownText.setText(`Bullet cooldown: ${cooldownTime}s`)
        } else {
          this.cooldownText.setText('')
          this.canShoot = true
          cooldownTimer.destroy()
        }
      },
      callbackScope: this,
      loop: true
    })
  }
  
  private bulletHitObstacle(bullet: any, obstacle: any) {
    bullet.destroy()
    obstacle.destroy()
  }
  
  private useRageTable() {
    if (!this.canUseRageTable || this.gameOver) return
    
    // Zoom out camera
    const camera = this.cameras.main
    camera.zoomTo(0.8, 500)
    
    // Create brown table
    const table = this.add.rectangle(this.player.x + 50, this.player.y - 20, 60, 40, 0x8B4513)
    table.setStrokeStyle(3, 0x000000)
    this.rageTables.add(table)
    
    // Disable gravity for table
    const tableBody = table.body as Phaser.Physics.Arcade.Body
    tableBody.setAllowGravity(false)
    tableBody.setVelocityX(800) // Fast speed
    
    // Set cooldown
    this.canUseRageTable = false
    this.rageTableCooldown = 20
    this.rageTableCooldownText.setText(`Rage Table cooldown: ${this.rageTableCooldown}s`)
    
    // Cooldown timer
    const cooldownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.rageTableCooldown--
        if (this.rageTableCooldown > 0) {
          this.rageTableCooldownText.setText(`Rage Table cooldown: ${this.rageTableCooldown}s`)
        } else {
          this.rageTableCooldownText.setText('')
          this.canUseRageTable = true
          camera.zoomTo(1, 500) // Zoom back in
          cooldownTimer.destroy()
        }
      },
      callbackScope: this,
      loop: true
    })
  }
  
  private rageTableHitObstacle(table: any, obstacle: any) {
    // Find the next obstacle too
    const obstacles = this.obstacles.getChildren() as any[]
    const obstacleX = obstacle.x
    
    // Destroy hit obstacle
    obstacle.destroy()
    
    // Find and destroy the next closest obstacle
    let nextObstacle = null
    let minDistance = Infinity
    
    for (const obs of obstacles) {
      if (obs.active && obs.x > obstacleX) {
        const distance = obs.x - obstacleX
        if (distance < minDistance) {
          minDistance = distance
          nextObstacle = obs
        }
      }
    }
    
    if (nextObstacle) {
      nextObstacle.destroy()
    }
    
    // Destroy the table after hitting
    table.destroy()
  }
  
  private useSuperJump() {
    if (this.isJumping || this.gameOver || this.isSuperJumping || !this.canUseSuperJump) return
    
    // Start super jump
    this.isSuperJumping = true
    this.superJumpStartX = this.player.x
    
    // Zoom out camera a lot
    const camera = this.cameras.main
    camera.zoomTo(0.5, 500)
    
    // Super high jump
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    const jumpPowerLevel = gameState.getJumpPowerLevel()
    const superJumpVelocity = -800 * (1 + jumpPowerLevel * 0.15) // +15% per level
    playerBody.setVelocityY(superJumpVelocity)
    this.isJumping = true
    
    // Check for landing
    const landingCheck = this.time.addEvent({
      delay: 50,
      callback: () => {
        if (playerBody.velocity.y >= 0 && this.player.y >= 450) {
          // Player is landing
          this.clearSpikesAtLanding()
          
          // Zoom camera back in
          camera.zoomTo(1, 500)
          
          this.isSuperJumping = false
          landingCheck.destroy()
          
          // Start cooldown
          this.canUseSuperJump = false
          this.superJumpCooldown = 30
          this.superJumpCooldownText.setText(`Super Jump cooldown: ${this.superJumpCooldown}s`)
          
          // Cooldown timer
          const cooldownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
              this.superJumpCooldown--
              if (this.superJumpCooldown > 0) {
                this.superJumpCooldownText.setText(`Super Jump cooldown: ${this.superJumpCooldown}s`)
              } else {
                this.superJumpCooldownText.setText('')
                this.canUseSuperJump = true
                cooldownTimer.destroy()
              }
            },
            callbackScope: this,
            loop: true
          })
        }
      },
      callbackScope: this,
      loop: true
    })
  }
  
  private clearSpikesAtLanding() {
    // Calculate approximate landing position
    const landingX = this.player.x + 100 // Estimate based on forward movement
    
    // Find and destroy 2 spikes near landing position
    const obstacles = this.obstacles.getChildren() as any[]
    const nearbyObstacles = obstacles
      .filter(obs => obs.active && Math.abs(obs.x - landingX) < 100)
      .sort((a, b) => Math.abs(a.x - landingX) - Math.abs(b.x - landingX))
    
    // Destroy up to 2 closest spikes
    for (let i = 0; i < Math.min(2, nearbyObstacles.length); i++) {
      nearbyObstacles[i].destroy()
    }
  }
  
  private useKamehameHaaa() {
    if (this.gameOver || this.isUsingKamehameHaaa) return
    
    this.isUsingKamehameHaaa = true
    this.originalY = this.player.y
    
    // Zoom out camera
    const camera = this.cameras.main
    camera.zoomTo(0.6, 1000)
    
    // Create glowing effect
    const glowEffect = this.add.circle(this.player.x, this.player.y, 40, 0x00ffff, 0.5)
    this.tweens.add({
      targets: glowEffect,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => glowEffect.destroy()
    })
    
    // Create stairs animation
    this.kamehameStairs = []
    const stairCount = 20
    const stairWidth = 30
    const stairHeight = 15
    
    // Build stairs going up
    for (let i = 0; i < stairCount; i++) {
      const stair = this.add.rectangle(
        this.player.x + (i * stairWidth),
        this.player.y - (i * stairHeight),
        stairWidth,
        5,
        0x8B4513
      )
      stair.setStrokeStyle(1, 0x000000)
      this.kamehameStairs.push(stair)
    }
    
    // Animate player walking up stairs
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setAllowGravity(false)
    
    // Move player up the stairs
    this.tweens.add({
      targets: this.player,
      x: this.player.x + (stairCount * stairWidth),
      y: this.player.y - (stairCount * stairHeight),
      duration: 3000,
      ease: 'Linear',
      onUpdate: () => {
        // Double the score progress while on stairs
        this.score += 2
        this.scoreText.setText('Score: ' + this.score)
      },
      onComplete: () => {
        // Drop down and clear spikes
        playerBody.setAllowGravity(true)
        playerBody.setVelocityY(300)
        
        // Clear stairs
        this.kamehameStairs.forEach(stair => stair.destroy())
        
        // Clear exactly 3 spikes below
        const dropX = this.player.x
        const obstacles = this.obstacles.getChildren() as any[]
        
        // Find the 3 closest spikes
        const nearbySpikes = obstacles
          .filter(obs => obs.active && obs.x > dropX - 50) // Only spikes ahead
          .sort((a, b) => a.x - b.x) // Sort by distance
          .slice(0, 3) // Take first 3
        
        // Destroy the 3 spikes with effect
        nearbySpikes.forEach(spike => {
          // Create destruction effect
          const destroyEffect = this.add.circle(spike.x, spike.y, 20, 0xffff00, 0.8)
          this.tweens.add({
            targets: destroyEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => destroyEffect.destroy()
          })
          spike.destroy()
        })
        
        // Wait for landing and zoom back in
        this.time.delayedCall(1000, () => {
          this.isUsingKamehameHaaa = false
          camera.zoomTo(1, 1000) // Zoom back to normal
        })
      }
    })
  }
  
  private useReviver() {
    if (this.gameOver || !this.canUseReviver || this.reviverActive) return
    
    // Activate reviver
    this.reviverActive = true
    this.canUseReviver = false
    this.reviverCooldown = 40
    
    // Create visual effect
    const shield = this.add.circle(this.player.x, this.player.y, 40, 0xff00ff, 0.3)
    shield.setStrokeStyle(3, 0xff00ff)
    
    // Follow player
    const updateShield = () => {
      if (shield && this.player) {
        shield.x = this.player.x
        shield.y = this.player.y
      }
    }
    
    // Update shield position every frame
    const shieldUpdate = this.time.addEvent({
      delay: 16,
      callback: updateShield,
      loop: true
    })
    
    // Show activation text
    const activateText = this.add.text(this.player.x, this.player.y - 50, 'REVIVER ACTIVE!', {
      fontSize: '20px',
      color: '#ff00ff'
    })
    activateText.setOrigin(0.5)
    activateText.setStroke('#000000', 3)
    
    this.tweens.add({
      targets: activateText,
      y: activateText.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => activateText.destroy()
    })
    
    // Start cooldown timer
    const cooldownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.reviverCooldown--
        if (this.reviverCooldownText) {
          if (this.reviverCooldown > 0) {
            this.reviverCooldownText.setText(`Reviver cooldown: ${this.reviverCooldown}s`)
          } else {
            this.reviverCooldownText.setText('')
            this.canUseReviver = true
          }
        }
      },
      repeat: 39
    })
    
    // Reviver stays active until used (player dies once)
    // The shield visual will be removed when the player dies and gets revived
    this.player.setData('hasShield', true)
    this.player.setData('shield', shield)
    this.player.setData('shieldUpdate', shieldUpdate)
  }
  
  private useFireball() {
    if (!this.canUseFireball || this.gameOver || this.isRidingFireball) return
    
    // Create fireball beneath player
    const fireball = this.add.graphics()
    fireball.x = this.player.x
    fireball.y = this.player.y + 40
    
    // Draw large fireball
    fireball.fillStyle(0xff6600, 1)
    fireball.fillCircle(0, 0, 25)
    fireball.fillStyle(0xffff00, 1)
    fireball.fillCircle(0, 0, 18)
    fireball.fillStyle(0xff0000, 1)
    fireball.fillCircle(0, 0, 10)
    
    // Add flame particles effect
    const particles = this.add.graphics()
    particles.x = fireball.x
    particles.y = fireball.y
    
    // Animate flame particles
    this.tweens.add({
      targets: particles,
      y: particles.y - 50,
      alpha: 0,
      duration: 1000,
      repeat: -1,
      onRepeat: () => {
        particles.clear()
        particles.fillStyle(0xff6600, 0.6)
        for (let i = 0; i < 5; i++) {
          particles.fillCircle(
            Phaser.Math.Between(-15, 15),
            Phaser.Math.Between(-5, 5),
            Phaser.Math.Between(3, 6)
          )
        }
      }
    })
    
    // Start riding the fireball
    this.isRidingFireball = true
    this.fireballRide = fireball
    this.fireballRideTime = 0
    this.player.body!.setVelocity(0, 0) // Stop player movement
    this.player.body!.setAllowGravity(false) // Disable gravity while riding
    
    // Move fireball forward
    this.tweens.add({
      targets: fireball,
      x: fireball.x + 300, // Move forward
      y: fireball.y - 100, // Move up slightly
      duration: 2000,
      ease: 'Sine.easeInOut'
    })
    
    // Move particles with fireball
    this.tweens.add({
      targets: particles,
      x: particles.x + 300,
      duration: 2000,
      ease: 'Sine.easeInOut'
    })
    
    // Store particles reference
    fireball.setData('particles', particles)
    
    // Show riding text
    const rideText = this.add.text(this.player.x, this.player.y - 70, 'RIDING FIREBALL!', {
      fontSize: '20px',
      color: '#ff6600'
    })
    rideText.setOrigin(0.5)
    rideText.setStroke('#000000', 3)
    
    this.tweens.add({
      targets: rideText,
      alpha: 0,
      duration: 2000,
      onComplete: () => rideText.destroy()
    })
    
    // Set cooldown
    this.canUseFireball = false
    this.fireballCooldown = 30
    this.fireballCooldownText.setText(`Fireball cooldown: ${this.fireballCooldown}s`)
    
    // Cooldown timer
    const cooldownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fireballCooldown--
        if (this.fireballCooldown > 0) {
          this.fireballCooldownText.setText(`Fireball cooldown: ${this.fireballCooldown}s`)
        } else {
          this.fireballCooldownText.setText('')
          this.canUseFireball = true
          cooldownTimer.destroy()
        }
      },
      callbackScope: this,
      loop: true
    })
  }
  
  private useTelekinesis() {
    if (this.telekinesisActive || this.gameOver) return
    
    // Get all visible obstacles (spikes)
    const obstacles = this.obstacles.getChildren() as any[]
    const visibleSpikes = obstacles.filter(obs => 
      obs.active && 
      obs.x > this.player.x - 100 && 
      obs.x < this.player.x + 800 &&
      obs.type === Phaser.GameObjects.Triangle // Only spikes, not blocks
    )
    
    if (visibleSpikes.length === 0) return
    
    // Activate telekinesis
    this.telekinesisActive = true
    this.floatingSpikes = []
    
    // Show activation effect
    const telekinesisEffect = this.add.graphics()
    telekinesisEffect.x = this.player.x
    telekinesisEffect.y = this.player.y
    
    // Draw psychic wave effect
    telekinesisEffect.lineStyle(3, 0x9932cc, 0.8) // Purple color
    telekinesisEffect.strokeCircle(0, 0, 50)
    
    // Expand the psychic wave
    this.tweens.add({
      targets: telekinesisEffect,
      scaleX: 10,
      scaleY: 10,
      alpha: 0,
      duration: 1000,
      onComplete: () => telekinesisEffect.destroy()
    })
    
    // Show "TELEKINESIS!" text
    const tkText = this.add.text(this.player.x, this.player.y - 80, 'TELEKINESIS!', { 
      fontSize: '36px', 
      color: '#9932cc',
      fontStyle: 'bold'
    })
    tkText.setOrigin(0.5)
    tkText.setStroke('#ffffff', 4)
    
    this.tweens.add({
      targets: tkText,
      y: tkText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => tkText.destroy()
    })
    
    // Make spikes float up one by one
    let delay = 0
    visibleSpikes.forEach((spike, index) => {
      // Add purple glow to spike
      const glow = this.add.graphics()
      glow.x = spike.x
      glow.y = spike.y
      glow.fillStyle(0x9932cc, 0.3)
      glow.fillCircle(0, 0, 30)
      
      // Pulse effect on glow
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.8 },
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1
      })
      
      // Make spike float up after delay
      this.time.delayedCall(delay, () => {
        // Store original position
        spike.setData('originalY', spike.y)
        spike.setData('glow', glow)
        
        // Float the spike up
        this.tweens.add({
          targets: spike,
          y: spike.y - 200,
          duration: 1000,
          ease: 'Sine.easeInOut'
        })
        
        // Move glow with spike
        this.tweens.add({
          targets: glow,
          y: glow.y - 200,
          duration: 1000,
          ease: 'Sine.easeInOut'
        })
        
        this.floatingSpikes.push(spike)
      })
      
      delay += 200 // 200ms delay between each spike
    })
    
    // End telekinesis when reaching the last spike
    const checkEndTelekinesis = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.floatingSpikes.length > 0) {
          const lastSpike = this.floatingSpikes[this.floatingSpikes.length - 1]
          
          // Check if player has passed the last floating spike
          if (this.player.x > lastSpike.x + 50) {
            // Drop all spikes back down
            this.floatingSpikes.forEach(spike => {
              const glow = spike.getData('glow')
              const originalY = spike.getData('originalY')
              
              // Drop spike back down
              this.tweens.add({
                targets: spike,
                y: originalY,
                duration: 500,
                ease: 'Bounce.easeOut'
              })
              
              // Fade out and destroy glow
              this.tweens.add({
                targets: glow,
                alpha: 0,
                duration: 500,
                onComplete: () => glow.destroy()
              })
            })
            
            // Reset state
            this.floatingSpikes = []
            this.telekinesisActive = false
            checkEndTelekinesis.destroy()
            
            // Show completion message
            const completeText = this.add.text(this.player.x, this.player.y - 60, 'Telekinesis Complete!', { 
              fontSize: '24px', 
              color: '#9932cc',
              fontStyle: 'bold'
            })
            completeText.setOrigin(0.5)
            
            this.tweens.add({
              targets: completeText,
              y: completeText.y - 30,
              alpha: 0,
              duration: 1500,
              onComplete: () => completeText.destroy()
            })
          }
        }
      },
      callbackScope: this,
      loop: true
    })
  }
  
  private dropFromFireball() {
    if (!this.isRidingFireball || !this.fireballRide) return
    
    // Show "TOO HOT!" text
    const hotText = this.add.text(this.player.x, this.player.y - 50, 'TOO HOT!', {
      fontSize: '24px',
      color: '#ff0000'
    })
    hotText.setOrigin(0.5)
    hotText.setStroke('#000000', 3)
    
    this.tweens.add({
      targets: hotText,
      y: hotText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => hotText.destroy()
    })
    
    // Re-enable gravity for player
    this.player.body!.setAllowGravity(true)
    this.isRidingFireball = false
    
    // Make fireball explode
    const explosion = this.add.circle(this.fireballRide.x, this.fireballRide.y, 40, 0xff6600, 0.8)
    explosion.setStrokeStyle(4, 0xffff00)
    
    this.tweens.add({
      targets: explosion,
      scale: 3,
      alpha: 0,
      duration: 500,
      onComplete: () => explosion.destroy()
    })
    
    // Destroy fireball and particles
    const particles = this.fireballRide.getData('particles')
    if (particles) particles.destroy()
    this.fireballRide.destroy()
    this.fireballRide = null
    
    // Reset camera
    this.cameras.main.stopFollow()
    this.cameras.main.centerOn(400, 300)
    
    // Find and destroy the next 2 spikes below the player
    const playerX = this.player.x
    const obstacles = this.obstacles.getChildren() as any[]
    let spikesDestroyed = 0
    
    // Sort obstacles by distance from player
    obstacles.sort((a: any, b: any) => {
      const distA = Math.abs(a.x - playerX)
      const distB = Math.abs(b.x - playerX)
      return distA - distB
    })
    
    // Destroy the 2 closest spikes
    for (let i = 0; i < obstacles.length && spikesDestroyed < 2; i++) {
      const obstacle = obstacles[i]
      // Check if obstacle is ahead of player and close enough
      if (obstacle.x > playerX - 50 && obstacle.x < playerX + 150) {
        // Create small explosion for each spike
        const spikeExplosion = this.add.circle(obstacle.x, obstacle.y, 20, 0xffff00, 0.6)
        this.tweens.add({
          targets: spikeExplosion,
          scale: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => spikeExplosion.destroy()
        })
        
        obstacle.destroy()
        spikesDestroyed++
      }
    }
  }
  
  private completeLevel() {
    // Save level progress
    gameState.updateLevelProgress(this.currentLevel, this.score)
    
    // Stop spawning obstacles
    this.time.removeAllEvents()
    
    // Show completion message
    const completionBg = this.add.rectangle(400, 300, 600, 400, 0x000000, 0.8)
    
    const completionText = this.add.text(400, 200, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#00ff00'
    })
    completionText.setOrigin(0.5)
    completionText.setStroke('#000000', 4)
    
    // Show stars animation
    const stars = []
    for (let i = 0; i < 5; i++) {
      const star = this.add.text(300 + i * 50, 260, '⭐', {
        fontSize: '36px'
      })
      star.setAlpha(0)
      stars.push(star)
      
      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1.2,
        duration: 300,
        delay: i * 200,
        yoyo: true,
        repeat: 0
      })
    }
    
    // Show score
    const scoreText = this.add.text(400, 320, `Score: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff'
    })
    scoreText.setOrigin(0.5)
    
    // Bonus coins for completion
    const bonusCoins = 500
    const bonusText = this.add.text(400, 360, `Bonus Coins: +${bonusCoins}`, {
      fontSize: '24px',
      color: '#ffd700'
    })
    bonusText.setOrigin(0.5)
    gameState.addCoins(bonusCoins)
    
    // Continue button
    const continueButton = this.add.rectangle(400, 430, 200, 50, 0x00ff00)
    continueButton.setStrokeStyle(3, 0x000000)
    continueButton.setInteractive()
    
    const continueText = this.add.text(400, 430, 'Continue', {
      fontSize: '24px',
      color: '#000000'
    })
    continueText.setOrigin(0.5)
    
    continueButton.on('pointerover', () => {
      continueButton.setFillStyle(0x00dd00)
    })
    
    continueButton.on('pointerout', () => {
      continueButton.setFillStyle(0x00ff00)
    })
    
    continueButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene')
    })
  }
  
  private loadCustomLevel(levelData: any[]) {
    // Create all obstacles from level data
    levelData.forEach(obj => {
      let obstacle: any

      switch (obj.type) {
        case 'spike':
          obstacle = this.add.triangle(obj.x, obj.y, 0, -20, -20, 20, 20, 20, 0xff0000)
          obstacle.setStrokeStyle(2, 0x000000)
          break
        case 'block':
          obstacle = this.add.rectangle(obj.x, obj.y, 40, 40, 0x666666)
          obstacle.setStrokeStyle(2, 0x000000)
          break
        case 'stairs':
          // Create stair blocks as separate obstacles
          const stair1 = this.add.rectangle(obj.x + 20, obj.y + 20, 40, 40, 0x888888)
          stair1.setStrokeStyle(2, 0x000000)
          this.obstacles.add(stair1)
          // Disable gravity for stair1
          const stair1Body = stair1.body as Phaser.Physics.Arcade.Body
          if (stair1Body) stair1Body.setAllowGravity(false)

          const stair2 = this.add.rectangle(obj.x + 60, obj.y - 20, 40, 80, 0x888888)
          stair2.setStrokeStyle(2, 0x000000)
          this.obstacles.add(stair2)
          // Disable gravity for stair2
          const stair2Body = stair2.body as Phaser.Physics.Arcade.Body
          if (stair2Body) stair2Body.setAllowGravity(false)

          const stair3 = this.add.rectangle(obj.x + 100, obj.y - 60, 40, 120, 0x888888)
          stair3.setStrokeStyle(2, 0x000000)
          this.obstacles.add(stair3)
          // Disable gravity for stair3
          const stair3Body = stair3.body as Phaser.Physics.Arcade.Body
          if (stair3Body) stair3Body.setAllowGravity(false)
          return // Don't add to obstacles again
        case 'platform':
          obstacle = this.add.rectangle(obj.x + 60, obj.y, 120, 20, 0x4444ff)
          obstacle.setStrokeStyle(2, 0x000000)
          break
        default:
          return
      }

      if (obstacle) {
        this.obstacles.add(obstacle)
        // Disable gravity for all obstacles so they don't fall
        const obstacleBody = obstacle.body as Phaser.Physics.Arcade.Body
        if (obstacleBody) obstacleBody.setAllowGravity(false)
      }
    })
  }
  
  private createOtherPlayers() {
    // Get fake players from moderator panel data
    const fakePlayersData = [
      { name: 'CoolGamer42', avatar: '😎', avatarType: 1, x: 100, jumping: false },
      { name: 'ProPlayer99', avatar: '🎮', avatarType: 3, x: 200, jumping: true },
      { name: 'TheBoss', avatar: '👑', avatarType: 10, x: 300, jumping: false },
      { name: 'NinjaKid', avatar: '🥷', avatarType: 9, x: -50, jumping: false },
      { name: 'MasterJumper', avatar: '🦘', avatarType: 7, x: 150, jumping: true }
    ]
    
    // Create ghost players
    fakePlayersData.forEach((playerData, index) => {
      // Create ghost player (semi-transparent)
      const ghostPlayer = this.add.rectangle(
        playerData.x,
        510,
        40,
        40,
        0x00ff00,
        0.3 // Semi-transparent
      )
      ghostPlayer.setStrokeStyle(2, 0x00ff00, 0.5)
      
      // Add face to ghost player based on avatar type
      let ghostFace: any[] = []
      const x = playerData.x
      const y = 510
      
      switch(playerData.avatarType) {
        case 1: // Happy face
          const happyLeftEye = this.add.circle(x - 10, y - 8, 3, 0x000000, 0.5)
          const happyRightEye = this.add.circle(x + 10, y - 8, 3, 0x000000, 0.5)
          const happyMouth = this.add.graphics()
          happyMouth.lineStyle(2, 0x000000, 0.5)
          happyMouth.beginPath()
          happyMouth.arc(x, y + 5, 10, 0, Math.PI, false)
          happyMouth.strokePath()
          ghostFace = [happyLeftEye, happyRightEye, happyMouth]
          break
        case 3: // Cool face
          const coolLeftEye = this.add.rectangle(x - 10, y - 8, 12, 3, 0x000000, 0.5)
          const coolRightEye = this.add.rectangle(x + 10, y - 8, 12, 3, 0x000000, 0.5)
          const coolMouth = this.add.rectangle(x, y + 8, 15, 2, 0x000000, 0.5)
          ghostFace = [coolLeftEye, coolRightEye, coolMouth]
          break
        default:
          // Default face
          const leftEye = this.add.circle(x - 10, y - 8, 3, 0x000000, 0.5)
          const rightEye = this.add.circle(x + 10, y - 8, 3, 0x000000, 0.5)
          const mouth = this.add.rectangle(x, y + 8, 20, 3, 0x000000, 0.5)
          ghostFace = [leftEye, rightEye, mouth]
      }
      
      // Add player name above ghost
      const nameText = this.add.text(
        playerData.x,
        470,
        `${playerData.avatar} ${playerData.name}`,
        {
          fontSize: '12px',
          color: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 }
        }
      )
      nameText.setOrigin(0.5)
      nameText.setAlpha(0.7)
      
      // Store references
      this.otherPlayers.push({
        sprite: ghostPlayer,
        nameText: nameText,
        data: playerData,
        jumpProgress: 0,
        score: Math.floor(Math.random() * 1000),
        faceElements: ghostFace
      })
    })
  }
  
  private updateOtherPlayers() {
    if (this.gameOver) return
    
    this.otherPlayers.forEach((otherPlayer) => {
      // Simulate other players moving forward
      const moveSpeed = 2 + Math.random() * 3
      otherPlayer.sprite.x += moveSpeed
      otherPlayer.nameText.x = otherPlayer.sprite.x
      
      // Update face elements positions
      if (otherPlayer.faceElements && otherPlayer.faceElements.length > 0) {
        const x = otherPlayer.sprite.x
        const y = otherPlayer.sprite.y
        
        switch(otherPlayer.data.avatarType) {
          case 1: // Happy face
            if (otherPlayer.faceElements[0]) {
              otherPlayer.faceElements[0].x = x - 10 // left eye
              otherPlayer.faceElements[0].y = y - 8
            }
            if (otherPlayer.faceElements[1]) {
              otherPlayer.faceElements[1].x = x + 10 // right eye
              otherPlayer.faceElements[1].y = y - 8
            }
            if (otherPlayer.faceElements[2] && otherPlayer.faceElements[2].clear) {
              // Redraw smile
              otherPlayer.faceElements[2].clear()
              otherPlayer.faceElements[2].lineStyle(2, 0x000000, 0.5)
              otherPlayer.faceElements[2].beginPath()
              otherPlayer.faceElements[2].arc(x, y + 5, 10, 0, Math.PI, false)
              otherPlayer.faceElements[2].strokePath()
            }
            break
          case 3: // Cool face
            if (otherPlayer.faceElements[0]) {
              otherPlayer.faceElements[0].x = x - 10
              otherPlayer.faceElements[0].y = y - 8
            }
            if (otherPlayer.faceElements[1]) {
              otherPlayer.faceElements[1].x = x + 10
              otherPlayer.faceElements[1].y = y - 8
            }
            if (otherPlayer.faceElements[2]) {
              otherPlayer.faceElements[2].x = x
              otherPlayer.faceElements[2].y = y + 8
            }
            break
          default:
            // Default face update
            if (otherPlayer.faceElements[0]) {
              otherPlayer.faceElements[0].x = x - 10
              otherPlayer.faceElements[0].y = y - 8
            }
            if (otherPlayer.faceElements[1]) {
              otherPlayer.faceElements[1].x = x + 10
              otherPlayer.faceElements[1].y = y - 8
            }
            if (otherPlayer.faceElements[2]) {
              otherPlayer.faceElements[2].x = x
              otherPlayer.faceElements[2].y = y + 8
            }
        }
      }
      
      // Random jumping behavior
      if (Math.random() < 0.02 && otherPlayer.jumpProgress === 0) {
        otherPlayer.jumpProgress = 1
      }
      
      // Handle jump animation
      if (otherPlayer.jumpProgress > 0) {
        if (otherPlayer.jumpProgress < 30) {
          otherPlayer.sprite.y -= 6
        } else if (otherPlayer.jumpProgress < 60) {
          otherPlayer.sprite.y += 6
        } else {
          otherPlayer.jumpProgress = 0
          otherPlayer.sprite.y = 510
        }
        otherPlayer.jumpProgress++
        otherPlayer.nameText.y = otherPlayer.sprite.y - 40
      }
      
      // Update score
      otherPlayer.score += Math.floor(Math.random() * 3)
      
      // If player goes off screen, respawn them
      if (otherPlayer.sprite.x > this.cameras.main.scrollX + 850) {
        otherPlayer.sprite.x = this.cameras.main.scrollX - 50
        otherPlayer.nameText.x = otherPlayer.sprite.x
        otherPlayer.score = Math.floor(Math.random() * 1000)
      }
      
      // Add small score display
      if (!otherPlayer.scoreText) {
        otherPlayer.scoreText = this.add.text(
          otherPlayer.sprite.x,
          otherPlayer.sprite.y - 55,
          `${otherPlayer.score}`,
          {
            fontSize: '10px',
            color: '#ffff00'
          }
        )
        otherPlayer.scoreText.setOrigin(0.5)
        otherPlayer.scoreText.setAlpha(0.6)
      } else {
        otherPlayer.scoreText.x = otherPlayer.sprite.x
        otherPlayer.scoreText.y = otherPlayer.nameText.y - 15
        otherPlayer.scoreText.setText(`${otherPlayer.score}`)
      }
    })
  }
}

onMounted(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    scene: [HomeScene, AvatarScene, UpgradesScene, RebirthScene, LevelSelectScene, LevelEditorScene, PowersScene, MainScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1000 },
        debug: false
      }
    },
    backgroundColor: '#2d2d2d'
  }

  game = new Phaser.Game(config)
  
  // Developer console commands (only accessible via browser console)
  ;(window as any).setModerator = (status: boolean) => {
    if (status) {
      localStorage.setItem('isModerator', 'true')
      console.log('✅ Moderator status GRANTED')
    } else {
      localStorage.removeItem('isModerator')
      console.log('❌ Moderator status REMOVED')
    }
    console.log('Refresh the page for changes to take effect')
  }
  
  // Special command for Rylan only
  ;(window as any).setRylan = () => {
    localStorage.setItem('isRylan', 'true')
    localStorage.setItem('isModerator', 'true')
    console.log('👑 Welcome Rylan! You have EXCLUSIVE admin access!')
    console.log('Refresh the page to activate')
  }
  
  console.log('🎮 Geometry Dash Developer Console')
  console.log('For Rylan: setRylan()')
  console.log('For others: setModerator(true/false)')
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
  min-height: 100vh;
  background: #1a202c;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: #4a5568;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.back-button:hover {
  background: #2d3748;
  transform: translateY(-2px);
}

#phaser-game {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>