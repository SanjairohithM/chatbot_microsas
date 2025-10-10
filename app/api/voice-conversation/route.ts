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
import { db } from '@/lib/db'
import type { OpenAIMessage } from '@/lib/openai-api'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return ApiResponse.badRequest('Expected multipart/form-data with audio file')
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const botId = formData.get('botId') as string | null
    const conversationId = formData.get('conversationId') as string | null
    const userId = formData.get('userId') as string | null
    const voice = formData.get('voice') as string | null

    if (!audioFile) {
      return ApiResponse.badRequest('Audio file is required')
    }

    if (!botId) {
      return ApiResponse.badRequest('Bot ID is required')
    }

    const botIdNum = parseInt(botId, 10)
    if (isNaN(botIdNum)) {
      return ApiResponse.badRequest('Invalid bot ID format')
    }

    logger.apiRequest('POST', '/api/voice-conversation', userId)

    // Step 1: Convert speech to text using STT
    console.log('[Voice Conversation] 🎤 Converting speech to text...')
    const transcribedText = await openAIAPI.transcribeAudio(audioFile)
    
    if (!transcribedText || transcribedText.trim().length === 0) {
      return ApiResponse.badRequest('No speech detected in audio file')
    }

    console.log(`[Voice Conversation] 📝 Transcribed: "${transcribedText}"`)

    // Step 2: Get bot configuration
    const bot = await BotService.getBotById(botIdNum)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Step 3: Get enhanced document context
    let documentContext = ''
    let searchResults = null
    let conversationContext = ''
    
    try {
      console.log(`[Voice Conversation] 🔍 Searching documents in Pinecone for bot ${botIdNum}`)
      
      const pineconeResults = await PineconeDocumentService.searchDocuments(botIdNum, transcribedText, 3)
      
      if (pineconeResults.length > 0) {
        console.log(`[Voice Conversation] ✅ Found ${pineconeResults.length} relevant document chunks`)
        
        documentContext = `Relevant document information:\n`
        pineconeResults.forEach((result, index) => {
          documentContext += `${index + 1}. From "${result.title}" (chunk ${result.chunkIndex + 1}/${result.totalChunks}, relevance: ${(result.score * 100).toFixed(1)}%):\n`
          documentContext += `${result.content}\n\n`
        })
        
        searchResults = {
          query: transcribedText,
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
      } else {
        console.log(`[Voice Conversation] ⚠️ No relevant documents found, trying fallback search`)
        
        // Fallback to traditional document search
        const [context, detailedResults] = await Promise.all([
          DocumentSearchService.getContextForQuery(botIdNum, transcribedText),
          DocumentSearchService.getDetailedSearchResults(botIdNum, transcribedText, 3)
        ])
        
        documentContext = context
        searchResults = detailedResults
      }
    } catch (error) {
      console.error('[Voice Conversation] ❌ Document search failed:', error)
      documentContext = ''
      searchResults = null
    }

    // Step 4: Get conversation context if enabled
    if (config.chat.useVectorSearch && (!documentContext || documentContext.trim().length === 0)) {
      try {
        let contextUserId = userId
        if (!contextUserId) {
          const defaultUser = await db.user.findFirst({
            where: { email: 'widget@default.com' }
          })
          contextUserId = defaultUser?.id || 'widget-user'
        }
        
        const relevantMessages = await PineconeService.searchConversationContext(
          botIdNum,
          contextUserId,
          transcribedText,
          5
        )
        
        if (relevantMessages.length > 0) {
          conversationContext = `Previous conversation context:\n`
          relevantMessages.forEach((msg, index) => {
            conversationContext += `${index + 1}. ${msg.role}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`
          })
        }
      } catch (error) {
        console.error('Pinecone conversation search failed:', error)
        conversationContext = ''
      }
    }

    // Step 5: Prepare messages for OpenAI
    const messages: OpenAIMessage[] = [
      {
        role: 'user',
        content: transcribedText
      }
    ]

    // Enhance system prompt with document context
    let enhancedMessages = [...messages]
    const systemPrompt = bot.system_prompt || 'You are a helpful assistant.'
    
    let enhancedPrompt = systemPrompt
    
    if (documentContext) {
      enhancedPrompt += `\n\n${documentContext}`
      enhancedPrompt += `\n\nInstructions for using the knowledge base:
- Use the information above to provide accurate, detailed answers
- If the information is from the knowledge base, mention the source document
- If you cannot find relevant information in the knowledge base, say so clearly
- Prioritize exact matches over partial matches when available
- Always cite specific information from the documents when possible`
    }

    if (conversationContext) {
      enhancedPrompt += `\n\n${conversationContext}`
      enhancedPrompt += `\n\nInstructions for using conversation context:
- Reference previous conversations when relevant to provide continuity
- Build upon previous topics and questions when appropriate
- Maintain context across the conversation
- If the user is asking follow-up questions, use the conversation history to provide better answers`
    }

    enhancedMessages.unshift({
      role: 'system',
      content: enhancedPrompt
    })

    // Step 6: Generate response from OpenAI
    console.log('[Voice Conversation] 🤖 Generating AI response...')
    const response = await openAIAPI.generateChat(enhancedMessages as any, {
      model: bot.model === 'deepseek-chat' || bot.model === 'deepseek-coder' ? 'gpt-4o-mini' : bot.model,
      temperature: bot.temperature,
      max_tokens: bot.max_tokens
    })

    const assistantMessage = response.message || 'Sorry, I could not generate a response.'
    console.log(`[Voice Conversation] 💬 AI Response: "${assistantMessage}"`)

    // Step 7: Convert response to speech using TTS
    console.log('[Voice Conversation] 🔊 Converting response to speech...')
    const audioBuffer = await openAIAPI.synthesizeSpeech(assistantMessage, {
      voice: voice || 'alloy',
      model: 'tts-1',
      format: 'mp3'
    })

    // Step 8: Save conversation to database
    let currentConversationId = conversationId ? parseInt(conversationId, 10) : null

    if (!currentConversationId) {
      let effectiveUserId = userId
      if (!effectiveUserId) {
        let defaultUser = await db.user.findFirst({
          where: { email: 'widget@default.com' }
        })
        
        if (!defaultUser) {
          defaultUser = await db.user.create({
            data: {
              email: 'widget@default.com',
              name: 'Widget User',
              password_hash: 'widget-default-hash',
              role: 'widget'
            }
          })
        }
        
        effectiveUserId = defaultUser.id
      }
      
      const conversation = await ConversationService.createConversation({
        botId: botIdNum,
        userId: effectiveUserId,
        title: 'Voice Conversation',
        isTest: true
      })
      currentConversationId = conversation.id
    }

    // Save user message
    await ConversationService.createMessage({
      conversationId: currentConversationId,
      role: 'user',
      content: transcribedText
    })

    // Save assistant response
    const savedMessage = await ConversationService.createMessage({
      conversationId: currentConversationId,
      role: 'assistant',
      content: assistantMessage,
      tokensUsed: response.usage?.total_tokens,
      responseTimeMs: 0 // We'll calculate this if needed
    })

    // Step 9: Return both text response and audio
    const responseData = {
      success: true,
      text: assistantMessage,
      audio: Buffer.from(audioBuffer).toString('base64'),
      conversationId: currentConversationId,
      messageId: savedMessage.id,
      transcription: transcribedText,
      usage: response.usage,
      model: response.model,
      document_search: searchResults ? {
        query: searchResults.query,
        matches_found: searchResults.results.length,
        summary: searchResults.summary,
        has_context: documentContext.length > 0
      } : null
    }

    logger.apiResponse('POST', '/api/voice-conversation', 200, 0)

    const nextResponse = NextResponse.json(responseData, { status: 200 })
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    logger.apiError('POST', '/api/voice-conversation', error as Error)
    
    const errorResponse = ApiResponse.internalServerError(
      error instanceof Error ? error.message : 'Voice conversation failed'
    )
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
