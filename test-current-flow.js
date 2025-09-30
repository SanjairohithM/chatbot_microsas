// Test script to verify current bot creation flow
const testBotData = {
  name: 'Current Flow Test Bot',
  description: 'Testing current flow',
  system_prompt: 'You are a helpful assistant.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  status: 'draft',
  is_deployed: false,
  website_url: 'https://www.wikipedia.org/',
  website_content: 'This is test content for the bot.'
}

async function testCurrentFlow() {
  try {
    console.log('🚀 Testing current bot creation flow...')
    console.log('Test bot data:', testBotData)
    
    // Step 1: Create a bot (simulating the dashboard flow)
    console.log('\n1️⃣ Creating bot...')
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

    // Step 2: Simulate the dashboard scraping call
    console.log('\n2️⃣ Simulating dashboard scraping call...')
    console.log('Checking if website data would be passed to scraping...')
    
    // This simulates what the dashboard does
    const botDataWithWebsite = {
      ...testBotData,
      website_url: testBotData.website_url,
      website_content: testBotData.website_content
    }
    
    console.log('Bot data that would be passed to scraping:', {
      hasWebsiteUrl: !!botDataWithWebsite.website_url,
      hasWebsiteContent: !!botDataWithWebsite.website_content,
      websiteUrl: botDataWithWebsite.website_url,
      websiteContentLength: botDataWithWebsite.website_content?.length
    })
    
    if (botDataWithWebsite.website_url && botDataWithWebsite.website_content) {
      console.log('✅ Website data is available, would call scraping...')
      
      // Now actually call the scraping
      const scrapeResponse = await fetch('http://localhost:3000/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: botDataWithWebsite.website_url,
          botId: newBot.id
        })
      })

      console.log(`Scraping response status: ${scrapeResponse.status}`)

      if (scrapeResponse.ok) {
        const scrapeResult = await scrapeResponse.json()
        console.log('✅ Scraping completed!')
        console.log('Pinecone stored:', scrapeResult.data.pineconeStored)
        console.log('Document created:', scrapeResult.data.document ? 'Yes' : 'No')
        
        if (scrapeResult.data.pineconeStored) {
          console.log('✅ Content stored in Pinecone successfully!')
        } else {
          console.log('❌ Content was NOT stored in Pinecone')
        }
      } else {
        const errorText = await scrapeResponse.text()
        console.error('❌ Scraping failed:', errorText)
      }
    } else {
      console.log('❌ Website data is missing, scraping would be skipped')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testCurrentFlow()
