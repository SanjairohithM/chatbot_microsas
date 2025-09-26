// Using built-in fetch (Node.js 18+)

async function testDocumentContext() {
  console.log('🔍 Testing Document Context with Correct Bot ID...\n');

  try {
    // Test chat with Bot ID 17 (where documents are stored)
    console.log('💬 Testing chat with Bot ID 17 (where documents are stored)...');
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 17, // Use the bot ID where documents are stored
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
        console.log('\n📊 Document Search Info:');
        console.log(`   Query: "${chatData.document_search.query}"`);
        console.log(`   Matches Found: ${chatData.document_search.matches_found}`);
      }
      
      if (chatData.conversation_context) {
        console.log('\n🧠 Conversation Context:');
        console.log(`   Has Context: ${chatData.conversation_context.has_context}`);
        console.log(`   Context Length: ${chatData.conversation_context.context_length}`);
        console.log(`   Vector Search: ${chatData.conversation_context.vector_search_enabled}`);
      }
      
      console.log('\n🤖 AI Response Preview:');
      console.log(`   "${chatData.message.substring(0, 300)}..."`);
      
      // Check if the response mentions document content
      if (chatData.message.toLowerCase().includes('zoho corporation handbook') || 
          chatData.message.toLowerCase().includes('document')) {
        console.log('\n✅ SUCCESS: AI is using document context!');
      } else {
        console.log('\n⚠️ WARNING: AI may not be using document context');
      }
      
    } else {
      console.log('❌ Chat failed:', chatData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test document search directly
    console.log('🔍 Testing direct document search...');
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 17, 
        query: 'Zoho Corporation company information', 
        limit: 3 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Document search successful!');
      console.log(`   Found ${searchData.data.totalResults} results`);
      console.log(`   Search method: ${searchData.data.searchMethod}`);
      
      searchData.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title} (Score: ${(result.score * 100).toFixed(1)}%)`);
        console.log(`      Content: "${result.content.substring(0, 100)}..."`);
      });
    } else {
      console.log('❌ Document search failed:', searchData.error);
    }

    console.log('\n🎉 Document Context Test Complete!');
    console.log('\n💡 Solution: Use Bot ID 17 in your chat to get document context');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDocumentContext();
