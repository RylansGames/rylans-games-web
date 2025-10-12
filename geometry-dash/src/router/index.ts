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
      path: '/games/scary-shushi',
      name: 'scary-shushi',
      component: () => import('../games/scary-shushi/ScaryShushi.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
