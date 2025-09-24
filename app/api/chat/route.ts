import { NextRequest, NextResponse } from 'next/server'
import { deepSeekAPI } from '@/lib/deepseek-api'
import { config } from '@/lib/config'
import { ConversationService } from '@/lib/services/conversation.service'
import { BotService } from '@/lib/services/bot.service'
import { DocumentSearchService } from '@/lib/services/document-search.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'
import type { DeepSeekMessage } from '@/lib/deepseek-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, message, botConfig, conversationId, botId, userId } = body

    logger.apiRequest('POST', '/api/chat', userId)

    // Handle both formats: messages array (dashboard) and single message (widget)
    let validMessages: DeepSeekMessage[] = []
    
    if (messages && Array.isArray(messages)) {
      // Dashboard format - array of messages
      const validation = validateRequest({
        messages: { required: true, type: 'array' },
        botId: { required: true, type: 'number' },
        userId: { required: true, type: 'number' },
        conversationId: { type: 'number' }
      }, body)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      // Validate messages format
      validMessages = messages.map((msg: any) => {
        if (!msg.role || !msg.content) {
          throw new Error('Invalid message format')
        }
        if (!['system', 'user', 'assistant'].includes(msg.role)) {
          throw new Error('Invalid message role')
        }
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        }
      })
    } else if (message && typeof message === 'string') {
      // Widget format - single message string
      const validation = validateRequest({
        message: { required: true, type: 'string' },
        botId: { required: true, type: 'number' },
        conversationId: { type: 'number' }
      }, body)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      // Convert single message to array format
      validMessages = [{
        role: 'user' as const,
        content: message
      }]
    } else {
      return ApiResponse.badRequest('Either messages array or message string is required')
    }

    // Get bot configuration
    const bot = await BotService.getBotById(botId)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Use bot configuration or provided config
    const model = botConfig?.model || bot.model
    const temperature = botConfig?.temperature || bot.temperature
    const maxTokens = botConfig?.max_tokens || bot.max_tokens

    const startTime = Date.now()

    // Get document context for the user's query
    const lastUserMessage = validMessages.filter(msg => msg.role === 'user').pop()
    let documentContext = ''
    
    if (lastUserMessage) {
      try {
        console.log(`[Chat API] Searching for context for bot ${botId} with message: "${lastUserMessage.content}"`)
        documentContext = await DocumentSearchService.getContextForQuery(botId, lastUserMessage.content)
        console.log(`[Chat API] Document context length: ${documentContext.length}`)
        if (documentContext) {
          console.log(`[Chat API] Document context preview: ${documentContext.substring(0, 200)}...`)
        }
      } catch (error) {
        console.error('Document search failed, continuing without context:', error)
        documentContext = ''
      }
    }

    // Enhance system prompt with document context
    let enhancedMessages = [...validMessages]
    if (documentContext && enhancedMessages.length > 0) {
      // Find system message or create one
      const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role === 'system')
      const systemPrompt = bot.system_prompt || 'You are a helpful assistant.'
      
      if (systemMessageIndex >= 0) {
        enhancedMessages[systemMessageIndex].content = `${systemPrompt}\n\n${documentContext}`
      } else {
        enhancedMessages.unshift({
          role: 'system',
          content: `${systemPrompt}\n\n${documentContext}`
        })
      }
    }

    // Generate response from DeepSeek
    const response = await deepSeekAPI.generateResponse(enhancedMessages, {
      model,
      temperature,
      max_tokens: maxTokens
    })

    const responseTime = Date.now() - startTime

    // Extract the assistant's message
    const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Save messages to database
    let currentConversationId = conversationId

    // Create conversation if it doesn't exist
    if (!currentConversationId) {
      // For widget requests, use a default userId if not provided
      const effectiveUserId = userId || 1 // Default user for widget conversations
      
      const conversation = await ConversationService.createConversation({
        botId,
        userId: effectiveUserId,
        title: 'Widget Conversation',
        isTest: true // Mark widget conversations as test conversations
      })
      currentConversationId = conversation.id
    }

    // Save user message (last message should be user message)
    const lastMessage = validMessages[validMessages.length - 1]
    if (lastMessage.role === 'user') {
      await ConversationService.createMessage({
        conversationId: currentConversationId,
        role: 'user',
        content: lastMessage.content
      })
    }

    // Save assistant response
    const savedMessage = await ConversationService.createMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: assistantMessage,
      tokensUsed: response.usage?.total_tokens,
      responseTimeMs: responseTime
    })

    logger.apiResponse('POST', '/api/chat', 200, responseTime)

    // Return response in format expected by both dashboard and widget
    const responseData = {
      success: true,
      message: assistantMessage,
      conversationId: currentConversationId,
      messageId: savedMessage.id,
      usage: response.usage,
      model: response.model,
      finish_reason: response.choices[0]?.finish_reason,
      response_time_ms: responseTime
    }

    // Create response with CORS headers
    const nextResponse = NextResponse.json(responseData, { status: 200 })
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    logger.apiError('POST', '/api/chat', error as Error)
    
    const errorResponse = ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Internal server error'
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
