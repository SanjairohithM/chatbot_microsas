import { Pinecone } from '@pinecone-database/pinecone'
import { config } from '@/lib/config'
import { openAIAPI } from '@/lib/openai-api'

export interface DocumentChunk {
  id: string
  botId: number
  documentId: number
  title: string
  content: string
  chunkIndex: number
  totalChunks: number
  metadata?: Record<string, any>
}

export interface DocumentSearchResult {
  id: string
  score: number
  documentId: number
  title: string
  content: string
  chunkIndex: number
  totalChunks: number
  metadata?: Record<string, any>
}

export class PineconeDocumentService {
  private static pc: Pinecone | null = null
  private static indexName = config.pinecone.indexName
  private static initialized = false

  private static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.pc = new Pinecone({
        apiKey: config.pinecone.apiKey
      })

      console.log('[Pinecone Documents] Using OpenAI embeddings')

      // Create index if it doesn't exist
      await this.createIndexIfNotExists()
      
      this.initialized = true
      console.log('[Pinecone Documents] Service initialized successfully')
    } catch (error) {
      console.error('[Pinecone Documents] Initialization failed:', error)
      throw error
    }
  }

  private static async createIndexIfNotExists(): Promise<void> {
    if (!this.pc) throw new Error('Pinecone not initialized')

    try {
      const existingIndexes = await this.pc.listIndexes()
      const indexExists = existingIndexes.indexes?.some(index => index.name === this.indexName)

      if (!indexExists) {
        console.log(`[Pinecone Documents] Creating index: ${this.indexName}`)
        
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
        
        console.log(`[Pinecone Documents] Index ${this.indexName} created successfully`)
      } else {
        console.log(`[Pinecone Documents] Index ${this.indexName} already exists`)
      }
    } catch (error) {
      console.error('[Pinecone Documents] Error creating index:', error)
      throw error
    }
  }

  private static async getIndex() {
    await this.initialize()
    if (!this.pc) throw new Error('Pinecone not initialized')
    return this.pc.index(this.indexName)
  }

  /**
   * Generate embedding for text using OpenAI or fallback
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[Pinecone Documents] 🔍 Generating embedding for text: "${text.substring(0, 100)}..."`)
      const openAIEmbedding = await openAIAPI.createEmbedding(text, config.pinecone.embeddingModel)
      if (openAIEmbedding && openAIEmbedding.length > 0) {
        const projected = this.projectEmbedding(openAIEmbedding, 512)
        return projected
      }
      console.warn('[Pinecone Documents] OpenAI embedding empty, using fallback')
      return this.generateFallbackEmbedding(text)
    } catch (error) {
      console.error('[Pinecone Documents] Error generating embedding with OpenAI:', error)
      console.warn('[Pinecone Documents] Falling back to simple embedding')
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

  private static projectEmbedding(vector: number[], targetDim: number): number[] {
    if (vector.length === targetDim) return vector
    const projected = new Array(targetDim).fill(0)
    for (let i = 0; i < vector.length; i++) {
      const idx = i % targetDim
      projected[idx] += vector[i]
    }
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
   * Split document content into chunks for better search
   */
  private static splitIntoChunks(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = []
    let start = 0
    
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length)
      let chunk = content.substring(start, end)
      
      // Try to break at sentence boundary
      if (end < content.length) {
        const lastSentence = chunk.lastIndexOf('.')
        const lastNewline = chunk.lastIndexOf('\n')
        const breakPoint = Math.max(lastSentence, lastNewline)
        
        if (breakPoint > start + chunkSize * 0.5) {
          chunk = content.substring(start, start + breakPoint + 1)
          start = start + breakPoint + 1 - overlap
        } else {
          start = end - overlap
        }
      } else {
        start = end
      }
      
      chunks.push(chunk.trim())
    }
    
    return chunks.filter(chunk => chunk.length > 0)
  }

  /**
   * Store document chunks in Pinecone
   */
  static async storeDocument(
    botId: number,
    documentId: number,
    title: string,
    content: string
  ): Promise<void> {
    try {
      const index = await this.getIndex()
      
      console.log(`[Pinecone Documents] Storing document: ${title} (ID: ${documentId}) for bot ${botId}`)
      console.log(`[Pinecone Documents] Content length: ${content.length} characters`)
      
      // Split content into chunks
      const chunks = this.splitIntoChunks(content, 1000, 200)
      console.log(`[Pinecone Documents] Split into ${chunks.length} chunks`)
      
      // Store each chunk
      const vectors = []
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const vectorId = `doc_${documentId}_chunk_${i}`
        
        console.log(`[Pinecone Documents] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
        
        const embedding = await this.generateEmbedding(chunk)
        
        const metadata = {
          botId,
          documentId,
          title,
          content: chunk,
          chunkIndex: i,
          totalChunks: chunks.length,
          timestamp: new Date().toISOString()
        }

        vectors.push({
          id: vectorId,
          values: embedding,
          metadata
        })
      }
      
      // Batch upsert
      console.log(`[Pinecone Documents] Upserting ${vectors.length} vectors to Pinecone...`)
      await index.upsert(vectors)
      
      console.log(`[Pinecone Documents] ✅ Successfully stored document ${title} with ${chunks.length} chunks`)
    } catch (error) {
      console.error('[Pinecone Documents] Error storing document:', error)
      throw error
    }
  }

  /**
   * Search for relevant document chunks
   */
  static async searchDocuments(
    botId: number,
    query: string,
    limit: number = 5
  ): Promise<DocumentSearchResult[]> {
    try {
      const index = await this.getIndex()
      
      console.log(`[Pinecone Documents] 🔍 Searching documents for bot ${botId} with query: "${query}"`)
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Search for relevant document chunks
      const searchResponse = await index.query({
        vector: queryEmbedding,
        filter: {
          botId: { $eq: botId }
        },
        topK: limit,
        includeMetadata: true
      })

      console.log(`[Pinecone Documents] Found ${searchResponse.matches?.length || 0} relevant document chunks`)

      // Convert results to DocumentSearchResult format
      const results: DocumentSearchResult[] = searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        documentId: match.metadata?.documentId as number,
        title: match.metadata?.title as string,
        content: match.metadata?.content as string,
        chunkIndex: match.metadata?.chunkIndex as number,
        totalChunks: match.metadata?.totalChunks as number,
        metadata: match.metadata
      })) || []

      // Log results
      results.forEach((result, index) => {
        console.log(`[Pinecone Documents] ${index + 1}. Document: ${result.title} (Score: ${result.score.toFixed(4)})`)
        console.log(`[Pinecone Documents]    Chunk ${result.chunkIndex + 1}/${result.totalChunks}: "${result.content.substring(0, 100)}..."`)
      })

      return results
    } catch (error) {
      console.error('[Pinecone Documents] Error searching documents:', error)
      return []
    }
  }

  /**
   * Delete document from Pinecone
   */
  static async deleteDocument(documentId: number): Promise<void> {
    try {
      const index = await this.getIndex()
      
      console.log(`[Pinecone Documents] Deleting document ${documentId} from Pinecone...`)
      
      // Query to find all chunks for this document
      const queryResponse = await index.query({
        vector: Array(512).fill(0), // Dummy vector for metadata-only search
        filter: {
          documentId: { $eq: documentId }
        },
        topK: 10000, // Large number to get all chunks
        includeMetadata: true
      })

      const vectorIds = queryResponse.matches?.map(match => match.id) || []
      
      if (vectorIds.length > 0) {
        await index.deleteMany(vectorIds)
        console.log(`[Pinecone Documents] ✅ Deleted ${vectorIds.length} chunks for document ${documentId}`)
      } else {
        console.log(`[Pinecone Documents] No chunks found for document ${documentId}`)
      }
    } catch (error) {
      console.error('[Pinecone Documents] Error deleting document:', error)
      throw error
    }
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(botId?: number): Promise<any> {
    try {
      const index = await this.getIndex()
      
      const stats = await index.describeIndexStats()
      console.log(`[Pinecone Documents] Index stats:`, stats)
      
      return stats
    } catch (error) {
      console.error('[Pinecone Documents] Error getting stats:', error)
      return null
    }
  }
}
