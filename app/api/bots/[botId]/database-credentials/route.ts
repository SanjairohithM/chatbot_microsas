import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAuthMiddleware } from '@/lib/middleware/database-auth'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    const botId = parseInt(params.botId)
    
    // Check if user owns this bot or has admin permissions
    const bot = await db.bot.findFirst({
      where: {
        id: botId,
        user_id: authResult.userId
      }
    })

    if (!bot) {
      return ApiResponse.forbidden('Bot not found or access denied')
    }

    const body = await request.json()
    const { 
      permissions = ['read'],
      expires_in_days = 365
    } = body

    // Validate permissions
    const validPermissions = ['read', 'write', 'admin', 'all']
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    
    if (invalidPermissions.length > 0) {
      return ApiResponse.badRequest(`Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions: ${validPermissions.join(', ')}`)
    }

    // Check if credentials already exist
    const existingCredentials = await db.botSettings.findFirst({
      where: {
        bot_id: botId,
        setting_key: 'database_access_token'
      }
    })

    if (existingCredentials) {
      return ApiResponse.conflict('Database credentials already exist for this bot. Use PUT to update or DELETE to revoke.')
    }

    // Create new database credentials
    const credentials = await DatabaseAuthMiddleware.createDatabaseCredentials(
      botId,
      permissions,
      expires_in_days
    )

    logger.apiRequest('POST', `/api/bots/${botId}/database-credentials`, parseInt(authResult.userId!))

    return ApiResponse.success('Database credentials created successfully', {
      bot_id: botId,
      access_token: credentials.accessToken,
      secret_key: credentials.secretKey,
      expires_at: credentials.expiresAt.toISOString(),
      permissions
    })

  } catch (error) {
    logger.apiError('POST', `/api/bots/${params.botId}/database-credentials`, error as Error)
    return ApiResponse.internalServerError('Failed to create database credentials')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    const botId = parseInt(params.botId)
    
    // Check if user owns this bot
    const bot = await db.bot.findFirst({
      where: {
        id: botId,
        user_id: authResult.userId
      }
    })

    if (!bot) {
      return ApiResponse.forbidden('Bot not found or access denied')
    }

    // Get database credentials info (without sensitive data)
    const credentials = await db.botSettings.findMany({
      where: {
        bot_id: botId,
        setting_key: {
          in: [
            'database_access_enabled',
            'database_token_expires_at',
            'database_last_used_at'
          ]
        }
      }
    })

    const permissions = await db.botSettings.findMany({
      where: {
        bot_id: botId,
        setting_key: {
          startsWith: 'database_permission_'
        }
      }
    })

    const credentialsInfo = {
      enabled: credentials.find(c => c.setting_key === 'database_access_enabled')?.setting_value === 'true',
      expires_at: credentials.find(c => c.setting_key === 'database_token_expires_at')?.setting_value,
      last_used_at: credentials.find(c => c.setting_key === 'database_last_used_at')?.setting_value,
      permissions: permissions.map(p => p.setting_key.replace('database_permission_', '')),
      is_expired: false
    }

    // Check if expired
    if (credentialsInfo.expires_at) {
      credentialsInfo.is_expired = new Date(credentialsInfo.expires_at) < new Date()
    }

    return ApiResponse.success('Database credentials information retrieved', {
      bot_id: botId,
      credentials: credentialsInfo
    })

  } catch (error) {
    logger.apiError('GET', `/api/bots/${params.botId}/database-credentials`, error as Error)
    return ApiResponse.internalServerError('Failed to retrieve database credentials')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    const botId = parseInt(params.botId)
    
    // Check if user owns this bot
    const bot = await db.bot.findFirst({
      where: {
        id: botId,
        user_id: authResult.userId
      }
    })

    if (!bot) {
      return ApiResponse.forbidden('Bot not found or access denied')
    }

    const body = await request.json()
    const { 
      permissions,
      expires_in_days = 365
    } = body

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = ['read', 'write', 'admin', 'all']
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
      
      if (invalidPermissions.length > 0) {
        return ApiResponse.badRequest(`Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions: ${validPermissions.join(', ')}`)
      }
    }

    // Check if credentials exist
    const existingCredentials = await db.botSettings.findFirst({
      where: {
        bot_id: botId,
        setting_key: 'database_access_token'
      }
    })

    if (!existingCredentials) {
      return ApiResponse.notFound('Database credentials not found for this bot')
    }

    // Revoke existing credentials
    await DatabaseAuthMiddleware.revokeDatabaseAccess(botId)

    // Create new credentials
    const newCredentials = await DatabaseAuthMiddleware.createDatabaseCredentials(
      botId,
      permissions || ['read'],
      expires_in_days
    )

    logger.apiRequest('PUT', `/api/bots/${botId}/database-credentials`, parseInt(authResult.userId!))

    return ApiResponse.success('Database credentials updated successfully', {
      bot_id: botId,
      access_token: newCredentials.accessToken,
      secret_key: newCredentials.secretKey,
      expires_at: newCredentials.expiresAt.toISOString(),
      permissions: permissions || ['read']
    })

  } catch (error) {
    logger.apiError('PUT', `/api/bots/${params.botId}/database-credentials`, error as Error)
    return ApiResponse.internalServerError('Failed to update database credentials')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    const botId = parseInt(params.botId)
    
    // Check if user owns this bot
    const bot = await db.bot.findFirst({
      where: {
        id: botId,
        user_id: authResult.userId
      }
    })

    if (!bot) {
      return ApiResponse.forbidden('Bot not found or access denied')
    }

    // Revoke database access
    await DatabaseAuthMiddleware.revokeDatabaseAccess(botId)

    logger.apiRequest('DELETE', `/api/bots/${botId}/database-credentials`, parseInt(authResult.userId!))

    return ApiResponse.success('Database credentials revoked successfully', {
      bot_id: botId
    })

  } catch (error) {
    logger.apiError('DELETE', `/api/bots/${params.botId}/database-credentials`, error as Error)
    return ApiResponse.internalServerError('Failed to revoke database credentials')
  }
}
