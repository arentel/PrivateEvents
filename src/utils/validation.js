/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar nombre (solo letras y espacios)
 * @param {string} name - Nombre a validar
 * @returns {boolean} - True si es válido
 */
export const isValidName = (name) => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  return nameRegex.test(name) && name.trim().length >= 2
}

/**
 * Limpiar y formatear nombre
 * @param {string} name - Nombre a limpiar
 * @returns {string} - Nombre limpio
 */
export const cleanName = (name) => {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Limpiar y formatear email
 * @param {string} email - Email a limpiar
 * @returns {string} - Email limpio
 */
export const cleanEmail = (email) => {
  return email.trim().toLowerCase()
}

/**
 * Validar datos de invitado
 * @param {Object} guest - Datos del invitado
 * @returns {Object} - Resultado de validación
 */
export const validateGuest = (guest) => {
  const errors = []
  
  // Validar nombre
  if (!guest.name || !guest.name.trim()) {
    errors.push('El nombre es requerido')
  } else if (!isValidName(guest.name)) {
    errors.push('El nombre solo puede contener letras y espacios')
  }
  
  // Validar email
  if (!guest.email || !guest.email.trim()) {
    errors.push('El email es requerido')
  } else if (!isValidEmail(guest.email)) {
    errors.push('El formato del email no es válido')
  }
  
  // Validar nombre del evento
  if (!guest.event_name || !guest.event_name.trim()) {
    errors.push('El nombre del evento es requerido')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanData: errors.length === 0 ? {
      name: cleanName(guest.name),
      email: cleanEmail(guest.email),
      event_name: guest.event_name.trim()
    } : null
  }
}

/**
 * Validar lista de invitados en formato texto
 * @param {string} guestListText - Texto con lista de invitados
 * @returns {Object} - Resultado de validación
 */
export const validateGuestList = (guestListText) => {
  const lines = guestListText.trim().split('\n')
  const validGuests = []
  const errors = []
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const parts = line.split(',').map(p => p.trim())
    
    if (parts.length < 2) {
      errors.push(`Línea ${lineNumber}: Formato incorrecto (debe ser: Nombre, Email)`)
      return
    }
    
    const [name, email] = parts
    const guestValidation = validateGuest({ name, email, event_name: 'temp' })
    
    if (guestValidation.isValid) {
      validGuests.push({
        name: guestValidation.cleanData.name,
        email: guestValidation.cleanData.email
      })
    } else {
      guestValidation.errors.forEach(error => {
        errors.push(`Línea ${lineNumber}: ${error}`)
      })
    }
  })
  
  return {
    isValid: errors.length === 0,
    validGuests,
    errors,
    totalLines: lines.length,
    validCount: validGuests.length
  }
}

/**
 * Detectar emails duplicados en una lista
 * @param {Array} guests - Lista de invitados
 * @returns {Array} - Emails duplicados
 */
export const findDuplicateEmails = (guests) => {
  const emailCounts = {}
  const duplicates = []
  
  guests.forEach(guest => {
    const email = guest.email.toLowerCase()
    emailCounts[email] = (emailCounts[email] || 0) + 1
  })
  
  Object.entries(emailCounts).forEach(([email, count]) => {
    if (count > 1) {
      duplicates.push(email)
    }
  })
  
  return duplicates
}

/**
 * Validar formato de teléfono (internacional)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - True si es válido
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}

/**
 * Limpiar formato de teléfono
 * @param {string} phone - Teléfono a limpiar
 * @returns {string} - Teléfono limpio
 */
export const cleanPhone = (phone) => {
  return phone.replace(/[\s-()]/g, '')
}

/**
 * Validar fecha
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} - True si es válida
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * Validar que una fecha sea futura
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} - True si es futura
 */
export const isFutureDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  return date > now
}

/**
 * Validar configuración de evento
 * @param {Object} event - Datos del evento
 * @returns {Object} - Resultado de validación
 */
export const validateEvent = (event) => {
  const errors = []
  
  if (!event.name || !event.name.trim()) {
    errors.push('El nombre del evento es requerido')
  }
  
  if (event.date && !isValidDate(event.date)) {
    errors.push('La fecha del evento no es válida')
  }
  
  if (event.date && !isFutureDate(event.date)) {
    errors.push('La fecha del evento debe ser futura')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitizar texto para evitar XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export const sanitizeText = (text) => {
  if (!text) return ''
  
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover eventos como onclick=
    .trim()
}

/**
 * Validar código QR
 * @param {string} qrCode - Código QR a validar
 * @returns {boolean} - True si es válido
 */
export const isValidQRCode = (qrCode) => {
  try {
    // Verificar que no esté vacío
    if (!qrCode || !qrCode.trim()) {
      return false
    }
    
    // Verificar longitud mínima (un QR encriptado debe tener cierta longitud)
    if (qrCode.length < 20) {
      return false
    }
    
    // Verificar que contenga caracteres válidos para base64
    const base64Regex = /^[A-Za-z0-9+/=]+$/
    return base64Regex.test(qrCode)
  } catch (error) {
    return false
  }
}

/**
 * Validar configuración de email
 * @param {Object} emailConfig - Configuración de email
 * @returns {Object} - Resultado de validación
 */
export const validateEmailConfig = (emailConfig) => {
  const errors = []
  
  if (!emailConfig.fromEmail || !isValidEmail(emailConfig.fromEmail)) {
    errors.push('Email remitente no es válido')
  }
  
  if (!emailConfig.apiKey || emailConfig.apiKey.length < 10) {
    errors.push('API Key no es válida')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formatear errores para mostrar al usuario
 * @param {Array} errors - Lista de errores
 * @returns {string} - Errores formateados
 */
export const formatErrors = (errors) => {
  if (!errors || errors.length === 0) {
    return ''
  }
  
  if (errors.length === 1) {
    return errors[0]
  }
  
  return `Se encontraron ${errors.length} errores:\n• ${errors.join('\n• ')}`
}

/**
 * Validar configuración completa de la aplicación
 * @param {Object} config - Configuración completa
 * @returns {Object} - Resultado de validación
 */
export const validateAppConfig = (config) => {
  const errors = []
  const warnings = []
  
  // Validar Supabase
  if (!config.supabaseUrl) {
    errors.push('URL de Supabase no configurada')
  }
  
  if (!config.supabaseKey) {
    errors.push('Clave de Supabase no configurada')
  }
  
  // Validar email (opcional)
  if (!config.resendApiKey) {
    warnings.push('API de Resend no configurada - emails se simularán')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canRun: errors.length === 0
  }
}

export default {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidDate,
  isFutureDate,
  isValidQRCode,
  cleanName,
  cleanEmail,
  cleanPhone,
  sanitizeText,
  validateGuest,
  validateGuestList,
  validateEvent,
  validateEmailConfig,
  validateAppConfig,
  findDuplicateEmails,
  formatErrors
}