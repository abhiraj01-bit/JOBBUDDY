"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, getExamStatusVariant } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, FileText, Play, RotateCcw } from "lucide-react"

export default function ExamsPage() {
  const { state } = useAppStore()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      // Fetch published exams from candidate's institution
      const res = await fetch(`/api/exams?status=published&institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Exams"
          description="Browse and take your scheduled examinations."
          breadcrumbs={[
            { label: "Dashboard", href: "/candidate/dashboard" },
            { label: "Exams" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading exams...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Exams"
        description="Browse and take your scheduled examinations."
        breadcrumbs={[
          { label: "Dashboard", href: "/candidate/dashboard" },
          { label: "Exams" },
        ]}
      />

      {exams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No exams available</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <StatusBadge label={exam.status} variant={getExamStatusVariant('not-started')} />
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1">{exam.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{exam.subject}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {exam.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {exam.total_questions} questions
                </span>
              </div>

              <div className="flex gap-2">
                <Link href={`/candidate/exam/${exam.id}/verification`} className="flex-1">
                  <Button size="sm" className="w-full gap-1 text-xs">
                    <Play className="h-3 w-3" /> Start Exam
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
