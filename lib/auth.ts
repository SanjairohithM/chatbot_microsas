// Authentication utilities and types
export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export async function signIn(email: string, password: string): Promise<User> {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Sign in failed')
  }

  // Store in localStorage for demo purposes
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(data.user))
  }
  return data.user
}

export async function signUp(email: string, password: string, name: string): Promise<User> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Sign up failed')
  }

  // Store in localStorage for demo purposes
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(data.user))
  }
  return data.user
}

export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_user")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("auth_user")
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}
