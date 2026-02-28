"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Users as UsersIcon } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const columns = [
  {
    key: "name",
    header: "Candidate",
    render: (item: Record<string, unknown>) => (
      <div>
        <p className="text-sm font-medium text-foreground">{String(item.name)}</p>
        <p className="text-xs text-muted-foreground">{String(item.email)}</p>
      </div>
    ),
  },
  { 
    key: "examsCompleted", 
    header: "Exams", 
    render: (item: Record<string, unknown>) => <span className="text-sm text-foreground">{String(item.examsCompleted)}</span> 
  },
  { 
    key: "avgScore", 
    header: "Avg Score", 
    render: (item: Record<string, unknown>) => (
      <span className="text-sm font-medium text-foreground">
        {item.avgScore ? `${String(item.avgScore)}%` : 'N/A'}
      </span>
    )
  },
  {
    key: "status",
    header: "Status",
    render: (item: Record<string, unknown>) => (
      <StatusBadge label={String(item.status)} variant={item.status === "Active" ? "success" : "default"} />
    ),
  },
]

export default function InstitutionCandidatesPage() {
  const { state } = useAppStore()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`/api/institution/candidates?institutionId=${state.user?.institutionId}`)
      const data = await res.json()
      
      if (data.candidates) {
        setCandidates(data.candidates)
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    }
    setLoading(false)
  }

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <>
        <PageHeader
          title="Candidates"
          description="View and manage all registered candidates."
          breadcrumbs={[
            { label: "Dashboard", href: "/institution/dashboard" },
            { label: "Candidates" },
          ]}
        />
        <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Candidates"
        description="View and manage all registered candidates."
        breadcrumbs={[
          { label: "Dashboard", href: "/institution/dashboard" },
          { label: "Candidates" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Download className="h-3 w-3" /> Export
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No candidates found</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} />
      )}
    </>
  )
}
