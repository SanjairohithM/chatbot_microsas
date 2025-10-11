import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Get all WordPress sites with their associated bots
    const sites = await db.wordPressSite.findMany({
      include: {
        bots: {
          select: {
            id: true,
            name: true,
            status: true,
            is_deployed: true,
            user_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Filter by user if userId is provided
    const filteredSites = userId 
      ? sites.filter(site => site.bots.some(bot => bot.user_id === userId))
      : sites

    return ApiResponse.success('WordPress sites retrieved successfully', filteredSites)
  } catch (error) {
    console.error('Error fetching WordPress sites:', error)
    return ApiResponse.internalServerError('Failed to retrieve WordPress sites')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('id')
    
    if (!siteId) {
      return ApiResponse.badRequest('Site ID is required')
    }

    // Delete the WordPress site (this will cascade delete associated bots)
    await db.wordPressSite.delete({
      where: { id: siteId }
    })

    return ApiResponse.success('WordPress site deleted successfully')
  } catch (error) {
    console.error('Error deleting WordPress site:', error)
    return ApiResponse.internalServerError('Failed to delete WordPress site')
  }
}
