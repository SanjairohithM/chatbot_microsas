import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Image URL is required' }, { status: 400 })
    }

    logger.apiRequest('POST', '/api/analyze-image', null)

    const startTime = Date.now()

    // DeepSeek doesn't support image analysis, so provide a helpful response
    const analysis = `I can see you've shared an image, but I'm unable to view or analyze images directly. Please describe what you see in the image, and I'll be happy to help you with any questions about it!`

    const responseTime = Date.now() - startTime

    logger.apiResponse('POST', '/api/analyze-image', 200, responseTime)

    return NextResponse.json({
      success: true,
      analysis: analysis,
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      },
      response_time_ms: responseTime
    })

  } catch (error) {
    logger.apiError('POST', '/api/analyze-image', error as Error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Image analysis failed'
    }, { status: 500 })
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
