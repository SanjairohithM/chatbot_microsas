"use client"

import { useState, useCallback } from 'react'
import type { Message } from '@/lib/types'
import type { Bot } from '@/lib/types'

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  botId: number
  userId: number
  conversationId?: number
  botConfig?: {
    model?: string
    temperature?: number
    max_tokens?: number
  }
}

export interface ChatResponse {
  message: string
  conversationId?: number
  messageId?: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
  finish_reason?: string
  response_time_ms?: number
}

export interface UseChatOptions {
  onError?: (error: string) => void
  onSuccess?: (response: ChatResponse) => void
}

export function useChat(options: UseChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    request: ChatRequest
  ): Promise<ChatResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const responseData = await response.json()
      
      // Handle the API response structure
      if (responseData.success && responseData.data) {
        const data: ChatResponse = {
          message: responseData.data.message,
          conversationId: responseData.data.conversationId,
          messageId: responseData.data.messageId,
          usage: responseData.data.usage,
          model: responseData.data.model,
          finish_reason: responseData.data.finish_reason,
          response_time_ms: responseData.data.response_time_ms
        }
        options.onSuccess?.(data)
        return data
      } else {
        throw new Error(responseData.message || 'Invalid response format')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const sendMessageWithBot = useCallback(async (
    messages: Message[],
    bot: Bot,
    userId: number,
    conversationId?: number
  ): Promise<ChatResponse> => {
    const chatMessages = messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }))

    // Add system prompt if it's the first message and no system message exists
    if (chatMessages.length > 0 && chatMessages[0].role !== 'system' && bot.system_prompt) {
      chatMessages.unshift({
        role: 'system',
        content: bot.system_prompt
      })
    }

    return sendMessage({
      messages: chatMessages,
      botId: bot.id,
      userId,
      conversationId,
      botConfig: {
        model: bot.model,
        temperature: bot.temperature,
        max_tokens: bot.max_tokens
      }
    })
  }, [sendMessage])

  return {
    sendMessage,
    sendMessageWithBot,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}
