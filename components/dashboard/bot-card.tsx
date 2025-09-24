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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{bot.name}</CardTitle>
              <CardDescription className="mt-1">{bot.description}</CardDescription>
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
              >
                <Play className="h-4 w-4 mr-1" />
                Activate
              </Button>
            )}
            
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
                  console.log('Dropdown menu item clicked for bot:', bot.id, 'current status:', bot.status)
                  const newStatus = bot.status === "active" ? "inactive" : "active"
                  console.log('Setting status to:', newStatus)
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
                      {bot.status === "draft" ? "Activate" : "Activate"}
                    </>
                  )}
                </DropdownMenuItem>
                {bot.status === "active" && (
                  <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                    <Code className="h-4 w-4 mr-2" />
                    Export Widget
                  </DropdownMenuItem>
                )}
                {bot.deployment_url && (
                  <DropdownMenuItem asChild>
                    <a href={bot.deployment_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(bot.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(bot.status)}>
              {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
            </Badge>
            {bot.is_deployed && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Deployed
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{bot.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Temperature</p>
              <p className="font-medium">{bot.temperature}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">Created {formatDate(bot.created_at)}</div>
          
          {/* Action Buttons */}
          <div className="pt-3 space-y-2">
            {onChat && (
              <Button 
                onClick={() => onChat(bot)} 
                className="w-full"
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
                className="w-full"
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
