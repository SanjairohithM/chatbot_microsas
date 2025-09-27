"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, RefreshCw, Calendar, Brain, Hash } from "lucide-react"
import { DailySummary } from "@/lib/types"

interface DailySummaryProps {
  botId: number
  date: string
  isAllBots?: boolean
}

interface DailySummaryData {
  botId: number
  date: string
  issues: string[]
  trends: Record<string, number>
  generated_at: string
  method: 'keyword' | 'ai'
}

export function DailySummaryCard({ botId, date, isAllBots = false }: DailySummaryProps) {
  const [summary, setSummary] = useState<DailySummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchSummary = async () => {
    setIsLoading(true)
    try {
      if (isAllBots) {
        // For all bots, generate a combined summary
        const response = await fetch(`/api/analytics/all/daily-summary?date=${date}`)
        const data = await response.json()
        
        if (data.success) {
          setSummary(data.data)
        } else {
          // If no summary exists, auto-generate one
          await generateSummary(false)
        }
      } else {
        const response = await fetch(`/api/analytics/${botId}/daily-summary?date=${date}`)
        const data = await response.json()
        
        if (data.success) {
          setSummary(data.data)
        } else {
          // If no summary exists, auto-generate one
          await generateSummary(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch daily summary:', error)
      // Try to generate a summary if fetching fails
      await generateSummary(false)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = async (useAI: boolean = true) => {
    setIsGenerating(true)
    try {
      const url = isAllBots 
        ? `/api/analytics/all/daily-summary?date=${date}&useAI=${useAI}`
        : `/api/analytics/${botId}/daily-summary?date=${date}&useAI=${useAI}`
        
      const response = await fetch(url, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setSummary(data.data)
      }
    } catch (error) {
      console.error('Failed to generate daily summary:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [botId, date])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Summary - {formatDate(date)}
          </CardTitle>
          <CardDescription>Loading daily insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Summary - {formatDate(date)}
              {isAllBots && <Badge variant="secondary">All Bots</Badge>}
            </CardTitle>
            <CardDescription>
              AI-powered insights and trends for this day
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSummary(false)}
              disabled={isGenerating}
            >
              <Hash className="h-4 w-4 mr-2" />
              Keyword
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSummary(true)}
              disabled={isGenerating}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Summary Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate a daily summary to see insights and trends for this date.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => generateSummary(false)} disabled={isGenerating}>
                <Hash className="h-4 w-4 mr-2" />
                Generate with Keywords
              </Button>
              <Button onClick={() => generateSummary(true)} disabled={isGenerating}>
                <Brain className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Generated: {formatTime(summary.generated_at)}</span>
                <Badge variant={summary.method === 'ai' ? 'default' : 'secondary'}>
                  {summary.method === 'ai' ? 'AI Generated' : 'Keyword Analysis'}
                </Badge>
              </div>
            </div>

            {/* Issues Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Issues Detected ({summary.issues.length})
              </h4>
              {summary.issues.length > 0 ? (
                <ul className="space-y-2">
                  {summary.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-1">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No issues detected for this day.</p>
              )}
            </div>

            {/* Trends Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trends & Topics ({Object.keys(summary.trends).length})
              </h4>
              {Object.keys(summary.trends).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(summary.trends)
                    .sort(([,a], [,b]) => b - a)
                    .map(([trend, count]) => (
                      <div
                        key={trend}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm font-medium capitalize">
                          {trend.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No trends detected for this day.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
