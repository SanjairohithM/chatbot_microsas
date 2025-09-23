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
      // Get all indexed documents for the bot
      const documents = await KnowledgeDocumentService.getKnowledgeDocumentsByBotId(botId)
      
      // Filter only indexed documents
      const indexedDocuments = documents.filter(doc => doc.status === 'indexed' && doc.content)
      
      if (indexedDocuments.length === 0) {
        return []
      }

      // Simple text-based search (in production, you'd use vector search)
      const results: SearchResult[] = []
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2)

      for (const document of indexedDocuments) {
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
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)

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
      const results = await this.searchDocuments(botId, query, 3)
      
      if (results.length === 0) {
        return ''
      }

      let context = 'Relevant information from knowledge base:\n\n'
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        context += `${i + 1}. From "${result.document.title}":\n`
        context += `${result.matchedContent}\n\n`
      }

      return context

    } catch (error) {
      console.error('Context generation error:', error)
      return ''
    }
  }
}
