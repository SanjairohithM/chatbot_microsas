// Complete test script to verify bot creation and scraping flow
const testBotData = {
  name: 'Complete Test Bot',
  description: 'A test bot to verify complete scraping functionality',
  system_prompt: 'You are a helpful assistant.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  status: 'draft',
  is_deployed: false,
  website_url: 'https://example.com',
  website_content: 'This is test content for the bot.'
}

async function testCompleteFlow() {
  try {
    console.log('🚀 Testing complete bot creation and scraping flow...')
    console.log('Test data:', testBotData)
    
    // Step 1: Create a bot with website data
    console.log('\n1️⃣ Creating bot with website data...')
    const botResponse = await fetch('http://localhost:3000/api/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        name: testBotData.name,
        description: testBotData.description,
        system_prompt: testBotData.system_prompt,
        model: testBotData.model,
        temperature: testBotData.temperature,
        max_tokens: testBotData.max_tokens,
        status: testBotData.status,
        is_deployed: testBotData.is_deployed,
        // These should be passed through but not stored in DB
        website_url: testBotData.website_url,
        website_content: testBotData.website_content,
      })
    })

    console.log(`Bot creation response status: ${botResponse.status}`)

    if (!botResponse.ok) {
      const errorText = await botResponse.text()
      console.error('❌ Bot creation failed:', errorText)
      return
    }

    const botResult = await botResponse.json()
    const newBot = botResult.data
    console.log('✅ Bot created successfully!')
    console.log('Bot ID:', newBot.id)
    console.log('Bot name:', newBot.name)

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

    console.log(`Scraping response status: ${scrapeResponse.status}`)

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text()
      console.error('❌ Scraping failed:', errorText)
      return
    }

    const scrapeResult = await scrapeResponse.json()
    console.log('✅ Scraping completed!')
    console.log('Pinecone stored:', scrapeResult.data.pineconeStored)
    console.log('Document created:', scrapeResult.data.document ? 'Yes' : 'No')
    
    if (scrapeResult.data.pineconeStored) {
      console.log('✅ Content stored in Pinecone successfully!')
      
      // Step 3: Test searching the namespace
      console.log('\n3️⃣ Testing namespace search...')
      const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: newBot.id,
          query: 'example',
          limit: 5
        })
      })

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        console.log('✅ Search completed')
        console.log(`Found ${searchResult.data.length} documents in namespace bot_${newBot.id}`)
        
        if (searchResult.data.length > 0) {
          console.log('✅ Namespace contains documents!')
          console.log('Sample document title:', searchResult.data[0].title)
        } else {
          console.log('⚠️ Namespace exists but no documents found')
        }
      } else {
        console.log('❌ Search failed:', await searchResponse.text())
      }
      
    } else {
      console.log('❌ Content was NOT stored in Pinecone')
    }

    console.log('\n🎉 Test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testCompleteFlow()
