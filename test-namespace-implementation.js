#!/usr/bin/env node

/**
 * Test Script: Verify Pinecone namespace implementation
 * 
 * This script will:
 * 1. Test storing data in bot-specific namespaces
 * 2. Test searching within namespaces
 * 3. Test that data is properly isolated between bots
 * 4. Verify the migration worked correctly
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config({ path: '.env.local' })

// Configuration
const config = {
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || (() => {
      console.warn('⚠️ PINECONE_API_KEY not found in environment variables')
      return ''
    })(),
    indexName: process.env.PINECONE_INDEX_NAME || "chatbot",
    cloud: process.env.Pinecone_CLOUD || "aws",
    region: process.env.PINECONE_REGION || "us-east-1"
  }
}

class NamespaceTester {
  constructor() {
    this.pc = null
    this.index = null
    this.testResults = {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      errors: []
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Namespace Tester...')
      
      if (!config.pinecone.apiKey) {
        throw new Error('PINECONE_API_KEY is required')
      }

      this.pc = new Pinecone({
        apiKey: config.pinecone.apiKey
      })

      this.index = this.pc.index(config.pinecone.indexName)
      
      console.log(`✅ Connected to Pinecone index: ${config.pinecone.indexName}`)
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error)
      throw error
    }
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\n🧪 Running test: ${testName}`)
      this.testResults.testsRun++
      
      const result = await testFunction()
      
      if (result) {
        console.log(`✅ Test passed: ${testName}`)
        this.testResults.testsPassed++
        return true
      } else {
        console.log(`❌ Test failed: ${testName}`)
        this.testResults.testsFailed++
        return false
      }
    } catch (error) {
      console.error(`💥 Test error: ${testName}`, error)
      this.testResults.testsFailed++
      this.testResults.errors.push({ testName, error: error.message })
      return false
    }
  }

  async testNamespaceIsolation() {
    // Test that data is properly isolated between different bot namespaces
    const bot1Id = 999
    const bot2Id = 998
    const testId = `test_${Date.now()}`

    // Store test data in bot1 namespace
    const bot1Index = this.pc.index(config.pinecone.indexName, `bot_${bot1Id}`)
    await bot1Index.upsert([{
      id: `${testId}_bot1`,
      values: Array(512).fill(0.1),
      metadata: {
        botId: bot1Id,
        testData: true,
        content: 'This is test data for bot 1'
      }
    }])

    // Store test data in bot2 namespace
    const bot2Index = this.pc.index(config.pinecone.indexName, `bot_${bot2Id}`)
    await bot2Index.upsert([{
      id: `${testId}_bot2`,
      values: Array(512).fill(0.2),
      metadata: {
        botId: bot2Id,
        testData: true,
        content: 'This is test data for bot 2'
      }
    }])

    // Search in bot1 namespace - should only find bot1 data
    const bot1Results = await bot1Index.query({
      vector: Array(512).fill(0.1),
      topK: 10,
      includeMetadata: true
    })

    // Search in bot2 namespace - should only find bot2 data
    const bot2Results = await bot2Index.query({
      vector: Array(512).fill(0.2),
      topK: 10,
      includeMetadata: true
    })

    // Verify isolation
    const bot1Found = bot1Results.matches?.some(match => match.id === `${testId}_bot1`)
    const bot2Found = bot2Results.matches?.some(match => match.id === `${testId}_bot2`)
    const bot1NotInBot2 = !bot2Results.matches?.some(match => match.id === `${testId}_bot1`)
    const bot2NotInBot1 = !bot1Results.matches?.some(match => match.id === `${testId}_bot2`)

    // Cleanup test data
    await bot1Index.deleteMany([`${testId}_bot1`])
    await bot2Index.deleteMany([`${testId}_bot2`])

    return bot1Found && bot2Found && bot1NotInBot2 && bot2NotInBot1
  }

  async testDocumentStorage() {
    // Test storing and retrieving document chunks in bot namespace
    const botId = 997
    const documentId = 12345
    const testId = `doc_test_${Date.now()}`

    const botIndex = this.pc.index(config.pinecone.indexName, `bot_${botId}`)

    // Store document chunks
    const chunks = [
      { content: 'This is the first chunk of the document', chunkIndex: 0 },
      { content: 'This is the second chunk of the document', chunkIndex: 1 },
      { content: 'This is the third chunk of the document', chunkIndex: 2 }
    ]

    const vectors = chunks.map((chunk, index) => ({
      id: `${testId}_chunk_${index}`,
      values: Array(512).fill(0.1 + index * 0.1),
      metadata: {
        botId,
        documentId,
        title: 'Test Document',
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunks.length,
        timestamp: new Date().toISOString()
      }
    }))

    await botIndex.upsert(vectors)

    // Search for document chunks
    const searchResults = await botIndex.query({
      vector: Array(512).fill(0.15),
      filter: {
        $and: [
          { documentId: { $eq: documentId } },
          { chunkIndex: { $exists: true } }
        ]
      },
      topK: 10,
      includeMetadata: true
    })

    // Verify results
    const foundChunks = searchResults.matches || []
    const allChunksFound = foundChunks.length === chunks.length

    // Cleanup
    const vectorIds = vectors.map(v => v.id)
    await botIndex.deleteMany(vectorIds)

    return allChunksFound
  }

  async testChatMessageStorage() {
    // Test storing and retrieving chat messages in bot namespace
    const botId = 996
    const conversationId = `conv_${Date.now()}`
    const testId = `msg_test_${Date.now()}`

    const botIndex = this.pc.index(config.pinecone.indexName, `bot_${botId}`)

    // Store chat messages
    const messages = [
      {
        id: `${testId}_user`,
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date().toISOString()
      },
      {
        id: `${testId}_assistant`,
        role: 'assistant',
        content: 'I am doing well, thank you for asking!',
        timestamp: new Date().toISOString()
      }
    ]

    const vectors = messages.map(msg => ({
      id: msg.id,
      values: Array(512).fill(0.1),
      metadata: {
        conversationId,
        botId,
        userId: 'test-user',
        role: msg.role,
        timestamp: msg.timestamp,
        content: msg.content
      }
    }))

    await botIndex.upsert(vectors)

    // Search for conversation context
    const searchResults = await botIndex.query({
      vector: Array(512).fill(0.1),
      filter: {
        conversationId: { $eq: conversationId }
      },
      topK: 10,
      includeMetadata: true
    })

    // Verify results
    const foundMessages = searchResults.matches || []
    const allMessagesFound = foundMessages.length === messages.length

    // Cleanup
    const vectorIds = vectors.map(v => v.id)
    await botIndex.deleteMany(vectorIds)

    return allMessagesFound
  }

  async testExistingDataMigration() {
    // Test that existing data was properly migrated to namespaces
    console.log('🔍 Checking for existing data in namespaces...')

    // Get list of all namespaces
    const stats = await this.index.describeIndexStats()
    const namespaces = stats.namespaces || {}

    console.log(`📊 Found ${Object.keys(namespaces).length} namespaces:`)
    Object.keys(namespaces).forEach(namespace => {
      const count = namespaces[namespace].vectorCount || 0
      console.log(`  ${namespace}: ${count} vectors`)
    })

    // Check if we have bot-specific namespaces
    const botNamespaces = Object.keys(namespaces).filter(ns => ns.startsWith('bot_'))
    
    if (botNamespaces.length === 0) {
      console.log('⚠️ No bot-specific namespaces found. Migration may not have been run.')
      return false
    }

    // Test accessing data in each bot namespace
    let allAccessible = true
    for (const namespace of botNamespaces) {
      try {
        const botIndex = this.pc.index(config.pinecone.indexName, namespace)
        const queryResults = await botIndex.query({
          vector: Array(512).fill(0),
          topK: 1,
          includeMetadata: true
        })
        
        const hasData = queryResults.matches && queryResults.matches.length > 0
        console.log(`  ${namespace}: ${hasData ? '✅ accessible' : '⚠️ empty'}`)
        
        if (!hasData) {
          allAccessible = false
        }
      } catch (error) {
        console.log(`  ${namespace}: ❌ error - ${error.message}`)
        allAccessible = false
      }
    }

    return allAccessible
  }

  async runAllTests() {
    try {
      await this.initialize()

      console.log('\n🧪 Running Namespace Implementation Tests')
      console.log('==========================================')

      // Run all tests
      await this.runTest('Namespace Isolation', () => this.testNamespaceIsolation())
      await this.runTest('Document Storage', () => this.testDocumentStorage())
      await this.runTest('Chat Message Storage', () => this.testChatMessageStorage())
      await this.runTest('Existing Data Migration', () => this.testExistingDataMigration())

      // Print summary
      console.log('\n📊 Test Summary')
      console.log('===============')
      console.log(`Tests run: ${this.testResults.testsRun}`)
      console.log(`Tests passed: ${this.testResults.testsPassed}`)
      console.log(`Tests failed: ${this.testResults.testsFailed}`)
      
      if (this.testResults.errors.length > 0) {
        console.log('\n❌ Test Errors:')
        this.testResults.errors.forEach(error => {
          console.log(`  ${error.testName}: ${error.error}`)
        })
      }

      const success = this.testResults.testsFailed === 0
      console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed!'}`)
      
      return success
    } catch (error) {
      console.error('💥 Test suite failed:', error)
      return false
    }
  }
}

// Main execution
async function main() {
  console.log('🌲 Pinecone Namespace Implementation Tester')
  console.log('==========================================')
  
  const tester = new NamespaceTester()
  const success = await tester.runAllTests()
  
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = { NamespaceTester }
