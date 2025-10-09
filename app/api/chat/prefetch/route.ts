import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { PineconeService } from '@/lib/services/pinecone.service'
import { ConversationService } from '@/lib/services/conversation.service'
import { UserApiKeyService } from '@/lib/services/user-api-key.service'

export async function POST(request: NextRequest) {
  try {
    const { query, botId, userId, conversationId } = await request.json()

    if (!query || !botId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: query, botId, userId' },
        { status: 400 }
      )
    }

    console.log(`[Prefetch API] 🔍 Prefetching for bot ${botId} with query: "${query}"`)

    // Get user's API key for this bot
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(botId)
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'No OpenAI API key found. Please configure your API key in settings.' },
        { status: 400 }
      )
    }

    // Initialize services
    const pineconeService = new PineconeService()
    const conversationService = new ConversationService()

    // 1. Search documents in Pinecone (this is the slowest part)
    console.log(`[Prefetch API] 🔍 Searching documents in Pinecone for bot ${botId}`)
    const documentSearchResult = await PineconeDocumentService.searchDocuments(
      botId,
      query,
      3, // Limit to 3 most relevant chunks for speed
      userApiKey
    )

    let documentContext = ''
    if (documentSearchResult && documentSearchResult.length > 0) {
      // Build document context from search results
      documentContext = `Relevant document information:\n`
      documentSearchResult.forEach((result, index) => {
        documentContext += `${index + 1}. From "${result.title}" (chunk ${result.chunkIndex + 1}/${result.totalChunks}, relevance: ${(result.score * 100).toFixed(1)}%):\n`
        documentContext += `${result.content}\n\n`
      })
      console.log(`[Prefetch API] ✅ Found ${documentSearchResult.length} document chunks`)
    } else {
      console.log(`[Prefetch API] ⚠️ No documents found, using fallback search`)
      // Fallback to conversation context search
      try {
        const fallbackResult = await PineconeService.searchConversationContext(
          botId,
          userId,
          query,
          3
        )
        if (fallbackResult && fallbackResult.length > 0) {
          documentContext = `Recent conversation context:\n`
          fallbackResult.forEach((msg, index) => {
            documentContext += `${index + 1}. ${msg.role}: ${msg.content}\n`
          })
        }
      } catch (error) {
        console.log(`[Prefetch API] ⚠️ Fallback search also failed:`, error)
      }
    }

    // 2. Get conversation context (if conversationId provided)
    let conversationContext = ''
    if (conversationId) {
      try {
        const conversationResult = await conversationService.getConversationMessages(
          conversationId,
          userId,
          5 // Last 5 messages for context
        )
        
        if (conversationResult.success && conversationResult.data) {
          conversationContext = conversationResult.data
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n')
        }
      } catch (error) {
        console.log(`[Prefetch API] ⚠️ Could not get conversation context:`, error)
      }
    }

    // 3. Prepare search results summary
    const searchResults = {
      query,
      documentContext: documentContext.substring(0, 500), // Truncate for response
      conversationContext: conversationContext.substring(0, 500),
      timestamp: new Date().toISOString()
    }

    console.log(`[Prefetch API] ✅ Prefetch completed for bot ${botId}`)

    return NextResponse.json({
      success: true,
      documentContext,
      conversationContext,
      searchResults,
      prefetchTime: Date.now()
    })

  } catch (error) {
    console.error('[Prefetch API] ❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Prefetch failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
