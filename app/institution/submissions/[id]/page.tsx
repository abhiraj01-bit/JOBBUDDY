"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/status-badge"
import { AlertTriangle, CheckCircle2, Send, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { state } = useAppStore()
  const [submission, setSubmission] = useState<any>(null)
  const [violations, setViolations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState("")
  const [remarks, setRemarks] = useState("")
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/institution/submissions/${id}`)
      const data = await res.json()
      setSubmission(data.submission)
      setViolations(data.violations || [])
      setScore(data.submission.score?.toString() || "")
      setRemarks(data.submission.teacher_remarks || "")
    } catch (error) {
      console.error('Failed to fetch submission:', error)
    }
    setLoading(false)
  }

  const handleEvaluate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/institution/submissions/${id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(score),
          remarks,
          teacherId: state.user?.id
        })
      })

      if (res.ok) {
        alert('Evaluation saved successfully')
        fetchSubmission()
      } else {
        alert('Failed to save evaluation')
      }
    } catch (error) {
      alert('Error saving evaluation')
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/institution/submissions/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: state.user?.id })
      })

      if (res.ok) {
        alert('Result published successfully')
        setShowPublishDialog(false)
        router.push('/institution/submissions')
      } else {
        alert('Failed to publish result')
      }
    } catch (error) {
      alert('Error publishing result')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
  }

  if (!submission) {
    return <div className="flex items-center justify-center py-20 text-destructive">Submission not found</div>
  }

  const getRiskColor = (score: number) => {
    if (score < 20) return "text-success"
    if (score < 40) return "text-warning"
    return "text-destructive"
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/institution/submissions">
            <Button variant="ghost" size="sm" className="gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Submissions
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Review Submission</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submission.candidate_name} - {submission.exam_title}
          </p>
        </div>
        <div className="flex gap-2">
          {submission.evaluated && !submission.result_published && (
            <Button onClick={() => setShowPublishDialog(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Publish Result
            </Button>
          )}
          {submission.result_published && (
            <StatusBadge label="Published" variant="success" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Answers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Student Answers</h3>
            {submission.answers && Object.entries(submission.answers).map(([qNum, answer]: [string, any]) => (
              <div key={qNum} className="mb-4 pb-4 border-b border-border last:border-0">
                <p className="text-xs text-muted-foreground mb-1">Question {parseInt(qNum) + 1}</p>
                <p className="text-sm text-foreground">{answer}</p>
              </div>
            ))}
          </div>

          {/* Violations */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Proctoring Violations ({violations.length})
            </h3>
            {violations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No violations detected</p>
            ) : (
              <div className="space-y-3">
                {violations.map((v) => (
                  <div key={v.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{v.type.replace(/_/g, ' ')}</span>
                      <StatusBadge 
                        label={v.severity} 
                        variant={v.severity === 'critical' ? 'destructive' : v.severity === 'high' ? 'warning' : 'default'} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{v.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Evaluation */}
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Risk Analysis</h3>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getRiskColor(submission.risk_score || 0)}`}>
                {submission.risk_score || 0}
              </div>
              <p className="text-xs text-muted-foreground">Risk Score (0-100)</p>
            </div>
          </div>

          {/* Evaluation Form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Evaluation</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="score" className="text-xs">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score"
                  disabled={submission.result_published}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Max: {submission.max_score || 100}
                </p>
              </div>

              <div>
                <Label htmlFor="remarks" className="text-xs">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add your remarks..."
                  disabled={submission.result_published}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {!submission.result_published && (
                <Button 
                  onClick={handleEvaluate} 
                  disabled={saving || !score}
                  className="w-full"
                >
                  {saving ? 'Saving...' : submission.evaluated ? 'Update Evaluation' : 'Save Evaluation'}
                </Button>
              )}

              {submission.evaluated && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Evaluated on {new Date(submission.evaluated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Result?</DialogTitle>
            <DialogDescription>
              This will make the result visible to the student. Once published, you cannot edit the score or remarks.
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={saving}>
              {saving ? 'Publishing...' : 'Publish Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
