import type { Bot, KnowledgeDocument, Conversation, BotAnalytics } from "./types"

// Mock data for development
export const mockBots: Bot[] = [
  {
    id: 1,
    user_id: 1,
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support tickets",
    system_prompt:
      "You are a helpful customer support assistant. Be polite, professional, and try to resolve customer issues efficiently.",
    model: "deepseek-chat",
    temperature: 0.7,
    max_tokens: 1000,
    status: "active",
    is_deployed: true,
    deployment_url: "https://bot1.example.com",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z",
  },
  {
    id: 2,
    user_id: 1,
    name: "Sales Assistant",
    description: "Helps with product recommendations and sales inquiries",
    system_prompt:
      "You are a knowledgeable sales assistant. Help customers find the right products and answer their questions about features and pricing.",
    model: "deepseek-chat",
    temperature: 0.5,
    max_tokens: 800,
    status: "active",
    is_deployed: false,
    created_at: "2024-01-18T09:15:00Z",
    updated_at: "2024-01-22T11:45:00Z",
  },
  {
    id: 3,
    user_id: 1,
    name: "FAQ Bot",
    description: "Answers frequently asked questions",
    system_prompt:
      "You are an FAQ bot. Provide clear, concise answers to common questions about our products and services.",
    model: "deepseek-chat",
    temperature: 0.3,
    max_tokens: 500,
    status: "draft",
    is_deployed: false,
    created_at: "2024-01-20T16:20:00Z",
    updated_at: "2024-01-20T16:20:00Z",
  },
]

export const mockKnowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 1,
    bot_id: 1,
    title: "Product Catalog",
    content: "Our comprehensive product catalog includes laptops, desktops, accessories, and software solutions.",
    file_type: "text",
    file_size: 1024,
    status: "indexed",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    bot_id: 1,
    title: "Return Policy",
    content: "We offer a 30-day return policy for all products. Items must be in original condition.",
    file_type: "text",
    file_size: 512,
    status: "indexed",
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-15T11:00:00Z",
  },
]

export const mockConversations: Conversation[] = [
  {
    id: 1,
    bot_id: 1,
    user_id: 1,
    title: "Product inquiry about laptops",
    is_test: false,
    created_at: "2024-01-21T09:00:00Z",
    updated_at: "2024-01-21T09:15:00Z",
  },
  {
    id: 2,
    bot_id: 1,
    user_id: 1,
    title: "Return request assistance",
    is_test: false,
    created_at: "2024-01-21T14:30:00Z",
    updated_at: "2024-01-21T14:45:00Z",
  },
]

export const mockAnalytics: BotAnalytics[] = [
  {
    id: 1,
    bot_id: 1,
    date: "2024-01-21",
    total_conversations: 25,
    total_messages: 75,
    total_tokens_used: 3750,
    avg_response_time_ms: 710.6,
    user_satisfaction_score: 4.6,
    created_at: "2024-01-22T00:00:00Z",
  },
  {
    id: 2,
    bot_id: 2,
    date: "2024-01-21",
    total_conversations: 12,
    total_messages: 36,
    total_tokens_used: 2880,
    avg_response_time_ms: 780.5,
    user_satisfaction_score: 4.2,
    created_at: "2024-01-22T00:00:00Z",
  },
]
