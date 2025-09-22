import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '../utils/api-response'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class CustomError extends Error implements AppError {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.name = 'CustomError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * Global error handler middleware
 */
export function withErrorHandler(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('Error in API handler:', error)
      return handleError(error)
    }
  }
}

/**
 * Handle different types of errors
 */
export function handleError(error: any): NextResponse {
  // Custom application errors
  if (error instanceof CustomError) {
    return ApiResponse.custom(
      error.statusCode,
      error.message,
      undefined,
      error.details ? { [error.code]: [error.details] } : undefined
    )
  }

  // Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        return ApiResponse.conflict('A record with this information already exists')
      case 'P2025':
        return ApiResponse.notFound('Record not found')
      case 'P2003':
        return ApiResponse.badRequest('Invalid reference to related record')
      case 'P2014':
        return ApiResponse.badRequest('Invalid ID provided')
      default:
        console.error('Unhandled Prisma error:', error)
        return ApiResponse.internalServerError('Database operation failed')
    }
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return ApiResponse.badRequest('Validation failed', error.details)
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized('Invalid token')
  }

  if (error.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized('Token expired')
  }

  // Default error
  return ApiResponse.internalServerError(
    process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred'
  )
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: NextRequest, context?: any) => {
    return Promise.resolve(fn(req, context)).catch((error) => {
      return handleError(error)
    })
  }
}

/**
 * Log error with context
 */
export function logError(error: any, context?: any) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    context,
    timestamp: new Date().toISOString()
  }

  console.error('Application Error:', JSON.stringify(errorInfo, null, 2))
}

/**
 * Create standardized error responses
 */
export const ErrorResponses = {
  validation: (message: string, details?: any) => 
    new ValidationError(message, details),
  
  notFound: (message?: string) => 
    new NotFoundError(message),
  
  unauthorized: (message?: string) => 
    new UnauthorizedError(message),
  
  forbidden: (message?: string) => 
    new ForbiddenError(message),
  
  conflict: (message: string) => 
    new ConflictError(message),
  
  internal: (message?: string) => 
    new CustomError(message || 'Internal server error', 500)
}
