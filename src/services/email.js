import { generateQRImage } from './qr.js'

// Configuración EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Configuración de envío paralelo
const BATCH_SIZE = 15
const BATCH_DELAY = 500
const EMAIL_TIMEOUT = 8000
const MAX_RETRIES = 2

/**
 * Sistema de almacenamiento robusto que funciona en móviles
 */
class TicketStorage {
  constructor() {
    this.storageKey = 'qr_tickets'
    this.codesKey = 'ticket_codes'
    this.init()
  }

  init() {
    // Verificar si localStorage está disponible
    if (!this.isStorageAvailable()) {
      console.warn('🚨 localStorage no disponible, usando memoria temporal')
      this.memoryStorage = new Map()
      this.memoryCodes = new Set()
    }
    
    // Limpiar tickets expirados al inicializar
    this.cleanupExpired()
  }

  isStorageAvailable() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  saveTicket(code, ticketData) {
    try {
      const data = {
        ...ticketData,
        created: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
      }

      if (this.isStorageAvailable()) {
        // Usar localStorage
        localStorage.setItem(`${this.storageKey}_${code}`, JSON.stringify(data))
        
        // Actualizar lista de códigos
        const codes = this.getCodes()
        if (!codes.includes(code)) {
          codes.push(code)
          localStorage.setItem(this.codesKey, JSON.stringify(codes))
        }
      } else {
        // Usar memoria temporal
        this.memoryStorage.set(code, data)
        this.memoryCodes.add(code)
      }

      console.log(`💾 Ticket guardado: ${code}`)
      return true
    } catch (error) {
      console.error('❌ Error guardando ticket:', error)
      return false
    }
  }

  getTicket(code) {
    try {
      let ticketData = null

      if (this.isStorageAvailable()) {
        // Buscar en localStorage
        const data = localStorage.getItem(`${this.storageKey}_${code}`)
        if (data) {
          ticketData = JSON.parse(data)
        }
      } else {
        // Buscar en memoria
        ticketData = this.memoryStorage.get(code)
      }

      if (!ticketData) {
        console.log(`🔍 Ticket no encontrado: ${code}`)
        return null
      }

      // Verificar expiración
      if (Date.now() > ticketData.expires) {
        console.log(`⏰ Ticket expirado: ${code}`)
        this.removeTicket(code)
        return null
      }

      console.log(`✅ Ticket encontrado: ${code} - ${ticketData.guest.name}`)
      return ticketData
    } catch (error) {
      console.error('❌ Error obteniendo ticket:', error)
      return null
    }
  }

  removeTicket(code) {
    try {
      if (this.isStorageAvailable()) {
        localStorage.removeItem(`${this.storageKey}_${code}`)
        
        // Actualizar lista de códigos
        const codes = this.getCodes().filter(c => c !== code)
        localStorage.setItem(this.codesKey, JSON.stringify(codes))
      } else {
        this.memoryStorage.delete(code)
        this.memoryCodes.delete(code)
      }
    } catch (error) {
      console.error('❌ Error removiendo ticket:', error)
    }
  }

  getCodes() {
    try {
      if (this.isStorageAvailable()) {
        const codes = localStorage.getItem(this.codesKey)
        return codes ? JSON.parse(codes) : []
      } else {
        return Array.from(this.memoryCodes)
      }
    } catch (error) {
      console.error('❌ Error obteniendo códigos:', error)
      return []
    }
  }

  cleanupExpired() {
    try {
      const codes = this.getCodes()
      let cleaned = 0

      codes.forEach(code => {
        const ticket = this.getTicket(code)
        if (!ticket) { // Ya fue removido por expiración
          cleaned++
        }
      })

      if (cleaned > 0) {
        console.log(`🧹 Limpiados ${cleaned} tickets expirados`)
      }
    } catch (error) {
      console.error('❌ Error limpiando tickets:', error)
    }
  }

  getStorageInfo() {
    const codes = this.getCodes()
    return {
      totalTickets: codes.length,
      storageType: this.isStorageAvailable() ? 'localStorage' : 'memory',
      codes: codes.slice(0, 5) // Solo los primeros 5 para debug
    }
  }
}

// Instancia global del sistema de almacenamiento
const ticketStorage = new TicketStorage()

/**
 * Inicializar EmailJS
 */
const initializeEmailJS = async () => {
  if (EMAILJS_PUBLIC_KEY) {
    try {
      const emailjs = await import('@emailjs/browser')
      emailjs.default.init(EMAILJS_PUBLIC_KEY)
      console.log('📧 EmailJS inicializado correctamente')
      return emailjs.default
    } catch (error) {
      console.error('❌ Error inicializando EmailJS:', error)
      return null
    }
  }
  return null
}

/**
 * Generar código corto para descarga (más robusto)
 */
const generateDownloadCode = (guestId, eventId) => {
  const timestamp = Date.now().toString(36).slice(-4)
  const random = Math.random().toString(36).substr(2, 6)
  const prefix = eventId.toString().slice(-2)
  const checksum = ((guestId.length + eventId.length) % 36).toString(36)
  
  return `${prefix}${timestamp}${random}${checksum}`.toLowerCase()
}

/**
 * Obtener ticket por código (función principal que usa el sistema robusto)
 */
export const getTicketByCode = (code) => {
  console.log(`🔍 Buscando ticket: ${code}`)
  console.log(`📱 Info almacenamiento:`, ticketStorage.getStorageInfo())
  
  return ticketStorage.getTicket(code)
}

/**
 * Limpiar tickets expirados
 */
export const cleanupExpiredTickets = () => {
  ticketStorage.cleanupExpired()
}

/**
 * Obtener información del almacenamiento (para debug)
 */
export const getStorageInfo = () => {
  return ticketStorage.getStorageInfo()
}

/**
 * Enviar email individual con código de descarga
 */
const sendSingleEmailWithRetry = async (guest, qrCode, options = {}, attempt = 1) => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        simulated: true,
        reason: 'EmailJS not configured'
      }
    }

    if (!window.emailjsInstance) {
      window.emailjsInstance = await initializeEmailJS()
    }
    
    const emailjs = window.emailjsInstance
    if (!emailjs) {
      throw new Error('No se pudo inicializar EmailJS')
    }

    const qrImageDataUrl = generateQRImage(qrCode, { size: 400 })
    
    const eventData = {
      id: options.eventId || 'event_' + Date.now(),
      name: guest.event_name || options.eventName || 'Nuestro Evento',
      date: options.eventDate || new Date().toISOString(),
      location: options.eventLocation || 'Ubicación del evento'
    }

    const guestData = {
      id: guest.id || 'guest_' + Date.now(),
      name: guest.name,
      email: guest.email,
      phone: guest.phone || ''
    }

    // Generar código y guardar con el sistema robusto
    const downloadCode = generateDownloadCode(guestData.id, eventData.id)
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}/#/download-ticket/${downloadCode}`
    
    console.log(`💾 Guardando ticket: ${downloadCode}`)
    
    const ticketData = {
      code: downloadCode,
      guest: guestData,
      event: eventData,
      qrCode: qrCode
    }
    
    const saved = ticketStorage.saveTicket(downloadCode, ticketData)
    if (!saved) {
      throw new Error('No se pudo guardar el ticket')
    }
    
    // Parámetros para EmailJS
    const templateParams = {
      to_name: guest.name,
      to_email: guest.email,
      from_name: options.organizerName || 'Organizador del Evento',
      event_name: eventData.name,
      event_date: options.eventDate || new Date().toLocaleDateString('es-ES'),
      event_location: eventData.location,
      qr_image: qrImageDataUrl,
      reply_to: options.replyTo || 'noreply@evento.com',
      download_link: downloadUrl,
      download_code: downloadCode,
      has_pdf: true,
      timestamp: Date.now()
    }

    console.log(`📧 Enviando email a ${guest.email} con código: ${downloadCode}`)

    const result = await Promise.race([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout ${EMAIL_TIMEOUT}ms`)), EMAIL_TIMEOUT)
      )
    ])

    return {
      success: true,
      messageId: result.text || `emailjs_${Date.now()}`,
      simulated: false,
      service: 'emailjs',
      downloadCode: downloadCode,
      downloadUrl: downloadUrl,
      attempt
    }

  } catch (error) {
    console.error(`❌ Error enviando email a ${guest.name} (intento ${attempt}):`, error.message)
    
    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Reintentando envío a ${guest.name} (${attempt + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return sendSingleEmailWithRetry(guest, qrCode, options, attempt + 1)
    }
    
    return {
      success: false,
      error: error.message,
      guest: guest.name,
      email: guest.email,
      attempts: attempt
    }
  }
}

/**
 * Enviar email principal
 */
export const sendQREmail = async (guest, qrCode, options = {}) => {
  const result = await sendSingleEmailWithRetry(guest, qrCode, options)
  
  if (!result.success) {
    console.log(`🔄 [FALLBACK] Email para: ${guest.email}`)
    return {
      success: true,
      messageId: `fallback_${Date.now()}`,
      simulated: true,
      error: result.error
    }
  }
  
  return result
}

/**
 * Enviar emails masivos
 */
export const sendBulkQREmails = async (guestsWithQRs, options = {}, progressCallback = null) => {
  const results = {
    total: guestsWithQRs.length,
    sent: 0,
    failed: 0,
    simulated: 0,
    withDownloadCode: 0,
    errors: [],
    duration: 0
  }

  const startTime = Date.now()
  console.log(`📧 Iniciando envío masivo de ${guestsWithQRs.length} emails`)

  const batches = []
  for (let i = 0; i < guestsWithQRs.length; i += BATCH_SIZE) {
    batches.push(guestsWithQRs.slice(i, i + BATCH_SIZE))
  }

  let processedCount = 0

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    
    const batchPromises = batch.map(async ({ guest, qrCode }) => {
      try {
        const emailOptions = {
          ...options,
          eventId: guest.event_id || options.eventId
        }

        const result = await sendSingleEmailWithRetry(guest, qrCode, emailOptions)
        processedCount++
        
        if (progressCallback) {
          progressCallback({
            current: processedCount,
            total: results.total,
            percentage: Math.round((processedCount / results.total) * 100),
            currentGuest: guest.name,
            status: result.success ? (result.simulated ? 'simulated' : 'success') : 'error'
          })
        }
        
        return { guest, result }
        
      } catch (error) {
        processedCount++
        return {
          guest,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    })

    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        const { result } = promiseResult.value
        
        if (result.success) {
          if (result.simulated) {
            results.simulated++
          } else {
            results.sent++
          }
          
          if (result.downloadCode) {
            results.withDownloadCode++
          }
        } else {
          results.failed++
          results.errors.push({
            guest: result.guest,
            email: result.email,
            error: result.error
          })
        }
      } else {
        results.failed++
        results.errors.push({
          guest: 'Unknown',
          error: promiseResult.reason?.message || 'Promise rejected'
        })
      }
    })
    
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }

  results.duration = Date.now() - startTime
  console.log(`✅ Envío completado en ${(results.duration/1000).toFixed(1)}s`)
  
  return results
}

/**
 * Verificar configuración
 */
export const checkEmailConfig = () => {
  return {
    hasServiceId: !!EMAILJS_SERVICE_ID,
    hasTemplateId: !!EMAILJS_TEMPLATE_ID,
    hasPublicKey: !!EMAILJS_PUBLIC_KEY,
    ready: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY),
    downloadSystem: true,
    storageInfo: ticketStorage.getStorageInfo()
  }
}

/**
 * Diagnóstico mejorado
 */
export const diagnoseEmailJS = () => {
  console.log('🔍 Diagnóstico EmailJS:')
  console.log('- Service ID:', EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Template ID:', EMAILJS_TEMPLATE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Faltante')
  
  const storageInfo = ticketStorage.getStorageInfo()
  console.log(`- Almacenamiento: ${storageInfo.storageType}`)
  console.log(`- Tickets activos: ${storageInfo.totalTickets}`)
  
  if (storageInfo.codes.length > 0) {
    console.log('- Códigos de ejemplo:', storageInfo.codes)
  }
  
  // Test de almacenamiento
  const testCode = 'test_' + Date.now()
  const testData = { test: true, guest: { name: 'Test' }, event: { name: 'Test Event' } }
  
  const saved = ticketStorage.saveTicket(testCode, testData)
  const retrieved = ticketStorage.getTicket(testCode)
  ticketStorage.removeTicket(testCode)
  
  console.log('- Test almacenamiento:', saved && retrieved ? '✅ OK' : '❌ FALLO')
}

// Auto-limpieza mejorada
if (typeof window !== 'undefined') {
  // Limpieza inicial más suave
  setTimeout(() => {
    cleanupExpiredTickets()
    console.log('🧹 Limpieza inicial completada')
  }, 2000)
  
  // Limpieza periódica menos agresiva
  setInterval(cleanupExpiredTickets, 30 * 60 * 1000) // Cada 30 minutos
}

export default {
  sendQREmail,
  sendBulkQREmails,
  getTicketByCode,
  cleanupExpiredTickets,
  checkEmailConfig,
  diagnoseEmailJS,
  getStorageInfo
}