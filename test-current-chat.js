// Using built-in fetch (Node.js 18+)

async function testCurrentChat() {
  console.log('🔍 Testing Current Chat Context...\n');

  try {
    // Test the current chat with the same parameters
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: 13,
        userId: 3,
        messages: [
          {
            role: 'user',
            content: 'What did we talk about earlier?'
          }
        ]
      })
    });

    const data = await response.json();
    
    console.log('📊 Chat Response:');
    console.log('Status:', response.status);
    console.log('Full Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Success Response:');
      console.log('Response:', data.data?.response?.substring(0, 200) + '...');
      console.log('Vector Search Enabled:', data.data?.vector_search_enabled);
      console.log('Has Context:', data.data?.conversation_context ? 'Yes' : 'No');
      console.log('Context Length:', data.data?.conversation_context?.length || 0);
      
      if (data.data?.conversation_context) {
        console.log('\n📝 Conversation Context:');
        console.log(data.data.conversation_context);
      }
    } else {
      console.log('\n❌ Error Response:');
      console.log('Error:', data.error);
      console.log('Message:', data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCurrentChat();
