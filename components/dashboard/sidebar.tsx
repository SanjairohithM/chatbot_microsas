"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Bot, MessageSquare, Database, BarChart3, Settings, LogOut, Menu, X, Rocket, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Bots", href: "/dashboard", icon: Bot },
  { name: "Chat & Test", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Integrations", href: "/dashboard/integrations", icon: Globe },
  // { name: "Knowledge Base", href: "/dashboard/knowledge", icon: Database },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
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
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "w-64 bg-white border border-gray-200 rounded-xl shadow-2xl h-full",
          isMobileOpen ? "block" : "hidden lg:block",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <div className="space-y-1">
              <div className="flex items-center gap-3 w-full h-full">
                <Image
                  src="/Logo.png"
                  alt="Logo"
                  width={220}
                  height={60}
                  className="object-contain"
                />
              </div>
              <p className="px-8 text-sm text-gray-600">Welcome back, {user?.name}</p>
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Pro Plan Card */}
          <div className="p-4">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-4 text-white">
              <h3 className="font-semibold text-sm mb-1">Pro Plan</h3>
              <p className="text-xs text-white/80 mb-3">Strengthen artificial intelligence</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">$10 / mo</span>
                <Button size="sm" className="bg-white text-orange-500 hover:bg-gray-100 text-xs px-3 py-1">
                  Get
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
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
