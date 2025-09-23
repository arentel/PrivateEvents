import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Funciones de utilidad para la base de datos
export const db = {
  // Obtener todos los invitados
  async getAllGuests() {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Obtener invitados por evento
  async getGuestsByEvent(eventName) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_name', eventName)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Obtener invitado por ID
  async getGuestById(id) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Obtener invitado por email
  async getGuestByEmail(email) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  },

  // Buscar invitados por nombre o email
  async searchGuests(searchTerm) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Crear nuevo invitado
  async createGuest(guestData) {
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
  },

  // Crear múltiples invitados
  async createMultipleGuests(guestsData) {
    const guests = guestsData.map(guest => ({
      name: guest.name,
      email: guest.email.toLowerCase(),
      event_name: guest.event_name,
      qr_sent: false,
      has_entered: false
    }))

    const { data, error } = await supabase
      .from('guests')
      .insert(guests)
      .select()
    
    if (error) throw error
    return data || []
  },

  // Actualizar datos del invitado
  async updateGuest(id, updates) {
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Marcar QR como enviado
  async markQRSent(id, qrCode) {
    const { data, error } = await supabase
      .from('guests')
      .update({
        qr_code: qrCode,
        qr_sent: true,
        qr_sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Marcar como ingresado
  async markAsEntered(id) {
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
  },

  // Obtener estadísticas
  async getStats() {
    const { data, error } = await supabase
      .from('guests')
      .select('qr_sent, has_entered')
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      qrsSent: data.filter(g => g.qr_sent).length,
      attended: data.filter(g => g.has_entered).length,
      pending: data.filter(g => !g.qr_sent).length
    }

    stats.attendanceRate = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0

    return stats
  },

  // Obtener asistentes del día
  async getTodayAttendees() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('has_entered', true)
      .gte('entered_at', `${today}T00:00:00`)
      .lte('entered_at', `${today}T23:59:59`)
      .order('entered_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Obtener estadísticas por hora
  async getHourlyStats() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('guests')
      .select('entered_at')
      .eq('has_entered', true)
      .gte('entered_at', `${today}T00:00:00`)
      .lte('entered_at', `${today}T23:59:59`)
    
    if (error) throw error
    
    const hourCounts = {}
    
    data.forEach(guest => {
      const hour = new Date(guest.entered_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    return hourCounts
  },

  // Eliminar invitado
  async deleteGuest(id) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Eliminar todos los invitados
  async deleteAllGuests() {
    const { error } = await supabase
      .from('guests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos
    
    if (error) throw error
    return true
  },

  // Verificar conexión
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
  }
}

// Funciones para eventos en tiempo real (opcional)
export const realtime = {
  // Suscribirse a cambios en la tabla guests
  subscribeToGuests(callback) {
    return supabase
      .channel('guests-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'guests' 
        }, 
        callback
      )
      .subscribe()
  },

  // Desuscribirse de cambios
  unsubscribe(subscription) {
    supabase.removeChannel(subscription)
  }
}

// Manejo de errores centralizado
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  
  // Errores comunes y sus mensajes amigables
  const errorMessages = {
    '23505': 'Este email ya existe en la lista',
    'PGRST116': 'No se encontraron resultados',
    '42P01': 'Tabla no encontrada - verifica la configuración de la base de datos',
    '28P01': 'Error de autenticación - verifica las credenciales'
  }
  
  const userMessage = errorMessages[error.code] || error.message || 'Error desconocido'
  
  return {
    success: false,
    error: userMessage,
    details: error
  }
}

// Función para inicializar la base de datos (crear tablas si no existen)
export const initializeDatabase = async () => {
  try {
    // Verificar si la tabla guests existe
    const { data, error } = await supabase
      .from('guests')
      .select('count')
      .limit(1)
    
    if (error && error.code === '42P01') {
      // La tabla no existe, necesita ser creada
      console.warn('La tabla guests no existe. Ejecuta el SQL de inicialización en Supabase.')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

export default supabase