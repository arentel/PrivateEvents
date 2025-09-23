import { reactive, computed } from 'vue'

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
  sent_at?: string // Agregar esta propiedad
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

  // Inicializar datos desde localStorage
  init() {
    try {
      const savedEvents = localStorage.getItem('events_data')
      const savedGuests = localStorage.getItem('guests_data')
      const savedCurrentEvent = localStorage.getItem('current_event_id')

      if (savedEvents) {
        eventsState.events = JSON.parse(savedEvents)
      }

      if (savedGuests) {
        eventsState.guests = JSON.parse(savedGuests)
      }

      if (savedCurrentEvent) {
        eventsState.currentEventId = savedCurrentEvent
      }

      // Si no hay eventos, crear uno por defecto
      if (eventsState.events.length === 0) {
        this.createDefaultEvent()
      }

      // Si no hay evento actual, seleccionar el primero
      if (!eventsState.currentEventId && eventsState.events.length > 0) {
        eventsState.currentEventId = eventsState.events[0].id
        this.saveCurrentEvent()
      }

      console.log('✅ Eventos inicializados:', eventsState.events.length)
    } catch (error) {
      console.error('Error loading events data:', error)
      eventsState.error = 'Error cargando eventos'
    }
  },

  // Crear evento por defecto
  createDefaultEvent() {
    const defaultEvent: Event = {
      id: this.generateId(),
      name: 'Mi Primer Evento',
      description: 'Evento de ejemplo',
      date: new Date().toISOString().split('T')[0],
      location: 'Ubicación del evento',
      max_guests: 100,
      email_template: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }

    eventsState.events.push(defaultEvent)
    eventsState.currentEventId = defaultEvent.id
    this.saveEvents()
    this.saveCurrentEvent()
  },

  // Crear nuevo evento
  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    eventsState.loading = true
    eventsState.error = null

    try {
      const newEvent: Event = {
        ...eventData,
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      eventsState.events.push(newEvent)
      this.saveEvents()

      console.log('✅ Evento creado:', newEvent.name)
      return newEvent
    } catch (error) {
      console.error('Error creating event:', error)
      eventsState.error = 'Error creando evento'
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
      const eventIndex = eventsState.events.findIndex(e => e.id === eventId)
      if (eventIndex === -1) {
        throw new Error('Evento no encontrado')
      }

      eventsState.events[eventIndex] = {
        ...eventsState.events[eventIndex],
        ...updates,
        updated_at: new Date().toISOString()
      }

      this.saveEvents()
      console.log('✅ Evento actualizado:', eventId)
    } catch (error) {
      console.error('Error updating event:', error)
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
      // Eliminar evento
      eventsState.events = eventsState.events.filter(e => e.id !== eventId)
      
      // Eliminar invitados del evento
      eventsState.guests = eventsState.guests.filter(g => g.event_id !== eventId)

      // Si era el evento actual, cambiar a otro
      if (eventsState.currentEventId === eventId) {
        eventsState.currentEventId = eventsState.events.length > 0 ? eventsState.events[0].id : null
      }

      this.saveEvents()
      this.saveGuests()
      this.saveCurrentEvent()

      console.log('✅ Evento eliminado:', eventId)
    } catch (error) {
      console.error('Error deleting event:', error)
      eventsState.error = 'Error eliminando evento'
      throw error
    } finally {
      eventsState.loading = false
    }
  },

  // Seleccionar evento actual
  setCurrentEvent(eventId: string) {
    const event = eventsState.events.find(e => e.id === eventId)
    if (event) {
      eventsState.currentEventId = eventId
      this.saveCurrentEvent()
      console.log('✅ Evento actual:', event.name)
    }
  },

  // Agregar invitado a evento actual
  async addGuest(guestData: Omit<Guest, 'id' | 'created_at' | 'event_id'>): Promise<Guest> {
    if (!eventsState.currentEventId) {
      throw new Error('No hay evento seleccionado')
    }

    const newGuest: Guest = {
      ...guestData,
      id: this.generateId(),
      event_id: eventsState.currentEventId,
      created_at: new Date().toISOString(),
      confirmed: false,
      scanned: false,
      sent: false
    }

    eventsState.guests.push(newGuest)
    this.saveGuests()

    return newGuest
  },

  // Importar invitados al evento actual
  async importGuests(guests: Omit<Guest, 'id' | 'created_at' | 'event_id'>[]): Promise<void> {
    if (!eventsState.currentEventId) {
      throw new Error('No hay evento seleccionado')
    }

    const newGuests = guests.map(guestData => ({
      ...guestData,
      id: this.generateId(),
      event_id: eventsState.currentEventId!,
      created_at: new Date().toISOString(),
      confirmed: false,
      scanned: false,
      sent: false
    }))

    eventsState.guests.push(...newGuests)
    this.saveGuests()

    console.log('✅ Importados', newGuests.length, 'invitados')
  },

  // Utilidades
  generateId(): string {
    return 'evt_' + Math.random().toString(36).substr(2, 9)
  },

  // Persistencia
  saveEvents() {
    localStorage.setItem('events_data', JSON.stringify(eventsState.events))
  },

  saveGuests() {
    localStorage.setItem('guests_data', JSON.stringify(eventsState.guests))
  },

  saveCurrentEvent() {
    if (eventsState.currentEventId) {
      localStorage.setItem('current_event_id', eventsState.currentEventId)
    } else {
      localStorage.removeItem('current_event_id')
    }
  },

  // Limpiar errores
  clearError() {
    eventsState.error = null
  }
}