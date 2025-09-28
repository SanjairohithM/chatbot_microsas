import { NextRequest, NextResponse } from 'next/server'
import { ServerAnalyticsService } from '@/lib/server-database'
import { DailySummaryService } from '@/lib/services/daily-summary.service'

export async function POST(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const useAI = searchParams.get('useAI') !== 'false' // Default to true
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Get all analytics for the date across all bots
    const allAnalytics = await ServerAnalyticsService.getBotAnalytics(0, 1) // Get all bots
    const targetDate = new Date(date).toISOString().split('T')[0]
    const dailyData = allAnalytics.filter(a => a.date === targetDate)

    if (dailyData.length === 0) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No analytics data found for the specified date',
          data: null
        }
      )
    }

    // Get all messages for all bots on this date
    const allMessages: string[] = []
    for (const analytics of dailyData) {
      const messages = await ServerAnalyticsService.getMessagesForDate(analytics.bot_id, date)
      allMessages.push(...messages)
    }

    if (allMessages.length === 0) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No messages found for the specified date',
          data: null
        }
      )
    }

    // Generate combined summary
    const dailySummary = await DailySummaryService.generateDailySummary(allMessages, useAI)

    return NextResponse.json({
      success: true,
      data: {
        botId: 0, // 0 represents all bots
        date: targetDate,
        issues: dailySummary.issues,
        trends: dailySummary.trends,
        generated_at: dailySummary.generated_at,
        method: dailySummary.method
      }
    })

  } catch (error) {
    console.error('Generate all bots daily summary error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate daily summary',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Get all analytics for the date across all bots
    const allAnalytics = await ServerAnalyticsService.getBotAnalytics(0, 1) // Get all bots
    const targetDate = new Date(date).toISOString().split('T')[0]
    const dailyData = allAnalytics.filter(a => a.date === targetDate)

    if (dailyData.length === 0) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No analytics data found for the specified date',
          data: null
        }
      )
    }

    // Check if any of the daily data has a summary
    const summaryData = dailyData.find(a => a.daily_summary)
    
    if (!summaryData || !summaryData.daily_summary) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No daily summary found for the specified date',
          data: null
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        botId: 0, // 0 represents all bots
        date: targetDate,
        issues: summaryData.daily_summary.issues,
        trends: summaryData.daily_summary.trends,
        generated_at: summaryData.daily_summary.generated_at,
        method: summaryData.daily_summary.method
      }
    })

  } catch (error) {
    console.error('Get all bots daily summary error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch daily summary',
      },
      { status: 500 }
    )
  }
}
