import jsPDF from 'jspdf'

/**
 * Generar PDF según el tipo solicitado
 * @param {Object} config - Configuración del PDF
 * @returns {Promise<void>} - PDF generado y descargado
 */
export const generatePDF = async (config) => {
  const { type, eventName, ...data } = config
  
  switch (type) {
    case 'attendees':
      return generateAttendeesPDF(eventName, data)
    case 'full':
      return generateFullReportPDF(eventName, data)
    case 'guest-list':
      return generateGuestListPDF(eventName, data)
    default:
      throw new Error('Tipo de PDF no válido')
  }
}

/**
 * Generar PDF solo con asistentes
 * @param {string} eventName - Nombre del evento
 * @param {Object} data - Datos para el PDF
 */
const generateAttendeesPDF = (eventName, data) => {
  const { attendees, stats } = data
  const doc = new jsPDF()
  
  // Configuración de colores
  const primaryColor = [102, 126, 234] // #667eea
  const successColor = [40, 167, 69]   // #28a745
  const textColor = [33, 37, 41]       // #212529
  
  let yPosition = 20
  
  // Encabezado principal
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Lista de Asistentes', 20, 25)
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 35)
  
  yPosition = 60
  
  // Información del reporte
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition)
  doc.text(`Hora del reporte: ${new Date().toLocaleTimeString('es-ES')}`, 120, yPosition)
  yPosition += 10
  
  // Estadísticas en caja
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 25, 'F')
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Resumen de Asistencia', 25, yPosition + 8)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Total de asistentes: ${attendees.length}`, 25, yPosition + 16)
  doc.text(`Tasa de asistencia: ${stats.rate}%`, 120, yPosition + 16)
  
  yPosition += 40
  
  // Encabezados de tabla
  doc.setFillColor(...successColor)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 40, yPosition + 8)
  doc.text('Email', 100, yPosition + 8)
  doc.text('Hora de Entrada', 150, yPosition + 8)
  
  yPosition += 15
  
  // Lista de asistentes
  doc.setTextColor(...textColor)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  
  attendees.forEach((attendee, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
      
      // Repetir encabezados en nueva página
      doc.setFillColor(...successColor)
      doc.rect(20, yPosition, 170, 12, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('N°', 25, yPosition + 8)
      doc.text('Nombre', 40, yPosition + 8)
      doc.text('Email', 100, yPosition + 8)
      doc.text('Hora de Entrada', 150, yPosition + 8)
      
      yPosition += 15
      doc.setTextColor(...textColor)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
    }
    
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 249)
      doc.rect(20, yPosition - 3, 170, 10, 'F')
    }
    
    const entryTime = new Date(attendee.entered_at).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(attendee.name, 25), 40, yPosition + 4)
    doc.text(truncateText(attendee.email, 22), 100, yPosition + 4)
    doc.text(entryTime, 155, yPosition + 4)
    
    yPosition += 10
  })
  
  // Pie de página
  addFooter(doc, 'Lista de Asistentes', eventName)
  
  // Descargar
  const fileName = `Asistentes_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Generar PDF de reporte completo
 * @param {string} eventName - Nombre del evento
 * @param {Object} data - Datos completos
 */
const generateFullReportPDF = (eventName, data) => {
  const { guests, attendees, stats, hourlyStats } = data
  const doc = new jsPDF()
  
  const primaryColor = [102, 126, 234]
  const secondaryColor = [118, 75, 162]
  const textColor = [33, 37, 41]
  
  let yPosition = 20
  
  // ===== PÁGINA 1: RESUMEN EJECUTIVO =====
  
  // Encabezado con gradiente simulado
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont(undefined, 'bold')
  doc.text('Reporte Completo', 20, 25)
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 40)
  
  yPosition = 70
  
  // Información del reporte
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Fecha del evento: ${getCurrentDate()}`, 20, yPosition)
  doc.text(`Reporte generado: ${new Date().toLocaleString('es-ES')}`, 120, yPosition)
  yPosition += 20
  
  // Estadísticas principales en cajas
  const statBoxes = [
    { label: 'Total Invitados', value: stats.total, color: [52, 144, 220] },
    { label: 'QRs Enviados', value: stats.qrsSent, color: [255, 193, 7] },
    { label: 'Asistieron', value: stats.attended, color: [40, 167, 69] },
    { label: 'Tasa Asistencia', value: `${stats.rate}%`, color: [111, 66, 193] }
  ]
  
  statBoxes.forEach((stat, index) => {
    const x = 20 + (index % 2) * 85
    const y = yPosition + Math.floor(index / 2) * 35
    
    doc.setFillColor(...stat.color)
    doc.rect(x, y, 80, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(stat.value.toString(), x + 40, y + 15, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(stat.label, x + 40, y + 25, { align: 'center' })
  })
  
  yPosition += 80
  
  // Gráfico de asistencia (barra simple)
  doc.setTextColor(...textColor)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Tasa de Asistencia', 20, yPosition)
  
  yPosition += 15
  
  const barWidth = 150
  const barHeight = 20
  const attendancePercentage = stats.rate / 100
  
  // Barra de fondo
  doc.setFillColor(233, 236, 239)
  doc.rect(20, yPosition, barWidth, barHeight, 'F')
  
  // Barra de progreso
  doc.setFillColor(...statBoxes[2].color)
  doc.rect(20, yPosition, barWidth * attendancePercentage, barHeight, 'F')
  
  // Texto del porcentaje
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`${stats.rate}%`, 20 + (barWidth * attendancePercentage) - 15, yPosition + 13)
  
  yPosition += 35
  
  // Estadísticas por hora (si existen)
  if (hourlyStats && hourlyStats.length > 0) {
    doc.setTextColor(...textColor)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Entradas por Hora', 20, yPosition)
    
    yPosition += 15
    
    const maxHourCount = Math.max(...hourlyStats.map(h => h.count))
    
    hourlyStats.forEach((hourStat, index) => {
      const barLength = (hourStat.count / maxHourCount) * 100
      const y = yPosition + index * 12
      
      // Etiqueta de hora
      doc.setFontSize(10)
      doc.text(`${hourStat.hour}:00`, 20, y + 6)
      
      // Barra
      doc.setFillColor(200, 200, 200)
      doc.rect(45, y, 100, 8, 'F')
      
      doc.setFillColor(...primaryColor)
      doc.rect(45, y, barLength, 8, 'F')
      
      // Cantidad
      doc.text(hourStat.count.toString(), 150, y + 6)
    })
  }
  
  // ===== PÁGINA 2: LISTA COMPLETA DE INVITADOS =====
  
  doc.addPage()
  yPosition = 20
  
  // Encabezado
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Lista Completa de Invitados', 20, 20)
  
  yPosition = 50
  
  // Encabezados de tabla
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 40, yPosition + 8)
  doc.text('Email', 90, yPosition + 8)
  doc.text('QR', 140, yPosition + 8)
  doc.text('Entró', 160, yPosition + 8)
  
  yPosition += 15
  
  // Lista de invitados
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  
  guests.forEach((guest, index) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
      
      // Repetir encabezados
      doc.setFillColor(248, 249, 250)
      doc.rect(20, yPosition, 170, 12, 'F')
      
      doc.setTextColor(...textColor)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('N°', 25, yPosition + 8)
      doc.text('Nombre', 40, yPosition + 8)
      doc.text('Email', 90, yPosition + 8)
      doc.text('QR', 140, yPosition + 8)
      doc.text('Entró', 160, yPosition + 8)
      
      yPosition += 15
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
    }
    
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252)
      doc.rect(20, yPosition - 2, 170, 10, 'F')
    }
    
    // Datos del invitado
    doc.setTextColor(...textColor)
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(guest.name, 20), 40, yPosition + 4)
    doc.text(truncateText(guest.email, 20), 90, yPosition + 4)
    
    // Estado QR
    if (guest.qr_sent) {
      doc.setTextColor(40, 167, 69)
      doc.text('✓', 145, yPosition + 4)
    } else {
      doc.setTextColor(220, 53, 69)
      doc.text('✗', 145, yPosition + 4)
    }
    
    // Estado entrada
    if (guest.has_entered) {
      doc.setTextColor(40, 167, 69)
      doc.text('✓', 165, yPosition + 4)
    } else {
      doc.setTextColor(220, 53, 69)
      doc.text('✗', 165, yPosition + 4)
    }
    
    yPosition += 10
  })
  
  // ===== PÁGINA 3: SOLO ASISTENTES (si hay) =====
  
  if (attendees.length > 0) {
    doc.addPage()
    yPosition = 20
    
    // Encabezado
    doc.setFillColor(40, 167, 69)
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Detalle de Asistentes', 20, 20)
    
    yPosition = 50
    
    // Encabezados
    doc.setFillColor(248, 249, 250)
    doc.rect(20, yPosition, 170, 12, 'F')
    
    doc.setTextColor(...textColor)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('N°', 25, yPosition + 8)
    doc.text('Nombre', 40, yPosition + 8)
    doc.text('Email', 90, yPosition + 8)
    doc.text('Hora de Entrada', 140, yPosition + 8)
    
    yPosition += 15
    
    // Lista de asistentes
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    
    attendees.forEach((attendee, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
        
        // Repetir encabezados
        doc.setFillColor(248, 249, 250)
        doc.rect(20, yPosition, 170, 12, 'F')
        
        doc.setTextColor(...textColor)
        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.text('N°', 25, yPosition + 8)
        doc.text('Nombre', 40, yPosition + 8)
        doc.text('Email', 90, yPosition + 8)
        doc.text('Hora de Entrada', 140, yPosition + 8)
        
        yPosition += 15
        doc.setFont(undefined, 'normal')
        doc.setFontSize(9)
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252)
        doc.rect(20, yPosition - 2, 170, 10, 'F')
      }
      
      const entryTime = new Date(attendee.entered_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      doc.setTextColor(...textColor)
      doc.text(`${index + 1}`, 25, yPosition + 4)
      doc.text(truncateText(attendee.name, 20), 40, yPosition + 4)
      doc.text(truncateText(attendee.email, 20), 90, yPosition + 4)
      doc.text(entryTime, 145, yPosition + 4)
      
      yPosition += 10
    })
  }
  
  // Añadir pie de página a todas las páginas
  addFooter(doc, 'Reporte Completo', eventName)
  
  // Descargar
  const fileName = `Reporte_Completo_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Generar PDF de lista de invitados (todos)
 * @param {string} eventName - Nombre del evento
 * @param {Object} data - Datos de invitados
 */
const generateGuestListPDF = (eventName, data) => {
  const { guests } = data
  const doc = new jsPDF()
  
  const primaryColor = [102, 126, 234]
  const textColor = [33, 37, 41]
  
  let yPosition = 20
  
  // Encabezado
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Lista de Invitados', 20, 25)
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 35)
  
  yPosition = 60
  
  // Información
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Total de invitados: ${guests.length}`, 20, yPosition)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 120, yPosition)
  
  yPosition += 20
  
  // Encabezados de tabla
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 40, yPosition + 8)
  doc.text('Email', 110, yPosition + 8)
  
  yPosition += 15
  
  // Lista de invitados
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  
  guests.forEach((guest, index) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
      
      // Repetir encabezados
      doc.setFillColor(248, 249, 250)
      doc.rect(20, yPosition, 170, 12, 'F')
      
      doc.setTextColor(...textColor)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('N°', 25, yPosition + 8)
      doc.text('Nombre', 40, yPosition + 8)
      doc.text('Email', 110, yPosition + 8)
      
      yPosition += 15
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 249)
      doc.rect(20, yPosition - 3, 170, 12, 'F')
    }
    
    doc.setTextColor(...textColor)
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(guest.name, 30), 40, yPosition + 4)
    doc.text(truncateText(guest.email, 35), 110, yPosition + 4)
    
    yPosition += 12
  })
  
  // Pie de página
  addFooter(doc, 'Lista de Invitados', eventName)
  
  // Descargar
  const fileName = `Lista_Invitados_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Generar PDF con códigos QR individuales
 * @param {Array} guestsWithQRs - Invitados con sus QRs
 * @param {string} eventName - Nombre del evento
 */
export const generateQRSheetPDF = (guestsWithQRs, eventName) => {
  const doc = new jsPDF()
  
  const qrSize = 40
  const qrsPerRow = 4
  const qrsPerPage = 20 // 4x5
  const marginX = 15
  const marginY = 30
  const spacingX = 45
  const spacingY = 50
  
  let currentPage = 0
  let qrCount = 0
  
  guestsWithQRs.forEach((guestData, index) => {
    const { guest, qrImageData } = guestData
    
    // Nueva página cada 20 QRs
    if (index % qrsPerPage === 0) {
      if (index > 0) doc.addPage()
      currentPage++
      
      // Encabezado de página
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text(`${eventName} - Códigos QR (Página ${currentPage})`, 20, 20)
    }
    
    const row = Math.floor((index % qrsPerPage) / qrsPerRow)
    const col = index % qrsPerRow
    
    const x = marginX + col * spacingX
    const y = marginY + row * spacingY
    
    try {
      // Añadir imagen QR
      if (qrImageData) {
        doc.addImage(qrImageData, 'PNG', x, y, qrSize, qrSize)
      }
      
      // Nombre debajo del QR
      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      const truncatedName = truncateText(guest.name, 15)
      doc.text(truncatedName, x + qrSize/2, y + qrSize + 5, { align: 'center' })
      
    } catch (error) {
      console.error(`Error adding QR for ${guest.name}:`, error)
    }
  })
  
  // Descargar
  const fileName = `Codigos_QR_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Añadir pie de página a todas las páginas
 * @param {jsPDF} doc - Documento PDF
 * @param {string} title - Título del documento
 * @param {string} eventName - Nombre del evento
 */
const addFooter = (doc, title, eventName) => {
  const pageCount = doc.internal.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 285, 190, 285)
    
    // Texto del pie
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    
    const footerText = `${title} - ${eventName} | Generado el ${new Date().toLocaleString('es-ES')}`
    doc.text(footerText, 20, 290)
    
    // Número de página
    doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' })
  }
}

/**
 * Truncar texto si es muy largo
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
}

/**
 * Sanitizar nombre de archivo
 * @param {string} filename - Nombre a sanitizar
 * @returns {string} - Nombre sanitizado
 */
const sanitizeFileName = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

/**
 * Obtener fecha actual en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada
 */
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Generar PDF de estadísticas avanzadas
 * @param {Object} statsData - Datos estadísticos
 * @param {string} eventName - Nombre del evento
 */
export const generateAdvancedStatsPDF = (statsData, eventName) => {
  const doc = new jsPDF()
  const {
    totalStats,
    hourlyBreakdown,
    deviceStats,
    timeAnalysis
  } = statsData
  
  // Página de estadísticas avanzadas
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Estadísticas Avanzadas', 20, 25)
  
  doc.setFontSize(14)
  doc.text(eventName, 20, 35)
  
  let yPos = 60
  
  // Análisis temporal
  if (timeAnalysis) {
    doc.setTextColor(33, 37, 41)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Análisis Temporal', 20, yPos)
    yPos += 15
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Hora pico: ${timeAnalysis.peakHour}:00 (${timeAnalysis.peakCount} entradas)`, 25, yPos)
    yPos += 10
    doc.text(`Duración promedio entre llegadas: ${timeAnalysis.avgInterval} minutos`, 25, yPos)
    yPos += 20
  }
  
  // Más estadísticas según necesidades...
  
  const fileName = `Estadisticas_Avanzadas_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Exportar datos como CSV
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 * @param {Array} headers - Encabezados de columnas
 */
export const exportToCSV = (data, filename, headers) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${getCurrentDate()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Configuraciones predefinidas de PDF
 */
export const pdfConfigs = {
  // Configuración para eventos pequeños
  small: {
    fontSize: {
      title: 20,
      header: 14,
      body: 10
    },
    spacing: {
      line: 8,
      section: 15
    }
  },
  
  // Configuración para eventos grandes
  large: {
    fontSize: {
      title: 24,
      header: 16,
      body: 9
    },
    spacing: {
      line: 7,
      section: 12
    }
  },
  
  // Configuración compacta
  compact: {
    fontSize: {
      title: 18,
      header: 12,
      body: 8
    },
    spacing: {
      line: 6,
      section: 10
    }
  }
}

export default {
  generatePDF,
  generateQRSheetPDF,
  generateAdvancedStatsPDF,
  exportToCSV,
  pdfConfigs
}