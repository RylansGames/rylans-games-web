<template>
  <div class="chat-panel" :class="{ collapsed: isCollapsed }">
    <div class="chat-header" @click="isCollapsed = !isCollapsed">
      <span class="chat-title">CHAT</span>
      <span class="online-count">{{ botCount }} online</span>
      <span class="collapse-btn">{{ isCollapsed ? '◀' : '▶' }}</span>
    </div>
    <div v-if="!isCollapsed" class="chat-body">
      <div class="chat-messages" ref="messagesRef">
        <div v-for="msg in messages" :key="msg.id" class="chat-msg">
          <span class="msg-name" :style="{ color: msg.color }">{{ msg.name }}:</span>
          <span class="msg-text">{{ msg.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { BotManager, type ChatMessage } from './BotManager'

const messages = ref<ChatMessage[]>([])
const botCount = ref(0)
const isCollapsed = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  BotManager.start()
  messages.value = BotManager.getMessages()
  botCount.value = BotManager.getActiveBots().length

  unsubscribe = BotManager.onUpdate(() => {
    messages.value = BotManager.getMessages()
    botCount.value = BotManager.getActiveBots().length
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.chat-panel {
  position: fixed;
  right: 0;
  bottom: 80px;
  width: 280px;
  max-height: 400px;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #333;
  border-right: none;
  border-radius: 10px 0 0 10px;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
  transition: width 0.3s;
}

.chat-panel.collapsed {
  width: 40px;
  max-height: none;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.3);
  border-bottom: 1px solid #333;
  border-radius: 10px 0 0 0;
  cursor: pointer;
  user-select: none;
}

.collapsed .chat-header {
  flex-direction: column;
  padding: 8px 4px;
  border-radius: 10px 0 0 10px;
  gap: 4px;
}

.chat-title {
  color: #3b82f6;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 2px;
}

.collapsed .chat-title {
  writing-mode: vertical-rl;
  font-size: 11px;
}

.online-count {
  color: #4ade80;
  font-size: 11px;
  flex: 1;
}

.collapsed .online-count {
  display: none;
}

.collapse-btn {
  color: #888;
  font-size: 12px;
}

.collapsed .collapse-btn {
  display: none;
}

.chat-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 340px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.chat-msg {
  font-size: 13px;
  line-height: 1.3;
  word-wrap: break-word;
}

.msg-name {
  font-weight: bold;
  margin-right: 4px;
}

.msg-text {
  color: #ddd;
}
</style>
