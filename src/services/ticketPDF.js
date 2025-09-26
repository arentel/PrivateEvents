import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada basado en el diseño de referencia
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null, options = {}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Colores del diseño de referencia
    const colors = {
      primary: [102, 126, 234],      // Azul principal
      primaryDark: [60, 80, 180],    // Azul más oscuro
      white: [255, 255, 255],        
      black: [0, 0, 0],              
      gray: [128, 128, 128],         
      lightGray: [245, 245, 245],    
      text: [33, 33, 33]             
    }

    const pageWidth = 210
    const pageHeight = 297
    const margin = 15

    // DEPURACIÓN: Log de la fecha recibida
    console.log('DEBUG - Fecha del evento recibida:', eventData.date)
    console.log('DEBUG - Tipo de fecha:', typeof eventData.date)

    // === HEADER CON GRADIENTE AZUL ===
    // Fondo azul degradado
    for (let i = 0; i < 60; i++) {
      const ratio = i / 60
      const r = Math.round(colors.primary[0] + (colors.primaryDark[0] - colors.primary[0]) * ratio)
      const g = Math.round(colors.primary[1] + (colors.primaryDark[1] - colors.primary[1]) * ratio)
      const b = Math.round(colors.primary[2] + (colors.primaryDark[2] - colors.primary[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 1, 'F')
    }

    // Título del evento
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.text(eventData.name || 'EVENTO', pageWidth / 2, 25, { align: 'center' })

    // Fecha del evento (CORREGIDA)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const eventDateFormatted = formatEventDateFixed(eventData.date)
    doc.text(eventDateFormatted, pageWidth / 2, 40, { align: 'center' })

    // Ubicación si existe
    if (eventData.location) {
      doc.setFontSize(11)
      doc.text(eventData.location, pageWidth / 2, 50, { 
        align: 'center',
        maxWidth: pageWidth - 30
      })
    }

    // === INFORMACIÓN DEL INVITADO ===
    let yPos = 80

    // Nombre del invitado
    doc.setTextColor(...colors.text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(guestData.name || 'Invitado', pageWidth / 2, yPos, { align: 'center' })

    yPos += 10
    // Email
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...colors.gray)
    doc.text(guestData.email || '', pageWidth / 2, yPos, { align: 'center' })

    yPos += 15
    // Válido para 1 persona
    doc.setTextColor(...colors.text)
    doc.setFontSize(11)
    doc.text('Válido para 1 persona', pageWidth / 2, yPos, { align: 'center' })

    // === CÓDIGO QR GRANDE CENTRADO ===
    yPos += 25

    // Generar datos del QR
    const qrData = JSON.stringify({
      guest: {
        id: guestData.id || 'guest_' + Date.now(),
        name: guestData.name || 'Invitado',
        email: guestData.email || ''
      },
      event: {
        id: eventData.id || 'event_' + Date.now(),
        name: eventData.name || 'Evento',
        date: eventData.date || new Date().toISOString()
      },
      validation: {
        issued: new Date().toISOString(),
        version: '2.0'
      }
    })

    // Generar QR de alta calidad
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 800,
      margin: 1,
      quality: 1.0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })

    // QR muy grande como en la referencia
    const qrSize = 100
    const qrX = (pageWidth - qrSize) / 2

    // Fondo blanco para el QR
    doc.setFillColor(...colors.white)
    doc.setDrawColor(...colors.gray)
    doc.setLineWidth(1)
    doc.roundedRect(qrX - 5, yPos - 5, qrSize + 10, qrSize + 10, 2, 2, 'FD')

    // Insertar QR
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)

    // Código de referencia debajo del QR
    yPos += qrSize + 15
    doc.setTextColor(...colors.text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    const referenceCode = options.downloadCode || generateRandomCode()
    doc.text(referenceCode, pageWidth / 2, yPos, { align: 'center' })

    // === INFORMACIÓN ADICIONAL ===
    yPos += 25

    // Caja con información adicional
    doc.setFillColor(...colors.lightGray)
    doc.setDrawColor(...colors.gray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 40, 3, 3, 'FD')

    yPos += 12
    doc.setTextColor(...colors.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('DETALLES DE LA ENTRADA', margin + 10, yPos)

    yPos += 8
    doc.setTextColor(...colors.text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const details = [
      `Evento: ${eventData.name || 'Evento'}`,
      `Fecha: ${eventDateFormatted}`,
      `Titular: ${guestData.name || 'Invitado'}`,
      `Email: ${guestData.email || ''}`
    ]

    details.forEach((detail, index) => {
      doc.text(detail, margin + 10, yPos + (index * 5))
    })

    // === TÉRMINOS SIMPLES ===
    yPos += 35
    
    doc.setFillColor(255, 248, 220) // Fondo amarillo claro
    doc.setDrawColor(...colors.gray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 3, 3, 'FD')

    yPos += 8
    doc.setTextColor(...colors.text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('• Entrada personal e intransferible', margin + 10, yPos)
    doc.text('• Presenta este código QR en la entrada', margin + 10, yPos + 5)
    doc.text('• Llegar 15 minutos antes del evento', margin + 10, yPos + 10)

    // === FOOTER MINIMALISTA ===
    const footerY = pageHeight - 15

    // Línea separadora
    doc.setDrawColor(...colors.gray)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    // Texto del footer
    doc.setTextColor(...colors.gray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    const currentDate = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })

    doc.text(`Entrada generada el ${currentDate}`, pageWidth / 2, footerY, { align: 'center' })

    // Generar PDF
    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]

    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`PDF generado: ${sizeInKB}KB`)

    return base64PDF

  } catch (error) {
    console.error('Error generando PDF:', error)
    throw new Error('Error al generar la entrada: ' + error.message)
  }
}

/**
 * Función específica para formatear fecha del evento con debugging
 */
const formatEventDateFixed = (eventDateInput) => {
  console.log('DEBUG formatEventDateFixed - Input recibido:', eventDateInput)
  console.log('DEBUG formatEventDateFixed - Tipo:', typeof eventDateInput)
  
  if (!eventDateInput) {
    console.log('DEBUG - No hay fecha, retornando por defecto')
    return 'Fecha por confirmar'
  }
  
  try {
    let eventDate

    // Manejar diferentes formatos
    if (typeof eventDateInput === 'string') {
      console.log('DEBUG - Procesando string:', eventDateInput)
      eventDate = new Date(eventDateInput)
    } else if (typeof eventDateInput === 'number') {
      console.log('DEBUG - Procesando number (timestamp):', eventDateInput)
      eventDate = new Date(eventDateInput)
    } else if (eventDateInput instanceof Date) {
      console.log('DEBUG - Ya es objeto Date')
      eventDate = eventDateInput
    } else {
      console.log('DEBUG - Formato no reconocido, intentando conversión directa')
      eventDate = new Date(eventDateInput)
    }

    // Verificar validez
    if (isNaN(eventDate.getTime())) {
      console.log('DEBUG - Fecha inválida después de conversión')
      return 'Fecha por confirmar'
    }

    // Formatear como en el ejemplo
    const formatted = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase()

    console.log('DEBUG - Fecha formateada:', formatted)
    return formatted

  } catch (error) {
    console.error('DEBUG - Error formateando fecha:', error)
    return 'Fecha por confirmar'
  }
}

/**
 * Generar código aleatorio de referencia
 */
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    console.log('Generando PDF de entrada:', guestData.name)
    console.log('Fecha del evento recibida:', eventData.date)
    
    const base64PDF = await generateTicketForEmail(guestData, eventData, logoBase64)
    
    // Crear blob y descargar
    const byteCharacters = atob(base64PDF)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Nombre del archivo
    const eventName = (eventData.name || 'Evento')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20)
    
    const guestName = (guestData.name || 'Invitado')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20)
    
    const date = new Date().toISOString().split('T')[0]
    
    link.download = `Entrada_${eventName}_${guestName}_${date}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return true

  } catch (error) {
    console.error('Error descargando PDF:', error)
    throw error
  }
}

/**
 * Versión compacta
 */
export const generateCompactTicketForEmail = async (guestData, eventData) => {
  try {
    return await generateTicketForEmail(guestData, eventData, null)
  } catch (error) {
    console.error('Error generando PDF compacto:', error)
    throw error
  }
}

export default { 
  generateTicketPDF, 
  generateTicketForEmail, 
  generateCompactTicketForEmail
}