"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { useAuth } from "@/hooks/use-auth"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams?.get("error")

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* Left side - Image */}
      <div className="hidden lg:block relative h-full">
        <img 
          src="/images/loginrobo.jpg" 
          alt="AI Chatbot" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Right side - Form */}
      <div className="flex items-center justify-center bg-white h-full px-12">
        <div className="w-full max-w-sm">
          {errorParam && (
            <div className="mb-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
              {errorParam === "OAuthAccountNotLinked" && (
                <span>This email is already linked with a different sign-in method.</span>
              )}
              {errorParam !== "OAuthAccountNotLinked" && (
                <span>Google sign-in error: {errorParam}</span>
              )}
            </div>
          )}
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
