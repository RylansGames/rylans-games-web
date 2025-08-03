<script setup lang="ts">
import PhaserGame from '../components/PhaserGame.vue'
</script>

<template>
  <main>
    <h1>Vue + Phaser Template</h1>
    <PhaserGame />
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

h1 {
  color: #42b883;
  margin-bottom: 20px;
}
</style>
