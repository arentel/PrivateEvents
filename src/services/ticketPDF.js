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
    
    const details = [
      ['Evento:', eventData.name || 'Evento'],
      ['Fecha:', formatEventDate(eventData.date)],
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

    // === SECCIÓN DE DESCARGA (Gradiente como en email) ===
    yPos += 50
    
    // Fondo con gradiente simulado (igual al email)
    const gradientHeight = 50
    for (let i = 0; i < gradientHeight; i += 1) {
      const ratio = i / gradientHeight
      const r = Math.round(colors.primaryDark[0] + (colors.primaryBlue[0] - colors.primaryDark[0]) * ratio)
      const g = Math.round(colors.primaryDark[1] + (colors.primaryBlue[1] - colors.primaryDark[1]) * ratio)
      const b = Math.round(colors.primaryDark[2] + (colors.primaryBlue[2] - colors.primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.roundedRect(margin, yPos + i, pageWidth - (margin * 2), 1, 0, 0, 'F')
    }
    
    // Hacer los bordes redondeados del contenedor completo
    doc.setFillColor(...colors.primaryDark)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), gradientHeight, 4, 4, 'F')
    
    // Aplicar el gradiente encima
    for (let i = 0; i < gradientHeight; i += 1) {
      const ratio = i / gradientHeight
      const r = Math.round(colors.primaryDark[0] + (colors.primaryBlue[0] - colors.primaryDark[0]) * ratio)
      const g = Math.round(colors.primaryDark[1] + (colors.primaryBlue[1] - colors.primaryDark[1]) * ratio)
      const b = Math.round(colors.primaryDark[2] + (colors.primaryBlue[2] - colors.primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(margin, yPos + i, pageWidth - (margin * 2), 1, 'F')
    }
    
    // Título de la sección
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text('Tu Entrada PDF', pageWidth / 2, yPos + 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text('Presenta este código QR en la entrada del evento', pageWidth / 2, yPos + 25, { align: 'center' })
    
    // Código de descarga (como en el email)
    doc.setFontSize(10)
    const downloadCode = options.downloadCode || 'N/A'
    doc.text(`Código: ${downloadCode}`, pageWidth / 2, yPos + 35, { align: 'center' })
    
    doc.setFontSize(9)
    doc.text('Válido por 7 días desde la recepción', pageWidth / 2, yPos + 42, { align: 'center' })

    // === CÓDIGO QR CENTRADO ===
    yPos += gradientHeight + 20
    
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
    
    // QR de alta calidad
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      quality: 0.9,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    
    // Contenedor del QR (igual que en email - fondo blanco con borde)
    const qrSize = 80
    const qrX = (pageWidth - qrSize) / 2
    
    // Fondo blanco con borde como en el email
    doc.setFillColor(...colors.white)
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(1)
    doc.roundedRect(qrX - 5, yPos - 5, qrSize + 10, qrSize + 10, 3, 3, 'FD')
    
    // QR centrado
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)
    
    // Texto debajo del QR
    yPos += qrSize + 15
    doc.setTextColor(...colors.darkText)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Si no puedes descargar el PDF, este QR también es válido para el acceso', 
             pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - 40 })

    // === TÉRMINOS IMPORTANTES (Estilo del email) ===
    yPos += 20
    
    // Caja amarilla de términos (igual que en email)
    doc.setFillColor(255, 243, 205) // #fff3cd
    doc.setDrawColor(255, 238, 186) // #ffeeba
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 35, 3, 3, 'FD')
    
    // Título de términos
    yPos += 10
    doc.setTextColor(133, 100, 4) // #856404
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('Términos Importantes', margin + 10, yPos)
    
    // Lista de términos en dos columnas (como en email)
    yPos += 8
    doc.setFontSize(10)
    
    const leftTerms = [
      'Entrada personal para ' + (guestData.name || 'titular'),
      'Una sola entrada por código QR',
      'No transferible a terceros'
    ]
    
    const rightTerms = [
      'Derecho de admisión reservado',
      'Aforo limitado según disponibilidad',
      'Sin bebidas externas permitidas'
    ]
    
    leftTerms.forEach((term, index) => {
      doc.text('• ' + term, margin + 10, yPos + (index * 6))
    })
    
    rightTerms.forEach((term, index) => {
      doc.text('• ' + term, pageWidth / 2 + 10, yPos + (index * 6))
    })

    // === CALL TO ACTION FINAL (Como en email) ===
    yPos += 25
    
    // Fondo con gradiente (igual que la sección de descarga)
    const ctaHeight = 25
    for (let i = 0; i < ctaHeight; i += 1) {
      const ratio = i / ctaHeight
      const r = Math.round(colors.primaryDark[0] + (colors.primaryBlue[0] - colors.primaryDark[0]) * ratio)
      const g = Math.round(colors.primaryDark[1] + (colors.primaryBlue[1] - colors.primaryDark[1]) * ratio)
      const b = Math.round(colors.primaryDark[2] + (colors.primaryBlue[2] - colors.primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(margin, yPos + i, pageWidth - (margin * 2), 1, 'F')
    }
    
    // Hacer bordes redondeados
    doc.setFillColor(...colors.primaryDark)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), ctaHeight, 4, 4, 'F')
    
    // Aplicar gradiente
    for (let i = 0; i < ctaHeight; i += 1) {
      const ratio = i / ctaHeight
      const r = Math.round(colors.primaryDark[0] + (colors.primaryBlue[0] - colors.primaryDark[0]) * ratio)
      const g = Math.round(colors.primaryDark[1] + (colors.primaryBlue[1] - colors.primaryDark[1]) * ratio)
      const b = Math.round(colors.primaryDark[2] + (colors.primaryBlue[2] - colors.primaryDark[2]) * ratio)
      
      doc.setFillColor(r, g, b)
      doc.rect(margin, yPos + i, pageWidth - (margin * 2), 1, 'F')
    }
    
    // Texto del CTA
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('¡Nos Vemos Pronto!', pageWidth / 2, yPos + 10, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`${eventData.name || 'Evento'} • ${formatEventDate(eventData.date)}`, 
             pageWidth / 2, yPos + 18, { align: 'center' })

    // === FOOTER (Como en email) ===
    const footerY = pageHeight - 20
    
    // Línea separadora
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    // Texto del footer
    doc.setTextColor(102, 102, 102) // #666
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    doc.text('Sistema de Entradas Digitales', pageWidth / 2, footerY - 10, { align: 'center' })
    
    const currentDate = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    doc.text(`Generado el ${currentDate}`, pageWidth / 2, footerY - 5, { align: 'center' })
    doc.text('Para cambios, contacta directamente con el organizador', pageWidth / 2, footerY, { align: 'center' })

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
 * Formatear fecha como en el email
 */
const formatEventDate = (dateString) => {
  if (!dateString) return 'Fecha por confirmar'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Fecha por confirmar'
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (error) {
    return 'Fecha por confirmar'
  }
}

/**
 * Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    console.log('Generando PDF de entrada:', guestData.name)
    
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