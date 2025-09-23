import { NextRequest } from 'next/server'
import { KnowledgeDocumentController } from '@/lib/controllers/knowledge-document.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return KnowledgeDocumentController.getDocumentsByBotId(request, { params: { botId: params.id } })
}
