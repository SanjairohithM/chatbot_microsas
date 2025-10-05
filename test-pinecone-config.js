// Test script to verify Pinecone configuration
const { config } = require('./lib/config.ts')

async function testPineconeConfig() {
  try {
    console.log('🔧 Testing Pinecone configuration...')
    
    console.log('Pinecone config:', {
      apiKey: config.pinecone.apiKey ? 'Set' : 'Not set',
      indexName: config.pinecone.indexName,
      cloud: config.pinecone.cloud,
      region: config.pinecone.region,
      embeddingModel: config.pinecone.embeddingModel,
      dimension: config.pinecone.dimension,
      chunkSize: config.pinecone.chunkSize,
      chunkOverlap: config.pinecone.chunkOverlap,
      scoreThreshold: config.pinecone.scoreThreshold
    })
    
    if (!config.pinecone.apiKey) {
      console.error('❌ PINECONE_API_KEY is not set!')
      return
    }
    
    console.log('✅ Pinecone configuration looks good')
    
  } catch (error) {
    console.error('❌ Config test failed:', error.message)
  }
}

// Run the test
testPineconeConfig()
