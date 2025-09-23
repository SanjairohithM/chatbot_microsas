import { NextRequest, NextResponse } from 'next/server'
import { ServerAnalyticsService } from '@/lib/server-database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const analytics = await ServerAnalyticsService.getBotAnalytics(parseInt(params.id), days)

    return NextResponse.json({
      success: true,
      data: analytics,
    })

  } catch (error) {
    console.error('Get analytics error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
