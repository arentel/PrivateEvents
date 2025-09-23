import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Endpoint para enviar emails
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, attachments } = req.body

    console.log('📧 Enviando email a:', to)

    const emailData = {
      from: process.env.VITE_FROM_EMAIL || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    }

    // Añadir attachments si existen
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments
    }

    // Llamar a Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error de Resend:', result)
      return res.status(response.status).json({
        error: result.message || 'Error sending email',
        details: result
      })
    }

    console.log('✅ Email enviado exitosamente:', result.id)
    res.json({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('❌ Error del servidor:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
})

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    time: new Date().toISOString(),
    resendConfigured: !!process.env.VITE_RESEND_API_KEY
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy corriendo en http://localhost:${PORT}`)
  console.log(`📧 Resend API Key: ${process.env.VITE_RESEND_API_KEY ? '✅ Configurada' : '❌ Faltante'}`)
  console.log(`📬 From Email: ${process.env.VITE_FROM_EMAIL || 'onboarding@resend.dev'}`)
})