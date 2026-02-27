"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  UserCircle,
  BookOpen,
  Users,
  ShieldCheck,
  Activity,
  ScrollText,
  PanelLeftClose,
  PanelLeft,
  Sliders,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const candidateNav: NavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Exams", href: "/candidate/exams", icon: BookOpen },
  { label: "Reports", href: "/candidate/reports", icon: BarChart3 },
  { label: "Profile", href: "/candidate/profile", icon: UserCircle },
]

const institutionNav: NavItem[] = [
  { label: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
  { label: "Exams", href: "/institution/exams", icon: BookOpen },
  { label: "Candidates", href: "/institution/candidates", icon: Users },
  { label: "Reports", href: "/institution/reports", icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "AI Controls", href: "/admin/ai-controls", icon: Sliders },
  { label: "Risk Settings", href: "/admin/risk-settings", icon: ShieldCheck },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
]

function getNavItems(role: string | undefined): NavItem[] {
  switch (role) {
    case "institution":
      return institutionNav
    case "admin":
      return adminNav
    default:
      return candidateNav
  }
}

export function AppSidebar() {
  const { state, dispatch } = useAppStore()
  const pathname = usePathname()
  const navItems = getNavItems(state.user?.role)
  const collapsed = state.sidebarCollapsed

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-60",
          "max-lg:-translate-x-full max-lg:w-60",
          !collapsed && "max-lg:translate-x-0"
        )}
      >
        <nav className="flex-1 space-y-1 px-2 py-3" role="navigation" aria-label="Main navigation">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </TooltipProvider>
        </nav>

        <div className="hidden border-t border-border p-2 lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">System Online</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
