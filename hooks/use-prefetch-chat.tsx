import { useState, useCallback, useRef, useEffect } from 'react'

export interface PrefetchData {
  documentContext: string
  searchResults: any
  conversationContext: string
  isReady: boolean
  botId: number
  query: string
}

export interface PrefetchChatOptions {
  botId: number
  userId: string
  conversationId?: number
  onPrefetchComplete?: (data: PrefetchData) => void
  onMessageUpdate?: (message: any) => void
  onComplete?: (message: any) => void
  onError?: (error: string) => void
}

export function usePrefetchChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [prefetchData, setPrefetchData] = useState<PrefetchData | null>(null)
  const [isPrefetching, setIsPrefetching] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Prefetch data when user types (with debounce)
  const prefetchForQuery = useCallback(async (
    query: string,
    options: PrefetchChatOptions
  ) => {
    if (!query.trim() || query.length < 3) {
      setPrefetchData(null)
      return
    }

    // Clear previous timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }

    // Debounce prefetch by 500ms
    prefetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsPrefetching(true)
        console.log('🔍 Prefetching data for query:', query)

        const response = await fetch('/api/chat/prefetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            botId: options.botId,
            userId: options.userId,
            conversationId: options.conversationId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Prefetch failed: ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ Prefetch completed:', data)

        const prefetchResult: PrefetchData = {
          documentContext: data.documentContext || '',
          searchResults: data.searchResults || null,
          conversationContext: data.conversationContext || '',
          isReady: true,
          botId: options.botId,
          query: query
        }

        setPrefetchData(prefetchResult)
        options.onPrefetchComplete?.(prefetchResult)

      } catch (error) {
        console.error('❌ Prefetch failed:', error)
        // Don't show error to user for prefetch failures
      } finally {
        setIsPrefetching(false)
      }
    }, 500) // 500ms debounce

  }, [])

  const sendMessage = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; image_url?: string }>,
    options: PrefetchChatOptions
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
      const lastMessage = messages[messages.length - 1]
      const query = lastMessage.content

      // Use prefetched data if available and matches current query
      let prefetchPayload = null
      if (prefetchData && prefetchData.isReady && prefetchData.query === query) {
        console.log('🚀 Using prefetched data for faster response')
        prefetchPayload = {
          documentContext: prefetchData.documentContext,
          searchResults: prefetchData.searchResults,
          conversationContext: prefetchData.conversationContext,
          usePrefetch: true
        }
      }

      console.log('🚀 Sending message to chat/stream API:', {
        messages,
        botId: options.botId,
        userId: options.userId,
        conversationId: options.conversationId,
        prefetchData: prefetchPayload
      })

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
          prefetchData: prefetchPayload
        }),
        signal: abortControllerRef.current.signal,
      })

      console.log('📡 Chat/stream API response status:', response.status)

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
      const streamingMessage = {
        id: `temp_${Date.now()}`,
        role: 'assistant' as const,
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
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'metadata':
                  conversationId = data.data.conversationId
                  break
                  
                case 'content':
                  fullContent += data.data.content
                  console.log('Streaming content:', data.data.content, 'Full content:', fullContent)
                  
                  const updatedMessage = {
                    ...streamingMessage,
                    content: fullContent,
                    isStreaming: true
                  }
                  setCurrentMessage(updatedMessage)
                  options.onMessageUpdate?.(updatedMessage)
                  break
                  
                case 'complete':
                  messageId = data.data.messageId?.toString() || `msg_${Date.now()}`
                  const completeMessage = {
                    id: messageId,
                    role: 'assistant' as const,
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
  }, [isStreaming, prefetchData])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
    }
  }, [])

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
    currentMessage,
    error,
    clearError,
    prefetchForQuery,
    isPrefetching,
    prefetchData
  }
}
