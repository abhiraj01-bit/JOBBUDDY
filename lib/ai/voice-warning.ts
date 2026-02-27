export class VoiceWarningService {
  private synth: SpeechSynthesis | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
    }
  }

  speak(text: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    if (!this.synth || !this.enabled) return

    // Cancel previous speech for high priority
    if (priority === 'high') {
      this.synth.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Set voice urgency
    if (priority === 'high') {
      utterance.rate = 1.2
      utterance.pitch = 1.1
    }

    this.synth.speak(utterance)
  }

  warning(message: string) {
    this.speak(`Warning: ${message}`, 'high')
  }

  critical(message: string) {
    this.speak(`Critical violation: ${message}`, 'high')
  }

  info(message: string) {
    this.speak(message, 'low')
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
