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
      this.scene.start('MainScene')
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
    const startY = 350
    
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
    const rebirthCount = 0 // TODO: Track rebirth count in GameState
    const currentCoins = gameState.getCoins()
    const currentMultiplier = 1 + (rebirthCount * 0.5)
    const nextMultiplier = 1 + ((rebirthCount + 1) * 0.5)
    
    // Coin requirement for first rebirth
    const requiredCoins = rebirthCount === 0 ? 150000 : 0 // 150k for first rebirth
    const canRebirth = currentCoins >= requiredCoins
    
    const infoText = this.add.text(400, 420, [
      `Current Rebirths: ${rebirthCount} ⭐`,
      `Current Coin Multiplier: x${currentMultiplier}`,
      `After Rebirth: x${nextMultiplier}`,
      '',
      rebirthCount === 0 ? `Required Coins: ${requiredCoins.toLocaleString()} 💰` : '',
      rebirthCount === 0 ? `Your Coins: ${currentCoins.toLocaleString()} 💰` : ''
    ], {
      fontSize: '18px',
      color: canRebirth ? '#00ff00' : '#ff6666',
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
    
    const rebirthButtonText = this.add.text(400, 500, canRebirth ? 'REBIRTH NOW' : 'NOT ENOUGH COINS', {
      fontSize: canRebirth ? '24px' : '18px',
      color: canRebirth ? '#ffffff' : '#999999'
    })
    rebirthButtonText.setOrigin(0.5)
    
    // Show current coins on the button when not enough
    if (!canRebirth) {
      const coinsOnButton = this.add.text(400, 480, `Your Coins: ${currentCoins.toLocaleString()}`, {
        fontSize: '14px',
        color: '#ffff00'
      })
      coinsOnButton.setOrigin(0.5)
      coinsOnButton.setStroke('#000000', 2)
    }
    
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
        // TODO: Implement rebirth logic
        const confirmText = this.add.text(400, 300, 'Rebirth coming soon!', {
          fontSize: '36px',
          color: '#ff00ff'
        })
        confirmText.setOrigin(0.5)
        confirmText.setStroke('#000000', 3)
        
        this.tweens.add({
          targets: confirmText,
          alpha: 0,
          duration: 2000,
          onComplete: () => confirmText.destroy()
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
      }
      
      const textColor = (i === 0 || i === 1 || i === 2 || i === 3 || i === 4) ? '#ffffff' : '#666666'
      const slotNumber = this.add.text(x, y, slotText, {
        fontSize: fontSize,
        color: textColor,
        align: 'center'
      })
      slotNumber.setOrigin(0.5)
      
      // Add "Equipped" text for first slot
      if (i === 0) {
        const equippedText = this.add.text(x, y + 20, 'Equipped', {
          fontSize: '10px',
          color: '#00ff00'
        })
        equippedText.setOrigin(0.5)
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
        
        if (powerId === 1 || powerId === 2 || powerId === 3 || powerId === 4) { // Rage Table, Super Jump, Kamehame haaa, or Reviver
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
  private hasReviver = false
  private canUseReviver = true
  private reviverCooldown = 0
  private reviverActive = false
  private reviverCooldownText!: Phaser.GameObjects.Text

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

    // Start spawning obstacles
    this.time.addEvent({
      delay: 1500,
      callback: this.spawnObstacle,
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
  }

  private jump() {
    if (!this.isJumping && !this.gameOver) {
      const jumpPowerLevel = gameState.getJumpPowerLevel()
      const jumpVelocity = -500 * (1 + jumpPowerLevel * 0.15) // +15% per level
      this.player.body!.setVelocityY(jumpVelocity)
      this.isJumping = true
      
      // Award coin for every jump
      if (this.coinsEarned < 100) {
        this.coinsEarned = Math.min(this.coinsEarned + 1, 100) // Ensure it never exceeds 100
        this.coinText.setText(`${this.coinsEarned}/100`)
      }
    }
  }

  private spawnObstacle() {
    if (this.gameOver) return

    // Only big spikes now
    const type = { width: 40, height: 80, y: 460 }
    
    // Create spike as a triangle
    const spike = this.add.triangle(
      850, 
      type.y + type.height/2,  // Position at bottom of spike
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
}

onMounted(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    scene: [HomeScene, AvatarScene, UpgradesScene, RebirthScene, PowersScene, MainScene],
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