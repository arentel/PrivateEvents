import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada optimizado (< 50KB) para EmailJS
 * @param {Object} guestData - Datos del invitado
 * @param {Object} eventData - Datos del evento
 * @param {string} logoBase64 - Logo en base64 (opcional, se omite para reducir tamaño)
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} - PDF como base64 para EmailJS attachment
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null, options = {}) => {
  try {
    // Crear documento PDF más pequeño
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85, 120], // Tamaño más pequeño tipo ticket de transporte
      compress: true // Activar compresión
    })

    // Colores simples (sin gradientes para reducir tamaño)
    const primaryColor = [51, 51, 153] // Azul oscuro
    const whiteColor = [255, 255, 255]
    const grayColor = [128, 128, 128]
    const blackColor = [0, 0, 0]

    // HEADER SIMPLE - sin gradientes
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 85, 25, 'F')
    
    // TÍTULO (sin logo para ahorrar espacio)
    doc.setTextColor(...whiteColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ENTRADA', 42.5, 8, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    // Truncar nombre del evento si es muy largo
    const eventName = eventData.name.length > 25 ? 
      eventData.name.substring(0, 25) + '...' : 
      eventData.name
    doc.text(eventName.toUpperCase(), 42.5, 15, { align: 'center' })

    // INFORMACIÓN BÁSICA - diseño minimalista
    let yPos = 35
    
    doc.setFillColor(245, 245, 245)
    doc.rect(3, yPos - 3, 79, 30, 'F')
    
    doc.setTextColor(...blackColor)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    
    // Información esencial solamente
    const eventDate = new Date(eventData.date)
    const dateStr = eventDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
    const timeStr = eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    doc.text('FECHA:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${dateStr} ${timeStr}`, 25, yPos)
    
    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text('INVITADO:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    // Truncar nombre si es muy largo
    const guestName = guestData.name.length > 20 ? 
      guestData.name.substring(0, 20) + '...' : 
      guestData.name
    doc.text(guestName.toUpperCase(), 5, yPos + 5)
    
    yPos += 12
    doc.setFont('helvetica', 'bold')
    doc.text('LUGAR:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    const location = eventData.location && eventData.location.length > 25 ? 
      eventData.location.substring(0, 25) + '...' : 
      (eventData.location || 'Por confirmar')
    doc.text(location, 5, yPos + 5)

    // CÓDIGO QR OPTIMIZADO
    yPos += 20
    
    // Generar QR con calidad mínima pero legible
    const qrData = JSON.stringify({
      id: guestData.id,
      name: guestData.name,
      email: guestData.email,
      eventId: eventData.id,
      timestamp: new Date().toISOString()
    })
    
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 120, // Tamaño reducido
      margin: 1,
      quality: 0.3, // Baja calidad para reducir tamaño
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Fondo blanco para el QR
    doc.setFillColor(...whiteColor)
    doc.rect(15, yPos, 55, 55, 'F')
    doc.setDrawColor(...grayColor)
    doc.rect(15, yPos, 55, 55, 'S')
    
    // QR Code
    doc.addImage(qrCodeBase64, 'PNG', 20, yPos + 5, 45, 45)
    
    // Texto del QR minimalista
    doc.setTextColor(...grayColor)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('PRESENTAR EN ENTRADA', 42.5, yPos + 58, { align: 'center' })

    // ID único pequeño
    yPos += 65
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(`ID: ${guestData.id.substring(0, 8).toUpperCase()}`, 42.5, yPos, { align: 'center' })

    // TÉRMINOS MÍNIMOS
    yPos += 8
    doc.setFillColor(...primaryColor)
    doc.rect(0, yPos, 85, 15, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    
    const terms = [
      '• Entrada personal • No transferible',
      '• Válida una sola vez • Derecho admisión reservado'
    ]
    
    terms.forEach((term, index) => {
      doc.text(term, 42.5, yPos + 4 + (index * 3), { align: 'center' })
    })

    // Retornar como base64 comprimido
    const pdfOutput = doc.output('datauristring')
    
    // Extraer solo la parte base64
    const base64PDF = pdfOutput.split(',')[1]
    
    // Verificar tamaño
    const sizeInBytes = (base64PDF.length * 3) / 4
    const sizeInKB = Math.round(sizeInBytes / 1024)
    
    console.log(`📄 PDF generado: ${sizeInKB}KB (límite 50KB)`)
    
    if (sizeInKB > 50) {
      console.warn(`⚠️ PDF demasiado grande: ${sizeInKB}KB > 50KB`)
      // Podrías lanzar una excepción o optimizar más
    }
    
    return base64PDF

  } catch (error) {
    console.error('❌ Error generating optimized ticket PDF:', error)
    throw new Error('Error al generar la entrada optimizada: ' + error.message)
  }
}

/**
 * Generar PDF para descarga directa (puede ser más grande)
 * @param {Object} guestData - Datos del invitado
 * @param {Object} eventData - Datos del evento
 * @param {string} logoBase64 - Logo en base64
 * @returns {Promise<void>} - Descarga automática
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    // Para descarga directa, usar la versión optimizada pero con descarga
    const base64PDF = await generateTicketForEmail(guestData, eventData, logoBase64)
    
    // Crear blob y descargar
    const byteCharacters = atob(base64PDF)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Entrada_${eventData.name.replace(/\s+/g, '_')}_${guestData.name.replace(/\s+/g, '_')}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpiar URL
    window.URL.revokeObjectURL(url)
    
    return true

  } catch (error) {
    console.error('❌ Error downloading ticket PDF:', error)
    throw error
  }
}

/**
 * Convertir imagen a base64 optimizada
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<string>} - Imagen optimizada en base64
 */
export const imageToBase64Optimized = (file, maxWidth = 200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calcular nuevo tamaño manteniendo aspecto
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64 con compresión
      const base64 = canvas.toDataURL('image/jpeg', quality)
      resolve(base64)
    }
    
    img.onerror = reject
    
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default { 
  generateTicketPDF, 
  generateTicketForEmail, 
  imageToBase64Optimized 
}