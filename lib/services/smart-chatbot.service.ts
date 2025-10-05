import { BotService } from './bot.service'
import { ChatbotDatabaseService } from './chatbot-database.service'

export interface SmartChatRequest {
  message: string
  botId: number
  conversationId?: number
  databaseConfig?: {
    type: 'mysql' | 'postgresql' | 'mariadb'
    host: string
    port: number
    database: string
    username: string
    password: string
    ssl?: boolean
  }
  systemPrompt?: string
  maxRows?: number
  temperature?: number
}

export interface SmartChatResponse {
  message: string
  isDatabaseQuery: boolean
  queryType?: string
  sqlQuery?: string
  executionTime?: number
  rowsReturned?: number
  dataSummary?: any
  suggestions?: string[]
}

export class SmartChatbotService {
  private databaseService: ChatbotDatabaseService

  constructor() {
    this.databaseService = new ChatbotDatabaseService()
  }

  // Database query patterns for automatic detection
  private readonly DATABASE_PATTERNS = {
    // Count queries
    count: [
      /how many/i,
      /count/i,
      /total number/i,
      /number of/i,
      /how much/i,
      /total count/i,
      /how many records/i,
      /how many entries/i
    ],
    
    // Select queries
    select: [
      /show me/i,
      /list/i,
      /get/i,
      /find/i,
      /display/i,
      /what are/i,
      /which/i,
      /give me/i,
      /retrieve/i,
      /fetch/i
    ],
    
    // Aggregation queries
    aggregation: [
      /average/i,
      /sum/i,
      /total/i,
      /maximum/i,
      /minimum/i,
      /max/i,
      /min/i,
      /avg/i,
      /mean/i,
      /median/i,
      /statistics/i,
      /stats/i
    ],
    
    // Time-based queries
    timeBased: [
      /today/i,
      /yesterday/i,
      /this week/i,
      /last week/i,
      /this month/i,
      /last month/i,
      /this year/i,
      /last year/i,
      /recent/i,
      /latest/i,
      /newest/i,
      /oldest/i,
      /since/i,
      /from.*to/i,
      /between.*and/i
    ],
    
    // Comparison queries
    comparison: [
      /greater than/i,
      /less than/i,
      /more than/i,
      /fewer than/i,
      /between/i,
      /above/i,
      /below/i,
      /higher than/i,
      /lower than/i,
      /compare/i,
      /versus/i,
      /vs/i
    ],
    
    // Grouping queries
    grouping: [
      /group by/i,
      /by category/i,
      /by type/i,
      /by status/i,
      /by date/i,
      /per/i,
      /each/i,
      /breakdown/i,
      /categorize/i
    ],

    // Database-specific keywords
    databaseKeywords: [
      /database/i,
      /table/i,
      /record/i,
      /data/i,
      /query/i,
      /sql/i,
      /select/i,
      /insert/i,
      /update/i,
      /delete/i,
      /users/i,
      /orders/i,
      /products/i,
      /sales/i,
      /revenue/i,
      /profit/i,
      /customers/i,
      /transactions/i,
      /inventory/i,
      /analytics/i
    ]
  }

  // Detect if message is database-related
  private isDatabaseQuery(message: string): boolean {
    const messageLower = message.toLowerCase()
    
    // Check for database keywords
    const hasDbKeywords = this.DATABASE_PATTERNS.databaseKeywords.some(pattern => 
      pattern.test(messageLower)
    )
    
    // Check for query patterns
    const hasQueryPatterns = Object.values(this.DATABASE_PATTERNS)
      .filter(patterns => patterns !== this.DATABASE_PATTERNS.databaseKeywords)
      .some(patterns => patterns.some(pattern => pattern.test(messageLower)))
    
    return hasDbKeywords || hasQueryPatterns
  }

  // Detect query type
  private detectQueryType(message: string): string {
    const messageLower = message.toLowerCase()
    
    if (this.DATABASE_PATTERNS.count.some(pattern => pattern.test(messageLower))) {
      return 'count'
    }
    
    if (this.DATABASE_PATTERNS.aggregation.some(pattern => pattern.test(messageLower))) {
      return 'aggregation'
    }
    
    if (this.DATABASE_PATTERNS.timeBased.some(pattern => pattern.test(messageLower))) {
      return 'time_based'
    }
    
    if (this.DATABASE_PATTERNS.comparison.some(pattern => pattern.test(messageLower))) {
      return 'comparison'
    }
    
    if (this.DATABASE_PATTERNS.grouping.some(pattern => pattern.test(messageLower))) {
      return 'grouping'
    }
    
    if (this.DATABASE_PATTERNS.select.some(pattern => pattern.test(messageLower))) {
      return 'select'
    }
    
    return 'general'
  }

  // Generate enhanced system prompt based on query type
  private generateEnhancedSystemPrompt(queryType: string, originalPrompt?: string): string {
    const basePrompt = originalPrompt || "You are a helpful database assistant that can answer questions about data."
    
    const queryTypePrompts = {
      count: "Focus on providing accurate counts and numbers. Be specific about what is being counted and provide context about the data.",
      aggregation: "Provide statistical analysis including averages, sums, totals, maximums, and minimums. Include context about what the numbers mean and their significance.",
      time_based: "Pay attention to date ranges and time periods. Provide temporal context in your responses and highlight trends over time.",
      comparison: "Highlight differences and comparisons clearly. Use comparative language to explain relationships between different data points.",
      grouping: "Organize information by categories or groups. Show patterns and trends within each group and provide insights about the distribution.",
      select: "Present data in a clear, organized format. Use tables or lists when appropriate and highlight key information.",
      general: "Provide comprehensive information about the data. Be thorough but concise, and offer insights about what the data means."
    }
    
    const queryTypePrompt = queryTypePrompts[queryType as keyof typeof queryTypePrompts] || queryTypePrompts.general
    
    return `${basePrompt}\n\nQuery Type: ${queryType}\nInstructions: ${queryTypePrompt}\n\nWhen responding to database queries, always provide context about what the data means and offer insights or recommendations when appropriate.`
  }

  // Generate suggestions for database queries
  private generateQuerySuggestions(queryType: string): string[] {
    const suggestions = {
      count: [
        "How many users are active?",
        "What's the total number of orders?",
        "How many products do we have?",
        "Count all transactions this month"
      ],
      aggregation: [
        "What's the average order value?",
        "Show me the total revenue",
        "What's the maximum order amount?",
        "Calculate the average user age"
      ],
      time_based: [
        "Show me today's orders",
        "What are the recent sales?",
        "List this month's new users",
        "What happened yesterday?"
      ],
      comparison: [
        "Compare this month vs last month",
        "Which products sell better?",
        "Show me high-value customers",
        "What's the difference between regions?"
      ],
      grouping: [
        "Group sales by category",
        "Show users by location",
        "Break down orders by status",
        "Categorize products by type"
      ],
      select: [
        "Show me all users",
        "List recent orders",
        "Display product catalog",
        "Get customer information"
      ],
      general: [
        "Tell me about our data",
        "What insights can you provide?",
        "Show me some statistics",
        "What's interesting in our database?"
      ]
    }
    
    return suggestions[queryType as keyof typeof suggestions] || suggestions.general
  }

  // Main method to process smart chat
  async processSmartChat(request: SmartChatRequest): Promise<SmartChatResponse> {
    try {
      // Get bot information
      const bot = await BotService.getBotById(request.botId)
      if (!bot) {
        throw new Error('Bot not found')
      }

      // Check if message is database-related
      const isDbQuery = this.isDatabaseQuery(request.message)
      
      if (!isDbQuery) {
        // If not database-related, return a regular response with suggestions
        return {
          message: "I can help you with database queries! Try asking me about data, records, or specific information you'd like to know. Here are some examples:",
          isDatabaseQuery: false,
          suggestions: [
            "How many users do we have?",
            "What are the top selling products?",
            "Show me recent orders",
            "What's the average order value?",
            "List all customers from this month"
          ]
        }
      }

      // Detect query type
      const queryType = this.detectQueryType(request.message)
      
      // Generate enhanced system prompt
      const enhancedSystemPrompt = this.generateEnhancedSystemPrompt(queryType, request.systemPrompt)

      // If database config is provided, use it directly
      if (request.databaseConfig) {
        const response = await ChatbotDatabaseService.generateResponse(
          {
            botId: request.botId,
            databaseConfig: request.databaseConfig,
            systemPrompt: enhancedSystemPrompt,
            enableQueryLogging: true
          },
          {
            userMessage: request.message,
            maxRows: request.maxRows,
            temperature: request.temperature
          }
        )

        return {
          message: response.response,
          isDatabaseQuery: true,
          queryType: queryType,
          sqlQuery: response.query,
          executionTime: response.executionTime,
          rowsReturned: response.queryResult?.rowCount || 0,
          dataSummary: response.queryResult?.data || null,
          suggestions: this.generateQuerySuggestions(queryType)
        }
      }

      // If no database config, return helpful response
      return {
        message: `I detected this as a ${queryType} database query, but no database configuration was provided. To use database features, please provide database configuration.`,
        isDatabaseQuery: true,
        queryType: queryType,
        suggestions: this.generateQuerySuggestions(queryType)
      }

    } catch (error) {
      console.error('SmartChatbotService.processSmartChat error:', error)
      throw error
    }
  }

  // Get query suggestions based on message
  async getQuerySuggestions(message: string): Promise<string[]> {
    const queryType = this.detectQueryType(message)
    return this.generateQuerySuggestions(queryType)
  }

  // Analyze message for database intent
  async analyzeMessage(message: string): Promise<{
    isDatabaseQuery: boolean
    queryType: string
    confidence: number
    suggestions: string[]
  }> {
    const isDbQuery = this.isDatabaseQuery(message)
    const queryType = this.detectQueryType(message)
    const suggestions = this.generateQuerySuggestions(queryType)
    
    // Calculate confidence based on pattern matches
    let confidence = 0
    if (isDbQuery) {
      const messageLower = message.toLowerCase()
      const patternMatches = Object.values(this.DATABASE_PATTERNS)
        .flat()
        .filter(pattern => pattern.test(messageLower))
        .length
      
      confidence = Math.min(patternMatches / 3, 1) // Normalize to 0-1
    }
    
    return {
      isDatabaseQuery: isDbQuery,
      queryType: queryType,
      confidence: confidence,
      suggestions: suggestions
    }
  }
}
