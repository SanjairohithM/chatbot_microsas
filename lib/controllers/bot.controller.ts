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
      const { userId, ...botData } = body

      // Validate request
      const validation = validateRequest({
        userId: { required: true, type: 'number' },
        name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        system_prompt: { type: 'string', maxLength: 50000 },
        model: { type: 'string', enum: ['deepseek-chat', 'deepseek-coder'] },
        temperature: { type: 'number', min: 0, max: 2 },
        max_tokens: { type: 'number', min: 100, max: 4000 },
        status: { type: 'string', enum: ['draft', 'active', 'inactive'] },
        is_deployed: { type: 'boolean' },
        deployment_url: { type: 'string', maxLength: 500 }
      }, body)

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

      return ApiResponse.success('Bot retrieved successfully', bot)
    } catch (error) {
      console.error('BotController.getBotById error:', error)
      return ApiResponse.internalServerError('Failed to retrieve bot')
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

      // Validate updates
      const validation = validateRequest({
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        system_prompt: { type: 'string', maxLength: 50000 },
        model: { type: 'string', enum: ['deepseek-chat', 'deepseek-coder'] },
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
