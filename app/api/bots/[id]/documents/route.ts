import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'

export async function GET(
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
    
    // Add CORS headers
    const response = NextResponse.json({
      success: true,
      data: documents,
      count: documents.length,
      indexedCount: documents.filter(doc => doc.status === 'indexed').length
    })
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response
  } catch (error) {
    console.error('Error fetching bot documents:', error)
    
    const errorResponse = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}