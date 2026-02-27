"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { useExamStore } from "@/lib/store/exam-store"
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Navbar() {
  const { state, dispatch } = useAppStore()
  const { isExamActive } = useExamStore()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)

  const unreadCount = state.notifications.filter((n) => !n.read).length
  const initials = state.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const handleLogout = () => {
    if (isExamActive) return
    dispatch({ type: "LOGOUT" })
    router.push("/login")
  }

  const profilePath = state.user?.role === "candidate"
    ? "/candidate/profile"
    : state.user?.role === "institution"
      ? "/institution/dashboard"
      : "/admin/dashboard"

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-card px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        aria-label="Toggle sidebar"
        disabled={isExamActive}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Link href={`/${state.user?.role || "candidate"}/dashboard`} className="flex items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="hidden font-semibold text-foreground sm:inline-block text-sm tracking-tight">ProctorAI</span>
      </Link>

      <div className="flex-1 flex items-center justify-center max-w-md mx-auto">
        {searchOpen ? (
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interviews, exams, reports..."
              className="pl-9 h-9 bg-secondary border-0 text-sm"
              autoFocus
              onBlur={() => setSearchOpen(false)}
              disabled={isExamActive}
            />
            <Button variant="ghost" size="icon" className="absolute right-0 h-9 w-9" onClick={() => setSearchOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => !isExamActive && setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/10 transition-colors w-full max-w-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExamActive}
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:inline-block">/</kbd>
          </button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="sm:hidden" 
          onClick={() => !isExamActive && setSearchOpen(true)} 
          aria-label="Search"
          disabled={isExamActive}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative" 
                      aria-label="Notifications"
                      disabled={isExamActive}
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  {!isExamActive && (
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <span className="text-sm font-medium text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })}
                            className="text-xs text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {state.notifications.map((n) => (
                          <DropdownMenuItem
                            key={n.id}
                            className="flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer"
                            onClick={() => dispatch({ type: "MARK_NOTIFICATION_READ", payload: n.id })}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-sm font-medium text-foreground">{n.title}</span>
                              {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">{n.message}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            {isExamActive && (
              <TooltipContent>
                <p className="text-xs">Navigation is disabled during an active exam</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="gap-2 px-2 h-9"
                      disabled={isExamActive}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="hidden text-sm font-medium text-foreground md:inline-block">{state.user?.name}</span>
                      <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:inline-block" />
                    </Button>
                  </DropdownMenuTrigger>
                  {!isExamActive && (
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{state.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{state.user?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{state.user?.role}</Badge>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href={profilePath} className="gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/candidate/profile" className="gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            {isExamActive && (
              <TooltipContent>
                <p className="text-xs">Navigation is disabled during an active exam</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
