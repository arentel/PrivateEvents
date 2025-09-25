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
 * Sistema de almacenamiento robusto para móviles
 */
class TicketStorage {
  constructor() {
    this.storageKey = 'qr_tickets'
    this.codesKey = 'ticket_codes'
    this.memoryStorage = new Map()
    this.memoryCodes = new Set()
    this.storageAvailable = null
    this.init()
  }

  init() {
    // Verificar disponibilidad de localStorage
    this.storageAvailable = this.testStorageAvailability()
    
    if (!this.storageAvailable) {
      console.warn('🚨 localStorage no disponible - usando memoria temporal')
    } else {
      console.log('✅ localStorage disponible')
    }
    
    // Limpiar tickets expirados al inicializar
    this.cleanupExpired()
  }

  testStorageAvailability() {
    try {
      const test = '__storage_test_' + Date.now()
      localStorage.setItem(test, 'test')
      const retrieved = localStorage.getItem(test)
      localStorage.removeItem(test)
      return retrieved === 'test'
    } catch (e) {
      console.warn('localStorage test failed:', e.message)
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

      // Intentar localStorage primero
      if (this.storageAvailable) {
        try {
          localStorage.setItem(`${this.storageKey}_${code}`, JSON.stringify(data))
          
          // Actualizar lista de códigos
          const codes = this.getCodes()
          if (!codes.includes(code)) {
            codes.push(code)
            localStorage.setItem(this.codesKey, JSON.stringify(codes))
          }
          
          console.log(`💾 Ticket guardado en localStorage: ${code}`)
          return true
        } catch (storageError) {
          console.warn('⚠️ Error en localStorage, usando memoria:', storageError.message)
          this.storageAvailable = false
        }
      }

      // Fallback a memoria temporal
      this.memoryStorage.set(code, data)
      this.memoryCodes.add(code)
      console.log(`💾 Ticket guardado en memoria: ${code}`)
      return true

    } catch (error) {
      console.error('❌ Error guardando ticket:', error)
      return false
    }
  }

  getTicket(code) {
    try {
      let ticketData = null

      // Buscar en localStorage primero
      if (this.storageAvailable) {
        try {
          const data = localStorage.getItem(`${this.storageKey}_${code}`)
          if (data) {
            ticketData = JSON.parse(data)
          }
        } catch (storageError) {
          console.warn('⚠️ Error leyendo localStorage:', storageError.message)
          this.storageAvailable = false
        }
      }

      // Si no se encontró en localStorage, buscar en memoria
      if (!ticketData && this.memoryStorage.has(code)) {
        ticketData = this.memoryStorage.get(code)
        console.log(`🔍 Ticket encontrado en memoria: ${code}`)
      }

      if (!ticketData) {
        console.log(`❌ Ticket no encontrado: ${code}`)
        console.log(`📊 Estado almacenamiento:`, {
          localStorage: this.storageAvailable,
          memoryTickets: this.memoryStorage.size,
          localStorageTickets: this.storageAvailable ? this.getLocalStorageCodes().length : 0
        })
        return null
      }

      // Verificar expiración
      if (Date.now() > ticketData.expires) {
        console.log(`⏰ Ticket expirado: ${code}`)
        this.removeTicket(code)
        return null
      }

      console.log(`✅ Ticket válido encontrado: ${code} - ${ticketData.guest.name}`)
      return ticketData

    } catch (error) {
      console.error('❌ Error obteniendo ticket:', error)
      return null
    }
  }

  removeTicket(code) {
    try {
      // Remover de localStorage
      if (this.storageAvailable) {
        try {
          localStorage.removeItem(`${this.storageKey}_${code}`)
          
          // Actualizar lista de códigos
          const codes = this.getLocalStorageCodes().filter(c => c !== code)
          localStorage.setItem(this.codesKey, JSON.stringify(codes))
        } catch (storageError) {
          console.warn('⚠️ Error removiendo de localStorage:', storageError.message)
        }
      }

      // Remover de memoria
      this.memoryStorage.delete(code)
      this.memoryCodes.delete(code)

      console.log(`🗑️ Ticket removido: ${code}`)
    } catch (error) {
      console.error('❌ Error removiendo ticket:', error)
    }
  }

  getLocalStorageCodes() {
    if (!this.storageAvailable) return []
    
    try {
      const codes = localStorage.getItem(this.codesKey)
      return codes ? JSON.parse(codes) : []
    } catch (error) {
      console.warn('⚠️ Error obteniendo códigos de localStorage:', error.message)
      return []
    }
  }

  getCodes() {
    const localCodes = this.getLocalStorageCodes()
    const memoryCodes = Array.from(this.memoryCodes)
    
    // Combinar y deduplicar
    const allCodes = [...new Set([...localCodes, ...memoryCodes])]
    return allCodes
  }

  cleanupExpired() {
    try {
      let cleaned = 0
      
      // Limpiar localStorage
      if (this.storageAvailable) {
        const localCodes = this.getLocalStorageCodes()
        const validLocalCodes = []
        
        localCodes.forEach(code => {
          try {
            const data = localStorage.getItem(`${this.storageKey}_${code}`)
            if (data) {
              const ticketData = JSON.parse(data)
              if (Date.now() <= ticketData.expires) {
                validLocalCodes.push(code)
              } else {
                localStorage.removeItem(`${this.storageKey}_${code}`)
                cleaned++
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error procesando código ${code}:`, error.message)
          }
        })
        
        if (validLocalCodes.length !== localCodes.length) {
          localStorage.setItem(this.codesKey, JSON.stringify(validLocalCodes))
        }
      }
      
      // Limpiar memoria
      this.memoryStorage.forEach((data, code) => {
        if (Date.now() > data.expires) {
          this.memoryStorage.delete(code)
          this.memoryCodes.delete(code)
          cleaned++
        }
      })

      if (cleaned > 0) {
        console.log(`🧹 Limpiados ${cleaned} tickets expirados`)
      }
    } catch (error) {
      console.error('❌ Error en limpieza:', error)
    }
  }

  getStorageInfo() {
    const localCodes = this.getLocalStorageCodes()
    const memoryCodes = Array.from(this.memoryCodes)
    
    return {
      storageAvailable: this.storageAvailable,
      localStorageTickets: localCodes.length,
      memoryTickets: memoryCodes.length,
      totalTickets: this.getCodes().length,
      userAgent: navigator.userAgent,
      localCodes: localCodes.slice(0, 3),
      memoryCodes: memoryCodes.slice(0, 3)
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
 * Generar código corto para descarga (mejorado)
 */
const generateDownloadCode = (guestId, eventId) => {
  const timestamp = Date.now().toString(36).slice(-4)
  const random = Math.random().toString(36).substr(2, 6)
  const prefix = eventId.toString().slice(-2)
  const checksum = ((guestId.length + eventId.length + timestamp.length) % 36).toString(36)
  
  const code = `${prefix}${timestamp}${random}${checksum}`.toLowerCase()
  console.log(`🎲 Código generado: ${code} para guest: ${guestId}`)
  return code
}

/**
 * Obtener ticket por código - FUNCIÓN PRINCIPAL
 */
export const getTicketByCode = (code) => {
  console.log(`🔍 [MOBILE DEBUG] Buscando ticket: ${code}`)
  console.log(`📱 [MOBILE DEBUG] Info del sistema:`, ticketStorage.getStorageInfo())
  
  const result = ticketStorage.getTicket(code)
  
  if (result) {
    console.log(`✅ [MOBILE DEBUG] Ticket encontrado exitosamente`)
  } else {
    console.log(`❌ [MOBILE DEBUG] Ticket no encontrado o expirado`)
  }
  
  return result
}

/**
 * Limpiar tickets expirados
 */
export const cleanupExpiredTickets = () => {
  console.log(`🧹 Iniciando limpieza de tickets expirados`)
  ticketStorage.cleanupExpired()
}

/**
 * Obtener información del sistema de almacenamiento
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

    // Generar código y guardar
    const downloadCode = generateDownloadCode(guestData.id, eventData.id)
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}/#/download-ticket/${downloadCode}`
    
    console.log(`📧 Preparando email para ${guest.email}`)
    console.log(`🔗 URL generada: ${downloadUrl}`)
    
    // Crear y guardar ticket
    const ticketData = {
      code: downloadCode,
      guest: guestData,
      event: eventData,
      qrCode: qrCode
    }
    
    const saved = ticketStorage.saveTicket(downloadCode, ticketData)
    if (!saved) {
      throw new Error('No se pudo guardar el ticket en el sistema de almacenamiento')
    }
    
    // Verificar que se guardó correctamente
    const verification = ticketStorage.getTicket(downloadCode)
    if (!verification) {
      throw new Error('Error: ticket no se guardó correctamente')
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

    console.log(`📨 Enviando email a ${guest.email} con código: ${downloadCode}`)

    const result = await Promise.race([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout ${EMAIL_TIMEOUT}ms`)), EMAIL_TIMEOUT)
      )
    ])

    console.log(`✅ Email enviado exitosamente a ${guest.email}`)

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
    console.log(`🔄 [FALLBACK] Email fallback para: ${guest.email}`)
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
  console.log(`✅ Envío masivo completado en ${(results.duration/1000).toFixed(1)}s`)
  console.log(`📊 Resultados: ${results.sent} enviados, ${results.simulated} simulados, ${results.failed} fallidos`)
  
  return results
}

/**
 * Verificar configuración
 */
export const checkEmailConfig = () => {
  const config = {
    hasServiceId: !!EMAILJS_SERVICE_ID,
    hasTemplateId: !!EMAILJS_TEMPLATE_ID,
    hasPublicKey: !!EMAILJS_PUBLIC_KEY,
    ready: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY),
    downloadSystem: true,
    storageInfo: ticketStorage.getStorageInfo()
  }
  
  console.log('🔧 Configuración EmailJS:', config)
  return config
}

/**
 * Diagnóstico completo del sistema
 */
export const diagnoseEmailJS = () => {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DEL SISTEMA ===')
  console.log('📧 EmailJS:')
  console.log('  - Service ID:', EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('  - Template ID:', EMAILJS_TEMPLATE_ID ? '✅ Configurado' : '❌ Faltante')  
  console.log('  - Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Faltante')
  
  const storageInfo = ticketStorage.getStorageInfo()
  console.log('💾 Sistema de almacenamiento:')
  console.log('  - localStorage disponible:', storageInfo.storageAvailable ? '✅ Sí' : '❌ No')
  console.log('  - Tickets en localStorage:', storageInfo.localStorageTickets)
  console.log('  - Tickets en memoria:', storageInfo.memoryTickets)
  console.log('  - Total de tickets:', storageInfo.totalTickets)
  
  console.log('📱 Información del dispositivo:')
  console.log('  - User Agent:', navigator.userAgent)
  console.log('  - Plataforma:', navigator.platform)
  console.log('  - Idioma:', navigator.language)
  
  // Test completo del sistema de almacenamiento
  console.log('🧪 Test del sistema de almacenamiento:')
  const testCode = 'test_' + Date.now()
  const testData = { 
    test: true, 
    guest: { name: 'Usuario Test', email: 'test@test.com' }, 
    event: { name: 'Evento Test' },
    qrCode: 'test-qr-code'
  }
  
  const saved = ticketStorage.saveTicket(testCode, testData)
  const retrieved = ticketStorage.getTicket(testCode)
  ticketStorage.removeTicket(testCode)
  
  console.log('  - Guardar:', saved ? '✅ OK' : '❌ FALLO')
  console.log('  - Recuperar:', retrieved ? '✅ OK' : '❌ FALLO')
  console.log('  - Datos coinciden:', retrieved && retrieved.guest.name === testData.guest.name ? '✅ OK' : '❌ FALLO')
  
  // Códigos de ejemplo
  if (storageInfo.localCodes.length > 0 || storageInfo.memoryCodes.length > 0) {
    console.log('📋 Códigos de ejemplo:')
    if (storageInfo.localCodes.length > 0) {
      console.log('  - localStorage:', storageInfo.localCodes)
    }
    if (storageInfo.memoryCodes.length > 0) {
      console.log('  - memoria:', storageInfo.memoryCodes)
    }
  }
  
  ticketStorage.cleanupExpired()
  console.log('✅ Diagnóstico completado')
}

// Auto-limpieza optimizada para móviles
if (typeof window !== 'undefined') {
  // Limpieza inicial suave
  setTimeout(() => {
    console.log('🧹 Iniciando limpieza automática inicial')
    cleanupExpiredTickets()
  }, 3000)
  
  // Limpieza periódica menos frecuente para móviles
  setInterval(() => {
    console.log('🧹 Limpieza automática periódica')
    cleanupExpiredTickets()
  }, 30 * 60 * 1000) // Cada 30 minutos
  
  // Escuchar eventos de foco para limpiar cuando la app vuelve al primer plano
  window.addEventListener('focus', () => {
    console.log('🔄 App en primer plano - verificando tickets')
    cleanupExpiredTickets()
  })
  
  // Escuchar cambios de visibilidad (importante para PWA)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('👀 App visible - verificando estado')
      cleanupExpiredTickets()
    }
  })
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