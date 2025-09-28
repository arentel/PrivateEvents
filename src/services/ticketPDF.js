import jsPDF from 'jspdf'
import QRCode from 'qrcode'

/**
 * Cargar logo de Gaudí desde diferentes ubicaciones
 */
const loadGaudiLogo = async () => {
  const logoOptions = [
    // Opción 1: Importación directa desde assets
    async () => {
      const logoModule = await import('@/assets/images/gaudi.png')
      return logoModule.default
    },
    // Opción 2: Ruta pública
    () => '/images/gaudi.png',
    // Opción 3: Ruta alternativa
    () => '/gaudi.png',
    // Opción 4: Desde src/assets
    () => '/src/assets/images/gaudi.png'
  ]

  for (const option of logoOptions) {
    try {
      const logoSrc = await option()
      
      // Verificar que la imagen se puede cargar
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(logoSrc)
        img.onerror = () => reject(new Error('Failed to load'))
        img.src = logoSrc
      })
    } catch (error) {
      console.warn('Opción de logo falló:', error.message)
      continue
    }
  }
  
  console.warn('No se pudo cargar el logo de Gaudí desde ninguna ubicación')
  return null
}

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

    const colors = {
      primaryDark: [13, 27, 42],
      primaryBlue: [30, 58, 138],
      darkText: [51, 51, 51],
      mediumGray: [85, 85, 85],
      lightGray: [249, 249, 249],
      borderGray: [220, 220, 220],
      white: [255, 255, 255],
      success: [40, 167, 69]
    }

    const pageWidth = 210
    const pageHeight = 297
    const margin = 15

    console.log('📄 Generando PDF para:', guestData.name)
    console.log('📅 Fecha del evento:', eventData.date)
    console.log('🔍 QR disponible:', !!guestData.qrCode || !!guestData.qr_code)

    // === HEADER ===
    doc.setFillColor(...colors.primaryDark)
    doc.rect(0, 0, pageWidth, 50, 'F')
    
    doc.setTextColor(...colors.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.text(eventData.name || 'EVENTO', pageWidth / 2, 25, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('Tu entrada está confirmada', pageWidth / 2, 38, { align: 'center' })

    // === SALUDO PERSONAL ===
    let yPos = 60
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)
    doc.text(`Hola ${guestData.name || 'Invitado'},`, margin, yPos)
    
    yPos += 8
    doc.setTextColor(...colors.darkText)
    doc.setFontSize(12)
    doc.text('Tu entrada ha sido confirmada y está lista para usar.', margin, yPos)

    // === INFORMACIÓN DEL EVENTO ===
    yPos += 12
    
    doc.setTextColor(...colors.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(eventData.name || 'Evento', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(formatEventDateFixed(eventData.date), pageWidth / 2, yPos, { align: 'center' })
    
    if (eventData.location) {
      yPos += 6
      doc.setFontSize(12)
      doc.text(eventData.location, pageWidth / 2, yPos, { 
        align: 'center',
        maxWidth: pageWidth - 40
      })
    }
    
    // === CÓDIGO QR CORREGIDO ===
    yPos += 25

    // CORRECCIÓN: Usar el QR consistente que viene del sistema
    let qrData
    
    // Prioridad: usar el QR que viene como parámetro en generateTicketPDF
    if (options.qrCode) {
      console.log('✅ Usando QR pasado como parámetro')
      qrData = options.qrCode
    }
    // Alternativa: QR almacenado en guestData
    else if (guestData.qrCode) {
      console.log('✅ Usando QR de guestData.qrCode')
      qrData = guestData.qrCode
    }
    else if (guestData.qr_code) {
      console.log('✅ Usando QR de guestData.qr_code')
      qrData = guestData.qr_code
    }
    // Fallback: crear QR mínimo
    else {
      console.log('⚠️ Generando QR de emergencia')
      qrData = JSON.stringify({
        id: guestData.id,
        name: guestData.name,
        email: guestData.email,
        event_name: eventData.name,
        timestamp: new Date().toISOString(),
        version: '2.0'
      })
    }

    console.log('🔄 QR a usar en PDF:', qrData.substring(0, 50) + '...')

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

    // Texto debajo del QR
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

    // === FOOTER CON LOGO GAUDÍ ===
    yPos = pageHeight - 32

    // Fondo del footer
    doc.setFillColor(...colors.primaryDark)
    doc.roundedRect(margin, yPos - 5, pageWidth - (margin * 2), 35, 4, 4, 'F')

    // Cargar e insertar logo
    try {
      let logoSrc = logoBase64 || await loadGaudiLogo()
      
      if (logoSrc) {
        console.log('✅ Logo Gaudí cargado correctamente')
        
        const logoWidth = 24
        const logoHeight = 18
        const logoX = (pageWidth - logoWidth) / 2
        const logoY = yPos + 2
        
        doc.addImage(logoSrc, 'PNG', logoX, logoY, logoWidth, logoHeight)
        
        // Texto del footer
        doc.setTextColor(...colors.white)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('Sistema de Entradas Digitales', pageWidth / 2, yPos + 25, { align: 'center' })
      } else {
        throw new Error('Logo no disponible')
      }
      
    } catch (error) {
      console.warn('⚠️ Logo no encontrado, usando texto:', error.message)
      
      // Fallback con texto
      doc.setTextColor(...colors.white)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('GAUDÍ', pageWidth / 2, yPos + 10, { align: 'center' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Sistema de Entradas Digitales', pageWidth / 2, yPos + 18, { align: 'center' })
    }

    // Generar PDF
    const pdfOutput = doc.output('datauristring')
    const base64PDF = pdfOutput.split(',')[1]

    const sizeInKB = Math.round((base64PDF.length * 3) / 4 / 1024)
    console.log(`✅ PDF generado: ${sizeInKB}KB`)

    return base64PDF

  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    throw new Error('Error al generar la entrada: ' + error.message)
  }
}

/**
 * Función para formatear fecha del evento
 */
const formatEventDateFixed = (eventDateInput) => {
  if (!eventDateInput) {
    return 'Fecha por confirmar'
  }
  
  try {
    let eventDate

    if (typeof eventDateInput === 'string') {
      eventDate = new Date(eventDateInput)
    } else if (typeof eventDateInput === 'number') {
      eventDate = new Date(eventDateInput)
    } else if (eventDateInput instanceof Date) {
      eventDate = eventDateInput
    } else {
      eventDate = new Date(eventDateInput)
    }

    if (isNaN(eventDate.getTime())) {
      return 'Fecha por confirmar'
    }

    return eventDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  } catch (error) {
    console.error('Error formateando fecha:', error)
    return 'Fecha por confirmar'
  }
}

/**
 * FUNCIÓN CORREGIDA: Generar PDF para descarga directa
 */
export const generateTicketPDF = async (guestData, eventData, qrCode = null) => {
  try {
    console.log('🎫 Generando PDF de entrada para:', guestData.name)
    console.log('📅 Evento:', eventData.name)
    console.log('🔍 QR recibido:', !!qrCode)
    
    // Pasar el QR como opción para que llegue a generateTicketForEmail
    const options = {
      qrCode: qrCode
    }
    
    const base64PDF = await generateTicketForEmail(guestData, eventData, null, options)
    
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
    
    console.log('✅ PDF descargado exitosamente')
    return true

  } catch (error) {
    console.error('❌ Error descargando PDF:', error)
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