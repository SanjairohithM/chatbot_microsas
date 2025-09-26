import { KnowledgeDocumentService } from './knowledge-document.service'

export interface SearchResult {
  document: any
  relevanceScore: number
  matchedContent: string
  context: string
  matchType: 'exact' | 'partial' | 'semantic'
}

export class DocumentSearchService {
  /**
   * Enhanced search for relevant content in bot's knowledge documents
   */
  static async searchDocuments(botId: number, query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`[DocumentSearch] Searching documents for bot ${botId} with query: "${query}"`)
      
      // Get all indexed documents for the bot
      const documents = await KnowledgeDocumentService.getDocumentsByBotId(botId)
      console.log(`[DocumentSearch] Found ${documents.length} total documents for bot ${botId}`)
      
      // Debug: Log document details
      documents.forEach((doc, index) => {
        console.log(`[DocumentSearch] Document ${index + 1}: "${doc.title}" - Status: ${doc.status} - Content length: ${doc.content ? doc.content.length : 0}`)
      })
      
      // Filter documents with content (be more lenient with status)
      const availableDocuments = documents.filter(doc => doc.content && doc.content.trim().length > 0)
      console.log(`[DocumentSearch] Found ${availableDocuments.length} documents with content`)
      
      if (availableDocuments.length === 0) {
        console.log(`[DocumentSearch] No documents with content found for bot ${botId}`)
        return []
      }

      // Enhanced search with multiple strategies
      const results: SearchResult[] = []
      const queryWords = this.extractQueryTerms(query)

      for (const document of availableDocuments) {
        const searchResult = this.searchInDocument(document, query, queryWords)
        if (searchResult) {
          results.push(searchResult)
        }
      }

      // Sort by relevance score and return top results
      const finalResults = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
      
      console.log(`[DocumentSearch] Returning ${finalResults.length} search results`)
      return finalResults

    } catch (error) {
      console.error('Document search error:', error)
      return []
    }
  }

  /**
   * Extract meaningful terms from query
   */
  private static extractQueryTerms(query: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
      .filter(word => word.length > 0)
  }

  /**
   * Search within a single document using multiple strategies
   */
  private static searchInDocument(document: any, query: string, queryWords: string[]): SearchResult | null {
    const content = document.content.toLowerCase()
    const originalContent = document.content
    let relevanceScore = 0
    let matchedContent = ''
    let context = ''
    let matchType: 'exact' | 'partial' | 'semantic' = 'partial'

    // Strategy 1: Exact phrase matching (highest priority)
    const exactMatch = originalContent.toLowerCase().includes(query.toLowerCase())
    if (exactMatch) {
      relevanceScore += 100
      matchType = 'exact'
      const index = originalContent.toLowerCase().indexOf(query.toLowerCase())
      const start = Math.max(0, index - 100)
      const end = Math.min(originalContent.length, index + query.length + 100)
      matchedContent = originalContent.substring(start, end).trim()
    }

    // Strategy 2: Word-based matching
    let wordMatches = 0
    for (const word of queryWords) {
      const wordCount = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
      wordMatches += wordCount
      relevanceScore += wordCount * 10
    }

    // Strategy 3: Semantic similarity (basic implementation)
    const semanticScore = this.calculateSemanticSimilarity(query, originalContent)
    relevanceScore += semanticScore * 5

    // If we have matches, find the best context
    if (relevanceScore > 0) {
      if (!matchedContent) {
        const bestContext = this.findBestContext(originalContent, queryWords)
        matchedContent = bestContext.content
        context = bestContext.context
      } else {
        context = this.generateContext(originalContent, matchedContent)
      }
    }

    return relevanceScore > 0 ? {
      document,
      relevanceScore,
      matchedContent: matchedContent || originalContent.substring(0, 200) + '...',
      context,
      matchType
    } : null
  }

  /**
   * Find the best context around query terms
   */
  private static findBestContext(content: string, queryWords: string[]): { content: string; context: string } {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    let bestSentence = ''
    let bestScore = 0
    let bestIndex = -1

    // Find the sentence with the most query word matches
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceLower = sentence.toLowerCase()
      let sentenceScore = 0
      
      for (const word of queryWords) {
        if (sentenceLower.includes(word)) {
          sentenceScore++
        }
      }

      if (sentenceScore > bestScore) {
        bestScore = sentenceScore
        bestSentence = sentence.trim()
        bestIndex = i
      }
    }

    // Generate context from surrounding sentences
    let context = ''
    if (bestIndex >= 0) {
      const start = Math.max(0, bestIndex - 1)
      const end = Math.min(sentences.length, bestIndex + 2)
      context = sentences.slice(start, end).join('. ').trim()
    }

    return {
      content: bestSentence,
      context: context || bestSentence
    }
  }

  /**
   * Generate context around matched content
   */
  private static generateContext(content: string, matchedContent: string): string {
    const index = content.toLowerCase().indexOf(matchedContent.toLowerCase())
    if (index === -1) return matchedContent

    const start = Math.max(0, index - 150)
    const end = Math.min(content.length, index + matchedContent.length + 150)
    return content.substring(start, end).trim()
  }

  /**
   * Basic semantic similarity calculation
   */
  private static calculateSemanticSimilarity(query: string, content: string): number {
    // Simple keyword-based similarity
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentWords = content.toLowerCase().split(/\s+/)
    
    let matches = 0
    for (const queryWord of queryWords) {
      if (contentWords.includes(queryWord)) {
        matches++
      }
    }
    
    return matches / queryWords.length
  }

  /**
   * Get enhanced context from documents for chat responses
   */
  static async getContextForQuery(botId: number, query: string): Promise<string> {
    try {
      console.log(`[DocumentSearch] Getting context for bot ${botId} with query: "${query}"`)
      const results = await this.searchDocuments(botId, query, 5)
      
      if (results.length === 0) {
        console.log(`[DocumentSearch] No context found for query: "${query}"`)
        return ''
      }

      let context = 'Relevant information from knowledge base:\n\n'
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const matchTypeLabel = result.matchType === 'exact' ? '[EXACT MATCH]' : 
                              result.matchType === 'partial' ? '[PARTIAL MATCH]' : '[SEMANTIC MATCH]'
        
        context += `${i + 1}. ${matchTypeLabel} From "${result.document.title}" (Score: ${result.relevanceScore}):\n`
        
        // Use context if available, otherwise use matched content
        const contentToUse = result.context || result.matchedContent
        context += `${contentToUse}\n\n`
      }

      // Add summary of search results
      const exactMatches = results.filter(r => r.matchType === 'exact').length
      const partialMatches = results.filter(r => r.matchType === 'partial').length
      const semanticMatches = results.filter(r => r.matchType === 'semantic').length
      
      context += `Search Summary: Found ${exactMatches} exact matches, ${partialMatches} partial matches, and ${semanticMatches} semantic matches.\n\n`

      console.log(`[DocumentSearch] Generated enhanced context with ${results.length} results`)
      return context

    } catch (error) {
      console.error('Context generation error:', error)
      return ''
    }
  }

  /**
   * Get detailed search results for debugging/analysis
   */
  static async getDetailedSearchResults(botId: number, query: string, limit: number = 10): Promise<{
    query: string
    totalDocuments: number
    results: SearchResult[]
    summary: {
      exactMatches: number
      partialMatches: number
      semanticMatches: number
      averageScore: number
    }
  }> {
    try {
      const results = await this.searchDocuments(botId, query, limit)
      const documents = await KnowledgeDocumentService.getDocumentsByBotId(botId)
      
      const exactMatches = results.filter(r => r.matchType === 'exact').length
      const partialMatches = results.filter(r => r.matchType === 'partial').length
      const semanticMatches = results.filter(r => r.matchType === 'semantic').length
      const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length : 0

      return {
        query,
        totalDocuments: documents.length,
        results,
        summary: {
          exactMatches,
          partialMatches,
          semanticMatches,
          averageScore: Math.round(averageScore * 100) / 100
        }
      }
    } catch (error) {
      console.error('Detailed search results error:', error)
      return {
        query,
        totalDocuments: 0,
        results: [],
        summary: {
          exactMatches: 0,
          partialMatches: 0,
          semanticMatches: 0,
          averageScore: 0
        }
      }
    }
  }
}
