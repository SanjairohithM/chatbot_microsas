import { db } from '../db'
import type { Conversation, Message } from '../types'

export interface CreateConversationRequest {
  botId: number
  userId: number
  title?: string
  isTest?: boolean
}

export interface CreateMessageRequest {
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl?: string
  imageAnalysis?: string
  tokensUsed?: number
  responseTimeMs?: number
}

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    try {
      // Validate bot exists
      const bot = await db.bot.findUnique({
        where: { id: data.botId }
      })

      if (!bot) {
        throw new Error('Bot not found')
      }

      // Validate user exists
      const user = await db.user.findUnique({
        where: { id: data.userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create conversation
      const conversation = await db.conversation.create({
        data: {
          bot_id: data.botId,
          user_id: data.userId,
          title: data.title || 'New Conversation',
          is_test: data.isTest || false,
        },
      })

      return this.mapConversationToResponse(conversation)
    } catch (error) {
      console.error('ConversationService.createConversation error:', error)
      throw error
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(id: number): Promise<Conversation | null> {
    try {
      const conversation = await db.conversation.findUnique({
        where: { id },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!conversation) {
        return null
      }

      return this.mapConversationToResponse(conversation)
    } catch (error) {
      console.error('ConversationService.getConversationById error:', error)
      throw error
    }
  }

  /**
   * Get conversations for a user
   */
  static async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    try {
      const conversations = await db.conversation.findMany({
        where: { user_id: userId },
        include: {
          bot: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      })

      return conversations.map(conv => this.mapConversationToResponse(conv))
    } catch (error) {
      console.error('ConversationService.getConversationsByUserId error:', error)
      throw error
    }
  }

  /**
   * Get conversations for a bot
   */
  static async getConversationsByBotId(botId: number): Promise<Conversation[]> {
    try {
      const conversations = await db.conversation.findMany({
        where: { bot_id: botId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      })

      return conversations.map(conv => this.mapConversationToResponse(conv))
    } catch (error) {
      console.error('ConversationService.getConversationsByBotId error:', error)
      throw error
    }
  }

  /**
   * Update conversation
   */
  static async updateConversation(id: number, updates: { title?: string }): Promise<Conversation | null> {
    try {
      // Check if conversation exists
      const existingConversation = await db.conversation.findUnique({
        where: { id }
      })

      if (!existingConversation) {
        return null
      }

      // Update conversation
      const conversation = await db.conversation.update({
        where: { id },
        data: {
          ...(updates.title && { title: updates.title.trim() })
        }
      })

      return this.mapConversationToResponse(conversation)
    } catch (error) {
      console.error('ConversationService.updateConversation error:', error)
      throw error
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(id: number): Promise<boolean> {
    try {
      // Check if conversation exists
      const existingConversation = await db.conversation.findUnique({
        where: { id }
      })

      if (!existingConversation) {
        return false
      }

      // Delete conversation (cascade will handle messages)
      await db.conversation.delete({
        where: { id }
      })

      return true
    } catch (error) {
      console.error('ConversationService.deleteConversation error:', error)
      throw error
    }
  }

  /**
   * Create a message in a conversation
   */
  static async createMessage(data: CreateMessageRequest): Promise<Message> {
    try {
      // Validate conversation exists
      const conversation = await db.conversation.findUnique({
        where: { id: data.conversationId }
      })

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Create message
      const message = await db.message.create({
        data: {
          conversation_id: data.conversationId,
          role: data.role,
          content: data.content,
          image_url: data.imageUrl,
          image_analysis: data.imageAnalysis,
          tokens_used: data.tokensUsed,
          response_time_ms: data.responseTimeMs,
        },
      })

      // Update conversation's updated_at timestamp
      await db.conversation.update({
        where: { id: data.conversationId },
        data: { updated_at: new Date() }
      })

      return this.mapMessageToResponse(message)
    } catch (error) {
      console.error('ConversationService.createMessage error:', error)
      throw error
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    try {
      const messages = await db.message.findMany({
        where: { conversation_id: conversationId },
        orderBy: { created_at: 'asc' }
      })

      return messages.map(msg => this.mapMessageToResponse(msg))
    } catch (error) {
      console.error('ConversationService.getMessagesByConversationId error:', error)
      throw error
    }
  }

  /**
   * Map database conversation to response format
   */
  private static mapConversationToResponse(conversation: any): Conversation {
    return {
      id: conversation.id,
      bot_id: conversation.bot_id,
      user_id: conversation.user_id,
      title: conversation.title || 'New Conversation',
      is_test: conversation.is_test,
      created_at: conversation.created_at.toISOString(),
      updated_at: conversation.updated_at.toISOString(),
    }
  }

  /**
   * Map database message to response format
   */
  private static mapMessageToResponse(message: any): Message {
    return {
      id: message.id,
      conversation_id: message.conversation_id,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      image_url: message.image_url || undefined,
      image_analysis: message.image_analysis || undefined,
      tokens_used: message.tokens_used || undefined,
      response_time_ms: message.response_time_ms || undefined,
      created_at: message.created_at.toISOString(),
    }
  }
}
