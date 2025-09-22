import { NextRequest, NextResponse } from 'next/server'
import { ServerBotService } from '@/lib/server-database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bot = await ServerBotService.findById(parseInt(params.id))

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bot,
    })

  } catch (error) {
    console.error('Get bot error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch bot',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const bot = await ServerBotService.update(parseInt(params.id), updates)

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bot,
    })

  } catch (error) {
    console.error('Update bot error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update bot',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await ServerBotService.delete(parseInt(params.id))

    if (!success) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully',
    })

  } catch (error) {
    console.error('Delete bot error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete bot',
      },
      { status: 500 }
    )
  }
}
