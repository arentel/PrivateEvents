import { generateQRImage } from './qr.js'
import { generateTicketForEmail } from './ticketPDF.js'
// @ts-ignore
import { supabase } from './supabase.js'

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
      console.log('✅ EmailJS inicializado correctamente')
      return emailjs.default
    } catch (error) {
      console.error('❌ Error inicializando EmailJS:', error)
      return null
    }
  }
  return null
}

/**
 * Generar código único para descarga
 */
const generateDownloadCode = (guestId, eventId) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${eventId}_${guestId}_${timestamp}_${random}`.replace(/-/g, '').toLowerCase()
}

/**
 * Verificar si Supabase está disponible y configurado
 */
const isSupabaseAvailable = () => {
  try {
    return !!(supabase && supabase.from)
  } catch (error) {
    console.warn('⚠️ Supabase no disponible:', error.message)
    return false
  }
}

/**
 * Guardar ticket en Supabase (opción principal)
 */
const saveTicketToSupabase = async (downloadCode, guestData, eventData, qrCode) => {
  if (!isSupabaseAvailable()) {
    console.log('📦 Supabase no disponible, usando localStorage')
    return saveTicketToLocalStorage(downloadCode, guestData, eventData, qrCode)
  }

  try {
    console.log('💾 Guardando ticket en Supabase:', downloadCode)
    
    const ticketData = {
      code: downloadCode,
      guest_data: guestData,
      event_data: eventData,
      qr_code: qrCode,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      downloaded: false,
      download_count: 0
    }

    // Intentar crear la tabla si no existe (para desarrollo)
    const { error: createError } = await supabase.rpc('create_download_tickets_table_if_not_exists')
    if (createError && !createError.message.includes('already exists')) {
      console.warn('⚠️ No se pudo crear tabla download_tickets:', createError.message)
    }

    const { data, error } = await supabase
      .from('download_tickets')
      .insert([ticketData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error guardando en Supabase:', error)
      throw error
    }

    console.log('✅ Ticket guardado exitosamente en Supabase')
    return data

  } catch (error) {
    console.error('❌ Error con Supabase, usando localStorage como fallback:', error.message)
    return saveTicketToLocalStorage(downloadCode, guestData, eventData, qrCode)
  }
}

/**
 * Guardar ticket en localStorage (fallback)
 */
const saveTicketToLocalStorage = (downloadCode, guestData, eventData, qrCode) => {
  try {
    const ticketData = {
      code: downloadCode,
      guest: guestData,
      event: eventData,
      qrCode: qrCode,
      created: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 días
      downloaded: false,
      downloadCount: 0,
      storage: 'localStorage'
    }
    
    // Guardar ticket individual
    localStorage.setItem(`ticket_${downloadCode}`, JSON.stringify(ticketData))
    
    // Mantener lista de códigos para limpieza
    const existingCodes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
    if (!existingCodes.includes(downloadCode)) {
      existingCodes.push(downloadCode)
      localStorage.setItem('ticket_codes', JSON.stringify(existingCodes))
    }
    
    console.log('💾 Ticket guardado en localStorage:', downloadCode)
    return ticketData

  } catch (error) {
    console.error('❌ Error guardando en localStorage:', error)
    return null
  }
}

/**
 * Guardar datos de ticket para descarga posterior (función principal)
 */
const saveTicketForDownload = async (downloadCode, guestData, eventData, qrCode) => {
  // Intentar Supabase primero, localStorage como fallback
  const result = await saveTicketToSupabase(downloadCode, guestData, eventData, qrCode)
  
  if (result) {
    console.log(`💾 Ticket guardado exitosamente: ${downloadCode}`)
    return result
  } else {
    throw new Error('No se pudo guardar el ticket en ningún storage')
  }
}

/**
 * Obtener ticket por código desde Supabase
 */
const getTicketFromSupabase = async (code) => {
  if (!isSupabaseAvailable()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .select('*')
      .eq('code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        return null
      }
      throw error
    }

    // Verificar expiración
    if (new Date(data.expires_at) < new Date()) {
      // Eliminar ticket expirado
      await supabase
        .from('download_tickets')
        .delete()
        .eq('code', code)
      
      console.log('🗑️ Ticket expirado eliminado:', code)
      return null
    }

    // Incrementar contador de consultas
    await supabase
      .from('download_tickets')
      .update({ 
        download_count: (data.download_count || 0) + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('code', code)

    return {
      code: data.code,
      guest: data.guest_data,
      event: data.event_data,
      qrCode: data.qr_code,
      created: new Date(data.created_at).getTime(),
      expires: new Date(data.expires_at).getTime(),
      downloaded: data.downloaded,
      downloadCount: data.download_count + 1,
      storage: 'supabase'
    }

  } catch (error) {
    console.error('❌ Error obteniendo ticket de Supabase:', error)
    return null
  }
}

/**
 * Obtener ticket por código desde localStorage
 */
const getTicketFromLocalStorage = (code) => {
  try {
    const ticketData = localStorage.getItem(`ticket_${code}`)
    if (!ticketData) return null
    
    const data = JSON.parse(ticketData)
    
    // Verificar expiración
    if (Date.now() > data.expires) {
      localStorage.removeItem(`ticket_${code}`)
      
      // Remover de la lista de códigos
      const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
      const updatedCodes = codes.filter(c => c !== code)
      localStorage.setItem('ticket_codes', JSON.stringify(updatedCodes))
      
      return null
    }
    
    // Incrementar contador
    data.downloadCount = (data.downloadCount || 0) + 1
    localStorage.setItem(`ticket_${code}`, JSON.stringify(data))
    
    return data
  } catch (error) {
    console.error('❌ Error obteniendo ticket de localStorage:', error)
    return null
  }
}

/**
 * Obtener datos de ticket por código (función principal)
 */
export const getTicketByCode = async (code) => {
  console.log('🔍 Buscando ticket:', code)
  
  // Intentar Supabase primero
  let ticketData = await getTicketFromSupabase(code)
  
  // Si no se encuentra en Supabase, intentar localStorage
  if (!ticketData) {
    ticketData = getTicketFromLocalStorage(code)
  }
  
  if (ticketData) {
    console.log('✅ Ticket encontrado:', ticketData.guest?.name || ticketData.guest_data?.name, 'storage:', ticketData.storage || 'localStorage')
  } else {
    console.log('❌ Ticket no encontrado o expirado:', code)
  }
  
  return ticketData
}

/**
 * Marcar ticket como descargado
 */
export const markTicketAsDownloaded = async (code) => {
  // Actualizar en Supabase si está disponible
  if (isSupabaseAvailable()) {
    try {
      const { error } = await supabase
        .from('download_tickets')
        .update({ 
          downloaded: true,
          downloaded_at: new Date().toISOString()
        })
        .eq('code', code)
      
      if (!error) {
        console.log('✅ Ticket marcado como descargado en Supabase')
        return
      }
    } catch (error) {
      console.error('Error actualizando en Supabase:', error)
    }
  }
  
  // Actualizar en localStorage como fallback
  try {
    const ticketData = localStorage.getItem(`ticket_${code}`)
    if (ticketData) {
      const data = JSON.parse(ticketData)
      data.downloaded = true
      data.downloadedAt = Date.now()
      localStorage.setItem(`ticket_${code}`, JSON.stringify(data))
      console.log('✅ Ticket marcado como descargado en localStorage')
    }
  } catch (error) {
    console.error('Error actualizando en localStorage:', error)
  }
}

/**
 * Limpiar tickets expirados de Supabase
 */
const cleanupExpiredTicketsFromSupabase = async () => {
  if (!isSupabaseAvailable()) return

  try {
    const { data, error } = await supabase
      .from('download_tickets')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('code')

    if (error) {
      console.error('Error limpiando tickets expirados de Supabase:', error)
      return
    }

    if (data && data.length > 0) {
      console.log(`🧹 ${data.length} tickets expirados eliminados de Supabase`)
    }
  } catch (error) {
    console.error('Error en limpieza de Supabase:', error)
  }
}

/**
 * Limpiar tickets expirados de localStorage
 */
const cleanupExpiredTicketsFromLocalStorage = () => {
  try {
    const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
    const validCodes = []
    let expiredCount = 0
    
    codes.forEach(code => {
      const ticketData = localStorage.getItem(`ticket_${code}`)
      if (ticketData) {
        const data = JSON.parse(ticketData)
        if (Date.now() <= data.expires) {
          validCodes.push(code)
        } else {
          localStorage.removeItem(`ticket_${code}`)
          expiredCount++
        }
      }
    })
    
    localStorage.setItem('ticket_codes', JSON.stringify(validCodes))
    
    if (expiredCount > 0) {
      console.log(`🧹 ${expiredCount} tickets expirados eliminados de localStorage`)
    }
  } catch (error) {
    console.error('Error limpiando localStorage:', error)
  }
}

/**
 * Limpiar tickets expirados (función principal)
 */
export const cleanupExpiredTickets = async () => {
  console.log('🧹 Iniciando limpieza de tickets expirados...')
  
  // Limpiar de ambos storages
  await cleanupExpiredTicketsFromSupabase()
  cleanupExpiredTicketsFromLocalStorage()
  
  console.log('🧹 Limpieza completada')
}

/**
 * Obtener estadísticas de tickets
 */
export const getTicketStats = async () => {
  const stats = {
    total: 0,
    active: 0,
    expired: 0,
    downloaded: 0,
    supabase: 0,
    localStorage: 0
  }

  // Estadísticas de Supabase
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('download_tickets')
        .select('expires_at, downloaded')

      if (!error && data) {
        const now = new Date()
        data.forEach(ticket => {
          stats.total++
          stats.supabase++
          
          if (new Date(ticket.expires_at) > now) {
            stats.active++
          } else {
            stats.expired++
          }
          
          if (ticket.downloaded) {
            stats.downloaded++
          }
        })
      }
    } catch (error) {
      console.error('Error obteniendo stats de Supabase:', error)
    }
  }

  // Estadísticas de localStorage
  try {
    const codes = JSON.parse(localStorage.getItem('ticket_codes') || '[]')
    const now = Date.now()
    
    codes.forEach(code => {
      const ticketData = localStorage.getItem(`ticket_${code}`)
      if (ticketData) {
        const data = JSON.parse(ticketData)
        stats.total++
        stats.localStorage++
        
        if (now <= data.expires) {
          stats.active++
        } else {
          stats.expired++
        }
        
        if (data.downloaded) {
          stats.downloaded++
        }
      }
    })
  } catch (error) {
    console.error('Error obteniendo stats de localStorage:', error)
  }

  return stats
}

/**
 * Enviar email individual con reintentos y código de descarga
 */
const sendSingleEmailWithRetry = async (guest, qrCode, options = {}, attempt = 1) => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random()}`,
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

    // Generar QR
    const qrImageDataUrl = generateQRImage(qrCode, { size: 400 })
    
    // Preparar datos del evento
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

    // Generar código de descarga único
    const downloadCode = generateDownloadCode(guestData.id, eventData.id)
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}/#/download-ticket/${downloadCode}`
    
    // Guardar datos para descarga posterior
    await saveTicketForDownload(downloadCode, guestData, eventData, qrCode)
    
    // Preparar contenido del email
    const emailContent = generateEmailContent(guest, options, downloadUrl, downloadCode)
    
    // Parámetros para EmailJS
    const templateParams = {
      to_name: guest.name,
      to_email: guest.email,
      from_name: options.organizerName || 'Organizador del Evento',
      event_name: eventData.name,
      event_date: options.eventDate || new Date().toLocaleDateString('es-ES'),
      event_location: eventData.location,
      subject: emailContent.subject,
      message: emailContent.text,
      html_content: emailContent.html,
      qr_image: qrImageDataUrl,
      reply_to: options.replyTo || 'noreply@evento.com',
      
      // Datos para descarga de PDF
      download_link: downloadUrl,
      download_code: downloadCode,
      has_pdf: true,
      
      timestamp: Date.now()
    }

    console.log(`📧 Enviando email a ${guest.email} con código: ${downloadCode}`)

    const result = await Promise.race([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout después de ${EMAIL_TIMEOUT}ms`)), EMAIL_TIMEOUT)
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
      console.log(`🔄 Reintentando envío a ${guest.name} (intento ${attempt + 1}/${MAX_RETRIES})`)
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
 * Enviar email con código QR y enlace de descarga
 */
export const sendQREmail = async (guest, qrCode, options = {}) => {
  const result = await sendSingleEmailWithRetry(guest, qrCode, options)
  
  if (!result.success) {
    console.log(`📧 [FALLBACK SIMULADO] Email para: ${guest.email}`)
    return {
      success: true,
      messageId: `fallback_${Date.now()}`,
      simulated: true,
      error: result.error,
      originalError: result
    }
  }
  
  return result
}

/**
 * Enviar emails masivos en paralelo
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
  console.log(`🚀 Iniciando envío masivo con códigos de descarga de ${guestsWithQRs.length} emails`)

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
          const percentage = Math.round((processedCount / results.total) * 100)
          progressCallback({
            current: processedCount,
            total: results.total,
            percentage,
            currentGuest: guest.name,
            status: result.success ? (result.simulated ? 'simulated' : 'success') : 'error',
            batch: batchIndex + 1,
            totalBatches: batches.length
          })
        }
        
        return { guest, result }
        
      } catch (error) {
        processedCount++
        return {
          guest,
          result: {
            success: false,
            error: error.message,
            guest: guest.name,
            email: guest.email
          }
        }
      }
    })

    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        const { guest, result } = promiseResult.value
        
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
            guest: result.guest || guest.name,
            email: result.email || guest.email,
            error: result.error || 'Unknown error',
            attempts: result.attempts || 1
          })
        }
      } else {
        results.failed++
        results.errors.push({
          guest: 'Unknown',
          email: 'Unknown',
          error: promiseResult.reason?.message || 'Promise rejected'
        })
      }
    })
    
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }

  results.duration = Date.now() - startTime
  
  console.log(`📊 Envío masivo completado en ${results.duration}ms:`, {
    enviados: results.sent,
    simulados: results.simulated, 
    fallados: results.failed,
    conCodigoDescarga: results.withDownloadCode,
    errores: results.errors.length
  })
  
  return results
}

/**
 * Generar contenido del email con enlace de descarga
 */
const generateEmailContent = (guest, options = {}, downloadUrl = '#', downloadCode = '') => {
  const {
    eventName = guest.event_name || 'Nuestro Evento',
    eventDate = new Date().toLocaleDateString('es-ES'),
    eventLocation = 'Ubicación del evento',
    organizerName = 'Equipo Organizador'
  } = options

  const subject = `🎉 Tu entrada para ${eventName}`

  const html = `Email HTML - usar template EmailJS`
  
  const text = `
🎉 ${eventName} - Tu Entrada

¡Hola ${guest.name}!

Tu entrada para ${eventName} está confirmada.

📋 DETALLES DEL EVENTO:
🎉 Evento: ${eventName}
📅 Fecha: ${eventDate}
📍 Ubicación: ${eventLocation}
👤 Nombre: ${guest.name}

🎫 DESCARGA TU ENTRADA:
Enlace: ${downloadUrl}
Código: ${downloadCode}

¡Nos vemos en ${eventName}!

---
Email enviado automáticamente por ${organizerName}
  `

  return { subject, html, text }
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
    service: 'EmailJS con Supabase + localStorage',
    downloadSystem: true,
    supabaseAvailable: isSupabaseAvailable()
  }

  console.log('🔧 Configuración completa:', config)
  return config
}

/**
 * Función de diagnóstico completa
 */
export const diagnoseEmailJS = async () => {
  console.log('🔍 Diagnóstico EmailJS con Sistema Híbrido:')
  console.log('- Service ID:', EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Template ID:', EMAILJS_TEMPLATE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Faltante')
  console.log('- Supabase:', isSupabaseAvailable() ? '✅ Disponible' : '⚠️ No disponible')
  console.log('- localStorage:', typeof Storage !== 'undefined' ? '✅ Disponible' : '❌ No disponible')
  
  const stats = await getTicketStats()
  console.log('- Estadísticas de tickets:', stats)
  
  // Limpiar automáticamente
  await cleanupExpiredTickets()
}

// Configuración de limpieza automática
if (typeof window !== 'undefined') {
  // Limpiar al cargar
  setTimeout(() => {
    cleanupExpiredTickets()
  }, 2000)
  
  // Limpiar cada 2 horas
  setInterval(() => {
    cleanupExpiredTickets()
  }, 2 * 60 * 60 * 1000)
}

export default {
  sendQREmail,
  sendBulkQREmails,
  getTicketByCode,
  markTicketAsDownloaded,
  cleanupExpiredTickets,
  getTicketStats,
  checkEmailConfig,
  diagnoseEmailJS
}