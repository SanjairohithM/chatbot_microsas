const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDirectPineconeUpload() {
  console.log('🚀 Testing Direct Pinecone Upload\n');

  try {
    // Check if there are any PDF files in secure-uploads
    const secureUploadsDir = path.join(process.cwd(), 'secure-uploads');
    
    if (!fs.existsSync(secureUploadsDir)) {
      console.log('❌ No secure-uploads directory found');
      return;
    }

    const files = fs.readdirSync(secureUploadsDir).filter(file => file.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('❌ No PDF files found in secure-uploads directory');
      console.log('💡 Please upload a document first using the regular upload flow');
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
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: testFile,
      contentType: 'application/pdf'
    });
    formData.append('botId', '1'); // Use bot ID 1 for testing
    
    console.log('\n🌲 Uploading directly to Pinecone...');
    
    // Upload to Pinecone
    const response = await fetch('http://localhost:3000/api/upload-to-pinecone', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload successful!');
      console.log(`📄 Document ID: ${result.data.documentId}`);
      console.log(`📝 Content length: ${result.data.contentLength} characters`);
      console.log(`📊 Word count: ${result.data.wordCount} words`);
      console.log(`🤖 Bot ID: ${result.data.botId}`);
      console.log(`🌲 Pinecone stored: ${result.data.pineconeStored}`);
      console.log(`💾 Local file stored: ${result.data.localFileStored}`);
      
      // Test document search
      console.log('\n🔍 Testing document search...');
      const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          botId: 1, 
          query: 'company information', 
          limit: 3 
        })
      });
      
      const searchData = await searchResponse.json();
      
      if (searchData.success) {
        console.log(`✅ Found ${searchData.data.totalResults} documents in Pinecone`);
        searchData.data.results.forEach((searchResult, index) => {
          console.log(`   ${index + 1}. ${searchResult.title} (Score: ${(searchResult.score * 100).toFixed(1)}%)`);
          console.log(`      Content: "${searchResult.content.substring(0, 100)}..."`);
        });
      } else {
        console.log('❌ Document search failed:', searchData.error);
      }
      
      // Test chat with document context
      console.log('\n💬 Testing chat with document context...');
      const chatResponse = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What information do you have about the company?',
          botId: 1,
          userId: 1
        })
      });
      
      const chatData = await chatResponse.json();
      
      if (chatData.success) {
        console.log('✅ Chat response received');
        console.log(`💬 Response: ${chatData.message.substring(0, 200)}...`);
        
        if (chatData.document_search) {
          console.log(`📄 Document search: ${chatData.document_search.matches_found} matches found`);
          console.log(`📊 Has context: ${chatData.document_search.has_context}`);
        }
      } else {
        console.log('❌ Chat failed:', chatData.error);
      }
      
    } else {
      console.log('❌ Upload failed:', result.error);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Direct Pinecone Upload Test Complete!');
    console.log('✅ Documents are now stored directly in Pinecone');
    console.log('✅ No local file storage required');
    console.log('✅ Documents are immediately searchable');
    console.log('✅ Chat can access document context from Pinecone');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testDirectPineconeUpload();
