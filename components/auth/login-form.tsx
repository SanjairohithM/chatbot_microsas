"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Separator } from "@/components/ui/separator"
import { signIn as nextAuthSignIn } from "next-auth/react"

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Full Background Image with Slanting */}
      <div className="absolute inset-0">
        <img 
          src="/images/loginrobo.jpg" 
          alt="AI Chatbot Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10"></div>
      </div>

      {/* Slanting Effect */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-white transform skew-x-12 -translate-x-16 z-10"></div>

      {/* Card Container */}
      <div className="relative z-20 h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
          <div className="flex h-[600px]">
            {/* Left Panel - Background Image Section */}
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src="/images/loginrobo.jpg" 
                  alt="AI Chatbot Background" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20"></div>
              </div>

              {/* Slanting Effect inside card */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-white transform skew-x-12 -translate-x-4 z-10"></div>

              {/* Content */}
              <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Selected Works</h2>
                    <p className="text-white/70">AI-Powered Solutions</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors text-sm">
                      Sign Up
                    </button>
                    <button className="px-3 py-2 bg-white text-slate-900 rounded-full hover:bg-white/90 transition-colors text-sm">
                      Join Us
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">AI</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">ChatBot.AI</p>
                      <p className="text-white/70 text-sm">AI & Automation</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      ←
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className="flex-1 lg:w-3/5 flex items-center justify-center p-6 bg-white">
              <div className="w-full max-w-sm">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-900">CHATBOT.AI</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>EN</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Hi Designer.</h2>
                    <p className="text-slate-600">Welcome to CHATBOT.AI.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
                      placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
                      className="h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
            />
          </div>

          <div className="space-y-2">
                    <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                      <button type="button" className="text-sm text-orange-500 hover:text-orange-600">
                        Forgot password?
                      </button>
                    </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                      className="h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
            />
          </div>

                  <div className="my-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-slate-500">or</span>
                      </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
                    className="w-full h-12 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 rounded-lg mb-4"
            onClick={() => nextAuthSignIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.28-3.28C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
                    Login with Google G
                  </Button>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Login"}
          </Button>
                </form>

                <div className="mt-4 text-center text-sm">
          <span className="text-slate-600">Don't have an account? </span>
                  <button type="button" onClick={onToggleMode} className="text-slate-900 hover:text-slate-700 font-medium hover:underline">
            Sign up
          </button>
        </div>

                <div className="mt-6 flex justify-center gap-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors">
                    <span className="text-slate-600 text-sm font-bold">f</span>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors">
                    <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors">
                    <span className="text-slate-600 text-sm font-bold">in</span>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors">
                    <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
  )
}
