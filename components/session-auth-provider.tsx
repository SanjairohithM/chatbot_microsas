"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/hooks/use-auth"

export function SessionAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  )
}


