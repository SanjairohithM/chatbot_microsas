# Pinecone Namespace Implementation Guide

## Overview

This guide explains the implementation of bot-specific namespaces in Pinecone, replacing the previous default namespace approach. This change provides better data isolation, improved performance, and enhanced multi-tenancy support.

## What Changed

### Before (Default Namespace)
- All data stored in `_default_` namespace
- Data separated by metadata filters (`botId` in metadata)
- Single namespace for all bots
- Potential performance issues with large datasets

### After (Bot-Specific Namespaces)
- Each bot has its own namespace: `bot_{botId}`
- Data naturally isolated by namespace
- Better performance and scalability
- Cleaner data organization

## Architecture

### Namespace Structure
```
Pinecone Index: "chatbot"
├── bot_1/          # Bot ID 1 data
├── bot_2/          # Bot ID 2 data
├── bot_3/          # Bot ID 3 data
└── ...             # Additional bot namespaces
```

### Data Types by Namespace
Each bot namespace contains:
- **Document Chunks**: Knowledge base documents
- **Chat Messages**: Conversation history
- **Metadata**: Bot-specific context and settings

## Implementation Details

### Updated Services

#### PineconeDocumentService
- `storeDocument(botId, documentId, title, content)` - Stores in `bot_{botId}` namespace
- `searchDocuments(botId, query, limit)` - Searches within `bot_{botId}` namespace
- `deleteDocument(documentId, botId)` - Deletes from `bot_{botId}` namespace

#### PineconeService
- `storeChatMessage(message)` - Stores in `bot_{message.botId}` namespace
- `searchConversationContext(botId, userId, query, limit)` - Searches within `bot_{botId}` namespace
- `getConversationHistory(conversationId, botId, limit)` - Retrieves from `bot_{botId}` namespace
- `deleteConversation(conversationId, botId)` - Deletes from `bot_{botId}` namespace

### API Changes

#### Updated Endpoints
- `/api/conversations/vector` - Now requires `botId` parameter
- All document processing endpoints automatically use bot-specific namespaces

#### Backward Compatibility
- Existing API calls will need to include `botId` parameter
- Migration script provided to move existing data

## Migration Process

### Step 1: Run Migration Script
```bash
# Basic migration (preserves default namespace)
node migrate-pinecone-to-namespaces.js

# Migration with cleanup (removes default namespace data)
node migrate-pinecone-to-namespaces.js --cleanup
```

### Step 2: Verify Migration
```bash
# Run comprehensive tests
node test-namespace-implementation.js
```

### Step 3: Update API Calls
Ensure all API calls include the required `botId` parameter:
```javascript
// Before
await PineconeService.getConversationHistory(conversationId, limit)

// After
await PineconeService.getConversationHistory(conversationId, botId, limit)
```

## Benefits

### 1. **Data Isolation**
- Each bot's data is completely separate
- No risk of cross-contamination between bots
- Better security and privacy

### 2. **Performance Improvements**
- Smaller namespace sizes = faster queries
- Reduced metadata filtering overhead
- Better caching and indexing

### 3. **Scalability**
- Easy to add new bots without affecting existing data
- Individual bot data can be managed independently
- Better resource utilization

### 4. **Maintenance**
- Easier to debug bot-specific issues
- Simple data cleanup per bot
- Better monitoring and analytics

## Usage Examples

### Storing Document Data
```javascript
// Store document for bot 123
await PineconeDocumentService.storeDocument(
  123,                    // botId
  456,                    // documentId
  "User Manual",          // title
  "Document content..."   // content
)
// Data stored in namespace: bot_123
```

### Searching Documents
```javascript
// Search documents for bot 123
const results = await PineconeDocumentService.searchDocuments(
  123,                    // botId
  "How to login?",        // query
  5                       // limit
)
// Searches only in namespace: bot_123
```

### Storing Chat Messages
```javascript
// Store chat message for bot 123
await PineconeService.storeChatMessage({
  id: 'msg_123',
  conversationId: 'conv_456',
  botId: 123,             // Determines namespace
  userId: 'user_789',
  role: 'user',
  content: 'Hello!',
  timestamp: new Date().toISOString()
})
// Data stored in namespace: bot_123
```

## Monitoring and Analytics

### Namespace Statistics
```javascript
// Get stats for specific bot
const stats = await PineconeDocumentService.getDocumentStats(123)
console.log(`Bot 123 has ${stats.totalVectorCount} vectors`)

// Get stats for all namespaces
const indexStats = await index.describeIndexStats()
console.log('All namespaces:', indexStats.namespaces)
```

### Data Verification
```javascript
// Verify data exists in bot namespace
const botIndex = pc.index('chatbot', 'bot_123')
const results = await botIndex.query({
  vector: Array(512).fill(0),
  topK: 1,
  includeMetadata: true
})
console.log(`Found ${results.matches?.length || 0} vectors in bot_123`)
```

## Troubleshooting

### Common Issues

#### 1. Missing botId Parameter
**Error**: `TypeError: Cannot read property 'botId' of undefined`
**Solution**: Ensure all API calls include the required `botId` parameter

#### 2. Empty Search Results
**Error**: No results returned from namespace search
**Solution**: 
- Verify data was migrated to correct namespace
- Check that `botId` matches the namespace name
- Run migration script if data is still in default namespace

#### 3. Namespace Not Found
**Error**: `Namespace 'bot_123' not found`
**Solution**: 
- Namespaces are created automatically when first data is stored
- Verify botId is valid and data exists
- Check Pinecone index configuration

### Debug Commands

```bash
# Check namespace status
node -e "
const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
pc.index('chatbot').describeIndexStats().then(console.log);
"

# Test specific bot namespace
node -e "
const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const botIndex = pc.index('chatbot', 'bot_123');
botIndex.query({ vector: Array(512).fill(0), topK: 5 }).then(r => console.log(r.matches?.length || 0));
"
```

## Best Practices

### 1. **Always Include botId**
- Every Pinecone operation should specify the botId
- Use consistent botId format (integers)
- Validate botId before making calls

### 2. **Error Handling**
- Handle namespace creation errors gracefully
- Implement fallback mechanisms for missing data
- Log namespace-specific errors for debugging

### 3. **Performance Optimization**
- Use appropriate batch sizes for upserts
- Implement caching for frequently accessed data
- Monitor namespace sizes and performance

### 4. **Data Management**
- Regular cleanup of old or unused data
- Monitor namespace growth and limits
- Implement data archival strategies

## Migration Checklist

- [ ] Run migration script: `node migrate-pinecone-to-namespaces.js`
- [ ] Verify migration: `node test-namespace-implementation.js`
- [ ] Update API calls to include `botId` parameter
- [ ] Test all bot functionality
- [ ] Monitor namespace performance
- [ ] Update documentation and team training
- [ ] Clean up default namespace (optional): `node migrate-pinecone-to-namespaces.js --cleanup`

## Support

For issues or questions regarding the namespace implementation:

1. Check the troubleshooting section above
2. Run the test script to verify implementation
3. Review migration logs for errors
4. Contact the development team with specific error details

---

**Note**: This implementation maintains backward compatibility during the transition period, but all new code should use the namespace-based approach for optimal performance and data isolation.
