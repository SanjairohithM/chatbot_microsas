"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { BotPerformanceTable } from "@/components/dashboard/bot-performance-table"
import { DailySummaryCard } from "@/components/dashboard/daily-summary"
import { useAuth } from "@/hooks/use-auth"
import type { Bot, BotAnalytics } from "@/lib/types"
import { MessageSquare, Clock, Zap, Star, TrendingUp, Users } from "lucide-react"


export default function AnalyticsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [analytics, setAnalytics] = useState<BotAnalytics[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("7d")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoadingBots, setIsLoadingBots] = useState(false)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Fetch user's bots
  const fetchBots = async () => {
    if (!user?.id) return
    
    setIsLoadingBots(true)
    try {
      const response = await fetch(`/api/bots?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setBots(data.data)
      } else {
        console.error('Failed to fetch bots:', data.error)
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
    } finally {
      setIsLoadingBots(false)
    }
  }

  // Fetch analytics for selected bot or all bots
  const fetchAnalytics = async (botId?: number) => {
    setIsLoadingAnalytics(true)
    try {
      if (botId) {
        // Fetch analytics for specific bot
        const response = await fetch(`/api/analytics/${botId}?days=${timeRange.replace('d', '')}`)
        const data = await response.json()
        
        if (data.success) {
          setAnalytics(data.data)
        } else {
          console.error('Failed to fetch analytics:', data.error)
          setAnalytics([])
        }
      } else {
        // Fetch analytics for all bots
        const allAnalytics: BotAnalytics[] = []
        for (const bot of bots) {
          try {
            const response = await fetch(`/api/analytics/${bot.id}?days=${timeRange.replace('d', '')}`)
            const data = await response.json()
            if (data.success) {
              allAnalytics.push(...data.data)
            }
          } catch (error) {
            console.error(`Failed to fetch analytics for bot ${bot.id}:`, error)
          }
        }
        setAnalytics(allAnalytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics([])
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }

    if (user?.id) {
      fetchBots()
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (selectedBotId !== "all" && selectedBotId) {
      fetchAnalytics(parseInt(selectedBotId))
    } else if (selectedBotId === "all") {
      fetchAnalytics() // Fetch all bots
    } else {
      setAnalytics([])
    }
  }, [selectedBotId, timeRange, bots])

  // Calculate aggregate metrics from real data
  const totalConversations = analytics.reduce((sum, analytics) => sum + analytics.total_conversations, 0)
  const totalMessages = analytics.reduce((sum, analytics) => sum + analytics.total_messages, 0)
  const avgResponseTime = analytics.length > 0 
    ? analytics.reduce((sum, analytics) => sum + analytics.avg_response_time_ms, 0) / analytics.length
    : 0
  const avgSatisfaction = analytics.length > 0
    ? analytics.reduce((sum, analytics) => sum + analytics.user_satisfaction_score, 0) / analytics.length
    : 0

  // Prepare bot performance data
  const botPerformanceData = bots.map((bot) => {
    const botAnalytics = analytics.filter((a) => a.bot_id === bot.id)
    const totalBotConversations = botAnalytics.reduce((sum, a) => sum + a.total_conversations, 0)
    const totalBotMessages = botAnalytics.reduce((sum, a) => sum + a.total_messages, 0)
    const avgBotResponseTime = botAnalytics.length > 0 
      ? botAnalytics.reduce((sum, a) => sum + a.avg_response_time_ms, 0) / botAnalytics.length
      : 0
    const avgBotSatisfaction = botAnalytics.length > 0
      ? botAnalytics.reduce((sum, a) => sum + a.user_satisfaction_score, 0) / botAnalytics.length
      : 0

    return {
      ...bot,
      analytics: {
        total_conversations: totalBotConversations,
        total_messages: totalBotMessages,
        avg_response_time_ms: avgBotResponseTime,
        user_satisfaction_score: avgBotSatisfaction,
        change_conversations: 0, // TODO: Calculate actual change
        change_satisfaction: 0, // TODO: Calculate actual change
      },
    }
  })

  const handleViewBot = (botId: number) => {
    router.push(`/dashboard?botId=${botId}`)
  }

  // Convert analytics data to chart format
  const getChartData = () => {
    return analytics.map(a => ({
      date: a.date,
      value: a.total_conversations
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getResponseTimeData = () => {
    return analytics.map(a => ({
      date: a.date,
      value: a.avg_response_time_ms
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getSatisfactionData = () => {
    return analytics.map(a => ({
      date: a.date,
      value: a.user_satisfaction_score
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  if (isLoading || isLoadingBots) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">Monitor your bots' performance and user engagement</p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select bot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bots</SelectItem>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id.toString()}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
          </div>

          {bots.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No bots found</h3>
              <p className="text-muted-foreground mb-4">Create your first bot to start seeing analytics data.</p>
            </div>
          ) : selectedBotId === "all" ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">All Bots Analytics</h3>
              <p className="text-muted-foreground mb-4">Viewing combined analytics and insights for all your bots.</p>
            </div>
          ) : isLoadingAnalytics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
              <p className="text-muted-foreground mb-4">This bot doesn't have any analytics data for the selected time period.</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                  title="Total Conversations"
                  value={totalConversations.toLocaleString()}
                  description="Across all bots"
                  change={12}
                  changeLabel="from last week"
                  icon={<MessageSquare className="h-4 w-4" />}
                />
                <AnalyticsCard
                  title="Total Messages"
                  value={totalMessages.toLocaleString()}
                  description="User and bot messages"
                  change={8}
                  changeLabel="from last week"
                  icon={<Users className="h-4 w-4" />}
                />
                <AnalyticsCard
                  title="Avg Response Time"
                  value={`${Math.round(avgResponseTime)}ms`}
                  description="Average across all bots"
                  change={-5}
                  changeLabel="from last week"
                  icon={<Clock className="h-4 w-4" />}
                />
                <AnalyticsCard
                  title="User Satisfaction"
                  value={`${avgSatisfaction.toFixed(1)}/5`}
                  description="Average rating"
                  change={3}
                  changeLabel="from last week"
                  icon={<Star className="h-4 w-4" />}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AnalyticsChart
                  title="Conversations Over Time"
                  description="Daily conversation volume"
                  data={getChartData()}
                  type="line"
                  color="hsl(var(--chart-1))"
                />
                <AnalyticsChart
                  title="Response Time Trend"
                  description="Average response time in milliseconds"
                  data={getResponseTimeData()}
                  type="bar"
                  color="hsl(var(--chart-2))"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AnalyticsChart
                  title="User Satisfaction"
                  description="Average satisfaction score over time"
                  data={getSatisfactionData()}
                  type="line"
                  color="hsl(var(--chart-3))"
                />
                <div className="flex items-center justify-center bg-card rounded-lg border border-border p-8">
                  <div className="text-center">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">More Charts Coming Soon</h3>
                    <p className="text-muted-foreground">Additional analytics and insights will be available here.</p>
                  </div>
                </div>
              </div>

              {/* Daily Summary Section */}
              <div className="mb-8">
                <DailySummaryCard 
                  botId={selectedBotId === "all" ? 0 : parseInt(selectedBotId)} 
                  date={selectedDate}
                  isAllBots={selectedBotId === "all"}
                />
              </div>

              {/* Bot Performance Table */}
              <BotPerformanceTable data={botPerformanceData} onViewBot={handleViewBot} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
