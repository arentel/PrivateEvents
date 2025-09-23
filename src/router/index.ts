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
      }
    ]
  },
  {
    // Ruta catch-all para 404
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard de navegación para autenticación
router.beforeEach((to, from, next) => {
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

  // Verificar configuración de Supabase (solo log, no bloquear)
  const hasSupabaseConfig = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  
  if (!hasSupabaseConfig && requiresAuth) {
    console.warn('⚠️ Configuración de Supabase incompleta')
  }
  
  next()
})

// Guard después de cada navegación
router.afterEach((to) => {
  // Actualizar título de la página
  document.title = to.meta.title ? `${to.meta.title} - Sistema QR Eventos` : 'Sistema QR Eventos'
  
  // Log de navegación en desarrollo
  if (import.meta.env.DEV) {
    console.log(`🧭 Navegando a: ${to.path} (${String(to.name)})`)
  }
})

export default router