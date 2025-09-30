// Simple test for PDF processing without API
const fs = require('fs')
const path = require('path')

async function testPdfProcessing() {
  try {
    console.log('🧪 Testing PDF processing directly...\n')
    
    // Test with a sample PDF file
    const pdfPath = path.join(__dirname, 'secure-uploads', '1759231824420_Wikipedia__The_Free_Online_Encyclopedia.pdf')
    
    console.log(`Testing PDF: ${pdfPath}`)
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath)
      return
    }
    
    const stats = fs.statSync(pdfPath)
    console.log(`File size: ${stats.size} bytes`)
    
    // Test pdf-parse directly
    console.log('\n1️⃣ Testing pdf-parse directly...')
    
    try {
      const pdfParse = require('pdf-parse')
      const dataBuffer = fs.readFileSync(pdfPath)
      
      console.log(`Buffer size: ${dataBuffer.length} bytes`)
      
      const data = await pdfParse(dataBuffer, {
        max: 0,
        normalizeWhitespace: true,
        disableCombineTextItems: false
      })
      
      if (data && data.text) {
        console.log('✅ PDF parsing successful!')
        console.log('Content length:', data.text.length)
        console.log('Pages:', data.numpages)
        
        console.log('\nFirst 200 characters of content:')
        console.log(data.text.substring(0, 200) + '...')
        
        // Test chunking
        console.log('\n2️⃣ Testing chunking...')
        const sentences = data.text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0)
        console.log(`Found ${sentences.length} sentences`)
        
        const chunks = []
        let currentChunk = ''
        const maxChunkSize = 500
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())
            currentChunk = sentence
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence
          }
        }
        
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim())
        }
        
        console.log(`Generated ${chunks.length} chunks`)
        chunks.forEach((chunk, index) => {
          console.log(`Chunk ${index + 1}: ${chunk.length} chars - "${chunk.substring(0, 100)}..."`)
        })
        
      } else {
        console.error('❌ No text extracted from PDF')
      }
      
    } catch (error) {
      console.error('❌ PDF parsing failed:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testPdfProcessing()
