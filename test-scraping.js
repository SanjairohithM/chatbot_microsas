// Test script to verify URL scraping and Pinecone storage
const testUrl = 'https://example.com'
const testBotId = 25 // Using your bot ID from the example

async function testScraping() {
  try {
    console.log(`Testing URL scraping for: ${testUrl}`)
    console.log(`Bot ID: ${testBotId}`)
    
    const response = await fetch('http://localhost:3000/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        botId: testBotId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Scraping failed:', response.status, errorText)
      return
    }

    const result = await response.json()
    console.log('✅ Scraping successful!')
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (result.data.pineconeStored) {
      console.log('✅ Content stored in Pinecone successfully!')
    } else {
      console.log('❌ Content was NOT stored in Pinecone')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testScraping()
