# Pinecone Vector Database Integration Guide

## Overview

This guide explains the Pinecone vector database integration that has been implemented for your chatbot system. The integration provides semantic search capabilities for chat conversations while keeping all other data (users, bots, documents) in PostgreSQL.

## Architecture

### Data Storage Strategy

- **PostgreSQL**: Stores structured data
  - Users, bots, knowledge documents
  - Conversation metadata
  - Message records (for backup/reference)

- **Pinecone**: Stores vector embeddings
  - Chat message content
  - Conversation context
  - Semantic search capabilities

### Key Benefits

1. **Semantic Search**: Find relevant conversation history using meaning, not just keywords
2. **Context Awareness**: Better understanding of conversation flow
3. **Scalability**: Vector database handles large conversation volumes efficiently
4. **Hybrid Approach**: Best of both worlds - structured data in PostgreSQL, semantic search in Pinecone

## Configuration

### Environment Variables

Add to your `.env.local` file:

```env
# Pinecone Configuration
PINECONE_API_KEY="pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V"
```

### Configuration Settings

In `lib/config.ts`:

```typescript
pinecone: {
  apiKey: process.env.PINECONE_API_KEY,
  indexName: "chatbot-conversations",
  cloud: "aws",
  region: "us-east-1",
  embeddingModel: "llama-text-embed-v2"
},
chat: {
  useVectorSearch: true, // Enable Pinecone vector search
}
```

## Pinecone Service

### Core Features

The `PineconeService` provides:

1. **Message Storage**: Store chat messages as vector embeddings
2. **Context Search**: Find relevant conversation history
3. **Conversation History**: Retrieve full conversation threads
4. **Bot-wide Search**: Search across all conversations for a bot

### Key Methods

```typescript
// Store a chat message
await PineconeService.storeChatMessage({
  id: 'msg_123',
  conversationId: 'conv_456',
  botId: 1,
  userId: 1,
  role: 'user',
  content: 'Hello, how are you?',
  timestamp: '2025-01-26T10:00:00Z',
  metadata: { documentContext: true }
})

// Search for relevant conversation context
const messages = await PineconeService.searchConversationContext(
  botId: 1,
  userId: 1,
  query: 'company policies',
  limit: 5
)

// Get conversation history
const history = await PineconeService.getConversationHistory(
  conversationId: 'conv_456',
  limit: 20
)
```

## Chat Integration

### Enhanced Chat Flow

1. **User sends message** → Chat API receives request
2. **Document search** → Find relevant knowledge base content
3. **Vector search** → Find relevant conversation history
4. **Context building** → Combine document + conversation context
5. **AI response** → Generate response with full context
6. **Storage** → Save to both PostgreSQL and Pinecone

### Response Format

Enhanced chat responses now include:

```json
{
  "success": true,
  "message": "AI response...",
  "conversationId": 123,
  "document_search": {
    "query": "user question",
    "matches_found": 3,
    "has_context": true
  },
  "conversation_context": {
    "has_context": true,
    "context_length": 500,
    "vector_search_enabled": true
  }
}
```

## API Endpoints

### 1. Enhanced Chat API (`/api/chat`)

**Features:**
- Automatic vector search for conversation context
- Enhanced system prompts with conversation history
- Dual storage (PostgreSQL + Pinecone)

### 2. Vector Search API (`/api/conversations/vector`)

**GET Parameters:**
- `conversationId`: Get conversation history
- `botId` + `userId` + `query`: Search user's conversations
- `botId` + `query`: Search all bot conversations
- `limit`: Number of results (default: 10)

**Examples:**
```bash
# Get conversation history
GET /api/conversations/vector?conversationId=123&limit=20

# Search user conversations
GET /api/conversations/vector?botId=1&userId=1&query=company policies&limit=5

# Search all bot conversations
GET /api/conversations/vector?botId=1&query=support&limit=10
```

**DELETE:**
```bash
# Delete conversation from vector database
DELETE /api/conversations/vector?conversationId=123
```

## Usage Examples

### Basic Chat with Vector Context

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What are the company policies?',
    botId: 1,
    userId: 1
  })
});

const data = await response.json();
console.log('Response:', data.message);
console.log('Has conversation context:', data.conversation_context.has_context);
```

### Search Conversation History

```javascript
const response = await fetch('/api/conversations/vector?botId=1&userId=1&query=policies&limit=5');
const data = await response.json();

data.data.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Get Full Conversation

```javascript
const response = await fetch('/api/conversations/vector?conversationId=123&limit=50');
const data = await response.json();

console.log(`Found ${data.data.length} messages in conversation`);
```

## Testing

### Run Integration Tests

```bash
node test-pinecone-integration.js
```

### Test Scenarios

1. **Basic Chat**: Test message storage in Pinecone
2. **Follow-up Questions**: Test conversation context retrieval
3. **Vector Search**: Test semantic search across conversations
4. **History Retrieval**: Test conversation history API
5. **Cross-Conversation Search**: Test bot-wide search

## Performance Considerations

### Index Building

- **Initial Setup**: Pinecone index creation takes a few minutes
- **Embedding Time**: First-time message embedding may take 1-2 seconds
- **Search Latency**: Vector search typically takes 100-500ms

### Optimization Tips

1. **Batch Operations**: Store multiple messages together when possible
2. **Index Warmup**: Keep frequently accessed data in memory
3. **Query Optimization**: Use specific filters to narrow search scope
4. **Caching**: Consider caching frequent search results

## Monitoring and Debugging

### Logs to Watch

```bash
# Pinecone initialization
[Pinecone] Service initialized successfully
[Pinecone] Index chatbot-conversations created successfully

# Message storage
[Pinecone] Stored message msg_123 for conversation conv_456

# Search operations
[Pinecone] Found 3 relevant messages for query: "company policies"
[Chat API] Found 2 relevant conversation messages
```

### Common Issues

1. **No Search Results**: Index might still be building
2. **Slow Responses**: Check Pinecone API latency
3. **Storage Failures**: Verify API key and permissions
4. **Context Not Found**: Messages might not be indexed yet

## Best Practices

### Message Storage

- Store both user and assistant messages
- Include relevant metadata (tokens, response time, model)
- Use consistent ID formats
- Include conversation context flags

### Search Optimization

- Use specific queries for better results
- Limit search results to avoid overwhelming context
- Filter by bot/user for relevant results
- Combine with document search for comprehensive context

### Error Handling

- Graceful fallback if Pinecone is unavailable
- Continue chat functionality even if vector search fails
- Log errors for debugging
- Don't block chat responses for vector search issues

## Future Enhancements

### Potential Improvements

1. **Conversation Summarization**: Auto-generate conversation summaries
2. **Sentiment Analysis**: Track conversation sentiment over time
3. **Topic Clustering**: Group related conversations
4. **User Behavior Analytics**: Analyze conversation patterns
5. **Real-time Indexing**: Stream messages to Pinecone in real-time

### Advanced Features

1. **Multi-modal Search**: Include images and documents in vector search
2. **Cross-bot Search**: Search across multiple bots
3. **Temporal Search**: Time-based conversation filtering
4. **Personalization**: User-specific conversation recommendations

## Troubleshooting

### Common Problems

1. **API Key Issues**
   ```bash
   Error: Invalid API key
   Solution: Verify PINECONE_API_KEY in environment
   ```

2. **Index Not Found**
   ```bash
   Error: Index does not exist
   Solution: Check index name and region configuration
   ```

3. **Slow Performance**
   ```bash
   Issue: Vector search taking too long
   Solution: Check Pinecone service status and region
   ```

4. **No Search Results**
   ```bash
   Issue: Search returning empty results
   Solution: Wait for index to build, check query format
   ```

### Debug Commands

```bash
# Test Pinecone connection
node -e "const { PineconeService } = require('./lib/services/pinecone.service'); PineconeService.initialize()"

# Check index status
curl -X GET "https://api.pinecone.io/v1/indexes" \
  -H "Api-Key: YOUR_API_KEY"

# Test vector search
node test-pinecone-integration.js
```

## Conclusion

The Pinecone vector database integration provides powerful semantic search capabilities for your chatbot conversations. By combining PostgreSQL for structured data and Pinecone for vector search, you get the best of both worlds:

- **Reliable data storage** in PostgreSQL
- **Intelligent conversation search** in Pinecone
- **Enhanced context awareness** for better AI responses
- **Scalable architecture** for growing conversation volumes

The system is designed to be robust, with graceful fallbacks and comprehensive error handling to ensure your chatbot continues to work even if vector search is temporarily unavailable.
