import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAuthMiddleware } from '@/lib/middleware/database-auth'
import { ExternalDatabaseService, DatabaseConfig } from '@/lib/services/external-database.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    // Check if user has query permission
    if (!DatabaseAuthMiddleware.hasPermission(authResult, 'read') && 
        !DatabaseAuthMiddleware.hasPermission(authResult, 'all')) {
      return ApiResponse.forbidden('Insufficient permissions to execute queries')
    }

    const body = await request.json()
    const { 
      database_config, 
      query, 
      params = [],
      max_rows = 1000,
      timeout = 30000 
    } = body

    // Validate required fields
    if (!database_config || !query) {
      return ApiResponse.badRequest('Database configuration and query are required')
    }

    // Validate database configuration
    const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password']
    const missingFields = requiredFields.filter(field => !database_config[field])
    
    if (missingFields.length > 0) {
      return ApiResponse.badRequest(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Validate database type
    const supportedTypes = ['mysql', 'postgresql', 'mariadb']
    if (!supportedTypes.includes(database_config.type)) {
      return ApiResponse.badRequest(`Unsupported database type. Supported types: ${supportedTypes.join(', ')}`)
    }

    // Security: Basic SQL injection prevention
    const dangerousKeywords = [
      'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
      'EXEC', 'EXECUTE', 'UNION', '--', '/*', '*/', 'xp_', 'sp_'
    ]
    
    const upperQuery = query.toUpperCase()
    const hasDangerousKeyword = dangerousKeywords.some(keyword => upperQuery.includes(keyword))
    
    // Allow only SELECT queries for read-only access
    if (!DatabaseAuthMiddleware.hasPermission(authResult, 'all') && 
        !upperQuery.trim().startsWith('SELECT')) {
      return ApiResponse.forbidden('Only SELECT queries are allowed with read permissions')
    }

    if (hasDangerousKeyword && !DatabaseAuthMiddleware.hasPermission(authResult, 'all')) {
      return ApiResponse.forbidden('Query contains potentially dangerous keywords')
    }

    // Limit result size
    if (max_rows > 10000) {
      return ApiResponse.badRequest('Maximum rows limit exceeded (max: 10000)')
    }

    // Add LIMIT clause if not present and query is SELECT
    let finalQuery = query
    if (upperQuery.trim().startsWith('SELECT') && !upperQuery.includes('LIMIT')) {
      finalQuery = `${query} LIMIT ${max_rows}`
    }

    // Create database configuration
    const dbConfig: DatabaseConfig = {
      type: database_config.type,
      host: database_config.host,
      port: parseInt(database_config.port),
      database: database_config.database,
      username: database_config.username,
      password: database_config.password,
      ssl: database_config.ssl || false,
      connectionLimit: database_config.connectionLimit || 10
    }

    // Execute query with timeout
    const queryPromise = ExternalDatabaseService.executeQuery(dbConfig, finalQuery, params)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )

    const result = await Promise.race([queryPromise, timeoutPromise]) as any

    // Log the query execution
    logger.apiRequest('POST', '/api/database/query', parseInt(authResult.userId!))

    return ApiResponse.success('Query executed successfully', {
      data: result.data,
      columns: result.columns,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      query: finalQuery
    })

  } catch (error) {
    logger.apiError('POST', '/api/database/query', error as Error)
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return ApiResponse.requestTimeout('Query execution timeout')
      }
      if (error.message.includes('connection')) {
        return ApiResponse.badRequest('Database connection failed')
      }
      if (error.message.includes('syntax')) {
        return ApiResponse.badRequest('SQL syntax error')
      }
    }

    return ApiResponse.internalServerError('Query execution failed')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await DatabaseAuthMiddleware.validateAuth(request)
    
    if (!authResult.isValid) {
      return ApiResponse.unauthorized(authResult.error || 'Authentication failed')
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'

    if (action === 'test') {
      // Test database connection
      const database_config = {
        type: searchParams.get('type'),
        host: searchParams.get('host'),
        port: searchParams.get('port'),
        database: searchParams.get('database'),
        username: searchParams.get('username'),
        password: searchParams.get('password'),
        ssl: searchParams.get('ssl') === 'true'
      }

      const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password']
      const missingFields = requiredFields.filter(field => !database_config[field as keyof typeof database_config])
      
      if (missingFields.length > 0) {
        return ApiResponse.badRequest(`Missing required fields: ${missingFields.join(', ')}`)
      }

      const dbConfig: DatabaseConfig = {
        type: database_config.type as any,
        host: database_config.host!,
        port: parseInt(database_config.port!),
        database: database_config.database!,
        username: database_config.username!,
        password: database_config.password!,
        ssl: database_config.ssl
      }

      const isConnected = await ExternalDatabaseService.testConnection(dbConfig)
      
      return ApiResponse.success('Connection test completed', {
        connected: isConnected
      })

    } else if (action === 'schema') {
      // Get database schema
      const database_config = {
        type: searchParams.get('type'),
        host: searchParams.get('host'),
        port: searchParams.get('port'),
        database: searchParams.get('database'),
        username: searchParams.get('username'),
        password: searchParams.get('password'),
        ssl: searchParams.get('ssl') === 'true'
      }

      const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password']
      const missingFields = requiredFields.filter(field => !database_config[field as keyof typeof database_config])
      
      if (missingFields.length > 0) {
        return ApiResponse.badRequest(`Missing required fields: ${missingFields.join(', ')}`)
      }

      const dbConfig: DatabaseConfig = {
        type: database_config.type as any,
        host: database_config.host!,
        port: parseInt(database_config.port!),
        database: database_config.database!,
        username: database_config.username!,
        password: database_config.password!,
        ssl: database_config.ssl
      }

      const schema = await ExternalDatabaseService.getSchemaInfo(dbConfig)
      
      return ApiResponse.success('Schema information retrieved', {
        schema
      })

    } else if (action === 'table') {
      // Get table structure
      const tableName = searchParams.get('table')
      if (!tableName) {
        return ApiResponse.badRequest('Table name is required')
      }

      const database_config = {
        type: searchParams.get('type'),
        host: searchParams.get('host'),
        port: searchParams.get('port'),
        database: searchParams.get('database'),
        username: searchParams.get('username'),
        password: searchParams.get('password'),
        ssl: searchParams.get('ssl') === 'true'
      }

      const requiredFields = ['type', 'host', 'port', 'database', 'username', 'password']
      const missingFields = requiredFields.filter(field => !database_config[field as keyof typeof database_config])
      
      if (missingFields.length > 0) {
        return ApiResponse.badRequest(`Missing required fields: ${missingFields.join(', ')}`)
      }

      const dbConfig: DatabaseConfig = {
        type: database_config.type as any,
        host: database_config.host!,
        port: parseInt(database_config.port!),
        database: database_config.database!,
        username: database_config.username!,
        password: database_config.password!,
        ssl: database_config.ssl
      }

      const structure = await ExternalDatabaseService.getTableStructure(dbConfig, tableName)
      
      return ApiResponse.success('Table structure retrieved', {
        table: tableName,
        structure
      })

    } else {
      // Return API info
      return ApiResponse.success('Database Query API information', {
        api: 'Database Query API',
        version: '1.0.0',
        endpoints: {
          'POST /api/database/query': 'Execute SQL queries',
          'GET /api/database/query?action=test': 'Test database connection',
          'GET /api/database/query?action=schema': 'Get database schema',
          'GET /api/database/query?action=table&table=TABLE_NAME': 'Get table structure'
        },
        supported_databases: ['mysql', 'postgresql', 'mariadb'],
        authentication: 'Bearer token:secret or JSON body with access_token and secret_key'
      })
    }

  } catch (error) {
    logger.apiError('GET', '/api/database/query', error as Error)
    return ApiResponse.internalServerError('Request failed')
  }
}
