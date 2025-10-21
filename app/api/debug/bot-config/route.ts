import { NextRequest, NextResponse } from 'next/server'
import { BotService } from '@/lib/services/bot.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    
    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const bot = await BotService.getBotById(parseInt(botId))
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        name: bot.name,
        interaction_mode: bot.interaction_mode,
        model: bot.model,
        status: bot.status,
        is_deployed: bot.is_deployed
      }
    })
  } catch (error) {
    console.error('Debug bot config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
