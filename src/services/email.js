// email.js - Versión con base de datos
import { generateQRImage } from './qr.js'
import { supabase } from './supabase.js' // Tu conexión a Supabase

// Configuración EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Configuración de envío
const BATCH_SIZE = 15
const BATCH_DELAY = 500
const EMAIL_TIMEOUT = 8000
const MAX_RETRIES = 2

/**
 * Crear tabla en Supabase (ejecutar una sola vez)
 * 
 * CREATE TABLE download_tickets (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   download_code TEXT UNIQUE NOT NULL,
 *   guest_id TEXT,
 *   guest_name TEXT NOT NULL,
 *   guest_email TEXT NOT NULL,
 *   event_id TEXT,
 *   event_name TEXT NOT NULL,
 *   event_date TIMESTAMP,
 *   event_location TEXT,
 *   qr_code TEXT NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   expires_at TIMESTAMP NOT NULL,
 *   is_used BOOLEAN DEFAULT FALSE,
 *   used_at TIMESTAMP NULL
 * );
 * 
 * CREATE INDEX idx_download_code ON download_tickets(download_code);
 * CREATE INDEX idx_expires_at ON download_tickets(expires_at);
 */

/**
 * Generar código único para descarga
 */
const generateDownloadCode = (guestId, eventId) => {
  const timestamp = Date.now().toString(36).slice(-4)
  const random = Math.random().toString(36).substr(2, 8)
  const prefix = eventId.toString().slice(-2)
  const checksum = ((guestId.length + eventId.length) % 36).toString(36)
  
  return `${prefix}${timestamp}${random}${checksum}`.toLowerCase()
}

/**
 * Guardar ticket en la base de datos
 */
const saveTicketToDatabase = async (downloadCode, guestData, eventData, qrCode) => {
  try {
    const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 días
    
    // Asegurar que event_date esté en formato correcto
    let eventDateForDB = null
    if (eventData.date) {
      try {
        eventDateForDB = new Date(eventData.date).toISOString()
      } catch (error) {
        console.warn('Error formateando fecha para BD:', error)
        eventDateForDB = new Date().toISOString()
      }
    }
    
    const ticketData = {
      download_code: downloadCode,
      guest_id: guestData.id,
      guest_name: guestData.name,
      guest_email: guestData.email,
      event_id: eventData.id,
      event_name: eventData.name,
      event_date: eventDateForDB,
      event_location: eventData.location,
      qr_code: qrCode,
      expires_at: expiresAt.toISOString(),
      is_used: false
    }

    console.log('💾 Guardando en BD:', {
      code: downloadCode,
      guest: guestData.name,
      event: eventData.name,
      date: eventDateForDB
    })

    const { data, error } = await supabase
      .from('download_tickets')
      .insert([ticketData])
      .select()
      .single()

    if (error) {
      console.error('Error guardando ticket en BD:', error)
      throw error
    }

    console.log('✅ Ticket guardado en BD:', downloadCode)
    return data

  } catch (error) {
    console.error('❌ Error en saveTicketToDatabase:', error)
    throw error
  }
}

/**
 * Obtener ticket por código desde la base de datos
 */
export const getTicketByCode = async (code) => {
  try {
    console.log(`🔍 Buscando ticket en BD: ${code}`)

    const { data, error } = await supabase
      .from('download_tickets')
      .select('*')
      .eq('download_code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log(`❌ Ticket no encontrado: ${code}`)
        return null
      }
      throw error
    }

    // Verificar expiración
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      console.log(`⏰ Ticket expirado: ${code}`)
      return null
    }

    // Transformar datos para compatibilidad con la vista
    const ticketData = {
      code: data.download_code,
      guest: {
        id: data.guest_id,
        name: data.guest_name,
        email: data.guest_email
      },
      event: {
        id: data.event_id,
        name: data.event_name,
        date: data.event_date,
        location: data.event_location
      },
      qrCode: data.qr_code,
      created: new Date(data.created_at).getTime(),
      expires: new Date(data.expires_at).getTime(),
      isUsed: data.is_used,
      usedAt: data.used_at
    }

    console.log(`✅ Ticket válido encontrado: ${data.guest_name}`)
    return ticketData

  } catch (error) {
    console.error('❌ Error obteniendo ticket de BD:', error)
    return null
  }
}

/**
 * Marcar ticket como usado (opcional, para control de acceso)
 */
export const markTicketAsUsed = async (code) => {
  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('download_code', code)
      .select()

    if (error) throw error

    console.log(`✅ Ticket marcado como usado: ${code}`)
    return data

  } catch (error) {
    console.error('❌ Error marcando ticket como usado:', error)
    throw error
  }
}

/**
 * Limpiar tickets expirados de la base de datos
 */
export const cleanupExpiredTickets = async () => {
  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) throw error

    const deletedCount = data?.length || 0
    console.log(`🧹 Eliminados ${deletedCount} tickets expirados de la BD`)
    return deletedCount

  } catch (error) {
    console.error('❌ Error limpiando tickets expirados:', error)
    return 0
  }
}

/**
 * Obtener estadísticas de tickets
 */
export const getTicketStats = async () => {
  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .select('is_used, expires_at')

    if (error) throw error

    const now = new Date()
    const stats = {
      total: data.length,
      used: data.filter(t => t.is_used).length,
      expired: data.filter(t => new Date(t.expires_at) < now).length,
      active: data.filter(t => !t.is_used && new Date(t.expires_at) >= now).length
    }

    console.log('📊 Estadísticas de tickets:', stats)
    return stats

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return null
  }
}

/**
 * Inicializar EmailJS
 */
const initializeEmailJS = async () => {
  if (EMAILJS_PUBLIC_KEY) {
    try {
      const emailjs = await import('@emailjs/browser')
      emailjs.default.init(EMAILJS_PUBLIC_KEY)
      console.log('📧 EmailJS inicializado')
      return emailjs.default
    } catch (error) {
      console.error('❌ Error inicializando EmailJS:', error)
      return null
    }
  }
  return null
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
    
    // Formatear fecha correctamente para la base de datos
    let eventDateISO = new Date().toISOString()
    
    if (options.eventDate) {
      try {
        // Si viene como string, intentar parsearlo
        const parsedDate = new Date(options.eventDate)
        if (!isNaN(parsedDate.getTime())) {
          eventDateISO = parsedDate.toISOString()
        }
      } catch (error) {
        console.warn('Error parseando fecha del evento:', error)
      }
    }

    const eventData = {
      id: options.eventId || 'event_' + Date.now(),
      name: guest.event_name || options.eventName || 'Nuestro Evento',
      date: eventDateISO,
      location: options.eventLocation || 'Ubicación del evento'
    }

    const guestData = {
      id: guest.id || 'guest_' + Date.now(),
      name: guest.name,
      email: guest.email,
      phone: guest.phone || ''
    }

    // Generar código único
    const downloadCode = generateDownloadCode(guestData.id, eventData.id)
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}/#/download-ticket/${downloadCode}`
    
    console.log(`💾 Guardando ticket en BD: ${downloadCode}`)
    
    // Guardar en base de datos
    await saveTicketToDatabase(downloadCode, guestData, eventData, qrCode)
    
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

    console.log(`📨 Enviando email a ${guest.email}`)

    const result = await Promise.race([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout ${EMAIL_TIMEOUT}ms`)), EMAIL_TIMEOUT)
      )
    ])

    console.log(`✅ Email enviado: ${guest.email}`)

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
    console.error(`❌ Error enviando email (intento ${attempt}):`, error.message)
    
    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Reintentando envío (${attempt + 1}/${MAX_RETRIES})`)
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
  console.log(`📧 Iniciando envío masivo: ${guestsWithQRs.length} emails`)

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
    downloadSystem: 'database',
    supabaseConnected: !!supabase
  }
}

/**
 * Diagnóstico del sistema
 */
export const diagnoseEmailJS = async () => {
  console.log('🔍 === DIAGNÓSTICO SISTEMA CON BASE DE DATOS ===')
  console.log('📧 EmailJS:')
  console.log('  - Service ID:', EMAILJS_SERVICE_ID ? '✅ OK' : '❌ Faltante')
  console.log('  - Template ID:', EMAILJS_TEMPLATE_ID ? '✅ OK' : '❌ Faltante')  
  console.log('  - Public Key:', EMAILJS_PUBLIC_KEY ? '✅ OK' : '❌ Faltante')
  
  console.log('🗄️ Base de datos:')
  console.log('  - Supabase:', supabase ? '✅ Conectado' : '❌ No conectado')
  
  // Test de conexión a la base de datos
  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log('  - Tabla download_tickets: ❌ Error -', error.message)
    } else {
      console.log('  - Tabla download_tickets: ✅ OK')
    }
  } catch (e) {
    console.log('  - Tabla download_tickets: ❌ Error de conexión')
  }
  
  // Obtener estadísticas
  const stats = await getTicketStats()
  if (stats) {
    console.log('📊 Estadísticas:')
    console.log(`  - Total tickets: ${stats.total}`)
    console.log(`  - Activos: ${stats.active}`)
    console.log(`  - Usados: ${stats.used}`)
    console.log(`  - Expirados: ${stats.expired}`)
  }
  
  // Limpiar tickets expirados
  await cleanupExpiredTickets()
  
  console.log('✅ Diagnóstico completado')
}

// Limpieza automática periódica
if (typeof window !== 'undefined') {
  // Limpieza inicial
  setTimeout(async () => {
    await cleanupExpiredTickets()
  }, 5000)
  
  // Limpieza cada 2 horas
  setInterval(async () => {
    await cleanupExpiredTickets()
  }, 2 * 60 * 60 * 1000)
}

export default {
  sendQREmail,
  sendBulkQREmails,
  getTicketByCode,
  markTicketAsUsed,
  cleanupExpiredTickets,
  getTicketStats,
  checkEmailConfig,
  diagnoseEmailJS
}