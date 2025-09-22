import { NextRequest, NextResponse } from 'next/server'
import { extractStructuredContent, generateContentSummary, determineContentType, type ScrapedContent } from '@/lib/website-scraper'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

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

    console.log(`Scraping website: ${targetUrl.toString()}`)

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

    return NextResponse.json({
      success: true,
      data: scrapedContent
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
