"use client"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, CheckCircle2, XCircle, Loader2, Shield, AlertTriangle } from "lucide-react"
import { geminiProctoring } from "@/lib/ai/gemini-proctoring"

const STEPS = [
  { id: 1, name: "Camera Test", icon: Camera },
  { id: 2, name: "Face Verification", icon: Shield },
  { id: 3, name: "Environment Scan", icon: AlertTriangle },
  { id: 4, name: "Ready to Start", icon: CheckCircle2 }
]

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [environmentClear, setEnvironmentClear] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiReady, setAiReady] = useState(false)
  const [geminiKey, setGeminiKey] = useState("")

  // Initialize Gemini AI
  useEffect(() => {
    const initAI = async () => {
      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyD6wRuqb539fRttpPI898or8v0IGkf9koQ'
      setGeminiKey(key)
      setLoading(true)
      try {
        await geminiProctoring.initialize(key)
        setAiReady(true)
      } catch (err) {
        setError("Failed to initialize Gemini AI")
      } finally {
        setLoading(false)
      }
    }
    initAI()
  }, [])

  // Step 1: Start Camera
  const startCamera = async () => {
    try {
      setLoading(true)
      setError("")

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        setCurrentStep(2)
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera access to continue.")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Face with Gemini AI
  const verifyFace = async () => {
    if (!videoRef.current || !aiReady || !canvasRef.current) return

    setLoading(true)
    setError("")

    try {
      // Capture frame
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8)

      // Gemini AI analysis
      const result = await geminiProctoring.verifyFace(imageData)

      if (!result.success) {
        setError(result.message)
        return
      }

      if (result.faceCount === 0) {
        setError("No face detected. Please position yourself in front of the camera.")
        return
      }

      if (result.faceCount > 1) {
        setError(`${result.faceCount} faces detected. Please ensure you are alone.`)
        return
      }

      setFaceDetected(true)
      setCurrentStep(3)
    } catch (err) {
      setError("Face verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Scan Environment with Gemini AI
  const scanEnvironment = async () => {
    if (!videoRef.current || !aiReady || !canvasRef.current) return

    setLoading(true)
    setError("")

    try {
      // Capture frame
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8)

      // Gemini AI analysis
      const result = await geminiProctoring.verifyEnvironment(imageData)

      if (!result.success) {
        setError(`${result.message}: ${result.issues.join(", ")}`)
        return
      }

      if (result.issues.length > 0) {
        setError(`Issues detected: ${result.issues.join(", ")}. Please resolve them.`)
        return
      }

      setEnvironmentClear(true)
      setCurrentStep(4)
    } catch (err) {
      setError("Environment scan failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Start Exam
  const startExam = () => {
    // Stop camera
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }

    // Navigate to exam
    router.push(`/candidate/exam/${id}`)
  }

  const getStepAction = () => {
    switch (currentStep) {
      case 1:
        return (
          <Button onClick={startCamera} disabled={loading || cameraActive} size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {cameraActive ? "Camera Active" : "Start Camera"}
          </Button>
        )
      case 2:
        return (
          <Button onClick={verifyFace} disabled={loading || !cameraActive} size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Verify Face
          </Button>
        )
      case 3:
        return (
          <Button onClick={scanEnvironment} disabled={loading} size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            Scan Environment
          </Button>
        )
      case 4:
        return (
          <Button onClick={startExam} size="lg" className="bg-success hover:bg-success/90">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Start Exam
          </Button>
        )
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Pre-Exam Verification</h1>
          <p className="text-sm text-muted-foreground">Complete all verification steps to start your exam</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep > step.id ? "bg-success border-success text-white" :
                  currentStep === step.id ? "bg-primary border-primary text-white" :
                    "bg-secondary border-border text-muted-foreground"
                  }`}>
                  {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? "bg-success" : "bg-border"
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map(step => (
              <div key={step.id} className="flex-1 text-center">{step.name}</div>
            ))}
          </div>
        </div>

        {/* AI Loading */}
        {!aiReady && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-foreground">Loading AI models...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Video Feed */}
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="relative aspect-video bg-secondary">
            <video
              ref={videoRef}
              className="w-full h-full object-cover mirror"
              playsInline
              muted
            />
            <style jsx>{`
              .mirror {
                transform: scaleX(-1);
              }
            `}</style>
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            {cameraActive && (
              <div className="absolute top-4 right-4 flex gap-2">
                {faceDetected && (
                  <div className="px-3 py-1 rounded-full bg-success/90 text-white text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Face Verified
                  </div>
                )}
                {environmentClear && (
                  <div className="px-3 py-1 rounded-full bg-success/90 text-white text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Environment Clear
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for face capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Button */}
        <div className="text-center">
          {getStepAction()}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Instructions:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure you are in a well-lit room</li>
            <li>• Position yourself clearly in front of the camera</li>
            <li>• Remove any unauthorized materials from your desk</li>
            <li>• Ensure you are alone in the room</li>
            <li>• Do not switch tabs or windows during the exam</li>
          </ul>
        </div>
      </div>
    </>
  )
}
