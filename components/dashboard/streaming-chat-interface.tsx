"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Square, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageCircle,
  Bot,
  User,
  Settings,
  Loader2,
  Image
} from "lucide-react"
import { ResponseModelSelector, ResponseModel } from "./response-model-selector"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import { useStreamingChat, StreamingMessage } from "@/hooks/use-streaming-chat"
import { useWordStreamingChat } from "@/hooks/use-word-streaming-chat"
import { useSimpleStreamingChat } from "@/hooks/use-simple-streaming-chat"
import { usePrefetchChat } from "@/hooks/use-prefetch-chat"
import { PrefetchChatInput } from "./prefetch-chat-input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
  isStreaming?: boolean
  imageUrl?: string
}

interface StreamingChatInterfaceProps {
  botId: number
  conversationId?: number
  userId?: number
  onConversationUpdate?: (conversationId: number) => void
  className?: string
}

export function StreamingChatInterface({
  botId,
  conversationId,
  userId,
  onConversationUpdate,
  className
}: StreamingChatInterfaceProps) {
  const [responseModel, setResponseModel] = useState<ResponseModel>('chat')
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bot, setBot] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice chat hook
  const {
    startRecording,
    stopRecording,
    speak,
    isRecording,
    isProcessing,
    error: voiceError
  } = useVoiceChat()

  // Prefetch streaming chat hook
  const {
    sendMessage: sendStreamingMessage,
    stopStreaming,
    isStreaming,
    currentMessage,
    error: streamingError,
    clearError,
    prefetchForQuery,
    isPrefetching,
    prefetchData
  } = usePrefetchChat()

  // Load bot data to get response mode
  useEffect(() => {
    const loadBot = async () => {
      try {
        const response = await fetch(`/api/bots/${botId}`)
        if (response.ok) {
          const result = await response.json()
          setBot(result.data)
          // Set response model based on bot's interaction_mode
          if (result.data?.interaction_mode) {
            console.log('🤖 Bot interaction mode:', result.data.interaction_mode)
            setResponseModel(result.data.interaction_mode as ResponseModel)
          }
        }
      } catch (error) {
        console.error('Failed to load bot:', error)
      }
    }

    if (botId) {
      loadBot()
    }
  }, [botId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentMessage])

  // Handle streaming message updates
  useEffect(() => {
    if (currentMessage && currentMessage.isStreaming) {
      // Update the last message with streaming content
      setMessages(prev => {
        const newMessages = [...prev]
        const lastIndex = newMessages.length - 1
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: currentMessage.content,
            imageUrl: currentMessage.imageUrl,
            isStreaming: true
          }
        }
        return newMessages
      })
    } else if (currentMessage && !currentMessage.isStreaming) {
      // Final message - update with complete content
      setMessages(prev => {
        const newMessages = [...prev]
        const lastIndex = newMessages.length - 1
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: currentMessage.content,
            imageUrl: currentMessage.imageUrl,
            isStreaming: false
          }
        }
        return newMessages
      })
    }
  }, [currentMessage])

  // Handle streaming errors
  useEffect(() => {
    if (streamingError) {
      setError(streamingError)
      setIsLoading(false)
    }
  }, [streamingError])

  const handleSubmit = async (messageText: string, imageUrl?: string) => {
    console.log('📝 handleSubmit called with:', { messageText, imageUrl, isLoading, isStreaming })
    
    if (!messageText.trim() || isLoading || isStreaming) {
      console.log('⚠️ handleSubmit early return:', { messageText: messageText.trim(), isLoading, isStreaming })
      return
    }

    console.log('✅ Proceeding with handleSubmit')

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    clearError()

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Prepare messages for API
      const apiMessages = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: messageText.trim(),
          ...(imageUrl && { image_url: imageUrl })
        }
      ]

      console.log('🚀 Calling sendStreamingMessage with:', {
        apiMessages,
        botId,
        userId: userId?.toString() || '1',
        conversationId
      })

      await sendStreamingMessage(apiMessages, {
        botId,
        userId: userId?.toString() || '1',
        conversationId,
        onMessageUpdate: (streamingMsg) => {
          // Update the assistant message with streaming content
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: streamingMsg.content,
                imageUrl: streamingMsg.imageUrl,
                isStreaming: true
              }
            }
            return newMessages
          })
        },
        onComplete: (completeMsg) => {
          // Final message
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: completeMsg.content,
                imageUrl: completeMsg.imageUrl,
                isStreaming: false
              }
            }
            return newMessages
          })
          setIsLoading(false)

          // Handle conversation update
          if (onConversationUpdate && conversationId) {
            onConversationUpdate(conversationId)
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg)
          setIsLoading(false)
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
      setIsLoading(false)
    }
  }

  const handleStopStreaming = () => {
    stopStreaming()
    setIsLoading(false)
  }

  const handleVoiceSubmit = async (transcript: string) => {
    if (!transcript.trim() || isLoading || isStreaming) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: transcript.trim(),
      timestamp: new Date()
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    clearError()

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Prepare messages for API
      const apiMessages = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: transcript.trim()
        }
      ]

      await sendStreamingMessage(apiMessages, {
        botId,
        userId: userId?.toString() || '1',
        conversationId,
        onMessageUpdate: (streamingMsg) => {
          // Update the assistant message with streaming content
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: streamingMsg.content,
                imageUrl: streamingMsg.imageUrl,
                isStreaming: true
              }
            }
            return newMessages
          })
        },
        onComplete: async (completeMsg) => {
          // Final message
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: completeMsg.content,
                imageUrl: completeMsg.imageUrl,
                isStreaming: false
              }
            }
            return newMessages
          })
          setIsLoading(false)

          // Auto-play voice response if in voice mode
          if (responseModel === 'voice') {
            console.log('🔊 Auto-playing voice response in voice mode:', completeMsg.content)
            try {
              await speak(completeMsg.content)
              console.log('✅ Voice response played successfully')
            } catch (error) {
              console.error('❌ Failed to play voice response:', error)
            }
          } else {
            console.log('💬 Chat mode - not auto-playing voice response')
          }

          // Handle conversation update
          if (onConversationUpdate && conversationId) {
            onConversationUpdate(conversationId)
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg)
          setIsLoading(false)
        }
      })
    } catch (error) {
      console.error('Failed to send voice message:', error)
      setError('Failed to send message. Please try again.')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const messageText = (e.target as HTMLTextAreaElement).value
      if (messageText.trim()) {
        handleSubmit(messageText)
      }
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <Card className="mb-4 bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Response Mode:</span>
              <div className="flex items-center gap-2">
                {responseModel === 'voice' ? (
                  <Volume2 className="h-4 w-4 text-blue-600" />
                ) : responseModel === 'image' ? (
                  <Image className="h-4 w-4 text-purple-600" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                  responseModel === 'voice' ? 'text-blue-600' : 
                  responseModel === 'image' ? 'text-purple-600' : 'text-green-600'
                }`}>
                  {responseModel === 'voice' ? 'Voice Response' : 
                   responseModel === 'image' ? 'Image Generation' : 'Chat Response'}
                </span>
                <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">
                  {bot?.name || 'Bot'}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Mode set during bot creation
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex gap-3 max-w-[80%]",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  msg.role === 'user' 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-lg px-4 py-2",
                  msg.role === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                {msg.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={msg.imageUrl} 
                      alt="Generated image" 
                      className="max-w-xs max-h-64 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="inline-block w-0.5 h-4 bg-current ml-1 typing-cursor" />
                  )}
                </div>
                {msg.role === 'assistant' && msg.content && responseModel !== 'voice' && (
                  <VoicePlayButton text={msg.content} />
                )}
                <div className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Debug: Test Voice Output (only in development) */}
      {/* {process.env.NODE_ENV === 'development' && responseModel === 'voice' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm mb-2">Debug: Test voice output</p>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              console.log('🧪 Testing voice output manually')
              try {
                await speak("Hello, this is a test voice message")
                console.log('✅ Test voice output completed')
              } catch (error) {
                console.error('❌ Test voice output failed:', error)
              }
            }}
            className="text-xs"
          >
            Test Voice Output
          </Button>
        </div>
      )} */}

      {/* Input */}
      {responseModel === 'chat' ? (
        <PrefetchChatInput
          onSendMessage={handleSubmit}
          isProcessing={isLoading || isStreaming}
          disabled={isLoading || isStreaming}
          placeholder="Type your message..."
          botId={botId}
          userId={userId || 1}
          conversationId={conversationId}
          className="w-full"
        />
      ) : (
        <VoiceChatInput
          onTranscript={handleVoiceSubmit}
          isRecording={isRecording}
          isProcessing={isProcessing || isStreaming}
          error={voiceError}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onStopStreaming={isStreaming ? handleStopStreaming : undefined}
        />
      )}
    </div>
  )
}

// Voice Play Button Component
interface VoicePlayButtonProps {
  text: string
}

function VoicePlayButton({ text }: VoicePlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlaying(false)
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'alloy',
          model: 'tts-1',
          format: 'mp3'
        })
      })

      if (!res.ok) {
        throw new Error('TTS request failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      await audio.play()
      setIsPlaying(true)

    } catch (e) {
      console.error('TTS playback failed:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      onClick={handlePlay}
      disabled={isLoading}
      title={isPlaying ? "Stop speaking" : "Play voice"}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
    </button>
  )
}

// Voice Chat Input Component
interface VoiceChatInputProps {
  onTranscript: (transcript: string) => void
  isRecording: boolean
  isProcessing: boolean
  error: string | null
  onStartRecording: () => void
  onStopRecording: () => void
  onStopStreaming?: () => void
}

function VoiceChatInput({
  onTranscript,
  isRecording,
  isProcessing,
  error,
  onStartRecording,
  onStopRecording,
  onStopStreaming
}: VoiceChatInputProps) {
  const [transcript, setTranscript] = useState("")

  // Use voice chat hook for automatic voice processing
  const {
    startRecording: voiceStartRecording,
    stopRecording: voiceStopRecording,
    isRecording: voiceIsRecording,
    isProcessing: voiceIsProcessing,
    error: voiceError
  } = useVoiceChat({
    onTranscription: (transcribedText: string) => {
      console.log('🎤 Voice transcript received in VoiceChatInput:', transcribedText)
      if (transcribedText.trim()) {
        console.log('📤 Auto-sending voice message in VoiceChatInput:', transcribedText.trim())
        onTranscript(transcribedText.trim())
      }
    },
    onError: (error: string) => {
      console.error('❌ Voice error in VoiceChatInput:', error)
    },
    onStartRecording: () => {
      console.log('🎤 Voice recording started in VoiceChatInput')
    },
    onStopRecording: () => {
      console.log('🛑 Voice recording stopped in VoiceChatInput')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (transcript.trim()) {
      onTranscript(transcript.trim())
      setTranscript("")
    }
  }

  return (
    <div className="space-y-3">
      {/* Voice Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant={voiceIsRecording ? "destructive" : "default"}
          size="lg"
          onClick={voiceIsRecording ? voiceStopRecording : voiceStartRecording}
          disabled={voiceIsProcessing || isProcessing}
          className="w-16 h-16 rounded-full"
        >
          {voiceIsRecording ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        
        {(voiceIsProcessing || isProcessing) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {voiceIsRecording ? "Listening..." : voiceIsProcessing ? "Processing voice..." : "Generating response..."}
          </div>
        )}
      </div>

      {/* Text Input for Manual Entry */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Or type your message here..."
          className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          disabled={isProcessing}
        />
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            disabled={!transcript.trim() || isProcessing}
            className="h-12 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
          {onStopStreaming && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopStreaming}
              className="text-xs"
            >
              Stop
            </Button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {(error || voiceError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error || voiceError}</p>
        </div>
      )}
    </div>
  )
}
