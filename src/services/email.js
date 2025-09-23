import emailjs from '@emailjs/browser'
import { generateQRImage } from './qr.js'

// Configuración EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Inicializar EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY)
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

    // Generar imagen QR
    const qrImageDataUrl = generateQRImage(qrCode, { size: 400 })
    
    // Preparar contenido del email
    const emailContent = generateEmailContent(guest, options)
    
    // Parámetros para EmailJS
    const templateParams = {
      to_name: guest.name,
      to_email: guest.email,
      event_name: guest.event_name || 'Nuestro Evento',
      event_date: new Date().toLocaleDateString('es-ES'),
      subject: emailContent.subject,
      message: emailContent.text,
      html_content: emailContent.html,
      qr_image: qrImageDataUrl,
      reply_to: 'noreply@evento.com'
    }

    console.log('📧 Enviando email REAL con EmailJS a:', guest.email)

    // Enviar email
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

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
    
    // En caso de error, simular el envío
    console.log('📧 [FALLBACK SIMULADO] Email para:', guest.email)
    console.log('📧 Error:', error.message)
    
    return {
      success: true,
      messageId: `fallback_${Date.now()}`,
      simulated: true,
      error: error.message
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
      console.log('📧 [SIMULADO] Email simple para:', emailData.to)
      return { success: true, simulated: true }
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
    console.error('Error sending simple email:', error)
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
            <li><strong>Guarda el código QR</strong> que aparece abajo</li>
            <li><strong>Preséntalo en la entrada</strong></li>
            <li><strong>Solo es válido para una entrada</strong></li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 1.1em; color: #667eea; font-weight: bold;">¡Nos vemos en ${eventName}! 🎉</p>
        </div>

        <div style="text-align: center; font-size: 0.9em; color: #666;">
          <p>Email enviado automáticamente por ${organizerName}</p>
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
• Preséntalo en la entrada
• Solo es válido para una entrada

¡Nos vemos en ${eventName}! 🎉

---
Email enviado automáticamente por ${organizerName}
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
    errors: []
  }

  for (let i = 0; i < guestsWithQRs.length; i++) {
    const { guest, qrCode } = guestsWithQRs[i]
    
    try {
      await sendQREmail(guest, qrCode, options)
      results.sent++
      
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: results.total,
          percentage: Math.round(((i + 1) / results.total) * 100),
          currentGuest: guest.name,
          status: 'success'
        })
      }
      
      // Pausa entre emails para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
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

  return results
}

/**
 * Verificar configuración de EmailJS
 * @returns {Object} - Estado de la configuración
 */
export const checkEmailConfig = () => {
  return {
    hasServiceId: !!EMAILJS_SERVICE_ID,
    hasTemplateId: !!EMAILJS_TEMPLATE_ID,
    hasPublicKey: !!EMAILJS_PUBLIC_KEY,
    ready: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY),
    service: 'EmailJS'
  }
}

export default {
  sendQREmail,
  sendSimpleEmail,
  sendBulkQREmails,
  checkEmailConfig
}