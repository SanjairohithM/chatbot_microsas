import { NextRequest } from 'next/server'
import { BotController } from '@/lib/controllers/bot.controller'

export async function GET(request: NextRequest) {
  return BotController.getBots(request)
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/bots called!')
  try {
    const result = await BotController.createBot(request)
    console.log('✅ BotController.createBot completed')
    return result
  } catch (error) {
    console.error('❌ Error in POST /api/bots:', error)
    throw error
  }
}
