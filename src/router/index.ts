import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'
import { auth } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/role-selection' // Cambiar a selección de roles como página principal
  },
  {
    path: '/role-selection',
    name: 'RoleSelection',
    component: () => import('../views/RoleSelection.vue'),
    meta: {
      requiresAuth: false,
      title: 'Seleccionar Tipo de Acceso'
    }
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
  // NUEVAS RUTAS DE EMPLEADOS
  {
    path: '/employee/login',
    name: 'EmployeeLogin',
    component: () => import('../views/EmployeeLogin.vue'),
    meta: {
      requiresAuth: false,
      requiresEmployeeAuth: false,
      title: 'Acceso Empleados'
    }
  },
  {
    path: '/employee/scanner',
    name: 'EmployeeScanner',
    component: () => import('../views/EmployeeScanner.vue'),
    meta: {
      requiresAuth: false,
      requiresEmployeeAuth: true,
      title: 'Escáner QR - Empleados'
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

// Función auxiliar para verificar autenticación de empleado
const checkEmployeeAuth = (): boolean => {
  try {
    const employeeSession = localStorage.getItem('employeeSession')
    if (!employeeSession) return false
    
    const session = JSON.parse(employeeSession)
    const loginTime = new Date(session.loginTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
    
    // Sesión válida por 12 horas
    return hoursDiff <= 12 && session.role === 'employee'
  } catch {
    return false
  }
}

// Guard de navegación para autenticación
router.beforeEach((to, from, next) => {
  console.log(`🧭 Navegando a: ${to.path}`)
  
  // IMPORTANTE: Permitir acceso directo a rutas de descarga sin autenticación
  if (to.path.startsWith('/download-ticket/')) {
    console.log(`📥 Acceso directo a descarga: ${to.path}`)
    next()
    return
  }
  
  // ===== LÓGICA ESPECÍFICA PARA EMPLEADOS =====
  
  // Si está intentando acceder al área de empleados
  if (to.path.startsWith('/employee/')) {
    // Si va al login de empleados
    if (to.path === '/employee/login') {
      // Si ya está autenticado como empleado, redirigir al scanner
      if (checkEmployeeAuth()) {
        console.log('👷 Empleado ya autenticado, redirigiendo al scanner')
        next('/employee/scanner')
        return
      }
      // Si no está autenticado, permitir acceso al login
      console.log('👷 Acceso al login de empleados')
      next()
      return
    }
    
    // Si intenta acceder al scanner sin autenticación de empleado
    if (to.meta.requiresEmployeeAuth && !checkEmployeeAuth()) {
      console.log('🔒 Acceso denegado al scanner, redirigiendo a login de empleados')
      next('/employee/login')
      return
    }
    
    // Si está autenticado como empleado, permitir acceso
    if (checkEmployeeAuth()) {
      console.log('✅ Empleado autenticado, acceso permitido')
      next()
      return
    }
  }
  
  // Si empleado autenticado intenta acceder a rutas de admin
  if (checkEmployeeAuth() && (to.path.startsWith('/tabs/') || to.path === '/login')) {
    console.log('🚫 Empleado no puede acceder a área de administración')
    next('/employee/scanner')
    return
  }
  
  // ===== LÓGICA NORMAL DE ADMINISTRADOR =====
  
  // Otras rutas públicas (incluyendo role-selection)
  const publicRoutes = ['/login', '/404', '/role-selection']
  const isPublicRoute = publicRoutes.includes(to.path) || 
                       to.matched.some(record => record.meta.requiresAuth === false)
  
  if (isPublicRoute && !to.path.startsWith('/employee/')) {
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
    // Verificar autenticación de administrador
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
  
  // Si está autenticado como admin y trata de ir al login, redirigir a la app
  if (to.path === '/login' && auth.isAuthenticated) {
    console.log('✅ Admin ya autenticado, redirigiendo a app')
    next('/tabs/guests')
    return
  }
  
  // Si está autenticado como admin y trata de ir a role-selection, redirigir a la app
  if (to.path === '/role-selection' && auth.isAuthenticated) {
    console.log('✅ Admin ya autenticado, redirigiendo a app desde role-selection')
    next('/tabs/guests')
    return
  }
  
  // Si está autenticado como empleado y trata de ir a role-selection, redirigir al scanner
  if (to.path === '/role-selection' && checkEmployeeAuth()) {
    console.log('✅ Empleado ya autenticado, redirigiendo al scanner desde role-selection')
    next('/employee/scanner')
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