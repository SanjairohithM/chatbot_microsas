import { NextRequest } from 'next/server'
import { KnowledgeDocumentController } from '@/lib/controllers/knowledge-document.controller'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return KnowledgeDocumentController.updateDocumentStatus(request, { params })
}
