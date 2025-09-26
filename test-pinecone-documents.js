// Using built-in fetch (Node.js 18+)

async function testPineconeDocuments() {
  console.log('📚 Testing Pinecone Document Storage and Retrieval...\n');

  try {
    // Test 1: Process a document to store it in Pinecone
    console.log('📝 Test 1: Processing document to store in Pinecone...');
    
    // First, let's check what documents we have
    const documentsResponse = await fetch('http://localhost:3000/api/knowledge-documents?botId=11');
    const documentsData = await documentsResponse.json();
    
    if (documentsData.success && documentsData.data.length > 0) {
      const document = documentsData.data[0];
      console.log(`📄 Found document: ${document.title} (ID: ${document.id})`);
      console.log(`📊 Status: ${document.status}, Content length: ${document.content?.length || 0}`);
      
      // Process the document to store it in Pinecone
      if (document.status !== 'indexed' || !document.content) {
        console.log('🔄 Processing document...');
        const processResponse = await fetch('http://localhost:3000/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id })
        });
        
        const processData = await processResponse.json();
        if (processData.success) {
          console.log('✅ Document processed successfully');
          console.log('📊 Pinecone stored:', processData.pinecone_stored);
        } else {
          console.log('❌ Document processing failed:', processData.error);
        }
      } else {
        console.log('✅ Document already processed');
      }
    } else {
      console.log('❌ No documents found for bot 11');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Search documents using Pinecone
    console.log('🔍 Test 2: Searching documents in Pinecone...');
    
    const searchQueries = [
      'Zoho Corporation',
      'company policies',
      'employee benefits',
      'training programs'
    ];

    for (const query of searchQueries) {
      console.log(`\n🔍 Searching for: "${query}"`);
      
      const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: 11, query, limit: 3 })
      });
      
      const searchData = await searchResponse.json();
      
      if (searchData.success) {
        console.log(`✅ Found ${searchData.data.totalResults} results`);
        searchData.data.results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.title} (Score: ${(result.score * 100).toFixed(1)}%)`);
          console.log(`      Chunk ${result.chunkIndex + 1}/${result.totalChunks}: "${result.content.substring(0, 100)}..."`);
        });
      } else {
        console.log(`❌ Search failed: ${searchData.error}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Test chat with Pinecone document search
    console.log('💬 Test 3: Testing chat with Pinecone document search...');
    
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 11,
        userId: 1,
        messages: [
          {
            role: 'user',
            content: 'What can you tell me about Zoho Corporation based on the documents?'
          }
        ]
      })
    });

    const chatData = await chatResponse.json();
    
    if (chatData.success) {
      console.log('✅ Chat successful!');
      console.log('🤖 Response:', chatData.message.substring(0, 200) + '...');
      
      if (chatData.document_search) {
        console.log('📊 Document Search Results:');
        console.log(`   Total documents: ${chatData.document_search.total_documents}`);
        console.log(`   Matches found: ${chatData.document_search.matches_found}`);
        console.log(`   Search method: ${chatData.document_search.summary ? 'Traditional' : 'Pinecone'}`);
      }
    } else {
      console.log('❌ Chat failed:', chatData.error);
    }

    console.log('\n🎉 Pinecone Document Testing Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPineconeDocuments();
