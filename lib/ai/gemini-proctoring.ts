"use client"

class GeminiProctoring {
  async initialize(apiKey: string) {
    console.log("Mock Gemini API initialized locally (Hardcoded for testing)")
  }

  async analyzeFrame(imageData: string): Promise<{
    isValid: boolean
    violations: Array<{
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      confidence: number
    }>
    analysis: string
  }> {
    // Hardcoded to always return a clean frame
    return {
      isValid: true,
      violations: [],
      analysis: "Mock analysis: Environment clean"
    }
  }

  async verifyFace(imageData: string): Promise<{
    success: boolean
    faceCount: number
    message: string
    confidence: number
  }> {
    // Hardcoded to always verify a single face
    return {
      success: true,
      faceCount: 1,
      message: "Mock face verified successfully",
      confidence: 1.0
    }
  }

  async verifyEnvironment(imageData: string): Promise<{
    success: boolean
    issues: string[]
    message: string
    confidence: number
  }> {
    // Hardcoded to always pass environment validation
    return {
      success: true,
      issues: [],
      message: "Mock environment scan clean",
      confidence: 1.0
    }
  }
}

export const geminiProctoring = new GeminiProctoring()
