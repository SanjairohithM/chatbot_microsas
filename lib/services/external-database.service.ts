import mysql from 'mysql2/promise'
import { Pool, PoolClient } from 'pg'
import { createConnection, Connection } from 'mariadb'

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mariadb'
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  connectionLimit?: number
}

export interface QueryResult {
  data: any[]
  columns: string[]
  rowCount: number
  executionTime: number
}

export class ExternalDatabaseService {
  private static connections: Map<string, any> = new Map()

  /**
   * Create database connection based on type
   */
  static async createConnection(config: DatabaseConfig): Promise<any> {
    const connectionKey = `${config.type}_${config.host}_${config.port}_${config.database}`
    
    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey)
    }

    let connection: any

    try {
      switch (config.type) {
        case 'mysql':
          connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : false
          })
          break

        case 'postgresql':
          connection = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: config.connectionLimit || 10
          })
          break

        case 'mariadb':
          connection = await createConnection({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false
          })
          break

        default:
          throw new Error(`Unsupported database type: ${config.type}`)
      }

      this.connections.set(connectionKey, connection)
      return connection

    } catch (error) {
      console.error(`Failed to create ${config.type} connection:`, error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute SQL query on external database
   */
  static async executeQuery(
    config: DatabaseConfig, 
    query: string, 
    params: any[] = []
  ): Promise<QueryResult> {
    const startTime = Date.now()
    let connection: any

    try {
      connection = await this.createConnection(config)
      let result: any

      switch (config.type) {
        case 'mysql':
          const [rows, fields] = await connection.execute(query, params)
          result = {
            data: Array.isArray(rows) ? rows : [],
            columns: fields ? fields.map((field: any) => field.name) : [],
            rowCount: Array.isArray(rows) ? rows.length : 0
          }
          break

        case 'postgresql':
          const pgResult = await connection.query(query, params)
          result = {
            data: pgResult.rows || [],
            columns: pgResult.fields ? pgResult.fields.map((field: any) => field.name) : [],
            rowCount: pgResult.rowCount || 0
          }
          break

        case 'mariadb':
          const mariadbResult = await connection.query(query, params)
          result = {
            data: Array.isArray(mariadbResult) ? mariadbResult : [],
            columns: mariadbResult.meta ? mariadbResult.meta.map((field: any) => field.name) : [],
            rowCount: mariadbResult.affectedRows || mariadbResult.length || 0
          }
          break

        default:
          throw new Error(`Unsupported database type: ${config.type}`)
      }

      const executionTime = Date.now() - startTime

      return {
        ...result,
        executionTime
      }

    } catch (error) {
      console.error('Query execution error:', error)
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      await this.executeQuery(config, 'SELECT 1 as test')
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  /**
   * Get database schema information
   */
  static async getSchemaInfo(config: DatabaseConfig): Promise<any> {
    try {
      let schemaQuery: string

      switch (config.type) {
        case 'mysql':
        case 'mariadb':
          schemaQuery = `
            SELECT 
              TABLE_NAME as table_name,
              TABLE_COMMENT as table_comment
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME
          `
          break

        case 'postgresql':
          schemaQuery = `
            SELECT 
              table_name,
              obj_description(c.oid) as table_comment
            FROM information_schema.tables t
            LEFT JOIN pg_class c ON c.relname = t.table_name
            WHERE table_schema = 'public'
            ORDER BY table_name
          `
          break

        default:
          throw new Error(`Unsupported database type: ${config.type}`)
      }

      const result = await this.executeQuery(
        config, 
        schemaQuery, 
        config.type === 'postgresql' ? [] : [config.database]
      )

      return result.data

    } catch (error) {
      console.error('Schema info retrieval failed:', error)
      throw new Error(`Schema info retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get table structure
   */
  static async getTableStructure(config: DatabaseConfig, tableName: string): Promise<any> {
    try {
      let structureQuery: string

      switch (config.type) {
        case 'mysql':
        case 'mariadb':
          structureQuery = `
            SELECT 
              COLUMN_NAME as column_name,
              DATA_TYPE as data_type,
              IS_NULLABLE as is_nullable,
              COLUMN_KEY as column_key,
              COLUMN_DEFAULT as column_default,
              EXTRA as extra,
              COLUMN_COMMENT as column_comment
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
          `
          break

        case 'postgresql':
          structureQuery = `
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length,
              numeric_precision,
              numeric_scale
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `
          break

        default:
          throw new Error(`Unsupported database type: ${config.type}`)
      }

      const result = await this.executeQuery(
        config, 
        structureQuery, 
        config.type === 'postgresql' ? [tableName] : [config.database, tableName]
      )

      return result.data

    } catch (error) {
      console.error('Table structure retrieval failed:', error)
      throw new Error(`Table structure retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Close all connections
   */
  static async closeAllConnections(): Promise<void> {
    for (const [key, connection] of this.connections) {
      try {
        if (connection && typeof connection.end === 'function') {
          await connection.end()
        } else if (connection && typeof connection.close === 'function') {
          await connection.close()
        }
      } catch (error) {
        console.error(`Error closing connection ${key}:`, error)
      }
    }
    this.connections.clear()
  }

  /**
   * Close specific connection
   */
  static async closeConnection(config: DatabaseConfig): Promise<void> {
    const connectionKey = `${config.type}_${config.host}_${config.port}_${config.database}`
    const connection = this.connections.get(connectionKey)

    if (connection) {
      try {
        if (typeof connection.end === 'function') {
          await connection.end()
        } else if (typeof connection.close === 'function') {
          await connection.close()
        }
        this.connections.delete(connectionKey)
      } catch (error) {
        console.error(`Error closing connection ${connectionKey}:`, error)
      }
    }
  }
}
