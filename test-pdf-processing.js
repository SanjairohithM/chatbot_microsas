// Test script to verify PDF processing
const fs = require('fs')
const path = require('path')

async function testPdfProcessing() {
  try {
    console.log('📄 Testing PDF processing...')
    
    // Test with your actual PDF file
    const pdfPath = path.join(__dirname, 'secure-uploads', '1759231824420_Wikipedia__The_Free_Online_Encyclopedia.pdf')
    
    console.log(`Testing PDF: ${pdfPath}`)
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath)
      return
    }
    
    const stats = fs.statSync(pdfPath)
    console.log(`File size: ${stats.size} bytes`)
    
    // Test the API endpoint
    console.log('\n1️⃣ Testing PDF processing via API...')
    
    const response = await fetch('http://localhost:3000/api/documents/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: 18 // Use your document ID
      })
    })
    
    console.log(`API response status: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ PDF processing successful!')
      console.log('Content length:', result.data?.content?.length || 0)
      console.log('Status:', result.data?.status)
      console.log('Pinecone stored:', result.pinecone_stored)
      
      if (result.data?.content) {
        console.log('\nFirst 200 characters of content:')
        console.log(result.data.content.substring(0, 200) + '...')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ PDF processing failed:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testPdfProcessing()
