import { reactive } from 'vue'
// @ts-ignore
import { supabase } from '@/services/supabase.js'

// Interfaces
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
    
    return eventsState.guests
      .filter(g => g.event_id === eventsState.currentEventId)
      .map(g => ({
        ...g,
        sent: g.qr_sent,
        scanned: g.has_entered,
        table: g.table_number
      }))
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
      confirmed: eventGuests.filter(g => g.has_entered).length,
      sent: eventGuests.filter(g => g.qr_sent).length,
      scanned: eventGuests.filter(g => g.has_entered).length,
      pending: eventGuests.filter(g => !g.qr_sent).length
    }
  },

  // Inicializar datos desde Supabase
  async init() {
    eventsState.loading = true
    eventsState.error = null

    try {
      await this.loadFromSupabase()
      
      // Si no hay eventos, crear uno por defecto
      if (eventsState.events.length === 0) {
        await this.createDefaultEvent()
      }

      // Si no hay evento actual, seleccionar el primero
      if (!eventsState.currentEventId && eventsState.events.length > 0) {
        eventsState.currentEventId = eventsState.events[0].id
        this.saveCurrentEventLocal()
      }

      console.log('✅ Eventos inicializados:', eventsState.events.length)
    } catch (error) {
      console.error('❌ Error inicializando:', error)
      this.loadFromLocalStorage()
    } finally {
      eventsState.loading = false
    }
  },

  // Cargar datos desde Supabase
  async loadFromSupabase() {
    try {
      // Cargar eventos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

      // Cargar invitados
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false })

      if (guestsError) throw guestsError

      eventsState.events = events || []
      eventsState.guests = guests || []

      // Cargar evento actual desde localStorage
      const savedCurrentEvent = localStorage.getItem('current_event_id')
      if (savedCurrentEvent && eventsState.events.find(e => e.id === savedCurrentEvent)) {
        eventsState.currentEventId = savedCurrentEvent
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error)
      throw error
    }
  },

  // Fallback: Cargar desde localStorage
  loadFromLocalStorage() {
    try {
      const savedEvents = localStorage.getItem('events_data')
      const savedGuests = localStorage.getItem('guests_data')
      const savedCurrentEvent = localStorage.getItem('current_event_id')

      if (savedEvents) eventsState.events = JSON.parse(savedEvents)
      if (savedGuests) eventsState.guests = JSON.parse(savedGuests)
      if (savedCurrentEvent) eventsState.currentEventId = savedCurrentEvent

      console.log('⚠️ Usando datos locales como fallback')
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      eventsState.error = 'Error cargando eventos'
    }
  },

  // Crear evento por defecto
  async createDefaultEvent() {
    const defaultEvent = {
      name: 'Mi Primer Evento',
      description: 'Evento de ejemplo',
      date: new Date().toISOString().split('T')[0],
      location: 'Ubicación del evento',
      max_guests: 100,
      is_active: true
    }

    const createdEvent = await this.createEvent(defaultEvent)
    eventsState.currentEventId = createdEvent.id
    this.saveCurrentEventLocal()
  },

  // Crear nuevo evento
  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    eventsState.loading = true
    eventsState.error = null

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
      console.log('✅ Evento creado:', data.name)
      return data
    } catch (error) {
      console.error('❌ Error creating event:', error)
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Actualizar evento
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    eventsState.loading = true

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

      console.log('✅ Evento actualizado:', eventId)
    } catch (error) {
      console.error('❌ Error updating event:', error)
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Eliminar evento
  async deleteEvent(eventId: string): Promise<void> {
    eventsState.loading = true

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error

      // Actualizar estado local (los invitados se eliminan automáticamente por CASCADE)
      eventsState.events = eventsState.events.filter(e => e.id !== eventId)
      eventsState.guests = eventsState.guests.filter(g => g.event_id !== eventId)

      // Si era el evento actual, cambiar a otro
      if (eventsState.currentEventId === eventId) {
        eventsState.currentEventId = eventsState.events.length > 0 ? eventsState.events[0].id : null
        this.saveCurrentEventLocal()
      }

      console.log('✅ Evento eliminado:', eventId)
    } catch (error) {
      console.error('❌ Error deleting event:', error)
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

  // Agregar invitado
  async addGuest(guestData: Omit<Guest, 'id' | 'created_at' | 'event_id' | 'event_name' | 'qr_sent' | 'has_entered'>): Promise<Guest> {
    if (!eventsState.currentEventId) {
      throw new Error('No hay evento seleccionado')
    }

    const currentEvent = this.currentEvent
    if (!currentEvent) {
      throw new Error('Evento actual no encontrado')
    }

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: guestData.name,
          email: guestData.email.toLowerCase(),
          phone: guestData.phone || null,
          event_id: eventsState.currentEventId,
          event_name: currentEvent.name,
          qr_sent: false,
          has_entered: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Añadir aliases para compatibilidad
      const guestWithAliases = {
        ...data,
        sent: data.qr_sent,
        scanned: data.has_entered,
        table: data.table_number
      }

      eventsState.guests.push(guestWithAliases)
      console.log('✅ Invitado agregado:', data.name)
      return guestWithAliases

    } catch (error) {
      console.error('❌ Error adding guest:', error)
      throw error
    }
  },

  // Actualizar invitado
  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId)
        .select()
        .single()

      if (error) throw error

      // Actualizar estado local
      const index = eventsState.guests.findIndex(g => g.id === guestId)
      if (index !== -1) {
        eventsState.guests[index] = {
          ...data,
          sent: data.qr_sent,
          scanned: data.has_entered,
          table: data.table_number
        }
      }

      console.log('✅ Invitado actualizado')
    } catch (error) {
      console.error('❌ Error updating guest:', error)
      throw error
    }
  },

  // Eliminar invitado
  async deleteGuest(guestId: string): Promise<void> {
    try {
      const { error } = await supabase.from('guests').delete().eq('id', guestId)
      if (error) throw error

      eventsState.guests = eventsState.guests.filter(g => g.id !== guestId)
      console.log('✅ Invitado eliminado')
    } catch (error) {
      console.error('❌ Error deleting guest:', error)
      throw error
    }
  },

  // Función de compatibilidad para saveGuests
  async saveGuests() {
    try {
      for (const guest of eventsState.guests) {
        await supabase
          .from('guests')
          .update({
            qr_sent: guest.qr_sent,
            has_entered: guest.has_entered,
            sent_at: guest.sent_at,
            entered_at: guest.entered_at
          })
          .eq('id', guest.id)
      }
      console.log('✅ Estados guardados')
    } catch (error) {
      console.error('❌ Error saving guests:', error)
      this.saveToLocalStorage()
    }
  },

  // Utilidades
  generateId(): string {
    return 'evt_' + Math.random().toString(36).substr(2, 9)
  },

  saveCurrentEventLocal() {
    if (eventsState.currentEventId) {
      localStorage.setItem('current_event_id', eventsState.currentEventId)
    } else {
      localStorage.removeItem('current_event_id')
    }
  },

  saveToLocalStorage() {
    localStorage.setItem('events_data', JSON.stringify(eventsState.events))
    localStorage.setItem('guests_data', JSON.stringify(eventsState.guests))
    this.saveCurrentEventLocal()
  },

  clearError() {
    eventsState.error = null
  },

  async forceReload() {
    await this.loadFromSupabase()
  }
}

export default eventsStore