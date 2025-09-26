/**
 * Setup script for OpenAI API key
 * This script helps you configure the correct OpenAI API key for Pinecone embeddings
 */

const fs = require('fs');
const path = require('path');

function setupOpenAIKey() {
  console.log('🔑 OpenAI API Key Setup\n');
  
  console.log('To enable Pinecone vector search, you need a valid OpenAI API key.');
  console.log('Here\'s how to get one:\n');
  
  console.log('1. Go to: https://platform.openai.com/');
  console.log('2. Sign up or log in to your account');
  console.log('3. Navigate to "API Keys" section');
  console.log('4. Click "Create new secret key"');
  console.log('5. Copy the key (starts with sk-proj-)');
  console.log('6. Add it to your environment\n');
  
  console.log('Environment Setup Options:\n');
  
  console.log('Option A: Create .env.local file');
  console.log('Create a file named .env.local in your project root with:');
  console.log('OPENAI_API_KEY=sk-proj-your-actual-key-here\n');
  
  console.log('Option B: Set system environment variable');
  console.log('Windows (PowerShell):');
  console.log('$env:OPENAI_API_KEY="sk-proj-your-actual-key-here"');
  console.log('Windows (Command Prompt):');
  console.log('set OPENAI_API_KEY=sk-proj-your-actual-key-here');
  console.log('Linux/Mac:');
  console.log('export OPENAI_API_KEY=sk-proj-your-actual-key-here\n');
  
  console.log('Option C: Add to your shell profile');
  console.log('Add the export command to ~/.bashrc, ~/.zshrc, or ~/.profile\n');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('📁 Found .env.local file');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('OPENAI_API_KEY')) {
      console.log('✅ OPENAI_API_KEY is already configured in .env.local');
    } else {
      console.log('⚠️ OPENAI_API_KEY not found in .env.local');
      console.log('Add this line to your .env.local file:');
      console.log('OPENAI_API_KEY=sk-proj-your-actual-key-here');
    }
  } else {
    console.log('📁 No .env.local file found');
    console.log('You can create one with:');
    console.log('OPENAI_API_KEY=sk-proj-your-actual-key-here');
  }
  
  console.log('\n🔍 Current Environment Check:');
  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    console.log(`✅ OPENAI_API_KEY is set: ${maskedKey}`);
  } else {
    console.log('❌ OPENAI_API_KEY is not set in environment');
  }
  
  console.log('\n📋 After setting the API key:');
  console.log('1. Restart your Next.js server (npm run dev)');
  console.log('2. Test the integration: node test-pinecone-simple.js');
  console.log('3. Check Pinecone console for record count');
  
  console.log('\n💰 Cost Information:');
  console.log('- OpenAI text-embedding-3-small: ~$0.00002 per 1K tokens');
  console.log('- Typical usage: 1-2 cents per 1000 messages');
  console.log('- Very affordable for most use cases');
  
  console.log('\n🚀 Benefits once configured:');
  console.log('- Semantic search across conversation history');
  console.log('- Context-aware AI responses');
  console.log('- Better follow-up question handling');
  console.log('- Scalable conversation storage');
}

// Test function to verify API key
async function testOpenAIKey() {
  console.log('\n🧪 Testing OpenAI API Key...\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ No OPENAI_API_KEY found in environment');
    console.log('Please set the API key first using the setup instructions above.');
    return;
  }
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('🔄 Testing embedding generation...');
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Test message for embedding generation',
      encoding_format: 'float'
    });
    
    console.log('✅ OpenAI API key is working!');
    console.log(`📊 Generated embedding with ${response.data[0].embedding.length} dimensions`);
    console.log('🎯 Ready for Pinecone vector search!');
    
  } catch (error) {
    console.log('❌ OpenAI API key test failed:');
    if (error.code === 'invalid_api_key') {
      console.log('   Invalid API key. Please check your key and try again.');
    } else if (error.code === 'insufficient_quota') {
      console.log('   Insufficient quota. Please check your OpenAI account billing.');
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  setupOpenAIKey();
  
  // If API key is set, test it
  if (process.env.OPENAI_API_KEY) {
    testOpenAIKey();
  }
}

module.exports = {
  setupOpenAIKey,
  testOpenAIKey
};
