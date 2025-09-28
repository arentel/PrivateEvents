import { reactive, computed } from 'vue'
// ✅ CAMBIAR ESTA IMPORTACIÓN - usar supabase directamente
import { supabase } from '@/services/supabase.js'

// Interfaces y tipos (mantener igual)
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

// Estado global simplificado
const eventsState = reactive({
  events: [] as Event[],
  currentEventId: null as string | null,
  guests: [] as Guest[],
  initialized: false,
  loading: false,
  error: null as string | null
})

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
    
    return eventsState.guests
      .filter((g: Guest) => g.event_id === eventsState.currentEventId)
      .map((g: Guest) => ({
        ...g,
        sent: g.qr_sent,
        scanned: g.has_entered,
        table: g.table_number
      }))
  },

  get initialized(): boolean {
    return eventsState.initialized
  },

  get loading(): boolean {
    return eventsState.loading
  },

  get error(): string | null {
    return eventsState.error
  },

  // Estadísticas simplificadas
  get currentEventStats() {
    if (!eventsState.currentEventId) {
      return { total: 0, confirmed: 0, sent: 0, scanned: 0, pending: 0 }
    }

    const eventGuests = this.currentEventGuests
    return {
      total: eventGuests.length,
      confirmed: eventGuests.filter((g: Guest) => g.has_entered).length,
      sent: eventGuests.filter((g: Guest) => g.qr_sent).length,
      scanned: eventGuests.filter((g: Guest) => g.has_entered).length,
      pending: eventGuests.filter((g: Guest) => !g.qr_sent).length
    }
  },

  // ✅ INICIALIZACIÓN CORREGIDA
  async init(force = false): Promise<void> {
    if (eventsState.initialized && !force) {
      console.log('📦 Store ya inicializado')
      return
    }

    eventsState.loading = true
    eventsState.error = null

    try {
      console.log('🔄 Inicializando eventos store...')
      
      // ✅ Cargar eventos desde Supabase
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.error('Error cargando eventos:', eventsError)
        // Crear evento por defecto si no hay eventos
        await this.createDefaultEvent()
      } else {
        eventsState.events = events || []
      }

      // ✅ Cargar invitados desde Supabase  
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false })

      if (guestsError) {
        console.error('Error cargando invitados:', guestsError)
        eventsState.guests = []
      } else {
        eventsState.guests = guests || []
      }

      // Establecer evento actual si no existe
      if (!eventsState.currentEventId && eventsState.events.length > 0) {
        eventsState.currentEventId = eventsState.events[0].id
      }

      eventsState.initialized = true
      
      console.log('✅ Store inicializado:', {
        eventos: eventsState.events.length,
        invitados: eventsState.guests.length,
        eventoActual: this.currentEvent?.name
      })

    } catch (error: any) {
      console.error('❌ Error inicializando store:', error)
      eventsState.error = error?.message || 'Error desconocido'
      
      // Crear evento por defecto en caso de error crítico
      try {
        await this.createDefaultEvent()
      } catch (fallbackError) {
        console.error('Error creando evento por defecto:', fallbackError)
      }
    } finally {
      eventsState.loading = false
    }
  },

  // ✅ CREAR EVENTO POR DEFECTO
  async createDefaultEvent(): Promise<void> {
    try {
      const defaultEvent = {
        name: 'Evento por defecto',
        description: 'Evento creado automáticamente',
        date: new Date().toISOString().split('T')[0],
        location: 'Ubicación por definir',
        max_guests: 100,
        is_active: true
      }

      const { data, error } = await supabase
        .from('events')
        .insert([defaultEvent])
        .select()
        .single()

      if (error) throw error

      eventsState.events = [data]
      eventsState.currentEventId = data.id
      
      console.log('✅ Evento por defecto creado:', data.name)
    } catch (error) {
      console.error('Error creando evento por defecto:', error)
      
      // Fallback: crear evento local temporal
      const tempEvent = {
        id: 'temp-' + Date.now(),
        name: 'Evento temporal',
        description: 'Evento temporal hasta conectar con BD',
        date: new Date().toISOString().split('T')[0],
        location: 'Temporal',
        max_guests: 100,
        email_template: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
      
      eventsState.events = [tempEvent]
      eventsState.currentEventId = tempEvent.id
    }
  },

  // ✅ RECARGAR FORZADO
  async forceReload(): Promise<void> {
    return this.init(true)
  },

  // Establecer evento actual
  setCurrentEvent(eventId: string): void {
    eventsState.currentEventId = eventId
    console.log('🎯 Evento actual cambiado:', this.currentEvent?.name)
  },

  // ✅ CREAR EVENTO CORREGIDO
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      eventsState.events.unshift(data)
      
      // Establecer como evento actual si es el primero
      if (eventsState.events.length === 1) {
        eventsState.currentEventId = data.id
      }
      
      console.log('✅ Evento creado:', data.name)
      return data
      
    } catch (error) {
      console.error('❌ Error creando evento:', error)
      throw error
    }
  },

  // ✅ ACTUALIZAR EVENTO CORREGIDO
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
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

      const index = eventsState.events.findIndex((e: Event) => e.id === eventId)
      if (index !== -1) {
        eventsState.events[index] = data
      }
      
      console.log('✅ Evento actualizado:', data.name)
      return data
      
    } catch (error) {
      console.error('❌ Error actualizando evento:', error)
      throw error
    }
  },

  // ✅ AGREGAR INVITADO CORREGIDO
  async addGuest(guestData: Partial<Guest>): Promise<Guest> {
    try {
      if (!eventsState.currentEventId) {
        throw new Error('No hay evento seleccionado')
      }

      const { data, error } = await supabase
        .from('guests')
        .insert([{
          ...guestData,
          event_id: eventsState.currentEventId,
          qr_sent: false,
          has_entered: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      eventsState.guests.unshift(data)
      
      console.log('✅ Invitado creado:', data.name)
      return data
      
    } catch (error) {
      console.error('❌ Error creando invitado:', error)
      throw error
    }
  },

  // ✅ ELIMINAR INVITADO CORREGIDO
  async deleteGuest(guestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId)

      if (error) throw error

      eventsState.guests = eventsState.guests.filter((g: Guest) => g.id !== guestId)
      
      console.log('✅ Invitado eliminado')
      return true
      
    } catch (error) {
      console.error('❌ Error eliminando invitado:', error)
      throw error
    }
  },

  // ELIMINAR EVENTO CORREGIDO
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

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
      
      console.log('✅ Evento eliminado')
      return true
      
    } catch (error) {
      console.error('❌ Error eliminando evento:', error)
      throw error
    }
  },

  // ACTUALIZAR INVITADO CORREGIDO
  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId)
        .select()
        .single()

      if (error) throw error

      const index = eventsState.guests.findIndex((g: Guest) => g.id === guestId)
      if (index !== -1) {
        eventsState.guests[index] = data
      }
      
      console.log('✅ Invitado actualizado:', data.name)
      return data
      
    } catch (error) {
      console.error('❌ Error actualizando invitado:', error)
      throw error
    }
  },

  // MARCAR COMO INGRESADO - Para scanner
  async markGuestAsEntered(guestId: string): Promise<Guest> {
    try {
      const madridTime = new Date().toLocaleString('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6')

      const { data, error } = await supabase
        .from('guests')
        .update({
          has_entered: true,
          entered_at: madridTime
        })
        .eq('id', guestId)
        .select()
        .single()

      if (error) throw error

      const index = eventsState.guests.findIndex((g: Guest) => g.id === guestId)
      if (index !== -1) {
        eventsState.guests[index] = data
      }
      
      console.log('✅ Invitado marcado como ingresado:', data.name)
      return data
      
    } catch (error) {
      console.error('❌ Error marcando ingreso:', error)
      throw error
    }
  },

  // BUSCAR INVITADOS - Para funcionalidad de búsqueda
  async searchGuests(searchTerm: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`🔍 Encontrados ${data?.length || 0} invitados para: "${searchTerm}"`)
      return data || []
      
    } catch (error) {
      console.error('❌ Error buscando invitados:', error)
      return []
    }
  },

  // CREAR MÚLTIPLES INVITADOS - Para AddGuests en masa
  async createMultipleGuests(guestsData: Partial<Guest>[]): Promise<Guest[]> {
    try {
      if (!eventsState.currentEventId) {
        throw new Error('No hay evento seleccionado')
      }

      const guestsToInsert = guestsData.map(guest => ({
        ...guest,
        event_id: eventsState.currentEventId,
        qr_sent: false,
        has_entered: false,
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select()

      if (error) throw error

      eventsState.guests.unshift(...(data || []))
      
      console.log(`✅ ${data?.length || 0} invitados creados`)
      return data || []
      
    } catch (error) {
      console.error('❌ Error creando invitados múltiples:', error)
      throw error
    }
  },

  // ALIAS para compatibilidad con SendTab.vue
  async createGuest(guestData: Partial<Guest>): Promise<Guest> {
    return this.addGuest(guestData)
  },

  // OBTENER EVENTO POR ID - Para funcionalidades específicas
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error

      return data
      
    } catch (error) {
      console.error('❌ Error obteniendo evento:', error)
      return null
    }
  },

  // OBTENER INVITADOS POR EVENTO - Para funcionalidades específicas  
  async getGuestsByEvent(eventId: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
      
    } catch (error) {
      console.error('❌ Error obteniendo invitados del evento:', error)
      return []
    }
  },

  // ESTADÍSTICAS GLOBALES - Para ReportsTab
  async getGlobalStats(): Promise<any> {
    try {
      const guests = eventsState.guests
      const stats = {
        total: guests.length,
        sent: guests.filter((g: Guest) => g.qr_sent).length,
        entered: guests.filter((g: Guest) => g.has_entered).length,
        byEvent: {} as Record<string, any>
      }

      // Calcular por evento
      eventsState.events.forEach(event => {
        const eventGuests = guests.filter(g => g.event_id === event.id)
        stats.byEvent[event.id] = {
          name: event.name,
          total: eventGuests.length,
          sent: eventGuests.filter(g => g.qr_sent).length,
          entered: eventGuests.filter(g => g.has_entered).length
        }
      })

      return stats
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      return null
    }
  },

  // VERIFICAR CONEXIÓN
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('count')
        .limit(1)

      return !error
      
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
    eventsState.loading = false
    eventsState.error = null
    console.log('🔄 Store reseteado')
  }
}

export default eventsStore