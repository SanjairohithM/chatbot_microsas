"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import type { Bot } from "@/lib/types"

interface BotPerformanceData extends Bot {
  analytics: {
    total_conversations: number
    total_messages: number
    avg_response_time_ms: number
    user_satisfaction_score: number
    change_conversations: number
    change_satisfaction: number
  }
}

interface BotPerformanceTableProps {
  data: BotPerformanceData[]
  onViewBot: (botId: number) => void
}

export function BotPerformanceTable({ data, onViewBot }: BotPerformanceTableProps) {
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
    return null
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot Performance</CardTitle>
        <CardDescription>Compare performance metrics across all your bots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Avg Response</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bot.name}</div>
                      <div className="text-sm text-muted-foreground">{bot.model}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(bot.status)}>
                      {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bot.analytics.total_conversations}</span>
                      {bot.analytics.change_conversations !== 0 && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bot.analytics.change_conversations)}
                          <span className={`text-xs ${getTrendColor(bot.analytics.change_conversations)}`}>
                            {bot.analytics.change_conversations > 0 ? "+" : ""}
                            {bot.analytics.change_conversations}%
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{bot.analytics.total_messages}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatResponseTime(bot.analytics.avg_response_time_ms)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bot.analytics.user_satisfaction_score.toFixed(1)}/5</span>
                      {bot.analytics.change_satisfaction !== 0 && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bot.analytics.change_satisfaction)}
                          <span className={`text-xs ${getTrendColor(bot.analytics.change_satisfaction)}`}>
                            {bot.analytics.change_satisfaction > 0 ? "+" : ""}
                            {bot.analytics.change_satisfaction}%
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onViewBot(bot.id)}>
                        View
                      </Button>
                      {bot.deployment_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={bot.deployment_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
