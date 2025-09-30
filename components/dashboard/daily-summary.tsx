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
    <Card className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Daily Summary
                </span>
                <span className="text-gray-600 font-normal">- {formatDate(date)}</span>
                {isAllBots && (
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-sm">
                    All Bots
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                AI-powered insights and trends for this day
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSummary(false)}
              disabled={isGenerating}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
            >
              <Hash className="h-4 w-4 mr-2" />
              Keyword
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSummary(true)}
              disabled={isGenerating}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!summary ? (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <AlertCircle className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Summary Available</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Generate a daily summary to see AI-powered insights and trends for this date.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => generateSummary(false)} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Hash className="h-5 w-5 mr-2" />
                Generate with Keywords
              </Button>
              <Button 
                onClick={() => generateSummary(true)} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="h-5 w-5 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Generated: {formatTime(summary.generated_at)}</span>
                  </div>
                  <Badge className={`${summary.method === 'ai' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                  } border-0 shadow-sm`}>
                    {summary.method === 'ai' ? '🤖 AI Generated' : '🔍 Keyword Analysis'}
                  </Badge>
                </div>
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
