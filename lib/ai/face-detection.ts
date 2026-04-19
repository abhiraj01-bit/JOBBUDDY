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

    const rightEye = face.landmarks[0]
    const leftEye = face.landmarks[1]
    const nose = face.landmarks[2]

    // Distance between eyes and nose (X axis) to calculate Yaw (Left/Right look)
    const rightEyeToNoseX = Math.abs(nose[0] - rightEye[0]) || 1
    const leftEyeToNoseX = Math.abs(leftEye[0] - nose[0]) || 1
    const yawRatio = rightEyeToNoseX / leftEyeToNoseX

    // If ratio is < 0.3 or > 3.0, the head is turned significantly sideways
    const isHeadTurned = yawRatio < 0.4 || yawRatio > 2.5

    // Check if face is entirely off-center
    const isOffCenter = Math.abs(normalizedX - 0.5) > 0.35 || Math.abs(normalizedY - 0.5) > 0.35

    if (isHeadTurned || isOffCenter) {
      return {
        type: 'LOOKING_AWAY',
        severity: 'medium',
        description: isHeadTurned ? 'Candidate is looking away from the screen' : 'Candidate moved out of camera focus',
        timestamp: new Date().toISOString(),
        position: { x: normalizedX, y: normalizedY }
      }
    }

    return null
  }
}

export const faceDetectionAI = new FaceDetectionAI()
