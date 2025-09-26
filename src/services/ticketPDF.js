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

    // Colores originales del diseño
    const colors = {
      primaryDark: [13, 27, 42],      // #0d1b2a - Azul oscuro original
      primaryBlue: [30, 58, 138],     // #1e3a8a - Azul del gradiente original
      darkText: [51, 51, 51],         // #333333 - Texto principal
      mediumGray: [85, 85, 85],       // #555555 - Labels
      lightGray: [249, 249, 249],     // #f9f9f9 - Fondos claros
      borderGray: [220, 220, 220],    // #dcdcdc - Bordes
      white: [255, 255, 255],         // #ffffff
      success: [40, 167, 69]          // #28a745 - Verde para válido
    }

    const pageWidth = 210
    const pageHeight = 297
    const margin = 15

    // DEPURACIÓN: Log de la fecha recibida
    console.log('DEBUG - Fecha del evento recibida:', eventData.date)
    console.log('DEBUG - Tipo de fecha:', typeof eventData.date)

    // === HEADER ORIGINAL ESTILO EMAIL ===
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

    // === DETALLES DEL EVENTO (Estilo original) ===
    yPos += 20
    
    // Caja de detalles con el mismo estilo original
    doc.setFillColor(...colors.lightGray)
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, 3, 'FD')
    
    // Título de la sección
    yPos += 12
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.text('Detalles del Evento', margin + 10, yPos)
    
    // Información básica y necesaria solamente
    yPos += 8
    doc.setFontSize(11)
    
    const details = [
      ['Evento:', eventData.name || 'Evento'],
      ['Fecha:', formatEventDateFixed(eventData.date)], // *** FECHA CORREGIDA ***
      ['Invitado:', guestData.name || 'Invitado'],
      ['Email:', guestData.email || '']
    ]
    
    details.forEach((detail, index) => {
      const rowY = yPos + (index * 6)
      
      // Label (negrita, color medio)
      doc.setTextColor(...colors.mediumGray)
      doc.setFont('helvetica', 'bold')
      doc.text(detail[0], margin + 10, rowY)
      
      // Valor (normal, color oscuro)
      doc.setTextColor(...colors.darkText)
      doc.setFont('helvetica', 'normal')
      doc.text(detail[1], margin + 45, rowY, { maxWidth: pageWidth - 75 })
    })

    // === CÓDIGO QR GRANDE PERO SIN CÓDIGO INNECESARIO ===
    yPos += 30

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

    // QR grande y centrado
    const qrSize = 110
    const qrX = (pageWidth - qrSize) / 2

    // Fondo blanco para el QR
    doc.setFillColor(...colors.white)
    doc.setDrawColor(...colors.primaryDark)
    doc.setLineWidth(2)
    doc.roundedRect(qrX - 8, yPos - 8, qrSize + 16, qrSize + 16, 4, 4, 'FD')

    // Insertar QR
    doc.addImage(qrCodeBase64, 'PNG', qrX, yPos, qrSize, qrSize)

    // Texto importante debajo del QR
    yPos += qrSize + 20
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('PRESENTA ESTE CÓDIGO EN LA ENTRADA', pageWidth / 2, yPos, { align: 'center' })

    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...colors.darkText)
    doc.text('Entrada personal e intransferible', pageWidth / 2, yPos, { align: 'center' })

    // === TÉRMINOS MÍNIMOS ===
    yPos += 20
    
    doc.setFillColor(255, 243, 205) // #fff3cd - Amarillo claro como original
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 18, 3, 3, 'FD')

    yPos += 8
    doc.setTextColor(133, 100, 4) // #856404 - Color amarillo oscuro original
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('• Llegar 15 minutos antes del evento  • Derecho de admisión reservado  • Una entrada por código QR', 
             margin + 10, yPos)

    yPos += 6
    doc.text('• Entrada válida solo para el titular registrado', margin + 10, yPos)

    // === LOGO GAUDÍ EN EL FOOTER ===
    const footerY = pageHeight - 25

    // Fondo gris claro para el logo (contraste con logo blanco)
    doc.setFillColor(240, 240, 240) // Gris muy claro
    doc.setDrawColor(...colors.borderGray)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, footerY - 5, pageWidth - (margin * 2), 20, 3, 3, 'FD')

    // Cargar el logo Gaudí
    try {
      // Intentar cargar desde diferentes rutas posibles
      let logoSrc = null
      
      if (logoBase64) {
        // Si se pasa como parámetro
        logoSrc = logoBase64
      } else {
        // Intentar cargar desde assets o public
        try {
          // Opción 1: src/assets/images/gaudi.png
          logoSrc = await import('@/assets/images/gaudi.png')
        } catch {
          try {
            // Opción 2: public/images/gaudi.png  
            logoSrc = '/images/gaudi.png'
          } catch {
            // Opción 3: directamente en public
            logoSrc = '/gaudi.png'
          }
        }
      }

      if (logoSrc) {
        // Convertir logo blanco a gris oscuro para mejor contraste
        const logoSize = 15
        const logoX = pageWidth / 2 - logoSize / 2
        
        // Añadir el logo
        doc.addImage(logoSrc, 'PNG', logoX, footerY - 2, logoSize, logoSize)
        
        // Texto debajo del logo
        doc.setTextColor(...colors.darkText)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text('Sistema de Entradas Digitales', pageWidth / 2, footerY + 15, { align: 'center' })
      } else {
        throw new Error('Logo no encontrado')
      }
      
    } catch (error) {
      console.log('Logo no encontrado, usando texto:', error)
      // Fallback si no se encuentra el logo
      doc.setTextColor(...colors.darkText)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('GAUDÍ', pageWidth / 2, footerY + 2, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text('Sistema de Entradas Digitales', pageWidth / 2, footerY + 8, { align: 'center' })
    }

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

    // Formatear en español estilo original
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
 * Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, logoBase64 = null) => {
  try {
    console.log('Generando PDF de entrada:', guestData.name)
    console.log('Fecha del evento recibida:', eventData.date)
    
    // Si no se pasa logo, intentar cargarlo
    let logoToUse = logoBase64
    if (!logoToUse) {
      try {
        // Intentar cargar el logo desde diferentes ubicaciones
        const logoModule = await import('@/assets/images/gaudi.png')
        logoToUse = logoModule.default
      } catch (error) {
        console.log('Logo no encontrado en assets, intentando public folder:', error)
        // Si no se encuentra en assets, usar ruta pública
        logoToUse = '/images/gaudi.png'
      }
    }
    
    const base64PDF = await generateTicketForEmail(guestData, eventData, logoToUse)
    
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