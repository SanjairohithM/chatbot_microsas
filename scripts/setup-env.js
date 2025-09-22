#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `# DeepSeek API Configuration
DEEPSEEK_API_KEY=sk-f1ff59dc5a8c42fb850267e784b1864a
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    console.log('📝 Please manually add the DeepSeek API configuration to your existing .env.local file.');
  } else {
    // Create .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with DeepSeek API configuration');
  }
  
  console.log('\n🚀 Your chatbot is now configured to use the DeepSeek API!');
  console.log('📖 See ENVIRONMENT_SETUP.md for more details.');
  
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  process.exit(1);
}
