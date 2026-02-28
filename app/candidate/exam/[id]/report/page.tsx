"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Clock,
  Shield,
  Eye,
  Loader2
} from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"

interface ReportData {
  examId: string
  timestamp: string
  duration: number
  riskScore: number
  riskLevel: string
  recommendation: string
  totalViolations: number
  genuineViolations: number
  violationSummary: Record<string, number>
  analysis: string
  insights: string[]
  violations: any[]
}

export default function ExamReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching report
    const mockReport: ReportData = {
      examId: id,
      timestamp: new Date().toISOString(),
      duration: 3600,
      riskScore: 15,
      riskLevel: "LOW",
      recommendation: "PASS",
      totalViolations: 8,
      genuineViolations: 3,
      violationSummary: {
        "LOOKING_AWAY": 2,
        "TAB_SWITCH": 1
      },
      analysis: "Minor violations detected. Likely honest mistakes or environmental factors.",
      insights: [
        "Brief looking away detected - within acceptable range",
        "One tab switch - possibly accidental"
      ],
      violations: []
    }

    setTimeout(() => {
      setReport(mockReport)
      setLoading(false)
    }, 1000)
  }, [id])

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!report) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Report not found</p>
        </div>
      </>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW": return "text-success"
      case "MEDIUM": return "text-warning"
      case "HIGH": return "text-destructive"
      case "CRITICAL": return "text-destructive"
      default: return "text-foreground"
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "PASS": return <CheckCircle2 className="h-6 w-6 text-success" />
      case "REVIEW": return <AlertTriangle className="h-6 w-6 text-warning" />
      case "FAIL": return <XCircle className="h-6 w-6 text-destructive" />
      default: return null
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Proctoring Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered integrity analysis
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Risk Score Card */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Integrity Score</h2>
              <p className="text-xs text-muted-foreground">AI-calculated risk assessment</p>
            </div>
            <div className="flex items-center gap-2">
              {getRecommendationIcon(report.recommendation)}
              <span className="text-lg font-bold text-foreground">{report.recommendation}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className={`text-4xl font-bold mb-1 ${getRiskColor(report.riskLevel)}`}>
                {report.riskScore}
              </div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
              <Progress value={report.riskScore} className="mt-2 h-2" />
            </div>

            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="text-4xl font-bold mb-1 text-foreground">
                {report.riskLevel}
              </div>
              <div className="text-xs text-muted-foreground">Risk Level</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="text-4xl font-bold mb-1 text-foreground">
                {report.genuineViolations}
              </div>
              <div className="text-xs text-muted-foreground">Genuine Violations</div>
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            AI Analysis
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {report.analysis}
          </p>
        </div>

        {/* Insights */}
        {report.insights.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Key Insights
            </h3>
            <ul className="space-y-2">
              {report.insights.map((insight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Violation Summary */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Violation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.violationSummary).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-foreground">{type.replace(/_/g, " ")}</span>
                <StatusBadge label={String(count)} variant="default" />
              </div>
            ))}
          </div>
        </div>

        {/* Exam Details */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Exam Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Exam ID</div>
              <div className="font-medium text-foreground">{report.examId}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Duration</div>
              <div className="font-medium text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(report.duration / 60)} min
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Total Violations</div>
              <div className="font-medium text-foreground">{report.totalViolations}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Filtered Out</div>
              <div className="font-medium text-foreground">
                {report.totalViolations - report.genuineViolations}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            This report was generated using AI-powered proctoring technology.
            All violations are analyzed for context and false positives are filtered out.
          </p>
        </div>
      </div>
    </>
  )
}
