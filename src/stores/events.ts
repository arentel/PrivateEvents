import { reactive, computed } from 'vue'
import { db } from '@/services/supabase.js' // El archivo de tipos manejará esto
// import { useLoading } from '@/composables/useLoading.js' // Comentar hasta que se cree

// Interfaces y tipos
export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  event_id: string
  event_name: string
  qr_sent: boolean
  has_entered: boolean
  sent_at?: string
  entered_at?: string
  table_number?: string
  created_at: string
  // Alias para compatibilidad
  sent?: boolean
  scanned?: boolean
  table?: string
}

export interface Event {
  id: string
  name: string
  description?: string
  date: string
  location?: string
  max_guests?: number
  email_template?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Tipo para el cache
interface CacheData {
  eventStats: Map<string, any>
  guestsByEvent: Map<string, Guest[]>
  lastCacheUpdate: Map<string, Date>
  [key: string]: any // Index signature para acceso dinámico
}

// Estado global optimizado con cache interno
const eventsState = reactive({
  events: [] as Event[],
  currentEventId: null as string | null,
  guests: [] as Guest[],
  initialized: false,
  lastFetch: null as Date | null,
  error: null as string | null
})

// Cache para optimizar consultas frecuentes
const cache: CacheData = reactive({
  eventStats: new Map<string, any>(),
  guestsByEvent: new Map<string, Guest[]>(),
  lastCacheUpdate: new Map<string, Date>()
})

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

// Simulación del hook de loading hasta que se cree el archivo
const mockUseLoading = () => ({
  withLoading: async (fn: () => Promise<any>, options?: any) => {
    try {
      return await fn()
    } catch (error) {
      console.error('Error en operación:', error)
      throw error
    }
  },
  setError: (error: string) => console.error(error),
  clearError: () => console.log('Error cleared')
})

// Hook de loading para el store
const { withLoading, setError, clearError } = mockUseLoading()

// Utilidades de cache
const isCacheValid = (key: string): boolean => {
  const lastUpdate = cache.lastCacheUpdate.get(key)
  if (!lastUpdate) return false
  return Date.now() - lastUpdate.getTime() < CACHE_DURATION
}

const setCache = (key: string, data: any): void => {
  cache[key] = data
  cache.lastCacheUpdate.set(key, new Date())
}

const clearCache = (pattern?: string): void => {
  if (pattern) {
    // Limpiar cache específico
    Object.keys(cache).forEach(key => {
      if (key.includes(pattern)) {
        delete cache[key]
        cache.lastCacheUpdate.delete(key)
      }
    })
  } else {
    // Limpiar todo el cache
    cache.eventStats.clear()
    cache.guestsByEvent.clear()
    cache.lastCacheUpdate.clear()
  }
}

// Store de eventos optimizado
export const eventsStore = {
  // Getters computados
  get events(): Event[] {
    return eventsState.events
  },

  get currentEvent(): Event | null {
    if (!eventsState.currentEventId) return null
    return eventsState.events.find(e => e.id === eventsState.currentEventId) || null
  },

  get currentEventId(): string | null {
    return eventsState.currentEventId
  },

  get guests(): Guest[] {
    return eventsState.guests
  },

  get currentEventGuests(): Guest[] {
    if (!eventsState.currentEventId) return []
    
    const cacheKey = `guests_${eventsState.currentEventId}`
    if (isCacheValid(cacheKey) && cache.guestsByEvent.has(cacheKey)) {
      return cache.guestsByEvent.get(cacheKey) || []
    }
    
    const guests = eventsState.guests
      .filter((g: Guest) => g.event_id === eventsState.currentEventId)
      .map((g: Guest) => ({
        ...g,
        sent: g.qr_sent,
        scanned: g.has_entered,
        table: g.table_number
      }))
    
    cache.guestsByEvent.set(cacheKey, guests)
    cache.lastCacheUpdate.set(cacheKey, new Date())
    
    return guests
  },

  get activeEvents(): Event[] {
    return eventsState.events.filter((e: Event) => e.is_active)
  },

  get initialized(): boolean {
    return eventsState.initialized
  },

  get error(): string | null {
    return eventsState.error
  },

  // Estadísticas optimizadas con cache
  get currentEventStats() {
    if (!eventsState.currentEventId) {
      return { total: 0, confirmed: 0, sent: 0, scanned: 0, pending: 0 }
    }

    const cacheKey = `stats_${eventsState.currentEventId}`
    if (isCacheValid(cacheKey) && cache.eventStats.has(cacheKey)) {
      return cache.eventStats.get(cacheKey)
    }

    const eventGuests = this.currentEventGuests
    const stats = {
      total: eventGuests.length,
      confirmed: eventGuests.filter((g: Guest) => g.has_entered).length,
      sent: eventGuests.filter((g: Guest) => g.qr_sent).length,
      scanned: eventGuests.filter((g: Guest) => g.has_entered).length,
      pending: eventGuests.filter((g: Guest) => !g.qr_sent).length
    }

    cache.eventStats.set(cacheKey, stats)
    cache.lastCacheUpdate.set(cacheKey, new Date())
    
    return stats
  },

  // Inicialización optimizada con loading states
  async init(force = false): Promise<void> {
    if (eventsState.initialized && !force) {
      console.log('📦 Store ya inicializado, usando datos cacheados')
      return
    }

    return withLoading(async () => {
      clearError()
      
      try {
        console.log('🔄 Inicializando eventos store...')
        
        // Cargar datos en paralelo para mejor rendimiento
        const [eventsResult, guestsResult] = await Promise.allSettled([
          this.loadEvents(),
          this.loadGuests()
        ])

        // Manejar resultados
        if (eventsResult.status === 'rejected') {
          console.error('Error cargando eventos:', eventsResult.reason)
          throw eventsResult.reason
        }

        if (guestsResult.status === 'rejected') {
          console.error('Error cargando invitados:', guestsResult.reason)
          // Los invitados son menos críticos, continuar
        }

        // Establecer evento actual si no existe
        if (!eventsState.currentEventId && eventsState.events.length > 0) {
          eventsState.currentEventId = eventsState.events[0].id
        }

        eventsState.initialized = true
        eventsState.lastFetch = new Date()
        
        console.log('✅ Store inicializado:', {
          eventos: eventsState.events.length,
          invitados: eventsState.guests.length,
          eventoActual: this.currentEvent?.name
        })

      } catch (error: any) {
        console.error('❌ Error inicializando store:', error)
        eventsState.error = error?.message || 'Error desconocido'
        throw error
      }
    }, {
      showSuccessToast: false,
      showErrorToast: true,
      retries: 3
    })
  },

  // Cargar eventos optimizado
  async loadEvents(): Promise<Event[]> {
    try {
      console.log('📅 Cargando eventos desde BD...')
      
      let events: Event[] = []
      
      // Verificar si existe la función getAllEvents
      if (db.getAllEvents && typeof db.getAllEvents === 'function') {
        events = await db.getAllEvents()
      } else {
        // Fallback: crear eventos mock o usar datos locales
        console.warn('getAllEvents no disponible, usando datos mock')
        events = [
          {
            id: '1',
            name: 'Evento por defecto',
            description: 'Evento creado automáticamente',
            date: new Date().toISOString(),
            location: 'Por definir',
            max_guests: 100,
            email_template: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
        ]
      }
      
      eventsState.events = events
      
      // Limpiar cache relacionado con eventos
      clearCache('events')
      
      console.log(`✅ ${events.length} eventos cargados`)
      return events
      
    } catch (error) {
      console.error('❌ Error cargando eventos:', error)
      throw error
    }
  },

  // Cargar invitados optimizado
  async loadGuests(): Promise<Guest[]> {
    try {
      console.log('👥 Cargando invitados desde BD...')
      
      // Usar función existente del db
      const guests = await db.getAllGuests()
      eventsState.guests = guests
      
      // Limpiar cache relacionado
      clearCache('guests')
      clearCache('stats')
      
      console.log(`✅ ${guests.length} invitados cargados`)
      return guests
      
    } catch (error) {
      console.error('❌ Error cargando invitados:', error)
      throw error
    }
  },

  // Refrescar datos con debounce
  async refresh(force = false): Promise<void> {
    const lastFetch = eventsState.lastFetch
    const now = new Date()
    
    // Evitar refresh muy frecuentes (debounce)
    if (!force && lastFetch && (now.getTime() - lastFetch.getTime()) < 10000) {
      console.log('⏳ Refresh muy reciente, omitiendo...')
      return
    }

    return this.init(true)
  },

  // Establecer evento actual
  setCurrentEvent(eventId: string): void {
    if (eventId !== eventsState.currentEventId) {
      eventsState.currentEventId = eventId
      
      // Limpiar cache específico del evento anterior
      clearCache('guests')
      clearCache('stats')
      
      console.log('🎯 Evento actual cambiado:', this.currentEvent?.name)
    }
  },

  // Crear evento optimizado
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return withLoading(async () => {
      try {
        // Usar función existente o crear manualmente
        let newEvent: Event
        if (db.createEvent && typeof db.createEvent === 'function') {
          newEvent = await db.createEvent(eventData)
        } else {
          // Crear evento manualmente si no existe la función
          const eventId = Date.now().toString()
          newEvent = {
            id: eventId,
            name: eventData.name || '',
            description: eventData.description || '',
            date: eventData.date || new Date().toISOString(),
            location: eventData.location || '',
            max_guests: eventData.max_guests || 100,
            email_template: eventData.email_template || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: eventData.is_active !== undefined ? eventData.is_active : true
          }
          // Aquí deberías implementar la lógica real de guardado
          console.warn('createEvent no implementado en db, usando mock')
        }
        
        eventsState.events.unshift(newEvent)
        
        // Establecer como evento actual si es el primero
        if (eventsState.events.length === 1) {
          eventsState.currentEventId = newEvent.id
        }
        
        clearCache('events')
        
        console.log('✅ Evento creado:', newEvent.name)
        return newEvent
        
      } catch (error) {
        console.error('❌ Error creando evento:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: 'Evento creado correctamente'
    })
  },

  // Actualizar evento optimizado
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    return withLoading(async () => {
      try {
        // Usar función existente o actualizar manualmente
        let updatedEvent: Event
        if (db.updateEvent && typeof db.updateEvent === 'function') {
          updatedEvent = await db.updateEvent(eventId, updates)
        } else {
          // Actualizar evento manualmente si no existe la función
          const existingEvent = eventsState.events.find(e => e.id === eventId)
          if (!existingEvent) {
            throw new Error('Evento no encontrado')
          }
          
          updatedEvent = {
            ...existingEvent,
            ...updates,
            updated_at: new Date().toISOString()
          }
          
          console.warn('updateEvent no implementado en db, usando mock')
        }
        
        const index = eventsState.events.findIndex((e: Event) => e.id === eventId)
        if (index !== -1) {
          eventsState.events[index] = updatedEvent
        }
        
        clearCache('events')
        
        console.log('✅ Evento actualizado:', updatedEvent.name)
        return updatedEvent
        
      } catch (error) {
        console.error('❌ Error actualizando evento:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: 'Evento actualizado correctamente'
    })
  },

  // Eliminar evento optimizado
  async deleteEvent(eventId: string): Promise<boolean> {
    return withLoading(async () => {
      try {
        // Usar función existente o eliminar manualmente
        if (db.deleteEvent && typeof db.deleteEvent === 'function') {
          await db.deleteEvent(eventId)
        } else {
          // Eliminar evento manualmente si no existe la función
          console.warn('deleteEvent no implementado en db, usando mock')
        }
        
        // Remover del estado
        eventsState.events = eventsState.events.filter((e: Event) => e.id !== eventId)
        
        // Si era el evento actual, cambiar al primero disponible
        if (eventsState.currentEventId === eventId) {
          eventsState.currentEventId = eventsState.events.length > 0 
            ? eventsState.events[0].id 
            : null
        }
        
        // Remover invitados del evento
        eventsState.guests = eventsState.guests.filter((g: Guest) => g.event_id !== eventId)
        
        clearCache()
        
        console.log('✅ Evento eliminado')
        return true
        
      } catch (error) {
        console.error('❌ Error eliminando evento:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: 'Evento eliminado correctamente'
    })
  },
  async createGuest(guestData: Partial<Guest>): Promise<Guest> {
    return withLoading(async () => {
      try {
        const newGuest = await db.createGuest(guestData)
        eventsState.guests.unshift(newGuest)
        
        // Limpiar cache relacionado
        clearCache('guests')
        clearCache('stats')
        
        console.log('✅ Invitado creado:', newGuest.name)
        return newGuest
        
      } catch (error) {
        console.error('❌ Error creando invitado:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: 'Invitado agregado correctamente'
    })
  },

  // Alias para compatibilidad con GuestsTab.vue
  async addGuest(guestData: Partial<Guest>): Promise<Guest> {
    return this.createGuest(guestData)
  },

  // Crear múltiples invitados optimizado
  async createMultipleGuests(guestsData: Partial<Guest>[]): Promise<Guest[]> {
    return withLoading(async () => {
      try {
        const newGuests = await db.createMultipleGuests(guestsData)
        eventsState.guests.unshift(...newGuests)
        
        clearCache('guests')
        clearCache('stats')
        
        console.log(`✅ ${newGuests.length} invitados creados`)
        return newGuests
        
      } catch (error) {
        console.error('❌ Error creando invitados:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: `${guestsData.length} invitados agregados correctamente`
    })
  },

  // Actualizar invitado optimizado
  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      const updatedGuest = await db.updateGuest(guestId, updates)
      
      const index = eventsState.guests.findIndex((g: Guest) => g.id === guestId)
      if (index !== -1) {
        eventsState.guests[index] = updatedGuest
      }
      
      // Limpiar cache específico
      clearCache('guests')
      clearCache('stats')
      
      return updatedGuest
      
    } catch (error) {
      console.error('❌ Error actualizando invitado:', error)
      throw error
    }
  },

  // Marcar como ingresado optimizado
  async markGuestAsEntered(guestId: string): Promise<Guest> {
    try {
      const updatedGuest = await db.markAsEntered(guestId)
      
      const index = eventsState.guests.findIndex((g: Guest) => g.id === guestId)
      if (index !== -1) {
        eventsState.guests[index] = updatedGuest
      }
      
      // Limpiar cache específico
      clearCache('guests')
      clearCache('stats')
      
      console.log('✅ Invitado marcado como ingresado:', updatedGuest.name)
      return updatedGuest
      
    } catch (error) {
      console.error('❌ Error marcando ingreso:', error)
      throw error
    }
  },

  // Eliminar invitado optimizado
  async deleteGuest(guestId: string): Promise<boolean> {
    return withLoading(async () => {
      try {
        await db.deleteGuest(guestId)
        
        eventsState.guests = eventsState.guests.filter((g: Guest) => g.id !== guestId)
        
        clearCache('guests')
        clearCache('stats')
        
        console.log('✅ Invitado eliminado')
        return true
        
      } catch (error) {
        console.error('❌ Error eliminando invitado:', error)
        throw error
      }
    }, {
      showSuccessToast: true,
      successMessage: 'Invitado eliminado correctamente'
    })
  },

  // Buscar invitados optimizado
  async searchGuests(searchTerm: string): Promise<Guest[]> {
    try {
      const results = await db.searchGuests(searchTerm)
      console.log(`🔍 Encontrados ${results.length} invitados para: "${searchTerm}"`)
      return results
    } catch (error) {
      console.error('❌ Error buscando invitados:', error)
      return []
    }
  },

  // Obtener estadísticas globales
  async getGlobalStats(): Promise<any | null> {
    try {
      const cacheKey = 'global_stats'
      if (isCacheValid(cacheKey) && cache[cacheKey]) {
        return cache[cacheKey]
      }

      // Usar función básica si existe, sino calcular manualmente
      let stats
      if (db.getBasicStats && typeof db.getBasicStats === 'function') {
        stats = await db.getBasicStats()
      } else {
        // Calcular estadísticas básicas manualmente
        const guests = eventsState.guests
        stats = {
          total: guests.length,
          sent: guests.filter((g: Guest) => g.qr_sent).length,
          entered: guests.filter((g: Guest) => g.has_entered).length,
          byEvent: {}
        }
      }
      
      setCache(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      return null
    }
  },

  // Limpiar cache manualmente
  clearCache(): void {
    clearCache()
    console.log('🗑️ Cache del store limpiado')
  },

  // Verificar conexión
  async testConnection(): Promise<boolean> {
    try {
      return await db.testConnection()
    } catch (error) {
      console.error('❌ Error probando conexión:', error)
      return false
    }
  },

  // Resetear store
  reset(): void {
    eventsState.events = []
    eventsState.currentEventId = null
    eventsState.guests = []
    eventsState.initialized = false
    eventsState.lastFetch = null
    eventsState.error = null
    clearCache()
    console.log('🔄 Store reseteado')
  }
}

// Auto-refresh cada 5 minutos si la pestaña está activa
if (typeof window !== 'undefined') {
  let refreshInterval: ReturnType<typeof setInterval> | null = null
  
  const startAutoRefresh = () => {
    if (refreshInterval) clearInterval(refreshInterval)
    
    refreshInterval = setInterval(async () => {
      if (document.visibilityState === 'visible' && eventsState.initialized) {
        try {
          console.log('🔄 Auto-refresh del store...')
          await eventsStore.refresh()
        } catch (error) {
          console.warn('Auto-refresh falló:', error)
        }
      }
    }, 5 * 60 * 1000) // 5 minutos
  }
  
  // Iniciar auto-refresh cuando el store esté inicializado
  const checkInitialized = () => {
    if (eventsState.initialized) {
      startAutoRefresh()
    } else {
      setTimeout(checkInitialized, 1000)
    }
  }
  
  checkInitialized()
  
  // Pausar/reanudar auto-refresh según visibilidad
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startAutoRefresh()
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  })
}

export default eventsStore