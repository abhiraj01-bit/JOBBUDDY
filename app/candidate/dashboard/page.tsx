"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { BookOpen, BarChart3, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function CandidateDashboard() {
  const { state } = useAppStore()
  const [exams, setExams] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch published exams
      const examsRes = await fetch(`/api/exams?status=published&institutionId=${state.user?.institutionId}`)
      const examsData = await examsRes.json()
      setExams(examsData.exams || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const upcomingExams = exams.slice(0, 5)
  const avgScore = 0 // Will be calculated from attempts

  if (loading) {
    return (
      <>
        <PageHeader
          title={`Welcome back, ${state.user?.name?.split(" ")[0] || "Candidate"}`}
          description="Here's an overview of your progress and upcoming activities."
          breadcrumbs={[{ label: "Dashboard" }]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${state.user?.name?.split(" ")[0] || "Candidate"}`}
        description="Here's an overview of your progress and upcoming activities."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Welcome Banner */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Exam Performance Score</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your recent exam performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{avgScore}%</p>
            </div>
            <Progress value={avgScore} className="w-32 h-2" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Available Exams"
          value={exams.length}
          subtitle="Ready to attempt"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Exams Attempted"
          value={attempts.length}
          subtitle="Completed"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="Institution"
          value={state.user?.institution || 'N/A'}
          subtitle="Your college"
          icon={<Brain className="h-5 w-5" />}
        />
      </div>

      {/* Upcoming Exams */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Available Exams</h3>
          <Link href="/candidate/exams">
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {upcomingExams.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No exams available</div>
          ) : (
            upcomingExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <BookOpen className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{exam.duration} min</span>
                      <span>-</span>
                      <span>{exam.total_questions} questions</span>
                    </div>
                  </div>
                </div>
                <StatusBadge label="Available" variant="success" />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
