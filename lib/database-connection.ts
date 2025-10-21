import { PrismaClient, Prisma } from '@prisma/client'

// Connection pool configuration
const connectionConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Enhanced transaction configuration
  transactionOptions: {
    timeout: 30000, // 30 seconds
    maxWait: 10000, // 10 seconds
    isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel
  }
}

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient(connectionConfig)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Enhanced transaction wrapper with better error handling
export class DatabaseTransaction {
  /**
   * Execute a function within a database transaction with timeout handling
   */
  static async execute<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      timeout?: number
      maxWait?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  ): Promise<T> {
    const {
      timeout = 30000,
      maxWait = 10000,
      isolationLevel = 'ReadCommitted'
    } = options || {}

    try {
      return await db.$transaction(fn, {
        timeout,
        maxWait,
        isolationLevel
      })
    } catch (error) {
      // Handle specific transaction timeout errors
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Unable to start a transaction')) {
          console.error('Database transaction timeout:', error.message)
          throw new Error('Transaction timeout: The database operation took too long to complete. Please try again.')
        }
        
        if (error.message.includes('connection') || error.message.includes('pool')) {
          console.error('Database connection error:', error.message)
          throw new Error('Database connection error: Unable to connect to the database. Please try again.')
        }
      }
      
      throw error
    }
  }

  /**
   * Execute multiple operations in a single transaction
   */
  static async batch<T>(
    operations: Array<(tx: Prisma.TransactionClient) => Promise<T>>,
    options?: {
      timeout?: number
      maxWait?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  ): Promise<T[]> {
    return this.execute(async (tx) => {
      const results: T[] = []
      for (const operation of operations) {
        const result = await operation(tx)
        results.push(result)
      }
      return results
    }, options)
  }
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase()
})

process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})
