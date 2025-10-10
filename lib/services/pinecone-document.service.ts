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
          dimension: config.pinecone.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: config.pinecone.cloud as 'aws' | 'gcp' | 'azure',
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

  private static async getIndexByName(indexName: string) {
    await this.initialize()
    if (!this.pc) throw new Error('Pinecone not initialized')
    return this.pc.index(indexName)
  }

  private static async getIndexWithNamespace(botId: number) {
    console.log(`[Pinecone Documents] Getting index with namespace for bot ${botId}`)
    const index = await this.getIndex()
    const namespace = `bot_${botId}`
    console.log(`[Pinecone Documents] Using namespace: ${namespace}`)
    const namespacedIndex = index.namespace(namespace)
    console.log(`[Pinecone Documents] Namespaced index created successfully`)
    return namespacedIndex
  }

  /**
   * Enhance query for better company-specific search results
   */
  private static enhanceQueryForCompanySearch(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // Add contact-specific terms if the query is about contact information
    if (lowerQuery.includes('contact') || 
        lowerQuery.includes('phone') || 
        lowerQuery.includes('email') ||
        lowerQuery.includes('address') ||
        lowerQuery.includes('location') ||
        lowerQuery.includes('details') ||
        lowerQuery.includes('information') ||
        lowerQuery.includes('give me') ||
        lowerQuery.includes('show me') ||
        lowerQuery.includes('tell me')) {
      
      // Add contact-related terms to improve relevance
      const contactTerms = [
        'contact information', 'phone number', 'email address', 'address', 'location',
        'contact details', 'company contact', 'business contact', 'reach us', 'get in touch'
      ]
      
      return `${query} ${contactTerms.join(' ')}`
    }
    
    // Add company-specific terms if the query is about the company
    if (lowerQuery.includes('company') || 
        lowerQuery.includes('about') || 
        lowerQuery.includes('what') ||
        lowerQuery.includes('who')) {
      
      // Add business-related terms to improve relevance
      const businessTerms = [
        'business', 'services', 'products', 'company information',
        'about us', 'company details', 'corporate information'
      ]
      
      return `${query} ${businessTerms.join(' ')}`
    }
    
    // Add service/product terms for general queries
    if (lowerQuery.includes('service') || lowerQuery.includes('product')) {
      return `${query} company business`
    }
    
    return query
  }

  /**
   * Generate embedding for text using OpenAI or fallback
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[Pinecone Documents] 🔍 Generating embedding for text: "${text.substring(0, 100)}..."`)
      const openAIEmbedding = await openAIAPI.createEmbedding(text, config.pinecone.embeddingModel)
      if (openAIEmbedding && openAIEmbedding.length > 0) {
        const projected = this.projectEmbedding(openAIEmbedding, config.pinecone.dimension)
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

  private static async generateWordPressEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[Pinecone Documents] 🔍 Generating WordPress embedding for text: "${text.substring(0, 100)}..."`)
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small', // 1536 dimensions
          input: text.substring(0, 8000),
        }),
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('[Pinecone Documents] Error generating WordPress embedding:', error);
      return this.generateFallbackEmbedding(text);
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
    const embedding = new Array(config.pinecone.dimension).fill(0)
    
    // Enhanced word-based embedding with semantic weighting
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      const position = hash % config.pinecone.dimension
      
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
    const embedding = new Array(config.pinecone.dimension).fill(0)
    
    // Simple word-based embedding
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      const position = hash % config.pinecone.dimension
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
   * Improved version with better PDF text handling
   */
  private static splitIntoChunks(content: string, chunkSize: number = config.pinecone.chunkSize, overlap: number = config.pinecone.chunkOverlap): string[] {
    // Preprocess content for better chunking
    const preprocessedContent = this.preprocessContentForChunking(content)
    
    const chunks: string[] = []
    let start = 0
    
    while (start < preprocessedContent.length) {
      const end = Math.min(start + chunkSize, preprocessedContent.length)
      let chunk = preprocessedContent.substring(start, end)
      
      // Try to break at natural boundaries
      if (end < preprocessedContent.length) {
        // Look for sentence boundaries first
        const lastSentence = chunk.lastIndexOf('.')
        const lastExclamation = chunk.lastIndexOf('!')
        const lastQuestion = chunk.lastIndexOf('?')
        const lastNewline = chunk.lastIndexOf('\n')
        const lastParagraph = chunk.lastIndexOf('\n\n')
        
        // Find the best break point
        const breakPoints = [lastSentence, lastExclamation, lastQuestion, lastParagraph, lastNewline]
          .filter(point => point > start + chunkSize * 0.3) // Don't break too early
          .sort((a, b) => b - a) // Sort descending
        
        const breakPoint = breakPoints[0] || lastNewline
        
        if (breakPoint > start + chunkSize * 0.5) {
          chunk = preprocessedContent.substring(start, start + breakPoint + 1)
          start = start + breakPoint + 1 - overlap
        } else {
          // If no good break point, try to break at word boundary
          const lastSpace = chunk.lastIndexOf(' ')
          if (lastSpace > start + chunkSize * 0.7) {
            chunk = preprocessedContent.substring(start, start + lastSpace)
            start = start + lastSpace + 1 - overlap
          } else {
            start = end - overlap
          }
        }
      } else {
        start = end
      }
      
      // Clean up the chunk
      const cleanedChunk = chunk.trim()
      if (cleanedChunk.length > 0) {
        chunks.push(cleanedChunk)
      }
    }
    
    // Filter out very small chunks and ensure minimum quality
    return chunks.filter(chunk => 
      chunk.length >= 50 && // Minimum length
      !this.isLowQualityChunk(chunk) // Quality check
    )
  }

  /**
   * Preprocess content to improve chunking quality
   */
  private static preprocessContentForChunking(content: string): string {
    return content
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add periods between camelCase
      .replace(/(\d+)\s*([A-Z][a-z])/g, '$1. $2') // Add periods between numbers and words
      // Remove excessive line breaks
      .replace(/\n\s*\n/g, '\n')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Remove common PDF artifacts
      .replace(/\f/g, '') // Form feed characters
      .replace(/\u00A0/g, ' ') // Non-breaking spaces
      .trim()
  }

  /**
   * Check if a chunk is low quality and should be filtered out
   */
  private static isLowQualityChunk(chunk: string): boolean {
    // Check for very short chunks
    if (chunk.length < 50) return true
    
    // Check for chunks with mostly special characters
    const specialCharRatio = (chunk.match(/[^a-zA-Z0-9\s]/g) || []).length / chunk.length
    if (specialCharRatio > 0.7) return true
    
    // Check for chunks with mostly numbers
    const numberRatio = (chunk.match(/\d/g) || []).length / chunk.length
    if (numberRatio > 0.8) return true
    
    // Check for chunks with very few words
    const wordCount = chunk.split(/\s+/).length
    if (wordCount < 5) return true
    
    // Check for chunks that are mostly repeated characters
    const uniqueChars = new Set(chunk.toLowerCase()).size
    if (uniqueChars < 5) return true
    
    return false
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
      const index = await this.getIndexWithNamespace(botId)
      const namespace = `bot_${botId}`
      
      console.log(`[Pinecone Documents] Storing document: ${title} (ID: ${documentId}) for bot ${botId} in namespace ${namespace}`)
      console.log(`[Pinecone Documents] Content length: ${content.length} characters`)
      
      // Split content into chunks
      const chunks = this.splitIntoChunks(content, config.pinecone.chunkSize, config.pinecone.chunkOverlap)
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
      
      // Batch upsert with namespace
      console.log(`[Pinecone Documents] Upserting ${vectors.length} vectors to Pinecone namespace ${namespace}...`)
      await index.upsert(vectors)
      
      console.log(`[Pinecone Documents] ✅ Successfully stored document ${title} with ${chunks.length} chunks in namespace ${namespace}`)
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
      // Search in chatbot index for scraped content
      const index = await this.getIndexWithNamespace(botId)
      const namespace = `bot_${botId}`
      
      console.log(`[Pinecone Documents] 🔍 Searching scraped documents for bot ${botId} with query: "${query}" in namespace ${namespace}`)
      
      // Enhance query for better company-specific results
      const enhancedQuery = this.enhanceQueryForCompanySearch(query)
      console.log(`[Pinecone Documents] Enhanced query: "${enhancedQuery}"`)
      
      // Generate embedding for the enhanced query
      const queryEmbedding = await this.generateEmbedding(enhancedQuery)
      
      // Search for scraped content in bot namespace
      // Try multiple search strategies to find relevant content
      let searchResponse = await index.query({
        vector: queryEmbedding,
        filter: {
          type: { $eq: 'scraped_content' } // Only get scraped content
        },
        topK: limit * 2, // Get more results to filter later
        includeMetadata: true
      })

      // If no results with strict filter, try without filter to see what's available
      if (!searchResponse.matches || searchResponse.matches.length === 0) {
        console.log(`[Pinecone Documents] No results with strict filter, trying without filter to see available data`)
        searchResponse = await index.query({
          vector: queryEmbedding,
          topK: limit * 2,
          includeMetadata: true
        })
        console.log(`[Pinecone Documents] Unfiltered search found ${searchResponse.matches?.length || 0} results`)
        if (searchResponse.matches && searchResponse.matches.length > 0) {
          console.log(`[Pinecone Documents] Sample metadata:`, searchResponse.matches[0].metadata)
          // Check if the issue is with the type filter
          const hasScrapedContent = searchResponse.matches.some(match => match.metadata?.type === 'scraped_content')
          if (!hasScrapedContent) {
            console.log(`[Pinecone Documents] ⚠️ No documents found with type 'scraped_content'. Available types:`, 
              [...new Set(searchResponse.matches.map(m => m.metadata?.type).filter(Boolean))])
            console.log(`[Pinecone Documents] 🔄 Proceeding with unfiltered results since no scraped_content type found`)
          }
        }
      }

      console.log(`[Pinecone Documents] Found ${searchResponse.matches?.length || 0} relevant document chunks`)
      
      // Log all results before filtering for debugging
      if (searchResponse.matches && searchResponse.matches.length > 0) {
        console.log(`[Pinecone Documents] All results before filtering:`)
        searchResponse.matches.forEach((match, index) => {
          console.log(`[Pinecone Documents] ${index + 1}. ${match.metadata?.title} (Score: ${match.score?.toFixed(4)}, Chunk: ${(Number(match.metadata?.chunkIndex) || 0) + 1}/${match.metadata?.totalChunks}, Type: ${match.metadata?.type || 'unknown'})`)
        })
      } else {
        console.log(`[Pinecone Documents] No search results found for query: "${query}"`)
      }

      // Convert results to DocumentSearchResult format
      const results: DocumentSearchResult[] = searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        documentId: match.metadata?.documentId as number || 0,
        title: match.metadata?.title as string || 'Untitled',
        content: match.metadata?.content as string || '',
        chunkIndex: match.metadata?.chunkIndex as number || 0,
        totalChunks: match.metadata?.totalChunks as number || 1,
        metadata: match.metadata
      })) || []

      console.log(`[Pinecone Documents] Converted ${results.length} results for processing`)
      if (results.length > 0) {
        console.log(`[Pinecone Documents] Sample result:`, {
          id: results[0].id,
          title: results[0].title,
          score: results[0].score,
          type: results[0].metadata?.type
        })
      }

      // Filter out low-quality results and irrelevant content
      const filteredResults = results.filter(result => {
        // For cosine similarity, scores range from -1 to 1, with higher being more similar
        // Use a more appropriate threshold for cosine similarity
        const minScore = -0.3 // Allow negative scores but filter out very dissimilar results
        console.log(`[Pinecone Documents] Checking score: ${result.title} (${result.score.toFixed(4)}) vs threshold (${minScore.toFixed(4)})`)
        if (result.score < minScore) {
          console.log(`[Pinecone Documents] Filtered out low score: ${result.title} (${result.score.toFixed(4)})`)
          return false
        }
        
        // Filter out results with corrupted or meaningless content
        if (!result.content || result.content.length < 10) {
          console.log(`[Pinecone Documents] Filtered out short content: ${result.title} (${result.content?.length || 0} chars)`)
          return false
        }
        
        // Clean HTML entities and normalize content
        if (result.content) {
          result.content = result.content
            .replace(/&#8211;/g, '–') // En dash
            .replace(/&#8212;/g, '—') // Em dash
            .replace(/&#8216;/g, '\u2018') // Left single quotation mark
            .replace(/&#8217;/g, '\u2019') // Right single quotation mark
            .replace(/&#8220;/g, '\u201C') // Left double quotation mark
            .replace(/&#8221;/g, '\u201D') // Right double quotation mark
            .replace(/&amp;/g, '&') // Ampersand
            .replace(/&lt;/g, '<') // Less than
            .replace(/&gt;/g, '>') // Greater than
            .replace(/&quot;/g, '"') // Quote
            .replace(/&#39;/g, "'") // Apostrophe
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
        }
        
        // Filter out content that looks like corrupted text (be more specific)
        const corruptedPatterns = [
          /^[^\w\s]*$/, // Only special characters
          /^[A-Z\s]{10,}$/, // Only uppercase letters and spaces (longer than 10 chars)
          /^\d+$/, // Only numbers
          /^[^\w]*[^\w\s][^\w]*$/, // Mostly special characters
        ]
        
        if (corruptedPatterns.some(pattern => pattern.test(result.content))) {
          console.log(`[Pinecone Documents] Filtered out corrupted content: ${result.title}`)
          return false
        }
        
        // Filter out Wikipedia and generic content (be more specific)
        const title = result.title.toLowerCase()
        if (title.includes('wikipedia') || 
            title.includes('encyclopedia') || 
            title.includes('generic') ||
            title.includes('example') ||
            title.includes('test')) {
          console.log(`[Pinecone Documents] Filtered out generic content: ${result.title}`)
          return false
        }
        
        // Filter out content that doesn't contain meaningful words (be more lenient)
        const meaningfulWords = result.content.toLowerCase().match(/\b[a-z]{2,}\b/g) || []
        if (meaningfulWords.length < 1) {
          console.log(`[Pinecone Documents] Filtered out meaningless content: ${result.title} (${meaningfulWords.length} words)`)
          return false
        }
        
        console.log(`[Pinecone Documents] Keeping result: ${result.title} (Score: ${result.score.toFixed(4)}, Words: ${meaningfulWords.length})`)
        return true
      })
      
      // Sort by score (highest first) and then by chunk index (lowest first) for better chunk selection
      const sortedResults = filteredResults.sort((a, b) => {
        // First sort by score (descending)
        if (Math.abs(a.score - b.score) > 0.01) { // Only consider score difference if it's significant
          return b.score - a.score
        }
        // If scores are similar, prefer lower chunk index (chunk_1 over chunk_3)
        return a.chunkIndex - b.chunkIndex
      }).slice(0, limit) // Limit to requested number of results

      // Log results
      sortedResults.forEach((result, index) => {
        console.log(`[Pinecone Documents] ${index + 1}. Document: ${result.title} (Score: ${result.score.toFixed(4)})`)
        console.log(`[Pinecone Documents]    Chunk ${result.chunkIndex + 1}/${result.totalChunks}: "${result.content.substring(0, 100)}..."`)
      })

      console.log(`[Pinecone Documents] Filtered ${results.length} results down to ${sortedResults.length} relevant chunks`)

      return sortedResults
    } catch (error) {
      console.error('[Pinecone Documents] Error searching documents:', error)
      
      // If Pinecone search fails, try a simpler search without filters
      try {
        console.log('[Pinecone Documents] Attempting fallback search without filters...')
        const fallbackIndex = await this.getIndexWithNamespace(botId)
        const fallbackEmbedding = await this.generateEmbedding(query)
        const fallbackResponse = await fallbackIndex.query({
          vector: fallbackEmbedding,
          topK: limit,
          includeMetadata: true
        })
        
        const fallbackResults = fallbackResponse.matches?.map((match: any) => ({
          id: match.id,
          score: match.score || 0,
          documentId: match.metadata?.documentId as number,
          title: match.metadata?.title as string,
          content: match.metadata?.content as string,
          chunkIndex: match.metadata?.chunkIndex as number,
          totalChunks: match.metadata?.totalChunks as number,
          metadata: match.metadata
        })) || []
        
        // Apply basic filtering to fallback results (more lenient)
        const filteredFallback = fallbackResults.filter((result: any) => 
          result.score > -0.5 && // More lenient score threshold
          result.content && 
          result.content.length > 10 && // Shorter minimum content length
          !result.title.toLowerCase().includes('wikipedia')
        )
        
        console.log(`[Pinecone Documents] Fallback search found ${filteredFallback.length} results`)
        return filteredFallback
        
      } catch (fallbackError) {
        console.error('[Pinecone Documents] Fallback search also failed:', fallbackError)
        return []
      }
    }
  }

  /**
   * Delete document from Pinecone
   */
  static async deleteDocument(documentId: number, botId: number): Promise<void> {
    try {
      const index = await this.getIndexWithNamespace(botId)
      const namespace = `bot_${botId}`
      
      console.log(`[Pinecone Documents] Deleting document ${documentId} from Pinecone namespace ${namespace}...`)
      
      // Query to find all chunks for this document
      const queryResponse = await index.query({
        vector: Array(config.pinecone.dimension).fill(0), // Dummy vector for metadata-only search
        filter: {
          documentId: { $eq: documentId }
        },
        topK: 10000, // Large number to get all chunks
        includeMetadata: true
      })

      const vectorIds = queryResponse.matches?.map(match => match.id) || []
      
      if (vectorIds.length > 0) {
        await index.deleteMany(vectorIds)
        console.log(`[Pinecone Documents] ✅ Deleted ${vectorIds.length} chunks for document ${documentId} from namespace ${namespace}`)
      } else {
        console.log(`[Pinecone Documents] No chunks found for document ${documentId} in namespace ${namespace}`)
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
      console.log(`[Pinecone Documents] Index stats for namespace ${botId ? `bot_${botId}` : '_default_'}:`, stats)
      
      return stats
    } catch (error) {
      console.error('[Pinecone Documents] Error getting stats:', error)
      return null
    }
  }

  /**
   * Delete all documents for a specific bot
   */
  static async deleteBotDocuments(botId: number): Promise<void> {
    try {
      const index = await this.getIndexWithNamespace(botId)
      const namespace = `bot_${botId}`
      
      console.log(`[Pinecone Documents] Deleting all documents for bot ${botId} in namespace ${namespace}`)
      
      // Delete all document vectors in the bot's namespace
      await index.deleteAll()
      
      console.log(`[Pinecone Documents] Successfully deleted all documents for bot ${botId}`)
    } catch (error) {
      console.error(`[Pinecone Documents] Failed to delete documents for bot ${botId}:`, error)
      throw error
    }
  }
}
