"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Users, BookOpen, BarChart3, ShieldAlert } from "lucide-react"

export default function InstitutionDashboard() {
  const { state } = useAppStore()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/exams?institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const publishedExams = exams.filter(e => e.status === 'published').length
  const draftExams = exams.filter(e => e.status === 'draft').length

  if (loading) {
    return (
      <>
        <PageHeader
          title="Institution Dashboard"
          description="Monitor candidate performance, exam analytics, and risk assessments."
          breadcrumbs={[{ label: "Dashboard" }]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Institution Dashboard"
        description="Monitor candidate performance, exam analytics, and risk assessments."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Institution"
          value={state.user?.institution || 'N/A'}
          subtitle="Your institution"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Exams"
          value={String(exams.length)}
          subtitle={`${publishedExams} published`}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Draft Exams"
          value={String(draftExams)}
          subtitle="Pending publish"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="Published Exams"
          value={String(publishedExams)}
          subtitle="Live for candidates"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* Recent Exams */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Exams</h3>
        </div>
        <div className="divide-y divide-border">
          {exams.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No exams created yet</div>
          ) : (
            exams.slice(0, 5).map((exam) => (
              <div key={exam.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{exam.title}</p>
                  <p className="text-xs text-muted-foreground">{exam.subject}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {exam.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
