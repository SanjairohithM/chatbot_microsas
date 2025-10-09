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
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 w-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                {bot.name}
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                {bot.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MODEL</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{bot.model}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">RESPONSE MODE</p>
              <div className="flex items-center gap-2 min-w-0">
                {bot.interaction_mode === 'voice' ? (
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                )}
                <p className="text-sm font-semibold text-gray-900 capitalize truncate">
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
            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
            <span className="truncate">Created {formatDate(bot.created_at)}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Draft Activation Button */}
            {bot.status === "draft" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-2"
              >
                <Play className="h-3 w-3 mr-1" />
                <span className="truncate">Activate</span>
              </Button>
            )}
            
            {bot.status === "inactive" && (
              <Button 
                onClick={() => onToggleStatus(bot.id, "active")}
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-2"
              >
                <Play className="h-3 w-3 mr-1" />
                <span className="truncate">Activate</span>
              </Button>
            )}
            
            {onChat && bot.status !== "draft" && (
              <Button 
                onClick={() => onChat(bot)} 
                className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-2"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                <span className="truncate">Chat</span>
              </Button>
            )}
            
            {bot.status === "active" && (
              <>
                <Button 
                  onClick={() => setIsUrlScraperOpen(true)} 
                  className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-2"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  <span className="truncate">Scrape</span>
                </Button>
                <Button 
                  onClick={() => setIsExportDialogOpen(true)} 
                  className="flex-1 min-w-[120px] bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-2 border border-gray-300"
                  variant="outline"
                >
                  <Code className="h-3 w-3 mr-1" />
                  <span className="truncate">Export</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Scrape URLs for {bot.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUrlScraperOpen(false)}
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
