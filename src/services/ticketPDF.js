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
    // Crear documento PDF en formato A4 vertical para mejor presentación
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Colores elegantes (siguiendo el template del email)
    const primaryDark = [13, 27, 42]    // #0d1b2a - Azul oscuro principal
    const primaryBlue = [30, 58, 138]   // #1e3a8a - Azul degradado
    const whiteColor = [255, 255, 255]  // #ffffff
    const lightGray = [248, 249, 250]   // #f8f9fa
    const mediumGray = [108, 117, 125]  // #6c757d
    const darkText = [33, 33, 33]       // #212121

    const pageWidth = 210
    const pageHeight = 297
    const margin = 20

    // === HEADER ELEGANTE CON GRADIENTE SIMULADO ===
    // Fondo degradado simulado con múltiples rectángulos
    const headerHeight = 50
    for (let i = 0; i < headerHeight; i += 2) {
      const ratio = i / headerHeight
      const r = primaryDark[0] + (primaryBlue[0] - primaryDark[0]) * ratio
      const g = primaryDark[1] + (primaryBlue[1] - primaryDark[1]) * ratio
      const b = primaryDark[2] + (primaryBlue[2] - primaryDark[2]) * ratio
      
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 2, 'F')
    }

    // Título principal elegante
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.text('ENTRADA VIP', pageWidth / 2, 25, { align: 'center' })
    
    // Subtítulo del evento
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text(eventData.name.toUpperCase(), pageWidth / 2, 38, { align: 'center' })

    // === SECCIÓN DE INFORMACIÓN PRINCIPAL ===
    let yPos = headerHeight + 30

    // Caja de información con fondo elegante
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, 3, 'F')
    
    // Borde sutil
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, 3, 'S')

    // Datos del evento - diseño en columnas
    doc.setTextColor(...darkText)
    yPos += 15

    // Formatear fecha elegantemente
    const eventDate = new Date(eventData.date)
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    const formattedDate = eventDate.toLocaleDateString('es-ES', dateOptions)
    const formattedTime = eventDate.toLocaleTimeString('es-ES', timeOptions)

    // Información en formato elegante
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryDark)
    
    // Columna izquierda
    doc.text('FECHA:', margin + 10, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    doc.text(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), margin + 10, yPos + 6)
    
    // Hora
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryDark)
    doc.text('HORA:', margin + 10, yPos + 15)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    doc.text(formattedTime + ' hrs', margin + 10, yPos + 21)

    // Columna derecha
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryDark)
    doc.text('UBICACIÓN:', margin + 100, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    const location = eventData.location || 'Ubicación por confirmar'
    
    // Dividir ubicación en líneas si es muy larga
    const locationLines = doc.splitTextToSize(location, 80)
    locationLines.forEach((line, index) => {
      doc.text(line, margin + 100, yPos + 6 + (index * 6))
    })

    // === SECCIÓN DEL INVITADO ===
    yPos += 65

    // Título de sección
    doc.setFillColor(...primaryDark)
    doc.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('INFORMACIÓN DEL INVITADO', margin + 5, yPos + 8)

    yPos += 20

    // Datos del invitado con estilo elegante
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 2, 2, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 2, 2, 'S')

    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('NOMBRE COMPLETO:', margin + 10, yPos + 10)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(guestData.name.toUpperCase(), margin + 10, yPos + 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...mediumGray)
    doc.text('EMAIL: ' + guestData.email, margin + 10, yPos + 23)

    // === CÓDIGO QR PROFESIONAL ===
    yPos += 40

    // Generar datos QR más completos
    const qrData = JSON.stringify({
      guest: {
        id: guestData.id,
        name: guestData.name,
        email: guestData.email
      },
      event: {
        id: eventData.id,
        name: eventData.name,
        date: eventData.date
      },
      validation: {
        issued: new Date().toISOString(),
        version: '2.0'
      }
    })
    
    // Generar QR de alta calidad
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      quality: 0.9,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    // Contenedor del QR con diseño profesional
    const qrSize = 80
    const qrX = (pageWidth - qrSize) / 2

    // Fondo blanco con sombra simulada
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(qrX - 3, yPos - 3, qrSize + 6, qrSize + 6, 3, 3, 'F')
    
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(qrX - 1, yPos - 1, qrSize + 2, qrSize + 2, 2, 2, 'F')

    // QR Code centrado
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)

    // Texto explicativo del QR
    yPos += qrSize + 15
    doc.setTextColor(...primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('CÓDIGO DE VALIDACIÓN', pageWidth / 2, yPos, { align: 'center' })
    
    doc.setTextColor(...mediumGray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Presentar este código en la entrada del evento', pageWidth / 2, yPos + 6, { align: 'center' })

    // ID único visible
    yPos += 15
    doc.setTextColor(...darkText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const ticketId = guestData.id.substring(0, 8).toUpperCase()
    doc.text(`TICKET ID: ${ticketId}`, pageWidth / 2, yPos, { align: 'center' })

    // === TÉRMINOS Y CONDICIONES ELEGANTES ===
    yPos += 25

    // Fondo degradado para términos
    const termsHeight = 35
    for (let i = 0; i < termsHeight; i += 2) {
      const ratio = i / termsHeight
      const r = primaryDark[0] + (primaryBlue[0] - primaryDark[0]) * ratio
      const g = primaryDark[1] + (primaryBlue[1] - primaryDark[1]) * ratio
      const b = primaryDark[2] + (primaryBlue[2] - primaryDark[2]) * ratio
      
      doc.setFillColor(r, g, b)
      doc.rect(0, yPos + i, pageWidth, 2, 'F')
    }

    // Título de términos
    doc.setTextColor(...whiteColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TÉRMINOS IMPORTANTES', pageWidth / 2, yPos + 10, { align: 'center' })

    // Términos en columnas elegantes
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    const leftTerms = [
      '✓ Entrada personal e intransferible',
      '✓ Válida únicamente para ' + guestData.name,
      '✓ Presentar documento de identidad'
    ]
    
    const rightTerms = [
      '✓ Una sola entrada por código QR',
      '✓ Derecho de admisión reservado',
      '✓ Prohibido el acceso con bebidas externas'
    ]

    leftTerms.forEach((term, index) => {
      doc.text(term, margin + 10, yPos + 18 + (index * 4))
    })

    rightTerms.forEach((term, index) => {
      doc.text(term, pageWidth / 2 + 10, yPos + 18 + (index * 4))
    })

    // === FOOTER ELEGANTE ===
    const footerY = pageHeight - 20
    
    doc.setDrawColor(...mediumGray)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    doc.setTextColor(...mediumGray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    doc.text('Sistema QR Eventos - Entrada Digital', margin, footerY)
    doc.text('Generado el ' + new Date().toLocaleDateString('es-ES'), pageWidth - margin, footerY, { align: 'right' })

    // Retornar como base64
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
    
    // Nombre de archivo más profesional
    const eventName = eventData.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    const guestName = guestData.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
    const date = new Date().toISOString().split('T')[0]
    
    link.download = `Entrada_${eventName}_${guestName}_${date}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    
    return true

  } catch (error) {
    console.error('❌ Error downloading professional ticket PDF:', error)
    throw error
  }
}

/**
 * Versión compacta para emails (< 50KB)
 */
export const generateCompactTicketForEmail = async (guestData, eventData) => {
  try {
    // Versión más pequeña para límites estrictos de email
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150], // Formato más compacto
      compress: true
    })

    const primaryColor = [13, 27, 42]
    const whiteColor = [255, 255, 255]
    
    // Header compacto
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 100, 25, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ENTRADA', 50, 10, { align: 'center' })
    
    doc.setFontSize(10)
    const eventName = eventData.name.length > 30 ? 
      eventData.name.substring(0, 30) + '...' : eventData.name
    doc.text(eventName, 50, 18, { align: 'center' })

    // Información esencial
    let yPos = 35
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    
    // Fecha
    const date = new Date(eventData.date).toLocaleDateString('es-ES')
    doc.text('FECHA: ' + date, 5, yPos)
    
    // Invitado
    yPos += 8
    const name = guestData.name.length > 25 ? 
      guestData.name.substring(0, 25) + '...' : guestData.name
    doc.text('INVITADO: ' + name.toUpperCase(), 5, yPos)
    
    // QR compacto pero legible
    yPos += 15
    const qrData = JSON.stringify({
      id: guestData.id,
      name: guestData.name,
      eventId: eventData.id
    })
    
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      quality: 0.6
    })
    
    doc.addImage(qrCode, 'PNG', 25, yPos, 50, 50)
    
    // ID
    yPos += 55
    doc.setFontSize(8)
    doc.text('ID: ' + guestData.id.substring(0, 8).toUpperCase(), 50, yPos, { align: 'center' })
    
    // Términos mínimos
    yPos += 10
    doc.setFillColor(...primaryColor)
    doc.rect(0, yPos, 100, 20, 'F')
    
    doc.setTextColor(...whiteColor)
    doc.setFontSize(6)
    doc.text('• Personal • No transferible • Una sola vez', 50, yPos + 7, { align: 'center' })
    doc.text('• Derecho admisión reservado', 50, yPos + 12, { align: 'center' })

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