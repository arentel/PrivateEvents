// Archivo de tipos para supabase.js
// Ubicar en: src/types/supabase.d.ts

declare module '@/services/supabase.js' {
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

  export const db: {
    getAllGuests(): Promise<Guest[]>
    getGuestsByEvent(eventName: string): Promise<Guest[]>
    getGuestById(id: string): Promise<Guest>
    getGuestByEmail(email: string): Promise<Guest | null>
    searchGuests(searchTerm: string): Promise<Guest[]>
    createGuest(guestData: Partial<Guest>): Promise<Guest>
    createMultipleGuests(guestsData: Partial<Guest>[]): Promise<Guest[]>
    updateGuest(id: string, updates: Partial<Guest>): Promise<Guest>
    markAsEntered(id: string): Promise<Guest>
    deleteGuest(id: string): Promise<boolean>
    deleteAllGuests(): Promise<boolean>
    testConnection(): Promise<boolean>
    getBasicStats?(): Promise<any>
    
    // Métodos de eventos (opcionales)
    getAllEvents?(): Promise<Event[]>
    createEvent?(eventData: Partial<Event>): Promise<Event>
    updateEvent?(eventId: string, updates: Partial<Event>): Promise<Event>
    deleteEvent?(eventId: string): Promise<boolean>
  }

  export const supabase: any
  export const realtime: {
    subscribeToGuests(callback: (payload: any) => void): any
    unsubscribe(subscription: any): void
  }
  export const handleSupabaseError: (error: any) => any
  export const initializeDatabase: () => Promise<boolean>
}