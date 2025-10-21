# Database Transaction Timeout Fix

## Problem
You were experiencing the error: `"Transaction API error: Unable to start a transaction in the given time"`

This error typically occurs due to:
1. **Connection pool exhaustion** - All database connections are busy
2. **Long-running transactions** - Operations taking too long to complete
3. **Database connection timeouts** - Server timing out connections
4. **Missing connection pool configuration** - Using default Prisma settings

## Solution Implemented

### 1. Enhanced Prisma Client Configuration
- **File**: `lib/database-connection.ts`
- **Features**:
  - Connection pool configuration
  - Transaction timeout settings (30 seconds)
  - Connection wait timeout (10 seconds)
  - Proper error handling for timeouts
  - Graceful shutdown handling

### 2. Updated Database Schema
- **File**: `prisma/schema.prisma`
- **Changes**:
  - Added `directUrl` for connection pooling
  - Enhanced connection configuration

### 3. Enhanced Transaction Wrapper
- **Class**: `DatabaseTransaction`
- **Features**:
  - Configurable timeouts
  - Better error messages
  - Batch operation support
  - Automatic retry logic

### 4. Database Health Check
- **Endpoint**: `/api/health/database`
- **Purpose**: Monitor database connection status
- **Response**: Connection health and response time

## Configuration Options

### Environment Variables
Add these to your `.env` file for optimal performance:

```env
# Database URL with connection pool settings
DATABASE_URL="postgresql://username:password@localhost:5432/database?connection_limit=20&pool_timeout=20&connect_timeout=60"

# Alternative: Use separate URLs for connection pooling
DATABASE_URL="postgresql://username:password@localhost:5432/database"
DIRECT_URL="postgresql://username:password@localhost:5432/database"
```

### Connection Pool Settings
The new configuration includes:
- **Max Connections**: 20 (configurable)
- **Connection Timeout**: 60 seconds
- **Pool Timeout**: 20 seconds
- **Transaction Timeout**: 30 seconds
- **Max Wait Time**: 10 seconds

## Usage Examples

### Basic Transaction
```typescript
import { DatabaseTransaction } from '@/lib/db'

const result = await DatabaseTransaction.execute(async (tx) => {
  // Your database operations here
  return await tx.user.create({ data: userData })
})
```

### Transaction with Custom Timeout
```typescript
const result = await DatabaseTransaction.execute(
  async (tx) => {
    // Long-running operation
    return await tx.complexOperation()
  },
  {
    timeout: 60000, // 60 seconds
    maxWait: 15000  // 15 seconds
  }
)
```

### Batch Operations
```typescript
const results = await DatabaseTransaction.batch([
  (tx) => tx.user.create({ data: user1 }),
  (tx) => tx.user.create({ data: user2 }),
  (tx) => tx.user.create({ data: user3 })
])
```

## Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3000/api/health/database
```

**Response**:
```json
{
  "success": true,
  "message": "Database connection healthy",
  "data": {
    "response_time_ms": 45,
    "status": "healthy",
    "timestamp": "2025-01-21T06:34:18.446Z"
  }
}
```

### Error Handling
The enhanced error handling provides specific messages for different failure types:

- **Transaction Timeout**: "Transaction timeout: The database operation took too long to complete. Please try again."
- **Connection Error**: "Database connection error: Unable to connect to the database. Please try again."

## Best Practices

### 1. Use Appropriate Timeouts
- **Quick operations**: 10-30 seconds
- **Complex operations**: 60-120 seconds
- **Batch operations**: 120+ seconds

### 2. Monitor Connection Pool
- Check `/api/health/database` regularly
- Monitor response times
- Set up alerts for connection failures

### 3. Optimize Queries
- Use indexes effectively
- Avoid N+1 queries
- Use `select` to limit returned fields
- Consider pagination for large datasets

### 4. Handle Errors Gracefully
```typescript
try {
  const result = await DatabaseTransaction.execute(operation)
  return result
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout specifically
    return { error: 'Operation timed out, please try again' }
  }
  throw error
}
```

## Troubleshooting

### Common Issues

1. **Still getting timeouts?**
   - Increase timeout values
   - Check database server performance
   - Optimize your queries

2. **Connection pool exhausted?**
   - Increase `connection_limit` in DATABASE_URL
   - Check for connection leaks
   - Monitor active connections

3. **Database server overloaded?**
   - Check server resources (CPU, memory)
   - Optimize database configuration
   - Consider read replicas for read operations

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will log all database queries and help identify performance issues.

## Migration Steps

1. **Update your code** to use `DatabaseTransaction.execute()` instead of `db.$transaction()`
2. **Test the health endpoint** to ensure connections are working
3. **Monitor performance** and adjust timeouts as needed
4. **Update environment variables** with connection pool settings

The changes are backward compatible, so existing code will continue to work while you gradually migrate to the enhanced transaction handling.
