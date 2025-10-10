import { NextRequest, NextResponse } from 'next/server'
import { extractStructuredContent, generateContentSummary, determineContentType, type ScrapedContent } from '@/lib/website-scraper'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { UserApiKeyService } from '@/lib/services/user-api-key.service'

export async function POST(request: NextRequest) {
  try {
    const { url, botId } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Add protocol if missing
    if (!targetUrl.protocol) {
      targetUrl = new URL(`https://${url}`)
    }

    console.log(`[Scrape Website] Scraping website: ${targetUrl.toString()}${botId ? ` for bot ${botId}` : ''}`)

    // Fetch the website content
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Extract structured content using enhanced scraper
    const structuredContent = extractStructuredContent(html, targetUrl.toString())
    
    // Generate comprehensive content summary
    const contentSummary = generateContentSummary(structuredContent, targetUrl.toString())
    
    // Determine content type
    const contentType = determineContentType(structuredContent)

    const scrapedContent: ScrapedContent = {
      title: structuredContent.title || 'Website Content',
      description: structuredContent.description || 'Website content extracted successfully',
      content: contentSummary,
      metadata: {
        scrapedAt: new Date().toISOString(),
        url: targetUrl.toString(),
        wordCount: contentSummary.split(' ').length,
        headings: structuredContent.headings.length,
        paragraphs: structuredContent.paragraphs.length,
        links: structuredContent.links.length,
        hasContactInfo: structuredContent.contactInfo.length > 0,
        contentType
      }
    }

    // If botId is provided, store in Pinecone
    let document = null
    let pineconeStored = false
    
    if (botId) {
      try {
        console.log(`[Scrape Website] 🔍 Starting Pinecone storage process for bot ${botId}`)
        console.log(`[Scrape Website] Bot ID type: ${typeof botId}, value: ${botId}`)
        
        // Validate bot exists first
        const botIdInt = parseInt(botId)
        if (isNaN(botIdInt)) {
          throw new Error(`Invalid bot ID: ${botId}`)
        }
        
        console.log(`[Scrape Website] Creating knowledge document for bot ${botIdInt}`)
        
        // Create knowledge document record
        document = await KnowledgeDocumentService.createKnowledgeDocument({
          bot_id: botIdInt,
          title: scrapedContent.title,
          content: scrapedContent.content,
          file_type: 'website',
          file_url: targetUrl.toString(),
          file_size: scrapedContent.content.length,
          status: 'processing'
        })

        console.log(`[Scrape Website] ✅ Created knowledge document ${document.id} for URL: ${targetUrl.toString()}`)

        // Store in Pinecone with enhanced metadata
        const enhancedContent = `Website: ${targetUrl.toString()}

Title: ${scrapedContent.title}
Description: ${scrapedContent.description}

${scrapedContent.content}

Source: ${targetUrl.toString()}
Scraped At: ${scrapedContent.metadata.scrapedAt}
Content Type: ${scrapedContent.metadata.contentType}
Word Count: ${scrapedContent.metadata.wordCount}
Headings: ${scrapedContent.metadata.headings}
Paragraphs: ${scrapedContent.metadata.paragraphs}
Links: ${scrapedContent.metadata.links}
Has Contact Info: ${scrapedContent.metadata.hasContactInfo}`

        console.log(`[Scrape Website] 🌲 Storing in Pinecone namespace: bot_${botIdInt}`)
        console.log(`[Scrape Website] Enhanced content length: ${enhancedContent.length} characters`)

        // Get user's API key for embedding generation
        const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(botIdInt)
        if (!userApiKey) {
          console.error('[Scrape Website] ❌ No OpenAI API key found for bot, skipping Pinecone storage')
          throw new Error('No OpenAI API key found for bot. Please configure your API key in settings.')
        }

        await PineconeDocumentService.storeDocument(
          botIdInt,
          document.id,
          scrapedContent.title,
          enhancedContent,
          userApiKey
        )

        // Update document status to indexed
        await KnowledgeDocumentService.updateKnowledgeDocument(document.id, {
          status: 'indexed'
        })

        pineconeStored = true
        console.log(`[Scrape Website] ✅ Successfully scraped and stored website content for bot ${botIdInt} in namespace bot_${botIdInt}`)

      } catch (pineconeError) {
        console.error('[Scrape Website] ❌ Failed to store in Pinecone:', pineconeError)
        console.error('[Scrape Website] Error details:', {
          message: pineconeError instanceof Error ? pineconeError.message : 'Unknown error',
          stack: pineconeError instanceof Error ? pineconeError.stack : undefined,
          botId: botId,
          documentId: document?.id
        })
        
        // Update document status to error if document was created
        if (document) {
          await KnowledgeDocumentService.updateKnowledgeDocument(document.id, {
            status: 'error',
            processing_error: pineconeError instanceof Error ? pineconeError.message : 'Pinecone storage failed'
          })
        }
      }
    } else {
      console.log(`[Scrape Website] No botId provided, skipping Pinecone storage`)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...scrapedContent,
        document,
        pineconeStored
      }
    })

  } catch (error) {
    console.error('Website scraping error:', error)
    
    let errorMessage = 'Failed to scrape website content'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Website took too long to respond'
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Website returned an error: ${error.message}`
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the website'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'Please check the URL and try again. Make sure the website is accessible and doesn\'t require authentication.'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
