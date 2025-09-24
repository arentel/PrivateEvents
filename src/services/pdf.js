import jsPDF from 'jspdf'

/**
 * Generar PDF según el tipo solicitado
 * @param {Object} config - Configuración del PDF
 * @returns {Promise<void>} - PDF generado y descargado
 */
export const generatePDF = async (config) => {
  const { type, eventName, eventDate, eventLocation, eventDescription, ...data } = config
  
  switch (type) {
    case 'attendees':
      return generateAttendeesPDF(eventName, { eventDate, eventLocation, ...data })
    case 'full':
      return generateFullReportPDF(eventName, { eventDate, eventLocation, eventDescription, ...data })
    case 'guests':
      return generateGuestListPDF(eventName, { eventDate, eventLocation, ...data })
    case 'comparative':
      return generateComparativeReportPDF(data)
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
  const { attendees, stats, eventDate, eventLocation } = data
  const doc = new jsPDF()
  
  // Configuración de colores
  const primaryColor = [102, 126, 234] // #667eea
  const successColor = [40, 167, 69]   // #28a745
  const textColor = [33, 37, 41]       // #212529
  
  let yPosition = 20
  
  // Encabezado principal
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Lista de Asistentes', 20, 25)
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 35)
  
  // Información del evento (nueva funcionalidad)
  if (eventDate) {
    doc.setFontSize(12)
    doc.text(formatEventDate(eventDate), 20, 45)
  }
  
  yPosition = 60
  
  // Información del evento adicional
  if (eventLocation) {
    doc.setTextColor(...textColor)
    doc.setFontSize(12)
    doc.text(`📍 Ubicación: ${eventLocation}`, 20, yPosition)
    yPosition += 10
  }
  
  // Información del reporte
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition)
  doc.text(`Hora del reporte: ${new Date().toLocaleTimeString('es-ES')}`, 120, yPosition)
  yPosition += 15
  
  // Estadísticas mejoradas
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 35, 'F')
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Resumen de Asistencia', 25, yPosition + 8)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Total de asistentes: ${attendees.length}`, 25, yPosition + 18)
  doc.text(`De ${stats.total} invitados`, 120, yPosition + 18)
  doc.text(`Tasa de asistencia: ${stats.rate}%`, 25, yPosition + 28)
  
  // Barra de progreso visual
  const barX = 120
  const barY = yPosition + 22
  const barWidth = 60
  const barHeight = 8
  const fillWidth = (barWidth * stats.rate) / 100
  
  doc.setFillColor(220, 220, 220)
  doc.rect(barX, barY, barWidth, barHeight, 'F')
  doc.setFillColor(...successColor)
  doc.rect(barX, barY, fillWidth, barHeight, 'F')
  
  yPosition += 50
  
  // Encabezados de tabla mejorados
  doc.setFillColor(...successColor)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 40, yPosition + 8)
  doc.text('Email', 95, yPosition + 8)
  doc.text('Teléfono', 135, yPosition + 8)
  doc.text('Hora Entrada', 165, yPosition + 8)
  
  yPosition += 15
  
  // Lista de asistentes con más información
  doc.setTextColor(...textColor)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  
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
      doc.text('Email', 95, yPosition + 8)
      doc.text('Teléfono', 135, yPosition + 8)
      doc.text('Hora Entrada', 165, yPosition + 8)
      
      yPosition += 15
      doc.setTextColor(...textColor)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
    }
    
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 249)
      doc.rect(20, yPosition - 3, 170, 10, 'F')
    }
    
    const entryTime = attendee.scanned_at ? 
      new Date(attendee.scanned_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 
      new Date(attendee.created_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(attendee.name, 22), 40, yPosition + 4)
    doc.text(truncateText(attendee.email, 18), 95, yPosition + 4)
    doc.text(truncateText(attendee.phone || '-', 12), 135, yPosition + 4)
    doc.text(entryTime, 170, yPosition + 4)
    
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
  const { guests, attendees, stats, hourlyStats, eventDate, eventLocation, eventDescription } = data
  const doc = new jsPDF()
  
  const primaryColor = [102, 126, 234]
  const secondaryColor = [118, 75, 162]
  const textColor = [33, 37, 41]
  
  let yPosition = 20
  
  // ===== PÁGINA 1: RESUMEN EJECUTIVO =====
  
  // Encabezado con información del evento
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont(undefined, 'bold')
  doc.text('Reporte Completo', 20, 25)
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 38)
  
  if (eventDate) {
    doc.setFontSize(12)
    doc.text(formatEventDate(eventDate), 20, 48)
  }
  
  if (eventLocation) {
    doc.setFontSize(12)
    doc.text(`📍 ${eventLocation}`, 20, 55)
  }
  
  yPosition = 80
  
  // Descripción del evento si existe
  if (eventDescription) {
    doc.setTextColor(...textColor)
    doc.setFontSize(12)
    doc.text(`Descripción: ${truncateText(eventDescription, 80)}`, 20, yPosition)
    yPosition += 15
  }
  
  // Información del reporte
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.text(`Reporte generado: ${new Date().toLocaleString('es-ES')}`, 20, yPosition)
  yPosition += 20
  
  // Estadísticas principales en cajas mejoradas
  const statBoxes = [
    { label: 'Total Invitados', value: stats.total, color: [52, 144, 220] },
    { label: 'QRs Enviados', value: stats.sent || stats.qrsSent, color: [255, 193, 7] },
    { label: 'Asistieron', value: stats.attended || stats.scanned, color: [40, 167, 69] },
    { label: 'Tasa Asistencia', value: `${stats.rate}%`, color: [111, 66, 193] }
  ]
  
  statBoxes.forEach((stat, index) => {
    const x = 20 + (index % 2) * 90
    const y = yPosition + Math.floor(index / 2) * 40
    
    // Sombra del cuadro
    doc.setFillColor(200, 200, 200)
    doc.rect(x + 2, y + 2, 85, 35, 'F')
    
    // Cuadro principal
    doc.setFillColor(...stat.color)
    doc.rect(x, y, 85, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont(undefined, 'bold')
    doc.text(stat.value.toString(), x + 42.5, y + 18, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(stat.label, x + 42.5, y + 28, { align: 'center' })
  })
  
  yPosition += 90
  
  // Gráfico de asistencia mejorado
  doc.setTextColor(...textColor)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Análisis de Asistencia', 20, yPosition)
  
  yPosition += 15
  
  const barWidth = 150
  const barHeight = 25
  const attendancePercentage = stats.rate / 100
  
  // Barra de fondo con borde
  doc.setFillColor(233, 236, 239)
  doc.rect(20, yPosition, barWidth, barHeight, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(20, yPosition, barWidth, barHeight)
  
  // Barra de progreso con gradiente simulado
  doc.setFillColor(...statBoxes[2].color)
  doc.rect(20, yPosition, barWidth * attendancePercentage, barHeight, 'F')
  
  // Texto del porcentaje
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  const textX = Math.max(35, 20 + (barWidth * attendancePercentage) - 25)
  doc.text(`${stats.rate}%`, textX, yPosition + 16)
  
  // Estadísticas adicionales
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`${stats.attended || stats.scanned} de ${stats.total} invitados confirmaron asistencia`, 20, yPosition + 35)
  
  yPosition += 50
  
  // Estadísticas por hora mejoradas
  if (hourlyStats && hourlyStats.length > 0) {
    doc.setTextColor(...textColor)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('Entradas por Hora', 20, yPosition)
    
    yPosition += 15
    
    const maxHourCount = Math.max(...hourlyStats.map(h => h.count))
    
    hourlyStats.forEach((hourStat, index) => {
      const barLength = (hourStat.count / maxHourCount) * 110
      const y = yPosition + index * 14
      
      // Verificar nueva página
      if (y > 270) {
        doc.addPage()
        yPosition = 20
        doc.setTextColor(...textColor)
        doc.setFontSize(16)
        doc.setFont(undefined, 'bold')
        doc.text('Entradas por Hora (continuación)', 20, yPosition)
        yPosition += 15
      }
      
      // Etiqueta de hora
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`${hourStat.hour}:00`, 20, y + 7)
      
      // Barra de fondo
      doc.setFillColor(240, 240, 240)
      doc.rect(50, y, 110, 10, 'F')
      
      // Barra de datos
      doc.setFillColor(...primaryColor)
      doc.rect(50, y, barLength, 10, 'F')
      
      // Cantidad y porcentaje
      doc.text(`${hourStat.count}`, 170, y + 7)
      doc.text(`(${hourStat.percentage.toFixed(1)}%)`, 185, y + 7)
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
  
  // Resumen rápido
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Total: ${guests.length} invitados | QRs enviados: ${stats.sent || stats.qrsSent} | Asistentes: ${stats.attended || stats.scanned}`, 20, yPosition)
  yPosition += 15
  
  // Encabezados de tabla
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(...textColor)
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 35, yPosition + 8)
  doc.text('Email', 75, yPosition + 8)
  doc.text('Teléfono', 115, yPosition + 8)
  doc.text('QR', 145, yPosition + 8)
  doc.text('Asistió', 160, yPosition + 8)
  doc.text('Estado', 175, yPosition + 8)
  
  yPosition += 15
  
  // Lista de invitados mejorada
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  
  guests.forEach((guest, index) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
      
      // Repetir encabezados
      doc.setFillColor(248, 249, 250)
      doc.rect(20, yPosition, 170, 12, 'F')
      
      doc.setTextColor(...textColor)
      doc.setFontSize(9)
      doc.setFont(undefined, 'bold')
      doc.text('N°', 25, yPosition + 8)
      doc.text('Nombre', 35, yPosition + 8)
      doc.text('Email', 75, yPosition + 8)
      doc.text('Teléfono', 115, yPosition + 8)
      doc.text('QR', 145, yPosition + 8)
      doc.text('Asistió', 160, yPosition + 8)
      doc.text('Estado', 175, yPosition + 8)
      
      yPosition += 15
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)
    }
    
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252)
      doc.rect(20, yPosition - 2, 170, 10, 'F')
    }
    
    // Datos del invitado
    doc.setTextColor(...textColor)
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(guest.name, 18), 35, yPosition + 4)
    doc.text(truncateText(guest.email, 18), 75, yPosition + 4)
    doc.text(truncateText(guest.phone || '-', 12), 115, yPosition + 4)
    
    // Estado QR con colores
    if (guest.sent) {
      doc.setTextColor(40, 167, 69)
      doc.text('✓', 148, yPosition + 4)
    } else {
      doc.setTextColor(220, 53, 69)
      doc.text('✗', 148, yPosition + 4)
    }
    
    // Estado asistencia
    if (guest.scanned) {
      doc.setTextColor(40, 167, 69)
      doc.text('✓', 163, yPosition + 4)
    } else {
      doc.setTextColor(220, 53, 69)
      doc.text('✗', 163, yPosition + 4)
    }
    
    // Estado general
    doc.setTextColor(...textColor)
    doc.setFontSize(7)
    let status = 'PENDIENTE'
    if (guest.scanned) status = 'ASISTIÓ'
    else if (guest.sent) status = 'QR ENVIADO'
    
    doc.text(status, 175, yPosition + 4)
    doc.setFontSize(8)
    
    yPosition += 10
  })
  
  // ===== PÁGINA 3: SOLO ASISTENTES (si hay) =====
  
  if (attendees && attendees.length > 0) {
    doc.addPage()
    yPosition = 20
    
    // Encabezado
    doc.setFillColor(40, 167, 69)
    doc.rect(0, 0, 210, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Detalle de Asistentes Confirmados', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`${attendees.length} personas asistieron al evento`, 20, 30)
    
    yPosition = 55
    
    // Encabezados
    doc.setFillColor(248, 249, 250)
    doc.rect(20, yPosition, 170, 12, 'F')
    
    doc.setTextColor(...textColor)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('N°', 25, yPosition + 8)
    doc.text('Nombre', 40, yPosition + 8)
    doc.text('Email', 85, yPosition + 8)
    doc.text('Teléfono', 125, yPosition + 8)
    doc.text('Hora Entrada', 160, yPosition + 8)
    
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
        doc.text('Email', 85, yPosition + 8)
        doc.text('Teléfono', 125, yPosition + 8)
        doc.text('Hora Entrada', 160, yPosition + 8)
        
        yPosition += 15
        doc.setFont(undefined, 'normal')
        doc.setFontSize(9)
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252)
        doc.rect(20, yPosition - 2, 170, 10, 'F')
      }
      
      const entryTime = attendee.scanned_at ? 
        new Date(attendee.scanned_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }) : 
        new Date(attendee.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      
      doc.setTextColor(...textColor)
      doc.text(`${index + 1}`, 25, yPosition + 4)
      doc.text(truncateText(attendee.name, 20), 40, yPosition + 4)
      doc.text(truncateText(attendee.email, 18), 85, yPosition + 4)
      doc.text(truncateText(attendee.phone || '-', 12), 125, yPosition + 4)
      doc.text(entryTime, 165, yPosition + 4)
      
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
  const { guests, eventDate, eventLocation, stats } = data
  const doc = new jsPDF()
  
  const primaryColor = [102, 126, 234]
  const textColor = [33, 37, 41]
  
  let yPosition = 20
  
  // Encabezado
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Lista de Invitados', 20, 25)
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text(eventName, 20, 35)
  
  if (eventDate) {
    doc.setFontSize(12)
    doc.text(formatEventDate(eventDate), 20, 45)
  }
  
  yPosition = 65
  
  // Información del evento
  if (eventLocation) {
    doc.setTextColor(...textColor)
    doc.setFontSize(12)
    doc.text(`📍 Ubicación: ${eventLocation}`, 20, yPosition)
    yPosition += 10
  }
  
  // Estadísticas rápidas
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.text(`Total de invitados: ${guests.length}`, 20, yPosition)
  doc.text(`QRs enviados: ${stats.sent || 0}`, 100, yPosition)
  doc.text(`Pendientes: ${stats.pending || 0}`, 160, yPosition)
  yPosition += 5
  
  doc.setFontSize(11)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, yPosition)
  
  yPosition += 20
  
  // Encabezados de tabla
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 12, 'F')
  
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('N°', 25, yPosition + 8)
  doc.text('Nombre', 40, yPosition + 8)
  doc.text('Email', 95, yPosition + 8)
  doc.text('Teléfono', 140, yPosition + 8)
  doc.text('Estado', 175, yPosition + 8)
  
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
      doc.text('Email', 95, yPosition + 8)
      doc.text('Teléfono', 140, yPosition + 8)
      doc.text('Estado', 175, yPosition + 8)
      
      yPosition += 15
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 249)
      doc.rect(20, yPosition - 3, 170, 12, 'F')
    }
    
    // Estado del invitado
    let status = 'PENDIENTE'
    let statusColor = textColor
    
    if (guest.scanned) {
      status = 'ASISTIÓ'
      statusColor = [40, 167, 69]
    } else if (guest.sent) {
      status = 'QR ENVIADO'
      statusColor = [255, 193, 7]
    }
    
    doc.setTextColor(...textColor)
    doc.text(`${index + 1}`, 25, yPosition + 4)
    doc.text(truncateText(guest.name, 25), 40, yPosition + 4)
    doc.text(truncateText(guest.email, 20), 95, yPosition + 4)
    doc.text(truncateText(guest.phone || '-', 15), 140, yPosition + 4)
    
    // Estado con color
    doc.setTextColor(...statusColor)
    doc.setFontSize(9)
    doc.text(status, 175, yPosition + 4)
    doc.setFontSize(10)
    
    yPosition += 12
  })
  
  // Pie de página
  addFooter(doc, 'Lista de Invitados', eventName)
  
  // Descargar
  const fileName = `Lista_Invitados_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Generar PDF de reporte comparativo de eventos
 * @param {Object} data - Datos de comparación
 */
const generateComparativeReportPDF = (data) => {
  const { eventsData } = data
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
  doc.text('Reporte Comparativo de Eventos', 20, 25)
  
  doc.setFontSize(12)
  doc.text(`${eventsData.length} eventos analizados`, 20, 35)
  
  yPosition = 60
  
  // Resumen general
  const totalStats = eventsData.reduce((acc, eventData) => ({
    events: acc.events + 1,
    totalGuests: acc.totalGuests + eventData.stats.total,
    totalAttended: acc.totalAttended + eventData.stats.scanned,
    totalSent: acc.totalSent + eventData.stats.sent
  }), { events: 0, totalGuests: 0, totalAttended: 0, totalSent: 0 })

  const avgAttendance = totalStats.totalGuests > 0 ? 
    Math.round((totalStats.totalAttended / totalStats.totalGuests) * 100) : 0

  // Estadísticas generales
  doc.setTextColor(...textColor)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Resumen General', 20, yPosition)
  yPosition += 15

  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 40, 'F')

  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Total de eventos: ${totalStats.events}`, 25, yPosition + 10)
  doc.text(`Total invitados: ${totalStats.totalGuests}`, 25, yPosition + 20)
  doc.text(`Total asistentes: ${totalStats.totalAttended}`, 25, yPosition + 30)
  doc.text(`Promedio de asistencia: ${avgAttendance}%`, 120, yPosition + 20)

  yPosition += 55

  // Tabla comparativa
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Comparación Detallada', 20, yPosition)
  yPosition += 15

  // Encabezados de tabla
  doc.setFillColor(248, 249, 250)
  doc.rect(20, yPosition, 170, 12, 'F')

  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Evento', 25, yPosition + 8)
  doc.text('Fecha', 70, yPosition + 8)
  doc.text('Invit.', 100, yPosition + 8)
  doc.text('QR Env.', 120, yPosition + 8)
  doc.text('Asist.', 145, yPosition + 8)
  doc.text('Tasa %', 165, yPosition + 8)

  yPosition += 15

  // Datos de eventos
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  eventsData.forEach((eventData, index) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20

      // Repetir encabezados
      doc.setFillColor(248, 249, 250)
      doc.rect(20, yPosition, 170, 12, 'F')

      doc.setTextColor(...textColor)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('Evento', 25, yPosition + 8)
      doc.text('Fecha', 70, yPosition + 8)
      doc.text('Invit.', 100, yPosition + 8)
      doc.text('QR Env.', 120, yPosition + 8)
      doc.text('Asist.', 145, yPosition + 8)
      doc.text('Tasa %', 165, yPosition + 8)

      yPosition += 15
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
    }

    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252)
      doc.rect(20, yPosition - 2, 170, 12, 'F')
    }

    doc.setTextColor(...textColor)
    doc.text(truncateText(eventData.event.name, 20), 25, yPosition + 6)
    doc.text(formatDate(eventData.event.date), 70, yPosition + 6)
    doc.text(eventData.stats.total.toString(), 105, yPosition + 6)
    doc.text(eventData.stats.sent.toString(), 125, yPosition + 6)
    doc.text(eventData.stats.scanned.toString(), 150, yPosition + 6)
    
    // Color para tasa de asistencia
    const rate = eventData.stats.rate
    if (rate >= 80) doc.setTextColor(40, 167, 69)
    else if (rate >= 60) doc.setTextColor(255, 193, 7)
    else doc.setTextColor(220, 53, 69)
    
    doc.text(`${rate}%`, 170, yPosition + 6)

    yPosition += 12
  })

  // Nueva página para detalles por evento
  eventsData.forEach((eventData, index) => {
    if (index === 0 || yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    // Título del evento
    doc.setTextColor(...primaryColor)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text(`${index + 1}. ${eventData.event.name}`, 20, yPosition)
    yPosition += 15

    // Información del evento
    doc.setTextColor(...textColor)
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')
    
    if (eventData.event.date) {
      doc.text(`📅 Fecha: ${formatEventDate(eventData.event.date)}`, 25, yPosition)
      yPosition += 10
    }
    
    if (eventData.event.location) {
      doc.text(`📍 Ubicación: ${eventData.event.location}`, 25, yPosition)
      yPosition += 10
    }
    
    if (eventData.event.description) {
      doc.text(`📝 Descripción: ${truncateText(eventData.event.description, 60)}`, 25, yPosition)
      yPosition += 10
    }

    // Estadísticas del evento
    yPosition += 5
    doc.setFillColor(248, 249, 250)
    doc.rect(25, yPosition, 160, 35, 'F')

    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Estadísticas', 30, yPosition + 10)

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Total invitados: ${eventData.stats.total}`, 30, yPosition + 20)
    doc.text(`QRs enviados: ${eventData.stats.sent}`, 30, yPosition + 28)
    doc.text(`Asistentes: ${eventData.stats.scanned}`, 110, yPosition + 20)
    doc.text(`Tasa: ${eventData.stats.rate}%`, 110, yPosition + 28)

    yPosition += 45

    // Gráfico de barra simple para el evento
    const eventBarWidth = 120
    const eventBarHeight = 15
    const eventFillWidth = (eventBarWidth * eventData.stats.rate) / 100

    doc.setFillColor(233, 236, 239)
    doc.rect(25, yPosition, eventBarWidth, eventBarHeight, 'F')

    // Color basado en rendimiento
    if (eventData.stats.rate >= 80) doc.setFillColor(40, 167, 69)
    else if (eventData.stats.rate >= 60) doc.setFillColor(255, 193, 7)
    else doc.setFillColor(220, 53, 69)

    doc.rect(25, yPosition, eventFillWidth, eventBarHeight, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text(`${eventData.stats.rate}%`, 30 + eventFillWidth - 15, yPosition + 10)

    yPosition += 25
  })

  // Pie de página
  addFooter(doc, 'Reporte Comparativo', 'Múltiples Eventos')

  // Descargar
  const fileName = `Reporte_Comparativo_Eventos_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Generar PDF con códigos QR individuales (manteniendo funcionalidad original)
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
 * Añadir pie de página a todas las páginas (mejorado)
 * @param {jsPDF} doc - Documento PDF
 * @param {string} title - Título del documento
 * @param {string} eventName - Nombre del evento
 */
const addFooter = (doc, title, eventName) => {
  const pageCount = doc.internal.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Línea separadora más elegante
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.5)
    doc.line(20, 283, 190, 283)
    
    // Texto del pie con mejor formato
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    
    const footerLeft = `${title} - ${eventName}`
    const footerCenter = `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    const footerRight = `Página ${i} de ${pageCount}`
    
    doc.text(footerLeft, 20, 288)
    doc.text(footerCenter, 105, 288, { align: 'center' })
    doc.text(footerRight, 190, 288, { align: 'right' })
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
 * Formatear fecha para mostrar en PDF
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

/**
 * Formatear fecha del evento para mostrar completa
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada completa
 */
const formatEventDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Generar PDF de estadísticas avanzadas (manteniendo funcionalidad original)
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
  
  const fileName = `Estadisticas_Avanzadas_${sanitizeFileName(eventName)}_${getCurrentDate()}.pdf`
  doc.save(fileName)
}

/**
 * Exportar datos como CSV (manteniendo funcionalidad original)
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
 * Configuraciones predefinidas de PDF (manteniendo funcionalidad original)
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