import { NextResponse } from 'next/server'

export interface ApiResponseData<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
  timestamp: string
}

export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(message: string, data?: T): NextResponse<ApiResponseData<T>> {
    return NextResponse.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Bad request response
   */
  static badRequest(message: string, errors?: Record<string, string[]>): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }

  /**
   * Unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 401 })
  }

  /**
   * Forbidden response
   */
  static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 403 })
  }

  /**
   * Not found response
   */
  static notFound(message: string = 'Resource not found'): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 404 })
  }

  /**
   * Conflict response
   */
  static conflict(message: string): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 409 })
  }

  /**
   * Unprocessable entity response
   */
  static unprocessableEntity(message: string, errors?: Record<string, string[]>): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }, { status: 422 })
  }

  /**
   * Internal server error response
   */
  static internalServerError(message: string = 'Internal server error'): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }

  /**
   * Service unavailable response
   */
  static serviceUnavailable(message: string = 'Service unavailable'): NextResponse<ApiResponseData> {
    return NextResponse.json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }

  /**
   * Custom response
   */
  static custom<T>(
    status: number, 
    message: string, 
    data?: T, 
    errors?: Record<string, string[]>
  ): NextResponse<ApiResponseData<T>> {
    return NextResponse.json({
      success: status >= 200 && status < 300,
      message,
      data,
      errors,
      timestamp: new Date().toISOString()
    }, { status })
  }
}
