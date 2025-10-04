import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'

export interface TokenAuthResult {
  isValid: boolean
  botId?: number
  userId?: string
  permissions?: string[]
  error?: string
}

export async function validateToken(request: NextRequest): Promise<TokenAuthResult> {
  try {
    // Get access token from Authorization header or request body
    let access_token: string | null = null
    
    // Check Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      access_token = authHeader.substring(7)
    }
    
    // If not in header, check request body
    if (!access_token) {
      try {
        const body = await request.json()
        access_token = body.accessToken || body.access_token
      } catch {
        // Body might not be JSON or might be empty
      }
    }
    
    if (!access_token) {
      return {
        isValid: false,
        error: 'Access token is required'
      }
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
      return {
        isValid: false,
        error: 'Invalid access token'
      }
    }

    // Check if token is expired
    const expirySetting = await db.botSettings.findFirst({
      where: {
        bot_id: token.bot_id,
        setting_key: 'token_expires_at'
      }
    })

    if (expirySetting && new Date(expirySetting.setting_value!) < new Date()) {
      return {
        isValid: false,
        error: 'Access token has expired'
      }
    }

    // Get permissions
    const permissionsSetting = await db.botSettings.findFirst({
      where: {
        bot_id: token.bot_id,
        setting_key: 'permissions'
      }
    })

    const permissions = permissionsSetting?.setting_value?.split(',') || ['chat']

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

    return {
      isValid: true,
      botId: token.bot_id,
      userId: token.bot.user_id,
      permissions
    }

  } catch (error) {
    console.error('Token validation error:', error)
    return {
      isValid: false,
      error: 'Token validation failed'
    }
  }
}

export function requirePermission(permissions: string[], requiredPermission: string): boolean {
  return permissions.includes(requiredPermission) || permissions.includes('*')
}

export function createTokenAuthResponse(error: string, status: number = 401) {
  return ApiResponse.createResponse(
    { error },
    status,
    {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  )
}
