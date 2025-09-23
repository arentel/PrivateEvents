import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/guests'
  },
  {
    path: '/tabs/',
    component: TabsPage,
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
          title: 'Lista de Invitados',
          icon: 'people-outline'
        }
      },
      {
        path: 'send',
        name: 'Send',
        component: () => import('../views/SendTab.vue'),
        meta: {
          title: 'Enviar QRs',
          icon: 'mail-outline'
        }
      },
      {
        path: 'scan',
        name: 'Scan',
        component: () => import('../views/ScanTab.vue'),
        meta: {
          title: 'Validar',
          icon: 'scan-outline'
        }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/ReportsTab.vue'),
        meta: {
          title: 'Reportes',
          icon: 'analytics-outline'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard global para verificar configuración
router.beforeEach((to, from, next) => {
  // Verificar que las variables de entorno estén configuradas
  const hasSupabaseConfig = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  
  if (!hasSupabaseConfig && to.path !== '/setup') {
    console.warn('Configuración de Supabase incompleta')
    // En desarrollo, permitir continuar
    // En producción, podrías redirigir a una página de configuración
  }
  
  next()
})

export default router