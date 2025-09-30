// Comprehensive test for fixed PDF extraction
const fs = require('fs')
const path = require('path')

async function testPdfExtraction() {
  try {
    console.log('🧪 Testing Fixed PDF Extraction...\n')
    
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
    
    // Test 1: pdfjs-dist extraction
    console.log('\n1️⃣ Testing pdfjs-dist extraction...')
    try {
      const pdfjsLib = require('pdfjs-dist')
      const dataBuffer = fs.readFileSync(pdfPath)
      const uint8Array = new Uint8Array(dataBuffer)
      
      console.log(`Buffer size: ${dataBuffer.length} bytes`)
      console.log(`Uint8Array size: ${uint8Array.length} bytes`)
      
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
        verbosity: 0
      })
      
      const pdfDocument = await loadingTask.promise
      console.log(`✅ PDF loaded: ${pdfDocument.numPages} pages`)
      
      let fullText = ''
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine text items
        const pageText = textContent.items
          .map((item) => item.str)
          .join(' ')
          .trim()
        
        if (pageText) {
          fullText += pageText + '\n'
        }
        
        console.log(`Page ${pageNum}: ${pageText.length} characters`)
      }
      
      await pdfDocument.destroy()
      
      console.log(`✅ pdfjs-dist extraction successful: ${fullText.length} characters`)
      console.log('First 200 characters:', fullText.substring(0, 200) + '...')
      
    } catch (error) {
      console.error('❌ pdfjs-dist failed:', error.message)
    }
    
    // Test 2: pdf-parse extraction
    console.log('\n2️⃣ Testing pdf-parse extraction...')
    try {
      const pdfParse = require('pdf-parse')
      const dataBuffer = fs.readFileSync(pdfPath)
      
      const data = await pdfParse(dataBuffer, {
        max: 0,
        normalizeWhitespace: true,
        disableCombineTextItems: false
      })
      
      if (data && data.text) {
        console.log('✅ pdf-parse extraction successful!')
        console.log('Content length:', data.text.length)
        console.log('Pages:', data.numpages)
        console.log('First 200 characters:', data.text.substring(0, 200) + '...')
      } else {
        console.error('❌ pdf-parse returned empty text')
      }
      
    } catch (error) {
      console.error('❌ pdf-parse failed:', error.message)
    }
    
    // Test 3: Custom fallback extraction
    console.log('\n3️⃣ Testing custom fallback extraction...')
    try {
      const dataBuffer = fs.readFileSync(pdfPath)
      const pdfString = dataBuffer.toString('utf8')
      
      console.log(`PDF string length: ${pdfString.length} characters`)
      
      // Look for text objects
      const textObjects = pdfString.match(/BT[\s\S]*?ET/g) || []
      console.log(`Found ${textObjects.length} text objects`)
      
      let extractedText = ''
      
      textObjects.forEach((obj) => {
        const textMatches = obj.match(/\(([^)]+)\)/g) || []
        textMatches.forEach(match => {
          const text = match.replace(/[()]/g, '').trim()
          if (text.length > 0) {
            extractedText += text + ' '
          }
        })
      })
      
      console.log(`Custom extraction: ${extractedText.length} characters`)
      if (extractedText.length > 0) {
        console.log('First 200 characters:', extractedText.substring(0, 200) + '...')
      }
      
    } catch (error) {
      console.error('❌ Custom extraction failed:', error.message)
    }
    
    console.log('\n✅ PDF extraction test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testPdfExtraction()
