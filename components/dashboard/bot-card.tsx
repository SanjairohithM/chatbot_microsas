"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bot, MoreHorizontal, Play, Pause, Settings, Trash2, ExternalLink, MessageSquare, Code, Volume2, MessageCircle } from "lucide-react"
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
        return "bg-red-100 text-red-800 border-red-200"
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
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {bot.name}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                {bot.description}
              </CardDescription>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(bot)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const newStatus = bot.status === "active" ? "inactive" : "active"
                  onToggleStatus(bot.id, newStatus)
                }}>
                  {bot.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                {bot.status === "active" && (
                  <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                    <Code className="h-4 w-4 mr-2" />
                    Export Widget
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(bot.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Status and Last Active */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(bot.status)} px-2 py-1 text-xs font-medium`}>
                {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
              </Badge>
              {/* <span className="text-xs text-gray-500">2 minutes ago</span> */}
            </div>
          </div>

          {/* Bot Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MODEL</p>
              <p className="text-sm font-semibold text-gray-900">{bot.model}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">RESPONSE MODE</p>
              <div className="flex items-center gap-2">
                {bot.interaction_mode === 'voice' ? (
                  <Volume2 className="h-4 w-4 text-blue-600" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-green-600" />
                )}
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {bot.interaction_mode}
                </p>
              </div>
            </div>
            {/* <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CONVERSATIONS</p>
              <p className="text-sm font-semibold text-gray-900">1,247</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SUCCESS RATE</p>
              <p className="text-sm font-semibold text-green-600">94%</p>
            </div> */}
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Created {formatDate(bot.created_at)}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {/* Draft Activation Button */}
            {bot.status === "draft" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate Bot
              </Button>
            )}
            
            {/* Inactive Bot Activation Button */}
            {bot.status === "inactive" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate
              </Button>
            )}
            
            {/* Chat with Bot Button - only show for non-draft bots */}
            {onChat && bot.status !== "draft" && (
              <Button 
                onClick={() => onChat(bot)} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Bot
              </Button>
            )}
            
            {bot.status === "active" && (
              <Button 
                onClick={() => setIsExportDialogOpen(true)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2"
                variant="outline"
              >
                <Code className="h-4 w-4 mr-2" />
                Export
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
