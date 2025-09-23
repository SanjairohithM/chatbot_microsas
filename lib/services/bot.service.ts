import { db } from '../db'
import type { Bot } from '../types'

export interface CreateBotRequest {
  name: string
  description?: string
  system_prompt?: string
  model?: string
  temperature?: number
  max_tokens?: number
  status?: 'draft' | 'active' | 'inactive'
  is_deployed?: boolean
  deployment_url?: string
}

export interface UpdateBotRequest {
  name?: string
  description?: string
  system_prompt?: string
  model?: string
  temperature?: number
  max_tokens?: number
  status?: 'draft' | 'active' | 'inactive'
  is_deployed?: boolean
  deployment_url?: string
}

export interface BotFilters {
  userId?: number
  status?: string
  isDeployed?: boolean
  search?: string
}

export class BotService {
  /**
   * Create a new bot
   */
  static async createBot(userId: number, botData: CreateBotRequest): Promise<Bot> {
    try {
      // Validate required fields
      if (!botData.name || botData.name.trim().length === 0) {
        throw new Error('Bot name is required')
      }

      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create bot
      const bot = await db.bot.create({
        data: {
          user_id: userId,
          name: botData.name.trim(),
          description: botData.description?.trim() || '',
          system_prompt: botData.system_prompt?.trim() || '',
          model: botData.model || 'deepseek-chat',
          temperature: botData.temperature || 0.7,
          max_tokens: botData.max_tokens || 1000,
          status: botData.status || 'draft',
          is_deployed: botData.is_deployed || false,
          deployment_url: botData.deployment_url,
        },
      })

      return this.mapBotToResponse(bot)
    } catch (error) {
      console.error('BotService.createBot error:', error)
      throw error
    }
  }

  /**
   * Get bot by ID
   */
  static async getBotById(id: number): Promise<Bot | null> {
    try {
      const bot = await db.bot.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!bot) {
        return null
      }

      return this.mapBotToResponse(bot)
    } catch (error) {
      console.error('BotService.getBotById error:', error)
      throw error
    }
  }

  /**
   * Get bots with filters
   */
  static async getBots(filters: BotFilters = {}): Promise<Bot[]> {
    try {
      const where: any = {}

      if (filters.userId) {
        where.user_id = filters.userId
      }

      if (filters.status) {
        where.status = filters.status
      }

      if (filters.isDeployed !== undefined) {
        where.is_deployed = filters.isDeployed
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const bots = await db.bot.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return bots.map(bot => this.mapBotToResponse(bot))
    } catch (error) {
      console.error('BotService.getBots error:', error)
      throw error
    }
  }

  /**
   * Update bot
   */
  static async updateBot(id: number, updates: UpdateBotRequest): Promise<Bot | null> {
    try {
      console.log('BotService.updateBot called with:', { id, updates })
      
      // Check if bot exists
      const existingBot = await db.bot.findUnique({
        where: { id }
      })

      if (!existingBot) {
        console.log('Bot not found with id:', id)
        return null
      }

      console.log('Existing bot found:', existingBot)

      // Validate updates
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new Error('Bot name cannot be empty')
      }

      // Prepare update data
      const updateData: any = {}
      
      if (updates.name) {
        updateData.name = updates.name.trim()
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description?.trim() || ''
      }
      if (updates.system_prompt !== undefined) {
        updateData.system_prompt = updates.system_prompt?.trim() || ''
      }
      if (updates.model) {
        updateData.model = updates.model
      }
      if (updates.temperature !== undefined) {
        updateData.temperature = updates.temperature
      }
      if (updates.max_tokens !== undefined) {
        updateData.max_tokens = updates.max_tokens
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status
      }
      if (updates.is_deployed !== undefined) {
        updateData.is_deployed = updates.is_deployed
      }
      if (updates.deployment_url !== undefined) {
        updateData.deployment_url = updates.deployment_url
      }

      console.log('Update data prepared:', updateData)

      // Update bot
      const bot = await db.bot.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      console.log('Bot updated successfully:', bot)
      return this.mapBotToResponse(bot)
    } catch (error) {
      console.error('BotService.updateBot error:', error)
      throw error
    }
  }

  /**
   * Delete bot
   */
  static async deleteBot(id: number): Promise<boolean> {
    try {
      // Check if bot exists
      const existingBot = await db.bot.findUnique({
        where: { id }
      })

      if (!existingBot) {
        return false
      }

      // Delete bot (cascade will handle related records)
      await db.bot.delete({
        where: { id }
      })

      return true
    } catch (error) {
      console.error('BotService.deleteBot error:', error)
      throw error
    }
  }

  /**
   * Get bot statistics
   */
  static async getBotStats(botId: number): Promise<{
    totalConversations: number
    totalMessages: number
    totalTokensUsed: number
    avgResponseTime: number
  }> {
    try {
      const [conversations, messages, analytics] = await Promise.all([
        db.conversation.count({
          where: { bot_id: botId }
        }),
        db.message.count({
          where: {
            conversation: {
              bot_id: botId
            }
          }
        }),
        db.botAnalytics.aggregate({
          where: { bot_id: botId },
          _sum: {
            total_tokens_used: true
          },
          _avg: {
            avg_response_time_ms: true
          }
        })
      ])

      return {
        totalConversations: conversations,
        totalMessages: messages,
        totalTokensUsed: analytics._sum.total_tokens_used || 0,
        avgResponseTime: analytics._avg.avg_response_time_ms || 0
      }
    } catch (error) {
      console.error('BotService.getBotStats error:', error)
      throw error
    }
  }

  /**
   * Map database bot to response format
   */
  private static mapBotToResponse(bot: any): Bot {
    return {
      id: bot.id,
      user_id: bot.user_id,
      name: bot.name,
      description: bot.description || '',
      system_prompt: bot.system_prompt || '',
      model: bot.model,
      temperature: bot.temperature,
      max_tokens: bot.max_tokens,
      status: bot.status as 'draft' | 'active' | 'inactive',
      is_deployed: bot.is_deployed,
      deployment_url: bot.deployment_url || undefined,
      created_at: bot.created_at.toISOString(),
      updated_at: bot.updated_at.toISOString(),
    }
  }
}
