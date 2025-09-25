import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generar PDF de entrada con diseño profesional completamente nuevo
 */
export const generateTicketForEmail = async (guestData, eventData, logoBase64 = null, options = {}) => {
  try {
    // Crear documento PDF optimizado para ticket
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Paleta de colores profesional
    const colors = {
      primary: [41, 98, 255],      // Azul moderno #2962FF
      primaryDark: [25, 59, 153],  // Azul oscuro #193B99
      secondary: [67, 56, 202],    // Violeta #4338CA
      success: [16, 185, 129],     // Verde #10B981
      dark: [17, 24, 39],          // Gris oscuro #111827
      medium: [75, 85, 99],        // Gris medio #4B5563
      light: [249, 250, 251],      // Gris claro #F9FAFB
      white: [255, 255, 255],      // Blanco
      accent: [251, 146, 60]       // Naranja #FB923C
    }

    const pageWidth = 210
    const pageHeight = 297
    const margin = 25

    // === HEADER PRINCIPAL ===
    // Fondo degradado suave
    const headerHeight = 70
    for (let i = 0; i <= headerHeight; i += 0.5) {
      const ratio = i / headerHeight
      const r = Math.round(colors.primary[0] + (colors.secondary[0] - colors.primary[0]) * ratio)
      const g = Math.round(colors.primary[1] + (colors.secondary[1] - colors.primary[1]) * ratio)
      const b = Math.round(colors.primary[2] + (colors.secondary[2] - colors.primary[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 0.5, 'F')
    }

    // Logo en esquina si existe
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 20, 20, 20)
      } catch (error) {
        console.warn('Error añadiendo logo:', error)
      }
    }

    // Título principal
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(36)
    doc.text('ENTRADA', pageWidth / 2, 35, { align: 'center' })
    
    // Subtítulo del evento
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    const eventName = (eventData.name || 'Evento Especial').toUpperCase()
    doc.text(eventName, pageWidth / 2, 50, { align: 'center' })

    // Línea decorativa
    doc.setDrawColor(...colors.white)
    doc.setLineWidth(2)
    doc.line(pageWidth / 2 - 40, 58, pageWidth / 2 + 40, 58)

    // === SECCIÓN DE INVITADO ===
    let yPos = 100

    // Caja del invitado con estilo moderno
    doc.setFillColor(...colors.light)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 8, 8, 'F')
    
    // Borde sutil
    doc.setDrawColor(...colors.medium)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 8, 8, 'S')

    // Etiqueta "INVITADO"
    doc.setFillColor(...colors.primary)
    doc.roundedRect(margin + 15, yPos + 8, 35, 8, 2, 2, 'F')
    
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('INVITADO', margin + 32.5, yPos + 13, { align: 'center' })

    // Nombre del invitado
    doc.setTextColor(...colors.dark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    const guestName = (guestData.name || 'Nombre del Invitado').toUpperCase()
    doc.text(guestName, margin + 15, yPos + 28, { maxWidth: pageWidth - 80 })

    // Email del invitado
    doc.setTextColor(...colors.medium)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(guestData.email || '', margin + 15, yPos + 38)

    // === INFORMACIÓN DEL EVENTO ===
    yPos += 70

    // Grid de información del evento
    const eventInfoHeight = 80
    doc.setFillColor(...colors.white)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), eventInfoHeight, 8, 8, 'F')
    doc.setDrawColor(...colors.medium)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), eventInfoHeight, 8, 8, 'S')

    // Formatear fecha correctamente
    let formattedDate = 'Fecha por confirmar'
    let formattedTime = ''
    
    if (eventData.date) {
      try {
        const eventDate = new Date(eventData.date)
        if (!isNaN(eventDate.getTime())) {
          formattedDate = eventDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
          
          formattedTime = eventDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })
          
          // Capitalizar primera letra
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
        }
      } catch (error) {
        console.warn('Error procesando fecha:', error)
      }
    }

    // Información en columnas limpias
    const infoY = yPos + 20
    
    // Fecha
    doc.setFillColor(...colors.accent)
    doc.roundedRect(margin + 15, infoY, 6, 6, 1, 1, 'F')
    
    doc.setTextColor(...colors.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('FECHA', margin + 30, infoY + 4)
    
    doc.setTextColor(...colors.dark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(formattedDate, margin + 30, infoY + 12)
    
    if (formattedTime) {
      doc.text(`${formattedTime} hrs`, margin + 30, infoY + 20)
    }

    // Ubicación
    const locationY = infoY + 35
    doc.setFillColor(...colors.success)
    doc.roundedRect(margin + 15, locationY, 6, 6, 1, 1, 'F')
    
    doc.setTextColor(...colors.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('UBICACIÓN', margin + 30, locationY + 4)
    
    doc.setTextColor(...colors.dark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const location = eventData.location || 'Ubicación por confirmar'
    const locationLines = doc.splitTextToSize(location, 120)
    locationLines.forEach((line, index) => {
      doc.text(line, margin + 30, locationY + 12 + (index * 6))
    })

    // === CÓDIGO QR CENTRADO Y PROFESIONAL ===
    yPos += eventInfoHeight + 30

    // Generar datos QR estructurados
    const qrData = JSON.stringify({
      ticket: {
        id: `TKT-${Date.now().toString(36).toUpperCase()}`,
        guest: guestData.name || 'Invitado',
        event: eventData.name || 'Evento',
        issued: new Date().toISOString(),
        valid: true
      }
    })

    // QR Code de máxima calidad
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 600,
      margin: 4,
      quality: 0.95,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })

    // Contenedor del QR con diseño limpio
    const qrSize = 100
    const qrX = (pageWidth - qrSize) / 2
    
    // Fondo con sombra sutil
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(qrX - 8, yPos - 8, qrSize + 16, qrSize + 16, 12, 12, 'F')
    
    // Fondo blanco del QR
    doc.setFillColor(...colors.white)
    doc.roundedRect(qrX - 4, yPos - 4, qrSize + 8, qrSize + 8, 8, 8, 'F')
    
    // Borde elegante
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(1)
    doc.roundedRect(qrX - 4, yPos - 4, qrSize + 8, qrSize + 8, 8, 8, 'S')

    // QR Code perfectamente centrado
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)

    // Información del QR
    yPos += qrSize + 25

    doc.setTextColor(...colors.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CÓDIGO DE ACCESO', pageWidth / 2, yPos, { align: 'center' })
    
    doc.setTextColor(...colors.medium)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Presenta este código QR en la entrada del evento', pageWidth / 2, yPos + 8, { align: 'center' })

    // ID del ticket
    yPos += 20
    doc.setTextColor(...colors.dark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const ticketId = `ID: ${(guestData.id || 'TICKET').substring(0, 8).toUpperCase()}`
    doc.text(ticketId, pageWidth / 2, yPos, { align: 'center' })

    // Estado válido
    doc.setFillColor(...colors.success)
    doc.roundedRect(pageWidth / 2 - 25, yPos + 5, 50, 12, 6, 6, 'F')
    
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('✓ ENTRADA VÁLIDA', pageWidth / 2, yPos + 12, { align: 'center' })

    // === TÉRMINOS Y CONDICIONES MODERNOS ===
    yPos += 35

    // Fondo degradado para términos
    const termsHeight = 45
    for (let i = 0; i <= termsHeight; i += 0.5) {
      const ratio = i / termsHeight
      const r = Math.round(colors.primaryDark[0] + (colors.primary[0] - colors.primaryDark[0]) * ratio)
      const g = Math.round(colors.primaryDark[1] + (colors.primary[1] - colors.primaryDark[1]) * ratio)
      const b = Math.round(colors.primaryDark[2] + (colors.primary[2] - colors.primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(0, yPos + i, pageWidth, 0.5, 'F')
    }

    // Título de términos
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TÉRMINOS DE USO', pageWidth / 2, yPos + 15, { align: 'center' })

    // Términos en diseño limpio
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    const terms = [
      'Entrada personal e intransferible válida únicamente para ' + (guestData.name || 'el titular'),
      'Presentar documento de identidad junto con este código QR',
      'Una sola entrada por código • Derecho de admisión reservado',
      'Llegar 15 minutos antes del inicio • Prohibido el acceso con bebidas externas'
    ]

    terms.forEach((term, index) => {
      doc.text('• ' + term, pageWidth / 2, yPos + 25 + (index * 6), { 
        align: 'center',
        maxWidth: pageWidth - 60
      })
    })

    // === FOOTER PROFESIONAL ===
    const footerY = pageHeight - 20
    
    // Línea separadora elegante
    doc.setDrawColor(...colors.medium)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10)
    
    // Información del sistema
    doc.setTextColor(...colors.medium)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    doc.text('Sistema Digital de Eventos', margin, footerY)
    
    const generatedTime = new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Generado: ${generatedTime}`, pageWidth - margin, footerY, { align: 'right' })

    // Código de seguridad centrado
    doc.setFont('helvetica', 'bold')
    const securityCode = Math.random().toString(36).substr(2, 6).toUpperCase()
    doc.text(`SEC-${securityCode}`, pageWidth / 2, footerY, { align: 'center' })

    // Generar PDF final
    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]
    
    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`Ticket PDF generado: ${sizeInKB}KB`)
    
    return base64PDF

  } catch (error) {
    console.error('Error generando ticket PDF:', error)
    throw new Error('Error al generar la entrada: ' + error.message)
  }
}

/**
 * Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    console.log('Generando PDF de entrada para:', guestData.name)
    
    const base64PDF = await generateTicketForEmail(guestData, eventData, logoBase64)
    
    // Crear blob y descargar automáticamente
    const byteCharacters = atob(base64PDF)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Enlace de descarga
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Nombre de archivo limpio
    const safeName = (guestData.name || 'Invitado')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 25)
    
    const safeEvent = (eventData.name || 'Evento')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 25)
    
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.download = `Entrada_${safeEvent}_${safeName}_${timestamp}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('PDF descargado exitosamente')
    return true

  } catch (error) {
    console.error('Error descargando PDF:', error)
    throw error
  }
}

/**
 * Versión compacta optimizada
 */
export const generateCompactTicketForEmail = async (guestData, eventData) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [105, 148], // Formato A6
      compress: true
    })

    const colors = {
      primary: [41, 98, 255],
      dark: [17, 24, 39],
      white: [255, 255, 255],
      light: [249, 250, 251]
    }

    // Header compacto
    doc.setFillColor(...colors.primary)
    doc.rect(0, 0, 105, 30, 'F')
    
    doc.setTextColor(...colors.white)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('ENTRADA', 52.5, 15, { align: 'center' })
    
    doc.setFontSize(10)
    const eventName = (eventData.name || 'Evento').substring(0, 30)
    doc.text(eventName.toUpperCase(), 52.5, 22, { align: 'center' })

    // Información esencial
    let yPos = 40
    doc.setTextColor(...colors.dark)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    
    // Invitado
    const guestName = (guestData.name || 'Invitado').substring(0, 25)
    doc.text('INVITADO: ' + guestName.toUpperCase(), 5, yPos)
    
    // Fecha
    yPos += 8
    let dateText = 'Fecha por confirmar'
    if (eventData.date) {
      try {
        const eventDate = new Date(eventData.date)
        if (!isNaN(eventDate.getTime())) {
          dateText = eventDate.toLocaleDateString('es-ES')
        }
      } catch (e) {
        console.warn('Error fecha compacta:', e)
      }
    }
    doc.text('FECHA: ' + dateText, 5, yPos)
    
    // QR Code compacto pero legible
    yPos += 15
    const qrData = JSON.stringify({
      id: guestData.id || 'guest_' + Date.now(),
      name: guestData.name || 'Invitado',
      event: eventData.name || 'Evento'
    })
    
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      quality: 0.9,
      errorCorrectionLevel: 'H'
    })
    
    // QR centrado
    const qrSize = 60
    const qrX = (105 - qrSize) / 2
    
    doc.setFillColor(...colors.white)
    doc.roundedRect(qrX - 3, yPos - 3, qrSize + 6, qrSize + 6, 3, 3, 'F')
    doc.addImage(qrCode, 'PNG', qrX, yPos, qrSize, qrSize)
    
    // ID compacto
    yPos += qrSize + 12
    doc.setFontSize(8)
    doc.text('ID: ' + (guestData.id || 'TICKET').substring(0, 8).toUpperCase(), 52.5, yPos, { align: 'center' })
    
    // Footer compacto
    yPos += 10
    doc.setFillColor(...colors.primary)
    doc.rect(0, yPos, 105, 20, 'F')
    
    doc.setTextColor(...colors.white)
    doc.setFontSize(7)
    doc.text('Entrada personal • No transferible', 52.5, yPos + 7, { align: 'center' })
    doc.text('Presentar en la entrada del evento', 52.5, yPos + 13, { align: 'center' })

    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]
    
    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`PDF compacto generado: ${sizeInKB}KB`)
    
    return base64PDF

  } catch (error) {
    console.error('Error generando PDF compacto:', error)
    throw new Error('Error al generar entrada compacta: ' + error.message)
  }
}

export default { 
  generateTicketPDF, 
  generateTicketForEmail, 
  generateCompactTicketForEmail
}