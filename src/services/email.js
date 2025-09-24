import { generateQRImage } from './qr.js'
import { generateTicketForEmail } from './ticketPDF.js'

// Configuración EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Configuración de envío paralelo
const BATCH_SIZE = 15 // Enviar 15 emails simultáneamente
const BATCH_DELAY = 500 // 500ms entre lotes (no entre emails individuales)
const EMAIL_TIMEOUT = 8000 // 8 segundos por email
const MAX_RETRIES = 2 // Máximo 2 reintentos por email

/**
 * Inicializar EmailJS si está configurado
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
 * Cache de PDFs para evitar regenerar el mismo PDF múltiples veces
 */
const pdfCache = new Map()

/**
 * Generar PDF con caché
 */
const generatePDFWithCache = async (guestData, eventData, logoBase64) => {
  const cacheKey = `${eventData.id}_${guestData.id}`
  
  if (pdfCache.has(cacheKey)) {
    return pdfCache.get(cacheKey)
  }
  
  try {
    const pdfBase64 = await generateTicketForEmail(guestData, eventData, logoBase64)
    pdfCache.set(cacheKey, pdfBase64)
    return pdfBase64
  } catch (error) {
    console.warn(`⚠️ Error generando PDF para ${guestData.name}:`, error.message)
    return null
  }
}

/**
 * Enviar email individual con reintentos
 * @param {Object} guest - Datos del invitado
 * @param {string} qrCode - Código QR encriptado
 * @param {Object} options - Opciones adicionales
 * @param {number} attempt - Número de intento actual
 * @returns {Promise<Object>} - Resultado del envío
 */
const sendSingleEmailWithRetry = async (guest, qrCode, options = {}, attempt = 1) => {
  try {
    // Verificar configuración
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random()}`,
        simulated: true,
        reason: 'EmailJS not configured'
      }
    }

    // Inicializar EmailJS (solo una vez)
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

    // Generar PDF con caché
    const pdfBase64 = await generatePDFWithCache(guestData, eventData, options.logoBase64)
    const pdfFilename = pdfBase64 ? `Entrada_${eventData.name.replace(/\s+/g, '_')}_${guest.name.replace(/\s+/g, '_')}.pdf` : null
    
    // Preparar contenido del email
    const emailContent = generateEmailContent(guest, options, !!pdfBase64)
    
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
      pdf_attachment: pdfBase64,
      pdf_filename: pdfFilename,
      has_pdf: !!pdfBase64,
      // Añadir timestamp único para evitar problemas de caché
      timestamp: Date.now()
    }

    // Enviar con timeout reducido para paralelismo
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
      hasPDF: !!pdfBase64,
      attempt
    }

  } catch (error) {
    console.error(`❌ Error enviando email a ${guest.name} (intento ${attempt}):`, error.message)
    
    // Reintentar si no hemos alcanzado el máximo
    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Reintentando envío a ${guest.name} (intento ${attempt + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Pausa antes del reintento
      return sendSingleEmailWithRetry(guest, qrCode, options, attempt + 1)
    }
    
    // Si llegamos aquí, falló definitivamente
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
 * Enviar email con código QR y PDF ticket usando EmailJS
 * @param {Object} guest - Datos del invitado
 * @param {string} qrCode - Código QR encriptado
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Resultado del envío
 */
export const sendQREmail = async (guest, qrCode, options = {}) => {
  const result = await sendSingleEmailWithRetry(guest, qrCode, options)
  
  if (!result.success) {
    // Fallback: simular envío para no bloquear la aplicación
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
 * Enviar emails masivos en paralelo OPTIMIZADO
 * @param {Array} guestsWithQRs - Lista de invitados con QRs
 * @param {Object} options - Opciones
 * @param {Function} progressCallback - Callback de progreso
 * @returns {Promise<Object>} - Resultado
 */
export const sendBulkQREmails = async (guestsWithQRs, options = {}, progressCallback = null) => {
  const results = {
    total: guestsWithQRs.length,
    sent: 0,
    failed: 0,
    simulated: 0,
    withPDF: 0,
    errors: [],
    duration: 0
  }

  const startTime = Date.now()
  console.log(`🚀 Iniciando envío masivo PARALELO de ${guestsWithQRs.length} emails (lotes de ${BATCH_SIZE})`)

  // Limpiar caché de PDFs al inicio
  pdfCache.clear()

  // Dividir en lotes para procesamiento paralelo
  const batches = []
  for (let i = 0; i < guestsWithQRs.length; i += BATCH_SIZE) {
    batches.push(guestsWithQRs.slice(i, i + BATCH_SIZE))
  }

  console.log(`📦 Dividido en ${batches.length} lotes de máximo ${BATCH_SIZE} emails`)

  let processedCount = 0

  // Procesar cada lote
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const batchStartTime = Date.now()
    
    console.log(`📦 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} emails)`)

    // Enviar todos los emails del lote en paralelo
    const batchPromises = batch.map(async ({ guest, qrCode }) => {
      try {
        const emailOptions = {
          ...options,
          eventId: guest.event_id || options.eventId
        }

        const result = await sendSingleEmailWithRetry(guest, qrCode, emailOptions)
        
        processedCount++
        
        // Actualizar progreso
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
        console.error(`❌ Error crítico procesando ${guest.name}:`, error)
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

    // Esperar a que termine todo el lote
    const batchResults = await Promise.allSettled(batchPromises)
    
    // Procesar resultados del lote
    batchResults.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        const { guest, result } = promiseResult.value
        
        if (result.success) {
          if (result.simulated) {
            results.simulated++
          } else {
            results.sent++
          }
          
          if (result.hasPDF) {
            results.withPDF++
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

    const batchDuration = Date.now() - batchStartTime
    console.log(`✅ Lote ${batchIndex + 1} completado en ${batchDuration}ms`)
    
    // Pausa entre lotes (NO entre emails individuales)
    if (batchIndex < batches.length - 1) {
      console.log(`⏸️ Pausa de ${BATCH_DELAY}ms antes del siguiente lote...`)
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }

  results.duration = Date.now() - startTime
  
  // Limpiar caché al final
  pdfCache.clear()
  
  console.log(`📊 Envío masivo completado en ${results.duration}ms (${(results.duration/1000).toFixed(1)}s):`, {
    enviados: results.sent,
    simulados: results.simulated, 
    fallados: results.failed,
    conPDF: results.withPDF,
    errores: results.errors.length
  })
  
  return results
}

/**
 * Enviar email simple sin QR (para notificaciones)
 * @param {Object} emailData - Datos del email
 * @returns {Promise<Object>} - Resultado del envío
 */
export const sendSimpleEmail = async (emailData) => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.log('📧 [SIMULADO] Email simple para:', emailData.to_email)
      return { success: true, simulated: true }
    }

    const emailjs = await initializeEmailJS()
    if (!emailjs) {
      throw new Error('No se pudo inicializar EmailJS')
    }

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailData
    )

    return {
      success: true,
      messageId: result.text,
      simulated: false
    }

  } catch (error) {
    console.error('❌ Error sending simple email:', error)
    return {
      success: true,
      simulated: true,
      error: error.message
    }
  }
}

/**
 * Generar contenido del email
 * @param {Object} guest - Datos del invitado
 * @param {Object} options - Opciones de personalización
 * @param {boolean} hasPDF - Si incluye PDF adjunto
 * @returns {Object} - Contenido del email
 */
const generateEmailContent = (guest, options = {}, hasPDF = false) => {
  const {
    eventName = guest.event_name || 'Nuestro Evento',
    eventDate = new Date().toLocaleDateString('es-ES'),
    eventLocation = 'Ubicación del evento',
    organizerName = 'Equipo Organizador'
  } = options

  const subject = `🎉 Tu entrada para ${eventName}`

  const pdfSection = hasPDF ? `
    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #0066cc;">
      <h3 style="margin-top: 0; color: #0066cc;">📎 Entrada PDF Adjunta</h3>
      <p style="margin-bottom: 0;">
        <strong>¡Tu entrada está adjunta a este email en formato PDF!</strong><br>
        • Descarga y guarda el archivo PDF<br>
        • También puedes imprimirlo si lo prefieres<br>
        • El PDF contiene tu código QR y todos los detalles del evento
      </p>
    </div>
  ` : `
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #667eea;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #667eea;">Tu código QR de entrada:</p>
        <p style="margin: 0; color: #666; font-size: 0.9em;">El código QR se incluye en este email</p>
      </div>
    </div>
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 2em;">🎵 ${eventName}</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.1em;">Tu entrada está lista</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">¡Hola ${guest.name}! 👋</h2>
        
        <p>¡Genial! Tu entrada para <strong>${eventName}</strong> está confirmada.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Detalles del Evento</h3>
          <p><strong>🎉 Evento:</strong> ${eventName}</p>
          <p><strong>📅 Fecha:</strong> ${eventDate}</p>
          <p><strong>📍 Ubicación:</strong> ${eventLocation}</p>
          <p><strong>👤 Nombre:</strong> ${guest.name}</p>
          <p><strong>📧 Email:</strong> ${guest.email}</p>
        </div>

        ${pdfSection}

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">📱 Instrucciones</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>${hasPDF ? 'Descarga y guarda la entrada PDF adjunta' : 'Guarda el código QR'}</strong></li>
            <li><strong>Preséntalo en la entrada del evento</strong></li>
            <li><strong>Solo es válido para una entrada</strong></li>
            <li><strong>Llega 15 minutos antes</strong> para evitar colas</li>
            ${hasPDF ? '<li><strong>Puedes mostrar el PDF desde tu móvil o imprimirlo</strong></li>' : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 1.1em; color: #667eea; font-weight: bold;">¡Nos vemos en ${eventName}! 🎉</p>
        </div>

        <div style="text-align: center; font-size: 0.9em; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Email enviado automáticamente por ${organizerName}</p>
          <p style="margin: 5px 0 0 0;">Si tienes problemas, contacta al organizador</p>
        </div>
      </div>
    </div>
  `

  const text = `
🎉 ${eventName} - Tu Entrada

¡Hola ${guest.name}!

Tu entrada para ${eventName} está confirmada.

📋 DETALLES DEL EVENTO:
🎉 Evento: ${eventName}
📅 Fecha: ${eventDate}
📍 Ubicación: ${eventLocation}
👤 Nombre: ${guest.name}
📧 Email: ${guest.email}

📱 INSTRUCCIONES:
${hasPDF ? '• Descarga y guarda la entrada PDF adjunta' : '• Guarda el código QR adjunto'}
• Preséntalo en la entrada del evento
• Solo es válido para una entrada
• Llega 15 minutos antes para evitar colas
${hasPDF ? '• Puedes mostrar el PDF desde tu móvil o imprimirlo' : ''}

¡Nos vemos en ${eventName}! 🎉

---
Email enviado automáticamente por ${organizerName}
Si tienes problemas, contacta al organizador
  `

  return { subject, html, text }
}

/**
 * Verificar configuración de EmailJS
 * @returns {Object} - Estado de la configuración
 */
export const checkEmailConfig = () => {
  const config = {
    hasServiceId: !!EMAILJS_SERVICE_ID,
    hasTemplateId: !!EMAILJS_TEMPLATE_ID,
    hasPublicKey: !!EMAILJS_PUBLIC_KEY,
    ready: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY),
    service: 'EmailJS',
    batchSize: BATCH_SIZE,
    batchDelay: BATCH_DELAY,
    emailTimeout: EMAIL_TIMEOUT,
    maxRetries: MAX_RETRIES
  }

  console.log('🔧 Configuración EmailJS optimizada:', config)
  return config
}

/**
 * Función de diagnóstico para debugging
 */
export const diagnoseEmailJS = () => {
  console.log('🔍 Diagnóstico EmailJS Optimizado:')
  console.log('- Service ID:', EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Template ID:', EMAILJS_TEMPLATE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Faltante')
  console.log('- Configuración paralela:')
  console.log(`  • Tamaño de lote: ${BATCH_SIZE} emails simultáneos`)
  console.log(`  • Pausa entre lotes: ${BATCH_DELAY}ms`) 
  console.log(`  • Timeout por email: ${EMAIL_TIMEOUT}ms`)
  console.log(`  • Máximo reintentos: ${MAX_RETRIES}`)
  console.log('- Variables de entorno:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_EMAILJS')))
  
  // Cálculo estimado de tiempo
  const estimatedBatches = Math.ceil(100 / BATCH_SIZE)
  const estimatedTime = (estimatedBatches * BATCH_DELAY) / 1000
  console.log(`- Tiempo estimado para 100 emails: ~${estimatedTime.toFixed(1)}s + tiempo de procesamiento`)
}

export default {
  sendQREmail,
  sendSimpleEmail,
  sendBulkQREmails,
  checkEmailConfig,
  diagnoseEmailJS
}