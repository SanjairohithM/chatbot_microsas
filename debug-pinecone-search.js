const { Pinecone } = require('@pinecone-database/pinecone');

// Configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V';
const INDEX_NAME = 'chatbot';

async function debugPineconeSearch() {
  console.log('🔍 Debugging Pinecone Search...\n');

  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: PINECONE_API_KEY
    });

    const index = pc.index(INDEX_NAME);
    console.log('✅ Connected to Pinecone index:', INDEX_NAME);

    // 1. Check what's actually in the index
    console.log('\n📊 Checking index stats...');
    const stats = await index.describeIndexStats();
    console.log('Index stats:', JSON.stringify(stats, null, 2));

    // 2. Query without filters to see all data
    console.log('\n🔍 Querying all vectors (no filters)...');
    const allVectors = await index.query({
      vector: Array(512).fill(0), // Dummy vector
      topK: 10,
      includeMetadata: true
    });

    console.log(`Found ${allVectors.matches?.length || 0} vectors:`);
    allVectors.matches?.forEach((match, index) => {
      console.log(`\n${index + 1}. ID: ${match.id}`);
      console.log(`   Score: ${match.score}`);
      console.log(`   BotId: ${match.metadata?.botId}`);
      console.log(`   UserId: ${match.metadata?.userId}`);
      console.log(`   Role: ${match.metadata?.role}`);
      console.log(`   Content: "${match.metadata?.content?.substring(0, 100)}..."`);
    });

    // Get Bot ID from environment or use default
    const botId = process.env.TARGET_BOT_ID ? parseInt(process.env.TARGET_BOT_ID, 10) : (process.argv[2] ? parseInt(process.argv[2], 10) : 1);
    
    // 3. Test search with different filters
    console.log(`\n🔍 Testing search with botId ${botId} filter...`);
    const botSearch = await index.query({
      vector: Array(512).fill(0), // Dummy vector
      filter: {
        botId: { $eq: botId }
      },
      topK: 5,
      includeMetadata: true
    });

    console.log(`Found ${botSearch.matches?.length || 0} vectors for botId ${botId}:`);
    botSearch.matches?.forEach((match, index) => {
      console.log(`\n${index + 1}. ID: ${match.id}`);
      console.log(`   BotId: ${match.metadata?.botId}`);
      console.log(`   UserId: ${match.metadata?.userId}`);
      console.log(`   Role: ${match.metadata?.role}`);
    });

    // Get User ID from environment or use default
    const userId = process.env.TARGET_USER_ID || process.argv[3] || 'default-user';
    
    // 4. Test search with userId filter
    console.log(`\n🔍 Testing search with userId ${userId} filter...`);
    const userSearch = await index.query({
      vector: Array(512).fill(0), // Dummy vector
      filter: {
        userId: { $eq: userId }
      },
      topK: 5,
      includeMetadata: true
    });

    console.log(`Found ${userSearch.matches?.length || 0} vectors for userId ${userId}:`);
    userSearch.matches?.forEach((match, index) => {
      console.log(`\n${index + 1}. ID: ${match.id}`);
      console.log(`   BotId: ${match.metadata?.botId}`);
      console.log(`   UserId: ${match.metadata?.userId}`);
      console.log(`   Role: ${match.metadata?.role}`);
    });

    // 5. Test semantic search with a simple query
    console.log('\n🔍 Testing semantic search...');
    
    // Create a simple embedding for "test message"
    const testEmbedding = generateSimpleEmbedding("test message");
    
    const semanticSearch = await index.query({
      vector: testEmbedding,
      topK: 5,
      includeMetadata: true
    });

    console.log(`Found ${semanticSearch.matches?.length || 0} vectors for semantic search:`);
    semanticSearch.matches?.forEach((match, index) => {
      console.log(`\n${index + 1}. ID: ${match.id}`);
      console.log(`   Score: ${match.score}`);
      console.log(`   Content: "${match.metadata?.content?.substring(0, 100)}..."`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Simple embedding function (same as in the service)
function generateSimpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(512).fill(0);
  
  words.forEach((word, index) => {
    const hash = simpleHash(word);
    const position = hash % 512;
    embedding[position] += 1 / (index + 1);
  });
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

debugPineconeSearch();








