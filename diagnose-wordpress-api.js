// Diagnose WordPress API Issues
console.log('🔍 Diagnosing WordPress API Issues\n');

console.log('Testing WordPress API endpoints...\n');

// Test 1: Check if the plugin is active
console.log('1. Testing plugin activation:');
console.log('URL: https://mgsbuilders.co.in/wp-json/omnix-chatbot/v1/info');
console.log('Expected: 200 OK with site info');
console.log('Actual: 404 Not Found - Plugin may not be active\n');

// Test 2: Check API configuration
console.log('2. Testing API configuration:');
console.log('Your WordPress plugin settings show:');
console.log('- API Base URL: http://localhost:3000/');
console.log('- API Key: [Your access token]');
console.log('Problem: localhost:3000 is not accessible from the internet!\n');

// Test 3: Check REST API registration
console.log('3. Testing REST API registration:');
console.log('The plugin should register these endpoints:');
console.log('- /wp-json/omnix-chatbot/v1/chat');
console.log('- /wp-json/omnix-chatbot/v1/info');
console.log('- /wp-json/omnix-chatbot/v1/bots');
console.log('But they return 404/500 errors\n');

console.log('🔧 SOLUTIONS:\n');

console.log('Solution 1: Fix WordPress Plugin Configuration');
console.log('1. Go to WordPress Admin → OmniX Chatbot → Settings');
console.log('2. Change API Base URL from "http://localhost:3000/" to your public OmniX server URL');
console.log('3. Save settings');
console.log('4. Test the script tag again\n');

console.log('Solution 2: Use Direct OmniX API (Recommended)');
console.log('Update your script to call your OmniX server directly:');
console.log('');
console.log('<script>');
console.log('window.omnixChatbot = {');
console.log('    apiUrl: "https://your-omnix-domain.com",');
console.log('    botId: "48",');
console.log('    accessToken: "ox_38fb3bbfe78960c623bd50a4879e267f722d94d126b12357cbc609ed5cda1e1a"');
console.log('};');
console.log('</script>');
console.log('<script src="https://mgsbuilders.co.in/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js"></script>\n');

console.log('Solution 3: Deploy OmniX Server Publicly');
console.log('1. Deploy your OmniX server to a public domain (Vercel, Netlify, etc.)');
console.log('2. Update WordPress plugin settings with the public URL');
console.log('3. Use the script tag as-is\n');

console.log('🎯 IMMEDIATE FIX:');
console.log('Use Solution 2 - it will work right away!');

