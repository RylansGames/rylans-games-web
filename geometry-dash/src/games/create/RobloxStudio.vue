<template>
  <!-- HOME SCREEN -->
  <div v-if="view === 'home'" class="studio-shell">
    <nav class="studio-sidebar">
      <div class="sidebar-header">
        <svg viewBox="0 0 24 24" class="studio-logo" width="24" height="24">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#393b4f" stroke-width="2"/>
          <rect x="9" y="9" width="6" height="6" rx="1" fill="#393b4f"/>
        </svg>
        <span class="studio-brand">ROBLOX Studio</span>
      </div>
      <div
        v-for="item in sidebarItems"
        :key="item.label"
        class="sidebar-nav-item"
        :class="{ active: activeNav === item.label }"
        @click="activeNav = item.label"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </div>
      <div class="sidebar-spacer"></div>
      <div class="sidebar-nav-item" @click="$router.push('/games/roblox')">
        <span class="nav-icon">◀</span>
        <span class="nav-label">Back to Roblox</span>
      </div>
    </nav>

    <div class="studio-main">
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome, {{ playerName }}</h1>
      </div>

      <div class="tour-banner">
        <div class="tour-text">
          <h2 class="tour-title">Take a quick tour</h2>
          <p class="tour-desc">Learn the basics of Studio by creating your first playable experience in this quick guided tour.</p>
          <button class="tour-btn" @click="openEditor('Baseplate')">Start Learning</button>
        </div>
        <div class="tour-art">
          <div class="tour-scene">
            <div class="scene-tent"></div>
            <div class="scene-ground"></div>
            <div class="scene-stars">
              <span v-for="i in 8" :key="i" class="star" :style="{ left: (i * 12) + '%', top: (i * 5 + 3) + '%' }">✦</span>
            </div>
          </div>
        </div>
      </div>

      <section class="studio-section">
        <div class="section-header">
          <h2 class="section-title">Open a Template</h2>
          <span class="see-all">See All</span>
        </div>
        <p class="section-desc">See what's possible on Roblox in popular genres with our ready-made experiences, or start from scratch.</p>
        <div class="template-grid">
          <div v-for="tmpl in templates" :key="tmpl.name" class="template-card" @click="openEditor(tmpl.name)">
            <div class="template-thumb" :style="{ background: tmpl.bg }">
              <span class="template-icon">{{ tmpl.icon }}</span>
            </div>
            <span class="template-name">{{ tmpl.name }}</span>
          </div>
        </div>
      </section>

      <section class="studio-section">
        <h2 class="section-title">Discover Studio</h2>
        <p class="section-desc">Level up fast with our tutorials and resources, and learn the skills to bring your ideas to life.</p>
        <div class="template-grid">
          <div v-for="item in discoverItems" :key="item.name" class="template-card" @click="openEditor(item.name)">
            <div class="template-thumb" :style="{ background: item.bg }">
              <span class="template-icon">{{ item.icon }}</span>
            </div>
            <span class="template-name">{{ item.name }}</span>
            <span class="template-sub">{{ item.sub }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- EDITOR SCREEN (Roblox Studio) -->
  <div v-else class="editor-root">
    <!-- Top Tab Bar -->
    <div class="editor-tabbar">
      <div class="tab-left">
        <select class="test-dropdown">
          <option>Test</option>
          <option>Play</option>
          <option>Run</option>
        </select>
        <button class="tab-play-btn play" @click="testPlay">▶</button>
        <button class="tab-play-btn pause">⏸</button>
        <button class="tab-play-btn stop">⏹</button>
      </div>
      <div class="tab-tabs">
        <div
          v-for="tab in editorTabs"
          :key="tab"
          class="tab-item"
          :class="{ active: activeEditorTab === tab }"
          @click="activeEditorTab = tab"
        >{{ tab }}</div>
      </div>
      <div class="tab-right">
        <button class="tab-btn update-btn">Update</button>
        <button class="tab-btn collab-btn">Collaborate</button>
      </div>
    </div>

    <!-- Toolbar Ribbon -->
    <div class="toolbar-ribbon">
      <div class="toolbar-group">
        <div v-for="tool in toolsTransform" :key="tool.label" class="toolbar-item" :class="{ active: activeTool === tool.label }" @click="activeTool = tool.label">
          <span class="toolbar-icon">{{ tool.icon }}</span>
          <span class="toolbar-label">{{ tool.label }}</span>
        </div>
      </div>
      <div class="toolbar-sep"></div>
      <div class="toolbar-group">
        <div class="toolbar-item snap-item">
          <span class="toolbar-icon">📏</span>
          <span class="toolbar-label">1 studs</span>
        </div>
        <div class="toolbar-item snap-item">
          <span class="toolbar-icon">📐</span>
          <span class="toolbar-label">45°</span>
        </div>
      </div>
      <div class="toolbar-sep"></div>
      <div class="toolbar-group">
        <div v-for="tool in toolsInsert" :key="tool.label" class="toolbar-item" @click="insertObject(tool.label)">
          <span class="toolbar-icon">{{ tool.icon }}</span>
          <span class="toolbar-label">{{ tool.label }}</span>
        </div>
      </div>
      <div class="toolbar-sep"></div>
      <div class="toolbar-group">
        <div v-for="tool in toolsEdit" :key="tool.label" class="toolbar-item" @click="activeTool = tool.label">
          <span class="toolbar-icon">{{ tool.icon }}</span>
          <span class="toolbar-label">{{ tool.label }}</span>
        </div>
      </div>
    </div>

    <!-- Main Editor Area -->
    <div class="editor-body">
      <!-- Left Panel -->
      <div class="panel panel-left">
        <!-- Terrain Editor -->
        <div class="panel-section">
          <div class="panel-titlebar">
            <span>Terrain Editor</span>
            <span class="panel-btns">⚙ ✕</span>
          </div>
          <div class="terrain-tabs">
            <div class="terrain-tab active">Create</div>
            <div class="terrain-tab">Edit</div>
          </div>
          <div class="terrain-actions">
            <div class="terrain-action">
              <span class="ta-icon">📥</span>
              <span>Import</span>
            </div>
            <div class="terrain-action">
              <span class="ta-icon">⚡</span>
              <span>Generate</span>
            </div>
            <div class="terrain-action">
              <span class="ta-icon">🗑️</span>
              <span>Clear</span>
            </div>
          </div>
        </div>

        <!-- Toolbox -->
        <div class="panel-section toolbox-section">
          <div class="panel-titlebar">
            <span>Toolbox</span>
            <span class="panel-btns">⚙ ✕</span>
          </div>
          <div class="toolbox-tabs">
            <div class="tb-tab active">🏠</div>
            <div class="tb-tab">⊞</div>
            <div class="tb-tab">◐</div>
            <div class="tb-tab">💡</div>
          </div>
          <div class="toolbox-store">
            <div class="store-header">Creator Store</div>
            <div class="store-search">
              <input type="text" placeholder="Search" class="store-search-input" />
            </div>
            <div class="store-label">Categories</div>
            <div class="category-grid">
              <div v-for="cat in categories" :key="cat.name" class="category-item">
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-label">{{ cat.name }}</span>
              </div>
            </div>
            <div class="store-label trending-label">Trending <span class="see-all-sm">See All ›</span></div>
          </div>
        </div>
      </div>

      <!-- Center Viewport -->
      <div class="viewport">
        <div class="viewport-tab">
          <span class="vp-tab-name">{{ editorPlaceName }} ✕</span>
        </div>
        <div class="viewport-canvas">
          <!-- Sky gradient -->
          <div class="sky"></div>
          <!-- 3D axis gizmo -->
          <div class="axis-gizmo">
            <div class="axis-line axis-x"></div>
            <div class="axis-line axis-y"></div>
            <div class="axis-line axis-z"></div>
            <span class="axis-label ax">X</span>
            <span class="axis-label ay">Y</span>
            <span class="axis-label az">Z</span>
          </div>
          <!-- Baseplate floor -->
          <div class="baseplate-floor">
            <div class="grid-overlay"></div>
            <!-- Roblox logo on the baseplate -->
            <div class="baseplate-logo">
              <svg viewBox="0 0 60 60" width="80" height="80">
                <rect x="10" y="10" width="40" height="40" rx="2" fill="none" stroke="#b0b4c0" stroke-width="3" transform="rotate(45 30 30)"/>
                <rect x="22" y="22" width="16" height="16" rx="1" fill="#b0b4c0" transform="rotate(45 30 30)"/>
              </svg>
            </div>
          </div>
          <!-- Placed objects -->
          <div
            v-for="obj in placedObjects"
            :key="obj.id"
            class="placed-obj"
            :class="{ selected: selectedObj === obj.id }"
            :style="{ left: obj.x + 'px', bottom: obj.y + 'px', background: obj.color, width: obj.w + 'px', height: obj.h + 'px' }"
            @click="selectedObj = obj.id"
          >
            <span class="obj-label">{{ obj.label }}</span>
          </div>
        </div>
        <!-- Command bar -->
        <div class="command-bar">
          <span class="cmd-prompt">Execute a command with Ctrl+J or use Ctrl+Up/Down for history</span>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="panel panel-right">
        <!-- Explorer -->
        <div class="panel-section explorer-section">
          <div class="panel-titlebar">
            <span>Explorer</span>
            <span class="panel-btns">⚙ ···</span>
          </div>
          <div class="explorer-search">
            <input type="text" placeholder="Search" class="exp-search-input" />
          </div>
          <div class="explorer-tree">
            <div
              v-for="node in explorerNodes"
              :key="node.name"
              class="tree-node"
              :class="{ expandable: node.expandable }"
            >
              <span v-if="node.expandable" class="tree-arrow">▸</span>
              <span v-else class="tree-spacer"></span>
              <span class="tree-icon">{{ node.icon }}</span>
              <span class="tree-name">{{ node.name }}</span>
            </div>
          </div>
        </div>

        <!-- Properties -->
        <div class="panel-section props-section">
          <div class="panel-titlebar">
            <span>Properties</span>
            <span class="panel-btns">⚙ ✕</span>
          </div>
          <div class="props-content">
            <div class="props-filter">
              <input type="text" placeholder="Filter Properties (Ctrl+Shift+P)" class="props-filter-input" />
            </div>
            <div v-if="selectedObj" class="props-list">
              <div class="prop-row"><span class="prop-key">Name</span><span class="prop-val">Part</span></div>
              <div class="prop-row"><span class="prop-key">Color</span><span class="prop-val">{{ getSelectedColor() }}</span></div>
              <div class="prop-row"><span class="prop-key">Size</span><span class="prop-val">4, 1, 2</span></div>
              <div class="prop-row"><span class="prop-key">Anchored</span><span class="prop-val">true</span></div>
            </div>
            <div v-else class="props-empty">Select an object to view properties</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom status -->
    <div class="editor-status">
      <span>Run</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState } from '../../components/shared/GameState'

const router = useRouter()
const view = ref<'home' | 'editor'>('home')
const playerName = ref('Player')
const activeNav = ref('Home')
const editorPlaceName = ref('Place1')
const activeEditorTab = ref('Home')
const activeTool = ref('Select')
const selectedObj = ref<string | null>(null)

interface PlacedObject {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  color: string
}

const placedObjects = ref<PlacedObject[]>([])
let nextId = 1

const sidebarItems = [
  { icon: '➕', label: 'New Experience' },
  { icon: '🕐', label: 'Recents' },
  { icon: '🏠', label: 'Home' },
  { icon: '🎮', label: 'Experiences' },
  { icon: '📋', label: 'Templates' },
  { icon: '📦', label: 'Archive' },
]

const templates = [
  { name: 'Baseplate', icon: '⬜', bg: 'linear-gradient(135deg, #64748b, #94a3b8)' },
  { name: 'Classic Baseplate', icon: '🟫', bg: 'linear-gradient(135deg, #78716c, #a8a29e)' },
  { name: 'Flat Terrain', icon: '🌿', bg: 'linear-gradient(135deg, #16a34a, #4ade80)' },
  { name: 'Platformer', icon: '🏃', bg: 'linear-gradient(135deg, #ec4899, #f9a8d4)' },
  { name: 'Laser Tag', icon: '🔫', bg: 'linear-gradient(135deg, #1e1b4b, #4338ca)' },
  { name: 'UGC Homestore', icon: '🛒', bg: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
]

const discoverItems = [
  { name: 'Sketch Series', icon: '✏️', bg: 'linear-gradient(135deg, #f5f5f4, #d6d3d1)', sub: 'Follow along with bite-sized video tutorials' },
  { name: 'Tutorials', icon: '📚', bg: 'linear-gradient(135deg, #1e3a5f, #2563eb)', sub: 'Get to grips with the fundamentals' },
  { name: 'Roblox Principles', icon: '🌐', bg: 'linear-gradient(135deg, #0f172a, #1e293b)', sub: 'Discover the structure of Roblox' },
  { name: 'Avatar Documentation', icon: '👤', bg: 'linear-gradient(135deg, #7c2d12, #dc2626)', sub: 'Create clothing, accessories, bodies and heads' },
  { name: 'Engine Documentation', icon: '⚙️', bg: 'linear-gradient(135deg, #1e1b4b, #4338ca)', sub: 'Go deeper into Studio features' },
  { name: 'Creator Hub', icon: '🦋', bg: 'linear-gradient(135deg, #ea580c, #f59e0b)', sub: 'Promote and monitor your experiences' },
]

const editorTabs = ['Home', 'Avatar', 'UI', 'Script', 'Model', 'Plugins']

const toolsTransform = [
  { icon: '🖱️', label: 'Select' },
  { icon: '✥', label: 'Move' },
  { icon: '⤡', label: 'Scale' },
  { icon: '↻', label: 'Rotate' },
  { icon: '⊞', label: 'Transform' },
]

const toolsInsert = [
  { icon: '🧊', label: 'Part' },
  { icon: '🏔️', label: 'Terrain' },
  { icon: '🧑', label: 'Character' },
  { icon: '🖼️', label: 'GUI' },
  { icon: '📜', label: 'Script' },
  { icon: '📦', label: 'Import' },
]

const toolsEdit = [
  { icon: '🎨', label: 'Material' },
  { icon: '🔴', label: 'Color' },
  { icon: '📁', label: 'Group' },
  { icon: '🔒', label: 'Lock' },
  { icon: '⚓', label: 'Anchor' },
]

const categories = [
  { icon: '🧊', name: '3D Assets' },
  { icon: '✨', name: 'Visual Effects' },
  { icon: '🖼️', name: '2D Assets' },
  { icon: '🎮', name: 'Gameplay' },
  { icon: '🔌', name: 'Plugins' },
  { icon: '🔊', name: 'Audio' },
]

const explorerNodes = [
  { icon: '🌐', name: 'Workspace', expandable: false },
  { icon: '👥', name: 'Players', expandable: false },
  { icon: '💡', name: 'Lighting', expandable: true },
  { icon: '🎨', name: 'MaterialService', expandable: false },
  { icon: '📁', name: 'ReplicatedFirst', expandable: false },
  { icon: '📁', name: 'ReplicatedStorage', expandable: false },
  { icon: '🛡️', name: 'ServerScriptService', expandable: false },
  { icon: '📦', name: 'ServerStorage', expandable: false },
  { icon: '🖥️', name: 'StarterGui', expandable: false },
  { icon: '🎒', name: 'StarterPack', expandable: false },
  { icon: '🧑', name: 'StarterPlayer', expandable: true },
  { icon: '👥', name: 'Teams', expandable: false },
  { icon: '🔊', name: 'SoundService', expandable: false },
  { icon: '💬', name: 'TextChatService', expandable: true },
]

function openEditor(name: string) {
  editorPlaceName.value = name
  placedObjects.value = []
  selectedObj.value = null
  view.value = 'editor'
}

function insertObject(type: string) {
  const colors: Record<string, string> = {
    Part: '#8b8fa0', Terrain: '#4ade80', Character: '#3b82f6', GUI: '#f59e0b', Script: '#a78bfa', Import: '#64748b'
  }
  const id = 'obj-' + nextId++
  const vp = document.querySelector('.viewport-canvas')
  const vpW = vp ? vp.clientWidth : 600
  placedObjects.value.push({
    id,
    label: type,
    x: Math.random() * (vpW - 80) + 20,
    y: 100 + Math.random() * 100,
    w: type === 'Part' ? 60 : 50,
    h: type === 'Part' ? 30 : 40,
    color: colors[type] || '#8b8fa0',
  })
  selectedObj.value = id
}

function testPlay() {
  alert('Playing your experience! (This would run your game)')
}

function getSelectedColor(): string {
  const obj = placedObjects.value.find(o => o.id === selectedObj.value)
  return obj ? obj.color : ''
}

onMounted(() => {
  playerName.value = gameState.getPlayerName() || 'Player'
})
</script>

<style scoped>
/* ============ HOME SCREEN ============ */
.studio-shell {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
  color: #1a1a2e;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.studio-sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  flex-shrink: 0;
}

.sidebar-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px 20px; }
.studio-brand { font-size: 15px; font-weight: 800; color: #393b4f; letter-spacing: -0.3px; }

.sidebar-nav-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 20px;
  cursor: pointer; transition: background 0.15s; font-size: 14px; color: #4b5563; font-weight: 500;
}
.sidebar-nav-item:hover { background: #f3f4f6; }
.sidebar-nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
.nav-icon { font-size: 18px; width: 24px; text-align: center; }
.nav-label { white-space: nowrap; }
.sidebar-spacer { flex: 1; }

.studio-main { flex: 1; overflow-y: auto; padding: 28px 36px; min-width: 0; }
.welcome-section { margin-bottom: 24px; }
.welcome-title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin: 0; }

.tour-banner {
  display: flex; background: linear-gradient(135deg, #312e81, #4338ca, #6366f1);
  border-radius: 16px; overflow: hidden; margin-bottom: 36px; min-height: 180px;
}
.tour-text { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; justify-content: center; }
.tour-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0; }
.tour-desc { font-size: 14px; color: #c7d2fe; margin: 0 0 18px 0; line-height: 1.5; max-width: 380px; }
.tour-btn {
  align-self: flex-start; background: #4f46e5; color: #fff; border: none;
  padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
}
.tour-btn:hover { background: #4338ca; }
.tour-art { width: 320px; position: relative; overflow: hidden; flex-shrink: 0; }
.tour-scene { width: 100%; height: 100%; position: relative; background: linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%); }
.scene-tent {
  position: absolute; bottom: 20%; left: 50%; transform: translateX(-50%);
  width: 80px; height: 60px; background: linear-gradient(135deg, #dc2626, #fbbf24, #dc2626);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}
.scene-ground { position: absolute; bottom: 0; left: 0; right: 0; height: 20%; background: linear-gradient(180deg, #78350f, #92400e); border-radius: 50% 50% 0 0 / 30% 30% 0 0; }
.scene-stars .star { position: absolute; color: #fde68a; font-size: 10px; opacity: 0.7; animation: twinkle 2s ease-in-out infinite alternate; }
.scene-stars .star:nth-child(odd) { animation-delay: 0.5s; }
@keyframes twinkle { from { opacity: 0.3; } to { opacity: 1; } }

.studio-section { margin-bottom: 36px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.section-title { font-size: 20px; font-weight: 800; color: #1a1a2e; margin: 0; }
.see-all { font-size: 14px; color: #6366f1; cursor: pointer; font-weight: 600; }
.see-all:hover { text-decoration: underline; }
.section-desc { font-size: 14px; color: #6b7280; margin: 4px 0 16px 0; }

.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
.template-card {
  cursor: pointer; border-radius: 12px; overflow: hidden; background: #fff;
  border: 1px solid #e5e7eb; transition: transform 0.15s, box-shadow 0.15s; display: flex; flex-direction: column;
}
.template-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.template-card:active { transform: scale(0.97); }
.template-thumb { width: 100%; aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; }
.template-icon { font-size: 44px; }
.template-name { font-size: 14px; font-weight: 700; color: #1a1a2e; padding: 10px 12px 2px; }
.template-sub { font-size: 12px; color: #6b7280; padding: 0 12px 10px; line-height: 1.3; }
.template-card:not(:has(.template-sub)) .template-name { padding-bottom: 12px; }

@media (max-width: 700px) {
  .studio-sidebar { width: 60px; }
  .studio-brand, .nav-label { display: none; }
  .sidebar-nav-item { padding: 10px; justify-content: center; }
  .studio-main { padding: 16px; }
  .tour-art { display: none; }
  .template-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
}

/* ============ EDITOR SCREEN ============ */
.editor-root {
  display: flex; flex-direction: column; height: 100vh; background: #2b2b2b;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #e0e0e0; font-size: 13px;
  overflow: hidden;
}

/* Tab Bar */
.editor-tabbar {
  display: flex; align-items: center; background: #f0f0f0; height: 36px;
  border-bottom: 1px solid #ccc; padding: 0 8px; gap: 4px; flex-shrink: 0;
}
.tab-left { display: flex; align-items: center; gap: 4px; }
.test-dropdown {
  background: #fff; border: 1px solid #ccc; border-radius: 4px; padding: 2px 8px;
  font-size: 12px; color: #333; cursor: pointer;
}
.tab-play-btn {
  width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
  background: #e0e0e0; color: #333;
}
.tab-play-btn.play { background: #4caf50; color: #fff; }
.tab-play-btn:hover { opacity: 0.8; }

.tab-tabs { display: flex; gap: 0; margin-left: 16px; flex: 1; }
.tab-item {
  padding: 6px 16px; font-size: 13px; font-weight: 600; color: #555;
  cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.15s;
}
.tab-item:hover { color: #333; background: #e8e8e8; }
.tab-item.active { color: #1a73e8; border-bottom-color: #1a73e8; background: #fff; }

.tab-right { display: flex; gap: 6px; }
.tab-btn {
  padding: 4px 14px; border-radius: 4px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1px solid #ccc;
}
.update-btn { background: #fff; color: #333; }
.collab-btn { background: #4caf50; color: #fff; border-color: #43a047; }

/* Toolbar */
.toolbar-ribbon {
  display: flex; align-items: flex-end; background: #f8f8f8; padding: 4px 8px;
  border-bottom: 1px solid #ddd; gap: 2px; flex-shrink: 0; flex-wrap: wrap;
}
.toolbar-group { display: flex; gap: 2px; }
.toolbar-sep { width: 1px; background: #ccc; margin: 4px 6px; align-self: stretch; }
.toolbar-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 4px 8px; border-radius: 4px; cursor: pointer; min-width: 44px;
  transition: background 0.1s;
}
.toolbar-item:hover { background: #e0e4ea; }
.toolbar-item.active { background: #d0d8e8; }
.toolbar-icon { font-size: 20px; }
.toolbar-label { font-size: 10px; color: #555; font-weight: 500; }

/* Editor Body */
.editor-body { display: flex; flex: 1; overflow: hidden; }

/* Panels */
.panel {
  display: flex; flex-direction: column; background: #f0f0f0; border-color: #ddd;
  overflow-y: auto;
}
.panel-left { width: 220px; border-right: 1px solid #ddd; }
.panel-right { width: 240px; border-left: 1px solid #ddd; }

.panel-section { border-bottom: 1px solid #ddd; }
.panel-titlebar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px; background: #e8e8e8; font-weight: 700; font-size: 12px; color: #333;
}
.panel-btns { font-size: 11px; color: #888; cursor: pointer; }

/* Terrain Editor */
.terrain-tabs { display: flex; border-bottom: 1px solid #ddd; }
.terrain-tab {
  flex: 1; text-align: center; padding: 6px; font-size: 12px; font-weight: 600;
  color: #666; cursor: pointer; border-bottom: 2px solid transparent;
}
.terrain-tab.active { color: #1a73e8; border-bottom-color: #1a73e8; }
.terrain-actions { display: flex; gap: 8px; padding: 12px; justify-content: center; }
.terrain-action {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 11px;
  color: #555; font-weight: 500;
}
.terrain-action:hover { background: #e0e0e0; }
.ta-icon { font-size: 24px; }

/* Toolbox */
.toolbox-section { flex: 1; display: flex; flex-direction: column; }
.toolbox-tabs { display: flex; border-bottom: 1px solid #ddd; }
.tb-tab {
  flex: 1; text-align: center; padding: 6px; font-size: 16px; cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tb-tab.active { background: #fff; border-bottom-color: #1a73e8; }
.toolbox-store { padding: 8px; flex: 1; overflow-y: auto; }
.store-header { font-size: 13px; font-weight: 700; color: #333; margin-bottom: 6px; }
.store-search-input {
  width: 100%; padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px;
  font-size: 12px; margin-bottom: 8px; box-sizing: border-box;
}
.store-label { font-size: 12px; font-weight: 700; color: #333; margin: 6px 0; }
.category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.category-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
  cursor: pointer; font-size: 11px; color: #555; font-weight: 500;
}
.category-item:hover { background: #eef2ff; border-color: #818cf8; }
.cat-icon { font-size: 22px; }
.trending-label { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.see-all-sm { font-size: 11px; color: #1a73e8; cursor: pointer; font-weight: 600; }

/* Viewport */
.viewport { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.viewport-tab {
  background: #e0e0e0; padding: 4px 12px; font-size: 12px; font-weight: 600;
  color: #333; border-bottom: 1px solid #ccc;
}
.viewport-canvas {
  flex: 1; position: relative; overflow: hidden;
  background: linear-gradient(180deg, #b8c6db 0%, #c8d6e5 30%, #dce3eb 60%, #e8ecf1 100%);
}

/* Sky */
.sky {
  position: absolute; top: 0; left: 0; right: 0; height: 55%;
  background: linear-gradient(180deg, #87CEEB 0%, #b0d4e8 50%, #cddeed 100%);
}

/* Axis gizmo */
.axis-gizmo { position: absolute; top: 16px; right: 40px; width: 50px; height: 50px; }
.axis-line {
  position: absolute; width: 2px; height: 20px; bottom: 50%; left: 50%;
  transform-origin: bottom center;
}
.axis-x { background: #e53935; transform: rotate(-30deg); }
.axis-y { background: #43a047; transform: rotate(0deg); }
.axis-z { background: #1e88e5; transform: rotate(30deg); }
.axis-label { position: absolute; font-size: 10px; font-weight: 700; }
.ax { color: #e53935; right: 0; top: 12px; }
.ay { color: #43a047; left: 22px; top: 0; }
.az { color: #1e88e5; left: 44px; top: 12px; }

/* Baseplate */
.baseplate-floor {
  position: absolute; bottom: 10%; left: 10%; right: 10%; height: 35%;
  background: #c8ccd4;
  transform: perspective(600px) rotateX(55deg);
  transform-origin: bottom center;
  border-radius: 2px;
}

.grid-overlay {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
  background-size: 20px 20px;
}

.baseplate-logo {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  opacity: 0.4;
}

/* Placed objects */
.placed-obj {
  position: absolute; border-radius: 4px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; border: 2px solid transparent;
  transition: border-color 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.placed-obj:hover { border-color: rgba(255,255,255,0.5); }
.placed-obj.selected { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,0.4); }
.obj-label { font-size: 10px; color: #fff; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

/* Command bar */
.command-bar {
  padding: 4px 10px; background: #1e1e1e; color: #888; font-size: 12px;
  border-top: 1px solid #444;
}

/* Explorer */
.explorer-section { flex: 1; display: flex; flex-direction: column; }
.explorer-search { padding: 4px 8px; }
.exp-search-input {
  width: 100%; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;
  font-size: 11px; box-sizing: border-box;
}
.explorer-tree { flex: 1; overflow-y: auto; padding: 4px 0; }
.tree-node {
  display: flex; align-items: center; gap: 4px; padding: 3px 10px;
  font-size: 12px; cursor: pointer; color: #333;
}
.tree-node:hover { background: #e0e4ea; }
.tree-arrow { font-size: 10px; color: #888; width: 12px; text-align: center; }
.tree-spacer { width: 12px; }
.tree-icon { font-size: 14px; }
.tree-name { font-size: 12px; }

/* Properties */
.props-section { min-height: 180px; display: flex; flex-direction: column; }
.props-content { flex: 1; padding: 4px 8px; overflow-y: auto; }
.props-filter-input {
  width: 100%; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;
  font-size: 11px; margin-bottom: 6px; box-sizing: border-box;
}
.props-list { display: flex; flex-direction: column; gap: 2px; }
.prop-row {
  display: flex; justify-content: space-between; padding: 3px 4px;
  font-size: 11px; border-bottom: 1px solid #eee;
}
.prop-key { color: #555; font-weight: 600; }
.prop-val { color: #333; }
.props-empty { font-size: 11px; color: #999; text-align: center; padding: 20px 0; }

/* Status */
.editor-status {
  padding: 2px 10px; background: #007acc; color: #fff; font-size: 11px;
  display: flex; align-items: center; flex-shrink: 0;
}

/* Mobile adjustments */
@media (max-width: 800px) {
  .panel-left { width: 0; overflow: hidden; display: none; }
  .panel-right { width: 180px; }
  .toolbar-ribbon { overflow-x: auto; flex-wrap: nowrap; }
}
</style>
