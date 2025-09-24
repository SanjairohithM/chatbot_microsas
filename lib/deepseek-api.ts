// DeepSeek API service for chatbot functionality

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Configuration - in production, these should come from environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-f1ff59dc5a8c42fb850267e784b1864a"
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions"

export class DeepSeekAPI {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || DEEPSEEK_API_KEY
    this.apiUrl = apiUrl || DEEPSEEK_API_URL
  }

  async generateResponse(
    messages: DeepSeekMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
    } = {}
  ): Promise<DeepSeekResponse> {
    const requestBody: DeepSeekRequest = {
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      stream: false
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || 'Unknown error'
          }`
        )
      }

      const data: DeepSeekResponse = await response.json()
      return data
    } catch (error) {
      console.error('DeepSeek API request failed:', error)
      throw error
    }
  }

  async generateStreamResponse(
    messages: DeepSeekMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
    } = {},
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const requestBody: DeepSeekRequest = {
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      stream: true
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || 'Unknown error'
          }`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullResponse += content
                  onChunk?.(content)
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      return fullResponse
    } catch (error) {
      console.error('DeepSeek streaming API request failed:', error)
      throw error
    }
  }

}

// Default instance
export const deepSeekAPI = new DeepSeekAPI()
