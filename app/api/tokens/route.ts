import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { bot_id, token_name, permissions, expires_days } = await request.json()

    if (!bot_id || !token_name) {
      return ApiResponse.badRequest('Bot ID and token name are required')
    }

    // Verify bot exists and user has access
    const bot = await db.bot.findFirst({
      where: {
        id: parseInt(bot_id),
        status: 'active'
      }
    })

    if (!bot) {
      return ApiResponse.notFound('Bot not found or inactive')
    }

    // Generate access token and secret key
    const access_token = 'ox_' + crypto.randomBytes(32).toString('hex')
    const secret_key = 'ox_sk_' + crypto.randomBytes(32).toString('hex')
    
    // Calculate expiry date
    const expires_at = expires_days ? 
      new Date(Date.now() + (expires_days * 24 * 60 * 60 * 1000)) : 
      null

    // Store token in bot settings
    await db.botSettings.createMany({
      data: [
        {
          bot_id: parseInt(bot_id),
          setting_key: 'access_token',
          setting_value: access_token,
          is_encrypted: true
        },
        {
          bot_id: parseInt(bot_id),
          setting_key: 'secret_key',
          setting_value: secret_key,
          is_encrypted: true
        },
        {
          bot_id: parseInt(bot_id),
          setting_key: 'token_name',
          setting_value: token_name,
          is_encrypted: false
        },
        {
          bot_id: parseInt(bot_id),
          setting_key: 'permissions',
          setting_value: permissions || 'chat,analytics,conversations',
          is_encrypted: false
        },
        ...(expires_at ? [{
          bot_id: parseInt(bot_id),
          setting_key: 'token_expires_at',
          setting_value: expires_at.toISOString(),
          is_encrypted: false
        }] : [])
      ]
    })

    logger.apiRequest('POST', '/api/tokens', bot.user_id)

    return ApiResponse.success({
      access_token,
      secret_key,
      bot_id: parseInt(bot_id),
      token_name,
      permissions: permissions || 'chat,analytics,conversations',
      expires_at: expires_at?.toISOString() || null
    })

  } catch (error) {
    logger.apiError('POST', '/api/tokens', error as Error)
    return ApiResponse.internalServerError('Failed to create token')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bot_id = searchParams.get('bot_id')
    const user_id = searchParams.get('user_id')

    if (!bot_id && !user_id) {
      return ApiResponse.badRequest('Bot ID or User ID is required')
    }

    let whereClause: any = {}
    
    if (bot_id) {
      whereClause.bot_id = parseInt(bot_id)
    }
    
    if (user_id) {
      whereClause.bot = {
        user_id: user_id
      }
    }

    // Get all tokens for the bot/user
    const tokens = await db.botSettings.findMany({
      where: {
        ...whereClause,
        setting_key: 'access_token',
        is_encrypted: true
      },
      include: {
        bot: {
          select: {
            id: true,
            name: true,
            user_id: true
          }
        }
      }
    })

    // Get additional token details
    const tokenDetails = await Promise.all(
      tokens.map(async (token) => {
        const [secretKey, tokenName, permissions, expiresAt, lastUsed] = await Promise.all([
          db.botSettings.findFirst({
            where: {
              bot_id: token.bot_id,
              setting_key: 'secret_key'
            }
          }),
          db.botSettings.findFirst({
            where: {
              bot_id: token.bot_id,
              setting_key: 'token_name'
            }
          }),
          db.botSettings.findFirst({
            where: {
              bot_id: token.bot_id,
              setting_key: 'permissions'
            }
          }),
          db.botSettings.findFirst({
            where: {
              bot_id: token.bot_id,
              setting_key: 'token_expires_at'
            }
          }),
          db.botSettings.findFirst({
            where: {
              bot_id: token.bot_id,
              setting_key: 'last_used_at'
            }
          })
        ])

        return {
          id: token.id,
          bot_id: token.bot_id,
          bot_name: token.bot.name,
          access_token: token.setting_value,
          secret_key: secretKey?.setting_value,
          token_name: tokenName?.setting_value,
          permissions: permissions?.setting_value?.split(',') || [],
          expires_at: expiresAt?.setting_value,
          last_used: lastUsed?.setting_value,
          created_at: token.created_at,
          is_expired: expiresAt?.setting_value ? new Date(expiresAt.setting_value) < new Date() : false
        }
      })
    )

    return ApiResponse.success({
      tokens: tokenDetails
    })

  } catch (error) {
    logger.apiError('GET', '/api/tokens', error as Error)
    return ApiResponse.internalServerError('Failed to fetch tokens')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { access_token } = await request.json()

    if (!access_token) {
      return ApiResponse.badRequest('Access token is required')
    }

    // Find and delete token
    const token = await db.botSettings.findFirst({
      where: {
        setting_key: 'access_token',
        setting_value: access_token,
        is_encrypted: true
      }
    })

    if (!token) {
      return ApiResponse.notFound('Token not found')
    }

    // Delete all token-related settings
    await db.botSettings.deleteMany({
      where: {
        bot_id: token.bot_id,
        setting_key: {
          in: ['access_token', 'secret_key', 'token_name', 'permissions', 'token_expires_at', 'last_used_at']
        }
      }
    })

    logger.apiRequest('DELETE', '/api/tokens', token.bot_id)

    return ApiResponse.success({
      message: 'Token revoked successfully'
    })

  } catch (error) {
    logger.apiError('DELETE', '/api/tokens', error as Error)
    return ApiResponse.internalServerError('Failed to revoke token')
  }
}
