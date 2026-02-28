"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, BookOpen, AlertTriangle, FileText } from "lucide-react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

export default function ReportsPage() {
  const { state } = useAppStore()
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/candidate/attempts?candidateId=${state.user?.id}`)
      const data = await res.json()
      
      if (data.attempts && data.attempts.length > 0) {
        // Filter only published results
        const publishedReports = data.attempts.filter((a: any) => a.result_published)
        setReports(publishedReports)
        if (publishedReports.length > 0) {
          setSelectedReport(publishedReports[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Reports"
          description="View detailed performance reports for your exams."
          breadcrumbs={[
            { label: "Dashboard", href: "/candidate/dashboard" },
            { label: "Reports" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading reports...</div>
      </>
    )
  }

  if (reports.length === 0) {
    return (
      <>
        <PageHeader
          title="Reports"
          description="View detailed performance reports for your exams."
          breadcrumbs={[
            { label: "Dashboard", href: "/candidate/dashboard" },
            { label: "Reports" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No published reports yet</p>
          <p className="text-xs mt-2">Reports will appear here after your exams are evaluated and published</p>
        </div>
      </>
    )
  }

  const radarData = selectedReport?.answers
    ? Object.entries(selectedReport.answers).slice(0, 5).map(([key, val]: [string, any], idx: number) => ({
        subject: `Q${idx + 1}`,
        score: typeof val === 'string' ? (val.length > 0 ? 80 : 0) : 60,
        fullMark: 100
      }))
    : []

  const barData = [
    { name: 'Your Score', score: selectedReport?.score || 0 },
    { name: 'Max Score', score: selectedReport?.max_score || selectedReport?.exams?.max_score || 100 },
    { name: 'Risk Score', score: selectedReport?.risk_score || 0 }
  ]

  return (
    <>
      <PageHeader
        title="Reports"
        description="View detailed performance reports for your exams."
        breadcrumbs={[
          { label: "Dashboard", href: "/candidate/dashboard" },
          { label: "Reports" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Report List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Published Reports</h3>
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReport?.id === report.id}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </div>

        {/* Report Detail */}
        {selectedReport && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <h2 className="text-base font-semibold text-foreground">
                      {selectedReport.exams?.title || 'Exam Report'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedReport.submitted_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedReport.score ?? 0}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{selectedReport.max_score || selectedReport.exams?.max_score || 100}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(((selectedReport.score ?? 0) / (selectedReport.max_score || selectedReport.exams?.max_score || 100)) * 100)}% Overall
                  </p>
                </div>
              </div>

              {selectedReport.risk_score !== undefined && selectedReport.risk_score > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                  <span className="text-xs font-medium text-warning-foreground">
                    Risk Score: {selectedReport.risk_score}/100
                  </span>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Performance Overview</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                      <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Score Breakdown</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Bar dataKey="score" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Teacher Remarks */}
            {selectedReport.teacher_remarks && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Teacher's Remarks</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedReport.teacher_remarks}
                </p>
              </div>
            )}

            {/* Exam Details */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Exam Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Subject</p>
                  <p className="font-medium text-foreground">{selectedReport.exams?.subject || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium text-foreground">
                    {Math.floor((selectedReport.duration_seconds || 0) / 60)} minutes
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Evaluated On</p>
                  <p className="font-medium text-foreground">
                    {selectedReport.evaluated_at
                      ? new Date(selectedReport.evaluated_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Published On</p>
                  <p className="font-medium text-foreground">
                    {selectedReport.published_at
                      ? new Date(selectedReport.published_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* View Full Report Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = `/candidate/exam/${selectedReport.id}/report`}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                View Full Proctoring Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ReportCard({ report, isSelected, onClick }: { report: any; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">
            {report.exams?.title || 'Exam'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {new Date(report.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="text-xs font-medium text-foreground">
          {report.score ?? 0}/{report.max_score || report.exams?.max_score || 100}
        </span>
        <StatusBadge label="Published" variant="success" />
      </div>
    </button>
  )
}
