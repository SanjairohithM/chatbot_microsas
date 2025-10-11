"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bot, MoreHorizontal, Play, Pause, Settings, Trash2, ExternalLink, MessageSquare, Code, Volume2, MessageCircle, Globe } from "lucide-react"
import { WidgetExportDialog } from "@/components/dashboard/embeddable-widget"
import { UrlScraper } from "@/components/dashboard/url-scraper"
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
  const [isUrlScraperOpen, setIsUrlScraperOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "inactive":
        return "bg-gray-50 text-gray-500 border-gray-200"
      case "draft":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const getHoverBorderColor = (status: string) => {
    switch (status) {
      case "active":
        return "hover:border-green-400"
      case "draft":
        return "hover:border-blue-400"
      case "inactive":
        return "hover:border-gray-400"
      default:
        return "hover:border-gray-400"
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
    <Card className={`bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full min-w-0 max-w-full overflow-hidden ${getHoverBorderColor(bot.status)}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="p-3 bg-slate-100 rounded-lg flex-shrink-0 border border-slate-200">
              <Bot className="h-6 w-6 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {bot.name}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm line-clamp-2">
                {bot.description}
              </CardDescription>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 focus:bg-gray-100"
                  aria-label="Bot options"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Edit bot clicked:', bot.id)
                    onEdit(bot)
                    setIsDropdownOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Bot
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    const newStatus = bot.status === "active" ? "inactive" : "active"
                    onToggleStatus(bot.id, newStatus)
                  }}
                  className="cursor-pointer"
                >
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
                  <DropdownMenuItem 
                    onClick={() => setIsExportDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Export Widget
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Delete bot clicked from dropdown:', bot.id)
                    onDelete(bot.id)
                    setIsDropdownOpen(false)
                  }} 
                  className="text-red-600 cursor-pointer hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Bot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status and Details Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(bot.status)} px-3 py-1 text-sm font-medium`}>
                {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Model:</span>
                  <span className="font-semibold text-gray-900">{bot.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Mode:</span>
                  <div className="flex items-center gap-1">
                    {bot.interaction_mode === 'voice' ? (
                      <Volume2 className="h-4 w-4 text-slate-600" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="font-semibold text-gray-900 capitalize">{bot.interaction_mode}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
              <span>Created {formatDate(bot.created_at)}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {/* Draft Activation Button */}
            {bot.status === "draft" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="bg-slate-700 hover:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 text-white text-sm py-2 px-4"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate Bot
              </Button>
            )}
            
            {bot.status === "inactive" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="bg-slate-700 hover:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 text-white text-sm py-2 px-4"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate Bot
              </Button>
            )}
            
            {onChat && bot.status !== "draft" && (
              <Button 
                onClick={() => onChat(bot)} 
                className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 text-white text-sm py-2 px-4"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            )}
            
            {bot.status === "active" && (
              <>
                <Button 
                  onClick={() => setIsUrlScraperOpen(true)} 
                  className="bg-slate-600 hover:bg-slate-700 shadow-sm hover:shadow-md transition-all duration-200 text-white text-sm py-2 px-4"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Scrape URLs
                </Button>
                <Button 
                  onClick={() => setIsExportDialogOpen(true)} 
                  className="bg-white hover:bg-slate-50 text-slate-700 text-sm py-2 px-4 border border-slate-300 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200"
                  variant="outline"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Export Widget
                </Button>
              </>
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
      
      {/* URL Scraper Dialog */}
      {isUrlScraperOpen && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Scrape URLs for {bot.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUrlScraperOpen(false)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>
              <UrlScraper
                botId={bot.id}
                onScrapingComplete={(results) => {
                  console.log('Scraping completed:', results);
                  setIsUrlScraperOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      
    </Card>
  )
}
