"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { FileText, Eye, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default function ResultsPage() {
  const { state } = useAppStore()
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttempts()
  }, [])

  const fetchAttempts = async () => {
    try {
      console.log('Fetching attempts for candidate:', state.user?.id)
      const res = await fetch(`/api/candidate/attempts?candidateId=${state.user?.id}`)
      const data = await res.json()

      if (data.error) {
        console.error('Error fetching attempts:', data.error)
      } else {
        console.log('Fetched attempts:', data.attempts)
        setAttempts(data.attempts || [])
      }
    } catch (error) {
      console.error('Failed to fetch attempts:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="My Results"
          description="View your exam results and performance reports."
          breadcrumbs={[
            { label: "Dashboard", href: "/candidate/dashboard" },
            { label: "Results" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading results...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="My Results"
        description="View your exam results and performance reports."
        breadcrumbs={[
          { label: "Dashboard", href: "/candidate/dashboard" },
          { label: "Results" },
        ]}
      />

      {attempts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No exam results yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {attempt.exams?.title || 'Exam'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {attempt.exams?.subject || 'Subject'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {attempt.result_published ? (
                    <StatusBadge label="Published" variant="success" />
                  ) : attempt.evaluated ? (
                    <StatusBadge label="Evaluated" variant="warning" />
                  ) : (
                    <StatusBadge label="Under Evaluation" variant="default" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(attempt.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium text-foreground">
                    {Math.floor((attempt.duration_seconds || 0) / 60)} min
                  </p>
                </div>
                {attempt.result_published && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Score</p>
                      <p className="text-sm font-medium text-foreground">
                        {attempt.score ?? 0}/{attempt.exams?.max_score || 100}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Percentage</p>
                      <p className="text-sm font-medium text-foreground">
                        {Math.round(((attempt.score ?? 0) / (attempt.exams?.max_score || 100)) * 100)}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {attempt.result_published ? (
                  <Link href={`/candidate/exam/${attempt.id}/report`}>
                    <Button size="sm" className="gap-1 text-xs">
                      <Eye className="h-3 w-3" /> View Full Report
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline" disabled className="gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {attempt.evaluated ? 'Awaiting Publication' : 'Under Evaluation'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
