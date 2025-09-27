const { Pinecone } = require('@pinecone-database/pinecone');

// Configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V';
const INDEX_NAME = 'chatbot';

async function clearPineconeAndStoreDocuments() {
  console.log('🧹 Clearing Pinecone and storing documents...\n');

  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: PINECONE_API_KEY
    });

    const index = pc.index(INDEX_NAME);
    console.log('✅ Connected to Pinecone index:', INDEX_NAME);

    // 1. Clear all existing vectors
    console.log('\n🧹 Clearing all existing vectors...');
    const stats = await index.describeIndexStats();
    console.log('Current record count:', stats.totalRecordCount);
    
    if (stats.totalRecordCount > 0) {
      // Delete all vectors by querying with a dummy vector and deleting all results
      const allVectors = await index.query({
        vector: Array(512).fill(0), // Dummy vector
        topK: 10000, // Large number to get all vectors
        includeMetadata: true
      });

      if (allVectors.matches && allVectors.matches.length > 0) {
        const vectorIds = allVectors.matches.map(match => match.id);
        console.log(`Deleting ${vectorIds.length} vectors...`);
        await index.deleteMany(vectorIds);
        console.log('✅ All vectors deleted');
      }
    }

    // 2. Get documents from the database
    console.log('\n📚 Getting documents from database...');
    // Get Bot ID from environment or command line argument
    const botId = process.env.TARGET_BOT_ID ? parseInt(process.env.TARGET_BOT_ID, 10) : (process.argv[2] ? parseInt(process.argv[2], 10) : null);
    
    if (!botId) {
      console.log('❌ Bot ID is required. Set TARGET_BOT_ID environment variable or pass as argument.');
      console.log('Usage: node clear-pinecone-and-store-documents.js [BOT_ID]');
      return;
    }
    
    const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/knowledge-documents?botId=${botId}`);
    const documentsData = await documentsResponse.json();
    
    if (documentsData.success && documentsData.data.length > 0) {
      console.log(`Found ${documentsData.data.length} documents`);
      
      for (const document of documentsData.data) {
        if (document.status === 'indexed' && document.content) {
          console.log(`\n📄 Processing document: ${document.title} (ID: ${document.id})`);
          console.log(`Content length: ${document.content.length} characters`);
          
          // Process the document to store it in Pinecone
          const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: document.id })
          });
          
          const processData = await processResponse.json();
          if (processData.success) {
            console.log('✅ Document stored in Pinecone successfully');
          } else {
            console.log('❌ Failed to store document:', processData.error);
          }
        } else {
          console.log(`⚠️ Skipping document ${document.title} - status: ${document.status}, content length: ${document.content?.length || 0}`);
        }
      }
    } else {
      console.log('❌ No documents found');
    }

    // 3. Verify the storage
    console.log('\n🔍 Verifying document storage...');
    const newStats = await index.describeIndexStats();
    console.log('New record count:', newStats.totalRecordCount);
    
    if (newStats.totalRecordCount > 0) {
      // Test search
      const testSearch = await index.query({
        vector: Array(512).fill(0), // Dummy vector
        topK: 5,
        includeMetadata: true
      });
      
      console.log('\n📊 Sample stored vectors:');
      testSearch.matches?.forEach((match, index) => {
        console.log(`${index + 1}. ID: ${match.id}`);
        console.log(`   BotId: ${match.metadata?.botId}`);
        console.log(`   DocumentId: ${match.metadata?.documentId}`);
        console.log(`   Title: ${match.metadata?.title}`);
        console.log(`   Chunk: ${match.metadata?.chunkIndex}/${match.metadata?.totalChunks}`);
        console.log(`   Content: "${match.metadata?.content?.substring(0, 100)}..."`);
      });
    }

    console.log('\n🎉 Document storage complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearPineconeAndStoreDocuments();
