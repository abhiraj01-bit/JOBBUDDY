"use client"

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react"
import type { User, UserRole, Notification } from "./types"
import { mockUsers, mockNotifications } from "./mock-data"

interface AppState {
  user: User | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  notifications: Notification[]
  hydrated: boolean
}

type AppAction =
  | { type: "LOGIN"; payload: { role: UserRole; user: User } }
  | { type: "LOGOUT" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "HYDRATE"; payload: { role: UserRole; user: User } }
  | { type: "HYDRATE_ONLY" }

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  sidebarCollapsed: false,
  notifications: mockNotifications,
  hydrated: false,
}

function persistUser(user: User | null) {
  try {
    if (user) {
      sessionStorage.setItem("proctorai_user", JSON.stringify(user))
    } else {
      sessionStorage.removeItem("proctorai_user")
    }
  } catch {}
}

function getPersistedUser(): User | null {
  try {
    const userData = sessionStorage.getItem("proctorai_user")
    if (userData) return JSON.parse(userData)
  } catch {}
  return null
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOGIN": {
      persistUser(action.payload.user)
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        hydrated: true,
      }
    }
    case "LOGOUT": {
      persistUser(null)
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      }
    }
    case "HYDRATE": {
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        hydrated: true,
      }
    }
    case "HYDRATE_ONLY":
      return {
        ...state,
        hydrated: true,
      }
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      }
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      }
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const user = getPersistedUser()
    if (user) {
      dispatch({ type: "HYDRATE", payload: { role: user.role, user } })
    } else {
      dispatch({ type: "HYDRATE_ONLY" })
    }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppStore must be used within AppProvider")
  return context
}
