// Comprehensive test for WordPress integration and Pinecone setup
const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://wordpress-977481-5850264.cloudwaysapps.com';
const OMNIX_URL = 'http://localhost:3000';

async function testSetup() {
  console.log('🧪 Testing OmniX Chatbot WordPress Integration Setup\n');
  
  // Test 1: Check if OmniX server is running
  console.log('1️⃣ Testing OmniX server connection...');
  try {
    const response = await fetch(`${OMNIX_URL}/api/bots`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OmniX server is running');
      console.log(`📊 Found ${data.data.length} bots`);
      
      // Find bot 47 or 48
      const targetBot = data.data.find(bot => bot.id === 47 || bot.id === 48);
      if (targetBot) {
        console.log(`✅ Found target bot: ${targetBot.name} (ID: ${targetBot.id})`);
      } else {
        console.log('❌ Bot 47 or 48 not found');
        console.log('Available bots:', data.data.map(b => `${b.name} (ID: ${b.id})`));
      }
    } else {
      console.log('❌ OmniX server not responding');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to OmniX server:', error.message);
    return;
  }

  // Test 2: Check WordPress API endpoints
  console.log('\n2️⃣ Testing WordPress API endpoints...');
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/omnix-chatbot/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        message: 'Hello, test message',
        conversationId: null
      })
    });
    
    if (response.status === 401) {
      console.log('✅ WordPress API is responding (401 Unauthorized - expected without valid token)');
    } else if (response.ok) {
      console.log('✅ WordPress API is working');
    } else {
      console.log(`⚠️ WordPress API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ WordPress API not accessible:', error.message);
  }

  // Test 3: Check if WordPress plugin is installed
  console.log('\n3️⃣ Checking WordPress plugin installation...');
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/omnix-chatbot/v1/info`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ WordPress plugin is installed and working');
      console.log('Site info:', data.site?.name || 'Unknown');
    } else {
      console.log('❌ WordPress plugin not found or not activated');
    }
  } catch (error) {
    console.log('❌ Cannot check WordPress plugin:', error.message);
  }

  // Test 4: Test Pinecone connection
  console.log('\n4️⃣ Testing Pinecone connection...');
  try {
    const response = await fetch(`${OMNIX_URL}/api/search-documents-pinecone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        botId: 47,
        query: 'test',
        limit: 5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pinecone is connected and working');
      console.log(`📊 Found ${data.data?.length || 0} documents for bot 47`);
    } else {
      console.log('❌ Pinecone connection failed');
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Pinecone test failed:', error.message);
  }

  // Test 5: Test website scraping
  console.log('\n5️⃣ Testing website scraping...');
  try {
    const response = await fetch(`${OMNIX_URL}/api/scrape-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WORDPRESS_URL,
        botId: 47
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Website scraping is working');
      console.log('Pinecone stored:', data.data?.pineconeStored || false);
    } else {
      console.log('❌ Website scraping failed');
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Website scraping test failed:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('1. Check if your OmniX server is running on localhost:3000');
  console.log('2. Verify WordPress plugin is installed and activated');
  console.log('3. Generate access tokens in WordPress admin');
  console.log('4. Test the chatbot with a valid access token');
  console.log('5. Sync WordPress content to Pinecone for knowledge base');
}

// Run the test
testSetup().catch(console.error);
