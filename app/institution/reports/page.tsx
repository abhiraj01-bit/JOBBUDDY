"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function InstitutionReportsPage() {
  const { state } = useAppStore()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/institution/reports?institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.examPerformance) {
        setChartData(data.examPerformance)
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
          title="Reports & Analytics"
          description="Detailed performance analytics and reporting across all exams."
          breadcrumbs={[
            { label: "Dashboard", href: "/institution/dashboard" },
            { label: "Reports" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading reports...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Detailed performance analytics and reporting across all exams."
        breadcrumbs={[
          { label: "Dashboard", href: "/institution/dashboard" },
          { label: "Reports" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Avg Score" 
          value={stats?.avgScore ? `${stats.avgScore}%` : 'N/A'} 
          icon={<BarChart3 className="h-5 w-5" />} 
        />
        <StatCard 
          title="Pass Rate" 
          value={stats?.passRate ? `${stats.passRate}%` : 'N/A'} 
          icon={<TrendingUp className="h-5 w-5" />} 
        />
        <StatCard 
          title="Total Attempts" 
          value={stats?.totalAttempts || 0} 
          icon={<Users className="h-5 w-5" />} 
        />
        <StatCard 
          title="Pending Evaluation" 
          value={stats?.pendingEvaluation || 0} 
          icon={<AlertTriangle className="h-5 w-5" />} 
        />
      </div>

      {chartData.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Exam Performance Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="exam" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--card)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "8px", 
                    fontSize: "12px" 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="avgScore" fill="var(--primary)" name="Avg Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attempts" fill="var(--accent)" name="Attempts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No exam data available yet</p>
        </div>
      )}
    </>
  )
}
