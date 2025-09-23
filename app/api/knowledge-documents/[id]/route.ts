import { NextRequest } from 'next/server'
import { KnowledgeDocumentController } from '@/lib/controllers/knowledge-document.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return KnowledgeDocumentController.getKnowledgeDocumentById(request, { params })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return KnowledgeDocumentController.updateKnowledgeDocument(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return KnowledgeDocumentController.deleteKnowledgeDocument(request, { params })
}
