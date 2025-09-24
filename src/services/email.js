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
 * Inicializar EmailJS
 */
const initializeEmailJS = async () => {
  if (EMAILJS_PUBLIC_KEY) {
    try {
      const emailjs = await import('@emailjs/browser')
      emailjs.default.init(EMAILJS_PUBLIC_KEY)
      console.log('EmailJS inicializado correctamente')
      return emailjs.default
    } catch (error) {
      console.error('Error inicializando EmailJS:', error)
      return null
    }
  }
  return null
}

/**
 * Generar código corto para descarga
 */
const generateDownloadCode = (guestId, eventId) => {
  const timestamp = Date.now().toString(36).slice(-4) // 4 chars del timestamp
  const random = Math.random().toString(36).substr(2, 6)  // 6 chars random
  const prefix = eventId.toString().slice(-2) // 2 últimos chars del eventId
  return `${prefix}${timestamp}${random}`.toLowerCase() // Total: ~12 chars
}

/**
 * Guardar ticket para descarga posterior
 */
const saveTicketForDownload = (downloadCode, guestData, eventData, qrCode) => {
  try {
    const ticketData = {
      code: downloadCode,
      guest: guestData,
      event: eventData,
      qrCode: qrCode,
      created: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    }
    
    localStorage.setItem(`ticket_${downloadCode}`, JSON.stringify(ticketData))
    
    const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
    if (!codes.includes(downloadCode)) {
      codes.push(downloadCode)
      localStorage.setItem('ticket_codes', JSON.stringify(codes))
    }
    
    console.log('Ticket guardado:', downloadCode)
    return ticketData
  } catch (error) {
    console.error('Error guardando ticket:', error)
    return null
  }
}

/**
 * Obtener ticket por código
 */
export const getTicketByCode = (code) => {
  try {
    const ticketData = localStorage.getItem(`ticket_${code}`)
    if (!ticketData) return null
    
    const data = JSON.parse(ticketData)
    
    // Verificar expiración
    if (Date.now() > data.expires) {
      localStorage.removeItem(`ticket_${code}`)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error obteniendo ticket:', error)
    return null
  }
}

/**
 * Limpiar tickets expirados
 */
export const cleanupExpiredTickets = () => {
  try {
    const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
    const validCodes = []
    
    codes.forEach(code => {
      const ticketData = localStorage.getItem(`ticket_${code}`)
      if (ticketData) {
        const data = JSON.parse(ticketData)
        if (Date.now() <= data.expires) {
          validCodes.push(code)
        } else {
          localStorage.removeItem(`ticket_${code}`)
        }
      }
    })
    
    localStorage.setItem('ticket_codes', JSON.stringify(validCodes))
    console.log(`Limpiados ${codes.length - validCodes.length} tickets expirados`)
  } catch (error) {
    console.error('Error limpiando tickets:', error)
  }
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

    // Generar código corto
    const downloadCode = generateDownloadCode(guestData.id, eventData.id)
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}/#/download-ticket/${downloadCode}`
    
    // Debug logs
    console.log('Código generado:', downloadCode)
    console.log('URL completa:', downloadUrl)
    
    // Guardar para descarga
    saveTicketForDownload(downloadCode, guestData, eventData, qrCode)
    
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

    console.log(`Enviando email a ${guest.email} con código: ${downloadCode}`)

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
    console.error(`Error enviando email a ${guest.name} (intento ${attempt}):`, error.message)
    
    if (attempt < MAX_RETRIES) {
      console.log(`Reintentando envío a ${guest.name} (${attempt + 1}/${MAX_RETRIES})`)
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
    console.log(`[FALLBACK] Email para: ${guest.email}`)
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
  console.log(`Iniciando envío masivo de ${guestsWithQRs.length} emails`)

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
  console.log(`Envío completado en ${(results.duration/1000).toFixed(1)}s`)
  
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
    downloadSystem: true
  }
}

/**
 * Diagnóstico
 */
export const diagnoseEmailJS = () => {
  console.log('Diagnóstico EmailJS:')
  console.log('- Service ID:', EMAILJS_SERVICE_ID ? 'Configurado' : 'Faltante')
  console.log('- Template ID:', EMAILJS_TEMPLATE_ID ? 'Configurado' : 'Faltante')
  console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? 'Configurado' : 'Faltante')
  
  const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
  console.log(`- Códigos activos: ${codes.length}`)
  
  cleanupExpiredTickets()
}

// Auto-limpieza
if (typeof window !== 'undefined') {
  setTimeout(cleanupExpiredTickets, 2000)
  setInterval(cleanupExpiredTickets, 60 * 60 * 1000) // Cada hora
}

export default {
  sendQREmail,
  sendBulkQREmails,
  getTicketByCode,
  cleanupExpiredTickets,
  checkEmailConfig,
  diagnoseEmailJS
}