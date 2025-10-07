// Script to sync WordPress content to Pinecone for chatbot knowledge base
const fetch = require('node-fetch');

const WORDPRESS_URL = 'https://wordpress-977481-5850264.cloudwaysapps.com';
const OMNIX_URL = 'http://localhost:3000';
const BOT_ID = 47; // Your bot ID

async function syncWordPressContent() {
  console.log('🔄 Starting WordPress content sync to Pinecone...\n');
  
  try {
    // Step 1: Get access token (you need to generate this in WordPress admin)
    console.log('1️⃣ Getting access token...');
    console.log('⚠️  You need to generate an access token in WordPress Admin → OmniX Chatbot → Access Tokens');
    console.log('   Replace YOUR_ACCESS_TOKEN below with your actual token\n');
    
    const accessToken = 'YOUR_ACCESS_TOKEN'; // Replace with your actual token
    
    if (accessToken === 'YOUR_ACCESS_TOKEN') {
      console.log('❌ Please replace YOUR_ACCESS_TOKEN with your actual access token');
      console.log('   Go to WordPress Admin → OmniX Chatbot → Access Tokens');
      console.log('   Generate a new token and copy it here\n');
      return;
    }

    // Step 2: Export WordPress content
    console.log('2️⃣ Exporting WordPress content...');
    
    // Export posts
    console.log('   📝 Exporting posts...');
    const postsResponse = await fetch(`${WORDPRESS_URL}/wp-json/omnix-chatbot/v1/export/posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!postsResponse.ok) {
      console.log('❌ Failed to export posts:', postsResponse.status);
      const error = await postsResponse.text();
      console.log('Error:', error);
      return;
    }
    
    const postsData = await postsResponse.json();
    console.log(`   ✅ Exported ${postsData.data.length} posts`);

    // Export pages
    console.log('   📄 Exporting pages...');
    const pagesResponse = await fetch(`${WORDPRESS_URL}/wp-json/omnix-chatbot/v1/export/pages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pagesResponse.ok) {
      console.log('❌ Failed to export pages:', pagesResponse.status);
      return;
    }
    
    const pagesData = await pagesResponse.json();
    console.log(`   ✅ Exported ${pagesData.data.length} pages`);

    // Step 3: Send to OmniX for Pinecone storage
    console.log('\n3️⃣ Sending content to OmniX for Pinecone storage...');
    
    const syncData = {
      bot_id: BOT_ID,
      site_url: WORDPRESS_URL,
      data: {
        posts: postsData.data,
        pages: pagesData.data
      },
      export_type: 'full',
      webhook_secret: 'your-webhook-secret' // You may need to set this in your .env
    };

    const syncResponse = await fetch(`${OMNIX_URL}/api/webhooks/wordpress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(syncData)
    });

    if (!syncResponse.ok) {
      console.log('❌ Failed to sync to Pinecone:', syncResponse.status);
      const error = await syncResponse.text();
      console.log('Error:', error);
      return;
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Content synced to Pinecone successfully!');
    console.log(`   📊 Processed ${syncResult.data?.processedCount || 0} items`);

    // Step 4: Test the chatbot
    console.log('\n4️⃣ Testing chatbot with new knowledge base...');
    
    const testResponse = await fetch(`${OMNIX_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'What is your company name?',
        botId: BOT_ID,
        conversationId: null
      })
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('✅ Chatbot test successful!');
      console.log('🤖 Bot response:', testResult.message);
    } else {
      console.log('❌ Chatbot test failed:', testResponse.status);
    }

    console.log('\n🎉 WordPress content sync completed!');
    console.log('📋 Next steps:');
    console.log('1. Test your chatbot on the website');
    console.log('2. Ask questions about your content');
    console.log('3. Check Pinecone dashboard for stored vectors');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

// Run the sync
syncWordPressContent();

