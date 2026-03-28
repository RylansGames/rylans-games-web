import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/games/geometry-dash',
      name: 'geometry-dash',
      component: () => import('../games/geometry-dash/GeometryDash.vue'),
    },
    {
      path: '/games/brainrot-evolution',
      name: 'brainrot-evolution',
      component: () => import('../games/brainrot-evolution/BrainrotEvolution.vue'),
    },
    {
      path: '/games/brainrot-admin',
      name: 'brainrot-admin',
      component: () => import('../games/brainrot-evolution/BrainrotAdmin.vue'),
    },
    {
      path: '/games/organize-the-fridge',
      name: 'organize-the-fridge',
      component: () => import('../games/organize-the-fridge/OrganizeTheFridge.vue'),
    },
    {
      path: '/games/music-beats',
      name: 'music-beats',
      component: () => import('../games/music-beats/MusicBeats.vue'),
    },
    {
      path: '/games/camera-watch',
      name: 'camera-watch',
      component: () => import('../games/camera-watch/CameraWatch.vue'),
    },
    {
      path: '/games/roblox',
      name: 'roblox',
      component: () => import('../games/create/RobloxHub.vue'),
    },
    {
      path: '/studio',
      name: 'roblox-studio',
      component: () => import('../games/create/RobloxStudio.vue'),
    },
    {
      path: '/create',
      name: 'create-game',
      component: () => import('../games/create/CreateGame.vue'),
    },
    {
      path: '/games/breakout',
      name: 'breakout',
      component: () => import('../games/breakout/Breakout.vue'),
    },
    {
      path: '/games/sudoku',
      name: 'sudoku',
      component: () => import('../games/sudoku/Sudoku.vue'),
    },
    {
      path: '/games/rewatch',
      name: 'rewatch',
      component: () => import('../games/rewatch/ReWatch.vue'),
    },
    {
      path: '/games/deactivated',
      name: 'deactivated',
      component: () => import('../games/deactivated/DeActivated.vue'),
    },
    {
      path: '/games/frogger',
      name: 'frogger',
      component: () => import('../games/frogger/Frogger.vue'),
    },
    {
      path: '/games/basketball',
      name: 'basketball',
      component: () => import('../games/basketball/Basketball.vue'),
    },
    {
      path: '/games/gunfight',
      name: 'gunfight',
      component: () => import('../games/gunfight/GunFight.vue'),
    },
    {
      path: '/games/fishing',
      name: 'fishing',
      component: () => import('../games/fishing/FishingGame.vue'),
    },
    {
      path: '/games/island-tag',
      name: 'island-tag',
      component: () => import('../games/tag/IslandTag.vue'),
    },
    {
      path: '/games/feedback',
      name: 'feedback',
      component: () => import('../games/feedback/Feedback.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
