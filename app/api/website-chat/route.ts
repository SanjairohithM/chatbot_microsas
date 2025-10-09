import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/services/openai.service'
import { UserApiKeyService } from '@/lib/services/user-api-key.service'

export async function POST(request: NextRequest) {
  try {
    const { message, botId = 1 } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log(`[Website Chat] Processing message for bot ${botId}:`, message)

    // Create a system prompt for the website assistant
    const systemPrompt = `You are a helpful website assistant for Convox, an AI chatbot platform. 
    
Your role is to:
- Help visitors understand our services and products
- Answer questions about AI chatbots, automation, and customer support
- Provide information about pricing, features, and benefits
- Guide visitors to relevant resources or contact information
- Be friendly, professional, and helpful

Key information about Convox:
- We provide AI chatbot solutions for businesses
- Our platform helps automate customer support
- We offer various pricing plans and features
- We have analytics, deployment tools, and knowledge management
- We support voice and text interactions

Keep responses concise but informative. If you don't know something specific, suggest they contact our support team or visit our dashboard for more details.`

    // Get user's API key for this bot
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(botId)
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'No OpenAI API key found. Please configure your API key in settings.' },
        { status: 400 }
      )
    }

    // Call OpenAI API using the service with user's API key
    const response = await OpenAIService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ], {
      temperature: 0.7,
      max_tokens: 500
    }, userApiKey)

    console.log(`[Website Chat] Generated response:`, response)

    return NextResponse.json({
      message: response,
      messageId: Date.now(),
      conversationId: `website_${Date.now()}`,
      usage: { total_tokens: 0 }, // Simple usage tracking
      response_time_ms: Date.now() // Simple timing
    })

  } catch (error) {
    console.error('[Website Chat] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        message: 'Sorry, I\'m having trouble right now. Please try again later.',
        messageId: Date.now(),
        conversationId: `website_error_${Date.now()}`
      },
      { status: 500 }
    )
  }
}
