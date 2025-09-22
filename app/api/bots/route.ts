import { NextRequest } from 'next/server'
import { BotController } from '@/lib/controllers/bot.controller'

export async function GET(request: NextRequest) {
  return BotController.getBots(request)
}

export async function POST(request: NextRequest) {
  return BotController.createBot(request)
}
