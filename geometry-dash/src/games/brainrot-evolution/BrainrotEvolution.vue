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
  playerX: number
  playerY: number
  coinsCollected: number
  evolutionsFound: number
  hasMetTungTung: boolean
}

const defaultGameData: GameData = {
  playerX: 400,
  playerY: 300,
  coinsCollected: 0,
  evolutionsFound: 0,
  hasMetTungTung: false
}

class MainScene extends Phaser.Scene {
  private gameData!: GameData
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private ground!: Phaser.Physics.Arcade.StaticGroup
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private tungTungNPC!: Phaser.GameObjects.Container
  private collectibles!: Phaser.Physics.Arcade.Group
  private infoText!: Phaser.GameObjects.Text
  private titleText!: Phaser.GameObjects.Text
  private worldWidth = 3000
  private worldHeight = 600
  private spaceKey!: Phaser.Input.Keyboard.Key

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
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)

    // Background gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a0033, 0x1a0033, 0x330066, 0x4400ff, 1)
    bg.fillRect(0, 0, this.worldWidth, this.worldHeight)
    bg.setScrollFactor(0.5) // Parallax effect

    // Add stars/particles in background
    this.createStarfield()

    // Title (fixed to camera)
    this.titleText = this.add.text(400, 30, '🧠 BRAINROT EVOLUTION WORLD 🧠', {
      fontSize: '32px',
      color: '#ff00ff',
      fontStyle: 'bold'
    })
    this.titleText.setOrigin(0.5)
    this.titleText.setScrollFactor(0)
    this.titleText.setStroke('#000000', 4)
    this.titleText.setDepth(1000)

    // Info text (fixed to camera)
    this.infoText = this.add.text(400, 70, 'Use WASD or Arrow Keys to move! Explore the world!', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.infoText.setOrigin(0.5)
    this.infoText.setScrollFactor(0)
    this.infoText.setDepth(1000)

    // Create ground
    this.ground = this.physics.add.staticGroup()
    for (let x = 0; x < this.worldWidth; x += 100) {
      const groundPiece = this.add.rectangle(x + 50, 570, 100, 60, 0x00ff00)
      groundPiece.setStrokeStyle(3, 0x00cc00)
      this.ground.add(groundPiece)
    }

    // Create floating platforms
    this.platforms = this.physics.add.staticGroup()
    this.createPlatforms()

    // Create player
    this.createPlayer()

    // Create tung tung tung tung sahur NPC
    this.createTungTungNPC()

    // Create collectibles (brainrot coins)
    this.createCollectibles()

    // Camera follow player
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // Input controls
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Collisions
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.player, this.platforms)

    // Collectible overlaps
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, undefined, this)

    // Save progress every 5 seconds
    this.time.addEvent({
      delay: 5000,
      callback: this.saveProgress,
      callbackScope: this,
      loop: true
    })
  }

  private createStarfield() {
    // Create random stars in the background
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.worldWidth
      const y = Math.random() * 400
      const size = Math.random() * 3 + 1
      const star = this.add.circle(x, y, size, 0xffffff, 0.8)
      star.setScrollFactor(0.3)

      // Twinkling animation
      this.tweens.add({
        targets: star,
        alpha: { from: 0.3, to: 1 },
        duration: Math.random() * 2000 + 1000,
        yoyo: true,
        repeat: -1
      })
    }
  }

  private createPlayer() {
    // Create player sprite
    this.player = this.physics.add.sprite(this.gameData.playerX, this.gameData.playerY, 'player')

    // Draw player (since we don't have sprites loaded)
    const graphics = this.add.graphics()

    // Player body (square with face)
    graphics.fillStyle(0xff00ff, 1)
    graphics.fillRect(-20, -20, 40, 40)
    graphics.lineStyle(3, 0x000000)
    graphics.strokeRect(-20, -20, 40, 40)

    // Eyes
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(-10, -8, 5)
    graphics.fillCircle(10, -8, 5)
    graphics.fillStyle(0x000000, 1)
    graphics.fillCircle(-10, -8, 3)
    graphics.fillCircle(10, -8, 3)

    // Smile
    graphics.lineStyle(2, 0x000000)
    graphics.beginPath()
    graphics.arc(0, 5, 10, 0, Math.PI, false)
    graphics.strokePath()

    graphics.generateTexture('player', 40, 40)
    graphics.destroy()

    // Reset player sprite with new texture
    this.player.setTexture('player')
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.2)
    this.player.setGravityY(500)
    this.player.setDepth(100)
  }

  private createPlatforms() {
    // Create various platforms throughout the world
    const platformData = [
      { x: 300, y: 450, width: 150, height: 20 },
      { x: 600, y: 400, width: 200, height: 20 },
      { x: 900, y: 350, width: 150, height: 20 },
      { x: 1200, y: 300, width: 180, height: 20 },
      { x: 1500, y: 400, width: 200, height: 20 },
      { x: 1800, y: 350, width: 150, height: 20 },
      { x: 2100, y: 300, width: 200, height: 20 },
      { x: 2400, y: 400, width: 180, height: 20 },
      { x: 2700, y: 350, width: 150, height: 20 }
    ]

    platformData.forEach(p => {
      const platform = this.add.rectangle(p.x, p.y, p.width, p.height, 0x9f7aea)
      platform.setStrokeStyle(3, 0x7c3aed)
      this.platforms.add(platform)
    })
  }

  private createTungTungNPC() {
    // Create the tung tung tung tung sahur NPC at a specific location
    const npcX = 1500
    const npcY = 300

    this.tungTungNPC = this.add.container(npcX, npcY)
    this.tungTungNPC.setData('canInteract', false)

    // NPC body
    const body = this.add.circle(0, 0, 40, 0x00ffff)
    body.setStrokeStyle(4, 0x000000)

    // Eyes
    const leftEye = this.add.circle(-15, -10, 6, 0xffffff)
    leftEye.setStrokeStyle(2, 0x000000)
    const leftPupil = this.add.circle(-15, -10, 3, 0x000000)

    const rightEye = this.add.circle(15, -10, 6, 0xffffff)
    rightEye.setStrokeStyle(2, 0x000000)
    const rightPupil = this.add.circle(15, -10, 3, 0x000000)

    // Mouth
    const mouth = this.add.graphics()
    mouth.lineStyle(3, 0x000000)
    mouth.beginPath()
    mouth.arc(0, 10, 15, 0, Math.PI, false)
    mouth.strokePath()

    // Name label
    const nameLabel = this.add.text(0, 60, 'tung tung tung\ntung sahur', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    })
    nameLabel.setOrigin(0.5)

    // Exclamation mark (appears when player is near)
    const exclamation = this.add.text(0, -60, '!', {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    exclamation.setOrigin(0.5)
    exclamation.setVisible(false)

    this.tungTungNPC.add([body, leftEye, leftPupil, rightEye, rightPupil, mouth, nameLabel, exclamation])
    this.tungTungNPC.setData('exclamation', exclamation)

    // Bouncing animation
    this.tweens.add({
      targets: this.tungTungNPC,
      y: npcY - 20,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Slight rotation
    this.tweens.add({
      targets: this.tungTungNPC,
      angle: { from: -5, to: 5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createCollectibles() {
    this.collectibles = this.physics.add.group()

    // Place collectible brainrot coins around the world
    const coinPositions = [
      { x: 300, y: 400 },
      { x: 600, y: 350 },
      { x: 900, y: 300 },
      { x: 1200, y: 250 },
      { x: 1800, y: 300 },
      { x: 2100, y: 250 },
      { x: 2400, y: 350 },
      { x: 2700, y: 300 },
      { x: 500, y: 500 },
      { x: 1000, y: 500 },
      { x: 1500, y: 500 },
      { x: 2000, y: 500 },
      { x: 2500, y: 500 }
    ]

    coinPositions.forEach(pos => {
      // Create brainrot coin (brain emoji style)
      const coin = this.add.circle(pos.x, pos.y, 15, 0xffd700)
      coin.setStrokeStyle(3, 0xff00ff)
      this.collectibles.add(coin)

      // Make it physics-enabled but not affected by gravity
      const coinBody = coin.body as Phaser.Physics.Arcade.Body
      coinBody.setAllowGravity(false)

      // Floating animation
      this.tweens.add({
        targets: coin,
        y: pos.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // Rotation
      this.tweens.add({
        targets: coin,
        angle: 360,
        duration: 2000,
        repeat: -1
      })
    })
  }

  private collectItem(player: any, item: any) {
    // Collect the brainrot coin
    item.destroy()
    this.gameData.coinsCollected++
    gameState.addCoins(10)

    // Show floating text
    const floatingText = this.add.text(item.x, item.y, '+10 coins!', {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    })
    floatingText.setOrigin(0.5)
    floatingText.setStroke('#000000', 3)

    this.tweens.add({
      targets: floatingText,
      y: item.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => floatingText.destroy()
    })

    // Play collection sound effect (visual feedback)
    this.cameras.main.shake(100, 0.002)
  }

  private saveProgress() {
    this.gameData.playerX = this.player.x
    this.gameData.playerY = this.player.y
    localStorage.setItem('brainrotEvolution', JSON.stringify(this.gameData))
  }

  update() {
    if (!this.player) return

    // Movement controls
    const speed = 200
    const jumpPower = -400

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.setVelocityX(-speed)
      this.player.setFlipX(true)
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(speed)
      this.player.setFlipX(false)
    } else {
      this.player.setVelocityX(0)
    }

    // Jump
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    if ((this.cursors.up.isDown || this.wasd.up.isDown) && playerBody.touching.down) {
      this.player.setVelocityY(jumpPower)
    }

    // Update title with coins collected
    this.titleText.setText(`🧠 BRAINROT WORLD 🧠 | Coins: ${this.gameData.coinsCollected}`)

    // Check NPC proximity
    this.checkNPCProximity()
  }

  private checkNPCProximity() {
    if (!this.player || !this.tungTungNPC) return

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.tungTungNPC.x,
      this.tungTungNPC.y
    )

    const exclamation = this.tungTungNPC.getData('exclamation')

    if (distance < 150) {
      // Player is near - show exclamation
      exclamation.setVisible(true)
      this.tungTungNPC.setData('canInteract', true)

      // Show interaction prompt
      this.infoText.setText('Press SPACE to talk to tung tung tung tung sahur!')

      // Check for space bar press
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.interactWithTungTung()
      }
    } else {
      // Too far away
      exclamation.setVisible(false)
      this.tungTungNPC.setData('canInteract', false)
      if (!this.gameData.hasMetTungTung) {
        this.infoText.setText('Use WASD or Arrow Keys to move! Explore the world!')
      }
    }
  }

  private interactWithTungTung() {
    if (this.gameData.hasMetTungTung) {
      // Already talked, show different message
      this.showDialogue('tung tung tung tung sahur:', '"Hello again friend!\nKeep exploring the brainrot world!"', false)
      return
    }

    this.gameData.hasMetTungTung = true
    this.gameData.evolutionsFound++

    // Give coins
    gameState.addCoins(100)

    // Show dialogue
    this.showDialogue('tung tung tung tung sahur:', '"Welcome to the Brainrot World!\nYou found me! Here, take 100 coins!"', true)
  }

  private showDialogue(speaker: string, message: string, firstTime: boolean) {
    // Create dialogue box
    const dialogue = this.add.container(400, 300)
    dialogue.setScrollFactor(0)
    dialogue.setDepth(2000)

    const dialogueBg = this.add.rectangle(0, 0, 600, 200, 0x000000, 0.9)
    dialogueBg.setStrokeStyle(4, 0x00ffff)

    const dialogueText = this.add.text(0, -40, speaker, {
      fontSize: '20px',
      color: '#00ffff',
      fontStyle: 'bold'
    })
    dialogueText.setOrigin(0.5)

    const messageText = this.add.text(0, 20, message, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    })
    messageText.setOrigin(0.5)

    const continueText = this.add.text(0, 70, 'Press SPACE to continue', {
      fontSize: '14px',
      color: '#ffff00'
    })
    continueText.setOrigin(0.5)

    dialogue.add([dialogueBg, dialogueText, messageText, continueText])

    // Blinking continue text
    this.tweens.add({
      targets: continueText,
      alpha: { from: 0.3, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    })

    // Wait for space to close
    const closeDialogue = () => {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        dialogue.destroy()
        this.input.keyboard!.off('keydown-SPACE', closeDialogue)
        if (firstTime) {
          this.infoText.setText('Great job! Keep collecting coins!')
        }
      }
    }

    this.input.keyboard!.on('keydown-SPACE', closeDialogue)
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
          gravity: { y: 800 },
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
