import { reactive } from 'vue'
// @ts-ignore
import { supabase } from '@/services/supabase.js'

// Interfaces
export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  table?: string
  confirmed?: boolean
  scanned?: boolean
  sent?: boolean
  sent_at?: string
  created_at: string
  event_id: string
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

// Estado global de eventos
const eventsState = reactive({
  events: [] as Event[],
  currentEventId: null as string | null,
  guests: [] as Guest[],
  loading: false,
  error: null as string | null
})

// Store de eventos
export const eventsStore = {
  // Getters
  get events() {
    return eventsState.events
  },

  get currentEvent() {
    if (!eventsState.currentEventId) return null
    return eventsState.events.find(e => e.id === eventsState.currentEventId) || null
  },

  get currentEventId() {
    return eventsState.currentEventId
  },

  get guests() {
    return eventsState.guests
  },

  get currentEventGuests() {
    if (!eventsState.currentEventId) return []
    return eventsState.guests.filter(g => g.event_id === eventsState.currentEventId)
  },

  get loading() {
    return eventsState.loading
  },

  get error() {
    return eventsState.error
  },

  // Eventos activos
  get activeEvents() {
    return eventsState.events.filter(e => e.is_active)
  },

  // Estadísticas del evento actual
  get currentEventStats() {
    const eventGuests = this.currentEventGuests
    return {
      total: eventGuests.length,
      confirmed: eventGuests.filter(g => g.confirmed).length,
      sent: eventGuests.filter(g => g.sent).length,
      scanned: eventGuests.filter(g => g.scanned).length,
      pending: eventGuests.filter(g => !g.sent).length
    }
  },

  // Inicializar datos desde Supabase
  async init() {
    eventsState.loading = true
    eventsState.error = null

    try {
      console.log('🔄 Inicializando desde Supabase...')
      
      // SIEMPRE intentar cargar desde Supabase primero
      await this.loadFromSupabase()
      
      // Si no hay eventos, crear uno por defecto EN SUPABASE
      if (eventsState.events.length === 0) {
        console.log('📝 No hay eventos, creando evento por defecto...')
        await this.createDefaultEvent()
      }

      // Si no hay evento actual, seleccionar el primero
      if (!eventsState.currentEventId && eventsState.events.length > 0) {
        eventsState.currentEventId = eventsState.events[0].id
        this.saveCurrentEventLocal()
      }

      console.log('✅ Eventos inicializados desde Supabase:', {
        eventos: eventsState.events.length,
        invitados: eventsState.guests.length,
        eventoActual: this.currentEvent?.name
      })
    } catch (error: any) {
      console.error('❌ ERROR CRÍTICO - No se pudo conectar a Supabase:', error)
      eventsState.error = `Error de conexión a Supabase: ${error?.message || 'Error desconocido'}`
      
      // NO usar localStorage como fallback - mostrar error al usuario
      throw new Error('No se puede conectar a la base de datos. Verifica tu conexión a internet y la configuración de Supabase.')
    } finally {
      eventsState.loading = false
    }
  },

  // Cargar datos desde Supabase
  async loadFromSupabase() {
    console.log('📡 Conectando a Supabase...')
    
    try {
      // Verificar conexión a Supabase
      const { data: connectionTest, error: connectionError } = await supabase
        .from('guests')
        .select('count')
        .limit(1)

      if (connectionError && connectionError.code === '42P01') {
        throw new Error('La tabla "guests" no existe en Supabase. Ejecuta el SQL de inicialización.')
      }

      // Cargar eventos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (eventsError) {
        if (eventsError.code === '42P01') {
          throw new Error('La tabla "events" no existe en Supabase. Ejecuta el SQL de inicialización.')
        }
        throw eventsError
      }

      // Cargar invitados
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false })

      if (guestsError) throw guestsError

      eventsState.events = events || []
      eventsState.guests = guests || []

      console.log('📊 Datos cargados desde Supabase:', {
        eventos: eventsState.events.length,
        invitados: eventsState.guests.length
      })

      // Cargar evento actual desde localStorage
      const savedCurrentEvent = localStorage.getItem('current_event_id')
      if (savedCurrentEvent && eventsState.events.find(e => e.id === savedCurrentEvent)) {
        eventsState.currentEventId = savedCurrentEvent
      }
    } catch (error) {
      console.error('❌ Error específico en loadFromSupabase:', error)
      throw error
    }
  },

  // Crear evento por defecto EN SUPABASE
  async createDefaultEvent() {
    console.log('🆕 Creando evento por defecto en Supabase...')
    
    const defaultEvent = {
      name: 'Mi Primer Evento',
      description: 'Evento de ejemplo',
      date: new Date().toISOString().split('T')[0],
      location: 'Ubicación del evento',
      max_guests: 100,
      is_active: true
    }

    try {
      const createdEvent = await this.createEvent(defaultEvent)
      eventsState.currentEventId = createdEvent.id
      this.saveCurrentEventLocal()
      console.log('✅ Evento por defecto creado:', createdEvent.name)
    } catch (error) {
      console.error('❌ Error creando evento por defecto:', error)
      throw error
    }
  },

  // Crear nuevo evento en Supabase SOLAMENTE
  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    eventsState.loading = true
    eventsState.error = null

    try {
      console.log('📝 Creando evento en Supabase:', eventData.name)
      
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Error de Supabase al crear evento:', error)
        throw error
      }

      eventsState.events.unshift(data)
      console.log('✅ Evento creado exitosamente en Supabase:', data.name)
      return data
    } catch (error: any) {
      console.error('❌ Error creating event in Supabase:', error)
      eventsState.error = `Error creando evento: ${error?.message || 'Error desconocido'}`
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Actualizar evento
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    eventsState.loading = true
    eventsState.error = null

    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error

      const eventIndex = eventsState.events.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        eventsState.events[eventIndex] = data
      }

      console.log('✅ Evento actualizado en Supabase:', eventId)
    } catch (error) {
      console.error('❌ Error updating event:', error)
      eventsState.error = 'Error actualizando evento'
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Eliminar evento
  async deleteEvent(eventId: string): Promise<void> {
    eventsState.loading = true
    eventsState.error = null

    try {
      // Eliminar de Supabase
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      // Eliminar invitados del evento
      await supabase
        .from('guests')
        .delete()
        .eq('event_id', eventId)

      // Actualizar estado local
      eventsState.events = eventsState.events.filter(e => e.id !== eventId)
      eventsState.guests = eventsState.guests.filter(g => g.event_id !== eventId)

      // Si era el evento actual, cambiar a otro
      if (eventsState.currentEventId === eventId) {
        eventsState.currentEventId = eventsState.events.length > 0 ? eventsState.events[0].id : null
        this.saveCurrentEventLocal()
      }

      console.log('✅ Evento eliminado de Supabase:', eventId)
    } catch (error) {
      console.error('❌ Error deleting event:', error)
      eventsState.error = 'Error eliminando evento'
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Seleccionar evento actual
  setCurrentEvent(eventId: string): void {
    const event = eventsState.events.find(e => e.id === eventId)
    if (event) {
      eventsState.currentEventId = eventId
      this.saveCurrentEventLocal()
      console.log('✅ Evento actual:', event.name)
    }
  },

  // Agregar invitado al evento actual - USANDO SUPABASE
  async addGuest(guestData: Omit<Guest, 'id' | 'created_at' | 'event_id'>): Promise<Guest> {
    if (!eventsState.currentEventId) {
      throw new Error('No hay evento seleccionado')
    }

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: guestData.name,
          email: guestData.email.toLowerCase(),
          phone: guestData.phone || null,
          event_id: eventsState.currentEventId,
          // Mantener compatibilidad con event_name si existe en la tabla
          event_name: this.currentEvent?.name || 'Evento',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Actualizar estado local
      eventsState.guests.push(data)
      console.log('✅ Invitado agregado a Supabase:', data.name)
      return data
    } catch (error) {
      console.error('❌ Error adding guest to Supabase:', error)
      throw error
    }
  },

  // Importar invitados masivamente
  async importGuests(guests: Omit<Guest, 'id' | 'created_at' | 'event_id'>[]): Promise<void> {
    if (!eventsState.currentEventId) {
      throw new Error('No hay evento seleccionado')
    }

    try {
      const guestsToInsert = guests.map((guestData: Omit<Guest, 'id' | 'created_at' | 'event_id'>) => ({
        name: guestData.name,
        email: guestData.email.toLowerCase(),
        phone: guestData.phone || null,
        event_id: eventsState.currentEventId,
        event_name: this.currentEvent?.name || 'Evento',
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select()

      if (error) throw error

      // Actualizar estado local
      eventsState.guests.push(...data)
      console.log('✅ Importados', data.length, 'invitados a Supabase')
    } catch (error) {
      console.error('❌ Error importing guests:', error)
      throw error
    }
  },

  // Guardar invitados (para actualizar estados como sent, scanned, etc.)
  async saveGuests() {
    // Esta función ahora actualiza invitados individuales en Supabase
    // Se usará para actualizar campos como sent, scanned, sent_at
    try {
      for (const guest of eventsState.guests) {
        if (guest.id.startsWith('evt_')) {
          // Es un ID local, necesita sincronización completa con Supabase
          continue
        }
        
        // Actualizar en Supabase si hay cambios
        await supabase
          .from('guests')
          .update({
            sent: guest.sent || false,
            scanned: guest.scanned || false,
            sent_at: guest.sent_at || null,
            confirmed: guest.confirmed || false
          })
          .eq('id', guest.id)
      }
    } catch (error) {
      console.error('❌ Error saving guests to Supabase:', error)
      // Si falla, lanzar error en lugar de usar localStorage
      throw new Error('Error guardando invitados en la base de datos')
    }
  },

  // Utilidades
  generateId(): string {
    return 'evt_' + Math.random().toString(36).substr(2, 9)
  },

  // Solo guardar evento actual en localStorage (para UX)
  saveCurrentEventLocal() {
    if (eventsState.currentEventId) {
      localStorage.setItem('current_event_id', eventsState.currentEventId)
    } else {
      localStorage.removeItem('current_event_id')
    }
  },

  // Limpiar errores
  clearError() {
    eventsState.error = null
  },

  // Forzar recarga desde Supabase
  async forceReload() {
    console.log('🔄 Forzando recarga desde Supabase...')
    await this.loadFromSupabase()
  },

  // Función para limpiar localStorage (solo para debugging)
  clearLocalStorage() {
    localStorage.removeItem('events_data')
    localStorage.removeItem('guests_data') 
    localStorage.removeItem('current_event_id')
    console.log('🧹 localStorage limpiado')
  }
}