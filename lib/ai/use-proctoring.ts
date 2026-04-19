"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import { voiceWarning } from '@/lib/ai/voice-warning'
import { objectDetectionAI } from '@/lib/ai/object-detection'
import { faceDetectionAI } from '@/lib/ai/face-detection'

interface Violation {
  type: string
  severity: string
  description: string
  timestamp: string
  [key: string]: any
}

export function useProctoringMonitor(examId: string, isActive: boolean, onAutoSubmit?: () => void, geminiKey?: string) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onAutoSubmitRef = useRef(onAutoSubmit)

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit
  }, [onAutoSubmit])
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const [violations, setViolations] = useState<Violation[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [criticalViolationCount, setCriticalViolationCount] = useState(0)
  const monitoringInterval = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastViolationTime = useRef<number>(0)

  // Initialize Local AI Models
  useEffect(() => {
    if (!isActive) return
    const initAI = async () => {
      try {
        await tf.ready() // Force TFJS to initialize WebGL backend before trying to load models
        await Promise.all([
          objectDetectionAI.initialize(),
          faceDetectionAI.initialize()
        ])
        setAiLoaded(true)
        console.log('✅ Local TensorFlow AI Proctoring initialized')

        voiceWarning.enable()
        voiceWarning.info('AI proctoring system activated. Please remain in front of the camera.')
      } catch (e) {
        console.error("AI Initialization failed:", e)
      }
    }

    initAI()
  }, [isActive])

  // Add violation with voice warning
  const addViolation = useCallback((violation: Violation) => {
    setViolations(prev => {
      const newViolations = [...prev, violation]

      // Auto-terminate after 5 violations
      if (newViolations.length >= 5) {
        voiceWarning.critical('Too many violations detected. Your exam is being terminated and submitted automatically.')
        setTimeout(() => { if (onAutoSubmitRef.current) onAutoSubmitRef.current() }, 2000)
        return newViolations
      }

      return newViolations
    })

    // Voice warnings - reduced cooldown to 1 second
    const now = Date.now()
    if (now - lastViolationTime.current > 1000) {
      if (violation.severity === 'critical') {
        voiceWarning.critical(violation.description)
        setCriticalViolationCount(prev => {
          const newCount = prev + 1
          if (newCount >= 3) {
            voiceWarning.critical('Multiple critical violations detected. Exam will be submitted automatically.')
            setTimeout(() => { if (onAutoSubmitRef.current) onAutoSubmitRef.current() }, 3000)
          }
          return newCount
        })
      } else if (violation.severity === 'high' || violation.severity === 'medium') {
        voiceWarning.warning(violation.description)
      } else {
        voiceWarning.info(violation.description)
      }
      lastViolationTime.current = now
    }
  }, []) // No longer depends on onAutoSubmit because of ref

  // Start camera
  const startCamera = useCallback(async () => {
    if (videoRef.current?.srcObject) {
      return true // Already started
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      return true
    } catch (error) {
      console.error('Camera access denied:', error)
      return false
    }
  }, [])

  // Monitor with Local AI Models
  const monitorFrame = useCallback(async () => {
    if (!videoRef.current || !aiLoaded) return // Removed isMonitoring check to prevent stale closure bugs

    try {
      // 1. Detect objects (phones, laptops, multiple people)
      const objectResult = await objectDetectionAI.detectObjects(videoRef.current)
      if (objectResult && objectResult.violations && objectResult.violations.length > 0) {
        objectResult.violations.forEach((v: any) => {
          addViolation(v)
        })
      }

      // 2. Detect faces and head pose
      const faceResult = await faceDetectionAI.detectFaces(videoRef.current)
      if (faceResult) {
        if (faceResult.violation) {
          addViolation(faceResult.violation)
        } else if (faceResult.faceCount === 1) {
          // If only 1 face, check if looking away
          const positionViolation = await faceDetectionAI.analyzeFacePosition(
            faceResult.faces, 
            videoRef.current.videoWidth, 
            videoRef.current.videoHeight
          )
          if (positionViolation) {
            addViolation(positionViolation)
          }
        }
      }
    } catch (error) {
      console.error('Local AI Monitoring error:', error)
    }
  }, [aiLoaded, isMonitoring, addViolation])

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (!isActive || isMonitoring) return

    const cameraStarted = await startCamera()
    if (!cameraStarted) {
      console.error('Failed to start camera')
      return
    }

    setIsMonitoring(true)

    // Start monitoring after camera is ready
    setTimeout(() => {
      monitoringInterval.current = setInterval(monitorFrame, 3000)
    }, 1000)
  }, [isActive, isMonitoring, startCamera, monitorFrame])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current)
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }

    setIsMonitoring(false)
  }, [])

  // Tab switch detection with auto-submit
  useEffect(() => {
    if (!isActive) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1

          const violation: Violation = {
            type: 'TAB_SWITCH',
            severity: newCount >= 3 ? 'critical' : 'medium',
            description: `Tab switched during exam (${newCount} times)`,
            timestamp: new Date().toISOString()
          }

          addViolation(violation)

          if (newCount >= 3 && onAutoSubmit) {
            voiceWarning.critical('Too many tab switches. Exam will be submitted automatically in 5 seconds.')
            setTimeout(() => onAutoSubmit(), 5000)
          } else if (newCount === 2) {
            voiceWarning.warning('Second tab switch detected. One more will result in automatic submission.')
          } else {
            voiceWarning.warning('Do not switch tabs during the exam.')
          }

          return newCount
        })
      }
    }

    const handleWindowBlur = () => {
      addViolation({
        type: 'WINDOW_BLUR',
        severity: 'medium',
        description: 'Window lost focus',
        timestamp: new Date().toISOString()
      })
      voiceWarning.warning('Do not switch to other windows during the exam.')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [isActive, addViolation, onAutoSubmit])

  // Prevent right-click and copy-paste
  useEffect(() => {
    if (!isActive) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      addViolation({
        type: 'RIGHT_CLICK',
        severity: 'low',
        description: 'Right-click attempted',
        timestamp: new Date().toISOString()
      })
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      addViolation({
        type: 'COPY_PASTE',
        severity: 'high',
        description: 'Copy attempt detected',
        timestamp: new Date().toISOString()
      })
      voiceWarning.warning('Copy and paste is not allowed during the exam.')
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation({
          type: 'FULLSCREEN_EXIT',
          severity: 'critical',
          description: 'Exited fullscreen mode',
          timestamp: new Date().toISOString()
        })
        voiceWarning.critical('You must remain in fullscreen mode during the exam.')
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCopy)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCopy)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isActive, addViolation])

  // Cleanup
  useEffect(() => {
    return () => {
      stopMonitoring()
      // Don't disable voice on cleanup - keep it active
      // voiceWarning.disable()
    }
  }, [stopMonitoring])

  return {
    videoRef,
    canvasRef,
    violations,
    isMonitoring,
    aiLoaded,
    tabSwitchCount,
    criticalViolationCount,
    startMonitoring,
    stopMonitoring,
    clearViolations: () => setViolations([])
  }
}
