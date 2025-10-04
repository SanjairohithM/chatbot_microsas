/**
 * Test script for Database Chatbot API
 * 
 * This script demonstrates how to use the Database Chatbot API
 * to connect to external databases and generate intelligent responses.
 */

const API_BASE_URL = 'http://localhost:3000'; // Update with your API URL

// Example database configurations
const DATABASE_CONFIGS = {
  mysql: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    ssl: false
  },
  postgresql: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    ssl: false
  },
  maria: {
    type: 'mariadb',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    ssl: false
  }
};

// Example authentication credentials (replace with actual values)
const AUTH_CREDENTIALS = {
  access_token: 'your_access_token_here',
  secret_key: 'your_secret_key_here'
};

/**
 * Test database connection
 */
async function testDatabaseConnection(databaseConfig) {
  try {
    const params = new URLSearchParams({
      action: 'test',
      ...databaseConfig
    });

    const response = await fetch(`${API_BASE_URL}/api/database/query?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`
      }
    });

    const result = await response.json();
    console.log('Database Connection Test:', result);
    return result.success && result.data.connected;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Test direct SQL query execution
 */
async function testDirectQuery(databaseConfig, query, params = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        database_config: databaseConfig,
        query: query,
        params: params,
        max_rows: 100
      })
    });

    const result = await response.json();
    console.log('Direct Query Result:', result);
    return result;
  } catch (error) {
    console.error('Direct query failed:', error);
    return null;
  }
}

/**
 * Test chatbot database chat
 */
async function testChatbotChat(databaseConfig, message, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/database-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        database_config: databaseConfig,
        system_prompt: options.system_prompt || 'You are a helpful database assistant.',
        max_rows: options.max_rows || 100,
        temperature: options.temperature || 0.7,
        enable_query_logging: options.enable_query_logging !== false
      })
    });

    const result = await response.json();
    console.log('Chatbot Response:', result);
    return result;
  } catch (error) {
    console.error('Chatbot chat failed:', error);
    return null;
  }
}

/**
 * Test database schema retrieval
 */
async function testDatabaseSchema(databaseConfig) {
  try {
    const params = new URLSearchParams({
      action: 'schema',
      ...databaseConfig
    });

    const response = await fetch(`${API_BASE_URL}/api/database/query?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`
      }
    });

    const result = await response.json();
    console.log('Database Schema:', result);
    return result;
  } catch (error) {
    console.error('Schema retrieval failed:', error);
    return null;
  }
}

/**
 * Test bot credentials management
 */
async function testBotCredentials(botId, action = 'get') {
  try {
    let response;
    
    if (action === 'create') {
      response = await fetch(`${API_BASE_URL}/api/bots/${botId}/database-credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: ['read', 'write'],
          expires_in_days: 365
        })
      });
    } else if (action === 'get') {
      response = await fetch(`${API_BASE_URL}/api/bots/${botId}/database-credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`
        }
      });
    } else if (action === 'delete') {
      response = await fetch(`${API_BASE_URL}/api/bots/${botId}/database-credentials`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_CREDENTIALS.access_token}:${AUTH_CREDENTIALS.secret_key}`
        }
      });
    }

    const result = await response.json();
    console.log(`Bot Credentials ${action}:`, result);
    return result;
  } catch (error) {
    console.error(`Bot credentials ${action} failed:`, error);
    return null;
  }
}

/**
 * Run comprehensive tests
 */
async function runTests() {
  console.log('🚀 Starting Database Chatbot API Tests\n');

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...');
  for (const [dbType, config] of Object.entries(DATABASE_CONFIGS)) {
    console.log(`\n   Testing ${dbType.toUpperCase()} connection:`);
    const isConnected = await testDatabaseConnection(config);
    console.log(`   Result: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
  }

  // Test 2: Direct SQL Query
  console.log('\n2. Testing Direct SQL Query...');
  const directQueryResult = await testDirectQuery(
    DATABASE_CONFIGS.mysql,
    'SELECT 1 as test_value, NOW() as current_time',
    []
  );
  console.log(`   Result: ${directQueryResult?.success ? '✅ Success' : '❌ Failed'}`);

  // Test 3: Database Schema
  console.log('\n3. Testing Database Schema Retrieval...');
  const schemaResult = await testDatabaseSchema(DATABASE_CONFIGS.mysql);
  console.log(`   Result: ${schemaResult?.success ? '✅ Success' : '❌ Failed'}`);

  // Test 4: Chatbot Chat
  console.log('\n4. Testing Chatbot Database Chat...');
  const chatResult = await testChatbotChat(
    DATABASE_CONFIGS.mysql,
    'How many tables are in this database?',
    {
      system_prompt: 'You are a database expert assistant.',
      temperature: 0.3
    }
  );
  console.log(`   Result: ${chatResult?.success ? '✅ Success' : '❌ Failed'}`);

  // Test 5: Bot Credentials Management
  console.log('\n5. Testing Bot Credentials Management...');
  const credentialsResult = await testBotCredentials(1, 'get');
  console.log(`   Result: ${credentialsResult?.success ? '✅ Success' : '❌ Failed'}`);

  console.log('\n🎉 Tests completed!');
}

/**
 * Example usage scenarios
 */
async function runExampleScenarios() {
  console.log('\n📚 Running Example Scenarios\n');

  // Scenario 1: E-commerce Analytics
  console.log('Scenario 1: E-commerce Analytics');
  const ecommerceConfig = {
    type: 'mysql',
    host: 'ecommerce-db.example.com',
    port: 3306,
    database: 'ecommerce',
    username: 'analyst',
    password: 'secure_password',
    ssl: true
  };

  const analyticsResult = await testChatbotChat(
    ecommerceConfig,
    'What are the top 5 products by sales this month?',
    {
      system_prompt: 'You are an e-commerce analytics expert.',
      max_rows: 5,
      temperature: 0.2
    }
  );

  // Scenario 2: User Management
  console.log('\nScenario 2: User Management');
  const userMgmtResult = await testChatbotChat(
    DATABASE_CONFIGS.mysql,
    'Show me all users who registered in the last 7 days',
    {
      system_prompt: 'You are a user management assistant.',
      max_rows: 50
    }
  );

  // Scenario 3: Financial Reporting
  console.log('\nScenario 3: Financial Reporting');
  const financialResult = await testChatbotChat(
    DATABASE_CONFIGS.postgresql,
    'Calculate the total revenue for Q1 2024',
    {
      system_prompt: 'You are a financial reporting assistant.',
      temperature: 0.1
    }
  );
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(() => runExampleScenarios())
    .catch(console.error);
}

module.exports = {
  testDatabaseConnection,
  testDirectQuery,
  testChatbotChat,
  testDatabaseSchema,
  testBotCredentials,
  runTests,
  runExampleScenarios
};
