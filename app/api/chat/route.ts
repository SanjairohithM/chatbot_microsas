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

      // Validate messages format and handle images
      validMessages = messages.map((msg: any) => {
        if (!msg.role || !msg.content) {
          throw new Error('Invalid message format')
        }
        if (!['system', 'user', 'assistant'].includes(msg.role)) {
          throw new Error('Invalid message role')
        }
        
        // Handle image content
        if (msg.image_url && msg.role === 'user') {
          return {
            role: msg.role as 'system' | 'user' | 'assistant',
            content: [
              {
                type: 'text' as const,
                text: msg.content
              },
              {
                type: 'image_url' as const,
                image_url: {
                  url: msg.image_url,
                  detail: 'high' as const
                }
              }
            ]
          }
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
    let imageAnalysis = ''
    
    if (lastUserMessage) {
      // Extract text content from the message (handle both string and array formats)
      let messageText = ''
      let imageUrl = ''
      
      if (typeof lastUserMessage.content === 'string') {
        messageText = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        const textPart = lastUserMessage.content.find(part => part.type === 'text')
        const imagePart = lastUserMessage.content.find(part => part.type === 'image_url')
        messageText = textPart?.text || ''
        imageUrl = imagePart?.image_url?.url || ''
      }
      
      try {
        console.log(`[Chat API] Searching for context for bot ${botId} with message: "${messageText}"`)
        documentContext = await DocumentSearchService.getContextForQuery(botId, messageText)
        console.log(`[Chat API] Document context length: ${documentContext.length}`)
        if (documentContext) {
          console.log(`[Chat API] Document context preview: ${documentContext.substring(0, 200)}...`)
        }
      } catch (error) {
        console.error('Document search failed, continuing without context:', error)
        documentContext = ''
      }

      // Check if there's an image and provide helpful response
      if (imageUrl) {
        try {
          console.log(`[Chat API] Image detected: ${imageUrl}`)
          // Since DeepSeek doesn't support images, provide a helpful response
          imageAnalysis = `I can see you've shared an image (${imageUrl}), but I'm unable to view or analyze images directly. Please describe what you see in the image, and I'll be happy to help you with any questions about it!`
          console.log(`[Chat API] Image analysis response prepared`)
        } catch (error) {
          console.error('Image processing failed:', error)
          imageAnalysis = ''
        }
      }
    }

    // Convert multimodal messages to text-only for DeepSeek (since it doesn't support images)
    let textOnlyMessages = validMessages.map(msg => {
      if (typeof msg.content === 'string') {
        return msg
      } else if (Array.isArray(msg.content)) {
        // Convert multimodal content to text
        const textParts = msg.content.filter(part => part.type === 'text')
        const imageParts = msg.content.filter(part => part.type === 'image_url')
        
        let textContent = textParts.map(part => part.text).join(' ')
        
        // Add image information to the text
        if (imageParts.length > 0) {
          textContent += ` [User has shared ${imageParts.length} image(s). Please acknowledge this and ask them to describe what they see.]`
        }
        
        return {
          role: msg.role,
          content: textContent
        }
      }
      return msg
    })

    // Enhance system prompt with document context and image analysis
    let enhancedMessages = [...textOnlyMessages]
    if ((documentContext || imageAnalysis) && enhancedMessages.length > 0) {
      // Find system message or create one
      const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role === 'system')
      const systemPrompt = bot.system_prompt || 'You are a helpful assistant.'
      
      let enhancedPrompt = systemPrompt
      if (documentContext) {
        enhancedPrompt += `\n\nRelevant information from knowledge base:\n${documentContext}`
      }
      if (imageAnalysis) {
        enhancedPrompt += `\n\nImage Analysis: ${imageAnalysis}`
      }
      
      if (systemMessageIndex >= 0) {
        enhancedMessages[systemMessageIndex].content = enhancedPrompt
      } else {
        enhancedMessages.unshift({
          role: 'system',
          content: enhancedPrompt
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
      // Extract image URL and content from the message
      let messageContent = ''
      let imageUrl = ''
      
      if (typeof lastMessage.content === 'string') {
        messageContent = lastMessage.content
      } else if (Array.isArray(lastMessage.content)) {
        // Handle multimodal content (text + image)
        const textPart = lastMessage.content.find(part => part.type === 'text')
        const imagePart = lastMessage.content.find(part => part.type === 'image_url')
        
        messageContent = textPart?.text || ''
        imageUrl = imagePart?.image_url?.url || ''
      }
      
      await ConversationService.createMessage({
        conversationId: currentConversationId,
        role: 'user',
        content: messageContent,
        imageUrl: imageUrl
      })
    }

    // Save assistant response
    const savedMessage = await ConversationService.createMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: assistantMessage,
      imageAnalysis: imageAnalysis,
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
      response_time_ms: responseTime,
      image_analysis: imageAnalysis
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
