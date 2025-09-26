import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { DocumentProcessorService } from '@/lib/services/document-processor.service'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = parseInt(params.id)
    if (isNaN(botId)) {
      return new NextResponse('Invalid bot ID', { status: 400 })
    }

    // Get all documents for the bot
    const documents = await KnowledgeDocumentService.getDocumentsByBotId(botId)
    
    let processedCount = 0
    const results = []

    for (const doc of documents) {
      if (doc.status !== 'indexed') {
        try {
          // Process the document if it has a file URL
          if (doc.file_url) {
            const filePath = join(process.cwd(), doc.file_url)
            const processed = await DocumentProcessorService.processDocument(
              filePath,
              doc.title,
              doc.file_type || 'txt'
            )
            
            // Update the document with processed content
            const updatedDoc = await KnowledgeDocumentService.updateKnowledgeDocument(doc.id, {
              content: processed.content,
              status: 'indexed'
            })
            
            if (updatedDoc) {
              processedCount++
              results.push({
                id: doc.id,
                title: doc.title,
                status: 'indexed',
                contentLength: processed.content.length
              })
            }
          } else {
            results.push({
              id: doc.id,
              title: doc.title,
              status: doc.status,
              contentLength: doc.content ? doc.content.length : 0,
              error: 'No file URL found'
            })
          }
        } catch (error) {
          console.error(`Error processing document ${doc.id}:`, error)
          results.push({
            id: doc.id,
            title: doc.title,
            status: 'error',
            contentLength: doc.content ? doc.content.length : 0,
            error: error instanceof Error ? error.message : 'Processing failed'
          })
        }
      } else {
        results.push({
          id: doc.id,
          title: doc.title,
          status: 'already_indexed',
          contentLength: doc.content ? doc.content.length : 0
        })
      }
    }
    
    // Add CORS headers
    const response = NextResponse.json({
      success: true,
      message: `Processed ${processedCount} documents`,
      processedCount,
      totalDocuments: documents.length,
      results
    })
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response
  } catch (error) {
    console.error('Error processing bot documents:', error)
    
    const errorResponse = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
