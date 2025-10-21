import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connection
    const isConnected = await checkDatabaseConnection()
    const responseTime = Date.now() - startTime
    
    if (!isConnected) {
      return ApiResponse.serviceUnavailable('Database connection failed')
    }
    
    return ApiResponse.success('Database connection healthy')
    
  } catch (error) {
    console.error('Database health check error:', error)
    
    return ApiResponse.internalServerError('Database health check failed')
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
