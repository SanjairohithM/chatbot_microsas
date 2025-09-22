import { NextRequest, NextResponse } from 'next/server'
import { ServerConversationService } from '@/lib/server-database'

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

    const conversations = await ServerConversationService.findByUserId(parseInt(userId))

    return NextResponse.json({
      success: true,
      data: conversations,
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { botId, userId, title, isTest } = await request.json()

    if (!botId || !userId) {
      return NextResponse.json(
        { error: 'Bot ID and User ID are required' },
        { status: 400 }
      )
    }

    const conversation = await ServerConversationService.create(
      parseInt(botId),
      parseInt(userId),
      title,
      isTest
    )

    return NextResponse.json({
      success: true,
      data: conversation,
    })

  } catch (error) {
    console.error('Create conversation error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      },
      { status: 500 }
    )
  }
}
