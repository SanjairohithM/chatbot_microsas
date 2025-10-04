/**
 * Test script for WordPress plugin integration
 * This script tests the token-based authentication and chat functionality
 */

const API_BASE_URL = 'https://your-domain.com'; // Replace with your actual domain
const WORDPRESS_URL = 'https://your-wordpress-site.com'; // Replace with your WordPress site

// Test configuration
const testConfig = {
    botId: 1, // Replace with your bot ID
    accessToken: 'ox_your_access_token_here', // Replace with generated token
    secretKey: 'ox_sk_your_secret_key_here' // Replace with generated secret key
};

async function testTokenCreation() {
    console.log('🧪 Testing token creation...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: testConfig.botId,
                token_name: 'Test Integration Token',
                permissions: 'chat,analytics,conversations',
                expires_days: 30
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Token created successfully:', data);
            return data;
        } else {
            console.error('❌ Token creation failed:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Token creation error:', error);
        return null;
    }
}

async function testTokenValidation(accessToken) {
    console.log('🧪 Testing token validation...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/token?access_token=${accessToken}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Token validation successful:', data);
            return true;
        } else {
            console.error('❌ Token validation failed:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Token validation error:', error);
        return false;
    }
}

async function testChatAPI(accessToken) {
    console.log('🧪 Testing chat API...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Hello! This is a test message from the integration test.',
                conversationId: null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Chat API successful:', data);
            return true;
        } else {
            console.error('❌ Chat API failed:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Chat API error:', error);
        return false;
    }
}

async function testWordPressAPI(accessToken) {
    console.log('🧪 Testing WordPress API...');
    
    try {
        const response = await fetch(`${WORDPRESS_URL}/wp-json/omnix-chatbot/v1/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Hello from WordPress integration test!',
                conversationId: null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ WordPress API successful:', data);
            return true;
        } else {
            console.error('❌ WordPress API failed:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ WordPress API error:', error);
        return false;
    }
}

async function testWidgetHTML() {
    console.log('🧪 Testing widget HTML generation...');
    
    const widgetHTML = `
    <div id="omnix-chatbot-test" 
         class="omnix-chatbot-widget" 
         data-bot-id="${testConfig.botId}"
         data-access-token="${testConfig.accessToken}"
         data-theme="default"
         data-position="bottom-right"
         data-enable-voice="true">
    </div>
    `;
    
    console.log('✅ Widget HTML generated:', widgetHTML);
    return widgetHTML;
}

async function testShortcode() {
    console.log('🧪 Testing shortcode generation...');
    
    const shortcode = `[omnix_chatbot bot_id="${testConfig.botId}" access_token="${testConfig.accessToken}" theme="default" enable_voice="true"]`;
    
    console.log('✅ Shortcode generated:', shortcode);
    return shortcode;
}

async function runAllTests() {
    console.log('🚀 Starting OmniX Chatbot WordPress Integration Tests\n');
    
    // Test 1: Create a new token
    const tokenData = await testTokenCreation();
    if (!tokenData) {
        console.log('❌ Cannot continue without valid token\n');
        return;
    }
    
    const accessToken = tokenData.access_token;
    
    // Test 2: Validate the token
    const isValid = await testTokenValidation(accessToken);
    if (!isValid) {
        console.log('❌ Token validation failed, cannot continue\n');
        return;
    }
    
    // Test 3: Test direct chat API
    await testChatAPI(accessToken);
    
    // Test 4: Test WordPress API (if WordPress is configured)
    if (WORDPRESS_URL !== 'https://your-wordpress-site.com') {
        await testWordPressAPI(accessToken);
    } else {
        console.log('⚠️  WordPress URL not configured, skipping WordPress API test');
    }
    
    // Test 5: Generate widget HTML
    await testWidgetHTML();
    
    // Test 6: Generate shortcode
    await testShortcode();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Install the WordPress plugin on your site');
    console.log('2. Configure the plugin settings with your API URL and key');
    console.log('3. Use the generated shortcode in your WordPress posts/pages');
    console.log('4. Or include the widget script directly in your HTML');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    runAllTests();
} else {
    // Browser environment
    runAllTests();
}

// Export functions for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testTokenCreation,
        testTokenValidation,
        testChatAPI,
        testWordPressAPI,
        testWidgetHTML,
        testShortcode,
        runAllTests
    };
}
