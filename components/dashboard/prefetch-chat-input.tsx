import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  X, 
  Loader2,
  Zap,
  Search,
  Volume2,
  VolumeX
} from "lucide-react"
import { usePrefetchChat } from "@/hooks/use-prefetch-chat"
import { useVoiceChat } from "@/hooks/use-voice-chat"

interface PrefetchChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void
  onVoiceMessage?: (audioBlob: Blob) => void
  isRecording?: boolean
  isProcessing?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  botId: number
  userId: string | number
  conversationId?: number
}

export function PrefetchChatInput({
  onSendMessage,
  onVoiceMessage,
  isRecording = false,
  isProcessing = false,
  disabled = false,
  placeholder = "Type your message...",
  className = "",
  botId,
  userId,
  conversationId
}: PrefetchChatInputProps) {
  const [message, setMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    prefetchForQuery,
    isPrefetching,
    prefetchData
  } = usePrefetchChat()

  // Voice chat functionality
  const {
    startRecording,
    stopRecording,
    playBotResponse,
    isRecording: voiceRecording,
    isProcessing: voiceProcessing,
    voiceError,
    lastTranscription
  } = useVoiceChat({
    onTranscription: (transcript: string) => {
      console.log('🎤 Voice transcript received:', transcript)
      console.log('🎤 onSendMessage function:', onSendMessage)
      console.log('🎤 Current message state:', message)
      console.log('🎤 Current imageUrl state:', imageUrl)
      
      if (transcript.trim()) {
        console.log('📤 Auto-sending voice message:', transcript.trim())
        console.log('📤 Calling onSendMessage with:', { message: transcript.trim(), imageUrl: imageUrl || undefined })
        // Auto-send the transcribed text
        onSendMessage(transcript.trim(), imageUrl || undefined)
        setMessage("")
        setImageUrl("")
        console.log('📤 onSendMessage called successfully')
      } else {
        console.log('⚠️ Empty transcript received')
      }
    },
    onError: (error: string) => {
      console.error('❌ Voice error:', error)
    },
    onStartRecording: () => {
      console.log('🎤 Voice recording started')
    },
    onStopRecording: () => {
      console.log('🛑 Voice recording stopped')
    }
  })

  // Check for voice support
  useEffect(() => {
    const checkVoiceSupport = () => {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      const hasSpeechSynthesis = 'speechSynthesis' in window
      const isSupported = hasSpeechRecognition && hasSpeechSynthesis
      console.log('🎤 Voice support check:', { hasSpeechRecognition, hasSpeechSynthesis, isSupported })
      setIsVoiceSupported(isSupported)
    }
    
    checkVoiceSupport()
  }, [])

  // Handle typing with prefetch
  const handleInputChange = (value: string) => {
    setMessage(value)
    setIsTyping(true)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing indicator timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)

    // Prefetch data for the query
    if (value.trim().length >= 3) {
      prefetchForQuery(value.trim(), {
        botId,
        userId,
        conversationId,
        onPrefetchComplete: (data) => {
          console.log('✅ Prefetch completed for:', data.query)
        }
      })
    }
  }

  const handleSend = () => {
    if (!message.trim() || disabled || isProcessing) return

    onSendMessage(message.trim(), imageUrl || undefined)
    setMessage("")
    setImageUrl("")
    setIsTyping(false)
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  // Voice recording handlers
  const handleVoiceStart = () => {
    console.log('🎤 handleVoiceStart called, isVoiceSupported:', isVoiceSupported)
    if (!isVoiceSupported) {
      console.warn('Voice not supported in this browser')
      return
    }
    console.log('🎤 Starting voice recording...')
    startRecording()
  }

  const handleVoiceStop = () => {
    console.log('🛑 handleVoiceStop called')
    stopRecording()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImageUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageUrl("")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Indicators */}
      {(isPrefetching || prefetchData || voiceRecording || voiceProcessing) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {voiceRecording ? (
            <>
              <Mic className="h-4 w-4 text-red-500 animate-pulse" />
              <span>Listening...</span>
            </>
          ) : voiceProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing voice...</span>
            </>
          ) : isPrefetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Preparing response...</span>
            </>
          ) : prefetchData?.isReady ? (
            <>
              <Zap className="h-4 w-4 text-green-600" />
              <span>Response ready!</span>
              <Badge variant="outline" className="text-xs">
                {prefetchData.documentContext.length} chars context
              </Badge>
            </>
          ) : null}
        </div>
      )}

      {/* Voice Error Display */}
      {voiceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{voiceError}</p>
        </div>
      )}

      {/* Debug: Test Voice Transcript (only in development) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <p className="text-yellow-800 mb-2">Debug: Test voice transcript callback</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('🧪 Testing voice transcript callback')
              // Simulate voice transcript
              const testTranscript = "Hello, this is a test message"
              console.log('🧪 Simulating transcript:', testTranscript)
              onSendMessage(testTranscript, undefined)
            }}
            className="text-xs"
          >
            Test Voice Transcript
          </Button>
        </div>
      )} */}

      {/* Image Preview */}
      {imageUrl && (
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <img
              src={imageUrl}
              alt="Upload preview"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Image attached</p>
              <p className="text-xs text-gray-500">
                {Math.round(imageUrl.length / 1024)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeImage}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="min-h-[60px] max-h-[200px] resize-none pr-20"
            rows={1}
          />
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Image Upload */}
          <label htmlFor="image-upload">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-500"
              disabled={disabled || isProcessing}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled || isProcessing}
          />

          {/* Voice Recording */}
          {isVoiceSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🎤 Voice button clicked, voiceRecording:', voiceRecording)
                if (voiceRecording) {
                  handleVoiceStop()
                } else {
                  handleVoiceStart()
                }
              }}
              className={`text-gray-500 hover:text-red-500 ${
                voiceRecording ? "text-red-500" : ""
              }`}
              disabled={disabled || isProcessing || voiceProcessing}
              title={voiceRecording ? "Stop recording" : "Start voice input"}
            >
              {voiceRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled || isProcessing}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Prefetch Data Debug (only in development) */}
      {process.env.NODE_ENV === 'development' && prefetchData && (
        <details className="text-xs text-gray-500">
          <summary>Prefetch Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              query: prefetchData.query,
              contextLength: prefetchData.documentContext.length,
              hasSearchResults: !!prefetchData.searchResults,
              isReady: prefetchData.isReady
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
