import { NextRequest, NextResponse } from 'next/server'
import { ServerBotService } from '@/lib/server-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const bots = await ServerBotService.findByUserId(parseInt(userId))

    return NextResponse.json({
      success: true,
      data: bots,
    })

  } catch (error) {
    console.error('Get bots error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch bots',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, ...botData } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const bot = await ServerBotService.create(parseInt(userId), botData)

    return NextResponse.json({
      success: true,
      data: bot,
    })

  } catch (error) {
    console.error('Create bot error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create bot',
      },
      { status: 500 }
    )
  }
}
