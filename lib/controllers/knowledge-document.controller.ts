import { NextRequest } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'

export class KnowledgeDocumentController {
  /**
   * Create a new knowledge document
   */
  static async createKnowledgeDocument(request: NextRequest) {
    try {
      const body = await request.json()
      const { bot_id, title, content, file_type, file_size, status } = body

      // Validate request
      const validation = validateRequest({
        bot_id: { required: true, type: 'number' },
        title: { required: true, type: 'string', minLength: 1, maxLength: 255 },
        content: { required: true, type: 'string', minLength: 1 },
        file_type: { type: 'string', maxLength: 50 },
        file_size: { type: 'number', min: 0 },
        status: { type: 'string', enum: ['processing', 'indexed', 'error'] }
      }, body)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const document = await KnowledgeDocumentService.createKnowledgeDocument({
        bot_id,
        title,
        content,
        file_type,
        file_size,
        status
      })

      return ApiResponse.success('Knowledge document created successfully', document)
    } catch (error) {
      console.error('KnowledgeDocumentController.createKnowledgeDocument error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to create knowledge document'
      )
    }
  }

  /**
   * Get knowledge documents
   */
  static async getKnowledgeDocuments(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const botId = searchParams.get('botId')
      const status = searchParams.get('status')
      const fileType = searchParams.get('fileType')
      const search = searchParams.get('search')

      const filters = {
        botId: botId ? parseInt(botId) : undefined,
        status: status || undefined,
        fileType: fileType || undefined,
        search: search || undefined
      }

      const documents = await KnowledgeDocumentService.getKnowledgeDocuments(filters)

      return ApiResponse.success('Knowledge documents retrieved successfully', documents)
    } catch (error) {
      console.error('KnowledgeDocumentController.getKnowledgeDocuments error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to retrieve knowledge documents'
      )
    }
  }

  /**
   * Get knowledge document by ID
   */
  static async getKnowledgeDocumentById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid document ID')
      }

      const document = await KnowledgeDocumentService.getKnowledgeDocumentById(id)

      if (!document) {
        return ApiResponse.notFound('Knowledge document not found')
      }

      return ApiResponse.success('Knowledge document retrieved successfully', document)
    } catch (error) {
      console.error('KnowledgeDocumentController.getKnowledgeDocumentById error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to retrieve knowledge document'
      )
    }
  }

  /**
   * Update knowledge document
   */
  static async updateKnowledgeDocument(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid document ID')
      }

      const updates = await request.json()

      // Validate updates
      const validation = validateRequest({
        title: { type: 'string', minLength: 1, maxLength: 255 },
        content: { type: 'string', minLength: 1 },
        file_type: { type: 'string', maxLength: 50 },
        file_size: { type: 'number', min: 0 },
        status: { type: 'string', enum: ['processing', 'indexed', 'error'] }
      }, updates)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const document = await KnowledgeDocumentService.updateKnowledgeDocument(id, updates)

      if (!document) {
        return ApiResponse.notFound('Knowledge document not found')
      }

      return ApiResponse.success('Knowledge document updated successfully', document)
    } catch (error) {
      console.error('KnowledgeDocumentController.updateKnowledgeDocument error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to update knowledge document'
      )
    }
  }

  /**
   * Delete knowledge document
   */
  static async deleteKnowledgeDocument(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid document ID')
      }

      const success = await KnowledgeDocumentService.deleteKnowledgeDocument(id)

      if (!success) {
        return ApiResponse.notFound('Knowledge document not found')
      }

      return ApiResponse.success('Knowledge document deleted successfully')
    } catch (error) {
      console.error('KnowledgeDocumentController.deleteKnowledgeDocument error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to delete knowledge document'
      )
    }
  }

  /**
   * Get documents for a specific bot
   */
  static async getDocumentsByBotId(request: NextRequest, { params }: { params: { botId: string } }) {
    try {
      const botId = parseInt(params.botId)

      if (isNaN(botId)) {
        return ApiResponse.badRequest('Invalid bot ID')
      }

      const documents = await KnowledgeDocumentService.getDocumentsByBotId(botId)

      return ApiResponse.success('Bot documents retrieved successfully', documents)
    } catch (error) {
      console.error('KnowledgeDocumentController.getDocumentsByBotId error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to retrieve bot documents'
      )
    }
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid document ID')
      }

      const { status } = await request.json()

      if (!status || !['processing', 'indexed', 'error'].includes(status)) {
        return ApiResponse.badRequest('Invalid status. Must be one of: processing, indexed, error')
      }

      const document = await KnowledgeDocumentService.updateDocumentStatus(id, status)

      if (!document) {
        return ApiResponse.notFound('Knowledge document not found')
      }

      return ApiResponse.success('Document status updated successfully', document)
    } catch (error) {
      console.error('KnowledgeDocumentController.updateDocumentStatus error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to update document status'
      )
    }
  }
}
