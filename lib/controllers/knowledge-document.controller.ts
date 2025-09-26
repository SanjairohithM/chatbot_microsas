import { NextRequest } from 'next/server'
import { KnowledgeDocumentService } from '@/lib/services/knowledge-document.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { DocumentProcessorService } from '@/lib/services/document-processor.service'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'
import { join } from 'path'
import { existsSync } from 'fs'

export class KnowledgeDocumentController {
  /**
   * Create a new knowledge document
   */
  static async createKnowledgeDocument(request: NextRequest) {
    try {
      const body = await request.json()
      const { bot_id, title, content, file_type, file_size, status, file_url } = body

      // Validate request
      const validation = validateRequest({
        bot_id: { required: true, type: 'number' },
        title: { required: true, type: 'string', minLength: 1, maxLength: 255 },
        // content OR file_url is required
        content: { type: 'string', minLength: 1 },
        file_type: { type: 'string', maxLength: 50 },
        file_size: { type: 'number', min: 0 },
        status: { type: 'string', enum: ['processing', 'indexed', 'error'] }
      }, body)

      if (!validation.isValid) {
        // If content is missing, allow when file_url is present
        if (!body.content && body.file_url) {
          // proceed
        } else {
          return ApiResponse.badRequest('Validation failed', validation.errors)
        }
      }

      const document = await KnowledgeDocumentService.createKnowledgeDocument({
        bot_id,
        title,
        content,
        file_url,
        file_type,
        file_size,
        status
      })

      // Immediately process and store in Pinecone using the provided bot_id
      try {
        let processedContent = document.content
        const normalizedContent = (processedContent || '').trim().toLowerCase()
        const shouldProcess = !!file_url && (
          !processedContent ||
          normalizedContent === 'processing...' ||
          normalizedContent === 'processing' ||
          normalizedContent.length < 100 ||
          (status && status === 'processing')
        )

        if (shouldProcess && file_url) {
          // Resolve local path from file_url (supports /api/secure-file/ and /uploads/)
          let filePath: string
          if (file_url.startsWith('/api/secure-file/')) {
            const filename = file_url.replace('/api/secure-file/', '')
            filePath = join(process.cwd(), 'secure-uploads', filename)
          } else if (file_url.startsWith('/uploads/')) {
            const filename = file_url.replace('/uploads/', '')
            const securePath = join(process.cwd(), 'secure-uploads', filename)
            const oldPath = join(process.cwd(), 'uploads', filename)
            if (existsSync(securePath)) filePath = securePath
            else filePath = oldPath
          } else {
            filePath = join(process.cwd(), file_url)
          }

          const processed = await DocumentProcessorService.processDocument(
            filePath,
            title,
            file_type || 'txt'
          )

          await KnowledgeDocumentService.updateKnowledgeDocument(document.id, {
            content: processed.content,
            status: 'indexed'
          })
          processedContent = processed.content
        }

        if (processedContent) {
          await PineconeDocumentService.storeDocument(
            bot_id,
            document.id,
            title,
            processedContent
          )
        }
      } catch (procErr) {
        console.error('[KnowledgeDocumentController] Auto-process/store failed:', procErr)
      }

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
