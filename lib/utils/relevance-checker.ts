export interface RelevanceResult {
  isRelevant: boolean
  confidence: number
  reason: string
}

export class RelevanceChecker {
  /**
   * Check if a query is relevant to the bot's knowledge base
   */
  static checkRelevance(
    query: string, 
    documentContext: string = '', 
    websiteContent: string = ''
  ): RelevanceResult {
    const queryLower = query.toLowerCase().trim()
    
    // If no context is provided, be more lenient
    if (!documentContext && !websiteContent) {
      return {
        isRelevant: true,
        confidence: 0.5,
        reason: 'No context available, allowing query'
      }
    }
    
    // Combine all available context
    const allContext = `${documentContext} ${websiteContent}`.toLowerCase()
    
    // Extract keywords from the query
    const queryKeywords = this.extractKeywords(queryLower)
    
    // Extract keywords from the context
    const contextKeywords = this.extractKeywords(allContext)
    
    // Calculate keyword overlap
    const commonKeywords = queryKeywords.filter(keyword => 
      contextKeywords.some(ctxKeyword => 
        ctxKeyword.includes(keyword) || keyword.includes(ctxKeyword)
      )
    )
    
    const relevanceScore = commonKeywords.length / Math.max(queryKeywords.length, 1)
    
    // If relevance score is high enough, consider it relevant
    if (relevanceScore > 0.3) {
      return {
        isRelevant: true,
        confidence: relevanceScore,
        reason: 'Query shows good keyword overlap with available content'
      }
    }
    
    // Check for specific patterns that indicate relevance to document content
    const contentRelevancePatterns = [
      // Questions about specific content in documents
      /^(what|tell|show|give|can|could|will|would)\s+(me\s+)?(about|information|details|content|data)\s+(in|from|of|regarding)/i,
      /^(what|how|do|does|can|could|will|would)\s+(is|are|was|were)\s+(in|on|about|regarding|mentioned)\s+(the\s+)?(document|content|information)/i,
      /^(summarize|summarise|explain|describe|list|show|give)\s+(me\s+)?(the\s+)?(content|information|details|document)/i,
      /^(what|which|how\s+many|how\s+much)\s+(is|are|was|were|do|does|can|could|will|would)\s+(in|on|about|regarding|mentioned)\s+(the\s+)?(document|content)/i,
      // Questions that specifically ask about document topics
      /^(what|who|when|where|why|how)\s+(is|are|was|were|does|do|can|could|will|would)\s+(.*(?:company|product|service|contact|website|email|phone|address|founded|headquartered|offers|provides)).*/i,
      /^(can|could|will|would)\s+(you\s+)?(summarize|summarise|explain|describe|tell|show|give)\s+(me\s+)?(about|information|details)/i
    ]
    
    const hasContentRelevancePatterns = contentRelevancePatterns.some(pattern => pattern.test(queryLower))
    
    if (hasContentRelevancePatterns) {
      return {
        isRelevant: true,
        confidence: 0.8,
        reason: 'Query follows patterns indicating document content-related questions'
      }
    }
    
    // Check for off-topic patterns
    const offTopicPatterns = [
      // General conversation
      /^(hi|hello|hey|good\s+(morning|afternoon|evening))/i,
      /^(how\s+are\s+you|how\s+do\s+you\s+do)/i,
      /^(thank\s+you|thanks|bye|goodbye)/i,
      // Personal questions
      /^(what\s+is\s+your\s+name|who\s+are\s+you|what\s+are\s+you)/i,
      /^(do\s+you\s+have\s+feelings|are\s+you\s+alive|are\s+you\s+real)/i,
      // Random topics not related to content
      /^(tell\s+me\s+a\s+joke|make\s+me\s+laugh|entertain\s+me)/i,
      /^(what\s+is\s+the\s+weather|what\s+time\s+is\s+it)/i,
      /^(help\s+me\s+with\s+my\s+homework|solve\s+this\s+math\s+problem)/i,
      // General knowledge questions not related to documents
      /^(what\s+is\s+the\s+capital\s+of|what\s+is\s+the\s+population\s+of|what\s+is\s+the\s+area\s+of)/i,
      /^(how\s+do\s+i\s+cook|how\s+to\s+cook|recipe\s+for)/i,
      /^(what\s+movies\s+are\s+playing|what\s+is\s+on\s+tv|what\s+is\s+on\s+netflix)/i,
      // Completely unrelated topics
      /^(cooking|recipe|food|restaurant)/i,
      /^(sports|football|basketball|soccer)/i,
      /^(movies|music|entertainment|celebrity)/i,
      /^(politics|election|government)/i,
      /^(health|medical|doctor|hospital)/i,
      /^(weather|temperature|rain|sunny|cloudy)/i,
      /^(travel|vacation|trip|hotel|flight)/i,
      /^(shopping|buy|purchase|price|cost)/i,
      /^(news|current\s+events|breaking\s+news)/i
    ]
    
    const hasOffTopicPatterns = offTopicPatterns.some(pattern => pattern.test(queryLower))
    
    if (hasOffTopicPatterns) {
      return {
        isRelevant: false,
        confidence: 0.9,
        reason: 'Query appears to be off-topic or unrelated to available content'
      }
    }
    
    // If we have document context and the query is asking about content, be more lenient
    if (documentContext && queryLower.includes('document') || queryLower.includes('content')) {
      return {
        isRelevant: true,
        confidence: 0.6,
        reason: 'Query is asking about document content'
      }
    }
    
    // Default to not relevant if we can't determine relevance
    return {
      isRelevant: false,
      confidence: 0.3,
      reason: 'Query does not appear to be related to available content'
    }
  }
  
  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words
      .filter(word => !this.isStopWord(word)) // Remove stop words
  }
  
  /**
   * Check if a word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]
    return stopWords.includes(word)
  }
}
