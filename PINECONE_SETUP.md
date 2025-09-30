# Pinecone Index Setup Guide

## 🚀 Quick Setup

Your application is configured to automatically create the Pinecone index when needed. Here's what you need to do:

### 1. Environment Variables

Make sure your `.env` file has the following variables:

```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=chatbot-knowledge
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
```

### 2. Index Configuration

The index will be created with these specifications:
- **Name**: `chatbot-knowledge` (or your custom name via PINECONE_INDEX_NAME)
- **Dimension**: 512 (configurable via PINECONE_DIMENSION)
- **Metric**: cosine
- **Type**: serverless
- **Cloud**: aws (or your preferred cloud via PINECONE_CLOUD)
- **Region**: us-east-1 (or your preferred region via PINECONE_REGION)

### 3. Advanced Configuration

You can customize the following settings in your `.env` file:

```env
# Pinecone Advanced Configuration
PINECONE_EMBEDDING_MODEL=text-embedding-3-small  # OpenAI embedding model
PINECONE_DIMENSION=512                           # Vector dimension
PINECONE_CHUNK_SIZE=1000                        # Document chunk size in characters
PINECONE_CHUNK_OVERLAP=200                      # Overlap between chunks
PINECONE_SCORE_THRESHOLD=0.02                   # Minimum similarity score
```

### 4. Namespace Structure

Each bot will have its own namespace:
- **Documents**: `bot_{botId}` (e.g., `bot_1`, `bot_2`, `bot_23`)
- **Conversations**: `bot_{botId}` (same namespace)
- **Isolation**: Each bot's data is completely separate

## 🔧 Manual Setup (Optional)

If you want to create the index manually, you can run:

```bash
# Test index creation
node test-index-creation.js

# Or use the simple setup script
node scripts/create-index-simple.js
```

## 📊 Index Features

### Document Storage
- Stores knowledge base documents for each bot
- Chunks documents into smaller pieces for better search
- Supports PDF, text, and other document formats
- Automatic embedding generation using OpenAI
- **NEW**: Supports website scraping and storage via `/api/scrape-and-store`

### Conversation Storage
- Stores chat history for context
- Enables conversation-aware responses
- Maintains conversation continuity
- Supports multi-turn conversations

### Search Capabilities
- Vector similarity search
- Semantic understanding
- Relevance scoring
- Filtering and ranking

## 🧪 Testing

To test if your index is working:

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Create a bot** in the dashboard

3. **Upload documents** to the bot's knowledge base

4. **Scrape websites** and store them in Pinecone:
   ```bash
   curl -X POST http://localhost:3000/api/scrape-and-store \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com", "botId": 1}'
   ```

5. **Test the chatbot** - it should use the documents for responses

## 🔍 Troubleshooting

### Common Issues

1. **"Index not found" error**:
   - Check your `PINECONE_API_KEY`
   - Verify the index name in your environment variables
   - Ensure your Pinecone account has sufficient credits

2. **"Dimension mismatch" error**:
   - The index is configured for 512 dimensions (text-embedding-3-small)
   - Make sure you're using the correct embedding model

3. **"Namespace not found" error**:
   - Namespaces are created automatically when you store data
   - Each bot gets its own namespace: `bot_{botId}`

### Debug Steps

1. Check the console logs when starting your application
2. Look for Pinecone initialization messages
3. Verify the index creation logs
4. Test with a simple document upload

## 📝 Next Steps

1. **Update your environment variables** if needed
2. **Start your application** - the index will be created automatically
3. **Create your first bot** and upload documents
4. **Test the chatbot** to ensure it's using the knowledge base
5. **Monitor the logs** to see the search and retrieval process

## 🎉 Success Indicators

You'll know the setup is working when you see:
- `[Pinecone Documents] Index chatbot-knowledge created successfully`
- `[Pinecone Documents] Service initialized successfully`
- Document search results in the chat logs
- Bot responses based on uploaded documents

---

**Note**: The index creation is automatic and happens when you first use the Pinecone services. No manual intervention is required!
