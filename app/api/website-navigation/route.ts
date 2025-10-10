import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIInstance } from '@/lib/openai-api'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'

export async function POST(request: NextRequest) {
  try {
    const { message, currentPath, botId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('🌐 Website Navigation API called:', { message, currentPath, botId })

    // Search for relevant URLs from bot's knowledge base (WordPress plugin only)
    let relevantUrls: string[] = []
    let documentContext = ''
    
    if (botId) {
      try {
        console.log(`🔍 [WordPress Plugin] Searching for relevant URLs in bot ${botId}'s knowledge base`)
        const searchResults = await PineconeDocumentService.searchDocuments(
          parseInt(botId),
          message,
          5 // Get more results to find URLs
        )
        
        if (searchResults && searchResults.length > 0) {
          // Extract URLs from metadata
          searchResults.forEach(result => {
            if (result.metadata && result.metadata.url) {
              relevantUrls.push(result.metadata.url)
            }
          })
          
          // Build document context
          documentContext = searchResults
            .map(result => `Title: ${result.title}\nContent: ${result.content.substring(0, 200)}...\nURL: ${result.metadata?.url || 'N/A'}`)
            .join('\n\n')
        }
        
        console.log(`✅ [WordPress Plugin] Found ${relevantUrls.length} relevant URLs:`, relevantUrls)
      } catch (error) {
        console.error('❌ [WordPress Plugin] Error searching bot knowledge base:', error)
      }
    } else {
      console.log('ℹ️ [Website Bot] No botId provided, using standard navigation')
    }

    // Create a system prompt for website navigation
    const systemPrompt = `You are a helpful website navigation assistant. Your job is to help users navigate the website and provide relevant information.

${relevantUrls.length > 0 ? `
RELEVANT PAGES FROM SCRAPED WEBSITE CONTENT (WordPress Plugin):
${relevantUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}

DOCUMENT CONTEXT:
${documentContext}

` : ''}

Available pages and sections:
- / (Home page)
- /auth (Sign in/Sign up)
- /dashboard (User dashboard)
- /pricing (Pricing section)
- /features (Features section)
- /about (About section)
- /contact (Contact section)

Available sections on home page:
- #hero (Hero section)
- #pricing (Pricing section)
- #features (Features section)
- #testimonials (Testimonials section)
- #cta (Call to action section)

Only provide navigation actions when users explicitly ask for navigation using phrases like:
- "Go to dashboard" or "Take me to dashboard" → navigate to /dashboard
- "Show me pricing" or "Go to pricing" → scroll to #pricing or navigate to /pricing
- "Sign in" or "Login" → navigate to /auth
- "Show features" → scroll to #features
- "View testimonials" → scroll to #testimonials
- "Contact us" → scroll to #cta or navigate to /contact
${relevantUrls.length > 0 ? `
- For WordPress Plugin: Use the actual scraped URLs provided above for navigation
- If user asks about specific content, direct them to the relevant URL from the scraped website content
` : ''}

For general questions or information requests, provide helpful answers without navigation actions unless the user specifically asks to navigate somewhere.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ]

    // Get response from OpenAI using bot's user API key
    const openAI = await getOpenAIInstance(undefined, parseInt(botId))
    const response = await openAI.generateChat(messages, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500
    })

    const assistantMessage = response.message

    // Check if user is asking for navigation
    const lowerMessage = message.toLowerCase()
    const navigationKeywords = ['go to', 'navigate', 'redirect', 'take me to', 'show me', 'visit', 'open', 'link', 'page', 'section', 'about', 'pricing', 'features', 'contact', 'dashboard', 'admin']
    const hasNavigationIntent = navigationKeywords.some(keyword => lowerMessage.includes(keyword))
    
    // Initialize navigation variables
    const navigationActions = []
    let autoNavigate = null

    if (hasNavigationIntent) {
      // First, check if any scraped URLs match the user's request (WordPress Plugin only)
      if (botId && relevantUrls.length > 0) {
        // Find the most relevant URL based on the message
        const relevantUrl = findMostRelevantUrl(relevantUrls, lowerMessage)
        if (relevantUrl) {
          navigationActions.push({
            action: 'navigate',
            path: relevantUrl,
            label: `Go to ${extractPageTitle(relevantUrl)}`
          })
        }
      }

      // Fallback to standard navigation if no relevant URLs found
      if (navigationActions.length === 0) {
        if (lowerMessage.includes('dashboard') || lowerMessage.includes('admin')) {
          navigationActions.push({
            action: 'navigate',
            path: '/dashboard',
            label: 'Go to Dashboard'
          })
        }

        if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
          navigationActions.push({
            action: 'scroll',
            section: 'pricing',
            label: 'View Pricing'
          })
        }

        if (lowerMessage.includes('sign in') || lowerMessage.includes('login') || lowerMessage.includes('auth')) {
          navigationActions.push({
            action: 'navigate',
            path: '/auth',
            label: 'Sign In'
          })
        }

        if (lowerMessage.includes('features') || lowerMessage.includes('feature')) {
          navigationActions.push({
            action: 'scroll',
            section: 'features',
            label: 'See Features'
          })
        }

        if (lowerMessage.includes('testimonial') || lowerMessage.includes('review')) {
          navigationActions.push({
            action: 'scroll',
            section: 'testimonials',
            label: 'View Testimonials'
          })
        }

        if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
          navigationActions.push({
            action: 'scroll',
            section: 'cta',
            label: 'Contact Us'
          })
        }

        if (lowerMessage.includes('about') || lowerMessage.includes('company')) {
          navigationActions.push({
            action: 'scroll',
            section: 'about',
            label: 'About Us'
          })
        }

        if (lowerMessage.includes('home') || lowerMessage.includes('main')) {
          navigationActions.push({
            action: 'navigate',
            path: '/',
            label: 'Go to Home'
          })
        }
      }
      
      // Check for explicit navigation requests
      if (lowerMessage.includes('take me to') || lowerMessage.includes('go to') || lowerMessage.includes('navigate to') || 
          lowerMessage.includes('help me navigate') || lowerMessage.includes('show me') || lowerMessage.includes('login page')) {
        if (lowerMessage.includes('dashboard') || lowerMessage.includes('admin')) {
          autoNavigate = { action: 'navigate', path: '/dashboard' }
        } else if (lowerMessage.includes('pricing') || lowerMessage.includes('price')) {
          autoNavigate = { action: 'scroll', section: 'pricing' }
        } else if (lowerMessage.includes('features') || lowerMessage.includes('feature')) {
          autoNavigate = { action: 'scroll', section: 'features' }
        } else if (lowerMessage.includes('login') || lowerMessage.includes('sign in') || lowerMessage.includes('auth')) {
          autoNavigate = { action: 'navigate', path: '/auth' }
        } else if (lowerMessage.includes('testimonial') || lowerMessage.includes('review')) {
          autoNavigate = { action: 'scroll', section: 'testimonials' }
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
          autoNavigate = { action: 'scroll', section: 'cta' }
        } else if (lowerMessage.includes('about') || lowerMessage.includes('company')) {
          autoNavigate = { action: 'scroll', section: 'about' }
        } else if (lowerMessage.includes('home') || lowerMessage.includes('main')) {
          autoNavigate = { action: 'navigate', path: '/' }
        }
      }
      
      // If no explicit auto-navigate but we have navigation actions, set the first one as auto-navigate
      if (!autoNavigate && navigationActions.length > 0) {
        const firstNavigateAction = navigationActions.find(action => action.action === 'navigate')
        if (firstNavigateAction) {
          autoNavigate = { action: 'navigate', path: firstNavigateAction.path }
        }
      }
      
      // For WordPress plugin, prioritize scraped URLs for auto-navigation
      if (botId && relevantUrls.length > 0 && !autoNavigate) {
        const relevantUrl = findMostRelevantUrl(relevantUrls, lowerMessage)
        if (relevantUrl) {
          autoNavigate = { action: 'navigate', path: relevantUrl }
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      navigationActions,
      autoNavigate,
      relevantUrls: botId ? relevantUrls : [],
      isWordPressPlugin: !!botId,
      messageId: Date.now()
    })

  } catch (error) {
    console.error('Website navigation error:', error)
    return NextResponse.json(
      { error: 'Failed to process navigation request' },
      { status: 500 }
    )
  }
}

// Helper function to find the most relevant URL based on user message
function findMostRelevantUrl(urls: string[], message: string): string | null {
  if (urls.length === 0) return null
  
  // Simple keyword matching - can be enhanced with more sophisticated matching
  const messageWords = message.toLowerCase().split(/\s+/)
  
  for (const url of urls) {
    const urlLower = url.toLowerCase()
    const urlWords = urlLower.split(/[\/\-_\.]/).filter(word => word.length > 2)
    
    // Check if any message words match URL words
    const matches = messageWords.filter(word => 
      urlWords.some(urlWord => urlWord.includes(word) || word.includes(urlWord))
    )
    
    if (matches.length > 0) {
      console.log(`🎯 Found relevant URL: ${url} (matches: ${matches.join(', ')})`)
      return url
    }
  }
  
  // If no specific match, return the first URL
  return urls[0]
}

// Helper function to extract page title from URL
function extractPageTitle(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Extract meaningful part from path
    const segments = pathname.split('/').filter(segment => segment.length > 0)
    
    if (segments.length === 0) {
      return 'Home Page'
    }
    
    // Get the last meaningful segment
    const lastSegment = segments[segments.length - 1]
    
    // Convert to readable title
    return lastSegment
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch (error) {
    return 'Page'
  }
}