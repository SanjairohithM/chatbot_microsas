import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'

export interface DatabaseAuthResult {
  isValid: boolean
  botId?: number
  userId?: string
  permissions?: string[]
  error?: string
}

export class DatabaseAuthMiddleware {
  /**
   * Validate access token and secret key for database API access
   */
  static async validateAuth(request: NextRequest): Promise<DatabaseAuthResult> {
    try {
      // Get credentials from headers or body
      const authHeader = request.headers.get('authorization')
      const contentType = request.headers.get('content-type')
      
      let accessToken: string | null = null
      let secretKey: string | null = null

      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract from Authorization header
        const token = authHeader.substring(7)
        const [tokenPart, secretPart] = token.split(':')
        accessToken = tokenPart
        secretKey = secretPart
      } else if (contentType?.includes('application/json')) {
        // Extract from request body
        try {
          const body = await request.json()
          accessToken = body.access_token
          secretKey = body.secret_key
        } catch (error) {
          return {
            isValid: false,
            error: 'Invalid JSON in request body'
          }
        }
      } else {
        // Try query parameters
        const url = new URL(request.url)
        accessToken = url.searchParams.get('access_token')
        secretKey = url.searchParams.get('secret_key')
      }

      if (!accessToken || !secretKey) {
        return {
          isValid: false,
          error: 'Access token and secret key are required'
        }
      }

      // Find token in database
      const token = await db.botSettings.findFirst({
        where: {
          setting_key: 'database_access_token',
          setting_value: accessToken,
          is_encrypted: true
        },
        include: {
          bot: {
            include: {
              user: true,
              settings: true
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

      // Verify secret key
      const secretKeySetting = await db.botSettings.findFirst({
        where: {
          bot_id: token.bot_id,
          setting_key: 'database_secret_key',
          setting_value: secretKey,
          is_encrypted: true
        }
      })

      if (!secretKeySetting) {
        return {
          isValid: false,
          error: 'Invalid secret key'
        }
      }

      // Check if token is expired
      const expirySetting = await db.botSettings.findFirst({
        where: {
          bot_id: token.bot_id,
          setting_key: 'database_token_expires_at'
        }
      })

      if (expirySetting && new Date(expirySetting.setting_value!) < new Date()) {
        return {
          isValid: false,
          error: 'Access token has expired'
        }
      }

      // Check if database access is enabled for this bot
      const dbAccessSetting = await db.botSettings.findFirst({
        where: {
          bot_id: token.bot_id,
          setting_key: 'database_access_enabled',
          setting_value: 'true'
        }
      })

      if (!dbAccessSetting) {
        return {
          isValid: false,
          error: 'Database access not enabled for this bot'
        }
      }

      // Update last used timestamp
      await db.botSettings.upsert({
        where: {
          bot_id_setting_key: {
            bot_id: token.bot_id,
            setting_key: 'database_last_used_at'
          }
        },
        update: {
          setting_value: new Date().toISOString()
        },
        create: {
          bot_id: token.bot_id,
          setting_key: 'database_last_used_at',
          setting_value: new Date().toISOString()
        }
      })

      // Get permissions
      const permissions = token.bot.settings
        .filter(s => s.setting_key.startsWith('database_permission_'))
        .map(s => s.setting_key.replace('database_permission_', ''))

      return {
        isValid: true,
        botId: token.bot_id,
        userId: token.bot.user_id,
        permissions
      }

    } catch (error) {
      console.error('Database auth validation error:', error)
      return {
        isValid: false,
        error: 'Authentication validation failed'
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(authResult: DatabaseAuthResult, permission: string): boolean {
    if (!authResult.isValid || !authResult.permissions) {
      return false
    }

    return authResult.permissions.includes(permission) || authResult.permissions.includes('all')
  }

  /**
   * Create database access credentials for a bot
   */
  static async createDatabaseCredentials(
    botId: number, 
    permissions: string[] = ['read'],
    expiresInDays: number = 365
  ): Promise<{ accessToken: string; secretKey: string; expiresAt: Date }> {
    try {
      // Generate secure tokens
      const accessToken = this.generateSecureToken(32)
      const secretKey = this.generateSecureToken(32)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      // Store credentials in database
      await db.botSettings.createMany({
        data: [
          {
            bot_id: botId,
            setting_key: 'database_access_token',
            setting_value: accessToken,
            is_encrypted: true
          },
          {
            bot_id: botId,
            setting_key: 'database_secret_key',
            setting_value: secretKey,
            is_encrypted: true
          },
          {
            bot_id: botId,
            setting_key: 'database_token_expires_at',
            setting_value: expiresAt.toISOString(),
            is_encrypted: false
          },
          {
            bot_id: botId,
            setting_key: 'database_access_enabled',
            setting_value: 'true',
            is_encrypted: false
          },
          ...permissions.map(permission => ({
            bot_id: botId,
            setting_key: `database_permission_${permission}`,
            setting_value: 'true',
            is_encrypted: false
          }))
        ]
      })

      return {
        accessToken,
        secretKey,
        expiresAt
      }

    } catch (error) {
      console.error('Failed to create database credentials:', error)
      throw new Error('Failed to create database credentials')
    }
  }

  /**
   * Revoke database access for a bot
   */
  static async revokeDatabaseAccess(botId: number): Promise<void> {
    try {
      await db.botSettings.deleteMany({
        where: {
          bot_id: botId,
          setting_key: {
            in: [
              'database_access_token',
              'database_secret_key',
              'database_token_expires_at',
              'database_access_enabled'
            ]
          }
        }
      })

      // Also remove permission settings
      await db.botSettings.deleteMany({
        where: {
          bot_id: botId,
          setting_key: {
            startsWith: 'database_permission_'
          }
        }
      })

    } catch (error) {
      console.error('Failed to revoke database access:', error)
      throw new Error('Failed to revoke database access')
    }
  }

  /**
   * Generate secure random token
   */
  private static generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const randomArray = new Uint8Array(length)
    crypto.getRandomValues(randomArray)
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length]
    }
    
    return result
  }
}
