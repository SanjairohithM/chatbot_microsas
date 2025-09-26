# Enhanced Document Search & Chat Integration Guide

## Overview

This guide explains the enhanced document search functionality that has been implemented in your chatbot system. The improvements provide better context retrieval, more accurate search results, and enhanced chat responses that utilize your knowledge base documents effectively.

## Key Features

### 1. Enhanced Search Strategies

The document search now uses multiple strategies to find relevant content:

- **Exact Match**: Finds exact phrase matches (highest priority)
- **Partial Match**: Finds individual word matches with context
- **Semantic Match**: Basic semantic similarity based on keyword overlap

### 2. Improved Context Extraction

- **Better Context**: Extracts surrounding sentences for better understanding
- **Relevance Scoring**: Scores results based on match quality and frequency
- **Stop Word Filtering**: Removes common words to focus on meaningful terms

### 3. Enhanced Chat Integration

- **Rich System Prompts**: Includes detailed document context and search instructions
- **Search Result Summary**: Provides information about search quality
- **Document Attribution**: Helps the AI cite sources from your knowledge base

## Database Schema

Your `KnowledgeDocument` model stores:

```prisma
model KnowledgeDocument {
  id               Int      @id @default(autoincrement())
  bot_id           Int
  title            String
  content          String   // Scraped/processed content
  file_url         String?
  file_type        String?
  file_size        Int?
  status           String   @default("processing")
  processing_error String?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  bot              Bot      @relation(fields: [bot_id], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### 1. Enhanced Chat API (`/api/chat`)

**Request Format:**
```json
{
  "message": "What services do you offer?",
  "botId": 1,
  "userId": 1,
  "conversationId": 123
}
```

**Enhanced Response:**
```json
{
  "success": true,
  "message": "Based on our knowledge base...",
  "conversationId": 123,
  "messageId": 456,
  "document_search": {
    "query": "What services do you offer?",
    "total_documents": 5,
    "matches_found": 3,
    "has_context": true,
    "summary": {
      "exactMatches": 1,
      "partialMatches": 2,
      "semanticMatches": 0,
      "averageScore": 15.5
    }
  }
}
```

### 2. Document Search API (`/api/search-documents`)

**Request Format:**
```json
{
  "botId": 1,
  "query": "What services do you offer?",
  "limit": 10
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "query": "What services do you offer?",
    "totalDocuments": 5,
    "results": [
      {
        "document": {
          "id": 1,
          "title": "Company Services",
          "content": "..."
        },
        "relevanceScore": 25,
        "matchedContent": "We offer web development...",
        "context": "Our company specializes in...",
        "matchType": "exact"
      }
    ],
    "summary": {
      "exactMatches": 1,
      "partialMatches": 2,
      "semanticMatches": 0,
      "averageScore": 15.5
    }
  }
}
```

## How It Works

### 1. Document Processing

1. **Upload**: Documents are uploaded via `/api/upload`
2. **Processing**: Content is extracted using `DocumentProcessorService`
3. **Storage**: Processed content is stored in the `content` field
4. **Indexing**: Documents are marked as "indexed" when ready

### 2. Search Process

1. **Query Analysis**: Extracts meaningful terms, removes stop words
2. **Multi-Strategy Search**: Uses exact, partial, and semantic matching
3. **Relevance Scoring**: Calculates scores based on match quality
4. **Context Extraction**: Finds best context around matches
5. **Result Ranking**: Sorts by relevance score

### 3. Chat Integration

1. **Query Processing**: Extracts user message text
2. **Document Search**: Finds relevant content from knowledge base
3. **Context Enhancement**: Adds document context to system prompt
4. **AI Response**: Generates response using enhanced context
5. **Result Tracking**: Includes search metadata in response

## Usage Examples

### Testing Document Search

```bash
# Run the test script
node test-document-search.js
```

### Adding Documents to a Bot

```javascript
// 1. Upload document
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// 2. Create knowledge document
const docResponse = await fetch('/api/knowledge-documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bot_id: 1,
    title: 'Company Handbook',
    file_url: '/uploads/handbook.pdf',
    file_type: 'pdf'
  })
});

// 3. Process document
const processResponse = await fetch('/api/bots/1/process-documents', {
  method: 'POST'
});
```

### Chatting with Document Context

```javascript
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is your refund policy?',
    botId: 1,
    userId: 1
  })
});

const data = await chatResponse.json();
console.log('Bot Response:', data.message);
console.log('Search Results:', data.document_search);
```

## Best Practices

### 1. Document Preparation

- **Clean Content**: Ensure documents have clear, well-structured text
- **Descriptive Titles**: Use meaningful titles for better search results
- **Regular Updates**: Keep knowledge base documents current

### 2. Search Optimization

- **Specific Queries**: Ask specific questions for better matches
- **Keyword Usage**: Use relevant keywords from your documents
- **Context Awareness**: Provide context in your questions

### 3. Bot Configuration

- **System Prompts**: Create clear system prompts that guide the AI
- **Temperature Settings**: Use lower temperature for more consistent responses
- **Token Limits**: Set appropriate token limits for your use case

## Troubleshooting

### Common Issues

1. **No Search Results**
   - Check if documents are properly indexed (status = "indexed")
   - Verify document content is not empty
   - Try different query terms

2. **Poor Search Quality**
   - Ensure documents have relevant content
   - Check if query terms match document vocabulary
   - Consider adding more specific documents

3. **Chat Not Using Documents**
   - Verify bot has associated knowledge documents
   - Check system prompt configuration
   - Review search result logs

### Debugging

Enable detailed logging by checking console output:

```javascript
// Look for these log messages:
console.log('[DocumentSearch] Searching documents for bot...');
console.log('[DocumentSearch] Found X documents with content');
console.log('[DocumentSearch] Returning X search results');
console.log('[Chat API] Document context length: X');
```

## Performance Considerations

### 1. Search Performance

- **Document Size**: Large documents may slow down search
- **Query Complexity**: Complex queries take longer to process
- **Result Limits**: Limit results to improve performance

### 2. Memory Usage

- **Content Storage**: Large document content uses database space
- **Search Caching**: Consider implementing search result caching
- **Cleanup**: Regularly clean up old or unused documents

## Future Enhancements

### Potential Improvements

1. **Vector Search**: Implement semantic vector search for better matching
2. **Search Caching**: Cache frequent search results
3. **Document Chunking**: Split large documents into smaller chunks
4. **Search Analytics**: Track search patterns and improve results
5. **Multi-language Support**: Support for multiple languages

### Integration Opportunities

1. **External APIs**: Integrate with external knowledge sources
2. **Real-time Updates**: Update search index in real-time
3. **User Feedback**: Collect user feedback on search quality
4. **A/B Testing**: Test different search strategies

## Conclusion

The enhanced document search functionality provides a robust foundation for knowledge-based chatbot interactions. By implementing multiple search strategies, better context extraction, and improved chat integration, your chatbot can now provide more accurate and relevant responses based on your document knowledge base.

For questions or issues, refer to the troubleshooting section or check the console logs for detailed debugging information.
