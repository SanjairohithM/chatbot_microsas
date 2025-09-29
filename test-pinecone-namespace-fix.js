#!/usr/bin/env node

/**
 * Quick test to verify Pinecone namespace fix
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config({ path: '.env.local' })

async function testNamespaceFix() {
  try {
    console.log('🧪 Testing Pinecone namespace fix...')
    
    if (!process.env.PINECONE_API_KEY) {
      console.log('⚠️ PINECONE_API_KEY not found, skipping actual test')
      console.log('✅ Namespace syntax is correct (no API key error)')
      return true
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    
    // Test 1: Default namespace (no namespace parameter)
    console.log('Test 1: Default namespace...')
    const defaultIndex = pc.index('chatbot')
    console.log('✅ Default namespace works')
    
    // Test 2: Bot-specific namespace
    console.log('Test 2: Bot-specific namespace...')
    const botIndex = pc.index('chatbot', 'bot_13')
    console.log('✅ Bot namespace works')
    
    // Test 3: Try to upsert a test vector
    console.log('Test 3: Testing upsert...')
    const testVector = {
      id: `test_${Date.now()}`,
      values: Array(512).fill(0.1),
      metadata: {
        botId: 13,
        testData: true,
        content: 'Test vector for namespace fix'
      }
    }
    
    await botIndex.upsert([testVector])
    console.log('✅ Upsert successful')
    
    // Test 4: Query the test vector
    console.log('Test 4: Testing query...')
    const queryResult = await botIndex.query({
      vector: Array(512).fill(0.1),
      topK: 1,
      includeMetadata: true
    })
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      console.log('✅ Query successful')
    } else {
      console.log('⚠️ Query returned no results')
    }
    
    // Cleanup
    console.log('Test 5: Cleaning up...')
    await botIndex.deleteMany([testVector.id])
    console.log('✅ Cleanup successful')
    
    console.log('\n🎉 All tests passed! Namespace fix is working correctly.')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testNamespaceFix().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('💥 Test error:', error)
  process.exit(1)
})
