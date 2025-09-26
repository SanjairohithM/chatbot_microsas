import { Pinecone } from '@pinecone-database/pinecone'
import { config } from '@/lib/config'
import { openAIAPI } from '@/lib/openai-api'

export interface ChatMessage {
  id: string
  conversationId: string
  botId: number
  userId: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    tokensUsed?: number
    responseTimeMs?: number
    model?: string
    documentContext?: boolean
  }
}

export interface ConversationContext {
  conversationId: string
  botId: number
  userId: number
  messages: ChatMessage[]
  summary?: string
  createdAt: string
  updatedAt: string
}

export class PineconeService {
  private static pc: Pinecone | null = null
  private static indexName = config.pinecone.indexName
  private static initialized = false

  /**
   * Initialize Pinecone client
   */
  private static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.pc = new Pinecone({
        apiKey: config.pinecone.apiKey
      })

      console.log('[Pinecone] Using OpenAI embeddings')

      // Create index if it doesn't exist
      await this.createIndexIfNotExists()
      
      this.initialized = true
      console.log('[Pinecone] Service initialized successfully')
    } catch (error) {
      console.error('[Pinecone] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Create Pinecone index if it doesn't exist
   */
  private static async createIndexIfNotExists(): Promise<void> {
    if (!this.pc) throw new Error('Pinecone not initialized')

    try {
      // Check if index exists
      const existingIndexes = await this.pc.listIndexes()
      const indexExists = existingIndexes.indexes?.some(index => index.name === this.indexName)

      if (!indexExists) {
        console.log(`[Pinecone] Creating index: ${this.indexName}`)
        
        // Create a standard index (not auto-embedding) since we'll handle embeddings manually
        await this.pc.createIndex({
          name: this.indexName,
          dimension: 512, // text-embedding-3-small dimensions
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: config.pinecone.cloud,
              region: config.pinecone.region
            }
          },
          waitUntilReady: true
        })
        
        console.log(`[Pinecone] Index ${this.indexName} created successfully`)
      } else {
        console.log(`[Pinecone] Index ${this.indexName} already exists`)
      }
    } catch (error) {
      console.error('[Pinecone] Error creating index:', error)
      throw error
    }
  }

  /**
   * Get Pinecone index
   */
  private static async getIndex() {
    await this.initialize()
    if (!this.pc) throw new Error('Pinecone not initialized')
    return this.pc.index(this.indexName)
  }

  /**
   * Generate embedding for text using OpenAI embeddings (with fallback)
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[Pinecone] 🔍 Generating embedding for text: "${text.substring(0, 100)}..."`)
      const openAIEmbedding = await openAIAPI.createEmbedding(text, config.pinecone.embeddingModel)
      if (openAIEmbedding && openAIEmbedding.length > 0) {
        // Project 1536-dim embedding down to 512 dims expected by index
        const projected = this.projectEmbedding(openAIEmbedding, 512)
        return projected
      }
      console.warn('[Pinecone] OpenAI embedding empty, using fallback')
      return this.generateFallbackEmbedding(text)
    } catch (error) {
      console.error('[Pinecone] Error generating embedding with OpenAI:', error)
      console.warn('[Pinecone] Falling back to simple embedding')
      return this.generateFallbackEmbedding(text)
    }
  }

  /**
   * Convert semantic features to embedding vector
   */
  private static convertFeaturesToEmbedding(originalText: string, features: string): number[] {
    // Combine original text with extracted features
    const combinedText = `${originalText} ${features}`.toLowerCase()
    
    // Create embedding based on word frequencies and semantic features
    const words = combinedText.split(/\s+/)
    const embedding = new Array(512).fill(0)
    
    // Enhanced word-based embedding with semantic weighting
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      const position = hash % 512
      
      // Weight by position and word importance
      let weight = 1 / (index + 1)
      
      // Boost important semantic words
      if (features.toLowerCase().includes(word)) {
        weight *= 2
      }
      
      // Boost longer, more meaningful words
      if (word.length > 4) {
        weight *= 1.5
      }
      
      embedding[position] += weight
    })
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }

  /**
   * Project a high-dimensional embedding to the index dimension deterministically
   */
  private static projectEmbedding(vector: number[], targetDim: number): number[] {
    if (vector.length === targetDim) return vector
    const projected = new Array(targetDim).fill(0)
    for (let i = 0; i < vector.length; i++) {
      const idx = i % targetDim
      projected[idx] += vector[i]
    }
    // Normalize
    const magnitude = Math.sqrt(projected.reduce((s, v) => s + v * v, 0))
    return projected.map(v => (magnitude > 0 ? v / magnitude : 0))
  }

  /**
   * Generate a simple fallback embedding (for testing without OpenAI)
   */
  private static generateFallbackEmbedding(text: string): number[] {
    // Create a simple hash-based embedding for testing
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(512).fill(0)
    
    // Simple word-based embedding
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      const position = hash % 512
      embedding[position] += 1 / (index + 1) // Weight by position
    })
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }

  /**
   * Simple hash function for fallback embedding
   */
  private static simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Store chat message in Pinecone
   */
  static async storeChatMessage(message: ChatMessage): Promise<void> {
    try {
      const index = await this.getIndex()
      
      // Create vector ID
      const vectorId = `msg_${message.id}_${Date.now()}`
      
      // Generate embedding for the message content
      const embedding = await this.generateEmbedding(message.content)
      
      // Prepare metadata
      const metadata = {
        conversationId: message.conversationId,
        botId: message.botId,
        userId: message.userId,
        role: message.role,
        timestamp: message.timestamp,
        content: message.content, // Store content in metadata for retrieval
        ...message.metadata
      }

      // Upsert vector with manual embedding
      await index.upsert([{
        id: vectorId,
        values: embedding,
        metadata
      }])

      console.log(`[Pinecone] Stored message ${message.id} for conversation ${message.conversationId}`)
    } catch (error) {
      console.error('[Pinecone] Error storing chat message:', error)
      throw error
    }
  }

  /**
   * Search for relevant conversation context
   */
  static async searchConversationContext(
    botId: number,
    userId: number,
    query: string,
    limit: number = 5
  ): Promise<ChatMessage[]> {
    try {
      const index = await this.getIndex()
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      
      console.log(`[Pinecone] Searching for botId: ${botId}, userId: ${userId}, query: "${query}"`)
      
      // First try with both botId and userId filters
      let searchResponse = await index.query({
        vector: queryEmbedding,
        filter: {
          botId: { $eq: botId },
          userId: { $eq: userId }
        },
        topK: limit,
        includeMetadata: true
      })

      console.log(`[Pinecone] Search with both filters found ${searchResponse.matches?.length || 0} results`)

      // If no results, try with just botId filter
      if (!searchResponse.matches || searchResponse.matches.length === 0) {
        console.log(`[Pinecone] No results with both filters, trying with botId only`)
        searchResponse = await index.query({
          vector: queryEmbedding,
          filter: {
            botId: { $eq: botId }
          },
          topK: limit,
          includeMetadata: true
        })
        console.log(`[Pinecone] Search with botId only found ${searchResponse.matches?.length || 0} results`)
      }

      // If still no results, try without any filters (for debugging)
      if (!searchResponse.matches || searchResponse.matches.length === 0) {
        console.log(`[Pinecone] No results with botId filter, trying without filters`)
        searchResponse = await index.query({
          vector: queryEmbedding,
          topK: limit,
          includeMetadata: true
        })
        console.log(`[Pinecone] Search without filters found ${searchResponse.matches?.length || 0} results`)
      }

      // Convert results to ChatMessage format
      const messages: ChatMessage[] = searchResponse.matches?.map(match => ({
        id: match.id,
        conversationId: match.metadata?.conversationId as string,
        botId: match.metadata?.botId as number,
        userId: match.metadata?.userId as number,
        role: match.metadata?.role as 'user' | 'assistant',
        content: match.metadata?.content as string || '',
        timestamp: match.metadata?.timestamp as string,
        metadata: {
          tokensUsed: match.metadata?.tokensUsed as number,
          responseTimeMs: match.metadata?.responseTimeMs as number,
          model: match.metadata?.model as string,
          documentContext: match.metadata?.documentContext as boolean
        }
      })) || []

      console.log(`[Pinecone] Found ${messages.length} relevant messages for query: "${query}"`)
      return messages
    } catch (error) {
      console.error('[Pinecone] Error searching conversation context:', error)
      return []
    }
  }

  /**
   * Get conversation history from Pinecone
   */
  static async getConversationHistory(
    conversationId: string,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    try {
      const index = await this.getIndex()
      
      // Query for messages in this conversation
      const queryResponse = await index.query({
        vector: Array(512).fill(0), // Dummy vector for metadata-only search (512 dimensions for text-embedding-3-small)
        filter: {
          conversationId: { $eq: conversationId }
        },
        topK: limit,
        includeMetadata: true
      })

      // Convert and sort by timestamp
      const messages: ChatMessage[] = queryResponse.matches?.map(match => ({
        id: match.id,
        conversationId: match.metadata?.conversationId as string,
        botId: match.metadata?.botId as number,
        userId: match.metadata?.userId as number,
        role: match.metadata?.role as 'user' | 'assistant',
        content: match.metadata?.content as string || '',
        timestamp: match.metadata?.timestamp as string,
        metadata: {
          tokensUsed: match.metadata?.tokensUsed as number,
          responseTimeMs: match.metadata?.responseTimeMs as number,
          model: match.metadata?.model as string,
          documentContext: match.metadata?.documentContext as boolean
        }
      })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []

      console.log(`[Pinecone] Retrieved ${messages.length} messages for conversation ${conversationId}`)
      return messages
    } catch (error) {
      console.error('[Pinecone] Error getting conversation history:', error)
      return []
    }
  }

  /**
   * Delete conversation from Pinecone
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      const index = await this.getIndex()
      
      // Get all vectors for this conversation
      const queryResponse = await index.query({
        vector: Array(512).fill(0), // Dummy vector (512 dimensions for text-embedding-3-small)
        filter: {
          conversationId: { $eq: conversationId }
        },
        topK: 10000, // Large number to get all messages
        includeMetadata: true
      })

      // Extract vector IDs
      const vectorIds = queryResponse.matches?.map(match => match.id) || []
      
      if (vectorIds.length > 0) {
        await index.deleteMany(vectorIds)
        console.log(`[Pinecone] Deleted ${vectorIds.length} messages for conversation ${conversationId}`)
      }
    } catch (error) {
      console.error('[Pinecone] Error deleting conversation:', error)
      throw error
    }
  }

  /**
   * Get conversation summary from recent messages
   */
  static async getConversationSummary(
    conversationId: string,
    maxMessages: number = 10
  ): Promise<string> {
    try {
      const messages = await this.getConversationHistory(conversationId, maxMessages)
      
      if (messages.length === 0) {
        return 'No conversation history available'
      }

      // Create a summary from recent messages
      const recentMessages = messages.slice(-maxMessages)
      const summary = recentMessages.map(msg => 
        `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
      ).join('\n')

      return `Recent conversation context:\n${summary}`
    } catch (error) {
      console.error('[Pinecone] Error getting conversation summary:', error)
      return 'Error retrieving conversation context'
    }
  }

  /**
   * Search across all conversations for a bot
   */
  static async searchBotConversations(
    botId: number,
    query: string,
    limit: number = 10
  ): Promise<ChatMessage[]> {
    try {
      const index = await this.getIndex()
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      
      const searchResponse = await index.query({
        vector: queryEmbedding,
        filter: {
          botId: { $eq: botId }
        },
        topK: limit,
        includeMetadata: true
      })

      const messages: ChatMessage[] = searchResponse.matches?.map(match => ({
        id: match.id,
        conversationId: match.metadata?.conversationId as string,
        botId: match.metadata?.botId as number,
        userId: match.metadata?.userId as number,
        role: match.metadata?.role as 'user' | 'assistant',
        content: match.metadata?.content as string || '',
        timestamp: match.metadata?.timestamp as string,
        metadata: {
          tokensUsed: match.metadata?.tokensUsed as number,
          responseTimeMs: match.metadata?.responseTimeMs as number,
          model: match.metadata?.model as string,
          documentContext: match.metadata?.documentContext as boolean
        }
      })) || []

      console.log(`[Pinecone] Found ${messages.length} relevant messages across all conversations for bot ${botId}`)
      return messages
    } catch (error) {
      console.error('[Pinecone] Error searching bot conversations:', error)
      return []
    }
  }
}
