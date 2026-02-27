"use client"

import { useAppStore } from "@/lib/store"
import { mockExams, weeklyActivity, candidateSkills } from "@/lib/mock-data"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge, getExamStatusVariant } from "@/components/shared/status-badge"
import { BookOpen, BarChart3, Brain, Lightbulb, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
} from "recharts"

const upcomingExams = mockExams.filter((e) => e.status === "not-started" || e.status === "in-progress")
const completedExams = mockExams.filter((e) => e.status === "completed")
const avgScore = completedExams.length
  ? Math.round(completedExams.reduce((a, b) => a + (b.score || 0), 0) / completedExams.length)
  : 0

const recommendations = [
  { title: "Review Graph Algorithms", description: "Based on your exam results, graph problems need more practice.", priority: "high" },
  { title: "Practice Dynamic Programming", description: "DP questions are frequently asked. Focus on common patterns.", priority: "medium" },
  { title: "Strengthen Database Concepts", description: "Indexing and transactions need improvement based on recent scores.", priority: "medium" },
]

export default function CandidateDashboard() {
  const { state } = useAppStore()

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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Exams Attempted"
          value={completedExams.length}
          subtitle={`${upcomingExams.length} pending`}
          icon={<BookOpen className="h-5 w-5" />}
          trend={{ value: 8, label: "this month" }}
        />
        <StatCard
          title="Total Questions"
          value={completedExams.reduce((sum, e) => sum + e.totalQuestions, 0)}
          subtitle="Answered successfully"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="AI Insights"
          value="3"
          subtitle="New recommendations"
          icon={<Brain className="h-5 w-5" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Exams */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">Upcoming Exams</h3>
              <Link href="/candidate/exams">
                <Button variant="ghost" size="sm" className="text-xs">View all</Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcomingExams.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No upcoming exams</div>
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
                          <span>{exam.totalQuestions} questions</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge label={exam.status.replace("-", " ")} variant={getExamStatusVariant(exam.status)} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Weekly Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="exams" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Exams" />
                  <Bar dataKey="studyHours" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Study Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills Radar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Skills Overview</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={candidateSkills}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Radar name="Score" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                AI Recommendations
              </h3>
            </div>
            <div className="divide-y divide-border">
              {recommendations.map((rec, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${rec.priority === "high" ? "bg-destructive" : rec.priority === "medium" ? "bg-warning" : "bg-success"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Chart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Score Trend
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { week: "W1", score: 62 },
                  { week: "W2", score: 68 },
                  { week: "W3", score: 74 },
                  { week: "W4", score: 78 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ fill: "var(--primary)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
