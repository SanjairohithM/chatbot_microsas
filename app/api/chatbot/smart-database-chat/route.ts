import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { BotService } from '@/lib/services/bot.service'
import { ChatbotDatabaseService } from '@/lib/services/chatbot-database.service'
import { z } from 'zod'

// Validation schema
const SmartDatabaseChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  bot_id: z.number().int().positive('Valid bot ID is required'),
  conversation_id: z.number().int().positive().optional(),
  database_config: z.object({
    type: z.enum(['mysql', 'postgresql', 'mariadb']),
    host: z.string().min(1, 'Database host is required'),
    port: z.number().int().positive().max(65535),
    database: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Database username is required'),
    password: z.string().min(1, 'Database password is required'),
    ssl: z.boolean().optional().default(false)
  }).optional(),
  system_prompt: z.string().optional(),
  max_rows: z.number().int().positive().max(1000).optional().default(100),
  temperature: z.number().min(0).max(2).optional().default(0.7)
})

// Database query patterns
const DATABASE_PATTERNS = {
  // Count queries
  count: [
    /how many/i,
    /count/i,
    /total number/i,
    /number of/i,
    /how much/i,
    /total count/i
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
    /give me/i
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
    /mean/i
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
    /oldest/i
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
    /lower than/i
  ],
  
  // Grouping queries
  grouping: [
    /group by/i,
    /by category/i,
    /by type/i,
    /by status/i,
    /by date/i,
    /per/i,
    /each/i
  ]
}

// Detect if message is database-related
function isDatabaseQuery(message: string): boolean {
  const dbKeywords = [
    'database', 'table', 'record', 'data', 'query', 'sql',
    'select', 'insert', 'update', 'delete', 'count', 'sum',
    'average', 'total', 'users', 'orders', 'products', 'sales',
    'revenue', 'profit', 'customers', 'transactions'
  ]
  
  const messageLower = message.toLowerCase()
  return dbKeywords.some(keyword => messageLower.includes(keyword)) ||
         Object.values(DATABASE_PATTERNS).some(patterns => 
           patterns.some(pattern => pattern.test(message))
         )
}

// Detect query type
function detectQueryType(message: string): string {
  const messageLower = message.toLowerCase()
  
  if (DATABASE_PATTERNS.count.some(pattern => pattern.test(messageLower))) {
    return 'count'
  }
  
  if (DATABASE_PATTERNS.aggregation.some(pattern => pattern.test(messageLower))) {
    return 'aggregation'
  }
  
  if (DATABASE_PATTERNS.timeBased.some(pattern => pattern.test(messageLower))) {
    return 'time_based'
  }
  
  if (DATABASE_PATTERNS.comparison.some(pattern => pattern.test(messageLower))) {
    return 'comparison'
  }
  
  if (DATABASE_PATTERNS.grouping.some(pattern => pattern.test(messageLower))) {
    return 'grouping'
  }
  
  if (DATABASE_PATTERNS.select.some(pattern => pattern.test(messageLower))) {
    return 'select'
  }
  
  return 'general'
}

// Generate enhanced system prompt based on query type
function generateEnhancedSystemPrompt(queryType: string, originalPrompt?: string): string {
  const basePrompt = originalPrompt || "You are a helpful database assistant that can answer questions about data."
  
  const queryTypePrompts = {
    count: "Focus on providing accurate counts and numbers. Be specific about what is being counted.",
    aggregation: "Provide statistical analysis including averages, sums, totals, maximums, and minimums. Include context about what the numbers mean.",
    time_based: "Pay attention to date ranges and time periods. Provide temporal context in your responses.",
    comparison: "Highlight differences and comparisons clearly. Use comparative language to explain relationships.",
    grouping: "Organize information by categories or groups. Show patterns and trends within each group.",
    select: "Present data in a clear, organized format. Use tables or lists when appropriate.",
    general: "Provide comprehensive information about the data. Be thorough but concise."
  }
  
  const queryTypePrompt = queryTypePrompts[queryType as keyof typeof queryTypePrompts] || queryTypePrompts.general
  
  return `${basePrompt}\n\nQuery Type: ${queryType}\nInstructions: ${queryTypePrompt}`
}

// POST /api/chatbot/smart-database-chat - Smart database chat with automatic detection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SmartDatabaseChatSchema.parse(body)

    logger.apiRequest('POST', '/api/chatbot/smart-database-chat', validatedData.bot_id)

    // Get bot information
    const bot = await BotService.getBotById(validatedData.bot_id)
    if (!bot) {
      return ApiResponse.notFound('Bot not found')
    }

    // Check if message is database-related
    const isDbQuery = isDatabaseQuery(validatedData.message)
    
    if (!isDbQuery) {
      // If not database-related, return a regular chat response
      return ApiResponse.success('Message processed as regular chat', {
        message: "I can help you with database queries! Try asking me about data, records, or specific information you'd like to know.",
        is_database_query: false,
        suggested_queries: [
          "How many users do we have?",
          "What are the top selling products?",
          "Show me recent orders",
          "What's the average order value?",
          "List all customers from this month"
        ]
      })
    }

    // Detect query type
    const queryType = detectQueryType(validatedData.message)
    
    // Generate enhanced system prompt
    const enhancedSystemPrompt = generateEnhancedSystemPrompt(queryType, validatedData.system_prompt)

    // If database config is provided, use it directly
    if (validatedData.database_config) {
      const response = await ChatbotDatabaseService.generateResponse(
        {
          botId: validatedData.bot_id,
          databaseConfig: validatedData.database_config,
          systemPrompt: enhancedSystemPrompt,
          enableQueryLogging: true
        },
        {
          userMessage: validatedData.message,
          maxRows: validatedData.max_rows,
          temperature: validatedData.temperature
        }
      )

      return ApiResponse.success('Database query processed successfully', {
        message: response.response,
        is_database_query: true,
        query_type: queryType,
        sql_query: response.query,
        execution_time: response.executionTime,
        rows_returned: response.queryResult?.rowCount || 0,
        data_summary: response.queryResult?.data || null
      })
    }

    // If no database config, try to get from bot's stored credentials
    const botTokens = await BotService.getBotTokens(validatedData.bot_id, { 
      page: 1, 
      limit: 1, 
      status: 'active' 
    })

    if (botTokens.data.length === 0) {
      return ApiResponse.badRequest('No database configuration found. Please provide database_config or create bot tokens.')
    }

    // For now, return a response indicating database config is needed
    return ApiResponse.badRequest('Database configuration required')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Validation error')
    }
    
    logger.apiError('POST', '/api/chatbot/smart-database-chat', error as Error)
    return ApiResponse.internalServerError('Failed to process smart database chat')
  }
}

// GET /api/chatbot/smart-database-chat - API documentation
export async function GET() {
  return ApiResponse.success('Smart Database Chat API Documentation', {
    description: 'Automatically detects database queries and routes them to appropriate database APIs',
    features: [
      'Automatic database query detection',
      'Query type classification',
      'Enhanced system prompts based on query type',
      'Intelligent response generation',
      'Database configuration management'
    ],
    query_types: {
      count: 'Queries asking for counts or numbers',
      aggregation: 'Statistical queries (sum, average, max, min)',
      time_based: 'Queries with time references',
      comparison: 'Queries comparing values',
      grouping: 'Queries grouping data by categories',
      select: 'General data retrieval queries'
    },
    detection_patterns: DATABASE_PATTERNS,
    endpoints: {
      smart_chat: 'POST /api/chatbot/smart-database-chat',
      regular_chat: 'POST /api/chatbot/database-chat',
      token_management: 'POST /api/bots/{botId}/tokens',
      database_credentials: 'POST /api/bots/{botId}/database-credentials'
    },
    example_usage: {
      message: "How many active users do we have?",
      bot_id: 1,
      database_config: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        database: "myapp",
        username: "user",
        password: "pass"
      }
    }
  })
}
