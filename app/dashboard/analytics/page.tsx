"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { BotPerformanceTable } from "@/components/dashboard/bot-performance-table"
import { useAuth } from "@/hooks/use-auth"
import type { Bot } from "@/lib/types"
import { mockBots, mockAnalytics } from "@/lib/mock-data"
import { MessageSquare, Clock, Zap, Star, TrendingUp, Users } from "lucide-react"

// Extended mock analytics data for charts
const mockChartData = [
  { date: "2024-01-15", value: 15 },
  { date: "2024-01-16", value: 18 },
  { date: "2024-01-17", value: 22 },
  { date: "2024-01-18", value: 19 },
  { date: "2024-01-19", value: 25 },
  { date: "2024-01-20", value: 21 },
  { date: "2024-01-21", value: 28 },
]

const mockResponseTimeData = [
  { date: "2024-01-15", value: 750 },
  { date: "2024-01-16", value: 680 },
  { date: "2024-01-17", value: 720 },
  { date: "2024-01-18", value: 695 },
  { date: "2024-01-19", value: 710 },
  { date: "2024-01-20", value: 665 },
  { date: "2024-01-21", value: 690 },
]

const mockSatisfactionData = [
  { date: "2024-01-15", value: 4.2 },
  { date: "2024-01-16", value: 4.5 },
  { date: "2024-01-17", value: 4.3 },
  { date: "2024-01-18", value: 4.4 },
  { date: "2024-01-19", value: 4.6 },
  { date: "2024-01-20", value: 4.5 },
  { date: "2024-01-21", value: 4.7 },
]

export default function AnalyticsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("7d")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }

    // Load mock data
    const userBots = mockBots.filter((bot) => bot.user_id === user?.id)
    setBots(userBots)
  }, [user, isLoading, router])

  // Calculate aggregate metrics
  const totalConversations = mockAnalytics.reduce((sum, analytics) => sum + analytics.total_conversations, 0)
  const totalMessages = mockAnalytics.reduce((sum, analytics) => sum + analytics.total_messages, 0)
  const avgResponseTime =
    mockAnalytics.reduce((sum, analytics) => sum + analytics.avg_response_time_ms, 0) / mockAnalytics.length
  const avgSatisfaction =
    mockAnalytics.reduce((sum, analytics) => sum + analytics.user_satisfaction_score, 0) / mockAnalytics.length

  // Prepare bot performance data
  const botPerformanceData = bots.map((bot) => {
    const analytics = mockAnalytics.find((a) => a.bot_id === bot.id)
    return {
      ...bot,
      analytics: {
        total_conversations: analytics?.total_conversations || 0,
        total_messages: analytics?.total_messages || 0,
        avg_response_time_ms: analytics?.avg_response_time_ms || 0,
        user_satisfaction_score: analytics?.user_satisfaction_score || 0,
        change_conversations: Math.floor(Math.random() * 40) - 20, // Mock change data
        change_satisfaction: Math.floor(Math.random() * 20) - 10,
      },
    }
  })

  const handleViewBot = (botId: number) => {
    router.push(`/dashboard?botId=${botId}`)
  }

  if (isLoading) {
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
            </div>
          </div>

          {bots.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No analytics available</h3>
              <p className="text-muted-foreground mb-4">Create and activate bots to start seeing analytics data.</p>
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
                  data={mockChartData}
                  type="line"
                  color="hsl(var(--chart-1))"
                />
                <AnalyticsChart
                  title="Response Time Trend"
                  description="Average response time in milliseconds"
                  data={mockResponseTimeData}
                  type="bar"
                  color="hsl(var(--chart-2))"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AnalyticsChart
                  title="User Satisfaction"
                  description="Average satisfaction score over time"
                  data={mockSatisfactionData}
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

              {/* Bot Performance Table */}
              <BotPerformanceTable data={botPerformanceData} onViewBot={handleViewBot} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
