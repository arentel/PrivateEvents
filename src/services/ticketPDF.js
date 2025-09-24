import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada personalizada para discoteca
 * @param {Object} guestData - Datos del invitado
 * @param {Object} eventData - Datos del evento
 * @param {string} logoBase64 - Logo en base64 (opcional)
 * @returns {Promise<void>} - Descarga automática del PDF
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    // Crear documento PDF en formato entrada (más pequeño)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 180] // Tamaño tipo entrada de evento
    })

    // Colores de la discoteca
    const primaryColor = [102, 126, 234]
    const accentColor = [118, 75, 162]
    const darkColor = [33, 37, 41]
    const lightColor = [248, 249, 250]

    // FONDO DEGRADADO SIMULADO
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 100, 50, 'F')
    
    doc.setFillColor(...accentColor)
    doc.rect(0, 30, 100, 20, 'F')

    // LOGO DE LA DISCOTECA (si se proporciona)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 10, 5, 25, 25)
      } catch (error) {
        console.log('Error adding logo:', error)
      }
    }

    // TÍTULO PRINCIPAL
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('ENTRADA VIP', 50, logoBase64 ? 15 : 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(eventData.name.toUpperCase(), 50, logoBase64 ? 25 : 30, { align: 'center' })

    // INFORMACIÓN DEL EVENTO
    let yPos = 60
    
    doc.setFillColor(...lightColor)
    doc.rect(5, yPos - 5, 90, 35, 'F')
    
    doc.setTextColor(...darkColor)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    
    // Fecha y hora
    const eventDate = new Date(eventData.date)
    doc.text('FECHA:', 10, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase(), 25, yPos)
    
    yPos += 8
    doc.setFont(undefined, 'bold')
    doc.text('HORA:', 10, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }), 25, yPos)
    
    // Ubicación
    if (eventData.location) {
      yPos += 8
      doc.setFont(undefined, 'bold')
      doc.text('LUGAR:', 10, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(eventData.location.toUpperCase(), 10, yPos + 6)
    }

    // DATOS DEL INVITADO
    yPos += 20
    doc.setFillColor(240, 240, 240)
    doc.rect(5, yPos - 5, 90, 25, 'F')
    
    doc.setTextColor(...darkColor)
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.text('INVITADO:', 10, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(guestData.name.toUpperCase(), 10, yPos + 6)
    
    doc.setFont(undefined, 'bold')
    doc.text('EMAIL:', 10, yPos + 12)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    doc.text(guestData.email, 10, yPos + 18)

    // CÓDIGO QR GRANDE Y CENTRADO
    yPos += 35
    
    // Generar QR code
    const qrData = JSON.stringify({
      id: guestData.id,
      name: guestData.name,
      email: guestData.email,
      eventId: eventData.id,
      eventName: eventData.name,
      timestamp: new Date().toISOString()
    })
    
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Fondo blanco para el QR
    doc.setFillColor(255, 255, 255)
    doc.rect(20, yPos, 60, 60, 'F')
    
    // QR Code centrado
    doc.addImage(qrCodeBase64, 'PNG', 25, yPos + 5, 50, 50)
    
    // Texto del QR
    doc.setTextColor(...darkColor)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text('PRESENTA ESTE CÓDIGO EN LA ENTRADA', 50, yPos + 65, { align: 'center' })

    // TÉRMINOS Y CONDICIONES
    yPos += 75
    doc.setFillColor(...primaryColor)
    doc.rect(0, yPos, 100, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont(undefined, 'bold')
    doc.text('TÉRMINOS Y CONDICIONES:', 50, yPos + 5, { align: 'center' })
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(6)
    const terms = [
      '• Válido solo para una entrada',
      '• No transferible ni revendible', 
      '• La dirección se reserva el derecho de admisión',
      '• Entrada sujeta a aforo disponible',
      '• Prohibido el acceso con bebidas del exterior'
    ]
    
    terms.forEach((term, index) => {
      doc.text(term, 5, yPos + 10 + (index * 3))
    })

    // NÚMERO DE ENTRADA (código único)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont(undefined, 'bold')
    doc.text(`#${guestData.id.substring(0, 8).toUpperCase()}`, 50, yPos + 22, { align: 'center' })

    // Descargar PDF
    const fileName = `Entrada_${eventData.name.replace(/\s+/g, '_')}_${guestData.name.replace(/\s+/g, '_')}.pdf`
    doc.save(fileName)
    
    return true

  } catch (error) {
    console.error('Error generating ticket PDF:', error)
    throw new Error('Error al generar la entrada: ' + error.message)
  }
}

/**
 * Generar entrada para envío por email (formato base64)
 * @param {Object} guestData - Datos del invitado  
 * @param {Object} eventData - Datos del evento
 * @param {string} logoBase64 - Logo en base64
 * @returns {Promise<string>} - PDF en base64 para adjuntar al email
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm', 
      format: [100, 180]
    })

    // Usar la misma lógica que generateTicketPDF pero sin descargar
    // ... (mismo código que arriba hasta antes del doc.save)

    // Retornar como base64 para email
    return doc.output('datauristring').split(',')[1]

  } catch (error) {
    console.error('Error generating ticket for email:', error)
    throw error
  }
}

/**
 * Convertir imagen a base64 (utilidad)
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - Imagen en base64
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

export default { generateTicketPDF, generateTicketForEmail, imageToBase64 }