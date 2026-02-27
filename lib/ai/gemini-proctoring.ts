"use client"

import { GoogleGenerativeAI } from "@google/generative-ai"

class GeminiProctoring {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  async initialize(apiKey: string) {
    if (!apiKey) throw new Error("Gemini API key required")
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })
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
    if (!this.model) throw new Error("Gemini not initialized")

    const prompt = `You are an AI exam proctor. Analyze this image and detect:
1. Number of faces (should be exactly 1)
2. Face position (should be centered and looking at screen)
3. Unauthorized objects (phones, books, laptops, other people)
4. Suspicious behavior (looking away, multiple people, cheating materials)

Respond ONLY with valid JSON in this exact format:
{
  "isValid": boolean,
  "violations": [
    {
      "type": "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "UNAUTHORIZED_OBJECT" | "MULTIPLE_PEOPLE",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "clear description",
      "confidence": 0.0-1.0
    }
  ],
  "analysis": "brief summary"
}`

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1]
          }
        }
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Invalid response format")
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error("Gemini analysis error:", error)
      return {
        isValid: true,
        violations: [],
        analysis: "Analysis failed"
      }
    }
  }

  async verifyFace(imageData: string): Promise<{
    success: boolean
    faceCount: number
    message: string
    confidence: number
  }> {
    if (!this.model) throw new Error("Gemini not initialized")

    const prompt = `Analyze this image for face verification:
- Count exact number of faces
- Verify face is centered and clearly visible
- Check lighting and image quality

Respond ONLY with valid JSON:
{
  "success": boolean,
  "faceCount": number,
  "message": "clear message",
  "confidence": 0.0-1.0
}`

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1]
          }
        }
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Invalid response")
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error("Face verification error:", error)
      return {
        success: false,
        faceCount: 0,
        message: "Verification failed",
        confidence: 0
      }
    }
  }

  async verifyEnvironment(imageData: string): Promise<{
    success: boolean
    issues: string[]
    message: string
    confidence: number
  }> {
    if (!this.model) throw new Error("Gemini not initialized")

    const prompt = `Analyze this exam environment:
- Detect unauthorized objects (phones, books, laptops, notes, other screens)
- Count people (should be exactly 1)
- Check for suspicious items or behavior

Respond ONLY with valid JSON:
{
  "success": boolean,
  "issues": ["list of issues found"],
  "message": "clear message",
  "confidence": 0.0-1.0
}`

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1]
          }
        }
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Invalid response")
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error("Environment verification error:", error)
      return {
        success: false,
        issues: ["Verification failed"],
        message: "Scan failed",
        confidence: 0
      }
    }
  }
}

export const geminiProctoring = new GeminiProctoring()
