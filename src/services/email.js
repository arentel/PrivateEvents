import { generateQRImage } from './qr.js'

// Configuración EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

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
 * Enviar email con código QR usando EmailJS
 * @param {Object} guest - Datos del invitado
 * @param {string} qrCode - Código QR encriptado
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Resultado del envío
 */
export const sendQREmail = async (guest, qrCode, options = {}) => {
  try {
    // Verificar configuración
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.log('📧 [SIMULADO] EmailJS no configurado - Email para:', guest.email)
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        simulated: true,
        reason: 'EmailJS not configured'
      }
    }

    // Inicializar EmailJS
    const emailjs = await initializeEmailJS()
    if (!emailjs) {
      throw new Error('No se pudo inicializar EmailJS')
    }

    // Generar imagen QR
    const qrImageDataUrl = generateQRImage(qrCode, { size: 400 })
    
    // Preparar contenido del email
    const emailContent = generateEmailContent(guest, options)
    
    // Parámetros para EmailJS - usando nombres de campo más estándar
    const templateParams = {
      to_name: guest.name,
      to_email: guest.email,
      from_name: options.organizerName || 'Organizador del Evento',
      event_name: guest.event_name || options.eventName || 'Nuestro Evento',
      event_date: options.eventDate || new Date().toLocaleDateString('es-ES'),
      event_location: options.eventLocation || 'Ubicación del evento',
      subject: emailContent.subject,
      message: emailContent.text,
      html_content: emailContent.html,
      qr_image: qrImageDataUrl,
      reply_to: options.replyTo || 'noreply@evento.com'
    }

    console.log('📧 Enviando email con EmailJS a:', guest.email)
    console.log('🔧 Service ID:', EMAILJS_SERVICE_ID)
    console.log('🔧 Template ID:', EMAILJS_TEMPLATE_ID)

    // Enviar email con timeout
    const result = await Promise.race([
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: EmailJS tardó más de 10 segundos')), 10000)
      )
    ])

    console.log('✅ Email enviado exitosamente!')
    console.log('📧 EmailJS Response:', result)

    return {
      success: true,
      messageId: result.text || `emailjs_${Date.now()}`,
      simulated: false,
      service: 'emailjs'
    }

  } catch (error) {
    console.error('❌ Error enviando email con EmailJS:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      hasPublicKey: !!EMAILJS_PUBLIC_KEY
    })
    
    // En caso de error, simular el envío para no bloquear la aplicación
    console.log('📧 [FALLBACK SIMULADO] Email para:', guest.email)
    
    return {
      success: true,
      messageId: `fallback_${Date.now()}`,
      simulated: true,
      error: error.message,
      originalError: error
    }
  }
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
 * @returns {Object} - Contenido del email
 */
const generateEmailContent = (guest, options = {}) => {
  const {
    eventName = guest.event_name || 'Nuestro Evento',
    eventDate = new Date().toLocaleDateString('es-ES'),
    eventLocation = 'Ubicación del evento',
    organizerName = 'Equipo Organizador'
  } = options

  const subject = `🎉 Tu entrada para ${eventName}`

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

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">📱 Instrucciones</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Guarda el código QR</strong> que aparece en este email</li>
            <li><strong>Preséntalo en la entrada del evento</strong></li>
            <li><strong>Solo es válido para una entrada</strong></li>
            <li><strong>Llega 15 minutos antes</strong> para evitar colas</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #667eea;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #667eea;">Tu código QR de entrada:</p>
            <p style="margin: 0; color: #666; font-size: 0.9em;">El código QR se adjunta a este email</p>
          </div>
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
• Guarda el código QR adjunto
• Preséntalo en la entrada del evento
• Solo es válido para una entrada
• Llega 15 minutos antes para evitar colas

¡Nos vemos en ${eventName}! 🎉

---
Email enviado automáticamente por ${organizerName}
Si tienes problemas, contacta al organizador
  `

  return { subject, html, text }
}

/**
 * Enviar emails masivos
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
    errors: []
  }

  console.log(`📧 Iniciando envío masivo de ${guestsWithQRs.length} emails`)

  for (let i = 0; i < guestsWithQRs.length; i++) {
    const { guest, qrCode } = guestsWithQRs[i]
    
    try {
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: results.total,
          percentage: Math.round(((i + 1) / results.total) * 100),
          currentGuest: guest.name,
          status: 'sending'
        })
      }

      const result = await sendQREmail(guest, qrCode, options)
      
      if (result.success) {
        if (result.simulated) {
          results.simulated++
        } else {
          results.sent++
        }
        
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: results.total,
            percentage: Math.round(((i + 1) / results.total) * 100),
            currentGuest: guest.name,
            status: result.simulated ? 'simulated' : 'success'
          })
        }
      } else {
        results.failed++
        results.errors.push({
          guest: guest.name,
          email: guest.email,
          error: result.error || 'Unknown error'
        })
        
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: results.total,
            percentage: Math.round(((i + 1) / results.total) * 100),
            currentGuest: guest.name,
            status: 'error'
          })
        }
      }
      
      // Pausa entre emails para no sobrecargar EmailJS
      if (i < guestsWithQRs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
    } catch (error) {
      console.error(`❌ Error procesando email para ${guest.name}:`, error)
      results.failed++
      results.errors.push({
        guest: guest.name,
        email: guest.email,
        error: error.message
      })
      
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: results.total,
          percentage: Math.round(((i + 1) / results.total) * 100),
          currentGuest: guest.name,
          status: 'error'
        })
      }
    }
  }

  console.log('📧 Envío masivo completado:', results)
  return results
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
    service: 'EmailJS'
  }

  console.log('🔧 Configuración EmailJS:', config)
  return config
}

/**
 * Función de diagnóstico para debugging
 */
export const diagnoseEmailJS = () => {
  console.log('🔍 Diagnóstico EmailJS:')
  console.log('- Service ID:', EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Template ID:', EMAILJS_TEMPLATE_ID ? '✅ Configurado' : '❌ Faltante')
  console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Faltante')
  console.log('- Variables de entorno disponibles:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_EMAILJS')))
}

export default {
  sendQREmail,
  sendSimpleEmail,
  sendBulkQREmails,
  checkEmailConfig,
  diagnoseEmailJS
}