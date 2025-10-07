import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/bots/[botId]/auto-credentials - Generate automatic credentials for WordPress sync
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
    const { 
      wordpress_url, 
      sync_frequency = 'daily',
      include_posts = true,
      include_pages = true,
      include_categories = true,
      include_tags = true,
      include_media = false
    } = body

    if (!wordpress_url) {
      return ApiResponse.badRequest('WordPress URL is required')
    }

    // Validate WordPress URL
    let wpUrl: URL
    try {
      wpUrl = new URL(wordpress_url)
    } catch {
      return ApiResponse.badRequest('Invalid WordPress URL format')
    }

    logger.apiRequest('POST', `/api/bots/${botId}/auto-credentials`, { botId, wordpress_url })

    // Generate secure credentials
    const accessToken = 'ox_' + crypto.randomBytes(32).toString('hex')
    const secretKey = 'ox_sk_' + crypto.randomBytes(32).toString('hex')
    const webhookSecret = 'ox_wh_' + crypto.randomBytes(32).toString('hex')

    // Store credentials in bot settings
    await db.botSettings.createMany({
      data: [
        {
          bot_id: botId,
          setting_key: 'wordpress_access_token',
          setting_value: accessToken,
          is_encrypted: true
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_secret_key',
          setting_value: secretKey,
          is_encrypted: true
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_webhook_secret',
          setting_value: webhookSecret,
          is_encrypted: true
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_url',
          setting_value: wordpress_url,
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_sync_frequency',
          setting_value: sync_frequency,
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_include_posts',
          setting_value: include_posts.toString(),
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_include_pages',
          setting_value: include_pages.toString(),
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_include_categories',
          setting_value: include_categories.toString(),
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_include_tags',
          setting_value: include_tags.toString(),
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_include_media',
          setting_value: include_media.toString(),
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_sync_enabled',
          setting_value: 'true',
          is_encrypted: false
        },
        {
          bot_id: botId,
          setting_key: 'wordpress_last_sync',
          setting_value: new Date().toISOString(),
          is_encrypted: false
        }
      ]
    })

    // Generate WordPress plugin configuration
    const pluginConfig = {
      api_base_url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
      api_key: accessToken,
      secret_key: secretKey,
      webhook_secret: webhookSecret,
      bot_id: botId,
      sync_frequency,
      include_posts,
      include_pages,
      include_categories,
      include_tags,
      include_media
    }

    return ApiResponse.success('WordPress credentials generated successfully', {
      bot_id: botId,
      wordpress_url: wordpress_url,
      access_token: accessToken,
      secret_key: secretKey,
      webhook_secret: webhookSecret,
      plugin_config: pluginConfig,
      next_sync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    })

  } catch (error) {
    logger.apiError('POST', `/api/bots/${params.botId}/auto-credentials`, error)
    return ApiResponse.internalServerError('Failed to generate WordPress credentials')
  }
}

// GET /api/bots/[botId]/auto-credentials - Get current WordPress sync status
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    // Get WordPress sync settings
    const settings = await db.botSettings.findMany({
      where: {
        bot_id: botId,
        setting_key: {
          startsWith: 'wordpress_'
        }
      }
    })

    const syncSettings = settings.reduce((acc, setting) => {
      acc[setting.setting_key.replace('wordpress_', '')] = setting.setting_value
      return acc
    }, {} as Record<string, string>)

    if (!syncSettings.sync_enabled) {
      return ApiResponse.success('WordPress sync not configured', {
        bot_id: botId,
        sync_enabled: false
      })
    }

    return ApiResponse.success('WordPress sync status retrieved', {
      bot_id: botId,
      sync_enabled: syncSettings.sync_enabled === 'true',
      wordpress_url: syncSettings.url,
      sync_frequency: syncSettings.sync_frequency,
      last_sync: syncSettings.last_sync,
      include_posts: syncSettings.include_posts === 'true',
      include_pages: syncSettings.include_pages === 'true',
      include_categories: syncSettings.include_categories === 'true',
      include_tags: syncSettings.include_tags === 'true',
      include_media: syncSettings.include_media === 'true'
    })

  } catch (error) {
    logger.apiError('GET', `/api/bots/${params.botId}/auto-credentials`, error)
    return ApiResponse.internalServerError('Failed to retrieve WordPress sync status')
  }
}

// DELETE /api/bots/[botId]/auto-credentials - Disable WordPress sync
export async function DELETE(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return ApiResponse.badRequest('Invalid bot ID')
    }

    // Disable WordPress sync
    await db.botSettings.updateMany({
      where: {
        bot_id: botId,
        setting_key: 'wordpress_sync_enabled'
      },
      data: {
        setting_value: 'false'
      }
    })

    logger.apiRequest('DELETE', `/api/bots/${botId}/auto-credentials`, { botId })

    return ApiResponse.success('WordPress sync disabled successfully', {
      bot_id: botId,
      sync_enabled: false
    })

  } catch (error) {
    logger.apiError('DELETE', `/api/bots/${params.botId}/auto-credentials`, error)
    return ApiResponse.internalServerError('Failed to disable WordPress sync')
  }
}
