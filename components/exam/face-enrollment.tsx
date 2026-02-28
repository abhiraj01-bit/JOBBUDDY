"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { detectAndExtractFace, loadFaceModels, captureFrameFromVideo } from "@/lib/ai/face-verification"

interface FaceEnrollmentProps {
  examId: string
  candidateId: string
  onSuccess: () => void
  onCancel: () => void
}

export function FaceEnrollment({ examId, candidateId, onSuccess, onCancel }: FaceEnrollmentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'capturing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    loadFaceModels()
  }, [])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    if (!consentGiven) {
      setMessage('Please provide consent to use camera for identity verification')
      return
    }

    setStatus('loading')
    setMessage('Starting camera...')

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setStatus('ready')
        setMessage('Position your face in the center. Ensure good lighting.')
      }
    } catch (error) {
      console.error('Camera error:', error)
      setStatus('error')
      setMessage('Failed to access camera. Please grant camera permission.')
    }
  }

  const captureFace = async () => {
    if (!videoRef.current || status !== 'ready') return

    setStatus('capturing')
    setMessage('Analyzing face...')

    try {
      const imageDataUrl = await captureFrameFromVideo(videoRef.current)
      setCapturedImage(imageDataUrl)

      const img = new Image()
      img.src = imageDataUrl

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const result = await detectAndExtractFace(img)

      if (!result.success) {
        setStatus('error')
        setMessage(result.error || 'Face detection failed')
        setTimeout(() => {
          setStatus('ready')
          setMessage('Position your face in the center. Ensure good lighting.')
        }, 3000)
        return
      }

      if (!result.embedding) {
        setStatus('error')
        setMessage('Failed to generate face embedding')
        return
      }

      setMessage('Uploading face image...')
      
      const uploadResponse = await fetch('/api/exam/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          candidateId,
          imageDataUrl,
          embedding: result.embedding
        })
      })

      const responseData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        console.error('API Error:', responseData)
        throw new Error(responseData.error || 'Failed to save face data')
      }

      setStatus('success')
      setMessage('Face verified successfully! Starting exam...')
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      setTimeout(() => onSuccess(), 1500)
    } catch (error) {
      console.error('Face capture error:', error)
      setStatus('error')
      setMessage('Failed to process face image. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 text-center">
        <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Identity Verification</h2>
        <p className="text-sm text-muted-foreground">
          We need to verify your identity before you can start the exam
        </p>
      </div>

      {!consentGiven && (
        <Alert className="mb-6">
          <AlertDescription>
            <div className="space-y-4">
              <p className="text-sm font-medium">Camera Consent Required</p>
              <p className="text-xs text-muted-foreground">
                By clicking "I Agree", you consent to:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Camera access for identity verification</li>
                <li>• Capturing your face image before exam</li>
                <li>• Periodic face verification during exam</li>
                <li>• Face data used only for proctoring purposes</li>
                <li>• Face data will not be shared with third parties</li>
              </ul>
              <Button onClick={() => setConsentGiven(true)} className="w-full">
                I Agree - Enable Camera
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {consentGiven && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-border bg-black aspect-video">
            {status === 'success' && capturedImage ? (
              <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            
            {status === 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-4 border-primary rounded-full opacity-50" />
              </div>
            )}

            <div className="absolute top-4 left-4 right-4">
              {status === 'loading' && (
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-sm text-white">{message}</span>
                </div>
              )}
              {status === 'ready' && (
                <div className="flex items-center gap-2 bg-blue-500/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Camera className="h-4 w-4 text-white" />
                  <span className="text-sm text-white">{message}</span>
                </div>
              )}
              {status === 'capturing' && (
                <div className="flex items-center gap-2 bg-yellow-500/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-sm text-white">{message}</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 bg-green-500/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span className="text-sm text-white">{message}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 bg-red-500/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                  <span className="text-sm text-white">{message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {status === 'idle' && (
              <Button onClick={startCamera} className="flex-1" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}
            {status === 'ready' && (
              <Button onClick={captureFace} className="flex-1" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Capture Face
              </Button>
            )}
            {status === 'capturing' && (
              <Button disabled className="flex-1" size="lg">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
            {status === 'success' && (
              <Button disabled className="flex-1" size="lg" variant="outline">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verification Complete
              </Button>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              <strong>Tips for best results:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Ensure your face is well-lit</li>
                <li>• Look directly at the camera</li>
                <li>• Remove glasses if possible</li>
                <li>• Keep your face centered in the frame</li>
                <li>• Only one person should be visible</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
