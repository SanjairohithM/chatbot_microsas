import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAuthMiddleware } from '@/lib/middleware/database-auth'
import { ChatbotDatabaseService, ChatbotDatabaseConfig } from '@/lib/services/chatbot-database.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    // Check if user has chat permission
    if (!DatabaseAuthMiddleware.hasPermission(authResult, 'read') && 
        !DatabaseAuthMiddleware.hasPermission(authResult, 'all')) {
      return ApiResponse.forbidden('Insufficient permissions to use chatbot')
    }

    const body = await request.json()
    const { 
      message,
      database_config,
      system_prompt,
      context,
      max_rows = 100,
      temperature = 0.7,
      enable_query_logging = true
    } = body

    // Validate required fields
    if (!message || !database_config) {
      return ApiResponse.badRequest('Message and database configuration are required')
    }

    // Validate database configuration
    const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password']
    const missingFields = requiredFields.filter(field => !database_config[field])
    
    if (missingFields.length > 0) {
      return ApiResponse.badRequest(`Missing required database fields: ${missingFields.join(', ')}`)
    }

    // Validate database type
    const supportedTypes = ['mysql', 'postgresql', 'mariadb']
    if (!supportedTypes.includes(database_config.type)) {
      return ApiResponse.badRequest(`Unsupported database type. Supported types: ${supportedTypes.join(', ')}`)
    }

    // Create chatbot configuration
    const chatbotConfig: ChatbotDatabaseConfig = {
      botId: authResult.botId!,
      databaseConfig: {
        type: database_config.type,
        host: database_config.host,
        port: parseInt(database_config.port),
        database: database_config.database,
        username: database_config.username,
        password: database_config.password,
        ssl: database_config.ssl || false,
        connectionLimit: database_config.connectionLimit || 10
      },
      systemPrompt: system_prompt,
      maxContextLength: 4000,
      enableQueryLogging: enable_query_logging
    }

    // Generate chatbot response
    const response = await ChatbotDatabaseService.generateResponse(
      chatbotConfig,
      {
        userMessage: message,
        context,
        maxRows: max_rows,
        temperature
      }
    )

    // Log the interaction
    logger.apiRequest('POST', '/api/chatbot/database-chat', parseInt(authResult.userId!))

    return ApiResponse.success('Chatbot response generated', {
      response: response.response,
      query: response.query,
      queryResult: response.queryResult ? {
        data: response.queryResult.data,
        columns: response.queryResult.columns,
        rowCount: response.queryResult.rowCount,
        executionTime: response.queryResult.executionTime
      } : null,
      confidence: response.confidence,
      executionTime: response.executionTime
    })

  } catch (error) {
    logger.apiError('POST', '/api/chatbot/database-chat', error as Error)
    
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return ApiResponse.badRequest('Database connection failed')
      }
      if (error.message.includes('timeout')) {
        return ApiResponse.requestTimeout('Request timeout')
      }
    }

    return ApiResponse.internalServerError('Chatbot response generation failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    return ApiResponse.success('Database Chatbot API information', {
      api: 'Database Chatbot API',
      version: '1.0.0',
      description: 'AI-powered chatbot that can query external databases',
      features: [
        'Natural language to SQL conversion',
        'Database query execution',
        'Intelligent response generation',
        'Support for MySQL, PostgreSQL, and MariaDB',
        'Secure authentication with access tokens'
      ],
      usage: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer access_token:secret_key',
          'Content-Type': 'application/json'
        },
        body: {
          message: 'string (required) - User message/question',
          database_config: {
            type: 'mysql|postgresql|mariadb',
            host: 'string',
            port: 'number',
            database: 'string',
            username: 'string',
            password: 'string',
            ssl: 'boolean (optional)',
            connectionLimit: 'number (optional)'
          },
          system_prompt: 'string (optional) - Custom system prompt',
          context: 'string (optional) - Additional context',
          max_rows: 'number (optional, default: 100)',
          temperature: 'number (optional, default: 0.7)',
          enable_query_logging: 'boolean (optional, default: true)'
        }
      },
      examples: {
        basic_query: {
          message: "How many users do we have?",
          database_config: {
            type: "mysql",
            host: "localhost",
            port: 3306,
            database: "myapp",
            username: "user",
            password: "password"
          }
        },
        specific_query: {
          message: "Show me all orders from last month with total amount greater than $100",
          database_config: {
            type: "postgresql",
            host: "db.example.com",
            port: 5432,
            database: "ecommerce",
            username: "readonly",
            password: "secret"
          },
          max_rows: 50
        }
      }
    })

  } catch (error) {
    logger.apiError('GET', '/api/chatbot/database-chat', error as Error)
    return ApiResponse.internalServerError('Request failed')
  }
}
