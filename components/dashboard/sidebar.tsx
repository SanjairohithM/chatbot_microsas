"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Bot, MessageSquare, Database, BarChart3, Settings, LogOut, Menu, X, Rocket, Key } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Bots", href: "/dashboard", icon: Bot },
  { name: "Chat & Test", href: "/dashboard/chat", icon: MessageSquare },
  // { name: "Knowledge Base", href: "/dashboard/knowledge", icon: Database },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },

  // { name: "Deployment", href: "/dashboard/deployment", icon: Rocket },
  // { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "w-64 h-full bg-black rounded-xl shadow-2xl",
          isMobileOpen ? "block" : "hidden lg:block",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <div className="space-y-1">
              <div className="flex gap-3 items-center w-full h-full">
                <Image
                  src="/Logo.png"
                  alt="Logo"
                  width={220}
                  height={60}
                  className="object-contain"
                />
              </div>
              <p className="px-8 text-sm text-gray-300">Welcome back, {user?.name}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex gap-3 items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Pro Plan Card */}
          <div className="p-4">
            <div className="p-4 text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl">
              <h3 className="mb-1 text-sm font-semibold">Pro Plan</h3>
              <p className="mb-3 text-xs text-white/80">Strengthen artificial intelligence</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">$10 / mo</span>
                <Button size="sm" className="px-3 py-1 text-xs text-orange-500 bg-white hover:bg-gray-100">
                  Get
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={signOut}
              className="justify-start w-full text-gray-300 rounded-xl transition-all duration-200 hover:bg-red-900 hover:text-red-300"
            >
              <LogOut className="mr-2 w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  )
}
