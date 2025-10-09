import { ExternalDatabaseService, DatabaseConfig, QueryResult } from './external-database.service'
import { DatabaseAuthMiddleware } from '@/lib/middleware/database-auth'
import { OpenAIService } from './openai.service'
import { UserApiKeyService } from './user-api-key.service'

export interface ChatbotDatabaseConfig {
  botId: number
  databaseConfig: DatabaseConfig
  systemPrompt?: string
  maxContextLength?: number
  enableQueryLogging?: boolean
}

export interface ChatbotQueryRequest {
  userMessage: string
  context?: string
  maxRows?: number
  temperature?: number
}

export interface ChatbotQueryResponse {
  response: string
  query?: string
  queryResult?: QueryResult
  confidence: number
  executionTime: number
  timestamp: string
}

export class ChatbotDatabaseService {
  /**
   * Generate chatbot response based on database query
   */
  static async generateResponse(
    config: ChatbotDatabaseConfig,
    request: ChatbotQueryRequest
  ): Promise<ChatbotQueryResponse> {
    const startTime = Date.now()

    try {
      // Get user's API key for this bot
      const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(config.botId)
      if (!userApiKey) {
        throw new Error('No OpenAI API key found. Please configure your API key in settings.')
      }

      // Step 1: Analyze user message to determine if database query is needed
      const queryAnalysis = await this.analyzeUserMessage(request.userMessage, config.systemPrompt, userApiKey)
      
      if (!queryAnalysis.needsQuery) {
        // Generate response without database query
        const response = await this.generateSimpleResponse(
          request.userMessage, 
          config.systemPrompt,
          request.temperature,
          userApiKey
        )
        
        return {
          response,
          confidence: 0.8,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }

      // Step 2: Generate SQL query based on user message
      const generatedQuery = await this.generateSQLQuery(
        request.userMessage,
        config.databaseConfig,
        queryAnalysis.intent,
        request.context,
        userApiKey
      )

      if (!generatedQuery.query) {
        return {
          response: "I understand you're asking about data, but I couldn't generate a suitable query. Could you please rephrase your question?",
          confidence: 0.3,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }

      // Step 3: Execute the query
      let queryResult: QueryResult
      try {
        queryResult = await ExternalDatabaseService.executeQuery(
          config.databaseConfig,
          generatedQuery.query,
          generatedQuery.parameters || []
        )
      } catch (error) {
        console.error('Query execution failed:', error)
        return {
          response: "I encountered an error while querying the database. Please check your question and try again.",
          confidence: 0.2,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }

      // Step 4: Generate natural language response from query results
      const response = await this.generateResponseFromQueryResult(
        request.userMessage,
        queryResult,
        config.systemPrompt,
        generatedQuery.query,
        request.temperature,
        userApiKey
      )

      // Log query if enabled
      if (config.enableQueryLogging) {
        await this.logQuery(config.botId, generatedQuery.query, queryResult, request.userMessage)
      }

      return {
        response,
        query: generatedQuery.query,
        queryResult,
        confidence: this.calculateConfidence(queryResult, generatedQuery.confidence),
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Chatbot database service error:', error)
      return {
        response: "I'm sorry, I encountered an error while processing your request. Please try again.",
        confidence: 0.1,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Analyze user message to determine if database query is needed
   */
  private static async analyzeUserMessage(
    message: string, 
    systemPrompt?: string,
    apiKey?: string
  ): Promise<{ needsQuery: boolean; intent: string; confidence: number }> {
    try {
      const analysisPrompt = `
        Analyze the following user message to determine if it requires a database query.
        
        System Context: ${systemPrompt || 'General chatbot assistant'}
        
        User Message: "${message}"
        
        Respond with JSON:
        {
          "needsQuery": boolean,
          "intent": "description of what the user wants",
          "confidence": number between 0 and 1
        }
        
        Consider these indicators for database queries:
        - Questions about data, records, information
        - Requests for counts, totals, statistics
        - Questions about specific entities or records
        - Requests for lists or reports
        - Questions using words like "show", "find", "get", "list", "count", "how many"
      `

      const response = await OpenAIService.generateResponse([
        { role: 'user', content: analysisPrompt }
      ], {
        temperature: 0.1,
        max_tokens: 200
      }, apiKey)

      // Validate response before parsing
      if (!response || typeof response !== 'string' || response.trim() === '') {
        console.warn('Empty or invalid response from OpenAI service')
        return {
          needsQuery: false,
          intent: 'general inquiry',
          confidence: 0.3
        }
      }

      // Try to extract JSON from response (in case there's extra text)
      let jsonString = response.trim()
      
      // Look for JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      // Validate JSON format
      if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        console.warn('Response does not contain valid JSON:', response)
        return {
          needsQuery: false,
          intent: 'general inquiry',
          confidence: 0.3
        }
      }

      const analysis = JSON.parse(jsonString)
      
      // Validate required fields
      if (typeof analysis !== 'object' || analysis === null) {
        console.warn('Parsed response is not an object:', analysis)
        return {
          needsQuery: false,
          intent: 'general inquiry',
          confidence: 0.3
        }
      }

      return {
        needsQuery: Boolean(analysis.needsQuery),
        intent: String(analysis.intent || 'general inquiry'),
        confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0.5))
      }

    } catch (error) {
      console.error('Message analysis error:', error)
      return {
        needsQuery: false,
        intent: 'general inquiry',
        confidence: 0.3
      }
    }
  }

  /**
   * Generate SQL query based on user message and database schema
   */
  private static async generateSQLQuery(
    message: string,
    databaseConfig: DatabaseConfig,
    intent: string,
    context?: string,
    apiKey?: string
  ): Promise<{ query: string; parameters: any[]; confidence: number }> {
    try {
      // Get database schema for context
      const schema = await ExternalDatabaseService.getSchemaInfo(databaseConfig)
      const schemaInfo = schema.map((table: any) => ({
        name: table.table_name,
        comment: table.table_comment
      })).slice(0, 10) // Limit to first 10 tables

      const queryPrompt = `
        Generate a SQL query based on the user's request.
        
        Database Type: ${databaseConfig.type}
        Database: ${databaseConfig.database}
        
        Available Tables:
        ${schemaInfo.map((table: any) => `- ${table.name}: ${table.comment || 'No description'}`).join('\n')}
        
        User Intent: ${intent}
        User Message: "${message}"
        Additional Context: ${context || 'None'}
        
        Guidelines:
        1. Use only SELECT queries
        2. Include appropriate WHERE clauses
        3. Use LIMIT to prevent large result sets
        4. Use parameterized queries for user inputs
        5. Be specific and relevant to the user's question
        6. If unsure, ask for clarification rather than guessing
        
        Respond with JSON:
        {
          "query": "SELECT statement with ? placeholders for parameters",
          "parameters": ["array", "of", "parameter", "values"],
          "confidence": number between 0 and 1
        }
      `

      const response = await OpenAIService.generateResponse([
        { role: 'user', content: queryPrompt }
      ], {
        temperature: 0.1,
        max_tokens: 500
      }, apiKey)

      // Validate response before parsing
      if (!response || typeof response !== 'string' || response.trim() === '') {
        console.warn('Empty or invalid response from OpenAI service for SQL generation')
        return {
          query: '',
          parameters: [],
          confidence: 0.1
        }
      }

      // Try to extract JSON from response (in case there's extra text)
      let jsonString = response.trim()
      
      // Look for JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      // Validate JSON format
      if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        console.warn('Response does not contain valid JSON for SQL generation:', response)
        return {
          query: '',
          parameters: [],
          confidence: 0.1
        }
      }

      const result = JSON.parse(jsonString)
      
      // Validate required fields
      if (typeof result !== 'object' || result === null) {
        console.warn('Parsed SQL response is not an object:', result)
        return {
          query: '',
          parameters: [],
          confidence: 0.1
        }
      }

      return {
        query: String(result.query || ''),
        parameters: Array.isArray(result.parameters) ? result.parameters : [],
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5))
      }

    } catch (error) {
      console.error('SQL query generation error:', error)
      return {
        query: '',
        parameters: [],
        confidence: 0.1
      }
    }
  }

  /**
   * Generate natural language response from query results
   */
  private static async generateResponseFromQueryResult(
    originalMessage: string,
    queryResult: QueryResult,
    systemPrompt?: string,
    executedQuery?: string,
    temperature?: number,
    apiKey?: string
  ): Promise<string> {
    try {
      const responsePrompt = `
        Generate a natural, helpful response based on the database query results.
        
        System Context: ${systemPrompt || 'Helpful database assistant'}
        Original User Question: "${originalMessage}"
        Executed Query: ${executedQuery || 'N/A'}
        
        Query Results:
        - Rows returned: ${queryResult.rowCount}
        - Columns: ${queryResult.columns.join(', ')}
        - Execution time: ${queryResult.executionTime}ms
        - Data: ${JSON.stringify(queryResult.data.slice(0, 10), null, 2)}${queryResult.data.length > 10 ? '\n... (showing first 10 rows)' : ''}
        
        Guidelines:
        1. Provide a clear, conversational response
        2. Summarize the key findings
        3. If no results, explain why and suggest alternatives
        4. If many results, highlight the most important ones
        5. Use the data to directly answer the user's question
        6. Be helpful and informative
      `

      const response = await OpenAIService.generateResponse([
        { role: 'user', content: responsePrompt }
      ], {
        temperature: temperature || 0.7,
        max_tokens: 1000
      }, apiKey)

      return response

    } catch (error) {
      console.error('Response generation error:', error)
      return "I found some data, but I'm having trouble formatting the response. Here are the raw results: " + 
             JSON.stringify(queryResult.data.slice(0, 5), null, 2)
    }
  }

  /**
   * Generate simple response without database query
   */
  private static async generateSimpleResponse(
    message: string,
    systemPrompt?: string,
    temperature?: number,
    apiKey?: string
  ): Promise<string> {
    try {
      const prompt = `
        ${systemPrompt || 'You are a helpful assistant.'}
        
        User message: "${message}"
        
        Provide a helpful response. If the user is asking about data or database information, 
        let them know that you can help with database queries if they provide more specific details.
      `

      return await OpenAIService.generateResponse([
        { role: 'user', content: prompt }
      ], {
        temperature: temperature || 0.7,
        max_tokens: 500
      }, apiKey)

    } catch (error) {
      console.error('Simple response generation error:', error)
      return "I'm here to help! Could you please rephrase your question?"
    }
  }

  /**
   * Calculate confidence score based on query results and generation confidence
   */
  private static calculateConfidence(queryResult: QueryResult, generationConfidence: number): number {
    let confidence = generationConfidence

    // Adjust based on query results
    if (queryResult.rowCount === 0) {
      confidence *= 0.7 // Lower confidence for empty results
    } else if (queryResult.rowCount > 100) {
      confidence *= 0.9 // Slightly lower for very large result sets
    }

    // Adjust based on execution time
    if (queryResult.executionTime > 5000) {
      confidence *= 0.8 // Lower confidence for slow queries
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Log query execution for analytics
   */
  private static async logQuery(
    botId: number,
    query: string,
    result: QueryResult,
    userMessage: string
  ): Promise<void> {
    try {
      // This would typically log to a database or analytics service
      console.log(`[Query Log] Bot ${botId}:`, {
        query,
        userMessage,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Query logging error:', error)
    }
  }
}
