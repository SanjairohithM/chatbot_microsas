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
   * Process PDF files using pdf-parse library with fallback
   */
  private static async processPdfFile(filePath: string): Promise<string> {
    try {
      console.log(`[DocumentProcessor] Processing PDF: ${filePath}`)
      
      // Check if file exists before processing
      const fs = await import('fs')
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`)
      }
      
      const dataBuffer = await readFile(filePath)
      
      // Add validation for buffer
      if (!dataBuffer || dataBuffer.length === 0) {
        throw new Error(`PDF file is empty or corrupted: ${filePath}`)
      }
      
      console.log(`[DocumentProcessor] PDF buffer size: ${dataBuffer.length} bytes`)
      
      // Try multiple PDF parsing approaches
      let pdfText = ''
      
      // Method 1: Try standard pdf-parse with better options
      try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(dataBuffer, {
          max: 0, // Parse all pages
          normalizeWhitespace: true,
          disableCombineTextItems: false
        })
        
        if (data && data.text && data.text.trim().length > 0) {
          pdfText = this.cleanExtractedText(data.text)
          console.log(`[DocumentProcessor] PDF parsed successfully with pdf-parse, text length: ${pdfText.length}`)
        }
      } catch (parseError) {
        console.warn(`[DocumentProcessor] pdf-parse failed, trying alternative method:`, parseError.message)
        
        // Method 2: Try with different pdf-parse options
        try {
          const pdfParse = require('pdf-parse')
          const data = await pdfParse(dataBuffer, {
            max: 0,
            normalizeWhitespace: false,
            disableCombineTextItems: true
          })
          
          if (data && data.text && data.text.trim().length > 0) {
            pdfText = this.cleanExtractedText(data.text)
            console.log(`[DocumentProcessor] PDF parsed with alternative pdf-parse options, text length: ${pdfText.length}`)
          }
        } catch (secondError) {
          console.warn(`[DocumentProcessor] Alternative pdf-parse also failed:`, secondError.message)
          
          // Method 3: Improved fallback text extraction
          const textFromBuffer = this.extractTextFromPdfBuffer(dataBuffer)
          if (textFromBuffer && textFromBuffer.trim().length > 0) {
            pdfText = textFromBuffer
            console.log(`[DocumentProcessor] PDF text extracted with improved fallback method, text length: ${pdfText.length}`)
          } else {
            throw new Error('All PDF parsing methods failed')
          }
        }
      }
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error(`No text could be extracted from PDF: ${filePath}`)
      }
      
      // Final cleanup of extracted text
      pdfText = this.cleanExtractedText(pdfText)
      
      return pdfText
      
    } catch (error) {
      console.error('PDF processing error:', error)
      
      // Return filename and basic info instead of failing completely
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown.pdf'
      return `PDF Document: ${fileName}\n\nNote: Text extraction failed, but document was uploaded successfully. Content: [PDF file - ${fileName}]`
    }
  }

  /**
   * Improved fallback text extraction from PDF buffer
   */
  private static extractTextFromPdfBuffer(buffer: Buffer): string {
    try {
      // Convert buffer to string using UTF-8 encoding
      const pdfString = buffer.toString('utf8')
      
      // Look for text objects in PDF structure
      const textObjects = pdfString.match(/BT[\s\S]*?ET/g) || []
      
      let extractedText = ''
      
      textObjects.forEach(obj => {
        // Extract text from text objects
        const textMatches = obj.match(/\(([^)]+)\)/g) || []
        textMatches.forEach(match => {
          const text = match.replace(/[()]/g, '').trim()
          if (text.length > 0 && this.isReadableText(text)) {
            extractedText += text + ' '
          }
        })
      })
      
      // If no text objects found, try alternative method
      if (extractedText.trim().length === 0) {
        // Look for text between parentheses in the entire PDF
        const allTextMatches = pdfString.match(/\(([^)]+)\)/g) || []
        allTextMatches.forEach(match => {
          const text = match.replace(/[()]/g, '').trim()
          if (text.length > 2 && this.isReadableText(text)) {
            extractedText += text + ' '
          }
        })
      }
      
      return this.cleanExtractedText(extractedText.trim())
    } catch (error) {
      console.warn('Fallback text extraction failed:', error)
      return ''
    }
  }

  /**
   * Check if text is readable (not corrupted)
   */
  private static isReadableText(text: string): boolean {
    // Check if text contains mostly readable characters
    const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]/g) || []
    const totalChars = text.length
    
    // At least 70% should be readable characters
    const readabilityRatio = readableChars.length / totalChars
    
    // Text should be at least 3 characters and mostly readable
    return totalChars >= 3 && readabilityRatio > 0.7
  }

  /**
   * Clean extracted text to remove artifacts
   */
  private static cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize again
      .trim()
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
