# Pinecone Vector Database Setup Instructions

## Current Status

✅ **Pinecone Integration Complete**: The system is configured to work with your existing Pinecone index named "chatbot"

✅ **Index Configuration**: 
- Index Name: `chatbot`
- Dimensions: 512 (text-embedding-3-small)
- Metric: cosine
- Cloud: AWS us-east-1

⚠️ **Missing Component**: OpenAI API key for generating embeddings

## Required Setup

### 1. Get OpenAI API Key

To enable full vector search functionality, you need an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-proj-`)

### 2. Add Environment Variable

Add your OpenAI API key to your environment:

**Option A: Environment File**
Create or update `.env.local`:
```env
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

**Option B: System Environment**
```bash
export OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

### 3. Restart Your Application

After adding the API key, restart your Next.js server:
```bash
npm run dev
```

## How It Works

### Current Architecture

1. **PostgreSQL**: Stores structured data (users, bots, documents, conversation metadata)
2. **Pinecone**: Stores vector embeddings of chat messages for semantic search
3. **OpenAI**: Generates embeddings using `text-embedding-3-small` model

### Message Flow

1. User sends message → Chat API receives request
2. Document search → Find relevant knowledge base content (PostgreSQL)
3. **Vector search** → Find relevant conversation history (Pinecone + OpenAI)
4. Context building → Combine document + conversation context
5. AI response → Generate response with full context
6. **Dual storage** → Save to both PostgreSQL and Pinecone

### Embedding Process

```typescript
// When storing a message:
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: messageContent,
  encoding_format: 'float'
})

// Store in Pinecone with 512-dimensional vector
await pinecone.upsert([{
  id: vectorId,
  values: embedding.data[0].embedding,
  metadata: { conversationId, botId, userId, role, content, timestamp }
}])
```

## Testing the Integration

### 1. Basic Test
```bash
node test-pinecone-simple.js
```

### 2. Full Integration Test
```bash
node test-pinecone-integration.js
```

### 3. Manual API Test
```bash
# Test chat with vector context
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test message", "botId": 11, "userId": 1}'

# Test vector search
curl "http://localhost:3000/api/conversations/vector?botId=11&userId=1&query=test&limit=5"
```

## Expected Behavior

### With OpenAI API Key

✅ **Message Storage**: All chat messages stored as vectors in Pinecone
✅ **Semantic Search**: Find relevant conversation history by meaning
✅ **Context Awareness**: AI responses include previous conversation context
✅ **Cross-Conversation Search**: Search across all conversations for a bot

### Without OpenAI API Key (Current State)

⚠️ **Limited Functionality**: 
- Messages stored in PostgreSQL only
- No vector embeddings generated
- No semantic search across conversations
- Chat still works with document context only

## Troubleshooting

### Common Issues

1. **"OpenAI not initialized" Error**
   ```
   Solution: Add OPENAI_API_KEY to environment variables
   ```

2. **"No relevant messages found"**
   ```
   Solution: Wait for messages to be indexed (1-2 minutes)
   ```

3. **"Index does not exist" Error**
   ```
   Solution: Check Pinecone console - index should be named "chatbot"
   ```

4. **Slow Response Times**
   ```
   Solution: Check OpenAI API rate limits and Pinecone latency
   ```

### Debug Commands

```bash
# Check if OpenAI API key is set
node -e "console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not Set')"

# Test Pinecone connection
node -e "const { PineconeService } = require('./lib/services/pinecone.service'); PineconeService.initialize()"

# Check Pinecone index status
curl -X GET "https://api.pinecone.io/v1/indexes" \
  -H "Api-Key: pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V"
```

## Cost Considerations

### OpenAI Embeddings
- **Model**: text-embedding-3-small
- **Cost**: ~$0.00002 per 1K tokens
- **Typical Usage**: 1-2 cents per 1000 messages

### Pinecone Storage
- **Current Plan**: Starter (free tier)
- **Limits**: 1M RUs, 2M WUs, 2GB storage
- **Typical Usage**: Well within free tier limits

## Next Steps

1. **Get OpenAI API Key** (required for full functionality)
2. **Add to Environment** (restart server)
3. **Test Integration** (run test scripts)
4. **Monitor Usage** (check Pinecone console for record count)

## Benefits Once Fully Configured

🎯 **Enhanced User Experience**:
- AI remembers previous conversations
- Context-aware responses
- Better follow-up question handling

🚀 **Scalable Architecture**:
- Vector database handles millions of conversations
- Semantic search across all chat history
- Hybrid approach: PostgreSQL + Pinecone

📊 **Advanced Analytics**:
- Conversation pattern analysis
- User behavior insights
- Topic clustering and trends

The integration is ready to go - you just need to add your OpenAI API key to unlock the full vector search capabilities! 🚀
