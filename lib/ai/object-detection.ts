import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'

export class ObjectDetectionAI {
  private model: cocoSsd.ObjectDetection | null = null
  private isLoading = false

  private unauthorizedObjects = [
    'cell phone', 'book', 'laptop', 'keyboard', 
    'mouse', 'remote', 'tv', 'monitor'
  ]

  async initialize() {
    if (this.model || this.isLoading) return
    
    this.isLoading = true
    try {
      this.model = await cocoSsd.load()
      console.log('✅ Object detection AI loaded')
    } catch (error) {
      console.error('❌ Failed to load object detection:', error)
    } finally {
      this.isLoading = false
    }
  }

  async detectObjects(videoElement: HTMLVideoElement) {
    if (!this.model) {
      await this.initialize()
      if (!this.model) return null
    }

    try {
      const predictions = await this.model.detect(videoElement)
      
      const unauthorizedDetected = predictions.filter(pred => 
        this.unauthorizedObjects.includes(pred.class.toLowerCase()) && 
        pred.score > 0.6
      )

      const peopleCount = predictions.filter(pred => 
        pred.class.toLowerCase() === 'person'
      ).length

      return {
        allObjects: predictions,
        unauthorizedObjects: unauthorizedDetected,
        peopleCount,
        violations: this.analyzeViolations(unauthorizedDetected, peopleCount)
      }
    } catch (error) {
      console.error('Object detection error:', error)
      return null
    }
  }

  private analyzeViolations(unauthorized: any[], peopleCount: number) {
    const violations = []

    if (unauthorized.length > 0) {
      violations.push({
        type: 'UNAUTHORIZED_OBJECT',
        severity: 'high',
        description: `Detected: ${unauthorized.map(o => o.class).join(', ')}`,
        timestamp: new Date().toISOString(),
        objects: unauthorized.map(o => ({
          name: o.class,
          confidence: o.score
        }))
      })
    }

    if (peopleCount > 1) {
      violations.push({
        type: 'MULTIPLE_PEOPLE',
        severity: 'critical',
        description: `${peopleCount} people detected in frame`,
        timestamp: new Date().toISOString(),
        count: peopleCount
      })
    }

    return violations
  }
}

export const objectDetectionAI = new ObjectDetectionAI()
