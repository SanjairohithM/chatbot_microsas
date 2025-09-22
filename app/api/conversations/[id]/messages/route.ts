import { NextRequest, NextResponse } from 'next/server'
import { ServerMessageService } from '@/lib/server-database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await ServerMessageService.findByConversationId(parseInt(params.id))

    return NextResponse.json({
      success: true,
      data: messages,
    })

  } catch (error) {
    console.error('Get messages error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role, content, tokensUsed, responseTimeMs } = await request.json()

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    const message = await ServerMessageService.create(
      parseInt(params.id),
      role,
      content,
      tokensUsed,
      responseTimeMs
    )

    return NextResponse.json({
      success: true,
      data: message,
    })

  } catch (error) {
    console.error('Create message error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create message',
      },
      { status: 500 }
    )
  }
}
