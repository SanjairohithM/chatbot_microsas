import { NextRequest, NextResponse } from 'next/server'
import { PineconeService } from '@/lib/services/pinecone.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const botId = searchParams.get('botId')
    const userId = searchParams.get('userId')
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    logger.apiRequest('GET', '/api/conversations/vector', conversationId)

    // Validate request
    const validation = validateRequest({
      conversationId: { type: 'string' },
      botId: { type: 'number' },
      userId: { type: 'number' },
      query: { type: 'string' },
      limit: { type: 'number' }
    }, { conversationId, botId: botId ? parseInt(botId) : null, userId: userId ? parseInt(userId) : null, query, limit })

    if (!validation.isValid) {
      return ApiResponse.badRequest('Validation failed', validation.errors)
    }

    let result

    if (conversationId) {
      // Get conversation history
      result = await PineconeService.getConversationHistory(conversationId, limit)
    } else if (botId && userId && query) {
      // Search conversation context
      result = await PineconeService.searchConversationContext(
        parseInt(botId),
        parseInt(userId),
        query,
        limit
      )
    } else if (botId && query) {
      // Search across all bot conversations
      result = await PineconeService.searchBotConversations(
        parseInt(botId),
        query,
        limit
      )
    } else {
      return ApiResponse.badRequest('Invalid parameters. Provide either conversationId or (botId + userId + query) or (botId + query)')
    }

    logger.apiResponse('GET', '/api/conversations/vector', 200, 0)

    // Create response with CORS headers
    const nextResponse = NextResponse.json({
      success: true,
      data: result
    }, { status: 200 })
    
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    logger.apiError('GET', '/api/conversations/vector', error as Error)
    
    const errorResponse = ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Internal server error'
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    logger.apiRequest('DELETE', '/api/conversations/vector', conversationId)

    if (!conversationId) {
      return ApiResponse.badRequest('conversationId is required')
    }

    await PineconeService.deleteConversation(conversationId)

    logger.apiResponse('DELETE', '/api/conversations/vector', 200, 0)

    // Create response with CORS headers
    const nextResponse = NextResponse.json({
      success: true,
      message: `Conversation ${conversationId} deleted from vector database`
    }, { status: 200 })
    
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    logger.apiError('DELETE', '/api/conversations/vector', error as Error)
    
    const errorResponse = ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Internal server error'
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
