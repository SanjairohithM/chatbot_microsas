import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { DocumentProcessorService } from '@/lib/services/document-processor.service'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Check if document already has content or if we need to process the file
    let processedContent = document.content
    let processedMetadata = { wordCount: 0, characterCount: 0 }

    if (!processedContent && document.file_url) {
      // Process the document from file
      let filePath: string
      
      // Handle both old and new file URL formats
      if (document.file_url.startsWith('/api/secure-file/')) {
        // New secure format: /api/secure-file/filename
        const filename = document.file_url.replace('/api/secure-file/', '')
        filePath = join(process.cwd(), 'secure-uploads', filename)
      } else if (document.file_url.startsWith('/uploads/')) {
        // Old format: /uploads/filename (check both locations)
        const filename = document.file_url.replace('/uploads/', '')
        const securePath = join(process.cwd(), 'secure-uploads', filename)
        const oldPath = join(process.cwd(), 'uploads', filename)
        
        if (existsSync(securePath)) {
          filePath = securePath
        } else if (existsSync(oldPath)) {
          filePath = oldPath
        } else {
          throw new Error(`File not found: ${filename}`)
        }
      } else {
        // Direct path
        filePath = join(process.cwd(), document.file_url)
      }
      
      const processed = await DocumentProcessorService.processDocument(
        filePath,
        document.title,
        document.file_type || 'txt'
      )
      processedContent = processed.content
      processedMetadata = processed.metadata
    } else if (processedContent) {
      // Document already has content, just calculate metadata
      processedMetadata = {
        wordCount: processedContent.split(/\s+/).length,
        characterCount: processedContent.length
      }
    } else {
      return NextResponse.json({ success: false, error: 'No file URL or content found' }, { status: 400 })
    }

    // Update the document with processed content (only if it changed)
    let updatedDocument = document
    if (processedContent !== document.content) {
      updatedDocument = await KnowledgeDocumentService.updateKnowledgeDocument(documentId, {
        content: processedContent,
        status: 'indexed'
      })
    }

    // Store document in Pinecone for vector search
    try {
      console.log(`[Document Processing] Storing document ${documentId} in Pinecone...`)
      await PineconeDocumentService.storeDocument(
        document.bot_id,
        documentId,
        document.title,
        processedContent
      )
      console.log(`[Document Processing] ✅ Document ${documentId} stored in Pinecone successfully`)
    } catch (pineconeError) {
      console.error(`[Document Processing] ❌ Failed to store document ${documentId} in Pinecone:`, pineconeError)
      // Don't fail the entire process if Pinecone storage fails
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      metadata: processedMetadata,
      pinecone_stored: true
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
