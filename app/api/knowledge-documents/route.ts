import { NextRequest } from 'next/server'
import { KnowledgeDocumentController } from '@/lib/controllers/knowledge-document.controller'

export async function GET(request: NextRequest) {
  return KnowledgeDocumentController.getKnowledgeDocuments(request)
}

export async function POST(request: NextRequest) {
  return KnowledgeDocumentController.createKnowledgeDocument(request)
}
