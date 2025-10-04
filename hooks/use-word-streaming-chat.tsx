import { useState, useCallback, useRef, useEffect } from 'react'

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

export function useWordStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<StreamingMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [displayedContent, setDisplayedContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fullContentRef = useRef('')
  const wordsQueueRef = useRef<string[]>([])

  // Word-by-word typing effect
  useEffect(() => {
    if (isStreaming && wordsQueueRef.current.length > 0) {
      console.log('Starting typing effect, queue length:', wordsQueueRef.current.length)
      typingIntervalRef.current = setInterval(() => {
        if (wordsQueueRef.current.length > 0) {
          const nextWord = wordsQueueRef.current.shift()
          console.log('Displaying word:', nextWord)
          if (nextWord) {
            setDisplayedContent(prev => {
              const newContent = prev + nextWord
              console.log('New displayed content:', newContent)
              
              // Update current message with displayed content
              if (currentMessage) {
                const updatedMessage: StreamingMessage = {
                  ...currentMessage,
                  content: newContent,
                  isStreaming: true
                }
                setCurrentMessage(updatedMessage)
              }
              
              return newContent
            })
          }
        } else {
          // No more words to display
          console.log('No more words to display')
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
            typingIntervalRef.current = null
          }
        }
      }, 30) // Faster typing for better responsiveness
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
    }
  }, [isStreaming, currentMessage])

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
    setDisplayedContent('')
    fullContentRef.current = ''
    wordsQueueRef.current = []

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
                  // Add new content to the full content
                  fullContentRef.current += data.data.content
                  
                  // Add the content directly to the queue for immediate display
                  const content = data.data.content
                  console.log('Streaming content received:', content)
                  if (content.trim()) {
                    wordsQueueRef.current.push(content)
                    console.log('Added to queue, queue length:', wordsQueueRef.current.length)
                  }
                  break
                  
                case 'complete':
                  messageId = data.data.messageId?.toString() || `msg_${Date.now()}`
                  
                  // Wait for all words to be displayed before marking as complete
                  const waitForTyping = () => {
                    if (wordsQueueRef.current.length === 0 && !typingIntervalRef.current) {
                      const completeMessage: StreamingMessage = {
                        id: messageId,
                        role: 'assistant',
                        content: fullContentRef.current,
                        isStreaming: false,
                        timestamp: new Date(),
                      }
                      setCurrentMessage(completeMessage)
                      options.onComplete?.(completeMessage)
                    } else {
                      // Check again in 100ms
                      setTimeout(waitForTyping, 100)
                    }
                  }
                  
                  // Start waiting for typing to complete
                  setTimeout(waitForTyping, 100)
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
      
      // Clear any remaining typing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
    }
  }, [isStreaming])

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Clear typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
    
    // Clear word queue
    wordsQueueRef.current = []
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
    currentMessage,
    displayedContent,
    error,
    clearError,
  }
}
