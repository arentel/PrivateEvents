import QRious from 'qrious'
import CryptoJS from 'crypto-js'

// Clave secreta para encriptar/desencriptar QRs
// En producción, esto debería estar en variables de entorno
const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'DISCOTECA_SECRET_2024'

// Configuración de QR
const QR_CONFIG = {
  size: 300,
  level: 'H', // Alta corrección de errores
  background: 'white',
  foreground: 'black'
}

/**
 * Generar código QR encriptado para un invitado
 * @param {Object} guestData - Datos del invitado
 * @returns {Promise<string>} - Código QR encriptado como string
 */
export const generateQRCode = async (guestData) => {
  try {
    // Preparar datos para el QR
    const qrData = {
      id: guestData.id,
      name: guestData.name,
      email: guestData.email,
      event_name: guestData.event_name || guestData.event,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString(),
      version: '1.0' // Para compatibilidad futura
    }

    // Encriptar los datos
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(qrData), 
      SECRET_KEY
    ).toString()

    return encryptedData
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Error al generar código QR')
  }
}

/**
 * Generar imagen QR como canvas o data URL
 * @param {string} encryptedData - Datos encriptados del QR
 * @param {Object} options - Opciones de configuración
 * @returns {string} - Data URL de la imagen QR
 */
export const generateQRImage = (encryptedData, options = {}) => {
  try {
    const config = { ...QR_CONFIG, ...options }
    
    // Crear canvas temporal
    const canvas = document.createElement('canvas')
    
    const qr = new QRious({
      element: canvas,
      value: encryptedData,
      size: config.size,
      level: config.level,
      background: config.background,
      foreground: config.foreground
    })

    // Retornar como data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating QR image:', error)
    throw new Error('Error al generar imagen QR')
  }
}

/**
 * Validar y desencriptar código QR
 * @param {string} encryptedData - Código QR encriptado
 * @returns {Object|null} - Datos del invitado o null si es inválido
 */
export const validateQRCode = async (encryptedData) => {
  try {
    // Desencriptar los datos
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedData) {
      console.warn('QR code decryption failed')
      return null
    }

    // Parsear JSON
    const qrData = JSON.parse(decryptedData)

    // Validaciones básicas
    if (!qrData.id || !qrData.name || !qrData.email) {
      console.warn('QR code missing required fields')
      return null
    }

    // Verificar que el código sea del día actual (opcional)
    const qrDate = new Date(qrData.date)
    const today = new Date()
    
    // Solo verificar fecha si es necesario (comentado por flexibilidad)
    // if (qrDate.toDateString() !== today.toDateString()) {
    //   console.warn('QR code is from a different date')
    //   return null
    // }

    return qrData
  } catch (error) {
    console.error('Error validating QR code:', error)
    return null
  }
}

/**
 * Crear QR con logo o personalización
 * @param {string} encryptedData - Datos encriptados
 * @param {Object} customization - Opciones de personalización
 * @returns {string} - Data URL de la imagen personalizada
 */
export const generateCustomQR = (encryptedData, customization = {}) => {
  try {
    const {
      size = 300,
      backgroundColor = 'white',
      foregroundColor = 'black',
      logo = null,
      borderRadius = 0
    } = customization

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = size
    canvas.height = size

    // Generar QR base
    const qr = new QRious({
      element: canvas,
      value: encryptedData,
      size: size,
      level: 'H',
      background: backgroundColor,
      foreground: foregroundColor
    })

    // Añadir logo si se proporciona
    if (logo) {
      const logoSize = size * 0.2 // 20% del tamaño del QR
      const logoPosition = (size - logoSize) / 2

      const logoImg = new Image()
      logoImg.onload = () => {
        // Crear fondo blanco para el logo
        ctx.fillStyle = backgroundColor
        ctx.fillRect(
          logoPosition - 10, 
          logoPosition - 10, 
          logoSize + 20, 
          logoSize + 20
        )
        
        // Dibujar logo
        ctx.drawImage(logoImg, logoPosition, logoPosition, logoSize, logoSize)
      }
      logoImg.src = logo
    }

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating custom QR:', error)
    throw new Error('Error al generar QR personalizado')
  }
}

/**
 * Crear múltiples QRs para una lista de invitados
 * @param {Array} guestsList - Lista de invitados
 * @param {Function} progressCallback - Callback para progreso
 * @returns {Promise<Array>} - Array de objetos con guest y qrCode
 */
export const generateBulkQRs = async (guestsList, progressCallback = null) => {
  const results = []
  
  for (let i = 0; i < guestsList.length; i++) {
    try {
      const guest = guestsList[i]
      const qrCode = await generateQRCode(guest)
      
      results.push({
        guest,
        qrCode,
        success: true
      })
      
      // Notificar progreso
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: guestsList.length,
          percentage: Math.round(((i + 1) / guestsList.length) * 100),
          currentGuest: guest.name
        })
      }
      
      // Pequeña pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Error generating QR for ${guestsList[i].name}:`, error)
      results.push({
        guest: guestsList[i],
        qrCode: null,
        success: false,
        error: error.message
      })
    }
  }
  
  return results
}

/**
 * Verificar integridad del código QR
 * @param {string} encryptedData - Código QR encriptado
 * @returns {Object} - Resultado de la verificación
 */
export const verifyQRIntegrity = (encryptedData) => {
  try {
    const qrData = validateQRCode(encryptedData)
    
    if (!qrData) {
      return {
        valid: false,
        reason: 'Código QR corrupto o inválido'
      }
    }

    // Verificaciones adicionales
    const checks = {
      hasRequiredFields: !!(qrData.id && qrData.name && qrData.email),
      hasValidTimestamp: !isNaN(new Date(qrData.timestamp).getTime()),
      hasValidVersion: qrData.version === '1.0'
    }

    const allChecksPass = Object.values(checks).every(check => check)

    return {
      valid: allChecksPass,
      checks,
      data: qrData,
      reason: allChecksPass ? 'Código QR válido' : 'Falló alguna verificación'
    }
  } catch (error) {
    return {
      valid: false,
      reason: 'Error al verificar código QR',
      error: error.message
    }
  }
}

/**
 * Convertir QR a diferentes formatos
 * @param {string} encryptedData - Datos encriptados
 * @param {string} format - Formato deseado (png, jpeg, svg)
 * @param {Object} options - Opciones adicionales
 * @returns {string} - Imagen en el formato solicitado
 */
export const convertQRFormat = (encryptedData, format = 'png', options = {}) => {
  try {
    const canvas = document.createElement('canvas')
    const { size = 300, quality = 0.92 } = options

    const qr = new QRious({
      element: canvas,
      value: encryptedData,
      size: size,
      level: 'H',
      background: 'white',
      foreground: 'black'
    })

    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return canvas.toDataURL('image/jpeg', quality)
      case 'png':
      default:
        return canvas.toDataURL('image/png')
    }
  } catch (error) {
    console.error('Error converting QR format:', error)
    throw new Error('Error al convertir formato QR')
  }
}

/**
 * Obtener información del QR sin validar completamente
 * @param {string} encryptedData - Código QR encriptado
 * @returns {Object|null} - Información básica del QR
 */
export const getQRInfo = (encryptedData) => {
  try {
    const qrData = validateQRCode(encryptedData)
    
    if (!qrData) return null

    return {
      guestName: qrData.name,
      guestEmail: qrData.email,
      eventName: qrData.event_name,
      generatedAt: qrData.timestamp,
      generatedDate: qrData.date,
      version: qrData.version || '1.0'
    }
  } catch (error) {
    console.error('Error getting QR info:', error)
    return null
  }
}

// Utilidades adicionales
export const qrUtils = {
  // Generar código único para backup
  generateBackupCode: (guestData) => {
    return `${guestData.name.substring(0, 3).toUpperCase()}${guestData.id.substring(0, 8)}`.replace(/\s/g, '')
  },

  // Validar formato de email en QR
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Limpiar datos de entrada
  sanitizeGuestData: (guestData) => {
    return {
      ...guestData,
      name: guestData.name.trim(),
      email: guestData.email.trim().toLowerCase()
    }
  }
}

export {
  QR_CONFIG,
  SECRET_KEY
}