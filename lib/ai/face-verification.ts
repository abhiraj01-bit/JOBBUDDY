// Face verification utility using face-api.js
// This handles face detection, embedding generation, and comparison

import * as faceapi from '@vladmandic/face-api'

let modelsLoaded = false

export async function loadFaceModels() {
  if (modelsLoaded) return true
  
  try {
    const MODEL_URL = '/models' // Models should be in public/models folder
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    
    modelsLoaded = true
    return true
  } catch (error) {
    console.error('Failed to load face detection models:', error)
    return false
  }
}

export interface FaceVerificationResult {
  success: boolean
  faceCount: number
  embedding?: number[]
  error?: string
  confidence?: number
}

export async function detectAndExtractFace(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceVerificationResult> {
  try {
    if (!modelsLoaded) {
      await loadFaceModels()
    }

    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()

    if (detections.length === 0) {
      return {
        success: false,
        faceCount: 0,
        error: 'No face detected. Please ensure your face is clearly visible.'
      }
    }

    if (detections.length > 1) {
      return {
        success: false,
        faceCount: detections.length,
        error: 'Multiple faces detected. Only one person should be visible.'
      }
    }

    const descriptor = detections[0].descriptor
    
    return {
      success: true,
      faceCount: 1,
      embedding: Array.from(descriptor),
      confidence: detections[0].detection.score
    }
  } catch (error) {
    console.error('Face detection error:', error)
    return {
      success: false,
      faceCount: 0,
      error: 'Face detection failed. Please try again.'
    }
  }
}

export function compareFaceEmbeddings(
  embedding1: number[],
  embedding2: number[]
): number {
  // Calculate Euclidean distance
  const distance = faceapi.euclideanDistance(embedding1, embedding2)
  
  // Convert distance to similarity score (0-1, higher is more similar)
  // Typical threshold: 0.6 (distance < 0.6 means same person)
  const similarity = Math.max(0, 1 - distance)
  
  return similarity
}

export function isSamePerson(similarity: number, threshold: number = 0.6): boolean {
  return similarity >= threshold
}

export async function captureFrameFromVideo(
  videoElement: HTMLVideoElement
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  ctx.drawImage(videoElement, 0, 0)
  
  return canvas.toDataURL('image/jpeg', 0.8)
}

export async function uploadFaceImage(
  imageDataUrl: string,
  attemptId: string
): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(imageDataUrl)
  const blob = await response.blob()
  
  // Create form data
  const formData = new FormData()
  formData.append('file', blob, `face-${attemptId}-${Date.now()}.jpg`)
  formData.append('attemptId', attemptId)
  
  // Upload to server
  const uploadResponse = await fetch('/api/upload/face', {
    method: 'POST',
    body: formData
  })
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload face image')
  }
  
  const data = await uploadResponse.json()
  return data.url
}
