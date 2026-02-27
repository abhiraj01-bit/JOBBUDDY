"use client"

import Link from "next/link"
import { mockExams } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge, getExamStatusVariant } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, FileText, Play, RotateCcw } from "lucide-react"

export default function ExamsPage() {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockExams.map((exam) => (
          <div key={exam.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <StatusBadge label={exam.status.replace("-", " ")} variant={getExamStatusVariant(exam.status)} />
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
                {exam.totalQuestions} questions
              </span>
            </div>

            {exam.status === "completed" && exam.score !== undefined && (
              <div className="mb-4 rounded-lg bg-secondary p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-sm font-semibold text-foreground">{exam.score}/{exam.maxScore}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {exam.status === "not-started" && (
                <Link href={`/candidate/exam/${exam.id}/verification`} className="flex-1">
                  <Button size="sm" className="w-full gap-1 text-xs">
                    <Play className="h-3 w-3" /> Start Exam
                  </Button>
                </Link>
              )}
              {exam.status === "in-progress" && (
                <Link href={`/candidate/exam/${exam.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                    <RotateCcw className="h-3 w-3" /> Resume
                  </Button>
                </Link>
              )}
              {exam.status === "completed" && (
                <Link href="/candidate/reports" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    View Report
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
