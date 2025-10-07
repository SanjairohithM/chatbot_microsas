import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET
    
    if (!cronSecret || cronSecret !== expectedSecret) {
      return ApiResponse.unauthorized('Invalid cron secret')
    }

    logger.apiRequest('GET', '/api/cron/wordpress-sync', {})

    // Trigger WordPress sync for all enabled bots
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sync/wordpress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    const data = await response.json()
    
    if (data.success) {
      return ApiResponse.success('WordPress sync cron completed', data.data)
    } else {
      return ApiResponse.internalServerError('WordPress sync cron failed')
    }

  } catch (error) {
    logger.apiError('GET', '/api/cron/wordpress-sync', error as Error)
    return ApiResponse.internalServerError('WordPress sync cron failed')
  }
}
