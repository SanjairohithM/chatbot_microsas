import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { DocumentProcessorService } from '@/lib/services/document-processor.service'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 })
    }

    // Get the document
    const document = await KnowledgeDocumentService.getKnowledgeDocumentById(documentId)
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    if (!document.file_url) {
      return NextResponse.json({ success: false, error: 'No file URL found' }, { status: 400 })
    }

    // Process the document
    const filePath = join(process.cwd(), 'public', document.file_url)
    const processed = await DocumentProcessorService.processDocument(
      filePath,
      document.title,
      document.file_type || 'txt'
    )

    // Update the document with processed content
    const updatedDocument = await KnowledgeDocumentService.updateKnowledgeDocument(documentId, {
      content: processed.content,
      status: 'indexed'
    })

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      metadata: processed.metadata
    })

  } catch (error) {
    console.error('Document processing error:', error)
    
    // Update document status to error
    try {
      const { documentId } = await request.json()
      await KnowledgeDocumentService.updateKnowledgeDocument(documentId, {
        status: 'error',
        processing_error: error instanceof Error ? error.message : 'Unknown error'
      })
    } catch (updateError) {
      console.error('Failed to update document status:', updateError)
    }

    return NextResponse.json(
      { success: false, error: 'Document processing failed' },
      { status: 500 }
    )
  }
}
