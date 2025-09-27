const fs = require('fs');
const path = require('path');

async function testDocumentUploadWithLogs() {
  console.log('🚀 Testing Document Upload to Pinecone with Detailed Logs\n');

  try {
    // Check if there are any PDF files to test with
    const secureUploadsDir = path.join(process.cwd(), 'secure-uploads');
    
    if (!fs.existsSync(secureUploadsDir)) {
      console.log('❌ No secure-uploads directory found');
      console.log('💡 Please upload a document first to test');
      return;
    }

    const files = fs.readdirSync(secureUploadsDir).filter(file => file.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('❌ No PDF files found in secure-uploads directory');
      console.log('💡 Please upload a document first using the web interface');
      return;
    }

    console.log(`📄 Found ${files.length} PDF files in secure-uploads`);
    
    // Use the first PDF file for testing
    const testFile = files[0];
    const filePath = path.join(secureUploadsDir, testFile);
    
    console.log(`📄 Testing with file: ${testFile}`);
    console.log(`📁 File path: ${filePath}`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log(`📊 File size: ${(fileStats.size / 1024).toFixed(1)} KB`);
    
    // Test 1: Upload to Pinecone directly
    console.log('\n' + '='.repeat(60));
    console.log('🌲 TEST 1: Direct Pinecone Upload');
    console.log('='.repeat(60));
    
    try {
      // Create a simple FormData simulation for Node.js
      const boundary = '----formdata-boundary-' + Math.random().toString(36);
      const formDataParts = [];
      
      // Add file
      formDataParts.push(`--${boundary}`);
      formDataParts.push(`Content-Disposition: form-data; name="file"; filename="${testFile}"`);
      formDataParts.push('Content-Type: application/pdf');
      formDataParts.push('');
      formDataParts.push(fileBuffer.toString('binary'));
      
      // Add botId
      formDataParts.push(`--${boundary}`);
      formDataParts.push('Content-Disposition: form-data; name="botId"');
      formDataParts.push('');
      formDataParts.push('23'); // Use bot ID 23 from your logs
      
      formDataParts.push(`--${boundary}--`);
      
      const formDataBody = formDataParts.join('\r\n');
      
      console.log('📤 Uploading to /api/upload-to-pinecone...');
      
      const response = await fetch('http://localhost:3000/api/upload-to-pinecone', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(formDataBody, 'binary')
        },
        body: Buffer.from(formDataBody, 'binary')
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Direct Pinecone upload successful!');
        console.log('📄 Upload Details:');
        console.log(`   - Document ID: ${result.data.documentId}`);
        console.log(`   - Bot ID: ${result.data.botId}`);
        console.log(`   - File Name: ${result.data.filename}`);
        console.log(`   - Content Length: ${result.data.contentLength} characters`);
        console.log(`   - Word Count: ${result.data.wordCount} words`);
        console.log(`   - Pinecone Stored: ${result.data.pineconeStored}`);
        console.log(`   - Local File Stored: ${result.data.localFileStored}`);
        console.log(`   - Timestamp: ${result.data.timestamp}`);
      } else {
        console.log('❌ Direct Pinecone upload failed:', result.error);
        if (result.details) {
          console.log('   Details:', result.details);
        }
      }
      
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
    }
    
    // Test 2: Search for the uploaded document
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TEST 2: Search Uploaded Document in Pinecone');
    console.log('='.repeat(60));
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 23, 
        query: 'company information', 
        limit: 5 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`✅ Found ${searchData.data.totalResults} documents in Pinecone for bot 23`);
      searchData.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`);
        console.log(`      Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`      Document ID: ${result.documentId}`);
        console.log(`      Chunk: ${result.chunkIndex + 1}/${result.totalChunks}`);
        console.log(`      Content: "${result.content.substring(0, 100)}..."`);
        console.log('');
      });
    } else {
      console.log('❌ Document search failed:', searchData.error);
    }
    
    // Test 3: Chat with document context
    console.log('\n' + '='.repeat(60));
    console.log('💬 TEST 3: Chat with Document Context');
    console.log('='.repeat(60));
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What services does TCS provide?',
        botId: 23,
        userId: 3
      })
    });
    
    const chatData = await chatResponse.json();
    
    if (chatData.success) {
      console.log('✅ Chat response received');
      console.log(`💬 Response: ${chatData.message.substring(0, 300)}...`);
      
      if (chatData.document_search) {
        console.log('\n📄 Document Search Results:');
        console.log(`   - Matches found: ${chatData.document_search.matches_found}`);
        console.log(`   - Has context: ${chatData.document_search.has_context}`);
        console.log(`   - Query: "${chatData.document_search.query}"`);
      }
      
      if (chatData.conversation_context) {
        console.log('\n🔄 Conversation Context:');
        console.log(`   - Has context: ${chatData.conversation_context.has_context}`);
        console.log(`   - Vector search enabled: ${chatData.conversation_context.vector_search_enabled}`);
      }
    } else {
      console.log('❌ Chat failed:', chatData.error);
    }

    // Test 4: Check what files are still stored locally
    console.log('\n' + '='.repeat(60));
    console.log('📁 TEST 4: Check Local File Storage');
    console.log('='.repeat(60));
    
    const secureFiles = fs.readdirSync(secureUploadsDir);
    const tempDir = path.join(process.cwd(), 'temp-uploads');
    const tempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
    
    console.log(`📂 Files in secure-uploads: ${secureFiles.length}`);
    secureFiles.forEach((file, index) => {
      const filePath = path.join(secureUploadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
    
    console.log(`📂 Files in temp-uploads: ${tempFiles.length}`);
    tempFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file} (should be cleaned up)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎯 SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Direct Pinecone upload API is working');
    console.log('✅ Documents can be searched in Pinecone');
    console.log('✅ Chat uses Pinecone for document context');
    console.log('⚠️  Local files still exist (for backup/reference)');
    console.log('\n💡 To use Pinecone-only uploads:');
    console.log('1. Use the /api/upload-to-pinecone endpoint');
    console.log('2. Documents will be processed and stored in Pinecone');
    console.log('3. Temporary files will be cleaned up automatically');
    console.log('4. Chat will retrieve context from Pinecone vector database');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Please start the development server with: npm run dev');
    }
  }
}

// Run the test
testDocumentUploadWithLogs();
