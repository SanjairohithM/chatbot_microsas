// Test script to verify bot creation and scraping flow
const testBotData = {
  name: 'Test Bot for Scraping',
  description: 'A test bot to verify scraping functionality',
  system_prompt: 'You are a helpful assistant.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  status: 'draft',
  is_deployed: false,
  website_url: 'https://example.com',
  website_content: 'Test content'
}

async function testBotCreationAndScraping() {
  try {
    console.log('🚀 Testing bot creation and scraping flow...')
    
    // Step 1: Create a bot
    console.log('\n1️⃣ Creating bot...')
    const botResponse = await fetch('http://localhost:3000/api/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123', // You might need to use a real user ID
        ...testBotData
      })
    })

    if (!botResponse.ok) {
      const errorText = await botResponse.text()
      console.error('❌ Bot creation failed:', botResponse.status, errorText)
      return
    }

    const botResult = await botResponse.json()
    const newBot = botResult.data
    console.log('✅ Bot created successfully!')
    console.log('Bot ID:', newBot.id)
    console.log('Bot data:', newBot)

    // Step 2: Test scraping with the new bot ID
    console.log('\n2️⃣ Testing website scraping...')
    const scrapeResponse = await fetch('http://localhost:3000/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testBotData.website_url,
        botId: newBot.id
      })
    })

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text()
      console.error('❌ Scraping failed:', scrapeResponse.status, errorText)
      return
    }

    const scrapeResult = await scrapeResponse.json()
    console.log('✅ Scraping completed!')
    console.log('Scrape result:', JSON.stringify(scrapeResult, null, 2))
    
    if (scrapeResult.data.pineconeStored) {
      console.log('✅ Content stored in Pinecone successfully!')
    } else {
      console.log('❌ Content was NOT stored in Pinecone')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testBotCreationAndScraping()
