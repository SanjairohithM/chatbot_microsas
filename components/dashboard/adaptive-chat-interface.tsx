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
  Settings
} from "lucide-react"
import { ResponseModelSelector, ResponseModel } from "./response-model-selector"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface AdaptiveChatInterfaceProps {
  botId: number
  conversationId?: number
  userId?: number
  onConversationUpdate?: (conversationId: number) => void
  className?: string
}

export function AdaptiveChatInterface({
  botId,
  conversationId,
  userId,
  onConversationUpdate,
  className
}: AdaptiveChatInterfaceProps) {
  const [responseModel, setResponseModel] = useState<ResponseModel>('chat')
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [bot, setBot] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Voice chat hook for voice model
  const {
    isRecording,
    isProcessing: isVoiceProcessing,
    isSpeaking,
    error: voiceError,
    startRecording,
    stopRecording,
    speak,
    clearError: clearVoiceError
  } = useVoiceChat({
    onTranscription: (text) => {
      setMessage(text)
    },
    onResponse: (text) => {
      // Response is automatically spoken by the hook
    },
    onError: (error) => {
      console.error('Voice chat error:', error)
    },
    autoSend: false, // We'll handle sending manually
    voice: 'alloy',
    model: 'tts-1'
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (messageText: string, imageUrl?: string) => {
    if (!messageText.trim() && !imageUrl) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setMessage("")
    setSelectedImage(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          botId: botId,
          conversationId: conversationId,
          userId: userId,
          imageUrl: imageUrl
        })
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      const result = await response.json()
      
      // Update conversation ID if this is a new conversation
      if (result.conversationId && result.conversationId !== conversationId) {
        onConversationUpdate?.(result.conversationId)
      }

      const assistantMessage: Message = {
        id: `assistant_${result.messageId}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Handle response based on selected model
      if (responseModel === 'voice' && result.message) {
        // For voice model, speak the response
        await speak(result.message)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || selectedImage) && !isLoading) {
      handleSendMessage(message.trim(), selectedImage || undefined)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleVoiceAction = () => {
    if (isRecording) {
      stopRecording()
    } else if (isSpeaking) {
      // Stop speaking
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    } else {
      startRecording()
    }
  }

  const handleSpeakMessage = async (text: string) => {
    if (responseModel === 'voice') {
      await speak(text)
    }
  }

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isVoiceActive = isRecording || isVoiceProcessing || isSpeaking
  const canUseVoice = !isLoading && !isUploading && responseModel === 'voice'

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chat Interface</h2>
            <Badge variant="outline" className="text-xs">
              Bot ID: {botId}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Response Mode:</span>
            <div className="flex items-center gap-2">
              {responseModel === 'voice' ? (
                <Volume2 className="h-4 w-4 text-blue-600" />
              ) : (
                <MessageCircle className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                responseModel === 'voice' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {responseModel === 'voice' ? 'Voice Response' : 'Chat Response'}
              </span>
              <Badge variant="outline" className="text-xs">
                {bot?.name || 'Bot'}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Mode set during bot creation
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {responseModel === 'voice' ? 'Start a voice conversation' : 'Start chatting'}
            </p>
            <p className="text-sm">
              {responseModel === 'voice' 
                ? 'Click the microphone to begin speaking' 
                : 'Type your message below'
              }
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-300 text-gray-600"
              )}>
                {msg.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={cn(
                "flex-1 max-w-[80%]",
                msg.role === 'user' && "text-right"
              )}>
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  msg.role === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                <div className={cn(
                  "flex items-center gap-2 mt-1 text-xs text-gray-500",
                  msg.role === 'user' && "justify-end"
                )}>
                  <span>{msg.timestamp.toLocaleTimeString()}</span>
                  
                  {/* Voice controls for assistant messages */}
                  {msg.role === 'assistant' && responseModel === 'voice' && (
                    <button
                      onClick={() => handleSpeakMessage(msg.content)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Speak message"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status Indicators */}
      {isRecording && (
        <div className="p-3 border-t border-gray-200 bg-red-50">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording... Click to stop</span>
          </div>
        </div>
      )}

      {isVoiceProcessing && (
        <div className="p-3 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">Processing your voice...</span>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="p-3 border-t border-gray-200 bg-green-50">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Speaking response...</span>
          </div>
        </div>
      )}

      {voiceError && (
        <div className="p-3 border-t border-gray-200 bg-red-50">
          <div className="flex items-center justify-between gap-2 text-red-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{voiceError}</span>
            </div>
            <Button
              onClick={clearVoiceError}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        {/* Image Preview */}
        {selectedImage && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="max-w-xs max-h-32 rounded-lg object-cover"
              />
              <Button
                type="button"
                onClick={() => setSelectedImage(null)}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 p-4">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  responseModel === 'voice'
                    ? "Voice mode active - click microphone to speak or type here..."
                    : "Type your message..."
                }
                className={cn(
                  "min-h-[44px] max-h-32 resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20",
                  responseModel === 'voice' && "bg-blue-50 border-blue-200"
                )}
                disabled={isLoading || isUploading || isVoiceProcessing}
                rows={1}
              />
              
              {/* Action buttons */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {/* Voice Button - only show in voice mode */}
                {responseModel === 'voice' && (
                  <Button
                    type="button"
                    onClick={handleVoiceAction}
                    variant={isVoiceActive ? "destructive" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-all duration-200",
                      isRecording && "animate-pulse"
                    )}
                    disabled={!canUseVoice}
                    title={
                      isSpeaking 
                        ? "Click to stop speaking" 
                        : isVoiceProcessing 
                          ? "Processing..." 
                          : isRecording 
                            ? "Click to stop recording" 
                            : "Click to start voice recording"
                    }
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4" />
                    ) : isVoiceProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {/* Send Button */}
                {isLoading ? (
                  <Button type="button" onClick={() => setIsLoading(false)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={(!message.trim() && !selectedImage) || isLoading || isUploading} 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
