import { NextRequest, NextResponse } from 'next/server'
import { ServerAnalyticsService } from '@/lib/server-database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const botId = parseInt(params.id)
    if (isNaN(botId)) {
      return NextResponse.json(
        { error: 'Invalid bot ID' },
        { status: 400 }
      )
    }

    const dailySummary = await ServerAnalyticsService.generateDailySummary(
      botId, 
      date, 
      useAI
    )

    if (!dailySummary) {
      return NextResponse.json(
        { 
          success: true,
          message: 'No messages found for the specified date',
          data: null
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: dailySummary,
    })

  } catch (error) {
    console.error('Generate daily summary error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate daily summary',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const botId = parseInt(params.id)
    if (isNaN(botId)) {
      return NextResponse.json(
        { error: 'Invalid bot ID' },
        { status: 400 }
      )
    }

    // Get analytics for the specific date
    const analytics = await ServerAnalyticsService.getBotAnalytics(botId, 1)
    const targetDate = new Date(date).toISOString().split('T')[0]
    const dailyData = analytics.find(a => a.date === targetDate)

    if (!dailyData || !dailyData.daily_summary) {
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
        botId: dailyData.bot_id,
        date: dailyData.date,
        issues: dailyData.daily_summary.issues,
        trends: dailyData.daily_summary.trends,
        generated_at: dailyData.daily_summary.generated_at,
        method: dailyData.daily_summary.method
      }
    })

  } catch (error) {
    console.error('Get daily summary error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch daily summary',
      },
      { status: 500 }
    )
  }
}
