import CryptoJS from 'crypto-js'

// Clave secreta (en producción usar variable de entorno)
const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'DISCOTECA_SECRET_2024'

/**
 * Encriptar datos
 * @param {Object|string} data - Datos a encriptar
 * @returns {string} - Datos encriptados
 */
export const encrypt = (data) => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data)
    return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString()
  } catch (error) {
    console.error('Error encrypting data:', error)
    throw new Error('Error al encriptar datos')
  }
}

/**
 * Desencriptar datos
 * @param {string} encryptedData - Datos encriptados
 * @returns {Object|string} - Datos desencriptados
 */
export const decrypt = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedData) {
      throw new Error('Datos corruptos o clave incorrecta')
    }
    
    // Intentar parsear como JSON, si falla devolver como string
    try {
      return JSON.parse(decryptedData)
    } catch {
      return decryptedData
    }
  } catch (error) {
    console.error('Error decrypting data:', error)
    throw new Error('Error al desencriptar datos')
  }
}

/**
 * Generar hash MD5
 * @param {string} data - Datos a hashear
 * @returns {string} - Hash MD5
 */
export const generateHash = (data) => {
  return CryptoJS.MD5(data).toString()
}

/**
 * Generar ID único
 * @returns {string} - ID único
 */
export const generateUniqueId = () => {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2)
  return `${timestamp}_${random}`
}

/**
 * Verificar integridad de datos
 * @param {string} data - Datos originales
 * @param {string} hash - Hash a verificar
 * @returns {boolean} - True si la integridad es válida
 */
export const verifyIntegrity = (data, hash) => {
  return generateHash(data) === hash
}

export default {
  encrypt,
  decrypt,
  generateHash,
  generateUniqueId,
  verifyIntegrity
}