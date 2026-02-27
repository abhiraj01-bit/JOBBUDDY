import * as blazeface from '@tensorflow-models/blazeface'
import '@tensorflow/tfjs'

export class FaceDetectionAI {
  private model: blazeface.BlazeFaceModel | null = null
  private isLoading = false

  async initialize() {
    if (this.model || this.isLoading) return
    
    this.isLoading = true
    try {
      this.model = await blazeface.load()
      console.log('✅ Face detection AI loaded')
    } catch (error) {
      console.error('❌ Failed to load face detection:', error)
    } finally {
      this.isLoading = false
    }
  }

  async detectFaces(videoElement: HTMLVideoElement) {
    if (!this.model) {
      await this.initialize()
      if (!this.model) return null
    }

    try {
      const predictions = await this.model.estimateFaces(videoElement, false)
      
      return {
        faceCount: predictions.length,
        faces: predictions.map(pred => ({
          topLeft: pred.topLeft,
          bottomRight: pred.bottomRight,
          probability: pred.probability,
          landmarks: pred.landmarks
        })),
        violation: this.analyzeViolation(predictions)
      }
    } catch (error) {
      console.error('Face detection error:', error)
      return null
    }
  }

  private analyzeViolation(predictions: any[]) {
    if (predictions.length === 0) {
      return {
        type: 'NO_FACE',
        severity: 'medium',
        description: 'No face detected in frame',
        timestamp: new Date().toISOString()
      }
    }

    if (predictions.length > 1) {
      return {
        type: 'MULTIPLE_FACES',
        severity: 'critical',
        description: `${predictions.length} faces detected`,
        timestamp: new Date().toISOString()
      }
    }

    return null
  }

  async analyzeFacePosition(predictions: any[], canvasWidth: number, canvasHeight: number) {
    if (predictions.length !== 1) return null

    const face = predictions[0]
    const [x1, y1] = face.topLeft
    const [x2, y2] = face.bottomRight
    
    const centerX = (x1 + x2) / 2
    const centerY = (y1 + y2) / 2
    
    const normalizedX = centerX / canvasWidth
    const normalizedY = centerY / canvasHeight

    // Check if face is too far from center
    const isLookingAway = Math.abs(normalizedX - 0.5) > 0.3 || Math.abs(normalizedY - 0.5) > 0.3

    if (isLookingAway) {
      return {
        type: 'LOOKING_AWAY',
        severity: 'low',
        description: 'Candidate looking away from screen',
        timestamp: new Date().toISOString(),
        position: { x: normalizedX, y: normalizedY }
      }
    }

    return null
  }
}

export const faceDetectionAI = new FaceDetectionAI()
