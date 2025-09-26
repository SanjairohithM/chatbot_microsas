import { NextRequest, NextResponse } from 'next/server'
import { DocumentSearchService } from '@/lib/services/document-search.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { botId, query, limit = 10 } = body

    logger.apiRequest('POST', '/api/search-documents', botId)

    // Validate request
    const validation = validateRequest({
      botId: { required: true, type: 'number' },
      query: { required: true, type: 'string' },
      limit: { type: 'number' }
    }, body)

    if (!validation.isValid) {
      return ApiResponse.badRequest('Validation failed', validation.errors)
    }

    // Get detailed search results
    const searchResults = await DocumentSearchService.getDetailedSearchResults(botId, query, limit)

    logger.apiResponse('POST', '/api/search-documents', 200, 0)

    // Create response with CORS headers
    const nextResponse = NextResponse.json({
      success: true,
      data: searchResults
    }, { status: 200 })
    
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    logger.apiError('POST', '/api/search-documents', error as Error)
    
    const errorResponse = ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Internal server error'
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
