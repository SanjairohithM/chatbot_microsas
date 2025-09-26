const { Pinecone } = require('@pinecone-database/pinecone');

// Configuration
const PINECONE_API_KEY = 'pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V';
const INDEX_NAME = 'chatbot';

async function debugPineconeDocuments() {
  console.log('🔍 Debugging Pinecone Documents...\n');

  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: PINECONE_API_KEY
    });

    const index = pc.index(INDEX_NAME);
    console.log('✅ Connected to Pinecone index:', INDEX_NAME);

    // Check what's actually stored in Pinecone
    console.log('\n📊 Checking index stats...');
    const stats = await index.describeIndexStats();
    console.log('Index stats:', JSON.stringify(stats, null, 2));

    // Query all vectors to see what's stored
    console.log('\n🔍 Querying all vectors...');
    const allVectors = await index.query({
      vector: Array(512).fill(0), // Dummy vector
      topK: 20,
      includeMetadata: true
    });

    console.log(`Found ${allVectors.matches?.length || 0} vectors:`);
    
    let documentVectors = 0;
    let chatVectors = 0;
    
    allVectors.matches?.forEach((match, index) => {
      const metadata = match.metadata;
      const isDocument = metadata?.documentId !== undefined;
      const isChat = metadata?.conversationId !== undefined;
      
      if (isDocument) {
        documentVectors++;
        console.log(`\n📄 Document Vector ${documentVectors}:`);
        console.log(`   ID: ${match.id}`);
        console.log(`   Document ID: ${metadata.documentId}`);
        console.log(`   Bot ID: ${metadata.botId}`);
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Chunk: ${metadata.chunkIndex}/${metadata.totalChunks}`);
        console.log(`   Content: "${metadata.content?.substring(0, 100)}..."`);
      } else if (isChat) {
        chatVectors++;
        console.log(`\n💬 Chat Vector ${chatVectors}:`);
        console.log(`   ID: ${match.id}`);
        console.log(`   Conversation ID: ${metadata.conversationId}`);
        console.log(`   Bot ID: ${metadata.botId}`);
        console.log(`   Role: ${metadata.role}`);
        console.log(`   Content: "${metadata.content?.substring(0, 100)}..."`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   📄 Document vectors: ${documentVectors}`);
    console.log(`   💬 Chat vectors: ${chatVectors}`);
    console.log(`   📊 Total vectors: ${allVectors.matches?.length || 0}`);

    if (documentVectors === 0) {
      console.log('\n❌ No document vectors found in Pinecone!');
      console.log('🔧 This means your PDF documents are not stored in Pinecone yet.');
      console.log('💡 You need to process the documents from the uploads folder.');
    } else {
      console.log('\n✅ Document vectors found in Pinecone!');
      console.log('🔍 Testing document search...');
      
      // Test document search
      const searchResponse = await index.query({
        vector: Array(512).fill(0), // Dummy vector
        filter: {
          documentId: { $exists: true }
        },
        topK: 3,
        includeMetadata: true
      });

      console.log(`Found ${searchResponse.matches?.length || 0} document vectors in search`);
      searchResponse.matches?.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.metadata?.title} (Chunk ${match.metadata?.chunkIndex + 1})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPineconeDocuments();
