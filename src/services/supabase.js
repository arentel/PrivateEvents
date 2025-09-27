import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase optimizada
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limitar eventos en tiempo real
    }
  },
  // Configuración de red optimizada
  global: {
    headers: {
      'cache-control': 'max-age=300' // Cache por 5 minutos
    }
  }
})

// Cache en memoria para datos frecuentemente accedidos
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Función helper para cache
const getCached = (key) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

// Función de retry automático
const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Si es un error de red o timeout, reintentar
      if (error.message?.includes('fetch') || 
          error.message?.includes('network') ||
          error.message?.includes('timeout')) {
        
        if (i < maxRetries - 1) {
          console.log(`Reintentando operación (${i + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
          continue
        }
      }
      
      // Si no es un error recuperable, lanzar inmediatamente
      throw error
    }
  }
  
  throw lastError
}

// Funciones de utilidad optimizadas para la base de datos
export const db = {
  // Obtener todos los invitados con cache
  async getAllGuests() {
    const cacheKey = 'all_guests'
    const cached = getCached(cacheKey)
    if (cached) {
      console.log('📦 Usando datos cacheados para invitados')
      return cached
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const result = data || []
      setCache(cacheKey, result)
      return result
    })
  },

  // Obtener invitados por evento con optimización
  async getGuestsByEvent(eventName) {
    const cacheKey = `guests_${eventName}`
    const cached = getCached(cacheKey)
    if (cached) {
      console.log(`📦 Usando datos cacheados para evento: ${eventName}`)
      return cached
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_name', eventName)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const result = data || []
      setCache(cacheKey, result)
      return result
    })
  },

  // Obtener solo los campos necesarios para listados
  async getGuestsMinimal() {
    const cacheKey = 'guests_minimal'
    const cached = getCached(cacheKey)
    if (cached) {
      return cached
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('id, name, email, event_name, qr_sent, has_entered, created_at')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const result = data || []
      setCache(cacheKey, result)
      return result
    })
  },

  // Obtener invitado por ID con cache
  async getGuestById(id) {
    const cacheKey = `guest_${id}`
    const cached = getCached(cacheKey)
    if (cached) {
      return cached
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      setCache(cacheKey, data)
      return data
    })
  },

  // Obtener invitado por email con cache
  async getGuestByEmail(email) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    })
  },

  // Buscar invitados optimizado
  async searchGuests(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return []

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('id, name, email, event_name, qr_sent, has_entered')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('name')
        .limit(50) // Limitar resultados
      
      if (error) throw error
      return data || []
    })
  },

  // Crear nuevo invitado y limpiar cache relacionado
  async createGuest(guestData) {
    const result = await withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: guestData.name,
          email: guestData.email.toLowerCase(),
          event_name: guestData.event_name,
          qr_sent: false,
          has_entered: false
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    })

    // Limpiar cache relacionado
    this.clearRelatedCache(result.event_name)
    return result
  },

  // Crear múltiples invitados optimizado
  async createMultipleGuests(guestsData) {
    const guests = guestsData.map(guest => ({
      name: guest.name,
      email: guest.email.toLowerCase(),
      event_name: guest.event_name,
      qr_sent: false,
      has_entered: false
    }))

    // Procesar en lotes para evitar timeouts
    const BATCH_SIZE = 100
    const results = []

    for (let i = 0; i < guests.length; i += BATCH_SIZE) {
      const batch = guests.slice(i, i + BATCH_SIZE)
      
      const batchResult = await withRetry(async () => {
        const { data, error } = await supabase
          .from('guests')
          .insert(batch)
          .select()
        
        if (error) throw error
        return data || []
      })

      results.push(...batchResult)
    }

    // Limpiar cache para todos los eventos afectados
    const affectedEvents = [...new Set(guestsData.map(g => g.event_name))]
    affectedEvents.forEach(eventName => {
      this.clearRelatedCache(eventName)
    })

    return results
  },

  // Actualizar datos del invitado
  async updateGuest(id, updates) {
    const result = await withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    })

    // Limpiar cache relacionado
    cache.delete(`guest_${id}`)
    this.clearRelatedCache(result.event_name)
    return result
  },

  // Marcar como ingresado con actualización optimizada
  async markAsEntered(id) {
    const result = await withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .update({ 
          has_entered: true, 
          entered_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    })

    // Limpiar cache relacionado
    cache.delete(`guest_${id}`)
    this.clearRelatedCache(result.event_name)
    return result
  },

  // Eliminar invitado
  async deleteGuest(id) {
    // Obtener datos antes de eliminar para limpiar cache
    const guest = await this.getGuestById(id)
    
    await withRetry(async () => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    })

    // Limpiar cache relacionado
    cache.delete(`guest_${id}`)
    if (guest) {
      this.clearRelatedCache(guest.event_name)
    }
    
    return true
  },

  // Eliminar todos los invitados
  async deleteAllGuests() {
    await withRetry(async () => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (error) throw error
      return true
    })

    // Limpiar todo el cache
    cache.clear()
    return true
  },

  // Verificar conexión mejorada
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('count')
        .limit(1)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  },

  // Obtener estadísticas básicas con cache
  async getBasicStats() {
    const cacheKey = 'basic_stats'
    const cached = getCached(cacheKey)
    if (cached) {
      return cached
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('event_name, qr_sent, has_entered')
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        sent: data.filter(g => g.qr_sent).length,
        entered: data.filter(g => g.has_entered).length,
        byEvent: {}
      }

      // Agrupar por evento
      data.forEach(guest => {
        if (!stats.byEvent[guest.event_name]) {
          stats.byEvent[guest.event_name] = {
            total: 0,
            sent: 0,
            entered: 0
          }
        }
        stats.byEvent[guest.event_name].total++
        if (guest.qr_sent) stats.byEvent[guest.event_name].sent++
        if (guest.has_entered) stats.byEvent[guest.event_name].entered++
      })

      setCache(cacheKey, stats)
      return stats
    })
  },

  // Limpiar cache relacionado con un evento
  clearRelatedCache(eventName) {
    const keysToDelete = []
    for (const key of cache.keys()) {
      if (key.includes('all_guests') || 
          key.includes('guests_minimal') ||
          key.includes('basic_stats') ||
          key.includes(`guests_${eventName}`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => cache.delete(key))
  },

  // Limpiar todo el cache manualmente
  clearAllCache() {
    cache.clear()
    console.log('🗑️ Cache limpiado completamente')
  }
}

// Funciones para eventos en tiempo real optimizadas
export const realtime = {
  subscribeToGuests(callback) {
    return supabase
      .channel('guests-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'guests' 
        }, 
        (payload) => {
          // Limpiar cache cuando hay cambios
          db.clearAllCache()
          callback(payload)
        }
      )
      .subscribe()
  },

  unsubscribe(subscription) {
    supabase.removeChannel(subscription)
  }
}

// Manejo de errores centralizado mejorado
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  
  const errorMessages = {
    '23505': 'Este email ya existe en la lista',
    'PGRST116': 'No se encontraron resultados',
    '42P01': 'Tabla no encontrada - verifica la configuración de la base de datos',
    '28P01': 'Error de autenticación - verifica las credenciales',
    'PGRST301': 'Error de conexión - verifica tu conexión a internet'
  }
  
  const userMessage = errorMessages[error.code] || error.message || 'Error de conexión. Intenta de nuevo.'
  
  return {
    success: false,
    error: userMessage,
    details: error,
    retryable: ['PGRST301', 'fetch'].some(code => 
      error.code === code || error.message?.includes('fetch')
    )
  }
}

// Función para inicializar la base de datos
export const initializeDatabase = async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('count')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.warn('La tabla guests no existe. Ejecuta el SQL de inicialización en Supabase.')
      return false
    }
    
    console.log('✅ Base de datos inicializada correctamente')
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

// Limpiar cache automáticamente cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

export default supabase