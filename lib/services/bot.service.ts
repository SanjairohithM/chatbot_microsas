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
  interaction_mode?: 'chat' | 'voice'
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
  interaction_mode?: 'chat' | 'voice'
}

export interface BotFilters {
  userId?: string
  status?: string
  isDeployed?: boolean
  search?: string
}

export interface BotToken {
  id: number
  bot_id: number
  token_name: string
  access_token: string
  secret_key: string
  permissions: string[]
  expires_at: Date
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
  last_used_at?: Date
}

export interface CreateBotTokenRequest {
  bot_id: number
  token_name: string
  access_token: string
  secret_key: string
  permissions: string[]
  expires_at: Date
  description?: string
  is_active: boolean
  created_at: Date
  last_used_at?: Date
}

export interface UpdateBotTokenRequest {
  token_name?: string
  permissions?: string[]
  expires_in_days?: number
  description?: string
  is_active?: boolean
}

export interface TokenValidationResult {
  valid: boolean
  reason?: string
  token?: BotToken
}

export class BotService {
  /**
   * Create a new bot
   */
  static async createBot(userId: string, botData: CreateBotRequest): Promise<Bot> {
    try {
      // Validate required fields
      if (!botData.name || botData.name.trim().length === 0) {
        throw new Error('Bot name is required')
      }

      const trimmedName = botData.name.trim()

      // Use database transaction to prevent race conditions
      const result = await db.$transaction(async (tx) => {
        // Check if user exists
        const user = await tx.user.findUnique({
          where: { id: userId }
        })

        if (!user) {
          throw new Error('User not found')
        }

        // Check if bot with same name already exists for this user
        const existingBot = await tx.bot.findUnique({
          where: {
            user_id_name: {
              user_id: userId,
              name: trimmedName
            }
          }
        })

        if (existingBot) {
          throw new Error(`Bot with name "${trimmedName}" already exists for this user`)
        }

        // Create bot
        const bot = await tx.bot.create({
          data: {
            user_id: userId,
            name: trimmedName,
            description: botData.description?.trim() || '',
            system_prompt: botData.system_prompt?.trim() || '',
            model: ((): string => {
              const requested = botData.model || 'gpt-4o-mini'
              if (!requested) return 'gpt-4o-mini'
              if (requested.includes('deepseek')) return 'gpt-4o-mini'
              return requested
            })(),
            temperature: botData.temperature || 0.7,
            max_tokens: botData.max_tokens || 1000,
            status: botData.status || 'draft',
            is_deployed: botData.is_deployed || false,
            deployment_url: botData.deployment_url,
            interaction_mode: botData.interaction_mode || 'chat',
          },
        })

        return bot
      })

      return this.mapBotToResponse(result)
    } catch (error) {
      console.error('BotService.createBot error:', error)
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint failed')) {
          throw new Error(`Bot with name "${botData.name}" already exists for this user`)
        }
        if (error.message.includes('User not found')) {
          throw new Error('User not found')
        }
        if (error.message.includes('already exists')) {
          throw error // Re-throw duplicate name errors
        }
      }
      
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

      // Clean up Pinecone data for this bot
      try {
        const { PineconeService } = await import('./pinecone.service')
        const { PineconeDocumentService } = await import('./pinecone-document.service')
        
        // Delete conversation data from Pinecone
        await PineconeService.deleteBotData(id)
        
        // Delete document data from Pinecone
        await PineconeDocumentService.deleteBotDocuments(id)
        
        console.log(`[BotService] Cleaned up Pinecone data for bot ${id}`)
      } catch (pineconeError) {
        console.warn(`[BotService] Failed to clean up Pinecone data for bot ${id}:`, pineconeError)
        // Don't fail the deletion if Pinecone cleanup fails
      }

      // Delete bot (cascade will handle related records in database)
      await db.bot.delete({
        where: { id }
      })

      console.log(`[BotService] Successfully deleted bot ${id}`)
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
   * Create a bot token
   */
  static async createBotToken(tokenData: CreateBotTokenRequest): Promise<BotToken> {
    try {
      const token = await db.botToken.create({
        data: {
          bot_id: tokenData.bot_id,
          token_name: tokenData.token_name,
          access_token: tokenData.access_token,
          secret_key: tokenData.secret_key,
          permissions: tokenData.permissions,
          expires_at: tokenData.expires_at,
          description: tokenData.description,
          is_active: tokenData.is_active,
          created_at: tokenData.created_at,
          last_used_at: tokenData.last_used_at
        }
      })

      return this.mapTokenToResponse(token)
    } catch (error) {
      console.error('BotService.createBotToken error:', error)
      throw error
    }
  }

  /**
   * Get bot tokens with pagination
   */
  static async getBotTokens(
    botId: number, 
    options: { page: number; limit: number; status?: 'active' | 'expired' | 'all' } = { page: 1, limit: 10, status: 'all' }
  ): Promise<{ data: BotToken[]; page: number; limit: number; total: number }> {
    try {
      const { page, limit, status } = options
      const skip = (page - 1) * limit

      const where: any = { bot_id: botId }
      
      if (status === 'active') {
        where.is_active = true
        where.expires_at = { gt: new Date() }
      } else if (status === 'expired') {
        where.OR = [
          { is_active: false },
          { expires_at: { lte: new Date() } }
        ]
      }

      const [tokens, total] = await Promise.all([
        db.botToken.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        db.botToken.count({ where })
      ])

      return {
        data: tokens.map(token => this.mapTokenToResponse(token)),
        page,
        limit,
        total
      }
    } catch (error) {
      console.error('BotService.getBotTokens error:', error)
      throw error
    }
  }

  /**
   * Update a bot token
   */
  static async updateBotToken(tokenId: number, botId: number, updates: UpdateBotTokenRequest): Promise<BotToken | null> {
    try {
      // Check if token exists and belongs to bot
      const existingToken = await db.botToken.findFirst({
        where: { id: tokenId, bot_id: botId }
      })

      if (!existingToken) {
        return null
      }

      const updateData: any = {}
      
      if (updates.token_name) {
        updateData.token_name = updates.token_name
      }
      if (updates.permissions) {
        updateData.permissions = updates.permissions
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description
      }
      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active
      }
      if (updates.expires_in_days) {
        const newExpiry = new Date()
        newExpiry.setDate(newExpiry.getDate() + updates.expires_in_days)
        updateData.expires_at = newExpiry
      }

      updateData.updated_at = new Date()

      const token = await db.botToken.update({
        where: { id: tokenId },
        data: updateData
      })

      return this.mapTokenToResponse(token)
    } catch (error) {
      console.error('BotService.updateBotToken error:', error)
      throw error
    }
  }

  /**
   * Revoke a bot token
   */
  static async revokeBotToken(tokenId: number, botId: number): Promise<boolean> {
    try {
      const result = await db.botToken.updateMany({
        where: { id: tokenId, bot_id: botId },
        data: { 
          is_active: false,
          updated_at: new Date()
        }
      })

      return result.count > 0
    } catch (error) {
      console.error('BotService.revokeBotToken error:', error)
      throw error
    }
  }

  /**
   * Validate a bot token
   */
  static async validateBotToken(botId: number, accessToken: string, secretKey: string): Promise<TokenValidationResult> {
    try {
      const token = await db.botToken.findFirst({
        where: {
          bot_id: botId,
          access_token: accessToken,
          secret_key: secretKey
        }
      })

      if (!token) {
        return { valid: false, reason: 'Token not found' }
      }

      if (!token.is_active) {
        return { valid: false, reason: 'Token is inactive' }
      }

      if (token.expires_at <= new Date()) {
        return { valid: false, reason: 'Token has expired' }
      }

      // Update last used timestamp
      await db.botToken.update({
        where: { id: token.id },
        data: { last_used_at: new Date() }
      })

      return { valid: true, token: this.mapTokenToResponse(token) }
    } catch (error) {
      console.error('BotService.validateBotToken error:', error)
      throw error
    }
  }

  /**
   * Get token by ID
   */
  static async getBotTokenById(tokenId: number, botId: number): Promise<BotToken | null> {
    try {
      const token = await db.botToken.findFirst({
        where: { id: tokenId, bot_id: botId }
      })

      if (!token) {
        return null
      }

      return this.mapTokenToResponse(token)
    } catch (error) {
      console.error('BotService.getBotTokenById error:', error)
      throw error
    }
  }

  /**
   * Map database token to response format
   */
  private static mapTokenToResponse(token: any): BotToken {
    return {
      id: token.id,
      bot_id: token.bot_id,
      token_name: token.token_name,
      access_token: token.access_token,
      secret_key: token.secret_key,
      permissions: token.permissions,
      expires_at: token.expires_at,
      description: token.description,
      is_active: token.is_active,
      created_at: token.created_at,
      updated_at: token.updated_at,
      last_used_at: token.last_used_at
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
      interaction_mode: bot.interaction_mode || 'chat',
      created_at: bot.created_at.toISOString(),
      updated_at: bot.updated_at.toISOString(),
    }
  }
}
