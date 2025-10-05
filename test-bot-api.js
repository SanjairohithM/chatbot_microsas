// Test script to verify bot creation API accepts extra fields
const testBotData = {
  name: 'API Test Bot',
  description: 'Testing API with extra fields',
  system_prompt: 'You are a helpful assistant.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  status: 'draft',
  is_deployed: false,
  // Extra fields that should be passed through
  website_url: 'https://www.wikipedia.org/',
  website_content: 'This is test content for the bot.',
  some_other_field: 'This should be ignored'
}

async function testBotAPI() {
  try {
    console.log('🚀 Testing bot creation API with extra fields...')
    console.log('Test data:', testBotData)
    
    const botResponse = await fetch('http://localhost:3000/api/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        ...testBotData
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
    console.log('Bot data returned:', newBot)
    
    // Check if extra fields are preserved
    console.log('\nChecking if extra fields are preserved in response:')
    console.log('Has website_url:', 'website_url' in newBot)
    console.log('Has website_content:', 'website_content' in newBot)
    console.log('Has some_other_field:', 'some_other_field' in newBot)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testBotAPI()
