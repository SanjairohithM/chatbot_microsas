import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'

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
      if (doc.status !== 'indexed' && doc.content) {
        // Update document status to indexed
        const updatedDoc = await KnowledgeDocumentService.updateDocumentStatus(doc.id, 'indexed')
        if (updatedDoc) {
          processedCount++
          results.push({
            id: doc.id,
            title: doc.title,
            status: 'indexed',
            contentLength: doc.content.length
          })
        }
      } else if (doc.status === 'indexed') {
        results.push({
          id: doc.id,
          title: doc.title,
          status: 'already_indexed',
          contentLength: doc.content ? doc.content.length : 0
        })
      } else {
        results.push({
          id: doc.id,
          title: doc.title,
          status: doc.status,
          contentLength: doc.content ? doc.content.length : 0,
          error: 'No content to index'
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
