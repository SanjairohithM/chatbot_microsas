import { NextRequest } from 'next/server'
import { ConversationController } from '@/lib/controllers/conversation.controller'

export async function GET(request: NextRequest) {
  return ConversationController.getConversationsByUserId(request)
}

export async function POST(request: NextRequest) {
  return ConversationController.createConversation(request)
}