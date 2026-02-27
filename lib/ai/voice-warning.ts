export class VoiceWarningService {
  private synth: SpeechSynthesis | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      console.log('🔊 Voice Warning System Ready')
    }
  }

  speak(text: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    console.log('🔊 ATTEMPTING TO SPEAK:', text)
    
    if (!this.synth) {
      console.error('❌ Speech synthesis not available')
      return
    }

    if (!this.enabled) {
      console.log('🔇 Voice disabled')
      return
    }

    try {
      // Cancel all previous speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = 'en-US'
      
      utterance.onstart = () => {
        console.log('✅ Speech started:', text)
      }
      
      utterance.onend = () => {
        console.log('✅ Speech ended')
      }
      
      utterance.onerror = (e) => {
        console.error('❌ Speech error:', e)
      }

      this.synth.speak(utterance)
      console.log('✅ Speech queued')
    } catch (error) {
      console.error('❌ Speech exception:', error)
    }
  }

  warning(message: string) {
    this.speak(`Warning. ${message}`, 'high')
  }

  critical(message: string) {
    this.speak(`Critical violation. ${message}`, 'high')
  }

  info(message: string) {
    this.speak(message, 'low')
  }

  test() {
    this.speak('Voice warning test. If you can hear this, voice warnings are working.', 'high')
  }

  disable() {
    this.enabled = false
    this.synth?.cancel()
  }

  enable() {
    this.enabled = true
  }
}

export const voiceWarning = new VoiceWarningService()
