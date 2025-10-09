import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { BotService } from '@/lib/services/bot.service'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return ApiResponse.unauthorized('Authentication required')
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        openai_api_key: true 
      }
    })
    
    if (!user) {
      return ApiResponse.notFound('User not found')
    }

    return ApiResponse.success('OpenAI API key retrieved successfully', {
      openai_api_key: user.openai_api_key || ''
    })

  } catch (error) {
    logger.apiError('GET', '/api/user/openai-key', error as Error)
    return ApiResponse.internalServerError('Failed to fetch OpenAI API key')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { openai_api_key } = await request.json()

    if (!openai_api_key || !openai_api_key.trim()) {
      return ApiResponse.badRequest('OpenAI API key is required')
    }

    // Validate OpenAI API key format
    if (!openai_api_key.startsWith('sk-')) {
      return ApiResponse.badRequest('Invalid OpenAI API key format. Key should start with "sk-"')
    }

    // Get user from session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return ApiResponse.unauthorized('Authentication required')
    }
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    })
    
    if (!user) {
      return ApiResponse.notFound('User not found')
    }

    // Update the OpenAI API key in user record
    await db.user.update({
      where: {
        id: user.id
      },
      data: {
        openai_api_key: openai_api_key.trim()
      }
    })

    // Check if user already has a chatbot
    const existingBot = await db.bot.findFirst({
      where: { user_id: user.id }
    })

    // If user doesn't have a chatbot, create a default one
    if (!existingBot) {
      try {
        const defaultBotData = {
          name: `${user.name || 'My'} Assistant`,
          description: 'Your personal AI assistant powered by OpenAI',
          system_prompt: 'You are a helpful AI assistant. Provide accurate, helpful, and friendly responses to user queries.',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000,
          status: 'active' as const,
          is_deployed: true,
          interaction_mode: 'chat' as const
        }

        await BotService.createBot(user.id, defaultBotData)
        logger.apiRequest('POST', '/api/user/openai-key')
      } catch (botError) {
        // Log the error but don't fail the API key save
        logger.apiError('POST', '/api/user/openai-key', botError as Error)
      }
    }

    logger.apiRequest('POST', '/api/user/openai-key')

    return ApiResponse.success('OpenAI API key saved successfully')

  } catch (error) {
    logger.apiError('POST', '/api/user/openai-key', error as Error)
    return ApiResponse.internalServerError('Failed to save OpenAI API key')
  }
}