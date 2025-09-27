// Application configuration
// In production, these values should come from environment variables

export const config = {
  // OpenAI API Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4o-mini',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
  },
  
  // Pinecone Configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || (() => {
      console.warn('⚠️ PINECONE_API_KEY not found in environment variables')
      return ''
    })(),
    indexName: process.env.PINECONE_INDEX_NAME || "chatbot",
    cloud: process.env.PINECONE_CLOUD || "aws",
    region: process.env.PINECONE_REGION || "us-east-1",
    embeddingModel: process.env.PINECONE_EMBEDDING_MODEL || "text-embedding-3-small"
  },
  
  // Application Configuration
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    name: "Chatbot Platform",
  },
  
  // Chat Configuration
  chat: {
    maxMessagesPerConversation: 100,
    defaultSystemPrompt: "You are a helpful AI assistant. Be polite, professional, and try to provide accurate and useful responses.",
    useVectorSearch: true, // Enable Pinecone vector search for conversations
  }
} as const

// Type for the configuration
export type Config = typeof config
