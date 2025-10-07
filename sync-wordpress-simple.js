// Simple script to sync WordPress content to Pinecone
console.log('🔄 WordPress Content Sync to Pinecone\n');

console.log('📋 Step-by-Step Process:');
console.log('1. Generate access token in WordPress admin');
console.log('2. Use the scrape-website API to sync your WordPress site');
console.log('3. Content will be stored in Pinecone automatically\n');

console.log('🔧 Manual Steps:');
console.log('1. Go to WordPress Admin → OmniX Chatbot → Access Tokens');
console.log('2. Generate a new access token for bot 47');
console.log('3. Copy the access token');
console.log('4. Run this command with your access token:\n');

console.log('curl -X POST "http://localhost:3000/api/scrape-website" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"url": "https://wordpress-977481-5850264.cloudwaysapps.com", "botId": 47}\'\n');

console.log('🎯 Alternative: Use the OmniX Dashboard');
console.log('1. Go to your OmniX Chatbot dashboard');
console.log('2. Find your bot (ID 47)');
console.log('3. Look for "Data Sources" or "Knowledge Base"');
console.log('4. Add your WordPress site URL');
console.log('5. The system will automatically scrape and store content in Pinecone\n');

console.log('✅ After sync, your chatbot will be able to answer questions about your website content!');

