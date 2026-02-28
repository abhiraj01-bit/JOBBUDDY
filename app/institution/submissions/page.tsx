"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { Eye, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

export default function SubmissionsPage() {
  const { state } = useAppStore()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/institution/submissions?institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    }
    setLoading(false)
  }

  const getStatusBadge = (submission: any) => {
    if (submission.result_published) {
      return <StatusBadge label="Published" variant="success" />
    }
    if (submission.evaluated) {
      return <StatusBadge label="Evaluated" variant="info" />
    }
    return <StatusBadge label="Pending Review" variant="warning" />
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore < 20) return <StatusBadge label="Low Risk" variant="success" />
    if (riskScore < 40) return <StatusBadge label="Medium Risk" variant="warning" />
    return <StatusBadge label="High Risk" variant="destructive" />
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Exam Submissions"
          description="Review and evaluate student exam submissions"
          breadcrumbs={[
            { label: "Dashboard", href: "/institution/dashboard" },
            { label: "Submissions" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Exam Submissions"
        description="Review and evaluate student exam submissions"
        breadcrumbs={[
          { label: "Dashboard", href: "/institution/dashboard" },
          { label: "Submissions" },
        ]}
      />

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No submissions yet</div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Exam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                      {submission.candidate_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {submission.exam_title}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-warning" />
                        <span className="text-foreground">{submission.violation_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getRiskBadge(submission.risk_score || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(submission)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/institution/submissions/${submission.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <Eye className="h-3 w-3" />
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
