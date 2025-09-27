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

    // === SALUDO PERSONAL - MÁS ARRIBA ===
    let yPos = 60  // Subido de 70 a 60
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text(`Hola ${guestData.name || 'Invitado'},`, margin, yPos)
    
    yPos += 8  // Reducido de 10 a 8
    doc.setTextColor(...colors.darkText)
    doc.setFontSize(12)
    doc.text('Tu entrada ha sido confirmada y está lista para usar.', margin, yPos)

    // === INFORMACIÓN ESENCIAL SIN RECUADRO - ESTILO HEADER ===
    yPos += 12  // Reducido para subir más la información
    
    // Sin recuadro, solo texto con el color del header
    doc.setTextColor(...colors.primaryDark)  // Mismo color que el header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(eventData.name || 'Evento', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(formatEventDateFixed(eventData.date), pageWidth / 2, yPos, { align: 'center' })
    
    // Ubicación si existe
    if (eventData.location) {
      yPos += 6
      doc.setFontSize(12)
      doc.text(eventData.location, pageWidth / 2, yPos, { 
        align: 'center',
        maxWidth: pageWidth - 40
      })
    }
    
    // === CÓDIGO QR - MÁS ARRIBA Y MÁS ESPACIO ===
    yPos += 25  // Más espacio antes del QR

    // *** CÓDIGO QR CORREGIDO - USAR EL QR ALMACENADO EN LA BASE DE DATOS ***
    let qrData
    
    // 1. Prioridad: QR del guest de la BD (campo qr_code)
    if (guestData.qr_code) {
      console.log('🔄 Usando QR almacenado en guest.qr_code')
      qrData = guestData.qr_code
    }
    // 2. Alternativa: QR del ticket de la BD (campo qrCode)  
    else if (guestData.qrCode) {
      console.log('🔄 Usando QR almacenado en ticketData.qrCode')
      qrData = guestData.qrCode
    }
    // 3. Fallback: Generar nuevo QR (solo si no existe)
    else {
      console.log('⚠️ Generando nuevo QR (no debería pasar normalmente)')
      qrData = JSON.stringify({
        id: guestData.id,
        name: guestData.name,
        email: guestData.email,
        event_name: eventData.name,
        event_id: eventData.id,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        version: '1.0'
      })
    }

    // Generar QR de alta calidad usando el código correcto
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

    // Texto debajo del QR - más compacto
    yPos += qrSize + 15
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('PRESENTA ESTE CÓDIGO EN LA ENTRADA', pageWidth / 2, yPos, { align: 'center' })

    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...colors.darkText)
    doc.text('Entrada personal e intransferible', pageWidth / 2, yPos, { align: 'center' })

    // === FOOTER EXTENDIDO CON LOGO GAUDÍ CENTRADO ===
    yPos = pageHeight - 32  // Footer un poco más abajo (era 40, ahora 32)

    // Fondo del mismo color que el header para contraste con logo blanco
    doc.setFillColor(...colors.primaryDark)
    doc.roundedRect(margin, yPos - 5, pageWidth - (margin * 2), 35, 4, 4, 'F')

    // Cargar el logo Gaudí
    try {
      let logoSrc = null
      
      if (logoBase64) {
        logoSrc = logoBase64
      } else {
        try {
          const logoModule = await import('@/assets/images/gaudi.png')
          logoSrc = logoModule.default
        } catch {
          try {
            logoSrc = '/images/gaudi.png'
          } catch {
            logoSrc = '/gaudi.png'
          }
        }
      }

      if (logoSrc) {
        // Logo ligeramente más ancho para mejor proporción
        const logoWidth = 24   // Un poco más ancho
        const logoHeight = 18  // Proporción natural
        const logoX = (pageWidth - logoWidth) / 2  // Centrado perfecto
        const logoY = yPos + 2  // Posición vertical
        
        // Dimensiones sutilmente más anchas
        doc.addImage(logoSrc, 'PNG', logoX, logoY, logoWidth, logoHeight)
        
        // Texto blanco dentro del footer
        doc.setTextColor(...colors.white)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('Sistema de Entradas Digitales', pageWidth / 2, yPos + 25, { align: 'center' })
      } else {
        throw new Error('Logo no encontrado')
      }
      
    } catch (error) {
      console.log('Logo no encontrado, usando texto:', error)
      // Fallback con texto blanco centrado
      doc.setTextColor(...colors.white)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('GAUDÍ', pageWidth / 2, yPos + 10, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Sistema de Entradas Digitales', pageWidth / 2, yPos + 18, { align: 'center' })  // También dentro del footer
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
    console.log('QR Code del invitado:', guestData.qr_code ? 'Presente' : 'Ausente')
    
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