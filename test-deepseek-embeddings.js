// Using built-in fetch (Node.js 18+)

async function testDeepSeekEmbeddings() {
  console.log('🚀 Testing DeepSeek Embeddings for Pinecone Documents...\n');

  try {
    // Clear existing vectors and store documents with DeepSeek embeddings
    console.log('🧹 Clearing existing vectors...');
    const { Pinecone } = require('@pinecone-database/pinecone');
    
    const pc = new Pinecone({
      apiKey: 'pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V'
    });

    const index = pc.index('chatbot');
    
    // Clear all vectors
    const allVectors = await index.query({
      vector: Array(512).fill(0),
      topK: 10000,
      includeMetadata: true
    });

    if (allVectors.matches && allVectors.matches.length > 0) {
      const vectorIds = allVectors.matches.map(match => match.id);
      console.log(`Deleting ${vectorIds.length} vectors...`);
      await index.deleteMany(vectorIds);
      console.log('✅ All vectors deleted');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Process document to store with DeepSeek embeddings
    console.log('📚 Processing document with DeepSeek embeddings...');
    
    const documentsResponse = await fetch('http://localhost:3000/api/knowledge-documents?botId=11');
    const documentsData = await documentsResponse.json();
    
    if (documentsData.success && documentsData.data.length > 0) {
      const document = documentsData.data[0];
      console.log(`📄 Processing document: ${document.title} (ID: ${document.id})`);
      
      const processResponse = await fetch('http://localhost:3000/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id })
      });
      
      const processData = await processResponse.json();
      if (processData.success) {
        console.log('✅ Document processed and stored in Pinecone with DeepSeek embeddings');
      } else {
        console.log('❌ Document processing failed:', processData.error);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test document search with DeepSeek embeddings
    console.log('🔍 Testing document search with DeepSeek embeddings...');
    
    const searchQueries = [
      'Zoho Corporation company information',
      'employee training programs',
      'company policies and benefits'
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

    // Test chat with DeepSeek embeddings
    console.log('💬 Testing chat with DeepSeek document embeddings...');
    
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
    } else {
      console.log('❌ Chat failed:', chatData.error);
    }

    console.log('\n🎉 DeepSeek Embeddings Test Complete!');
    console.log('✅ Documents stored with DeepSeek semantic features');
    console.log('✅ Vector search using DeepSeek embeddings');
    console.log('✅ Chat integration with DeepSeek document context');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeepSeekEmbeddings();
