"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

export interface User {
  id: number | string
  email: string
  name: string
  created_at?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const value = useMemo<AuthContextType>(() => {
    const sessionUser = session?.user as any
    const user: User | null = sessionUser
      ? {
          id: sessionUser.id ?? sessionUser.email,
          email: sessionUser.email,
          name: sessionUser.name ?? "User",
        }
      : null

    return {
      user,
      isLoading: status === "loading",
      error: null,
      signIn: async (email: string, password: string) => {
        const res = await nextAuthSignIn("credentials", {
          redirect: false,
          email,
          password,
        })
        if (res?.error) {
          throw new Error(res.error)
        }
      },
      signUp: async (email: string, password: string, name: string) => {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Sign up failed')
        }
        const res = await nextAuthSignIn("credentials", {
          redirect: false,
          email,
          password,
        })
        if (res?.error) {
          throw new Error(res.error)
        }
      },
      signOut: () => {
        nextAuthSignOut({ redirect: true, callbackUrl: "/auth" })
      },
    }
  }, [session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
