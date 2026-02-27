"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { geminiProctoring } from '@/lib/ai/gemini-proctoring'
import { voiceWarning } from '@/lib/ai/voice-warning'

interface Violation {
  type: string
  severity: string
  description: string
  timestamp: string
  [key: string]: any
}

export function useProctoringMonitor(examId: string, isActive: boolean, onAutoSubmit?: () => void, geminiKey?: string) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const [violations, setViolations] = useState<Violation[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [criticalViolationCount, setCriticalViolationCount] = useState(0)
  const monitoringInterval = useRef<NodeJS.Timeout>()
  const lastViolationTime = useRef<number>(0)

  // Initialize Gemini AI
  useEffect(() => {
    const initAI = async () => {
      const key = geminiKey || 'AIzaSyDfqEU4Bu-RlobqbZCEeV128BnlqPwogL4'
      await geminiProctoring.initialize(key)
      setAiLoaded(true)
      console.log('✅ Gemini AI Proctoring initialized')
      voiceWarning.info('AI proctoring system activated. Please remain in front of the camera.')
    }
    
    initAI()
  }, [geminiKey])

  // Add violation with voice warning
  const addViolation = useCallback((violation: Violation) => {
    setViolations(prev => [...prev, violation])
    
    // Voice warnings
    const now = Date.now()
    if (now - lastViolationTime.current > 3000) {
      if (violation.severity === 'critical') {
        voiceWarning.critical(violation.description)
        setCriticalViolationCount(prev => {
          const newCount = prev + 1
          if (newCount >= 3 && onAutoSubmit) {
            voiceWarning.critical('Multiple critical violations detected. Exam will be submitted automatically.')
            setTimeout(() => onAutoSubmit(), 3000)
          }
          return newCount
        })
      } else if (violation.severity === 'high' || violation.severity === 'medium') {
        voiceWarning.warning(violation.description)
      }
      lastViolationTime.current = now
    }
  }, [onAutoSubmit])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Video play error:', err)
          })
        }
      }
      
      return true
    } catch (error) {
      console.error('Camera access denied:', error)
      return false
    }
  }, [])

  // Monitor with Gemini AI - FULLY AUTONOMOUS
  const monitorFrame = useCallback(async () => {
    if (!videoRef.current || !aiLoaded || !isMonitoring) return

    try {
      // Capture frame
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)
      
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.6)
      
      // Gemini AI autonomous analysis
      const result = await geminiProctoring.analyzeFrame(imageData)
      
      if (!result.isValid && result.violations.length > 0) {
        result.violations.forEach(v => {
          addViolation({
            type: v.type,
            severity: v.severity,
            description: v.description,
            timestamp: new Date().toISOString(),
            confidence: v.confidence
          })
        })
      }
    } catch (error) {
      console.error('Gemini AI Monitoring error:', error)
    }
  }, [aiLoaded, isMonitoring, addViolation])

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (!isActive || isMonitoring) return

    const cameraStarted = await startCamera()
    if (!cameraStarted) return

    setIsMonitoring(true)
    monitoringInterval.current = setInterval(monitorFrame, 2000)
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

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCopy)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCopy)
    }
  }, [isActive, addViolation])

  // Cleanup
  useEffect(() => {
    return () => {
      stopMonitoring()
      voiceWarning.disable()
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
