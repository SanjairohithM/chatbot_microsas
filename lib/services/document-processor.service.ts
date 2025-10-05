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
   * Process PDF files using multiple approaches for better reliability
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
      
      // Validate PDF header
      const pdfHeader = dataBuffer.toString('ascii', 0, 4)
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file - missing PDF header')
      }
      
      // Try multiple PDF parsing approaches
      let pdfText = ''
      
      // Method 1: Try pdf-parse first (more reliable in Node.js environments)
      try {
        console.log(`[DocumentProcessor] Attempting pdf-parse extraction...`)
        pdfText = await this.extractTextWithPdfParse(dataBuffer)
        
        if (pdfText && pdfText.trim().length > 0) {
          console.log(`[DocumentProcessor] PDF parsed successfully with pdf-parse, text length: ${pdfText.length}`)
        } else {
          console.warn(`[DocumentProcessor] pdf-parse returned empty text`)
        }
      } catch (pdfParseError) {
        console.warn(`[DocumentProcessor] pdf-parse failed:`, pdfParseError.message)
        
        // Method 2: Try pdfjs-dist as fallback
        try {
          console.log(`[DocumentProcessor] Attempting pdfjs-dist fallback...`)
          pdfText = await this.extractTextWithPdfJs(dataBuffer)
          
          if (pdfText && pdfText.trim().length > 0) {
            console.log(`[DocumentProcessor] PDF parsed with pdfjs-dist fallback, text length: ${pdfText.length}`)
          } else {
            console.warn(`[DocumentProcessor] pdfjs-dist fallback returned empty text`)
          }
        } catch (pdfJsError) {
          console.warn(`[DocumentProcessor] pdfjs-dist fallback also failed:`, pdfJsError.message)
          
          // Method 3: Custom fallback text extraction
          console.log(`[DocumentProcessor] Trying custom fallback text extraction...`)
          const textFromBuffer = this.extractTextFromPdfBuffer(dataBuffer)
          if (textFromBuffer && textFromBuffer.trim().length > 0) {
            pdfText = textFromBuffer
            console.log(`[DocumentProcessor] PDF text extracted with custom fallback method, text length: ${pdfText.length}`)
          } else {
            console.warn(`[DocumentProcessor] Custom fallback text extraction also failed`)
            throw new Error('All PDF parsing methods failed')
          }
        }
      }
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error(`No text could be extracted from PDF: ${filePath}`)
      }
      
      // Final cleanup of extracted text
      pdfText = this.cleanExtractedText(pdfText)
      
      // Additional validation for PDF content
      if (pdfText.length < 100) {
        console.warn(`[DocumentProcessor] PDF text is very short (${pdfText.length} chars), may be low quality`)
      }
      
      // Log some statistics about the extracted text
      const wordCount = pdfText.split(/\s+/).length
      const sentenceCount = pdfText.split(/[.!?]+/).length
      console.log(`[DocumentProcessor] PDF processing complete: ${pdfText.length} chars, ${wordCount} words, ${sentenceCount} sentences`)
      
      return pdfText
      
    } catch (error) {
      console.error('PDF processing error:', error)
      
      // Return filename and basic info instead of failing completely
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown.pdf'
      const fileSize = (await import('fs')).statSync(filePath).size
      
      return `PDF Document: ${fileName}
File Size: ${fileSize} bytes
Upload Date: ${new Date().toISOString()}

Note: Text extraction failed, but document was uploaded successfully. 
This may be due to:
- PDF being scanned images (not text-based)
- PDF being password protected
- PDF being corrupted
- PDF using unsupported encoding

Content: [PDF file - ${fileName}]`
    }
  }

  /**
   * Extract text using pdfjs-dist library (primary method)
   */
  private static async extractTextWithPdfJs(buffer: Buffer): Promise<string> {
    try {
      // Use the standard build with worker disabled
      const pdfjsLib = await import('pdfjs-dist')
      
      // Convert Buffer to Uint8Array as required by pdfjs-dist
      const uint8Array = new Uint8Array(buffer)
      
      // Load the PDF document with legacy configuration
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: false,
        disableRange: false,
        disableStream: false,
        disableAutoFetch: false,
        maxImageSize: -1,
        isEvalSupported: false,
        useWorkerFetch: false,
        stopAtErrors: false,
        verbosity: 0,
        // Disable worker to avoid module resolution issues
        useWorkerFetch: false,
        disableWorker: true
      })
      
      const pdfDocument = await loadingTask.promise
      console.log(`[DocumentProcessor] PDF loaded: ${pdfDocument.numPages} pages`)
      
      let fullText = ''
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim()
        
        if (pageText) {
          fullText += pageText + '\n'
        }
        
        console.log(`[DocumentProcessor] Page ${pageNum}: ${pageText.length} characters`)
      }
      
      await pdfDocument.destroy()
      
      return fullText.trim()
      
    } catch (error) {
      console.error('[DocumentProcessor] pdfjs-dist extraction failed:', error)
      throw error
    }
  }

  /**
   * Extract text using pdf-parse library (primary method for Node.js)
   */
  private static async extractTextWithPdfParse(buffer: Buffer): Promise<string> {
    try {
      // Use dynamic require to avoid module resolution issues
      const pdfParse = eval('require')('pdf-parse')
      
      const data = await pdfParse(buffer, {
        max: 0, // No limit on pages
        normalizeWhitespace: true,
        disableCombineTextItems: false,
        // Additional options for better text extraction
        version: 'v1.10.100',
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false,
        disableFontFace: false
      })
      
      if (data && data.text && data.text.trim().length > 0) {
        const cleanedText = this.cleanExtractedText(data.text)
        console.log(`[DocumentProcessor] pdf-parse extracted ${cleanedText.length} characters`)
        return cleanedText
      } else {
        throw new Error('pdf-parse returned empty text')
      }
      
    } catch (error) {
      console.error('[DocumentProcessor] pdf-parse extraction failed:', error)
      throw error
    }
  }

  /**
   * Improved fallback text extraction from PDF buffer
   */
  private static extractTextFromPdfBuffer(buffer: Buffer): string {
    try {
      console.log(`[DocumentProcessor] Fallback extraction: buffer size ${buffer.length} bytes`)
      
      // Convert buffer to string using UTF-8 encoding
      const pdfString = buffer.toString('utf8')
      console.log(`[DocumentProcessor] PDF string length: ${pdfString.length} characters`)
      
      // Look for text objects in PDF structure
      const textObjects = pdfString.match(/BT[\s\S]*?ET/g) || []
      console.log(`[DocumentProcessor] Found ${textObjects.length} text objects`)
      
      let extractedText = ''
      
      textObjects.forEach((obj, index) => {
        // Extract text from text objects
        const textMatches = obj.match(/\(([^)]+)\)/g) || []
        textMatches.forEach(match => {
          const text = match.replace(/[()]/g, '').trim()
          if (text.length > 0 && this.isReadableText(text)) {
            extractedText += text + ' '
          }
        })
      })
      
      console.log(`[DocumentProcessor] Extracted text from text objects: ${extractedText.length} characters`)
      
      // If no text objects found, try alternative method
      if (extractedText.trim().length === 0) {
        console.log(`[DocumentProcessor] No text from objects, trying alternative extraction...`)
        
        // Look for text between parentheses in the entire PDF
        const allTextMatches = pdfString.match(/\(([^)]+)\)/g) || []
        console.log(`[DocumentProcessor] Found ${allTextMatches.length} text matches in entire PDF`)
        
        allTextMatches.forEach(match => {
          const text = match.replace(/[()]/g, '').trim()
          if (text.length > 2 && this.isReadableText(text)) {
            extractedText += text + ' '
          }
        })
        
        console.log(`[DocumentProcessor] Extracted text from all matches: ${extractedText.length} characters`)
      }
      
      // Try a more aggressive text extraction method
      if (extractedText.trim().length === 0) {
        console.log(`[DocumentProcessor] Trying aggressive text extraction...`)
        
        // Look for any readable text patterns
        const textPatterns = [
          /[A-Za-z]{3,}/g,  // Words with 3+ letters
          /\b[A-Za-z]+\b/g, // Word boundaries
          /[A-Za-z0-9\s]{5,}/g // Mixed alphanumeric with spaces
        ]
        
        for (const pattern of textPatterns) {
          const matches = pdfString.match(pattern) || []
          for (const match of matches) {
            if (match.length > 3 && this.isReadableText(match)) {
              extractedText += match + ' '
            }
          }
        }
        
        console.log(`[DocumentProcessor] Aggressive extraction found: ${extractedText.length} characters`)
      }
      
      const cleanedText = this.cleanExtractedText(extractedText.trim())
      console.log(`[DocumentProcessor] Final cleaned text length: ${cleanedText.length} characters`)
      
      return cleanedText
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
   * Enhanced version for better PDF text processing
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove form feed and other PDF artifacts
      .replace(/\f/g, '') // Form feed characters
      .replace(/\u00A0/g, ' ') // Non-breaking spaces
      .replace(/\u00AD/g, '') // Soft hyphens
      .replace(/\u200B/g, '') // Zero-width space
      .replace(/\u200C/g, '') // Zero-width non-joiner
      .replace(/\u200D/g, '') // Zero-width joiner
      .replace(/\uFEFF/g, '') // Byte order mark
      
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\d+)([A-Z][a-z])/g, '$1 $2') // Add space between numbers and words
      .replace(/([a-z])(\d+)/g, '$1 $2') // Add space between letters and numbers
      
      // Normalize whitespace
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
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
   * Improved version that handles PDF content better
   */
  static splitIntoChunks(content: string, maxChunkSize: number = 1000): string[] {
    // Preprocess content for better chunking
    const preprocessedContent = this.preprocessContentForChunking(content)
    
    // Split by multiple delimiters to handle various text formats
    const sentences = preprocessedContent
      .split(/[.!?]+\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
        ? sentence 
        : sentence + '.'
      
      // Check if adding this sentence would exceed the chunk size
      if (currentChunk.length + sentenceWithPunctuation.length + 1 > maxChunkSize && currentChunk.length > 0) {
        // If the current chunk is too small, try to add part of the sentence
        if (currentChunk.length < maxChunkSize * 0.5 && sentenceWithPunctuation.length > maxChunkSize * 0.3) {
          // Split the sentence at a word boundary
          const words = sentenceWithPunctuation.split(/\s+/)
          let partialSentence = ''
          
          for (const word of words) {
            if (currentChunk.length + partialSentence.length + word.length + 1 <= maxChunkSize) {
              partialSentence += (partialSentence ? ' ' : '') + word
            } else {
              break
            }
          }
          
          if (partialSentence.length > 0) {
            currentChunk += (currentChunk ? ' ' : '') + partialSentence
          }
        }
        
        chunks.push(currentChunk.trim())
        currentChunk = sentenceWithPunctuation
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    // Filter out very small chunks that might not be useful
    return chunks.filter(chunk => chunk.length >= 50)
  }

  /**
   * Preprocess content to improve chunking quality
   */
  private static preprocessContentForChunking(content: string): string {
    return content
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add periods between camelCase
      .replace(/(\d+)\s*([A-Z][a-z])/g, '$1. $2') // Add periods between numbers and words
      // Remove excessive line breaks
      .replace(/\n\s*\n/g, '\n')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      .trim()
  }
}