export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
  error?: Error
}

class Logger {
  private currentLevel: LogLevel

  constructor() {
    this.currentLevel = this.getLogLevelFromEnv()
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'ERROR': return LogLevel.ERROR
      case 'WARN': return LogLevel.WARN
      case 'INFO': return LogLevel.INFO
      case 'DEBUG': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = LogLevel[entry.level]
    const message = entry.message
    const context = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
    const error = entry.error ? ` | Error: ${entry.error.message}` : ''

    return `[${timestamp}] ${level}: ${message}${context}${error}`
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        if (error) console.error(error.stack)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
    }
  }

  error(message: string, context?: any, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context)
  }

  // API specific logging methods
  apiRequest(method: string, url: string, userId?: number) {
    this.info(`API Request: ${method} ${url}`, { userId })
  }

  apiResponse(method: string, url: string, statusCode: number, responseTime: number) {
    this.info(`API Response: ${method} ${url} - ${statusCode} (${responseTime}ms)`)
  }

  apiError(method: string, url: string, error: Error, userId?: number) {
    this.error(`API Error: ${method} ${url}`, { userId }, error)
  }

  // Database specific logging methods
  dbQuery(operation: string, table: string, duration?: number) {
    this.debug(`DB Query: ${operation} on ${table}`, { duration })
  }

  dbError(operation: string, table: string, error: Error) {
    this.error(`DB Error: ${operation} on ${table}`, undefined, error)
  }

  // Business logic logging methods
  userAction(action: string, userId: number, details?: any) {
    this.info(`User Action: ${action}`, { userId, ...details })
  }

  botAction(action: string, botId: number, userId: number, details?: any) {
    this.info(`Bot Action: ${action}`, { botId, userId, ...details })
  }

  conversationAction(action: string, conversationId: number, userId: number, details?: any) {
    this.info(`Conversation Action: ${action}`, { conversationId, userId, ...details })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logError = (message: string, context?: any, error?: Error) => 
  logger.error(message, context, error)

export const logWarn = (message: string, context?: any) => 
  logger.warn(message, context)

export const logInfo = (message: string, context?: any) => 
  logger.info(message, context)

export const logDebug = (message: string, context?: any) => 
  logger.debug(message, context)
