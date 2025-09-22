"use client"

import { useState, useCallback } from 'react'
import type { Message } from '@/lib/types'
import type { Bot } from '@/lib/types'

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  botConfig?: {
    model?: string
    temperature?: number
    max_tokens?: number
  }
}

export interface ChatResponse {
  message: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
  finish_reason?: string
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

      const data: ChatResponse = await response.json()
      options.onSuccess?.(data)
      return data

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
    bot: Bot
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
