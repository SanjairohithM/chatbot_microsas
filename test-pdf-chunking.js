// Test script to verify PDF chunking improvements
const fs = require('fs')
const path = require('path')

// Mock the config for testing
const mockConfig = {
  pinecone: {
    chunkSize: 1000,
    chunkOverlap: 200
  }
}

// Mock the DocumentProcessorService for testing
class TestDocumentProcessorService {
  static preprocessContentForChunking(content) {
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

  static splitIntoChunks(content, maxChunkSize = 1000) {
    // Preprocess content for better chunking
    const preprocessedContent = this.preprocessContentForChunking(content)
    
    // Split by multiple delimiters to handle various text formats
    const sentences = preprocessedContent
      .split(/[.!?]+\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    const chunks = []
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
}

// Mock the PineconeDocumentService for testing
class TestPineconeDocumentService {
  static preprocessContentForChunking(content) {
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
      // Remove common PDF artifacts
      .replace(/\f/g, '') // Form feed characters
      .replace(/\u00A0/g, ' ') // Non-breaking spaces
      .trim()
  }

  static isLowQualityChunk(chunk) {
    // Check for very short chunks
    if (chunk.length < 50) return true
    
    // Check for chunks with mostly special characters
    const specialCharRatio = (chunk.match(/[^a-zA-Z0-9\s]/g) || []).length / chunk.length
    if (specialCharRatio > 0.7) return true
    
    // Check for chunks with mostly numbers
    const numberRatio = (chunk.match(/\d/g) || []).length / chunk.length
    if (numberRatio > 0.8) return true
    
    // Check for chunks with very few words
    const wordCount = chunk.split(/\s+/).length
    if (wordCount < 5) return true
    
    // Check for chunks that are mostly repeated characters
    const uniqueChars = new Set(chunk.toLowerCase()).size
    if (uniqueChars < 5) return true
    
    return false
  }

  static splitIntoChunks(content, chunkSize = 1000, overlap = 200) {
    // Preprocess content for better chunking
    const preprocessedContent = this.preprocessContentForChunking(content)
    
    const chunks = []
    let start = 0
    
    while (start < preprocessedContent.length) {
      const end = Math.min(start + chunkSize, preprocessedContent.length)
      let chunk = preprocessedContent.substring(start, end)
      
      // Try to break at natural boundaries
      if (end < preprocessedContent.length) {
        // Look for sentence boundaries first
        const lastSentence = chunk.lastIndexOf('.')
        const lastExclamation = chunk.lastIndexOf('!')
        const lastQuestion = chunk.lastIndexOf('?')
        const lastNewline = chunk.lastIndexOf('\n')
        const lastParagraph = chunk.lastIndexOf('\n\n')
        
        // Find the best break point
        const breakPoints = [lastSentence, lastExclamation, lastQuestion, lastParagraph, lastNewline]
          .filter(point => point > start + chunkSize * 0.3) // Don't break too early
          .sort((a, b) => b - a) // Sort descending
        
        const breakPoint = breakPoints[0] || lastNewline
        
        if (breakPoint > start + chunkSize * 0.5) {
          chunk = preprocessedContent.substring(start, start + breakPoint + 1)
          start = start + breakPoint + 1 - overlap
        } else {
          // If no good break point, try to break at word boundary
          const lastSpace = chunk.lastIndexOf(' ')
          if (lastSpace > start + chunkSize * 0.7) {
            chunk = preprocessedContent.substring(start, start + lastSpace)
            start = start + lastSpace + 1 - overlap
          } else {
            start = end - overlap
          }
        }
      } else {
        start = end
      }
      
      // Clean up the chunk
      const cleanedChunk = chunk.trim()
      if (cleanedChunk.length > 0) {
        chunks.push(cleanedChunk)
      }
    }
    
    // Filter out very small chunks and ensure minimum quality
    return chunks.filter(chunk => 
      chunk.length >= 50 && // Minimum length
      !this.isLowQualityChunk(chunk) // Quality check
    )
  }
}

async function testPdfChunking() {
  try {
    console.log('🧪 Testing PDF chunking improvements...\n')
    
    // Test with sample PDF-like content
    const sampleContent = `
    This is a sample PDF document with some text. It contains multiple sentences and paragraphs.
    
    The document has various formatting issues that commonly occur in PDF extraction.
    For example, there might be camelCase words that need spacing.
    There could also be numbers123 followed by words that need separation.
    
    Some sentences might be very long and need to be split properly at natural boundaries.
    Other sentences might be short and should be combined with adjacent content.
    
    The chunking algorithm should handle these cases gracefully and create meaningful chunks.
    Each chunk should be between 50 and 1000 characters ideally.
    The overlap between chunks should help maintain context across boundaries.
    
    This is the end of our sample content for testing purposes.
    `
    
    console.log('📄 Original content length:', sampleContent.length, 'characters')
    console.log('📄 Original content preview:', sampleContent.substring(0, 200) + '...\n')
    
    // Test DocumentProcessorService chunking
    console.log('1️⃣ Testing DocumentProcessorService.splitIntoChunks...')
    const docChunks = TestDocumentProcessorService.splitIntoChunks(sampleContent, 500)
    console.log(`   Generated ${docChunks.length} chunks`)
    docChunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.length} chars - "${chunk.substring(0, 100)}..."`)
    })
    console.log()
    
    // Test PineconeDocumentService chunking
    console.log('2️⃣ Testing PineconeDocumentService.splitIntoChunks...')
    const pineconeChunks = TestPineconeDocumentService.splitIntoChunks(sampleContent, 500, 100)
    console.log(`   Generated ${pineconeChunks.length} chunks`)
    pineconeChunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.length} chars - "${chunk.substring(0, 100)}..."`)
    })
    console.log()
    
    // Test with problematic PDF content
    console.log('3️⃣ Testing with problematic PDF content...')
    const problematicContent = `
    ThisIsCamelCase text123Numbers and other issues.
    Some text with    multiple    spaces.
    
    Text with form feeds and other artifacts.
    Numbers123Words that need separation.
    Very short.
    `
    
    console.log('📄 Problematic content:', problematicContent)
    const problematicChunks = TestPineconeDocumentService.splitIntoChunks(problematicContent, 300, 50)
    console.log(`   Generated ${problematicChunks.length} chunks after filtering`)
    problematicChunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.length} chars - "${chunk}"`)
    })
    
    console.log('\n✅ PDF chunking test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testPdfChunking()
