import { KnowledgeDocumentService } from './knowledge-document.service'

export interface SearchResult {
  document: any
  relevanceScore: number
  matchedContent: string
}

export class DocumentSearchService {
  /**
   * Search for relevant content in bot's knowledge documents
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

      // Simple text-based search (in production, you'd use vector search)
      const results: SearchResult[] = []
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2)

      for (const document of availableDocuments) {
        const content = document.content.toLowerCase()
        let relevanceScore = 0
        let matchedContent = ''

        // Calculate relevance score based on word matches
        for (const word of queryWords) {
          const wordCount = (content.match(new RegExp(word, 'g')) || []).length
          relevanceScore += wordCount
        }

        if (relevanceScore > 0) {
          // Find the most relevant sentence/paragraph
          const sentences = document.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
          let bestSentence = ''
          let bestScore = 0

          for (const sentence of sentences) {
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
            }
          }

          matchedContent = bestSentence || document.content.substring(0, 200) + '...'
          
          results.push({
            document,
            relevanceScore,
            matchedContent
          })
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
   * Get context from documents for chat responses
   */
  static async getContextForQuery(botId: number, query: string): Promise<string> {
    try {
      console.log(`[DocumentSearch] Getting context for bot ${botId} with query: "${query}"`)
      const results = await this.searchDocuments(botId, query, 3)
      
      if (results.length === 0) {
        console.log(`[DocumentSearch] No context found for query: "${query}"`)
        return ''
      }

      let context = 'Relevant information from knowledge base:\n\n'
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        context += `${i + 1}. From "${result.document.title}":\n`
        context += `${result.matchedContent}\n\n`
      }

      console.log(`[DocumentSearch] Generated context with ${results.length} results`)
      return context

    } catch (error) {
      console.error('Context generation error:', error)
      return ''
    }
  }
}
