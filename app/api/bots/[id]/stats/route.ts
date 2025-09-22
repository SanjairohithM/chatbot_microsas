import { NextRequest } from 'next/server'
import { BotController } from '@/lib/controllers/bot.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return BotController.getBotStats(request, { params })
}
