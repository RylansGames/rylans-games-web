<script setup lang="ts">
import { RouterView } from 'vue-router'
import ModeratorPanel from './components/ModeratorPanel.vue'
</script>

<template>
  <RouterView />
  <ModeratorPanel />
</template>

<style scoped>
/* Minimal styles since our pages handle their own styling */
</style>
