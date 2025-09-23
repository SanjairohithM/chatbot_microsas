import { NextRequest } from 'next/server'
import { deepSeekAPI } from '@/lib/deepseek-api'
import { config } from '@/lib/config'
import { ConversationService } from '@/lib/services/conversation.service'
import { BotService } from '@/lib/services/bot.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'
import type { DeepSeekMessage } from '@/lib/deepseek-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, botConfig, conversationId, botId, userId } = body

    logger.apiRequest('POST', '/api/chat', userId)

    // Validate request
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
    const validMessages: DeepSeekMessage[] = messages.map((msg: any) => {
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

    // Generate response from DeepSeek
    const response = await deepSeekAPI.generateResponse(validMessages, {
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
      const conversation = await ConversationService.createConversation({
        botId,
        userId,
        title: 'New Conversation',
        isTest: false
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

    return ApiResponse.success('Message sent successfully', {
      message: assistantMessage,
      conversationId: currentConversationId,
      messageId: savedMessage.id,
      usage: response.usage,
      model: response.model,
      finish_reason: response.choices[0]?.finish_reason,
      response_time_ms: responseTime
    })

  } catch (error) {
    logger.apiError('POST', '/api/chat', error as Error)
    
    return ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Internal server error'
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
