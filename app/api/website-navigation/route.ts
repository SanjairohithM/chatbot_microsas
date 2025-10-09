import { NextRequest, NextResponse } from 'next/server'
import { openAIAPI } from '@/lib/openai-api'

export async function POST(request: NextRequest) {
  try {
    const { message, currentPath } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log('🌐 Website Navigation API called:', { message, currentPath })

    // Create a system prompt for website navigation
    const systemPrompt = `You are a helpful website navigation assistant. Your job is to help users navigate the website and provide relevant information.

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

When users ask to:
- "Go to dashboard" or "Take me to dashboard" → navigate to /dashboard
- "Show me pricing" or "Go to pricing" → scroll to #pricing or navigate to /pricing
- "Sign in" or "Login" → navigate to /auth
- "Show features" → scroll to #features
- "View testimonials" → scroll to #testimonials
- "Contact us" → scroll to #cta or navigate to /contact

Respond with helpful navigation assistance and provide navigation actions when appropriate.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ]

    // Get response from OpenAI
    const response = await openAIAPI.generateChat(messages, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500
    })

    const assistantMessage = response.message

    // Determine navigation actions based on the message
    const navigationActions = []
    const lowerMessage = message.toLowerCase()

    // Check for navigation intents
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

    // Determine if we should auto-navigate
    let autoNavigate = null
    
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
      }
    }
    
    // If no explicit auto-navigate but we have navigation actions, set the first one as auto-navigate
    if (!autoNavigate && navigationActions.length > 0) {
      const firstNavigateAction = navigationActions.find(action => action.action === 'navigate')
      if (firstNavigateAction) {
        autoNavigate = { action: 'navigate', path: firstNavigateAction.path }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      navigationActions,
      autoNavigate,
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