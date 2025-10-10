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
import { MessageSquare, Clock, Zap, Star, TrendingUp, Users, BarChart3, Calendar } from "lucide-react"


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

  // Listen for custom event from layout to open create bot dialog
  useEffect(() => {
    const handleOpenCreateBotDialog = () => {
      // Navigate to dashboard page to create bot
      router.push("/dashboard")
    }

    window.addEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    
    return () => {
      window.removeEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    }
  }, [router])

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

  // Convert analytics data to chart format - only real data
  const getChartData = () => {
    return analytics
      .filter(a => a.total_conversations > 0)
      .map(a => ({
      date: a.date,
      value: a.total_conversations
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getResponseTimeData = () => {
    return analytics
      .filter(a => a.avg_response_time_ms && a.avg_response_time_ms > 0)
      .map(a => ({
      date: a.date,
        value: a.avg_response_time_ms || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getSatisfactionData = () => {
    return analytics
      .filter(a => a.user_satisfaction_score && a.user_satisfaction_score > 0)
      .map(a => ({
      date: a.date,
        value: a.user_satisfaction_score || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
    <div className="relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10">
        {/* Analytics Controls */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
            <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Analytics</h1>
                  <p className="text-sm text-gray-500">Performance insights & metrics</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                <SelectTrigger className="w-48 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                <SelectTrigger className="w-32 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 w-40 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
              </div>
            </div>
          </div>
        </div>

          {bots.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-blue-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">No bots found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Create your first bot to start seeing analytics data.</p>
            </div>
          ) : selectedBotId === "all" ? (
            <div className="text-center py-16">
              <div className="p-6 bg-blue-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">All Bots Analytics</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Viewing combined analytics and insights for all your bots.</p>
            </div>
          ) : isLoadingAnalytics ? (
            <div className="text-center py-16">
              <div className="p-6 bg-blue-100 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
              <p className="text-gray-600 text-lg">Loading analytics data...</p>
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-blue-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">No analytics data available</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">This bot doesn't have any analytics data for the selected time period.</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Conversations</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2 group-hover:text-blue-800 transition-colors">
                        {totalConversations.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Across all bots</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <MessageSquare className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-3/4"></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Messages</p>
                      <p className="text-3xl font-bold text-green-900 mt-2 group-hover:text-green-800 transition-colors">
                        {totalMessages.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 mt-1">User and bot messages</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Users className="h-7 w-7 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full w-4/5"></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Avg Response Time</p>
                      <p className="text-3xl font-bold text-amber-900 mt-2 group-hover:text-amber-800 transition-colors">
                        {avgResponseTime > 0 ? `${Math.round(avgResponseTime)}ms` : 'N/A'}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">Average across all bots</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Clock className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full w-2/3"></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">User Satisfaction</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2 group-hover:text-purple-800 transition-colors">
                        {avgSatisfaction > 0 ? `${avgSatisfaction.toFixed(1)}/5` : 'N/A'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Average rating</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Star className="h-7 w-7 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-4/5"></div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {getChartData().length > 0 ? (
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6 border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Conversations Over Time</h3>
                          <p className="text-gray-600 mt-1">Daily conversation volume</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-900">
                              {getChartData().reduce((sum, item) => sum + item.value, 0)}
                            </div>
                            <div className="text-sm text-blue-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                <AnalyticsChart
                        title=""
                        description=""
                  data={getChartData()}
                  type="line"
                  color="hsl(var(--chart-1))"
                        className="border-0 h-80"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="text-center">
                      <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversation Data</h3>
                      <p className="text-gray-500">No conversations recorded for the selected time period.</p>
                    </div>
                  </div>
                )}
                
                {getResponseTimeData().length > 0 ? (
                  <div className="bg-gradient-to-br from-white to-green-50 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6 border-b border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Response Time Trend</h3>
                          <p className="text-gray-600 mt-1">Average response time in milliseconds</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-900">
                              {Math.round(getResponseTimeData().reduce((sum, item) => sum + item.value, 0) / getResponseTimeData().length)}ms
                            </div>
                            <div className="text-sm text-green-600">Average</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                <AnalyticsChart
                        title=""
                        description=""
                  data={getResponseTimeData()}
                  type="bar"
                  color="hsl(var(--chart-2))"
                        className="border-0 h-80"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="text-center">
                      <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
                        <Clock className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Response Time Data</h3>
                      <p className="text-gray-500">No response time data available for the selected time period.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {getSatisfactionData().length > 0 ? (
                  <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6 border-b border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">User Satisfaction</h3>
                          <p className="text-gray-600 mt-1">Average satisfaction score over time</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Star className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-900">
                              {(getSatisfactionData().reduce((sum, item) => sum + item.value, 0) / getSatisfactionData().length).toFixed(1)}/5
                            </div>
                            <div className="text-sm text-purple-600">Average</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                <AnalyticsChart
                        title=""
                        description=""
                  data={getSatisfactionData()}
                  type="line"
                  color="hsl(var(--chart-3))"
                        className="border-0 h-80"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="text-center">
                      <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
                        <Star className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Satisfaction Data</h3>
                      <p className="text-gray-500">No user satisfaction ratings available for the selected time period.</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 p-8 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="text-center">
                    <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                      <Zap className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">More Analytics Coming Soon</h3>
                    <p className="text-indigo-600">Additional analytics and insights will be available here.</p>
                    <div className="mt-4 flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Summary Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                <DailySummaryCard 
                  botId={selectedBotId === "all" ? 0 : parseInt(selectedBotId)} 
                  date={selectedDate}
                  isAllBots={selectedBotId === "all"}
                />
                </div>
              </div>

              {/* Bot Performance Table */}
              <div className="mb-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Bot Performance</h2>
                  </div>
                  <p className="text-gray-600 ml-11">Compare performance metrics across all your bots</p>
                </div>
                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
              <BotPerformanceTable data={botPerformanceData} onViewBot={handleViewBot} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
 
  )
}
