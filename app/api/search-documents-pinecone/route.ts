import { NextRequest, NextResponse } from 'next/server'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { UserApiKeyService } from '@/lib/services/user-api-key.service'

export async function POST(request: NextRequest) {
  try {
    const { botId, query, limit = 5 } = await request.json()

    if (!botId || !query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bot ID and query are required' 
      }, { status: 400 })
    }

    console.log(`[Pinecone Search API] 🔍 Searching documents for bot ${botId} with query: "${query}"`)

    // Get user's API key for this bot
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(botId)
    if (!userApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OpenAI API key found. Please configure your API key in settings.' 
      }, { status: 400 })
    }

    // Search documents in Pinecone
    const results = await PineconeDocumentService.searchDocuments(botId, query, limit, userApiKey)

    console.log(`[Pinecone Search API] ✅ Found ${results.length} document chunks`)

    // Format results for response
    const formattedResults = results.map(result => ({
      id: result.id,
      score: result.score,
      documentId: result.documentId,
      title: result.title,
      content: result.content,
      chunkIndex: result.chunkIndex,
      totalChunks: result.totalChunks,
      relevance: result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low'
    }))

    return NextResponse.json({
      success: true,
      data: {
        query,
        botId,
        results: formattedResults,
        totalResults: results.length,
        searchMethod: 'pinecone_vector_search'
      }
    })

  } catch (error) {
    console.error('[Pinecone Search API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Document search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!botId || !query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bot ID and query are required' 
      }, { status: 400 })
    }

    console.log(`[Pinecone Search API] 🔍 GET search for bot ${botId} with query: "${query}"`)

    // Get user's API key for this bot
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(parseInt(botId))
    if (!userApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OpenAI API key found. Please configure your API key in settings.' 
      }, { status: 400 })
    }

    // Search documents in Pinecone
    const results = await PineconeDocumentService.searchDocuments(parseInt(botId), query, limit, userApiKey)

    console.log(`[Pinecone Search API] ✅ Found ${results.length} document chunks`)

    // Format results for response
    const formattedResults = results.map(result => ({
      id: result.id,
      score: result.score,
      documentId: result.documentId,
      title: result.title,
      content: result.content,
      chunkIndex: result.chunkIndex,
      totalChunks: result.totalChunks,
      relevance: result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low'
    }))

    return NextResponse.json({
      success: true,
      data: {
        query,
        botId: parseInt(botId),
        results: formattedResults,
        totalResults: results.length,
        searchMethod: 'pinecone_vector_search'
      }
    })

  } catch (error) {
    console.error('[Pinecone Search API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Document search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
