<template>
  <div></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { PlayerTracker } from './PlayerTracker'

const activeEffects = ref<string[]>([])
let checkInterval: number | null = null

// Inject keyframe styles once
const styleEl = document.createElement('style')
styleEl.textContent = `
@keyframes admin-shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-8px, -6px); }
  20% { transform: translate(8px, 6px); }
  30% { transform: translate(-6px, 4px); }
  40% { transform: translate(6px, -4px); }
  50% { transform: translate(-4px, 8px); }
  60% { transform: translate(4px, -8px); }
  70% { transform: translate(-8px, 4px); }
  80% { transform: translate(8px, -6px); }
  90% { transform: translate(-4px, 6px); }
}
@keyframes admin-rainbow {
  0% { filter: hue-rotate(0deg) saturate(2); }
  25% { filter: hue-rotate(90deg) saturate(2); }
  50% { filter: hue-rotate(180deg) saturate(2); }
  75% { filter: hue-rotate(270deg) saturate(2); }
  100% { filter: hue-rotate(360deg) saturate(2); }
}
`
document.head.appendChild(styleEl)

const applyEffects = () => {
  const body = document.body
  const transforms: string[] = []
  let animation = ''
  let filter = ''

  if (activeEffects.value.includes('upside_down')) {
    transforms.push('rotate(180deg)')
  }

  if (activeEffects.value.includes('screen_shake')) {
    animation = 'admin-shake 0.15s infinite'
  }

  if (activeEffects.value.includes('rainbow')) {
    if (animation) {
      animation += ', admin-rainbow 2s linear infinite'
    } else {
      animation = 'admin-rainbow 2s linear infinite'
    }
  }

  body.style.transform = transforms.length ? transforms.join(' ') : ''
  body.style.animation = animation
  body.style.transformOrigin = 'center center'

  // Need overflow hidden when upside down so you don't see weird scroll
  if (activeEffects.value.includes('upside_down')) {
    body.style.overflow = 'hidden'
  } else {
    body.style.overflow = ''
  }
}

const checkEffects = () => {
  const effects = PlayerTracker.checkForAbuseEffects()
  const changed = JSON.stringify(effects) !== JSON.stringify(activeEffects.value)
  if (changed) {
    activeEffects.value = effects
    applyEffects()
  }
}

onMounted(() => {
  checkEffects()
  checkInterval = setInterval(checkEffects, 300)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  // Clean up body styles
  document.body.style.transform = ''
  document.body.style.animation = ''
  document.body.style.overflow = ''
  document.body.style.transformOrigin = ''
  // Remove style element
  if (styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl)
  }
})
</script>
