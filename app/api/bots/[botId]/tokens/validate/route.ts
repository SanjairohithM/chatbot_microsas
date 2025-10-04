import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { BotService } from '@/lib/services/bot.service'

// POST /api/bots/[botId]/tokens/validate - Validate a token
export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    const body = await request.json()
    const { access_token, secret_key } = body

    if (!access_token || !secret_key) {
      return ApiResponse.badRequest('Access token and secret key are required')
    }

    logger.apiRequest('POST', `/api/bots/${botId}/tokens/validate`, { botId, hasToken: !!access_token })

    // Validate token
    const tokenValidation = await BotService.validateBotToken(botId, access_token, secret_key)
    
    if (!tokenValidation.valid) {
      return ApiResponse.unauthorized('Invalid or expired token', {
        valid: false,
        reason: tokenValidation.reason
      })
    }

    return ApiResponse.success('Token is valid', {
      valid: true,
      token_id: tokenValidation.token?.id,
      token_name: tokenValidation.token?.token_name,
      permissions: tokenValidation.token?.permissions,
      expires_at: tokenValidation.token?.expires_at,
      last_used_at: tokenValidation.token?.last_used_at
    })

  } catch (error) {
    logger.apiError('POST', `/api/bots/${params.botId}/tokens/validate`, error)
    return ApiResponse.internalError('Failed to validate token')
  }
}

// GET /api/bots/[botId]/tokens/validate - Get token info (if valid)
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized('Authorization header required')
    }

    const tokenString = authHeader.substring(7) // Remove 'Bearer '
    const [access_token, secret_key] = tokenString.split(':')

    if (!access_token || !secret_key) {
      return ApiResponse.unauthorized('Invalid token format')
    }

    logger.apiRequest('GET', `/api/bots/${botId}/tokens/validate`, { botId, hasToken: !!access_token })

    // Validate token
    const tokenValidation = await BotService.validateBotToken(botId, access_token, secret_key)
    
    if (!tokenValidation.valid) {
      return ApiResponse.unauthorized('Invalid or expired token', {
        valid: false,
        reason: tokenValidation.reason
      })
    }

    return ApiResponse.success('Token info retrieved', {
      valid: true,
      token_id: tokenValidation.token?.id,
      token_name: tokenValidation.token?.token_name,
      permissions: tokenValidation.token?.permissions,
      expires_at: tokenValidation.token?.expires_at,
      last_used_at: tokenValidation.token?.last_used_at,
      created_at: tokenValidation.token?.created_at
    })

  } catch (error) {
    logger.apiError('GET', `/api/bots/${params.botId}/tokens/validate`, error)
    return ApiResponse.internalError('Failed to validate token')
  }
}
