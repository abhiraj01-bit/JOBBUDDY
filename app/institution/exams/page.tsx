"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge, getExamStatusVariant } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { Exam } from "@/lib/types"

const columns = [
  {
    key: "title",
    header: "Exam Title",
    render: (item: any) => (
      <div>
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.subject}</p>
      </div>
    ),
  },
  {
    key: "date",
    header: "Date",
    render: (item: any) => (
      <span className="text-sm text-foreground">{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
    ),
  },
  {
    key: "duration",
    header: "Duration",
    render: (item: any) => <span className="text-sm text-foreground">{item.duration} min</span>,
  },
  {
    key: "totalQuestions",
    header: "Questions",
    render: (item: any) => <span className="text-sm text-foreground">{item.totalQuestions}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (item: any) => (
      <StatusBadge label={item.status} variant={item.status === 'published' ? 'success' : 'warning'} />
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (item: any) => item.actions || null,
  },
]

export default function InstitutionExamsPage() {
  const router = useRouter()
  const { state } = useAppStore()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<any[]>([])
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    duration: "",
    totalQuestions: "",
    maxScore: ""
  })
  const [questions, setQuestions] = useState<any[]>([{
    text: "",
    type: "mcq",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 1
  }])

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch(`/api/exams?institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      text: "",
      type: "mcq",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex] = value
    setQuestions(updated)
  }

  const handleCreate = async () => {
    if (!form.title || !form.subject || !form.duration || !form.totalQuestions || !form.maxScore) {
      alert('Please fill all required fields')
      return
    }

    if (questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          questions,
          institutionId: state.user?.institutionId,
          createdBy: state.user?.id
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to create exam')
        setLoading(false)
        return
      }

      alert('Exam created successfully!')
      setOpen(false)
      setForm({ title: "", subject: "", description: "", duration: "", totalQuestions: "", maxScore: "" })
      setQuestions([{ text: "", type: "mcq", options: ["", "", "", ""], correctAnswer: 0, marks: 1 }])
      fetchExams()
    } catch (error) {
      alert('Network error. Please try again.')
    }
    setLoading(false)
  }

  const handlePublish = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      })

      if (res.ok) {
        alert('Exam published successfully!')
        fetchExams()
      } else {
        alert('Failed to publish exam')
      }
    } catch (error) {
      alert('Network error')
    }
  }

  return (
    <>
      <PageHeader
        title="Exams Management"
        description="Create, manage, and monitor all examinations."
        breadcrumbs={[
          { label: "Dashboard", href: "/institution/dashboard" },
          { label: "Exams" },
        ]}
        actions={
          <Button size="sm" className="gap-1 text-xs" onClick={() => setOpen(true)}>
            <Plus className="h-3 w-3" /> Create Exam
          </Button>
        }
      />
      <DataTable columns={columns} data={exams.map(e => ({
        ...e,
        date: e.created_at,
        status: e.status,
        totalQuestions: e.total_questions,
        actions: e.status === 'draft' ? (
          <Button size="sm" onClick={() => handlePublish(e.id)}>
            Publish
          </Button>
        ) : null
      })) as unknown as Record<string, unknown>[]} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Structures Final"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Computer Science"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the exam"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questions">Total Questions *</Label>
                  <Input
                    id="questions"
                    type="number"
                    placeholder="20"
                    value={form.totalQuestions}
                    onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    placeholder="100"
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Questions</Label>
                <Button size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="h-3 w-3 mr-1" /> Add Question
                </Button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Label>Question {qIndex + 1}</Label>
                    {questions.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeQuestion(qIndex)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="Enter question text"
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={q.type} onValueChange={(v) => updateQuestion(qIndex, 'type', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {q.options.map((opt: string, oIndex: number) => (
                        <div key={oIndex} className="flex gap-2">
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant={q.correctAnswer === oIndex ? "default" : "outline"}
                            onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          >
                            {q.correctAnswer === oIndex ? "✓" : ""}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
