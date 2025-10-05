import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/services/openai.service'

// Website structure and navigation data
const websiteStructure = {
  pages: [
    { path: '/', name: 'Home', description: 'Main landing page with hero section, features, and pricing' },
    { path: '/auth', name: 'Sign In', description: 'Authentication page for login and signup' },
    { path: '/dashboard', name: 'Dashboard', description: 'Main dashboard for managing AI bots and analytics' },
    { path: '/dashboard/chat', name: 'Chat Interface', description: 'Chat with your AI bots and manage conversations' },
    { path: '/dashboard/analytics', name: 'Analytics', description: 'View bot performance, usage statistics, and insights' },
    { path: '/dashboard/knowledge', name: 'Knowledge Base', description: 'Manage documents, upload files, and train your bots' },
    { path: '/dashboard/deployment', name: 'Deployment', description: 'Deploy bots to websites, get embed codes, and API keys' },
    { path: '/analytics', name: 'Public Analytics', description: 'Public analytics and insights page' },
    { path: '/products', name: 'Products', description: 'Our AI chatbot products and features' },
    { path: '/customers', name: 'Customers', description: 'Customer testimonials and case studies' },
    { path: '/support', name: 'Support', description: 'Help center, documentation, and support resources' }
  ],
  sections: [
    { id: 'hero', name: 'Hero Section', description: 'Main banner with call-to-action' },
    { id: 'features', name: 'Features', description: 'Key features and capabilities' },
    { id: 'pricing', name: 'Pricing', description: 'Pricing plans and packages' },
    { id: 'testimonials', name: 'Testimonials', description: 'Customer reviews and feedback' },
    { id: 'benefits', name: 'Benefits', description: 'Why choose our platform' },
    { id: 'process', name: 'Process', description: 'How our platform works' },
    { id: 'resources', name: 'Resources', description: 'Documentation and guides' },
    { id: 'cta', name: 'Call to Action', description: 'Sign up and get started' }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { message, currentPath = '/' } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log(`[Website Navigation] Processing navigation request:`, message)

    // Create a comprehensive system prompt for navigation assistance
    const systemPrompt = `You are a helpful website navigation assistant for Convox, an AI chatbot platform. 

Your role is to help visitors navigate the website by:
1. Understanding what they're looking for
2. Directing them to the right pages or sections
3. Providing navigation buttons/links when appropriate
4. Explaining what they'll find on each page

WEBSITE STRUCTURE:
${JSON.stringify(websiteStructure, null, 2)}

NAVIGATION CAPABILITIES:
- You can navigate users to any page by providing a "navigate" action
- You can scroll to specific sections on the current page
- You can provide quick links to popular destinations
- You can explain what each page contains

RESPONSE FORMAT:
When providing navigation help, include:
1. A helpful explanation
2. Navigation actions in this format: {"action": "navigate", "path": "/path", "label": "Page Name"}
3. Quick links for related pages

EXAMPLES:
- User: "I want to see pricing" → Navigate to pricing section or pricing page
- User: "How do I create a bot?" → Navigate to dashboard or knowledge base
- User: "Show me analytics" → Navigate to analytics page
- User: "I need help" → Navigate to support page

Be conversational and helpful. Always provide clear navigation options.`

    // Call OpenAI API using the service
    const response = await OpenAIService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Current page: ${currentPath}. User request: ${message}` }
    ], {
      temperature: 0.7,
      max_tokens: 500
    })

    console.log(`[Website Navigation] Generated response:`, response)

    // Create navigation action based on user request
    const navigationAction = createNavigationAction(message)
    
    // Determine if we should auto-navigate
    const shouldAutoNavigate = shouldAutoNavigateUser(message, navigationAction ? [navigationAction] : [])
    const autoNavigateAction = shouldAutoNavigate ? navigationAction : null

    // Create a response message that includes navigation instruction
    let responseMessage = response
    if (autoNavigateAction) {
      responseMessage = `${response} I'll take you there now!`
    }

    return NextResponse.json({
      message: responseMessage,
      messageId: Date.now(),
      conversationId: `navigation_${Date.now()}`,
      navigationActions: navigationAction ? [navigationAction] : [],
      autoNavigate: autoNavigateAction,
      usage: { total_tokens: 0 },
      response_time_ms: Date.now()
    })

  } catch (error) {
    console.error('[Website Navigation] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process navigation request',
        message: 'Sorry, I\'m having trouble with navigation right now. Please try again later.',
        messageId: Date.now(),
        conversationId: `navigation_error_${Date.now()}`
      },
      { status: 500 }
    )
  }
}

// Helper function to extract navigation actions from AI response
function extractNavigationActions(response: string) {
  const actions = []
  
  // Map common terms to actual paths
  const pathMapping: { [key: string]: string } = {
    'home': '/',
    'dashboard': '/dashboard',
    'analytics': '/dashboard/analytics',
    'chat': '/dashboard/chat',
    'knowledge': '/dashboard/knowledge',
    'deployment': '/dashboard/deployment',
    'pricing': '/#pricing',
    'features': '/#features',
    'testimonials': '/#testimonials',
    'support': '/support',
    'products': '/products',
    'customers': '/customers',
    'sign in': '/auth',
    'login': '/auth',
    'authentication': '/auth'
  }

  // Look for navigation patterns in the response
  const navigationPatterns = [
    /navigate to (?:the )?([^"]+)/gi,
    /go to (?:the )?([^"]+)/gi,
    /visit (?:the )?([^"]+)/gi,
    /check out (?:the )?([^"]+)/gi
  ]

  for (const pattern of navigationPatterns) {
    const matches = response.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const pageName = match.replace(/navigate to|go to|visit|check out/gi, '').trim()
        const path = pathMapping[pageName.toLowerCase()] || `/${pageName.toLowerCase()}`
        
        actions.push({
          action: 'navigate',
          path: path,
          label: pageName.charAt(0).toUpperCase() + pageName.slice(1)
        })
      })
    }
  }

  return actions
}

// Helper function to create navigation action from user message
function createNavigationAction(message: string) {
  const messageLower = message.toLowerCase()
  
  // Map common terms to actual paths
  const pathMapping: { [key: string]: string } = {
    'home': '/',
    'dashboard': '/dashboard',
    'analytics': '/dashboard/analytics',
    'chat': '/dashboard/chat',
    'knowledge': '/dashboard/knowledge',
    'deployment': '/dashboard/deployment',
    'pricing': '/#pricing',
    'features': '/#features',
    'testimonials': '/#testimonials',
    'support': '/support',
    'products': '/products',
    'customers': '/customers',
    'sign in': '/auth',
    'login': '/auth',
    'authentication': '/auth'
  }

  // Check for direct page requests
  for (const [page, path] of Object.entries(pathMapping)) {
    if (messageLower.includes(page)) {
      return {
        action: 'navigate',
        path: path,
        label: page.charAt(0).toUpperCase() + page.slice(1)
      }
    }
  }

  return null
}

// Helper function to determine if we should auto-navigate
function shouldAutoNavigateUser(message: string, navigationActions: any[]) {
  if (navigationActions.length === 0) return false
  
  const messageLower = message.toLowerCase()
  
  // Auto-navigate triggers - more comprehensive list
  const autoNavigateTriggers = [
    'navigate to',
    'go to',
    'take me to',
    'show me',
    'i want to see',
    'i need to',
    'can you take me',
    'direct me to',
    'bring me to',
    'let me see',
    'i want to go',
    'i need to go',
    'take me',
    'show me the',
    'i want to visit',
    'i need to visit',
    'i am trouble',
    'i need help',
    'help me',
    'can you help',
    'i want to',
    'i need to go to',
    'i want to go to',
    'i need to see',
    'i want to see',
    'i need to visit',
    'i want to visit',
    'i need to navigate',
    'i want to navigate',
    'i need to get to',
    'i want to get to'
  ]
  
  // Check if message contains auto-navigate triggers
  const hasTrigger = autoNavigateTriggers.some(trigger => 
    messageLower.includes(trigger)
  )
  
  // Also auto-navigate for direct page requests
  const directPageRequests = [
    'dashboard', 'analytics', 'chat', 'knowledge', 'deployment',
    'pricing', 'features', 'support', 'products', 'customers',
    'sign in', 'login', 'auth', 'home', 'help', 'trouble'
  ]
  
  const hasDirectRequest = directPageRequests.some(page => 
    messageLower.includes(page)
  )
  
  // Special case for support/help requests
  const isSupportRequest = messageLower.includes('support') || 
                          messageLower.includes('help') || 
                          messageLower.includes('trouble') ||
                          messageLower.includes('problem')
  
  return hasTrigger || hasDirectRequest || isSupportRequest
}
