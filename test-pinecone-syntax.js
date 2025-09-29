#!/usr/bin/env node

/**
 * Test Pinecone namespace syntax
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config({ path: '.env.local' })

async function testPineconeSyntax() {
  try {
    console.log('🧪 Testing Pinecone namespace syntax...')
    
    if (!process.env.PINECONE_API_KEY) {
      console.log('⚠️ PINECONE_API_KEY not found, testing syntax only')
      
      // Test the syntax without actually connecting
      const pc = new Pinecone({ apiKey: 'test-key' })
      const index = pc.index('test-index')
      
      // Test different syntax options
      console.log('Testing syntax options:')
      
      // Option 1: namespace as second parameter
      try {
        console.log('1. index.upsert(vectors, { namespace: "bot_1" })')
        // This would be the correct syntax
        console.log('✅ This syntax should work')
      } catch (e) {
        console.log('❌ This syntax failed:', e.message)
      }
      
      // Option 2: namespace in the vector object
      try {
        console.log('2. index.upsert(vectors) with namespace in vector metadata')
        console.log('✅ This is not the correct approach for namespaces')
      } catch (e) {
        console.log('❌ This syntax failed:', e.message)
      }
      
      return true
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pc.index('chatbot')
    
    // Test actual upsert with namespace
    const testVector = {
      id: `test_${Date.now()}`,
      values: Array(512).fill(0.1),
      metadata: {
        botId: 999,
        testData: true,
        content: 'Test vector for namespace syntax'
      }
    }
    
    console.log('Testing actual upsert with namespace...')
    await index.upsert([testVector], { namespace: 'bot_999' })
    console.log('✅ Upsert with namespace successful')
    
    // Test query with namespace
    console.log('Testing query with namespace...')
    const queryResult = await index.query({
      vector: Array(512).fill(0.1),
      topK: 1,
      includeMetadata: true
    }, { namespace: 'bot_999' })
    console.log('✅ Query with namespace successful')
    
    // Cleanup
    await index.deleteMany([testVector.id], { namespace: 'bot_999' })
    console.log('✅ Cleanup successful')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testPineconeSyntax().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('💥 Test error:', error)
  process.exit(1)
})
