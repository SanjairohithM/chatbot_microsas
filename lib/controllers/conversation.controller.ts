import { NextRequest } from 'next/server'
import { ConversationService, type CreateConversationRequest, type CreateMessageRequest } from '../services/conversation.service'
import { ApiResponse } from '../utils/api-response'
import { validateRequest } from '../middleware/validation'

export class ConversationController {
  /**
   * Create a new conversation
   */
  static async createConversation(request: NextRequest) {
    try {
      const conversationData = await request.json()

      // Validate request
      const validation = validateRequest({
        botId: { required: true, type: 'number' },
        userId: { required: true, type: 'number' },
        title: { type: 'string', maxLength: 255 },
        isTest: { type: 'boolean' }
      }, conversationData)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const conversation = await ConversationService.createConversation(conversationData as CreateConversationRequest)

      return ApiResponse.success('Conversation created successfully', conversation)
    } catch (error) {
      console.error('ConversationController.createConversation error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to create conversation'
      )
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid conversation ID')
      }

      const conversation = await ConversationService.getConversationById(id)

      if (!conversation) {
        return ApiResponse.notFound('Conversation not found')
      }

      return ApiResponse.success('Conversation retrieved successfully', conversation)
    } catch (error) {
      console.error('ConversationController.getConversationById error:', error)
      return ApiResponse.internalServerError('Failed to retrieve conversation')
    }
  }

  /**
   * Get conversations by user ID
   */
  static async getConversationsByUserId(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get('userId')

      if (!userId) {
        return ApiResponse.badRequest('User ID is required')
      }

      const userIdNum = parseInt(userId)
      if (isNaN(userIdNum)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      const conversations = await ConversationService.getConversationsByUserId(userIdNum)

      return ApiResponse.success('Conversations retrieved successfully', conversations)
    } catch (error) {
      console.error('ConversationController.getConversationsByUserId error:', error)
      return ApiResponse.internalServerError('Failed to retrieve conversations')
    }
  }

  /**
   * Get conversations by bot ID
   */
  static async getConversationsByBotId(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const botId = searchParams.get('botId')

      if (!botId) {
        return ApiResponse.badRequest('Bot ID is required')
      }

      const botIdNum = parseInt(botId)
      if (isNaN(botIdNum)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      const conversations = await ConversationService.getConversationsByBotId(botIdNum)

      return ApiResponse.success('Conversations retrieved successfully', conversations)
    } catch (error) {
      console.error('ConversationController.getConversationsByBotId error:', error)
      return ApiResponse.internalServerError('Failed to retrieve conversations')
    }
  }

  /**
   * Update conversation
   */
  static async updateConversation(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid conversation ID')
      }

      const updates = await request.json()

      // Validate updates
      const validation = validateRequest({
        title: { type: 'string', maxLength: 255 }
      }, updates)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const conversation = await ConversationService.updateConversation(id, updates)

      if (!conversation) {
        return ApiResponse.notFound('Conversation not found')
      }

      return ApiResponse.success('Conversation updated successfully', conversation)
    } catch (error) {
      console.error('ConversationController.updateConversation error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to update conversation'
      )
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid conversation ID')
      }

      const success = await ConversationService.deleteConversation(id)

      if (!success) {
        return ApiResponse.notFound('Conversation not found')
      }

      return ApiResponse.success('Conversation deleted successfully')
    } catch (error) {
      console.error('ConversationController.deleteConversation error:', error)
      return ApiResponse.internalServerError('Failed to delete conversation')
    }
  }

  /**
   * Create a message in a conversation
   */
  static async createMessage(request: NextRequest) {
    try {
      const messageData = await request.json()

      // Validate request
      const validation = validateRequest({
        conversationId: { required: true, type: 'number' },
        role: { required: true, type: 'string', enum: ['user', 'assistant', 'system'] },
        content: { required: true, type: 'string', minLength: 1, maxLength: 10000 },
        tokensUsed: { type: 'number', min: 0 },
        responseTimeMs: { type: 'number', min: 0 }
      }, messageData)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const message = await ConversationService.createMessage(messageData as CreateMessageRequest)

      return ApiResponse.success('Message created successfully', message)
    } catch (error) {
      console.error('ConversationController.createMessage error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to create message'
      )
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessagesByConversationId(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid conversation ID')
      }

      const messages = await ConversationService.getMessagesByConversationId(id)

      return ApiResponse.success('Messages retrieved successfully', messages)
    } catch (error) {
      console.error('ConversationController.getMessagesByConversationId error:', error)
      return ApiResponse.internalServerError('Failed to retrieve messages')
    }
  }
}
