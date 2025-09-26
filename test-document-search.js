/**
 * Test script for enhanced document search functionality
 * This script demonstrates how the improved document search works with your chatbot
 */

const API_BASE_URL = 'http://localhost:3000/api'

async function testDocumentSearch() {
  console.log('🔍 Testing Enhanced Document Search Functionality\n')

  // Test bot ID (replace with your actual bot ID)
  const botId = 1
  
  // Test queries
  const testQueries = [
    'What services do you offer?',
    'How can I contact support?',
    'What are your pricing plans?',
    'Tell me about your company',
    'What is your refund policy?',
    'How do I get started?'
  ]

  console.log(`Testing with Bot ID: ${botId}\n`)

  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`)
    console.log('─'.repeat(50))

    try {
      const response = await fetch(`${API_BASE_URL}/search-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botId,
          query: query,
          limit: 5
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        const results = data.data
        console.log(`✅ Search completed successfully`)
        console.log(`📊 Total documents: ${results.totalDocuments}`)
        console.log(`🎯 Matches found: ${results.results.length}`)
        console.log(`📈 Search Summary:`)
        console.log(`   - Exact matches: ${results.summary.exactMatches}`)
        console.log(`   - Partial matches: ${results.summary.partialMatches}`)
        console.log(`   - Semantic matches: ${results.summary.semanticMatches}`)
        console.log(`   - Average score: ${results.summary.averageScore}`)

        if (results.results.length > 0) {
          console.log(`\n📋 Top Results:`)
          results.results.forEach((result, index) => {
            console.log(`   ${index + 1}. [${result.matchType.toUpperCase()}] ${result.document.title} (Score: ${result.relevanceScore})`)
            console.log(`      Content: ${result.matchedContent.substring(0, 100)}...`)
            console.log(`      Context: ${result.context.substring(0, 100)}...`)
            console.log('')
          })
        } else {
          console.log(`❌ No matches found for this query`)
        }
      } else {
        console.log(`❌ Search failed: ${data.error}`)
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }

    console.log('\n' + '='.repeat(60) + '\n')
  }
}

async function testChatWithDocumentContext() {
  console.log('💬 Testing Chat with Enhanced Document Context\n')

  const botId = 1
  const testMessage = 'What services do you offer and how can I contact you?'

  console.log(`📝 Test Message: "${testMessage}"`)
  console.log('─'.repeat(50))

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        botId: botId,
        userId: 1
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      console.log(`✅ Chat completed successfully`)
      console.log(`🤖 Bot Response: ${data.message}`)
      
      if (data.document_search) {
        console.log(`\n📊 Document Search Results:`)
        console.log(`   - Query: ${data.document_search.query}`)
        console.log(`   - Total documents: ${data.document_search.total_documents}`)
        console.log(`   - Matches found: ${data.document_search.matches_found}`)
        console.log(`   - Has context: ${data.document_search.has_context}`)
        console.log(`   - Exact matches: ${data.document_search.summary.exactMatches}`)
        console.log(`   - Partial matches: ${data.document_search.summary.partialMatches}`)
        console.log(`   - Semantic matches: ${data.document_search.summary.semanticMatches}`)
        console.log(`   - Average score: ${data.document_search.summary.averageScore}`)
      } else {
        console.log(`❌ No document search information available`)
      }
    } else {
      console.log(`❌ Chat failed: ${data.error}`)
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Enhanced Document Search Tests\n')
  console.log('Make sure your Next.js server is running on http://localhost:3000\n')

  try {
    await testDocumentSearch()
    await testChatWithDocumentContext()
    
    console.log('✅ All tests completed!')
    console.log('\n📋 Summary of Enhancements:')
    console.log('   - Enhanced search with exact, partial, and semantic matching')
    console.log('   - Better context extraction and relevance scoring')
    console.log('   - Improved system prompt with document instructions')
    console.log('   - Detailed search result information in chat responses')
    console.log('   - New API endpoint for testing document search')
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests()
}

module.exports = {
  testDocumentSearch,
  testChatWithDocumentContext,
  runTests
}
