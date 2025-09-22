import { NextRequest } from 'next/server'
import { ConversationController } from '@/lib/controllers/conversation.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ConversationController.getConversationById(request, { params })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ConversationController.updateConversation(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ConversationController.deleteConversation(request, { params })
}
