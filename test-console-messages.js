// Using built-in fetch (Node.js 18+)

async function testConsoleMessages() {
  console.log('📺 Testing Console Messages for Document Retrieval...\n');

  try {
    // Test 1: Document search with console logging
    console.log('🔍 Test 1: Document search with detailed console logging...');
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 11, 
        query: 'Zoho Corporation company information and policies', 
        limit: 3 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Search API Response:');
      console.log(`   Query: ${searchData.data.query}`);
      console.log(`   Bot ID: ${searchData.data.botId}`);
      console.log(`   Total Results: ${searchData.data.totalResults}`);
      console.log(`   Search Method: ${searchData.data.searchMethod}`);
      
      console.log('\n📊 Search Results:');
      searchData.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Document: ${result.title}`);
        console.log(`      Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`      Relevance: ${result.relevance}`);
        console.log(`      Chunk: ${result.chunkIndex + 1}/${result.totalChunks}`);
        console.log(`      Content: "${result.content.substring(0, 150)}..."`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Chat with document context (this will show console messages in server logs)
    console.log('💬 Test 2: Chat with document context (check server console for detailed logs)...');
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 11,
        userId: 1,
        messages: [
          {
            role: 'user',
            content: 'Tell me about Zoho Corporation training programs and employee benefits'
          }
        ]
      })
    });

    const chatData = await chatResponse.json();
    
    if (chatData.success) {
      console.log('✅ Chat Response:');
      console.log(`   Response Length: ${chatData.message.length} characters`);
      console.log(`   Model: ${chatData.model}`);
      console.log(`   Response Time: ${chatData.response_time_ms}ms`);
      
      if (chatData.document_search) {
        console.log('\n📊 Document Search Info:');
        console.log(`   Total Documents: ${chatData.document_search.total_documents}`);
        console.log(`   Matches Found: ${chatData.document_search.matches_found}`);
        console.log(`   Query: ${chatData.document_search.query}`);
      }
      
      if (chatData.conversation_context) {
        console.log('\n🧠 Conversation Context:');
        console.log(`   Has Context: ${chatData.conversation_context.has_context}`);
        console.log(`   Context Length: ${chatData.conversation_context.context_length}`);
        console.log(`   Vector Search: ${chatData.conversation_context.vector_search_enabled}`);
      }
      
      console.log('\n🤖 AI Response Preview:');
      console.log(`   "${chatData.message.substring(0, 300)}..."`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Test 3: Multiple searches to show different console messages
    console.log('🔄 Test 3: Multiple searches to demonstrate console logging...');
    
    const testQueries = [
      'company policies',
      'employee benefits',
      'training programs',
      'Zoho Corporation history'
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      const response = await fetch('http://localhost:3000/api/search-documents-pinecone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: 11, query, limit: 2 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Found ${data.data.totalResults} results`);
        console.log(`   📊 Best match: ${data.data.results[0]?.title} (${(data.data.results[0]?.score * 100).toFixed(1)}%)`);
      } else {
        console.log(`   ❌ Search failed: ${data.error}`);
      }
    }

    console.log('\n🎉 Console Messages Test Complete!');
    console.log('\n📋 Summary of Console Messages You Should See:');
    console.log('   🔍 [Pinecone Documents] Searching documents for bot X with query: "..."');
    console.log('   📝 [Pinecone Documents] DeepSeek extracted features: ...');
    console.log('   ✅ [Pinecone Documents] Generated embedding using DeepSeek features');
    console.log('   📊 [Pinecone Documents] Found X relevant document chunks');
    console.log('   📄 [Chat API] Document context length: X characters');
    console.log('   🎯 [Chat API] Average relevance score: X%');
    console.log('   📝 [Chat API] Document context preview: ...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConsoleMessages();
