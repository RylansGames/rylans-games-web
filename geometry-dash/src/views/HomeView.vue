<script setup lang="ts">
import GameGrid from '../components/GameGrid.vue'
import CoinDisplay from '../components/shared/CoinDisplay.vue'
</script>

<template>
  <main>
    <CoinDisplay />
    <GameGrid />
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  background: #1a202c;
}
</style>
