<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { ref as dbRef, onValue, push, update, remove, set } from 'firebase/database'
import { gameState } from '../components/shared/GameState'

const router = useRouter()

// ======= AUTH =======
const isOwner = ref(localStorage.getItem('adminAuth') === 'true')
const showOwnerPrompt = ref(false)
const ownerPwd = ref('')
const ownerError = ref('')
const OWNER_CODE = 'rylanowner'
function tryLogin() {
  if (ownerPwd.value === OWNER_CODE) {
    localStorage.setItem('adminAuth', 'true')
    isOwner.value = true
    showOwnerPrompt.value = false
    ownerPwd.value = ''
    ownerError.value = ''
  } else {
    ownerError.value = 'Wrong code!'
    ownerPwd.value = ''
  }
}
function logoutOwner() {
  localStorage.removeItem('adminAuth')
  isOwner.value = false
}

// ======= COINS =======
const coins = ref(gameState.getCoins())
let coinTimer: number | null = null
function refreshCoins() { coins.value = gameState.getCoins() }

// ======= PLAYER =======
const playerName = ref(gameState.getPlayerName())

// ======= TYPES =======
interface ShopItem {
  id: string
  name: string
  icon: string
  price: number
  stock: number
  location: string
  description: string
  kind: '3d' | '2d' | 'other'
  active: boolean
}
interface Order {
  id: string
  itemId: string
  itemName: string
  itemIcon: string
  price: number
  buyerName: string
  buyerNote: string
  status: 'new' | 'delivered' | 'canceled'
  createdAt: number
}
interface Job {
  id: string
  title: string
  icon: string
  reward: number
  description: string
  active: boolean
}
interface JobClaim {
  id: string
  jobId: string
  jobTitle: string
  reward: number
  claimerName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}

// ======= FIREBASE STATE =======
const items = ref<ShopItem[]>([])
const orders = ref<Order[]>([])
const jobs = ref<Job[]>([])
const jobClaims = ref<JobClaim[]>([])

const activeItems = computed(() => items.value.filter((i) => i.active !== false))
const activeJobs = computed(() => jobs.value.filter((j) => j.active !== false))
const pendingClaims = computed(() => jobClaims.value.filter((c) => c.status === 'pending'))
const newOrders = computed(() => orders.value.filter((o) => o.status === 'new'))
const myClaims = computed(() =>
  jobClaims.value.filter((c) => c.claimerName === playerName.value),
)

// ======= SUBSCRIPTIONS =======
const unsubs: Array<() => void> = []
function subscribe() {
  const itemsRef = dbRef(db, 'shop/items')
  const u1 = onValue(itemsRef, (snap) => {
    const data = snap.val() ?? {}
    items.value = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<ShopItem, 'id'>) }))
  })
  unsubs.push(u1)

  const ordersRef = dbRef(db, 'shop/orders')
  const u2 = onValue(ordersRef, (snap) => {
    const data = snap.val() ?? {}
    orders.value = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<Order, 'id'>) }))
      .sort((a, b) => b.createdAt - a.createdAt)
  })
  unsubs.push(u2)

  const jobsRef = dbRef(db, 'shop/jobs')
  const u3 = onValue(jobsRef, (snap) => {
    const data = snap.val()
    if (!data) {
      // Seed default jobs on first load
      seedDefaultJobs()
      return
    }
    jobs.value = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<Job, 'id'>) }))
  })
  unsubs.push(u3)

  const claimsRef = dbRef(db, 'shop/jobClaims')
  const u4 = onValue(claimsRef, (snap) => {
    const data = snap.val() ?? {}
    jobClaims.value = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<JobClaim, 'id'>) }))
      .sort((a, b) => b.createdAt - a.createdAt)
  })
  unsubs.push(u4)
}

const DEFAULT_JOBS: Omit<Job, 'id'>[] = [
  { title: 'Walk the dog', icon: '🐕', reward: 5, description: 'Take the dog for a walk.', active: true },
  { title: 'Do the dishes', icon: '🍽️', reward: 8, description: 'Wash and dry the dishes.', active: true },
  { title: 'Take out trash', icon: '🗑️', reward: 3, description: 'Empty trash cans.', active: true },
  { title: 'Rake leaves', icon: '🍃', reward: 10, description: 'Rake leaves in the yard.', active: true },
  { title: 'Vacuum', icon: '🧹', reward: 7, description: 'Vacuum the living room.', active: true },
  { title: 'Fold laundry', icon: '🧺', reward: 6, description: 'Fold a pile of laundry.', active: true },
  { title: 'Shovel snow', icon: '❄️', reward: 12, description: 'Shovel the driveway.', active: true },
  { title: 'Wash the car', icon: '🚗', reward: 15, description: 'Soap and rinse the car.', active: true },
  { title: 'Feed the pet', icon: '🐠', reward: 2, description: 'Feed the pet (fish/cat/dog).', active: true },
  { title: 'Water plants', icon: '🪴', reward: 3, description: 'Water all indoor plants.', active: true },
  { title: 'Set the table', icon: '🍴', reward: 2, description: 'Set the table for dinner.', active: true },
  { title: 'Clear the table', icon: '🥣', reward: 2, description: 'Clear dishes after dinner.', active: true },
  { title: 'Clean your room', icon: '🛏️', reward: 8, description: 'Pick up and organize your room.', active: true },
  { title: 'Help with groceries', icon: '🛒', reward: 5, description: 'Carry & put away groceries.', active: true },
  { title: 'Organize toys', icon: '🧸', reward: 4, description: 'Put toys away in bins.', active: true },
  { title: 'Dust furniture', icon: '🪣', reward: 4, description: 'Dust shelves and tables.', active: true },
  { title: 'Mow the lawn', icon: '🌱', reward: 18, description: 'Mow the whole lawn.', active: true },
  { title: 'Sweep the porch', icon: '🧽', reward: 3, description: 'Sweep the porch or patio.', active: true },
  { title: 'Feed siblings breakfast', icon: '🥞', reward: 6, description: 'Help make a simple breakfast.', active: true },
  { title: 'Read a book', icon: '📖', reward: 5, description: 'Read for 20 minutes.', active: true },
]
function seedDefaultJobs() {
  const base = dbRef(db, 'shop/jobs')
  const data: Record<string, Omit<Job, 'id'>> = {}
  DEFAULT_JOBS.forEach((j, i) => { data['job_' + (i + 1)] = j })
  set(base, data)
}

// ======= ACTIONS =======
async function buyItem(item: ShopItem) {
  if (item.stock <= 0) return alert('Out of stock!')
  if (coins.value < item.price) return alert('Not enough coins. Do some jobs to earn more!')
  const note = prompt(
    `How close are you to Rylan? Write your location.\n(e.g. "my block", "across the street", "far — message me")`,
    'my neighborhood',
  )
  if (note === null) return
  if (!gameState.spendCoins(item.price)) return alert('Something went wrong.')
  refreshCoins()
  const orderRef = push(dbRef(db, 'shop/orders'))
  const order: Omit<Order, 'id'> = {
    itemId: item.id,
    itemName: item.name,
    itemIcon: item.icon,
    price: item.price,
    buyerName: playerName.value,
    buyerNote: note,
    status: 'new',
    createdAt: Date.now(),
  }
  await set(orderRef, order)
  await update(dbRef(db, `shop/items/${item.id}`), { stock: Math.max(0, item.stock - 1) })
  flash(`🛒 Ordered ${item.name}! Rylan will deliver it soon.`)
}

async function claimJob(job: Job) {
  const already = jobClaims.value.find(
    (c) => c.jobId === job.id && c.claimerName === playerName.value && c.status === 'pending',
  )
  if (already) return flash('You already claimed this — waiting for Rylan to approve!')
  const r = push(dbRef(db, 'shop/jobClaims'))
  const claim: Omit<JobClaim, 'id'> = {
    jobId: job.id,
    jobTitle: job.title,
    reward: job.reward,
    claimerName: playerName.value,
    status: 'pending',
    createdAt: Date.now(),
  }
  await set(r, claim)
  flash(`⏳ ${job.title} claimed! Waiting for Rylan to approve.`)
}

async function approveClaim(c: JobClaim) {
  await update(dbRef(db, `shop/jobClaims/${c.id}`), { status: 'approved' })
  if (c.claimerName === playerName.value) {
    gameState.addCoins(c.reward)
    refreshCoins()
  }
  flash(`✅ Approved ${c.claimerName} — +${c.reward} coins`)
}
async function rejectClaim(c: JobClaim) {
  await update(dbRef(db, `shop/jobClaims/${c.id}`), { status: 'rejected' })
}

async function markDelivered(o: Order) {
  await update(dbRef(db, `shop/orders/${o.id}`), { status: 'delivered' })
}

// ======= OWNER: add/edit items & jobs =======
const showAddItem = ref(false)
const draftItem = ref<Omit<ShopItem, 'id'>>({
  name: '', icon: '🎁', price: 10, stock: 1, location: 'my block',
  description: '', kind: '3d', active: true,
})
async function saveItem() {
  if (!draftItem.value.name.trim()) return
  const r = push(dbRef(db, 'shop/items'))
  await set(r, { ...draftItem.value })
  showAddItem.value = false
  draftItem.value = { name: '', icon: '🎁', price: 10, stock: 1, location: 'my block', description: '', kind: '3d', active: true }
}
async function deleteItem(id: string) {
  if (!confirm('Delete this item?')) return
  await remove(dbRef(db, `shop/items/${id}`))
}
async function changeStock(item: ShopItem, delta: number) {
  await update(dbRef(db, `shop/items/${item.id}`), { stock: Math.max(0, item.stock + delta) })
}

const showAddJob = ref(false)
const draftJob = ref<Omit<Job, 'id'>>({ title: '', icon: '💼', reward: 5, description: '', active: true })
async function saveJob() {
  if (!draftJob.value.title.trim()) return
  const r = push(dbRef(db, 'shop/jobs'))
  await set(r, { ...draftJob.value })
  showAddJob.value = false
  draftJob.value = { title: '', icon: '💼', reward: 5, description: '', active: true }
}
async function deleteJob(id: string) {
  if (!confirm('Delete this job?')) return
  await remove(dbRef(db, `shop/jobs/${id}`))
}

// ======= UI STATE =======
const toast = ref('')
function flash(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2500)
}

const panel = ref<'items' | 'orders' | 'claims' | 'jobs'>('items')

onMounted(() => {
  subscribe()
  coinTimer = window.setInterval(refreshCoins, 600)
})
onUnmounted(() => {
  unsubs.forEach((fn) => { try { fn() } catch {} })
  if (coinTimer) clearInterval(coinTimer)
})
</script>

<template>
  <main class="shop-app">
    <header class="shop-hud">
      <div class="shop-brand">🛒 Rylan's Shop</div>
      <nav class="shop-nav">
        <button class="nav-btn active">🛒 Shop</button>
        <button class="nav-btn" @click="router.push('/games')">🎮 Games</button>
      </nav>
      <div class="shop-right">
        <div class="coin-chip">💰 {{ coins }}</div>
        <button v-if="!isOwner" class="owner-btn" @click="showOwnerPrompt = true">🔑 Owner</button>
        <button v-else class="owner-btn on" @click="logoutOwner">👑 Owner</button>
      </div>
    </header>

    <div v-if="toast" class="shop-toast">{{ toast }}</div>

    <!-- Owner login prompt -->
    <div v-if="showOwnerPrompt" class="modal-back" @click.self="showOwnerPrompt = false">
      <div class="modal">
        <h3>🔑 Owner Login</h3>
        <input v-model="ownerPwd" type="password" placeholder="Secret code" @keydown.enter="tryLogin" />
        <div v-if="ownerError" class="err">{{ ownerError }}</div>
        <div class="row">
          <button class="btn" @click="tryLogin">Login</button>
          <button class="btn ghost" @click="showOwnerPrompt = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- SHOP ITEMS -->
    <section class="section">
      <h2 class="section-title">🛍️ Shop</h2>
      <p class="section-sub">Buy Rylan's stuff with coins. Do jobs below to earn more!</p>
      <div v-if="activeItems.length === 0" class="empty">
        No items yet! {{ isOwner ? 'Tap ➕ Add Item on the right to add one.' : 'Rylan is still stocking the shelves…' }}
      </div>
      <div v-else class="grid">
        <div v-for="item in activeItems" :key="item.id" class="card" :class="{ oos: item.stock <= 0 }">
          <div class="card-icon">{{ item.icon }}</div>
          <div class="card-name">{{ item.name }}</div>
          <div class="card-desc">{{ item.description }}</div>
          <div class="card-meta">
            <span class="chip">{{ item.kind.toUpperCase() }}</span>
            <span class="chip">📦 {{ item.stock > 0 ? item.stock + ' left' : 'OUT' }}</span>
            <span class="chip">📍 {{ item.location }}</span>
          </div>
          <div class="card-footer">
            <div class="price">💰 {{ item.price }}</div>
            <button class="btn buy" :disabled="item.stock <= 0 || coins < item.price" @click="buyItem(item)">
              {{ item.stock <= 0 ? 'Out of stock' : 'Buy' }}
            </button>
          </div>
          <div v-if="isOwner" class="owner-tools">
            <button class="mini" @click="changeStock(item, 1)">+1</button>
            <button class="mini" @click="changeStock(item, -1)">-1</button>
            <button class="mini del" @click="deleteItem(item.id)">🗑</button>
          </div>
        </div>
      </div>
    </section>

    <!-- JOBS -->
    <section class="section">
      <h2 class="section-title">💪 Earn Coins — Jobs</h2>
      <p class="section-sub">Do a chore, tap "I did it!", wait for Rylan to approve, earn coins.</p>
      <div class="grid tight">
        <div v-for="job in activeJobs" :key="job.id" class="job-card">
          <div class="job-icon">{{ job.icon }}</div>
          <div class="job-text">
            <div class="job-title">{{ job.title }}</div>
            <div class="job-desc">{{ job.description }}</div>
          </div>
          <div class="job-right">
            <div class="job-reward">+{{ job.reward }} 💰</div>
            <button class="btn tiny" @click="claimJob(job)">I did it!</button>
            <button v-if="isOwner" class="mini del" @click="deleteJob(job.id)">🗑</button>
          </div>
        </div>
      </div>
      <div v-if="myClaims.length" class="my-claims">
        <h4>Your claims:</h4>
        <div v-for="c in myClaims" :key="c.id" class="claim-row" :class="c.status">
          <span>{{ c.jobTitle }}</span>
          <span class="claim-status">
            {{ c.status === 'pending' ? '⏳ waiting' : c.status === 'approved' ? '✅ +' + c.reward : '❌ rejected' }}
          </span>
        </div>
      </div>
    </section>

    <!-- OWNER PANEL -->
    <aside v-if="isOwner" class="owner-panel">
      <header class="op-head">
        <strong>👑 Owner Panel</strong>
      </header>
      <div class="op-tabs">
        <button :class="{ on: panel === 'items' }" @click="panel = 'items'">Items</button>
        <button :class="{ on: panel === 'orders' }" @click="panel = 'orders'">
          Orders <span v-if="newOrders.length" class="pill">{{ newOrders.length }}</span>
        </button>
        <button :class="{ on: panel === 'claims' }" @click="panel = 'claims'">
          Jobs <span v-if="pendingClaims.length" class="pill">{{ pendingClaims.length }}</span>
        </button>
        <button :class="{ on: panel === 'jobs' }" @click="panel = 'jobs'">+Job</button>
      </div>

      <!-- Items panel -->
      <div v-if="panel === 'items'" class="op-body">
        <button class="btn block" @click="showAddItem = true">➕ Add Item</button>
        <div v-if="showAddItem" class="form-block">
          <input v-model="draftItem.name" placeholder="Name" />
          <input v-model="draftItem.icon" placeholder="Icon (emoji)" maxlength="4" />
          <textarea v-model="draftItem.description" placeholder="Description" rows="2" />
          <div class="form-row">
            <label>Price 💰<input v-model.number="draftItem.price" type="number" min="0" /></label>
            <label>Stock 📦<input v-model.number="draftItem.stock" type="number" min="0" /></label>
          </div>
          <div class="form-row">
            <label>Kind
              <select v-model="draftItem.kind">
                <option value="3d">3D printed</option>
                <option value="2d">2D drawing</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Location <input v-model="draftItem.location" placeholder="my block" /></label>
          </div>
          <div class="row">
            <button class="btn" @click="saveItem">Save</button>
            <button class="btn ghost" @click="showAddItem = false">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Orders panel -->
      <div v-if="panel === 'orders'" class="op-body">
        <div v-if="orders.length === 0" class="muted">No orders yet.</div>
        <div v-for="o in orders" :key="o.id" class="op-row" :class="o.status">
          <div class="op-row-top">
            <strong>{{ o.itemIcon }} {{ o.itemName }}</strong>
            <span class="chip">💰{{ o.price }}</span>
          </div>
          <div class="op-row-info">👤 {{ o.buyerName }} · 📍 {{ o.buyerNote }}</div>
          <div class="op-row-actions">
            <span class="chip" :class="o.status">{{ o.status }}</span>
            <button v-if="o.status === 'new'" class="btn tiny" @click="markDelivered(o)">✅ Delivered</button>
          </div>
        </div>
      </div>

      <!-- Claims panel -->
      <div v-if="panel === 'claims'" class="op-body">
        <div v-if="pendingClaims.length === 0" class="muted">No pending jobs.</div>
        <div v-for="c in pendingClaims" :key="c.id" class="op-row">
          <div class="op-row-top">
            <strong>{{ c.jobTitle }}</strong>
            <span class="chip">+{{ c.reward }}💰</span>
          </div>
          <div class="op-row-info">👤 {{ c.claimerName }}</div>
          <div class="op-row-actions">
            <button class="btn tiny" @click="approveClaim(c)">✅ Approve</button>
            <button class="btn tiny ghost" @click="rejectClaim(c)">❌ Reject</button>
          </div>
        </div>
      </div>

      <!-- Add Job panel -->
      <div v-if="panel === 'jobs'" class="op-body">
        <div class="form-block">
          <input v-model="draftJob.title" placeholder="Job title" />
          <input v-model="draftJob.icon" placeholder="Icon (emoji)" maxlength="4" />
          <textarea v-model="draftJob.description" placeholder="Description" rows="2" />
          <label>Reward 💰<input v-model.number="draftJob.reward" type="number" min="0" /></label>
          <button class="btn block" @click="saveJob">➕ Add Job</button>
        </div>
      </div>
    </aside>
  </main>
</template>

<style scoped>
.shop-app {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family: 'Nunito', 'Inter', system-ui, sans-serif;
  padding-bottom: 60px;
}

.shop-hud {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #334155;
}
.shop-brand { font-size: 22px; font-weight: 900; }
.shop-nav { display: flex; gap: 6px; margin-left: 16px; }
.nav-btn {
  background: #1e293b; border: 2px solid #334155; color: #cbd5e1;
  padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;
}
.nav-btn.active { background: #f59e0b; border-color: #f59e0b; color: #0f172a; }
.shop-right { margin-left: auto; display: flex; gap: 10px; align-items: center; }
.coin-chip {
  background: #1e293b; border: 2px solid #ffd700; color: #ffd700;
  padding: 8px 14px; border-radius: 999px; font-weight: 900; font-size: 16px;
}
.owner-btn {
  background: #334155; border: 2px solid #475569; color: #f1f5f9;
  padding: 8px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;
}
.owner-btn.on { background: #f59e0b; border-color: #f59e0b; color: #0f172a; }

.shop-toast {
  position: fixed; top: 74px; left: 50%; transform: translateX(-50%);
  background: #10b981; color: white; padding: 10px 20px; border-radius: 999px;
  font-weight: 800; z-index: 30; box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.section { max-width: 1200px; margin: 24px auto; padding: 0 20px; }
.section-title { font-size: 26px; margin: 0 0 4px; }
.section-sub { color: #94a3b8; margin: 0 0 16px; }
.empty { padding: 40px; text-align: center; color: #64748b; background: #1e293b; border-radius: 14px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.grid.tight { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

.card {
  background: #1e293b; border: 2px solid #334155; border-radius: 14px;
  padding: 16px; display: flex; flex-direction: column; gap: 8px; position: relative;
}
.card.oos { opacity: 0.55; }
.card-icon { font-size: 54px; text-align: center; }
.card-name { font-weight: 900; font-size: 18px; }
.card-desc { color: #94a3b8; font-size: 13px; min-height: 30px; }
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  background: #0f172a; border: 1px solid #334155; color: #cbd5e1;
  padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.chip.new { background: #dbeafe; color: #1e40af; border-color: #1e40af; }
.chip.delivered { background: #d1fae5; color: #065f46; border-color: #065f46; }
.chip.canceled { background: #fee2e2; color: #991b1b; border-color: #991b1b; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.price { font-size: 20px; font-weight: 900; color: #ffd700; }

.btn {
  background: #f59e0b; color: #0f172a; border: none;
  padding: 10px 18px; border-radius: 10px; font-weight: 900; cursor: pointer;
  box-shadow: 0 4px 0 #b45309;
}
.btn:hover:not(:disabled) { filter: brightness(1.05); }
.btn:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 2px 0 #b45309; }
.btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; box-shadow: 0 4px 0 #1e293b; }
.btn.buy { background: #10b981; color: white; box-shadow: 0 4px 0 #047857; }
.btn.tiny { padding: 6px 10px; font-size: 12px; box-shadow: 0 2px 0 #b45309; }
.btn.ghost { background: transparent; color: #94a3b8; border: 2px solid #334155; box-shadow: none; }
.btn.block { width: 100%; }

.owner-tools { display: flex; gap: 4px; margin-top: 6px; }
.mini {
  background: #334155; border: none; color: #f1f5f9;
  padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700;
}
.mini.del { background: #991b1b; }

.job-card {
  display: flex; gap: 12px; align-items: center;
  background: #1e293b; border: 2px solid #334155; border-radius: 12px; padding: 12px;
}
.job-icon { font-size: 36px; }
.job-text { flex: 1; }
.job-title { font-weight: 800; }
.job-desc { font-size: 12px; color: #94a3b8; }
.job-right { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.job-reward { color: #ffd700; font-weight: 900; font-size: 14px; }

.my-claims { margin-top: 20px; background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #334155; }
.my-claims h4 { margin: 0 0 10px; }
.claim-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e293b; }
.claim-row.approved .claim-status { color: #10b981; }
.claim-row.rejected .claim-status { color: #ef4444; opacity: 0.7; }
.claim-row.pending .claim-status { color: #f59e0b; }

/* Owner Panel */
.owner-panel {
  position: fixed; right: 12px; top: 84px; bottom: 12px;
  width: min(360px, 92vw);
  background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(6px);
  border: 2px solid #f59e0b; border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  z-index: 20;
}
.op-head { padding: 12px; border-bottom: 1px solid #334155; }
.op-tabs { display: flex; border-bottom: 1px solid #334155; }
.op-tabs button {
  flex: 1; background: transparent; border: none; color: #cbd5e1;
  padding: 10px 6px; cursor: pointer; font-weight: 700; font-size: 12px;
  position: relative;
}
.op-tabs button.on { background: #f59e0b; color: #0f172a; }
.op-tabs .pill {
  display: inline-block; background: #ef4444; color: white;
  padding: 1px 6px; border-radius: 999px; font-size: 10px; margin-left: 4px;
}
.op-body { flex: 1; overflow-y: auto; padding: 12px; display: grid; gap: 10px; align-content: start; }
.muted { color: #64748b; font-style: italic; text-align: center; padding: 20px; }

.form-block { display: grid; gap: 8px; padding: 10px; background: #0f172a; border-radius: 10px; }
.form-block input, .form-block textarea, .form-block select {
  background: #1e293b; color: #f1f5f9; border: 1px solid #334155;
  padding: 8px; border-radius: 8px; font-family: inherit; font-size: 14px; width: 100%;
}
.form-row { display: flex; gap: 8px; }
.form-row label { flex: 1; display: grid; gap: 4px; font-size: 12px; color: #94a3b8; }

.op-row {
  background: #1e293b; border: 1px solid #334155; border-radius: 10px;
  padding: 10px; display: grid; gap: 6px;
}
.op-row.delivered { opacity: 0.55; }
.op-row-top { display: flex; justify-content: space-between; align-items: center; }
.op-row-info { font-size: 13px; color: #94a3b8; }
.op-row-actions { display: flex; gap: 6px; align-items: center; justify-content: space-between; }

.row { display: flex; gap: 8px; }
.err { color: #ef4444; font-size: 13px; }

.modal-back {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: grid; place-items: center; z-index: 40;
}
.modal {
  background: #1e293b; border: 2px solid #334155; border-radius: 16px;
  padding: 20px; display: grid; gap: 12px; min-width: 260px;
}
.modal input {
  background: #0f172a; border: 2px solid #334155; color: #f1f5f9;
  padding: 10px; border-radius: 8px; font-size: 16px;
}

@media (max-width: 1100px) {
  .owner-panel { top: auto; bottom: 0; right: 0; left: 0; width: 100%; max-height: 55vh; border-radius: 16px 16px 0 0; }
}
</style>
