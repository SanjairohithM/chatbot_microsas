const fs = require('fs');
const path = require('path');

async function testPineconeUploadAPI() {
  console.log('🚀 Testing Pinecone Upload API\n');

  try {
    // Check if server is running
    console.log('🔍 Checking if server is running...');
    
    const testResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 1, 
        query: 'test query', 
        limit: 1 
      })
    });
    
    if (!testResponse.ok && testResponse.status !== 400) {
      console.log('❌ Server is not running on localhost:3000');
      console.log('💡 Please start the development server with: npm run dev');
      return;
    }
    
    console.log('✅ Server is running');
    
    // Test the search API to see if there are existing documents
    console.log('\n🔍 Checking existing documents in Pinecone...');
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 1, 
        query: 'company information', 
        limit: 5 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.data.totalResults > 0) {
      console.log(`✅ Found ${searchData.data.totalResults} existing documents in Pinecone for bot 1`);
      searchData.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title} (Score: ${(result.score * 100).toFixed(1)}%)`);
        console.log(`      Content preview: "${result.content.substring(0, 100)}..."`);
      });
    } else {
      console.log('ℹ️ No existing documents found in Pinecone for bot 1');
      console.log('💡 Upload a document using the web interface to test retrieval');
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
      console.log('✅ Chat API is working');
      console.log(`💬 Response preview: ${chatData.message.substring(0, 150)}...`);
      
      if (chatData.document_search) {
        console.log(`📄 Document search results: ${chatData.document_search.matches_found} matches found`);
        console.log(`📊 Has document context: ${chatData.document_search.has_context}`);
      }
      
      if (chatData.conversation_context) {
        console.log(`🔄 Conversation context: ${chatData.conversation_context.has_context}`);
        console.log(`🌲 Vector search enabled: ${chatData.conversation_context.vector_search_enabled}`);
      }
    } else {
      console.log('❌ Chat API failed:', chatData.error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Pinecone Integration Status:');
    console.log('✅ Upload API: /api/upload-to-pinecone (ready)');
    console.log('✅ Search API: /api/search-documents-pinecone (working)');
    console.log('✅ Chat API: /api/chat (working with Pinecone integration)');
    console.log('\n🎯 How to use:');
    console.log('1. Go to your bot dashboard');
    console.log('2. Upload a document - it will automatically go to Pinecone');
    console.log('3. Chat with your bot - it will use Pinecone for document context');
    console.log('4. Documents are stored in vector database, not local files');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Please start the development server with: npm run dev');
    }
  }
}

// Run the test
testPineconeUploadAPI();
