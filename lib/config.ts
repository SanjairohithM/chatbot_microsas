// Application configuration
// In production, these values should come from environment variables

export const config = {
  // DeepSeek API Configuration
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "sk-f1ff59dc5a8c42fb850267e784b1864a",
    apiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions",
    defaultModel: "deepseek-chat",
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
  },
  
  // Pinecone Configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || "pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V",
    indexName: "chatbot",
    cloud: "aws",
    region: "us-east-1",
    embeddingModel: "text-embedding-3-small"
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
