// api/send-email.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, subject, html, text, attachments } = req.body
    
    // Verificar que tenemos la API key
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' })
    }

    const emailData = {
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
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
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', result)
      return res.status(response.status).json({ 
        error: result.message || 'Error sending email',
        details: result
      })
    }

    console.log('Email sent successfully:', result.id)
    res.status(200).json({ 
      success: true, 
      messageId: result.id,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}