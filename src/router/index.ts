import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'
import { auth } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Iniciar Sesión'
    }
  },
  {
    path: '/download-ticket/:code',
    name: 'DownloadTicket',
    component: () => import('@/views/DownloadTicket.vue'),
    meta: {
      requiresAuth: false, // IMPORTANTE: Ruta pública
      title: 'Descargar Entrada'
    }
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/guests'
      },
      {
        path: 'guests',
        name: 'Guests',
        component: () => import('../views/GuestsTab.vue'),
        meta: {
          requiresAuth: true,
          title: 'Lista de Invitados',
          icon: 'people-outline'
        }
      },
      {
        path: 'send',
        name: 'Send',
        component: () => import('../views/SendTab.vue'),
        meta: {
          requiresAuth: true,
          title: 'Enviar QRs',
          icon: 'mail-outline'
        }
      },
      {
        path: 'scan',
        name: 'Scan',
        component: () => import('../views/ScanTab.vue'),
        meta: {
          requiresAuth: true,
          title: 'Validar',
          icon: 'scan-outline'
        }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/ReportsTab.vue'),
        meta: {
          requiresAuth: true,
          title: 'Reportes',
          icon: 'analytics-outline'
        }
      },
      {
        path: 'events',
        name: 'Events',
        component: () => import('../views/EventsTab.vue'),
        meta: {
          requiresAuth: true,
          title: 'Eventos',
          icon: 'calendar-outline'
        }
      }
    ]
  },
  {
    // Ruta catch-all para 404
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Página no encontrada'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard de navegación para autenticación
router.beforeEach((to, from, next) => {
  console.log(`🧭 Navegando a: ${to.path}`)
  
  // IMPORTANTE: Permitir acceso directo a rutas de descarga sin autenticación
  if (to.path.startsWith('/download-ticket/')) {
    console.log(`📥 Acceso directo a descarga: ${to.path}`)
    next()
    return
  }
  
  // Otras rutas públicas
  const publicRoutes = ['/login', '/404']
  const isPublicRoute = publicRoutes.includes(to.path) || 
                       to.matched.some(record => record.meta.requiresAuth === false)
  
  if (isPublicRoute) {
    console.log(`🌐 Ruta pública: ${to.path}`)
    next()
    return
  }
  
  // Inicializar auth store si no se ha hecho
  if (!auth.isAuthenticated) {
    auth.init()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth) {
    // Verificar autenticación
    if (!auth.isAuthenticated) {
      console.log('🔒 Ruta protegida, redirigiendo a login')
      next('/login')
      return
    }
    
    // Verificar que la sesión siga siendo válida
    if (!auth.isValidSession()) {
      console.log('⏰ Sesión expirada, redirigiendo a login')
      auth.logout()
      next('/login')
      return
    }
  }
  
  // Si está autenticado y trata de ir al login, redirigir a la app
  if (to.path === '/login' && auth.isAuthenticated) {
    console.log('✅ Ya autenticado, redirigiendo a app')
    next('/tabs/guests')
    return
  }
  
  next()
})

// Guard después de cada navegación
router.afterEach((to) => {
  // Actualizar título de la página
  document.title = to.meta.title ? `${to.meta.title} - Sistema QR Eventos` : 'Sistema QR Eventos'
  
  // Log de navegación en desarrollo
  if (import.meta.env.DEV) {
    console.log(`📍 En: ${to.path} (${String(to.name)})`)
  }
})

export default router