import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { db } from '@/lib/db'

// POST /api/sync/wordpress - Trigger WordPress sync for all enabled bots
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_id, force_sync = false } = body

    logger.apiRequest('POST', '/api/sync/wordpress', { bot_id, force_sync })

    if (bot_id) {
      // Sync specific bot
      const result = await syncWordPressBot(parseInt(bot_id), force_sync)
      return ApiResponse.success('WordPress sync completed', result)
    } else {
      // Sync all enabled bots
      const results = await syncAllWordPressBots()
      return ApiResponse.success('WordPress sync completed for all bots', results)
    }

  } catch (error) {
    logger.apiError('POST', '/api/sync/wordpress', error as Error)
    return ApiResponse.internalServerError('Failed to sync WordPress data')
  }
}

async function syncWordPressBot(botId: number, forceSync: boolean = false) {
  try {
    // Get bot WordPress settings
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

    if (syncSettings.sync_enabled !== 'true') {
      return { bot_id: botId, status: 'disabled', message: 'WordPress sync not enabled' }
    }

    // Check if sync is needed
    if (!forceSync && !shouldSync(syncSettings)) {
      return { bot_id: botId, status: 'skipped', message: 'Sync not needed yet' }
    }

    // Trigger WordPress sync
    const wordpressUrl = syncSettings.url
    const accessToken = syncSettings.access_token
    const secretKey = syncSettings.secret_key

    if (!wordpressUrl || !accessToken || !secretKey) {
      return { bot_id: botId, status: 'error', message: 'Missing WordPress credentials' }
    }

    // Call WordPress API to export data
    const exportData = await callWordPressExportAPI(wordpressUrl, accessToken, secretKey, syncSettings)

    if (!exportData.success) {
      return { bot_id: botId, status: 'error', message: 'Failed to export from WordPress' }
    }

    // Process the exported data
    const processedCount = await processWordPressData(botId, wordpressUrl, exportData.data)

    // Update last sync time
    await db.botSettings.updateMany({
      where: {
        bot_id: botId,
        setting_key: 'wordpress_last_sync'
      },
      data: {
        setting_value: new Date().toISOString()
      }
    })

    return {
      bot_id: botId,
      status: 'success',
      processed_count: processedCount,
      wordpress_url: wordpressUrl,
      last_sync: new Date().toISOString()
    }

  } catch (error) {
    console.error(`Error syncing WordPress for bot ${botId}:`, error)
    return { bot_id: botId, status: 'error', message: error.message }
  }
}

async function syncAllWordPressBots() {
  // Get all bots with WordPress sync enabled
  const bots = await db.botSettings.findMany({
    where: {
      setting_key: 'wordpress_sync_enabled',
      setting_value: 'true'
    },
    select: {
      bot_id: true
    }
  })

  const results = []
  for (const bot of bots) {
    const result = await syncWordPressBot(bot.bot_id)
    results.push(result)
  }

  return results
}

function shouldSync(syncSettings: Record<string, string>): boolean {
  const lastSync = syncSettings.last_sync
  const frequency = syncSettings.sync_frequency || 'daily'

  if (!lastSync) return true

  const lastSyncDate = new Date(lastSync)
  const now = new Date()
  const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60)

  switch (frequency) {
    case 'hourly':
      return diffHours >= 1
    case 'daily':
      return diffHours >= 24
    case 'weekly':
      return diffHours >= 168 // 7 days
    case 'monthly':
      return diffHours >= 720 // 30 days
    default:
      return diffHours >= 24
  }
}

async function callWordPressExportAPI(
  wordpressUrl: string,
  accessToken: string,
  secretKey: string,
  syncSettings: Record<string, string>
) {
  try {
    const exportUrl = `${wordpressUrl}/wp-json/omnix-chatbot/v1/export/full`
    
    const response = await fetch(exportUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Secret-Key': secretKey
      },
      body: JSON.stringify({
        include_posts: syncSettings.include_posts === 'true',
        include_pages: syncSettings.include_pages === 'true',
        include_categories: syncSettings.include_categories === 'true',
        include_tags: syncSettings.include_tags === 'true',
        include_media: syncSettings.include_media === 'true',
        limit: 100
      })
    })

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    console.error('Error calling WordPress export API:', error)
    return { success: false, error: error.message }
  }
}

async function processWordPressData(botId: number, siteUrl: string, data: any) {
  // This would call the same processing functions from the webhook
  // For now, we'll return a placeholder
  return 0
}
