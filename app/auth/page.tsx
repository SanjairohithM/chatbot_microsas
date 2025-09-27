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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-slate-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left side - Image */}
      <div className="hidden lg:block relative h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 z-10"></div>
        <img 
          src="/images/loginrobo.jpg" 
          alt="AI Chatbot" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-20"></div>
        <div className="absolute bottom-8 left-8 right-8 z-30 text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome to AI Dashboard</h2>
          <p className="text-lg opacity-90">Build, deploy, and manage intelligent chatbots with ease</p>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex items-center justify-center h-full px-8 lg:px-12">
        <div className="w-full max-w-md">
          {errorParam && (
            <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 shadow-sm">
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
