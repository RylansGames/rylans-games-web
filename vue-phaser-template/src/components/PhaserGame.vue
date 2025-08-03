<template>
  <div ref="gameContainer" id="phaser-game"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'

const gameContainer = ref<HTMLDivElement>()
let game: Phaser.Game | null = null

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // Load assets here
  }

  create() {
    // Create game objects here
    const text = this.add.text(400, 300, 'Hello Phaser + Vue!', {
      fontSize: '32px',
      color: '#ffffff'
    })
    text.setOrigin(0.5, 0.5)
  }

  update() {
    // Update game logic here
  }
}

onMounted(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    scene: [MainScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
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
#phaser-game {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>