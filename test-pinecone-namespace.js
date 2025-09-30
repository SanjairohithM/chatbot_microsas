// Test script to verify Pinecone namespace creation
const testBotId = 25 // Using your bot ID from the example

async function testPineconeNamespace() {
  try {
    console.log('🌲 Testing Pinecone namespace creation...')
    console.log(`Bot ID: ${testBotId}`)
    console.log(`Expected namespace: bot_${testBotId}`)
    
    // Test 1: Direct scraping with botId
    console.log('\n1️⃣ Testing direct scraping with botId...')
    const scrapeResponse = await fetch('http://localhost:3000/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        botId: testBotId
      })
    })

    console.log(`Scrape response status: ${scrapeResponse.status}`)
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text()
      console.error('❌ Scraping failed:', errorText)
      return
    }

    const scrapeResult = await scrapeResponse.json()
    console.log('✅ Scraping response received')
    console.log('Response data:', JSON.stringify(scrapeResult, null, 2))
    
    if (scrapeResult.data.pineconeStored) {
      console.log('✅ Content stored in Pinecone successfully!')
    } else {
      console.log('❌ Content was NOT stored in Pinecone')
    }

    // Test 2: Check if we can search the namespace
    console.log('\n2️⃣ Testing namespace search...')
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: testBotId,
        query: 'example',
        limit: 5
      })
    })

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json()
      console.log('✅ Search completed')
      console.log(`Found ${searchResult.data.length} documents`)
      if (searchResult.data.length > 0) {
        console.log('✅ Namespace exists and contains documents!')
        console.log('Sample document:', searchResult.data[0])
      } else {
        console.log('⚠️ Namespace exists but no documents found')
      }
    } else {
      console.log('❌ Search failed:', await searchResponse.text())
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testPineconeNamespace()
