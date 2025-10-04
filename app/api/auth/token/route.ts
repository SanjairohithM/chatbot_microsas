import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { access_token, secret_key } = await request.json()

    if (!access_token || !secret_key) {
      return ApiResponse.badRequest('Access token and secret key are required')
    }

    // Find token in database
    const token = await db.botSettings.findFirst({
      where: {
        setting_key: 'access_token',
        setting_value: access_token,
        is_encrypted: true
      },
      include: {
        bot: {
          include: {
            user: true
          }
        }
      }
    })

    if (!token) {
      return ApiResponse.unauthorized('Invalid access token')
    }

    // Verify secret key (you might want to store this separately or use a different verification method)
    const secretKeySetting = await db.botSettings.findFirst({
      where: {
        bot_id: token.bot_id,
        setting_key: 'secret_key',
        setting_value: secret_key,
        is_encrypted: true
      }
    })

    if (!secretKeySetting) {
      return ApiResponse.unauthorized('Invalid secret key')
    }

    // Check if token is expired (if you implement expiration)
    const expirySetting = await db.botSettings.findFirst({
      where: {
        bot_id: token.bot_id,
        setting_key: 'token_expires_at'
      }
    })

    if (expirySetting && new Date(expirySetting.setting_value!) < new Date()) {
      return ApiResponse.unauthorized('Access token has expired')
    }

    // Update last used timestamp
    await db.botSettings.upsert({
      where: {
        bot_id_setting_key: {
          bot_id: token.bot_id,
          setting_key: 'last_used_at'
        }
      },
      update: {
        setting_value: new Date().toISOString()
      },
      create: {
        bot_id: token.bot_id,
        setting_key: 'last_used_at',
        setting_value: new Date().toISOString()
      }
    })

    logger.apiRequest('POST', '/api/auth/token', token.bot.user_id)

    return ApiResponse.success({
      valid: true,
      bot_id: token.bot_id,
      user_id: token.bot.user_id,
      permissions: token.bot.settings
        .filter(s => s.setting_key.startsWith('permission_'))
        .map(s => s.setting_key.replace('permission_', ''))
    })

  } catch (error) {
    logger.apiError('POST', '/api/auth/token', error as Error)
    return ApiResponse.internalServerError('Token validation failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const access_token = searchParams.get('access_token')

    if (!access_token) {
      return ApiResponse.badRequest('Access token is required')
    }

    // Find token and return basic info
    const token = await db.botSettings.findFirst({
      where: {
        setting_key: 'access_token',
        setting_value: access_token,
        is_encrypted: true
      },
      include: {
        bot: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            is_deployed: true
          }
        }
      }
    })

    if (!token) {
      return ApiResponse.unauthorized('Invalid access token')
    }

    return ApiResponse.success({
      bot: token.bot,
      valid: true
    })

  } catch (error) {
    logger.apiError('GET', '/api/auth/token', error as Error)
    return ApiResponse.internalServerError('Token validation failed')
  }
}
