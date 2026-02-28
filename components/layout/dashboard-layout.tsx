"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Navbar } from "./navbar"
import { AppSidebar } from "./sidebar"
import { LargeNameFooter } from "@/components/ui/large-name-footer"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (state.hydrated && !state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.hydrated, state.isAuthenticated, router])

  if (!state.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!state.isAuthenticated) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <AppSidebar />
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            state.sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
          )}
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
          <LargeNameFooter />
        </main>
      </div>
    </div>
  )
}
