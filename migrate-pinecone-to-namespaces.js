#!/usr/bin/env node

/**
 * Migration Script: Move Pinecone data from default namespace to bot-specific namespaces
 * 
 * This script will:
 * 1. Read all data from the default namespace
 * 2. Group data by botId
 * 3. Move each bot's data to its own namespace (bot_{botId})
 * 4. Verify the migration was successful
 * 5. Optionally clean up the default namespace
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config({ path: '.env.local' })

// Configuration
const config = {
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || (() => {
      console.warn('⚠️ PINECONE_API_KEY not found in environment variables')
      return ''
    })(),
    indexName: process.env.PINECONE_INDEX_NAME || "chatbot",
    cloud: process.env.PINECONE_CLOUD || "aws",
    region: process.env.PINECONE_REGION || "us-east-1"
  }
}

class PineconeNamespaceMigrator {
  constructor() {
    this.pc = null
    this.index = null
    this.migrationStats = {
      totalVectors: 0,
      vectorsByBot: {},
      migratedVectors: 0,
      errors: []
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Pinecone Namespace Migration...')
      
      if (!config.pinecone.apiKey) {
        throw new Error('PINECONE_API_KEY is required')
      }

      this.pc = new Pinecone({
        apiKey: config.pinecone.apiKey
      })

      this.index = this.pc.index(config.pinecone.indexName)
      
      console.log(`✅ Connected to Pinecone index: ${config.pinecone.indexName}`)
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error)
      throw error
    }
  }

  async analyzeDefaultNamespace() {
    try {
      console.log('\n📊 Analyzing default namespace...')
      
      // Get stats for default namespace
      const stats = await this.index.describeIndexStats()
      console.log(`📈 Total vectors in index: ${stats.totalVectorCount || 0}`)
      
      // Query all vectors from default namespace to analyze by botId
      const queryResponse = await this.index.query({
        vector: Array(512).fill(0), // Dummy vector for metadata-only search
        topK: 10000, // Large number to get all vectors
        includeMetadata: true
      })

      const vectors = queryResponse.matches || []
      console.log(`🔍 Found ${vectors.length} vectors to analyze`)

      // Group vectors by botId
      const vectorsByBot = {}
      vectors.forEach(match => {
        const botId = match.metadata?.botId
        if (botId) {
          if (!vectorsByBot[botId]) {
            vectorsByBot[botId] = []
          }
          vectorsByBot[botId].push(match)
        } else {
          console.warn(`⚠️ Vector ${match.id} has no botId in metadata`)
        }
      })

      this.migrationStats.vectorsByBot = vectorsByBot
      this.migrationStats.totalVectors = vectors.length

      console.log('\n📋 Analysis Results:')
      Object.keys(vectorsByBot).forEach(botId => {
        const count = vectorsByBot[botId].length
        console.log(`  Bot ${botId}: ${count} vectors`)
      })

      return vectorsByBot
    } catch (error) {
      console.error('❌ Failed to analyze default namespace:', error)
      throw error
    }
  }

  async migrateBotData(botId, vectors) {
    try {
      console.log(`\n🔄 Migrating ${vectors.length} vectors for bot ${botId}...`)
      
      const namespace = `bot_${botId}`
      const botIndex = this.pc.index(config.pinecone.indexName, namespace)
      
      // Prepare vectors for migration
      const vectorsToMigrate = vectors.map(match => ({
        id: match.id,
        values: match.values,
        metadata: match.metadata
      }))

      // Batch upsert to the bot's namespace
      const batchSize = 100
      for (let i = 0; i < vectorsToMigrate.length; i += batchSize) {
        const batch = vectorsToMigrate.slice(i, i + batchSize)
        await botIndex.upsert(batch)
        console.log(`  ✅ Migrated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorsToMigrate.length / batchSize)}`)
      }

      this.migrationStats.migratedVectors += vectors.length
      console.log(`✅ Successfully migrated ${vectors.length} vectors to namespace ${namespace}`)
      
      return true
    } catch (error) {
      console.error(`❌ Failed to migrate data for bot ${botId}:`, error)
      this.migrationStats.errors.push({
        botId,
        error: error.message,
        vectorCount: vectors.length
      })
      return false
    }
  }

  async verifyMigration(botId) {
    try {
      console.log(`\n🔍 Verifying migration for bot ${botId}...`)
      
      const namespace = `bot_${botId}`
      const botIndex = this.pc.index(config.pinecone.indexName, namespace)
      
      // Get stats for the bot's namespace
      const stats = await botIndex.describeIndexStats()
      const vectorCount = stats.namespaces?.[namespace]?.vectorCount || 0
      
      console.log(`📊 Namespace ${namespace}: ${vectorCount} vectors`)
      
      // Query a few vectors to verify they're accessible
      const queryResponse = await botIndex.query({
        vector: Array(512).fill(0),
        topK: 5,
        includeMetadata: true
      })

      const sampleVectors = queryResponse.matches || []
      console.log(`🔍 Sample vectors found: ${sampleVectors.length}`)
      
      if (sampleVectors.length > 0) {
        console.log(`  Sample vector ID: ${sampleVectors[0].id}`)
        console.log(`  Sample botId: ${sampleVectors[0].metadata?.botId}`)
      }

      return vectorCount > 0
    } catch (error) {
      console.error(`❌ Failed to verify migration for bot ${botId}:`, error)
      return false
    }
  }

  async cleanupDefaultNamespace() {
    try {
      console.log('\n🧹 Cleaning up default namespace...')
      
      // Query all vectors from default namespace
      const queryResponse = await this.index.query({
        vector: Array(512).fill(0),
        topK: 10000,
        includeMetadata: true
      })

      const vectorIds = queryResponse.matches?.map(match => match.id) || []
      
      if (vectorIds.length > 0) {
        await this.index.deleteMany(vectorIds)
        console.log(`✅ Deleted ${vectorIds.length} vectors from default namespace`)
      } else {
        console.log('ℹ️ No vectors found in default namespace to clean up')
      }
    } catch (error) {
      console.error('❌ Failed to cleanup default namespace:', error)
      throw error
    }
  }

  async runMigration(options = {}) {
    try {
      await this.initialize()
      
      // Analyze current state
      const vectorsByBot = await this.analyzeDefaultNamespace()
      
      if (Object.keys(vectorsByBot).length === 0) {
        console.log('ℹ️ No vectors with botId found in default namespace')
        return
      }

      // Migrate each bot's data
      console.log('\n🚀 Starting migration...')
      for (const [botId, vectors] of Object.entries(vectorsByBot)) {
        const success = await this.migrateBotData(parseInt(botId), vectors)
        if (success) {
          await this.verifyMigration(parseInt(botId))
        }
      }

      // Print migration summary
      console.log('\n📊 Migration Summary:')
      console.log(`  Total vectors processed: ${this.migrationStats.totalVectors}`)
      console.log(`  Vectors migrated: ${this.migrationStats.migratedVectors}`)
      console.log(`  Errors: ${this.migrationStats.errors.length}`)
      
      if (this.migrationStats.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        this.migrationStats.errors.forEach(error => {
          console.log(`  Bot ${error.botId}: ${error.error}`)
        })
      }

      // Cleanup default namespace if requested
      if (options.cleanup) {
        await this.cleanupDefaultNamespace()
      }

      console.log('\n✅ Migration completed!')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const options = {
    cleanup: args.includes('--cleanup')
  }

  console.log('🌲 Pinecone Namespace Migration Tool')
  console.log('=====================================')
  
  if (options.cleanup) {
    console.log('⚠️ WARNING: --cleanup flag detected. This will delete all data from the default namespace after migration.')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  const migrator = new PineconeNamespaceMigrator()
  await migrator.runMigration(options)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
}

module.exports = { PineconeNamespaceMigrator }
