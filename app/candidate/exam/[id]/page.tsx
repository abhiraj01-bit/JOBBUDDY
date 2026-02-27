"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { mockExams, mockExamQuestions } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/status-badge"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
  const exam = mockExams.find((e) => e.id === id)
  const questions = exam?.questions || mockExamQuestions.slice(0, 5)

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 60) * 60)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [examStartTime] = useState(Date.now())
  const geminiKey = 'AIzaSyDfqEU4Bu-RlobqbZCEeV128BnlqPwogL4'

  // Define handleSubmit before using it
  const handleSubmit = async () => {
    stopMonitoring()
    
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

  // Start AI monitoring when component mounts
  useEffect(() => {
    if (aiLoaded) {
      startMonitoring()
    }
    return () => {
      stopMonitoring()
    }
  }, [aiLoaded, startMonitoring, stopMonitoring])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 0) {
          setShowSubmitDialog(true)
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Exam not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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

          {/* Proctoring Indicators */}
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${
              isMonitoring ? "bg-success/10" : "bg-secondary"
            }`}>
              <Camera className={`h-3 w-3 ${isMonitoring ? "text-success" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${isMonitoring ? "text-success" : "text-muted-foreground"}`}>
                {isMonitoring ? "AI" : "OFF"}
              </span>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${
              aiLoaded ? "bg-primary/10" : "bg-secondary"
            }`}>
              <Eye className={`h-3 w-3 ${aiLoaded ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${aiLoaded ? "text-primary" : "text-muted-foreground"}`}>
                {aiLoaded ? "READY" : "LOAD"}
              </span>
            </div>
            {violations.length > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-medium text-destructive">{violations.length}</span>
              </div>
            )}
          </div>

          <Button size="sm" className="text-xs gap-1" onClick={() => setShowSubmitDialog(true)}>
            <Send className="h-3 w-3" /> Submit
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {recentViolation && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">
            {recentViolation.description}
          </p>
        </div>
      )}

      {/* Hidden video for AI processing */}
      <video ref={videoRef} className="hidden" playsInline muted />

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
    </DashboardLayout>
  )
}
