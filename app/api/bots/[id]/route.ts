import { NextRequest } from 'next/server'
import { BotController } from '@/lib/controllers/bot.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return BotController.getBotById(request, { params })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return BotController.updateBot(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return BotController.deleteBot(request, { params })
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}