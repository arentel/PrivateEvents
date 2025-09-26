import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada manteniendo consistencia con el template del email
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null, options = {}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Colores exactos del template del email
    const colors = {
      primaryDark: [13, 27, 42],      // #0d1b2a - Azul oscuro del header
      primaryBlue: [30, 58, 138],     // #1e3a8a - Azul del gradiente
      darkText: [51, 51, 51],         // #333333 - Texto principal
      mediumGray: [85, 85, 85],       // #555555 - Labels
      lightGray: [249, 249, 249],     // #f9f9f9 - Fondos claros
      borderGray: [220, 220, 220],    // #dcdcdc - Bordes
      white: [255, 255, 255],         // #ffffff
      success: [40, 167, 69]          // #28a745 - Verde para válido
    }

    const pageWidth = 210
    const pageHeight = 297
    const margin = 20

    // === HEADER IDÉNTICO AL EMAIL ===
    // Fondo del header
    doc.setFillColor(...colors.primaryDark)
    doc.rect(0, 0, pageWidth, 50, 'F')
    
    // Título principal
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.text(eventData.name || 'EVENTO', pageWidth / 2, 25, { align: 'center' })
    
    // Subtítulo
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('Tu entrada está confirmada', pageWidth / 2, 38, { align: 'center' })

    // === SALUDO PERSONAL ===
    let yPos = 70
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text(`Hola ${guestData.name || 'Invitado'},`, margin, yPos)
    
    yPos += 10
    doc.setTextColor(...colors.darkText)
    doc.setFontSize(12)
    doc.text('Tu entrada ha sido confirmada y está lista para usar.', margin, yPos)

    // === DETALLES DEL EVENTO (Estilo del email) ===
    yPos += 20
    
    // Caja de detalles con el mismo estilo del email
    doc.setFillColor(...colors.lightGray)
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 60, 3, 3, 'FD')
    
    // Título de la sección
    yPos += 12
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.text('Detalles del Evento', margin + 10, yPos)
    
    // Tabla de información (igual que en el email)
    yPos += 8
    doc.setFontSize(11)
    
    // DEPURACIÓN: Log de la fecha recibida
    console.log('DEBUG - Fecha del evento recibida:', eventData.date)
    console.log('DEBUG - Tipo de fecha:', typeof eventData.date)
    
    const details = [
      ['Evento:', eventData.name || 'Evento'],
      ['Fecha:', formatEventDateFixed(eventData.date)], // *** FUNCIÓN ESPECÍFICA ***
      ['Ubicación:', eventData.location || 'Ubicación por confirmar'],
      ['Nombre:', guestData.name || 'Invitado'],
      ['Email:', guestData.email || '']
    ]
    
    details.forEach((detail, index) => {
      const rowY = yPos + (index * 7)
      
      // Label (negrita, color medio)
      doc.setTextColor(...colors.mediumGray)
      doc.setFont('helvetica', 'bold')
      doc.text(detail[0], margin + 10, rowY)
      
      // Valor (normal, color oscuro)
      doc.setTextColor(...colors.darkText)
      doc.setFont('helvetica', 'normal')
      doc.text(detail[1], margin + 50, rowY, { maxWidth: pageWidth - 90 })
    })

    // === SECCIÓN SIMPLIFICADA PARA PRIORIZAR EL QR ===
    yPos += 50
    
    // Título simplificado
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Tu Código de Entrada', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('Presenta este código QR en la entrada del evento', pageWidth / 2, yPos, { align: 'center' })

    // === CÓDIGO QR PRIORITARIO - MÁS GRANDE ===
    yPos += 25
    
    // Generar QR con los mismos datos que en el email
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
    
    // *** QR MÁS GRANDE PARA SER EL ELEMENTO PRINCIPAL ***
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 800, // Más resolución
      margin: 1, // Menos margen
      quality: 1.0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    
    // *** QR MUCHO MÁS GRANDE - ELEMENTO PRINCIPAL ***
    const qrSize = 120 // Aumentado significativamente
    const qrX = (pageWidth - qrSize) / 2
    
    // Fondo blanco con borde destacado
    doc.setFillColor(...colors.white)
    doc.setDrawColor(...colors.primaryDark)
    doc.setLineWidth(2)
    doc.roundedRect(qrX - 10, yPos - 10, qrSize + 20, qrSize + 20, 5, 5, 'FD')
    
    // QR centrado y grande
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)
    
    // Texto importante debajo del QR
    yPos += qrSize + 25
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CÓDIGO VÁLIDO PARA LA ENTRADA', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Entrada personal e intransferible', pageWidth / 2, yPos, { align: 'center' })

    // === INFORMACIÓN BÁSICA RESUMIDA ===
    yPos += 20
    
    doc.setFillColor(...colors.lightGray)
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 3, 3, 'FD')
    
    yPos += 8
    doc.setTextColor(...colors.darkText)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Términos:', margin + 10, yPos)
    doc.text('• Entrada única y personal  • Llegar 15 min antes  • Derecho de admisión reservado', margin + 10, yPos + 6)
    doc.text(`• Válido para: ${guestData.name || 'Invitado'}  • Evento: ${eventData.name || 'Evento'}`, margin + 10, yPos + 12)

    // === FOOTER SIMPLIFICADO ===
    const footerY = pageHeight - 15
    
    // Línea separadora
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
    
    // Texto del footer minimalista
    doc.setTextColor(102, 102, 102)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    const currentDate = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    doc.text(`Entrada generada el ${currentDate} • Para consultas, contacta al organizador`, 
             pageWidth / 2, footerY, { align: 'center' })

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
 * *** FUNCIÓN ESPECÍFICA Y CORREGIDA PARA FORMATEAR FECHA DEL EVENTO ***
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
      console.log('DEBUG - Formato no reconocido')
      return 'Fecha por confirmar'
    }
    
    // Verificar validez
    if (isNaN(eventDate.getTime())) {
      console.log('DEBUG - Fecha inválida después de conversión')
      return 'Fecha por confirmar'
    }
    
    // Formatear
    const formatted = eventDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    console.log('DEBUG - Fecha formateada:', formatted)
    return formatted
    
  } catch (error) {
    console.error('DEBUG - Error formateando fecha:', error)
    return 'Fecha por confirmar'
  }
}

/**
 * *** FUNCIÓN CORREGIDA PARA FORMATEAR FECHA DEL EVENTO ***
 * Formatear fecha del evento (no fecha actual) - AHORA USA LA FUNCIÓN ESPECÍFICA
 */
const formatEventDate = (eventDateInput) => {
  // Redirigir a la función específica con debug
  return formatEventDateFixed(eventDateInput)
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
    // Usar la versión principal pero más compacta
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