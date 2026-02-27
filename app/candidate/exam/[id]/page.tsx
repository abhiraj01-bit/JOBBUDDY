"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { mockExams, mockExamQuestions } from "@/lib/mock-data"
import { useExamStore } from "@/lib/store/exam-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/status-badge"
import { useProctoringMonitor } from "@/lib/ai/use-proctoring"
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Save,
  Flag,
  AlertTriangle,
  Camera,
  Shield,
  Send,
  Eye,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ExamAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { startExam, endExam } = useExamStore()
  const exam = mockExams.find((e) => e.id === id)
  const questions = exam?.questions || mockExamQuestions.slice(0, 5)

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 60) * 60)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [examStartTime] = useState(Date.now())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const geminiKey = 'AIzaSyAQZxE2RvdUP42Q1SWNWbxMp_pcJcs3H7k'

  // Define handleSubmit before using it
  const handleSubmit = async () => {
    stopMonitoring()
    endExam()
    
    const duration = (Date.now() - examStartTime) / 1000
    const response = await fetch(`/api/exam/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ violations, duration })
    })
    
    const report = await response.json()
    router.push(`/candidate/exams?submitted=true&score=${report.riskScore}`)
  }

  // AI Proctoring with auto-submit
  const {
    videoRef,
    violations,
    isMonitoring,
    aiLoaded,
    tabSwitchCount,
    startMonitoring,
    stopMonitoring
  } = useProctoringMonitor(id, true, handleSubmit, geminiKey)

  // Start exam lock and AI monitoring
  useEffect(() => {
    startExam(id)
    if (aiLoaded && !isMonitoring) {
      startMonitoring()
    }
    return () => {
      stopMonitoring()
      endExam()
    }
  }, [aiLoaded, id, startExam, endExam])

  // Enter fullscreen and lock exam
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error('Fullscreen error:', err)
      }
    }
    
    enterFullscreen()
    
    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        alert('You must stay in fullscreen mode during the exam!')
        enterFullscreen()
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Prevent navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to leave? Your exam will be submitted.'
      return e.returnValue
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Disable back button
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
      alert('Navigation is disabled during the exam!')
    }
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [])

  // Prevent F11, F12, Ctrl+Shift+I, etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault()
      }
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
      }
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
      }
      // Prevent Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
      }
      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 0) {
          handleSubmit()
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const isLowTime = timeLeft < 300
  const answeredCount = Object.keys(answers).length
  const q = questions[currentQ]
  const criticalViolations = violations.filter(v => v.severity === 'critical').length
  const recentViolation = violations[violations.length - 1]

  const toggleFlag = () => {
    setFlagged((p) => {
      const next = new Set(p)
      if (next.has(currentQ)) next.delete(currentQ)
      else next.add(currentQ)
      return next
    })
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Exam not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Exam Lock Warning */}
      {!isFullscreen && (
        <div className="fixed inset-0 bg-destructive/90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Fullscreen Required</h2>
            <p>You must remain in fullscreen mode during the exam</p>
          </div>
        </div>
      )}
      {/* Fixed Timer Header */}
      <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        isLowTime ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">{exam.title}</h1>
          <StatusBadge label={`${answeredCount}/${questions.length} answered`} variant="info" />
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold ${isLowTime ? "text-destructive" : "text-foreground"}`}>
            <Clock className={`h-4 w-4 ${isLowTime ? "animate-pulse" : ""}`} />
            {formatTime(timeLeft)}
          </div>
          <Button size="sm" className="text-xs gap-1" onClick={() => setShowSubmitDialog(true)}>
            <Send className="h-3 w-3" /> Submit
          </Button>
        </div>
      </div>



      {/* Camera preview - bottom right corner */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative rounded-lg overflow-hidden border-2 border-primary shadow-lg bg-black">
          <video 
            ref={videoRef} 
            className="w-48 h-36 object-cover" 
            playsInline 
            muted 
            autoPlay
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-medium">LIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Question Navigation Sidebar */}
        <div className="lg:order-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    i === currentQ
                      ? "bg-primary text-primary-foreground"
                      : answers[i] !== undefined
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-secondary text-muted-foreground hover:bg-accent/10"
                  }`}
                >
                  {i + 1}
                  {flagged.has(i) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-success/10 border border-success/20" /> Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-secondary" /> Not Answered ({questions.length - answeredCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-warning/30 border border-warning/50" /> Flagged ({flagged.size})
              </div>
            </div>
          </div>

          {/* Proctoring Status */}
          <div className="rounded-xl border border-border bg-secondary/50 p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Proctoring Active</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Your session is being monitored. Do not switch tabs or windows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3 lg:order-1">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Question {currentQ + 1}</span>
                <StatusBadge label={q?.type === "mcq" ? "MCQ" : "Descriptive"} variant="info" />
                <StatusBadge label={`${q?.marks} marks`} variant="default" />
              </div>
              <Button variant="ghost" size="sm" className={`text-xs gap-1 ${flagged.has(currentQ) ? "text-warning" : ""}`} onClick={toggleFlag}>
                <Flag className={`h-3 w-3 ${flagged.has(currentQ) ? "fill-warning" : ""}`} />
                {flagged.has(currentQ) ? "Flagged" : "Flag"}
              </Button>
            </div>

            <p className="text-sm font-medium text-foreground leading-relaxed mb-6">{q?.text}</p>

            {/* MCQ Options */}
            {q?.type === "mcq" && q.options && (
              <RadioGroup
                value={answers[currentQ] ?? ""}
                onValueChange={(v) => setAnswers({ ...answers, [currentQ]: v })}
                className="space-y-3"
              >
                {q.options.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                    answers[currentQ] === String(i) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                  }`}>
                    <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                    <Label htmlFor={`opt-${i}`} className="text-sm text-foreground cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Descriptive */}
            {q?.type === "descriptive" && (
              <Textarea
                placeholder="Write your answer here..."
                value={answers[currentQ] || ""}
                onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
                className="min-h-[200px] text-sm"
              />
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
              >
                <ChevronLeft className="h-3 w-3" /> Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
                  // Save current answer (already saved via state)
                }}>
                  <Save className="h-3 w-3" /> Save
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button size="sm" className="text-xs gap-1" onClick={() => setCurrentQ(currentQ + 1)}>
                    Save & Next <ChevronRight className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" className="text-xs gap-1" onClick={() => setShowSubmitDialog(true)}>
                    <Send className="h-3 w-3" /> Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && ` ${questions.length - answeredCount} question(s) are unanswered.`}
              {" "}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Continue Exam</Button>
            <Button onClick={handleSubmit}>Submit Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
