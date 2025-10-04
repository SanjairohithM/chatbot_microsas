import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { BotService } from '@/lib/services/bot.service'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schemas
const CreateTokenSchema = z.object({
  token_name: z.string().min(1, 'Token name is required').max(100, 'Token name too long'),
  permissions: z.array(z.enum(['read', 'write', 'admin', 'all'])).min(1, 'At least one permission required'),
  expires_in_days: z.number().min(1, 'Expiration must be at least 1 day').max(365, 'Expiration cannot exceed 365 days').optional().default(30),
  description: z.string().max(500, 'Description too long').optional()
})

const UpdateTokenSchema = z.object({
  token_name: z.string().min(1, 'Token name is required').max(100, 'Token name too long').optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin', 'all'])).min(1, 'At least one permission required').optional(),
  expires_in_days: z.number().min(1, 'Expiration must be at least 1 day').max(365, 'Expiration cannot exceed 365 days').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  is_active: z.boolean().optional()
})

// Generate secure token
function generateSecureToken(prefix: string = 'ox'): string {
  const randomBytes = crypto.randomBytes(32)
  return `${prefix}_${randomBytes.toString('hex')}`
}

// Generate secret key
function generateSecretKey(prefix: string = 'ox_sk'): string {
  const randomBytes = crypto.randomBytes(32)
  return `${prefix}_${randomBytes.toString('hex')}`
}

// Calculate expiration date
function calculateExpirationDate(days: number): Date {
  const now = new Date()
  now.setDate(now.getDate() + days)
  return now
}

// GET /api/bots/[botId]/tokens - List all tokens for a bot
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // active, expired, all

    logger.apiRequest('GET', `/api/bots/${botId}/tokens`, { botId, page, limit, status })

    // Get bot to verify ownership
    const bot = await BotService.getBotById(botId)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Get tokens from database (this would be implemented in BotService)
    const tokens = await BotService.getBotTokens(botId, {
      page,
      limit,
      status: status as 'active' | 'expired' | 'all' | undefined
    })

    return ApiResponse.success('Tokens retrieved successfully', {
      tokens: tokens.data,
      pagination: {
        page: tokens.page,
        limit: tokens.limit,
        total: tokens.total,
        totalPages: Math.ceil(tokens.total / tokens.limit)
      }
    })

  } catch (error) {
    logger.apiError('GET', `/api/bots/${params.botId}/tokens`, error)
    return ApiResponse.internalError('Failed to retrieve tokens')
  }
}

// POST /api/bots/[botId]/tokens - Create a new token for a bot
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
    const validatedData = CreateTokenSchema.parse(body)

    logger.apiRequest('POST', `/api/bots/${botId}/tokens`, { botId, tokenName: validatedData.token_name })

    // Get bot to verify ownership
    const bot = await BotService.getBotById(botId)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Generate secure tokens
    const accessToken = generateSecureToken('ox')
    const secretKey = generateSecretKey('ox_sk')
    const expiresAt = calculateExpirationDate(validatedData.expires_in_days)

    // Create token in database
    const tokenData = {
      bot_id: botId,
      token_name: validatedData.token_name,
      access_token: accessToken,
      secret_key: secretKey,
      permissions: validatedData.permissions,
      expires_at: expiresAt,
      description: validatedData.description || null,
      is_active: true,
      created_at: new Date(),
      last_used_at: null
    }

    const createdToken = await BotService.createBotToken(tokenData)

    return ApiResponse.success('Token created successfully', {
      token_id: createdToken.id,
      token_name: createdToken.token_name,
      access_token: createdToken.access_token,
      secret_key: createdToken.secret_key,
      permissions: createdToken.permissions,
      expires_at: createdToken.expires_at,
      description: createdToken.description,
      created_at: createdToken.created_at
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation error', { errors: error.errors })
    }
    
    logger.apiError('POST', `/api/bots/${params.botId}/tokens`, error)
    return ApiResponse.internalError('Failed to create token')
  }
}

// PUT /api/bots/[botId]/tokens/[tokenId] - Update a token
export async function PUT(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('token_id')
    if (!tokenId) {
      return ApiResponse.badRequest('Token ID is required')
    }

    const body = await request.json()
    const validatedData = UpdateTokenSchema.parse(body)

    logger.apiRequest('PUT', `/api/bots/${botId}/tokens`, { botId, tokenId, ...validatedData })

    // Get bot to verify ownership
    const bot = await BotService.getBotById(botId)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Update token in database
    const updatedToken = await BotService.updateBotToken(parseInt(tokenId), botId, validatedData)
    if (!updatedToken) {
      return ApiResponse.notFound('Token not found')
    }

    return ApiResponse.success('Token updated successfully', {
      token_id: updatedToken.id,
      token_name: updatedToken.token_name,
      permissions: updatedToken.permissions,
      expires_at: updatedToken.expires_at,
      description: updatedToken.description,
      is_active: updatedToken.is_active,
      updated_at: updatedToken.updated_at
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation error', { errors: error.errors })
    }
    
    logger.apiError('PUT', `/api/bots/${params.botId}/tokens`, error)
    return ApiResponse.internalError('Failed to update token')
  }
}

// DELETE /api/bots/[botId]/tokens/[tokenId] - Revoke a token
export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('token_id')
    if (!tokenId) {
      return ApiResponse.badRequest('Token ID is required')
    }

    logger.apiRequest('DELETE', `/api/bots/${botId}/tokens`, { botId, tokenId })

    // Get bot to verify ownership
    const bot = await BotService.getBotById(botId)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Revoke token in database
    const success = await BotService.revokeBotToken(parseInt(tokenId), botId)
    if (!success) {
      return ApiResponse.notFound('Token not found')
    }

    return ApiResponse.success('Token revoked successfully')

  } catch (error) {
    logger.apiError('DELETE', `/api/bots/${params.botId}/tokens`, error)
    return ApiResponse.internalError('Failed to revoke token')
  }
}
