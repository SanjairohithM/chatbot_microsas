import { NextRequest, NextResponse } from 'next/server'
import { openAIAPI } from '@/lib/openai-api'
import { config } from '@/lib/config'
import { ConversationService } from '@/lib/services/conversation.service'
import { BotService } from '@/lib/services/bot.service'
import { DocumentSearchService } from '@/lib/services/document-search.service'
import { PineconeService } from '@/lib/services/pinecone.service'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'
import type { OpenAIMessage } from '@/lib/openai-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { messages, message, botConfig, conversationId, botId, userId } = body

    // Convert botId to number if it's a string (from widget)
    if (typeof botId === 'string') {
      botId = parseInt(botId, 10)
      if (isNaN(botId)) {
        return ApiResponse.badRequest('Invalid bot ID format')
      }
    }

    logger.apiRequest('POST', '/api/chat', userId)

    // Handle both formats: messages array (dashboard) and single message (widget)
    let validMessages: OpenAIMessage[] = []
    
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
    let model = botConfig?.model || bot.model
    const temperature = botConfig?.temperature || bot.temperature
    const maxTokens = botConfig?.max_tokens || bot.max_tokens

    // Map legacy DeepSeek model names to OpenAI defaults
    if (model === 'deepseek-chat' || model === 'deepseek-coder') {
      model = 'gpt-4o-mini'
    }

    const startTime = Date.now()

    // Get enhanced document context for the user's query
    const lastUserMessage = validMessages.filter(msg => msg.role === 'user').pop()
    let documentContext = ''
    let imageAnalysis = ''
    let searchResults = null
    let conversationContext = ''
    
    if (lastUserMessage) {
      // Extract text content from the message (handle both string and array formats)
      let messageText = ''
      let imageUrl = ''
      
      if (typeof lastUserMessage.content === 'string') {
        messageText = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        const contentArray = lastUserMessage.content as any[]
        const textPart = contentArray.find((part: any) => part.type === 'text')
        const imagePart = contentArray.find((part: any) => part.type === 'image_url')
        messageText = textPart?.text || ''
        imageUrl = imagePart?.image_url?.url || ''
      }
      
      // Enhanced document search using Pinecone vector search
      try {
        console.log(`[Chat API] 🔍 Searching documents in Pinecone for bot ${botId} with message: "${messageText}"`)
        
        // Search documents using Pinecone vector search
        const pineconeResults = await PineconeDocumentService.searchDocuments(botId, messageText, 3)
        
        if (pineconeResults.length > 0) {
          console.log(`[Chat API] ✅ Found ${pineconeResults.length} relevant document chunks in Pinecone`)
          
          // Build document context from Pinecone results
          documentContext = `Relevant document information:\n`
          pineconeResults.forEach((result, index) => {
            documentContext += `${index + 1}. From "${result.title}" (chunk ${result.chunkIndex + 1}/${result.totalChunks}, relevance: ${(result.score * 100).toFixed(1)}%):\n`
            documentContext += `${result.content}\n\n`
          })
          
          // Create search results object for compatibility
          searchResults = {
            query: messageText,
            results: pineconeResults.map(result => ({
              document: { title: result.title, id: result.documentId },
              matchedContent: result.content,
              score: result.score,
              matchType: 'vector_similarity'
            })),
            summary: {
              exactMatches: 0,
              partialMatches: 0,
              semanticMatches: pineconeResults.length,
              averageScore: pineconeResults.reduce((sum, r) => sum + r.score, 0) / pineconeResults.length
            }
          }
          
          console.log(`[Chat API] 📄 Document context length: ${documentContext.length} characters`)
          console.log(`[Chat API] 📊 Pinecone search results: ${pineconeResults.length} chunks found`)
          console.log(`[Chat API] 🎯 Average relevance score: ${(searchResults.summary.averageScore * 100).toFixed(1)}%`)
          
          if (documentContext) {
            console.log(`[Chat API] 📝 Document context preview: ${documentContext.substring(0, 200)}...`)
          }
        } else {
          console.log(`[Chat API] ⚠️ No relevant documents found in Pinecone for query: "${messageText}"`)
          documentContext = ''
          searchResults = null
        }
      } catch (error) {
        console.error('[Chat API] ❌ Pinecone document search failed, falling back to traditional search:', error)
        
        // Fallback to traditional document search
        try {
          const [context, detailedResults] = await Promise.all([
            DocumentSearchService.getContextForQuery(botId, messageText),
            DocumentSearchService.getDetailedSearchResults(botId, messageText, 3)
          ])
          
          documentContext = context
          searchResults = detailedResults
          
          console.log(`[Chat API] 📄 Fallback search - Document context length: ${documentContext.length}`)
          console.log(`[Chat API] 📊 Fallback search results: ${detailedResults.results.length} matches found`)
        } catch (fallbackError) {
          console.error('[Chat API] ❌ Fallback document search also failed:', fallbackError)
          documentContext = ''
          searchResults = null
        }
      }

      // Get conversation context from Pinecone if enabled
      if (config.chat.useVectorSearch) {
        try {
          console.log(`[Chat API] Searching conversation context for bot ${botId}, user ${userId}`)
          
          // Search for relevant conversation history
          const relevantMessages = await PineconeService.searchConversationContext(
            botId,
            userId,
            messageText,
            5
          )
          
          if (relevantMessages.length > 0) {
            conversationContext = `Previous conversation context:\n`
            relevantMessages.forEach((msg, index) => {
              conversationContext += `${index + 1}. ${msg.role}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`
            })
            console.log(`[Chat API] Found ${relevantMessages.length} relevant conversation messages`)
          } else {
            console.log(`[Chat API] No relevant conversation context found`)
          }
        } catch (error) {
          console.error('Pinecone conversation search failed, continuing without context:', error)
          conversationContext = ''
        }
      }

      // For OpenAI, we can send images directly in messages (no special analysis needed)
      if (imageUrl) {
        console.log(`[Chat API] Image detected for multimodal message: ${imageUrl}`)
      }
    }

    // OpenAI supports multimodal messages; keep as-is
    let textOnlyMessages = validMessages

    // Enhance system prompt with document context and image analysis
    let enhancedMessages = [...textOnlyMessages]
    
    // Always add system prompt if bot has one, regardless of document context
    if (enhancedMessages.length > 0) {
      // Find system message or create one
      const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role === 'system')
      const systemPrompt = bot.system_prompt || 'You are a helpful assistant.'
      
      let enhancedPrompt = systemPrompt
      
      // Add document context with enhanced formatting
      if (documentContext) {
        enhancedPrompt += `\n\n${documentContext}`
        
        // Add instructions for using the knowledge base
        enhancedPrompt += `\n\nInstructions for using the knowledge base:
- Use the information above to provide accurate, detailed answers
- If the information is from the knowledge base, mention the source document
- If you cannot find relevant information in the knowledge base, say so clearly
- Prioritize exact matches over partial matches when available
- Always cite specific information from the documents when possible`
      }

      // Add conversation context if available
      if (conversationContext) {
        enhancedPrompt += `\n\n${conversationContext}`
        
        // Add instructions for using conversation context
        enhancedPrompt += `\n\nInstructions for using conversation context:
- Reference previous conversations when relevant to provide continuity
- Build upon previous topics and questions when appropriate
- Maintain context across the conversation
- If the user is asking follow-up questions, use the conversation history to provide better answers`
      }
      
      // Add image analysis if present
      if (imageAnalysis) {
        enhancedPrompt += `\n\nImage Analysis: ${imageAnalysis}`
      }
      
      // Add search result summary for better context
      if (searchResults && searchResults.results.length > 0) {
        enhancedPrompt += `\n\nSearch Results Summary:
- Total documents searched: ${searchResults.totalDocuments}
- Matches found: ${searchResults.results.length}
- Exact matches: ${searchResults.summary.exactMatches}
- Partial matches: ${searchResults.summary.partialMatches}
- Semantic matches: ${searchResults.summary.semanticMatches}
- Average relevance score: ${searchResults.summary.averageScore}`
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

    // Generate response from OpenAI
    const response = await openAIAPI.generateChat(enhancedMessages as any, {
      model,
      temperature,
      max_tokens: maxTokens
    })

    const responseTime = Date.now() - startTime

    // Extract the assistant's message
    const assistantMessage = response.message || 'Sorry, I could not generate a response.'

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
        const contentArray = lastMessage.content as any[]
        const textPart = contentArray.find((part: any) => part.type === 'text')
        const imagePart = contentArray.find((part: any) => part.type === 'image_url')
        
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

    // Update analytics
    try {
      const { ServerAnalyticsService } = await import('@/lib/server-database')
      await ServerAnalyticsService.updateAnalyticsForMessage(
        botId,
        !conversationId, // isNewConversation (true if conversation was just created)
        response.usage?.total_tokens,
        responseTime
      )
    } catch (error) {
      console.error('Failed to update analytics:', error)
      // Don't fail the entire request if analytics update fails
    }

    // Store messages in Pinecone for vector search (if enabled)
    if (config.chat.useVectorSearch) {
      try {
        // Store user message in Pinecone
        if (lastMessage.role === 'user') {
          // Extract message content for Pinecone storage
          let userMessageContent = ''
          if (typeof lastMessage.content === 'string') {
            userMessageContent = lastMessage.content
          } else if (Array.isArray(lastMessage.content)) {
            const contentArray = lastMessage.content as any[]
            const textPart = contentArray.find((part: any) => part.type === 'text')
            userMessageContent = textPart?.text || ''
          }

          await PineconeService.storeChatMessage({
            id: `user_${Date.now()}`,
            conversationId: currentConversationId.toString(),
            botId,
            userId: userId || 1,
            role: 'user',
            content: userMessageContent,
            timestamp: new Date().toISOString(),
            metadata: {
              documentContext: documentContext.length > 0
            }
          })
        }

        // Store assistant response in Pinecone
        await PineconeService.storeChatMessage({
          id: `assistant_${savedMessage.id}`,
          conversationId: currentConversationId.toString(),
          botId,
          userId: userId || 1,
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date().toISOString(),
          metadata: {
            tokensUsed: response.usage?.total_tokens,
            responseTimeMs: responseTime,
            model: response.model,
            documentContext: documentContext.length > 0
          }
        })

        console.log(`[Chat API] Messages stored in Pinecone for conversation ${currentConversationId}`)
      } catch (error) {
        console.error('Failed to store messages in Pinecone:', error)
        // Don't fail the entire request if Pinecone storage fails
      }
    }

    logger.apiResponse('POST', '/api/chat', 200, responseTime)

    // Return response in format expected by both dashboard and widget
    const responseData = {
      success: true,
      message: assistantMessage,
      conversationId: currentConversationId,
      messageId: savedMessage.id,
      usage: response.usage,
      model: response.model,
      finish_reason: response.finish_reason,
      response_time_ms: responseTime,
      image_analysis: imageAnalysis,
      // Enhanced document search information
      document_search: searchResults ? {
        query: searchResults.query,
        total_documents: searchResults.totalDocuments,
        matches_found: searchResults.results.length,
        summary: searchResults.summary,
        has_context: documentContext.length > 0
      } : null,
      // Conversation context information
      conversation_context: config.chat.useVectorSearch ? {
        has_context: conversationContext.length > 0,
        context_length: conversationContext.length,
        vector_search_enabled: true
      } : {
        has_context: false,
        context_length: 0,
        vector_search_enabled: false
      }
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
