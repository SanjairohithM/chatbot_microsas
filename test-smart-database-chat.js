const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const BOT_ID = 1; // Replace with your actual bot ID

// Test data
const testQueries = [
  {
    message: "How many users do we have?",
    expectedType: "count",
    description: "Count query - should detect as count type"
  },
  {
    message: "What are the top selling products?",
    expectedType: "select",
    description: "Select query - should detect as select type"
  },
  {
    message: "What is the average order value?",
    expectedType: "aggregation",
    description: "Aggregation query - should detect as aggregation type"
  },
  {
    message: "Show me today's orders",
    expectedType: "time_based",
    description: "Time-based query - should detect as time_based type"
  },
  {
    message: "Compare this month vs last month",
    expectedType: "comparison",
    description: "Comparison query - should detect as comparison type"
  },
  {
    message: "Group sales by category",
    expectedType: "grouping",
    description: "Grouping query - should detect as grouping type"
  },
  {
    message: "Hello, how are you?",
    expectedType: "general",
    description: "Non-database query - should not be detected as database query"
  }
];

// Database configuration
const databaseConfig = {
  type: "mysql",
  host: "localhost",
  port: 3306,
  database: "test_db",
  username: "test_user",
  password: "test_password",
  ssl: false
};

// Test smart database chat
async function testSmartDatabaseChat() {
  console.log('🧪 Testing Smart Database Chat API\n');
  console.log('=' .repeat(60));
  
  for (const testQuery of testQueries) {
    console.log(`\n📝 Testing: "${testQuery.message}"`);
    console.log(`📋 Expected Type: ${testQuery.expectedType}`);
    console.log(`📖 Description: ${testQuery.description}`);
    console.log('-'.repeat(50));
    
    try {
      // Test with database config
      const responseWithDb = await axios.post(`${BASE_URL}/api/chatbot/smart-database-chat`, {
        message: testQuery.message,
        bot_id: BOT_ID,
        database_config: databaseConfig
      });
      
      console.log('✅ Response with Database Config:');
      console.log(`   Is Database Query: ${responseWithDb.data.data.is_database_query}`);
      console.log(`   Query Type: ${responseWithDb.data.data.query_type}`);
      console.log(`   Message: ${responseWithDb.data.data.message.substring(0, 100)}...`);
      
      if (responseWithDb.data.data.sql_query) {
        console.log(`   SQL Query: ${responseWithDb.data.data.sql_query}`);
      }
      
      if (responseWithDb.data.data.execution_time) {
        console.log(`   Execution Time: ${responseWithDb.data.data.execution_time}ms`);
      }
      
    } catch (error) {
      console.log('❌ Error with Database Config:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    try {
      // Test without database config
      const responseWithoutDb = await axios.post(`${BASE_URL}/api/chatbot/smart-database-chat`, {
        message: testQuery.message,
        bot_id: BOT_ID
      });
      
      console.log('\n🔍 Response without Database Config:');
      console.log(`   Is Database Query: ${responseWithoutDb.data.data.is_database_query}`);
      console.log(`   Query Type: ${responseWithoutDb.data.data.query_type}`);
      console.log(`   Message: ${responseWithoutDb.data.data.message.substring(0, 100)}...`);
      
      if (responseWithoutDb.data.data.suggestions) {
        console.log(`   Suggestions: ${responseWithoutDb.data.data.suggestions.slice(0, 3).join(', ')}...`);
      }
      
    } catch (error) {
      console.log('\n❌ Error without Database Config:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Test query type detection accuracy
async function testQueryTypeDetection() {
  console.log('\n🎯 Testing Query Type Detection Accuracy\n');
  console.log('=' .repeat(60));
  
  let correctDetections = 0;
  let totalTests = testQueries.length;
  
  for (const testQuery of testQueries) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot/smart-database-chat`, {
        message: testQuery.message,
        bot_id: BOT_ID
      });
      
      const detectedType = response.data.data.query_type;
      const isCorrect = detectedType === testQuery.expectedType;
      
      console.log(`📝 "${testQuery.message}"`);
      console.log(`   Expected: ${testQuery.expectedType}`);
      console.log(`   Detected: ${detectedType}`);
      console.log(`   Result: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      if (isCorrect) correctDetections++;
      
    } catch (error) {
      console.log(`📝 "${testQuery.message}"`);
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  const accuracy = (correctDetections / totalTests) * 100;
  console.log(`\n📊 Detection Accuracy: ${correctDetections}/${totalTests} (${accuracy.toFixed(1)}%)`);
}

// Test API documentation
async function testApiDocumentation() {
  console.log('\n📚 Testing API Documentation\n');
  console.log('=' .repeat(60));
  
  try {
    const response = await axios.get(`${BASE_URL}/api/chatbot/smart-database-chat`);
    
    console.log('✅ API Documentation Retrieved:');
    console.log(`   Description: ${response.data.data.description}`);
    console.log(`   Features: ${response.data.data.features.join(', ')}`);
    console.log(`   Query Types: ${Object.keys(response.data.data.query_types).join(', ')}`);
    console.log(`   Endpoints: ${Object.keys(response.data.data.endpoints).join(', ')}`);
    
  } catch (error) {
    console.log('❌ Error retrieving API documentation:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling\n');
  console.log('=' .repeat(60));
  
  const errorTests = [
    {
      name: "Missing bot_id",
      payload: { message: "Test query" },
      expectedError: "Validation error"
    },
    {
      name: "Invalid bot_id",
      payload: { message: "Test query", bot_id: "invalid" },
      expectedError: "Validation error"
    },
    {
      name: "Empty message",
      payload: { message: "", bot_id: BOT_ID },
      expectedError: "Validation error"
    },
    {
      name: "Invalid database config",
      payload: { 
        message: "Test query", 
        bot_id: BOT_ID,
        database_config: { type: "invalid" }
      },
      expectedError: "Validation error"
    }
  ];
  
  for (const test of errorTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📋 Expected Error: ${test.expectedError}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot/smart-database-chat`, test.payload);
      console.log('❌ Expected error but got success');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log('✅ Error handled correctly');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Smart Database Chat API Tests');
  console.log('=' .repeat(60));
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🤖 Bot ID: ${BOT_ID}`);
  console.log(`📊 Test Queries: ${testQueries.length}`);
  
  try {
    await testSmartDatabaseChat();
    await testQueryTypeDetection();
    await testApiDocumentation();
    await testErrorHandling();
    
    console.log('\n🎉 All tests completed!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 Test runner error:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSmartDatabaseChat,
  testQueryTypeDetection,
  testApiDocumentation,
  testErrorHandling,
  runAllTests
};
