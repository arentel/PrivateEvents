// services/audio.js

class AudioFeedbackService {
  constructor() {
    this.audioContext = null
    this.isEnabled = true
    this.volume = 0.3
    
    // Inicializar contexto de audio de forma lazy
    this.initAudioContext()
  }

  // Inicializar Web Audio API
  initAudioContext() {
    try {
      // Crear contexto de audio solo cuando sea necesario
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
    } catch (error) {
      console.warn('Web Audio API no disponible:', error)
      this.isEnabled = false
    }
  }

  // Reanudar contexto de audio (necesario después de interacción del usuario)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('No se pudo reanudar el contexto de audio:', error)
      }
    }
  }

  // Generar tono sinusoidal
  generateTone(frequency, duration, volume = this.volume) {
    if (!this.isEnabled || !this.audioContext) return

    try {
      this.resumeAudioContext()

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      // Configurar oscilador
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

      // Configurar volumen con fade in/out suave
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

      // Conectar nodos
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Reproducir
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)

    } catch (error) {
      console.warn('Error generando tono:', error)
    }
  }

  // Sonido de éxito (dos tonos ascendentes)
  playSuccess() {
    if (!this.isEnabled) return
    
    setTimeout(() => this.generateTone(800, 0.15), 0)
    setTimeout(() => this.generateTone(1000, 0.2), 100)
  }

  // Sonido de advertencia (tono medio con vibración)
  playWarning() {
    if (!this.isEnabled) return
    
    // Tono con modulación para crear efecto de advertencia
    this.generateWarningTone(600, 0.4)
  }

  // Generar tono de advertencia con modulación
  generateWarningTone(frequency, duration) {
    if (!this.audioContext) return

    try {
      this.resumeAudioContext()

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const modulatorOsc = this.audioContext.createOscillator()
      const modulatorGain = this.audioContext.createGain()

      // Oscilador principal
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

      // Modulador para crear vibración
      modulatorOsc.type = 'sine'
      modulatorOsc.frequency.setValueAtTime(8, this.audioContext.currentTime) // 8 Hz vibración
      modulatorGain.gain.setValueAtTime(50, this.audioContext.currentTime)

      // Conectar modulación
      modulatorOsc.connect(modulatorGain)
      modulatorGain.connect(oscillator.frequency)

      // Configurar envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

      // Conectar cadena de audio
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Reproducir
      oscillator.start(this.audioContext.currentTime)
      modulatorOsc.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
      modulatorOsc.stop(this.audioContext.currentTime + duration)

    } catch (error) {
      console.warn('Error generando tono de advertencia:', error)
    }
  }

  // Sonido de error (dos tonos descendentes)
  playError() {
    if (!this.isEnabled) return
    
    setTimeout(() => this.generateTone(400, 0.2), 0)
    setTimeout(() => this.generateTone(300, 0.3), 150)
  }

  // Sonido de escaneo (tono corto neutral)
  playScan() {
    if (!this.isEnabled) return
    
    this.generateTone(1200, 0.1, this.volume * 0.5)
  }

  // Habilitar/deshabilitar sonidos
  setEnabled(enabled) {
    this.isEnabled = enabled
    localStorage.setItem('audioFeedbackEnabled', enabled.toString())
  }

  // Configurar volumen
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('audioFeedbackVolume', this.volume.toString())
  }

  // Cargar configuración guardada
  loadSettings() {
    const enabled = localStorage.getItem('audioFeedbackEnabled')
    const volume = localStorage.getItem('audioFeedbackVolume')
    
    if (enabled !== null) {
      this.isEnabled = enabled === 'true'
    }
    
    if (volume !== null) {
      this.volume = parseFloat(volume)
    }
  }

  // Reproducir sonido según tipo de resultado
  playFeedback(type) {
    switch (type) {
      case 'success':
        this.playSuccess()
        break
      case 'warning':
        this.playWarning()
        break
      case 'error':
        this.playError()
        break
      case 'scan':
        this.playScan()
        break
      default:
        console.warn('Tipo de feedback desconocido:', type)
    }
  }

  // Método para probar sonidos
  testSound(type = 'success') {
    this.playFeedback(type)
  }
}

// Crear instancia global
const audioFeedback = new AudioFeedbackService()

// Cargar configuración al inicializar
audioFeedback.loadSettings()

// Exportar instancia
export { audioFeedback }