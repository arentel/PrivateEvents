import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada profesional y elegante
 * @param {Object} guestData - Datos del invitado
 * @param {Object} eventData - Datos del evento
 * @param {string} logoBase64 - Logo en base64 (opcional)
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} - PDF como base64
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null, options = {}) => {
  try {
    // Crear documento PDF en formato A4 vertical optimizado
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Colores elegantes consistentes con el email
    const primaryDark = [13, 27, 42]    // #0d1b2a
    const primaryBlue = [30, 58, 138]   // #1e3a8a
    const whiteColor = [255, 255, 255]
    const lightGray = [248, 249, 250]
    const mediumGray = [108, 117, 125]
    const darkText = [33, 33, 33]
    const successGreen = [40, 167, 69]

    const pageWidth = 210
    const pageHeight = 297
    const margin = 20

    // === HEADER ELEGANTE CON GRADIENTE ===
    const headerHeight = 55
    for (let i = 0; i < headerHeight; i += 1) {
      const ratio = i / headerHeight
      const r = Math.round(primaryDark[0] + (primaryBlue[0] - primaryDark[0]) * ratio)
      const g = Math.round(primaryDark[1] + (primaryBlue[1] - primaryDark[1]) * ratio)
      const b = Math.round(primaryDark[2] + (primaryBlue[2] - primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 1, 'F')
    }

    // Logo si está disponible
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 15, 25, 25)
      } catch (logoError) {
        console.warn('Error añadiendo logo:', logoError)
      }
    }

    // Títulos elegantes
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(32)
    doc.text('ENTRADA VIP', pageWidth / 2, 28, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const eventName = eventData.name || 'Evento Especial'
    doc.text(eventName.toUpperCase(), pageWidth / 2, 42, { align: 'center' })

    // === INFORMACIÓN DEL EVENTO ===
    let yPos = headerHeight + 25

    // Caja principal de información
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 50, 4, 4, 'F')
    
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 50, 4, 4, 'S')

    yPos += 12

    // Formatear fecha correctamente
    let formattedDate = 'Fecha por confirmar'
    let formattedTime = ''
    
    if (eventData.date && eventData.date !== 'Invalid Date') {
      try {
        let eventDate
        
        // Manejar diferentes formatos de fecha
        if (typeof eventData.date === 'string') {
          if (eventData.date.includes('T')) {
            eventDate = new Date(eventData.date)
          } else {
            // Asumir formato YYYY-MM-DD
            eventDate = new Date(eventData.date + 'T12:00:00')
          }
        } else {
          eventDate = new Date(eventData.date)
        }
        
        if (!isNaN(eventDate.getTime())) {
          formattedDate = eventDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          
          formattedTime = eventDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
          
          // Capitalizar primera letra
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
        }
      } catch (dateError) {
        console.warn('Error procesando fecha:', dateError)
      }
    }

    // Información en dos columnas
    doc.setTextColor(...primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    
    // Columna izquierda
    doc.text('FECHA:', margin + 12, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    doc.setFontSize(10)
    
    const dateLines = doc.splitTextToSize(formattedDate, 80)
    dateLines.forEach((line, index) => {
      doc.text(line, margin + 12, yPos + 8 + (index * 5))
    })
    
    if (formattedTime) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryDark)
      doc.setFontSize(11)
      doc.text('HORA:', margin + 12, yPos + 20)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkText)
      doc.setFontSize(10)
      doc.text(formattedTime + ' hrs', margin + 12, yPos + 28)
    }

    // Columna derecha
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryDark)
    doc.setFontSize(11)
    doc.text('UBICACIÓN:', margin + 105, yPos)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    doc.setFontSize(10)
    const location = eventData.location || 'Ubicación por confirmar'
    const locationLines = doc.splitTextToSize(location, 75)
    locationLines.forEach((line, index) => {
      doc.text(line, margin + 105, yPos + 8 + (index * 5))
    })

    // === INFORMACIÓN DEL INVITADO ===
    yPos += 70

    // Barra de título
    doc.setFillColor(...primaryDark)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 14, 2, 2, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('INFORMACIÓN DEL INVITADO', margin + 8, yPos + 9)

    yPos += 22

    // Datos del invitado
    doc.setFillColor(...whiteColor)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 28, 3, 3, 'F')
    doc.setDrawColor(220, 220, 220)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 28, 3, 3, 'S')

    doc.setTextColor(...primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('NOMBRE COMPLETO:', margin + 12, yPos + 12)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkText)
    doc.setFontSize(16)
    const guestName = guestData.name || 'Invitado'
    doc.text(guestName.toUpperCase(), margin + 12, yPos + 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...mediumGray)
    const guestEmail = guestData.email || ''
    doc.text('EMAIL: ' + guestEmail, margin + 12, yPos + 25)

    // === CÓDIGO QR PERFECTO ===
    yPos += 45

    // Generar datos QR estructurados
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
        version: '2.1',
        type: 'entry_ticket'
      }
    })
    
    console.log('QR Data generado:', qrData)

    // Generar QR code de alta calidad
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 512,
      margin: 3,
      quality: 0.92,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Máximo nivel de corrección de errores
    })

    // Contenedor del QR con márgenes adecuados
    const qrDisplaySize = 90
    const qrX = (pageWidth - qrDisplaySize) / 2
    const qrContainerPadding = 8

    // Fondo del contenedor con sombra
    doc.setFillColor(235, 235, 235)
    doc.roundedRect(
      qrX - qrContainerPadding, 
      yPos - qrContainerPadding, 
      qrDisplaySize + (qrContainerPadding * 2), 
      qrDisplaySize + (qrContainerPadding * 2), 
      3, 3, 'F'
    )
    
    // Fondo blanco del QR
    doc.setFillColor(...whiteColor)
    doc.roundedRect(
      qrX - 2, 
      yPos - 2, 
      qrDisplaySize + 4, 
      qrDisplaySize + 4, 
      2, 2, 'F'
    )

    // Borde sutil
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.roundedRect(
      qrX - 2, 
      yPos - 2, 
      qrDisplaySize + 4, 
      qrDisplaySize + 4, 
      2, 2, 'S'
    )

    // QR Code con tamaño perfecto
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrDisplaySize, qrDisplaySize)

    // Información del QR
    yPos += qrDisplaySize + 20

    doc.setTextColor(...primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('CÓDIGO DE VALIDACIÓN', pageWidth / 2, yPos, { align: 'center' })
    
    doc.setTextColor(...mediumGray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Presentar este código QR en la entrada del evento', pageWidth / 2, yPos + 7, { align: 'center' })

    // ID del ticket
    yPos += 18
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const ticketId = (guestData.id || 'TICKET').substring(0, 8).toUpperCase()
    doc.text(`ID: ${ticketId}`, pageWidth / 2, yPos, { align: 'center' })

    // Indicador de validez
    doc.setTextColor(...successGreen)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('✓ ENTRADA VÁLIDA', pageWidth / 2, yPos + 8, { align: 'center' })

    // === TÉRMINOS Y CONDICIONES ELEGANTES ===
    yPos += 25

    // Fondo degradado para términos
    const termsHeight = 40
    for (let i = 0; i < termsHeight; i += 1) {
      const ratio = i / termsHeight
      const r = Math.round(primaryDark[0] + (primaryBlue[0] - primaryDark[0]) * ratio)
      const g = Math.round(primaryDark[1] + (primaryBlue[1] - primaryDark[1]) * ratio)
      const b = Math.round(primaryDark[2] + (primaryBlue[2] - primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(0, yPos + i, pageWidth, 1, 'F')
    }

    // Título de términos
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('TÉRMINOS Y CONDICIONES', pageWidth / 2, yPos + 12, { align: 'center' })

    // Términos en dos columnas
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    const leftTerms = [
      '✓ Entrada personal e intransferible',
      '✓ Válida únicamente para ' + (guestData.name || 'titular'),
      '✓ Presentar documento de identidad',
      '✓ Llegar 15 minutos antes del evento'
    ]
    
    const rightTerms = [
      '✓ Una sola entrada por código QR',
      '✓ Derecho de admisión reservado',
      '✓ Prohibido el acceso con bebidas externas',
      '✓ Aforo limitado según disponibilidad'
    ]

    leftTerms.forEach((term, index) => {
      doc.text(term, margin + 8, yPos + 20 + (index * 4))
    })

    rightTerms.forEach((term, index) => {
      doc.text(term, pageWidth / 2 + 8, yPos + 20 + (index * 4))
    })

    // === FOOTER PROFESIONAL ===
    const footerY = pageHeight - 25
    
    // Línea separadora
    doc.setDrawColor(...mediumGray)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)
    
    // Información del footer
    doc.setTextColor(...mediumGray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    doc.text('Sistema QR Eventos - Entrada Digital Segura', margin, footerY)
    doc.text('Generado: ' + new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), pageWidth - margin, footerY, { align: 'right' })

    // Código de seguridad en el footer
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const securityCode = Math.random().toString(36).substr(2, 8).toUpperCase()
    doc.text(`SEC: ${securityCode}`, pageWidth / 2, footerY, { align: 'center' })

    // Generar PDF
    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]
    
    // Log del tamaño
    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`📄 PDF profesional generado: ${sizeInKB}KB`)
    
    return base64PDF

  } catch (error) {
    console.error('❌ Error generating professional ticket PDF:', error)
    throw new Error('Error al generar la entrada profesional: ' + error.message)
  }
}

/**
 * Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    console.log('🎫 Generando PDF para descarga:', guestData.name, eventData.name)
    
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
    
    // Nombre de archivo mejorado
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
    
    // Descargar automáticamente
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    
    console.log('✅ PDF descargado exitosamente')
    return true

  } catch (error) {
    console.error('❌ Error downloading professional ticket PDF:', error)
    throw error
  }
}

/**
 * Versión compacta para límites de email estrictos
 */
export const generateCompactTicketForEmail = async (guestData, eventData) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 140],
      compress: true
    })

    const primaryColor = [13, 27, 42]
    const whiteColor = [255, 255, 255]
    
    // Header compacto
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 100, 28, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ENTRADA', 50, 12, { align: 'center' })
    
    doc.setFontSize(10)
    const eventName = (eventData.name || 'Evento').length > 25 ? 
      (eventData.name || 'Evento').substring(0, 25) + '...' : (eventData.name || 'Evento')
    doc.text(eventName, 50, 20, { align: 'center' })

    // Información esencial
    let yPos = 38
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    
    // Fecha
    let dateText = 'Fecha por confirmar'
    if (eventData.date && eventData.date !== 'Invalid Date') {
      try {
        const eventDate = new Date(eventData.date)
        if (!isNaN(eventDate.getTime())) {
          dateText = eventDate.toLocaleDateString('es-ES')
        }
      } catch (e) {
        console.warn('Error formateando fecha compacta:', e)
      }
    }
    
    doc.text('FECHA: ' + dateText, 5, yPos)
    
    // Invitado
    yPos += 8
    const name = (guestData.name || 'Invitado').length > 22 ? 
      (guestData.name || 'Invitado').substring(0, 22) + '...' : (guestData.name || 'Invitado')
    doc.text('INVITADO: ' + name.toUpperCase(), 5, yPos)
    
    // QR compacto pero perfectamente legible
    yPos += 15
    const qrData = JSON.stringify({
      id: guestData.id || 'guest_' + Date.now(),
      name: guestData.name || 'Invitado',
      eventId: eventData.id || 'event_' + Date.now()
    })
    
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      quality: 0.8,
      errorCorrectionLevel: 'H'
    })
    
    // QR centrado con márgenes adecuados
    const qrSize = 55
    const qrX = (100 - qrSize) / 2
    
    // Fondo blanco para el QR
    doc.setFillColor(255, 255, 255)
    doc.rect(qrX - 2, yPos - 2, qrSize + 4, qrSize + 4, 'F')
    
    doc.addImage(qrCode, 'PNG', qrX, yPos, qrSize, qrSize)
    
    // ID
    yPos += qrSize + 10
    doc.setFontSize(8)
    doc.text('ID: ' + (guestData.id || 'TICKET').substring(0, 8).toUpperCase(), 50, yPos, { align: 'center' })
    
    // Términos compactos
    yPos += 8
    doc.setFillColor(...primaryColor)
    doc.rect(0, yPos, 100, 22, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFontSize(7)
    doc.text('• Personal • No transferible • Una sola vez', 50, yPos + 7, { align: 'center' })
    doc.text('• Derecho admisión reservado', 50, yPos + 13, { align: 'center' })
    doc.text('• Presentar en la entrada del evento', 50, yPos + 19, { align: 'center' })

    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]
    
    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`📄 PDF compacto generado: ${sizeInKB}KB`)
    
    return base64PDF

  } catch (error) {
    console.error('❌ Error generating compact ticket PDF:', error)
    throw new Error('Error al generar entrada compacta: ' + error.message)
  }
}

export default { 
  generateTicketPDF, 
  generateTicketForEmail, 
  generateCompactTicketForEmail
}