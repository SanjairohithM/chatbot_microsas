# Direct Pinecone Upload Guide

## Overview

Your chatbot system now supports **direct document upload to Pinecone vector database** without storing files locally. This means:

✅ **Documents go directly to Pinecone** - No local file storage  
✅ **Immediate searchability** - Documents are instantly available for chat  
✅ **Automatic cleanup** - Temporary files are removed after processing  
✅ **Fallback support** - Falls back to regular upload if Pinecone fails  

## How It Works

### 1. Upload Flow
```
Document Upload → Process Content → Store in Pinecone → Clean up temp files
```

### 2. API Endpoints

#### New: Direct Pinecone Upload
- **Endpoint**: `/api/upload-to-pinecone`
- **Method**: `POST`
- **Purpose**: Upload documents directly to Pinecone vector database

#### Enhanced: Regular Upload
- **Endpoint**: `/api/upload`
- **Method**: `POST`
- **Enhancement**: Now supports `processDirectly=true` parameter

#### Search Documents
- **Endpoint**: `/api/search-documents-pinecone`
- **Method**: `POST` or `GET`
- **Purpose**: Search documents stored in Pinecone

## Usage Examples

### 1. Web Interface (Automatic)

When you upload a document through the bot dashboard:

1. **Go to Bot Dashboard** → Select your bot
2. **Upload Document** → Choose your PDF/text file
3. **Automatic Processing** → Document is processed and stored in Pinecone
4. **Immediate Availability** → Document is ready for chat queries

The system automatically tries direct Pinecone upload first, with fallback to regular upload.

### 2. API Usage

#### Direct Pinecone Upload
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('botId', '1');

const response = await fetch('/api/upload-to-pinecone', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Document stored in Pinecone:', result.data);
```

#### Search Documents
```javascript
const response = await fetch('/api/search-documents-pinecone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    botId: 1,
    query: 'company policies',
    limit: 5
  })
});

const results = await response.json();
console.log('Found documents:', results.data.results);
```

#### Chat with Document Context
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

const chat = await response.json();
console.log('AI Response:', chat.message);
console.log('Document context used:', chat.document_search.has_context);
```

## Key Features

### ✅ Direct Pinecone Storage
- Documents are processed and stored directly in Pinecone
- No permanent local file storage
- Temporary files are automatically cleaned up

### ✅ Semantic Search
- Vector-based document search
- Find relevant content by meaning, not just keywords
- Relevance scoring for better results

### ✅ Chat Integration
- Chat API automatically searches Pinecone for relevant documents
- Provides context to AI responses
- Enhanced responses with document knowledge

### ✅ Fallback Support
- If direct Pinecone upload fails, falls back to regular upload
- Ensures reliability and backward compatibility
- Graceful error handling

## File Structure

### New Files Added:
```
app/api/upload-to-pinecone/route.ts     # Direct Pinecone upload API
test-pinecone-upload-simple.js          # Test script
DIRECT_PINECONE_UPLOAD_GUIDE.md         # This guide
```

### Modified Files:
```
app/api/upload/route.ts                  # Enhanced with direct processing
components/dashboard/document-upload.tsx # Auto Pinecone upload
```

## Testing

### 1. Run Test Script
```bash
node test-pinecone-upload-simple.js
```

### 2. Manual Testing
1. Start development server: `npm run dev`
2. Go to bot dashboard
3. Upload a document
4. Check console logs for Pinecone processing
5. Test chat with document-related questions

### 3. Expected Console Output
```
🚀 Attempting direct Pinecone upload...
✅ Direct Pinecone upload successful
[Pinecone Documents] Storing document: filename.pdf
[Pinecone Documents] ✅ Successfully stored document with X chunks
```

## Benefits

### 🚀 Performance
- **Faster uploads**: Direct processing without intermediate storage
- **Instant availability**: Documents ready for search immediately
- **Reduced storage**: No local file accumulation

### 🔍 Better Search
- **Semantic understanding**: Find documents by meaning
- **Relevance scoring**: Best matches first
- **Context-aware**: Better AI responses with document knowledge

### 🛡️ Reliability
- **Automatic fallback**: Falls back to regular upload if needed
- **Error handling**: Graceful failure recovery
- **Cleanup**: Automatic temporary file removal

## Configuration

### Environment Variables
Ensure you have Pinecone configured in your `.env.local`:
```env
PINECONE_API_KEY="your-pinecone-api-key"
```

### Pinecone Settings
The system uses these default settings:
- **Index Name**: "chatbot"
- **Embedding Model**: DeepSeek embeddings
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters

## Troubleshooting

### Common Issues

1. **Upload fails with Pinecone error**
   - Check Pinecone API key
   - Verify index exists
   - Check network connectivity

2. **Documents not found in search**
   - Wait a few seconds for indexing
   - Check bot ID matches
   - Verify document was uploaded successfully

3. **Chat doesn't use document context**
   - Ensure documents exist in Pinecone
   - Check search query relevance
   - Verify bot configuration

### Debug Commands
```bash
# Test Pinecone connection
node test-pinecone-upload-simple.js

# Check existing documents
curl -X POST http://localhost:3000/api/search-documents-pinecone \
  -H "Content-Type: application/json" \
  -d '{"botId": 1, "query": "test", "limit": 5}'
```

## Migration from Local Storage

If you have existing documents in local storage that you want to move to Pinecone:

1. **Use existing scripts**:
   ```bash
   node process-all-uploads-to-pinecone.js
   ```

2. **Or upload new documents** through the web interface - they'll automatically go to Pinecone

## Next Steps

1. **Upload your documents** using the web interface
2. **Test document search** using the search API
3. **Chat with your bot** to see document context in action
4. **Monitor console logs** to see Pinecone processing

Your documents are now stored in a powerful vector database that enables semantic search and intelligent document retrieval for your chatbot! 🎉
