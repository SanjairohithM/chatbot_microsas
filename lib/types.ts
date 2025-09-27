// Shared types for the application
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Bot {
  id: number
  user_id: string
  name: string
  description: string
  system_prompt: string
  model: string
  temperature: number
  max_tokens: number
  status: "draft" | "active" | "inactive"
  is_deployed: boolean
  deployment_url?: string
  created_at: string
  updated_at: string
}

export interface KnowledgeDocument {
  id: number
  bot_id: number
  title: string
  content: string
  file_url?: string
  file_type?: string
  file_size?: number
  status: "processing" | "indexed" | "error"
  processing_error?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: number
  bot_id: number
  user_id: string
  title: string
  is_test: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: "user" | "assistant" | "system"
  content: string
  image_url?: string
  image_analysis?: string
  tokens_used?: number
  response_time_ms?: number
  created_at: string
}

export interface BotAnalytics {
  id: number
  bot_id: number
  date: string
  total_conversations: number
  total_messages: number
  total_tokens_used: number
  avg_response_time_ms: number
  user_satisfaction_score: number
  daily_summary?: DailySummary
  created_at: string
}

export interface DailySummary {
  issues: string[]
  trends: Record<string, number>
  generated_at: string
  method: 'keyword' | 'ai'
}
