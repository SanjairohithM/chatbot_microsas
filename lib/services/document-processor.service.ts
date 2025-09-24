import { readFile } from 'fs/promises'
import { join } from 'path'

export interface ProcessedDocument {
  content: string
  metadata: {
    title: string
    fileType: string
    fileSize: number
    wordCount: number
    pageCount?: number
  }
}

export class DocumentProcessorService {
  /**
   * Process a document and extract text content
   */
  static async processDocument(filePath: string, filename: string, fileType: string): Promise<ProcessedDocument> {
    try {
      const fileExtension = filename.split('.').pop()?.toLowerCase() || ''
      
      let content = ''
      let metadata: ProcessedDocument['metadata'] = {
        title: filename,
        fileType: fileExtension,
        fileSize: 0,
        wordCount: 0
      }

      switch (fileExtension) {
        case 'txt':
        case 'md':
        case 'json':
        case 'csv':
          content = await this.processTextFile(filePath)
          break
        
        case 'pdf':
          content = await this.processPdfFile(filePath)
          break
        
        case 'docx':
          content = await this.processDocxFile(filePath)
          break
        
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`)
      }

      // Sanitize content
      content = this.sanitizeContent(content)

      // Calculate metadata
      metadata.fileSize = (await import('fs')).statSync(filePath).size
      metadata.wordCount = content.split(/\s+/).length

      return {
        content,
        metadata
      }

    } catch (error) {
      console.error('Document processing error:', error)
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process text-based files
   */
  private static async processTextFile(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf-8')
    return content
  }

  /**
   * Process PDF files using pdf-parse library
   */
  private static async processPdfFile(filePath: string): Promise<string> {
    try {
      const pdfParse = require('pdf-parse')
      const dataBuffer = await readFile(filePath)
      const data = await pdfParse(dataBuffer)
      return data.text
    } catch (error) {
      console.error('PDF processing error:', error)
      return `PDF Document: ${filePath}\n\nError processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Process DOCX files (simplified - in production, use a proper DOCX library)
   */
  private static async processDocxFile(filePath: string): Promise<string> {
    // For now, return a placeholder. In production, you'd use a library like mammoth
    // const mammoth = require('mammoth')
    // const result = await mammoth.extractRawText({ path: filePath })
    // return result.value
    
    return `DOCX Document: ${filePath}\n\nNote: DOCX text extraction requires additional setup. For now, this is a placeholder.`
  }

  /**
   * Sanitize content to prevent encoding issues
   */
  private static sanitizeContent(content: string): string {
    return content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Split content into chunks for better processing
   */
  static splitIntoChunks(content: string, maxChunkSize: number = 1000): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }
}
