"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type AuthState, signIn, signUp, signOut, getCurrentUser } from "@/lib/auth"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // Check for existing session on mount
    const user = getCurrentUser()
    setState({
      user,
      isLoading: false,
      error: null,
    })
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const user = await signIn(email, password)
      setState({ user, isLoading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      }))
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string, name: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const user = await signUp(email, password, name)
      setState({ user, isLoading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }))
      throw error
    }
  }

  const handleSignOut = () => {
    signOut()
    setState({ user: null, isLoading: false, error: null })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
