#!/usr/bin/env node

/**
 * Dynamic script runner with configuration validation
 * Usage: node run-with-validation.js <script-name> [args...]
 * Example: node run-with-validation.js process-uploads 25
 */

const { spawn } = require('child_process');
const path = require('path');

// Available scripts with their descriptions
const AVAILABLE_SCRIPTS = {
  'process-uploads': {
    file: 'process-all-uploads-to-pinecone.js',
    description: 'Process all PDF uploads to Pinecone for a specific bot',
    requiredArgs: ['botId'],
    example: 'node run-with-validation.js process-uploads 25'
  },
  'clear-pinecone': {
    file: 'clear-pinecone-and-store-documents.js',
    description: 'Clear Pinecone and re-store documents for a specific bot',
    requiredArgs: ['botId'],
    example: 'node run-with-validation.js clear-pinecone 25'
  },
  'debug-search': {
    file: 'debug-pinecone-search.js',
    description: 'Debug Pinecone search functionality',
    requiredArgs: ['botId', 'userId (optional)'],
    example: 'node run-with-validation.js debug-search 25 user123'
  },
  'debug-upload': {
    file: 'debug-pinecone-upload.js',
    description: 'Debug PDF upload to Pinecone',
    requiredArgs: [],
    example: 'node run-with-validation.js debug-upload'
  },
  'debug-documents': {
    file: 'debug-pinecone-documents.js',
    description: 'Debug Pinecone document storage',
    requiredArgs: [],
    example: 'node run-with-validation.js debug-documents'
  }
};

function printUsage() {
  console.log('🚀 Dynamic Script Runner with Configuration Validation');
  console.log('=====================================================');
  console.log('Usage: node run-with-validation.js <script-name> [args...]\\n');
  
  console.log('Available scripts:');
  Object.entries(AVAILABLE_SCRIPTS).forEach(([name, config]) => {
    console.log(`\\n📜 ${name}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Required args: ${config.requiredArgs.join(', ') || 'None'}`);
    console.log(`   Example: ${config.example}`);
  });
  
  console.log('\\n🔧 Environment Variables:');
  console.log('   TARGET_BOT_ID - Default bot ID for scripts that need it');
  console.log('   TARGET_USER_ID - Default user ID for scripts that need it');
  console.log('   PINECONE_API_KEY - Required for Pinecone operations');
  console.log('   DATABASE_URL - Required for database operations');
  console.log('');
}

function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  const requiredVars = ['DATABASE_URL', 'PINECONE_API_KEY'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\\nPlease set these environment variables before running scripts.');
    return false;
  }
  
  console.log('✅ Environment validation passed!');
  return true;
}

function runScript(scriptName, args) {
  const scriptConfig = AVAILABLE_SCRIPTS[scriptName];
  
  if (!scriptConfig) {
    console.log(`❌ Unknown script: ${scriptName}`);
    printUsage();
    process.exit(1);
  }
  
  const scriptPath = path.join(__dirname, scriptConfig.file);
  
  console.log(`🚀 Running: ${scriptConfig.description}`);
  console.log(`📄 Script: ${scriptConfig.file}`);
  console.log(`📝 Args: ${args.join(' ') || 'None'}`);
  console.log('');
  
  // Set environment variables for the script
  const env = { ...process.env };
  
  // If botId is provided as first argument, set it as TARGET_BOT_ID
  if (args[0] && !isNaN(parseInt(args[0]))) {
    env.TARGET_BOT_ID = args[0];
    console.log(`🤖 Using Bot ID: ${args[0]}`);
  }
  
  // If userId is provided as second argument, set it as TARGET_USER_ID
  if (args[1]) {
    env.TARGET_USER_ID = args[1];
    console.log(`👤 Using User ID: ${args[1]}`);
  }
  
  console.log('');
  
  // Run the script
  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    env: env
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log(`\\n✅ Script completed successfully!`);
    } else {
      console.log(`\\n❌ Script failed with exit code: ${code}`);
    }
    process.exit(code);
  });
  
  child.on('error', (error) => {
    console.error(`❌ Failed to start script: ${error.message}`);
    process.exit(1);
  });
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }
  
  const scriptName = args[0];
  const scriptArgs = args.slice(1);
  
  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  // Run the script
  runScript(scriptName, scriptArgs);
}

main();
