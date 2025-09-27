import { NextRequest, NextResponse } from 'next/server'
import { BotService, type CreateBotRequest, type UpdateBotRequest, type BotFilters } from '../services/bot.service'
import { ApiResponse } from '../utils/api-response'
import { validateRequest } from '../middleware/validation'

export class BotController {
  /**
   * Create a new bot
   */
  static async createBot(request: NextRequest) {
    try {
      const body = await request.json()
      // Normalize legacy model names to OpenAI defaults before validation
      if (body && typeof body.model === 'string' && body.model.includes('deepseek')) {
        body.model = 'gpt-4o-mini'
      }
      if (!body.model) {
        body.model = 'gpt-4o-mini'
      }
      const { userId: userIdRaw, ...botData } = body
      
      // Convert userId to number if it's a string
      const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : userIdRaw
      
      // Check if userId conversion was successful
      if (isNaN(userId) || userId <= 0) {
        return ApiResponse.badRequest('Invalid user ID provided')
      }

      // Validate request
      const validation = validateRequest({
        userId: { required: true, type: 'number' },
        name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        system_prompt: { type: 'string', maxLength: 50000 },
        model: { type: 'string', enum: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-3.5-turbo'] },
        temperature: { type: 'number', min: 0, max: 2 },
        max_tokens: { type: 'number', min: 100, max: 4000 },
        status: { type: 'string', enum: ['draft', 'active', 'inactive'] },
        is_deployed: { type: 'boolean' },
        deployment_url: { type: 'string', maxLength: 500 }
      }, { ...body, userId })

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const bot = await BotService.createBot(userId, botData as CreateBotRequest)

      return ApiResponse.success('Bot created successfully', bot)
    } catch (error) {
      console.error('BotController.createBot error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to create bot'
      )
    }
  }

  /**
   * Get bot by ID
   */
  static async getBotById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      const bot = await BotService.getBotById(id)

      if (!bot) {
        return ApiResponse.notFound('Bot not found')
      }

      const response = ApiResponse.success('Bot retrieved successfully', bot)
      // Add CORS headers for widget integration
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    } catch (error) {
      console.error('BotController.getBotById error:', error)
      const errorResponse = ApiResponse.internalServerError('Failed to retrieve bot')
      // Add CORS headers to error response
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      return errorResponse
    }
  }

  /**
   * Get bots with filters
   */
  static async getBots(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      
      const filters: BotFilters = {
        userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
        status: searchParams.get('status') || undefined,
        isDeployed: searchParams.get('isDeployed') ? searchParams.get('isDeployed') === 'true' : undefined,
        search: searchParams.get('search') || undefined
      }

      // Validate filters
      if (filters.userId && isNaN(filters.userId)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      const bots = await BotService.getBots(filters)

      return ApiResponse.success('Bots retrieved successfully', bots)
    } catch (error) {
      console.error('BotController.getBots error:', error)
      return ApiResponse.internalServerError('Failed to retrieve bots')
    }
  }

  /**
   * Update bot
   */
  static async updateBot(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      const updates = await request.json()
      // Normalize legacy model names to OpenAI defaults before validation
      if (updates && typeof updates.model === 'string' && updates.model.includes('deepseek')) {
        updates.model = 'gpt-4o-mini'
      }

      // Validate updates
      const validation = validateRequest({
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        system_prompt: { type: 'string', maxLength: 50000 },
        model: { type: 'string', enum: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-3.5-turbo'] },
        temperature: { type: 'number', min: 0, max: 2 },
        max_tokens: { type: 'number', min: 100, max: 4000 },
        status: { type: 'string', enum: ['draft', 'active', 'inactive'] },
        is_deployed: { type: 'boolean' },
        deployment_url: { type: 'string', maxLength: 500 }
      }, updates)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const bot = await BotService.updateBot(id, updates as UpdateBotRequest)

      if (!bot) {
        return ApiResponse.notFound('Bot not found')
      }

      return ApiResponse.success('Bot updated successfully', bot)
    } catch (error) {
      console.error('BotController.updateBot error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to update bot'
      )
    }
  }

  /**
   * Delete bot
   */
  static async deleteBot(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      const success = await BotService.deleteBot(id)

      if (!success) {
        return ApiResponse.notFound('Bot not found')
      }

      return ApiResponse.success('Bot deleted successfully')
    } catch (error) {
      console.error('BotController.deleteBot error:', error)
      return ApiResponse.internalServerError('Failed to delete bot')
    }
  }

  /**
   * Get bot statistics
   */
  static async getBotStats(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      // Check if bot exists
      const bot = await BotService.getBotById(id)
      if (!bot) {
        return ApiResponse.notFound('Bot not found')
      }

      const stats = await BotService.getBotStats(id)

      return ApiResponse.success('Bot statistics retrieved successfully', stats)
    } catch (error) {
      console.error('BotController.getBotStats error:', error)
      return ApiResponse.internalServerError('Failed to retrieve bot statistics')
    }
  }
}
