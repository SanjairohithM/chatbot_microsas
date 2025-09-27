"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bot, MoreHorizontal, Play, Pause, Settings, Trash2, ExternalLink, MessageSquare, Code } from "lucide-react"
import { WidgetExportDialog } from "@/components/dashboard/embeddable-widget"
import type { Bot as BotType } from "@/lib/types"

interface BotCardProps {
  bot: BotType
  onEdit: (bot: BotType) => void
  onDelete: (botId: number) => void
  onToggleStatus: (botId: number, status: "active" | "inactive") => void
  onChat?: (bot: BotType) => void
}

export function BotCard({ bot, onEdit, onDelete, onToggleStatus, onChat }: BotCardProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-blue-500/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                {bot.name}
              </CardTitle>
              <CardDescription className="mt-2 text-slate-600 text-sm leading-relaxed">
                {bot.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Test button for activation */}
            {bot.status === "draft" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('Test activate button clicked for bot:', bot.id)
                  onToggleStatus(bot.id, "active")
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-1" />
                Activate
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 transition-colors duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(bot)} className="hover:bg-blue-50 transition-colors duration-200">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log('Dropdown menu item clicked for bot:', bot.id, 'current status:', bot.status)
                  const newStatus = bot.status === "active" ? "inactive" : "active"
                  console.log('Setting status to:', newStatus)
                  onToggleStatus(bot.id, newStatus)
                }} className="hover:bg-blue-50 transition-colors duration-200">
                  {bot.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {bot.status === "draft" ? "Activate" : "Activate"}
                    </>
                  )}
                </DropdownMenuItem>
                {bot.status === "active" && (
                  <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)} className="hover:bg-blue-50 transition-colors duration-200">
                    <Code className="h-4 w-4 mr-2" />
                    Export Widget
                  </DropdownMenuItem>
                )}
                {bot.deployment_url && (
                  <DropdownMenuItem asChild>
                    <a href={bot.deployment_url} target="_blank" rel="noopener noreferrer" className="hover:bg-blue-50 transition-colors duration-200">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(bot.id)} className="text-red-600 hover:bg-red-50 transition-colors duration-200">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(bot.status)} px-3 py-1 rounded-full font-medium text-xs`}>
              {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
            </Badge>
            {bot.is_deployed && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1 rounded-full font-medium text-xs">
                Deployed
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-xl">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Model</p>
              <p className="font-semibold text-slate-800 mt-1">{bot.model}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Temperature</p>
              <p className="font-semibold text-slate-800 mt-1">{bot.temperature}</p>
            </div>
          </div>

          <div className="text-sm text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Created {formatDate(bot.created_at)}
          </div>
          
          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {onChat && (
              <Button 
                onClick={() => onChat(bot)} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                variant="outline"
                size="sm"
                disabled={bot.status === "draft"}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {bot.status === "draft" ? "Activate Bot to Chat" : "Chat with Bot"}
              </Button>
            )}
            
            {bot.status === "active" && (
              <Button 
                onClick={() => setIsExportDialogOpen(true)} 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                variant="default"
                size="sm"
              >
                <Code className="h-4 w-4 mr-2" />
                Export Widget
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Export Dialog */}
      <WidgetExportDialog
        bot={bot}
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </Card>
  )
}
