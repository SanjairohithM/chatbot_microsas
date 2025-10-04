import { useState, useCallback, useRef } from 'react'

export interface StreamingMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  timestamp: Date
}

export interface StreamingChatOptions {
  botId: number
  userId: string
  conversationId?: number
  onMessageUpdate?: (message: StreamingMessage) => void
  onComplete?: (message: StreamingMessage) => void
  onError?: (error: string) => void
}

export function useSimpleStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<StreamingMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; image_url?: string }>,
    options: StreamingChatOptions
  ) => {
    if (isStreaming) {
      console.warn('Already streaming, ignoring new request')
      return
    }

    setIsStreaming(true)
    setError(null)
    setCurrentMessage(null)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          botId: options.botId,
          userId: options.userId,
          conversationId: options.conversationId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let messageId: string | null = null
      let conversationId: number | null = null
      let fullContent = ''

      // Create initial message
      const streamingMessage: StreamingMessage = {
        id: `temp_${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      }

      setCurrentMessage(streamingMessage)

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'metadata':
                  conversationId = data.data.conversationId
                  break
                  
                case 'content':
                  // Add content immediately
                  fullContent += data.data.content
                  console.log('Streaming content:', data.data.content, 'Full content:', fullContent)
                  
                  // Update message with current content
                  const updatedMessage: StreamingMessage = {
                    ...streamingMessage,
                    content: fullContent,
                    isStreaming: true
                  }
                  setCurrentMessage(updatedMessage)
                  options.onMessageUpdate?.(updatedMessage)
                  break
                  
                case 'complete':
                  messageId = data.data.messageId?.toString() || `msg_${Date.now()}`
                  const completeMessage: StreamingMessage = {
                    id: messageId,
                    role: 'assistant',
                    content: data.data.fullResponse,
                    isStreaming: false,
                    timestamp: new Date(),
                  }
                  setCurrentMessage(completeMessage)
                  options.onComplete?.(completeMessage)
                  break
                  
                case 'error':
                  throw new Error(data.data.error)
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError)
            }
          }
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user')
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
      console.error('Streaming chat error:', error)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [isStreaming])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
    currentMessage,
    error,
    clearError,
  }
}
