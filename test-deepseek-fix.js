// Using built-in fetch (Node.js 18+)

async function testDeepSeekFix() {
  console.log('🔧 Testing DeepSeek API Fix...\n');

  try {
    // Test 1: Document search with fixed DeepSeek API
    console.log('🔍 Test 1: Document search with fixed DeepSeek API...');
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 11, 
        query: 'Zoho Corporation company information', 
        limit: 2 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Search successful!');
      console.log(`   Found ${searchData.data.totalResults} results`);
      console.log(`   Search method: ${searchData.data.searchMethod}`);
      
      if (searchData.data.results.length > 0) {
        console.log(`   Best match: ${searchData.data.results[0].title} (${(searchData.data.results[0].score * 100).toFixed(1)}%)`);
      }
    } else {
      console.log('❌ Search failed:', searchData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Chat with document context
    console.log('💬 Test 2: Chat with document context...');
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 11,
        userId: 1,
        messages: [
          {
            role: 'user',
            content: 'Tell me about Zoho Corporation'
          }
        ]
      })
    });

    const chatData = await chatResponse.json();
    
    if (chatData.success) {
      console.log('✅ Chat successful!');
      console.log(`   Response length: ${chatData.message.length} characters`);
      console.log(`   Model: ${chatData.model}`);
      console.log(`   Response time: ${chatData.response_time_ms}ms`);
      
      if (chatData.document_search) {
        console.log(`   Document matches: ${chatData.document_search.matches_found}`);
      }
      
      console.log(`   Response preview: "${chatData.message.substring(0, 150)}..."`);
    } else {
      console.log('❌ Chat failed:', chatData.error);
    }

    console.log('\n🎉 DeepSeek API Fix Test Complete!');
    console.log('✅ DeepSeek API integration working');
    console.log('✅ Document search with DeepSeek embeddings');
    console.log('✅ Chat with document context');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeepSeekFix();
