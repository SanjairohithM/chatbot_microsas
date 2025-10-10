"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Bot, Search, Plus } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  onCreateBotClick?: () => void
}

export function DashboardLayout({ children, onCreateBotClick }: DashboardLayoutProps) {

  return (
    <div className="h-screen bg-gray-50 overflow-hidden p-4">
      <div className="flex h-full gap-4">
        <Sidebar />

        <div className="flex-1">
        {/* Global Top Navigation Bar - Sticky */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900"> AI Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bots..."
                  className="pl-10 pr-4 py-2 w-64 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {onCreateBotClick && (
                <Button 
                  onClick={onCreateBotClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bot
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-b-2xl shadow-2xl p-8 h-[calc(100vh-120px)] overflow-y-auto">
          {children}
        </div>
        </div>
      </div>

    </div>
  )
}
