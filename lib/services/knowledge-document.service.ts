import { db } from '../db'
import type { KnowledgeDocument } from '../types'

export interface CreateKnowledgeDocumentRequest {
  bot_id: number
  title: string
  content?: string
  file_url?: string
  file_type?: string
  file_size?: number
  status?: string
  processing_error?: string
}

export interface UpdateKnowledgeDocumentRequest {
  title?: string
  content?: string
  file_url?: string
  file_type?: string
  file_size?: number
  status?: string
  processing_error?: string
}

export interface KnowledgeDocumentFilters {
  botId?: number
  status?: string
  fileType?: string
  search?: string
}

export class KnowledgeDocumentService {
  /**
   * Create a new knowledge document
   */
  static async createKnowledgeDocument(data: CreateKnowledgeDocumentRequest): Promise<KnowledgeDocument> {
    try {
      // Validate bot exists
      const bot = await db.bot.findUnique({
        where: { id: data.bot_id }
      })

      if (!bot) {
        throw new Error('Bot not found')
      }

      // Sanitize content to prevent UTF-8 encoding issues
      const sanitizedContent = data.content
        ? data.content
            .replace(/\0/g, '') // Remove null bytes
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .trim()
        : ''

      // Create knowledge document
      const document = await db.knowledgeDocument.create({
        data: {
          bot_id: data.bot_id,
          title: data.title.trim(),
          content: sanitizedContent,
          file_url: data.file_url,
          file_type: data.file_type || 'text',
          file_size: data.file_size || sanitizedContent.length,
          status: data.status || 'processing',
          processing_error: data.processing_error,
        },
      })

      return this.mapKnowledgeDocumentToResponse(document)
    } catch (error) {
      console.error('KnowledgeDocumentService.createKnowledgeDocument error:', error)
      throw error
    }
  }

  /**
   * Get knowledge document by ID
   */
  static async getKnowledgeDocumentById(id: number): Promise<KnowledgeDocument | null> {
    try {
      const document = await db.knowledgeDocument.findUnique({
        where: { id },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        }
      })

      return document ? this.mapKnowledgeDocumentToResponse(document) : null
    } catch (error) {
      console.error('KnowledgeDocumentService.getKnowledgeDocumentById error:', error)
      throw error
    }
  }

  /**
   * Get knowledge documents with filters
   */
  static async getKnowledgeDocuments(filters: KnowledgeDocumentFilters = {}): Promise<KnowledgeDocument[]> {
    try {
      const where: any = {}

      if (filters.botId) {
        where.bot_id = filters.botId
      }

      if (filters.status) {
        where.status = filters.status
      }

      if (filters.fileType) {
        where.file_type = filters.fileType
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const documents = await db.knowledgeDocument.findMany({
        where,
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return documents.map(doc => this.mapKnowledgeDocumentToResponse(doc))
    } catch (error) {
      console.error('KnowledgeDocumentService.getKnowledgeDocuments error:', error)
      throw error
    }
  }

  /**
   * Update knowledge document
   */
  static async updateKnowledgeDocument(id: number, updates: UpdateKnowledgeDocumentRequest): Promise<KnowledgeDocument | null> {
    try {
      // Check if document exists
      const existingDocument = await db.knowledgeDocument.findUnique({
        where: { id }
      })

      if (!existingDocument) {
        return null
      }

      // Prepare update data
      const updateData: any = {}
      
      if (updates.title !== undefined) {
        updateData.title = updates.title.trim()
      }
      if (updates.content !== undefined) {
        updateData.content = updates.content
        updateData.file_size = updates.content.length
      }
      if (updates.file_type !== undefined) {
        updateData.file_type = updates.file_type
      }
      if (updates.file_size !== undefined) {
        updateData.file_size = updates.file_size
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status
      }

      // Update document
      const document = await db.knowledgeDocument.update({
        where: { id },
        data: updateData,
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        }
      })

      return this.mapKnowledgeDocumentToResponse(document)
    } catch (error) {
      console.error('KnowledgeDocumentService.updateKnowledgeDocument error:', error)
      throw error
    }
  }

  /**
   * Delete knowledge document
   */
  static async deleteKnowledgeDocument(id: number): Promise<boolean> {
    try {
      await db.knowledgeDocument.delete({
        where: { id }
      })

      return true
    } catch (error) {
      console.error('KnowledgeDocumentService.deleteKnowledgeDocument error:', error)
      throw error
    }
  }

  /**
   * Get documents for a specific bot
   */
  static async getDocumentsByBotId(botId: number): Promise<KnowledgeDocument[]> {
    try {
      const documents = await db.knowledgeDocument.findMany({
        where: { bot_id: botId },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return documents.map(doc => this.mapKnowledgeDocumentToResponse(doc))
    } catch (error) {
      console.error('KnowledgeDocumentService.getDocumentsByBotId error:', error)
      throw error
    }
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(id: number, status: string): Promise<KnowledgeDocument | null> {
    try {
      const document = await db.knowledgeDocument.update({
        where: { id },
        data: { status },
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              user_id: true
            }
          }
        }
      })

      return this.mapKnowledgeDocumentToResponse(document)
    } catch (error) {
      console.error('KnowledgeDocumentService.updateDocumentStatus error:', error)
      throw error
    }
  }

  /**
   * Map database document to response format
   */
  private static mapKnowledgeDocumentToResponse(document: any): KnowledgeDocument {
    return {
      id: document.id,
      bot_id: document.bot_id,
      title: document.title,
      content: document.content,
      file_type: document.file_type,
      file_size: document.file_size,
      status: document.status,
      created_at: document.created_at.toISOString(),
      updated_at: document.updated_at.toISOString(),
    }
  }
}
