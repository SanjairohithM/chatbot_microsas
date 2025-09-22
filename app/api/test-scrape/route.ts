import { NextRequest, NextResponse } from 'next/server'
import { extractStructuredContent, generateContentSummary, determineContentType } from '@/lib/website-scraper'

export async function GET(request: NextRequest) {
  try {
    const url = 'https://mysite.makeyoueasy.com/'
    
    console.log(`Testing website scraping for: ${url}`)

    // Fetch the website content
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Extract structured content
    const structuredContent = extractStructuredContent(html, url)
    
    // Generate content summary
    const contentSummary = generateContentSummary(structuredContent, url)
    
    // Determine content type
    const contentType = determineContentType(structuredContent)

    return NextResponse.json({
      success: true,
      url,
      contentType,
      extractedContent: {
        title: structuredContent.title,
        description: structuredContent.description,
        headingsCount: structuredContent.headings.length,
        paragraphsCount: structuredContent.paragraphs.length,
        servicesCount: structuredContent.services.length,
        contactInfoCount: structuredContent.contactInfo.length,
        faqCount: structuredContent.faq.length,
        linksCount: structuredContent.links.length
      },
      sampleContent: {
        headings: structuredContent.headings.slice(0, 5),
        services: structuredContent.services.slice(0, 3),
        contactInfo: structuredContent.contactInfo.slice(0, 3),
        paragraphs: structuredContent.paragraphs.slice(0, 2)
      },
      fullContent: contentSummary
    })

  } catch (error) {
    console.error('Test scraping error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to scrape the test website'
      },
      { status: 500 }
    )
  }
}
