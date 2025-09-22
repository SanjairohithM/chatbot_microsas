import { NextRequest } from 'next/server'
import { ConversationController } from '@/lib/controllers/conversation.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ConversationController.getMessagesByConversationId(request, { params })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract conversationId from params and add to request body
  const body = await request.json()
  body.conversationId = parseInt(params.id)
  
  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(body)
  })
  
  return ConversationController.createMessage(newRequest)
}