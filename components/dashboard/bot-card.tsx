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
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
      case "inactive":
        return "bg-muted text-muted-foreground border-border"
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
      default:
        return "bg-muted text-muted-foreground border-border"
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
    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border shadow-lg hover:shadow-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-200">
                {bot.name}
              </CardTitle>
              <CardDescription className="mt-2 text-muted-foreground text-sm leading-relaxed">
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
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-1" />
                Activate
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-accent transition-colors duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm border border-border shadow-xl rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(bot)} className="hover:bg-accent transition-colors duration-200">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log('Dropdown menu item clicked for bot:', bot.id, 'current status:', bot.status)
                  const newStatus = bot.status === "active" ? "inactive" : "active"
                  console.log('Setting status to:', newStatus)
                  onToggleStatus(bot.id, newStatus)
                }} className="hover:bg-accent transition-colors duration-200">
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
                  <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)} className="hover:bg-accent transition-colors duration-200">
                    <Code className="h-4 w-4 mr-2" />
                    Export Widget
                  </DropdownMenuItem>
                )}
                {bot.deployment_url && (
                  <DropdownMenuItem asChild>
                    <a href={bot.deployment_url} target="_blank" rel="noopener noreferrer" className="hover:bg-accent transition-colors duration-200">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(bot.id)} className="text-destructive hover:bg-destructive/10 transition-colors duration-200">
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
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800 dark:bg-emerald-900/20 px-3 py-1 rounded-full font-medium text-xs">
                Deployed
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Model</p>
              <p className="font-semibold text-card-foreground mt-1">{bot.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Temperature</p>
              <p className="font-semibold text-card-foreground mt-1">{bot.temperature}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Created {formatDate(bot.created_at)}
          </div>
          
          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {onChat && (
              <Button 
                onClick={() => onChat(bot)} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                variant="default"
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
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
