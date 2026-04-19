import { useEffect, useRef, useState } from 'react'
import { detectAndExtractFace, compareFaceEmbeddings, captureFrameFromVideo, loadFaceModels } from './face-verification'
import { voiceWarning } from './voice-warning'

interface FaceViolation {
  type: 'FACE_ABSENT' | 'MULTIPLE_FACES' | 'FACE_MISMATCH' | 'CAMERA_DISABLED'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: string
  similarity?: number
}

export function useFaceVerification(attemptId: string, onAutoSubmit: () => void, externalVideoRef?: React.RefObject<HTMLVideoElement | null>) {
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalVideoRef || internalVideoRef
  const onAutoSubmitRef = useRef(onAutoSubmit)
  const attemptIdRef = useRef(attemptId)

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit
  }, [onAutoSubmit])

  useEffect(() => {
    attemptIdRef.current = attemptId
  }, [attemptId])
  const [violations, setViolations] = useState<FaceViolation[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [referenceEmbedding, setReferenceEmbedding] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVerifyingRef = useRef(false)
  const violationCountRef = useRef(0)
  const mismatchCountRef = useRef(0)

  const MAX_VIOLATIONS = 10
  const MAX_MISMATCHES = 3
  const VERIFICATION_INTERVAL = 10 // seconds
  const SIMILARITY_THRESHOLD = 0.6

  // Load models on mount
  useEffect(() => {
    loadFaceModels()
  }, [])

  // Fetch reference embedding from database
  useEffect(() => {
    if (!attemptId) return

    const fetchReference = async () => {
      try {
        const res = await fetch(`/api/exam/face/reference?attemptId=${attemptId}`)
        const data = await res.json()
        if (data.embedding) {
          setReferenceEmbedding(data.embedding)
        }
      } catch (error) {
        console.error('Failed to fetch reference embedding:', error)
      }
    }

    fetchReference()
  }, [attemptId])

  const logViolation = async (violation: FaceViolation) => {
    setViolations(prev => [...prev, violation])
    violationCountRef.current++

    if (violation.type === 'FACE_MISMATCH') {
      mismatchCountRef.current++
    }

    // Save to database
    try {
      const currentId = attemptIdRef.current
      if (currentId) {
        await fetch('/api/exam/face/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId: currentId, ...violation })
        })
      }
    } catch (error) {
      console.error('Failed to log violation:', error)
    }

    // Voice warning
    const messages: Record<string, string> = {
      FACE_ABSENT: 'Please remain visible to the camera.',
      MULTIPLE_FACES: 'Multiple faces detected. Only you should be visible.',
      FACE_MISMATCH: 'Identity verification failed. Please look at the camera.',
      CAMERA_DISABLED: 'Camera disabled. Please enable your camera.'
    }

    if (violation.severity === 'critical') {
      voiceWarning.critical(messages[violation.type])
    } else {
      voiceWarning.warning(messages[violation.type])
    }

    // Auto-submit check
    if (violationCountRef.current >= MAX_VIOLATIONS || mismatchCountRef.current >= MAX_MISMATCHES) {
      voiceWarning.critical('Too many identity violations. Exam will be submitted automatically.')
      setTimeout(() => {
        if (onAutoSubmitRef.current) onAutoSubmitRef.current()
      }, 3000)
    }
  }

  const verifyFace = async () => {
    if (!videoRef.current || !isVerifyingRef.current || referenceEmbedding.length === 0) return

    try {
      const stream = videoRef.current.srcObject as MediaStream
      if (!stream || !stream.active) {
        await logViolation({
          type: 'CAMERA_DISABLED',
          severity: 'critical',
          description: 'Camera stream is not active',
          timestamp: new Date().toISOString()
        })
        return
      }

      const imageDataUrl = await captureFrameFromVideo(videoRef.current)
      const img = new Image()
      img.src = imageDataUrl
      await new Promise(resolve => { img.onload = resolve })

      const result = await detectAndExtractFace(img)

      if (!result.success) {
        if (result.faceCount === 0) {
          await logViolation({
            type: 'FACE_ABSENT',
            severity: 'high',
            description: 'No face detected',
            timestamp: new Date().toISOString()
          })
        } else if (result.faceCount > 1) {
          await logViolation({
            type: 'MULTIPLE_FACES',
            severity: 'critical',
            description: `${result.faceCount} faces detected`,
            timestamp: new Date().toISOString()
          })
        }
        return
      }

      if (result.embedding) {
        const similarity = compareFaceEmbeddings(referenceEmbedding, result.embedding)

        if (similarity < SIMILARITY_THRESHOLD) {
          await logViolation({
            type: 'FACE_MISMATCH',
            severity: 'critical',
            description: `Face similarity: ${(similarity * 100).toFixed(1)}%`,
            timestamp: new Date().toISOString(),
            similarity
          })
        }

        // Save snapshot occasionally
        if (Math.random() < 0.2) {
          const currentId = attemptIdRef.current
          if (currentId) {
            await fetch('/api/exam/face/snapshot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                attemptId: currentId,
                imageDataUrl,
                embedding: result.embedding,
                similarity,
                matchStatus: similarity >= SIMILARITY_THRESHOLD ? 'match' : 'mismatch'
              })
            })
          }
        }
      }
    } catch (error) {
      console.error('Face verification error:', error)
    }
  }

  const startVerification = () => {
    if (isVerifying || !attemptId || referenceEmbedding.length === 0) return
    
    setIsVerifying(true)
    isVerifyingRef.current = true
    intervalRef.current = setInterval(verifyFace, VERIFICATION_INTERVAL * 1000)
  }

  const stopVerification = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsVerifying(false)
    isVerifyingRef.current = false
  }

  useEffect(() => {
    return () => stopVerification()
  }, [])

  return {
    videoRef,
    violations,
    isVerifying,
    startVerification,
    stopVerification
  }
}
