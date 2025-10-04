# Environment Variables Setup Guide

## 🔧 Required Environment Variables

You need to create a `.env` file in your project root with the following variables:

### Essential Variables

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=chatbot-knowledge
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
PINECONE_EMBEDDING_MODEL=text-embedding-3-small
PINECONE_DIMENSION=512
PINECONE_CHUNK_SIZE=1000
PINECONE_CHUNK_OVERLAP=200
PINECONE_SCORE_THRESHOLD=0.02

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=your_database_url_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 How to Set Up

### 1. Create .env File
Create a file named `.env` in your project root directory (same level as package.json)

### 2. Get Your API Keys

#### Pinecone API Key
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Sign up or log in
3. Go to API Keys section
4. Copy your API key
5. Add it to your .env file

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to your .env file

### 3. Database URL
If you're using a local database, it might look like:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatbot_db"
```

### 4. NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

## 🧪 Testing Your Setup

After creating your .env file, run:
```bash
node setup-env.js
```

This will check if all required variables are set correctly.

## 🎯 Pinecone Index Configuration

Your new Pinecone index will be created with:
- **Name**: `chatbot-knowledge` (configurable via PINECONE_INDEX_NAME)
- **Dimension**: 512 (configurable via PINECONE_DIMENSION)
- **Metric**: cosine similarity
- **Type**: serverless
- **Namespaces**: Each bot gets its own namespace (bot_1, bot_2, etc.)
- **Chunk Size**: 1000 characters (configurable via PINECONE_CHUNK_SIZE)
- **Chunk Overlap**: 200 characters (configurable via PINECONE_CHUNK_OVERLAP)
- **Score Threshold**: 0.02 (configurable via PINECONE_SCORE_THRESHOLD)

### Advanced Configuration Options

You can customize the following Pinecone settings in your `.env` file:

```env
# Pinecone Advanced Configuration
PINECONE_EMBEDDING_MODEL=text-embedding-3-small  # OpenAI embedding model
PINECONE_DIMENSION=512                           # Vector dimension (512 for text-embedding-3-small)
PINECONE_CHUNK_SIZE=1000                        # Document chunk size in characters
PINECONE_CHUNK_OVERLAP=200                      # Overlap between chunks in characters
PINECONE_SCORE_THRESHOLD=0.02                   # Minimum similarity score for search results
```

## 🔍 Troubleshooting

### Common Issues

1. **"PINECONE_API_KEY not found"**
   - Make sure your .env file is in the project root
   - Check that the variable name is exactly `PINECONE_API_KEY`
   - Restart your development server after adding the variable

2. **"Index not found"**
   - The index will be created automatically when you first use Pinecone
   - Make sure your API key is valid
   - Check your Pinecone account has sufficient credits

3. **"Environment variables not loading"**
   - Make sure .env file is in the correct location
   - Restart your development server
   - Check for typos in variable names

## ✅ Success Indicators

When everything is set up correctly, you should see:
- `[Pinecone Documents] Index chatbot-knowledge created successfully`
- `[Pinecone Documents] Service initialized successfully`
- No environment variable warnings in the console

## 📝 Next Steps

1. Create your .env file with the required variables
2. Start your application: `npm run dev`
3. Create a bot in the dashboard
4. Upload documents to test the knowledge base
5. Test the chatbot to ensure it's using the documents

---

**Note**: Never commit your .env file to version control. It should be in your .gitignore file.
