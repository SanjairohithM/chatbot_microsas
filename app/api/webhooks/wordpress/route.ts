import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { UserApiKeyService } from '@/lib/services/user-api-key.service'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      bot_id, 
      site_url, 
      data, 
      export_type,
      webhook_secret 
    } = body

    // Verify webhook secret
    const expectedSecret = process.env.WORDPRESS_WEBHOOK_SECRET
    if (!webhook_secret || webhook_secret !== expectedSecret) {
      return ApiResponse.unauthorized('Invalid webhook secret')
    }

    if (!bot_id || !site_url || !data) {
      return ApiResponse.badRequest('Missing required fields: bot_id, site_url, data')
    }

    logger.apiRequest('POST', '/api/webhooks/wordpress', { bot_id, site_url, export_type })

    // Get user's API key for embedding generation
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(bot_id)
    if (!userApiKey) {
      return ApiResponse.badRequest('No OpenAI API key found for bot. Please configure your API key in settings.')
    }

    // Process the WordPress data based on export type
    let processedCount = 0
    let errors = []

    switch (export_type) {
      case 'posts':
        processedCount = await processWordPressPosts(bot_id, site_url, data)
        break
      case 'pages':
        processedCount = await processWordPressPages(bot_id, site_url, data)
        break
      case 'full':
        processedCount = await processFullWordPressData(bot_id, site_url, data)
        break
      default:
        return ApiResponse.badRequest('Invalid export type')
    }

    // Update last sync time
    await db.botSettings.updateMany({
      where: {
        bot_id: bot_id,
        setting_key: 'wordpress_last_sync'
      },
      data: {
        setting_value: new Date().toISOString()
      }
    })

    return ApiResponse.success('WordPress data processed successfully', {
      bot_id,
      site_url,
      export_type,
      processed_count: processedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    logger.apiError('POST', '/api/webhooks/wordpress', error as Error)
    return ApiResponse.internalServerError('Failed to process WordPress data')
  }
}

async function processWordPressPosts(botId: number, siteUrl: string, posts: any[]) {
  let processedCount = 0

  for (const post of posts) {
    try {
      // Create knowledge document
      const document = await KnowledgeDocumentService.createKnowledgeDocument({
        bot_id: botId,
        title: `WordPress Post: ${post.title}`,
        content: formatWordPressPost(post),
        file_type: 'wordpress_post',
        file_url: post.url,
        file_size: post.content.length,
        status: 'processing'
      })

      // Store in Pinecone
      const enhancedContent = `WordPress Post from ${siteUrl}

Title: ${post.title}
Content: ${post.content}
Excerpt: ${post.excerpt || 'No excerpt available'}
Author: ${post.author}
Published: ${post.date}
URL: ${post.url}
Categories: ${post.categories?.join(', ') || 'None'}
Tags: ${post.tags?.join(', ') || 'None'}

${post.content}`

      await PineconeDocumentService.storeDocument(
        botId,
        post.id,
        post.title,
        enhancedContent,
        userApiKey
      )

      processedCount++
    } catch (error) {
      console.error(`Error processing post ${post.id}:`, error)
    }
  }

  return processedCount
}

async function processWordPressPages(botId: number, siteUrl: string, pages: any[]) {
  let processedCount = 0

  for (const page of pages) {
    try {
      // Create knowledge document
      const document = await KnowledgeDocumentService.createKnowledgeDocument({
        bot_id: botId,
        title: `WordPress Page: ${page.title}`,
        content: formatWordPressPage(page),
        file_type: 'wordpress_page',
        file_url: page.url,
        file_size: page.content.length,
        status: 'processing'
      })

      // Store in Pinecone
      const enhancedContent = `WordPress Page from ${siteUrl}

Title: ${page.title}
Content: ${page.content}
Excerpt: ${page.excerpt || 'No excerpt available'}
Author: ${page.author}
Published: ${page.date}
URL: ${page.url}
Parent: ${page.parent || 'None'}
Menu Order: ${page.menu_order || 0}

${page.content}`

      await PineconeDocumentService.storeDocument(
        botId,
        page.id,
        page.title,
        enhancedContent,
        userApiKey
      )

      processedCount++
    } catch (error) {
      console.error(`Error processing page ${page.id}:`, error)
    }
  }

  return processedCount
}

async function processFullWordPressData(botId: number, siteUrl: string, data: any) {
  let processedCount = 0

  // Process posts
  if (data.posts && data.posts.length > 0) {
    processedCount += await processWordPressPosts(botId, siteUrl, data.posts)
  }

  // Process pages
  if (data.pages && data.pages.length > 0) {
    processedCount += await processWordPressPages(botId, siteUrl, data.pages)
  }

  // Process categories
  if (data.categories && data.categories.length > 0) {
    for (const category of data.categories) {
      try {
        const enhancedContent = `WordPress Category from ${siteUrl}

Name: ${category.name}
Description: ${category.description || 'No description'}
Slug: ${category.slug}
Post Count: ${category.count}
Parent: ${category.parent || 'None'}

This category contains ${category.count} posts.`

        await PineconeDocumentService.storeDocument(
          botId,
          category.id,
          category.name,
          enhancedContent,
          userApiKey
        )

        processedCount++
      } catch (error) {
        console.error(`Error processing category ${category.id}:`, error)
      }
    }
  }

  // Process tags
  if (data.tags && data.tags.length > 0) {
    for (const tag of data.tags) {
      try {
        const enhancedContent = `WordPress Tag from ${siteUrl}

Name: ${tag.name}
Description: ${tag.description || 'No description'}
Slug: ${tag.slug}
Post Count: ${tag.count}

This tag is used in ${tag.count} posts.`

        await PineconeDocumentService.storeDocument(
          botId,
          tag.id,
          tag.name,
          enhancedContent,
          userApiKey
        )

        processedCount++
      } catch (error) {
        console.error(`Error processing tag ${tag.id}:`, error)
      }
    }
  }

  return processedCount
}

function formatWordPressPost(post: any): string {
  return `WordPress Post: ${post.title}

Content: ${post.content}

Excerpt: ${post.excerpt || 'No excerpt available'}

Author: ${post.author}
Published: ${post.date}
URL: ${post.url}
Categories: ${post.categories?.join(', ') || 'None'}
Tags: ${post.tags?.join(', ') || 'None'}`
}

function formatWordPressPage(page: any): string {
  return `WordPress Page: ${page.title}

Content: ${page.content}

Excerpt: ${page.excerpt || 'No excerpt available'}

Author: ${page.author}
Published: ${page.date}
URL: ${page.url}
Parent: ${page.parent || 'None'}
Menu Order: ${page.menu_order || 0}`
}
