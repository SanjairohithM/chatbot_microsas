"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Copy, ExternalLink, MoreHorizontal, Pause, Play, Settings, Trash2 } from "lucide-react"
import type { Bot } from "@/lib/types"

interface DeploymentCardProps {
  bot: Bot
  onDeploy: (botId: number) => void
  onUndeploy: (botId: number) => void
  onCopyUrl: (url: string) => void
  onViewSettings: (botId: number) => void
}

export function DeploymentCard({ bot, onDeploy, onUndeploy, onCopyUrl, onViewSettings }: DeploymentCardProps) {
  const getStatusColor = (status: string, isDeployed: boolean) => {
    if (!isDeployed) return "bg-gray-100 text-gray-800 border-gray-200"

    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDeploymentStatus = () => {
    if (!bot.is_deployed) return "Not Deployed"
    if (bot.status === "active") return "Live"
    if (bot.status === "inactive") return "Paused"
    return "Deployed"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{bot.name}</CardTitle>
            <CardDescription className="mt-1">{bot.description}</CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewSettings(bot.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {bot.deployment_url && (
                <DropdownMenuItem onClick={() => onCopyUrl(bot.deployment_url!)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
              )}
              {bot.is_deployed ? (
                <DropdownMenuItem onClick={() => onUndeploy(bot.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Undeploy
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(bot.status, bot.is_deployed)}>{getDeploymentStatus()}</Badge>
            <div className="text-sm text-muted-foreground">{bot.model}</div>
          </div>

          {/* Deployment URL */}
          {bot.deployment_url ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Deployment URL</div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <code className="text-sm flex-1 truncate">{bot.deployment_url}</code>
                <Button variant="ghost" size="sm" onClick={() => onCopyUrl(bot.deployment_url!)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={bot.deployment_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No deployment URL available</div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {bot.is_deployed ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (bot.status === "active" ? onUndeploy(bot.id) : onDeploy(bot.id))}
                  className="flex-1"
                >
                  {bot.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onViewSettings(bot.id)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => onDeploy(bot.id)} className="flex-1" disabled={bot.status === "draft"}>
                <Play className="h-4 w-4 mr-2" />
                Deploy Bot
              </Button>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">Last updated {formatDate(bot.updated_at)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
